"""
demo_llm.py
─────────────────────────────────────────────────────────────────────────────
ClinicAI — TinyLlama-Powered Symptom Triage Agent — Demo

Shows TinyLlama 1.1B architecture running triage with:
  • LLM urgency classification (4-class softmax)
  • LLM confidence scores per class
  • LLM-generated clinical reasoning narrative
  • Rule engine safety layer
  • Decision fusion method
  • Attention signal analysis

Run:  python demo_llm.py
      python demo_llm.py --interactive
      python demo_llm.py --full-model   (all 22 layers — slower, more RAM)
─────────────────────────────────────────────────────────────────────────────
"""

import sys, os, time, argparse
sys.path.insert(0, os.path.dirname(__file__))

from triage_engine import PatientInput
from triage_engine_llm import LLMTriageOrchestrator, result_to_dict_llm

# ─────────────────────────────────────────────────────────────────────────────
TIER_BANNERS = {
    1: "🚨  EMERGENCY — Call emergency services NOW",
    2: "⚠️   URGENT — See a doctor within 2–4 hours",
    3: "🔵  ROUTINE — Book a GP appointment (1–3 days)",
    4: "✅  SELF-CARE — Manage at home",
}
FUSION_DESC = {
    "llm_rule_consensus": "LLM + Rules agreed",
    "llm_dominant":       "LLM (high confidence)",
    "rule_dominant":      "Rule engine (LLM uncertain)",
    "emergency_override": "Emergency override (rule safety layer)",
    "safety_blend":       "Safety blend (large disagreement → more urgent)",
    "blend":              "Weighted blend",
}

SCENARIOS = [
    {
        "title": "Cardiac Emergency — 55M diabetic",
        "input": PatientInput(
            patient_id="DEMO-001",
            symptom_text="I have severe chest pain radiating to my left arm and jaw, sweating, nausea",
            severity=9, duration_days=1, age=55, sex="M",
            conditions=["diabetes", "hypertension"],
            medications=["metformin", "aspirin", "warfarin"],
        ),
    },
    {
        "title": "Stroke Symptoms — 68F elderly",
        "input": PatientInput(
            patient_id="DEMO-002",
            symptom_text="sudden facial drooping on the right side, arm weakness, slurred speech, started 30 min ago",
            severity=9, duration_days=1, age=68, sex="F",
            conditions=["hypertension", "heart disease"],
            medications=["beta blocker", "aspirin"],
        ),
    },
    {
        "title": "Paediatric High Fever — 3M toddler",
        "input": PatientInput(
            patient_id="DEMO-003",
            symptom_text="my baby has a very high fever with rigors and chills, not eating, lethargic",
            severity=7, duration_days=1, age=3, sex="M",
            conditions=[], medications=[],
        ),
    },
    {
        "title": "Urgent Dyspnoea — 50F",
        "input": PatientInput(
            patient_id="DEMO-004",
            symptom_text="shortness of breath and difficulty breathing especially when walking",
            severity=6, duration_days=2, age=50, sex="F",
            conditions=["copd"], medications=["salbutamol"],
        ),
    },
    {
        "title": "Critical Drug Interaction — 65M",
        "input": PatientInput(
            patient_id="DEMO-005",
            symptom_text="I have chest tightness and dizziness",
            severity=5, duration_days=1, age=65, sex="M",
            conditions=["heart disease"],
            medications=["sildenafil", "nitrates", "beta blocker", "verapamil"],
        ),
    },
    {
        "title": "Routine Back Pain — 38F",
        "input": PatientInput(
            patient_id="DEMO-006",
            symptom_text="lower back pain after lifting at work, aching and stiff",
            severity=4, duration_days=2, age=38, sex="F",
            conditions=[], medications=["ibuprofen"],
        ),
    },
    {
        "title": "Self-Care Common Cold — 25F",
        "input": PatientInput(
            patient_id="DEMO-007",
            symptom_text="runny nose, sneezing, mild sore throat, feeling a bit tired",
            severity=2, duration_days=2, age=25, sex="F",
            conditions=[], medications=[],
        ),
    },
]


def sep(char="─", w=70): print(char * w)

def prob_bar(prob: float, width: int = 20) -> str:
    filled = int(prob * width)
    return "█" * filled + "░" * (width - filled)

