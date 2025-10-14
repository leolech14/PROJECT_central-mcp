-- PostgreSQL Migration 001: Initial Schema
-- Purpose: Convert SQLite schema to PostgreSQL for cloud deployment
-- Date: 2025-10-08

-- ============================================
-- PROJECTS TABLE (Multi-Project Support)
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL UNIQUE,
  git_remote TEXT UNIQUE,
  type VARCHAR(50) NOT NULL CHECK(type IN (
    'COMMERCIAL_APP', 'KNOWLEDGE_SYSTEM', 'TOOL',
    'INFRASTRUCTURE', 'EXPERIMENTAL', 'UNKNOWN'
  )),
  vision TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discovered_by VARCHAR(20) NOT NULL CHECK(discovered_by IN ('auto', 'manual')),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_projects_activity ON projects(last_activity DESC);
CREATE INDEX idx_projects_git_remote ON projects(git_remote) WHERE git_remote IS NOT NULL;

-- ============================================
-- TASKS TABLE (Task Definitions)
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  agent VARCHAR(1) NOT NULL CHECK(agent IN ('A', 'B', 'C', 'D', 'E', 'F', 'UNASSIGNED')),
  status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK(status IN (
    'AVAILABLE', 'CLAIMED', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED'
  )),
  priority VARCHAR(5) DEFAULT 'P1' CHECK(priority IN ('P0', 'P1', 'P2', 'P3')),
  dependencies JSONB DEFAULT '[]'::jsonb,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  velocity INTEGER,
  files_created JSONB DEFAULT '[]'::jsonb,
  claimed_at TIMESTAMPTZ,
  claimed_by VARCHAR(1),
  completed_at TIMESTAMPTZ,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  notes TEXT
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_agent ON tasks(agent);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_claimed_by ON tasks(claimed_by) WHERE claimed_by IS NOT NULL;

-- ============================================
-- TASK HISTORY (Audit Log)
-- ============================================

CREATE TABLE IF NOT EXISTS task_history (
  id BIGSERIAL PRIMARY KEY,
  task_id VARCHAR(10) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent VARCHAR(1),
  status VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_history_task ON task_history(task_id);
CREATE INDEX idx_history_timestamp ON task_history(timestamp DESC);

-- ============================================
-- AGENTS TABLE (Persistent Identity)
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  model_signature VARCHAR(64) NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agents_tracking ON agents(tracking_id);
CREATE INDEX idx_agents_signature ON agents(model_signature);
CREATE INDEX idx_agents_model ON agents(model_id);
CREATE INDEX idx_agents_last_seen ON agents(last_seen DESC);

-- ============================================
-- AGENT SESSIONS (Connection Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_letter VARCHAR(1) NOT NULL CHECK(agent_letter IN ('A', 'B', 'C', 'D', 'E', 'F')),
  agent_model VARCHAR(100) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  machine_id VARCHAR(255),
  session_duration_minutes INTEGER,
  total_queries INTEGER DEFAULT 0,
  tasks_claimed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'IDLE', 'DISCONNECTED'))
);

CREATE INDEX idx_sessions_agent ON agent_sessions(agent_letter);
CREATE INDEX idx_sessions_status ON agent_sessions(status);
CREATE INDEX idx_sessions_connected ON agent_sessions(connected_at DESC);
CREATE INDEX idx_sessions_project ON agent_sessions(project_id);
CREATE INDEX idx_sessions_project_agent ON agent_sessions(project_id, agent_letter);

-- ============================================
-- AGENT ACTIVITY (Operation Log)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_activity (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  agent_letter VARCHAR(1) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activity_type VARCHAR(20) NOT NULL CHECK(activity_type IN (
    'CONNECT', 'DISCONNECT', 'HEARTBEAT',
    'QUERY', 'CLAIM', 'UPDATE', 'COMPLETE',
    'COLLABORATE', 'ERROR'
  )),
  task_id VARCHAR(10) REFERENCES tasks(id) ON DELETE SET NULL,
  details JSONB,
  duration_ms INTEGER
);

CREATE INDEX idx_activity_session ON agent_activity(session_id);
CREATE INDEX idx_activity_agent ON agent_activity(agent_letter);
CREATE INDEX idx_activity_timestamp ON agent_activity(timestamp DESC);
CREATE INDEX idx_activity_type ON agent_activity(activity_type);
CREATE INDEX idx_activity_task ON agent_activity(task_id) WHERE task_id IS NOT NULL;

