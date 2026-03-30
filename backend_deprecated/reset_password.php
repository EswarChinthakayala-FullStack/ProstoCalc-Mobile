<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->role) || empty($data->otp) || empty($data->new_password)) {
    echo json_encode(["status" => "error", "message" => "Incomplete details."]);
    exit;
}

$email = strtolower(trim($data->email));
$role = $data->role;
$otp = $data->otp;
$new_password = $data->new_password;

try {
    // 1. Re-verify OTP
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
    
    if (!$stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Invalid session or OTP expired."]);
        exit;
    }

    // 2. Hash new password
    $password_hash = password_hash($new_password, PASSWORD_BCRYPT);

    // 3. Update password in user table
    $table = ($role === 'dentist') ? 'dentists' : 'patients';
    $stmt = $pdo->prepare("UPDATE $table SET password_hash = :password_hash WHERE email = :email");
    $stmt->execute([
        'password_hash' => $password_hash,
        'email' => $email
    ]);

    // 4. Clear OTP record
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = :email AND role = :role");
    $stmt->execute(['email' => $email, 'role' => $role]);

    echo json_encode(["status" => "success", "message" => "Password updated successfully."]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
