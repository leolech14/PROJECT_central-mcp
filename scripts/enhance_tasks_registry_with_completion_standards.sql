-- 🔧 ENHANCE TASKS_REGISTRY WITH STANDARDIZED COMPLETION CRITERIA
-- This script adds the 4-level completion matrix to existing tasks_registry
-- Built: 2025-10-13 | Purpose: Enforce verifiable completion standards

BEGIN TRANSACTION;

-- =====================================================
-- LEVEL 1: CONTEXTUAL COMPLETION FIELDS
-- =====================================================
ALTER TABLE tasks_registry ADD COLUMN code_executed_successfully BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN results_measured_and_documented BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN quality_gates_passed BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN no_technical_blockers_remaining BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN honest_completion_percentage REAL DEFAULT 0.0;
ALTER TABLE tasks_registry ADD COLUMN context_file_location TEXT;

-- =====================================================
-- LEVEL 2: DEPLOYMENT COMPLETION FIELDS
-- =====================================================
ALTER TABLE tasks_registry ADD COLUMN infrastructure_connectivity_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN services_accessible_to_users BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN configuration_operational BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN environment_variables_set BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN deployment_status TEXT DEFAULT 'NOT_DEPLOYED' CHECK (deployment_status IN ('NOT_DEPLOYED', 'DEPLOYING', 'DEPLOYED', 'FAILED'));
ALTER TABLE tasks_registry ADD COLUMN deployment_url TEXT;

-- =====================================================
-- LEVEL 3: PURPOSE FULFILLMENT FIELDS
-- =====================================================
ALTER TABLE tasks_registry ADD COLUMN intended_users_can_access_system BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN business_processes_functional BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN value_creation_mechanisms_active BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN user_feedback_loops_operational BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN active_user_count INTEGER DEFAULT 0;
ALTER TABLE tasks_registry ADD COLUMN business_value_generated TEXT;

-- =====================================================
-- LEVEL 4: ECOSYSTEM INTEGRATION FIELDS
-- =====================================================
ALTER TABLE tasks_registry ADD COLUMN inter_system_connections_active BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN data_flows_established BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN api_integrations_functional BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN compound_value_generation BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks_registry ADD COLUMN ecosystem_impact_score REAL DEFAULT 0.0;

-- =====================================================
-- COMPLETION LEVEL CALCULATION (Computed Columns)
-- =====================================================
ALTER TABLE tasks_registry ADD COLUMN completion_level INTEGER DEFAULT 0
CHECK (completion_level IN (0, 1, 2, 3, 4));

-- =====================================================
-- ENFORCEMENT TRIGGERS
-- =====================================================

-- Trigger 1: Enforce honest completion assessment
CREATE TRIGGER enforce_honest_completion_assessment
BEFORE UPDATE ON tasks_registry
FOR EACH ROW
WHEN NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED'
BEGIN
    SELECT CASE
        WHEN NEW.honest_completion_percentage IS NULL THEN
            RAISE(ABORT, 'ERROR: Must provide honest_completion_percentage (0-1) when marking task as completed')
        WHEN NEW.context_file_location IS NULL THEN
            RAISE(ABORT, 'ERROR: Must provide context_file_location when marking task as completed')
        WHEN NEW.code_executed_successually IS FALSE THEN
            RAISE(ABORT, 'ERROR: Code must execute successfully (code_executed_successfully = TRUE) to claim completion')
        WHEN NEW.honest_completion_percentage < 0 OR NEW.honest_completion_percentage > 1 THEN
            RAISE(ABORT, 'ERROR: honest_completion_percentage must be between 0 and 1')
    END;
END;

-- Trigger 2: Calculate completion level automatically
CREATE TRIGGER calculate_completion_level
AFTER UPDATE OF
    code_executed_successfully,
    infrastructure_connectivity_verified,
    intended_users_can_access_system,
    inter_system_connections_active
