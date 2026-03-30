<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['appointment_id']) || !isset($data['new_status'])) {
    echo json_encode(["status" => "error", "message" => "Missing data."]);
    exit;
}

$app_id = $data['appointment_id'];
$new_status = $data['new_status'];
$reason = $data['reason'] ?? null;
$dentist_notes = $data['dentist_notes'] ?? null;

try {
    $pdo->beginTransaction();

    // Get current status for history
    $stmt = $pdo->prepare("SELECT visit_status FROM appointments WHERE id = :id");
    $stmt->execute(['id' => $app_id]);
    $old_status = $stmt->fetchColumn() ?: 'scheduled';

    // Professional logic for status changes (Clinical Workflow Timestamps)
    $extra_sql = "";
    if ($new_status === 'arrived') {
        $extra_sql = ", check_in_time = CURRENT_TIMESTAMP";
    } elseif ($new_status === 'in_progress') {
        $extra_sql = ", actual_start_time = CURRENT_TIMESTAMP";
    } elseif ($new_status === 'visited') {
        $extra_sql = ", actual_end_time = CURRENT_TIMESTAMP";
    }

    // Update appointment with professional metadata
    $update_stmt = $pdo->prepare("
        UPDATE appointments 
        SET visit_status = :status, dentist_notes = :notes $extra_sql
        WHERE id = :id
    ");
    $update_stmt->execute([
        'status' => $new_status,
        'notes' => $dentist_notes,
        'id' => $app_id
    ]);

    // Log history
    $hist_stmt = $pdo->prepare("
        INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, reason)
        VALUES (:id, :old, :new, 'dentist', :reason)
    ");
    $hist_stmt->execute([
        'id' => $app_id,
        'old' => $old_status,
        'new' => $new_status,
        'reason' => $reason
    ]);

    // Handle rescheduling logic if postponed
    if ($new_status === 'postponed' && isset($data['new_date']) && isset($data['new_time'])) {
        // Create new appointment
        $req_stmt = $pdo->prepare("
            SELECT a.request_id, a.duration_minutes, cr.patient_id, d.full_name as dentist_name 
            FROM appointments a 
            JOIN consultation_requests cr ON a.request_id = cr.id 
            JOIN dentists d ON cr.dentist_id = d.id
            WHERE a.id = :id
        ");
        $req_stmt->execute(['id' => $app_id]);
        $orig = $req_stmt->fetch();

        if ($orig) {
            // Check if already rescheduled to prevent duplicates (Idempotency)
            $check_resched = $pdo->prepare("SELECT id FROM appointments WHERE rescheduled_from = :id");
            $check_resched->execute(['id' => $app_id]);
            
            if (!$check_resched->fetch()) {
                $new_app_stmt = $pdo->prepare("
                    INSERT INTO appointments (request_id, scheduled_date, scheduled_time, duration_minutes, visit_status, rescheduled_from)
                    VALUES (:r_id, :date, :time, :dur, 'scheduled', :from_id)
                ");
                $new_app_stmt->execute([
                    'r_id' => $orig['request_id'],
                    'date' => $data['new_date'],
                    'time' => $data['new_time'],
                    'dur' => $orig['duration_minutes'],
                    'from_id' => $app_id
                ]);

                // CREATE NOTIFICATION FOR PATIENT
                $new_date_fmt = $data['new_date'];
                $notif_title = "Update: Visit Postponed";
                $notif_msg = "Your visit with {$orig['dentist_name']} has been rescheduled to {$new_date_fmt} at {$data['new_time']}. Reason: " . ($reason ?: "Administrative adjustment");
                
                $notif_stmt = $pdo->prepare("
                    INSERT INTO notifications (user_id, user_type, title, message, related_id)
                    VALUES (:u_id, 'PATIENT', :title, :msg, :rel_id)
                ");
                $notif_stmt->execute([
                    'u_id' => $orig['patient_id'],
                    'title' => $notif_title,
                    'msg' => $notif_msg,
                    'rel_id' => $orig['request_id']
                ]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Visit status updated."]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
