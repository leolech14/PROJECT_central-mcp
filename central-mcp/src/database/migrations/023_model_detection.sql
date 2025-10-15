-- Migration 023: Model Detection System
-- ===================================
-- Track model detections and context windows with foolproof accuracy

-- Model detection results
CREATE TABLE IF NOT EXISTS model_detections (
  id TEXT PRIMARY KEY,

  -- Core model information
  detected_model TEXT NOT NULL,              -- e.g., "claude-sonnet-4-20250514"
  provider TEXT NOT NULL,                    -- "anthropic", "z.ai", "local", "openai"
  endpoint TEXT NOT NULL,                    -- Actual API URL being used
  context_window INTEGER NOT NULL,           -- Actual context window size

  -- Configuration source
  config_source TEXT NOT NULL,               -- Which config file was used
  config_path TEXT,                          -- Full path to config file

  -- Detection metadata
  detection_method TEXT NOT NULL,            -- How we detected it
  confidence REAL NOT NULL DEFAULT 0.0,     -- 0.0-1.0 confidence level
  verified BOOLEAN NOT NULL DEFAULT FALSE,   -- Have we verified this works?

  -- Agent mapping
  agent_letter TEXT NOT NULL,                -- A-F mapping based on model
  agent_role TEXT NOT NULL,                  -- Role description

  -- Capabilities (JSON)
  capabilities TEXT,                         -- JSON object with capabilities

  -- Additional metadata (JSON)
  metadata TEXT,                             -- JSON object with additional info

  -- Timestamps
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_detections_timestamp ON model_detections(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_model_detections_model ON model_detections(detected_model);
CREATE INDEX IF NOT EXISTS idx_model_detections_provider ON model_detections(provider);
CREATE INDEX IF NOT EXISTS idx_model_detections_agent ON model_detections(agent_letter);

-- Context window verification tests
CREATE TABLE IF NOT EXISTS context_window_tests (
  id TEXT PRIMARY KEY,

  -- Test parameters
  model TEXT NOT NULL,
  requested_context_window INTEGER NOT NULL,

  -- Test results
  supported BOOLEAN NOT NULL DEFAULT FALSE,
  actual_limit INTEGER,                      -- If determined

  -- Test metadata
  test_method TEXT NOT NULL,                -- How we tested it
  confidence REAL NOT NULL DEFAULT 0.0,     -- Test confidence
  notes TEXT,                               -- JSON array of notes

  -- Timestamps
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Model registry (known models and their properties)
CREATE TABLE IF NOT EXISTS model_registry (
  id TEXT PRIMARY KEY,

  -- Model identification
  model_name TEXT UNIQUE NOT NULL,           -- e.g., "claude-sonnet-4-20250514"
  display_name TEXT NOT NULL,               -- e.g., "Claude Sonnet 4 (1M Context)"
  provider TEXT NOT NULL,                   -- "anthropic", "zhipu", "meta"

  -- Capabilities
  default_context_window INTEGER NOT NULL,
  max_context_window INTEGER,

  -- Agent mapping
  preferred_agent_letter TEXT,              -- A-F

  -- Capabilities (JSON)
  capabilities TEXT,                        -- JSON object with capabilities

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  documentation_url TEXT,
  release_date TEXT,

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert known models into registry
INSERT OR IGNORE INTO model_registry (
  id, model_name, display_name, provider, default_context_window, max_context_window,
  preferred_agent_letter, capabilities, is_verified
) VALUES
  ('claude-sonnet-4-20250514', 'claude-sonnet-4-20250514', 'Claude Sonnet 4 (1M Context)', 'anthropic', 1000000, 1000000, 'B',
   '{"reasoning": "advanced", "coding": "expert", "context": "1M", "multimodal": true, "toolUse": true}', true),

  ('claude-sonnet-4-5-20250929', 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5 (200K Context)', 'anthropic', 200000, 200000, 'B',
   '{"reasoning": "advanced", "coding": "expert", "context": "200K", "multimodal": true, "toolUse": true}', true),

  ('glm-4.6', 'glm-4.6', 'GLM-4.6 (128K Context)', 'zhipu', 128000, 128000, 'A',
   '{"reasoning": "advanced", "coding": "advanced", "context": "128K", "multimodal": true, "toolUse": true}', true),

  ('claude-opus-4-1-20250805', 'claude-opus-4-1-20250805', 'Claude Opus 4.1 (200K Context)', 'anthropic', 200000, 200000, 'F',
   '{"reasoning": "expert", "coding": "advanced", "context": "200K", "multimodal": true, "toolUse": true}', true),

  ('llama-3.1-70b', 'llama-3.1-70b', 'Llama 3.1 70B (128K Context)', 'meta', 128000, 128000, 'C',
   '{"reasoning": "advanced", "coding": "advanced", "context": "128K", "multimodal": false, "toolUse": true}', false);

-- Agent capability mappings (for reference)
CREATE TABLE IF NOT EXISTS agent_capability_mappings (
  id TEXT PRIMARY KEY,
  agent_letter TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  preferred_models TEXT,                     -- JSON array of preferred models
  capabilities TEXT,                        -- JSON array of capabilities
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert agent mappings
INSERT OR IGNORE INTO agent_capability_mappings (
  id, agent_letter, agent_role, preferred_models, capabilities
) VALUES
  ('agent-a', 'A', 'UI Velocity Specialist',
   '["glm-4.6", "glm-4-flash"]',
   '["ui", "react", "design-systems", "rapid-prototyping"]'),

  ('agent-b', 'B', 'Design & Architecture',
   '["claude-sonnet-4-5", "claude-sonnet-4-20250514"]',
   '["architecture", "design-patterns", "system-design", "documentation"]'),

  ('agent-c', 'C', 'Backend Specialist',
   '["glm-4.6", "deepseek-coder"]',
   '["backend", "databases", "apis", "performance"]'),

  ('agent-d', 'D', 'Integration Specialist',
   '["claude-sonnet-4-5", "claude-sonnet-4-20250514"]',
   '["integration", "coordination", "testing", "deployment"]'),

  ('agent-e', 'E', 'Operations & Supervisor',
   '["gemini-2.5-pro"]',
   '["operations", "monitoring", "optimization", "supervision"]'),

  ('agent-f', 'F', 'Strategic Planning',
   '["claude-opus-4"]',
   '["strategy", "product", "planning", "vision"]');

-- Configuration file tracking
CREATE TABLE IF NOT EXISTS configuration_file_tracking (
  id TEXT PRIMARY KEY,
  file_path TEXT UNIQUE NOT NULL,
  file_hash TEXT NOT NULL,                    -- MD5 hash of file content
  file_size INTEGER NOT NULL,
  last_modified TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  parsed_at TEXT,
  parse_success BOOLEAN,
  parse_error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Update function for model_registry
CREATE TRIGGER IF NOT EXISTS update_model_registry_timestamp
AFTER UPDATE ON model_registry
BEGIN
  UPDATE model_registry SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update function for configuration_file_tracking
CREATE TRIGGER IF NOT EXISTS update_config_tracking_timestamp
AFTER UPDATE ON configuration_file_tracking
BEGIN
  UPDATE configuration_file_tracking SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;