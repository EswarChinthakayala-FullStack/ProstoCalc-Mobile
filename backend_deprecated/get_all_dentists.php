<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

try {
    // Only fetch dentists who haven't opted out of visibility
    $sql = "SELECT d.id, d.full_name, d.clinic_name, 
                   COALESCE(s.accept_patient_requests, 1) as accept_patient_requests,
                   COALESCE(s.consultation_mode, 'FULL') as consultation_mode
            FROM dentists d
            LEFT JOIN dentist_settings s ON d.id = s.dentist_id
            WHERE s.visible_to_patients IS NULL OR s.visible_to_patients = 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $dentists = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert booleans
    foreach ($dentists as &$d) {
        $d['accept_patient_requests'] = (bool)$d['accept_patient_requests'];
    }

    echo json_encode(["status" => "success", "data" => $dentists]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
