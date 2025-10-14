-- ============================================================================
-- TOOLS REGISTRY SYSTEM - Official Tool Ingestion Pipeline
-- ============================================================================
-- Purpose: Structured system for registering, tracking, and managing tools
-- Created: 2025-10-12
-- Part of: Central-MCP Tool Management Infrastructure
-- ============================================================================

-- Main tools registry
CREATE TABLE IF NOT EXISTS tools_registry (
    tool_id TEXT PRIMARY KEY,                    -- e.g. "mr-fix-my-project", "sniper-tagger"
    tool_name TEXT NOT NULL,                     -- Display name
    category TEXT NOT NULL,                      -- central-mcp, universal, ecosystem
    status TEXT DEFAULT 'active',                -- active, beta, planned, deprecated
    icon TEXT DEFAULT '🛠️',                      -- Emoji icon
    description TEXT NOT NULL,                   -- What the tool does

    -- Location & Access
    location TEXT,                               -- File path or repository
    deployed_url TEXT,                           -- Live URL if deployed
    package_name TEXT,                           -- npm/pip package name
    repository_url TEXT,                         -- GitHub/GitLab URL

    -- Documentation
    documentation_path TEXT,                     -- Path to docs
    readme_path TEXT,                            -- README location
    examples_path TEXT,                          -- Examples location

    -- Metadata
    version TEXT DEFAULT 'v1.0.0',              -- Current version
    author TEXT,                                 -- Creator
    license TEXT,                                -- MIT, Apache, etc.

    -- Stats
    usage_count INTEGER DEFAULT 0,               -- How many times used
    last_used_at TIMESTAMP,                      -- Last usage
    health_status TEXT DEFAULT 'unknown',        -- healthy, warning, error, unknown
    last_health_check TIMESTAMP,                 -- Last check

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by TEXT DEFAULT 'system'          -- Who registered it
);

-- Tool capabilities/features
CREATE TABLE IF NOT EXISTS tool_capabilities (
    capability_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    capability TEXT NOT NULL,                    -- Description of what it can do
    capability_type TEXT,                        -- core, optional, experimental
    enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tool_id) REFERENCES tools_registry(tool_id)
);

-- Tool usage patterns
CREATE TABLE IF NOT EXISTS tool_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    usage_type TEXT NOT NULL,                    -- cli, api, dashboard, mcp
    command TEXT,                                -- Command executed
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    duration_ms INTEGER,
    used_by TEXT,                                -- agent_letter, user_id, system
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools_registry(tool_id)
);

-- Tool dependencies
CREATE TABLE IF NOT EXISTS tool_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    dependency_type TEXT NOT NULL,               -- npm, pip, binary, service
    dependency_name TEXT NOT NULL,               -- Package/service name
    version_required TEXT,                       -- >=1.0.0, ^2.0.0
    is_required BOOLEAN DEFAULT TRUE,            -- Required or optional
    FOREIGN KEY (tool_id) REFERENCES tools_registry(tool_id)
);

-- Tool versions history
CREATE TABLE IF NOT EXISTS tool_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    version TEXT NOT NULL,                       -- v1.0.0, v1.1.0
    changelog TEXT,                              -- What changed
    breaking_changes BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_by TEXT,
    FOREIGN KEY (tool_id) REFERENCES tools_registry(tool_id)
);

-- Tool health checks
CREATE TABLE IF NOT EXISTS tool_health_checks (
    check_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    check_type TEXT NOT NULL,                    -- accessibility, functionality, performance
    status TEXT NOT NULL,                        -- healthy, warning, error
    message TEXT,
    details TEXT,                                -- JSON with detailed results
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools_registry(tool_id)
);

