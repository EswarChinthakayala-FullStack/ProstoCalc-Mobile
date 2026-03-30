<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['request_id']) || !isset($data['status'])) {
    echo json_encode(["status" => "error", "message" => "Missing data."]);
    exit;
}

$request_id = $data['request_id'];
$status = $data['status']; // 'APPROVED' or 'REJECTED'

try {
    $pdo->beginTransaction();

    // Update request status
    $stmt = $pdo->prepare("UPDATE consultation_requests SET status = :status, responded_at = CURRENT_TIMESTAMP WHERE id = :id");
    $stmt->execute(['status' => $status, 'id' => $request_id]);

    if ($status === 'APPROVED') {
        // Check if appointment already exists to prevent duplicates
        $check_stmt = $pdo->prepare("SELECT id FROM appointments WHERE request_id = :id");
        $check_stmt->execute(['id' => $request_id]);
        if ($check_stmt->fetch()) {
            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Appointment already exists."]);
            exit;
        }
       // Create appointment
        $date = $data['scheduled_date'];
        $time = $data['scheduled_time'];
        $duration = $data['duration_minutes'] ?? 30;

        $app_stmt = $pdo->prepare("INSERT INTO appointments (request_id, scheduled_date, scheduled_time, duration_minutes) VALUES (:r_id, :date, :time, :dur)");
        $app_stmt->execute(['r_id' => $request_id, 'date' => $date, 'time' => $time, 'dur' => $duration]);
        $app_id = $pdo->lastInsertId();

        // Create/Activate Chat
        $req_stmt = $pdo->prepare("SELECT patient_id, dentist_id FROM consultation_requests WHERE id = :id");
        $req_stmt->execute(['id' => $request_id]);
        $req = $req_stmt->fetch();

        $chat_stmt = $pdo->prepare("INSERT INTO chats (patient_id, dentist_id, appointment_id, is_active) VALUES (:p_id, :d_id, :a_id, 1)");
        $chat_stmt->execute(['p_id' => $req['patient_id'], 'd_id' => $req['dentist_id'], 'a_id' => $app_id]);
    } else if ($status === 'COMPLETED') {
        // Deactivate Chat associated with this request
        $chat_stmt = $pdo->prepare("UPDATE chats SET is_active = 0 WHERE appointment_id IN (SELECT id FROM appointments WHERE request_id = :r_id)");
        $chat_stmt->execute(['r_id' => $request_id]);
    }

    // Common notification logic for APPROVAL/REJECTION
    $info_stmt = $pdo->prepare("
        SELECT cr.patient_id, d.full_name as dentist_name 
        FROM consultation_requests cr 
        JOIN dentists d ON cr.dentist_id = d.id 
        WHERE cr.id = :id
    ");
    $info_stmt->execute(['id' => $request_id]);
    $info = $info_stmt->fetch();

    if ($info) {
        $p_id = $info['patient_id'];
        $d_name = $info['dentist_name'];
        $title = "Consultation Update";
        $msg = "";
        
        if ($status === 'APPROVED') {
            $msg = "Great news! Dr. {$d_name} has approved your consultation request for {$data['scheduled_date']} at {$data['scheduled_time']}.";
        } else if ($status === 'REJECTED') {
            $msg = "Dr. {$d_name} is unable to accept your consultation request at this time.";
        }

        if (!empty($msg)) {
            $notif_stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, user_type, title, message, related_id)
                VALUES (:u_id, 'PATIENT', :title, :msg, :rel_id)
            ");
            $notif_stmt->execute([
                'u_id' => $p_id,
                'title' => $title,
                'msg' => $msg,
                'rel_id' => $request_id
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Response recorded successfully."]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
