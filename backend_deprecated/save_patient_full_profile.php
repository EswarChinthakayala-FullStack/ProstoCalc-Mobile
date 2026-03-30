<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['patient_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing patient ID."]);
    exit;
}

$id = intval($data['patient_id']);

try {
    $pdo->beginTransaction();

    // 1. Update/Insert Demographics (patient_profiles)
    $age = intval($data['age'] ?? 0);
    $gender = $data['gender'] ?? '';
    $history = $data['medical_history'] ?? '';

    $stmt = $pdo->prepare("SELECT patient_id FROM patient_profiles WHERE patient_id = :id");
    $stmt->execute(['id' => $id]);
    
    if ($stmt->fetch()) {
        $sql = "UPDATE patient_profiles SET age = :age, gender = :gender, medical_history = :his WHERE patient_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['age' => $age, 'gender' => $gender, 'his' => $history, 'id' => $id]);
    } else {
        $sql = "INSERT INTO patient_profiles (patient_id, age, gender, medical_history) VALUES (:id, :age, :gender, :his)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id, 'age' => $age, 'gender' => $gender, 'his' => $history]);
    }

    // 2. Update/Insert Location (patient_locations)
    if (isset($data['latitude']) && isset($data['longitude'])) {
        $lat = floatval($data['latitude']);
        $lng = floatval($data['longitude']);
        $street = $data['street_address'] ?? null;
        $city = $data['city'] ?? null;
        $state = $data['state'] ?? null;
        $zip = $data['postal_code'] ?? null;
        $country = $data['country'] ?? null;

        $check_stmt = $pdo->prepare("SELECT id FROM patient_locations WHERE patient_id = :patient_id");
        $check_stmt->execute(['patient_id' => $id]);
        
        if($check_stmt->rowCount() > 0) {
            $sql = "UPDATE patient_locations SET 
                    latitude = :lat, longitude = :lng, street_address = :street,
                    city = :city, state = :state, postal_code = :zip, country = :country
                    WHERE patient_id = :id";
        } else {
            $sql = "INSERT INTO patient_locations 
                    (patient_id, latitude, longitude, street_address, city, state, postal_code, country) 
                    VALUES (:id, :lat, :lng, :street, :city, :state, :zip, :country)";
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id, 'lat' => $lat, 'lng' => $lng, 'street' => $street,
            'city' => $city, 'state' => $state, 'zip' => $zip, 'country' => $country
        ]);

        // Also update main table for compatibility
        $update_main = $pdo->prepare("UPDATE patients SET latitude = :lat, longitude = :lng WHERE id = :id");
        $update_main->execute(['lat' => $lat, 'lng' => $lng, 'id' => $id]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Full clinical profile synchronized."]);

} catch(PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => "Security protocol failed: " . $e->getMessage()]);
}
?>
