const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── Modular Risk Calculation Engine ───
// This function is isolated so it can later be replaced by
// logistic regression, XGBoost, or a neural model.
function calculateHabitRisk(data) {
    let risk = 1.0;

    // Tobacco Factor
    risk += (data.tobacco_per_day || 0) * 0.1;
    risk += (data.tobacco_years || 0) * 0.05;

    // Areca Factor
    risk += (data.areca_per_day || 0) * 0.15;
    risk += (data.areca_years || 0) * 0.07;

    // Alcohol Factor
    if (data.alcohol) risk += 0.3;

    // Mouth Opening Factor
    if (data.mouth_opening_mm && data.mouth_opening_mm < 25) risk += 0.5;

    const fibrosisRiskPercent = Math.min(parseFloat((risk * 20).toFixed(1)), 95);

    let counselingLevel = "Low";
    if (fibrosisRiskPercent > 40) counselingLevel = "Moderate";
    if (fibrosisRiskPercent > 65) counselingLevel = "Intensive";

    return {
        riskMultiplier: parseFloat(risk.toFixed(2)),
        fibrosisRiskPercent,
        counselingLevel
    };
}

// Simulate risk at different usage levels (for graph)
function simulateReduction(data) {
    const simulations = [];
    const tobaccoMax = data.tobacco_per_day || 0;
    const arecaMax = data.areca_per_day || 0;

    // Simulate: current, 75%, 50%, 25%, 0%
    const reductionLevels = [1.0, 0.75, 0.5, 0.25, 0.0];

    for (const level of reductionLevels) {
        const simData = {
            ...data,
            tobacco_per_day: Math.round(tobaccoMax * level),
            areca_per_day: Math.round(arecaMax * level)
        };
        const result = calculateHabitRisk(simData);
        simulations.push({
            label: level === 1.0 ? "Current" : level === 0 ? "Zero Usage" : `${Math.round(level * 100)}%`,
            tobacco_per_day: simData.tobacco_per_day,
            areca_per_day: simData.areca_per_day,
            fibrosis_risk_percent: result.fibrosisRiskPercent,
            risk_multiplier: result.riskMultiplier,
            counseling_level: result.counselingLevel
        });
    }

    return simulations;
}

