<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

// This script simulates a server-side AI calculation engine.
// It applies dental pricing rules, GST, and generates clinical justifications.

$data = json_decode(file_get_contents("php://input"));

if(empty($data->treatment_type) || empty($data->dentist_id)) {
    echo json_encode(["status" => "error", "message" => "Incomplete parameters for AI analysis."]);
    exit;
}

$type = $data->treatment_type;
$complexity = $data->complexity ?? 'Medium';
$material = $data->material ?? 'Standard';
$teeth = $data->teeth_count ?? 1;

// 1. Fetch base price from database
try {
    $sql = "SELECT COALESCE(d.custom_cost, c.default_cost) as effective_cost 
            FROM treatment_catalog c 
            LEFT JOIN dentist_treatment_costs d ON c.id = d.treatment_id AND d.dentist_id = :d_id 
            WHERE c.name = :t_name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['d_id' => $data->dentist_id, 't_name' => $type]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $unit_price = $result ? (float)$result['effective_cost'] : 1000.0;
} catch (PDOException $e) {
    $unit_price = 1000.0;
}

$multiplier = 1.0;

switch($complexity) {
    case 'Low': $multiplier *= 0.9; break;
    case 'High': $multiplier *= 1.25; break;
}

switch($material) {
    case 'Premium': $multiplier *= 1.15; break;
    case 'Biocompatible': $multiplier *= 1.3; break;
}

// Apply volume discount for multiple teeth
$volume_discount = ($teeth > 1) ? 0.95 : 1.0;

$raw_total = $unit_price * $teeth * $multiplier * $volume_discount;
$gst = $raw_total * 0.05; // Reduced GST simulation from 18% to 5% for medical services
$final_total = $raw_total + $gst;

// 2. AI-Generated clinical justification and recommendations
$justifications = [
    "The proposed $type procedure for $teeth unit(s) is clinically indicated based on the $complexity level reported. The use of $material grade material ensures optimal long-term success.",
    "Critical Note: For $teeth teeth involving $type, our AI model suggests a focused follow-up after 48 hours to monitor tissue adaptation.",
    "Clinical Justification: The $complexity complexity necessitates a multi-session approach. $material materials were selected to prevent secondary inflammation."
];

$recommendations = [
    "Post-op imaging recommended at 4 weeks.",
    "Recommend sensitive-care oral hygiene kit.",
    "Advised soft food diet for initial 72 hours."
];

$explanation = $justifications[array_rand($justifications)];
$rec = $recommendations[array_rand($recommendations)];

echo json_encode([
    "status" => "success",
    "data" => [
        "base_cost" => round($raw_total, 2),
        "gst" => round($gst, 2),
        "total_cost" => round($final_total, 2),
        "clinical_justification" => $explanation,
        "recommendation" => $rec,
        "engine_version" => "ProstoAI-v2.1"
    ]
]);
?>
