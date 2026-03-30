<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$dentist_id = $_GET['dentist_id'] ?? null;

if (!$dentist_id) {
    echo json_encode(["status" => "error", "message" => "Missing dentist ID"]);
    exit;
}

try {
    // Fetch recent estimations
    $stmt = $pdo->prepare("
        SELECT * FROM ai_cost_estimations 
        WHERE dentist_id = :did 
        ORDER BY created_at DESC 
        LIMIT 50
    ");
    $stmt->execute(['did' => $dentist_id]);
    $estimations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Enrich with items and explanations
    foreach ($estimations as &$est) {
        $eid = $est['id'];
        
        // Get Items
        $stmtItems = $pdo->prepare("SELECT treatment_name, subtotal FROM ai_cost_estimation_items WHERE ai_cost_estimation_id = :eid");
        $stmtItems->execute(['eid' => $eid]);
        $est['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
        
        // Get Explanations
        $stmtExpl = $pdo->prepare("SELECT explanation_text FROM ai_treatment_explanations WHERE ai_cost_estimation_id = :eid ORDER BY created_at DESC LIMIT 1");
        $stmtExpl->execute(['eid' => $eid]);
        $explanations = $stmtExpl->fetchAll(PDO::FETCH_ASSOC);
        $est['explanations'] = $explanations;
    }
    
    echo json_encode(["status" => "success", "data" => $estimations]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
