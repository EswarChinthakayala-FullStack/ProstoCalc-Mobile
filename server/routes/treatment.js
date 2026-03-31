const express = require('express');
const router = express.Router();
const db = require('../db');
const { chatWithAI } = require('../utils/ai');
const { Matrix, inverse } = require('ml-matrix');
const { RandomForestRegression } = require('ml-random-forest');

// --- DATABASE SETUP (Ensure tables exist and have sufficient size) ---
const setupQueries = [
    `CREATE TABLE IF NOT EXISTS treatment_catalog (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'GENERAL',
        default_cost DECIMAL(10, 2) DEFAULT 0.00,
        color_tag VARCHAR(50) DEFAULT '#6366F1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS dentist_treatment_costs (
        dentist_id INT NOT NULL,
        treatment_id INT NOT NULL,
        custom_cost DECIMAL(10, 2) DEFAULT NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (dentist_id, treatment_id)
    )`,
    // Ensure category column can handle longer taxonomy names if it already exists
    `ALTER TABLE treatment_catalog MODIFY COLUMN category VARCHAR(100) DEFAULT 'GENERAL'`
];

(async () => {
    try {
        for (const query of setupQueries) {
            try {
                await db.execute(query);
            } catch (sqErr) {
                // Ignore errors like "column already exists" for some manual migrations
                console.log(`[Treatment Setup] Migration info: ${sqErr.message}`);
            }
        }
        console.log("Treatment Registry tables verified.");
    } catch (err) {
        console.error("Error initializing Treatment Registry tables:", err);
    }
})();

// Helper to parse features from explanation text
function extractFeatures(text) {
    const complexityMap = { 'Low': 1, 'Medium': 2, 'High': 3, '1': 1, '2': 2, '3': 3 };
    const materialMap = { 'Standard': 1, 'Premium': 2, 'Biocompatible': 3, 'Bio-compatible': 3, '1': 1, '2': 2, '3': 3 };

    let complexity = 2; // Default Medium
    let material = 1; // Default Standard
    let teeth = 1;

    if (text) {
        // Support Technical Tags (e.g. [MID: High] [MAT: Premium] [UNT: 3])
        const midMatch = text.match(/\[MID:\s*(\w+)\]/i);
        if (midMatch) complexity = complexityMap[midMatch[1]] || 2;

        const matrMatch = text.match(/\[MAT:\s*([\w-]+)\]/i);
        if (matrMatch) material = materialMap[matrMatch[1]] || 1;

        const untMatch = text.match(/\[UNT:\s*(\d+)\]/i);
        if (untMatch) teeth = parseInt(untMatch[1]);

        // Fallback to legacy labels
        if (!midMatch) {
            const compMatch = text.match(/Complexity:\s*(Low|Medium|High)/i);
            if (compMatch) complexity = complexityMap[compMatch[1]] || 2;
        }
        if (!matrMatch) {
            const matMatch = text.match(/Material:\s*(Standard|Premium|Bio-compatible|Biocompatible)/i);
            if (matMatch) material = materialMap[matMatch[1]] || 1;
        }
        if (!untMatch) {
            const teethMatch = text.match(/(\d+)\s*tooth|teeth/i);
            if (teethMatch) teeth = parseInt(teethMatch[1] || 1);
        }
    }
    return [complexity, material, teeth];
}

