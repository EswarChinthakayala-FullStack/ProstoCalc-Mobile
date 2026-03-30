<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$user_id = $_GET['user_id'] ?? null;
$user_type = $_GET['user_type'] ?? null; // 'PATIENT' or 'DENTIST'

if (!$user_id || !$user_type) {
    echo json_encode(["status" => "error", "message" => "Missing parameters."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = :u_id AND user_type = :u_type ORDER BY created_at DESC LIMIT 50");
    $stmt->execute(['u_id' => $user_id, 'u_type' => $user_type]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $items]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
