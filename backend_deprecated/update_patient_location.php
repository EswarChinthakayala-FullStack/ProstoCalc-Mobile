<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

// Get JSON input
$data = json_decode(file_get_contents("php://input"));

if(empty($data->patient_id) || !isset($data->latitude) || !isset($data->longitude)) {
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
    exit;
}

$patient_id = intval($data->patient_id);
$latitude = floatval($data->latitude);
$longitude = floatval($data->longitude);

try {
    $sql = "UPDATE patients SET latitude = :lat, longitude = :lng WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    
    $stmt->bindParam(':lat', $latitude);
    $stmt->bindParam(':lng', $longitude);
    $stmt->bindParam(':id', $patient_id);
    
    if($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Location updated successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Update failed."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
