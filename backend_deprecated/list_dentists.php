<?php
require_once 'db_connect.php';
$stmt = $pdo->query("SELECT id, full_name, clinic_name FROM dentists");
$dentists = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($dentists, JSON_PRETTY_PRINT);
?>
