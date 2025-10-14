-- ============================================================================
-- CODEBASE INGESTION PIPELINE - Product Extraction System
-- ============================================================================
-- Purpose: Extract deliverable "products" from project codebases
-- Created: 2025-10-12
-- Part of: Central-MCP Atomic Entities Infrastructure
-- Vision: PROJECT → PRODUCT (deployable consolidation)
-- ============================================================================

-- Products registry (extracted deliverables)
CREATE TABLE IF NOT EXISTS products_registry (
    product_id TEXT PRIMARY KEY,                -- e.g. "central-mcp-dashboard", "localbrain-app"
    product_name TEXT NOT NULL,                 -- Display name
    project_id TEXT NOT NULL,                   -- Source project
    product_type TEXT NOT NULL,                 -- webapp, api, cli_tool, library, mobile_app

    -- Paths
    source_path TEXT NOT NULL,                  -- Original project path
    product_path TEXT NOT NULL,                 -- Extracted product path (e.g. project/app-name/)

    -- Product Info
    description TEXT NOT NULL,                  -- What this product does
    purpose TEXT,                               -- Why it exists
    target_users TEXT,                          -- Who uses it

    -- Tech Stack
    tech_stack TEXT,                            -- JSON array
    primary_language TEXT,
    framework TEXT,
    build_tool TEXT,                            -- webpack, vite, tsc, etc.
    package_manager TEXT,                       -- npm, yarn, pnpm, pip, etc.

    -- Status
    extraction_status TEXT DEFAULT 'PENDING',   -- PENDING, IN_PROGRESS, EXTRACTED, FAILED
    build_status TEXT DEFAULT 'UNKNOWN',        -- UNKNOWN, PASSING, FAILING
    deployment_status TEXT DEFAULT 'NOT_DEPLOYED', -- NOT_DEPLOYED, STAGING, PRODUCTION

    -- Metrics
    total_files INTEGER DEFAULT 0,
    essential_files INTEGER DEFAULT 0,          -- Files in product
    excluded_files INTEGER DEFAULT 0,           -- Files NOT in product
    total_size_bytes INTEGER DEFAULT 0,
    product_size_bytes INTEGER DEFAULT 0,

    -- Quality
    has_package_json BOOLEAN DEFAULT FALSE,
    has_dockerfile BOOLEAN DEFAULT FALSE,
    has_readme BOOLEAN DEFAULT FALSE,
    has_tests BOOLEAN DEFAULT FALSE,
    has_ci_cd BOOLEAN DEFAULT FALSE,
    is_deployable BOOLEAN DEFAULT FALSE,
    quality_score REAL DEFAULT 0.0,             -- 0-1 score

    -- Dependencies
    total_dependencies INTEGER DEFAULT 0,
    production_dependencies INTEGER DEFAULT 0,
    dev_dependencies INTEGER DEFAULT 0,

    -- Extraction History
    extraction_method TEXT,                     -- manual, automated, llm_assisted
    extracted_by TEXT,                          -- agent_id or user_id
    extraction_notes TEXT,

    -- Validation
    last_build_attempt TIMESTAMP,
    last_build_success TIMESTAMP,
    build_errors TEXT,

    -- Deployment
    deployment_url TEXT,
    deployment_command TEXT,
    deployment_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extracted_at TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- File classifications (what's included in product)
CREATE TABLE IF NOT EXISTS product_files (
    file_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,

    -- File Info
    file_path TEXT NOT NULL,                    -- Relative to product root
    original_path TEXT NOT NULL,                -- Original location in project
    file_type TEXT NOT NULL,                    -- source, config, asset, test, doc
    file_category TEXT NOT NULL,                -- ESSENTIAL, OPTIONAL, EXCLUDED

    -- Classification
    classification_method TEXT,                 -- pattern, llm, manual
    classification_reason TEXT,                 -- Why included/excluded
    classified_by TEXT,

    -- Metrics
    file_size_bytes INTEGER DEFAULT 0,
    line_count INTEGER DEFAULT 0,

    -- Status
    is_included BOOLEAN DEFAULT TRUE,           -- In product or not
    is_modified BOOLEAN DEFAULT FALSE,          -- Was it changed during extraction?
    modification_notes TEXT,

    -- Validation
    is_valid BOOLEAN DEFAULT TRUE,              -- Does it parse/compile?
    validation_errors TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products_registry(product_id)
);

-- Extraction rules (patterns for classification)
CREATE TABLE IF NOT EXISTS extraction_rules (
    rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,                    -- include, exclude, transform

    -- Pattern Matching
    path_pattern TEXT,                          -- Glob pattern (e.g. "src/**/*.ts")
    file_pattern TEXT,                          -- File name pattern
    content_pattern TEXT,                       -- Content regex

    -- Classification
    target_category TEXT NOT NULL,              -- ESSENTIAL, OPTIONAL, EXCLUDED
    reason TEXT,                                -- Why this rule exists

    -- Application
    applies_to_types TEXT,                      -- JSON array of product_types
    priority INTEGER DEFAULT 50,                -- Higher priority = applied first

    -- Examples
    example_matches TEXT,                       -- JSON array of example paths
    example_non_matches TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Extraction sessions (history of extraction runs)
CREATE TABLE IF NOT EXISTS extraction_sessions (
    session_id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,

    -- Session Info
    extraction_type TEXT NOT NULL,              -- full, incremental, cleanup
    extraction_method TEXT NOT NULL,            -- manual, automated, llm_assisted

    -- Pre-Extraction State
    files_before INTEGER DEFAULT 0,
    size_before_bytes INTEGER DEFAULT 0,

    -- Post-Extraction State
    files_after INTEGER DEFAULT 0,
    size_after_bytes INTEGER DEFAULT 0,
    files_included INTEGER DEFAULT 0,
    files_excluded INTEGER DEFAULT 0,
    files_modified INTEGER DEFAULT 0,

    -- Results
    status TEXT DEFAULT 'IN_PROGRESS',          -- IN_PROGRESS, SUCCESS, FAILED, ROLLED_BACK
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,

    -- Validation
    build_attempted BOOLEAN DEFAULT FALSE,
    build_passed BOOLEAN DEFAULT FALSE,
    build_output TEXT,

    -- Metrics
    duration_seconds REAL,
    files_per_second REAL,

    -- Context
    triggered_by TEXT,                          -- agent_id, user_id, automation
    notes TEXT,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products_registry(product_id)
);

-- Product dependencies (what the product needs)
CREATE TABLE IF NOT EXISTS product_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,

    -- Dependency Info
    dependency_name TEXT NOT NULL,
    dependency_version TEXT,
    dependency_type TEXT NOT NULL,              -- npm, pip, system, service
    scope TEXT DEFAULT 'production',            -- production, development, optional

    -- Installation
    install_command TEXT,
    is_installed BOOLEAN DEFAULT FALSE,

    -- Validation
    is_required BOOLEAN DEFAULT TRUE,
    last_validated TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products_registry(product_id)
);

-- Product build configs
CREATE TABLE IF NOT EXISTS product_build_configs (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,

    -- Build Info
    config_type TEXT NOT NULL,                  -- build, dev, test, deploy
    config_name TEXT NOT NULL,                  -- e.g. "production", "staging"

    -- Commands
    build_command TEXT,
    dev_command TEXT,
    test_command TEXT,
    deploy_command TEXT,

    -- Environment
    env_vars TEXT,                              -- JSON object
    required_tools TEXT,                        -- JSON array

    -- Validation
    is_tested BOOLEAN DEFAULT FALSE,
    last_test_success TIMESTAMP,
    test_output TEXT,

    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products_registry(product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_project ON products_registry(project_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products_registry(extraction_status);
CREATE INDEX IF NOT EXISTS idx_product_files_product ON product_files(product_id);
CREATE INDEX IF NOT EXISTS idx_product_files_category ON product_files(file_category);
CREATE INDEX IF NOT EXISTS idx_extraction_rules_type ON extraction_rules(rule_type, is_active);
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_product ON extraction_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_dependencies_product ON product_dependencies(product_id);
CREATE INDEX IF NOT EXISTS idx_product_build_configs_product ON product_build_configs(product_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Products dashboard
CREATE VIEW IF NOT EXISTS products_dashboard AS
SELECT
    p.product_id,
    p.product_name,
    p.product_type,
    pr.name as project_name,
    p.extraction_status,
    p.build_status,
    p.deployment_status,
    p.essential_files,
    p.total_dependencies,
    p.is_deployable,
    p.quality_score,
    p.deployment_url
FROM products_registry p
JOIN projects pr ON p.project_id = pr.id
ORDER BY p.quality_score DESC, p.product_name;

-- Extraction statistics
CREATE VIEW IF NOT EXISTS extraction_stats AS
SELECT
    p.product_id,
    p.product_name,
    COUNT(DISTINCT pf.file_id) as total_files,
    SUM(CASE WHEN pf.is_included THEN 1 ELSE 0 END) as included_files,
    SUM(CASE WHEN NOT pf.is_included THEN 1 ELSE 0 END) as excluded_files,
    SUM(pf.file_size_bytes) as total_size,
    SUM(CASE WHEN pf.is_included THEN pf.file_size_bytes ELSE 0 END) as product_size,
    ROUND(CAST(SUM(CASE WHEN pf.is_included THEN pf.file_size_bytes ELSE 0 END) AS REAL) /
          NULLIF(SUM(pf.file_size_bytes), 0) * 100, 1) as size_reduction_pct
FROM products_registry p
LEFT JOIN product_files pf ON p.product_id = pf.product_id
GROUP BY p.product_id;

-- File categories summary
CREATE VIEW IF NOT EXISTS file_categories_summary AS
SELECT
    product_id,
    file_category,
    COUNT(*) as file_count,
    SUM(file_size_bytes) as total_size,
    AVG(line_count) as avg_lines
FROM product_files
GROUP BY product_id, file_category
ORDER BY product_id, file_category;

-- Recent extractions
CREATE VIEW IF NOT EXISTS recent_extractions AS
SELECT
    es.session_id,
    p.product_name,
    es.extraction_type,
    es.extraction_method,
    es.files_included,
    es.files_excluded,
    es.status,
    es.build_passed,
    es.duration_seconds,
    es.started_at,
    es.completed_at
FROM extraction_sessions es
JOIN products_registry p ON es.product_id = p.product_id
ORDER BY es.started_at DESC
LIMIT 50;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update product timestamp
CREATE TRIGGER IF NOT EXISTS update_product_timestamp
AFTER UPDATE ON products_registry
FOR EACH ROW
BEGIN
    UPDATE products_registry SET updated_at = CURRENT_TIMESTAMP WHERE product_id = NEW.product_id;
END;

-- Update product file counts
CREATE TRIGGER IF NOT EXISTS update_product_file_counts
AFTER INSERT ON product_files
FOR EACH ROW
BEGIN
    UPDATE products_registry
    SET essential_files = (
        SELECT COUNT(*) FROM product_files
        WHERE product_id = NEW.product_id AND is_included = TRUE
    ),
    excluded_files = (
        SELECT COUNT(*) FROM product_files
        WHERE product_id = NEW.product_id AND is_included = FALSE
    ),
    total_files = (
        SELECT COUNT(*) FROM product_files
        WHERE product_id = NEW.product_id
    )
    WHERE product_id = NEW.product_id;
END;

-- ============================================================================
-- Default Extraction Rules (Pre-configured Patterns)
-- ============================================================================

-- INCLUDE: Source code files
INSERT OR IGNORE INTO extraction_rules (rule_name, rule_type, path_pattern, target_category, reason, applies_to_types, priority)
VALUES
('Include TypeScript Source', 'include', 'src/**/*.ts', 'ESSENTIAL', 'Main source code', '["webapp", "api", "cli_tool", "library"]', 90),
('Include TypeScript TSX', 'include', 'src/**/*.tsx', 'ESSENTIAL', 'React components', '["webapp"]', 90),
('Include JavaScript Source', 'include', 'src/**/*.js', 'ESSENTIAL', 'Main source code', '["webapp", "api", "cli_tool", "library"]', 90),
('Include JSX Components', 'include', 'src/**/*.jsx', 'ESSENTIAL', 'React components', '["webapp"]', 90),
('Include Python Source', 'include', 'src/**/*.py', 'ESSENTIAL', 'Python source code', '["api", "cli_tool", "library"]', 90);

-- INCLUDE: Configuration files
INSERT OR IGNORE INTO extraction_rules (rule_name, rule_type, file_pattern, target_category, reason, priority)
VALUES
('Include package.json', 'include', 'package.json', 'ESSENTIAL', 'Node.js dependencies', 80),
('Include tsconfig.json', 'include', 'tsconfig.json', 'ESSENTIAL', 'TypeScript config', 80),
('Include next.config.js', 'include', 'next.config.js', 'ESSENTIAL', 'Next.js config', 80),
('Include tailwind.config.js', 'include', 'tailwind.config.js', 'ESSENTIAL', 'Tailwind config', 80),
('Include .env.example', 'include', '.env.example', 'ESSENTIAL', 'Environment template', 70);

-- INCLUDE: Public assets
INSERT OR IGNORE INTO extraction_rules (rule_name, rule_type, path_pattern, target_category, reason, applies_to_types, priority)
VALUES
('Include Public Assets', 'include', 'public/**/*', 'ESSENTIAL', 'Static assets', '["webapp"]', 85);

-- EXCLUDE: Development files
INSERT OR IGNORE INTO extraction_rules (rule_name, rule_type, path_pattern, target_category, reason, priority)
VALUES
('Exclude Docs', 'exclude', 'docs/**/*', 'EXCLUDED', 'Documentation not needed in product', 70),
('Exclude Context Files', 'exclude', 'context/**/*', 'EXCLUDED', 'Development context files', 70),
('Exclude Examples', 'exclude', 'examples/**/*', 'EXCLUDED', 'Example code not for product', 60),
('Exclude Experiments', 'exclude', 'experiments/**/*', 'EXCLUDED', 'Experimental code', 60),
('Exclude Scripts', 'exclude', 'scripts/**/*', 'EXCLUDED', 'Development scripts', 60);

-- EXCLUDE: Build artifacts
INSERT OR IGNORE INTO extraction_rules (rule_name, rule_type, path_pattern, target_category, reason, priority)
VALUES
('Exclude node_modules', 'exclude', 'node_modules/**/*', 'EXCLUDED', 'Installed dependencies (reinstall from package.json)', 100),
('Exclude .next', 'exclude', '.next/**/*', 'EXCLUDED', 'Next.js build output', 100),
('Exclude dist', 'exclude', 'dist/**/*', 'EXCLUDED', 'Build output', 100),
('Exclude build', 'exclude', 'build/**/*', 'EXCLUDED', 'Build output', 100),
('Exclude coverage', 'exclude', 'coverage/**/*', 'EXCLUDED', 'Test coverage reports', 90);

-- EXCLUDE: Version control and IDE
INSERT OR IGNORE INTO extraction_rules (rule_name, rule_type, path_pattern, target_category, reason, priority)
VALUES
('Exclude .git', 'exclude', '.git/**/*', 'EXCLUDED', 'Git history (keep root .git)', 95),
('Exclude .vscode', 'exclude', '.vscode/**/*', 'EXCLUDED', 'VSCode settings', 90),
('Exclude .idea', 'exclude', '.idea/**/*', 'EXCLUDED', 'IntelliJ settings', 90);

-- OPTIONAL: Tests and documentation
INSERT OR IGNORE INTO extraction_rules (rule_name, rule_type, path_pattern, target_category, reason, priority)
VALUES
('Optional Tests', 'include', '**/*.test.ts', 'OPTIONAL', 'Unit tests (useful but not required for build)', 50),
('Optional README', 'include', 'README.md', 'OPTIONAL', 'Product documentation', 60);
