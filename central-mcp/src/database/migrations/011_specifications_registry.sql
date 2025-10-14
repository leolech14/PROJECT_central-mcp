-- ============================================================================
-- SPECIFICATIONS REGISTRY SYSTEM - Official Spec Ingestion Pipeline
-- ============================================================================
-- Purpose: Structured system for registering, tracking, and managing specs
-- Created: 2025-10-12
-- Part of: Central-MCP Atomic Entities Infrastructure
-- ============================================================================

-- Main specifications registry
CREATE TABLE IF NOT EXISTS specs_registry (
    spec_id TEXT PRIMARY KEY,                    -- e.g. "CMCP-MODULES-001", "CMCP-SCAFFOLD-002"
    spec_number TEXT,                            -- e.g. "0010", "0011", "0100"
    title TEXT NOT NULL,                         -- Display title
    category TEXT NOT NULL,                      -- MODULES, SCAFFOLD, CONFIGURATION, GOVERNANCE, OPS
    type TEXT,                                   -- FEATURE, INTEGRATION, API, etc.
    layer TEXT,                                  -- UI, API, CORE, PROTOCOL, INFRA
    status TEXT DEFAULT 'DRAFT',                 -- DRAFT, REVIEW, ACTIVE, DEPRECATED, ARCHIVED
    priority TEXT DEFAULT 'P2',                  -- P0, P1, P2, P3

    -- Version & Tracking
    version TEXT DEFAULT '1.0',                  -- Semantic version
    created_date DATE,                           -- When spec was created
    updated_date DATE,                           -- Last updated

    -- Assignment & Ownership
    assigned_agent TEXT,                         -- AGENT_ID or UNASSIGNED
    authors TEXT,                                -- JSON array of authors
    reviewers TEXT,                              -- JSON array of reviewers

    -- Estimates & Progress
    estimated_hours INTEGER,                     -- Time estimate
    actual_hours INTEGER DEFAULT 0,              -- Actual time spent
    completion_percentage INTEGER DEFAULT 0,     -- 0-100

    -- Location & Content
    file_path TEXT NOT NULL,                     -- Path to .md file
    file_size INTEGER,                           -- File size in bytes
    word_count INTEGER,                          -- Total words
    section_count INTEGER DEFAULT 12,            -- Should always be 12

    -- Tags & Search
    tags TEXT,                                   -- JSON array of tags

    -- Metadata
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by TEXT DEFAULT 'system'
);

-- Spec requirements (functional requirements from Section 2)
CREATE TABLE IF NOT EXISTS spec_requirements (
    requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    spec_id TEXT NOT NULL,
    req_code TEXT NOT NULL,                      -- e.g. "REQ-001", "INT-002", "BEH-003"
    req_type TEXT NOT NULL,                      -- core, interaction, behavior, edge_case
    description TEXT NOT NULL,                   -- What the requirement is
    test_criteria TEXT,                          -- How to verify it
    implemented BOOLEAN DEFAULT FALSE,           -- Has it been implemented?
    tested BOOLEAN DEFAULT FALSE,                -- Has it been tested?
    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Spec dependencies
CREATE TABLE IF NOT EXISTS spec_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    spec_id TEXT NOT NULL,                       -- The spec that has dependencies
    depends_on_spec_id TEXT NOT NULL,            -- The spec it depends on
    dependency_type TEXT DEFAULT 'internal',     -- internal (other specs), external (packages)
    dependency_name TEXT,                        -- Package name if external
    version_required TEXT,                       -- Version constraint
    is_blocking BOOLEAN DEFAULT TRUE,            -- Blocks implementation if not ready
    resolved BOOLEAN DEFAULT FALSE,              -- Is dependency satisfied?
    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id),
    FOREIGN KEY (depends_on_spec_id) REFERENCES specs_registry(spec_id)
);

-- Spec versions history
CREATE TABLE IF NOT EXISTS spec_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    spec_id TEXT NOT NULL,
    version TEXT NOT NULL,                       -- v1.0, v1.1, v2.0
    changelog TEXT,                              -- What changed
    breaking_changes BOOLEAN DEFAULT FALSE,
    sections_modified TEXT,                      -- JSON array of section numbers
    released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_by TEXT,
    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Spec acceptance criteria checkboxes (from Section 8)
