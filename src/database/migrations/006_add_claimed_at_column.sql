-- Migration 006: Add claimed_at column to tasks table
-- Purpose: Fix health check error - track when tasks were claimed
-- Date: 2025-10-08

-- ============================================
-- ADD CLAIMED_AT COLUMN
-- ============================================

-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
-- So we check if column exists first via application logic

-- For now, just try to add it (will error if exists, that's ok)
ALTER TABLE tasks ADD COLUMN claimed_at TEXT;

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT
  'Migration 006 Complete - claimed_at column added' as status,
  (SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name='claimed_at') as column_exists;
