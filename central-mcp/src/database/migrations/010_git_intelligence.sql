-- ═══════════════════════════════════════════════════════════════════
-- 010: GIT INTELLIGENCE - TRACKING COMMITS, PUSHES, VERSIONS
-- ═══════════════════════════════════════════════════════════════════
-- Created: 2025-10-11
-- Purpose: Enable git-based intelligence, semantic versioning, deployment tracking
--
-- Systems Using This:
-- - GitIntelligenceEngine: Conventional commits, semantic versioning
-- - GitPushMonitor: Push detection, deployment triggers
-- - AutoDeployer: Deployment pipeline tracking
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- GIT COMMITS - All commits with conventional commit parsing
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS git_commits (
  -- Identity
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  short_hash TEXT NOT NULL,

  -- Conventional Commit Parsing
  type TEXT,                              -- feat, fix, chore, etc.
  scope TEXT,                             -- component/area affected
  description TEXT NOT NULL,
  body TEXT,

  -- Breaking Changes
  is_breaking_change BOOLEAN DEFAULT 0,
  breaking_change_description TEXT,

  -- Task Tracking
  task_ids TEXT,                          -- JSON array of linked task IDs
  closes_issues TEXT,                     -- JSON array of closed issue IDs

  -- Progress Tracking
  progress_percentage INTEGER,            -- Extracted from commit message

  -- Metadata
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  branch TEXT,

  -- Version Impact
  version_bump TEXT,                      -- 'major', 'minor', 'patch', 'none'

  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_git_commits_hash ON git_commits(hash);
CREATE INDEX IF NOT EXISTS idx_git_commits_type ON git_commits(type);
CREATE INDEX IF NOT EXISTS idx_git_commits_timestamp ON git_commits(timestamp);
CREATE INDEX IF NOT EXISTS idx_git_commits_branch ON git_commits(branch);

-- ───────────────────────────────────────────────────────────────────
-- GIT PUSHES - Push events that trigger deployments
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS git_pushes (
  -- Identity
  id TEXT PRIMARY KEY,

  -- Push Details
  branch TEXT NOT NULL,
  remote TEXT NOT NULL DEFAULT 'origin',
  commit_hash TEXT NOT NULL,

  -- Commits in Push
  commit_count INTEGER DEFAULT 0,
  commit_hashes TEXT,                     -- JSON array of commit hashes

  -- Versioning
  previous_version TEXT,
  new_version TEXT,
  version_bump TEXT,                      -- 'major', 'minor', 'patch'

  -- Changelog
  changelog TEXT,                         -- Generated changelog for this push

  -- Deployment Status
  deployment_triggered BOOLEAN DEFAULT 0,
  deployment_id TEXT,                     -- FK to deployments table

  -- Metadata
  pushed_at TEXT NOT NULL,
  detected_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (deployment_id) REFERENCES deployments(id)
);

CREATE INDEX IF NOT EXISTS idx_git_pushes_branch ON git_pushes(branch);
CREATE INDEX IF NOT EXISTS idx_git_pushes_pushed_at ON git_pushes(pushed_at);
CREATE INDEX IF NOT EXISTS idx_git_pushes_deployment ON git_pushes(deployment_id);

-- ───────────────────────────────────────────────────────────────────
-- SEMANTIC VERSIONS - Version history with semantic versioning
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS semantic_versions (
  -- Identity
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,          -- e.g., "1.2.3"

  -- Version Components
  major INTEGER NOT NULL,
  minor INTEGER NOT NULL,
  patch INTEGER NOT NULL,
  prerelease TEXT,                       -- e.g., "alpha.1"
  build TEXT,                            -- e.g., "20250101"

  -- Git Reference
  commit_hash TEXT NOT NULL,
  branch TEXT NOT NULL,
  tag TEXT,                              -- Git tag name

  -- What Changed
  breaking_changes INTEGER DEFAULT 0,
  features INTEGER DEFAULT 0,
  fixes INTEGER DEFAULT 0,
  chores INTEGER DEFAULT 0,

  -- Changelog
  changelog TEXT NOT NULL,

  -- Release Status
  is_released BOOLEAN DEFAULT 0,
  released_at TEXT,
  release_notes TEXT,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'central-mcp'
);

CREATE INDEX IF NOT EXISTS idx_versions_version ON semantic_versions(version);
CREATE INDEX IF NOT EXISTS idx_versions_commit ON semantic_versions(commit_hash);
CREATE INDEX IF NOT EXISTS idx_versions_created ON semantic_versions(created_at);

-- ───────────────────────────────────────────────────────────────────
-- DEPLOYMENTS - Deployment pipeline execution tracking
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deployments (
  -- Identity
  id TEXT PRIMARY KEY,

  -- What's Being Deployed
  commit_hash TEXT NOT NULL,
  branch TEXT NOT NULL,
  version TEXT,

  -- Environment
  environment TEXT NOT NULL,             -- 'dev', 'staging', 'production'
  target_url TEXT,                       -- Where it's deployed

  -- Pipeline Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, building, testing, deploying, completed, failed, rolled_back

  -- Pipeline Phases
  build_started_at TEXT,
  build_completed_at TEXT,
  build_success BOOLEAN,
  build_output TEXT,

  test_started_at TEXT,
  test_completed_at TEXT,
  test_success BOOLEAN,
  test_output TEXT,

  deploy_started_at TEXT,
  deploy_completed_at TEXT,
  deploy_success BOOLEAN,
  deploy_output TEXT,

  health_check_at TEXT,
  health_check_success BOOLEAN,
  health_check_output TEXT,

  -- Rollback
  rollback_triggered BOOLEAN DEFAULT 0,
  rollback_reason TEXT,
  rollback_at TEXT,
  previous_deployment_id TEXT,           -- What we rolled back to

  -- Performance
  total_duration_ms INTEGER,
  build_duration_ms INTEGER,
  test_duration_ms INTEGER,
  deploy_duration_ms INTEGER,

  -- Metadata
  triggered_by TEXT DEFAULT 'git_push',  -- 'git_push', 'manual', 'scheduled'
  triggered_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_deployments_commit ON deployments(commit_hash);
CREATE INDEX IF NOT EXISTS idx_deployments_environment ON deployments(environment);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_triggered ON deployments(triggered_at);

-- ───────────────────────────────────────────────────────────────────
-- DEPLOYMENT LOGS - Detailed logs for debugging
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deployment_logs (
  -- Identity
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL,

  -- Log Entry
  phase TEXT NOT NULL,                   -- 'build', 'test', 'deploy', 'health_check', 'rollback'
  level TEXT NOT NULL DEFAULT 'info',    -- 'debug', 'info', 'warn', 'error'
  message TEXT NOT NULL,
  details TEXT,                          -- JSON additional details

  -- Timing
  timestamp TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment ON deployment_logs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_phase ON deployment_logs(phase);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_level ON deployment_logs(level);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_timestamp ON deployment_logs(timestamp);

-- ───────────────────────────────────────────────────────────────────
-- BRANCH INTELLIGENCE - Track branch activity and staleness
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS git_branches (
  -- Identity
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,

  -- Branch Type
  type TEXT,                             -- 'feature', 'hotfix', 'release', 'main', 'develop'

  -- Activity
  commit_count INTEGER DEFAULT 0,
  last_commit_hash TEXT,
  last_commit_at TEXT,

  -- Task Association
  task_ids TEXT,                         -- JSON array of task IDs

  -- Status
  is_stale BOOLEAN DEFAULT 0,
  is_merged BOOLEAN DEFAULT 0,
  merged_at TEXT,
  merged_into TEXT,                      -- Target branch

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_git_branches_name ON git_branches(name);
CREATE INDEX IF NOT EXISTS idx_git_branches_type ON git_branches(type);
CREATE INDEX IF NOT EXISTS idx_git_branches_is_stale ON git_branches(is_stale);
CREATE INDEX IF NOT EXISTS idx_git_branches_last_commit ON git_branches(last_commit_at);

-- ═══════════════════════════════════════════════════════════════════
-- VIEWS - Useful queries for Git intelligence
-- ═══════════════════════════════════════════════════════════════════

-- Recent Commits by Type
CREATE VIEW IF NOT EXISTS v_recent_commits_by_type AS
SELECT
  type,
  COUNT(*) as count,
  MAX(timestamp) as latest_commit
FROM git_commits
WHERE timestamp > datetime('now', '-7 days')
GROUP BY type
ORDER BY count DESC;

-- Deployment Success Rate
CREATE VIEW IF NOT EXISTS v_deployment_success_rate AS
SELECT
  environment,
  COUNT(*) as total_deployments,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN rollback_triggered = 1 THEN 1 ELSE 0 END) as rolled_back,
  ROUND(
    CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100,
    2
  ) as success_rate_percent
FROM deployments
GROUP BY environment;

-- Version History
CREATE VIEW IF NOT EXISTS v_version_history AS
SELECT
  version,
  commit_hash,
  breaking_changes + features + fixes + chores as total_changes,
  breaking_changes,
  features,
  fixes,
  is_released,
  released_at,
  created_at
FROM semantic_versions
ORDER BY major DESC, minor DESC, patch DESC;

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════
-- Tables: 7 (commits, pushes, versions, deployments, logs, branches, environment_configs)
-- Indexes: 20+
-- Views: 3
-- ═══════════════════════════════════════════════════════════════════
