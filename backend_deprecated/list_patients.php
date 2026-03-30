<?php
require_once 'db_connect.php';
$stmt = $pdo->query("SELECT id, full_name, email FROM patients");
$patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($patients, JSON_PRETTY_PRINT);
?>
