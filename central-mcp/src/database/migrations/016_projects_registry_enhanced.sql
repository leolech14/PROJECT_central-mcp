-- ============================================================================
-- PROJECTS REGISTRY ENHANCEMENT - Complete Project Management System
-- ============================================================================
-- Purpose: Enhance existing projects table with full project management
-- Created: 2025-10-12
-- Part of: Central-MCP Atomic Entities Infrastructure
-- Note: EXTENDS existing projects table, does not recreate
-- ============================================================================

-- Add new columns to existing projects table
ALTER TABLE projects ADD COLUMN description TEXT;
ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'ACTIVE';  -- ACTIVE, INACTIVE, BLOCKED, ARCHIVED, ON_HOLD
ALTER TABLE projects ADD COLUMN health TEXT DEFAULT 'HEALTHY';  -- HEALTHY, WARNING, CRITICAL, UNKNOWN
ALTER TABLE projects ADD COLUMN completion_percentage INTEGER DEFAULT 0;

-- Tech stack
ALTER TABLE projects ADD COLUMN tech_stack TEXT;  -- JSON array: ["Next.js", "TypeScript", "Tailwind"]
ALTER TABLE projects ADD COLUMN primary_language TEXT;  -- typescript, python, javascript, etc.
ALTER TABLE projects ADD COLUMN framework TEXT;  -- Next.js, React, FastAPI, etc.

-- Team and ownership
ALTER TABLE projects ADD COLUMN lead_agent TEXT;  -- Primary agent responsible
ALTER TABLE projects ADD COLUMN team_agents TEXT;  -- JSON array of agent IDs
ALTER TABLE projects ADD COLUMN maintainer TEXT;  -- Person/team maintaining

-- Goals and milestones
ALTER TABLE projects ADD COLUMN current_milestone TEXT;
ALTER TABLE projects ADD COLUMN next_milestone TEXT;
ALTER TABLE projects ADD COLUMN target_completion_date TEXT;
ALTER TABLE projects ADD COLUMN key_objectives TEXT;  -- JSON array of objectives

-- Dependencies
ALTER TABLE projects ADD COLUMN depends_on TEXT;  -- JSON array of project IDs this depends on
ALTER TABLE projects ADD COLUMN depended_by TEXT;  -- JSON array of project IDs that depend on this
ALTER TABLE projects ADD COLUMN integration_points TEXT;  -- JSON array of integration descriptions

-- Metrics
ALTER TABLE projects ADD COLUMN total_tasks INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN completed_tasks INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN blocked_tasks INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN total_files INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN total_lines INTEGER DEFAULT 0;

-- Repository info
ALTER TABLE projects ADD COLUMN default_branch TEXT DEFAULT 'main';
ALTER TABLE projects ADD COLUMN last_commit_hash TEXT;
ALTER TABLE projects ADD COLUMN last_commit_date TEXT;
ALTER TABLE projects ADD COLUMN commit_count INTEGER DEFAULT 0;

-- Deployment
ALTER TABLE projects ADD COLUMN deployment_status TEXT;  -- NOT_DEPLOYED, STAGING, PRODUCTION
ALTER TABLE projects ADD COLUMN deployment_url TEXT;
ALTER TABLE projects ADD COLUMN deployment_date TEXT;

-- Documentation
ALTER TABLE projects ADD COLUMN readme_path TEXT;
ALTER TABLE projects ADD COLUMN docs_path TEXT;
ALTER TABLE projects ADD COLUMN has_claude_md BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN has_comprehensive_docs BOOLEAN DEFAULT FALSE;

-- Quality metrics
ALTER TABLE projects ADD COLUMN code_quality_score REAL DEFAULT 0.0;  -- 0-1
ALTER TABLE projects ADD COLUMN test_coverage REAL DEFAULT 0.0;  -- 0-1
ALTER TABLE projects ADD COLUMN documentation_score REAL DEFAULT 0.0;  -- 0-1

-- Timestamps
ALTER TABLE projects ADD COLUMN archived_at TEXT;
ALTER TABLE projects ADD COLUMN blocked_since TEXT;
ALTER TABLE projects ADD COLUMN last_health_check TEXT;

-- ============================================================================
-- New Tables for Project Management
-- ============================================================================

-- Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    milestone_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    milestone_name TEXT NOT NULL,
    description TEXT,
    target_date TEXT,
    completed_date TEXT,
    status TEXT DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED, MISSED
    completion_percentage INTEGER DEFAULT 0,
    deliverables TEXT,  -- JSON array of deliverable descriptions
    blockers TEXT,  -- JSON array of blocker descriptions
    assigned_agents TEXT,  -- JSON array of agent IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Project tasks
CREATE TABLE IF NOT EXISTS project_tasks (
    task_id TEXT PRIMARY KEY,  -- e.g. "T-central-mcp-001"
    project_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    description TEXT,
    category TEXT,  -- FEATURE, BUG, REFACTOR, DOCS, TEST, DEPLOYMENT
    priority TEXT DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH, CRITICAL
    status TEXT DEFAULT 'TODO',  -- TODO, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED

    -- Assignment
    assigned_agent TEXT,
    claimed_at TIMESTAMP,

    -- Dependencies
    depends_on_tasks TEXT,  -- JSON array of task IDs
    blocks_tasks TEXT,  -- JSON array of task IDs

    -- Progress
    completion_percentage INTEGER DEFAULT 0,
    estimated_hours REAL,
    actual_hours REAL,

    -- Blockers
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    blocked_since TIMESTAMP,

    -- Deliverables
    deliverables TEXT,  -- JSON array of deliverable paths/descriptions
    acceptance_criteria TEXT,  -- JSON array of criteria

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Project dependencies (relationships between projects)
CREATE TABLE IF NOT EXISTS project_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_project_id TEXT NOT NULL,  -- Project that depends
    target_project_id TEXT NOT NULL,  -- Project being depended on
    dependency_type TEXT NOT NULL,  -- REQUIRES, INTEGRATES_WITH, SHARES_CODE, DEPLOYED_TOGETHER
    description TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_project_id) REFERENCES projects(id),
    FOREIGN KEY (target_project_id) REFERENCES projects(id)
);

