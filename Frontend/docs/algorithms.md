# 🧮 Advanced Estimation Algorithms — Technical Documentation

> **File:** `Frontend/src/services/CostEstimatorService.js`  
> **Version:** v5.0 — Clinical Cost Intelligence Engine

---

## ❓ Why Not Just a Calculator?

A simple calculator does: `cost = base × units × complexity_multiplier × material_multiplier`

This is **deterministic** — same input always gives the same output, with no understanding of:
- **Uncertainty** (what's the range of possible costs?)
- **Patient-specific risk** (does a 70-year-old smoker cost the same as a 25-year-old?)
- **Non-linear interactions** (high complexity + biocompatible material together have a compounding effect)
- **Probabilistic outcomes** (what if complications arise?)
- **Historical learning** (what did similar past cases actually cost?)

Our engine uses **6 distinct algorithms** that address all of these limitations.

---

## 📊 Algorithm Overview

```
┌──────────────────────────────────────────────────────────┐
│                 PATIENT INPUT DATA                        │
│  Treatment, Units, Sessions, Complexity, Material,        │
│  Age, Hygiene, Urgency                                    │
└───────────────────────┬──────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
   ┌─────────────┐ ┌──────────┐ ┌────────────┐
   │  Algorithm 1│ │Algorithm 2│ │ Algorithm 3│
   │  Regression │ │   GBDT   │ │Monte Carlo │
   │  (Baseline) │ │(Boosting)│ │(Simulation)│
   └──────┬──────┘ └────┬─────┘ └─────┬──────┘
          │              │             │
          ▼              ▼             ▼
   ┌─────────────┐ ┌──────────┐
   │  Algorithm 4│ │Algorithm 5│
   │  Bayesian   │ │   KNN    │
   │ (Inference) │ │(Neighbors)│
   └──────┬──────┘ └────┬─────┘
          │              │
          └──────┬───────┘
                 ▼
   ┌──────────────────────────┐
   │      ALGORITHM 6         │
   │  Weighted Ensemble       │
   │  Meta-Learner            │
   │                          │
   │  Combines all 5 using    │
   │  confidence-weighted     │
   │  voting                  │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │    FINAL PREDICTION      │
   │  ₹ Cost ± Range          │
   │  Confidence Score        │
   │  Risk Analysis           │
   └──────────────────────────┘
```

---

## 1️⃣ Multivariate Linear Regression

### What It Does
Models cost as a **linear combination** of clinical features with **interaction terms**.

### Formula
```
ŷ = baseCost × units × volumeDiscount × sessionOverhead 
    × β₁(complexity) × β₂(material) × interactionEffect
```

### Key Innovation: Interaction Terms
A calculator treats complexity and material independently. Our regression models their **synergy**:

```
interactionEffect = 1.0 + (compVal - 1.0) × (matVal - 1.0) × 0.5
```

**Example:** High complexity (1.35) + Biocompatible material (1.55):
- **Simple calculator:** 1.35 × 1.55 = 2.09× multiplier
- **Our model:** 2.09 × 1.096 = 2.29× multiplier (the interaction adds 9.6% more)

This models the real-world fact that complex procedures with premium materials require MORE specialized handling than either factor alone would suggest.

### Confidence Score
Derived from the treatment's inherent risk profile (σ), not a random number:
```
confidence = 0.92 - (riskSigma × 0.3)
```

---

## 2️⃣ Gradient Boosted Decision Trees (GBDT)

### What It Does
The same algorithm behind **XGBoost** and **LightGBM** — the #1 algorithm for structured data on Kaggle.

### How It Works
```
1. Start: F₀ = mean(all historical cost multipliers)
2. For round m = 1 to 20:
   a. Calculate residuals: rᵢ = yᵢ - F_{m-1}(xᵢ)  (what the model gets WRONG)
   b. Build a decision stump to predict residuals
   c. Update: F_m = F_{m-1} + η × stump(x)  (η = 0.1 learning rate)
3. Final: F₂₀(x) = F₀ + η × Σ stump_m(x)
```

### Why It's Better Than a Calculator
- **Non-linear patterns:** It discovers that age > 60 has a STEP increase in cost (not proportional)
- **Feature interactions:** It finds that urgency > 7 WITH hygiene < 3 creates a cost spike
- **Feature importance:** It tells you WHICH factors matter most for cost prediction
- **Automatic learning:** Each tree corrects mistakes of the previous ones

### Decision Stump (Weak Learner)
Each tree is a simple split: "Is feature_f > threshold?"
```
         [Complexity > 0.5?]
          /              \
    LEFT: mean=-0.05    RIGHT: mean=+0.12
    (lower residual)    (higher residual)
```

The algorithm tries **all features** × **5 thresholds** and picks the split with the highest **gain** (largest reduction in squared error).

---

## 3️⃣ Monte Carlo Simulation

### What It Does
Runs **10,000 randomized simulations** where each parameter has a **probability distribution** instead of a fixed value.

### Why 10,000 Simulations?
By the Central Limit Theorem, 10,000 samples give us reliable estimates of percentiles and probabilities.

### Parameter Distributions
| Parameter | Distribution | Rationale |
|-----------|-------------|-----------|
| Complexity | Normal(weight, σ=0.08) | Clinical assessment has inherent subjectivity |
| Material | Normal(weight, σ=0.05) | Supplier price variations |
| Session count | Poisson-like | Complications can add 1-2 extra sessions |
| Volume discount | Normal(0.05, σ=0.01) | Discount varies by case |
| Price noise | Normal(1.0, σ=0.04) | ±8% general market fluctuation |

### Complication Modeling
```
Each simulation:
  if random() < failureRate:
    sessions += ceil(random() × 2)  ← 1-2 extra sessions
```

This models real-world complications: implants have ~8% complication rate, FMR has ~15%.

### Output: Full Probability Distribution
```
P5  = ₹820    ← Best case (95% chance cost is ABOVE this)
P25 = ₹1,050  ← Lower quartile
P50 = ₹1,280  ← Median (most likely outcome)
P75 = ₹1,520  ← Upper quartile
P95 = ₹1,890  ← Worst case (95% chance cost is BELOW this)
```

### Risk Analysis
- **Complication Probability:** Treatment-specific failure rate
- **Cost Exceedance Probability:** % chance of exceeding 1.3× the base estimate
- **Volatility Index:** Coefficient of variation (σ/μ × 100)

### Reproducibility
Uses a **seeded pseudorandom number generator** (Mulberry32 algorithm) with a hash of inputs, so the same inputs always produce the same Monte Carlo results.

---

## 4️⃣ Bayesian Inference

### What It Does
Applies **Bayes' Theorem** to update cost estimates based on patient-specific clinical evidence.

### Bayes' Theorem
```
P(cost | evidence) = P(evidence | cost) × P(cost) / P(evidence)
   └─ Posterior          └─ Likelihood      └─ Prior
```

### Step-by-Step

**1. Prior Distribution (Before seeing the patient)**
```
μ₀ = baseCost × units × complexity × material
σ₀ = μ₀ × treatmentRiskSigma
```
This is our "default belief" before patient-specific data.

**2. Likelihood (Clinical Evidence)**

Each evidence factor adjusts the expected cost:
| Evidence | Condition | Multiplier | Rationale |
|----------|-----------|------------|-----------|
| Age | > 60 years | 1.12× | Higher complication risk |
| Age | > 45 years | 1.05× | Moderate age premium |
| Hygiene | ≤ 3/10 | 1.15× | Poor healing, more sessions |
| Hygiene | ≥ 8/10 | 0.95× | Optimal conditions |
| Urgency | ≥ 8/10 | 1.18× | Emergency scheduling premium |
| Sessions | > avg for treatment | +15% × deviation | More sessions = higher cost |

**3. Posterior (Updated Belief)**

Using conjugate Normal distributions:
```
Posterior precision = Prior precision + Likelihood precision
Posterior mean = (Prior_μ × Prior_τ + Likelihood_μ × Likelihood_τ) / Posterior_τ
```

**4. 95% Credible Interval**
```
[μ_posterior - 1.96σ_posterior,  μ_posterior + 1.96σ_posterior]
```

### Why It's Better Than a Calculator
A calculator gives the **same cost** for a 25-year-old athlete and a 70-year-old diabetic getting the same crown. Bayesian inference gives a **personalized estimate** that accounts for individual patient risk factors.

### Belief Update Score
Shows how much the patient's evidence changed the estimate:
```
beliefReduction = 1 - (σ²_posterior / σ²_prior)
```
Higher = more informative patient data.

---

## 5️⃣ K-Nearest Neighbors (KNN) Regression

### What It Does
Finds the **K=5 most similar** historical treatment cases and predicts cost based on their **inverse-distance weighted average**.

### Feature Space (7 dimensions)
All features normalized to [0, 1]:
```
[complexity, material, units, sessions, age, hygiene, urgency]
```

### Distance Metric
Euclidean distance:
```
d(a, b) = √(Σ (aᵢ - bᵢ)²)
```

### Inverse-Distance Weighting
Closer neighbors have MORE influence:
```
weight_i = 1 / (distance_i + ε)
prediction = Σ(weight_i × cost_i) / Σ(weight_i)
```

### Novelty Detection
If the query point is FAR from all neighbors, the case is "novel" (unusual), and confidence is reduced:
```
noveltyPenalty = min(1, avgDistance / 2.0)
confidence = max(0.60, 0.95 - noveltyPenalty × 0.3)
```

### Training Data
40 synthetic historical cases with realistic non-linear cost patterns, including:
- Interaction effects (complexity × material)
- Step functions (age > 60 premium)
- Combined risk factors (urgent + poor hygiene)

---

## 6️⃣ Weighted Ensemble Meta-Learner

### What It Does
Combines all 5 algorithms into a single prediction using **confidence-weighted voting**.

### Trust Weights
| Algorithm | Trust Weight | Rationale |
|-----------|-------------|-----------|
| GBDT | 25% | Excellent for structured clinical data |
| Bayesian | 25% | Best when patient data is available |
| Monte Carlo | 20% | Best for modeling uncertainty |
| Regression | 15% | Reliable deterministic baseline |
| KNN | 15% | Good for adapting to historical patterns |

### Voting Formula
```
Final weight_i = trust_i × confidence_i
Ensemble cost = Σ(weight_i × prediction_i) / Σ(weight_i)
```

### Model Agreement Score
Measures how much the algorithms agree:
```
agreement = 1 - (σ_predictions / μ_predictions)
```
- **High agreement (>0.95):** All algorithms converge → high confidence
- **Low agreement (<0.80):** Algorithms disagree → the case is uncertain

### Disagreement Detection
This is something a calculator can NEVER do. If GBDT says ₹1,500 but Monte Carlo says ₹2,200, the ensemble flags this as a **high-uncertainty case** and automatically lowers the confidence score.

---

## 📋 Summary: Calculator vs. Intelligence Engine

| Capability | Simple Calculator | Our Engine |
|------------|-------------------|------------|
| Fixed output | ✅ Single number | ✅ Prediction + confidence range |
| Uncertainty modeling | ❌ | ✅ Monte Carlo (10,000 simulations) |
| Patient-specific adjustment | ❌ | ✅ Bayesian evidence updates |
| Learning from data | ❌ | ✅ GBDT + KNN |
| Interaction effects | ❌ | ✅ Regression interaction terms |
| Complication modeling | ❌ | ✅ Monte Carlo complication events |
| Risk analysis | ❌ | ✅ Escalation, volatility, exceedance |
| Multiple perspectives | ❌ | ✅ 5 algorithms + ensemble |
| Disagreement detection | ❌ | ✅ Model agreement score |
| Feature importance | ❌ | ✅ GBDT feature ranking |
| Novelty detection | ❌ | ✅ KNN novelty score |
| Reproducible randomness | ❌ | ✅ Seeded PRNG (Mulberry32) |

---

## 🔧 Technical Details

### Pseudorandom Number Generator
Uses **Mulberry32** (a 32-bit PRNG) for deterministic randomness:
```
state = (state + 0x6D2B79F5) | 0
t = imul(state ^ (state >>> 15), 1 | state)
t = (t + imul(t ^ (t >>> 7), 61 | t)) ^ t
return ((t ^ (t >>> 14)) >>> 0) / 4294967296
```

### Box-Muller Transform
Converts uniform random numbers → Gaussian (normal) distribution:
```
z = √(-2 × ln(u₁)) × cos(2π × u₂)
gaussian = mean + z × stdDev
```

### Treatment Risk Profiles
| Treatment | Risk σ | Failure Rate | Avg Sessions |
|-----------|--------|--------------|--------------|
| Extraction | 0.05 | 2% | 1 |
| Crown | 0.12 | 5% | 2 |
| Implant | 0.18 | 8% | 4 |
| CD | 0.15 | 10% | 5 |
| RPD | 0.10 | 12% | 3 |
| RCT | 0.14 | 6% | 2 |
| FMR | 0.20 | 15% | 8 |
| Scaling | 0.03 | 1% | 1 |
| Filling | 0.08 | 4% | 1 |
