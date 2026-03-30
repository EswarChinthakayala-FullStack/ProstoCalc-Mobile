<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$plan_id = $_GET['plan_id'] ?? null;
$request_id = $_GET['request_id'] ?? null;
$dentist_id = $_GET['dentist_id'] ?? null; // For general plans

try {
    if ($plan_id) {
        $sql = "SELECT p.*, a.scheduled_date, a.scheduled_time, a.visit_status, a.rescheduled_from, a.actual_end_time 
                FROM treatment_plans p 
                LEFT JOIN appointments a ON p.request_id = a.request_id 
                WHERE p.id = :id";
        $params = ['id' => $plan_id];
    } elseif ($request_id) {
        $sql = "SELECT a.scheduled_date, a.scheduled_time, a.visit_status, a.rescheduled_from, a.actual_end_time, 
                       p.id as plan_id, p.id, p.clinical_notes, p.created_at, p.status, p.ai_explanation, 
                       p.share_cost_details, p.share_ai_explanation
                FROM appointments a
                LEFT JOIN treatment_plans p ON a.request_id = p.request_id
                WHERE a.request_id = :id ORDER BY a.id DESC LIMIT 1";
        $params = ['id' => $request_id];
    } else {
        echo json_encode(["status" => "error", "message" => "Missing ID parameters."]);
        exit;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($plan) {
        // If the appointment was rescheduled, fetch original date and reason
        if (!empty($plan['rescheduled_from'])) {
            $orig_stmt = $pdo->prepare("
                SELECT a.scheduled_date, h.reason 
                FROM appointments a
                LEFT JOIN appointment_status_history h ON a.id = h.appointment_id 
                WHERE a.id = :old_id AND h.new_status = 'postponed'
                LIMIT 1
            ");
            $orig_stmt->execute(['old_id' => $plan['rescheduled_from']]);
            $orig_data = $orig_stmt->fetch(PDO::FETCH_ASSOC);
            if ($orig_data) {
                $plan['original_date'] = $orig_data['scheduled_date'];
                $plan['postpone_reason'] = $orig_data['reason'];
            }
        }
        
        // Fetch items - use safe plan_id detection
        $actual_plan_id = $plan['plan_id'] ?? ($plan['id'] ?? null);
        $plan['items'] = [];
        
        if ($actual_plan_id) {
            $item_sql = "SELECT i.*, COALESCE(t.name, 'AI Estimated Treatment') as name, 
                        i.cost_override as cost, t.category 
                        FROM treatment_plan_items i 
                        LEFT JOIN treatment_catalog t ON i.treatment_id = t.id 
                        WHERE i.plan_id = :p_id";
            $item_stmt = $pdo->prepare($item_sql);
            $item_stmt->execute(['p_id' => $actual_plan_id]);
            $plan['items'] = $item_stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(["status" => "success", "data" => $plan]);
    } else {
        echo json_encode(["status" => "success", "data" => null]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>

