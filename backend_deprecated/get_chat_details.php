<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$chat_id = $_GET['chat_id'] ?? null;

if (!$chat_id) {
    echo json_encode(["status" => "error", "message" => "Missing chat_id."]);
    exit;
}

try {
    // We want the chat details plus the current clinical status of the session
    $sql = "SELECT c.*, a.request_id, latest.visit_status 
            FROM chats c 
            JOIN appointments a ON c.appointment_id = a.id 
            LEFT JOIN (
                SELECT request_id, visit_status 
                FROM appointments 
                WHERE id IN (SELECT MAX(id) FROM appointments GROUP BY request_id)
            ) latest ON a.request_id = latest.request_id
            WHERE c.id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $chat_id]);
    $details = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($details) {
        echo json_encode($details);
    } else {
        echo json_encode(["status" => "error", "message" => "Chat details not found."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>

