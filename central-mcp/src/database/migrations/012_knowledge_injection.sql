-- ============================================================================
-- KNOWLEDGE INJECTION SYSTEM - Automatic Context Provision
-- ============================================================================
-- Purpose: Track and manage automatic knowledge injection for agents
-- Created: 2025-10-12
-- Part of: Central-MCP Context Management Infrastructure
-- ============================================================================

-- Knowledge injection history
CREATE TABLE IF NOT EXISTS knowledge_injections (
    injection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,                      -- Agent identifier (Agent-A, Agent-B, etc.)
    agent_model TEXT,                            -- Model being used (sonnet-4.5, glm-4.6, etc.)
    project_id TEXT,                             -- Project context

    -- Injection context
    injection_trigger TEXT NOT NULL,             -- manual, auto_connect, task_start, error, request
    trigger_details TEXT,                        -- Additional context about trigger

    -- Knowledge provided
    knowledge_types TEXT NOT NULL,               -- JSON array: ["skp", "spec", "tool", "context"]
    knowledge_items TEXT NOT NULL,               -- JSON array of item IDs injected
    total_tokens INTEGER DEFAULT 0,              -- Estimated token count
    total_words INTEGER DEFAULT 0,               -- Total words injected

    -- Delivery
    output_format TEXT DEFAULT 'markdown',       -- markdown, json, text, yaml
    delivery_method TEXT DEFAULT 'cli',          -- cli, api, mcp, file
    output_path TEXT,                            -- Where knowledge was written

    -- Effectiveness tracking
    was_used BOOLEAN DEFAULT FALSE,              -- Did agent use this knowledge?
    usage_confidence REAL DEFAULT 0.0,           -- How confident we are it was used (0-1)
    feedback_rating INTEGER,                     -- Agent rating 1-5
    feedback_notes TEXT,                         -- Agent feedback

    -- Timestamps
    injected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

-- Knowledge injection templates (pre-configured injection profiles)
CREATE TABLE IF NOT EXISTS injection_templates (
    template_id TEXT PRIMARY KEY,                -- e.g. "onboarding_agent_a", "error_recovery", "new_project"
    template_name TEXT NOT NULL,
    description TEXT,

    -- Template configuration
    agent_roles TEXT,                            -- JSON array of applicable roles
    trigger_types TEXT,                          -- JSON array of trigger types

    -- Knowledge to inject
    skp_ids TEXT,                                -- JSON array of SKP IDs to inject
    spec_categories TEXT,                        -- JSON array of spec categories
    tool_categories TEXT,                        -- JSON array of tool categories
    custom_context TEXT,                         -- Additional context to include

    -- Settings
    priority INTEGER DEFAULT 5,                  -- Priority when multiple templates match
    auto_inject BOOLEAN DEFAULT FALSE,           -- Auto-inject without confirmation

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent knowledge state (what does each agent currently know?)
CREATE TABLE IF NOT EXISTS agent_knowledge_state (
    state_id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    session_id TEXT,                             -- Current session identifier

    -- Current knowledge
    known_skps TEXT,                             -- JSON array of SKP IDs
    known_specs TEXT,                            -- JSON array of spec IDs
    known_tools TEXT,                            -- JSON array of tool IDs
    known_context TEXT,                          -- JSON array of context IDs

    -- Knowledge freshness
    last_full_injection_at TIMESTAMP,
    last_incremental_injection_at TIMESTAMP,
    knowledge_version TEXT,                      -- Version of knowledge base

    -- Status
    is_onboarded BOOLEAN DEFAULT FALSE,
    confidence_level REAL DEFAULT 0.0,           -- How well-equipped is agent (0-1)

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge requirements (what knowledge is needed for what tasks?)
CREATE TABLE IF NOT EXISTS knowledge_requirements (
    requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,                     -- e.g. "ui_development", "backend_api", "deployment"
    project_type TEXT,                           -- e.g. "nextjs", "nodejs", "python"

    -- Required knowledge
    required_skps TEXT,                          -- JSON array of essential SKPs
    recommended_skps TEXT,                       -- JSON array of helpful SKPs
    required_specs TEXT,                         -- JSON array of essential specs
    recommended_specs TEXT,                      -- JSON array of helpful specs
    required_tools TEXT,                         -- JSON array of essential tools

    -- Metadata
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_injections_agent ON knowledge_injections(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_injections_project ON knowledge_injections(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_injections_trigger ON knowledge_injections(injection_trigger);
CREATE INDEX IF NOT EXISTS idx_injection_templates_roles ON injection_templates(agent_roles);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_state_agent ON agent_knowledge_state(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_state_session ON agent_knowledge_state(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_requirements_task ON knowledge_requirements(task_type);

-- ============================================================================
-- Views
-- ============================================================================

-- Recent injections summary
CREATE VIEW IF NOT EXISTS recent_injections_summary AS
SELECT
    injection_id,
    agent_id,
    project_id,
    injection_trigger,
    knowledge_types,
    total_tokens,
    total_words,
    delivery_method,
    was_used,
    injected_at
FROM knowledge_injections
ORDER BY injected_at DESC
LIMIT 100;

-- Agent knowledge coverage (how well-equipped is each agent?)
CREATE VIEW IF NOT EXISTS agent_knowledge_coverage AS
SELECT
    aks.agent_id,
    aks.session_id,
    aks.is_onboarded,
    aks.confidence_level,
    COUNT(DISTINCT ki.injection_id) as total_injections,
    SUM(ki.total_tokens) as total_tokens_received,
    aks.last_full_injection_at,
    aks.updated_at
FROM agent_knowledge_state aks
LEFT JOIN knowledge_injections ki ON aks.agent_id = ki.agent_id
GROUP BY aks.agent_id, aks.session_id;

-- Knowledge effectiveness (which knowledge is most useful?)
CREATE VIEW IF NOT EXISTS knowledge_effectiveness AS
SELECT
    json_extract(value, '$') as knowledge_item,
    COUNT(DISTINCT ki.injection_id) as injection_count,
    SUM(CASE WHEN ki.was_used = TRUE THEN 1 ELSE 0 END) as usage_count,
    ROUND(CAST(SUM(CASE WHEN ki.was_used = TRUE THEN 1 ELSE 0 END) AS FLOAT) /
          COUNT(DISTINCT ki.injection_id) * 100, 1) as usage_percentage,
    AVG(ki.feedback_rating) as avg_rating
FROM knowledge_injections ki,
     json_each(ki.knowledge_items)
WHERE ki.knowledge_items IS NOT NULL
GROUP BY json_extract(value, '$')
HAVING injection_count > 0
ORDER BY usage_percentage DESC;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp on agent knowledge state change
CREATE TRIGGER IF NOT EXISTS update_agent_knowledge_state_timestamp
AFTER UPDATE ON agent_knowledge_state
FOR EACH ROW
BEGIN
    UPDATE agent_knowledge_state
    SET updated_at = CURRENT_TIMESTAMP
    WHERE state_id = NEW.state_id;
END;

-- Update template timestamp
CREATE TRIGGER IF NOT EXISTS update_injection_templates_timestamp
AFTER UPDATE ON injection_templates
FOR EACH ROW
BEGIN
    UPDATE injection_templates
    SET updated_at = CURRENT_TIMESTAMP
    WHERE template_id = NEW.template_id;
END;

-- ============================================================================
-- Initial injection templates
-- ============================================================================

-- Template: Agent Onboarding (comprehensive initial knowledge)
INSERT OR IGNORE INTO injection_templates (
    template_id, template_name, description, agent_roles, trigger_types,
    skp_ids, spec_categories, tool_categories, priority, auto_inject
) VALUES (
    'agent_onboarding_full',
    'Full Agent Onboarding',
    'Complete knowledge injection for new agents connecting to Central-MCP',
    '["Agent-A", "Agent-B", "Agent-C", "Agent-D", "Agent-E", "Agent-F"]',
    '["auto_connect", "manual"]',
    '["ULTRATHINK_REALTIME_VOICE_MASTERY"]',
    '["SCAFFOLD", "GOVERNANCE", "MODULES"]',
    '["central-mcp", "universal"]',
    10,
    TRUE
);

-- Template: UI Development Focus
INSERT OR IGNORE INTO injection_templates (
    template_id, template_name, description, agent_roles, trigger_types,
    skp_ids, spec_categories, tool_categories, priority, auto_inject
) VALUES (
    'ui_development_focus',
    'UI Development Knowledge',
    'Knowledge injection for UI/frontend development tasks',
    '["Agent-A"]',
    '["task_start", "request"]',
    '[]',
    '["MODULES"]',
    '["central-mcp"]',
    8,
    FALSE
);

-- Template: Backend Development Focus
INSERT OR IGNORE INTO injection_templates (
    template_id, template_name, description, agent_roles, trigger_types,
    skp_ids, spec_categories, tool_categories, priority, auto_inject
) VALUES (
    'backend_development_focus',
    'Backend Development Knowledge',
    'Knowledge injection for backend/API development tasks',
    '["Agent-C"]',
    '["task_start", "request"]',
    '[]',
    '["MODULES", "SCAFFOLD"]',
    '["central-mcp"]',
    8,
    FALSE
);

-- Template: Error Recovery
INSERT OR IGNORE INTO injection_templates (
    template_id, template_name, description, agent_roles, trigger_types,
    skp_ids, spec_categories, tool_categories, priority, auto_inject
) VALUES (
    'error_recovery',
    'Error Recovery Support',
    'Knowledge injection when agents encounter errors',
    '["Agent-A", "Agent-B", "Agent-C", "Agent-D"]',
    '["error"]',
    '[]',
    '["GOVERNANCE"]',
    '["universal"]',
    9,
    TRUE
);
