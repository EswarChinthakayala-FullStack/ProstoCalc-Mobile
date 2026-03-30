<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$dentist_id = $_GET['dentist_id'] ?? null;

if (!$dentist_id) {
    echo json_encode(["status" => "error", "message" => "Missing dentist ID."]);
    exit;
}

try {
    // Join master catalog with dentist-specific overrides
    $sql = "SELECT c.*, 
            d.custom_cost, 
            COALESCE(d.is_enabled, 1) as is_enabled,
            COALESCE(d.custom_cost, c.default_cost) as effective_cost
            FROM treatment_catalog c
            LEFT JOIN dentist_treatment_costs d ON c.id = d.treatment_id AND d.dentist_id = :d_id
            ORDER BY c.category, c.name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['d_id' => $dentist_id]);
    $treatments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $treatments]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
