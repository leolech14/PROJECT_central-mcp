-- Migration 009: Conversation Intelligence System
-- Purpose: Capture user messages as primary intelligence source
-- Date: 2025-10-10
-- Priority: P0-CRITICAL (Foundation for auto-proactive intelligence)

-- ============================================
-- CONVERSATION MESSAGES (Primary Intelligence Source)
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  project_id TEXT,
  agent_letter TEXT,

  -- Message classification
  message_type TEXT NOT NULL CHECK(message_type IN (
    'USER_INPUT',
    'AGENT_RESPONSE',
    'SYSTEM_MESSAGE'
  )),

  -- Message content (RAW preservation)
  content TEXT NOT NULL,
  language TEXT, -- 'en', 'pt-BR', etc.

  -- Message characteristics (auto-detected)
  input_method TEXT CHECK(input_method IN (
    'WRITTEN',  -- Typed (CAPITAL LETTERS, concise, precise)
    'SPOKEN',   -- Transcribed (lowercase, verbose, rich context)
    'UNKNOWN'
  )),

  -- Semantic density metrics
  word_count INTEGER,
  character_count INTEGER,
  semantic_density REAL, -- keywords / total_words

  -- Context preservation
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  project_context TEXT, -- Working directory, active files
  conversation_context TEXT, -- Previous 3 messages summary

  -- Metadata
  metadata TEXT, -- JSON: { hasCodeBlocks, hasURLs, hasCommands, hasCapitalLetters, etc. }

  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_project ON conversation_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON conversation_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_type ON conversation_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_input_method ON conversation_messages(input_method);

-- ============================================
-- EXTRACTED INSIGHTS (Intelligence Layer)
-- ============================================

CREATE TABLE IF NOT EXISTS extracted_insights (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  project_id TEXT,

  -- Insight classification
  insight_type TEXT NOT NULL CHECK(insight_type IN (
    'REQUIREMENT',
    'PREFERENCE',
    'CONSTRAINT',
    'VISION',
    'DECISION',
    'PATTERN',
    'PRIORITY',
    'DEPENDENCY',
    'CONTEXT',
    'CORRECTION',
    'METAPHOR'
  )),

  -- Extracted intelligence
  insight_summary TEXT NOT NULL,
  insight_details TEXT,
  confidence REAL DEFAULT 0.0 CHECK(confidence >= 0.0 AND confidence <= 1.0),

  -- Semantic tagging
  tags TEXT, -- JSON array: ["ui", "minimal", "linear"]
  entities TEXT, -- JSON: { technologies: [...], domains: [...] }

  -- Actionability
  is_actionable BOOLEAN DEFAULT 0,
  suggested_actions TEXT, -- JSON array of suggested tasks

  -- Timestamps
  extracted_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT, -- Optional expiry

  FOREIGN KEY (message_id) REFERENCES conversation_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_insights_message ON extracted_insights(message_id);
CREATE INDEX IF NOT EXISTS idx_insights_project ON extracted_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON extracted_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_actionable ON extracted_insights(is_actionable);
CREATE INDEX IF NOT EXISTS idx_insights_confidence ON extracted_insights(confidence);

-- ============================================
-- BEHAVIORAL RULES (Hardcoded Intelligence)
-- ============================================

CREATE TABLE IF NOT EXISTS behavior_rules (
  id TEXT PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  rule_category TEXT NOT NULL CHECK(rule_category IN (
    'PROJECT_PREFERENCE',
    'UI_PATTERN',
    'TECH_CONSTRAINT',
    'LANGUAGE_REQUIREMENT',
    'PRIORITY_GUIDELINE',
    'WORKFLOW_MODIFICATION',
    'AUTO_DECISION'
  )),

  -- Rule definition
  rule_description TEXT NOT NULL,
  rule_condition TEXT NOT NULL, -- JSON: conditions that trigger rule
  rule_action TEXT NOT NULL,    -- JSON: actions to take when triggered

  -- Rule metadata
  confidence REAL DEFAULT 1.0,
  priority INTEGER DEFAULT 50 CHECK(priority >= 1 AND priority <= 100),
  is_active BOOLEAN DEFAULT 1,

  -- Source tracking
  derived_from_messages TEXT,   -- JSON array of message IDs
  derived_from_insights TEXT,   -- JSON array of insight IDs

  -- Performance tracking
  times_applied INTEGER DEFAULT 0,
  last_applied TEXT,
  avg_execution_time_ms REAL DEFAULT 0.0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rules_name ON behavior_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_rules_category ON behavior_rules(rule_category);
CREATE INDEX IF NOT EXISTS idx_rules_active ON behavior_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_rules_priority ON behavior_rules(priority);

-- ============================================
-- WORKFLOW TEMPLATES (Flexible Intelligence)
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  template_category TEXT NOT NULL CHECK(template_category IN (
    'SPECBASE_CONSTRUCTION',
    'UI_PROTOTYPING',
    'IMPLEMENTATION',
    'TESTING',
    'DEPLOYMENT',
    'CUSTOM'
  )),

  -- Workflow definition (LLM-interpretable)
  workflow_description TEXT NOT NULL,
  workflow_phases TEXT NOT NULL,        -- JSON array of phases
  workflow_tasks TEXT NOT NULL,         -- JSON array of task templates

  -- Applicability
  applies_to_projects TEXT,             -- JSON: project filters
  requires_capabilities TEXT,           -- JSON: required agent capabilities

  -- Customization
  is_customizable BOOLEAN DEFAULT 1,
  customization_points TEXT,            -- JSON: customization options

  -- Source tracking
  derived_from_insights TEXT,
  derived_from_rules TEXT,

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used TEXT,
  avg_duration_hours REAL DEFAULT 0.0,
  success_rate REAL DEFAULT 0.0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflow_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflow_templates(template_name);

-- ============================================
-- PROJECT HIERARCHY (Project 0, 1, 2...)
-- ============================================

-- Add project_number to projects table
ALTER TABLE projects ADD COLUMN project_number INTEGER DEFAULT 999;

CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(project_number);

-- Register initial projects (will be updated by auto-discovery)
UPDATE projects SET project_number = 0 WHERE name = 'PROJECT_central-mcp';
UPDATE projects SET project_number = 1 WHERE name = 'LocalBrain';
UPDATE projects SET project_number = 2 WHERE name = 'Orchestra.blue';

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT
  'Migration 009 Complete - Conversation Intelligence System' as status,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='conversation_messages') as conversation_table,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='extracted_insights') as insights_table,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='behavior_rules') as rules_table,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='workflow_templates') as workflows_table;
