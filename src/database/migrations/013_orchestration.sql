-- ═══════════════════════════════════════════════════════════════════
-- 013: ORCHESTRATION - AGENT DEPLOYMENT & CURATED CONTENT
-- ═══════════════════════════════════════════════════════════════════
-- Created: 2025-10-11
-- Purpose: Track agent deployments, curated work sets, and coordination
--
-- Systems Using This:
-- - AgentDeploymentOrchestrator: VM agent deployment and monitoring
-- - CuratedContentManager: Ground/VM content curation
-- - IntelligentTaskGenerator: Task dependency management
-- - Loop 8 (TaskAssignmentLoop): Agent coordination
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- AGENT_DEPLOYMENTS - Track VM agent deployments
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_deployments (
  -- Identity
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,                -- Agent letter (A, B, C, D, E, F)

  -- VM Details
  vm_host TEXT NOT NULL,                 -- e.g., '34.41.115.199'
  vm_user TEXT NOT NULL,
  vm_port INTEGER DEFAULT 22,

  -- Workspace
  workspace_id TEXT NOT NULL UNIQUE,
  workspace_path TEXT NOT NULL,          -- Path on VM

  -- Deployment Config
  curated_work_set_id TEXT,              -- FK to curated_work_sets
  capabilities TEXT,                     -- JSON array: ['ui', 'backend', etc.]

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, deploying, active, stopped, failed
  deployment_started_at TEXT,
  deployment_completed_at TEXT,
  last_heartbeat_at TEXT,

  -- Health
  is_healthy BOOLEAN DEFAULT 0,
  health_check_failures INTEGER DEFAULT 0,

  -- Process Info
  pid TEXT,                              -- Process ID on VM
  process_status TEXT,                   -- running, stopped, crashed

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  stopped_at TEXT,

  FOREIGN KEY (curated_work_set_id) REFERENCES curated_work_sets(id)
);

CREATE INDEX IF NOT EXISTS idx_agent_deployments_agent ON agent_deployments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_status ON agent_deployments(status);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_workspace ON agent_deployments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_healthy ON agent_deployments(is_healthy);

