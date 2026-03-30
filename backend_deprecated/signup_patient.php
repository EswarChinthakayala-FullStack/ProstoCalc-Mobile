<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

// Get JSON input
$data = json_decode(file_get_contents("php://input"));

if(empty($data->full_name) || empty($data->email) || empty($data->password)) {
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
    exit;
}

$full_name = htmlspecialchars(strip_tags($data->full_name));
$email = strtolower(htmlspecialchars(strip_tags($data->email)));
$password = $data->password;

// Hash password
$password_hash = password_hash($password, PASSWORD_BCRYPT);

try {
    // Check if email already exists
    $check_stmt = $pdo->prepare("SELECT id FROM patients WHERE email = :email");
    $check_stmt->execute(['email' => $email]);
    
    if($check_stmt->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "This email address is already associated with an account. Please sign in."]);
        exit;
    }

    // Insert new patient
    $sql = "INSERT INTO patients (full_name, email, password_hash) VALUES (:full_name, :email, :password_hash)";
    $stmt = $pdo->prepare($sql);
    
    $stmt->bindParam(':full_name', $full_name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password_hash', $password_hash);
    
    if($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Profile created successfully. You may now log in."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Unable to create profile at this time. Please try again later."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
