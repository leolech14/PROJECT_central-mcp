-- Enhanced Model Detection System Schema
-- =====================================
-- Migration 026: Enhanced Model Detection System with Self-Correction
--
-- This migration adds comprehensive support for:
-- 1. Enhanced model detection with capability verification
-- 2. Self-correction system with historical pattern detection
-- 3. User feedback integration for continuous learning
-- 4. Model performance metrics and analytics
-- 5. Integration with Central-MCP Universal Write System

-- Enhanced Model Detections Table
-- -------------------------------
-- Comprehensive model detection results with full capability analysis
CREATE TABLE IF NOT EXISTS enhanced_model_detections (
    id TEXT PRIMARY KEY,

    -- Core Detection Information
    detected_model TEXT NOT NULL,
    provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    context_window INTEGER NOT NULL,

    -- Configuration Details
    config_source TEXT NOT NULL,
    config_path TEXT NOT NULL,
    detection_method TEXT NOT NULL,
    confidence REAL NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- Agent Mapping
    agent_letter TEXT NOT NULL,
    agent_role TEXT NOT NULL,
    capabilities TEXT NOT NULL, -- JSON object with capabilities

    -- Self-Correction Integration
    self_correction_applied BOOLEAN NOT NULL DEFAULT FALSE,
    self_correction_data TEXT, -- JSON object with correction details

    -- Central-MCP Integration
    loop_integration TEXT NOT NULL, -- JSON object with loop/session/event IDs
    detection_count INTEGER NOT NULL DEFAULT 1,

    -- Metadata and Timestamps
    metadata TEXT, -- JSON object with detailed metadata
    timestamp TEXT NOT NULL,

    -- Performance Metrics
    execution_time_ms INTEGER,
    system_health TEXT DEFAULT 'healthy'
);

-- Detection Corrections Table (Self-Correction System)
-- ---------------------------------------------------
-- Tracks all automatic corrections applied by the self-correction system
CREATE TABLE IF NOT EXISTS detection_corrections (
    id TEXT PRIMARY KEY,

    -- Correction Information
    original_model TEXT NOT NULL,
    corrected_to TEXT NOT NULL,
    correction_reason TEXT NOT NULL, -- 'historical', 'feedback', 'pattern', 'manual'

    -- Confidence Metrics
    confidence_before REAL NOT NULL,
    confidence_after REAL NOT NULL,
    correction_applied BOOLEAN NOT NULL DEFAULT TRUE,

    -- Pattern Analysis
    pattern_id TEXT, -- Links to correction patterns
    frequency INTEGER DEFAULT 1,

    -- Metadata
    metadata TEXT, -- JSON object with correction context
    timestamp TEXT NOT NULL
);

-- User Feedback Table
-- -------------------
-- User-confirmed feedback for continuous learning and improvement
CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,

    -- Feedback Information
    detected_model TEXT NOT NULL,
    actual_model TEXT NOT NULL,
    user_confirmed BOOLEAN NOT NULL,
    accuracy REAL NOT NULL, -- 0-1 scale based on user confirmation
    context TEXT NOT NULL, -- 'general', 'task-assignment', 'capability-test', etc.

    -- Detection Reference
    detection_id TEXT, -- Links back to original detection
    correction_id TEXT, -- Links to correction if one was applied

    -- Feedback Details
    user_notes TEXT,
    confidence_rating INTEGER, -- 1-5 scale
    session_context TEXT, -- JSON object with session information

    -- Metadata
    metadata TEXT, -- JSON object with additional context
    timestamp TEXT NOT NULL
);

