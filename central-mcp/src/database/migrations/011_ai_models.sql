-- ═══════════════════════════════════════════════════════════════════
-- 011: AI MODELS & SUBSCRIPTIONS - THE AI BRAIN INFRASTRUCTURE
-- ═══════════════════════════════════════════════════════════════════
-- Created: 2025-10-11
-- Purpose: Track AI models, subscriptions, usage, and costs
--
-- Systems Using This:
-- - ModelRegistry: Model definitions, availability tracking
-- - LLMOrchestrator: Request routing, usage tracking
-- - All loops: AI-powered decision making
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- AI MODELS - Available AI model definitions
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_models (
  -- Identity
  id TEXT PRIMARY KEY,                   -- e.g., 'claude-sonnet-4-5-200k'
  provider TEXT NOT NULL,                -- 'anthropic', 'openai', 'google', 'z.ai'
  model_id TEXT NOT NULL,                -- Provider's model ID
  display_name TEXT NOT NULL,

  -- Tier & Availability
  tier TEXT NOT NULL,                    -- 'free', 'pro', 'team', 'enterprise'
  available BOOLEAN DEFAULT 0,

  -- Capabilities
  context_window INTEGER,                -- Max tokens
  max_output_tokens INTEGER,
  supports_streaming BOOLEAN DEFAULT 0,
  supports_function_calling BOOLEAN DEFAULT 0,
  supports_vision BOOLEAN DEFAULT 0,

  -- Performance
  cost_per_1m_input_tokens REAL,         -- USD per 1M tokens
  cost_per_1m_output_tokens REAL,
  tokens_per_second INTEGER,             -- Average speed

  -- Rate Limits
  requests_per_minute INTEGER,
  tokens_per_minute INTEGER,
  requests_per_day INTEGER,

  -- Specializations (JSON array)
  best_for TEXT,                         -- JSON: ['spec-generation', 'reasoning', etc.]

  -- Health
  last_health_check TEXT,
  health_status TEXT DEFAULT 'unknown',  -- 'healthy', 'degraded', 'down'

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_tier ON ai_models(tier);
CREATE INDEX IF NOT EXISTS idx_ai_models_available ON ai_models(available);
CREATE INDEX IF NOT EXISTS idx_ai_models_health ON ai_models(health_status);

-- ───────────────────────────────────────────────────────────────────
-- AI SUBSCRIPTIONS - Account subscriptions and API keys
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_subscriptions (
  -- Identity
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,                -- 'anthropic', 'openai', 'google', 'z.ai'
  account_tier TEXT NOT NULL,            -- 'free', 'pro', 'team', 'enterprise'

  -- API Key (should be encrypted in production!)
  api_key TEXT NOT NULL,

  -- Budget & Spending
  monthly_budget REAL,                   -- USD
  current_spend REAL DEFAULT 0,
  current_month TEXT,                    -- 'YYYY-MM' for tracking

  -- Usage Tracking
  requests_this_month INTEGER DEFAULT 0,
  tokens_this_month INTEGER DEFAULT 0,

  -- Status
  active BOOLEAN DEFAULT 1,
  expires_at TEXT,                       -- When subscription expires

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_subscriptions_provider ON ai_subscriptions(provider);
CREATE INDEX IF NOT EXISTS idx_ai_subscriptions_active ON ai_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_ai_subscriptions_tier ON ai_subscriptions(account_tier);

-- ───────────────────────────────────────────────────────────────────
-- AI MODEL USAGE - Every LLM request tracked
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_model_usage (
  -- Identity
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  model_id TEXT NOT NULL,

  -- Request Details
  purpose TEXT NOT NULL,                 -- 'spec-generation', 'task-breakdown', etc.

  -- Token Usage
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,

  -- Cost
  cost REAL,                             -- USD for this request

  -- Performance
  latency_ms INTEGER,

  -- Result
  success BOOLEAN,
  error TEXT,

  -- Metadata
  timestamp TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (subscription_id) REFERENCES ai_subscriptions(id),
  FOREIGN KEY (model_id) REFERENCES ai_models(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_subscription ON ai_model_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_model_usage(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_purpose ON ai_model_usage(purpose);
CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_model_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_success ON ai_model_usage(success);

-- ───────────────────────────────────────────────────────────────────
-- AI MODEL SELECTIONS - Track which models were selected and why
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_model_selections (
  -- Identity
  id TEXT PRIMARY KEY,

  -- Request Context
  purpose TEXT NOT NULL,
  context_size INTEGER,
  requires_vision BOOLEAN DEFAULT 0,
  requires_function_calling BOOLEAN DEFAULT 0,
  max_cost REAL,
  preferred_provider TEXT,

  -- Selection Result
  selected_model_id TEXT NOT NULL,
  reasoning TEXT NOT NULL,              -- Why this model was chosen
  fallback_models TEXT,                 -- JSON array of fallback options

  -- Metadata
  timestamp TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (selected_model_id) REFERENCES ai_models(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_selections_purpose ON ai_model_selections(purpose);
CREATE INDEX IF NOT EXISTS idx_ai_selections_model ON ai_model_selections(selected_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_selections_timestamp ON ai_model_selections(timestamp);

-- ───────────────────────────────────────────────────────────────────
-- AI MONTHLY SPENDING - Track spending by month for budgeting
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_monthly_spending (
  -- Identity
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  year_month TEXT NOT NULL,             -- 'YYYY-MM'

  -- Aggregated Stats
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0,

  -- By Purpose
  purpose_breakdown TEXT,               -- JSON: { 'spec-generation': 123.45, ... }

  -- Budget Status
  monthly_budget REAL,
  budget_remaining REAL,
  over_budget BOOLEAN DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (subscription_id) REFERENCES ai_subscriptions(id),
  UNIQUE(subscription_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_subscription ON ai_monthly_spending(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ai_monthly_year_month ON ai_monthly_spending(year_month);
CREATE INDEX IF NOT EXISTS idx_ai_monthly_over_budget ON ai_monthly_spending(over_budget);

-- ═══════════════════════════════════════════════════════════════════
-- VIEWS - Useful queries for AI intelligence
-- ═══════════════════════════════════════════════════════════════════

-- Available Models by Provider
CREATE VIEW IF NOT EXISTS v_available_models AS
SELECT
  provider,
  COUNT(*) as total_models,
  SUM(CASE WHEN available = 1 THEN 1 ELSE 0 END) as available_models,
  GROUP_CONCAT(CASE WHEN available = 1 THEN display_name END, ', ') as model_names
FROM ai_models
GROUP BY provider;

-- Current Month Spending
CREATE VIEW IF NOT EXISTS v_current_spending AS
SELECT
  s.provider,
  s.account_tier,
  s.monthly_budget,
  s.current_spend,
  s.monthly_budget - s.current_spend as remaining_budget,
  ROUND((s.current_spend / s.monthly_budget) * 100, 2) as budget_used_percent,
  s.requests_this_month,
  s.tokens_this_month
FROM ai_subscriptions s
WHERE s.active = 1;

-- Model Usage Summary (Last 24 Hours)
CREATE VIEW IF NOT EXISTS v_recent_model_usage AS
SELECT
  m.display_name,
  COUNT(*) as request_count,
  SUM(u.total_tokens) as total_tokens,
  SUM(u.cost) as total_cost,
  AVG(u.latency_ms) as avg_latency_ms,
  SUM(CASE WHEN u.success = 1 THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN u.success = 0 THEN 1 ELSE 0 END) as failed,
  ROUND(
    CAST(SUM(CASE WHEN u.success = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100,
    2
  ) as success_rate_percent
FROM ai_model_usage u
JOIN ai_models m ON u.model_id = m.id
WHERE u.timestamp > datetime('now', '-1 day')
GROUP BY m.id
ORDER BY request_count DESC;

-- Usage by Purpose (Last 7 Days)
CREATE VIEW IF NOT EXISTS v_usage_by_purpose AS
SELECT
  purpose,
  COUNT(*) as request_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(latency_ms) as avg_latency_ms
FROM ai_model_usage
WHERE timestamp > datetime('now', '-7 days')
GROUP BY purpose
ORDER BY total_cost DESC;

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS - Auto-update spending on usage insert
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER IF NOT EXISTS update_subscription_spending
AFTER INSERT ON ai_model_usage
BEGIN
  -- Update subscription current spend
  UPDATE ai_subscriptions
  SET
    current_spend = current_spend + NEW.cost,
    requests_this_month = requests_this_month + 1,
    tokens_this_month = tokens_this_month + NEW.total_tokens,
    updated_at = datetime('now')
  WHERE id = NEW.subscription_id;

  -- Update monthly spending record (or create if doesn't exist)
  INSERT OR REPLACE INTO ai_monthly_spending (
    id,
    subscription_id,
    year_month,
    total_requests,
    total_tokens,
    total_cost,
    monthly_budget,
    budget_remaining,
    over_budget,
    updated_at
  )
  SELECT
    COALESCE(
      (SELECT id FROM ai_monthly_spending WHERE subscription_id = NEW.subscription_id AND year_month = strftime('%Y-%m', 'now')),
      (hex(randomblob(16)))
    ),
    NEW.subscription_id,
    strftime('%Y-%m', 'now'),
    COALESCE((SELECT total_requests FROM ai_monthly_spending WHERE subscription_id = NEW.subscription_id AND year_month = strftime('%Y-%m', 'now')), 0) + 1,
    COALESCE((SELECT total_tokens FROM ai_monthly_spending WHERE subscription_id = NEW.subscription_id AND year_month = strftime('%Y-%m', 'now')), 0) + NEW.total_tokens,
    COALESCE((SELECT total_cost FROM ai_monthly_spending WHERE subscription_id = NEW.subscription_id AND year_month = strftime('%Y-%m', 'now')), 0) + NEW.cost,
    (SELECT monthly_budget FROM ai_subscriptions WHERE id = NEW.subscription_id),
    (SELECT monthly_budget FROM ai_subscriptions WHERE id = NEW.subscription_id) - (COALESCE((SELECT total_cost FROM ai_monthly_spending WHERE subscription_id = NEW.subscription_id AND year_month = strftime('%Y-%m', 'now')), 0) + NEW.cost),
    CASE
      WHEN (COALESCE((SELECT total_cost FROM ai_monthly_spending WHERE subscription_id = NEW.subscription_id AND year_month = strftime('%Y-%m', 'now')), 0) + NEW.cost) > (SELECT monthly_budget FROM ai_subscriptions WHERE id = NEW.subscription_id)
      THEN 1
      ELSE 0
    END,
    datetime('now');
END;

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════
-- Tables: 5 (models, subscriptions, usage, selections, monthly_spending)
-- Indexes: 15+
-- Views: 4 (available models, spending, recent usage, purpose breakdown)
-- Triggers: 1 (auto-update spending)
-- ═══════════════════════════════════════════════════════════════════