ON tasks_registry
FOR EACH ROW
BEGIN
    UPDATE tasks_registry SET completion_level =
        CASE
            WHEN NEW.inter_system_connections_active = TRUE
                 AND NEW.data_flows_established = TRUE
                 AND NEW.api_integrations_functional = TRUE THEN 4
            WHEN NEW.intended_users_can_access_system = TRUE
                 AND NEW.business_processes_functional = TRUE
                 AND NEW.value_creation_mechanisms_active = TRUE THEN 3
            WHEN NEW.infrastructure_connectivity_verified = TRUE
                 AND NEW.services_accessible_to_users = TRUE
                 AND NEW.configuration_operational = TRUE THEN 2
            WHEN NEW.code_executed_successfully = TRUE
                 AND NEW.results_measured_and_documented = TRUE
                 AND NEW.quality_gates_passed = TRUE THEN 1
            ELSE 0
        END
    WHERE task_id = NEW.task_id;
END;

-- Trigger 3: Update completion percentage based on level
CREATE TRIGGER update_completion_percentage
AFTER UPDATE OF completion_level ON tasks_registry
FOR EACH ROW
BEGIN
    UPDATE tasks_registry SET honest_completion_percentage =
        CASE NEW.completion_level
            WHEN 0 THEN 0.0
            WHEN 1 THEN 0.25
            WHEN 2 THEN 0.5
            WHEN 3 THEN 0.75
            WHEN 4 THEN 1.0
        END
    WHERE task_id = NEW.task_id AND honest_completion_percentage = 0.0;
END;

-- =====================================================
-- HELPER VIEWS FOR MONITORING
-- =====================================================

-- View 1: Completion Level Summary
CREATE VIEW v_completion_level_summary AS
SELECT
    completion_level,
    COUNT(*) as task_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks_registry), 2) as percentage,
    CASE completion_level
        WHEN 0 THEN 'Not Started'
        WHEN 1 THEN 'Contextual Complete'
        WHEN 2 THEN 'Deployment Complete'
        WHEN 3 THEN 'Purpose Fulfilled'
        WHEN 4 THEN 'Ecosystem Integrated'
    END as level_description
FROM tasks_registry
GROUP BY completion_level
ORDER BY completion_level;

-- View 2: Agent Honesty Assessment
CREATE VIEW v_agent_honest_metrics AS
SELECT
    assigned_agent as agent_id,
    COUNT(*) as total_tasks_completed,
    AVG(honest_completion_percentage) as avg_honesty_score,
    AVG(overall_quality_score) as avg_quality_score,
    COUNT(CASE WHEN completion_level >= 2 THEN 1 END) as deployment_ready_tasks,
    ROUND(AVG(completion_level), 2) as avg_completion_level
FROM tasks_registry
WHERE status = 'COMPLETED' AND assigned_agent IS NOT NULL
GROUP BY assigned_agent
ORDER BY avg_honesty_score DESC;

-- View 3: Completion Gap Analysis
CREATE VIEW v_completion_gap_analysis AS
SELECT
    'Contextual Gap' as gap_type,
    COUNT(*) - SUM(CASE WHEN code_executed_successfully = TRUE THEN 1 ELSE 0 END) as gap_count,
    ROUND((1.0 - (SUM(CASE WHEN code_executed_successfully = TRUE THEN 1 ELSE 0 END) * 1.0 / COUNT(*))) * 100, 2) as gap_percentage
FROM tasks_registry
WHERE status = 'COMPLETED'

UNION ALL

SELECT
    'Deployment Gap' as gap_type,
    COUNT(*) - SUM(CASE WHEN infrastructure_connectivity_verified = TRUE THEN 1 ELSE 0 END) as gap_count,
    ROUND((1.0 - (SUM(CASE WHEN infrastructure_connectivity_verified = TRUE THEN 1 ELSE 0 END) * 1.0 / COUNT(*))) * 100, 2) as gap_percentage
FROM tasks_registry
WHERE status = 'COMPLETED'

UNION ALL

