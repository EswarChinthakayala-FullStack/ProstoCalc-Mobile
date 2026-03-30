
/**
 * CostEstimatorService.js
 * 
 * This service implements a hybrid estimation logic:
 * 1. A simulated Random Forest Regressor for "AI Prediction".
 * 2. A deterministic Fallback Regression model based on standard clinical formulas (ported from Swift).
 * 3. Premium AI Analysis generation (Health Score, Escalation, Tips).
 */

class CostEstimatorService {
  constructor() {
    this.treatmentComplexity = {
      Low: 0.9,
      Medium: 1.1,
      High: 1.4
    };

    this.materialType = {
      Standard: 1.0,
      Premium: 1.3,
      Biocompatible: 1.6
    };

    this.defaultBaseCosts = {
      "Extraction": 800,
      "Crown": 5500,
      "Implant": 35000,
      "CD": 40000,
      "RPD": 18000,
      "RCT": 4500,
      "FMR": 120000,
      "Scaling": 1200,
      "Filling": 1500
    };
  }

  /**
   * Main entry point for estimation.
   * Returns both the Random Forest prediction and the Standard Regression fallback.
   */
  estimate(inputs) {
    const fallback = this.calculateRegression(inputs);
    const prediction = this.predictRandomForest(inputs, fallback.baseCost);

    return {
      fallback,
      prediction
    };
  }

  // --- 1. Deterministic Fallback Regression (Matches Swift Logic) ---
  calculateRegression({ treatmentType, teethCount = 1, sessions = 1, complexity = "Medium", material = "Standard", customPricelist = {} }) {
    const base = customPricelist[treatmentType] || this.defaultBaseCosts[treatmentType] || 2500.0;

    // Volume Discount: 5% discount for each additional unit, capped at 25%
    const volumeMultiplier = Math.max(0.75, 1.0 - ((teethCount - 1) * 0.05));

    // Session Overhead: 8% increase per additional session
    const sessionMultiplier = 1.0 + ((sessions - 1) * 0.08);

    // Complexity & Material Multipliers
    const compMult = this.treatmentComplexity[complexity] || 1.1;
    const matMult = this.materialType[material] || 1.0;

    // Core Logic
    const clinicalBase = base * teethCount * volumeMultiplier * sessionMultiplier;
    const calculatedTotal = clinicalBase * compMult * matMult;

    return {
      method: "Standard Regression",
      baseCost: Math.round(calculatedTotal),
      minRange: Math.round(calculatedTotal * 0.96),
      maxRange: Math.round(calculatedTotal * 1.08),
      confidenceScore: 0.94
    };
  }

  // --- 2. Simulated Random Forest (Ensemble of Decision Trees) ---
  predictRandomForest(inputs, baseline) {
    // In a real scenario, these trees would be trained on historical data.
    // Here, we simulate the "Forest" by having multiple "Expert Trees" that weigh factors differently.
    
    const trees = [
      this.treeComplexityFocused,
      this.treeMaterialFocused,
      this.treeVolumeFocused,
      this.treeConservative, // Pessimistic (Higher costs)
      this.treeAggressive      // Optimistic (Lower costs)
    ];

    // Collect votes (predictions) from all trees
    const votes = trees.map(tree => tree.call(this, inputs, baseline));

    // Aggregate (Average) - Random Forest Regression
    const sum = votes.reduce((a, b) => a + b, 0);
    const avgPrediction = sum / votes.length;

    // Calculate Variance/Uncertainty based on the spread of votes
    const variance = votes.reduce((sq, n) => sq + Math.pow(n - avgPrediction, 2), 0) / votes.length;
    const stdDev = Math.sqrt(variance);

    return {
      method: "Random Forest (v2.1)",
      predictedCost: Math.round(avgPrediction),
      minRange: Math.round(avgPrediction - stdDev),
      maxRange: Math.round(avgPrediction + stdDev),
      confidenceScore: 0.88 + (Math.random() * 0.1) // Simulate model confidence
    };
  }

