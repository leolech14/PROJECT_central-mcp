-- ============================================================================
-- UNIVERSAL WRITE SYSTEM - Central Activity & Status Registry
-- ============================================================================
-- Purpose: Capture EVERYTHING, organize perfectly, distill to insights
-- Created: 2025-10-12
-- Vision: COMPREHENSIVE DATA → STRUCTURED STORAGE → HIGH-DENSITY INSIGHTS
-- ============================================================================

-- ============================================================================
-- THE PHILOSOPHY: WRITE EVERYTHING, ORGANIZE EVERYTHING
-- ============================================================================
-- Every action, decision, change, progress update must be captured.
-- Not as a giant unstructured log, but as domain-specific structured events.
-- The structure itself is self-explanatory - you can understand what happened
-- just by looking at the schema.
--
-- This becomes:
-- 1. Source of truth for "what's happening now"
-- 2. Complete history of "what happened"
-- 3. Foundation for analysis and insights
-- 4. System status dashboard data source
-- ============================================================================

-- ============================================================================
-- DOMAIN-SPECIFIC EVENT REGISTRIES
-- ============================================================================

-- Specification Events (what happens to specs)
CREATE TABLE IF NOT EXISTS spec_events (
    event_id TEXT PRIMARY KEY,                  -- e.g. "evt-spec-001"
    spec_id TEXT NOT NULL,                      -- Which spec

    -- Event Classification
    event_type TEXT NOT NULL,                   -- created, updated, completed, validated, gap_detected, gap_resolved
    event_category TEXT NOT NULL,               -- lifecycle, quality, progress, collaboration

    -- Event Details
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_actor TEXT NOT NULL,                  -- Who/what caused this (agent_id, user_id, system)
    event_action TEXT NOT NULL,                 -- What specifically happened
    event_description TEXT,                     -- Human-readable description

    -- Before/After State
    state_before TEXT,                          -- JSON: state before event
    state_after TEXT,                           -- JSON: state after event
    delta TEXT,                                 -- JSON: what changed

    -- Context
    triggered_by TEXT,                          -- What triggered this event
    related_entities TEXT,                      -- JSON: related specs, tasks, etc.
    tags TEXT,                                  -- JSON: searchable tags

    -- Impact Analysis
    impact_level TEXT DEFAULT 'low',            -- low, medium, high, critical
    impact_description TEXT,                    -- What does this mean?
    downstream_effects TEXT,                    -- JSON: what else is affected

    -- Metadata
    metadata TEXT,                              -- JSON: any additional data

    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Task Events (what happens to tasks)
CREATE TABLE IF NOT EXISTS task_events (
    event_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,

    -- Event Classification
    event_type TEXT NOT NULL,                   -- created, assigned, started, completed, blocked, unblocked, failed
    event_category TEXT NOT NULL,               -- lifecycle, progress, blocking, quality

    -- Event Details
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_actor TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_description TEXT,

    -- Before/After State
    state_before TEXT,                          -- JSON: task state before
    state_after TEXT,                           -- JSON: task state after
    delta TEXT,                                 -- JSON: what changed

    -- Task-Specific Context
    work_performed TEXT,                        -- What work was done
    files_changed TEXT,                         -- JSON: files modified
    code_changes_summary TEXT,                  -- Summary of code changes

    -- Progress Tracking
    progress_before REAL,                       -- Progress % before
    progress_after REAL,                        -- Progress % after
    estimated_time_remaining REAL,              -- Hours remaining

    -- Context
    triggered_by TEXT,
    related_entities TEXT,                      -- JSON: related tasks, specs
    tags TEXT,

    -- Impact
    impact_level TEXT DEFAULT 'low',
    impact_description TEXT,
    downstream_effects TEXT,

    -- Metadata
    metadata TEXT,

    FOREIGN KEY (task_id) REFERENCES tasks_registry(task_id)
);

-- Code Generation Events (what happens during code generation)
CREATE TABLE IF NOT EXISTS code_generation_events (
    event_id TEXT PRIMARY KEY,
    codebase_id TEXT,
    task_id TEXT,

    -- Event Classification
    event_type TEXT NOT NULL,                   -- generation_started, template_applied, file_created, build_passed, build_failed
    event_category TEXT NOT NULL,               -- generation, validation, quality

    -- Event Details
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_actor TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_description TEXT,

    -- Generation Details
    files_generated TEXT,                       -- JSON: list of files created
    templates_used TEXT,                        -- JSON: templates applied
    snippets_used TEXT,                         -- JSON: snippets applied
    lines_generated INTEGER DEFAULT 0,

    -- Quality Metrics
    code_quality_score REAL,
    test_coverage REAL,
    build_status TEXT,                          -- passed, failed, not_attempted

    -- Context
    triggered_by TEXT,
    related_entities TEXT,
    tags TEXT,

    -- Impact
    impact_level TEXT DEFAULT 'low',
    impact_description TEXT,

    -- Metadata
    metadata TEXT,

    FOREIGN KEY (codebase_id) REFERENCES generated_codebases(codebase_id),
    FOREIGN KEY (task_id) REFERENCES tasks_registry(task_id)
);

-- Interview Events (what happens during interviews)
CREATE TABLE IF NOT EXISTS interview_events (
    event_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    question_id TEXT,

    -- Event Classification
    event_type TEXT NOT NULL,                   -- session_started, question_asked, question_answered, gap_resolved, session_completed
    event_category TEXT NOT NULL,               -- interview, discovery, resolution

    -- Event Details
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_actor TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_description TEXT,

    -- Interview Details
    question_text TEXT,
    answer_text TEXT,
    gaps_resolved TEXT,                         -- JSON: gap IDs resolved
    new_information TEXT,                       -- JSON: information captured

    -- Progress
    completeness_before REAL,
    completeness_after REAL,
    gaps_remaining INTEGER,

    -- Context
    triggered_by TEXT,
    related_entities TEXT,
    tags TEXT,

    -- Impact
    impact_level TEXT DEFAULT 'low',
    impact_description TEXT,

    -- Metadata
    metadata TEXT,

    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
    FOREIGN KEY (question_id) REFERENCES interview_questions(question_id)
);

-- Agent Activity Events (what agents do)
CREATE TABLE IF NOT EXISTS agent_activity_events (
    event_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,

    -- Event Classification
    event_type TEXT NOT NULL,                   -- connected, disconnected, task_claimed, task_completed, context_received
    event_category TEXT NOT NULL,               -- connection, work, communication

    -- Event Details
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_action TEXT NOT NULL,
    event_description TEXT,

    -- Activity Details
    project_id TEXT,
    task_id TEXT,
    session_duration_seconds REAL,
    work_summary TEXT,

    -- Context
    triggered_by TEXT,
    related_entities TEXT,
    tags TEXT,

    -- Metadata
    metadata TEXT
);

-- System Status Events (system-level events)
CREATE TABLE IF NOT EXISTS system_status_events (
    event_id TEXT PRIMARY KEY,

    -- Event Classification
    event_type TEXT NOT NULL,                   -- loop_execution, migration_run, backup_created, health_check
    event_category TEXT NOT NULL,               -- system, maintenance, health

    -- Event Details
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_actor TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_description TEXT,

    -- System Metrics
    system_health TEXT,                         -- healthy, warning, critical
    active_loops INTEGER,
    active_agents INTEGER,
    active_tasks INTEGER,
    database_size_mb REAL,

    -- Performance Metrics
    avg_response_time_ms REAL,
    error_rate REAL,
    success_rate REAL,

    -- Context
    triggered_by TEXT,
    tags TEXT,

    -- Metadata
    metadata TEXT
);

-- ============================================================================
-- STATUS AGGREGATION (Distill events → current status)
-- ============================================================================

-- Current System Status (high-density summary)
CREATE TABLE IF NOT EXISTS current_system_status (
    status_id TEXT PRIMARY KEY DEFAULT 'current',  -- Always 'current' - only one row

    -- Overall Health
    system_health TEXT DEFAULT 'healthy',       -- healthy, warning, critical, unknown
    health_score REAL DEFAULT 1.0,              -- 0-1
    last_health_check TIMESTAMP,

    -- Component Status
    specs_total INTEGER DEFAULT 0,
    specs_complete INTEGER DEFAULT 0,
    specs_in_progress INTEGER DEFAULT 0,

    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_in_progress INTEGER DEFAULT 0,
    tasks_blocked INTEGER DEFAULT 0,

    codebases_total INTEGER DEFAULT 0,
    codebases_complete INTEGER DEFAULT 0,
    codebases_generating INTEGER DEFAULT 0,

    interviews_total INTEGER DEFAULT 0,
    interviews_completed INTEGER DEFAULT 0,
    interviews_in_progress INTEGER DEFAULT 0,

    projects_total INTEGER DEFAULT 0,
    projects_active INTEGER DEFAULT 0,

    -- Agent Activity
    agents_active INTEGER DEFAULT 0,
    agents_idle INTEGER DEFAULT 0,
    total_agent_hours REAL DEFAULT 0.0,

    -- Quality Metrics
    avg_spec_completeness REAL DEFAULT 0.0,
    avg_task_quality REAL DEFAULT 0.0,
    avg_code_quality REAL DEFAULT 0.0,

    -- Activity Metrics (last 24 hours)
    events_last_24h INTEGER DEFAULT 0,
    tasks_completed_last_24h INTEGER DEFAULT 0,
    code_lines_generated_last_24h INTEGER DEFAULT 0,

    -- Performance Metrics
    avg_response_time_ms REAL DEFAULT 0.0,
    success_rate REAL DEFAULT 1.0,
    error_rate REAL DEFAULT 0.0,

    -- Timestamps
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_major_event TIMESTAMP
);

-- Initialize with default row
INSERT OR IGNORE INTO current_system_status (status_id) VALUES ('current');

-- Status snapshots (historical status tracking)
CREATE TABLE IF NOT EXISTS status_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    snapshot_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Copy of entire system status at this moment
    system_health TEXT,
    health_score REAL,

    specs_total INTEGER,
    specs_complete INTEGER,
    tasks_total INTEGER,
    tasks_completed INTEGER,
    codebases_total INTEGER,
    agents_active INTEGER,

    events_last_24h INTEGER,
    avg_spec_completeness REAL,
    avg_code_quality REAL,

    -- Snapshot metadata
    snapshot_trigger TEXT,                      -- scheduled, on_demand, critical_event
    notes TEXT
);

