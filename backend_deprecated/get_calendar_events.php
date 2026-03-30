<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$role = $_GET['role'] ?? null; // 'PATIENT' or 'DENTIST'
$user_id = $_GET['user_id'] ?? null;
$month = $_GET['month'] ?? date('m');
$year = $_GET['year'] ?? date('Y');

if (!$role || !$user_id) {
    echo json_encode(["status" => "error", "message" => "Missing parameters."]);
    exit;
}

try {
    if ($role === 'DENTIST') {
        $sql = "SELECT a.*, p.full_name as patient_name, r.request_message as request_type,
                       r.patient_id, r.dentist_id, r.status as request_status,
                       (SELECT id FROM chats WHERE request_id = r.id LIMIT 1) as chat_id,
                       d.full_name as dentist_name
                FROM appointments a
                JOIN consultation_requests r ON a.request_id = r.id
                JOIN patients p ON r.patient_id = p.id
                JOIN dentists d ON r.dentist_id = d.id
                WHERE r.dentist_id = :d_id 
                AND MONTH(a.scheduled_date) = :m 
                AND YEAR(a.scheduled_date) = :y";
        $params = ['d_id' => $user_id, 'm' => $month, 'y' => $year];
    } else {
        $sql = "SELECT a.*, d.full_name as dentist_name, d.clinic_name, r.request_message as request_type,
                       r.patient_id, r.dentist_id, r.status as request_status,
                       (SELECT id FROM chats WHERE request_id = r.id LIMIT 1) as chat_id,
                       p.full_name as patient_name
                FROM appointments a
                JOIN consultation_requests r ON a.request_id = r.id
                JOIN dentists d ON r.dentist_id = d.id
                JOIN patients p ON r.patient_id = p.id
                WHERE r.patient_id = :p_id 
                AND MONTH(a.scheduled_date) = :m 
                AND YEAR(a.scheduled_date) = :y";
        $params = ['p_id' => $user_id, 'm' => $month, 'y' => $year];
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $events]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