-- Partition by month for better performance (future)
-- CREATE TABLE agent_activity_2025_10 PARTITION OF agent_activity
-- FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- ============================================
-- AGENT PRESENCE (Real-Time Status)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_presence (
  agent_letter VARCHAR(1) PRIMARY KEY CHECK(agent_letter IN ('A', 'B', 'C', 'D', 'E', 'F')),
  status VARCHAR(10) NOT NULL DEFAULT 'OFFLINE' CHECK(status IN ('ONLINE', 'IDLE', 'OFFLINE')),
  current_session_id UUID REFERENCES agent_sessions(id) ON DELETE SET NULL,
  current_task_id VARCHAR(10) REFERENCES tasks(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  online_since TIMESTAMPTZ,
  total_sessions_today INTEGER DEFAULT 0,
  total_active_time_minutes INTEGER DEFAULT 0,
  tasks_today INTEGER DEFAULT 0
);

-- Initialize all 6 agents
INSERT INTO agent_presence (agent_letter, status, last_seen) VALUES
  ('A', 'OFFLINE', NOW()),
  ('B', 'OFFLINE', NOW()),
  ('C', 'OFFLINE', NOW()),
  ('D', 'OFFLINE', NOW()),
  ('E', 'OFFLINE', NOW()),
  ('F', 'OFFLINE', NOW())
ON CONFLICT (agent_letter) DO NOTHING;

-- ============================================
-- AGENT METRICS (Daily Performance)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_metrics (
  id BIGSERIAL PRIMARY KEY,
  agent_letter VARCHAR(1) NOT NULL,
  metric_date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_active_minutes INTEGER DEFAULT 0,
  tasks_claimed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  average_task_minutes NUMERIC(10,2),
  velocity_score NUMERIC(10,2),
  quality_score NUMERIC(10,2) DEFAULT 1.0,
  collaboration_score NUMERIC(10,2) DEFAULT 0.0,
  UNIQUE(agent_letter, metric_date)
);

CREATE INDEX idx_metrics_agent_date ON agent_metrics(agent_letter, metric_date DESC);

-- ============================================
-- AGENT COLLABORATION (Cross-Agent Events)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_collaboration (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agent_from VARCHAR(1) NOT NULL,
  agent_to VARCHAR(1) NOT NULL,
  collaboration_type VARCHAR(20) NOT NULL CHECK(collaboration_type IN (
    'HANDOFF', 'REVIEW', 'ASSIST', 'COORDINATE', 'QUESTION', 'ANSWER'
  )),
  task_id VARCHAR(10) REFERENCES tasks(id) ON DELETE SET NULL,
  details JSONB
);

CREATE INDEX idx_collab_from ON agent_collaboration(agent_from);
CREATE INDEX idx_collab_to ON agent_collaboration(agent_to);
CREATE INDEX idx_collab_timestamp ON agent_collaboration(timestamp DESC);
CREATE INDEX idx_collab_task ON agent_collaboration(task_id) WHERE task_id IS NOT NULL;

-- ============================================
-- CONTEXT FILES (Extracted Context)
-- ============================================

CREATE TABLE IF NOT EXISTS context_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  relative_path TEXT NOT NULL,
  absolute_path TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK(type IN (
    'SPEC', 'DOC', 'CODE', 'ARCHITECTURE', 'STATUS', 'CONFIG', 'ASSET', 'UNKNOWN'
  )),
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, relative_path)
);

CREATE INDEX idx_context_project ON context_files(project_id);
CREATE INDEX idx_context_type ON context_files(type);
CREATE INDEX idx_context_modified ON context_files(modified_at DESC);
CREATE INDEX idx_context_path ON context_files USING btree(project_id, relative_path);

-- ============================================
-- MIGRATIONS TABLE (Schema Versioning)
-- ============================================

CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update last_activity on project changes
CREATE OR REPLACE FUNCTION update_project_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET last_activity = NOW() WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_activity();

CREATE TRIGGER context_activity_trigger
  AFTER INSERT OR UPDATE ON context_files
  FOR EACH ROW
  EXECUTE FUNCTION update_project_activity();

-- Auto-reset daily metrics at midnight
CREATE OR REPLACE FUNCTION reset_daily_metrics()
RETURNS void AS $$
BEGIN
  UPDATE agent_presence SET
    total_sessions_today = 0,
    total_active_time_minutes = 0,
    tasks_today = 0
  WHERE CURRENT_DATE > (
    SELECT metric_date FROM agent_metrics
    WHERE agent_letter = agent_presence.agent_letter
    ORDER BY metric_date DESC LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

CREATE OR REPLACE VIEW active_agents AS
SELECT
  p.agent_letter,
  p.status,
  p.last_seen,
  s.agent_model,
  s.connected_at,
  t.id as current_task_id,
  t.name as current_task_name,
  proj.name as project_name
FROM agent_presence p
LEFT JOIN agent_sessions s ON p.current_session_id = s.id
LEFT JOIN tasks t ON p.current_task_id = t.id
LEFT JOIN projects proj ON s.project_id = proj.id
WHERE p.status IN ('ONLINE', 'IDLE');

CREATE OR REPLACE VIEW task_readiness AS
SELECT
  t.id,
  t.name,
  t.status,
  t.priority,
  t.agent,
  t.dependencies,
  p.name as project_name,
  CASE
    WHEN t.status = 'COMPLETE' THEN 100
    WHEN t.status = 'BLOCKED' THEN 0
    WHEN jsonb_array_length(t.dependencies) = 0 THEN 90
    ELSE 50
  END as readiness_score
FROM tasks t
JOIN projects p ON t.project_id = p.id;

-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Analyze tables for query optimization
ANALYZE projects;
ANALYZE tasks;
ANALYZE agents;
ANALYZE agent_sessions;
ANALYZE agent_activity;
ANALYZE agent_presence;
ANALYZE agent_metrics;
ANALYZE context_files;

-- Vacuum for optimal performance
VACUUM ANALYZE;

COMMENT ON TABLE projects IS 'Multi-project registry with automatic discovery';
COMMENT ON TABLE tasks IS 'Task definitions with dependencies and Git verification';
COMMENT ON TABLE agents IS 'Persistent agent identity across sessions';
COMMENT ON TABLE agent_sessions IS 'Agent connection lifecycle tracking';
COMMENT ON TABLE agent_activity IS 'Complete audit log of all MCP operations';
COMMENT ON TABLE agent_presence IS 'Real-time agent status (ONLINE/IDLE/OFFLINE)';
COMMENT ON TABLE context_files IS 'Extracted context files for semantic search';
