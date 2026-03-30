<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['dentist_id']) || !isset($data['treatments'])) {
    echo json_encode(["status" => "error", "message" => "Missing data."]);
    exit;
}

$dentist_id = $data['dentist_id'];
$treatments = $data['treatments']; // Array of {treatment_id, custom_cost, is_enabled}

try {
    $pdo->beginTransaction();

    $check_stmt = $pdo->prepare("SELECT id FROM treatment_catalog WHERE name = :name LIMIT 1");
    $insert_cat_stmt = $pdo->prepare("INSERT INTO treatment_catalog (name, category, default_cost) VALUES (:name, :category, :cost)");
    
    $upsert_stmt = $pdo->prepare("INSERT INTO dentist_treatment_costs (dentist_id, treatment_id, custom_cost, is_enabled) 
            VALUES (:d_id, :t_id, :cost, :enabled)
            ON DUPLICATE KEY UPDATE custom_cost = :cost, is_enabled = :enabled");

    foreach ($treatments as $t) {
        $t_id = isset($t['treatment_id']) ? intval($t['treatment_id']) : 0;
        
        if ($t_id == 0 && !empty($t['name'])) {
            // New Treatment Logic
            $check_stmt->execute(['name' => $t['name']]);
            $existing = $check_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                $t_id = $existing['id'];
            } else {
                $insert_cat_stmt->execute([
                    'name' => $t['name'],
                    'category' => isset($t['category']) ? $t['category'] : 'GENERAL',
                    'cost' => isset($t['custom_cost']) ? $t['custom_cost'] : 0
                ]);
                $t_id = $pdo->lastInsertId();
            }
        }
        
        if ($t_id > 0) {
            $upsert_stmt->execute([
                'd_id' => $dentist_id,
                't_id' => $t_id,
                'cost' => $t['custom_cost'],
                'enabled' => isset($t['is_enabled']) ? ($t['is_enabled'] ? 1 : 0) : 1
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Pricing updated successfully."]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
