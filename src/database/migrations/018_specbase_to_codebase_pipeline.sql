-- ============================================================================
-- SPECBASE-TO-CODEBASE PIPELINE - Generative Development System
-- ============================================================================
-- Purpose: Generate codebases from specifications through orchestrated tasks
-- Created: 2025-10-12
-- Part of: Central-MCP Atomic Entities Infrastructure
-- Vision: SPEC → TASKS → CODE (forward flow, deterministic generation)
-- ============================================================================
-- This is THE CORE of CentralMCP.net's vision:
-- "Minimum specification → Full commercial application"
-- ============================================================================

-- Generated codebases registry
CREATE TABLE IF NOT EXISTS generated_codebases (
    codebase_id TEXT PRIMARY KEY,              -- e.g. "ecommerce-app-v1", "crm-system-v2"
    codebase_name TEXT NOT NULL,
    project_id TEXT,                           -- Associated project (if any)

    -- Source Specification
    spec_id TEXT NOT NULL,                     -- Specification being implemented
    spec_version TEXT,                         -- Version of spec at generation time

    -- Generation Status
    generation_status TEXT DEFAULT 'PENDING',  -- PENDING, PLANNING, GENERATING, VALIDATING, COMPLETE, FAILED
    generation_method TEXT DEFAULT 'orchestrated', -- orchestrated, llm_direct, hybrid

    -- Output
    output_path TEXT,                          -- Where generated code goes
    output_structure TEXT,                     -- JSON: directory structure

    -- Metrics
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    total_files_generated INTEGER DEFAULT 0,
    total_lines_generated INTEGER DEFAULT 0,
    total_size_bytes INTEGER DEFAULT 0,

    -- Quality
    build_status TEXT DEFAULT 'NOT_ATTEMPTED', -- NOT_ATTEMPTED, PASSING, FAILING
    test_status TEXT DEFAULT 'NOT_ATTEMPTED',  -- NOT_ATTEMPTED, PASSING, FAILING
    quality_score REAL DEFAULT 0.0,            -- 0-1 score
    code_coverage REAL DEFAULT 0.0,            -- 0-1 test coverage

    -- Validation
    last_validation_at TIMESTAMP,
    validation_errors TEXT,                    -- JSON array of errors
    is_deployable BOOLEAN DEFAULT FALSE,

    -- Metadata
    generation_strategy TEXT,                  -- JSON: how it was generated
    generated_by TEXT,                         -- agent_id or automation
    generation_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generation_started_at TIMESTAMP,
    generation_completed_at TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spec_id) REFERENCES specifications_registry(spec_id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Generation tasks (atomic code generation steps)
CREATE TABLE IF NOT EXISTS generation_tasks (
    task_id TEXT PRIMARY KEY,                  -- e.g. "GT-ecommerce-001"
    codebase_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    task_description TEXT,

    -- Task Type
    task_type TEXT NOT NULL,                   -- component, api_endpoint, database_schema, config, test, documentation
    task_category TEXT NOT NULL,               -- frontend, backend, database, infrastructure, testing

    -- Dependencies
    depends_on_tasks TEXT,                     -- JSON array of task_ids
    blocks_tasks TEXT,                         -- JSON array of task_ids
    dependency_order INTEGER DEFAULT 0,        -- Execution order based on deps

    -- Generation Details
    template_used TEXT,                        -- Template or snippet used
    prompt_used TEXT,                          -- Prompt ID used for generation
    context_provided TEXT,                     -- JSON: context given to generator

    -- Output
    output_files TEXT,                         -- JSON array of file paths
    output_code TEXT,                          -- Generated code (for single-file tasks)
    output_size_bytes INTEGER DEFAULT 0,
    output_lines INTEGER DEFAULT 0,

    -- Assignment
    assigned_agent TEXT,                       -- Which agent handles this
    assigned_at TIMESTAMP,

    -- Status
    status TEXT DEFAULT 'PENDING',             -- PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED
    priority INTEGER DEFAULT 50,               -- Higher = more important

    -- Progress
    completion_percentage INTEGER DEFAULT 0,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,

    -- Validation
    is_valid BOOLEAN DEFAULT FALSE,            -- Does generated code compile/parse?
    validation_errors TEXT,                    -- JSON array of errors
    needs_human_review BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    FOREIGN KEY (codebase_id) REFERENCES generated_codebases(codebase_id)
);

-- Task execution logs (what happened during generation)
CREATE TABLE IF NOT EXISTS task_execution_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,

    -- Execution Details
    execution_method TEXT NOT NULL,            -- llm_generation, template_expansion, snippet_copy, manual
    model_used TEXT,                           -- gpt-4, claude-3-opus, etc.

    -- Input
    input_context TEXT,                        -- JSON: what was provided
    input_tokens INTEGER,

    -- Output
    output_generated TEXT,                     -- Generated code/text
    output_tokens INTEGER,

    -- Performance
    duration_seconds REAL,
    cost REAL,                                 -- Estimated cost in USD

    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    -- Quality
    confidence_score REAL,                     -- 0-1 confidence in generation
    requires_refinement BOOLEAN DEFAULT FALSE,

    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_by TEXT,

    FOREIGN KEY (task_id) REFERENCES generation_tasks(task_id)
);