-- Model Performance Metrics Table
-- ------------------------------
-- Tracks performance and accuracy metrics for each model over time
CREATE TABLE IF NOT EXISTS model_performance_metrics (
    id TEXT PRIMARY KEY,

    -- Model Information
    model TEXT UNIQUE NOT NULL,

    -- Detection Statistics
    total_detections INTEGER NOT NULL DEFAULT 0,
    correct_detections INTEGER NOT NULL DEFAULT 0,
    accuracy REAL NOT NULL DEFAULT 0.0,

    -- Confidence Metrics
    avg_confidence REAL NOT NULL DEFAULT 0.0,
    confidence_accuracy REAL NOT NULL DEFAULT 0.5, -- How well confidence matches reality

    -- Performance Data
    avg_execution_time_ms REAL DEFAULT 0.0,
    success_rate REAL DEFAULT 0.0,
    reliability_score REAL DEFAULT 0.0,

    -- Capability Verification
    capabilities_verified BOOLEAN DEFAULT FALSE,
    last_capability_test TEXT,

    -- Timestamps
    last_updated TEXT NOT NULL,
    first_seen TEXT NOT NULL,

    -- Trend Analysis (JSON)
    trends TEXT -- JSON object with 7-day, 30-day trends
);

-- Correction Patterns Table
-- ------------------------
-- Identifies and tracks recurring correction patterns for auto-application
CREATE TABLE IF NOT EXISTS correction_patterns (
    id TEXT PRIMARY KEY,

    -- Pattern Information
    pattern TEXT NOT NULL, -- Pattern signature (e.g., "glm-4.6->claude-sonnet-4-5")
    original_model TEXT NOT NULL,
    corrected_to TEXT NOT NULL,

    -- Pattern Metrics
    frequency INTEGER NOT NULL DEFAULT 1,
    accuracy REAL NOT NULL DEFAULT 0.0,
    confidence REAL NOT NULL DEFAULT 0.0,

    -- Auto-Application Rules
    auto_apply BOOLEAN NOT NULL DEFAULT FALSE,
    min_confidence_threshold REAL DEFAULT 0.8,
    required_occurrences INTEGER DEFAULT 3,

    -- Pattern Context
    detection_contexts TEXT, -- JSON array of contexts where pattern occurs
    provider_contexts TEXT, -- JSON array of providers where pattern occurs

    -- Timestamps
    last_seen TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    created_at TEXT NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'active' -- 'active', 'deprecated', 'disabled'
);

