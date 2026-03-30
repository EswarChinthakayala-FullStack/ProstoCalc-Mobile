<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$request_id = $_GET['request_id'] ?? null;

if (!$request_id) {
    echo json_encode(["status" => "error", "message" => "Missing request_id."]);
    exit;
}

try {
    $sql = "SELECT * FROM treatment_timeline WHERE request_id = :id ORDER BY updated_at ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $request_id]);
    $timeline = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $timeline]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
