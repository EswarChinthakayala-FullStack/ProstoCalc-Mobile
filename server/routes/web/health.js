const express = require('express');
const router = express.Router();
const db = require('../../db');

// --- WEB-ONLY: Add Mouth Opening ---
// Auto-logs a 'physio' streak entry upon registration
router.post('/add_mouth_opening', async (req, res) => {
    const { patient_id, value_mm, date } = req.body;
    if (!patient_id || !value_mm) return res.json({ status: 'error', message: 'Missing data' });

    try {
        const entryDate = date || new Date().toISOString().split('T')[0];
        
        // 1. Log the actual measurement
        await db.execute(
            'INSERT INTO mouth_opening_logs (patient_id, value_mm, entry_date) VALUES (?, ?, ?)',
            [patient_id, value_mm, entryDate]
        );

        // 2. Auto-log success for 'physio' streak
        await db.execute(
            `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
             VALUES (?, 'physio', ?, TRUE)
             ON DUPLICATE KEY UPDATE is_completed = TRUE`,
            [patient_id, entryDate]
        );

        res.json({ status: 'success', message: 'Progress logged and physiotherapy streak updated.' });
    } catch (err) {
        console.error("Web Add Mouth Opening Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

router.get('/get_mouth_opening_history', async (req, res) => {
    const { patient_id } = req.query;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        const [rows] = await db.execute(
            "SELECT id, patient_id, value_mm, DATE_FORMAT(entry_date, '%Y-%m-%d') as entry_date FROM mouth_opening_logs WHERE patient_id = ? ORDER BY entry_date ASC",
            [patient_id]
        );
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

router.post('/log_habit_entry', async (req, res) => {
    const { patient_id, entry_datetime, tobacco_count, areca_count, craving_level, mood_score, trigger_type } = req.body;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        const dt = entry_datetime || new Date();
        const dateObj = new Date(dt);
        // Get YYYY-MM-DD in local time
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const datePart = `${year}-${month}-${day}`;

        await db.execute(
            'INSERT INTO habit_reduction_logs (patient_id, entry_datetime, tobacco_count, areca_count, craving_level, mood_score, trigger_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [patient_id, dt, tobacco_count || 0, areca_count || 0, craving_level || null, mood_score || null, trigger_type || null]
        );

        // Update streak if full abstinence day
        const [dailyRows] = await db.execute(
            'SELECT SUM(tobacco_count) as t FROM habit_reduction_logs WHERE patient_id = ? AND entry_datetime LIKE ?',
            [patient_id, `${datePart}%`]
        );

        // SUM returns a string or null in some drivers. Be robust.
        const dailyTobacco = dailyRows[0].t === null ? 0 : Number(dailyRows[0].t);
        const isTobaccoFree = (dailyTobacco === 0) ? 1 : 0;

        await db.execute(
            `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
             VALUES (?, 'tobacco_free', ?, ?)
             ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed)`,
            [patient_id, datePart, isTobaccoFree]
        );

        res.json({ status: 'success', message: 'Habit entry logged.' });
    } catch (err) {
        console.error("Log Habit Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

router.post('/set_habit_baseline', async (req, res) => {
    const { patient_id, tobacco_baseline, areca_baseline } = req.body;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        await db.execute(
            `INSERT INTO behavior_baseline (patient_id, tobacco_baseline, areca_baseline)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE tobacco_baseline = VALUES(tobacco_baseline), areca_baseline = VALUES(areca_baseline)`,
            [patient_id, tobacco_baseline || 0, areca_baseline || 0]
        );
        res.json({ status: 'success', message: 'Baseline updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

router.get('/get_habit_analytics', async (req, res) => {
    const { patient_id, range } = req.query;
    const days = parseInt(range) || 30;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        const [baselineRows] = await db.execute('SELECT * FROM behavior_baseline WHERE patient_id = ?', [patient_id]);
        const hasBaseline = baselineRows.length > 0;
        const baseline = hasBaseline ? baselineRows[0] : { tobacco_baseline: 0, areca_baseline: 0 };
        const totalBaseline = (baseline.tobacco_baseline || 0) + (baseline.areca_baseline || 0);

        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - days);
        const limitStr = limitDate.toISOString().split('T')[0];

        const [dailyLogs] = await db.execute(
            `SELECT DATE_FORMAT(entry_datetime, '%Y-%m-%d') as log_date, SUM(tobacco_count) as tobacco, SUM(areca_count) as areca, AVG(craving_level) as avg_craving
             FROM habit_reduction_logs 
             WHERE patient_id = ? AND entry_datetime >= ?
             GROUP BY log_date
             ORDER BY log_date ASC`,
            [patient_id, limitStr]
        );

        const [hourlyLogs] = await db.execute(
            `SELECT HOUR(entry_datetime) as hour_val, COUNT(*) as count 
             FROM habit_reduction_logs 
             WHERE patient_id = ? AND entry_datetime >= ? 
             GROUP BY HOUR(entry_datetime)`,
            [patient_id, limitStr]
        );

        let timeOfDayMap = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
        hourlyLogs.forEach(row => {
            const h = row.hour_val;
            if (h >= 5 && h < 12) timeOfDayMap.Morning += row.count;
            else if (h >= 12 && h < 17) timeOfDayMap.Afternoon += row.count;
            else if (h >= 17 && h < 22) timeOfDayMap.Evening += row.count;
            else timeOfDayMap.Night += row.count;
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentLogs = dailyLogs.filter(d => new Date(d.log_date) >= sevenDaysAgo);
        const totalRecent = recentLogs.reduce((sum, d) => sum + (parseInt(d.tobacco) || 0) + (parseInt(d.areca) || 0), 0);
        const currentAvg = recentLogs.length > 0 ? (totalRecent / 7).toFixed(1) : 0;

        let reductionPercent = 0;
        if (totalBaseline > 0) {
            reductionPercent = ((totalBaseline - currentAvg) / totalBaseline) * 100;
        }

        const [interactions] = await db.execute(
            `SELECT id, entry_datetime as log_date, tobacco_count as tobacco, areca_count as areca, craving_level as avg_craving, mood_score, trigger_type
             FROM habit_reduction_logs 
             WHERE patient_id = ?
             ORDER BY entry_datetime DESC
             LIMIT 20`,
            [patient_id]
        );

        res.json({
            status: 'success',
            data: {
                baseline: baseline,
                has_baseline: hasBaseline,
                daily_logs: dailyLogs,
                interactions: interactions,
                time_of_day: timeOfDayMap,
                stats: {
                    current_avg: parseFloat(currentAvg),
                    reduction_percent: parseFloat(reductionPercent.toFixed(1))
                }
            }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
