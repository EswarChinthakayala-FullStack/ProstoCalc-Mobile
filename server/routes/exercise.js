const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');

// --- DATABASE SETUP ---
const setupQueries = [
    `CREATE TABLE IF NOT EXISTS exercises (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        level VARCHAR(50),
        duration_minutes INT,
        icon_name VARCHAR(50),
        color_theme VARCHAR(50),
        description TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS exercise_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        exercise_id VARCHAR(50) NOT NULL,
        completion_date DATE NOT NULL,
        duration_performed INT,
        reps_performed INT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS patient_exercise_settings (
        user_id INT PRIMARY KEY,
        morning_reminder BOOLEAN DEFAULT TRUE,
        evening_reminder BOOLEAN DEFAULT TRUE,
        smart_reminders BOOLEAN DEFAULT TRUE,
        morning_time TIME DEFAULT '09:00:00',
        evening_time TIME DEFAULT '20:00:00',
        daily_goal_minutes INT DEFAULT 15
    )`
];

(async () => {
    try {
        // --- RESILIENT EXERCISES TABLE SETUP ---
        // Check if table exists and has the 'title' column
        let recreateTable = false;
        try {
            const [columns] = await db.query('SHOW COLUMNS FROM exercises');
            const columnNames = columns.map(c => c.Field);
            if (!columnNames.includes('title') || !columnNames.includes('duration_minutes')) {
                console.log("Schema mismatch detected in 'exercises' table. Recreating...");
                recreateTable = true;
            }
        } catch (err) {
            // Table likely doesn't exist
            recreateTable = true;
        }

        if (recreateTable) {
            await db.execute('DROP TABLE IF EXISTS exercises');
            await db.execute(setupQueries[0]); // Create exercises table
        }

        // Create other tables if they don't exist
        for (let i = 1; i < setupQueries.length; i++) {
            await db.execute(setupQueries[i]);
        }
        
        // Insert default exercises if none exist or table was just recreated
        const [rows] = await db.query('SELECT COUNT(*) as count FROM exercises');
        if (rows[0].count === 0) {
            await db.query(`
                INSERT INTO exercises (id, title, level, duration_minutes, icon_name, color_theme, description) VALUES
                ('lat_jaw', 'Lateral Jaw Calibration', 'Beginner', 5, 'Zap', 'blue', 'Focus on gentle side-to-side jaw movements to improve joint mobility.'),
                ('mouth_exp', 'Mouth Opening Expansion', 'Intermediate', 8, 'Dumbbell', 'indigo', 'Gradual vertical stretching to increase inter-incisal distance.'),
                ('soft_tissue', 'Soft Tissue Massage', 'Expert', 12, 'ShieldCheck', 'cyan', 'Intra-oral massage techniques to release fibrotic bands and tension.')
            `);
        }
        console.log("Exercise tracker tables initialized successfully.");
    } catch (err) {
        console.error("Critical error during Exercise table initialization:", err);
    }
})();

