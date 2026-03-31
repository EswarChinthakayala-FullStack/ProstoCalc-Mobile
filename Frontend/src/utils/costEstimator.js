/**
 * Cost Estimator Utility — Powered by CostEstimatorService.js (v5.0 Ensemble)
 *
 * This module wraps the full 6-algorithm CostEstimatorService for use in the
 * TreatmentPlanBuilder. All multipliers, weights, and algorithms are sourced
 * from the canonical CostEstimatorService.js — no hardcoded or dummy values.
 */
import CostEstimatorService from '@/services/CostEstimatorService';

// ─── Synced complexity/material options (v5.0 coefficients) ──────────────────
export const COMPLEXITY_OPTIONS = [
  { value: 'Low',    label: 'Low',    multiplier: 0.85 },
  { value: 'Medium', label: 'Medium', multiplier: 1.0 },
  { value: 'High',   label: 'High',   multiplier: 1.35 },
]

export const MATERIAL_OPTIONS = [
  { value: 'Standard',      label: 'Standard',      multiplier: 1.0 },
  { value: 'Premium',       label: 'Premium',       multiplier: 1.25 },
  { value: 'Biocompatible', label: 'Biocompatible', multiplier: 1.55 },
]

export const TREATMENT_TYPES = [
  'Extraction', 'Crown', 'Implant', 'CD', 'RPD', 'RCT', 'FMR', 'Scaling', 'Filling',
]

/**
 * Estimate cost using the full 6-algorithm CostEstimatorService.js ensemble.
 *
 * @param {string}  treatmentType  — procedure name
 * @param {number}  teethCount     — units
 * @param {number}  sessions       — expected sessions
 * @param {string}  complexity     — 'Low' | 'Medium' | 'High'
 * @param {string}  material       — 'Standard' | 'Premium' | 'Biocompatible'
 * @param {Object}  customPriceList — dentist-customized { name: cost } map
 * @param {number}  age            — patient age (default 35)
 * @param {number}  hygiene        — hygiene rating 1-10 (default 7)
 * @param {number}  urgency        — urgency rating 1-10 (default 5)
 * @returns {{ baseCost, minRange, maxRange, confidenceScore, engine, prediction, algorithms }}
 */
export function estimateCost(
  treatmentType,
  teethCount = 1,
  sessions = 1,
  complexity = 'Medium',
  material = 'Standard',
  customPriceList = {},
  age = 35,
  hygiene = 7,
  urgency = 5,
) {
  const service = new CostEstimatorService();

  const result = service.estimate({
    treatmentType,
    teethCount,
    sessions,
    complexity,
    material,
    age,
    hygiene,
    urgency,
    customPricelist: customPriceList,
  });

  // Return a backwards-compatible shape used by TreatmentPlanBuilder
  const prediction = result.prediction || result.fallback;

  return {
    baseCost:        prediction.predictedCost || prediction.baseCost || 0,
    minRange:        prediction.minRange || 0,
    maxRange:        prediction.maxRange || 0,
    confidenceScore: prediction.confidenceScore || 0,
    engine:          prediction.engineVersion || prediction.method || "ProstoAI-Ensemble-v5.0",
    prediction,       // Full prediction object
    algorithms: result.algorithms, // Individual algorithm results
  }
}

/**
 * Build an AI prompt for clinical justification (matches Swift generateAIExplanation).
 */
export function buildAIPrompt(items, totalCost) {
  const procedures = items
    .map((i) => `- ${i.name} (Tooth: ${i.tooth_number || 'All'}): ₹${i.cost}`)
    .join('\n')

  return `[CONTEXT] Senior Dental Clinical Analyst.
[TASK] Generate a detailed clinical justification for the patient's treatment plan.

[PLAN DATA]
${procedures}
Total Estimated Investment: ₹${totalCost}

[REQUIREMENTS]
1. **Tooth-by-Tooth Analysis**: Explain why each procedure for the specific tooth numbers mentioned is necessary.
2. **Clinical Value**: Describe how these procedures contribute to overall occlusal stability and biological health.
3. **Cost Justification**: Briefly justify the investment based on materials and clinical complexity.
4. **Structure**: Professional, empathetic, and clear. Use **bold** for key terms and tooth numbers.
5. **Constraint**: Strict maximum of 150 words. No # or ## headers.

[MANDATORY FOOTER]
"Estimation only. Final clinical judgment and biological response determined by the attending surgeon."`
}
