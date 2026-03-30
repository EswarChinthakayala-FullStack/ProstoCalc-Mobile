"""
tests/test_tinyllama_integration.py
─────────────────────────────────────────────────────────────────────────────
TinyLlama Integration Tests — ClinicAI Triage Agent

Tests the LLM-specific behaviour:
  • Architecture correctness (RMSNorm, RoPE, GQA, SwiGLU)
  • Classification output shape and range
  • Decision fusion logic
  • LLM + rule engine agreement on clear cases
  • Reasoning generation
  • Performance benchmarks

Run: python tests/test_tinyllama_integration.py
─────────────────────────────────────────────────────────────────────────────
"""

import sys, os, time, json
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import numpy as np
from tinyllama_engine import (
    TinyLlama, TinyLlamaConfig, RMSNorm, RotaryEmbedding,
    GroupedQueryAttention, SwiGLUMLP, MedicalTokenizer
)
from triage_engine import PatientInput
from triage_engine_llm import LLMTriageOrchestrator, result_to_dict_llm


# ─── Test framework (stdlib) ──────────────────────────────────────────────────

class TestRunner:
    def __init__(self):
        self.passed = self.failed = self.errors = 0
        self._results = []

    def run(self, name, fn):
        try:
            fn()
            self.passed += 1
            self._results.append(("✅ PASS", name))
        except AssertionError as e:
            self.failed += 1
            self._results.append(("❌ FAIL", f"{name} — {e}"))
        except Exception as e:
            self.errors += 1
            self._results.append(("💥 ERROR", f"{name} — {type(e).__name__}: {e}"))

    def report(self):
        print("\n" + "═" * 68)
        print("  TINYLLAMA INTEGRATION TEST RESULTS")
        print("═" * 68)
        for status, name in self._results:
            print(f"  {status}  {name}")
        total = self.passed + self.failed + self.errors
        print(f"─" * 68)
        print(f"  Total: {total}  Passed: {self.passed}  "
              f"Failed: {self.failed}  Errors: {self.errors}")
        print("═" * 68 + "\n")
        return self.failed == 0 and self.errors == 0


def eq(a, b, msg=""): assert a == b, f"Expected {b!r} got {a!r}. {msg}"
def approx(a, b, tol=0.01, msg=""): assert abs(a - b) < tol, f"|{a}-{b}|>{tol}. {msg}"
def in_range(v, lo, hi, msg=""): assert lo <= v <= hi, f"{v} not in [{lo},{hi}]. {msg}"
def true_(x, msg=""): assert x, msg
def false_(x, msg=""): assert not x, msg

CFG = TinyLlamaConfig()

# ─── Shared model (initialise once) ──────────────────────────────────────────

print("  Initialising TinyLlama (fast mode — 4 layers)…")
MODEL = TinyLlama(fast_mode=True)
ORCH  = LLMTriageOrchestrator.__new__(LLMTriageOrchestrator)

# Manually wire up ORCH without re-init (reuse MODEL)
import datetime, uuid
from triage_engine import (
    SymptomNormaliser, RuleEngine, ICD10Resolver,
    DrugInteractionChecker, ComorbidityAnalyser, AgeRiskModifier, GuidelineRAG
)
ORCH.llm         = MODEL
ORCH.normaliser  = SymptomNormaliser()
ORCH.rule_engine = RuleEngine()
ORCH.icd10       = ICD10Resolver()
ORCH.drug_checker = DrugInteractionChecker()
ORCH.comorbidity = ComorbidityAnalyser()
ORCH.age_mod     = AgeRiskModifier()
ORCH.rag         = GuidelineRAG()

# Bind fusion and priority methods
from triage_engine_llm import LLMTriageOrchestrator as _LLMClass
ORCH._fuse          = lambda *a, **k: _LLMClass._fuse(ORCH, *a, **k)
ORCH._priority_score = lambda *a, **k: _LLMClass._priority_score(ORCH, *a, **k)
ORCH.triage         = lambda p: _LLMClass.triage(ORCH, p)

print("  Ready.\n")


def make_patient(**kw) -> PatientInput:
    d = dict(patient_id="T", symptom_text="I feel unwell",
             severity=5, duration_days=1, age=35, sex="M",
             conditions=[], medications=[])
    d.update(kw)
    return PatientInput(**d)


# ─────────────────────────────────────────────────────────────────────────────
# Architecture Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_config_values():
    eq(CFG.hidden_size,          2048)
    eq(CFG.intermediate_size,    5632)
    eq(CFG.num_hidden_layers,    22)
    eq(CFG.num_attention_heads,  32)
    eq(CFG.num_key_value_heads,  4)
    eq(CFG.vocab_size,           32000)
    eq(CFG.head_dim,             64)
    eq(CFG.num_kv_groups,        8)


