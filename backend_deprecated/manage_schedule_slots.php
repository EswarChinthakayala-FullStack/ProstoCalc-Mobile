<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? null; // 'add', 'remove', 'block'
$dentist_id = $data['dentist_id'] ?? null;

if (!$dentist_id || !$action) {
    echo json_encode(["status" => "error", "message" => "Missing parameters."]);
    exit;
}

try {
    if ($action === 'add') {
        $stmt = $pdo->prepare("INSERT INTO dentist_schedule_slots (dentist_id, date, start_time, end_time, slot_status, slot_label, color_code) VALUES (:d_id, :date, :start, :end, 'available', :label, :color)");
        $stmt->execute([
            'd_id' => $dentist_id,
            'date' => $data['date'],
            'start' => $data['start_time'],
            'end' => $data['end_time'],
            'label' => $data['slot_label'] ?? 'Available Slot',
            'color' => $data['color_code'] ?? '#0D9488'
        ]);
    } else if ($action === 'remove') {
        $stmt = $pdo->prepare("DELETE FROM dentist_schedule_slots WHERE id = :id AND dentist_id = :d_id");
        $stmt->execute(['id' => $data['slot_id'], 'd_id' => $dentist_id]);
    } else if ($action === 'block') {
        $stmt = $pdo->prepare("UPDATE dentist_schedule_slots SET slot_status = 'blocked' WHERE id = :id AND dentist_id = :d_id");
        $stmt->execute(['id' => $data['slot_id'], 'd_id' => $dentist_id]);
    } else if ($action === 'unblock') {
        $stmt = $pdo->prepare("UPDATE dentist_schedule_slots SET slot_status = 'available' WHERE id = :id AND dentist_id = :d_id");
        $stmt->execute(['id' => $data['slot_id'], 'd_id' => $dentist_id]);
    }

    echo json_encode(["status" => "success", "message" => "Schedule slot updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
