const express = require('express');
const router = express.Router();
const db = require('../../db');

// --- WEB-ONLY: Enhanced Treatment Plan with Patient Name ---
router.get('/get_treatment_plan', async (req, res) => {
    const { plan_id, request_id } = req.query;
    try {
        let sql = "";
        let params = [];
        if (plan_id) {
            sql = `
                SELECT p.*, a.scheduled_date, a.scheduled_time, a.visit_status, a.rescheduled_from, a.actual_end_time,
                       p.patient_id, p.dentist_id,
                       pat.full_name as patient_name, d.full_name as dentist_name, d.clinic_name
                FROM treatment_plans p 
                LEFT JOIN appointments a ON p.request_id = a.request_id 
                JOIN consultation_requests cr ON p.request_id = cr.id
                JOIN patients pat ON cr.patient_id = pat.id
                JOIN dentists d ON cr.dentist_id = d.id
                WHERE p.id = ?
            `;
            params = [plan_id];
        } else if (request_id) {
            sql = `
                SELECT a.scheduled_date, a.scheduled_time, a.visit_status, a.rescheduled_from, a.actual_end_time, 
                       p.id as plan_id, p.id, p.clinical_notes, p.created_at, p.status, p.ai_explanation, 
                       p.share_cost_details, p.share_ai_explanation, p.total_cost,
                       cr.patient_id, cr.dentist_id,
                       pat.full_name as patient_name, d.full_name as dentist_name, d.clinic_name, cr.status as request_status
                FROM consultation_requests cr
                JOIN patients pat ON cr.patient_id = pat.id
                JOIN dentists d ON cr.dentist_id = d.id
                LEFT JOIN appointments a ON cr.id = a.request_id
                LEFT JOIN (
                    SELECT * FROM treatment_plans 
                    WHERE request_id = ? 
                    ORDER BY id DESC LIMIT 1
                ) p ON cr.id = p.request_id
                WHERE cr.id = ? 
                ORDER BY a.id DESC LIMIT 1
            `;
            params = [request_id, request_id];
        } else {
            return res.json({ status: 'error', message: 'Missing ID parameters.' });
        }

        const [rows] = await db.execute(sql, params);
        const plan = rows[0];

        if (plan) {
            // Replicate the logic from original treatment.js for items and rescheduling
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
            if (actualPlanId) {
                const [item_rows] = await db.execute(`
                    SELECT i.*, COALESCE(i.treatment_name, t.name, 'AI Estimated Treatment') as name, 
                    i.cost_override as cost, t.category, t.color_tag
                    FROM treatment_plan_items i 
                    LEFT JOIN treatment_catalog t ON i.treatment_id = t.id 
                    WHERE i.plan_id = ?
                `, [actualPlanId]);

                plan.total_cost = parseFloat(plan.total_cost || 0);
                plan.items = item_rows.map(item => ({
                    ...item,
                    cost: parseFloat(item.cost_override || 0),
                    cost_override: parseFloat(item.cost_override || 0),
                    treatment_name: item.name,
                    name: item.name
                }));
            } else {
                plan.items = [];
                plan.total_cost = 0;
            }

            res.json({ status: 'success', data: plan });
        } else {
            res.json({ status: 'success', data: null });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