// ─── POST /analyze_habit_risk ───
// Full analysis endpoint for Dentists
router.post('/analyze_habit_risk', async (req, res) => {
    const {
        patient_id,
        dentist_id,
        tobacco_per_day = 0,
        tobacco_years = 0,
        areca_per_day = 0,
        areca_years = 0,
        alcohol = false,
        mouth_opening_mm = 0,
        current_grade = ''
    } = req.body;

    if (!patient_id) {
        return res.json({ status: 'error', message: 'Missing patient_id.' });
    }

    try {
        const inputData = {
            tobacco_per_day: parseInt(tobacco_per_day),
            tobacco_years: parseInt(tobacco_years),
            areca_per_day: parseInt(areca_per_day),
            areca_years: parseInt(areca_years),
            alcohol: !!alcohol,
            mouth_opening_mm: parseFloat(mouth_opening_mm),
            current_grade
        };

        // Calculate risk
        const result = calculateHabitRisk(inputData);

        // Generate reduction simulations
        const simulations = simulateReduction(inputData);

        // Store in database (with dentist_id)
        await db.execute(
            `INSERT INTO habit_risk_analysis 
            (patient_id, dentist_id, tobacco_per_day, tobacco_years, areca_per_day, areca_years, 
             alcohol, mouth_opening_mm, current_grade, calculated_risk_multiplier, 
             fibrosis_risk_percent, counseling_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patient_id,
                dentist_id || null,
                inputData.tobacco_per_day,
                inputData.tobacco_years,
                inputData.areca_per_day,
                inputData.areca_years,
                inputData.alcohol ? 1 : 0,
                inputData.mouth_opening_mm,
                inputData.current_grade,
                result.riskMultiplier,
                result.fibrosisRiskPercent,
                result.counselingLevel
            ]
        );

        res.json({
            status: 'success',
            data: {
                risk_multiplier: result.riskMultiplier,
                fibrosis_risk_percent: result.fibrosisRiskPercent,
                counseling_level: result.counselingLevel,
                simulations
            }
        });
    } catch (err) {
        console.error('[HabitRisk] Error:', err.message);
        res.json({ status: 'error', message: err.message });
    }
});

// ─── GET /get_habit_risk_history ───
// Get historical risk analyses for a patient (scoped to dentist)
router.get('/get_habit_risk_history', async (req, res) => {
    const { patient_id, dentist_id } = req.query;
    if (!patient_id) {
        return res.json({ status: 'error', message: 'Missing patient_id.' });
    }

    try {
        let query = `SELECT h.*, p.full_name as patient_name 
             FROM habit_risk_analysis h
             LEFT JOIN patients p ON h.patient_id = p.id
             WHERE h.patient_id = ?`;
        const params = [patient_id];

        // If dentist_id provided, scope to that dentist's analyses
        if (dentist_id) {
            query += ` AND h.dentist_id = ?`;
            params.push(dentist_id);
        }

        query += ` ORDER BY h.created_at DESC`;

        const [rows] = await db.execute(query, params);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// ─── GET /get_patient_habit_summary ───
// Simplified patient-facing summary (no multiplier)
router.get('/get_patient_habit_summary', async (req, res) => {
    const { patient_id } = req.query;
    if (!patient_id) {
        return res.json({ status: 'error', message: 'Missing patient_id.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT * FROM habit_risk_analysis 
             WHERE patient_id = ? 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [patient_id]
        );

        if (rows.length === 0) {
            return res.json({ status: 'success', data: null });
        }

        const latest = rows[0];

        // Calculate zero-use scenario for patient message
        const zeroUseData = {
            tobacco_per_day: 0,
            tobacco_years: latest.tobacco_years,
            areca_per_day: 0,
            areca_years: latest.areca_years,
            alcohol: false,
            mouth_opening_mm: latest.mouth_opening_mm,
            current_grade: latest.current_grade
        };
        const zeroResult = calculateHabitRisk(zeroUseData);

        const currentRisk = latest.fibrosis_risk_percent;
        const zeroRisk = zeroResult.fibrosisRiskPercent;
        const reductionMin = Math.round(currentRisk - zeroRisk - 5);
        const reductionMax = Math.round(currentRisk - zeroRisk + 5);

        // Build patient-friendly messages
        const messages = [];

        if (latest.areca_per_day > 0) {
            messages.push(`Reducing areca nut from ${latest.areca_per_day}/day to 0 can reduce fibrosis risk by approximately ${Math.max(reductionMin, 5)}–${reductionMax}%.`);
        }

        if (latest.tobacco_per_day > 0) {
            messages.push(`Cutting tobacco use from ${latest.tobacco_per_day}/day to 0 significantly lowers your oral health risks.`);
        }

        if (latest.alcohol) {
            messages.push("Avoiding alcohol further reduces tissue damage and fibrosis progression.");
        }

        res.json({
            status: 'success',
            data: {
                current_risk_percent: currentRisk,
                zero_use_risk_percent: zeroRisk,
                potential_reduction_min: Math.max(reductionMin, 5),
                potential_reduction_max: reductionMax,
                counseling_level: latest.counseling_level,
                messages,
                last_analyzed: latest.created_at
            }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// ─── GET /get_all_habit_risk_history ───
// Get all historical risk analyses for a specific dentist (dentist dashboard)
router.get('/get_all_habit_risk_history', async (req, res) => {
    const { dentist_id } = req.query;

    try {
        let query = `SELECT h.*, p.full_name as patient_name 
             FROM habit_risk_analysis h
             LEFT JOIN patients p ON h.patient_id = p.id`;
        const params = [];

        // Scope to specific dentist if provided
        if (dentist_id) {
            query += ` WHERE h.dentist_id = ?`;
            params.push(dentist_id);
        }

        query += ` ORDER BY h.created_at DESC`;

        const [rows] = await db.execute(query, params);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
