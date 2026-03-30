<?php
require_once 'db_connect.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. ai_cost_estimations
    $sql1 = "CREATE TABLE IF NOT EXISTS ai_cost_estimations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL, 
        patient_id INT DEFAULT NULL,
        dentist_id INT DEFAULT NULL,
        treatment_plan_id INT DEFAULT NULL,
        mode ENUM('calculator', 'approved') NOT NULL,
        total_estimated_cost DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        confidence_score DECIMAL(3, 2) DEFAULT 0.00,
        visibility ENUM('private', 'shared_with_patient') DEFAULT 'private',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql1);
    echo "Table 'ai_cost_estimations' created or exists.<br>";

    // 2. ai_cost_estimation_items
    $sql2 = "CREATE TABLE IF NOT EXISTS ai_cost_estimation_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_cost_estimation_id INT NOT NULL,
        treatment_code VARCHAR(50) DEFAULT NULL,
        treatment_name VARCHAR(255) NOT NULL,
        unit_cost DECIMAL(10, 2) NOT NULL,
        quantity INT DEFAULT 1,
        subtotal DECIMAL(10, 2) NOT NULL,
        cost_source ENUM('default', 'dentist_catalog', 'ai_adjusted') DEFAULT 'default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_cost_estimation_id) REFERENCES ai_cost_estimations(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql2);
    echo "Table 'ai_cost_estimation_items' created or exists.<br>";

    // 3. ai_treatment_explanations
    $sql3 = "CREATE TABLE IF NOT EXISTS ai_treatment_explanations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_cost_estimation_id INT NOT NULL,
        context ENUM('calculator', 'approved_plan', 'timeline') NOT NULL,
        explanation_text TEXT NOT NULL,
        language VARCHAR(10) DEFAULT 'en',
        disclaimer_version VARCHAR(50) DEFAULT 'v1.0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_cost_estimation_id) REFERENCES ai_cost_estimations(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql3);
    echo "Table 'ai_treatment_explanations' created or exists.<br>";

} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage();
}
?>
