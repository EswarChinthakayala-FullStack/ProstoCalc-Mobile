<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->role)) {
    echo json_encode(["status" => "error", "message" => "Email and role are required."]);
    exit;
}

$email = strtolower(trim($data->email));
$role = $data->role; // 'patient' or 'dentist'

try {
    // Check if user exists
    $table = ($role === 'dentist') ? 'dentists' : 'patients';
    $stmt = $pdo->prepare("SELECT id FROM $table WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "No account found with this email."]);
        exit;
    }

    // Generate 6-digit OTP
    $otp = sprintf("%06d", mt_rand(0, 999999));
    // Use TIMESTAMP and UTC for consistency
    $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Clear old OTPs for this email
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = :email AND role = :role");
    $stmt->execute(['email' => $email, 'role' => $role]);

    // Save new OTP
    $stmt = $pdo->prepare("INSERT INTO password_resets (email, otp, role, expires_at) VALUES (:email, :otp, :role, :expires_at)");
    $stmt->execute([
        'email' => $email,
        'otp' => $otp,
        'role' => $role,
        'expires_at' => $expires_at
    ]);

    // Return the OTP in the response for simulation (in-app notification delivery)
    echo json_encode([
        "status" => "success", 
        "message" => "OTP sent successfully.",
        "otp" => $otp // In a real app, this would be sent via email/SMS and not returned here.
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
