<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

// Get JSON input
$data = json_decode(file_get_contents("php://input"));

if(empty($data->full_name) || empty($data->clinic_name) || empty($data->license_number) || empty($data->email) || empty($data->password)) {
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
    exit;
}

$full_name = htmlspecialchars(strip_tags($data->full_name));
$clinic_name = htmlspecialchars(strip_tags($data->clinic_name));
$license_number = htmlspecialchars(strip_tags($data->license_number));
$email = strtolower(htmlspecialchars(strip_tags($data->email)));
$password = $data->password;

// Hash password
$password_hash = password_hash($password, PASSWORD_BCRYPT);

try {
    // Check if email or license already exists
    $check_stmt = $pdo->prepare("SELECT id FROM dentists WHERE email = :email OR license_number = :license_number");
    $check_stmt->execute(['email' => $email, 'license_number' => $license_number]);
    
    if($check_stmt->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Account already exists with this Email or License Number."]);
        exit;
    }

    // Insert new dentist
    $sql = "INSERT INTO dentists (full_name, clinic_name, license_number, email, password_hash) VALUES (:full_name, :clinic_name, :license_number, :email, :password_hash)";
    $stmt = $pdo->prepare($sql);
    
    $stmt->bindParam(':full_name', $full_name);
    $stmt->bindParam(':clinic_name', $clinic_name);
    $stmt->bindParam(':license_number', $license_number);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password_hash', $password_hash);
    
    if($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Clinician profile registered. Optimization pending verification."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Registration error. Please check your details."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
