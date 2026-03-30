<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$notif_id = $data['notification_id'] ?? null;

if (!$notif_id) {
    echo json_encode(["status" => "error", "message" => "Missing ID."]);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
    $stmt->execute(['id' => $notif_id]);
    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
