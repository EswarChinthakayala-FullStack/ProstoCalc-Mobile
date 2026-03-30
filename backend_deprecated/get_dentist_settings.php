<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$dentist_id = $_GET['dentist_id'] ?? null;

if (!$dentist_id) {
    echo json_encode(["status" => "error", "message" => "Missing dentist ID."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM dentist_settings WHERE dentist_id = :id");
    $stmt->execute(['id' => $dentist_id]);
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$settings) {
        // Default settings
        $settings = [
            "dentist_id" => (int)$dentist_id,
            "accept_patient_requests" => 1,
            "visible_to_patients" => 1,
            "consultation_mode" => "FULL"
        ];
    } else {
        $settings['accept_patient_requests'] = (bool)$settings['accept_patient_requests'];
        $settings['visible_to_patients'] = (bool)$settings['visible_to_patients'];
    }

    echo json_encode(["status" => "success", "data" => $settings]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
