<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['estimation_id']) || !isset($data['text'])) {
    echo json_encode(["status" => "error", "message" => "Missing estimation ID or explanation text."]);
    exit;
}

$est_id = $data['estimation_id'];
$text = $data['text'];
$context = $data['context'] ?? 'calculator'; // calculator, approved_plan, timeline
$lang = $data['language'] ?? 'en';

try {
    $sql = "INSERT INTO ai_treatment_explanations (ai_cost_estimation_id, context, explanation_text, language, disclaimer_version) VALUES (:eid, :ctx, :txt, :lang, :disc)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'eid' => $est_id,
        'ctx' => $context,
        'txt' => $text,
        'lang' => $lang,
        'disc' => 'v1.0'
    ]);
    
    echo json_encode(["status" => "success", "message" => "Explanation saved."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
