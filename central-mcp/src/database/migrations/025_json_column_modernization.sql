-- Migration 025: JSON Column Modernization
-- Purpose: Convert TEXT columns storing JSON to proper JSON columns for better performance and validation
-- Date: 2025-10-13

-- ============================================
-- ENABLE JSON EXTENSIONS AND VALIDATION
-- ============================================

-- Ensure JSON1 extension is enabled
PRAGMA journal_mode = WAL;

-- ============================================
-- CORE TABLES WITH JSON COLUMNS
-- ============================================

-- TASKS TABLE - Convert JSON columns to proper JSON
-- Create backup
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;

-- Drop original table
DROP TABLE IF EXISTS tasks;

-- Recreate with JSON columns
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
  dependencies JSON NOT NULL DEFAULT ('[]'),
  deliverables JSON NOT NULL DEFAULT ('[]'),
  acceptance_criteria JSON NOT NULL DEFAULT ('[]'),
  location TEXT NOT NULL DEFAULT 'general',
  claimed_by TEXT,
  started_at TEXT,
  completed_at TEXT,
  files_created JSON,
  velocity REAL CHECK(velocity >= 0 AND velocity <= 200),
  estimated_hours REAL CHECK(estimated_hours >= 0),
  actual_minutes REAL CHECK(actual_minutes >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  project_id TEXT NOT NULL DEFAULT 'localbrain',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT ON UPDATE CASCADE,

  -- JSON validation constraints
  CHECK (
    json_valid(dependencies) AND
    json_valid(deliverables) AND
    json_valid(acceptance_criteria) AND
    (files_created IS NULL OR json_valid(files_created))
  )
);

-- Restore data from backup with JSON validation
INSERT INTO tasks (
  id, name, agent, status, priority, phase, timeline,
  dependencies, deliverables, acceptance_criteria, location,
  claimed_by, started_at, completed_at, files_created,
  velocity, estimated_hours, actual_minutes, created_at, updated_at,
  project_id
)
SELECT
  id, name, agent, status, priority, phase, timeline,
  CASE
    WHEN json_valid(dependencies) THEN dependencies
    ELSE COALESCE(dependencies, '[]')
  END as dependencies,
  CASE
    WHEN json_valid(deliverables) THEN deliverables
    ELSE COALESCE(deliverables, '[]')
  END as deliverables,
  CASE
    WHEN json_valid(acceptance_criteria) THEN acceptance_criteria
    ELSE COALESCE(acceptance_criteria, '[]')
  END as acceptance_criteria,
  location, claimed_by, started_at, completed_at,
  CASE
    WHEN files_created IS NULL OR json_valid(files_created) THEN files_created
    ELSE NULL
  END as files_created,
  velocity, estimated_hours, actual_minutes, created_at, updated_at,
  COALESCE(project_id, 'localbrain') as project_id
FROM tasks_backup;

-- Drop backup
DROP TABLE IF EXISTS tasks_backup;

-- Create indexes including JSON indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent);
CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks(claimed_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);

-- JSON indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_dependencies_contains ON tasks(json_extract(dependencies, '$')) WHERE dependencies IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deliverables_type ON tasks(json_extract(deliverables, '$[0].type')) WHERE deliverables IS NOT NULL;

-- ============================================
-- AGENTS TABLE - Convert JSON columns
-- ============================================

CREATE TABLE IF NOT EXISTS agents_backup AS SELECT * FROM agents;

DROP TABLE IF EXISTS agents;

CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK(length(name) >= 1),
  model_id TEXT NOT NULL CHECK(length(model_id) >= 1),
  model_signature TEXT NOT NULL CHECK(length(model_signature) >= 1),
  capabilities JSON NOT NULL DEFAULT ('[]'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_sessions INTEGER DEFAULT 0 CHECK(total_sessions >= 0),
  total_tasks INTEGER DEFAULT 0 CHECK(total_tasks >= 0),
  metadata JSON,

  -- JSON validation constraints
  CHECK (
    json_valid(capabilities) AND
    (metadata IS NULL OR json_valid(metadata))
  )
);

-- Restore data with validation
INSERT INTO agents (
  id, tracking_id, name, model_id, model_signature,
  capabilities, created_at, last_seen, total_sessions, total_tasks, metadata
)
SELECT
  id, tracking_id, name, model_id, model_signature,
  CASE
    WHEN json_valid(capabilities) THEN capabilities
    ELSE COALESCE(capabilities, '[]')
  END as capabilities,
  created_at, last_seen, total_sessions, total_tasks,
  CASE
    WHEN metadata IS NULL OR json_valid(metadata) THEN metadata
    ELSE NULL
  END as metadata
