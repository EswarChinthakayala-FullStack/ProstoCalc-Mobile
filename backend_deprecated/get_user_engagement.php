<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$user_id = $_GET['user_id'] ?? null;
$user_type = $_GET['user_type'] ?? null;

if (!$user_id || !$user_type) {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT current_streak, longest_streak, streak_status, last_active_date FROM user_activity_streaks WHERE user_id = :uid AND user_type = :utype");
    $stmt->execute(['uid' => $user_id, 'utype' => $user_type]);
    $engagement = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$engagement) {
        $engagement = [
            "current_streak" => 0,
            "longest_streak" => 0,
            "streak_status" => "inactive",
            "last_active_date" => null
        ];
    }

    echo json_encode(["status" => "success", "data" => $engagement]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