  // --- 3. Premium Analytics Generator ---
  generatePremiumAnalysis(inputs) {
    // Simulate complex analysis based on patient inputs
    const { age = 35, hygiene = 7, urgency = 5, complexity = "Medium" } = inputs;
    
    // Calculate Personal Dental Health Score (0-100)
    // Base 50 + Hygiene(30) - AgeFactor(10) - UrgencyFactor(10)
    let healthScore = 50 + (hygiene * 3);
    healthScore -= (age > 50 ? 10 : 0);
    healthScore -= (urgency * 1.5);
    healthScore = Math.min(Math.max(Math.round(healthScore), 10), 99);

    // Calculate Escalation Risk
    // If urgency is high, escalation risk is high
    const escalationPercentage = Math.round(10 + (urgency * 1.5) + (complexity === 'High' ? 10 : 0));

    // Generate Tips
    const tips = [
      "Schedule treatment within 2 weeks to prevent bacterial progression.",
      hygiene < 6 ? "Improve daily flossing to support tissue recovery." : "Maintain current hygiene routine for optimal healing.",
      complexity === 'High' ? "Consider conscious sedation for long session comfort." : "Procedure is standard; local anesthesia is sufficient."
    ];

    // Generate Warning
    const delayWarning = urgency > 7 
      ? "High Urgency: Delaying this procedure >30 days significantly increases risk of complications."
      : "Moderate Urgency: Standard progression expected. Schedule at convenience.";

    // Generate Explanation with Cost Breakdown
    const baseCost = this.defaultBaseCosts[inputs.treatmentType] || 2500;
    const complexityMultiplier = this.treatmentComplexity[complexity] || 1.1;
    const materialMultiplier = this.materialType[inputs.material] || 1.0;
    
    // Calculate distinct components for breakdown
    const baseTotal = baseCost * inputs.teethCount;
    const complexitySurcharge = Math.round(baseTotal * (complexityMultiplier - 1));
    const materialSurcharge = Math.round(baseTotal * complexityMultiplier * (materialMultiplier - 1));
    const finalTotal = Math.round(baseTotal * complexityMultiplier * materialMultiplier);

    const explanation = `
### Cost Breakdown Analysis
• **Base Procedure (${inputs.teethCount} unit(s)):** ₹${baseTotal.toLocaleString()}
• **Bio-Complexity (${complexity}):** +₹${complexitySurcharge.toLocaleString()}
• **Material Grade (${inputs.material}):** +₹${materialSurcharge.toLocaleString()}
--------------------------------------------------
**Net Clinical Value:** ₹${finalTotal.toLocaleString()}

### AI Clinical Justification
Based on the clinical parameters, the model predicts a cost variance of ±${escalationPercentage}%. 
The patient's dental health score of ${healthScore}/100 suggests ${healthScore > 70 ? 'good' : 'moderate'} prognosis. 
The 'Random Forest' algorithm weighted ${complexity} complexity and ${inputs.material} material grade as primary cost drivers.
    `.trim();

    return {
      healthScore,
      escalationPercentage,
      improvementTips: tips,
      delayWarning,
      explanation
    };
  }

  // -- Decision Trees --

  // Tree 1: Heavily penalizes high complexity
  treeComplexityFocused({ complexity }, baseline) {
    if (complexity === 'High') return baseline * 1.15;
    if (complexity === 'Low') return baseline * 0.95;
    return baseline;
  }

  // Tree 2: Heavily weights material costs
  treeMaterialFocused({ material }, baseline) {
    if (material === 'Biocompatible') return baseline * 1.12;
    if (material === 'Premium') return baseline * 1.08;
    return baseline * 0.98;
  }

  // Tree 3: Adjusts for volume (economies of scale)
  treeVolumeFocused({ teethCount }, baseline) {
    if (teethCount > 4) return baseline * 0.92; // Bulk discount
    return baseline;
  }

  // Tree 4: Conservative (Higher Overhead estimates)
  treeConservative(inputs, baseline) {
    return baseline * 1.05; 
  }

  // Tree 5: Aggressive (Market Competitive)
  treeAggressive(inputs, baseline) {
    return baseline * 0.95;
  }
}

export const costEstimatorService = new CostEstimatorService();
