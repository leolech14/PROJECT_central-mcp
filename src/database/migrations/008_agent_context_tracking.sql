-- Migration 008: Agent Context Window Tracking
-- Purpose: Track what agents have in their context window for intelligent coordination
-- Date: 2025-10-09

-- ============================================
-- AGENT CONTEXT REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS agent_context_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  report_timestamp TEXT NOT NULL DEFAULT (datetime('now')),

  -- Context window state
  total_tokens INTEGER NOT NULL,
  available_tokens INTEGER NOT NULL,
  percent_full REAL,

  -- Loaded content (JSON)
  loaded_projects TEXT NOT NULL,     -- [{projectId, filesLoaded, sizeInTokens}]
  loaded_tasks TEXT NOT NULL,        -- [{taskId, relevantFiles, tokensUsed}]
  loaded_documents TEXT,             -- [{type, path, sizeInTokens}]

  -- Capabilities (JSON)
  capabilities TEXT NOT NULL,        -- {canStartImmediately: [taskIds]}

  -- Memory state
  conversation_length INTEGER,
  oldest_message_timestamp TEXT,

  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_context_agent ON agent_context_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_context_timestamp ON agent_context_reports(report_timestamp DESC);

-- View: Latest context report per agent
CREATE VIEW IF NOT EXISTS latest_agent_context AS
SELECT acr.*
FROM agent_context_reports acr
INNER JOIN (
  SELECT agent_id, MAX(report_timestamp) as max_timestamp
  FROM agent_context_reports
  GROUP BY agent_id
) latest ON acr.agent_id = latest.agent_id AND acr.report_timestamp = latest.max_timestamp;

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT
  'Migration 008 Complete - Agent Context Tracking' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='agent_context_reports') as table_created,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name='latest_agent_context') as view_created;
