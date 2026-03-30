<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'db_connect.php';

// Securely identify user and role from request
$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0; 
$userRole = isset($_GET['role']) && in_array($_GET['role'], ['patient', 'dentist']) ? $_GET['role'] : 'patient';

// Stop if identity is missing
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid patient or clinician identity']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $message = $data['message'] ?? '';
    $response = $data['response'] ?? '';

    if ($message && $response) {
        try {
            $stmt = $pdo->prepare("INSERT INTO ai_chats (user_id, user_role, message, response) VALUES (?, ?, ?, ?)");
            if ($stmt->execute([$userId, $userRole, $message, $response])) {
                echo json_encode(['status' => 'success']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Database error']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Return last 10 messages
        $stmt = $pdo->prepare("SELECT message, response, created_at FROM ai_chats WHERE user_id = ? AND user_role = ? ORDER BY created_at DESC LIMIT 10");
        $stmt->execute([$userId, $userRole]);
        $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Return in chronological order, wrapped for APIService
        echo json_encode(['status' => 'success', 'data' => array_reverse($chats)]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
?>
