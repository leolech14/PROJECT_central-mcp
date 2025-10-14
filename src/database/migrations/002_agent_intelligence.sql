-- Migration 002: Agent Intelligence Tables
-- Purpose: Add agent session tracking, activity logging, presence, metrics, and collaboration
-- Date: 2025-10-08

-- ============================================
-- AGENT SESSIONS (Connection Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  agent_letter TEXT NOT NULL,
  agent_model TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'LocalBrain',
  connected_at TEXT NOT NULL,
  disconnected_at TEXT,
  last_heartbeat TEXT NOT NULL,
  machine_id TEXT,
  session_duration_minutes INTEGER,
  total_queries INTEGER DEFAULT 0,
  tasks_claimed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'IDLE', 'DISCONNECTED'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_agent ON agent_sessions(agent_letter);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_connected ON agent_sessions(connected_at);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON agent_sessions(project_id);

-- ============================================
-- AGENT ACTIVITY LOG (All MCP Operations)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  agent_letter TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  activity_type TEXT NOT NULL CHECK(activity_type IN (
    'CONNECT', 'DISCONNECT', 'HEARTBEAT',
    'QUERY', 'CLAIM', 'UPDATE', 'COMPLETE',
    'COLLABORATE', 'ERROR'
  )),
  task_id TEXT,
  details TEXT,
  duration_ms INTEGER,
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_session ON agent_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_agent ON agent_activity(agent_letter);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON agent_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_type ON agent_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_task ON agent_activity(task_id);

-- ============================================
-- AGENT PRESENCE (Current Status)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_presence (
  agent_letter TEXT PRIMARY KEY CHECK(agent_letter IN ('A', 'B', 'C', 'D', 'E', 'F')),
  status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK(status IN ('ONLINE', 'IDLE', 'OFFLINE')),
  current_session_id TEXT,
  current_task_id TEXT,
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  online_since TEXT,
  total_sessions_today INTEGER DEFAULT 0,
  total_active_time_minutes INTEGER DEFAULT 0,
  tasks_today INTEGER DEFAULT 0,
  FOREIGN KEY (current_session_id) REFERENCES agent_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Initialize all 6 agents as OFFLINE
INSERT OR IGNORE INTO agent_presence (agent_letter, status, last_seen) VALUES
  ('A', 'OFFLINE', datetime('now')),
  ('B', 'OFFLINE', datetime('now')),
  ('C', 'OFFLINE', datetime('now')),
  ('D', 'OFFLINE', datetime('now')),
  ('E', 'OFFLINE', datetime('now')),
  ('F', 'OFFLINE', datetime('now'));

-- ============================================
-- AGENT METRICS (Daily Performance Aggregation)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_letter TEXT NOT NULL,
  metric_date TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_active_minutes INTEGER DEFAULT 0,
  tasks_claimed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  average_task_minutes REAL,
  velocity_score REAL,
  quality_score REAL DEFAULT 1.0,
  collaboration_score REAL DEFAULT 0.0,
  UNIQUE(agent_letter, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_metrics_agent_date ON agent_metrics(agent_letter, metric_date);

-- ============================================
-- AGENT COLLABORATION (Cross-Agent Events)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_collaboration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  agent_from TEXT NOT NULL,
  agent_to TEXT NOT NULL,
  collaboration_type TEXT NOT NULL CHECK(collaboration_type IN (
    'HANDOFF', 'REVIEW', 'ASSIST', 'COORDINATE', 'QUESTION', 'ANSWER'
  )),
  task_id TEXT,
  details TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_collab_from ON agent_collaboration(agent_from);
CREATE INDEX IF NOT EXISTS idx_collab_to ON agent_collaboration(agent_to);
CREATE INDEX IF NOT EXISTS idx_collab_timestamp ON agent_collaboration(timestamp);
CREATE INDEX IF NOT EXISTS idx_collab_task ON agent_collaboration(task_id);

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

-- Verify all tables exist
SELECT
  'Migration 002 Complete - Intelligence Tables Created' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN (
    'agent_sessions', 'agent_activity', 'agent_presence',
    'agent_metrics', 'agent_collaboration'
  )) as tables_created,
  (SELECT COUNT(*) FROM agent_presence) as agents_initialized;