// Get all exercises
router.get('/exercises', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM exercises ORDER BY id ASC');
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Helper to calculate streak
async function calculateStreak(userId) {
    try {
        const [rows] = await db.query(`
            SELECT DISTINCT completion_date 
            FROM exercise_logs 
            WHERE user_id = ? 
            ORDER BY completion_date DESC
        `, [userId]);

        if (rows.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < rows.length; i++) {
            const logDate = new Date(rows[i].completion_date);
            logDate.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(currentDate - logDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === streak) {
                streak++;
            } else if (diffDays > streak) {
                break;
            }
        }
        return streak;
    } catch (error) {
        console.error('Streak Calculation Error:', error);
        return 0;
    }
}

// Get user progress for today
router.get('/exercise-progress/:userId', async (req, res) => {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    try {
        // Get completed logs for today with explicit date formatting to avoid timezone shifts
        const [logs] = await db.query(
            `SELECT 
                id, user_id, exercise_id, 
                DATE_FORMAT(completion_date, '%Y-%m-%d') as completion_date,
                duration_performed, reps_performed, status 
            FROM exercise_logs 
            WHERE user_id = ? AND completion_date = ?`,
            [userId, today]
        );

        // Calculate total minutes today server-side
        const totalMinutesToday = logs.reduce((sum, l) => sum + (parseInt(l.duration_performed) || 0), 0);

        // Get total exercise count
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM exercises');

        // Get latest mouth measurement
        const [measurements] = await db.query(
            'SELECT measurement_mm, logged_at FROM patient_mouth_measurements WHERE user_id = ? ORDER BY logged_at DESC LIMIT 2',
            [userId]
        );

        const currentOpening = measurements[0] ? measurements[0].measurement_mm : 35.0;
        const previousOpening = measurements[1] ? measurements[1].measurement_mm : currentOpening;
        const improvement = currentOpening - previousOpening;

        // NEW: Real Streak
        const streak = await calculateStreak(userId);

        res.json({
            status: 'success',
            data: {
                completedCount: logs.length,
                totalExercises: total,
                completionRate: total > 0 ? (logs.length / total) * 100 : 0,
                completedIds: logs.map(l => l.exercise_id),
                total_minutes_today: totalMinutesToday,
                currentOpening,
                improvement,
                streak,
                daily_logs: logs
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET exercise settings
router.get('/exercise-settings/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM patient_exercise_settings WHERE user_id = ?', [userId]);
        if (rows.length === 0) {
            // Return defaults if not found
            return res.json({
                status: 'success',
                data: {
                    user_id: parseInt(userId),
                    morning_reminder: true,
                    evening_reminder: true,
                    smart_reminders: true,
                    morning_time: '09:00:00',
                    evening_time: '20:00:00'
                }
            });
        }
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST update exercise settings
router.post('/exercise-settings', async (req, res) => {
    const { userId, user_id, morningReminder, eveningReminder, smartReminders, morningTime, eveningTime } = req.body;
    const finalUserId = userId || user_id;

    console.log('⚙️ Updating Settings:', { finalUserId, morningReminder, eveningReminder, smartReminders, morningTime, eveningTime });

    if (!finalUserId) {
        return res.status(400).json({ status: 'error', message: 'Missing userId' });
    }
    try {
        await db.query(`
            INSERT INTO patient_exercise_settings (user_id, morning_reminder, evening_reminder, smart_reminders, morning_time, evening_time)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                morning_reminder = VALUES(morning_reminder),
                evening_reminder = VALUES(evening_reminder),
                smart_reminders = VALUES(smart_reminders),
                morning_time = VALUES(morning_time),
                evening_time = VALUES(evening_time)
        `, [finalUserId, morningReminder, eveningReminder, smartReminders, morningTime, eveningTime]);

        res.json({ status: 'success', message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Log exercise completion
router.post('/log-exercise', async (req, res) => {
    const { userId, user_id, exerciseId, exercise_id, duration, reps, status } = req.body;
    const finalUserId = userId || user_id;
    const finalExerciseId = exerciseId || exercise_id;
    const today = new Date().toISOString().split('T')[0];

    console.log('📝 Logging Exercise:', { finalUserId, finalExerciseId, duration, reps, status, today });

    if (!finalUserId) {
        console.error('❌ Missing userId in log-exercise request');
        return res.status(400).json({ status: 'error', message: 'Missing userId' });
    }

    const finalReps = reps === undefined ? null : reps;

    try {
        const [result] = await db.execute(
            'INSERT INTO exercise_logs (user_id, exercise_id, completion_date, duration_performed, reps_performed, status) VALUES (?, ?, ?, ?, ?, ?)',
            [finalUserId, finalExerciseId, today, duration, finalReps, status || 'completed']
        );

        console.log('✅ Exercise Logged. Insert ID:', result.insertId);
        res.json({ status: 'success', message: 'Exercise logged successfully', logId: result.insertId });
    } catch (error) {
        console.error('❌ Database Error logging exercise:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get weekly compliance data
router.get('/weekly-compliance/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Simple logic for last 7 days
        const [rows] = await db.query(`
            SELECT 
                completion_date as date,
                COUNT(DISTINCT exercise_id) as count
            FROM exercise_logs
            WHERE user_id = ? AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY completion_date
            ORDER BY completion_date ASC
        `, [userId]);

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM exercises');

        res.json({
            status: 'success',
            data: rows.map(r => ({
                day: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' }),
                percentage: (r.count / total) * 100
            }))
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Log mouth measurement
router.post('/log-measurement', async (req, res) => {
    const { userId, user_id, patient_id, measurement } = req.body;
    const finalUserId = userId || user_id || patient_id;
    const today = new Date().toISOString().split('T')[0];

    if (!finalUserId) {
        return res.status(400).json({ status: 'error', message: 'Missing userId' });
    }

    try {
        await db.query(
            'INSERT INTO patient_mouth_measurements (user_id, measurement_mm, measurement_date) VALUES (?, ?, ?)',
            [finalUserId, measurement, today]
        );
        res.json({ status: 'success', message: 'Measurement logged' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Reset user progress
router.post('/reset-progress', async (req, res) => {
    const { userId, user_id } = req.body;
    const finalUserId = userId || user_id;

    if (!finalUserId) {
        return res.status(400).json({ status: 'error', message: 'Missing userId' });
    }

    try {
        await db.execute('DELETE FROM exercise_logs WHERE user_id = ?', [finalUserId]);
        await db.execute('DELETE FROM exercise_ai_insights WHERE user_id = ?', [finalUserId]);
        res.json({ status: 'success', message: 'Progress data reset successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Mistral AI Progress Analysis
router.post('/analyze-progress', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ status: 'error', message: 'Missing userId' });
    }

    try {
        // Gather data for prompt
        const [patientRows] = await db.query('SELECT full_name FROM patients WHERE id = ?', [userId]);
        const patientName = patientRows[0] ? patientRows[0].full_name : `Patient ${userId}`;

        const [progressRows] = await db.query('SELECT * FROM exercise_logs WHERE user_id = ? ORDER BY completion_date DESC LIMIT 30', [userId]);
        const [[{ totalExercises }]] = await db.query('SELECT COUNT(*) as total FROM exercises');
        const [measurementRows] = await db.query('SELECT measurement_mm FROM patient_mouth_measurements WHERE user_id = ? ORDER BY measurement_date DESC LIMIT 5', [userId]);

        // Match the default of 35mm from the progress progress route if nothing recorded
        const openingValue = measurementRows[0] ? measurementRows[0].measurement_mm : 35.0;
        const currentOpening = `${openingValue}mm`;
        const streak = await calculateStreak(userId);

        const prompt = `
            Analyze the following physiotherapy/myofunctional progress for: ${patientName}
            
            CLINICAL DATA:
            - Current Mouth Opening: ${currentOpening}
            - Current Streak: ${streak} days
            - Recent Activity: ${progressRows.length} sessions completed recently.
            - Protocol Intensity: ${totalExercises} exercises assigned per day.
            
            INSTRUCTIONS:
            - Be highly realistic and clinical.
            - Use the patient's name ${patientName} naturally in the analysis.
            - If mouth opening is "not recorded yet", advise on the importance of baseline measurement.
            - If mouth opening is provided, comment specifically on that value (normal range is 35-50mm).
            - Avoid generic "Patient 7" style references.
            
            Return ONLY a JSON object with:
            {
                "analysis": "detailed explanation of progress",
                "improvement": "how to improve compliance or technique",
                "precautions": "safety measures based on current state"
            }
        `;

        const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:5000/api/chat';
        console.log(`[Exercise AI] Forwarding request to local AI server: ${aiServerUrl}`);
        
        const response = await axios.post(aiServerUrl, {
            messages: [
                { role: "system", content: "You are a specialized Myofunctional Therapy AI Assistant. Provide concise, clinical advice for patients recovering from oral surgery or fibrosis." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        // The AI server returns Ollama-formatted message by default
        const content = response.data.message ? response.data.message.content : response.data.choices[0].message.content;
        const aiContent = typeof content === 'string' ? JSON.parse(content) : content;

        // Save to DB
        await db.execute(
            'INSERT INTO exercise_ai_insights (user_id, analysis, improvement_tips, precautions) VALUES (?, ?, ?, ?)',
            [userId, aiContent.analysis, aiContent.improvement, aiContent.precautions]
        );

        // Map improvement_tips to 'improvement' for the response to match the model
        const dataToReturn = {
            ...aiContent,
            improvement: aiContent.improvement
        };

        res.json({ status: 'success', data: dataToReturn });

    } catch (error) {
        console.error('Mistral Analysis Error:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'AI Analysis failed' });
    }
});

// Get AI Insight History
router.get('/ai-insight-history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT id, user_id, analysis, improvement_tips as improvement, precautions, created_at 
            FROM exercise_ai_insights 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [userId]);
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