-- ============================================================================
-- ANALYSIS & INSIGHTS (Deterministic distillation)
-- ============================================================================

-- Activity patterns (what's happening regularly)
CREATE TABLE IF NOT EXISTS activity_patterns (
    pattern_id TEXT PRIMARY KEY,
    pattern_name TEXT NOT NULL,
    pattern_type TEXT NOT NULL,                 -- hourly, daily, weekly, event_based

    -- Pattern Definition
    pattern_description TEXT,
    detection_rules TEXT NOT NULL,              -- JSON: rules to detect this pattern

    -- Pattern Metrics
    occurrence_count INTEGER DEFAULT 0,
    last_occurrence TIMESTAMP,
    avg_frequency_hours REAL,

    -- Pattern Insights
    impact_assessment TEXT,                     -- What does this pattern mean?
    recommended_actions TEXT,                   -- JSON: what to do about it

    is_healthy BOOLEAN DEFAULT TRUE,            -- Is this pattern good or bad?
    is_active BOOLEAN DEFAULT TRUE
);

-- Insights (high-density distilled information)
CREATE TABLE IF NOT EXISTS insights (
    insight_id TEXT PRIMARY KEY,
    insight_type TEXT NOT NULL,                 -- trend, anomaly, achievement, warning, recommendation

    -- Insight Content
    insight_title TEXT NOT NULL,
    insight_description TEXT NOT NULL,
    insight_severity TEXT DEFAULT 'info',       -- info, success, warning, error, critical

    -- Evidence
    based_on_events TEXT,                       -- JSON: event IDs that led to this insight
    based_on_metrics TEXT,                      -- JSON: metrics that support this
    confidence_score REAL DEFAULT 0.0,          -- 0-1: how confident are we?

    -- Recommendations
    recommended_actions TEXT,                   -- JSON: what to do
    expected_impact TEXT,                       -- What happens if we act on this?

    -- Status
    status TEXT DEFAULT 'active',               -- active, acknowledged, acted_upon, dismissed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acted_upon_at TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_spec_events_spec ON spec_events(spec_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_spec_events_type ON spec_events(event_type, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_task_events_task ON task_events(task_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_task_events_type ON task_events(event_type, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_code_gen_events_codebase ON code_generation_events(codebase_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interview_events_session ON interview_events(session_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent ON agent_activity_events(agent_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_status_events(event_type, event_timestamp DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Recent activity across all domains
CREATE VIEW IF NOT EXISTS recent_activity AS
SELECT 'spec' as domain, event_id, spec_id as entity_id, event_type, event_action, event_timestamp, event_actor
FROM spec_events
WHERE event_timestamp > datetime('now', '-24 hours')
UNION ALL
SELECT 'task' as domain, event_id, task_id as entity_id, event_type, event_action, event_timestamp, event_actor
FROM task_events
WHERE event_timestamp > datetime('now', '-24 hours')
UNION ALL
SELECT 'code' as domain, event_id, COALESCE(codebase_id, task_id) as entity_id, event_type, event_action, event_timestamp, event_actor
FROM code_generation_events
WHERE event_timestamp > datetime('now', '-24 hours')
UNION ALL
SELECT 'interview' as domain, event_id, session_id as entity_id, event_type, event_action, event_timestamp, event_actor
FROM interview_events
WHERE event_timestamp > datetime('now', '-24 hours')
UNION ALL
SELECT 'agent' as domain, event_id, agent_id as entity_id, event_type, event_action, event_timestamp, agent_id as event_actor
FROM agent_activity_events
WHERE event_timestamp > datetime('now', '-24 hours')
ORDER BY event_timestamp DESC;

-- Critical events requiring attention
CREATE VIEW IF NOT EXISTS critical_events AS
SELECT 'spec' as domain, event_id, spec_id as entity_id, event_type, event_description, impact_description, event_timestamp
FROM spec_events
WHERE impact_level = 'critical'
AND event_timestamp > datetime('now', '-7 days')
UNION ALL
SELECT 'task' as domain, event_id, task_id as entity_id, event_type, event_description, impact_description, event_timestamp
FROM task_events
WHERE impact_level = 'critical'
AND event_timestamp > datetime('now', '-7 days')
ORDER BY event_timestamp DESC;

-- Activity summary by domain
CREATE VIEW IF NOT EXISTS activity_summary AS
SELECT
    'specs' as domain,
    COUNT(*) as event_count,
    COUNT(DISTINCT spec_id) as unique_entities,
    COUNT(DISTINCT event_type) as event_types,
    MAX(event_timestamp) as last_activity
FROM spec_events
WHERE event_timestamp > datetime('now', '-24 hours')
UNION ALL
SELECT
    'tasks' as domain,
    COUNT(*) as event_count,
    COUNT(DISTINCT task_id) as unique_entities,
    COUNT(DISTINCT event_type) as event_types,
    MAX(event_timestamp) as last_activity
FROM task_events
WHERE event_timestamp > datetime('now', '-24 hours')
UNION ALL
SELECT
    'code' as domain,
    COUNT(*) as event_count,
    COUNT(DISTINCT codebase_id) as unique_entities,
    COUNT(DISTINCT event_type) as event_types,
    MAX(event_timestamp) as last_activity
FROM code_generation_events
WHERE event_timestamp > datetime('now', '-24 hours');

-- ============================================================================
-- TRIGGERS (Auto-update current status)
-- ============================================================================

-- Update current status on spec events
CREATE TRIGGER IF NOT EXISTS update_status_on_spec_event
AFTER INSERT ON spec_events
FOR EACH ROW
BEGIN
    UPDATE current_system_status
    SET
        last_updated = CURRENT_TIMESTAMP,
        last_major_event = CURRENT_TIMESTAMP,
        events_last_24h = (
            SELECT COUNT(*) FROM spec_events
            WHERE event_timestamp > datetime('now', '-24 hours')
        )
    WHERE status_id = 'current';
END;

-- Update current status on task events
CREATE TRIGGER IF NOT EXISTS update_status_on_task_event
AFTER INSERT ON task_events
FOR EACH ROW
BEGIN
    UPDATE current_system_status
    SET
        last_updated = CURRENT_TIMESTAMP,
        events_last_24h = (
            SELECT COUNT(*) FROM task_events
            WHERE event_timestamp > datetime('now', '-24 hours')
        ),
        tasks_completed_last_24h = (
            SELECT COUNT(*) FROM task_events
            WHERE event_type = 'completed'
            AND event_timestamp > datetime('now', '-24 hours')
        )
    WHERE status_id = 'current';
END;

-- ============================================================================
-- EXAMPLE ACTIVITY PATTERNS
-- ============================================================================

INSERT OR IGNORE INTO activity_patterns (
    pattern_id,
    pattern_name,
    pattern_type,
    pattern_description,
    detection_rules,
    impact_assessment,
    recommended_actions
) VALUES
(
    'daily-spec-creation',
    'Daily Specification Creation',
    'daily',
    'New specifications are being created regularly',
    '{"event_type": "created", "domain": "spec", "frequency": "daily"}',
    'Healthy pattern - indicates active development planning',
    '["Continue monitoring", "Ensure quality reviews"]'
),
(
    'task-completion-velocity',
    'Task Completion Velocity',
    'daily',
    'Rate at which tasks are being completed',
    '{"event_type": "completed", "domain": "task", "frequency": "hourly"}',
    'Indicates development productivity',
    '["Track trends", "Identify bottlenecks if velocity drops"]'
),
(
    'gap-resolution-rate',
    'Gap Resolution Rate',
    'event_based',
    'How quickly specification gaps are being resolved',
    '{"event_type": "gap_resolved", "domain": "interview"}',
    'Indicates interview system effectiveness',
    '["Optimize interview templates if rate is low"]'
);