SELECT
    'Purpose Fulfillment Gap' as gap_type,
    COUNT(*) - SUM(CASE WHEN intended_users_can_access_system = TRUE THEN 1 ELSE 0 END) as gap_count,
    ROUND((1.0 - (SUM(CASE WHEN intended_users_can_access_system = TRUE THEN 1 ELSE 0 END) * 1.0 / COUNT(*))) * 100, 2) as gap_percentage
FROM tasks_registry
WHERE status = 'COMPLETED';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_tasks_completion_level ON tasks_registry(completion_level);
CREATE INDEX idx_tasks_honest_percentage ON tasks_registry(honest_completion_percentage);
CREATE INDEX idx_tasks_deployment_status ON tasks_registry(deployment_status);
CREATE INDEX idx_tasks_code_executed ON tasks_registry(code_executed_successfully);
CREATE INDEX idx_tasks_infrastructure_verified ON tasks_registry(infrastructure_connectivity_verified);
CREATE INDEX idx_tasks_purpose_fulfilled ON tasks_registry(intended_users_can_access_system);
CREATE INDEX idx_tasks_ecosystem_integrated ON tasks_registry(inter_system_connections_active);

-- =====================================================
-- MIGRATION LOG
-- =====================================================
INSERT INTO system_status_events (event_type, message, timestamp)
VALUES ('MIGRATION', 'Enhanced tasks_registry with standardized completion criteria', datetime('now'));

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify new columns were added
SELECT COUNT(*) as new_columns_added
FROM pragma_table_info('tasks_registry')
WHERE name IN (
    'code_executed_successfully', 'results_measured_and_documented', 'quality_gates_passed',
    'honest_completion_percentage', 'context_file_location', 'deployment_status',
    'infrastructure_connectivity_verified', 'intended_users_can_access_system',
    'inter_system_connections_active', 'completion_level'
);

-- Verify triggers were created
SELECT COUNT(*) as triggers_created FROM sqlite_master
WHERE type = 'trigger' AND name LIKE '%completion%';

-- Verify views were created
SELECT COUNT(*) as views_created FROM sqlite_master
WHERE type = 'view' AND name LIKE 'v_%completion%';

-- Show completion level distribution
SELECT * FROM v_completion_level_summary;

-- Show current task completion status
SELECT
    task_id,
    task_name,
    status,
    completion_level,
    honest_completion_percentage,
    code_executed_successfully,
    infrastructure_connectivity_verified,
    intended_users_can_access_system,
    inter_system_connections_active
FROM tasks_registry
WHERE status = 'COMPLETED'
ORDER BY honest_completion_percentage DESC
LIMIT 10;

-- =====================================================
-- SAMPLE UPDATES FOR TESTING
-- =====================================================

-- Example: Update a sample task to Level 1 completion
/*
UPDATE tasks_registry SET
    code_executed_successfully = TRUE,
    results_measured_and_documented = TRUE,
    quality_gates_passed = TRUE,
    no_technical_blockers_remaining = TRUE,
    honest_completion_percentage = 0.3,
    context_file_location = '/path/to/completion_report.md',
    completion_level = 1
WHERE task_id = 'SAMPLE-TASK-001';
*/

-- Example: Update a sample task to Level 2 completion
/*
UPDATE tasks_registry SET
    code_executed_successfully = TRUE,
    results_measured_and_documented = TRUE,
    quality_gates_passed = TRUE,
    infrastructure_connectivity_verified = TRUE,
    services_accessible_to_users = TRUE,
    configuration_operational = TRUE,
    environment_variables_set = TRUE,
    deployment_status = 'DEPLOYED',
    deployment_url = 'https://example.com/deployment',
    honest_completion_percentage = 0.6,
    context_file_location = '/path/to/deployment_report.md',
    completion_level = 2
WHERE task_id = 'SAMPLE-TASK-002';
*/

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'SUCCESS: tasks_registry enhanced with standardized completion criteria!' as message,
       'Agents must now provide honest completion assessments' as requirement,
       'Built-in enforcement prevents false completion claims' as feature,
       '4-level completion matrix provides transparency' as benefit;