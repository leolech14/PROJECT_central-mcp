-- Migration 007: Cost Tracking and Model Management
-- Purpose: Track agent costs and enforce budget/usage limits
-- Date: 2025-10-09

-- ============================================
-- MODEL CATALOG (Available Models)
-- ============================================

CREATE TABLE IF NOT EXISTS model_catalog (
  model_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  context_size INTEGER NOT NULL,
  capabilities TEXT NOT NULL,  -- JSON array
  strengths TEXT NOT NULL,     -- JSON array
  cost_per_1m_tokens REAL NOT NULL,
  cost_per_hour REAL NOT NULL,
  cost_per_task REAL NOT NULL,
  monthly_subscription REAL NOT NULL,
  speed_score INTEGER CHECK(speed_score BETWEEN 1 AND 10),
  quality_score INTEGER CHECK(quality_score BETWEEN 1 AND 10),
  ultrathink_available INTEGER DEFAULT 0,
  claude_md_support TEXT CHECK(claude_md_support IN ('full', 'partial', 'none')),
  daily_hour_limit INTEGER,   -- NULL = unlimited
  weekly_hour_limit INTEGER,  -- NULL = unlimited
  priority INTEGER DEFAULT 50, -- Higher = prefer this model
  active INTEGER DEFAULT 1
);

-- Insert model definitions
INSERT INTO model_catalog (
  model_id, name, provider, context_size, capabilities, strengths,
  cost_per_1m_tokens, cost_per_hour, cost_per_task, monthly_subscription,
  speed_score, quality_score, ultrathink_available, claude_md_support,
  daily_hour_limit, weekly_hour_limit, priority, active
) VALUES
  -- GLM-4.6: PRIMARY BUILDERS (MOST COST-EFFECTIVE!) ⭐
  ('glm-4.6', 'GLM-4.6', 'z.ai', 200000,
   '["UI","BACKEND","CODE"]',
   '["Fast execution","Cost effective","High volume","Implementation"]',
   0.5, 2.0, 1.0, 15.0,
   9, 7, 0, 'partial',
   NULL, NULL, 100, 1),

  -- Claude Sonnet 4.5 200K: QUALITY BUILDERS
  ('claude-sonnet-4-5-200k', 'Claude Sonnet 4.5 (200K)', 'Anthropic', 200000,
   '["UI","BACKEND","DESIGN","INTEGRATION","QUALITY"]',
   '["ULTRATHINK","Quality output","Design expertise","Integration"]',
   15.0, 40.0, 10.0, 200.0,
   8, 10, 1, 'full',
   5, 35, 50, 1),

  -- Claude Sonnet 4.5 1M: SUPERVISOR (USE SPARINGLY!)
  ('claude-sonnet-4-5-1m', 'Claude Sonnet 4.5 (1M)', 'Anthropic', 1000000,
   '["ARCHITECTURE","PLANNING","SUPERVISION","ULTRATHINK","ALL"]',
   '["1M context","Strategic thinking","Master builder","Complete codebase awareness"]',
   15.0, 40.0, 30.0, 200.0,
   8, 10, 1, 'full',
   5, 35, 10, 1),

  -- Gemini 2.5 Pro: RESEARCH
  ('gemini-2-pro', 'Gemini 2.5 Pro', 'Google', 1000000,
   '["RESEARCH","MULTIMODAL","KNOWLEDGE","ANALYSIS"]',
   '["1M context","Multimodal","Research","Knowledge management"]',
   10.0, 20.0, 8.0, 100.0,
   7, 9, 0, 'none',
   NULL, NULL, 30, 1),

  -- ChatGPT: FUTURE (not accessible yet)
  ('gpt-4-turbo', 'GPT-4 Turbo', 'OpenAI', 128000,
   '["CREATIVE","GENERAL","UI"]',
   '["Creative writing","General purpose"]',
   20.0, 50.0, 20.0, 200.0,
   6, 9, 0, 'none',
   NULL, NULL, 20, 0);

-- ============================================
-- AGENT USAGE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS agent_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  date DATE NOT NULL,
  hours_used REAL DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  estimated_cost REAL DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES model_catalog(model_id),
  UNIQUE(agent_id, model_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_agent_date ON agent_usage(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_date ON agent_usage(date);

-- ============================================
-- TASK COST ESTIMATES
-- ============================================

CREATE TABLE IF NOT EXISTS task_costs (
  task_id TEXT PRIMARY KEY,
  estimated_cost_glm REAL,      -- Cost if done by GLM-4.6
  estimated_cost_sonnet_200k REAL,  -- Cost if done by Sonnet 200K
  estimated_cost_sonnet_1m REAL,    -- Cost if done by Sonnet 1M
  recommended_model TEXT,       -- Cost-optimized recommendation
  actual_cost REAL,            -- Actual cost after completion
  completed_by_model TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ============================================
-- BUDGET ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS budget_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL CHECK(alert_type IN (
    'DAILY_LIMIT_WARNING', 'DAILY_LIMIT_EXCEEDED',
    'WEEKLY_LIMIT_WARNING', 'WEEKLY_LIMIT_EXCEEDED',
    'EXPENSIVE_TASK_WARNING', 'BUDGET_EXCEEDED'
  )),
  agent_id TEXT,
  model_id TEXT,
  threshold_value REAL,
  current_value REAL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged INTEGER DEFAULT 0,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES model_catalog(model_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_agent ON budget_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON budget_alerts(acknowledged);

-- ============================================
-- INITIALIZE USAGE TRACKING FOR TODAY
-- ============================================

INSERT OR IGNORE INTO agent_usage (agent_id, model_id, date, hours_used, tasks_completed, estimated_cost)
SELECT
  a.id,
  a.model_id,
  DATE('now'),
  0,
  0,
  0.0
FROM agents a
WHERE EXISTS (SELECT 1 FROM model_catalog WHERE model_id = a.model_id);

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT
  'Migration 007 Complete - Cost Tracking System' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN (
    'model_catalog', 'agent_usage', 'task_costs', 'budget_alerts'
  )) as tables_created,
  (SELECT COUNT(*) FROM model_catalog) as models_loaded;
