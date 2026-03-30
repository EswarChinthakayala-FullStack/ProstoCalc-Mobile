<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$dentist_id = $_GET['dentist_id'] ?? null;
$date = $_GET['date'] ?? date('Y-m-d');

if (!$dentist_id) {
    echo json_encode(["status" => "error", "message" => "Missing dentist_id"]);
    exit;
}

try {
    // 1. Fetch Appointments for the day with professional metadata
    $stmt = $pdo->prepare("
        SELECT a.*, cr.patient_id, p.full_name as patient_name, p.email as patient_email
        FROM appointments a
        JOIN consultation_requests cr ON a.request_id = cr.id
        JOIN patients p ON cr.patient_id = p.id
        WHERE cr.dentist_id = :d_id AND a.scheduled_date = :date
        ORDER BY a.scheduled_time ASC, a.id ASC
    ");
    $stmt->execute(['d_id' => $dentist_id, 'date' => $date]);
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch Slots for the day
    $slot_stmt = $pdo->prepare("
        SELECT * FROM dentist_schedule_slots 
        WHERE dentist_id = :d_id AND date = :date
        ORDER BY start_time ASC
    ");
    $slot_stmt->execute(['d_id' => $dentist_id, 'date' => $date]);
    $slots = $slot_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "appointments" => $appointments,
            "slots" => $slots
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
