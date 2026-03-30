<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['dentist_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing dentist ID."]);
    exit;
}

$id = intval($data['dentist_id']);
$specialization = $data['specialization'] ?? '';
$experience = intval($data['experience_years'] ?? 0);
$fee = floatval($data['consultation_fee'] ?? 0.0);

try {
    // Check if profile exists
    $stmt = $pdo->prepare("SELECT dentist_id FROM dentist_profiles WHERE dentist_id = :id");
    $stmt->execute(['id' => $id]);
    
    if ($stmt->fetch()) {
        // Update
        $sql = "UPDATE dentist_profiles SET specialization = :spec, experience_years = :exp, consultation_fee = :fee WHERE dentist_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['spec' => $specialization, 'exp' => $experience, 'fee' => $fee, 'id' => $id]);
    } else {
        // Insert
        $sql = "INSERT INTO dentist_profiles (dentist_id, specialization, experience_years, consultation_fee) VALUES (:id, :spec, :exp, :fee)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id, 'spec' => $specialization, 'exp' => $experience, 'fee' => $fee]);
    }
    
    echo json_encode(["status" => "success", "message" => "Profile updated successfully."]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
