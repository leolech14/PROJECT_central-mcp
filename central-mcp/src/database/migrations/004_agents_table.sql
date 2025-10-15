-- Migration 004: Agents Table for Persistent Identity
-- Purpose: Enable agent recognition across sessions and projects
-- Date: 2025-10-08

-- ============================================
-- AGENTS TABLE (Persistent Identity Registry)
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_signature TEXT NOT NULL,
  capabilities TEXT NOT NULL, -- JSON: { ui, backend, design, etc. }
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  total_sessions INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  metadata TEXT -- JSON: { preferredProjects, knownRoles, etc. }
);

CREATE INDEX IF NOT EXISTS idx_agents_tracking ON agents(tracking_id);
CREATE INDEX IF NOT EXISTS idx_agents_signature ON agents(model_signature);
CREATE INDEX IF NOT EXISTS idx_agents_model ON agents(model_id);
CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen);

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT
  'Migration 004 Complete - Agents Table Created' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='agents') as agents_table_created;