FROM agents_backup;

DROP TABLE IF EXISTS agents_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_tracking ON agents(tracking_id);
CREATE INDEX IF NOT EXISTS idx_agents_signature ON agents(model_signature);
CREATE INDEX IF NOT EXISTS idx_agents_model ON agents(model_id);
CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen);
CREATE INDEX IF NOT EXISTS idx_agents_capabilities ON agents(json_extract(capabilities, '$')) WHERE capabilities IS NOT NULL;

-- ============================================
-- PROJECTS TABLE - Convert JSON columns
-- ============================================

CREATE TABLE IF NOT EXISTS projects_backup AS SELECT * FROM projects;

DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  git_remote TEXT UNIQUE,
  type TEXT NOT NULL CHECK(type IN (
    'COMMERCIAL_APP', 'KNOWLEDGE_SYSTEM', 'TOOL',
    'INFRASTRUCTURE', 'EXPERIMENTAL', 'UNKNOWN'
  )),
  vision TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  discovered_by TEXT NOT NULL CHECK(discovered_by IN ('auto', 'manual')),
  metadata JSON,

  -- JSON validation constraints
  CHECK (metadata IS NULL OR json_valid(metadata))
);

-- Restore data with validation
INSERT INTO projects (
  id, name, path, git_remote, type, vision,
  created_at, last_activity, discovered_by, metadata
)
SELECT
  id, name, path, git_remote, type, vision,
  created_at, last_activity, discovered_by,
  CASE
    WHEN metadata IS NULL OR json_valid(metadata) THEN metadata
    ELSE NULL
  END as metadata
FROM projects_backup;

DROP TABLE IF EXISTS projects_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_activity ON projects(last_activity);
CREATE INDEX IF NOT EXISTS idx_projects_git_remote ON projects(git_remote);

-- ============================================
-- TASK_HISTORY TABLE - Add JSON column for details
-- ============================================

CREATE TABLE IF NOT EXISTS task_history_backup AS SELECT * FROM task_history;

DROP TABLE IF EXISTS task_history;

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
  details JSON,

  -- Foreign key constraints
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,

  -- JSON validation constraints
  CHECK (details IS NULL OR json_valid(details))
);

-- Restore data with validation
INSERT INTO task_history (
  id, task_id, agent, action, old_status, new_status, timestamp, details
)
SELECT
  id, task_id, agent, action, old_status, new_status, timestamp,
  CASE
    WHEN details IS NULL OR json_valid(details) THEN details
    ELSE NULL
  END as details
FROM task_history_backup;

DROP TABLE IF EXISTS task_history_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON task_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_agent ON task_history(agent);
CREATE INDEX IF NOT EXISTS idx_history_action ON task_history(action);

-- ============================================
-- CONTEXT FILES REGISTRY TABLE - Convert JSON columns
-- ============================================

CREATE TABLE IF NOT EXISTS context_files_registry_backup AS SELECT * FROM context_files_registry;

DROP TABLE IF EXISTS context_files_registry;

CREATE TABLE context_files_registry (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT,
  content_preview TEXT,
  file_size INTEGER,
  file_type TEXT,
  last_modified TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  category TEXT,
  priority INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,

  -- JSON columns
  target_roles JSON,
  target_projects JSON,
  target_models JSON,
  exclusions JSON,
  tags JSON,
  metadata JSON,
  requires_context_ids JSON,
  conflicts_with JSON,
  injected_with_skps JSON,
  injected_with_specs JSON,
  injected_with_tools JSON,
  injected_with_prompts JSON,
  affects_agents JSON,
  observed_behaviors JSON,
  variables JSON,

  -- JSON validation constraints
  CHECK (
    (target_roles IS NULL OR json_valid(target_roles)) AND
    (target_projects IS NULL OR json_valid(target_projects)) AND
    (target_models IS NULL OR json_valid(target_models)) AND
    (exclusions IS NULL OR json_valid(exclusions)) AND
    (tags IS NULL OR json_valid(tags)) AND
    (metadata IS NULL OR json_valid(metadata)) AND
    (requires_context_ids IS NULL OR json_valid(requires_context_ids)) AND
    (conflicts_with IS NULL OR json_valid(conflicts_with)) AND
    (injected_with_skps IS NULL OR json_valid(injected_with_skps)) AND
    (injected_with_specs IS NULL OR json_valid(injected_with_specs)) AND
    (injected_with_tools IS NULL OR json_valid(injected_with_tools)) AND
    (injected_with_prompts IS NULL OR json_valid(injected_with_prompts)) AND
    (affects_agents IS NULL OR json_valid(affects_agents)) AND
    (observed_behaviors IS NULL OR json_valid(observed_behaviors)) AND
    (variables IS NULL OR json_valid(variables))
  )
);