CREATE TABLE IF NOT EXISTS spec_acceptance_criteria (
    criteria_id INTEGER PRIMARY KEY AUTOINCREMENT,
    spec_id TEXT NOT NULL,
    criteria_category TEXT NOT NULL,             -- functional, performance, quality, integration
    criteria_description TEXT NOT NULL,          -- The checkbox text
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    completed_by TEXT,
    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Spec usage tracking (when specs are referenced/accessed)
CREATE TABLE IF NOT EXISTS spec_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    spec_id TEXT NOT NULL,
    usage_type TEXT NOT NULL,                    -- read, referenced, implemented, queried
    accessed_by TEXT,                            -- agent_letter, user_id, system
    context TEXT,                                -- What was the user doing?
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Spec frontmatter metadata (complete YAML frontmatter)
CREATE TABLE IF NOT EXISTS spec_frontmatter (
    spec_id TEXT PRIMARY KEY,
    yaml_content TEXT NOT NULL,                  -- Full YAML frontmatter
    ci_cd_config TEXT,                           -- JSON of CI/CD settings
    auto_validate BOOLEAN DEFAULT TRUE,
    required_sections TEXT,                      -- JSON array [1,2,3,...12]
    generate_docs BOOLEAN DEFAULT TRUE,
    track_progress BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_specs_category ON specs_registry(category);
CREATE INDEX IF NOT EXISTS idx_specs_status ON specs_registry(status);
CREATE INDEX IF NOT EXISTS idx_specs_priority ON specs_registry(priority);
CREATE INDEX IF NOT EXISTS idx_specs_assigned_agent ON specs_registry(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_spec_requirements_spec_id ON spec_requirements(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_dependencies_spec_id ON spec_dependencies(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_dependencies_blocking ON spec_dependencies(is_blocking, resolved);
CREATE INDEX IF NOT EXISTS idx_spec_usage_spec_id ON spec_usage(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_acceptance_completed ON spec_acceptance_criteria(spec_id, is_completed);

-- ============================================================================
-- Views for easy querying
-- ============================================================================

-- Active specs with completion stats
CREATE VIEW IF NOT EXISTS active_specs_summary AS
SELECT
    s.spec_id,
    s.spec_number,
    s.title,
    s.category,
    s.status,
    s.priority,
    s.assigned_agent,
    s.completion_percentage,
    s.estimated_hours,
    s.actual_hours,
    COUNT(DISTINCT r.requirement_id) as total_requirements,
    SUM(CASE WHEN r.implemented = TRUE THEN 1 ELSE 0 END) as implemented_requirements,
    COUNT(DISTINCT ac.criteria_id) as total_acceptance_criteria,
    SUM(CASE WHEN ac.is_completed = TRUE THEN 1 ELSE 0 END) as completed_criteria,
    COUNT(DISTINCT d.dependency_id) as total_dependencies,
    SUM(CASE WHEN d.resolved = TRUE THEN 1 ELSE 0 END) as resolved_dependencies,
    s.file_path,
    s.version
FROM specs_registry s
LEFT JOIN spec_requirements r ON s.spec_id = r.spec_id
LEFT JOIN spec_acceptance_criteria ac ON s.spec_id = ac.spec_id
LEFT JOIN spec_dependencies d ON s.spec_id = d.spec_id AND d.is_blocking = TRUE
WHERE s.status IN ('DRAFT', 'REVIEW', 'ACTIVE')
GROUP BY s.spec_id
ORDER BY
    CASE s.priority
        WHEN 'P0' THEN 1
        WHEN 'P1' THEN 2
        WHEN 'P2' THEN 3
        WHEN 'P3' THEN 4
        ELSE 5
    END,
    s.created_at DESC;

-- Spec usage statistics
CREATE VIEW IF NOT EXISTS spec_usage_stats AS
SELECT
    spec_id,
    COUNT(*) as total_accesses,
    COUNT(DISTINCT accessed_by) as unique_accessors,
    MAX(used_at) as last_accessed,
    SUM(CASE WHEN usage_type = 'implemented' THEN 1 ELSE 0 END) as implementation_references,
    SUM(CASE WHEN usage_type = 'referenced' THEN 1 ELSE 0 END) as external_references
FROM spec_usage
GROUP BY spec_id;

-- Blocked specs (specs with unresolved blocking dependencies)
CREATE VIEW IF NOT EXISTS blocked_specs AS
SELECT
    s.spec_id,
    s.title,
    s.category,
    s.assigned_agent,
    COUNT(d.dependency_id) as blocking_dependencies,
    GROUP_CONCAT(d.depends_on_spec_id, ', ') as blocked_by_specs
FROM specs_registry s
INNER JOIN spec_dependencies d ON s.spec_id = d.spec_id
WHERE d.is_blocking = TRUE AND d.resolved = FALSE
GROUP BY s.spec_id
HAVING COUNT(d.dependency_id) > 0;

-- Spec completion progress
CREATE VIEW IF NOT EXISTS spec_completion_progress AS
SELECT
    s.spec_id,
    s.title,
    s.category,
    s.completion_percentage as overall_progress,
    ROUND(CAST(SUM(CASE WHEN r.implemented = TRUE THEN 1 ELSE 0 END) AS FLOAT) /
          NULLIF(COUNT(r.requirement_id), 0) * 100, 1) as requirements_progress,
    ROUND(CAST(SUM(CASE WHEN ac.is_completed = TRUE THEN 1 ELSE 0 END) AS FLOAT) /
          NULLIF(COUNT(ac.criteria_id), 0) * 100, 1) as acceptance_progress,
    ROUND(CAST(SUM(CASE WHEN d.resolved = TRUE THEN 1 ELSE 0 END) AS FLOAT) /
          NULLIF(COUNT(d.dependency_id), 0) * 100, 1) as dependencies_progress
FROM specs_registry s
LEFT JOIN spec_requirements r ON s.spec_id = r.spec_id
LEFT JOIN spec_acceptance_criteria ac ON s.spec_id = ac.spec_id
LEFT JOIN spec_dependencies d ON s.spec_id = d.spec_id
WHERE s.status = 'ACTIVE'
GROUP BY s.spec_id;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_specs_registry_timestamp
AFTER UPDATE ON specs_registry
FOR EACH ROW
BEGIN
    UPDATE specs_registry SET updated_at = CURRENT_TIMESTAMP WHERE spec_id = NEW.spec_id;
END;

-- Increment access count
CREATE TRIGGER IF NOT EXISTS increment_spec_access_count
AFTER INSERT ON spec_usage
FOR EACH ROW
BEGIN
    UPDATE specs_registry
    SET access_count = access_count + 1,
        last_accessed_at = NEW.used_at
    WHERE spec_id = NEW.spec_id;
END;

-- Auto-calculate completion percentage when requirements change
CREATE TRIGGER IF NOT EXISTS update_spec_completion_on_requirement_change
AFTER UPDATE OF implemented ON spec_requirements
FOR EACH ROW
BEGIN
    UPDATE specs_registry
    SET completion_percentage = (
        SELECT ROUND(CAST(SUM(CASE WHEN implemented = TRUE THEN 1 ELSE 0 END) AS FLOAT) /
               COUNT(*) * 100)
        FROM spec_requirements
        WHERE spec_id = NEW.spec_id
    )
    WHERE spec_id = NEW.spec_id;
END;

-- ============================================================================
-- Initial spec population from 02_SPECBASES/
-- ============================================================================

-- Register existing specs (sample - will be populated via CLI tool)
INSERT OR IGNORE INTO specs_registry (
    spec_id, spec_number, title, category, type, layer, status, priority,
    version, assigned_agent, file_path, registered_by
) VALUES
    ('CMCP-AUTO-PROACTIVE-010', '0010', 'Auto-Proactive Intelligence Architecture', 'SCAFFOLD', 'ARCHITECTURE', 'CORE', 'ACTIVE', 'P0',
     '1.0', 'Agent-B', 'central-mcp/02_SPECBASES/0010_AUTO_PROACTIVE_INTELLIGENCE_ARCHITECTURE.md', 'system'),

    ('CMCP-SPECBASE-011', '0011', 'Specbase Construction Orchestrated Workflow', 'GOVERNANCE', 'PROCESS', 'CORE', 'ACTIVE', 'P0',
     '1.0', 'Agent-B', 'central-mcp/02_SPECBASES/0011_SPECBASE_CONSTRUCTION_ORCHESTRATED_WORKFLOW.md', 'system'),

    ('CMCP-CATEGORIZATION-012', '0012', 'Atomic Project Categorization and Task Consolidation', 'GOVERNANCE', 'FRAMEWORK', 'CORE', 'ACTIVE', 'P1',
     '1.0', 'UNASSIGNED', 'central-mcp/02_SPECBASES/0012_ATOMIC_PROJECT_CATEGORIZATION_AND_TASK_CONSOLIDATION.md', 'system');

-- Sample requirements for spec 0010
INSERT OR IGNORE INTO spec_requirements (spec_id, req_code, req_type, description, test_criteria) VALUES
    ('CMCP-AUTO-PROACTIVE-010', 'REQ-001', 'core', '9 loops must run at specified intervals', 'Verify loop execution via database logs'),
    ('CMCP-AUTO-PROACTIVE-010', 'REQ-002', 'core', 'System status must be monitored every 5 seconds', 'Check Loop 0 execution timestamps'),
    ('CMCP-AUTO-PROACTIVE-010', 'REQ-003', 'core', 'Agent discovery must track WHO/WHAT/WHERE', 'Verify agent_sessions table populated');

-- Sample acceptance criteria
INSERT OR IGNORE INTO spec_acceptance_criteria (spec_id, criteria_category, criteria_description) VALUES
    ('CMCP-AUTO-PROACTIVE-010', 'functional', 'All 9 loops operational'),
    ('CMCP-AUTO-PROACTIVE-010', 'functional', 'Zero loop execution errors'),
    ('CMCP-AUTO-PROACTIVE-010', 'performance', 'Loop 0 executes within 5 second interval'),
    ('CMCP-AUTO-PROACTIVE-010', 'quality', 'System health at 100%');
