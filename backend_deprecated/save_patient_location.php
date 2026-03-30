<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

// Get JSON input
$data = json_decode(file_get_contents("php://input"));
file_put_contents('debug.log', "Request: " . json_encode($data) . "\n", FILE_APPEND);

if(empty($data->patient_id) || !isset($data->latitude) || !isset($data->longitude)) {
    file_put_contents('debug.log', "Error: Incomplete data. Received: " . json_encode($data) . "\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Incomplete location data."]);
    exit;
}

$patient_id = intval($data->patient_id);
$latitude = floatval($data->latitude);
$longitude = floatval($data->longitude);
$street_address = isset($data->street_address) ? htmlspecialchars(strip_tags($data->street_address)) : null;
$city = isset($data->city) ? htmlspecialchars(strip_tags($data->city)) : null;
$district = isset($data->district) ? htmlspecialchars(strip_tags($data->district)) : null;
$state = isset($data->state) ? htmlspecialchars(strip_tags($data->state)) : null;
$postal_code = isset($data->postal_code) ? htmlspecialchars(strip_tags($data->postal_code)) : null;
$country = isset($data->country) ? htmlspecialchars(strip_tags($data->country)) : null;

try {
    // Check if location record exists for this patient
    $check_stmt = $pdo->prepare("SELECT id FROM patient_locations WHERE patient_id = :patient_id");
    $check_stmt->execute(['patient_id' => $patient_id]);
    
    if($check_stmt->rowCount() > 0) {
        // Update existing record
        $sql = "UPDATE patient_locations SET 
                latitude = :lat, 
                longitude = :lng, 
                street_address = :street,
                city = :city,
                district = :district,
                state = :state,
                postal_code = :zip,
                country = :country
                WHERE patient_id = :id";
    } else {
        // Insert new record
        $sql = "INSERT INTO patient_locations 
                (patient_id, latitude, longitude, street_address, city, district, state, postal_code, country) 
                VALUES 
                (:id, :lat, :lng, :street, :city, :district, :state, :zip, :country)";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id', $patient_id);
    $stmt->bindParam(':lat', $latitude);
    $stmt->bindParam(':lng', $longitude);
    $stmt->bindParam(':street', $street_address);
    $stmt->bindParam(':city', $city);
    $stmt->bindParam(':district', $district);
    $stmt->bindParam(':state', $state);
    $stmt->bindParam(':zip', $postal_code);
    $stmt->bindParam(':country', $country);
    
    if($stmt->execute()) {
        // Also update the main patients table for quick access if needed (optional but good for backwards compat)
        $update_main = $pdo->prepare("UPDATE patients SET latitude = :lat, longitude = :lng WHERE id = :id");
        $update_main->execute([':lat' => $latitude, ':lng' => $longitude, ':id' => $patient_id]);
        
        echo json_encode(["status" => "success", "message" => "Location details saved successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to save location details."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
