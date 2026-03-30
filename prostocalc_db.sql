-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 30, 2026 at 04:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `prostocalc_db`
--
CREATE DATABASE IF NOT EXISTS `prostocalc_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `prostocalc_db`;

-- --------------------------------------------------------

--
-- Table structure for table `ai_chats`
--

DROP TABLE IF EXISTS `ai_chats`;
CREATE TABLE `ai_chats` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_role` enum('patient','dentist') NOT NULL,
  `message` text NOT NULL,
  `response` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `session_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_chat_sessions`
--

DROP TABLE IF EXISTS `ai_chat_sessions`;
CREATE TABLE `ai_chat_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_role` varchar(20) NOT NULL DEFAULT 'patient',
  `title` varchar(255) DEFAULT 'New Chat',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_cost_estimations`
--

DROP TABLE IF EXISTS `ai_cost_estimations`;
CREATE TABLE `ai_cost_estimations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `dentist_id` int(11) DEFAULT NULL,
  `treatment_plan_id` int(11) DEFAULT NULL,
  `mode` enum('calculator','approved') NOT NULL,
  `total_estimated_cost` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `confidence_score` decimal(3,2) DEFAULT 0.00,
  `visibility` enum('private','shared_with_patient') DEFAULT 'private',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_cost_estimation_items`
--

DROP TABLE IF EXISTS `ai_cost_estimation_items`;
CREATE TABLE `ai_cost_estimation_items` (
  `id` int(11) NOT NULL,
  `ai_cost_estimation_id` int(11) NOT NULL,
  `treatment_code` varchar(50) DEFAULT NULL,
  `treatment_name` varchar(255) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL,
  `cost_source` enum('default','dentist_catalog','ai_adjusted') DEFAULT 'default',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_treatment_explanations`
--