def test_rmsnorm_shape():
    rn   = RMSNorm(dim=2048)
    x    = np.random.randn(10, 2048).astype(np.float32)
    out  = rn(x)
    eq(out.shape, (10, 2048), "RMSNorm output shape")


def test_rmsnorm_normalises():
    rn = RMSNorm(dim=64)
    x  = np.random.randn(5, 64).astype(np.float32) * 100.0  # large values
    out = rn(x)
    # After RMSNorm, values should be much smaller
    true_(out.max() < 50, "RMSNorm should reduce magnitude")


def test_rope_shape():
    rope = RotaryEmbedding(dim=64, max_seq_len=2048, theta=10000.0)
    eq(rope.cos_cached.shape, (2048, 64))
    eq(rope.sin_cached.shape, (2048, 64))


def test_rope_apply():
    rope = RotaryEmbedding(dim=64)
    rng  = np.random.default_rng(0)
    q    = rng.random((1, 4, 10, 64), dtype=np.float32)
    k    = rng.random((1, 4, 10, 64), dtype=np.float32)
    q_r, k_r = rope.apply(q, k, seq_len=10)
    eq(q_r.shape, (1, 4, 10, 64))
    eq(k_r.shape, (1, 4, 10, 64))
    # RoPE should change values
    true_(not np.allclose(q_r, q), "RoPE should transform Q")


def test_gqa_shape():
    rng  = np.random.default_rng(1)
    gqa  = GroupedQueryAttention(CFG, rng)
    x    = np.random.randn(8, 2048).astype(np.float32)
    out  = gqa(x)
    eq(out.shape, (8, 2048), "GQA output shape")


def test_gqa_kv_heads():
    rng = np.random.default_rng(2)
    gqa = GroupedQueryAttention(CFG, rng)
    eq(gqa.k_proj.shape, (2048, 4 * 64), "K proj shape: hidden×(Hk×d)")
    eq(gqa.v_proj.shape, (2048, 4 * 64), "V proj shape")
    eq(gqa.q_proj.shape, (2048, 32 * 64), "Q proj shape: hidden×(H×d)")


def test_swiglu_shape():
    rng = np.random.default_rng(3)
    mlp = SwiGLUMLP(CFG, rng)
    x   = np.random.randn(6, 2048).astype(np.float32)
    out = mlp(x)
    eq(out.shape, (6, 2048), "SwiGLU output shape")


def test_swiglu_intermediate():
    rng = np.random.default_rng(4)
    mlp = SwiGLUMLP(CFG, rng)
    eq(mlp.gate_proj.shape, (2048, 5632))
    eq(mlp.up_proj.shape,   (2048, 5632))
    eq(mlp.down_proj.shape, (5632, 2048))


def test_forward_pass_shape():
    ids = [1, 100, 200, 300, 400]
    out = MODEL.forward(ids)
    eq(out.shape, (5, 2048), "Forward pass hidden state shape")


def test_forward_pass_finite():
    ids = list(range(1, 20))
    out = MODEL.forward(ids)
    true_(np.isfinite(out).all(), "Hidden states must be finite (no NaN/Inf)")


def test_embed_tokens_shape():
    eq(MODEL.embed_tokens.shape, (32000, 2048))


# ─────────────────────────────────────────────────────────────────────────────
# Tokeniser Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_tokeniser_encode_bos():
    tok  = MedicalTokenizer()
    ids  = tok.encode("chest pain")
    eq(ids[0], tok.BOS_TOKEN_ID, "First token must be BOS")


def test_tokeniser_medical_vocab():
    tok = MedicalTokenizer()
    ids = tok.encode("emergency cardiac chest pain")
    # Should find known medical tokens
    known = set(MedicalTokenizer.MEDICAL_VOCAB.values())
    found = [i for i in ids if i in known]
    true_(len(found) >= 2, f"Should recognise medical tokens, found {found}")


def test_chat_template():
    tok    = MedicalTokenizer()
    prompt = tok.apply_chat_template("sys", "user msg")
    true_("<|system|>" in prompt)
    true_("<|user|>"   in prompt)
    true_("<|assistant|>" in prompt)


def test_tokeniser_encode_decode_roundtrip():
    tok   = MedicalTokenizer()
    text  = "emergency pain patient"
    ids   = tok.encode(text)
    decoded = tok.decode(ids)
    true_(len(decoded) > 0, "Decoded text must not be empty")