-- ───────────────────────────────────────────────────────────────────
-- CURATED_WORK_SETS - Ground agent curated content for VM agents
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS curated_work_sets (
  -- Identity
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,

  -- Git Details
  git_branch TEXT NOT NULL,              -- Branch with curated content
  git_commit_hash TEXT,                  -- Specific commit

  -- Content
  curated_files TEXT NOT NULL,           -- JSON array of file paths
  spec_path TEXT,                        -- Associated spec file
  task_ids TEXT,                         -- JSON array of task IDs

  -- Target Agents
  target_agents TEXT NOT NULL,           -- JSON array: ['A', 'B', etc.]

  -- Curation Details
  curated_by TEXT DEFAULT 'ground_agent',
  curation_strategy TEXT,                -- 'minimal', 'spec-based', 'task-based'

  -- Status
  status TEXT DEFAULT 'draft',           -- draft, ready, deployed, archived
  git_pushed BOOLEAN DEFAULT 0,
  git_pushed_at TEXT,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_curated_work_sets_branch ON curated_work_sets(git_branch);
CREATE INDEX IF NOT EXISTS idx_curated_work_sets_status ON curated_work_sets(status);
CREATE INDEX IF NOT EXISTS idx_curated_work_sets_spec ON curated_work_sets(spec_path);

-- ───────────────────────────────────────────────────────────────────
-- AGENT_HEARTBEATS - Health monitoring (30s interval)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_heartbeats (
  -- Identity
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,

  -- Heartbeat Data
  status TEXT NOT NULL,                  -- 'alive', 'busy', 'idle', 'stuck'
  current_task_id TEXT,                  -- What agent is working on
  progress_percentage INTEGER,

  -- System Health
  cpu_usage REAL,                        -- % CPU
  memory_usage REAL,                     -- MB
  disk_usage REAL,                       -- GB

  -- Metadata
  heartbeat_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (deployment_id) REFERENCES agent_deployments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_deployment ON agent_heartbeats(deployment_id);
CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_agent ON agent_heartbeats(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_time ON agent_heartbeats(heartbeat_at);

-- ───────────────────────────────────────────────────────────────────
-- TASK_DEPENDENCIES - Dependency graph for intelligent task ordering
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_dependencies (
  -- Identity
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,                 -- The task that depends
  depends_on_task_id TEXT NOT NULL,      -- The task it depends on

  -- Dependency Type
  dependency_type TEXT DEFAULT 'blocks', -- 'blocks', 'requires', 'prefers'
  -- blocks: Must complete before this starts
  -- requires: Must complete before this completes
  -- prefers: Better if done first, not strict

  -- Status
  is_satisfied BOOLEAN DEFAULT 0,        -- Is dependency met?
  satisfied_at TEXT,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
);

CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_satisfied ON task_dependencies(is_satisfied);

-- ───────────────────────────────────────────────────────────────────
-- TEAM_COORDINATIONS - Multi-agent team coordination
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_coordinations (
  -- Identity
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,

  -- Team Members
  agent_ids TEXT NOT NULL,               -- JSON array: ['A', 'B', 'C']
  deployment_ids TEXT,                   -- JSON array of deployment IDs

  -- Coordination Strategy
  strategy TEXT NOT NULL,                -- 'parallel', 'sequential', 'pipeline'
  -- parallel: All work simultaneously
  -- sequential: One after another
  -- pipeline: Output of one → input of next

  -- Work Assignment
  curated_work_set_id TEXT,              -- Shared work set
  task_ids TEXT,                         -- JSON array of assigned tasks

  -- Status
  status TEXT DEFAULT 'forming',         -- forming, active, completing, completed
  started_at TEXT,
  completed_at TEXT,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (curated_work_set_id) REFERENCES curated_work_sets(id)
);

CREATE INDEX IF NOT EXISTS idx_team_coords_status ON team_coordinations(status);
CREATE INDEX IF NOT EXISTS idx_team_coords_strategy ON team_coordinations(strategy);

-- ───────────────────────────────────────────────────────────────────
-- AGENT_CAPABILITIES - Track agent skills and specializations
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_capabilities (
  -- Identity
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,                -- Agent letter

  -- Capability
  capability_name TEXT NOT NULL,         -- 'ui', 'backend', 'design', etc.
  proficiency_level INTEGER DEFAULT 5,   -- 1-10 scale

  -- Evidence (from completed work)
  tasks_completed INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 1.0,
  avg_completion_time_hours REAL,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  UNIQUE(agent_id, capability_name)
);

CREATE INDEX IF NOT EXISTS idx_agent_caps_agent ON agent_capabilities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_caps_capability ON agent_capabilities(capability_name);
CREATE INDEX IF NOT EXISTS idx_agent_caps_proficiency ON agent_capabilities(proficiency_level);

-- ═══════════════════════════════════════════════════════════════════
-- VIEWS - Useful queries for orchestration intelligence
-- ═══════════════════════════════════════════════════════════════════

-- Active Agent Deployments
CREATE VIEW IF NOT EXISTS v_active_deployments AS
SELECT
  ad.agent_id,
  ad.workspace_id,
  ad.status,
  ad.is_healthy,
  ad.last_heartbeat_at,
  CAST((julianday('now') - julianday(ad.last_heartbeat_at)) * 24 * 60 AS INTEGER) as minutes_since_heartbeat,
  CASE
    WHEN ad.last_heartbeat_at IS NULL THEN 'NO_HEARTBEAT'
    WHEN (julianday('now') - julianday(ad.last_heartbeat_at)) * 24 * 60 > 2 THEN 'STALE'
    ELSE 'ACTIVE'
  END as heartbeat_status,
  cws.name as work_set_name,
  cws.git_branch
FROM agent_deployments ad
LEFT JOIN curated_work_sets cws ON ad.curated_work_set_id = cws.id
WHERE ad.status IN ('active', 'deploying');

-- Task Dependency Graph
CREATE VIEW IF NOT EXISTS v_task_dependency_graph AS
SELECT
  td.task_id,
  t1.title as task_title,
  t1.status as task_status,
  td.depends_on_task_id,
  t2.title as depends_on_title,
  t2.status as depends_on_status,
  td.dependency_type,
  td.is_satisfied,
  CASE
    WHEN td.is_satisfied = 1 THEN 'SATISFIED'
    WHEN t2.status = 'COMPLETE' THEN 'READY_TO_SATISFY'
    WHEN t2.status IN ('IN_PROGRESS', 'CLAIMED') THEN 'WAITING'
    ELSE 'BLOCKED'
  END as dependency_status
FROM task_dependencies td
JOIN tasks t1 ON td.task_id = t1.id
JOIN tasks t2 ON td.depends_on_task_id = t2.id;

-- Agent Workload
CREATE VIEW IF NOT EXISTS v_agent_workload AS
SELECT
  agent_id,
  COUNT(DISTINCT ad.id) as active_deployments,
  COUNT(DISTINCT ah.id) as recent_heartbeats,
  MAX(ah.heartbeat_at) as last_heartbeat,
  COUNT(DISTINCT t.id) as assigned_tasks,
  SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as tasks_in_progress,
  SUM(CASE WHEN t.status = 'COMPLETE' THEN 1 ELSE 0 END) as tasks_completed
FROM agent_deployments ad
LEFT JOIN agent_heartbeats ah ON ad.id = ah.deployment_id
  AND ah.heartbeat_at > datetime('now', '-5 minutes')
LEFT JOIN tasks t ON ad.agent_id = t.agent
GROUP BY agent_id;

-- Available Curated Work Sets
CREATE VIEW IF NOT EXISTS v_available_work_sets AS
SELECT
  cws.id,
  cws.name,
  cws.git_branch,
  cws.status,
  cws.target_agents,
  COUNT(DISTINCT ad.id) as deployed_agents,
  cws.created_at
FROM curated_work_sets cws
LEFT JOIN agent_deployments ad ON cws.id = ad.curated_work_set_id
  AND ad.status = 'active'
WHERE cws.status IN ('ready', 'deployed')
GROUP BY cws.id;

-- Agent Capability Matrix
CREATE VIEW IF NOT EXISTS v_agent_capability_matrix AS
SELECT
  agent_id,
  GROUP_CONCAT(
    capability_name || '(' || proficiency_level || ')',
    ', '
  ) as capabilities,
  AVG(proficiency_level) as avg_proficiency,
  SUM(tasks_completed) as total_tasks,
  AVG(success_rate) as avg_success_rate
FROM agent_capabilities
GROUP BY agent_id;

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS - Auto-update dependency satisfaction
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER IF NOT EXISTS check_dependency_satisfaction
AFTER UPDATE OF status ON tasks
WHEN NEW.status = 'COMPLETE'
BEGIN
  -- Mark dependencies as satisfied when blocker task completes
  UPDATE task_dependencies
  SET
    is_satisfied = 1,
    satisfied_at = datetime('now')
  WHERE
    depends_on_task_id = NEW.id
    AND is_satisfied = 0;
END;

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════
-- Tables: 6 (deployments, work_sets, heartbeats, dependencies, teams, capabilities)
-- Indexes: 15+
-- Views: 5 (active deployments, dependency graph, workload, work sets, capabilities)
-- Triggers: 1 (auto-satisfy dependencies)
-- ═══════════════════════════════════════════════════════════════════
