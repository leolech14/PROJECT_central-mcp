-- Migration 003: Projects Table for Multi-Project Support
-- Purpose: Enable Universal Central Intelligence across all projects
-- Date: 2025-10-08

-- ============================================
-- PROJECTS TABLE (Multi-Project Registry)
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  git_remote TEXT UNIQUE,
  type TEXT NOT NULL CHECK(type IN (
    'COMMERCIAL_APP', 'KNOWLEDGE_SYSTEM', 'TOOL',
    'INFRASTRUCTURE', 'EXPERIMENTAL', 'UNKNOWN'
  )),
  vision TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity TEXT NOT NULL DEFAULT (datetime('now')),
  discovered_by TEXT NOT NULL CHECK(discovered_by IN ('auto', 'manual')),
  metadata TEXT -- JSON: { hasClaudeMd, technologies, etc. }
);

CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_activity ON projects(last_activity);
CREATE INDEX IF NOT EXISTS idx_projects_git_remote ON projects(git_remote);

-- ============================================
-- UPDATE TASKS TABLE (Add project_id)
-- ============================================

-- Add project_id column to tasks (if not exists)
ALTER TABLE tasks ADD COLUMN project_id TEXT DEFAULT 'localbrain';

-- Create index for project-scoped queries
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

-- Add foreign key constraint (requires recreate in SQLite)
-- For now, we'll enforce via application logic

-- ============================================
-- UPDATE AGENT SESSIONS (Add project_id)
-- ============================================

-- project_id already exists in agent_sessions (from migration 002)
-- Just verify index exists
CREATE INDEX IF NOT EXISTS idx_sessions_project_agent ON agent_sessions(project_id, agent_letter);

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT
  'Migration 003 Complete - Projects Table Created' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='projects') as projects_table_created,
  (SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name='project_id') as tasks_project_column_added;
