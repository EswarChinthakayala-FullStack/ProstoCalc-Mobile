<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

if(!isset($_GET['dentist_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing dentist ID."]);
    exit;
}

$dentist_id = intval($_GET['dentist_id']);

try {
    $stmt = $pdo->prepare("SELECT d.id, d.full_name, d.clinic_name, d.license_number, d.email, d.latitude, d.longitude, d.clinic_address, d.clinic_city, d.clinic_phone, d.created_at,
                                 dp.specialization, dp.experience_years, dp.consultation_fee,
                                 ds.consultation_mode
                          FROM dentists d 
                          LEFT JOIN dentist_profiles dp ON d.id = dp.dentist_id
                          LEFT JOIN dentist_settings ds ON d.id = ds.dentist_id
                          WHERE d.id = :id");
    $stmt->execute(['id' => $dentist_id]);
    
    $dentist = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if($dentist) {
        echo json_encode(["status" => "success", "data" => $dentist]);
    } else {
        echo json_encode(["status" => "error", "message" => "Dentist not found."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
