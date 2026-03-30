<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$chat_id = $_GET['chat_id'] ?? null;

if (!$chat_id) {
    echo json_encode(["status" => "error", "message" => "Missing chat ID."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM messages WHERE chat_id = :id ORDER BY sent_at ASC");
    $stmt->execute(['id' => $chat_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $messages]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
