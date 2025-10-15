-- ============================================================================
-- TASK ANATOMY - The Bridge Between Vision and Execution
-- ============================================================================
-- Purpose: Define the atomic structure of tasks that connect specs to code
-- Created: 2025-10-12
-- Vision: USER MESSAGE → SPEC → TASK → CODE → PURPOSE FULFILLED
-- ============================================================================

-- ============================================================================
-- THE TASK ANATOMY
-- ============================================================================
-- A TASK is the ATOMIC EXECUTION UNIT that bridges abstract vision and concrete code
--
-- Every task answers 7 critical questions:
-- 1. WHAT:   What exactly needs to be done?
-- 2. WHY:    How does this connect to the bigger vision?
-- 3. WHO:    Which agent/role is best suited?
-- 4. WHEN:   What dependencies must be satisfied first?
-- 5. WHERE:  What files/locations are involved?
-- 6. HOW:    What are the step-by-step instructions?
-- 7. DONE:   How do we know it's complete?
-- ============================================================================

-- Tasks registry (the atomic execution units)
CREATE TABLE IF NOT EXISTS tasks_registry (
    task_id TEXT PRIMARY KEY,                  -- e.g. "T-MINERALS-001"
    task_name TEXT NOT NULL,                   -- Clear, action-oriented name

    -- VISION CONNECTION (WHY)
    spec_id TEXT NOT NULL,                     -- Parent specification
    vision_context TEXT NOT NULL,              -- How this connects to bigger vision
    business_value TEXT NOT NULL,              -- Why this matters to user/product
    success_impact TEXT,                       -- What success unlocks

    -- WHAT (Task Definition)
    task_type TEXT NOT NULL,                   -- feature, bug_fix, refactor, test, doc, deploy
    task_category TEXT NOT NULL,               -- frontend, backend, database, infrastructure
    task_description TEXT NOT NULL,            -- Detailed description
    task_scope TEXT NOT NULL,                  -- Boundaries - what's included/excluded
    minimal_context TEXT NOT NULL,             -- Minimum info needed to execute

    -- WHO (Agent Assignment)
    required_role TEXT NOT NULL,               -- Agent role needed (UI, Backend, etc.)
    required_skills TEXT,                      -- JSON array of skills
    required_knowledge TEXT,                   -- JSON array of knowledge domains
    assigned_agent TEXT,                       -- Currently assigned agent
    backup_agents TEXT,                        -- JSON array of backup agents

    -- WHEN (Dependencies & Timing)
    depends_on_tasks TEXT,                     -- JSON array of task IDs
    blocks_tasks TEXT,                         -- JSON array of task IDs this blocks
    depends_on_specs TEXT,                     -- JSON array of spec IDs needed
    execution_order INTEGER DEFAULT 0,         -- Order within spec
    can_parallelize BOOLEAN DEFAULT FALSE,     -- Can run in parallel with others?
    parallel_group TEXT,                       -- Group ID for parallel execution

    -- WHERE (Location & Scope)
    target_files TEXT,                         -- JSON array of files to modify/create
    target_directories TEXT,                   -- JSON array of directories
    target_codebase TEXT,                      -- Which codebase/product
    working_directory TEXT,                    -- Where agent should work

    -- HOW (Execution Instructions)
    step_by_step_instructions TEXT NOT NULL,   -- Detailed step-by-step guide
    code_snippets_needed TEXT,                 -- JSON array of snippet IDs
    prompts_needed TEXT,                       -- JSON array of prompt IDs
    context_files_needed TEXT,                 -- JSON array of context IDs
    external_resources TEXT,                   -- JSON array of URLs/docs
    example_code TEXT,                         -- Example implementation

    -- DONE (Success Criteria)
    acceptance_criteria TEXT NOT NULL,         -- JSON array of must-have conditions
    validation_method TEXT NOT NULL,           -- How to verify completion
    test_commands TEXT,                        -- Commands to run for validation
    expected_outputs TEXT,                     -- What success looks like
    definition_of_done TEXT NOT NULL,          -- Clear completion criteria
    quality_requirements TEXT,                 -- JSON: code quality, test coverage, etc.

    -- DELIVERABLES (Output)
    deliverables TEXT NOT NULL,                -- JSON array of expected outputs
    output_files TEXT,                         -- JSON array of files that should exist
    output_artifacts TEXT,                     -- JSON array of artifacts created
    documentation_required TEXT,               -- JSON: what docs to create/update

    -- STATUS & TRACKING
    status TEXT DEFAULT 'PENDING',             -- PENDING, READY, IN_PROGRESS, BLOCKED, COMPLETED, FAILED, CANCELLED
    priority TEXT DEFAULT 'MEDIUM',            -- LOW, MEDIUM, HIGH, CRITICAL
    complexity TEXT DEFAULT 'MEDIUM',          -- SIMPLE, MEDIUM, COMPLEX, EPIC
    estimated_hours REAL,                      -- Time estimate
    actual_hours REAL,                         -- Actual time spent

    -- BLOCKING & ISSUES
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    blocking_issues TEXT,                      -- JSON array of issues
    requires_clarification BOOLEAN DEFAULT FALSE,
    clarification_questions TEXT,              -- JSON array of questions

    -- EXECUTION HISTORY
    claimed_by TEXT,                           -- Agent that claimed task
    claimed_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    first_attempt_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,

    -- VALIDATION RESULTS
    validation_status TEXT DEFAULT 'NOT_VALIDATED', -- NOT_VALIDATED, PASSED, FAILED, PARTIAL
    validation_results TEXT,                   -- JSON: test results
    code_review_status TEXT,                   -- NOT_REVIEWED, APPROVED, CHANGES_REQUESTED
    code_review_notes TEXT,

    -- QUALITY METRICS
    code_quality_score REAL DEFAULT 0.0,       -- 0-1 score
    test_coverage REAL DEFAULT 0.0,            -- 0-1 coverage
    documentation_score REAL DEFAULT 0.0,      -- 0-1 score
    overall_quality_score REAL DEFAULT 0.0,    -- 0-1 combined score

    -- LEARNING & IMPROVEMENT
    lessons_learned TEXT,                      -- What we learned
    improvement_suggestions TEXT,              -- How to do better next time
    reusable_patterns TEXT,                    -- JSON: patterns to extract

    -- METADATA
    created_by TEXT,                           -- Who created this task
    created_from_message_id TEXT,              -- User message that spawned this
    tags TEXT,                                 -- JSON array of tags
    notes TEXT,                                -- Additional notes

    -- TIMESTAMPS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Task execution steps (granular step tracking)
CREATE TABLE IF NOT EXISTS task_execution_steps (
    step_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,

    -- Step Definition
    step_number INTEGER NOT NULL,              -- Order within task
    step_name TEXT NOT NULL,                   -- Clear step name
    step_description TEXT NOT NULL,            -- What to do in this step
    step_type TEXT NOT NULL,                   -- read, analyze, code, test, validate, document

    -- Step Instructions
    step_instructions TEXT NOT NULL,           -- Detailed instructions
    expected_outcome TEXT NOT NULL,            -- What success looks like
    success_criteria TEXT,                     -- How to verify this step

    -- Step Dependencies
    depends_on_steps TEXT,                     -- JSON array of step numbers

    -- Step Execution
    status TEXT DEFAULT 'PENDING',             -- PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_notes TEXT,

    -- Step Output
    step_output TEXT,                          -- What was produced
    files_modified TEXT,                       -- JSON array of files changed
    commands_executed TEXT,                    -- JSON array of commands run

    -- Step Validation
    validation_passed BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks_registry(task_id)
);

-- Task dependencies (explicit dependency tracking)
CREATE TABLE IF NOT EXISTS task_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_task_id TEXT NOT NULL,              -- Task that depends
    target_task_id TEXT NOT NULL,              -- Task being depended on

    -- Dependency Info
    dependency_type TEXT NOT NULL,             -- REQUIRES, BLOCKS, OPTIONAL, SOFT
    dependency_reason TEXT NOT NULL,           -- Why this dependency exists
    is_critical BOOLEAN DEFAULT TRUE,          -- Must be satisfied?

    -- Status
    is_satisfied BOOLEAN DEFAULT FALSE,        -- Is dependency met?
    satisfied_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_task_id) REFERENCES tasks_registry(task_id),
    FOREIGN KEY (target_task_id) REFERENCES tasks_registry(task_id)
);

