-- Migration 005: Context Files Table
-- Purpose: Store extracted context files for all projects
-- Date: 2025-10-08

-- ============================================
-- CONTEXT FILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS context_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  absolute_path TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'SPEC', 'DOC', 'CODE', 'ARCHITECTURE', 'STATUS', 'CONFIG', 'ASSET', 'UNKNOWN'
  )),
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  indexed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, relative_path),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_context_project ON context_files(project_id);
CREATE INDEX IF NOT EXISTS idx_context_type ON context_files(type);
CREATE INDEX IF NOT EXISTS idx_context_modified ON context_files(modified_at);
CREATE INDEX IF NOT EXISTS idx_context_path ON context_files(project_id, relative_path);

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT
  'Migration 005 Complete - Context Files Table Created' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='context_files') as context_files_table_created;
