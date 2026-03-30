const express = require('express');
const router = express.Router();
const db = require('../db');

// Send Message
router.post('/send_message', async (req, res) => {
    const { chat_id, sender_role, message } = req.body;
    if (!chat_id || !sender_role || !message) {
        return res.json({ status: 'error', message: 'Missing data.' });
    }

    try {
        const [chat] = await db.execute('SELECT is_active FROM chats WHERE id = ?', [chat_id]);
        if (chat.length === 0 || !chat[0].is_active) {
            return res.json({ status: 'error', message: 'This chat is no longer active.' });
        }

        await db.execute('INSERT INTO messages (chat_id, sender_role, message) VALUES (?, ?, ?)', [chat_id, sender_role, message]);
        res.json({ status: 'success', message: 'Message sent.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Get Messages
router.get('/get_messages', async (req, res) => {
    const { chat_id } = req.query;
    if (!chat_id) {
        return res.json({ status: 'error', message: 'Missing chat ID.' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM messages WHERE chat_id = ? ORDER BY sent_at ASC', [chat_id]);
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Get Chat Details
router.get('/get_chat_details', async (req, res) => {
    const { chat_id } = req.query;
    if (!chat_id) return res.json({ status: 'error', message: 'Missing chat_id.' });

    try {
        const sql = `
            SELECT c.*, a.request_id, latest.visit_status 
            FROM chats c 
            JOIN appointments a ON c.appointment_id = a.id 
            LEFT JOIN (
                SELECT request_id, visit_status 
                FROM appointments 
                WHERE id IN (SELECT MAX(id) FROM appointments GROUP BY request_id)
            ) latest ON a.request_id = latest.request_id
            WHERE c.id = ?
        `;
        const [rows] = await db.execute(sql, [chat_id]);
        if (rows.length > 0) {
            res.json({ status: 'success', data: rows[0] });
        } else {
            res.json({ status: 'error', message: 'Chat details not found.' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// AI Chat History / Messages by Session
router.all('/ai_chat_history', async (req, res) => {
    const user_id = req.query.user_id || req.body.user_id;
    const role = req.query.role || req.body.role || 'patient';
    const session_id = req.query.session_id || req.body.session_id;

    if (!user_id || !role) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        if (req.method === 'POST') {
            const { message, response } = req.body;

            if (!session_id) return res.json({ status: 'error', message: 'Session ID is required.' });

            // Check message limit (20)
            const [countRows] = await db.execute('SELECT COUNT(*) as count FROM ai_chats WHERE session_id = ?', [session_id]);
            if (countRows[0].count >= 20) {
                return res.json({ status: 'error', message: 'Chat limit reached (20 messages). Please create a new session.' });
            }

            await db.execute('INSERT INTO ai_chats (user_id, user_role, message, response, session_id) VALUES (?, ?, ?, ?, ?)', [user_id, role.toLowerCase(), message, response, session_id]);

            // Update session timestamp
            await db.execute('UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [session_id]);

            res.json({ status: 'success', message: 'History saved.' });
        } else {
            let sql = 'SELECT * FROM ai_chats';
            let params = [];

            if (session_id) {
                sql += ' WHERE session_id = ?';
                params.push(session_id);
            } else {
                sql += ' WHERE user_id = ? AND user_role = ?';
                params.push(user_id, role.toLowerCase());
            }

            sql += ' ORDER BY created_at ASC';
            const [rows] = await db.execute(sql, params);
            res.json({ status: 'success', data: rows });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// AI Sessions List
router.get('/ai_sessions', async (req, res) => {
    const { user_id, role } = req.query;
    if (!user_id || !role) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        const [rows] = await db.execute(
            'SELECT * FROM ai_chat_sessions WHERE user_id = ? AND user_role = ? ORDER BY updated_at DESC LIMIT 15',
            [user_id, role.toLowerCase()]
        );
        res.json({ status: 'success', data: rows });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Create AI Session
router.post('/ai_sessions', async (req, res) => {
    const { user_id, role, title } = req.body;
    if (!user_id || !role) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        // Check session limit (15)
        const [countRows] = await db.execute('SELECT COUNT(*) as count FROM ai_chat_sessions WHERE user_id = ? AND user_role = ?', [user_id, role.toLowerCase()]);
        if (countRows[0].count >= 15) {
            return res.json({ status: 'error', message: 'Maximum sessions reached (15). Please delete an old session.' });
        }

        const [result] = await db.execute(
            'INSERT INTO ai_chat_sessions (user_id, user_role, title) VALUES (?, ?, ?)',
            [user_id, role.toLowerCase(), title || 'New Chat']
        );
        res.json({ status: 'success', data: { session_id: result.insertId } });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Update Session Title
router.post('/update_session_title', async (req, res) => {
    const { session_id, title } = req.body;
    if (!session_id || !title) return res.json({ status: 'error', message: 'Missing parameters.' });

    try {
        await db.execute('UPDATE ai_chat_sessions SET title = ? WHERE id = ?', [title, session_id]);
        res.json({ status: 'success', message: 'Title updated.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Delete Session
router.post('/delete_session', async (req, res) => {
    const { session_id } = req.body;
    if (!session_id) return res.json({ status: 'error', message: 'Missing parameters.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute('DELETE FROM ai_chats WHERE session_id = ?', [session_id]);
        await conn.execute('DELETE FROM ai_chat_sessions WHERE id = ?', [session_id]);
        await conn.commit();
        res.json({ status: 'success', message: 'Session deleted.' });
    } catch (err) {
        await conn.rollback();
        res.json({ status: 'error', message: err.message });
    } finally {
        conn.release();
    }
});


// Initialize Chat (or retrieve existing)
router.post('/init_chat', async (req, res) => {
    const { request_id } = req.body;

    if (!request_id) {
        return res.json({ status: 'error', message: 'Missing request_id.' });
    }

    try {
        // Find appointment for this request
        const [appRows] = await db.execute('SELECT id FROM appointments WHERE request_id = ? ORDER BY id DESC LIMIT 1', [request_id]);

        let appId = null;
        if (appRows.length > 0) {
            appId = appRows[0].id; // Use most recent appointment for this request
        } else {
            // If no appointment exists, we cannot link a chat to an appointment yet.
            // But verified by checking 'status', maybe check if pending?
            // For now, if no appointment, we can't Init chat.
            return res.json({ status: 'error', message: 'No appointment found for this request. Cannot initialize chat.' });
        }

        // Check for existing chat
        const [chatRows] = await db.execute('SELECT id FROM chats WHERE appointment_id = ?', [appId]);
        if (chatRows.length > 0) {
            return res.json({ status: 'success', chat_id: chatRows[0].id, already_exists: true });
        }

        // Create new chat
        const [appDetails] = await db.execute(`
            SELECT cr.patient_id, cr.dentist_id 
            FROM appointments a 
            JOIN consultation_requests cr ON a.request_id = cr.id 
            WHERE a.id = ?
        `, [appId]);

        if (appDetails.length === 0) {
            return res.json({ status: 'error', message: 'Appointment details not found.' });
        }

        const { patient_id, dentist_id } = appDetails[0];

        const [result] = await db.execute(
            'INSERT INTO chats (patient_id, dentist_id, appointment_id, is_active) VALUES (?, ?, ?, 1)',
            [patient_id, dentist_id, appId]
        );

        return res.json({ status: 'success', chat_id: result.insertId, created_new: true });

    } catch (err) {
        return res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