-- Tool discovery log
CREATE TABLE IF NOT EXISTS tool_discovery_log (
    discovery_id INTEGER PRIMARY KEY AUTOINCREMENT,
    discovery_type TEXT NOT NULL,                -- auto-scan, manual-registration, github-sync
    tools_found INTEGER DEFAULT 0,
    tools_added INTEGER DEFAULT 0,
    tools_updated INTEGER DEFAULT 0,
    tools_skipped INTEGER DEFAULT 0,
    scan_path TEXT,                              -- Where we scanned
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    duration_ms INTEGER,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discovered_by TEXT DEFAULT 'system'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools_registry(category);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools_registry(status);
CREATE INDEX IF NOT EXISTS idx_tool_capabilities_tool_id ON tool_capabilities(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON tool_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_tool_health_tool_id ON tool_health_checks(tool_id);

-- ============================================================================
-- Views for easy querying
-- ============================================================================

-- Active tools with capability counts
CREATE VIEW IF NOT EXISTS active_tools_summary AS
SELECT
    t.tool_id,
    t.tool_name,
    t.category,
    t.status,
    t.icon,
    t.version,
    COUNT(DISTINCT c.capability_id) as capabilities_count,
    COUNT(DISTINCT u.usage_id) as total_uses,
    t.health_status,
    t.last_health_check,
    t.deployed_url,
    t.documentation_path
FROM tools_registry t
LEFT JOIN tool_capabilities c ON t.tool_id = c.tool_id
LEFT JOIN tool_usage u ON t.tool_id = u.tool_id
WHERE t.status IN ('active', 'beta')
GROUP BY t.tool_id
ORDER BY t.category, t.tool_name;

-- Tool usage statistics
CREATE VIEW IF NOT EXISTS tool_usage_stats AS
SELECT
    tool_id,
    COUNT(*) as total_uses,
    SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_uses,
    SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_uses,
    AVG(duration_ms) as avg_duration_ms,
    MAX(used_at) as last_used,
    COUNT(DISTINCT used_by) as unique_users
FROM tool_usage
GROUP BY tool_id;

-- Tool health summary
CREATE VIEW IF NOT EXISTS tool_health_summary AS
SELECT
    tool_id,
    COUNT(*) as total_checks,
    SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) as healthy_checks,
    SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_checks,
    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_checks,
    MAX(checked_at) as last_check
FROM tool_health_checks
GROUP BY tool_id;

-- ============================================================================
-- Initial tool population from existing dashboard data
-- ============================================================================

-- SKP Ingestion Pipeline
INSERT OR IGNORE INTO tools_registry (
    tool_id, tool_name, category, status, icon, description,
    location, documentation_path, version, registered_by
) VALUES (
    'skp-pipeline',
    'SKP Ingestion Pipeline',
    'central-mcp',
    'active',
    '📦',
    'Specialized Knowledge Pack (SKP) ingestion, versioning, and management system',
    'central-mcp/scripts/update-skp.sh',
    'central-mcp/docs/SKP_INGESTION_PIPELINE.md',
    'v1.0.0',
    'system'
);

INSERT OR IGNORE INTO tool_capabilities (tool_id, capability, capability_type) VALUES
    ('skp-pipeline', 'Semantic versioning (v1.0.0 → v1.1.0)', 'core'),
    ('skp-pipeline', 'Automatic change detection', 'core'),
    ('skp-pipeline', 'Database-tracked history', 'core'),
    ('skp-pipeline', 'CLI tool: ./scripts/update-skp.sh', 'core');

-- Backend Connections Registry
INSERT OR IGNORE INTO tools_registry (
    tool_id, tool_name, category, status, icon, description,
    location, documentation_path, version, registered_by
) VALUES (
    'registry-discovery',
    'Backend Connections Registry',
    'central-mcp',
    'active',
    '🔗',
    'Real-time backend API and React component discovery engine',
    'central-mcp/registry_discovery_engine.py',
    'central-mcp/BACKEND_CONNECTIONS_REGISTRY_ARCHITECTURE.md',
    'v1.0.0',
    'system'
);

INSERT OR IGNORE INTO tool_capabilities (tool_id, capability, capability_type) VALUES
    ('registry-discovery', 'Auto-discovers 19+ API endpoints', 'core'),
    ('registry-discovery', 'Maps React components to APIs', 'core'),
    ('registry-discovery', 'Generates living documentation', 'core'),
    ('registry-discovery', 'Detects orphaned components', 'core');

-- MR.FIX-MY-PROJECT
INSERT OR IGNORE INTO tools_registry (
    tool_id, tool_name, category, status, icon, description,
    location, documentation_path, version, registered_by
) VALUES (
    'mr-fix-my-project',
    'MR.FIX-MY-PROJECT(PLEASE!)',
    'universal',
    'active',
    '🔧',
    'Universal project intelligence analyzer with adaptive strategy (13,100 LOC megalith)',
    'LocalBrain/mr-fix-my-project-please.py',
    'Built-in megalith index (lines 1-90)',
    'v1.0.0',
    'system'
);

INSERT OR IGNORE INTO tool_capabilities (tool_id, capability, capability_type) VALUES
    ('mr-fix-my-project', '172 documented functions', 'core'),
    ('mr-fix-my-project', 'Self-healing code manager', 'core'),
    ('mr-fix-my-project', 'Maximum extraction analysis', 'core'),
    ('mr-fix-my-project', 'HTML report generation', 'core'),
    ('mr-fix-my-project', 'Mermaid diagram visualizer (5 diagrams)', 'optional'),
    ('mr-fix-my-project', 'Component dependency mapper', 'core');

-- Multi-Indexer Sniper Tagger Query Gun
INSERT OR IGNORE INTO tools_registry (
    tool_id, tool_name, category, status, icon, description,
    location, deployed_url, documentation_path, version, registered_by
) VALUES (
    'sniper-tagger',
    'Multi-Indexer Sniper Tagger Query Gun',
    'universal',
    'active',
    '🎯',
    'Surgical code querying and editing with semantic tags',
    'LocalBrain/04_AGENT_FRAMEWORK/mcp-integration/SniperGunClient.ts',
    'https://sniper-gun-mcp-635198490463.us-central1.run.app',
    'LocalBrain/MULTI_INDEXER_SNIPER_ANALYSIS.md',
    'v1.0.0',
    'system'
);

INSERT OR IGNORE INTO tool_capabilities (tool_id, capability, capability_type) VALUES
    ('sniper-tagger', 'Semantic HTML queries (@html:form, @component:modal)', 'core'),
    ('sniper-tagger', 'Surgical line-range editing', 'core'),
    ('sniper-tagger', 'Impact analysis before changes', 'core'),
    ('sniper-tagger', 'Component extraction', 'core'),
    ('sniper-tagger', 'Cloud-hosted MCP server', 'core');

-- ============================================================================
-- Functions for tool management
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_tools_registry_timestamp
AFTER UPDATE ON tools_registry
FOR EACH ROW
BEGIN
    UPDATE tools_registry SET updated_at = CURRENT_TIMESTAMP WHERE tool_id = NEW.tool_id;
END;

-- Trigger to increment usage count
CREATE TRIGGER IF NOT EXISTS increment_tool_usage_count
AFTER INSERT ON tool_usage
FOR EACH ROW
WHEN NEW.success = TRUE
BEGIN
    UPDATE tools_registry
    SET usage_count = usage_count + 1,
        last_used_at = NEW.used_at
    WHERE tool_id = NEW.tool_id;
END;
