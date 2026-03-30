<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$role = $_GET['role'] ?? null; // 'PATIENT' or 'DENTIST'
$id = $_GET['id'] ?? null;

if (!$role || !$id) {
    echo json_encode(["status" => "error", "message" => "Missing role or ID."]);
    exit;
}

try {
    if ($role === 'DENTIST') {
        $sql = "SELECT r.*, p.full_name as patient_name, 
                (SELECT id FROM chats WHERE appointment_id IN (SELECT id FROM appointments WHERE request_id = r.id) LIMIT 1) as chat_id,
                a.visit_status, a.scheduled_date, a.rescheduled_from
                FROM consultation_requests r 
                JOIN patients p ON r.patient_id = p.id 
                LEFT JOIN (
                    SELECT * FROM appointments WHERE id IN (SELECT MAX(id) FROM appointments GROUP BY request_id)
                ) a ON r.id = a.request_id
                WHERE r.dentist_id = :id 
                ORDER BY r.requested_at DESC";
    } else {
        $sql = "SELECT r.*, d.full_name as dentist_name, d.clinic_name, 
                (SELECT id FROM chats WHERE appointment_id IN (SELECT id FROM appointments WHERE request_id = r.id) LIMIT 1) as chat_id,
                a.visit_status, a.scheduled_date, a.rescheduled_from
                FROM consultation_requests r 
                JOIN dentists d ON r.dentist_id = d.id 
                LEFT JOIN (
                    SELECT * FROM appointments WHERE id IN (SELECT MAX(id) FROM appointments GROUP BY request_id)
                ) a ON r.id = a.request_id
                WHERE r.patient_id = :id 
                ORDER BY r.requested_at DESC";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // For each request that was rescheduled, fetch the original date and reason
    foreach ($requests as &$req) {
        if (!empty($req['rescheduled_from'])) {
            $orig_stmt = $pdo->prepare("
                SELECT a.scheduled_date, h.reason 
                FROM appointments a
                LEFT JOIN appointment_status_history h ON a.id = h.appointment_id 
                WHERE a.id = :old_id AND h.new_status = 'postponed'
                LIMIT 1
            ");
            $orig_stmt->execute(['old_id' => $req['rescheduled_from']]);
            $orig_data = $orig_stmt->fetch(PDO::FETCH_ASSOC);
            if ($orig_data) {
                $req['original_date'] = $orig_data['scheduled_date'];
                $req['postpone_reason'] = $orig_data['reason'];
            }
        }
    }

    echo json_encode(["status" => "success", "data" => $requests]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>

