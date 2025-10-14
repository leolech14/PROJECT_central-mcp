-- 🗃️ CREATE VISION REGISTRY (Messages → Specifications)
-- Built: 2025-10-13 | Purpose: Transform user messages into technical specs with verifiable completion

BEGIN TRANSACTION;

-- =====================================================
-- VISION REGISTRY TABLE
-- =====================================================
CREATE TABLE vision_registry (
    -- METADATA
    vision_id TEXT PRIMARY KEY,
    source_message_id TEXT NOT NULL,           -- From messages table
    source_conversation_id TEXT NOT NULL,      -- From conversations table

    -- VISION EXTRACTION
    user_intent TEXT NOT NULL,                 -- Core user desire
    business_context TEXT,                     -- Business/environment context
    success_criteria TEXT NOT NULL,            -- What success looks like
    constraints TEXT,                          -- Limitations and boundaries

    -- SPECIFICATION GENERATION
    generated_spec_id TEXT NOT NULL,           -- Links to specs_registry
    spec_quality_score REAL DEFAULT 0.0,       -- 0-1 quality assessment
    spec_completeness_score REAL DEFAULT 0.0,  -- 0-1 completeness assessment

    -- LEVEL 1: CONTEXTUAL COMPLETION
    code_executed_successfully BOOLEAN DEFAULT FALSE,
    results_measured_and_documented BOOLEAN DEFAULT FALSE,
    quality_gates_passed BOOLEAN DEFAULT FALSE,
    no_technical_blockers_remaining BOOLEAN DEFAULT FALSE,
    honest_completion_percentage REAL DEFAULT 0.0,
    context_file_location TEXT,

    -- LEVEL 2: DEPLOYMENT COMPLETION
    infrastructure_connectivity_verified BOOLEAN DEFAULT FALSE,
    services_accessible_to_users BOOLEAN DEFAULT FALSE,
    configuration_operational BOOLEAN DEFAULT FALSE,
    environment_variables_set BOOLEAN DEFAULT FALSE,
    deployment_status TEXT DEFAULT 'NOT_DEPLOYED' CHECK (deployment_status IN ('NOT_DEPLOYED', 'DEPLOYING', 'DEPLOYED', 'FAILED')),
    deployment_url TEXT,

    -- LEVEL 3: PURPOSE FULFILLMENT
    intended_users_can_access_system BOOLEAN DEFAULT FALSE,
    business_processes_functional BOOLEAN DEFAULT FALSE,
    value_creation_mechanisms_active BOOLEAN DEFAULT FALSE,
    user_feedback_loops_operational BOOLEAN DEFAULT FALSE,
    active_user_count INTEGER DEFAULT 0,
    business_value_generated TEXT,

    -- LEVEL 4: ECOSYSTEM INTEGRATION
    inter_system_connections_active BOOLEAN DEFAULT FALSE,
    data_flows_established BOOLEAN DEFAULT FALSE,
    api_integrations_functional BOOLEAN DEFAULT FALSE,
    compound_value_generation BOOLEAN DEFAULT FALSE,
    ecosystem_impact_score REAL DEFAULT 0.0,

    -- VISION-SPECIFIC METRICS
    vision_clarity_score REAL DEFAULT 0.0,
    business_value_alignment REAL DEFAULT 0.0,
    technical_feasibility_score REAL DEFAULT 0.0,
    user_satisfaction_prediction REAL DEFAULT 0.0,

    -- PROCESS TRACKING
    status TEXT DEFAULT 'EXTRACTING' CHECK (status IN ('EXTRACTING', 'ANALYZING', 'SPECIFYING', 'COMPLETED', 'FAILED', 'BLOCKED')),
    extraction_confidence REAL DEFAULT 0.0,
    processing_stage TEXT DEFAULT 'INTENT_ANALYSIS',
    assigned_agent TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- QUALITY VALIDATION
    spec_validation_status TEXT DEFAULT 'NOT_VALIDATED' CHECK (spec_validation_status IN ('NOT_VALIDATED', 'VALIDATING', 'PASSED', 'FAILED')),
    validation_errors TEXT,                    -- JSON array of validation errors
    validation_warnings TEXT,                  -- JSON array of validation warnings

    -- FOREIGN KEYS
    FOREIGN KEY (source_message_id) REFERENCES messages(id),
    FOREIGN KEY (source_conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (generated_spec_id) REFERENCES specs_registry(spec_id)
);

-- =====================================================
-- IMPLEMENTATION GAP REGISTRY TABLE
-- =====================================================
CREATE TABLE implementation_gap_registry (
    -- METADATA
    gap_id TEXT PRIMARY KEY,
    source_spec_id TEXT NOT NULL,               -- From specs_registry
    target_codebase TEXT NOT NULL,              -- Which codebase/product

    -- GAP ANALYSIS
    gap_description TEXT NOT NULL,              -- What's missing
    gap_type TEXT NOT NULL CHECK (gap_type IN ('FEATURE', 'BUG', 'REFACTOR', 'TEST', 'DOC', 'DEPLOY')),
    gap_priority TEXT DEFAULT 'MEDIUM' CHECK (gap_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    gap_size TEXT DEFAULT 'MEDIUM' CHECK (gap_size IN ('SMALL', 'MEDIUM', 'LARGE', 'EPIC')),

    -- IMPLEMENTATION REQUIREMENTS
    implementation_plan TEXT NOT NULL,          -- Step-by-step implementation
    required_dependencies TEXT,                 -- JSON array of dependencies
    estimated_complexity REAL DEFAULT 0.0,      -- 0-1 complexity score
    estimated_hours REAL DEFAULT 0.0,

    -- LEVEL 1: CONTEXTUAL COMPLETION
    code_executed_successfully BOOLEAN DEFAULT FALSE,
    results_measured_and_documented BOOLEAN DEFAULT FALSE,
    quality_gates_passed BOOLEAN DEFAULT FALSE,
    no_technical_blockers_remaining BOOLEAN DEFAULT FALSE,
    honest_completion_percentage REAL DEFAULT 0.0,
    context_file_location TEXT,

    -- LEVEL 2: DEPLOYMENT COMPLETION
    infrastructure_connectivity_verified BOOLEAN DEFAULT FALSE,
    services_accessible_to_users BOOLEAN DEFAULT FALSE,
    configuration_operational BOOLEAN DEFAULT FALSE,
    environment_variables_set BOOLEAN DEFAULT FALSE,
    deployment_status TEXT DEFAULT 'NOT_DEPLOYED' CHECK (deployment_status IN ('NOT_DEPLOYED', 'DEPLOYING', 'DEPLOYED', 'FAILED')),
    deployment_url TEXT,

    -- LEVEL 3: PURPOSE FULFILLMENT
    intended_users_can_access_system BOOLEAN DEFAULT FALSE,
    business_processes_functional BOOLEAN DEFAULT FALSE,
    value_creation_mechanisms_active BOOLEAN DEFAULT FALSE,
    user_feedback_loops_operational BOOLEAN DEFAULT FALSE,
    active_user_count INTEGER DEFAULT 0,
    business_value_generated TEXT,

    -- LEVEL 4: ECOSYSTEM INTEGRATION
    inter_system_connections_active BOOLEAN DEFAULT FALSE,
    data_flows_established BOOLEAN DEFAULT FALSE,
    api_integrations_functional BOOLEAN DEFAULT FALSE,
    compound_value_generation BOOLEAN DEFAULT FALSE,
    ecosystem_impact_score REAL DEFAULT 0.0,

    -- IMPLEMENTATION-SPECIFIC METRICS
    code_coverage_achieved REAL DEFAULT 0.0,
    automated_test_count INTEGER DEFAULT 0,
    manual_test_count INTEGER DEFAULT 0,
    code_quality_score REAL DEFAULT 0.0,
    documentation_coverage REAL DEFAULT 0.0,

    -- PROCESS TRACKING
    status TEXT DEFAULT 'ANALYZED' CHECK (status IN ('ANALYZED', 'PLANNED', 'IMPLEMENTING', 'TESTING', 'COMPLETED', 'FAILED', 'BLOCKED')),
    implementation_progress REAL DEFAULT 0.0,   -- 0-1 progress
    current_stage TEXT DEFAULT 'PLANNING',
    assigned_agent TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- FOREIGN KEYS
    FOREIGN KEY (source_spec_id) REFERENCES specs_registry(spec_id)
);

-- =====================================================
-- TRIGGERS FOR VISION REGISTRY
-- =====================================================

-- Trigger 1: Enforce honest completion for vision extraction
CREATE TRIGGER enforce_vision_completion
BEFORE UPDATE ON vision_registry
FOR EACH ROW
WHEN NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED'
BEGIN
    SELECT CASE
        WHEN NEW.honest_completion_percentage IS NULL THEN
            RAISE(ABORT, 'ERROR: Vision extraction requires honest_completion_percentage')
        WHEN NEW.context_file_location IS NULL THEN
            RAISE(ABORT, 'ERROR: Vision extraction requires context_file_location')
        WHEN NEW.code_executed_successfully IS FALSE THEN
            RAISE(ABORT, 'ERROR: Vision must have executed successfully to claim completion')
        WHEN NEW.generated_spec_id IS NULL THEN
            RAISE(ABORT, 'ERROR: Vision must generate a spec to claim completion')
    END;
END;

-- Trigger 2: Calculate vision completion level
CREATE TRIGGER calculate_vision_completion_level
AFTER UPDATE OF
    code_executed_successfully,
    infrastructure_connectivity_verified,
    intended_users_can_access_system,
    inter_system_connections_active
ON vision_registry
FOR EACH ROW
BEGIN
    UPDATE vision_registry SET
        processing_stage = CASE
            WHEN NEW.inter_system_connections_active = TRUE THEN 'ECOSYSTEM_INTEGRATED'
            WHEN NEW.intended_users_can_access_system = TRUE THEN 'PURPOSE_FULFILLED'
            WHEN NEW.infrastructure_connectivity_verified = TRUE THEN 'DEPLOYED'
            WHEN NEW.code_executed_successfully = TRUE THEN 'CONTEXT_COMPLETE'
            ELSE 'IN_PROGRESS'
        END
    WHERE vision_id = NEW.vision_id;
END;

-- =====================================================
-- TRIGGERS FOR IMPLEMENTATION GAP REGISTRY
-- =====================================================

-- Trigger 1: Enforce honest completion for implementation gaps
CREATE TRIGGER enforce_implementation_gap_completion
BEFORE UPDATE ON implementation_gap_registry
FOR EACH ROW
WHEN NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED'
BEGIN
    SELECT CASE
        WHEN NEW.honest_completion_percentage IS NULL THEN
            RAISE(ABORT, 'ERROR: Implementation gap requires honest_completion_percentage')
        WHEN NEW.context_file_location IS NULL THEN
            RAISE(ABORT, 'ERROR: Implementation gap requires context_file_location')
        WHEN NEW.code_executed_successfully IS FALSE THEN
            RAISE(ABORT, 'ERROR: Implementation must execute successfully to claim completion')
        WHEN NEW.code_coverage_achieved < 0.5 THEN
            RAISE(ABORT, 'ERROR: Implementation requires at least 50% code coverage')
    END;
END;

-- =====================================================
-- VIEWS FOR MULTI-REGISTRY MONITORING
-- =====================================================

-- View 1: Multi-Registry Overview
CREATE VIEW v_multi_registry_overview AS
SELECT 'vision' as registry_type, COUNT(*) as total_tasks,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
       AVG(honest_completion_percentage) as avg_completion_percentage
FROM vision_registry

UNION ALL

SELECT 'implementation_gap' as registry_type, COUNT(*) as total_tasks,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
       AVG(honest_completion_percentage) as avg_completion_percentage
FROM implementation_gap_registry

UNION ALL

SELECT 'general_tasks' as registry_type, COUNT(*) as total_tasks,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
       AVG(honest_completion_percentage) as avg_completion_percentage
FROM tasks_registry;

-- View 2: Vision to Implementation Pipeline
CREATE VIEW v_vision_to_implementation_pipeline AS
SELECT
    vr.vision_id,
    vr.user_intent,
    vr.generated_spec_id,
    ir.gap_id,
    vr.status as vision_status,
    ir.status as implementation_status,
    vr.honest_completion_percentage as vision_completion,
    ir.honest_completion_percentage as implementation_completion,
    CASE
        WHEN vr.status = 'COMPLETED' AND ir.status = 'COMPLETED' THEN 'FULLY_REALIZED'
        WHEN vr.status = 'COMPLETED' AND ir.status != 'COMPLETED' THEN 'SPEC_COMPLETE_PENDING_IMPL'
        WHEN vr.status != 'COMPLETED' AND ir.status = 'COMPLETED' THEN 'IMPL_COMPLETE_PENDING_SPEC'
        ELSE 'IN_PROGRESS'
    END as pipeline_status
FROM vision_registry vr
LEFT JOIN implementation_gap_registry ir ON vr.generated_spec_id = ir.source_spec_id;

-- View 3: Completion Level Distribution Across Registries
CREATE VIEW v_registry_completion_distribution AS
SELECT 'vision' as registry_type, completion_level, COUNT(*) as task_count
FROM vision_registry
WHERE status = 'COMPLETED'
GROUP BY completion_level

UNION ALL

SELECT 'implementation_gap' as registry_type, completion_level, COUNT(*) as task_count
FROM implementation_gap_registry
WHERE status = 'COMPLETED'
GROUP BY completion_level

UNION ALL

SELECT 'general_tasks' as registry_type, completion_level, COUNT(*) as task_count
FROM tasks_registry
WHERE status = 'COMPLETED'
GROUP BY completion_level;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Vision Registry Indexes
CREATE INDEX idx_vision_source_message ON vision_registry(source_message_id);
CREATE INDEX idx_vision_spec_id ON vision_registry(generated_spec_id);
CREATE INDEX idx_vision_status ON vision_registry(status);
CREATE INDEX idx_vision_agent ON vision_registry(assigned_agent);
CREATE INDEX idx_vision_completion ON vision_registry(honest_completion_percentage);

-- Implementation Gap Registry Indexes
CREATE INDEX idx_gap_source_spec ON implementation_gap_registry(source_spec_id);
CREATE INDEX idx_gap_target_codebase ON implementation_gap_registry(target_codebase);
CREATE INDEX idx_gap_status ON implementation_gap_registry(status);
CREATE INDEX idx_gap_agent ON implementation_gap_registry(assigned_agent);
CREATE INDEX idx_gap_completion ON implementation_gap_registry(honest_completion_percentage);

-- =====================================================
-- SAMPLE DATA INSERTS FOR TESTING
-- =====================================================

-- Sample Vision Entry
/*
INSERT INTO vision_registry (
    vision_id, source_message_id, source_conversation_id,
    user_intent, business_context, success_criteria,
    generated_spec_id, vision_clarity_score, business_value_alignment,
    code_executed_successfully, honest_completion_percentage,
    context_file_location, status
) VALUES (
    'VISION-001', 'MSG-001', 'CONV-001',
    'Create a user authentication system with social login',
    'E-commerce platform requiring secure user management',
    'Users can register/login with Google, GitHub, email',
    'SPEC-001', 0.9, 0.85,
    TRUE, 0.3,
    '/path/to/vision_completion_report.md',
    'COMPLETED'
);
*/

-- Sample Implementation Gap Entry
/*
INSERT INTO implementation_gap_registry (
    gap_id, source_spec_id, target_codebase,
    gap_description, gap_type, gap_priority,
    implementation_plan, estimated_complexity,
    code_executed_successfully, honest_completion_percentage,
    context_file_location, status, code_coverage_achieved
) VALUES (
    'GAP-001', 'SPEC-001', 'ecommerce-platform',
    'OAuth integration missing for social login providers',
    'FEATURE', 'HIGH',
    'Implement OAuth2.0 flows for Google and GitHub',
    0.7, TRUE, 0.6,
    '/path/to/gap_completion_report.md',
    'COMPLETED', 0.85
);
*/

-- =====================================================
-- MIGRATION LOG
-- =====================================================
INSERT INTO system_status_events (event_type, message, timestamp)
VALUES ('REGISTRY_CREATION', 'Created vision_registry and implementation_gap_registry with standardized completion criteria', datetime('now'));

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT COUNT(*) as tables_created FROM sqlite_master
WHERE type = 'table' AND name IN ('vision_registry', 'implementation_gap_registry');

-- Verify triggers were created
SELECT COUNT(*) as triggers_created FROM sqlite_master
WHERE type = 'trigger' AND name LIKE '%vision%' OR name LIKE '%gap%';

-- Verify views were created
SELECT COUNT(*) as views_created FROM sqlite_master
WHERE type = 'view' AND name LIKE 'v_%vision%' OR name LIKE 'v_%gap%' OR name LIKE 'v_multi%';

-- Show multi-registry overview
SELECT * FROM v_multi_registry_overview;

-- Show vision to implementation pipeline
SELECT * FROM v_vision_to_implementation_pipeline LIMIT 10;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'SUCCESS: Multi-Registry System Created!' as message,
       'Vision Registry: Messages → Specifications' as capability1,
       'Implementation Gap Registry: Specs → Code' as capability2,
       'Standardized 4-level completion criteria enforced' as standard,
       'Built-in honesty assessment requirements' as feature;