<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if(empty($data->dentist_id) || empty($data->latitude) || empty($data->longitude)) {
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
    exit;
}

$dentist_id = intval($data->dentist_id);
$latitude = $data->latitude;
$longitude = $data->longitude;
$clinic_name = $data->clinic_name ?? '';
$clinic_address = $data->clinic_address ?? '';
$clinic_city = $data->clinic_city ?? '';
$clinic_phone = $data->clinic_phone ?? '';

try {
    $stmt = $pdo->prepare("UPDATE dentists SET 
                            clinic_name = :clinic_name,
                            latitude = :latitude, 
                            longitude = :longitude, 
                            clinic_address = :clinic_address,
                            clinic_city = :clinic_city,
                            clinic_phone = :clinic_phone
                          WHERE id = :dentist_id");
    
    $stmt->execute([
        'clinic_name' => $clinic_name,
        'latitude' => $latitude,
        'longitude' => $longitude,
        'clinic_address' => $clinic_address,
        'clinic_city' => $clinic_city,
        'clinic_phone' => $clinic_phone,
        'dentist_id' => $dentist_id
    ]);
    
    echo json_encode(["status" => "success", "message" => "Clinic details updated successfully."]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