-- Task validation rules (automated validation)
CREATE TABLE IF NOT EXISTS task_validation_rules (
    rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,

    -- Rule Definition
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,                   -- file_exists, command_succeeds, output_matches, quality_check
    rule_description TEXT NOT NULL,

    -- Rule Configuration
    validation_command TEXT,                   -- Command to run
    expected_result TEXT,                      -- What we expect
    validation_script TEXT,                    -- Script to execute

    -- Rule Execution
    is_required BOOLEAN DEFAULT TRUE,          -- Must pass?
    last_run_at TIMESTAMP,
    last_result TEXT,                          -- PASS, FAIL, ERROR
    last_output TEXT,                          -- Output from validation

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks_registry(task_id)
);

-- Task resources (files, docs, context needed)
CREATE TABLE IF NOT EXISTS task_resources (
    resource_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,

    -- Resource Info
    resource_type TEXT NOT NULL,               -- file, doc, url, snippet, prompt, context
    resource_identifier TEXT NOT NULL,         -- Path, URL, ID
    resource_name TEXT,
    resource_description TEXT,

    -- Usage
    is_required BOOLEAN DEFAULT TRUE,          -- Must have?
    usage_context TEXT,                        -- When/why to use this

    -- Status
    is_available BOOLEAN DEFAULT TRUE,
    last_accessed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks_registry(task_id)
);

