<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['request_id']) || !isset($data['status'])) {
    echo json_encode(["status" => "error", "message" => "Missing request_id or status."]);
    exit;
}

$request_id = $data['request_id'];
$status = $data['status'];
$notes = $data['notes'] ?? null;

try {
    $pdo->beginTransaction();

    // 1. Insert into timeline history
    $sql = "INSERT INTO treatment_timeline (request_id, status, notes) VALUES (:r_id, :status, :notes)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['r_id' => $request_id, 'status' => $status, 'notes' => $notes]);

    // 2. Sync consultation_requests status if appropriate
    if ($status === 'COMPLETED') {
        $up_sql = "UPDATE consultation_requests SET status = 'COMPLETED' WHERE id = :id";
        $up_stmt = $pdo->prepare($up_sql);
        $up_stmt->execute(['id' => $request_id]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Timeline updated to $status."]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