-- Model Family Relationships Table
-- -------------------------------
-- Tracks relationships between models within the same family
CREATE TABLE IF NOT EXISTS model_families (
    id TEXT PRIMARY KEY,

    -- Family Information
    family_name TEXT NOT NULL, -- 'claude', 'glm', 'gemini', etc.
    model_name TEXT NOT NULL,
    family_variant TEXT NOT NULL, -- 'sonnet-4', '4.6', '2.5-pro', etc.

    -- Family Relationships
    parent_model TEXT, -- Reference to parent model in family
    sibling_models TEXT, -- JSON array of sibling models
    alternative_models TEXT, -- JSON array of alternative models

    -- Capability Mappings
    capability_equivalence TEXT, -- JSON object mapping capabilities to family baseline
    agent_mapping_consistency TEXT, -- How consistent agent mapping is across family

    -- Metadata
    metadata TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Detection Events Table (Enhanced for Universal Write Integration)
-- ----------------------------------------------------------------
-- Enhanced version of auto_proactive_logs specifically for model detection events
CREATE TABLE IF NOT EXISTS detection_events (
    id TEXT PRIMARY KEY,

    -- Event Information
    event_type TEXT NOT NULL DEFAULT 'model-detection',
    event_category TEXT NOT NULL DEFAULT 'agent-discovery',
    event_actor TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_description TEXT NOT NULL,

    -- System Health Information
    system_health TEXT NOT NULL DEFAULT 'healthy',
    active_loops INTEGER DEFAULT 9,
    avg_response_time_ms INTEGER,
    success_rate REAL DEFAULT 1.0,

    -- Event Context
    detection_id TEXT NOT NULL, -- Links to enhanced_model_detections
    session_id TEXT,
    project_id TEXT,

    -- Detailed Information
    detected_model TEXT NOT NULL,
    agent_letter TEXT NOT NULL,
    agent_role TEXT NOT NULL,
    confidence REAL NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    provider TEXT NOT NULL,
    context_window INTEGER,

    -- Capabilities and Features
    capabilities TEXT, -- JSON object
    tags TEXT, -- JSON array of tags

    -- Comprehensive Metadata
    metadata TEXT NOT NULL, -- JSON object with full event details
    timestamp TEXT NOT NULL
);

-- Detection Analytics Summary Table
-- -------------------------------
-- Pre-computed analytics for fast dashboard loading
CREATE TABLE IF NOT EXISTS detection_analytics_summary (
    id TEXT PRIMARY KEY,

    -- Time Period
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    period_type TEXT NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'

    -- Detection Statistics
    total_detections INTEGER NOT NULL DEFAULT 0,
    successful_detections INTEGER NOT NULL DEFAULT 0,
    failed_detections INTEGER NOT NULL DEFAULT 0,

    -- Accuracy Metrics
    overall_accuracy REAL DEFAULT 0.0,
    avg_confidence REAL DEFAULT 0.0,
    confidence_accuracy REAL DEFAULT 0.0,

    -- Model Distribution
    top_models TEXT, -- JSON array of top 5 models with counts
    agent_distribution TEXT, -- JSON object with agent letter distribution

    -- Self-Correction Metrics
    corrections_applied INTEGER DEFAULT 0,
    correction_success_rate REAL DEFAULT 0.0,
    pattern_matches INTEGER DEFAULT 0,

    -- Performance Metrics
    avg_execution_time_ms REAL DEFAULT 0.0,
    system_health_distribution TEXT, -- JSON object with health status counts

    -- User Feedback
    feedback_count INTEGER DEFAULT 0,
    feedback_accuracy REAL DEFAULT 0.0,

    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create Indexes for Performance
-- =============================

-- Enhanced Model Detections Indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_detections_model ON enhanced_model_detections(detected_model);
CREATE INDEX IF NOT EXISTS idx_enhanced_detections_agent ON enhanced_model_detections(agent_letter);
CREATE INDEX IF NOT EXISTS idx_enhanced_detections_timestamp ON enhanced_model_detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_enhanced_detections_confidence ON enhanced_model_detections(confidence);
CREATE INDEX IF NOT EXISTS idx_enhanced_detections_verified ON enhanced_model_detections(verified);
CREATE INDEX IF NOT EXISTS idx_enhanced_detections_provider ON enhanced_model_detections(provider);
CREATE INDEX IF NOT EXISTS idx_enhanced_detections_correction ON enhanced_model_detections(self_correction_applied);

-- Detection Corrections Indexes
CREATE INDEX IF NOT EXISTS idx_corrections_original ON detection_corrections(original_model);
CREATE INDEX IF NOT EXISTS idx_corrections_corrected ON detection_corrections(corrected_to);
CREATE INDEX IF NOT EXISTS idx_corrections_timestamp ON detection_corrections(timestamp);
CREATE INDEX IF NOT EXISTS idx_corrections_reason ON detection_corrections(correction_reason);
CREATE INDEX IF NOT EXISTS idx_corrections_pattern ON detection_corrections(pattern_id);

-- User Feedback Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_detected ON user_feedback(detected_model);
CREATE INDEX IF NOT EXISTS idx_feedback_actual ON user_feedback(actual_model);
CREATE INDEX IF NOT EXISTS idx_feedback_confirmed ON user_feedback(user_confirmed);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON user_feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_detection ON user_feedback(detection_id);

-- Model Performance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_metrics_model ON model_performance_metrics(model);
CREATE INDEX IF NOT EXISTS idx_metrics_accuracy ON model_performance_metrics(accuracy);
CREATE INDEX IF NOT EXISTS idx_metrics_updated ON model_performance_metrics(last_updated);

-- Correction Patterns Indexes
CREATE INDEX IF NOT EXISTS idx_patterns_pattern ON correction_patterns(pattern);
CREATE INDEX IF NOT EXISTS idx_patterns_original ON correction_patterns(original_model);
CREATE INDEX IF NOT EXISTS idx_patterns_corrected ON correction_patterns(corrected_to);
CREATE INDEX IF NOT EXISTS idx_patterns_auto_apply ON correction_patterns(auto_apply);
CREATE INDEX IF NOT EXISTS idx_patterns_frequency ON correction_patterns(frequency);

-- Model Families Indexes
CREATE INDEX IF NOT EXISTS idx_families_family ON model_families(family_name);
CREATE INDEX IF NOT EXISTS idx_families_model ON model_families(model_name);
CREATE INDEX IF NOT EXISTS idx_families_variant ON model_families(family_variant);

-- Detection Events Indexes
CREATE INDEX IF NOT EXISTS idx_events_detection_id ON detection_events(detection_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON detection_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON detection_events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON detection_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_actor ON detection_events(event_actor);
CREATE INDEX IF NOT EXISTS idx_events_model ON detection_events(detected_model);

-- Analytics Summary Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_period ON detection_analytics_summary(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON detection_analytics_summary(period_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON detection_analytics_summary(created_at);

-- Create Views for Common Queries
-- ==============================

-- Detection Summary View
CREATE VIEW IF NOT EXISTS detection_summary_view AS
SELECT
    detected_model,
    agent_letter,
    COUNT(*) as detection_count,
    AVG(confidence) as avg_confidence,
    AVG(CASE WHEN verified = 1 THEN 1.0 ELSE 0.0 END) as verification_rate,
    SUM(CASE WHEN self_correction_applied = 1 THEN 1 ELSE 0 END) as corrections_count,
    MAX(timestamp) as last_seen
FROM enhanced_model_detections
WHERE timestamp > datetime('now', '-24 hours')
GROUP BY detected_model, agent_letter;

-- Self-Correction Effectiveness View
CREATE VIEW IF NOT EXISTS correction_effectiveness_view AS
SELECT
    original_model,
    corrected_to,
    COUNT(*) as correction_count,
    AVG(confidence_after - confidence_before) as avg_confidence_improvement,
    MAX(timestamp) as last_correction
FROM detection_corrections
WHERE correction_applied = 1
    AND timestamp > datetime('now', '-7 days')
GROUP BY original_model, corrected_to;

-- Model Performance Leaderboard View
CREATE VIEW IF NOT EXISTS model_performance_leaderboard_view AS
SELECT
    model,
    accuracy,
    total_detections,
    avg_confidence,
    confidence_accuracy,
    reliability_score,
    last_updated
FROM model_performance_metrics
WHERE total_detections >= 5
ORDER BY accuracy DESC, confidence_accuracy DESC;

-- Initialize Default Data
-- ======================

-- Insert default model performance records for known models
INSERT OR IGNORE INTO model_performance_metrics (
    id, model, total_detections, correct_detections, accuracy,
    avg_confidence, confidence_accuracy, last_updated, first_seen
) VALUES
    (hex(randomblob(16)), 'claude-sonnet-4-5-20250929', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now')),
    (hex(randomblob(16)), 'claude-sonnet-4-20250514', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now')),
    (hex(randomblob(16)), 'glm-4.6', 0, 0, 0.0, 0.0, 0.90, datetime('now'), datetime('now')),
    (hex(randomblob(16)), 'claude-opus-4-1-20250805', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now')),
    (hex(randomblob(16)), 'gemini-2.5-pro', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now'));

-- Create initial analytics summary record
INSERT OR IGNORE INTO detection_analytics_summary (
    id, period_start, period_end, period_type,
    total_detections, successful_detections, failed_detections,
    created_at, updated_at
) VALUES (
    hex(randomblob(16)),
    datetime('now', '-1 hour'),
    datetime('now'),
    'hourly',
    0, 0, 0,
    datetime('now'),
    datetime('now')
);

-- Migration Notes
-- ===============
--
-- This migration creates the complete schema for the enhanced model detection system.
-- Key features:
--
-- 1. Enhanced model detection with comprehensive capability analysis
-- 2. Self-correction system with historical pattern detection
-- 3. User feedback integration for continuous learning
-- 4. Model performance metrics and trend analysis
-- 5. Full integration with Central-MCP Universal Write System
-- 6. Pre-computed analytics for dashboard performance
-- 7. Extensive indexing for query performance
-- 8. Views for common analytical queries
--
-- The system maintains backward compatibility with existing model_detections table
-- while providing enhanced capabilities through the new schema.