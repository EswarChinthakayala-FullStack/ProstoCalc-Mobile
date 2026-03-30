"""
triage_engine_llm.py
─────────────────────────────────────────────────────────────────────────────
ClinicAI — Symptom Triage Agent — LLM-Powered Engine

Replaces the pure rule engine with a hybrid:
  • TinyLlama 1.1B handles:
      - Urgency classification (LLM softmax over 4 classes)
      - Clinical reasoning narrative generation
      - Confidence scoring from attention representations

  • Rule engine is retained as:
      - Safety guardrail (hard overrides for known emergency patterns)
      - ICD-10 resolution (faster than LLM for structured lookups)
      - Drug interaction checking (deterministic — cannot hallucinate)
      - Fallback if LLM output is inconsistent

Decision fusion:
  1. Run TinyLlama classification → LLM tier + confidence
  2. Run rule engine → Rule tier
  3. Fuse: if rule tier < LLM tier (more urgent) → use rule tier (safety)
           if LLM confidence > 0.80 → trust LLM
           otherwise → weighted blend leaning toward rule engine
─────────────────────────────────────────────────────────────────────────────
"""

import re
import sys
import os
import json
import datetime
import uuid
import time
from dataclasses import dataclass, field, asdict
from typing import Optional

# Add root and agent directory to path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "agent_01_triage"))

try:
    from agent_01_triage.data.medical_kb import (
        ICD10_MAP, TRIAGE_RULES, DRUG_INTERACTIONS, COMORBIDITY_ESCALATORS,
        AGE_RISK_ZONES, GUIDELINE_RAG, TIER_LABELS, TIER_COLORS,
        TIER_WAIT_TIMES, SEVERITY_TIER_THRESHOLDS
    )
except ImportError:
    from data.medical_kb import (
        ICD10_MAP, TRIAGE_RULES, DRUG_INTERACTIONS, COMORBIDITY_ESCALATORS,
        AGE_RISK_ZONES, GUIDELINE_RAG, TIER_LABELS, TIER_COLORS,
        TIER_WAIT_TIMES, SEVERITY_TIER_THRESHOLDS
    )
from triage_engine import (
    PatientInput, MatchedRule, ICD10Hint, DrugAlert,
    ComorbidityEscalation, AgeRiskAssessment, GuidelineEvidence,
    SymptomNormaliser, RuleEngine, ICD10Resolver,
    DrugInteractionChecker, ComorbidityAnalyser, AgeRiskModifier,
    GuidelineRAG, result_to_dict
)
# from tinyllama_engine import TinyLlama, TinyLlamaConfig
from llm_engine import TinyLlamaEngine as TinyLlama


# ─────────────────────────────────────────────────────────────────────────────
# Extended TriageResult with LLM fields
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class LLMTriageResult:
    """Full triage result including LLM reasoning."""
    triage_id:      str
    patient_id:     str
    timestamp:      str

    # Core outputs
    urgency_tier:   int
    urgency_label:  str
    urgency_color:  str
    wait_time:      str
    confidence:     float

    # LLM outputs
    llm_tier:            int
    llm_label:           str
    llm_confidence:      float
    llm_probabilities:   dict
    llm_reasoning:       str
    llm_attention_signal: str
    llm_inference_ms:    float

    # Rule engine outputs (safety layer)
    rule_tier:      int
    rule_label:     str

    # Decision fusion
    fusion_method:  str   # "llm_dominant" | "rule_dominant" | "emergency_override" | "blend"

    # Shared fields
    triage_summary:      str
    reasoning_steps:     list
    recommended_action:  str

    matched_rules:           list
    icd10_hints:             list
    drug_alerts:             list
    comorbidity_escalations: list
    age_risk:                AgeRiskAssessment
    guideline_evidence:      list

    requires_ambulance:              bool
    requires_immediate_doctor:       bool
    requires_mental_health_support:  bool

    event_type:    str
    event_payload: dict