DROP TABLE IF EXISTS `ai_treatment_explanations`;
CREATE TABLE `ai_treatment_explanations` (
  `id` int(11) NOT NULL,
  `ai_cost_estimation_id` int(11) NOT NULL,
  `context` enum('calculator','approved_plan','timeline') NOT NULL,
  `explanation_text` text NOT NULL,
  `language` varchar(10) DEFAULT 'en',
  `disclaimer_version` varchar(50) DEFAULT 'v1.0',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_usage_logs`
--

DROP TABLE IF EXISTS `ai_usage_logs`;
CREATE TABLE `ai_usage_logs` (
  `id` int(11) NOT NULL,
  `dentist_id` int(11) NOT NULL,
  `ai_type` enum('COST_PREDICTION','TREATMENT_EXPLANATION','OUTCOME_FORECAST') DEFAULT NULL,
  `input_summary` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `duration_minutes` int(11) DEFAULT 30,
  `status` enum('SCHEDULED','COMPLETED','CANCELLED') DEFAULT 'SCHEDULED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `visit_status` enum('scheduled','arrived','in_progress','visited','not_visited','postponed','cancelled') DEFAULT 'scheduled',
  `visit_type` enum('initial','follow_up','procedure','review') DEFAULT 'initial',
  `rescheduled_from` int(11) DEFAULT NULL,
  `dentist_notes` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `check_in_time` datetime DEFAULT NULL,
  `actual_start_time` datetime DEFAULT NULL,
  `actual_end_time` datetime DEFAULT NULL,
  `priority` enum('NORMAL','URGENT','EMERGENCY') DEFAULT 'NORMAL',
  `visit_category` enum('CONSULTATION','PROCEDURE','FOLLOW_UP','EMERGENCY') DEFAULT 'CONSULTATION'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_status_history`
--

DROP TABLE IF EXISTS `appointment_status_history`;
CREATE TABLE `appointment_status_history` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `old_status` varchar(30) DEFAULT NULL,
  `new_status` varchar(30) DEFAULT NULL,
  `changed_by` enum('dentist','system') DEFAULT 'dentist',
  `reason` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `behavior_baseline`
--

DROP TABLE IF EXISTS `behavior_baseline`;
CREATE TABLE `behavior_baseline` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `tobacco_baseline` int(11) DEFAULT 0,
  `areca_baseline` int(11) DEFAULT 0,
  `baseline_recorded_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

DROP TABLE IF EXISTS `chats`;
CREATE TABLE `chats` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `dentist_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultation_requests`
--

DROP TABLE IF EXISTS `consultation_requests`;
CREATE TABLE `consultation_requests` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `dentist_id` int(11) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED','COMPLETED') DEFAULT 'PENDING',
  `request_message` text DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_behavior_logs`
--

DROP TABLE IF EXISTS `daily_behavior_logs`;
CREATE TABLE `daily_behavior_logs` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `behavior_type` enum('tobacco','physio') NOT NULL,
  `date` date NOT NULL,
  `quantity` int(11) DEFAULT 0,
  `craving_level` int(11) DEFAULT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_streak_logs`
--

DROP TABLE IF EXISTS `daily_streak_logs`;
CREATE TABLE `daily_streak_logs` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `streak_type` varchar(50) NOT NULL,
  `log_date` date NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dentists`
--

DROP TABLE IF EXISTS `dentists`;
CREATE TABLE `dentists` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `clinic_name` varchar(100) NOT NULL,
  `license_number` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `clinic_address` text DEFAULT NULL,
  `clinic_city` varchar(100) DEFAULT NULL,
  `clinic_phone` varchar(20) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dentist_profiles`
--

DROP TABLE IF EXISTS `dentist_profiles`;
CREATE TABLE `dentist_profiles` (
  `dentist_id` int(11) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `consultation_fee` decimal(10,2) DEFAULT NULL,
  `clinic_latitude` decimal(10,8) DEFAULT NULL,
  `clinic_longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dentist_schedule_slots`
--

DROP TABLE IF EXISTS `dentist_schedule_slots`;
CREATE TABLE `dentist_schedule_slots` (
  `id` int(11) NOT NULL,
  `dentist_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_status` enum('available','booked','blocked') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `slot_label` varchar(50) DEFAULT NULL,
  `color_tag` varchar(20) DEFAULT '#0D9488'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dentist_settings`
--

DROP TABLE IF EXISTS `dentist_settings`;
CREATE TABLE `dentist_settings` (
  `dentist_id` int(11) NOT NULL,
  `accept_patient_requests` tinyint(1) DEFAULT 1,
  `visible_to_patients` tinyint(1) DEFAULT 1,
  `consultation_mode` enum('FULL','CALCULATION_ONLY') DEFAULT 'FULL',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dentist_treatment_costs`
--

DROP TABLE IF EXISTS `dentist_treatment_costs`;
CREATE TABLE `dentist_treatment_costs` (
  `dentist_id` int(11) NOT NULL,
  `treatment_id` int(11) NOT NULL,
  `custom_cost` decimal(10,2) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `color_code` varchar(7) DEFAULT '#134e4a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exercises`
--

DROP TABLE IF EXISTS `exercises`;
CREATE TABLE `exercises` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `icon_name` varchar(50) DEFAULT NULL,
  `color_theme` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exercise_ai_insights`
--

DROP TABLE IF EXISTS `exercise_ai_insights`;
CREATE TABLE `exercise_ai_insights` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `analysis` text NOT NULL,
  `improvement_tips` text DEFAULT NULL,
  `precautions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exercise_logs`
--

DROP TABLE IF EXISTS `exercise_logs`;
CREATE TABLE `exercise_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `exercise_id` varchar(50) NOT NULL,
  `completion_date` date NOT NULL,
  `duration_performed` int(11) DEFAULT NULL,
  `reps_performed` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `habit_reduction_logs`
--

DROP TABLE IF EXISTS `habit_reduction_logs`;
CREATE TABLE `habit_reduction_logs` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `entry_datetime` datetime NOT NULL,
  `tobacco_count` int(11) DEFAULT 0,
  `areca_count` int(11) DEFAULT 0,
  `craving_level` int(11) DEFAULT NULL,
  `mood_score` int(11) DEFAULT NULL,
  `trigger_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `habit_reduction_logs_backup`
--

DROP TABLE IF EXISTS `habit_reduction_logs_backup`;
CREATE TABLE `habit_reduction_logs_backup` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `entry_date` date NOT NULL,
  `tobacco_count` int(11) DEFAULT 0,
  `areca_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `habit_risk_analysis`
--

DROP TABLE IF EXISTS `habit_risk_analysis`;
CREATE TABLE `habit_risk_analysis` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `tobacco_per_day` int(11) DEFAULT 0,
  `tobacco_years` int(11) DEFAULT 0,
  `areca_per_day` int(11) DEFAULT 0,
  `areca_years` int(11) DEFAULT 0,
  `alcohol` tinyint(1) DEFAULT 0,
  `mouth_opening_mm` float DEFAULT 0,
  `current_grade` varchar(20) DEFAULT '',
  `calculated_risk_multiplier` float DEFAULT 1,
  `fibrosis_risk_percent` float DEFAULT 0,
  `counseling_level` varchar(50) DEFAULT 'Low',
  `created_at` datetime DEFAULT current_timestamp(),
  `dentist_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `health_streaks`
--

DROP TABLE IF EXISTS `health_streaks`;
CREATE TABLE `health_streaks` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `streak_type` varchar(50) NOT NULL,
  `current_streak` int(11) DEFAULT 0,
  `longest_streak` int(11) DEFAULT 0,
  `last_updated` date DEFAULT NULL,
  `streak_status` enum('active','broken') DEFAULT 'active',
  `last_break_date` date DEFAULT NULL,
  `consistency_score` int(11) DEFAULT 0,
  `relapse_risk_score` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medications`
--

DROP TABLE IF EXISTS `medications`;
CREATE TABLE `medications` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `scheduled_time` time DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `color_tag` varchar(20) DEFAULT '#3B82F6'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medication_logs`
--

DROP TABLE IF EXISTS `medication_logs`;
CREATE TABLE `medication_logs` (
  `id` int(11) NOT NULL,
  `medication_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `status` enum('taken','missed') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `actual_take_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `sender_role` enum('PATIENT','DENTIST') NOT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mouth_opening_logs`
--

DROP TABLE IF EXISTS `mouth_opening_logs`;
CREATE TABLE `mouth_opening_logs` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `entry_date` date NOT NULL,
  `value_mm` float NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('PATIENT','DENTIST') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `related_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `role` varchar(20) NOT NULL,
  `type` varchar(20) DEFAULT 'reset',
  `expires_at` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `dentist_id` int(11) DEFAULT 1,
  `is_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_exercise_settings`
--

DROP TABLE IF EXISTS `patient_exercise_settings`;
CREATE TABLE `patient_exercise_settings` (
  `user_id` int(11) NOT NULL,
  `morning_reminder` tinyint(1) DEFAULT 1,
  `evening_reminder` tinyint(1) DEFAULT 1,
  `smart_reminders` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `morning_time` time DEFAULT '09:00:00',
  `evening_time` time DEFAULT '20:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_locations`
--

DROP TABLE IF EXISTS `patient_locations`;
CREATE TABLE `patient_locations` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `street_address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_mouth_measurements`
--

DROP TABLE IF EXISTS `patient_mouth_measurements`;
CREATE TABLE `patient_mouth_measurements` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `measurement_mm` decimal(5,2) NOT NULL,
  `measurement_date` date NOT NULL,
  `logged_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_profiles`
--

DROP TABLE IF EXISTS `patient_profiles`;
CREATE TABLE `patient_profiles` (
  `patient_id` int(11) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `medical_history` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('patient','dentist') NOT NULL,
  `token` text NOT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `revoked` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `relapse_events`
--

DROP TABLE IF EXISTS `relapse_events`;
CREATE TABLE `relapse_events` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `behavior_type` enum('tobacco','physio') NOT NULL,
  `relapse_date` date NOT NULL,
  `trigger_note` text DEFAULT NULL,
  `severity` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `treatment_catalog`
--

DROP TABLE IF EXISTS `treatment_catalog`;
CREATE TABLE `treatment_catalog` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('GENERAL','SURGERY','PROSTHODONTICS','ENDODONTICS','ORTHODONTICS','PEDODONTICS') DEFAULT 'GENERAL',
  `default_cost` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `color_tag` varchar(20) DEFAULT '#6366F1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `treatment_plans`
--

DROP TABLE IF EXISTS `treatment_plans`;
CREATE TABLE `treatment_plans` (
  `id` int(11) NOT NULL,
  `dentist_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `request_id` int(11) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT 0.00,
  `ai_explanation` text DEFAULT NULL,
  `clinical_notes` text DEFAULT NULL,
  `ai_confidence` float DEFAULT 1,
  `share_cost_details` tinyint(1) DEFAULT 0,
  `share_ai_explanation` tinyint(1) DEFAULT 0,
  `status` enum('DRAFT','FINAL') DEFAULT 'DRAFT',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `treatment_plan_items`
--

DROP TABLE IF EXISTS `treatment_plan_items`;
CREATE TABLE `treatment_plan_items` (
  `id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `treatment_id` int(11) DEFAULT NULL,
  `treatment_name` varchar(255) DEFAULT NULL,
  `tooth_number` varchar(20) DEFAULT NULL,
  `cost_override` decimal(10,2) DEFAULT NULL,
  `sessions_estimate` int(11) DEFAULT 1,
  `color_tag` varchar(7) DEFAULT '#134e4a'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `treatment_timeline`
--

DROP TABLE IF EXISTS `treatment_timeline`;
CREATE TABLE `treatment_timeline` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `status` enum('CONSULTATION_APPROVED','DIAGNOSIS_COMPLETED','TREATMENT_PLANNED','TREATMENT_STARTED','IN_PROGRESS','FOLLOW_UP','COMPLETED') NOT NULL,
  `notes` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_activity_streaks`
--

DROP TABLE IF EXISTS `user_activity_streaks`;
CREATE TABLE `user_activity_streaks` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('PATIENT','DENTIST') NOT NULL,
  `current_streak` int(11) DEFAULT 0,
  `longest_streak` int(11) DEFAULT 0,
  `last_active_date` date DEFAULT NULL,
  `streak_status` enum('active','broken') DEFAULT 'active',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_behaviors`
--

DROP TABLE IF EXISTS `user_behaviors`;
CREATE TABLE `user_behaviors` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `behavior_type` enum('tobacco','physio') NOT NULL,
  `target_per_day` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_daily_activity`
--

DROP TABLE IF EXISTS `user_daily_activity`;
CREATE TABLE `user_daily_activity` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('PATIENT','DENTIST') NOT NULL,
  `activity_date` date DEFAULT NULL,
  `activity_type` enum('login','appointment_view','treatment_check') DEFAULT 'login',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_chats`
--
ALTER TABLE `ai_chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `ai_chat_sessions`
--
ALTER TABLE `ai_chat_sessions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ai_cost_estimations`
--
ALTER TABLE `ai_cost_estimations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ai_cost_estimation_items`
--
ALTER TABLE `ai_cost_estimation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_cost_estimation_id` (`ai_cost_estimation_id`);

--
-- Indexes for table `ai_treatment_explanations`
--
ALTER TABLE `ai_treatment_explanations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_cost_estimation_id` (`ai_cost_estimation_id`);

--
-- Indexes for table `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dentist_id` (`dentist_id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `appointment_status_history`
--
ALTER TABLE `appointment_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `behavior_baseline`
--
ALTER TABLE `behavior_baseline`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_baseline` (`patient_id`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `dentist_id` (`dentist_id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `consultation_requests`
--
ALTER TABLE `consultation_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `dentist_id` (`dentist_id`);

--
-- Indexes for table `daily_behavior_logs`
--
ALTER TABLE `daily_behavior_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`behavior_type`,`date`);

--
-- Indexes for table `daily_streak_logs`
--
ALTER TABLE `daily_streak_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_patient_log` (`patient_id`,`streak_type`,`log_date`),
  ADD KEY `idx_patient_type_date` (`patient_id`,`streak_type`,`log_date`);

--
-- Indexes for table `dentists`
--
ALTER TABLE `dentists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_number` (`license_number`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `dentist_profiles`
--
ALTER TABLE `dentist_profiles`
  ADD PRIMARY KEY (`dentist_id`);

--
-- Indexes for table `dentist_schedule_slots`
--
ALTER TABLE `dentist_schedule_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dentist_id` (`dentist_id`);

--
-- Indexes for table `dentist_settings`
--
ALTER TABLE `dentist_settings`
  ADD PRIMARY KEY (`dentist_id`);

--
-- Indexes for table `dentist_treatment_costs`
--
ALTER TABLE `dentist_treatment_costs`
  ADD PRIMARY KEY (`dentist_id`,`treatment_id`),
  ADD KEY `treatment_id` (`treatment_id`);

--
-- Indexes for table `exercises`
--
ALTER TABLE `exercises`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `exercise_ai_insights`
--
ALTER TABLE `exercise_ai_insights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `exercise_logs`
--
ALTER TABLE `exercise_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `habit_reduction_logs`
--
ALTER TABLE `habit_reduction_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_date` (`patient_id`,`entry_datetime`);

--
-- Indexes for table `habit_reduction_logs_backup`
--
ALTER TABLE `habit_reduction_logs_backup`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `habit_risk_analysis`
--
ALTER TABLE `habit_risk_analysis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `health_streaks`
--
ALTER TABLE `health_streaks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_streak` (`patient_id`,`streak_type`);

--
-- Indexes for table `medications`
--
ALTER TABLE `medications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `medication_logs`
--
ALTER TABLE `medication_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_med_log` (`medication_id`,`log_date`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_id` (`chat_id`);

--
-- Indexes for table `mouth_opening_logs`
--
ALTER TABLE `mouth_opening_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email` (`email`),
  ADD KEY `otp` (`otp`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `patient_exercise_settings`
--
ALTER TABLE `patient_exercise_settings`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `patient_locations`
--
ALTER TABLE `patient_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `patient_mouth_measurements`
--
ALTER TABLE `patient_mouth_measurements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `measurement_date` (`measurement_date`);

--
-- Indexes for table `patient_profiles`
--
ALTER TABLE `patient_profiles`
  ADD PRIMARY KEY (`patient_id`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `token` (`token`(255));

--
-- Indexes for table `relapse_events`
--
ALTER TABLE `relapse_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `treatment_catalog`
--
ALTER TABLE `treatment_catalog`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `treatment_plans`
--
ALTER TABLE `treatment_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dentist_id` (`dentist_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `treatment_plan_items`
--
ALTER TABLE `treatment_plan_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `treatment_id` (`treatment_id`);

--
-- Indexes for table `treatment_timeline`
--
ALTER TABLE `treatment_timeline`
  ADD PRIMARY KEY (`id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `user_activity_streaks`
--
ALTER TABLE `user_activity_streaks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user` (`user_id`,`user_type`);

--
-- Indexes for table `user_behaviors`
--
ALTER TABLE `user_behaviors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_daily_activity`
--
ALTER TABLE `user_daily_activity`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_daily` (`user_id`,`user_type`,`activity_date`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ai_chats`
--
ALTER TABLE `ai_chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_chat_sessions`
--
ALTER TABLE `ai_chat_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_cost_estimations`
--
ALTER TABLE `ai_cost_estimations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_cost_estimation_items`
--
ALTER TABLE `ai_cost_estimation_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_treatment_explanations`
--
ALTER TABLE `ai_treatment_explanations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment_status_history`
--
ALTER TABLE `appointment_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `behavior_baseline`
--
ALTER TABLE `behavior_baseline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultation_requests`
--
ALTER TABLE `consultation_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_streak_logs`
--
ALTER TABLE `daily_streak_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dentists`
--
ALTER TABLE `dentists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dentist_schedule_slots`
--
ALTER TABLE `dentist_schedule_slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exercise_ai_insights`
--
ALTER TABLE `exercise_ai_insights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exercise_logs`
--
ALTER TABLE `exercise_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `habit_reduction_logs`
--
ALTER TABLE `habit_reduction_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `habit_reduction_logs_backup`
--
ALTER TABLE `habit_reduction_logs_backup`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `habit_risk_analysis`
--
ALTER TABLE `habit_risk_analysis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `health_streaks`
--
ALTER TABLE `health_streaks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medications`
--
ALTER TABLE `medications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medication_logs`
--
ALTER TABLE `medication_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mouth_opening_logs`
--
ALTER TABLE `mouth_opening_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patient_locations`
--
ALTER TABLE `patient_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patient_mouth_measurements`
--
ALTER TABLE `patient_mouth_measurements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `treatment_catalog`
--
ALTER TABLE `treatment_catalog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `treatment_plans`
--
ALTER TABLE `treatment_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `treatment_plan_items`
--
ALTER TABLE `treatment_plan_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `treatment_timeline`
--
ALTER TABLE `treatment_timeline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_activity_streaks`
--
ALTER TABLE `user_activity_streaks`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_daily_activity`
--
ALTER TABLE `user_daily_activity`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ai_cost_estimation_items`
--
ALTER TABLE `ai_cost_estimation_items`
  ADD CONSTRAINT `ai_cost_estimation_items_ibfk_1` FOREIGN KEY (`ai_cost_estimation_id`) REFERENCES `ai_cost_estimations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ai_treatment_explanations`
--
ALTER TABLE `ai_treatment_explanations`
  ADD CONSTRAINT `ai_treatment_explanations_ibfk_1` FOREIGN KEY (`ai_cost_estimation_id`) REFERENCES `ai_cost_estimations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  ADD CONSTRAINT `ai_usage_logs_ibfk_1` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`);

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `consultation_requests` (`id`);

--
-- Constraints for table `appointment_status_history`
--
ALTER TABLE `appointment_status_history`
  ADD CONSTRAINT `appointment_status_history_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `chats_ibfk_2` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`),
  ADD CONSTRAINT `chats_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`);

--
-- Constraints for table `consultation_requests`
--
ALTER TABLE `consultation_requests`
  ADD CONSTRAINT `consultation_requests_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `consultation_requests_ibfk_2` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`);

--
-- Constraints for table `dentist_profiles`
--
ALTER TABLE `dentist_profiles`
  ADD CONSTRAINT `dentist_profiles_ibfk_1` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dentist_schedule_slots`
--
ALTER TABLE `dentist_schedule_slots`
  ADD CONSTRAINT `dentist_schedule_slots_ibfk_1` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dentist_settings`
--
ALTER TABLE `dentist_settings`
  ADD CONSTRAINT `dentist_settings_ibfk_1` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dentist_treatment_costs`
--
ALTER TABLE `dentist_treatment_costs`
  ADD CONSTRAINT `dentist_treatment_costs_ibfk_1` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dentist_treatment_costs_ibfk_2` FOREIGN KEY (`treatment_id`) REFERENCES `treatment_catalog` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `habit_risk_analysis`
--
ALTER TABLE `habit_risk_analysis`
  ADD CONSTRAINT `habit_risk_analysis_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_locations`
--
ALTER TABLE `patient_locations`
  ADD CONSTRAINT `patient_locations_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_profiles`
--
ALTER TABLE `patient_profiles`
  ADD CONSTRAINT `patient_profiles_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `treatment_plans`
--
ALTER TABLE `treatment_plans`
  ADD CONSTRAINT `treatment_plans_ibfk_1` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`id`),
  ADD CONSTRAINT `treatment_plans_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `treatment_plans_ibfk_3` FOREIGN KEY (`request_id`) REFERENCES `consultation_requests` (`id`);

--
-- Constraints for table `treatment_plan_items`
--
ALTER TABLE `treatment_plan_items`
  ADD CONSTRAINT `treatment_plan_items_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `treatment_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `treatment_plan_items_ibfk_2` FOREIGN KEY (`treatment_id`) REFERENCES `treatment_catalog` (`id`);

--
-- Constraints for table `treatment_timeline`
--
ALTER TABLE `treatment_timeline`
  ADD CONSTRAINT `treatment_timeline_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `consultation_requests` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
