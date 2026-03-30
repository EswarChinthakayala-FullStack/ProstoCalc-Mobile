-- Extended Database Schema for ProstoCalc+

-- 1. Dentist Settings
CREATE TABLE IF NOT EXISTS dentist_settings (
    dentist_id INT PRIMARY KEY,
    accept_patient_requests BOOLEAN DEFAULT TRUE,
    visible_to_patients BOOLEAN DEFAULT TRUE,
    consultation_mode ENUM('FULL', 'CALCULATION_ONLY') DEFAULT 'FULL',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
);

-- 2. Consultation Requests
CREATE TABLE IF NOT EXISTS consultation_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    dentist_id INT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    request_message TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (dentist_id) REFERENCES dentists(id)
);

-- 3. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES consultation_requests(id)
);

-- 4. Chats
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    dentist_id INT NOT NULL,
    appointment_id INT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (dentist_id) REFERENCES dentists(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- 5. Messages
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_role ENUM('PATIENT', 'DENTIST') NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- 6. AI Usage Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dentist_id INT NOT NULL,
    ai_type ENUM('COST_PREDICTION', 'TREATMENT_EXPLANATION', 'OUTCOME_FORECAST'),
    input_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dentist_id) REFERENCES dentists(id)
);
