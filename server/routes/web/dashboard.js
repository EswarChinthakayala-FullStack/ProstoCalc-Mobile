const express = require('express');
const router = express.Router();
const db = require('../../db');

// --- WEB-ONLY: Clinician Dashboard Summary ---
router.get('/get_clinician_summary', async (req, res) => {
    const { dentist_id } = req.query;
    if (!dentist_id) return res.json({ status: 'error', message: 'Missing dentist ID.' });

    try {
        // Total Patients
        const [patients] = await db.execute('SELECT COUNT(*) as count FROM patients WHERE dentist_id = ?', [dentist_id]);
        
        // Pending Requests
        const [pending] = await db.execute('SELECT COUNT(*) as count FROM consultation_requests WHERE dentist_id = ? AND status = "PENDING"', [dentist_id]);
        
        // Active Treatment Plans & Completed Statuses
        const [plans] = await db.execute('SELECT COUNT(*) as count FROM treatment_plans WHERE dentist_id = ? AND status IN ("COMPLETED", "FINAL")', [dentist_id]);
        
        // Revenue (Based on Final/Completed plans)
        const [revenue] = await db.execute('SELECT SUM(total_cost) as total FROM treatment_plans WHERE dentist_id = ? AND status IN ("FINAL", "COMPLETED")', [dentist_id]);

        res.json({
            status: 'success',
            data: {
                totalPatients: patients[0].count,
                pendingRequests: pending[0].count,
                treatmentPlans: plans[0].count,
                revenue: revenue[0].total || 0
            }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// --- WEB-ONLY: Dentist Analytics ---
router.get('/get_dentist_analytics', async (req, res) => {
    const { dentist_id, timeframe = '6months' } = req.query;
    if (!dentist_id) return res.json({ status: 'error', message: 'Missing dentist ID.' });

    try {
        // 1. Fetch Summary Stats
        const [patientsCount] = await db.execute('SELECT COUNT(*) as count FROM patients WHERE dentist_id = ?', [dentist_id]);
        const [pendingRequests] = await db.execute('SELECT COUNT(*) as count FROM consultation_requests WHERE dentist_id = ? AND status = "PENDING"', [dentist_id]);
        const [plansCount] = await db.execute('SELECT COUNT(*) as count FROM treatment_plans WHERE dentist_id = ? AND status IN ("COMPLETED", "FINAL")', [dentist_id]);
        const [revenueSum] = await db.execute('SELECT SUM(total_cost) as total FROM treatment_plans WHERE dentist_id = ? AND status IN ("FINAL", "COMPLETED")', [dentist_id]);

        const stats = {
            totalPatients: patientsCount[0].count,
            pendingRequests: pendingRequests[0].count,
            treatmentPlans: plansCount[0].count,
            revenue: parseFloat(revenueSum[0].total || 0),
            calculations: plansCount[0].count
        };

        // 2. Fetch Monthly Trends
        const monthsLimit = timeframe === 'year' ? 12 : 6;
        const monthMap = {};
        const today = new Date();
        
        // Pre-fill the last N months with zero values for continuous charting
        for (let i = monthsLimit - 1; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const name = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            const sort_key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthMap[sort_key] = { name, sort_key, revenue: 0, patients: 0, calculations: 0 };
        }

        const [monthlyRaw] = await db.execute(`
            SELECT 
                DATE_FORMAT(tp.created_at, '%Y-%m') as sort_key,
                SUM(tp.total_cost) as revenue,
                COUNT(DISTINCT tp.patient_id) as patients,
                COUNT(tp.id) as calculations
            FROM treatment_plans tp
            WHERE tp.dentist_id = ? AND tp.created_at >= DATE_SUB(LAST_DAY(NOW() - INTERVAL ? MONTH), INTERVAL 1 DAY)
            GROUP BY sort_key
        `, [dentist_id, monthsLimit]);

        monthlyRaw.forEach(row => {
            if (monthMap[row.sort_key]) {
                monthMap[row.sort_key].revenue = parseFloat(row.revenue || 0);
                monthMap[row.sort_key].patients = parseInt(row.patients || 0);
                monthMap[row.sort_key].calculations = parseInt(row.calculations || 0);
            }
        });

        const monthly = Object.values(monthMap).sort((a, b) => a.sort_key.localeCompare(b.sort_key));

        // 3. Fetch Procedure Distribution (Top 5)
        const [procedures] = await db.execute(`
            SELECT 
                COALESCE(i.treatment_name, t.name, 'AI Estimated') as name,
                COUNT(*) as value
            FROM treatment_plan_items i
            LEFT JOIN treatment_catalog t ON i.treatment_id = t.id
            JOIN treatment_plans p ON i.plan_id = p.id
            WHERE p.dentist_id = ?
            GROUP BY name
            ORDER BY value DESC
            LIMIT 5
        `, [dentist_id]);

        res.json({
            status: 'success',
            data: {
                stats,
                monthlyData: monthly.map(m => ({
                    ...m,
                    revenue: parseFloat(m.revenue || 0),
                    patients: parseInt(m.patients || 0),
                    calculations: parseInt(m.calculations || 0)
                })),
                procedures: procedures.map(p => ({
                    ...p,
                    value: parseInt(p.value || 0)
                })),
                engine: 'ProstoCalc Analytics v2.0'
            }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// --- WEB-ONLY: Patient Portfolio ---
router.get('/get_patient_portfolio', async (req, res) => {
    const { patient_id, dentist_id } = req.query;
    if (!patient_id || !dentist_id) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        const [patients] = await db.execute(`
            SELECT p.*, pp.age as profile_age, pp.gender as profile_gender, pp.medical_history as profile_history
            FROM patients p
            LEFT JOIN patient_profiles pp ON p.id = pp.patient_id
            WHERE p.id = ?
        `, [patient_id]);
        
        if (patients.length === 0) return res.json({ status: 'error', message: 'Patient not found' });
        
        const profile = patients[0];
        
        // Priority for age: 1. DB Column pp.age, 2. Calculation from date_of_birth
        if (profile.profile_age) {
            profile.age = profile.profile_age;
        } else if (profile.date_of_birth) {
            const diff_ms = Date.now() - new Date(profile.date_of_birth).getTime();
            const age_dt = new Date(diff_ms); 
            profile.age = Math.abs(age_dt.getUTCFullYear() - 1970);
        }

        // Hydrate medical_history if it came from the profiles table
        if (!profile.medical_history && profile.profile_history) {
            profile.medical_history = profile.profile_history;
        }
        if (!profile.gender && profile.profile_gender) {
            profile.gender = profile.profile_gender;
        }

        // Ensure revenue computes correctly for specific patient + dentist pair
        const [revenue] = await db.execute('SELECT SUM(total_cost) as total FROM treatment_plans WHERE patient_id = ? AND dentist_id = ? AND status IN ("FINAL", "COMPLETED")', [patient_id, dentist_id]);
        
        const [visits] = await db.execute(`
            SELECT a.id, a.scheduled_date, a.scheduled_time, a.visit_status, 
                   cr.request_message as reason, a.dentist_notes, tp.total_cost, tp.clinical_notes, cr.id as request_id
            FROM appointments a
            JOIN consultation_requests cr ON a.request_id = cr.id
            LEFT JOIN treatment_plans tp ON cr.id = tp.request_id
            WHERE cr.patient_id = ? AND cr.dentist_id = ?
            ORDER BY a.scheduled_date DESC
        `, [patient_id, dentist_id]);

        const [ai_insights] = await db.execute(`
            SELECT expl.id, expl.explanation_text, expl.created_at, est.total_estimated_cost, est.confidence_score 
            FROM ai_treatment_explanations expl
            JOIN ai_cost_estimations est ON expl.ai_cost_estimation_id = est.id
            WHERE est.patient_id = ? AND est.dentist_id = ?
            ORDER BY expl.created_at DESC
        `, [patient_id, dentist_id]);

        res.json({
            status: 'success',
            data: {
                profile,
                total_amount: parseFloat(revenue[0]?.total || 0),
                visit_count: visits.length,
                visits,
                ai_insights
            }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
