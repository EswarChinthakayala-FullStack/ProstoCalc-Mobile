const express = require('express');
const router = express.Router();
const db = require('../db');

// Get Consultation Requests
router.get('/get_consultation_requests', async (req, res) => {
    const { role, id } = req.query;
    if (!role || !id) {
        return res.json({ status: 'error', message: 'Missing role or ID.' });
    }

    try {
        let sql = "";
        if (role === 'DENTIST') {
            sql = `
                SELECT r.*, p.full_name as patient_name, 
                (SELECT id FROM chats WHERE appointment_id IN (SELECT id FROM appointments WHERE request_id = r.id) LIMIT 1) as chat_id,
                a.visit_status, a.scheduled_date, a.scheduled_time, a.rescheduled_from,
                tp.total_cost as estimated_cost,
                (SELECT GROUP_CONCAT(treatment_name SEPARATOR ', ') FROM treatment_plan_items WHERE plan_id = tp.id) as treatment_name,
                (SELECT SUM(sessions_estimate) FROM treatment_plan_items WHERE plan_id = tp.id) as number_of_visits
                FROM consultation_requests r 
                JOIN patients p ON r.patient_id = p.id 
                LEFT JOIN (
                    SELECT * FROM appointments WHERE id IN (SELECT MAX(id) FROM appointments GROUP BY request_id)
                ) a ON r.id = a.request_id
                LEFT JOIN (
                    SELECT * FROM treatment_plans WHERE id IN (SELECT MAX(id) FROM treatment_plans GROUP BY request_id)
                ) tp ON r.id = tp.request_id
                WHERE r.dentist_id = ? 
                ORDER BY r.requested_at DESC
            `;
        } else {
            sql = `
                SELECT r.*, d.full_name as dentist_name, d.clinic_name, 
                (SELECT id FROM chats WHERE appointment_id IN (SELECT id FROM appointments WHERE request_id = r.id) LIMIT 1) as chat_id,
                a.visit_status, a.scheduled_date, a.scheduled_time, a.rescheduled_from,
                tp.total_cost as estimated_cost,
                (SELECT GROUP_CONCAT(treatment_name SEPARATOR ', ') FROM treatment_plan_items WHERE plan_id = tp.id) as treatment_name,
                (SELECT SUM(sessions_estimate) FROM treatment_plan_items WHERE plan_id = tp.id) as number_of_visits
                FROM consultation_requests r 
                JOIN dentists d ON r.dentist_id = d.id 
                LEFT JOIN (
                    SELECT * FROM appointments WHERE id IN (SELECT MAX(id) FROM appointments GROUP BY request_id)
                ) a ON r.id = a.request_id
                LEFT JOIN (
                    SELECT * FROM treatment_plans WHERE id IN (SELECT MAX(id) FROM treatment_plans GROUP BY request_id)
                ) tp ON r.id = tp.request_id
                WHERE r.patient_id = ? 
                ORDER BY r.requested_at DESC
            `;
        }

        const [requests] = await db.execute(sql, [id]);

        for (let req of requests) {
            if (req.rescheduled_from) {
                const [orig_data] = await db.execute(`
                    SELECT a.scheduled_date, h.reason 
                    FROM appointments a
                    LEFT JOIN appointment_status_history h ON a.id = h.appointment_id 
                    WHERE a.id = ? AND h.new_status = 'postponed'
                    LIMIT 1
                `, [req.rescheduled_from]);

                if (orig_data.length > 0) {
                    req.original_date = orig_data[0].scheduled_date;
                    req.postpone_reason = orig_data[0].reason;
                }
            }
        }

        res.json({ status: 'success', data: requests });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Send Consultation Request
router.post('/send_consultation_request', async (req, res) => {
    const { patient_id, dentist_id, message } = req.body;
    if (!patient_id || !dentist_id || !message) {
        return res.json({ status: 'error', message: 'Missing parameters.' });
    }

    try {
        // Check for active requests (PENDING or APPROVED)
        const [existing] = await db.execute(
            "SELECT status FROM consultation_requests WHERE patient_id = ? AND dentist_id = ? AND status IN ('PENDING', 'APPROVED') ORDER BY requested_at DESC LIMIT 1",
            [patient_id, dentist_id]
        );

        if (existing.length > 0) {
            return res.json({
                status: 'error',
                message: `You already have an active ${existing[0].status.toLowerCase()} request with this dentist.`
            });
        }

        // If no active request, or previous was REJECTED/CANCELLED/COMPLETED, allow sending
        const [result] = await db.execute(
            'INSERT INTO consultation_requests (patient_id, dentist_id, request_message) VALUES (?, ?, ?)',
            [patient_id, dentist_id, message]
        );
        const requestId = result.insertId;

        // Fetch patient name for the notification
        const [patientRows] = await db.execute('SELECT full_name FROM patients WHERE id = ?', [patient_id]);
        const patientName = patientRows.length > 0 ? patientRows[0].full_name : "A patient";

        // Create notification for the dentist
        await db.execute(
            'INSERT INTO notifications (user_id, user_type, title, message, related_id) VALUES (?, "DENTIST", "New Consultation Request", ?, ?)',
            [dentist_id, `${patientName} has requested a consultation: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`, requestId]
        );

        res.json({ status: 'success', message: 'Request sent successfully.', id: requestId });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Respond to Request
router.post('/respond_to_request', async (req, res) => {
    const { request_id, status, scheduled_date, scheduled_time, duration_minutes = 30 } = req.body;
    if (!request_id || !status) {
        return res.json({ status: 'error', message: 'Missing data.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.execute('UPDATE consultation_requests SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?', [status, request_id]);

        if (status === 'APPROVED') {
            const [check] = await conn.execute('SELECT id FROM appointments WHERE request_id = ?', [request_id]);
            if (check.length > 0) {
                await conn.commit();
                return res.json({ status: 'success', message: 'Appointment already exists.' });
            }

            const [app_result] = await conn.execute('INSERT INTO appointments (request_id, scheduled_date, scheduled_time, duration_minutes) VALUES (?, ?, ?, ?)', [request_id, scheduled_date, scheduled_time, duration_minutes]);
            const app_id = app_result.insertId;

            const [req_rows] = await conn.execute('SELECT patient_id, dentist_id FROM consultation_requests WHERE id = ?', [request_id]);
            const request = req_rows[0];

            await conn.execute('INSERT INTO chats (patient_id, dentist_id, appointment_id, is_active) VALUES (?, ?, ?, 1)', [request.patient_id, request.dentist_id, app_id]);
        } else if (status === 'COMPLETED') {
            await conn.execute('UPDATE chats SET is_active = 0 WHERE appointment_id IN (SELECT id FROM appointments WHERE request_id = ?)', [request_id]);
        }

        const [info_rows] = await conn.execute(`
            SELECT cr.patient_id, d.full_name as dentist_name 
            FROM consultation_requests cr 
            JOIN dentists d ON cr.dentist_id = d.id 
            WHERE cr.id = ?
        `, [request_id]);

        const info = info_rows[0];
        if (info) {
            let msg = "";
            if (status === 'APPROVED') {
                msg = `Great news! Dr. ${info.dentist_name} has approved your consultation request for ${scheduled_date} at ${scheduled_time}.`;
            } else if (status === 'REJECTED') {
                msg = `Dr. ${info.dentist_name} is unable to accept your consultation request at this time.`;
            }

            if (msg) {
                await conn.execute('INSERT INTO notifications (user_id, user_type, title, message, related_id) VALUES (?, "PATIENT", "Consultation Update", ?, ?)', [info.patient_id, msg, request_id]);
            }
        }

        await conn.commit();
        res.json({ status: 'success', message: 'Response recorded successfully.' });
    } catch (err) {
        await conn.rollback();
        res.json({ status: 'error', message: err.message });
    } finally {
        conn.release();
    }
});

// Update Visit Status
router.post('/update_visit_status', async (req, res) => {
    const { appointment_id, new_status, reason, dentist_notes, new_date, new_time } = req.body;
    if (!appointment_id || !new_status) {
        return res.json({ status: 'error', message: 'Missing data.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [app_rows] = await conn.execute('SELECT visit_status FROM appointments WHERE id = ?', [appointment_id]);
        const old_status = app_rows.length > 0 ? app_rows[0].visit_status : 'scheduled';

        let extra_sql = "";
        if (new_status === 'arrived') extra_sql = ", check_in_time = CURRENT_TIMESTAMP";
        else if (new_status === 'in_progress') extra_sql = ", actual_start_time = CURRENT_TIMESTAMP";
        else if (new_status === 'visited') extra_sql = ", actual_end_time = CURRENT_TIMESTAMP";

        const update_query = `UPDATE appointments SET visit_status = ?, dentist_notes = ? ${extra_sql} WHERE id = ?`;
        await conn.execute(update_query, [new_status, dentist_notes || null, appointment_id]);

        await conn.execute('INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, reason) VALUES (?, ?, ?, "dentist", ?)', [appointment_id, old_status, new_status, reason || null]);

        if (new_status === 'postponed' && new_date && new_time) {
            const [orig_rows] = await conn.execute(`
                SELECT a.request_id, a.duration_minutes, cr.patient_id, d.full_name as dentist_name 
                FROM appointments a 
                JOIN consultation_requests cr ON a.request_id = cr.id 
                JOIN dentists d ON cr.dentist_id = d.id
                WHERE a.id = ?
            `, [appointment_id]);

            if (orig_rows.length > 0) {
                const orig = orig_rows[0];
                const [check] = await conn.execute('SELECT id FROM appointments WHERE rescheduled_from = ?', [appointment_id]);
                if (check.length === 0) {
                    await conn.execute('INSERT INTO appointments (request_id, scheduled_date, scheduled_time, duration_minutes, visit_status, rescheduled_from) VALUES (?, ?, ?, ?, "scheduled", ?)', [orig.request_id, new_date, new_time, orig.duration_minutes, appointment_id]);
                    const notif_msg = `Your visit with ${orig.dentist_name} has been rescheduled to ${new_date} at ${new_time}. Reason: ${reason || "Administrative adjustment"}`;
                    await conn.execute('INSERT INTO notifications (user_id, user_type, title, message, related_id) VALUES (?, "PATIENT", "Update: Visit Postponed", ?, ?)', [orig.patient_id, notif_msg, orig.request_id]);
                }
            }
        }

        await conn.commit();
        res.json({ status: 'success', message: 'Visit status updated.' });
    } catch (err) {
        await conn.rollback();
        res.json({ status: 'error', message: err.message });
    } finally {
        conn.release();
    }
});

// Get Calendar Events
router.get('/get_calendar_events', async (req, res) => {
    const { role, user_id, month, year } = req.query;
    console.log(`[DEBUG] Calendar Request: role=${role}, user_id=${user_id}, month=${month}, year=${year}`);
    if (!role || !user_id) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        let sql = "";
        if (role === 'DENTIST') {
            sql = `
                (SELECT a.*, p.full_name as patient_name, r.request_message as request_type,
                       r.patient_id, r.dentist_id, r.status as request_status,
                       (SELECT id FROM chats WHERE appointment_id = a.id LIMIT 1) as chat_id,
                       d.full_name as dentist_name, 'APPOINTMENT' as event_type, 
                       DATE_FORMAT(a.scheduled_date, '%Y-%m-%d') as event_date
                FROM appointments a
                JOIN consultation_requests r ON a.request_id = r.id
                JOIN patients p ON r.patient_id = p.id
                JOIN dentists d ON r.dentist_id = d.id
                WHERE r.dentist_id = ? 
                AND MONTH(a.scheduled_date) = ? 
                AND YEAR(a.scheduled_date) = ?
                )
                UNION ALL
                (SELECT NULL as id, r.id as request_id, r.requested_at as scheduled_date, NULL as scheduled_time, 
                       NULL as duration_minutes, r.status as status, r.requested_at as created_at, 
                       'pending' as visit_status, 'initial' as visit_type, NULL as rescheduled_from, 
                       NULL as dentist_notes, r.requested_at as updated_at, NULL as check_in_time, 
                       NULL as actual_start_time, NULL as actual_end_time, 'NORMAL' as priority, 
                       'CONSULTATION' as visit_category, p.full_name as patient_name, r.request_message as request_type,
                       r.patient_id, r.dentist_id, r.status as request_status,
                       NULL as chat_id, d.full_name as dentist_name, 'REQUEST' as event_type, 
                       DATE_FORMAT(r.requested_at, '%Y-%m-%d') as event_date
                FROM consultation_requests r
                JOIN patients p ON r.patient_id = p.id
                JOIN dentists d ON r.dentist_id = d.id
                WHERE r.dentist_id = ? 
                AND r.status = 'PENDING'
                AND MONTH(r.requested_at) = ? 
                AND YEAR(r.requested_at) = ?
                )
            `;
            const [rows] = await db.execute(sql, [user_id, m, y, user_id, m, y]);

            // Allow slots to be visualized on the calendar
            const [slots] = await db.execute(`
                SELECT id, dentist_id, date, start_time, end_time, slot_status, slot_label, color_tag,
                       DATE_FORMAT(date, '%Y-%m-%d') as event_date
                FROM dentist_schedule_slots
                WHERE dentist_id = ?
                AND MONTH(date) = ?
                AND YEAR(date) = ?
            `, [user_id, m, y]);

            const slotEvents = slots.map(slot => ({
                id: slot.id,
                request_id: 0,
                scheduled_date: slot.event_date,
                scheduled_time: slot.start_time,
                duration_minutes: 0,
                status: slot.slot_status.toUpperCase(),
                created_at: null,
                visit_status: slot.slot_status,
                visit_type: 'SLOT',
                rescheduled_from: null,
                dentist_notes: null,
                updated_at: null,
                check_in_time: null,
                actual_start_time: null,
                actual_end_time: null,
                priority: 'NORMAL',
                visit_category: 'SLOT',
                patient_name: slot.slot_label,
                request_type: "Custom Slot",
                patient_id: 0,
                dentist_id: slot.dentist_id,
                request_status: "APPROVED",
                chat_id: 0,
                dentist_name: "",
                event_type: 'SLOT',
                event_date: slot.event_date,
                color_tag: slot.color_tag || '#0D9488',
                slot_label: slot.slot_label,
                end_time: slot.end_time
            }));

            res.json({ status: 'success', data: [...rows, ...slotEvents] });
        } else {
            sql = `
                (SELECT a.*, d.full_name as dentist_name, d.clinic_name, r.request_message as request_type,
                       r.patient_id, r.dentist_id, r.status as request_status,
                       (SELECT id FROM chats WHERE appointment_id = a.id LIMIT 1) as chat_id,
                       p.full_name as patient_name, 'APPOINTMENT' as event_type, 
                       DATE_FORMAT(a.scheduled_date, '%Y-%m-%d') as event_date
                FROM appointments a
                JOIN consultation_requests r ON a.request_id = r.id
                JOIN dentists d ON r.dentist_id = d.id
                JOIN patients p ON r.patient_id = p.id
                WHERE r.patient_id = ? 
                AND MONTH(a.scheduled_date) = ? 
                AND YEAR(a.scheduled_date) = ?
                )
                UNION ALL
                (SELECT NULL as id, r.id as request_id, r.requested_at as scheduled_date, NULL as scheduled_time, 
                       NULL as duration_minutes, r.status as status, r.requested_at as created_at, 
                       'pending' as visit_status, 'initial' as visit_type, NULL as rescheduled_from, 
                       NULL as dentist_notes, r.requested_at as updated_at, NULL as check_in_time, 
                       NULL as actual_start_time, NULL as actual_end_time, 'NORMAL' as priority, 
                       'CONSULTATION' as visit_category, d.full_name as dentist_name, d.clinic_name as clinic_name,
                       r.request_message as request_type, r.patient_id, r.dentist_id, r.status as request_status,
                       NULL as chat_id, p.full_name as patient_name, 'REQUEST' as event_type, 
                       DATE_FORMAT(r.requested_at, '%Y-%m-%d') as event_date
                FROM consultation_requests r
                JOIN dentists d ON r.dentist_id = d.id
                JOIN patients p ON r.patient_id = p.id
                WHERE r.patient_id = ? 
                AND r.status != 'APPROVED'
                AND MONTH(r.requested_at) = ? 
                AND YEAR(r.requested_at) = ?
                )
            `;
            const [rows] = await db.execute(sql, [user_id, m, y, user_id, m, y]);
            res.json({ status: 'success', data: rows });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Get Dentist Schedule
router.get('/get_dentist_schedule', async (req, res) => {
    const { dentist_id, date = new Date().toISOString().split('T')[0] } = req.query;
    if (!dentist_id) return res.json({ status: 'error', message: 'Missing dentist_id' });

    try {
        // Include appointments for the specific date:
        // 1. Regular appointments on the selected date
        // 2. Postponed appointments that were originally scheduled for this date
        const appointmentSql = `
            SELECT a.*, 
                cr.patient_id, 
                p.full_name as patient_name, 
                p.email as patient_email,
                rescheduled.scheduled_date as new_date,
                rescheduled.scheduled_time as new_time
            FROM appointments a
            JOIN consultation_requests cr ON a.request_id = cr.id
            JOIN patients p ON cr.patient_id = p.id
            LEFT JOIN appointments rescheduled ON rescheduled.rescheduled_from = a.id
            WHERE cr.dentist_id = ? 
            AND (
                a.scheduled_date = ? 
                OR (a.visit_status = 'postponed' AND a.scheduled_date = ?)
            )
            ORDER BY a.scheduled_time ASC, a.id ASC
        `;
        const [appointments] = await db.execute(appointmentSql, [dentist_id, date, date]);

        const [slots] = await db.execute('SELECT * FROM dentist_schedule_slots WHERE dentist_id = ? AND date = ? ORDER BY start_time ASC', [dentist_id, date]);

        res.json({
            status: "success",
            data: { appointments, slots }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Manage Schedule Slots
router.post('/manage_schedule_slots', async (req, res) => {
    const { action, dentist_id, date, start_time, end_time, slot_label, color_tag, slot_id } = req.body;
    if (!dentist_id || !action) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        if (action === 'add') {
            await db.execute('INSERT INTO dentist_schedule_slots (dentist_id, date, start_time, end_time, slot_status, slot_label, color_tag) VALUES (?, ?, ?, ?, "available", ?, ?)', [dentist_id, date, start_time, end_time, slot_label || 'Available Slot', color_tag || '#0D9488']);
        } else if (action === 'remove') {
            await db.execute('DELETE FROM dentist_schedule_slots WHERE id = ? AND dentist_id = ?', [slot_id, dentist_id]);
        } else if (action === 'block') {
            await db.execute('UPDATE dentist_schedule_slots SET slot_status = "blocked" WHERE id = ? AND dentist_id = ?', [slot_id, dentist_id]);
        } else if (action === 'unblock') {
            await db.execute('UPDATE dentist_schedule_slots SET slot_status = "available" WHERE id = ? AND dentist_id = ?', [slot_id, dentist_id]);
        }
        res.json({ status: 'success', message: 'Schedule slot updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Check Request Status
router.get('/check_request_status', async (req, res) => {
    const { patient_id, dentist_id } = req.query;
    if (!patient_id || !dentist_id) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        const [rows] = await db.execute("SELECT id, status FROM consultation_requests WHERE patient_id = ? AND dentist_id = ? AND status IN ('PENDING', 'APPROVED') ORDER BY requested_at DESC LIMIT 1", [patient_id, dentist_id]);
        if (rows.length > 0) {
            res.json({ status: 'success', exists: true, request_status: rows[0].status, id: rows[0].id });
        } else {
            res.json({ status: 'success', exists: false });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// List All Requests
router.get('/list_requests', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM consultation_requests');
        res.json(rows);
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
