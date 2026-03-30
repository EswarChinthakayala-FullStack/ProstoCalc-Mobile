<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['dentist_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing dentist ID."]);
    exit;
}

$dentist_id = $data['dentist_id'];
$accept = $data['accept_patient_requests'] ? 1 : 0;
$visible = $data['visible_to_patients'] ? 1 : 0;
$mode = $data['consultation_mode'] ?? 'FULL';

try {
    $stmt = $pdo->prepare("INSERT INTO dentist_settings (dentist_id, accept_patient_requests, visible_to_patients, consultation_mode) 
        VALUES (:id, :accept, :visible, :mode) 
        ON DUPLICATE KEY UPDATE 
        accept_patient_requests = :accept, visible_to_patients = :visible, consultation_mode = :mode");
    
    $stmt->execute([
        'id' => $dentist_id,
        'accept' => $accept,
        'visible' => $visible,
        'mode' => $mode
    ]);

    echo json_encode(["status" => "success", "message" => "Settings updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
