-- Migration 024: Comprehensive Foreign Key Constraints
-- Purpose: Ensure data integrity across all related tables
-- Date: 2025-10-13

-- ============================================
-- ENABLE FOREIGN KEYS GLOBALLY
-- ============================================

-- Ensure foreign key constraints are enforced
PRAGMA foreign_keys = ON;

-- ============================================
-- REBUILD TABLES WITH PROPER FOREIGN KEYS
-- ============================================

-- Note: SQLite doesn't support adding foreign key constraints to existing tables
-- We need to recreate tables with the proper constraints

-- ============================================
-- TASKS TABLE (Rebuild with foreign keys)
-- ============================================

-- Create backup of existing tasks data
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;

-- Drop original table
DROP TABLE IF EXISTS tasks;

-- Recreate tasks table with proper foreign keys
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  agent TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN (
    'AVAILABLE', 'CLAIMED', 'IN_PROGRESS', 'BLOCKED',
    'COMPLETE', 'FAILED', 'CANCELLED'
  )),
  priority INTEGER NOT NULL DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
  phase TEXT NOT NULL DEFAULT 'implementation',
  timeline TEXT NOT NULL DEFAULT 'TBD',
  dependencies TEXT NOT NULL DEFAULT '[]',
  deliverables TEXT NOT NULL DEFAULT '[]',
  acceptance_criteria TEXT NOT NULL DEFAULT '[]',
  location TEXT NOT NULL DEFAULT 'general',
  claimed_by TEXT,
  started_at TEXT,
  completed_at TEXT,
  files_created TEXT,
  velocity REAL CHECK(velocity >= 0 AND velocity <= 200),
  estimated_hours REAL CHECK(estimated_hours >= 0),
  actual_minutes REAL CHECK(actual_minutes >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  project_id TEXT NOT NULL DEFAULT 'localbrain',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Restore data from backup
INSERT INTO tasks SELECT * FROM tasks_backup;

-- Drop backup table
DROP TABLE IF EXISTS tasks_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent);
CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks(claimed_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);

-- ============================================
-- TASK_HISTORY TABLE (Rebuild with foreign keys)
-- ============================================

-- Create backup
CREATE TABLE IF NOT EXISTS task_history_backup AS SELECT * FROM task_history;

-- Drop original
DROP TABLE IF EXISTS task_history;

-- Recreate with proper foreign keys
CREATE TABLE task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN (
    'created', 'claimed', 'started', 'status_change',
    'updated', 'completed', 'failed', 'cancelled'
  )),
  old_status TEXT,
  new_status TEXT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details TEXT,

  -- Foreign key constraints
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Restore data
INSERT INTO task_history SELECT * FROM task_history_backup;

-- Drop backup
DROP TABLE IF EXISTS task_history_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON task_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_agent ON task_history(agent);
CREATE INDEX IF NOT EXISTS idx_history_action ON task_history(action);

-- ============================================
-- AGENT_SESSIONS TABLE (Rebuild with foreign keys)
-- ============================================

-- Create backup
CREATE TABLE IF NOT EXISTS agent_sessions_backup AS SELECT * FROM agent_sessions;

-- Drop original
DROP TABLE IF EXISTS agent_sessions;

-- Recreate with proper foreign keys
CREATE TABLE agent_sessions (
  id TEXT PRIMARY KEY,
  agent_letter TEXT NOT NULL CHECK(agent_letter IN ('A', 'B', 'C', 'D', 'E', 'F')),
  agent_model TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'localbrain',
  connected_at TEXT NOT NULL,
  disconnected_at TEXT,
  last_heartbeat TEXT NOT NULL,
  machine_id TEXT,
  session_duration_minutes INTEGER CHECK(session_duration_minutes >= 0),
  total_queries INTEGER DEFAULT 0 CHECK(total_queries >= 0),
  tasks_claimed INTEGER DEFAULT 0 CHECK(tasks_claimed >= 0),
  tasks_completed INTEGER DEFAULT 0 CHECK(tasks_completed >= 0),
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'IDLE', 'DISCONNECTED')),

  -- Foreign key constraints
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Restore data
INSERT INTO agent_sessions SELECT * FROM agent_sessions_backup;

-- Drop backup
DROP TABLE IF EXISTS agent_sessions_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_agent ON agent_sessions(agent_letter);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_connected ON agent_sessions(connected_at);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON agent_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_model ON agent_sessions(agent_model);

-- ============================================
-- AGENT_ACTIVITY TABLE (Rebuild with foreign keys)
-- ============================================

