<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

try {
    // 1. Refine Appointments Table for Professional Level
    // We add more granular timing and categorization
    $pdo->exec("ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS check_in_time DATETIME NULL,
    ADD COLUMN IF NOT EXISTS actual_start_time DATETIME NULL,
    ADD COLUMN IF NOT EXISTS actual_end_time DATETIME NULL,
    ADD COLUMN IF NOT EXISTS priority ENUM('NORMAL', 'URGENT', 'EMERGENCY') DEFAULT 'NORMAL',
    ADD COLUMN IF NOT EXISTS visit_category ENUM('CONSULTATION', 'PROCEDURE', 'FOLLOW_UP', 'EMERGENCY') DEFAULT 'CONSULTATION',
    MODIFY COLUMN visit_status ENUM('scheduled', 'arrived', 'in_progress', 'visited', 'not_visited', 'postponed', 'cancelled') DEFAULT 'scheduled'");

    // 2. Refine Dentist Schedule Slots
    $pdo->exec("ALTER TABLE dentist_schedule_slots 
    ADD COLUMN IF NOT EXISTS slot_label VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS color_code VARCHAR(10) DEFAULT '#0D9488'");

    // 3. Ensure History captures notes and metadata
    $pdo->exec("ALTER TABLE appointment_status_history 
    ADD COLUMN IF NOT EXISTS metadata JSON NULL AFTER reason");

    echo json_encode(["status" => "success", "message" => "Professional Schema v5 applied successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
