-- Professional Treatment Planning & Timeline System (ProstoCalc+ v3)

-- 1. Master Treatment Catalog
CREATE TABLE IF NOT EXISTS treatment_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL',
    default_cost DECIMAL(10,2) NOT NULL,
    description TEXT,
    color_tag VARCHAR(10) DEFAULT '808080'
);

-- Seed defaults
INSERT IGNORE INTO treatment_catalog (name, category, default_cost, description) VALUES
('Extraction', 'SURGERY', 0.00, 'Basic tooth removal'),
('Crown', 'PROSTHODONTICS', 1300.00, 'Dental crown restoration'),
('Implant', 'SURGERY', 2500.00, 'Artificial root replacement'),
('Complete Denture (CD)', 'PROSTHODONTICS', 1400.00, 'Full removable arch replacement'),
('Removable Partial Denture (RPD)', 'PROSTHODONTICS', 60.00, 'Partial removable restoration'),
('Root Canal Treatment (RCT)', 'ENDODONTICS', 420.00, 'Pulp space debridement'),
('Full Mouth Rehabilitation (FMR)', 'PROSTHODONTICS', 45000.00, 'Comprehensive arch reconstruction');

-- 2. Dentist-Specific Treatment Pricing
CREATE TABLE IF NOT EXISTS dentist_treatment_costs (
    dentist_id INT NOT NULL,
    treatment_id INT NOT NULL,
    custom_cost DECIMAL(10,2) NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (dentist_id, treatment_id),
    FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE,
    FOREIGN KEY (treatment_id) REFERENCES treatment_catalog(id) ON DELETE CASCADE
);

-- 3. Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dentist_id INT NOT NULL,
    patient_id INT NULL,
    request_id INT NULL,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    ai_explanation TEXT,
    ai_confidence FLOAT DEFAULT 1.0,
    share_cost_details BOOLEAN DEFAULT FALSE,
    share_ai_explanation BOOLEAN DEFAULT FALSE,
    status ENUM('DRAFT', 'FINAL') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dentist_id) REFERENCES dentists(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (request_id) REFERENCES consultation_requests(id)
);

-- 4. Treatment Plan Items
CREATE TABLE IF NOT EXISTS treatment_plan_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    treatment_id INT NOT NULL,
    tooth_number VARCHAR(20) NULL,
    cost_override DECIMAL(10,2) NULL,
    sessions_estimate INT DEFAULT 1,
    FOREIGN KEY (plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (treatment_id) REFERENCES treatment_catalog(id)
);

-- 5. Professional Treatment Timeline
CREATE TABLE IF NOT EXISTS treatment_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    status ENUM(
        'CONSULTATION_APPROVED',
        'DIAGNOSIS_COMPLETED',
        'TREATMENT_PLANNED',
        'TREATMENT_STARTED',
        'IN_PROGRESS',
        'FOLLOW_UP',
        'COMPLETED'
    ) NOT NULL,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES consultation_requests(id) ON DELETE CASCADE
);

-- Update existing consultation_requests to match timeline ENUM
ALTER TABLE consultation_requests MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING';