-- Create backup
CREATE TABLE IF NOT EXISTS agent_activity_backup AS SELECT * FROM agent_activity;

-- Drop original
DROP TABLE IF EXISTS agent_activity;

-- Recreate with proper foreign keys
CREATE TABLE agent_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  agent_letter TEXT NOT NULL CHECK(agent_letter IN ('A', 'B', 'C', 'D', 'E', 'F')),
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activity_type TEXT NOT NULL CHECK(activity_type IN (
    'CONNECT', 'DISCONNECT', 'HEARTBEAT',
    'QUERY', 'CLAIM', 'UPDATE', 'COMPLETE',
    'COLLABORATE', 'ERROR'
  )),
  task_id TEXT,
  details TEXT,
  duration_ms INTEGER CHECK(duration_ms >= 0),

  -- Foreign key constraints
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Restore data
INSERT INTO agent_activity SELECT * FROM agent_activity_backup;

-- Drop backup
DROP TABLE IF EXISTS agent_activity_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_session ON agent_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_agent ON agent_activity(agent_letter);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON agent_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_type ON agent_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_task ON agent_activity(task_id);

-- ============================================
-- AGENT_PRESENCE TABLE (Rebuild with foreign keys)
-- ============================================

-- Create backup
CREATE TABLE IF NOT EXISTS agent_presence_backup AS SELECT * FROM agent_presence;

-- Drop original
DROP TABLE IF EXISTS agent_presence;

-- Recreate with proper foreign keys
CREATE TABLE agent_presence (
  agent_letter TEXT PRIMARY KEY CHECK(agent_letter IN ('A', 'B', 'C', 'D', 'E', 'F')),
  status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK(status IN ('ONLINE', 'IDLE', 'OFFLINE')),
  current_session_id TEXT,
  current_task_id TEXT,
  last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  online_since TEXT,
  total_sessions_today INTEGER DEFAULT 0 CHECK(total_sessions_today >= 0),
  total_active_time_minutes INTEGER DEFAULT 0 CHECK(total_active_time_minutes >= 0),
  tasks_today INTEGER DEFAULT 0 CHECK(tasks_today >= 0),

  -- Foreign key constraints
  FOREIGN KEY (current_session_id) REFERENCES agent_sessions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Restore data
INSERT INTO agent_presence SELECT * FROM agent_presence_backup;

-- Drop backup
DROP TABLE IF EXISTS agent_presence_backup;

-- Create index
CREATE INDEX IF NOT EXISTS idx_presence_status ON agent_presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_session ON agent_presence(current_session_id);
CREATE INDEX IF NOT EXISTS idx_presence_task ON agent_presence(current_task_id);

-- ============================================
-- AGENT_COLLABORATION TABLE (Rebuild with foreign keys)
-- ============================================

-- Create backup
CREATE TABLE IF NOT EXISTS agent_collaboration_backup AS SELECT * FROM agent_collaboration;

-- Drop original
DROP TABLE IF EXISTS agent_collaboration;

-- Recreate with proper foreign keys
CREATE TABLE agent_collaboration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  agent_from TEXT NOT NULL CHECK(agent_from IN ('A', 'B', 'C', 'D', 'E', 'F')),
  agent_to TEXT NOT NULL CHECK(agent_to IN ('A', 'B', 'C', 'D', 'E', 'F')),
  collaboration_type TEXT NOT NULL CHECK(collaboration_type IN (
    'HANDOFF', 'REVIEW', 'ASSIST', 'COORDINATE', 'QUESTION', 'ANSWER'
  )),
  task_id TEXT,
  details TEXT,

  -- Foreign key constraints
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (agent_from != agent_to) -- Prevent self-collaboration
);

-- Restore data
INSERT INTO agent_collaboration SELECT * FROM agent_collaboration_backup;

-- Drop backup
DROP TABLE IF EXISTS agent_collaboration_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collab_from ON agent_collaboration(agent_from);
CREATE INDEX IF NOT EXISTS idx_collab_to ON agent_collaboration(agent_to);
CREATE INDEX IF NOT EXISTS idx_collab_timestamp ON agent_collaboration(timestamp);
CREATE INDEX IF NOT EXISTS idx_collab_task ON agent_collaboration(task_id);

-- ============================================
-- ENSURE AGENTS TABLE HAS PROPER CONSTRAINTS
-- ============================================

-- Create backup
CREATE TABLE IF NOT EXISTS agents_backup AS SELECT * FROM agents;

-- Drop original
DROP TABLE IF EXISTS agents;