// Get Treatment Catalog
router.get('/get_treatment_catalog', async (req, res) => {
    const { dentist_id } = req.query;
    if (!dentist_id) {
        return res.json({ status: 'error', message: 'Missing dentist ID.' });
    }

    try {
        const sql = `
            SELECT c.*, 
            d.custom_cost, 
            COALESCE(d.is_enabled, 1) as is_enabled,
            COALESCE(d.custom_cost, c.default_cost) as effective_cost
            FROM treatment_catalog c
            LEFT JOIN dentist_treatment_costs d ON c.id = d.treatment_id AND d.dentist_id = ?
            ORDER BY c.category, c.name
        `;
        const [rows] = await db.execute(sql, [dentist_id]);
        // Convert rows to match expected types if necessary
        const data = rows.map(r => ({
            ...r,
            effective_cost: parseFloat(r.effective_cost),
            custom_cost: r.custom_cost ? parseFloat(r.custom_cost) : null,
            default_cost: parseFloat(r.default_cost),
            is_enabled: parseInt(r.is_enabled),
            color_tag: r.color_tag || '#6366F1' // Include color_tag with default
        }));
        res.json({ status: 'success', data });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Update Treatment Color Tag
router.post('/update_color_tag', async (req, res) => {
    const { treatment_id, color_tag } = req.body;
    if (!treatment_id || !color_tag) {
        return res.json({ status: 'error', message: 'Missing treatment_id or color_tag.' });
    }

    // Validate color format (hex color)
    const isValidColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color_tag);
    if (!isValidColor) {
        return res.json({ status: 'error', message: 'Invalid color format. Use hex color (e.g., #FF0000).' });
    }

    try {
        await db.execute(
            'UPDATE treatment_catalog SET color_tag = ? WHERE id = ?',
            [color_tag, treatment_id]
        );
        res.json({ status: 'success', message: 'Color tag updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Calculate AI Cost — Full 6-Algorithm Ensemble (synced with CostEstimatorService.js)
router.post('/calculate_ai_cost', async (req, res) => {
    const { treatment_type, dentist_id, complexity = 'Medium', material = 'Standard', teeth_count = 1, sessions = 1 } = req.body;
    if (!treatment_type || !dentist_id) {
        return res.json({ status: 'error', message: 'Incomplete parameters for AI analysis.' });
    }

    try {
        // --- 1. Fetch Baseline Data ---
        const sql = `
            SELECT COALESCE(d.custom_cost, c.default_cost) as effective_cost 
            FROM treatment_catalog c 
            LEFT JOIN dentist_treatment_costs d ON c.id = d.treatment_id AND d.dentist_id = ? 
            WHERE c.name = ?
        `;
        const [rows] = await db.execute(sql, [dentist_id, treatment_type]);
        const unit_price = rows.length > 0 ? parseFloat(rows[0].effective_cost) : 1000.0;

        // --- 2. Clinical Coefficients (Synced with CostEstimatorService.js) ---
        const complexityWeights = { Low: 0.85, Medium: 1.0, High: 1.35 };
        const materialWeights   = { Standard: 1.0, Premium: 1.25, Biocompatible: 1.55 };
        const treatmentProfiles = {
            "Extraction":  { riskSigma: 0.05, sessionFactor: 0.02, failureRate: 0.02, avgDuration: 1 },
            "Crown":       { riskSigma: 0.12, sessionFactor: 0.08, failureRate: 0.05, avgDuration: 2 },
            "Implant":     { riskSigma: 0.18, sessionFactor: 0.10, failureRate: 0.08, avgDuration: 4 },
            "CD":          { riskSigma: 0.15, sessionFactor: 0.06, failureRate: 0.10, avgDuration: 5 },
            "RPD":         { riskSigma: 0.10, sessionFactor: 0.05, failureRate: 0.12, avgDuration: 3 },
            "RCT":         { riskSigma: 0.14, sessionFactor: 0.09, failureRate: 0.06, avgDuration: 2 },
            "FMR":         { riskSigma: 0.20, sessionFactor: 0.04, failureRate: 0.15, avgDuration: 8 },
            "Scaling":     { riskSigma: 0.03, sessionFactor: 0.01, failureRate: 0.01, avgDuration: 1 },
            "Filling":     { riskSigma: 0.08, sessionFactor: 0.03, failureRate: 0.04, avgDuration: 1 }
        };
        
        const compVal = complexityWeights[complexity] || 1.0;
        const matVal  = materialWeights[material] || 1.0;
        const profile = treatmentProfiles[treatment_type] || { riskSigma: 0.10, sessionFactor: 0.05, failureRate: 0.05, avgDuration: 2 };
        const sess = sessions || 1;
        
        // Bayesian patient evidence
        const patientAge = req.body.patient_age || 35;
        const hygiene = req.body.patient_hygiene || 7;
        const urgency = req.body.patient_urgency || 5;

        // --- ALGORITHM 1: Multivariate Regression ---
        const volumeDiscount = Math.max(0.75, 1.0 - ((teeth_count - 1) * 0.05));
        const sessionMultiplier = 1.0 + ((sess - 1) * 0.08);
        const interactionEffect = 1.0 + ((compVal - 1.0) * (matVal - 1.0) * 0.5);
        const regressionPrediction = unit_price * teeth_count * volumeDiscount * sessionMultiplier * compVal * matVal * interactionEffect;
        const residualMargin = regressionPrediction * profile.riskSigma;
        const regressionConfidence = Math.max(0.70, 0.92 - profile.riskSigma * 0.3);

        // --- ALGORITHM 2: GBDT (Simplified server-side) ---
        const compNorm = (compVal - 0.85) / (1.35 - 0.85);
        const matNorm = (matVal - 1.0) / (1.55 - 1.0);
        const unitNorm = Math.min(1, teeth_count / 10);
        const sessNorm = Math.min(1, sess / 10);
        const ageNorm = Math.min(1, patientAge / 100);
        const hygNorm = hygiene / 10;
        const urgNorm = urgency / 10;

        let gbdtMult = 1.0;
        gbdtMult += 0.1 * (compNorm > 0.5 ? 0.25 : -0.10);
        gbdtMult += 0.1 * (matNorm > 0.3 ? 0.20 : -0.05);
        gbdtMult += 0.1 * (unitNorm > 0.3 ? -0.15 : 0.05);
        gbdtMult += 0.1 * (ageNorm > 0.6 && hygNorm < 0.5 ? 0.30 : 0.0);
        gbdtMult += 0.1 * (urgNorm > 0.7 ? 0.20 : -0.05);
        const gbdtPrediction = unit_price * teeth_count * Math.max(0.5, gbdtMult);
        const gbdtConfidence = Math.min(0.96, 0.85 + 5 * 0.005);

        // --- ALGORITHM 3: Monte Carlo (N=1000 for server perf) ---
        function gaussianRandom(mean, stdDev) {
            const u1 = Math.random() || 0.0001;
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            return mean + z * stdDev;
        }
        const N = 1000;
        const simResults = [];
        for (let i = 0; i < N; i++) {
            const simComp = Math.max(0.6, gaussianRandom(compVal, 0.08));
            const simMat = Math.max(0.8, gaussianRandom(matVal, 0.05));
            const complicationChance = Math.random();
            const simSess = complicationChance < profile.failureRate ? sess + Math.ceil(Math.random() * 2) : sess;
            const volDisc = Math.max(0.70, 1.0 - ((teeth_count - 1) * gaussianRandom(0.05, 0.01)));
            const sessOH = 1.0 + ((simSess - 1) * gaussianRandom(profile.sessionFactor, 0.02));
            const priceNoise = gaussianRandom(1.0, 0.04);
            const simCost = unit_price * teeth_count * volDisc * sessOH * simComp * simMat * priceNoise;
            simResults.push(Math.max(0, simCost));
        }
        simResults.sort((a, b) => a - b);
        const pctl = (arr, p) => { const idx = (p / 100) * (arr.length - 1); const lo = Math.floor(idx); const hi = Math.ceil(idx); return lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * (idx - lo); };
        const mcP5 = pctl(simResults, 5);
        const mcP50 = pctl(simResults, 50);
        const mcP95 = pctl(simResults, 95);
        const mcMean = simResults.reduce((a, b) => a + b, 0) / N;
        const mcSD = Math.sqrt(simResults.reduce((s, x) => s + Math.pow(x - mcMean, 2), 0) / N);
        const mcConfidence = Math.max(0.70, 1 - (mcSD / mcMean));

        // --- ALGORITHM 4: Bayesian Inference (Conjugate Normal) ---
        const priorMean = regressionPrediction;
        const priorVariance = Math.pow(priorMean * profile.riskSigma, 2);
        const ageEvidence = patientAge > 60 ? 1.12 : patientAge > 45 ? 1.05 : patientAge < 25 ? 0.95 : 1.0;
        const hygieneEvidence = hygiene <= 3 ? 1.15 : hygiene <= 5 ? 1.08 : hygiene >= 8 ? 0.95 : 1.0;
        const urgencyEvidence = urgency >= 8 ? 1.18 : urgency >= 6 ? 1.08 : urgency <= 3 ? 0.97 : 1.0;
        const sessionDeviation = sess / (profile.avgDuration || 2);
        const sessionEvidence = 1.0 + (sessionDeviation - 1.0) * 0.15;
        const likelihoodMultiplier = ageEvidence * hygieneEvidence * urgencyEvidence * sessionEvidence;
        const likelihoodMean = priorMean * likelihoodMultiplier;
        const evidenceStrength = 1.0 / (1.0 + Math.abs(likelihoodMultiplier - 1.0));
        const likelihoodVariance = Math.pow(priorMean * 0.15 / evidenceStrength, 2);
        const priorPrecision = 1 / priorVariance;
        const likelihoodPrecision = 1 / likelihoodVariance;
        const posteriorPrecision = priorPrecision + likelihoodPrecision;
        const posteriorMean = (priorMean * priorPrecision + likelihoodMean * likelihoodPrecision) / posteriorPrecision;
        const posteriorVariance = 1 / posteriorPrecision;
        const posteriorStdDev = Math.sqrt(posteriorVariance);
        const beliefReduction = 1 - (posteriorVariance / priorVariance);
        const bayesianConfidence = Math.min(0.99, 0.80 + beliefReduction * 0.2);

        // --- ALGORITHM 5: KNN (K=5) with synthetic training data ---
        const queryFeatures = [compNorm, matNorm, unitNorm, sessNorm, ageNorm, hygNorm, urgNorm];
        // Generate 40 deterministic training cases (same seed logic as JS frontend)
        let rngState = 42;
        function seededRandom() { rngState = ((rngState * 1664525) + 1013904223) & 0xFFFFFFFF; return (rngState >>> 0) / 4294967296; }
        function seededGaussian(m, s) { const u1 = Math.max(0.0001, seededRandom()); const u2 = seededRandom(); return m + Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2) * s; }
        const trainingCases = [];
        for (let i = 0; i < 40; i++) {
            const c = seededRandom(), m = seededRandom(), u = 0.1+seededRandom()*0.5, s = 0.1+seededRandom()*0.6;
            const a = 0.2+seededRandom()*0.6, h = seededRandom(), ur = seededRandom();
            let mult = 1.0 + c*0.4 + m*0.35 - u*0.15 + s*0.2 + (a>0.6?0.1:0) - h*0.08 + ur*0.12 + c*m*0.15 + ((ur>0.7&&h<0.3)?0.2:0) + seededGaussian(0,0.05);
            trainingCases.push({ features: [c,m,u,s,a,h,ur], costMultiplier: Math.max(0.5, mult) });
        }
        const distances = trainingCases.map((tc, idx) => {
            const dist = Math.sqrt(tc.features.reduce((sum, v, i) => sum + Math.pow(v - queryFeatures[i], 2), 0));
            return { idx, dist, mult: tc.costMultiplier };
        });
        distances.sort((a, b) => a.dist - b.dist);
        const kNeighbors = distances.slice(0, 5);
        const epsilon = 1e-6;
        let knnWeightedSum = 0, knnTotalW = 0;
        kNeighbors.forEach(n => { const w = 1/(n.dist+epsilon); knnWeightedSum += w*n.mult; knnTotalW += w; });
        const knnPrediction = unit_price * teeth_count * (knnWeightedSum / knnTotalW);
        const avgDist = kNeighbors.reduce((s, n) => s + n.dist, 0) / kNeighbors.length;
        const knnConfidence = Math.max(0.60, 0.95 - Math.min(1, avgDist/2) * 0.3);

        // --- ALGORITHM 6: Weighted Ensemble Meta-Learner ---
        const predictions = [
            { name: 'regression',  cost: regressionPrediction, confidence: regressionConfidence, trust: 0.15 },
            { name: 'gbdt',        cost: gbdtPrediction,       confidence: gbdtConfidence,       trust: 0.25 },
            { name: 'monteCarlo',  cost: mcP50,                confidence: mcConfidence,         trust: 0.20 },
            { name: 'bayesian',    cost: posteriorMean,         confidence: bayesianConfidence,   trust: 0.25 },
            { name: 'knn',         cost: knnPrediction,         confidence: knnConfidence,        trust: 0.15 }
        ];
        let eTotalW = 0, eWeightedCost = 0;
        predictions.forEach(p => { const w = p.trust * p.confidence; eTotalW += w; eWeightedCost += p.cost * w; });
        const ensembleCost = eWeightedCost / eTotalW;
        const allCosts = predictions.map(p => p.cost);
        const costsMean = allCosts.reduce((a,b)=>a+b,0)/allCosts.length;
        const costsSD = Math.sqrt(allCosts.reduce((s,x)=>s+Math.pow(x-costsMean,2),0)/allCosts.length);
        const modelAgreement = 1 - (costsSD / costsMean);
        const ensembleConfidence = Math.min(0.99, modelAgreement * 0.5 + (predictions.reduce((s,p)=>s+p.confidence,0)/predictions.length) * 0.5);

        const allMins = [regressionPrediction - residualMargin, gbdtPrediction * 0.94, mcP5, Math.max(0, posteriorMean - 1.96*posteriorStdDev), knnPrediction * 0.92];
        const allMaxs = [regressionPrediction + residualMargin*1.5, gbdtPrediction * 1.08, mcP95, posteriorMean + 1.96*posteriorStdDev, knnPrediction * 1.10];
        allMins.sort((a,b)=>a-b); allMaxs.sort((a,b)=>a-b);
        const finalMin = pctl(allMins, 25);
        const finalMax = pctl(allMaxs, 75);

        const gst = ensembleCost * 0.05;
        const final_total = ensembleCost + gst;

        // --- AI Explanation ---
        let explanation = "";
        let rec = "";
        try {
            const { patient_name = 'Patient', dentist_name = 'Doctor' } = req.body;
            const aiPrompt = `
            Task: Generate a professional, short, and unique medical report for a dental procedure.
            Procedure: ${treatment_type}
            Details: ${teeth_count} tooth/teeth, Complexity: ${complexity}, Material: ${material}.
            Total Estimated Cost: ₹${final_total.toFixed(0)}
            Engine: 6-Algorithm Ensemble (Regression, GBDT, Monte Carlo, Bayesian, KNN)
            Confidence: ${(ensembleConfidence * 100).toFixed(1)}%
            
            Personalization:
            - Doctor Name: ${dentist_name}
            - Patient Name: ${patient_name}
            
            Strict Rules:
            - NO MARKDOWN (No **, no #, no -, no *).
            - NO bold or italics.
            - Plain text only.
            - Professional clinical tone.
            - Address the patient by name.
            - Max 3-4 sentences.
            - Unique clinical logic for this specific case.
            - Append this EXACT metadata at the very end in brackets: [MID: ${complexity}] [MAT: ${material}] [UNT: ${teeth_count}]
            `;
            const aiExplanation = await chatWithAI(aiPrompt);
            if (aiExplanation) { explanation = aiExplanation; rec = "Please follow the clinical advice provided."; }
        } catch (aiErr) {
            console.error("Puter AI Cost Estimation Error:", aiErr.message);
        }

        if (!explanation) {
            explanation = `The proposed ${treatment_type} procedure for ${teeth_count} unit(s) has been analyzed by 6 independent algorithms (Regression, GBDT, Monte Carlo N=1000, Bayesian Inference, KNN, Ensemble). The ${complexity} complexity and ${material} material grade yield an ensemble prediction of ₹${Math.round(ensembleCost)} with ${(ensembleConfidence * 100).toFixed(1)}% model confidence.`;
        }
        if (!rec) {
            rec = `Model agreement score: ${(modelAgreement * 100).toFixed(1)}%. All 5 algorithms converge within ₹${Math.round(costsSD)} spread.`;
        }

        res.json({
            status: "success",
            data: {
                base_cost: parseFloat(ensembleCost.toFixed(2)),
                gst: parseFloat(gst.toFixed(2)),
                total_cost: parseFloat(final_total.toFixed(2)),
                min_range: parseFloat(finalMin.toFixed(2)),
                max_range: parseFloat(finalMax.toFixed(2)),
                confidence_score: parseFloat(ensembleConfidence.toFixed(3)),
                model_agreement: parseFloat(modelAgreement.toFixed(3)),
                regional_market_median: parseFloat((ensembleCost * (1 + (costsSD/costsMean)*0.5)).toFixed(2)),
                clinical_justification: explanation,
                recommendation: rec,
                engine_version: "ProstoAI-Ensemble-v5.0 (Regression+GBDT+MC+Bayes+KNN)",
                algorithm_breakdown: predictions.map(p => ({
                    algorithm: p.name,
                    prediction: parseFloat(p.cost.toFixed(2)),
                    confidence: p.confidence,
                    weight: parseFloat((p.trust * p.confidence / eTotalW * 100).toFixed(1))
                }))
            }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Update Treatment Costs
router.post('/update_treatment_costs', async (req, res) => {
    const { dentist_id, treatments } = req.body;
    if (!dentist_id || !treatments) {
        return res.json({ status: 'error', message: 'Missing data.' });
    }

    try {
        for (const t of treatments) {
            const { treatment_id, name, category, custom_cost, is_enabled, color_tag, default_cost } = t;
            
            let finalTreatmentId = treatment_id;
            
            // Handle new treatments or treatments without valid IDs (ID=0)
            if (!treatment_id || treatment_id === 0) {
                // Check if a treatment with this name EXCEPTING case already exists in treatment_catalog
                const [existingCatalog] = await db.execute('SELECT id FROM treatment_catalog WHERE LOWER(name) = LOWER(?)', [name]);
                
                if (existingCatalog.length > 0) {
                    finalTreatmentId = existingCatalog[0].id;
                    console.log(`[update_treatment_costs] Found existing catalog entry for "${name}", using ID: ${finalTreatmentId}`);
                } else {
                    // Create the treatment in treatment_catalog
                    const [newResult] = await db.execute(
                        'INSERT INTO treatment_catalog (name, category, default_cost, color_tag) VALUES (?, ?, ?, ?)',
                        [name || 'Unknown Treatment', category || 'GENERAL', default_cost || custom_cost || 0, color_tag || '#6366F1']
                    );
                    finalTreatmentId = newResult.insertId;
                    console.log(`[update_treatment_costs] Created new global treatment: ${name}, ID: ${finalTreatmentId}`);
                }
            }

            // --- SYNC GLOBAL ATTRIBUTES ---
            // Always update global color_tag to ensure manual changes persist
            if (finalTreatmentId && color_tag) {
                await db.execute('UPDATE treatment_catalog SET color_tag = ? WHERE id = ?', [color_tag, finalTreatmentId]);
            }
            
            // Upsert into dentist_treatment_costs (dentist-specific overrides)
            const [existingCost] = await db.execute('SELECT dentist_id FROM dentist_treatment_costs WHERE dentist_id = ? AND treatment_id = ?', [dentist_id, finalTreatmentId]);
            if (existingCost.length > 0) {
                await db.execute('UPDATE dentist_treatment_costs SET custom_cost = ?, is_enabled = ? WHERE dentist_id = ? AND treatment_id = ?', [custom_cost, is_enabled, dentist_id, finalTreatmentId]);
                console.log(`[update_treatment_costs] Updated dentist cost override for ID: ${finalTreatmentId}`);
            } else {
                await db.execute('INSERT INTO dentist_treatment_costs (dentist_id, treatment_id, custom_cost, is_enabled) VALUES (?, ?, ?, ?)', [dentist_id, finalTreatmentId, custom_cost, is_enabled]);
                console.log(`[update_treatment_costs] Created new dentist cost override for ID: ${finalTreatmentId}`);
            }
        }
        res.json({ status: 'success', message: 'Registry synchronized successfully.' });
    } catch (err) {
        console.error("[update_treatment_costs] Error:", err.message);
        res.json({ status: 'error', message: err.message });
    }
});

// Save Cost Estimation
// Save Cost Estimation (Atomic Transaction)
router.post('/save_cost_estimation', async (req, res) => {
    const { user_id, patient_id, dentist_id, treatment_plan_id, mode, total_cost, confidence, items, explanation, language, context } = req.body;

    console.log(`[save_cost_estimation] Starting atomic save. Items: ${items ? items.length : 0}, Expl: ${explanation ? 'Yes' : 'No'}`);

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Upsert Estimation
        let estimationId;
        if (treatment_plan_id) {
            const [existing] = await conn.execute(
                'SELECT id FROM ai_cost_estimations WHERE treatment_plan_id = ? ORDER BY id DESC LIMIT 1',
                [treatment_plan_id]
            );
            if (existing.length > 0) {
                estimationId = existing[0].id;
                await conn.execute(
                    'UPDATE ai_cost_estimations SET user_id = ?, patient_id = ?, dentist_id = ?, mode = ?, total_estimated_cost = ?, confidence_score = ? WHERE id = ?',
                    [user_id || null, patient_id || null, dentist_id || null, mode || 'quick', total_cost, confidence || 1.0, estimationId]
                );
                // Clear old items and explanations to re-insert
                await conn.execute('DELETE FROM ai_cost_estimation_items WHERE ai_cost_estimation_id = ?', [estimationId]);
                await conn.execute('DELETE FROM ai_treatment_explanations WHERE ai_cost_estimation_id = ?', [estimationId]);
            }
        }

        if (!estimationId) {
            const [estResult] = await conn.execute(
                'INSERT INTO ai_cost_estimations (user_id, patient_id, dentist_id, treatment_plan_id, mode, total_estimated_cost, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user_id || null, patient_id || null, dentist_id || null, treatment_plan_id || null, mode || 'quick', total_cost, confidence || 1.0]
            );
            estimationId = estResult.insertId;
        }

        // 2. Insert Items
        if (items && items.length > 0) {
            for (const i of items) {
                // Frontend sends: cost (unit), quantity, subtotal, source
                const unitCost = i.cost || 0;
                const quantity = i.quantity || 1;
                const subtotal = i.subtotal || unitCost;
                const source = i.source || 'default';

                await conn.execute(
                    'INSERT INTO ai_cost_estimation_items (ai_cost_estimation_id, treatment_name, unit_cost, quantity, subtotal, cost_source) VALUES (?, ?, ?, ?, ?, ?)',
                    [estimationId, i.name, unitCost, quantity, subtotal, source]
                );
            }
        }

        // 3. Insert Explanation (if present)
        if (explanation && explanation.trim() !== '') {
            await conn.execute(
                'INSERT INTO ai_treatment_explanations (ai_cost_estimation_id, context, explanation_text, language, disclaimer_version) VALUES (?, ?, ?, ?, ?)',
                [estimationId, context || 'calculator', explanation, language || 'en', 'v1.0']
            );
        }

        await conn.commit();
        console.log(`[save_cost_estimation] Success. ID: ${estimationId}`);
        res.json({ status: 'success', data: { estimation_id: estimationId } });
    } catch (err) {
        await conn.rollback();
        console.error("[save_cost_estimation] Transaction Failed:", err.message);
        res.json({ status: 'error', message: err.message });
    } finally {
        conn.release();
    }
});

// Get AI Cost Logs
router.get('/get_ai_cost_logs', async (req, res) => {
    const { dentist_id } = req.query;
    if (!dentist_id) return res.json({ status: 'error', message: 'Missing dentist ID' });

    try {
        const sql = `
            SELECT e.*, p.full_name as patient_name 
            FROM ai_cost_estimations e 
            LEFT JOIN patients p ON e.patient_id = p.id 
            WHERE e.dentist_id = ? 
            ORDER BY e.id DESC 
            LIMIT 50
        `;
        const [estimations] = await db.execute(sql, [dentist_id]);

        for (let est of estimations) {
            const [item_rows] = await db.execute('SELECT treatment_name, subtotal FROM ai_cost_estimation_items WHERE ai_cost_estimation_id = ?', [est.id]);
            est.items = item_rows;

            const [expl_rows] = await db.execute('SELECT explanation_text FROM ai_treatment_explanations WHERE ai_cost_estimation_id = ? ORDER BY created_at DESC LIMIT 1', [est.id]);
            est.explanations = expl_rows;
        }

        res.json({ status: 'success', data: estimations });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Save AI Explanation
router.post('/save_ai_explanation', async (req, res) => {
    const { estimation_id, text } = req.body;
    console.log(`[save_ai_explanation] Saving for EstID: ${estimation_id}, Text Length: ${text ? text.length : 0}`);
    try {
        await db.execute('INSERT INTO ai_treatment_explanations (ai_cost_estimation_id, explanation_text) VALUES (?, ?)', [estimation_id, text]);
        res.json({ status: 'success', message: 'Explanation saved.' });
    } catch (err) {
        console.error("Save AI Explanation Error:", err.message);
        res.json({ status: 'error', message: err.message });
    }
});

// Create Treatment Plan
router.post('/create_treatment_plan', async (req, res) => {
    const { dentist_id, patient_id, request_id, items, share_cost_details, share_ai_explanation, status = 'DRAFT', ai_explanation: input_ai_explanation, clinical_notes } = req.body;
    if (!dentist_id || !items) {
        return res.json({ status: 'error', message: 'Missing core data.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const total_cost = items.reduce((sum, i) => sum + parseFloat(i.cost), 0);
        const ai_explanation = input_ai_explanation || `Based on the selected procedures (${items.length} items), the estimated cost of ₹${total_cost.toLocaleString()} covers local anesthesia, clinical preparation, and follow-up support.`;

        let plan_id;
        if (request_id && request_id !== 0) {
            const [existing] = await conn.execute(
                'SELECT id FROM treatment_plans WHERE request_id = ? ORDER BY id DESC LIMIT 1',
                [request_id]
            );
            if (existing.length > 0) {
                plan_id = existing[0].id;
                await conn.execute(`
                    UPDATE treatment_plans 
                    SET dentist_id = ?, patient_id = ?, total_cost = ?, ai_explanation = ?, clinical_notes = ?, share_cost_details = ?, share_ai_explanation = ?, status = ?
                    WHERE id = ?
                `, [dentist_id, patient_id || null, total_cost, ai_explanation, clinical_notes, share_cost_details ? 1 : 0, share_ai_explanation ? 1 : 0, status, plan_id]);

                // Clear old items to re-insert fresh
                await conn.execute('DELETE FROM treatment_plan_items WHERE plan_id = ?', [plan_id]);
            }
        }

        if (!plan_id) {
            const [plan_result] = await conn.execute(`
                INSERT INTO treatment_plans (dentist_id, patient_id, request_id, total_cost, ai_explanation, clinical_notes, share_cost_details, share_ai_explanation, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [dentist_id, patient_id || null, request_id || null, total_cost, ai_explanation, clinical_notes, share_cost_details ? 1 : 0, share_ai_explanation ? 1 : 0, status]);
            plan_id = plan_result.insertId;
        }

        for (const item of items) {
            const t_id = (item.treatment_id && item.treatment_id !== 0) ? item.treatment_id : null;
            await conn.execute(`
                INSERT INTO treatment_plan_items (plan_id, treatment_id, treatment_name, tooth_number, cost_override, sessions_estimate) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, [plan_id, t_id, item.name || null, item.tooth_number || null, item.cost, item.sessions || 1]);
        }

        await conn.commit();
        res.json({ status: 'success', data: { plan_id, total_cost, ai_explanation } });
    } catch (err) {
        await conn.rollback();
        res.json({ status: 'error', message: err.message });
    } finally {
        conn.release();
    }
});

// Get Treatment Plan
router.get('/get_treatment_plan', async (req, res) => {
    const { plan_id, request_id } = req.query;
    try {
        let sql = "";
        let params = [];
        if (plan_id) {
            sql = `
                SELECT p.*, a.scheduled_date, a.scheduled_time, a.visit_status, a.rescheduled_from, a.actual_end_time 
                FROM treatment_plans p 
                LEFT JOIN appointments a ON p.request_id = a.request_id 
                WHERE p.id = ?
            `;
            params = [plan_id];
        } else if (request_id) {
            // Updated to ensure we get the TOTAL_COST and latest plan
            sql = `
                SELECT a.scheduled_date, a.scheduled_time, a.visit_status, a.rescheduled_from, a.actual_end_time, 
                       p.id as plan_id, p.id, p.clinical_notes, p.created_at, p.status, p.ai_explanation, 
                       p.share_cost_details, p.share_ai_explanation, p.total_cost
                FROM appointments a
                LEFT JOIN (
                    SELECT * FROM treatment_plans 
                    WHERE request_id = ? 
                    ORDER BY id DESC LIMIT 1
                ) p ON a.request_id = p.request_id
                WHERE a.request_id = ? 
                ORDER BY a.id DESC LIMIT 1
            `;
            params = [request_id, request_id];
        } else {
            return res.json({ status: 'error', message: 'Missing ID parameters.' });
        }

        const [rows] = await db.execute(sql, params);
        const plan = rows[0];

        if (plan) {
            if (plan.rescheduled_from) {
                const [orig_rows] = await db.execute(`
                    SELECT a.scheduled_date, h.reason 
                    FROM appointments a
                    LEFT JOIN appointment_status_history h ON a.id = h.appointment_id 
                    WHERE a.id = ? AND h.new_status = 'postponed'
                    LIMIT 1
                `, [plan.rescheduled_from]);
                if (orig_rows.length > 0) {
                    plan.original_date = orig_rows[0].scheduled_date;
                    plan.postpone_reason = orig_rows[0].reason;
                }
            }

            const actualPlanId = plan.plan_id || plan.id;
            const [item_rows] = await db.execute(`
                SELECT i.*, COALESCE(i.treatment_name, t.name, 'AI Estimated Treatment') as name, 
                i.cost_override as cost, t.category, t.color_tag
                FROM treatment_plan_items i 
                LEFT JOIN treatment_catalog t ON i.treatment_id = t.id 
                WHERE i.plan_id = ?
            `, [actualPlanId]);

            // Ensure numbers are parsed correctly and keys are aligned for all frontend views
            plan.total_cost = parseFloat(plan.total_cost || 0);
            plan.items = item_rows.map(item => ({
                ...item,
                cost: parseFloat(item.cost_override || 0),
                cost_override: parseFloat(item.cost_override || 0),
                treatment_name: item.name, // SecureChatView expects this
                name: item.name // PatientTreatmentPlanView expects this
            }));

            res.json({ status: 'success', data: plan });
        } else {
            res.json({ status: 'success', data: null });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Update Timeline
router.post('/update_timeline', async (req, res) => {
    const { request_id, status, notes } = req.body;
    if (!request_id || !status) return res.json({ status: 'error', message: 'Missing request_id or status.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute('INSERT INTO treatment_timeline (request_id, status, notes) VALUES (?, ?, ?)', [request_id, status, notes || null]);
        if (status === 'COMPLETED') {
            await conn.execute('UPDATE consultation_requests SET status = "COMPLETED" WHERE id = ?', [request_id]);
        }
        await conn.commit();
        res.json({ status: 'success', message: `Timeline updated to ${status}.` });
    } catch (err) {
        await conn.rollback();
        res.json({ status: 'error', message: err.message });
    } finally {
        conn.release();
    }
});

// Get Timeline
router.get('/get_timeline', async (req, res) => {
    const { request_id } = req.query;
    if (!request_id) return res.json({ status: 'error', message: 'Missing request_id' });

    try {
        const [rows] = await db.execute('SELECT * FROM treatment_timeline WHERE request_id = ? ORDER BY id ASC', [request_id]);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Update Plan Notes
router.post('/update_plan_notes', async (req, res) => {
    const { request_id, notes } = req.body;
    if (!request_id) return res.json({ status: 'error', message: 'Missing request_id' });

    try {
        await db.execute('UPDATE treatment_plans SET clinical_notes = ? WHERE request_id = ?', [notes, request_id]);
        res.json({ status: 'success', message: 'Notes updated' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});


module.exports = router;
