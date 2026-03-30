<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

// Get JSON input
$data = json_decode(file_get_contents("php://input"));

if(empty($data->email) || empty($data->password)) {
    echo json_encode(["status" => "error", "message" => "Incomplete credentials."]);
    exit;
}

$email = strtolower(htmlspecialchars(strip_tags($data->email)));
$password = $data->password;

try {
    $stmt = $pdo->prepare("SELECT id, full_name, password_hash FROM dentists WHERE email = :email");
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $id = $row['id'];
        $full_name = $row['full_name'];
        $hashed_password = $row['password_hash'];
        
        if(password_verify($password, $hashed_password)) {
            echo json_encode([
                "status" => "success", 
                "message" => "Clinician authorized.",
                "user" => ["id" => $id, "full_name" => $full_name]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Credentials do not match our records."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "User not found."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
