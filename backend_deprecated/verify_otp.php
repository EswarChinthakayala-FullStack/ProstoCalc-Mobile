<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->role) || empty($data->otp)) {
    echo json_encode(["status" => "error", "message" => "Incomplete details."]);
    exit;
}

$email = strtolower(trim($data->email));
$role = $data->role;
$otp = $data->otp;

try {
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT id FROM password_resets 
                           WHERE email = :email AND role = :role AND otp = :otp 
                           AND expires_at > :now 
                           ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([
        'email' => $email,
        'role' => $role,
        'otp' => $otp,
        'now' => $now
    ]);
    
    $reset = $stmt->fetch();

    if ($reset) {
        echo json_encode(["status" => "success", "message" => "OTP verified."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid or expired OTP."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
