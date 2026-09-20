-- Real-Time Weather Intelligence & Emergency Response Platform
-- Database Schema Definition for PostgreSQL / PostGIS
-- Database: weather_intel

-- Enable spatial and utility extensions
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS postgis;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available in base binaries, continuing with native/earthdistance indexing.';
    END;
END $$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(30),
    role VARCHAR(50) NOT NULL DEFAULT 'CITIZEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trust Scores (Gamified Civic Reporter Reputation)
CREATE TABLE IF NOT EXISTS trust_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    verified_count INT NOT NULL DEFAULT 0,
    false_alarm_count INT NOT NULL DEFAULT 0,
    total_submissions INT NOT NULL DEFAULT 0,
    badge_tier VARCHAR(50) NOT NULL DEFAULT 'NOVICE_REPORTER',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reports table (Ground reports + Ingested social media weather feeds)
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    tracking_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    hazard_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100),
    source_type VARCHAR(50) NOT NULL DEFAULT 'CITIZEN_REPORT',
    rumor_score DOUBLE PRECISION DEFAULT 0.0,
    is_rumor BOOLEAN DEFAULT FALSE,
    panic_index DOUBLE PRECISION DEFAULT 0.0,
    sentiment VARCHAR(50) DEFAULT 'OBSERVATIONAL_NEUTRAL',
    duplicate_flag BOOLEAN DEFAULT FALSE,
    phash VARCHAR(64),
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Spatial Indexes
CREATE INDEX IF NOT EXISTS idx_reports_lat_lon ON reports (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_hazard ON reports (hazard_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_phash ON reports (phash);

-- 4. Report Media & pHash Dedup table
CREATE TABLE IF NOT EXISTS report_media (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'IMAGE',
    phash VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit logs for state transitions
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
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
ON CONFLICT (username) DO NOTHING;

-- Seed Trust Scores for Default Users
INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 85.0, 12, 0, 12, 'VERIFIED_WEATHER_SCOUT' FROM users WHERE username = 'citizen_arun'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 60.0, 3, 0, 3, 'ACTIVE_SCOUT' FROM users WHERE username = 'citizen_priya'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 100.0, 500, 0, 500, 'OFFICIAL_AGENCY' FROM users WHERE username = 'imd_bot'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO trust_scores (user_id, score, verified_count, false_alarm_count, total_submissions, badge_tier)
SELECT id, 100.0, 0, 0, 0, 'DISASTER_ADMIN' FROM users WHERE username = 'admin_ndrf'
ON CONFLICT (user_id) DO NOTHING;