-- Project health checks
CREATE TABLE IF NOT EXISTS project_health_checks (
    check_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    health_status TEXT NOT NULL,  -- HEALTHY, WARNING, CRITICAL

    -- Metrics
    build_passing BOOLEAN,
    tests_passing BOOLEAN,
    deployment_working BOOLEAN,
    recent_activity BOOLEAN,  -- Activity in last 7 days
    no_blockers BOOLEAN,

    -- Issues found
    issues_found TEXT,  -- JSON array of issue descriptions
    recommendations TEXT,  -- JSON array of recommended actions

    checked_by TEXT,  -- Loop ID or agent ID
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Project activity log
CREATE TABLE IF NOT EXISTS project_activity_log (
    activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,  -- COMMIT, DEPLOYMENT, MILESTONE_COMPLETED, TASK_COMPLETED, STATUS_CHANGE
    activity_description TEXT,
    agent_id TEXT,
    metadata TEXT,  -- JSON object with additional data
    activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_agent ON project_tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_project_dependencies_source ON project_dependencies(source_project_id);
CREATE INDEX IF NOT EXISTS idx_project_dependencies_target ON project_dependencies(target_project_id);
CREATE INDEX IF NOT EXISTS idx_project_health_checks_project ON project_health_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project ON project_activity_log(project_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Active projects with health status
CREATE VIEW IF NOT EXISTS active_projects_dashboard AS
SELECT
    p.id,
    p.name,
    p.type,
    p.status,
    p.health,
    p.completion_percentage,
    p.lead_agent,
    p.current_milestone,
    p.total_tasks,
    p.completed_tasks,
    p.blocked_tasks,
    p.deployment_status,
    p.last_activity
FROM projects p
WHERE p.status = 'ACTIVE'
ORDER BY p.health DESC, p.completion_percentage ASC;

-- Projects by completion status
CREATE VIEW IF NOT EXISTS projects_by_completion AS
SELECT
    id,
    name,
    type,
    status,
    completion_percentage,
    total_tasks,
    completed_tasks,
    ROUND(CAST(completed_tasks AS REAL) / NULLIF(total_tasks, 0) * 100, 1) as task_completion_rate,
    current_milestone,
    lead_agent
FROM projects
WHERE status != 'ARCHIVED'
ORDER BY completion_percentage DESC, task_completion_rate DESC;

-- Project health summary
CREATE VIEW IF NOT EXISTS project_health_summary AS
SELECT
    p.id,
    p.name,
    p.health,
    p.status,
    COUNT(DISTINCT t.task_id) as open_tasks,
    SUM(CASE WHEN t.is_blocked THEN 1 ELSE 0 END) as blocked_tasks,
    MAX(ph.check_time) as last_health_check,
    ph.build_passing,
    ph.tests_passing,
    ph.deployment_working
FROM projects p
LEFT JOIN project_tasks t ON p.id = t.project_id AND t.status != 'COMPLETED'
LEFT JOIN project_health_checks ph ON p.id = ph.project_id
WHERE p.status = 'ACTIVE'
GROUP BY p.id
ORDER BY p.health DESC, open_tasks DESC;

-- Project dependencies graph
CREATE VIEW IF NOT EXISTS project_dependencies_graph AS
SELECT
    pd.source_project_id,
    sp.name as source_project_name,
    pd.target_project_id,
    tp.name as target_project_name,
    pd.dependency_type,
    pd.is_critical,
    sp.status as source_status,
    tp.status as target_status
FROM project_dependencies pd
JOIN projects sp ON pd.source_project_id = sp.id
JOIN projects tp ON pd.target_project_id = tp.id
ORDER BY pd.is_critical DESC, sp.name;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update project last_activity on new task
CREATE TRIGGER IF NOT EXISTS update_project_activity_on_task
AFTER INSERT ON project_tasks
FOR EACH ROW
BEGIN
    UPDATE projects
    SET last_activity = CURRENT_TIMESTAMP,
        total_tasks = total_tasks + 1
    WHERE id = NEW.project_id;
END;

-- Update project completed_tasks on task completion
CREATE TRIGGER IF NOT EXISTS update_project_completed_tasks
AFTER UPDATE OF status ON project_tasks
FOR EACH ROW
WHEN NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED'
BEGIN
    UPDATE projects
    SET completed_tasks = completed_tasks + 1,
        completion_percentage = ROUND(CAST(completed_tasks + 1 AS REAL) / NULLIF(total_tasks, 0) * 100, 0)
    WHERE id = NEW.project_id;
END;

-- Update project blocked_tasks count
CREATE TRIGGER IF NOT EXISTS update_project_blocked_tasks
AFTER UPDATE OF is_blocked ON project_tasks
FOR EACH ROW
BEGIN
    UPDATE projects
    SET blocked_tasks = (
        SELECT COUNT(*) FROM project_tasks
        WHERE project_id = NEW.project_id AND is_blocked = TRUE
    )
    WHERE id = NEW.project_id;
END;

-- Log project activity on status change
CREATE TRIGGER IF NOT EXISTS log_project_status_change
AFTER UPDATE OF status ON projects
FOR EACH ROW
WHEN NEW.status != OLD.status
BEGIN
    INSERT INTO project_activity_log (project_id, activity_type, activity_description)
    VALUES (NEW.id, 'STATUS_CHANGE', 'Status changed from ' || OLD.status || ' to ' || NEW.status);
END;

-- ============================================================================
-- Update existing projects with default enhanced data
-- ============================================================================

-- Set default statuses for existing projects
UPDATE projects SET status = 'ACTIVE' WHERE status IS NULL;
UPDATE projects SET health = 'UNKNOWN' WHERE health IS NULL;
UPDATE projects SET completion_percentage = 0 WHERE completion_percentage IS NULL;

-- Mark central-mcp as special
UPDATE projects
SET description = 'Multi-agent coordination system with 9 auto-proactive loops',
    status = 'ACTIVE',
    health = 'HEALTHY',
    completion_percentage = 75,
    tech_stack = '["Node.js", "TypeScript", "Next.js 15", "SQLite", "React"]',
    primary_language = 'typescript',
    framework = 'Next.js',
    lead_agent = 'Agent-B',
    team_agents = '["Agent-A", "Agent-B", "Agent-C", "Agent-D"]',
    current_milestone = 'Complete Infrastructure Pipelines',
    deployment_status = 'PRODUCTION',
    deployment_url = 'http://centralmcp.net',
    has_claude_md = TRUE,
    has_comprehensive_docs = TRUE
WHERE id = 'central-mcp';
