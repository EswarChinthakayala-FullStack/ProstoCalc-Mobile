<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

try {
    // 1. Upgrade Appointments Table
    $pdo->exec("ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS visit_status ENUM('scheduled', 'visited', 'not_visited', 'postponed', 'cancelled') DEFAULT 'scheduled',
    ADD COLUMN IF NOT EXISTS visit_type ENUM('initial', 'follow_up', 'procedure', 'review') DEFAULT 'initial',
    ADD COLUMN IF NOT EXISTS rescheduled_from INT NULL,
    ADD COLUMN IF NOT EXISTS dentist_notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    // 2. Dentist Schedule Slots Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS dentist_schedule_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dentist_id INT NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_status ENUM('available', 'booked', 'blocked') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
    )");

    // 3. Appointment Status History Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS appointment_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        old_status VARCHAR(30),
        new_status VARCHAR(30),
        changed_by ENUM('dentist', 'system') DEFAULT 'dentist',
        reason TEXT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )");

    echo json_encode(["status" => "success", "message" => "Database schema v4 applied successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