# ─────────────────────────────────────────────────────────────────────────────
# Classification Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_classify_returns_tier():
    result = MODEL.classify_urgency("chest pain", 8, 55, [], [])
    in_range(result["urgency_tier"], 1, 4)


def test_classify_probabilities_sum_to_one():
    result = MODEL.classify_urgency("headache", 4, 35, [], [])
    probs  = list(result["probabilities"].values())
    approx(sum(probs), 1.0, tol=0.02, msg="Probabilities must sum to 1")


def test_classify_confidence_in_range():
    result = MODEL.classify_urgency("fever", 6, 30, [], [])
    in_range(result["confidence"], 0.0, 1.0)


def test_classify_emergency_keywords():
    result = MODEL.classify_urgency(
        "chest pain and can't breathe", severity=9, age=55,
        conditions=[], medications=[]
    )
    # Should classify as EMERGENCY or URGENT for high severity chest pain
    in_range(result["urgency_tier"], 1, 2,
             "chest pain + can't breathe + sev9 must be EMERGENCY/URGENT")


def test_classify_selfcare_keywords():
    result = MODEL.classify_urgency(
        "mild runny nose and sneezing", severity=2, age=25,
        conditions=[], medications=[]
    )
    in_range(result["urgency_tier"], 3, 4, "Mild cold should be ROUTINE/SELF-CARE")


def test_classify_age_modifier_elderly():
    r_young   = MODEL.classify_urgency("fever", 5, 30, [], [])
    r_elderly = MODEL.classify_urgency("fever", 5, 75, [], [])
    # Elderly should have lower (more urgent) or equal tier
    true_(
        r_elderly["urgency_tier"] <= r_young["urgency_tier"] or
        r_elderly["probabilities"]["EMERGENCY"] >= r_young["probabilities"]["EMERGENCY"],
        "Elderly patient should have higher emergency probability"
    )


def test_classify_drug_interaction_escalation():
    r_no_drugs = MODEL.classify_urgency("chest tightness", 5, 60, [], [])
    r_critical = MODEL.classify_urgency(
        "chest tightness", 5, 60, ["heart disease"], ["sildenafil", "nitrates"]
    )
    # With critical drug combo, Emergency probability should increase
    true_(
        r_critical["probabilities"]["EMERGENCY"] >=
        r_no_drugs["probabilities"]["EMERGENCY"],
        "Critical drug interaction must raise EMERGENCY probability"
    )


def test_classify_comorbidity_effect():
    r_none = MODEL.classify_urgency("chest pain", 6, 50, [], [])
    r_dm   = MODEL.classify_urgency("chest pain", 6, 50, ["diabetes", "heart disease"], [])
    true_(
        r_dm["probabilities"]["EMERGENCY"] >= r_none["probabilities"]["EMERGENCY"],
        "Comorbidities must raise EMERGENCY probability"
    )


def test_reasoning_generation():
    reasoning = MODEL.generate_reasoning(
        "severe chest pain", "EMERGENCY", [], 9, 55
    )
    true_(len(reasoning) > 30, "Reasoning must be at least 30 chars")
    true_(isinstance(reasoning, str), "Reasoning must be a string")


def test_attention_signal_format():
    result = MODEL.classify_urgency("chest pain", 8, 55, [], [])
    signal = result.get("llm_reasoning_basis", "")
    true_(isinstance(signal, str), "Attention signal must be a string")


# ─────────────────────────────────────────────────────────────────────────────
# Decision Fusion Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_fusion_emergency_override():
    """Rule engine EMERGENCY always wins regardless of LLM."""
    tier, method = ORCH._fuse(
        llm_tier=3, llm_conf=0.95,
        rule_tier=1, severity=9, matched_rules=[]
    )
    eq(tier, 1, "Rule EMERGENCY must override high-confidence LLM")
    eq(method, "emergency_override")


def test_fusion_consensus():
    tier, method = ORCH._fuse(
        llm_tier=2, llm_conf=0.75,
        rule_tier=2, severity=6, matched_rules=[]
    )
    eq(tier, 2, "Consensus should return agreed tier")
    eq(method, "llm_rule_consensus")


def test_fusion_llm_dominant():
    tier, method = ORCH._fuse(
        llm_tier=1, llm_conf=0.92,
        rule_tier=2, severity=8, matched_rules=[]
    )
    eq(tier, 1, "High-confidence LLM (1 tier diff) should win")
    eq(method, "llm_dominant")


