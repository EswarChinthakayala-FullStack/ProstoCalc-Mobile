-- Database Schema Upgrade for Professional Scheduling (ProstoCalc+ v4)

-- 1. Upgrade Appointments Table
ALTER TABLE appointments 
ADD COLUMN visit_status ENUM('scheduled', 'visited', 'not_visited', 'postponed', 'cancelled') DEFAULT 'scheduled' AFTER status,
ADD COLUMN visit_type ENUM('initial', 'follow_up', 'procedure', 'review') DEFAULT 'initial' AFTER visit_status,
ADD COLUMN rescheduled_from INT NULL AFTER visit_type,
ADD COLUMN dentist_notes TEXT NULL AFTER rescheduled_from,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Dentist Schedule Slots Table
CREATE TABLE IF NOT EXISTS dentist_schedule_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dentist_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_status ENUM('available', 'booked', 'blocked') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
);

-- 3. Appointment Status History Table (Audit logging)
CREATE TABLE IF NOT EXISTS appointment_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    changed_by ENUM('dentist', 'system') DEFAULT 'dentist',
    reason TEXT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);