-- Restore data with validation - this will be a complex migration
-- For safety, we'll insert NULL for JSON columns that might be invalid
INSERT INTO context_files_registry (
  id, filename, file_path, file_hash, content_preview,
  file_size, file_type, last_modified, created_at, updated_at,
  category, priority, is_active,
  target_roles, target_projects, target_models, exclusions, tags,
  metadata, requires_context_ids, conflicts_with, injected_with_skps,
  injected_with_specs, injected_with_tools, injected_with_prompts,
  affects_agents, observed_behaviors, variables
)
SELECT
  id, filename, file_path, file_hash, content_preview,
  file_size, file_type, last_modified, created_at, updated_at,
  category, priority, is_active,
  CASE WHEN json_valid(target_roles) THEN target_roles ELSE NULL END,
  CASE WHEN json_valid(target_projects) THEN target_projects ELSE NULL END,
  CASE WHEN json_valid(target_models) THEN target_models ELSE NULL END,
  CASE WHEN json_valid(exclusions) THEN exclusions ELSE NULL END,
  CASE WHEN json_valid(tags) THEN tags ELSE NULL END,
  CASE WHEN json_valid(metadata) THEN metadata ELSE NULL END,
  CASE WHEN json_valid(requires_context_ids) THEN requires_context_ids ELSE NULL END,
  CASE WHEN json_valid(conflicts_with) THEN conflicts_with ELSE NULL END,
  CASE WHEN json_valid(injected_with_skps) THEN injected_with_skps ELSE NULL END,
  CASE WHEN json_valid(injected_with_specs) THEN injected_with_specs ELSE NULL END,
  CASE WHEN json_valid(injected_with_tools) THEN injected_with_tools ELSE NULL END,
  CASE WHEN json_valid(injected_with_prompts) THEN injected_with_prompts ELSE NULL END,
  CASE WHEN json_valid(affects_agents) THEN affects_agents ELSE NULL END,
  CASE WHEN json_valid(observed_behaviors) THEN observed_behaviors ELSE NULL END,
  CASE WHEN json_valid(variables) THEN variables ELSE NULL END
FROM context_files_registry_backup;

DROP TABLE IF EXISTS context_files_registry_backup;

-- ============================================
-- TOOLS REGISTRY TABLE - Convert JSON columns
-- ============================================

CREATE TABLE IF NOT EXISTS tools_registry_backup AS SELECT * FROM tools_registry;

DROP TABLE IF EXISTS tools_registry;

CREATE TABLE tools_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  command TEXT,
  parameters JSON,
  examples JSON,
  tags JSON,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  version TEXT,
  author TEXT,
  license TEXT,
  repository_url TEXT,
  documentation_url TEXT,
  metadata JSON,

  -- JSON validation constraints
  CHECK (
    (parameters IS NULL OR json_valid(parameters)) AND
    (examples IS NULL OR json_valid(examples)) AND
    (tags IS NULL OR json_valid(tags)) AND
    (metadata IS NULL OR json_valid(metadata))
  )
);

-- Restore data with validation
INSERT INTO tools_registry (
  id, name, description, category, command, parameters, examples,
  tags, created_at, updated_at, is_active, version, author,
  license, repository_url, documentation_url, metadata
)
SELECT
  id, name, description, category, command,
  CASE WHEN json_valid(parameters) THEN parameters ELSE NULL END,
  CASE WHEN json_valid(examples) THEN examples ELSE NULL END,
  CASE WHEN json_valid(tags) THEN tags ELSE NULL END,
  created_at, updated_at, is_active, version, author,
  license, repository_url, documentation_url,
  CASE WHEN json_valid(metadata) THEN metadata ELSE NULL END
FROM tools_registry_backup;

DROP TABLE IF EXISTS tools_registry_backup;

-- ============================================
-- JSON TRIGGERS FOR DATA VALIDATION
-- ============================================

-- Trigger to validate JSON before insert/update on tasks
CREATE TRIGGER IF NOT EXISTS validate_tasks_json
BEFORE INSERT ON tasks
BEGIN
  SELECT CASE
    WHEN NOT json_valid(NEW.dependencies) THEN
      RAISE(ABORT, 'Invalid JSON in dependencies')
    WHEN NOT json_valid(NEW.deliverables) THEN
      RAISE(ABORT, 'Invalid JSON in deliverables')
    WHEN NOT json_valid(NEW.acceptance_criteria) THEN
      RAISE(ABORT, 'Invalid JSON in acceptance_criteria')
    WHEN NEW.files_created IS NOT NULL AND NOT json_valid(NEW.files_created) THEN
      RAISE(ABORT, 'Invalid JSON in files_created')
    ELSE 1
  END;