# ─────────────────────────────────────────────────────────────────────────────
# LLM Triage Orchestrator
# ─────────────────────────────────────────────────────────────────────────────

class LLMTriageOrchestrator:
    """
    Hybrid triage orchestrator using TinyLlama + rule engine.

    Initialises TinyLlama once and reuses across all triage requests.
    """

    def __init__(self, fast_mode: bool = True):
        print("\n  ╔══════════════════════════════════════════════╗")
        print(  "  ║   ClinicAI — TinyLlama Triage Agent          ║")
        print(  "  ║   Loading model architecture…                ║")
        print(  "  ╚══════════════════════════════════════════════╝")

        t0 = time.time()

        # LLM
        self.llm = TinyLlama(fast_mode=fast_mode)

        # Rule-based modules (safety layer + structured lookups)
        self.normaliser   = SymptomNormaliser()
        self.rule_engine  = RuleEngine()
        self.icd10        = ICD10Resolver()
        self.drug_checker = DrugInteractionChecker()
        self.comorbidity  = ComorbidityAnalyser()
        self.age_mod      = AgeRiskModifier()
        self.rag          = GuidelineRAG()

        elapsed = time.time() - t0
        print(f"  [TinyLlama] Model ready in {elapsed:.2f}s\n")

    def triage(self, patient: PatientInput) -> LLMTriageResult:
        triage_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"

        errors = patient.validate()
        if errors:
            raise ValueError(f"Invalid input: {'; '.join(errors)}")

        # ── Step 1: Normalise ──────────────────────────────────────────────
        norm_text, tokens = self.normaliser.normalise(patient.symptom_text)
        lang_severity = self.normaliser.extract_severity_hint(patient.symptom_text)
        effective_sev = min(10, max(patient.severity, lang_severity or 0))

        # ── Step 2: LLM Classification ────────────────────────────────────
        t_llm = time.time()
        llm_result = self.llm.classify_urgency(
            symptom_text=patient.symptom_text,
            severity=effective_sev,
            age=patient.age,
            conditions=patient.conditions,
            medications=patient.medications,
        )
        llm_ms = round((time.time() - t_llm) * 1000, 1)

        llm_tier  = llm_result["urgency_tier"]
        llm_label = llm_result["urgency_label"]
        llm_conf  = llm_result["confidence"]

        # ── Step 3: Rule Engine (safety layer) ────────────────────────────
        matched_rules = self.rule_engine.match(tokens, norm_text, effective_sev, patient.age)
        rule_tier = matched_rules[0].tier if matched_rules else 4
        rule_label = TIER_LABELS[rule_tier]

        # ── Step 4: Decision Fusion ────────────────────────────────────────
        final_tier, fusion_method = self._fuse(
            llm_tier, llm_conf, rule_tier, effective_sev, matched_rules
        )

        # ── Step 5: Apply escalations ─────────────────────────────────────
        reasoning_steps = []

        # Record LLM decision
        reasoning_steps.append(
            f"TinyLlama classification: {llm_label} "
            f"(confidence={llm_conf:.1%}, "
            f"P={llm_result['probabilities']})"
        )
        reasoning_steps.append(
            f"Rule engine classification: {rule_label} "
            f"(matched {len(matched_rules)} rule(s))"
        )
        reasoning_steps.append(
            f"Fusion method: {fusion_method} → final tier: {TIER_LABELS[final_tier]}"
        )

        # Comorbidity escalation
        comorbidities = self.comorbidity.analyse(patient.conditions, norm_text, tokens)
        if comorbidities and final_tier > 1:
            final_tier = max(1, final_tier - 1)
            reasoning_steps.append(
                f"Comorbidity escalation: {[c.condition for c in comorbidities]} → "
                f"tier escalated to {TIER_LABELS[final_tier]}"
            )

        # Age escalation
        age_risk = self.age_mod.assess(patient.age)
        if age_risk.escalate and final_tier > 1:
            final_tier = max(1, final_tier - 1)
            reasoning_steps.append(
                f"Age risk ({age_risk.label}, {patient.age}y): {age_risk.reason}"
            )

        # Duration escalation
        if patient.duration_days > 7 and final_tier == 3:
            final_tier = 2
            reasoning_steps.append(
                f"Duration {patient.duration_days}d > 7 → escalated to URGENT"
            )

        # Drug alerts — CRITICAL interaction forces URGENT minimum
        drug_alerts = self.drug_checker.check(patient.medications)
        critical_drugs = [d for d in drug_alerts if d.severity == "CRITICAL"]
        if critical_drugs and final_tier > 2:
            final_tier = 2
            reasoning_steps.append(
                f"CRITICAL drug interaction ({critical_drugs[0].drug_a} + "
                f"{critical_drugs[0].drug_b}) → minimum URGENT"
            )

        # Clamp
        final_tier = max(1, min(4, final_tier))

        # ── Step 6: LLM Reasoning narrative ───────────────────────────────
        icd10_hints = self.icd10.resolve(tokens, norm_text)
        guidelines  = self.rag.retrieve(norm_text, tokens)

        llm_reasoning = self.llm.generate_reasoning(
            symptom_text=patient.symptom_text,
            urgency_label=TIER_LABELS[final_tier],
            icd10_hints=icd10_hints,
            severity=effective_sev,
            age=patient.age,
        )

        # ── Step 7: Build triage summary ──────────────────────────────────
        rule_summary = (
            f"Primary rule: '{matched_rules[0].rule_name}'. "
            if matched_rules else "No critical rule matched. "
        )
        icd_txt = (
            f"ICD-10: {icd10_hints[0].code} ({icd10_hints[0].description}). "
            if icd10_hints else ""
        )
        triage_summary = (
            f"[TinyLlama] Patient ({patient.age}y, {patient.sex}) — "
            f"'{patient.symptom_text[:100]}'. "
            f"Severity: {effective_sev}/10, Duration: {patient.duration_days}d. "
            f"{rule_summary}{icd_txt}"
            f"Final: {TIER_LABELS[final_tier]}."
        )

        # ── Step 8: Recommended action ────────────────────────────────────
        recommended_action = (
            matched_rules[0].action if matched_rules
            else "Monitor symptoms. Seek GP advice if no improvement in 5 days."
        )
        if drug_alerts:
            alert_txt = "; ".join(
                f"[{a.severity}] {a.drug_a}+{a.drug_b}: {a.description}"
                for a in drug_alerts[:2]
            )
            recommended_action += f" ⚠ Drug alert: {alert_txt}"

        # ── Step 9: Escalation flags ──────────────────────────────────────
        requires_ambulance         = final_tier == 1
        requires_immediate_doctor  = final_tier <= 2
        requires_mental_health     = any(
            "suicidal" in r.rule_id or "mental" in r.rule_name.lower()
            for r in matched_rules
        )

        # ── Step 10: Priority score ───────────────────────────────────────
        priority_score = self._priority_score(
            final_tier, effective_sev, patient.age, patient.duration_days, llm_conf
        )

        # ── Step 11: Event payload ────────────────────────────────────────
        event_payload = {
            "triage_id":     triage_id,
            "patient_id":    patient.patient_id,
            "urgency_tier":  final_tier,
            "urgency_label": TIER_LABELS[final_tier],
            "severity_score": effective_sev,
            "duration_days":  patient.duration_days,
            "requires_ambulance": requires_ambulance,
            "icd10_primary":  icd10_hints[0].code if icd10_hints else None,
            "drug_alerts_count": len(drug_alerts),
            "critical_drug_alerts": len(critical_drugs),
            "timestamp":     timestamp,
            "priority_score": priority_score,
            "llm_tier":      llm_tier,
            "llm_confidence": llm_conf,
            "fusion_method": fusion_method,
            "log_entry": {
                "event": "triage_completed",
                "tier": final_tier,
                "llm_used": True,
                "summary": triage_summary[:200],
            },
            "alert_required": final_tier == 1,
            "alert_type":     "EMERGENCY_TRIAGE" if final_tier == 1 else None,
        }

        # ── Step 12: Confidence (blend LLM + rule consistency) ────────────
        rule_llm_agree = (1 if rule_tier == llm_tier else 0)
        final_confidence = (
            0.6 * llm_conf +
            0.3 * (matched_rules[0].score if matched_rules else 0.3) +
            0.1 * rule_llm_agree
        )

        return LLMTriageResult(
            triage_id=triage_id,
            patient_id=patient.patient_id,
            timestamp=timestamp,
            urgency_tier=final_tier,
            urgency_label=TIER_LABELS[final_tier],
            urgency_color=TIER_COLORS[final_tier],
            wait_time=TIER_WAIT_TIMES[final_tier],
            confidence=round(final_confidence, 3),
            llm_tier=llm_tier,
            llm_label=llm_label,
            llm_confidence=round(llm_conf, 3),
            llm_probabilities=llm_result["probabilities"],
            llm_reasoning=llm_reasoning,
            llm_attention_signal=llm_result.get("llm_reasoning_basis", ""),
            llm_inference_ms=llm_ms,
            rule_tier=rule_tier,
            rule_label=rule_label,
            fusion_method=fusion_method,
            triage_summary=triage_summary,
            reasoning_steps=reasoning_steps,
            recommended_action=recommended_action,
            matched_rules=matched_rules,
            icd10_hints=icd10_hints,
            drug_alerts=drug_alerts,
            comorbidity_escalations=comorbidities,
            age_risk=age_risk,
            guideline_evidence=guidelines,
            requires_ambulance=requires_ambulance,
            requires_immediate_doctor=requires_immediate_doctor,
            requires_mental_health_support=requires_mental_health,
            event_type="triage_result",
            event_payload=event_payload,
        )

    def _fuse(
        self,
        llm_tier: int,
        llm_conf: float,
        rule_tier: int,
        severity: int,
        matched_rules: list,
    ) -> tuple[int, str]:
        """
        Fuse LLM and rule engine outputs.

        Safety contract:
          - Rule engine EMERGENCY always wins (never override downward)
          - High-confidence LLM classification trusted if rules agree within 1 tier
          - Otherwise: take more urgent of the two
        """
        # Rule engine says Emergency → always honour (safety)
        if rule_tier == 1:
            return 1, "emergency_override"

        # Both agree exactly
        if llm_tier == rule_tier:
            return llm_tier, "llm_rule_consensus"

        # LLM highly confident
        if llm_conf >= 0.80:
            # Only trust LLM if it's not too far from rule (max 1 tier)
            if abs(llm_tier - rule_tier) <= 1:
                return llm_tier, "llm_dominant"
            else:
                # Large disagreement — take more urgent
                return min(llm_tier, rule_tier), "safety_blend"

        # LLM moderate confidence — take more urgent
        if llm_conf >= 0.55:
            return min(llm_tier, rule_tier), "blend"

        # Low LLM confidence — trust rules
        return rule_tier, "rule_dominant"

    def _priority_score(
        self, tier: int, severity: int, age: int, duration: int, llm_conf: float
    ) -> float:
        tier_w     = (5 - tier) * 20
        sev_w      = severity * 1.5
        age_w      = 5 if age < 5 or age > 65 else 0
        dur_w      = min(10, duration * 0.5)
        conf_bonus = llm_conf * 3
        return round(min(100, tier_w + sev_w + age_w + dur_w + conf_bonus), 1)


def result_to_dict_llm(result: LLMTriageResult) -> dict:
    """Serialise LLMTriageResult to JSON-safe dict."""
    def _s(obj):
        if hasattr(obj, "__dataclass_fields__"):
            return {k: _s(v) for k, v in asdict(obj).items()}
        elif isinstance(obj, list):
            return [_s(i) for i in obj]
        elif isinstance(obj, dict):
            return {k: _s(v) for k, v in obj.items()}
        return obj
    return _s(result)