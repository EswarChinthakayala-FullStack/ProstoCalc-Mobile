"""
triage_engine.py
─────────────────────────────────────────────────────────────────────────────
ClinicAI — Symptom Triage Agent — Core Logic (Modular Version)

This module provides the core clinical reasoning components used by:
  1. The unified TriageOrchestrator (demo.py / server.py)
  2. The hybrid LLMTriageOrchestrator (llm/triage_engine_llm.py)
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import datetime
import time
import re
import os
import sys
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

# Optional LLM Integration
try:
    from llm_engine import TinyLlamaEngine
except ImportError:
    TinyLlamaEngine = None

# Add data directory to path if needed for medical_kb
# Check if we are in agent_01_triage or root
current_dir = os.path.dirname(os.path.abspath(__file__))
if "agent_01_triage" in current_dir:
    sys.path.insert(0, os.path.join(current_dir, "data"))
else:
    sys.path.insert(0, os.path.join(current_dir, "agent_01_triage", "data"))

try:
    from medical_kb import (
        ICD10_MAP, TRIAGE_RULES, DRUG_INTERACTIONS, 
        COMORBIDITY_ESCALATORS, SEVERITY_TIER_THRESHOLDS,
        AGE_RISK_ZONES, GUIDELINE_RAG, TIER_LABELS,
        TIER_WAIT_TIMES, TIER_COLORS
    )
except ImportError:
    # Minimal fallback
    ICD10_MAP = {}
    TRIAGE_RULES = []
    DRUG_INTERACTIONS = {}
    COMORBIDITY_ESCALATORS = {}
    SEVERITY_TIER_THRESHOLDS = {"emergency_floor": 9, "urgent_floor": 7}
    AGE_RISK_ZONES = []
    GUIDELINE_RAG = {}
    TIER_LABELS = {1: "EMERGENCY", 2: "URGENT", 3: "ROUTINE", 4: "SELF-CARE"}
    TIER_WAIT_TIMES = {1: "Immediate", 2: "2-4 hrs", 3: "1-3 days", 4: "Self-manage"}
    TIER_COLORS = {1: "RED", 2: "ORANGE", 3: "BLUE", 4: "GREEN"}

@dataclass
class PatientInput:
    patient_id: str
    symptom_text: str
    severity: int
    duration_days: int
    age: int
    sex: str
    conditions: List[str] = field(default_factory=list)
    medications: List[str] = field(default_factory=list)
    language: str = "en"

    def validate(self):
        errors = []
        if not self.symptom_text.strip():
            errors.append("Symptom text cannot be empty")
        if not (1 <= self.severity <= 10):
            errors.append("Severity must be between 1 and 10")
        if self.age < 0 or self.age > 130:
            errors.append("Invalid age")
        return errors

@dataclass
class MatchedRule:
    rule_id: str
    rule_name: str
    tier: int
    reasoning: str
    action: str
    score: float = 1.0

@dataclass
class ICD10Hint:
    code: str
    description: str
    symptom: str

@dataclass
class DrugAlert:
    drug_a: str
    drug_b: str
    severity: str
    description: str

@dataclass
class ComorbidityEscalation:
    condition: str
    triggered_by: List[str]

@dataclass
class AgeRiskAssessment:
    label: str
    age: int
    escalate: bool
    reason: str

@dataclass
class GuidelineEvidence:
    topic: str
    guideline: str

@dataclass
class TriageResult:
    triage_id: str
    urgency_tier: int
    urgency_label: str
    confidence: float
    triage_summary: str
    wait_time: str
    recommended_action: str
    reasoning_steps: List[str]
    icd10_hints: List[ICD10Hint]
    drug_alerts: List[DrugAlert]
    comorbidity_escalations: List[ComorbidityEscalation]
    age_risk: AgeRiskAssessment
    guideline_evidence: List[GuidelineEvidence]
    requires_ambulance: bool = False
    requires_immediate_doctor: bool = False
    requires_mental_health_support: bool = False
    timestamp: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    event_payload: Dict[str, Any] = field(default_factory=dict)

def result_to_dict(result: TriageResult) -> dict:
    """Helper for JSON serialisation."""
    return asdict(result)

class SymptomNormaliser:
    def __init__(self):
        self.abbreviations = {
            r"\bsob\b": "shortness of breath",
            r"\bcp\b": "chest pain",
            r"\bmi\b": "heart attack",
            r"\bpe\b": "pulmonary embolism",
            r"\bafib\b": "atrial fibrillation",
            r"\buti\b": "urinary tract infection",
            r"\bface\b": "facial",
            r"\bdrooping\b": "facial drooping",
            r"\bslur\b": "slurred",
            r"\bleft side\b": "one side",
            r"\bright side\b": "one side",
        }

    def normalise(self, text: str) -> tuple[str, list[str]]:
        text = text.lower()
        for pattern, replacement in self.abbreviations.items():
            text = re.sub(pattern, replacement, text)
        tokens = re.findall(r'\b\w+\b', text)
        return text, tokens

    def extract_severity_hint(self, text: str) -> Optional[int]:
        if "severe" in text or "crushing" in text or "unbearable" in text:
            return 9
        if "mild" in text or "slight" in text:
            return 2
        return None

class RuleEngine:
    def match(self, tokens: list[str], text: str, severity: int, age: int) -> list[MatchedRule]:
        matches = []
        for rule in TRIAGE_RULES:
            primary_match = any(kw in text for kw in rule["keywords"])
            if primary_match:
                co_match = True
                if rule.get("co_keywords"):
                    co_match = any(ck in text for ck in rule["co_keywords"])
                    if not co_match:
                        # Allow match if multiple primary keywords exist
                        p_matches = [kw for kw in rule["keywords"] if kw in text]
                        if len(p_matches) >= 2:
                            co_match = True
                
                sev_match = True
                if "min_severity" in rule:
                    sev_match = severity >= rule["min_severity"]
                
                age_match = True
                if "age_min" in rule:
                    age_match = age >= rule["age_min"]
                if "age_max" in rule:
                    age_match = age <= rule["age_max"]

                if co_match and sev_match and age_match:
                    matches.append(MatchedRule(
                        rule_id=rule["id"],
                        rule_name=rule["name"],
                        tier=rule["tier"],
                        reasoning=rule["reasoning"],
                        action=rule["action"]
                    ))
        
        # Sort by tier (lowest is most urgent)
        matches.sort(key=lambda x: x.tier)
        return matches

class ICD10Resolver:
    def resolve(self, tokens: list[str], text: str) -> list[ICD10Hint]:
        hints = []
        for symptom, data in ICD10_MAP.items():
            if symptom in text:
                hints.append(ICD10Hint(data[0], data[1], symptom))
        return hints

class DrugInteractionChecker:
    def check(self, medications: list[str]) -> list[DrugAlert]:
        alerts = []
        meds = [m.lower() for m in medications]
        for (da, db), (sev, desc) in DRUG_INTERACTIONS.items():
            if da in meds and db in meds:
                alerts.append(DrugAlert(da, db, sev, desc))
        return alerts

class ComorbidityAnalyser:
    def analyse(self, conditions: list[str], text: str, tokens: list[str]) -> list[ComorbidityEscalation]:
        escalations = []
        for condition in conditions:
            if condition in COMORBIDITY_ESCALATORS:
                triggers = COMORBIDITY_ESCALATORS[condition]
                active = [t for t in triggers if t in text]
                if active:
                    escalations.append(ComorbidityEscalation(condition, active))
        return escalations

class AgeRiskModifier:
    def assess(self, age: int) -> AgeRiskAssessment:
        for zone in AGE_RISK_ZONES:
            if zone["min"] <= age < zone["max"]:
                return AgeRiskAssessment(zone["label"], age, zone["escalate"], zone["reason"])
        return AgeRiskAssessment("Adult", age, False, "Standard risk profile.")

class GuidelineRAG:
    def retrieve(self, text: str, tokens: list[str]) -> list[GuidelineEvidence]:
        evidence = []
        for kw, guideline in GUIDELINE_RAG.items():
            if kw in text:
                evidence.append(GuidelineEvidence(kw, guideline))
        return evidence

class TriageOrchestrator:
    def __init__(self, use_llm=True):
        self.normaliser = SymptomNormaliser()
        self.rule_engine = RuleEngine()
        self.icd10 = ICD10Resolver()
        self.drug_checker = DrugInteractionChecker()
        self.comorbidity = ComorbidityAnalyser()
        self.age_risk = AgeRiskModifier()
        self.rag = GuidelineRAG()
        
        self.llm = None
        if use_llm and TinyLlamaEngine:
            self.llm = TinyLlamaEngine()

    def triage(self, patient: PatientInput) -> TriageResult:
        reasoning = []
        norm_text, tokens = self.normaliser.normalise(patient.symptom_text)
        
        # 1. Rules
        matched_rules = self.rule_engine.match(tokens, norm_text, patient.severity, patient.age)
        current_tier = matched_rules[0].tier if matched_rules else 4
        matched_rule = matched_rules[0] if matched_rules else None
        
        if matched_rule:
            reasoning.append(f"Matched rule: {matched_rule.rule_name} - {matched_rule.reasoning}")
        else:
            reasoning.append("No specific red-flag rule matched.")

        # 2. Comorbidities
        comorb_esc = self.comorbidity.analyse(patient.conditions, norm_text, tokens)
        if comorb_esc and current_tier > 1:
            current_tier -= 1
            reasoning.append(f"Escalated due to comorbidity: {comorb_esc[0].condition}")

        # 3. Drugs
        drug_alerts = self.drug_checker.check(patient.medications)
        for alert in drug_alerts:
            if alert.severity in ("HIGH", "CRITICAL") and current_tier > 2:
                current_tier = 2
                reasoning.append(f"Escalated to URGENT due to {alert.severity} drug interaction")

        # 4. Age
        age_assessment = self.age_risk.assess(patient.age)
        if age_assessment.escalate and current_tier > 1:
            current_tier -= 1
            reasoning.append(f"Escalated due to age: {age_assessment.label}")

        # 5. Severity thresholds
        if patient.severity >= SEVERITY_TIER_THRESHOLDS["emergency_floor"] and current_tier > 2:
            current_tier = 2
            reasoning.append("Escalated to URGENT due to extreme severity")
        elif patient.severity >= SEVERITY_TIER_THRESHOLDS["urgent_floor"] and current_tier > 3:
            current_tier = 3
            reasoning.append("Escalated to ROUTINE due to high severity")

        # 6. Duration
        if patient.duration_days > 7 and current_tier >= 3:
            current_tier = 2
            reasoning.append("Escalated to URGENT due to duration > 7 days")

        current_tier = max(1, min(4, current_tier))

        # Metadata
        icd10_hints = self.icd10.resolve(tokens, norm_text)
        guidelines = self.rag.retrieve(norm_text, tokens)
        
        # Result construct
        res = TriageResult(
            triage_id=str(uuid.uuid4()),
            urgency_tier=current_tier,
            urgency_label=TIER_LABELS[current_tier],
            confidence=0.9 if matched_rule else 0.6,
            triage_summary=matched_rule.reasoning if matched_rule else "General clinical evaluation.",
            wait_time=TIER_WAIT_TIMES[current_tier],
            recommended_action=matched_rule.action if matched_rule else "Standard GP consultation.",
            reasoning_steps=reasoning,
            icd10_hints=icd10_hints,
            drug_alerts=drug_alerts,
            comorbidity_escalations=comorb_esc,
            age_risk=age_assessment,
            guideline_evidence=guidelines
        )

        if current_tier == 1:
            res.requires_ambulance = True
            res.requires_immediate_doctor = True
        
        priority_score = (5 - current_tier) * 20 + (patient.severity * 2)
        res.event_payload = {
            "triage_id": res.triage_id,
            "urgency_tier": current_tier,
            "priority_score": min(100, priority_score),
            "alert_required": current_tier == 1,
            "timestamp": res.timestamp
        }

        # 10. Optional LLM Refinement
        if self.llm:
            try:
                llm_summary = self.llm.generate_reasoning(
                    patient.symptom_text, 
                    res.urgency_label,
                    res.icd10_hints,
                    patient.severity,
                    patient.age
                )
                res.triage_summary = llm_summary
                res.reasoning_steps.append("Summary refined by TinyLlama LLM.")
            except Exception as e:
                res.reasoning_steps.append(f"LLM refinement failed: {str(e)}")

        return res