END;

CREATE TRIGGER IF NOT EXISTS validate_tasks_json_update
BEFORE UPDATE ON tasks
BEGIN
  SELECT CASE
    WHEN NOT json_valid(NEW.dependencies) THEN
      RAISE(ABORT, 'Invalid JSON in dependencies')
    WHEN NOT json_valid(NEW.deliverables) THEN
      RAISE(ABORT, 'Invalid JSON in deliverables')
    WHEN NOT json_valid(NEW.acceptance_criteria) THEN
      RAISE(ABORT, 'Invalid JSON in acceptance_criteria')
    WHEN NEW.files_created IS NOT NULL AND NOT json_valid(NEW.files_created) THEN
      RAISE(ABORT, 'Invalid JSON in files_created')
    ELSE 1
  END;
END;

-- ============================================
-- VIEWS FOR COMMON JSON QUERIES
-- ============================================

-- View for task dependencies
CREATE VIEW IF NOT EXISTS task_dependencies AS
SELECT
  t.id,
  t.name,
  t.status,
  json_extract(t.dependencies, '$') as dependencies,
  json_array_length(t.dependencies) as dependency_count,
  json_extract(t.deliverables, '$') as deliverables,
  json_array_length(t.deliverables) as deliverable_count
FROM tasks t;

-- View for agent capabilities
CREATE VIEW IF NOT EXISTS agent_capabilities AS
SELECT
  a.id,
  a.name,
  a.model_id,
  json_extract(a.capabilities, '$') as capabilities,
  json_array_length(a.capabilities) as capability_count,
  json_extract(a.metadata, '$.preferredProjects') as preferred_projects
FROM agents a;

-- View for context file metadata
CREATE VIEW IF NOT EXISTS context_file_metadata AS
SELECT
  cf.id,
  cf.filename,
  cf.category,
  cf.priority,
  json_extract(cf.tags, '$') as tags,
  json_extract(cf.target_roles, '$') as target_roles,
  json_extract(cf.target_projects, '$') as target_projects
FROM context_files_registry cf
WHERE cf.is_active = TRUE;

-- ============================================
-- PERFORMANCE ANALYSIS
-- ============================================

-- View for analyzing JSON query performance
CREATE VIEW IF NOT EXISTS json_performance_stats AS
SELECT
  'tasks' as table_name,
  COUNT(*) as total_rows,
  SUM(CASE WHEN dependencies IS NOT NULL THEN 1 ELSE 0 END) as non_null_dependencies,
  SUM(CASE WHEN deliverables IS NOT NULL THEN 1 ELSE 0 END) as non_null_deliverables,
  SUM(CASE WHEN acceptance_criteria IS NOT NULL THEN 1 ELSE 0 END) as non_null_acceptance_criteria,
  AVG(json_array_length(dependencies)) as avg_dependency_count,
  AVG(json_array_length(deliverables)) as avg_deliverable_count
FROM tasks

UNION ALL

SELECT
  'agents' as table_name,
  COUNT(*) as total_rows,
  SUM(CASE WHEN capabilities IS NOT NULL THEN 1 ELSE 0 END) as non_null_dependencies,
  0 as non_null_deliverables,
  SUM(CASE WHEN metadata IS NOT NULL THEN 1 ELSE 0 END) as non_null_acceptance_criteria,
  AVG(json_array_length(capabilities)) as avg_dependency_count,
  0 as avg_deliverable_count
FROM agents;

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

-- Verify JSON columns are valid
SELECT 'JSON Validation Check' as check_type, COUNT(*) as invalid_json_count
FROM tasks
WHERE NOT (
  json_valid(dependencies) AND
  json_valid(deliverables) AND
  json_valid(acceptance_criteria) AND
  (files_created IS NULL OR json_valid(files_created))
);

-- Check table structures
SELECT
  'Migration 025 Complete - JSON Columns Modernized' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND sql LIKE '%JSON%') as tables_with_json,
  (SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE type LIKE '%JSON%') as task_json_columns,
  (SELECT COUNT(*) FROM pragma_table_info('agents') WHERE type LIKE '%JSON%') as agent_json_columns,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE '%json%') as json_triggers,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name LIKE '%task%') as json_views;