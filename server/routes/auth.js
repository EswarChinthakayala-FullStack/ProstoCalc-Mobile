const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendOTP } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'prostocalc_dev_secret_2026';

// Login Patient.
router.post('/login_patient', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ status: 'error', message: 'Credentials required.' });

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const [rows] = await db.execute('SELECT id, full_name, password_hash, is_verified FROM patients WHERE email = ?', [normalizedEmail]);
        if (rows.length === 0) return res.json({ status: 'error', message: 'Account not found.' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.json({ status: 'error', message: 'Invalid credentials.' });

        // Generate Login OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = Date.now() + 5 * 60 * 1000; // 5 mins

        await db.execute('DELETE FROM password_resets WHERE email = ? AND role = ? AND type = ?', [normalizedEmail, 'patient', 'login']);
        await db.execute('INSERT INTO password_resets (email, otp, role, expires_at, type) VALUES (?, ?, ?, ?, ?)', [normalizedEmail, otp, 'patient', expires_at, 'login']);

        sendOTP(normalizedEmail, otp, 'patient', 'login');

        res.json({ 
            status: '2fa_required', 
            message: 'OTP sent. Please verify to continue.',
            email: normalizedEmail,
            role: 'patient',
            otp: otp // Added for development
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Login Dentist.
router.post('/login_dentist', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ status: 'error', message: 'Credentials required.' });

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const [rows] = await db.execute('SELECT id, full_name, password_hash, is_verified FROM dentists WHERE email = ?', [normalizedEmail]);
        if (rows.length === 0) return res.json({ status: 'error', message: 'Clinician account not found.' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.json({ status: 'error', message: 'Invalid credentials.' });

        // Generate Login OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = Date.now() + 5 * 60 * 1000;

        await db.execute('DELETE FROM password_resets WHERE email = ? AND role = ? AND type = ?', [normalizedEmail, 'dentist', 'login']);
        await db.execute('INSERT INTO password_resets (email, otp, role, expires_at, type) VALUES (?, ?, ?, ?, ?)', [normalizedEmail, otp, 'dentist', expires_at, 'login']);

        sendOTP(normalizedEmail, otp, 'dentist', 'login');

        res.json({ 
            status: '2fa_required', 
            message: 'Verification code sent.',
            email: normalizedEmail,
            role: 'dentist',
            otp: otp // Added for development
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Signup Patient. //postman checked
router.post('/signup_patient', async (req, res) => {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
        return res.json({ status: 'error', message: 'Incomplete data.' });
    }
    if (full_name.length > 30) {
        return res.json({ status: 'error', message: 'Full name must not exceed 30 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const [checks] = await db.execute('SELECT id FROM patients WHERE email = ?', [normalizedEmail]);
        if (checks.length > 0) {
            return res.json({ status: 'error', message: 'This email address is already associated with an account.' });
        }

        // 1. Create Patient (but unverified)
        const [result] = await db.execute('INSERT INTO patients (full_name, email, phone, password_hash, is_verified) VALUES (?, ?, ?, ?, ?)', [full_name, normalizedEmail, req.body.phone || null, passwordHash, 0]);
        const patientId = result.insertId;

        // 2. Generate Signup OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = Date.now() + 10 * 60 * 1000; // 10 mins

        await db.execute('INSERT INTO password_resets (email, otp, role, expires_at, type) VALUES (?, ?, ?, ?, ?)', [normalizedEmail, otp, 'patient', expires_at, 'signup']);

        sendOTP(normalizedEmail, otp, 'patient', 'signup');

        res.json({ 
            status: 'verification_required', 
            message: 'A verification code has been generated.',
            email: normalizedEmail,
            role: 'patient',
            patient_id: patientId,
            otp: otp // Added for development
        });
    } catch (err) {
        res.json({ status: 'error', message: `Database error: ${err.message}` });
    }
});

// Signup Dentist  //psotman checked
router.post('/signup_dentist', async (req, res) => {
    const { full_name, email, password, clinic_name } = req.body;
    if (!full_name || !email || !password) {
        return res.json({ status: 'error', message: 'Incomplete data.' });
    }
    if (full_name.length > 30) {
        return res.json({ status: 'error', message: 'Full name must not exceed 30 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const [checks] = await db.execute('SELECT id FROM dentists WHERE email = ?', [normalizedEmail]);
        if (checks.length > 0) {
            return res.json({ status: 'error', message: 'This email address is already associated with an account. Please sign in.' });
        }

        const [result] = await db.execute('INSERT INTO dentists (full_name, email, license_number, clinic_name, phone, password_hash, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)', [full_name, normalizedEmail, req.body.license_number || null, clinic_name || null, req.body.phone || null, passwordHash, 0]);
        const dentistId = result.insertId;

        // Generate Signup OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = Date.now() + 10 * 60 * 1000;

        await db.execute('INSERT INTO password_resets (email, otp, role, expires_at, type) VALUES (?, ?, ?, ?, ?)', [normalizedEmail, otp, 'dentist', expires_at, 'signup']);

        sendOTP(normalizedEmail, otp, 'dentist', 'signup');

        res.json({ 
            status: 'verification_required', 
            message: 'Clinical identity verification initiated.',
            email: normalizedEmail,
            role: 'dentist',
            dentist_id: dentistId,
            otp: otp // Added for development
        });
    } catch (err) {
        res.json({ status: 'error', message: `Database error: ${err.message}` });
    }
});

// Verify Login / 2FA / Signup
router.post('/login_verify', async (req, res) => {
    const { email, role, otp, type } = req.body;
    const finalType = type || 'login';
    console.log('Login Verify attempt:', { email, role, otp, type: finalType });
    if (!email || !role || !otp) return res.json({ status: 'error', message: 'Missing data.' });

    const normalizedEmail = email.toLowerCase().trim();
    const table = role === 'dentist' ? 'dentists' : 'patients';

    try {
        const [rows] = await db.execute('SELECT * FROM password_resets WHERE email = ? AND role = ? AND otp = ? AND type = ?', [normalizedEmail, role, otp, finalType]);
        console.log('OTP Lookup result:', rows);
        
        if (rows.length === 0) return res.json({ status: 'error', message: 'Invalid or expired code.' });

        const expiresAt = Number(rows[0].expires_at);
        console.log('OTP Expiry check:', { expiresAt, now: Date.now() });
        if (expiresAt <= Date.now()) return res.json({ status: 'error', message: 'Code expired. Please login again.' });

        // Verified! Fetch User
        const [users] = await db.execute(`SELECT id, full_name, email FROM ${table} WHERE email = ?`, [normalizedEmail]);
        console.log('User Fetch result:', users);
        if (users.length === 0) return res.json({ status: 'error', message: 'System error: User lost.' });

        const user = users[0];
        
        // Set verified if not already
        await db.execute(`UPDATE ${table} SET is_verified = 1 WHERE id = ?`, [user.id]);
        await db.execute('DELETE FROM password_resets WHERE email = ? AND role = ? AND type = ?', [normalizedEmail, role, finalType]);

        // Generate JWT
        console.log('Generating JWT for:', { id: user.id, role });
        const token = jwt.sign(
            { id: user.id, email: user.email, role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('JWT generated successfully.');

        res.json({
            status: 'success',
            message: 'Securely authenticated.',
            token,
            user: { ...user, role }
        });

    } catch (err) {
        console.error('VERIFY_ERROR:', err);
        res.json({ status: 'error', message: err.message });
    }
});

// Forgot Password
router.post('/forgot_password', async (req, res) => {
    const { email, role } = req.body;
    if (!email || !role) return res.json({ status: 'error', message: 'Email and role are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const table = role === 'dentist' ? 'dentists' : 'patients';

    try {
        const [users] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [normalizedEmail]);
        if (users.length === 0) return res.json({ status: 'error', message: 'No account found with this email.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        await db.execute('DELETE FROM password_resets WHERE email = ? AND role = ?', [normalizedEmail, role]);
        await db.execute('INSERT INTO password_resets (email, otp, role, expires_at) VALUES (?, ?, ?, ?)', [normalizedEmail, otp, role, expires_at]);

        sendOTP(normalizedEmail, otp, role);
        
        // Return success immediately to prevent UI hang on restricted networks (like college) 
        res.json({ 
            status: 'success', 
            message: 'OTP generated. Check system logs if email delivery is blocked by your network.',
            otp: otp // Including OTP in response for development convenience
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Verify OTP
router.post('/verify_otp', async (req, res) => {
    const { email, role, otp } = req.body;
    if (!email || !role || !otp) return res.json({ status: 'error', message: 'Email, role, and OTP are required.' });

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const [rows] = await db.execute('SELECT * FROM password_resets WHERE email = ? AND role = ? AND otp = ?', [normalizedEmail, role, otp]);
        if (rows.length > 0) {
            const expiresAt = Number(rows[0].expires_at);
            if (expiresAt > Date.now()) {
                res.json({ status: 'success', message: 'OTP verified successfully.' });
            } else {
                res.json({ status: 'error', message: 'OTP has expired.' });
            }
        } else {
            res.json({ status: 'error', message: 'Invalid OTP.' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Reset Password
router.post('/reset_password', async (req, res) => {
    const { email, role, password, new_password, otp } = req.body;
    const finalPassword = password || new_password;

    if (!email || !role || !finalPassword || !otp) {
        return res.json({ status: 'error', message: 'Missing data.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const table = role === 'dentist' ? 'dentists' : 'patients';

    try {
        // Verify OTP one last time before resetting
        const [rows] = await db.execute('SELECT * FROM password_resets WHERE email = ? AND role = ? AND otp = ?', [normalizedEmail, role, otp]);
        if (rows.length === 0) {
            return res.json({ status: 'error', message: 'Invalid or unauthorized reset attempt.' });
        }

        const expiresAt = Number(rows[0].expires_at);
        if (expiresAt <= Date.now()) {
            return res.json({ status: 'error', message: 'Your security token has expired. Please request a new OTP.' });
        }

        const passwordHash = await bcrypt.hash(finalPassword, 10);
        await db.execute(`UPDATE ${table} SET password_hash = ? WHERE email = ?`, [passwordHash, normalizedEmail]);
        await db.execute('DELETE FROM password_resets WHERE email = ? AND role = ?', [normalizedEmail, role]);

        res.json({ status: 'success', message: 'Password has been reset successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Save Patient Location
router.post('/save_patient_location', async (req, res) => {
    const { patient_id, latitude, longitude, street_address, city, district, state, postal_code, country } = req.body;
    if (!patient_id || latitude === undefined || longitude === undefined) {
        return res.json({ status: 'error', message: 'Incomplete location data.' });
    }

    try {
        const [existing] = await db.execute('SELECT id FROM patient_locations WHERE patient_id = ?', [patient_id]);
        if (existing.length > 0) {
            await db.execute(`
                UPDATE patient_locations SET 
                latitude = ?, longitude = ?, street_address = ?, city = ?, district = ?, state = ?, postal_code = ?, country = ?
                WHERE patient_id = ?
            `, [latitude, longitude, street_address || null, city || null, district || null, state || null, postal_code || null, country || null, patient_id]);
        } else {
            await db.execute(`
                INSERT INTO patient_locations 
                (patient_id, latitude, longitude, street_address, city, district, state, postal_code, country) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [patient_id, latitude, longitude, street_address || null, city || null, district || null, state || null, postal_code || null, country || null]);
        }
        await db.execute('UPDATE patients SET latitude = ?, longitude = ? WHERE id = ?', [latitude, longitude, patient_id]);
        res.json({ status: 'success', message: 'Location details saved successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: `Database error: ${err.message}` });
    }
});

// Get Patient Details
router.get('/get_patient_details', async (req, res) => {
    const { patient_id } = req.query;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient ID.' });

    try {
        const query = `
            SELECT p.id, p.full_name, p.email, 
                   l.latitude, l.longitude, l.street_address, 
                   l.city, l.district, l.state, l.postal_code, l.country,
                   d.full_name as doctor_name, d.clinic_name, d.license_number, d.email as doctor_email,
                   pp.age, pp.gender, pp.medical_history
            FROM patients p 
            LEFT JOIN patient_locations l ON p.id = l.patient_id 
            LEFT JOIN dentists d ON p.dentist_id = d.id
            LEFT JOIN patient_profiles pp ON p.id = pp.patient_id
            WHERE p.id = ?
        `;
        const [rows] = await db.execute(query, [patient_id]);
        if (rows.length > 0) {
            res.json({ status: 'success', data: rows[0] });
        } else {
            res.json({ status: 'error', message: 'Patient not found.' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Save Patient Profile
router.post('/save_patient_profile', async (req, res) => {
    const { patient_id, age, gender, medical_history } = req.body;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient ID.' });

    try {
        const [existing] = await db.execute('SELECT patient_id FROM patient_profiles WHERE patient_id = ?', [patient_id]);
        if (existing.length > 0) {
            await db.execute('UPDATE patient_profiles SET age = ?, gender = ?, medical_history = ? WHERE patient_id = ?', [age || 0, gender || '', medical_history || '', patient_id]);
        } else {
            await db.execute('INSERT INTO patient_profiles (patient_id, age, gender, medical_history) VALUES (?, ?, ?, ?)', [patient_id, age || 0, gender || '', medical_history || '']);
        }
        res.json({ status: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Save Patient Full Profile (Clinical + Location)
router.post('/save_patient_full_profile', async (req, res) => {
    const { patient_id, age, gender, medical_history, latitude, longitude, street_address, city, district, state, postal_code, country } = req.body;
    if (!patient_id) return res.json({ status: 'error', message: 'Missing patient ID.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Profile
        const [existingProf] = await conn.execute('SELECT patient_id FROM patient_profiles WHERE patient_id = ?', [patient_id]);
        if (existingProf.length > 0) {
            await conn.execute('UPDATE patient_profiles SET age = ?, gender = ?, medical_history = ? WHERE patient_id = ?', [age || 0, gender || '', medical_history || '', patient_id]);
        } else {
            await conn.execute('INSERT INTO patient_profiles (patient_id, age, gender, medical_history) VALUES (?, ?, ?, ?)', [patient_id, age || 0, gender || '', medical_history || '']);
        }

        // 2. Location
        if (latitude !== undefined && longitude !== undefined) {
            const [existingLoc] = await conn.execute('SELECT id FROM patient_locations WHERE patient_id = ?', [patient_id]);
            if (existingLoc.length > 0) {
                await conn.execute(`
                    UPDATE patient_locations SET 
                    latitude = ?, longitude = ?, street_address = ?, city = ?, district = ?, state = ?, postal_code = ?, country = ?
                    WHERE patient_id = ?
                `, [latitude, longitude, street_address || null, city || null, district || null, state || null, postal_code || null, country || null, patient_id]);
            } else {
                await conn.execute(`
                    INSERT INTO patient_locations 
                    (patient_id, latitude, longitude, street_address, city, district, state, postal_code, country) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [patient_id, latitude, longitude, street_address || null, city || null, district || null, state || null, postal_code || null, country || null]);
            }
            await conn.execute('UPDATE patients SET latitude = ?, longitude = ? WHERE id = ?', [latitude, longitude, patient_id]);
        }

        await conn.commit();
        res.json({ status: 'success', message: 'Full clinical profile synchronized.' });
    } catch (err) {
        await conn.rollback();
        res.json({ status: 'error', message: `Security protocol failed: ${err.message}` });
    } finally {
        conn.release();
    }
});

// List Patients
router.get('/list_patients', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, full_name, email FROM patients');
        res.json(rows);
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Update Patient Location (simple)
router.post('/update_patient_location', async (req, res) => {
    const { patient_id, latitude, longitude } = req.body;
    if (!patient_id || latitude === undefined || longitude === undefined) {
        return res.json({ status: 'error', message: 'Incomplete data.' });
    }
    try {
        await db.execute('UPDATE patients SET latitude = ?, longitude = ? WHERE id = ?', [latitude, longitude, patient_id]);
        res.json({ status: 'success', message: 'Location updated successfully.' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// MARK: - MOBILE SPECIFIC ROUTES (NO OTP)

// Mobile Signup Patient
router.post('/mobile_signup_patient', async (req, res) => {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
        return res.json({ status: 'error', message: 'Incomplete data.' });
    }
    if (full_name.length > 30) {
        return res.json({ status: 'error', message: 'Full name must not exceed 30 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const [checks] = await db.execute('SELECT id FROM patients WHERE email = ?', [normalizedEmail]);
        if (checks.length > 0) {
            return res.json({ status: 'error', message: 'Email address already exists.' });
        }

        const [result] = await db.execute('INSERT INTO patients (full_name, email, phone, password_hash, is_verified) VALUES (?, ?, ?, ?, ?)', [full_name, normalizedEmail, req.body.phone || null, passwordHash, 1]);
        const patientId = result.insertId;

        const token = jwt.sign({ id: patientId, email: normalizedEmail, role: 'patient' }, JWT_SECRET, { expiresIn: '72h' });

        res.json({ 
            status: 'success', 
            message: 'Account created and verified.',
            token,
            user: { id: patientId, full_name, email: normalizedEmail, role: 'patient' }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Mobile Signup Dentist
router.post('/mobile_signup_dentist', async (req, res) => {
    const { full_name, email, password, clinic_name, license_number } = req.body;
    if (!full_name || !email || !password) {
        return res.json({ status: 'error', message: 'Incomplete data.' });
    }
    if (full_name.length > 30) {
        return res.json({ status: 'error', message: 'Full name must not exceed 30 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const [checks] = await db.execute('SELECT id FROM dentists WHERE email = ?', [normalizedEmail]);
        if (checks.length > 0) {
            return res.json({ status: 'error', message: 'Dentist email already exists.' });
        }

        const [result] = await db.execute('INSERT INTO dentists (full_name, email, license_number, clinic_name, phone, password_hash, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)', [full_name, normalizedEmail, license_number || null, clinic_name || null, req.body.phone || null, passwordHash, 1]);
        const dentistId = result.insertId;

        const token = jwt.sign({ id: dentistId, email: normalizedEmail, role: 'dentist' }, JWT_SECRET, { expiresIn: '72h' });

        res.json({ 
            status: 'success', 
            message: 'Clinical profile activated.',
            token,
            user: { id: dentistId, full_name, email: normalizedEmail, role: 'dentist' }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Mobile Login Patient
router.post('/mobile_login_patient', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ status: 'error', message: 'Credentials required.' });

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const [rows] = await db.execute('SELECT id, full_name, email, password_hash FROM patients WHERE email = ?', [normalizedEmail]);
        if (rows.length === 0) return res.json({ status: 'error', message: 'Patient not found.' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.json({ status: 'error', message: 'Invalid password.' });

        await db.execute('UPDATE patients SET is_verified = 1 WHERE id = ?', [user.id]);

        const token = jwt.sign({ id: user.id, email: user.email, role: 'patient' }, JWT_SECRET, { expiresIn: '72h' });

        res.json({
            status: 'success',
            token,
            user: { id: user.id, full_name: user.full_name, email: user.email, role: 'patient' }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// Mobile Login Dentist
router.post('/mobile_login_dentist', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ status: 'error', message: 'Credentials required.' });

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const [rows] = await db.execute('SELECT id, full_name, email, password_hash FROM dentists WHERE email = ?', [normalizedEmail]);
        if (rows.length === 0) return res.json({ status: 'error', message: 'Clinician not found.' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.json({ status: 'error', message: 'Invalid password.' });

        await db.execute('UPDATE dentists SET is_verified = 1 WHERE id = ?', [user.id]);

        const token = jwt.sign({ id: user.id, email: user.email, role: 'dentist' }, JWT_SECRET, { expiresIn: '72h' });

        res.json({
            status: 'success',
            token,
            user: { id: user.id, full_name: user.full_name, email: user.email, role: 'dentist' }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

module.exports = router;
