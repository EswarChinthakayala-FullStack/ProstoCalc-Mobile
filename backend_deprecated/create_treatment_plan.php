<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['dentist_id']) || !isset($data['items'])) {
    echo json_encode(["status" => "error", "message" => "Missing core data."]);
    exit;
}

$dentist_id = $data['dentist_id'];
$patient_id = (!empty($data['patient_id'])) ? $data['patient_id'] : null;
$request_id = (!empty($data['request_id'])) ? $data['request_id'] : null;
$items = $data['items'];
$share_costs = $data['share_cost_details'] ?? false;
$share_ai = $data['share_ai_explanation'] ?? false;
$status = $data['status'] ?? 'DRAFT';

try {
    $pdo->beginTransaction();

    // 1. Calculate Total Cost
    $total_cost = 0;
    foreach ($items as $item) {
        $total_cost += (float)$item['cost'];
    }

    // 2. Generate Simulated AI Explanation if empty
    $ai_explanation = $data['ai_explanation'] ?? "";
    if (empty($ai_explanation)) {
        $ai_explanation = "Based on the selected procedures (" . count($items) . " items), the estimated cost of ₹" . number_with_commas($total_cost) . " covers local anesthesia, clinical preparation, and follow-up support.";
    }

    // 3. Insert Treatment Plan
    $plan_sql = "INSERT INTO treatment_plans (dentist_id, patient_id, request_id, total_cost, ai_explanation, clinical_notes, share_cost_details, share_ai_explanation, status) 
                 VALUES (:d_id, :p_id, :r_id, :total, :ai, :notes, :sc, :sa, :stat)";
    $plan_stmt = $pdo->prepare($plan_sql);
    $plan_stmt->execute([
        'd_id' => $dentist_id,
        'p_id' => $patient_id,
        'r_id' => $request_id,
        'total' => $total_cost,
        'ai' => $ai_explanation,
        'notes' => $data['clinical_notes'] ?? null,
        'sc' => $share_costs ? 1 : 0,
        'sa' => $share_ai ? 1 : 0,
        'stat' => $status
    ]);
    
    $plan_id = $pdo->lastInsertId();

    // 4. Insert Items
    $item_sql = "INSERT INTO treatment_plan_items (plan_id, treatment_id, tooth_number, cost_override, sessions_estimate) 
                 VALUES (:p_id, :t_id, :tooth, :cost, :sessions)";
    $item_stmt = $pdo->prepare($item_sql);
    
    foreach ($items as $item) {
        // Use isset() because 0 is a valid but "empty" treatment ID for AI items we want to keep as 0 or null
        // If treatmentId is 0, we can treat it as null for catalog purposes but store it correctly.
        $t_id = (isset($item['treatment_id']) && $item['treatment_id'] !== 0) ? $item['treatment_id'] : null;
        $tooth = (!empty($item['tooth_number'])) ? $item['tooth_number'] : null;
        $item_stmt->execute([
            'p_id' => $plan_id,
            't_id' => $t_id,
            'tooth' => $tooth,
            'cost' => $item['cost'],
            'sessions' => $item['sessions'] ?? 1
        ]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "data" => ["plan_id" => $plan_id, "total_cost" => $total_cost, "ai_explanation" => $ai_explanation]]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

function number_with_commas($n) {
    return number_format($n, 2, '.', ',');
}
?>