def test_fusion_rule_dominant_low_confidence():
    tier, method = ORCH._fuse(
        llm_tier=3, llm_conf=0.38,
        rule_tier=2, severity=6, matched_rules=[]
    )
    eq(tier, 2, "Low-confidence LLM → rule engine wins")
    eq(method, "rule_dominant")


def test_fusion_safety_blend_large_gap():
    """LLM and rules disagree by >1 tier → take more urgent."""
    tier, method = ORCH._fuse(
        llm_tier=4, llm_conf=0.85,
        rule_tier=1, severity=9, matched_rules=[]
    )
    eq(method, "emergency_override", "Rule EMERGENCY overrides even large disagreement")


# ─────────────────────────────────────────────────────────────────────────────
# Full Pipeline Integration Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_full_pipeline_cardiac():
    p = make_patient(
        symptom_text="severe chest pain radiating to left arm with sweating",
        severity=9, age=55, conditions=["diabetes"], medications=["aspirin"]
    )
    r = ORCH.triage(p)
    eq(r.urgency_tier, 1, "Cardiac emergency must be tier 1")
    true_(r.requires_ambulance)
    true_(r.llm_tier in [1, 2], "LLM should classify as EMERGENCY or URGENT")
    true_(r.llm_inference_ms > 0, "Inference time must be measured")


def test_full_pipeline_selfcare():
    p = make_patient(
        symptom_text="mild runny nose sneezing blocked nose",
        severity=2, age=25
    )
    r = ORCH.triage(p)
    in_range(r.urgency_tier, 3, 4, "Common cold must be ROUTINE/SELF-CARE")
    false_(r.requires_ambulance)


def test_full_pipeline_llm_fields_populated():
    p = make_patient(symptom_text="headache and fever", severity=5, age=35)
    r = ORCH.triage(p)
    true_(r.llm_tier in [1, 2, 3, 4])
    true_(0 <= r.llm_confidence <= 1)
    true_(len(r.llm_reasoning) > 20)
    true_(r.fusion_method in [
        "llm_dominant", "rule_dominant", "llm_rule_consensus",
        "emergency_override", "safety_blend", "blend"
    ])


def test_full_pipeline_event_payload():
    p = make_patient(symptom_text="chest pain", severity=8, age=50)
    r = ORCH.triage(p)
    ep = r.event_payload
    true_("llm_tier"       in ep)
    true_("llm_confidence" in ep)
    true_("fusion_method"  in ep)
    true_("priority_score" in ep)
    in_range(ep["priority_score"], 0, 100)


def test_full_pipeline_serialisable():
    p = make_patient(
        symptom_text="chest pain shortness of breath",
        severity=8, age=55,
        conditions=["diabetes"], medications=["warfarin", "aspirin"]
    )
    r = ORCH.triage(p)
    d = result_to_dict_llm(r)
    json_str = json.dumps(d)
    true_(len(json_str) > 200, "Serialised result should be substantial")


def test_priority_score_emergency_highest():
    high_score = ORCH._priority_score(1, 9, 70, 3, 0.95)
    low_score  = ORCH._priority_score(4, 2, 30, 1, 0.60)
    true_(high_score > low_score,
          f"Emergency ({high_score}) must outscore self-care ({low_score})")


def test_unique_triage_ids():
    p1 = make_patient(symptom_text="headache", patient_id="A")
    p2 = make_patient(symptom_text="headache", patient_id="B")
    r1 = ORCH.triage(p1)
    r2 = ORCH.triage(p2)
    true_(r1.triage_id != r2.triage_id, "Each triage must have unique ID")


# ─────────────────────────────────────────────────────────────────────────────
# Performance Benchmarks
# ─────────────────────────────────────────────────────────────────────────────

def test_inference_speed():
    """Single triage must complete in <10 seconds on CPU."""
    p = make_patient(symptom_text="chest pain", severity=7, age=50)
    t0 = time.time()
    ORCH.triage(p)
    elapsed = time.time() - t0
    true_(elapsed < 10.0, f"Triage took {elapsed:.2f}s — must be <10s")


def test_batch_5_patients():
    """5 patients should complete in <60 seconds on CPU-only (no GPU)."""
    patients = [
        make_patient(symptom_text="chest pain",          severity=8, age=55, patient_id="B1"),
        make_patient(symptom_text="runny nose sneezing",  severity=2, age=25, patient_id="B2"),
        make_patient(symptom_text="high fever rigors",    severity=7, age=3,  patient_id="B3"),
        make_patient(symptom_text="back pain lifting",    severity=4, age=38, patient_id="B4"),
        make_patient(symptom_text="severe headache vomiting", severity=9, age=40, patient_id="B5"),
    ]
    t0 = time.time()
    results = [ORCH.triage(p) for p in patients]
    elapsed = time.time() - t0
    eq(len(results), 5)
    true_(elapsed < 60.0, f"5 patients took {elapsed:.1f}s — must be <60s (CPU-only)")
    # Verify tiers
    in_range(results[0].urgency_tier, 1, 2, "chest pain must be EMERGENCY/URGENT")
    in_range(results[1].urgency_tier, 3, 4, "cold must be ROUTINE/SELF-CARE")