-- Task agents (agent interaction history)
CREATE TABLE IF NOT EXISTS task_agents (
    interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,

    -- Interaction Info
    interaction_type TEXT NOT NULL,            -- claimed, worked_on, completed, failed, reviewed, assisted
    interaction_notes TEXT,

    -- Time Tracking
    time_spent_minutes REAL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,

    -- Output
    contribution TEXT,                         -- What agent did
    changes_made TEXT,                         -- JSON array of changes

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks_registry(task_id)
);

-- Task templates (reusable task patterns)
CREATE TABLE IF NOT EXISTS task_templates (
    template_id TEXT PRIMARY KEY,              -- e.g. "react-component-task"
    template_name TEXT NOT NULL,
    template_description TEXT,

    -- Template Content
    task_type TEXT NOT NULL,
    task_category TEXT NOT NULL,
    template_instructions TEXT NOT NULL,       -- Instructions with {{variables}}
    template_acceptance_criteria TEXT NOT NULL,
    template_steps TEXT,                       -- JSON array of steps

    -- Template Configuration
    required_variables TEXT,                   -- JSON array of variables needed
    applies_to_stack TEXT,                     -- JSON array of tech stacks
    complexity TEXT DEFAULT 'MEDIUM',
    estimated_hours REAL,

    -- Template Usage
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,
    avg_completion_hours REAL,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_spec ON tasks_registry(spec_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks_registry(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks_registry(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks_registry(priority, status);
CREATE INDEX IF NOT EXISTS idx_task_steps_task ON task_execution_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_source ON task_dependencies(source_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_target ON task_dependencies(target_task_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Ready tasks (can be worked on now)
CREATE VIEW IF NOT EXISTS ready_tasks AS
SELECT
    t.task_id,
    t.task_name,
    t.spec_id,
    t.required_role,
    t.priority,
    t.complexity,
    t.estimated_hours,
    t.vision_context,
    t.business_value,
    COUNT(td.dependency_id) as total_dependencies,
    SUM(CASE WHEN td.is_satisfied THEN 1 ELSE 0 END) as satisfied_dependencies
FROM tasks_registry t
LEFT JOIN task_dependencies td ON t.task_id = td.source_task_id
WHERE t.status = 'PENDING'
AND t.is_blocked = FALSE
GROUP BY t.task_id
HAVING COUNT(td.dependency_id) = 0
    OR COUNT(td.dependency_id) = SUM(CASE WHEN td.is_satisfied THEN 1 ELSE 0 END);

-- Blocked tasks (waiting on dependencies)
CREATE VIEW IF NOT EXISTS blocked_tasks AS
SELECT
    t.task_id,
    t.task_name,
    t.spec_id,
    t.blocked_reason,
    t.required_role,
    COUNT(td.dependency_id) as total_dependencies,
    SUM(CASE WHEN NOT td.is_satisfied THEN 1 ELSE 0 END) as unsatisfied_dependencies,
    GROUP_CONCAT(CASE WHEN NOT td.is_satisfied THEN td.target_task_id END) as blocking_tasks
FROM tasks_registry t
LEFT JOIN task_dependencies td ON t.task_id = td.source_task_id
WHERE t.status = 'PENDING'
AND (t.is_blocked = TRUE
     OR EXISTS (
         SELECT 1 FROM task_dependencies td2
         WHERE td2.source_task_id = t.task_id
         AND td2.is_satisfied = FALSE
     ))
GROUP BY t.task_id;

-- Task progress dashboard
CREATE VIEW IF NOT EXISTS task_progress_dashboard AS
SELECT
    s.spec_id,
    s.spec_name,
    COUNT(DISTINCT t.task_id) as total_tasks,
    SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_tasks,
    SUM(CASE WHEN t.status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked_tasks,
    SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END) as pending_tasks,
    ROUND(CAST(SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(COUNT(t.task_id), 0) * 100, 1) as completion_percentage,
    AVG(t.overall_quality_score) as avg_quality_score,
    SUM(t.estimated_hours) as total_estimated_hours,
    SUM(t.actual_hours) as total_actual_hours
FROM specs_registry s
LEFT JOIN tasks_registry t ON s.spec_id = t.spec_id
GROUP BY s.spec_id;

-- Agent workload view
CREATE VIEW IF NOT EXISTS agent_workload AS
SELECT
    assigned_agent,
    COUNT(*) as assigned_tasks,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as active_tasks,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(estimated_hours) as total_estimated_hours,
    SUM(actual_hours) as total_actual_hours,
    AVG(overall_quality_score) as avg_quality_score
FROM tasks_registry
WHERE assigned_agent IS NOT NULL
GROUP BY assigned_agent;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update task timestamp
CREATE TRIGGER IF NOT EXISTS update_task_timestamp
AFTER UPDATE ON tasks_registry
FOR EACH ROW
BEGIN
    UPDATE tasks_registry SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id;
END;

-- Auto-update task status based on dependencies
CREATE TRIGGER IF NOT EXISTS check_task_dependencies
AFTER UPDATE ON task_dependencies
FOR EACH ROW
WHEN NEW.is_satisfied = TRUE
BEGIN
    -- Check if all dependencies for the source task are now satisfied
    UPDATE tasks_registry
    SET status = 'READY'
    WHERE task_id = NEW.source_task_id
    AND status = 'BLOCKED'
    AND NOT EXISTS (
        SELECT 1 FROM task_dependencies
        WHERE source_task_id = NEW.source_task_id
        AND is_satisfied = FALSE
    );
END;

-- Mark dependent tasks as satisfied when task completes
CREATE TRIGGER IF NOT EXISTS satisfy_dependencies_on_completion
AFTER UPDATE ON tasks_registry
FOR EACH ROW
WHEN NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED'
BEGIN
    UPDATE task_dependencies
    SET is_satisfied = TRUE,
        satisfied_at = CURRENT_TIMESTAMP
    WHERE target_task_id = NEW.task_id;
END;

-- Calculate overall quality score
CREATE TRIGGER IF NOT EXISTS calculate_quality_score
AFTER UPDATE ON tasks_registry
FOR EACH ROW
WHEN NEW.status = 'COMPLETED'
BEGIN
    UPDATE tasks_registry
    SET overall_quality_score = (
        (COALESCE(code_quality_score, 0) * 0.4) +
        (COALESCE(test_coverage, 0) * 0.3) +
        (COALESCE(documentation_score, 0) * 0.3)
    )
    WHERE task_id = NEW.task_id;
END;

-- ============================================================================
-- Sample Task Templates
-- ============================================================================

-- Template: React Component Task
INSERT OR IGNORE INTO task_templates (
    template_id,
    template_name,
    template_description,
    task_type,
    task_category,
    template_instructions,
    template_acceptance_criteria,
    required_variables,
    applies_to_stack,
    complexity,
    estimated_hours
) VALUES (
    'react-component-task',
    'React Component Implementation',
    'Standard template for creating a React component',
    'feature',
    'frontend',
    'Create a React component called {{component_name}} that {{component_purpose}}.

The component should:
1. Be located at: {{component_path}}
2. Accept props: {{component_props}}
3. Implement functionality: {{component_functionality}}
4. Follow design specs: {{design_specs}}
5. Include TypeScript types
6. Be fully responsive
7. Include accessibility features (ARIA labels)
8. Be tested with Jest + React Testing Library

Use Tailwind CSS for styling.
Follow the project''s component structure and naming conventions.',
    '[
        "Component renders without errors",
        "All props are properly typed",
        "Component is responsive on mobile, tablet, desktop",
        "Accessibility score > 95%",
        "Unit tests cover > 80% of code",
        "Component matches design specs",
        "No console errors or warnings"
    ]',
    '["component_name", "component_purpose", "component_path", "component_props", "component_functionality", "design_specs"]',
    '["React", "Next.js", "TypeScript", "Tailwind CSS"]',
    'MEDIUM',
    4.0
);

-- Template: API Endpoint Task
INSERT OR IGNORE INTO task_templates (
    template_id,
    template_name,
    template_description,
    task_type,
    task_category,
    template_instructions,
    template_acceptance_criteria,
    required_variables,
    applies_to_stack,
    complexity,
    estimated_hours
) VALUES (
    'api-endpoint-task',
    'API Endpoint Implementation',
    'Standard template for creating an API endpoint',
    'feature',
    'backend',
    'Create an API endpoint: {{endpoint_method}} {{endpoint_path}}

Purpose: {{endpoint_purpose}}

The endpoint should:
1. Accept request: {{request_format}}
2. Validate input using: {{validation_rules}}
3. Perform operation: {{operation_logic}}
4. Return response: {{response_format}}
5. Handle errors: {{error_handling}}
6. Include authentication: {{auth_requirements}}
7. Be documented with OpenAPI/Swagger
8. Include integration tests

Follow RESTful conventions and project API patterns.',
    '[
        "Endpoint returns correct response format",
        "All inputs are validated",
        "Authentication is enforced",
        "Error handling covers all edge cases",
        "Integration tests pass",
        "API documentation is complete",
        "Response time < 200ms",
        "No security vulnerabilities"
    ]',
    '["endpoint_method", "endpoint_path", "endpoint_purpose", "request_format", "validation_rules", "operation_logic", "response_format", "error_handling", "auth_requirements"]',
    '["Node.js", "Express", "FastAPI", "Next.js API Routes"]',
    'MEDIUM',
    5.0
);

-- Template: Database Schema Task
INSERT OR IGNORE INTO task_templates (
    template_id,
    template_name,
    template_description,
    task_type,
    task_category,
    template_instructions,
    template_acceptance_criteria,
    required_variables,
    applies_to_stack,
    complexity,
    estimated_hours
) VALUES (
    'database-schema-task',
    'Database Schema Definition',
    'Standard template for creating database schema',
    'feature',
    'database',
    'Create database schema for: {{entity_name}}

The schema should:
1. Define table structure: {{table_structure}}
2. Include primary keys and indexes: {{keys_and_indexes}}
3. Define foreign key relationships: {{relationships}}
4. Add constraints and validations: {{constraints}}
5. Include timestamps (created_at, updated_at)
6. Add triggers if needed: {{triggers}}
7. Create views if needed: {{views}}
8. Include migration script
9. Add seed data for development

Follow project database conventions and naming patterns.',
    '[
        "Migration script runs without errors",
        "All constraints are enforced",
        "Indexes improve query performance",
        "Foreign keys maintain referential integrity",
        "Schema supports required queries",
        "Rollback script is provided",
        "Documentation is complete"
    ]',
    '["entity_name", "table_structure", "keys_and_indexes", "relationships", "constraints", "triggers", "views"]',
    '["PostgreSQL", "MySQL", "SQLite", "Prisma", "Drizzle"]',
    'MEDIUM',
    3.0
);
