<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['patient_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing patient ID."]);
    exit;
}

$id = intval($data['patient_id']);
$age = intval($data['age'] ?? 0);
$gender = $data['gender'] ?? '';
$history = $data['medical_history'] ?? '';

try {
    // Check if profile exists
    $stmt = $pdo->prepare("SELECT patient_id FROM patient_profiles WHERE patient_id = :id");
    $stmt->execute(['id' => $id]);
    
    if ($stmt->fetch()) {
        // Update
        $sql = "UPDATE patient_profiles SET age = :age, gender = :gender, medical_history = :his WHERE patient_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['age' => $age, 'gender' => $gender, 'his' => $history, 'id' => $id]);
    } else {
        // Insert
        $sql = "INSERT INTO patient_profiles (patient_id, age, gender, medical_history) VALUES (:id, :age, :gender, :his)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id, 'age' => $age, 'gender' => $gender, 'his' => $history]);
    }
    
    echo json_encode(["status" => "success", "message" => "Profile updated successfully."]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
