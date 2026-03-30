<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$user_id = $data['user_id'] ?? $_POST['user_id'] ?? null;
$user_type = $data['user_type'] ?? $_POST['user_type'] ?? null; // 'PATIENT' or 'DENTIST'

if (!$user_id || !$user_type) {
    echo json_encode(["status" => "error", "message" => "Missing user parameters"]);
    exit;
}

try {
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));

    // 1. Fetch current streak info
    $stmt = $pdo->prepare("SELECT * FROM user_activity_streaks WHERE user_id = :uid AND user_type = :utype");
    $stmt->execute(['uid' => $user_id, 'utype' => $user_type]);
    $streak = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$streak) {
        // First time user activity
        $stmt = $pdo->prepare("INSERT INTO user_activity_streaks (user_id, user_type, current_streak, longest_streak, last_active_date, streak_status) 
                               VALUES (:uid, :utype, 1, 1, :today, 'active')");
        $stmt->execute(['uid' => $user_id, 'utype' => $user_type, 'today' => $today]);
        $currentStreak = 1;
        $longestStreak = 1;
    } else {
        $lastDate = $streak['last_active_date'];
        $currentStreak = (int)$streak['current_streak'];
        $longestStreak = (int)$streak['longest_streak'];

        if ($lastDate === $today) {
            // Already active today, no change
        } elseif ($lastDate === $yesterday) {
            // Consecutive day
            $currentStreak++;
            if ($currentStreak > $longestStreak) {
                $longestStreak = $currentStreak;
            }
            $stmt = $pdo->prepare("UPDATE user_activity_streaks SET current_streak = :cs, longest_streak = :ls, last_active_date = :today, streak_status = 'active' WHERE id = :id");
            $stmt->execute(['cs' => $currentStreak, 'ls' => $longestStreak, 'today' => $today, 'id' => $streak['id']]);
        } else {
            // Streak broken
            $currentStreak = 1;
            $stmt = $pdo->prepare("UPDATE user_activity_streaks SET current_streak = 1, last_active_date = :today, streak_status = 'broken' WHERE id = :id");
            $stmt->execute(['today' => $today, 'id' => $streak['id']]);
        }
    }

    // 2. Log daily activity (ignore duplicates via UNIQUE index)
    $stmt = $pdo->prepare("INSERT IGNORE INTO user_daily_activity (user_id, user_type, activity_date) VALUES (:uid, :utype, :today)");
    $stmt->execute(['uid' => $user_id, 'utype' => $user_type, 'today' => $today]);

    echo json_encode([
        "status" => "success",
        "data" => [
            "current_streak" => $currentStreak,
            "longest_streak" => $longestStreak,
            "status" => ($currentStreak > 1) ? "active" : "starting",
            "message" => "Activity recorded for " . $today
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
