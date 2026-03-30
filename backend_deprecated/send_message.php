<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['chat_id']) || !isset($data['sender_role']) || !isset($data['message'])) {
    echo json_encode(["status" => "error", "message" => "Missing data."]);
    exit;
}

$chat_id = $data['chat_id'];
$role = $data['sender_role'];
$msg = $data['message'];

try {
    // Check if chat is active
    $stmt = $pdo->prepare("SELECT is_active FROM chats WHERE id = :id");
    $stmt->execute(['id' => $chat_id]);
    $chat = $stmt->fetch();

    if (!$chat || !$chat['is_active']) {
        echo json_encode(["status" => "error", "message" => "This chat is no longer active."]);
        exit;
    }

    $sql = "INSERT INTO messages (chat_id, sender_role, message) VALUES (:c_id, :role, :msg)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['c_id' => $chat_id, 'role' => $role, 'msg' => $msg]);

    echo json_encode(["status" => "success", "message" => "Message sent."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
