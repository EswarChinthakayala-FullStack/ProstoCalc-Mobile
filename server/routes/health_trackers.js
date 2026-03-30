const express = require('express');
const router = express.Router();
const db = require('../db');

// --- DATABASE SETUP (Ensure tables exist) ---
const setupQueries = [
    `CREATE TABLE IF NOT EXISTS mouth_opening_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        entry_date DATE NOT NULL,
        value_mm FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS habit_reduction_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        entry_datetime DATETIME NOT NULL,
        tobacco_count INT DEFAULT 0,
        areca_count INT DEFAULT 0,
        craving_level INT DEFAULT NULL,
        mood_score INT DEFAULT NULL,
        trigger_type VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_patient_date (patient_id, entry_datetime)
    )`,
    `CREATE TABLE IF NOT EXISTS health_streaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        streak_type VARCHAR(50) NOT NULL, -- e.g., 'tobacco_free', 'exercise'
        current_streak INT DEFAULT 0,
        longest_streak INT DEFAULT 0,
        last_updated DATE,
        UNIQUE KEY unique_streak (patient_id, streak_type)
    )`,
    `CREATE TABLE IF NOT EXISTS medications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        scheduled_time TIME,
        duration_days INT,
        start_date DATE NOT NULL,
        end_date DATE,
        color_tag VARCHAR(20) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS medication_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        medication_id INT NOT NULL,
        log_date DATE NOT NULL,
        status ENUM('taken', 'missed') NOT NULL,
        actual_take_time DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_med_log (medication_id, log_date)
    )`,
    `CREATE TABLE IF NOT EXISTS daily_streak_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        streak_type VARCHAR(50) NOT NULL,
        log_date DATE NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_daily_log (patient_id, streak_type, log_date)
    )`,
    `CREATE TABLE IF NOT EXISTS behavior_baseline (
        patient_id INT PRIMARY KEY,
        tobacco_baseline INT DEFAULT 0,
        areca_baseline INT DEFAULT 0,
        baseline_recorded_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
];

// Run setup queries asynchronously
(async () => {
    try {
        for (const query of setupQueries) {
            await db.execute(query);
        }
        console.log("Health Tracker tables initialized.");
    } catch (err) {
        console.error("Error initializing Health Tracker tables:", err);
    }
})();

// --- ROUTES ---

// 1. Mouth Opening Tracker
router.post('/add_mouth_opening', async (req, res) => {
    const { patient_id, value_mm, date } = req.body;
    if (!patient_id || !value_mm) return res.json({ status: 'error', message: 'Missing data' });

    try {
        const entryDate = date || new Date().toISOString().split('T')[0];
        await db.execute(
            'INSERT INTO mouth_opening_logs (patient_id, value_mm, entry_date) VALUES (?, ?, ?)',
            [patient_id, value_mm, entryDate]
        );
        res.json({ status: 'success', message: 'Mouth opening logged.' });
    } catch (err) {
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

// 2. Enhanced Habit Reduction Tracker

// --- Helper: Categorize Time of Day ---
function getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 22) return 'Evening';
    return 'Night';
}

router.post('/log_habit_entry', async (req, res) => {
    // New endpoint for detailed logging
    const { patient_id, entry_datetime, tobacco_count, areca_count, craving_level, mood_score, trigger_type } = req.body;
    console.log("Log Habit Entry Payload:", JSON.stringify(req.body));

    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        await db.execute(
            'INSERT INTO habit_reduction_logs (patient_id, entry_datetime, tobacco_count, areca_count, craving_level, mood_score, trigger_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [patient_id, entry_datetime || new Date(), tobacco_count || 0, areca_count || 0, craving_level || null, mood_score || null, trigger_type || null]
        );

        // Update streak if full abstinence day (sum of counts for day == 0)
        // Check total distinct intake for *today*
        const todayStart = new Date().toISOString().split('T')[0];
        // Update streak if full abstinence day
        const [dailyRows] = await db.execute(
            'SELECT SUM(tobacco_count) as t FROM habit_reduction_logs WHERE patient_id = ? AND entry_datetime LIKE ?',
            [patient_id, `${todayStart}%`]
        );
        const dailyTobacco = dailyRows[0].t === null ? 0 : Number(dailyRows[0].t);
        const isTobaccoFree = (dailyTobacco === 0) ? 1 : 0;

        await db.execute(
            `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
             VALUES (?, 'tobacco_free', ?, ?)
             ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed)`,
            [patient_id, todayStart, isTobaccoFree]
        );

        res.json({ status: 'success', message: 'Habit entry logged.' });
    } catch (err) {
        console.error("Log Habit Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

// For backward compatibility or simple daily logging
router.post('/add_habit_log', async (req, res) => {
    // Redirect to new logic but assume simple daily aggregate logic if needed
    // The Frontend now uses detailed logging, so this might be legacy or simplified.
    // Let's implement fully compatible logic.
    return res.redirect(307, '/log_habit_entry');
});

router.get('/get_habit_analytics', async (req, res) => {
    const { patient_id, range } = req.query; // Range: 7, 30, 90
    const days = parseInt(range) || 30;

    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        // 1. Get Baseline
        const [baselineRows] = await db.execute('SELECT * FROM behavior_baseline WHERE patient_id = ?', [patient_id]);
        const baseline = baselineRows.length > 0 ? baselineRows[0] : { tobacco_baseline: 0, areca_baseline: 0 };
        const totalBaseline = (baseline.tobacco_baseline || 0) + (baseline.areca_baseline || 0);

        // 2. Get Raw Data for Range
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - days);
        const limitStr = limitDate.toISOString().split('T')[0];

        // Group by Day for Charts
        const [dailyLogs] = await db.execute(
            `SELECT DATE_FORMAT(entry_datetime, '%Y-%m-%d') as log_date, SUM(tobacco_count) as tobacco, SUM(areca_count) as areca, AVG(craving_level) as avg_craving
             FROM habit_reduction_logs 
             WHERE patient_id = ? AND entry_datetime >= ?
             GROUP BY log_date
             ORDER BY log_date ASC`,
            [patient_id, limitStr]
        );

        // 3. Time of Day Analysis
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

        // 4. Calculate Stats
        // 7-day Rolling Average (Current Avg)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentLogs = dailyLogs.filter(d => new Date(d.log_date) >= sevenDaysAgo);

        const totalRecent = recentLogs.reduce((sum, d) => sum + (parseInt(d.tobacco) || 0) + (parseInt(d.areca) || 0), 0);
        const currentAvg = recentLogs.length > 0 ? (totalRecent / 7).toFixed(1) : 0; // Avg per day over 7 days

        // Reduction %
        // Avoid division by zero
        let reductionPercent = 0;
        if (totalBaseline > 0) {
            reductionPercent = ((totalBaseline - currentAvg) / totalBaseline) * 100;
        }

        // Relapse Risk Logic
        // 30% Trend Slope: Simple linear checks. Is usage increasing over last 7 days?
        // 40% Recent Craving Spikes: Avg craving > 7
        // 30% History: Freq of days > baseline (simplified)

        let riskScore = 0;

        // Craving Check
        const recentCravingAvg = recentLogs.reduce((sum, d) => sum + (parseFloat(d.avg_craving) || 0), 0) / (recentLogs.length || 1);
        if (recentCravingAvg > 7) riskScore += 40;
        else if (recentCravingAvg > 4) riskScore += 20;

        // Trend Check (Simple: last 3 days > previous 3 days)
        if (recentLogs.length >= 6) {
            const last3 = recentLogs.slice(-3).reduce((s, d) => s + parseInt(d.tobacco) + parseInt(d.areca), 0);
            const prev3 = recentLogs.slice(-6, -3).reduce((s, d) => s + parseInt(d.tobacco) + parseInt(d.areca), 0);
            if (last3 > prev3) riskScore += 30;
        }

        // Baseline Exceed Check
        const daysExceeding = recentLogs.filter(d => (parseInt(d.tobacco) + parseInt(d.areca)) > totalBaseline).length;
        if (daysExceeding > 2) riskScore += 30;
        else if (daysExceeding > 0) riskScore += 10;

        // Cap at 100
        riskScore = Math.min(100, riskScore);

        res.json({
            status: 'success',
            data: {
                baseline: baseline,
                daily_logs: dailyLogs,
                time_of_day: timeOfDayMap,
                stats: {
                    current_avg: parseFloat(currentAvg),
                    reduction_percent: parseFloat(reductionPercent.toFixed(1)),
                    risk_score: riskScore
                }
            }
        });

    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

router.post('/set_behavior_baseline', async (req, res) => {
    const { patient_id, tobacco_baseline, areca_baseline } = req.body;
    try {
        await db.execute(
            `INSERT INTO behavior_baseline (patient_id, tobacco_baseline, areca_baseline, baseline_recorded_date) 
             VALUES (?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE tobacco_baseline = ?, areca_baseline = ?`,
            [patient_id, tobacco_baseline, areca_baseline, tobacco_baseline, areca_baseline]
        );
        res.json({ status: 'success', message: 'Baseline updated.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// 3. Streak System — Dynamic Analytics

// Log a daily streak entry
router.post('/log_streak_day', async (req, res) => {
    const { patient_id, streak_type, log_date, is_completed } = req.body;
    if (!patient_id || !streak_type) return res.json({ status: 'error', message: 'Missing fields' });

    const dateStr = log_date || new Date().toISOString().split('T')[0];
    try {
        await db.execute(
            `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed)`,
            [patient_id, streak_type, dateStr, is_completed !== false]
        );
        res.json({ status: 'success', message: 'Streak day logged.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Legacy get_streaks (kept for compatibility)
router.get('/get_streaks', async (req, res) => {
    const { patient_id } = req.query;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM health_streaks WHERE patient_id = ?',
            [patient_id]
        );
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Full streak analytics
router.get('/get_streak_analytics', async (req, res) => {
    const { patient_id, range } = req.query;
    const days = parseInt(range) || 30;

    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - days);
        const limitStr = limitDate.toISOString().split('T')[0];

        const streakTypes = ['tobacco_free', 'physio'];
        const analytics = {};

        for (const stype of streakTypes) {
            // 1. Get all logs for this type within range
            const [logs] = await db.execute(
                `SELECT log_date, is_completed FROM daily_streak_logs
                 WHERE patient_id = ? AND streak_type = ? AND log_date >= ?
                 ORDER BY log_date ASC`,
                [patient_id, stype, limitStr]
            );

            // 2. Get ALL logs (no range limit) for current streak calc
            const [allLogs] = await db.execute(
                `SELECT log_date, is_completed FROM daily_streak_logs
                 WHERE patient_id = ? AND streak_type = ?
                 ORDER BY log_date DESC`,
                [patient_id, stype]
            );

            // 3. Current streak (consecutive completed from most recent day backwards)
            let currentStreak = 0;
            const toISODate = (d) => {
                const date = new Date(d);
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                return localDate.toISOString().split('T')[0];
            };

            const today = toISODate(new Date());
            let lastDate = null;

            for (let i = 0; i < allLogs.length; i++) {
                const log = allLogs[i];
                const logDateStr = toISODate(log.log_date);
                
                if (i === 0) {
                    // Check if the most recent log is today or yesterday
                    const logDate = new Date(logDateStr);
                    const todayDate = new Date(today);
                    const diffDays = Math.round(Math.abs(todayDate - logDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 1) {
                        break;
                    }
                } else if (lastDate) {
                    const currDate = new Date(logDateStr);
                    const prevDate = new Date(lastDate);
                    const diffDays = Math.round(Math.abs(prevDate - currDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 1) break;
                }

                if (log.is_completed) {
                    currentStreak++;
                    lastDate = logDateStr;
                } else {
                    break;
                }
            }

            // 4. Longest streak (all-time)
            let longestStreak = 0;
            let temp = 0;
            const chronological = [...allLogs].reverse();
            for (const log of chronological) {
                if (log.is_completed) {
                    temp++;
                    longestStreak = Math.max(longestStreak, temp);
                } else {
                    temp = 0;
                }
            }

            // 5. Completion rate within range
            const completedDays = logs.filter(l => l.is_completed).length;
            const totalDays = logs.length;
            const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

            // 6. 7-day rolling metrics
            const sevenStr = toISODate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            const toDateStr = (d) => toISODate(d);
            const recent7 = logs.filter(l => toDateStr(l.log_date) >= sevenStr);
            const recent7completed = recent7.filter(l => l.is_completed).length;

            // 7. Previous week (8-14 days ago)
            const fourteenStr = toISODate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
            const prevWeek = logs.filter(l => toDateStr(l.log_date) >= fourteenStr && toDateStr(l.log_date) < sevenStr);
            const prevWeekCompleted = prevWeek.filter(l => l.is_completed).length;

            // 8. Streak Velocity
            const velocity = recent7completed - prevWeekCompleted; // +N = improving, -N = declining

            // 9. Consistency Score (0-100)
            // Weight: 40% completion rate, 30% current streak factor, 30% recent 7-day
            const streakFactor = Math.min(currentStreak / 30, 1.0); // Cap at 30 days
            const recentFactor = recent7.length > 0 ? recent7completed / 7 : 0;
            const consistencyScore = Math.round(
                (completionRate / 100) * 40 +
                streakFactor * 30 +
                recentFactor * 30
            );

            // 10. Relapse Risk Score
            // recent break frequency (40%), missed last 7 days (30%), streak volatility (30%)
            const recentBreaks = recent7.filter(l => !l.is_completed).length;
            const breakFreq = recent7.length > 0 ? recentBreaks / 7 : 0; // 0..1
            const missedLast7 = 7 - recent7completed;
            const missedFactor = missedLast7 / 7; // 0..1

            // Volatility: count transitions (completed -> missed or vice versa)
            let transitions = 0;
            for (let i = 1; i < logs.length; i++) {
                if (logs[i].is_completed !== logs[i - 1].is_completed) transitions++;
            }
            const volatility = logs.length > 1 ? transitions / (logs.length - 1) : 0; // 0..1

            let riskScore = Math.round(
                breakFreq * 40 * 100 +
                missedFactor * 30 * 100 / 100 * 100 +
                volatility * 30 * 100
            );
            // Simplified: recalculate cleanly
            riskScore = Math.round(
                (breakFreq * 0.4 + missedFactor * 0.3 + volatility * 0.3) * 100
            );
            riskScore = Math.min(100, Math.max(0, riskScore));

            let riskLevel = 'Low';
            if (riskScore > 60) riskLevel = 'High';
            else if (riskScore > 30) riskLevel = 'Moderate';

            // 11. Daily chart data
            const dailyChart = logs.map(l => ({
                date: typeof l.log_date === 'string' ? l.log_date : l.log_date.toISOString().split('T')[0],
                completed: l.is_completed ? 1 : 0
            }));

            // 12. Last break date
            const lastBreak = allLogs.find(l => !l.is_completed);
            const lastBreakDate = lastBreak
                ? (typeof lastBreak.log_date === 'string' ? lastBreak.log_date : lastBreak.log_date.toISOString().split('T')[0])
                : null;

            // 13. Missed sessions this week
            const missedThisWeek = 7 - recent7completed;

            // Update health_streaks cache
            await db.execute(
                `INSERT INTO health_streaks (patient_id, streak_type, current_streak, longest_streak, last_updated, streak_status, consistency_score, relapse_risk_score, last_break_date)
                 VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    current_streak = VALUES(current_streak),
                    longest_streak = VALUES(longest_streak),
                    last_updated = CURDATE(),
                    streak_status = VALUES(streak_status),
                    consistency_score = VALUES(consistency_score),
                    relapse_risk_score = VALUES(relapse_risk_score),
                    last_break_date = VALUES(last_break_date)`,
                [patient_id, stype, currentStreak, longestStreak,
                    currentStreak > 0 ? 'active' : 'broken',
                    consistencyScore, riskScore, lastBreakDate]
            );

            analytics[stype] = {
                current_streak: currentStreak,
                longest_streak: longestStreak,
                completion_rate: completionRate,
                consistency_score: consistencyScore,
                streak_velocity: velocity,
                risk_score: riskScore,
                risk_level: riskLevel,
                missed_this_week: missedThisWeek,
                recent_7_completed: recent7completed,
                last_break_date: lastBreakDate,
                daily_chart: dailyChart,
                streak_status: currentStreak > 0 ? 'active' : 'broken'
            };
        }

        res.json({ status: 'success', data: analytics });
    } catch (err) {
        console.error("Streak Analytics Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

// 4. Medication Tracker
router.post('/add_medication', async (req, res) => {
    console.log("Add Medication Payload:", JSON.stringify(req.body));
    const { patient_id, name, dosage, frequency, duration_days, start_date, end_date, scheduled_time, color_tag } = req.body;
    try {
        await db.execute(
            'INSERT INTO medications (patient_id, name, dosage, frequency, scheduled_time, duration_days, start_date, end_date, color_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [patient_id, name, dosage, frequency, scheduled_time || null, duration_days || 0, start_date, end_date || null, color_tag || '#3B82F6']
        );
        res.json({ status: 'success', message: 'Medication added.' });
    } catch (err) {
        console.error("Add Med Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

router.get('/get_medications', async (req, res) => {
    const { patient_id } = req.query;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        // Handle dates in server-local time to match log_medication
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const [meds] = await db.execute(
            "SELECT id, patient_id, name, dosage, frequency, scheduled_time, duration_days, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, color_tag, is_active FROM medications WHERE patient_id = ? AND is_active = TRUE",
            [patient_id]
        );

        for (let med of meds) {
            // Get existing logs
            const [logs] = await db.execute(
                "SELECT id, medication_id, DATE_FORMAT(log_date, '%Y-%m-%d') as log_date, status, actual_take_time FROM medication_logs WHERE medication_id = ? ORDER BY log_date DESC",
                [med.id]
            );

            // Logic: Fill gaps with "missed" from start_date to yesterday
            // Actually, usually we only want to show the last 7-14 days for the UI
            const history = [];
            const logMap = {};
            logs.forEach(l => { logMap[l.log_date] = l; });

            const startDate = new Date(med.start_date);
            const endDate = med.end_date ? new Date(med.end_date) : new Date();
            const limit = new Date(todayStr); // Only show logs up to today

            // Iterate backwards from today to start_date or (today - 14 days)
            let curr = new Date(limit);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30); // Show max 30 days of history

            while (curr >= startDate && curr >= cutoff) {
                const dateKey = curr.toISOString().split('T')[0];
                if (logMap[dateKey]) {
                    history.push(logMap[dateKey]);
                } else {
                    // It's a gap - only mark as missed if it's in the past
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
        console.error("Get Meds Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

router.post('/log_medication', async (req, res) => {
    console.log("Log Medication Payload:", JSON.stringify(req.body));
    const { medication_id, date, status } = req.body;
    // status: 'taken' or 'missed'

    // Use server's local date/time to ensure consistency
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');

    const todayStr = `${YYYY}-${MM}-${DD}`;
    const actual_take_time = `${YYYY}-${MM}-${DD} ${HH}:${min}:${sec}`;

    // If the client sent a date, we use it, but if it's "today" we prefer our local date
    // to avoid timezone drift (e.g. client is at 11pm, server is at 2am next day)
    let logDate = date || todayStr;

    // Robustness: If actual_take_time is today, but logDate is yesterday, 
    // it's likely a timezone mismatch. We prefer today.
    if (logDate !== todayStr) {
        console.log(`Timezone drift detected? Client date: ${logDate}, Server date: ${todayStr}. Using server date.`);
        logDate = todayStr;
    }

    console.log(`Logging medication: logDate=${logDate}, actual_take_time=${actual_take_time}, status=${status}`);

    try {
        await db.execute(
            'INSERT INTO medication_logs (medication_id, log_date, actual_take_time, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, actual_take_time = ?',
            [medication_id, logDate, actual_take_time, status, status, actual_take_time]
        );

        // --- STREAK LOGIC START ---
        if (status === 'taken') {
            // Get patient_id from medication
            const [medRows] = await db.execute('SELECT patient_id FROM medications WHERE id = ?', [medication_id]);
            if (medRows.length > 0) {
                const patientId = medRows[0].patient_id;

                // Get all active medications for this patient
                const [activeMeds] = await db.execute(
                    'SELECT id FROM medications WHERE patient_id = ? AND is_active = TRUE',
                    [patientId]
                );

                // Check if ALL active meds have a 'taken' log for this date
                let allTaken = true;
                for (const med of activeMeds) {
                    const [logs] = await db.execute(
                        'SELECT status FROM medication_logs WHERE medication_id = ? AND log_date = ?',
                        [med.id, logDate]
                    );
                    if (logs.length === 0 || logs[0].status !== 'taken') {
                        allTaken = false;
                        break;
                    }
                }

                if (allTaken) {
                    await updateStreak(patientId, 'medication_compliance', logDate);
                } else {
                    // One med was missed or not logged yet, but if this one specifically was marked 'missed', 
                    // we should ensure the daily compliance is false
                    await db.execute(
                        `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
                         VALUES (?, 'medication_compliance', ?, FALSE)
                         ON DUPLICATE KEY UPDATE is_completed = FALSE`,
                        [patientId, logDate]
                    );
                }
            }
        } else if (status === 'missed') {
            // If even one med is missed, the whole day compliance is false
            const [medRows] = await db.execute('SELECT patient_id FROM medications WHERE id = ?', [medication_id]);
            if (medRows.length > 0) {
                const patientId = medRows[0].patient_id;
                await db.execute(
                    `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
                     VALUES (?, 'medication_compliance', ?, FALSE)
                     ON DUPLICATE KEY UPDATE is_completed = FALSE`,
                    [patientId, logDate]
                );
            }
        }
        // --- STREAK LOGIC END ---

        res.json({ status: 'success', message: 'Medication logged.', log_date: logDate });
    } catch (err) {
        console.error("Log Med Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

// Helper: Update Streak Logic
async function updateStreak(patient_id, streak_type, dateStr) {
    try {
        console.log(`Updating streak: patient=${patient_id}, type=${streak_type}, date=${dateStr}`);

        // 1. Log the daily completion
        await db.execute(
            `INSERT INTO daily_streak_logs (patient_id, streak_type, log_date, is_completed)
             VALUES (?, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE is_completed = TRUE`,
            [patient_id, streak_type, dateStr]
        );

        // 2. Fetch all logs to calculate current and longest streaks
        const [logs] = await db.execute(
            `SELECT log_date, is_completed FROM daily_streak_logs 
             WHERE patient_id = ? AND streak_type = ? 
             ORDER BY log_date DESC`,
            [patient_id, streak_type]
        );

        let currentStreak = 0;
        for (const log of logs) {
            if (log.is_completed) currentStreak++;
            else break;
        }

        let longestStreak = 0;
        let temp = 0;
        const chronological = [...logs].reverse();
        for (const log of chronological) {
            if (log.is_completed) {
                temp++;
                longestStreak = Math.max(longestStreak, temp);
            } else {
                temp = 0;
            }
        }

        // 3. Update the health_streaks cache table
        await db.execute(
            `INSERT INTO health_streaks (patient_id, streak_type, current_streak, longest_streak, last_updated)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                current_streak = VALUES(current_streak), 
                longest_streak = VALUES(longest_streak),
                last_updated = VALUES(last_updated)`,
            [patient_id, streak_type, currentStreak, longestStreak, dateStr]
        );

    } catch (err) {
        console.error("updateStreak Error:", err);
    }
}

router.post('/update_medication', async (req, res) => {
    console.log("Update Medication Payload:", JSON.stringify(req.body));
    const { id, scheduled_time, frequency, color_tag } = req.body;
    try {
        await db.execute(
            'UPDATE medications SET scheduled_time = ?, frequency = ?, color_tag = ? WHERE id = ?',
            [scheduled_time || null, frequency, color_tag, id]
        );
        res.json({ status: 'success', message: 'Medication updated successfully.' });
    } catch (err) {
        console.error("Update Med Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

router.post('/delete_medication', async (req, res) => {
    const { id } = req.body;
    console.log(`Delete Medication ID: ${id}`);
    try {
        const [result] = await db.execute(
            'UPDATE medications SET is_active = 0 WHERE id = ?',
            [id]
        );
        if (result.affectedRows > 0) {
            res.json({ status: 'success', message: 'Medication deleted.' });
        } else {
            res.json({ status: 'error', message: 'Medication not found.' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
