-- Real-Time Weather Intelligence & Emergency Response Platform
-- MySQL 8.0+ Database Schema Definition
-- Database: weather_intel

CREATE DATABASE IF NOT EXISTS weather_intel;
USE weather_intel;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(30),
    role VARCHAR(50) NOT NULL DEFAULT 'CITIZEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trust Scores (Gamified Civic Reporter Reputation)
CREATE TABLE IF NOT EXISTS trust_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    score DOUBLE NOT NULL DEFAULT 50.0,
    verified_count INT NOT NULL DEFAULT 0,
    false_alarm_count INT NOT NULL DEFAULT 0,
    total_submissions INT NOT NULL DEFAULT 0,
    badge_tier VARCHAR(50) NOT NULL DEFAULT 'NOVICE_REPORTER',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Reports table (Ground reports + Ingested social media weather feeds)
CREATE TABLE IF NOT EXISTS reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tracking_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    hazard_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100),
    source_type VARCHAR(50) NOT NULL DEFAULT 'CITIZEN_REPORT',
    rumor_score DOUBLE DEFAULT 0.0,
    is_rumor BOOLEAN DEFAULT FALSE,
    panic_index DOUBLE DEFAULT 0.0,
    sentiment VARCHAR(50) DEFAULT 'OBSERVATIONAL_NEUTRAL',
    duplicate_flag BOOLEAN DEFAULT FALSE,
    phash VARCHAR(64),
    user_id BIGINT,
    action_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reports_lat_lon (latitude, longitude),
    INDEX idx_reports_status (status),
    INDEX idx_reports_hazard (hazard_type),
    INDEX idx_reports_created_at (created_at DESC),
    INDEX idx_reports_phash (phash),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Report Media & pHash Dedup table
CREATE TABLE IF NOT EXISTS report_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'IMAGE',
    phash VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- 5. Audit logs for state transitions
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    event_name VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Users
INSERT INTO users (username, full_name, email, role)
VALUES 
    ('citizen_arun', 'Arun Sharma', 'arun.sharma@example.com', 'CITIZEN'),
    ('citizen_priya', 'Priya Patel', 'priya.patel@example.com', 'CITIZEN'),
    ('imd_bot', 'IMD Social Ingestion Bot', 'bot@imd.gov.in', 'SYSTEM_BOT'),
    ('admin_ndrf', 'NDRF Command Officer', 'command@ndrf.gov.in', 'DISASTER_ADMIN')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Seed Trust Scores
INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 85.0, 12, 0, 12, 'VERIFIED_WEATHER_SCOUT' FROM users WHERE username = 'citizen_arun'
ON DUPLICATE KEY UPDATE score=VALUES(score);

INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 60.0, 3, 0, 3, 'ACTIVE_SCOUT' FROM users WHERE username = 'citizen_priya'
ON DUPLICATE KEY UPDATE score=VALUES(score);

INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 100.0, 500, 0, 500, 'OFFICIAL_AGENCY' FROM users WHERE username = 'imd_bot'
ON DUPLICATE KEY UPDATE score=VALUES(score);

INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 100.0, 0, 0, 0, 'DISASTER_ADMIN' FROM users WHERE username = 'admin_ndrf'
ON DUPLICATE KEY UPDATE score=VALUES(score);