def render(result, title: str):
    sep("═", 70)
    print(f"  {title}")
    sep("═", 70)

    print(f"\n  {TIER_BANNERS[result.urgency_tier]}")
    print(f"  Overall Confidence: {result.confidence:.1%}  |  "
          f"Inference: {result.llm_inference_ms:.0f}ms")

    # LLM probability breakdown
    sep()
    print("  🤖  TINYLLAMA CLASSIFICATION")
    sep()
    print(f"  Model decision: {result.llm_label}  (confidence: {result.llm_conf:.1%})")
    print(f"  Rule engine:    {result.rule_label}")
    print(f"  Fusion:         {FUSION_DESC.get(result.fusion_method, result.fusion_method)}\n")
    print("  Class probabilities:")
    for label, prob in result.llm_probabilities.items():
        bar   = prob_bar(prob)
        arrow = " ◄ chosen" if label == result.llm_label else ""
        print(f"    {label:<12} {bar}  {prob:.1%}{arrow}")

    # LLM reasoning
    sep()
    print("  🧠  LLM CLINICAL REASONING (TinyLlama generated)")
    sep()
    print(f"  {result.llm_reasoning}")
    if result.llm_attention_signal:
        print(f"\n  Attention signal: {result.llm_attention_signal}")

    # Triage summary
    sep()
    print("  📋  TRIAGE SUMMARY")
    sep()
    print(f"  {result.triage_summary}")
    print(f"\n  ⏱  {result.wait_time}")

    # Reasoning chain
    sep()
    print("  🔗  DECISION CHAIN")
    sep()
    for i, step in enumerate(result.reasoning_steps, 1):
        print(f"  {i}. {step}")

    # Recommended action
    sep()
    print("  ✅  RECOMMENDED ACTION")
    sep()
    for line in result.recommended_action.split(". "):
        if line.strip():
            print(f"  • {line.strip()}.")

    # ICD-10
    if result.icd10_hints:
        sep()
        print("  🏷   ICD-10 HINTS")
        sep()
        for h in result.icd10_hints[:3]:
            print(f"  • {h.code}  {h.description}")

    # Drug alerts
    if result.drug_alerts:
        sep()
        print("  💊  DRUG INTERACTION ALERTS")
        sep()
        for a in result.drug_alerts:
            icon = {"CRITICAL": "🔴", "HIGH": "🟠", "MODERATE": "🟡"}.get(a.severity, "⚪")
            print(f"  {icon} [{a.severity}] {a.drug_a} + {a.drug_b}")
            print(f"       {a.description}")

    # Comorbidities
    if result.comorbidity_escalations:
        sep()
        print("  🔺  COMORBIDITY ESCALATIONS")
        sep()
        for c in result.comorbidity_escalations:
            print(f"  • {c.condition} → {', '.join(c.triggered_by)}")

    # Age risk
    if result.age_risk.escalate:
        sep()
        print(f"  👤  AGE RISK: {result.age_risk.label} ({result.age_risk.age}y)")
        print(f"  {result.age_risk.reason}")

    # Event payload
    sep()
    print("  📡  DOWNSTREAM EVENTS")
    sep()
    ep = result.event_payload
    print(f"  → Orchestrator : triage_result [{ep['urgency_label']}]")
    print(f"  → Appointment  : priority_score={ep['priority_score']}/100  "
          f"fusion={ep['fusion_method']}")
    print(f"  → EHR Agent    : logged  llm_used=True  "
          f"llm_conf={ep['llm_confidence']:.2f}")
    if ep["alert_required"]:
        print(f"  → Alert Agent  : ⚡ EMERGENCY ALERT TRIGGERED")
    print()


def interactive_mode(orchestrator: LLMTriageOrchestrator):
    print("\n" + "═" * 70)
    print("  🏥  TinyLlama Triage — Interactive Mode")
    print("═" * 70)
    while True:
        try:
            symptom_text = input("\n  Symptoms: ").strip()
            if not symptom_text:
                continue
            severity     = int(input("  Severity (1–10): ").strip() or "5")
            age          = int(input("  Age: ").strip() or "35")
            sex          = input("  Sex (M/F): ").strip() or "M"
            duration     = int(input("  Duration (days): ").strip() or "1")
            cond_str     = input("  Conditions (comma-separated): ").strip()
            meds_str     = input("  Medications (comma-separated): ").strip()

            conditions  = [c.strip().lower() for c in cond_str.split(",") if c.strip()]
            medications = [m.strip().lower() for m in meds_str.split(",") if m.strip()]

            patient = PatientInput(
                patient_id=f"INTERACTIVE-{int(time.time())}",
                symptom_text=symptom_text, severity=severity,
                duration_days=duration, age=age, sex=sex,
                conditions=conditions, medications=medications,
            )
            print("\n  Running TinyLlama triage…")
            result = orchestrator.triage(patient)
            render(result, "Interactive Triage")

        except KeyboardInterrupt:
            print("\n\n  Goodbye.\n")
            break
        except ValueError as e:
            print(f"\n  ⚠ {e}\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--interactive", "-i", action="store_true")
    parser.add_argument("--full-model",        action="store_true",
                        help="Use all 22 transformer layers (slower, needs ~4GB RAM)")
    args = parser.parse_args()

    fast_mode = not args.full_model
    orchestrator = LLMTriageOrchestrator(fast_mode=fast_mode)

    if args.interactive:
        interactive_mode(orchestrator)
        return

    print("\n" + "═" * 70)
    print("  🏥  ClinicAI — TinyLlama Triage Agent — Demo")
    mode_str = "Fast (4 layers)" if fast_mode else "Full (22 layers)"
    print(f"  Model mode: {mode_str} | Running {len(SCENARIOS)} scenarios")
    print("═" * 70)

    total_ms = 0
    for scenario in SCENARIOS:
        t0     = time.time()
        result = orchestrator.triage(scenario["input"])
        elapsed = round((time.time() - t0) * 1000, 1)
        total_ms += elapsed

        # Monkey-patch timing into result for display
        result.llm_conf = result.llm_confidence

        render(result, f"{scenario['title']}  [{elapsed:.0f}ms]")
        time.sleep(0.05)

    print(f"  ✓ All {len(SCENARIOS)} scenarios complete — total {total_ms:.0f}ms")
    print(f"  Avg per patient: {total_ms/len(SCENARIOS):.0f}ms")
    print(f"\n  Run with --interactive to enter your own symptoms.")
    print(f"  Run with --full-model for all 22 TinyLlama layers.\n")


if __name__ == "__main__":
    main()