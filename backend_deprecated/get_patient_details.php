<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

if(!isset($_GET['patient_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing patient ID."]);
    exit;
}

$patient_id = intval($_GET['patient_id']);

try {
    // Join patients with patient_locations, dentists, and patient_profiles
    $stmt = $pdo->prepare("SELECT p.id, p.full_name, p.email, 
                                 l.latitude, l.longitude, l.street_address, 
                                 l.city, l.district, l.state, l.postal_code, l.country,
                                 d.full_name as doctor_name, d.clinic_name, d.license_number, d.email as doctor_email,
                                 pp.age, pp.gender, pp.medical_history
                          FROM patients p 
                          LEFT JOIN patient_locations l ON p.id = l.patient_id 
                          LEFT JOIN dentists d ON p.dentist_id = d.id
                          LEFT JOIN patient_profiles pp ON p.id = pp.patient_id
                          WHERE p.id = :id");
    $stmt->execute(['id' => $patient_id]);
    
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if($patient) {
        echo json_encode(["status" => "success", "data" => $patient]);
    } else {
        echo json_encode(["status" => "error", "message" => "Patient not found."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
