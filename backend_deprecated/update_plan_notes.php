<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['request_id']) || !isset($data['notes'])) {
    echo json_encode(["status" => "error", "message" => "Missing request_id or notes."]);
    exit;
}

$request_id = $data['request_id'];
$notes = $data['notes'];

try {
    // Update the latest plan for this request
    $sql = "UPDATE treatment_plans SET clinical_notes = :notes 
            WHERE request_id = :rid 
            ORDER BY created_at DESC LIMIT 1";
    
    // Note: PDO UPDATE with ORDER BY/LIMIT works but we need to find the ID first usually for safety
    // or just use a subquery if the DB supports it in UPDATE.
    
    $stmt = $pdo->prepare("UPDATE treatment_plans SET clinical_notes = :notes WHERE request_id = :rid ORDER BY created_at DESC LIMIT 1");
    $stmt->execute(['notes' => $notes, 'rid' => $request_id]);

    echo json_encode(["status" => "success", "message" => "Clinical notes updated."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
