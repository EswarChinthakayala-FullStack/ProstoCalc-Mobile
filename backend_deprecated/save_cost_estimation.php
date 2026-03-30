<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['total_cost']) || !isset($data['items'])) {
    echo json_encode(["status" => "error", "message" => "Missing core parameters."]);
    exit;
}

$user_id = $data['user_id'];
$patient_id = $data['patient_id'] ?? null;
$dentist_id = $data['dentist_id'] ?? null;
$mode = $data['mode'] ?? 'calculator'; // 'calculator' or 'approved'
$total_cost = $data['total_cost'];
$confidence = $data['confidence'] ?? 0.85;
$items = $data['items']; // Array of item details

try {
    $pdo->beginTransaction();

    // 1. Insert ai_cost_estimations
    $sql1 = "INSERT INTO ai_cost_estimations (user_id, patient_id, dentist_id, mode, total_estimated_cost, confidence_score) VALUES (:uid, :pid, :did, :mode, :total, :conf)";
    $stmt1 = $pdo->prepare($sql1);
    $stmt1->execute([
        'uid' => $user_id,
        'pid' => $patient_id,
        'did' => $dentist_id,
        'mode' => $mode,
        'total' => $total_cost,
        'conf' => $confidence
    ]);
    
    $est_id = $pdo->lastInsertId();

    // 2. Insert items
    $sql2 = "INSERT INTO ai_cost_estimation_items (ai_cost_estimation_id, treatment_name, unit_cost, quantity, subtotal, cost_source) VALUES (:eid, :name, :cost, :qty, :subtotal, :source)";
    $stmt2 = $pdo->prepare($sql2);

    foreach ($items as $item) {
        $stmt2->execute([
            'eid' => $est_id,
            'name' => $item['name'],
            'cost' => $item['cost'],
            'qty' => $item['quantity'] ?? 1,
            'subtotal' => $item['subtotal'] ?? ($item['cost'] * ($item['quantity'] ?? 1)),
            'source' => $item['source'] ?? 'default'
        ]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "data" => ["estimation_id" => (int)$est_id]]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
