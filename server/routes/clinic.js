const express = require('express');
const router = express.Router();
const db = require('../db');

// Save Clinic Details
router.post('/save_clinic_details', async (req, res) => {
    const { dentist_id, latitude, longitude, clinic_name, clinic_address, clinic_city, clinic_phone } = req.body;
    if (!dentist_id || !latitude || !longitude) {
        return res.json({ status: 'error', message: 'Incomplete data.' });
    }

    try {
        await db.execute(`
            UPDATE dentists SET 
            clinic_name = ?,
            latitude = ?, 
            longitude = ?, 
            clinic_address = ?,
            clinic_city = ?,
            clinic_phone = ?
            WHERE id = ?
        `, [clinic_name || '', latitude, longitude, clinic_address || '', clinic_city || '', clinic_phone || '', dentist_id]);

        res.json({ status: 'success', message: 'Clinic details updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: `Database error: ${err.message}` });
    }
});

// Get Dentist Details
router.get('/get_dentist_details', async (req, res) => {
    const { dentist_id } = req.query;
    if (!dentist_id) {
        return res.json({ status: 'error', message: 'Missing dentist ID.' });
    }

    try {
        const query = `
            SELECT d.id, d.full_name, d.clinic_name, d.license_number, d.email, d.latitude, d.longitude, d.clinic_address, d.clinic_city, d.clinic_phone, d.created_at,
                   dp.specialization, dp.experience_years, dp.consultation_fee,
                   ds.consultation_mode
            FROM dentists d 
            LEFT JOIN dentist_profiles dp ON d.id = dp.dentist_id
            LEFT JOIN dentist_settings ds ON d.id = ds.dentist_id
            WHERE d.id = ?
        `;
        const [rows] = await db.execute(query, [dentist_id]);
        if (rows.length > 0) {
            const dentist = rows[0];
            // Convert numbers to double/int if needed, though Node mysql2 does it for many types
            res.json({ status: 'success', data: dentist });
        } else {
            res.json({ status: 'error', message: 'Dentist not found.' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Save Dentist Profile
router.post('/save_dentist_profile', async (req, res) => {
    const { dentist_id, specialization, experience_years, consultation_fee } = req.body;
    if (!dentist_id || !specialization) {
        return res.json({ status: 'error', message: 'Incomplete data.' });
    }

    try {
        const [existing] = await db.execute('SELECT dentist_id FROM dentist_profiles WHERE dentist_id = ?', [dentist_id]);
        if (existing.length > 0) {
            await db.execute(`
                UPDATE dentist_profiles SET 
                specialization = ?,
                experience_years = ?, 
                consultation_fee = ?
                WHERE dentist_id = ?
            `, [specialization, experience_years || 0, consultation_fee || 0, dentist_id]);
        } else {
            await db.execute(`
                INSERT INTO dentist_profiles (dentist_id, specialization, experience_years, consultation_fee)
                VALUES (?, ?, ?, ?)
            `, [dentist_id, specialization, experience_years || 0, consultation_fee || 0]);
        }

        res.json({ status: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: `Database error: ${err.message}` });
    }
});

// Get Nearby Clinics
router.get('/get_nearby_clinics', async (req, res) => {
    const { lat = 0, lng = 0, radius = 5000 } = req.query;

    try {
        const query = `
            SELECT d.id, d.full_name, d.clinic_name, d.clinic_address, d.clinic_city, d.clinic_phone, d.latitude, d.longitude,
            p.specialization,
            (6371 * acos(GREATEST(-1, LEAST(1, cos(radians(?)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(?)) + sin(radians(?)) * sin(radians(d.latitude)))))) AS distance
            FROM dentists d
            LEFT JOIN dentist_profiles p ON d.id = p.dentist_id
            LEFT JOIN dentist_settings s ON d.id = s.dentist_id
            WHERE (s.visible_to_patients IS NULL OR s.visible_to_patients = 1)
            AND (s.consultation_mode IS NULL OR s.consultation_mode = 'FULL')
            AND (s.accept_patient_requests IS NULL OR s.accept_patient_requests = 1)
            HAVING distance < ?
            ORDER BY distance ASC
        `;
        const [rows] = await db.execute(query, [lat, lng, lat, radius]);
        const data = rows.map(r => ({
            ...r,
            id: parseInt(r.id),
            latitude: parseFloat(r.latitude),
            longitude: parseFloat(r.longitude),
            distance: parseFloat(r.distance)
        }));
        res.json({ status: 'success', data });
    } catch (err) {
        res.json({ status: 'error', message: `Database error: ${err.message}` });
    }
});

// Get All Dentists
router.get('/get_all_dentists', async (req, res) => {
    try {
        const sql = `
            SELECT d.id, d.full_name, d.clinic_name, 
                   COALESCE(s.accept_patient_requests, 1) as accept_patient_requests,
                   COALESCE(s.consultation_mode, 'FULL') as consultation_mode
            FROM dentists d
            LEFT JOIN dentist_settings s ON d.id = s.dentist_id
            WHERE s.visible_to_patients IS NULL OR s.visible_to_patients = 1
        `;
        const [rows] = await db.execute(sql);
        const data = rows.map(r => ({ ...r, accept_patient_requests: !!r.accept_patient_requests }));
        res.json({ status: 'success', data });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Get Dentist Settings
router.get('/get_dentist_settings', async (req, res) => {
    const { dentist_id } = req.query;
    if (!dentist_id) return res.json({ status: 'error', message: 'Missing dentist ID.' });

    try {
        const [rows] = await db.execute('SELECT * FROM dentist_settings WHERE dentist_id = ?', [dentist_id]);
        if (rows.length > 0) {
            res.json({ status: 'success', data: rows[0] });
        } else {
            res.json({ status: 'success', data: { dentist_id: parseInt(dentist_id), visible_to_patients: 1, accept_patient_requests: 1, consultation_mode: 'FULL' } });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Save Dentist Settings
router.post('/save_dentist_settings', async (req, res) => {
    const { dentist_id, visible_to_patients, accept_patient_requests, consultation_mode } = req.body;
    if (!dentist_id) return res.json({ status: 'error', message: 'Missing dentist ID.' });

    try {
        const [existing] = await db.execute('SELECT dentist_id FROM dentist_settings WHERE dentist_id = ?', [dentist_id]);
        if (existing.length > 0) {
            await db.execute('UPDATE dentist_settings SET visible_to_patients = ?, accept_patient_requests = ?, consultation_mode = ? WHERE dentist_id = ?', [visible_to_patients, accept_patient_requests, consultation_mode, dentist_id]);
        } else {
            await db.execute('INSERT INTO dentist_settings (dentist_id, visible_to_patients, accept_patient_requests, consultation_mode) VALUES (?, ?, ?, ?)', [dentist_id, visible_to_patients, accept_patient_requests, consultation_mode]);
        }
        res.json({ status: 'success', message: 'Settings updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// List Dentists (minimal)
router.get('/list_dentists', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, full_name, clinic_name FROM dentists');
        res.json(rows);
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Save Dentist Full Profile (Combined)
router.post('/save_dentist_full_profile', async (req, res) => {
    const { 
        dentist_id, full_name, license_number, 
        specialization, experience_years, 
        clinic_name, clinic_address, clinic_city, 
        clinic_phone, consultation_fee,
        latitude, longitude 
    } = req.body;

    if (!dentist_id) {
        return res.json({ status: 'error', message: 'Missing dentist ID.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update Core Dentist Table
        await connection.execute(`
            UPDATE dentists SET 
            full_name = ?,
            license_number = ?,
            clinic_name = ?,
            clinic_address = ?,
            clinic_city = ?,
            clinic_phone = ?,
            latitude = ?,
            longitude = ?
            WHERE id = ?
        `, [
            full_name || '', 
            license_number || '', 
            clinic_name || '', 
            clinic_address || '', 
            clinic_city || '', 
            clinic_phone || '', 
            latitude || null, 
            longitude || null, 
            dentist_id
        ]);

        // 2. Update/Insert Profile Table
        const [existingProfile] = await connection.execute('SELECT dentist_id FROM dentist_profiles WHERE dentist_id = ?', [dentist_id]);
        
        if (existingProfile.length > 0) {
            await connection.execute(`
                UPDATE dentist_profiles SET 
                specialization = ?,
                experience_years = ?,
                consultation_fee = ?
                WHERE dentist_id = ?
            `, [specialization || '', experience_years || 0, consultation_fee || 0, dentist_id]);
        } else {
            await connection.execute(`
                INSERT INTO dentist_profiles (dentist_id, specialization, experience_years, consultation_fee)
                VALUES (?, ?, ?, ?)
            `, [dentist_id, specialization || '', experience_years || 0, consultation_fee || 0]);
        }

        await connection.commit();
        res.json({ status: 'success', message: 'Clinical identity synchronized successfully.' });
    } catch (err) {
        await connection.rollback();
        res.json({ status: 'error', message: `Database error: ${err.message}` });
    } finally {
        connection.release();
    }
});

module.exports = router;

