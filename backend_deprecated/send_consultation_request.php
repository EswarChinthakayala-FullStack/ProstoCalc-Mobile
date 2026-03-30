<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['patient_id']) || !isset($data['dentist_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing IDs."]);
    exit;
}

$patient_id = $data['patient_id'];
$dentist_id = $data['dentist_id'];
$message = $data['message'] ?? '';

try {
    // Check if dentist accepts requests
    $stmt = $pdo->prepare("SELECT accept_patient_requests FROM dentist_settings WHERE dentist_id = :id");
    $stmt->execute(['id' => $dentist_id]);
    $settings = $stmt->fetch();
    
    if ($settings && !$settings['accept_patient_requests']) {
        echo json_encode(["status" => "error", "message" => "This dentist is currently not accepting new consultation requests."]);
        exit;
    }

    // Check for existing pending or approved requests
    $check_stmt = $pdo->prepare("SELECT id FROM consultation_requests WHERE patient_id = :p_id AND dentist_id = :d_id AND status IN ('PENDING', 'APPROVED')");
    $check_stmt->execute(['p_id' => $patient_id, 'd_id' => $dentist_id]);
    if ($check_stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "A consultation request is already active with this dentist."]);
        exit;
    }

    $sql = "INSERT INTO consultation_requests (patient_id, dentist_id, request_message) VALUES (:p_id, :d_id, :msg)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['p_id' => $patient_id, 'd_id' => $dentist_id, 'msg' => $message]);
    $request_id = $pdo->lastInsertId();

    // Notify Dentist
    $p_stmt = $pdo->prepare("SELECT full_name FROM patients WHERE id = :id");
    $p_stmt->execute(['id' => $patient_id]);
    $p_name = $p_stmt->fetchColumn() ?: "A patient";

    $notif_stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, user_type, title, message, related_id)
        VALUES (:d_id, 'DENTIST', 'New Consultation Request', :msg, :rel_id)
    ");
    $notif_stmt->execute([
        'd_id' => $dentist_id,
        'msg' => "{$p_name} has requested a new consultation: \"{$message}\"",
        'rel_id' => $request_id
    ]);

    echo json_encode(["status" => "success", "message" => "Request sent successfully."]);
} catch (PDOException $e) {
    file_put_contents('debug.log', "SQL Error in send_consultation_request: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