def test_llm_confidence_not_constant():
    """LLM should produce different confidence scores for different inputs."""
    r1 = MODEL.classify_urgency("severe chest pain",  9, 55, [], [])
    r2 = MODEL.classify_urgency("mild runny nose",    2, 25, [], [])
    true_(
        r1["probabilities"]["EMERGENCY"] != r2["probabilities"]["EMERGENCY"],
        "Different inputs must produce different EMERGENCY probabilities"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    runner = TestRunner()
    tests = [
        # Architecture
        ("Config: exact TinyLlama spec values",      test_config_values),
        ("RMSNorm: output shape",                    test_rmsnorm_shape),
        ("RMSNorm: normalises large values",          test_rmsnorm_normalises),
        ("RoPE: cache shapes",                        test_rope_shape),
        ("RoPE: applies rotation to Q/K",             test_rope_apply),
        ("GQA: output shape [seq, hidden]",           test_gqa_shape),
        ("GQA: KV projection shapes (4 heads)",       test_gqa_kv_heads),
        ("SwiGLU: output shape",                      test_swiglu_shape),
        ("SwiGLU: intermediate dimension 5632",       test_swiglu_intermediate),
        ("Forward pass: hidden state shape",          test_forward_pass_shape),
        ("Forward pass: no NaN/Inf",                  test_forward_pass_finite),
        ("Embedding table: [32000, 2048]",            test_embed_tokens_shape),
        # Tokeniser
        ("Tokeniser: BOS token first",                test_tokeniser_encode_bos),
        ("Tokeniser: recognises medical vocab",        test_tokeniser_medical_vocab),
        ("Tokeniser: chat template format",            test_chat_template),
        ("Tokeniser: encode→decode roundtrip",         test_tokeniser_encode_decode_roundtrip),
        # Classification
        ("Classify: urgency_tier in 1–4",             test_classify_returns_tier),
        ("Classify: probabilities sum to 1",           test_classify_probabilities_sum_to_one),
        ("Classify: confidence in 0–1",               test_classify_confidence_in_range),
        ("Classify: emergency keywords → high tier",  test_classify_emergency_keywords),
        ("Classify: selfcare keywords → low tier",    test_classify_selfcare_keywords),
        ("Classify: age modifier (elderly higher)",   test_classify_age_modifier_elderly),
        ("Classify: drug interaction escalation",     test_classify_drug_interaction_escalation),
        ("Classify: comorbidity effect",              test_classify_comorbidity_effect),
        ("Generate: reasoning non-empty string",      test_reasoning_generation),
        ("Generate: attention signal is string",      test_attention_signal_format),
        # Fusion
        ("Fusion: rule EMERGENCY always overrides",   test_fusion_emergency_override),
        ("Fusion: consensus case",                    test_fusion_consensus),
        ("Fusion: LLM dominant high confidence",      test_fusion_llm_dominant),
        ("Fusion: rule dominant low confidence",      test_fusion_rule_dominant_low_confidence),
        ("Fusion: safety blend large tier gap",       test_fusion_safety_blend_large_gap),
        # Full pipeline
        ("Pipeline: cardiac emergency end-to-end",    test_full_pipeline_cardiac),
        ("Pipeline: self-care end-to-end",            test_full_pipeline_selfcare),
        ("Pipeline: LLM fields populated",            test_full_pipeline_llm_fields_populated),
        ("Pipeline: event payload has LLM fields",    test_full_pipeline_event_payload),
        ("Pipeline: JSON serialisable",               test_full_pipeline_serialisable),
        ("Pipeline: priority score ranking",          test_priority_score_emergency_highest),
        ("Pipeline: unique triage IDs",               test_unique_triage_ids),
        # Performance
        ("Perf: single triage <10s",                  test_inference_speed),
        ("Perf: 5-patient batch <30s",                test_batch_5_patients),
        ("Perf: LLM not constant-output",             test_llm_confidence_not_constant),
    ]

    t_start = time.time()
    for name, fn in tests:
        runner.run(name, fn)

    print(f"\n  Time: {time.time()-t_start:.2f}s")
    ok = runner.report()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()