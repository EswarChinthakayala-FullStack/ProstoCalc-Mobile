<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : 0;
$lng = isset($_GET['lng']) ? floatval($_GET['lng']) : 0;
$radius = isset($_GET['radius']) ? floatval($_GET['radius']) : 5000; // default 5000km for dev

try {
    // Basic Haversine formula to find nearby clinics with profile details
    $query = "SELECT d.id, d.full_name, d.clinic_name, d.clinic_address, d.clinic_city, d.clinic_phone, d.latitude, d.longitude,
              p.specialization,
              (6371 * acos(pmin(1, pmax(-1, cos(radians(:lat)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(d.latitude)))))) AS distance
              FROM dentists d
              LEFT JOIN dentist_profiles p ON d.id = p.dentist_id
              HAVING distance < :radius
              ORDER BY distance ASC";
    
    // Note: pmin/pmax or LEAST/GREATEST is needed to prevent float precision errors in ACOS
    // Since MySQL uses LEAST/GREATEST:
    $query = "SELECT d.id, d.full_name, d.clinic_name, d.clinic_address, d.clinic_city, d.clinic_phone, d.latitude, d.longitude,
              p.specialization,
              (6371 * acos(GREATEST(-1, LEAST(1, cos(radians(:lat)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(d.latitude)))))) AS distance
              FROM dentists d
              LEFT JOIN dentist_profiles p ON d.id = p.dentist_id
              LEFT JOIN dentist_settings s ON d.id = s.dentist_id
              WHERE (s.visible_to_patients IS NULL OR s.visible_to_patients = 1)
              AND (s.consultation_mode IS NULL OR s.consultation_mode = 'FULL')
              AND (s.accept_patient_requests IS NULL OR s.accept_patient_requests = 1)
              HAVING distance < :radius
              ORDER BY distance ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'lat' => $lat,
        'lng' => $lng,
        'radius' => $radius
    ]);
    
    $clinics = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ensure numeric types are correct for iOS decoding
    foreach ($clinics as &$clinic) {
        $clinic['id'] = intval($clinic['id']);
        $clinic['latitude'] = floatval($clinic['latitude']);
        $clinic['longitude'] = floatval($clinic['longitude']);
        $clinic['distance'] = floatval($clinic['distance'] ?? 0);
    }
    
    echo json_encode(["status" => "success", "data" => $clinics]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
