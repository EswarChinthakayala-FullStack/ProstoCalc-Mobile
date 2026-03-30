const express = require('express');
const router = express.Router();
const db = require('../../db');

// --- WEB-ONLY: Enhanced Streak Analytics ---
// Fixes missing medication_compliance and improves streak calculation
router.get('/get_streak_analytics', async (req, res) => {
    const { patient_id, range } = req.query;
    const days = parseInt(range) || 30;

    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient_id' });

    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - days);
        const limitStr = limitDate.toISOString().split('T')[0];

        // Include medication_compliance for web
        const streakTypes = ['tobacco_free', 'physio', 'medication_compliance'];
        const analytics = {};

        for (const stype of streakTypes) {
            // 1. Get all logs for this type within range
            const [logs] = await db.execute(
                `SELECT DATE_FORMAT(log_date, '%Y-%m-%d') as log_date, is_completed FROM daily_streak_logs
                 WHERE patient_id = ? AND streak_type = ? AND log_date >= ?
                 ORDER BY log_date ASC`,
                [patient_id, stype, limitStr]
            );

            // 2. Get ALL logs (no range limit) for current streak calc
            const [allLogs] = await db.execute(
                `SELECT DATE_FORMAT(log_date, '%Y-%m-%d') as log_date, is_completed FROM daily_streak_logs
                 WHERE patient_id = ? AND streak_type = ?
                 ORDER BY log_date DESC`,
                [patient_id, stype]
            );

            // 3. Current streak (consecutive completed from today/yesterday backwards)
            let currentStreak = 0;
            if (allLogs.length > 0) {
                const latestLogDate = allLogs[0].log_date;
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (latestLogDate === todayStr || latestLogDate === yesterdayStr) {
                    for (const log of allLogs) {
                        if (log.is_completed) {
                            currentStreak++;
                        } else {
                            break;
                        }
                    }
                }
            }

            // 4. Longest streak
            let longestStreak = 0;
            let tempCount = 0;
            const chronological = [...allLogs].reverse();
            for (const log of chronological) {
                if (log.is_completed) {
                    tempCount++;
                    longestStreak = Math.max(longestStreak, tempCount);
                } else {
                    tempCount = 0;
                }
            }

            // 5. Completion rate within range (Denominator is total days in range, not just logged days)
            const completedDays = logs.filter(l => l.is_completed).length;
            const totalDaysInRange = days; 
            const completionRate = Math.round((completedDays / totalDaysInRange) * 100);

            // 6. 7-day rolling metrics (Denominator is 7)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenStr = sevenDaysAgo.toISOString().split('T')[0];
            const recent7 = logs.filter(l => l.log_date >= sevenStr);
            const recent7completed = recent7.filter(l => l.is_completed).length;
            const recentPerformance = recent7completed / 7;

            // 9. Web-Optimized Consistency Score (0-100)
            // Weight: 60% overall completion, 40% recent performance
            let consistencyScore = Math.round(((completedDays / totalDaysInRange) * 60) + (recentPerformance * 40));
            
            // Safety cap/adjustment for new streaks
            if (currentStreak > 0 && consistencyScore < 5 && completedDays > 0) {
                // If they are on an active streak, don't show a near-zero score just because they are new
                consistencyScore = Math.max(consistencyScore, Math.min(100, currentStreak * 10));
            }

            const lastSyncDate = allLogs.length > 0 ? allLogs[0].log_date : null;

            analytics[stype] = {
                current_streak: currentStreak,
                longest_streak: longestStreak,
                completion_rate: completionRate,
                consistency_score: Math.min(100, consistencyScore),
                last_sync_date: lastSyncDate,
                daily_chart: logs.map(l => ({ date: l.log_date, completed: l.is_completed ? 1 : 0 })),
                streak_status: currentStreak > 0 ? 'active' : 'broken'
            };
        }

        res.json({ status: 'success', data: analytics });
    } catch (err) {
        console.error("Web Streak Analytics Error:", err);
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