-- Generation strategies (how to generate code)
CREATE TABLE IF NOT EXISTS generation_strategies (
    strategy_id TEXT PRIMARY KEY,              -- e.g. "nextjs-app-standard", "fastapi-crud"
    strategy_name TEXT NOT NULL,
    description TEXT,

    -- Applicability
    applies_to_types TEXT,                     -- JSON array: ["webapp", "api"]
    applies_to_stacks TEXT,                    -- JSON array: ["Next.js", "FastAPI"]

    -- Strategy Definition
    task_template TEXT NOT NULL,               -- JSON: task breakdown template
    file_structure TEXT NOT NULL,              -- JSON: directory structure to create
    required_snippets TEXT,                    -- JSON array: snippet IDs needed
    required_prompts TEXT,                     -- JSON array: prompt IDs needed

    -- Ordering
    task_sequence TEXT,                        -- JSON array: task execution order
    parallelizable_groups TEXT,                -- JSON: which tasks can run in parallel

    -- Validation
    validation_rules TEXT,                     -- JSON: how to validate result
    quality_criteria TEXT,                     -- JSON: quality requirements

    -- Success Metrics
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,             -- 0-1 based on builds passing
    avg_generation_time_minutes REAL,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Generated files registry
CREATE TABLE IF NOT EXISTS generated_files (
    file_id INTEGER PRIMARY KEY AUTOINCREMENT,
    codebase_id TEXT NOT NULL,
    task_id TEXT,                              -- Task that generated this file

    -- File Info
    file_path TEXT NOT NULL,                   -- Relative to codebase root
    file_type TEXT NOT NULL,                   -- component, api, schema, config, test
    file_language TEXT,                        -- typescript, javascript, python, sql

    -- Generation
    generation_method TEXT NOT NULL,           -- llm, template, snippet, manual
    template_id TEXT,                          -- If from template
    snippet_id TEXT,                           -- If from snippet
    prompt_id TEXT,                            -- If LLM-generated

    -- Content
    content TEXT NOT NULL,                     -- File content
    content_hash TEXT,                         -- SHA-256 hash
    size_bytes INTEGER DEFAULT 0,
    line_count INTEGER DEFAULT 0,

    -- Quality
    is_valid BOOLEAN DEFAULT TRUE,             -- Parses/compiles?
    validation_errors TEXT,                    -- JSON array
    quality_score REAL DEFAULT 0.0,            -- 0-1 score

    -- Version
    version INTEGER DEFAULT 1,                 -- File version (if regenerated)
    supersedes_file_id INTEGER,                -- Previous version

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by TEXT,

    FOREIGN KEY (codebase_id) REFERENCES generated_codebases(codebase_id),
    FOREIGN KEY (task_id) REFERENCES generation_tasks(task_id),
    FOREIGN KEY (template_id) REFERENCES code_templates(template_id),
    FOREIGN KEY (snippet_id) REFERENCES snippets_registry(snippet_id),
    FOREIGN KEY (prompt_id) REFERENCES prompts_registry(prompt_id)
);

-- Code templates (reusable file templates)
CREATE TABLE IF NOT EXISTS code_templates (
    template_id TEXT PRIMARY KEY,              -- e.g. "nextjs-page-component", "express-api-route"
    template_name TEXT NOT NULL,
    description TEXT,

    -- Template Content
    template_code TEXT NOT NULL,               -- Code with {{variables}}
    template_language TEXT NOT NULL,           -- typescript, javascript, python, etc.
    template_type TEXT NOT NULL,               -- component, api, schema, config

    -- Variables
    variables TEXT,                            -- JSON array: {name, type, required, default}
    example_output TEXT,                       -- Example with variables filled

    -- Applicability
    applies_to_frameworks TEXT,                -- JSON array: ["Next.js", "React"]
    applies_to_patterns TEXT,                  -- JSON array: ["CRUD", "Auth"]

    -- Quality
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,             -- Based on validation
    avg_quality_score REAL DEFAULT 0.0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Generation sessions (complete generation runs)
CREATE TABLE IF NOT EXISTS generation_sessions (
    session_id TEXT PRIMARY KEY,
    codebase_id TEXT NOT NULL,

    -- Session Info
    session_type TEXT NOT NULL,                -- full_generation, incremental, refinement
    trigger TEXT NOT NULL,                     -- manual, automated, spec_update

    -- Progress
    total_tasks_planned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    current_phase TEXT,                        -- planning, generating, validating, complete

    -- Results
    files_generated INTEGER DEFAULT 0,
    lines_generated INTEGER DEFAULT 0,
    validation_passed BOOLEAN DEFAULT FALSE,
    build_passed BOOLEAN DEFAULT FALSE,

    -- Performance
    duration_minutes REAL,
    total_cost REAL,                           -- Total cost in USD
    total_tokens_used INTEGER,

    -- Status
    status TEXT DEFAULT 'IN_PROGRESS',         -- IN_PROGRESS, COMPLETED, FAILED, PAUSED
    error_message TEXT,

    -- Metadata
    triggered_by TEXT,                         -- agent_id, user_id
    notes TEXT,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    FOREIGN KEY (codebase_id) REFERENCES generated_codebases(codebase_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_codebases_status ON generated_codebases(generation_status);
CREATE INDEX IF NOT EXISTS idx_generated_codebases_spec ON generated_codebases(spec_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_codebase ON generation_tasks(codebase_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_agent ON generation_tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_task ON task_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_generated_files_codebase ON generated_files(codebase_id);
CREATE INDEX IF NOT EXISTS idx_generated_files_task ON generated_files(task_id);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_codebase ON generation_sessions(codebase_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Codebases dashboard
CREATE VIEW IF NOT EXISTS codebases_dashboard AS
SELECT
    c.codebase_id,
    c.codebase_name,
    s.spec_name as source_spec,
    c.generation_status,
    c.total_tasks,
    c.completed_tasks,
    c.failed_tasks,
    ROUND(CAST(c.completed_tasks AS REAL) / NULLIF(c.total_tasks, 0) * 100, 1) as completion_pct,
    c.total_files_generated,
    c.build_status,
    c.quality_score,
    c.is_deployable,
    c.generation_started_at,
    c.generation_completed_at
FROM generated_codebases c
LEFT JOIN specifications_registry s ON c.spec_id = s.spec_id
ORDER BY c.generation_started_at DESC;

-- Active generation tasks
CREATE VIEW IF NOT EXISTS active_generation_tasks AS
SELECT
    t.task_id,
    t.task_name,
    c.codebase_name,
    t.task_type,
    t.status,
    t.priority,
    t.assigned_agent,
    t.completion_percentage,
    t.created_at
FROM generation_tasks t
JOIN generated_codebases c ON t.codebase_id = c.codebase_id
WHERE t.status IN ('PENDING', 'IN_PROGRESS')
ORDER BY t.priority DESC, t.dependency_order ASC;

-- Generation statistics
CREATE VIEW IF NOT EXISTS generation_stats AS
SELECT
    c.codebase_id,
    c.codebase_name,
    COUNT(DISTINCT t.task_id) as total_tasks,
    SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN t.status = 'FAILED' THEN 1 ELSE 0 END) as failed_tasks,
    COUNT(DISTINCT f.file_id) as files_generated,
    SUM(f.line_count) as total_lines,
    SUM(f.size_bytes) as total_bytes,
    AVG(t.actual_duration_minutes) as avg_task_duration,
    SUM(COALESCE(l.cost, 0)) as total_cost
FROM generated_codebases c
LEFT JOIN generation_tasks t ON c.codebase_id = t.codebase_id
LEFT JOIN generated_files f ON c.codebase_id = f.codebase_id
LEFT JOIN task_execution_logs l ON t.task_id = l.task_id
GROUP BY c.codebase_id;

-- Recent generation activity
CREATE VIEW IF NOT EXISTS recent_generation_activity AS
SELECT
    gs.session_id,
    c.codebase_name,
    gs.session_type,
    gs.tasks_completed,
    gs.tasks_failed,
    gs.files_generated,
    gs.status,
    gs.started_at,
    gs.completed_at
FROM generation_sessions gs
JOIN generated_codebases c ON gs.codebase_id = c.codebase_id
ORDER BY gs.started_at DESC
LIMIT 50;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update codebase timestamp
CREATE TRIGGER IF NOT EXISTS update_codebase_timestamp
AFTER UPDATE ON generated_codebases
FOR EACH ROW
BEGIN
    UPDATE generated_codebases SET last_updated_at = CURRENT_TIMESTAMP WHERE codebase_id = NEW.codebase_id;
END;

-- Update codebase task counts
CREATE TRIGGER IF NOT EXISTS update_codebase_task_counts
AFTER UPDATE OF status ON generation_tasks
FOR EACH ROW
BEGIN
    UPDATE generated_codebases
    SET completed_tasks = (
        SELECT COUNT(*) FROM generation_tasks
        WHERE codebase_id = NEW.codebase_id AND status = 'COMPLETED'
    ),
    failed_tasks = (
        SELECT COUNT(*) FROM generation_tasks
        WHERE codebase_id = NEW.codebase_id AND status = 'FAILED'
    )
    WHERE codebase_id = NEW.codebase_id;
END;

-- Update codebase file counts
CREATE TRIGGER IF NOT EXISTS update_codebase_file_counts
AFTER INSERT ON generated_files
FOR EACH ROW
BEGIN
    UPDATE generated_codebases
    SET total_files_generated = total_files_generated + 1,
        total_lines_generated = total_lines_generated + NEW.line_count,
        total_size_bytes = total_size_bytes + NEW.size_bytes
    WHERE codebase_id = NEW.codebase_id;
END;

-- ============================================================================
-- Default Generation Strategies
-- ============================================================================

-- Strategy: Next.js Web App (Standard)
INSERT OR IGNORE INTO generation_strategies (
    strategy_id, strategy_name, description,
    applies_to_types, applies_to_stacks,
    task_template, file_structure,
    is_active
) VALUES (
    'nextjs-webapp-standard',
    'Next.js Web App (Standard)',
    'Standard Next.js web application with TypeScript, Tailwind CSS, and React',
    '["webapp"]',
    '["Next.js", "React", "TypeScript"]',
    '[
        {"order": 1, "type": "config", "name": "Initialize package.json"},
        {"order": 2, "type": "config", "name": "Setup TypeScript config"},
        {"order": 3, "type": "config", "name": "Setup Tailwind config"},
        {"order": 4, "type": "database_schema", "name": "Define database schema"},
        {"order": 5, "type": "api_endpoint", "name": "Create API routes"},
        {"order": 6, "type": "component", "name": "Build React components"},
        {"order": 7, "type": "test", "name": "Write tests"},
        {"order": 8, "type": "documentation", "name": "Generate README"}
    ]',
    '{
        "root": ["package.json", "tsconfig.json", "tailwind.config.js", "next.config.js"],
        "src/": ["app/", "components/", "lib/", "types/"],
        "src/app/": ["layout.tsx", "page.tsx", "api/"],
        "src/components/": [],
        "public/": ["images/", "fonts/"]
    }',
    TRUE
);

-- ============================================================================
-- Default Code Templates
-- ============================================================================

-- Template: Next.js Page Component
INSERT OR IGNORE INTO code_templates (
    template_id, template_name, description,
    template_code, template_language, template_type,
    variables, applies_to_frameworks, is_active
) VALUES (
    'nextjs-page-component',
    'Next.js Page Component',
    'Standard Next.js page component with TypeScript',
    'import { Metadata } from ''next'';

export const metadata: Metadata = {
  title: ''{{page_title}}'',
  description: ''{{page_description}}'',
};

export default function {{component_name}}Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">{{page_title}}</h1>
      <p>{{page_description}}</p>
    </div>
  );
}',
    'typescript',
    'component',
    '[{"name": "page_title", "type": "string", "required": true}, {"name": "page_description", "type": "string", "required": true}, {"name": "component_name", "type": "string", "required": true}]',
    '["Next.js", "React"]',
    TRUE
);