-- Recreate with enhanced constraints
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK(length(name) >= 1),
  model_id TEXT NOT NULL CHECK(length(model_id) >= 1),
  model_signature TEXT NOT NULL CHECK(length(model_signature) >= 1),
  capabilities TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_sessions INTEGER DEFAULT 0 CHECK(total_sessions >= 0),
  total_tasks INTEGER DEFAULT 0 CHECK(total_tasks >= 0),
  metadata TEXT
);

-- Restore data
INSERT INTO agents SELECT * FROM agents_backup;

-- Drop backup
DROP TABLE IF EXISTS agents_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_tracking ON agents(tracking_id);
CREATE INDEX IF NOT EXISTS idx_agents_signature ON agents(model_signature);
CREATE INDEX IF NOT EXISTS idx_agents_model ON agents(model_id);
CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen);

-- ============================================
-- ADD TRIGGERS FOR DATA CONSISTENCY
-- ============================================

-- Trigger to update updated_at timestamp on tasks
CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp
AFTER UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to prevent deletion of projects with associated tasks
CREATE TRIGGER IF NOT EXISTS prevent_project_deletion
BEFORE DELETE ON projects
BEGIN
  SELECT CASE (
    SELECT COUNT(*) FROM tasks WHERE project_id = OLD.id
  ) WHEN 0 THEN 1 ELSE RAISE(ABORT, 'Cannot delete project with associated tasks') END;
END;

-- Trigger to maintain agent presence consistency
CREATE TRIGGER IF NOT EXISTS update_agent_presence_on_disconnect
AFTER UPDATE OF disconnected_at ON agent_sessions
WHEN NEW.disconnected_at IS NOT NULL AND OLD.disconnected_at IS NULL
BEGIN
  UPDATE agent_presence
  SET status = 'OFFLINE', current_session_id = NULL
  WHERE agent_letter = NEW.agent_letter
    AND current_session_id = NEW.id;
END;

-- Trigger to validate task status transitions
CREATE TRIGGER IF NOT EXISTS validate_task_status_transition
BEFORE UPDATE OF status ON tasks
WHEN OLD.status != NEW.status
BEGIN
  SELECT CASE
    WHEN OLD.status = 'COMPLETE' AND NEW.status != 'COMPLETE' THEN
      RAISE(ABORT, 'Cannot change status from COMPLETE')
    WHEN OLD.status = 'CANCELLED' AND NEW.status != 'CANCELLED' THEN
      RAISE(ABORT, 'Cannot change status from CANCELLED')
    WHEN OLD.status = 'FAILED' AND NEW.status NOT IN ('AVAILABLE', 'FAILED') THEN
      RAISE(ABORT, 'Failed tasks can only be marked as AVAILABLE or FAILED')
    ELSE 1
  END;
END;

-- ============================================
-- INTEGRITY CHECKS
-- ============================================

-- Function to check foreign key integrity (for monitoring)
CREATE VIEW IF NOT EXISTS data_integrity_check AS
SELECT
  'orphaned_tasks' as issue_type,
  COUNT(*) as count,
  'Tasks without valid projects' as description
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT
  'orphaned_agent_activity' as issue_type,
  COUNT(*) as count,
  'Agent activity without valid sessions' as description
FROM agent_activity aa
LEFT JOIN agent_sessions a_s ON aa.session_id = a_s.id
WHERE a_s.id IS NULL

UNION ALL

SELECT
  'orphaned_task_history' as issue_type,
  COUNT(*) as count,
  'Task history without valid tasks' as description
FROM task_history th
LEFT JOIN tasks t ON th.task_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT
  'invalid_agent_presence' as issue_type,
  COUNT(*) as count,
  'Agent presence with invalid current session' as description
FROM agent_presence ap
LEFT JOIN agent_sessions a_s ON ap.current_session_id = a_s.id
WHERE ap.current_session_id IS NOT NULL AND a_s.id IS NULL;

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

-- Verify foreign keys are enabled
PRAGMA foreign_key_check;

-- Check data integrity
SELECT * FROM data_integrity_check WHERE count > 0;

-- Migration completion message
SELECT
  'Migration 024 Complete - Foreign Key Constraints Added' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND sql LIKE '%FOREIGN KEY%') as tables_with_foreign_keys,
  (SELECT COUNT(*) FROM pragma_foreign_key_list('tasks')) as task_foreign_keys,
  (SELECT COUNT(*) FROM pragma_foreign_key_list('agent_sessions')) as session_foreign_keys,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger') as triggers_created;