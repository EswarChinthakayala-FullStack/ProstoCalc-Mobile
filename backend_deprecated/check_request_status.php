<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$patient_id = $_GET['patient_id'] ?? null;
$dentist_id = $_GET['dentist_id'] ?? null;

if (!$patient_id || !$dentist_id) {
    echo json_encode(["status" => "error", "message" => "Missing parameters."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT status FROM consultation_requests WHERE patient_id = :p_id AND dentist_id = :d_id AND status IN ('PENDING', 'APPROVED') ORDER BY requested_at DESC LIMIT 1");
    $stmt->execute(['p_id' => $patient_id, 'd_id' => $dentist_id]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($request) {
        echo json_encode(["status" => "success", "exists" => true, "request_status" => $request['status']]);
    } else {
        echo json_encode(["status" => "success", "exists" => false]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
