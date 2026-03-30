<?php
require_once 'db_connect.php';
$stmt = $pdo->query("SELECT * FROM consultation_requests");
$requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($requests, JSON_PRETTY_PRINT);
?>
