const express = require('express');
const router = express.Router();
const db = require('../../db');

// --- WEB-ONLY: Log Medication ---
// Fixes timezone restriction bug that prevents logging for non-current dates
router.post('/log_medication', async (req, res) => {
    console.log("Web Log Medication Payload:", JSON.stringify(req.body));
    const { medication_id, date, status } = req.body;
    // status: 'taken' or 'missed'

    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');

    const todayStr = `${YYYY}-${MM}-${DD}`;
    const actual_take_time = `${YYYY}-${MM}-${DD} ${HH}:${min}:${sec}`;

    // Fix: Allow past/future dates passed by client, fallback to today
    const logDate = date || todayStr;

    try {
        await db.execute(
            'INSERT INTO medication_logs (medication_id, log_date, actual_take_time, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, actual_take_time = ?',
            [medication_id, logDate, actual_take_time, status, status, actual_take_time]
        );

        // --- STREAK LOGIC START ---
        const [medRows] = await db.execute('SELECT patient_id FROM medications WHERE id = ?', [medication_id]);
        if (medRows.length > 0) {
            const patientId = medRows[0].patient_id;

            // Get all active medications for this patient
            const [activeMeds] = await db.execute(
                'SELECT id FROM medications WHERE patient_id = ? AND is_active = TRUE',
                [patientId]
            );

            // Check if ALL active medications for this specific date are 'taken'
            let allTaken = true;
            for (const med of activeMeds) {
                const [logs] = await db.execute(
                    'SELECT status FROM medication_logs WHERE medication_id = ? AND log_date = ?',
                    [med.id, logDate]
                );
                // If any med is not logged yet OR is logged as 'missed', the day is not completed
                if (logs.length === 0 || logs[0].status !== 'taken') {
                    allTaken = false;
                    break;
                }
            }

            // Update the daily aggregate streak for this day
            await db.execute(
                `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
                 VALUES (?, 'medication_compliance', ?, ?)
                 ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed)`,
                [patientId, logDate, allTaken]
            );

            // Recalculate health_streaks current and longest streak
            const [streakLogs] = await db.execute(
                `SELECT log_date, is_completed FROM daily_streak_logs 
                 WHERE patient_id = ? AND streak_type = 'medication_compliance'
                 ORDER BY log_date DESC`,
                [patientId]
            );

            let currentStreak = 0;
            // Check if streak is still active (today or yesterday was completed)
            if (streakLogs.length > 0) {
                const latestLogDate = new Date(streakLogs[0].log_date).toISOString().split('T')[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (latestLogDate === todayStr || latestLogDate === yesterdayStr) {
                    for (const log of streakLogs) {
                        if (log.is_completed) currentStreak++;
                        else break;
                    }
                }
            }

            let longestStreak = 0;
            let temp = 0;
            const chronological = [...streakLogs].reverse();
            for (const log of chronological) {
                if (log.is_completed) {
                    temp++;
                    longestStreak = Math.max(longestStreak, temp);
                } else {
                    temp = 0;
                }
            }

            await db.execute(
                `INSERT INTO health_streaks (patient_id, streak_type, current_streak, longest_streak, last_updated)
                 VALUES (?, 'medication_compliance', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    current_streak = VALUES(current_streak), 
                    longest_streak = VALUES(longest_streak),
                    last_updated = VALUES(last_updated)`,
                [patientId, currentStreak, longestStreak, logDate]
            );
        }
        // --- STREAK LOGIC END ---

        res.json({ status: 'success', message: 'Medication logged.', log_date: logDate });
    } catch (err) {
        console.error("Web Log Med Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

router.get('/get_medications', async (req, res) => {
    const { patient_id } = req.query;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const [meds] = await db.execute(
            "SELECT id, patient_id, name, dosage, frequency, scheduled_time, duration_days, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, color_tag, is_active FROM medications WHERE patient_id = ? AND is_active = TRUE",
            [patient_id]
        );

        for (let med of meds) {
            const [logs] = await db.execute(
                "SELECT id, medication_id, DATE_FORMAT(log_date, '%Y-%m-%d') as log_date, status, actual_take_time FROM medication_logs WHERE medication_id = ? ORDER BY log_date DESC",
                [med.id]
            );

            const history = [];
            const logMap = {};
            logs.forEach(l => { logMap[l.log_date] = l; });

            const startDate = new Date(med.start_date);
            
            let maxLogDateStr = todayStr;
            logs.forEach(l => {
                if (l.log_date > maxLogDateStr) {
                    maxLogDateStr = l.log_date;
                }
            });
            const limit = new Date(maxLogDateStr);

            let curr = new Date(limit);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);

            while (curr >= startDate && curr >= cutoff) {
                const dateKey = curr.toISOString().split('T')[0];
                if (logMap[dateKey]) {
                    history.push(logMap[dateKey]);
                } else {
                    if (dateKey < todayStr) {
                        history.push({
                            medication_id: med.id,
                            log_date: dateKey,
                            status: 'missed',
                            actual_take_time: null
                        });
                    }
                }
                curr.setDate(curr.getDate() - 1);
            }

            med.logs = history;
        }

        res.json({ status: 'success', data: meds });
    } catch (err) {
        console.error("Web Get Meds Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

router.post('/update_medication', async (req, res) => {
    console.log("Web Update Medication Payload:", JSON.stringify(req.body));
    const { id, name, dosage, scheduled_time, frequency, start_date, duration_days, end_date, color_tag } = req.body;
    try {
        await db.execute(
            `UPDATE medications 
             SET name = ?, dosage = ?, scheduled_time = ?, frequency = ?, start_date = ?, duration_days = ?, end_date = ?, color_tag = ? 
             WHERE id = ?`,
            [name, dosage, scheduled_time || null, frequency, start_date, duration_days, end_date || null, color_tag, id]
        );
        res.json({ status: 'success', message: 'Medication updated successfully.' });
    } catch (err) {
        console.error("Web Update Med Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
