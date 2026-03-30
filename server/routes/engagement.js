const express = require('express');
const router = express.Router();
const db = require('../db');

// Update Consistency Streak
router.post('/update_consistency_streak', async (req, res) => {
    const { user_id, user_type } = req.body;
    if (!user_id || !user_type) {
        return res.json({ status: 'error', message: 'Missing user parameters' });
    }

    try {
        const getLocalDate = (d) => {
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };

        const today = getLocalDate(new Date());
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = getLocalDate(yesterdayDate);

        const [rows] = await db.execute('SELECT * FROM user_activity_streaks WHERE user_id = ? AND user_type = ?', [user_id, user_type]);
        let currentStreak, longestStreak;

        if (rows.length === 0) {
            await db.execute('INSERT INTO user_activity_streaks (user_id, user_type, current_streak, longest_streak, last_active_date, streak_status) VALUES (?, ?, 1, 1, ?, "active")', [user_id, user_type, today]);
            currentStreak = 1;
            longestStreak = 1;
        } else {
            const streak = rows[0];
            currentStreak = streak.current_streak;
            longestStreak = streak.longest_streak;

            // last_active_date from MySQL is a Date object (usually midnight local)
            const lastDate = getLocalDate(new Date(streak.last_active_date));

            if (lastDate === today) {
                // Already updated today
            } else if (lastDate === yesterday) {
                currentStreak++;
                if (currentStreak > longestStreak) longestStreak = currentStreak;
                await db.execute('UPDATE user_activity_streaks SET current_streak = ?, longest_streak = ?, last_active_date = ?, streak_status = "active" WHERE id = ?', [currentStreak, longestStreak, today, streak.id]);
            } else {
                currentStreak = 1;
                await db.execute('UPDATE user_activity_streaks SET current_streak = 1, last_active_date = ?, streak_status = "broken" WHERE id = ?', [today, streak.id]);
            }
        }

        await db.execute('INSERT IGNORE INTO user_daily_activity (user_id, user_type, activity_date) VALUES (?, ?, ?)', [user_id, user_type, today]);

        res.json({
            status: "success",
            data: {
                current_streak: currentStreak,
                longest_streak: longestStreak,
                status: currentStreak > 1 ? "active" : "starting",
                message: `Activity recorded for ${today}`
            }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Get User Engagement
router.get('/get_user_engagement', async (req, res) => {
    const { user_id, user_type } = req.query;
    if (!user_id || !user_type) {
        return res.json({ status: 'error', message: 'Missing parameters' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM user_activity_streaks WHERE user_id = ? AND user_type = ?', [user_id, user_type]);
        if (rows.length > 0) {
            res.json({ status: 'success', data: rows[0] });
        } else {
            res.json({ status: 'success', data: { current_streak: 0, longest_streak: 0 } });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Get Notifications
router.get('/get_notifications', async (req, res) => {
    const { user_id, user_type } = req.query;
    if (!user_id || !user_type) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        const [rows] = await db.execute('SELECT * FROM notifications WHERE user_id = ? AND user_type = ? ORDER BY created_at DESC LIMIT 50', [user_id, user_type]);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Mark Notification Read
router.post('/mark_notification_read', async (req, res) => {
    const { notification_id } = req.body;
    if (!notification_id) return res.json({ status: 'error', message: 'Missing notification ID.' });

    try {
        await db.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [notification_id]);
        res.json({ status: 'success', message: 'Notification marked as read.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
