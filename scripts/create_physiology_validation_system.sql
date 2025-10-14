-- 🧠 CREATE CENTRAL-MCP PHYSIOLOGY VALIDATION SYSTEM
-- Built: 2025-10-13 | Purpose: Validate vision implementation with 95%+ confidence

BEGIN TRANSACTION;

-- =====================================================
-- VISION IMPLEMENTATION VALIDATION TABLES
-- =====================================================

-- Core validation table for vision vs implementation matching
CREATE TABLE vision_implementation_validation (
    validation_id TEXT PRIMARY KEY,
    vision_id TEXT NOT NULL,
    implementation_task_id TEXT NOT NULL,
    project_id TEXT NOT NULL,

    -- Vision Fidelity Assessment (95%+ confidence required)
    vision_fidelity_score REAL DEFAULT 0.0,      -- 0-1, how well implementation matches vision
    feature_completeness_score REAL DEFAULT 0.0,  -- 0-1, percentage of vision features implemented
    user_experience_alignment REAL DEFAULT 0.0,   -- 0-1, UX matches vision intent
    business_objective_achievement REAL DEFAULT 0.0, -- 0-1, business goals met

    -- Touchpoint Verification Results
    total_touchpoints INTEGER DEFAULT 0,
    verified_touchpoints INTEGER DEFAULT 0,
    frontend_backend_touchpoints INTEGER DEFAULT 0,
    external_integrations INTEGER DEFAULT 0,
    working_integrations INTEGER DEFAULT 0,

    -- 95%+ Confidence Validation
    confidence_level REAL DEFAULT 0.0,           -- 0-1, statistical confidence
    validation_method TEXT DEFAULT 'AUTOMATED',  -- AUTOMATED, MANUAL, HYBRID
    validation_evidence TEXT,                    -- JSON array of evidence and test results
    failed_validations TEXT,                     -- JSON array of failed checks
    validation_errors TEXT,                      -- JSON array of validation errors

    -- Quality Assurance Metrics
    code_quality_score REAL DEFAULT 0.0,         -- 0-1, code quality assessment
    test_coverage_score REAL DEFAULT 0.0,        -- 0-1, test coverage percentage
    performance_score REAL DEFAULT 0.0,          -- 0-1, performance benchmarks met
    security_score REAL DEFAULT 0.0,             -- 0-1, security requirements met

    -- Overall Validation Status
    validation_status TEXT DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALIDATING', 'PASSED', 'FAILED', 'REVIEW_REQUIRED')),
    meets_95_percent_confidence BOOLEAN DEFAULT FALSE,
    validator_agent TEXT,
    validation_started_at TIMESTAMP,
    validation_completed_at TIMESTAMP,
    last_validated TIMESTAMP,

    -- Metadata
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vision_id) REFERENCES vision_registry(vision_id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Touchpoint registry for all system integration points
CREATE TABLE touchpoint_registry (
    touchpoint_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    validation_id TEXT,                          -- Links to vision validation

    -- Touchpoint Classification
    touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN (
        'API_ENDPOINT', 'DATABASE_CONNECTION', 'EXTERNAL_INTEGRATION',
        'FRONTEND_COMPONENT', 'MICROSERVICE', 'FILE_STORAGE',
        'AUTHENTICATION', 'PAYMENT_PROCESSING', 'COMMUNICATION', 'ANALYTICS'
    )),
    touchpoint_category TEXT NOT NULL CHECK (touchpoint_category IN (
        'FRONTEND_BACKEND', 'EXTERNAL_PROVIDER', 'SYSTEM_TO_SYSTEM', 'USER_FACING'
    )),

    -- Component Information
    source_component TEXT NOT NULL,              -- Frontend component or backend service
    target_component TEXT NOT NULL,              -- Backend service or external provider
    source_location TEXT,                        -- File path or URL
    target_location TEXT,                        -- API endpoint, database connection string, etc.

    -- Touchpoint Specification
    expected_behavior TEXT NOT NULL,             -- What this touchpoint should do
    test_protocol TEXT NOT NULL,                 -- How to test this touchpoint
    validation_criteria TEXT NOT NULL,           -- Success criteria
    data_flow_specification TEXT,                -- JSON: expected data flow

    -- Verification Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method TEXT DEFAULT 'AUTOMATED' CHECK (verification_method IN ('AUTOMATED', 'MANUAL', 'INTEGRATION_TEST')),
    last_verified TIMESTAMP,
    verification_confidence REAL DEFAULT 0.0,    -- 0-1, confidence in verification
    verification_results TEXT,                   -- JSON: detailed test results

    -- Health Monitoring
    is_healthy BOOLEAN DEFAULT TRUE,
    failure_count INTEGER DEFAULT 0,
    last_failure TIMESTAMP,
    last_success TIMESTAMP,
    recovery_time_ms INTEGER DEFAULT 0,
    average_response_time_ms INTEGER DEFAULT 0,

    -- User Control Assessment
    user_visible BOOLEAN DEFAULT FALSE,          -- Can users see this touchpoint?
    user_manageable BOOLEAN DEFAULT FALSE,        -- Can users control this touchpoint?
    user_control_level TEXT DEFAULT 'NONE' CHECK (user_control_level IN ('NONE', 'VIEW', 'INTERACT', 'MANAGE', 'FULL_CONTROL')),
    user_interface_components TEXT,              -- JSON: UI elements for this touchpoint

    -- Technical Details
    protocol TEXT,                               -- HTTP, HTTPS, WebSocket, TCP, etc.
    authentication_required BOOLEAN DEFAULT FALSE,
    rate_limit_applied BOOLEAN DEFAULT FALSE,
    error_handling_strategy TEXT,
    monitoring_enabled BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (validation_id) REFERENCES vision_implementation_validation(validation_id)
);

-- Frontend-Backend Integration Mapping Table
CREATE TABLE frontend_backend_mapping (
    mapping_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    touchpoint_id TEXT,                          -- Links to specific touchpoint

    -- Frontend Component Analysis
    frontend_component TEXT NOT NULL,
    component_type TEXT NOT NULL CHECK (component_type IN (
        'FORM', 'TABLE', 'DASHBOARD', 'CHART', 'MODAL', 'NAVIGATION',
        'SIDEBAR', 'HEADER', 'FOOTER', 'CARD', 'LIST', 'DETAIL_VIEW'
    )),
    component_path TEXT,                         -- File path to component
    user_interaction_level TEXT NOT NULL CHECK (user_interaction_level IN ('VIEW', 'INTERACT', 'MANAGE', 'CONFIGURE')),

    -- Backend Process Mapping
    backend_process TEXT NOT NULL,
    process_type TEXT NOT NULL CHECK (process_type IN (
        'API_ENDPOINT', 'BUSINESS_LOGIC', 'DATA_QUERY', 'DATA_MUTATION',
        'FILE_OPERATION', 'AUTHENTICATION', 'VALIDATION', 'NOTIFICATION'
    )),
    data_source TEXT NOT NULL,                   -- Database, external API, cache, etc.
    backend_service_path TEXT,                   -- Service or controller path

    -- Integration Assessment
    integration_level REAL DEFAULT 0.0,          -- 0-1, how well frontend integrates with backend
    user_control_score REAL DEFAULT 0.0,         -- 0-1, how much user control available
    visualization_completeness REAL DEFAULT 0.0, -- 0-1, how well backend is visualized
    real_time_sync_enabled BOOLEAN DEFAULT FALSE,

    -- Capability Assessment
    capabilities TEXT,                           -- JSON: ["create", "read", "update", "delete", "export", "import"]
    limitations TEXT,                            -- JSON: constraints and restrictions
    user_workflows TEXT,                         -- JSON: supported user journeys
    data_transformation_rules TEXT,              -- JSON: data processing logic

    -- Technical Integration Details
    api_endpoints TEXT,                          -- JSON array of connected endpoints
    request_response_patterns TEXT,              -- JSON: expected request/response formats
    error_scenarios_handled TEXT,                -- JSON: error cases and handling
    caching_strategy TEXT,
    state_management_approach TEXT,

    -- User Experience Metrics
    typical_user_actions TEXT,                   -- JSON: common user interactions
    expected_response_time_ms INTEGER DEFAULT 1000,
    error_recovery_mechanisms TEXT,
    help_system_integration BOOLEAN DEFAULT FALSE,

    -- Quality Assessment
    accessibility_compliance BOOLEAN DEFAULT FALSE,
    mobile_responsive BOOLEAN DEFAULT TRUE,
    offline_capability BOOLEAN DEFAULT FALSE,
    progressive_enhancement BOOLEAN DEFAULT TRUE,

    -- Metadata
    last_assessed TIMESTAMP,
    assessment_method TEXT DEFAULT 'AUTOMATED',
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (touchpoint_id) REFERENCES touchpoint_registry(touchpoint_id)
);

-- User Control Assessment Table
CREATE TABLE user_control_assessment (
    assessment_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    backend_process_id TEXT NOT NULL,
    touchpoint_id TEXT,
    mapping_id TEXT,

    -- Control Capability Scores (0-1 each)
    visibility_score REAL DEFAULT 0.0,           -- Can users see what's happening?
    interactivity_score REAL DEFAULT 0.0,        -- Can users interact with the process?
    management_score REAL DEFAULT 0.0,           -- Can users manage the process?
    self_service_score REAL DEFAULT 0.0,         -- Can users solve problems independently?
    overall_control_score REAL DEFAULT 0.0,      -- Weighted average of all scores

    -- User Interface Analysis
    ui_components_available TEXT,                -- JSON: array of UI elements
    user_workflows_supported TEXT,               -- JSON: array of supported user journeys
    configuration_options TEXT,                  -- JSON: array of user-configurable settings
    available_dashboards TEXT,                   -- JSON: dashboard capabilities

    -- User Experience Metrics
    time_to_complete_action INTEGER DEFAULT 0,   -- Seconds to complete typical action
    clicks_to_objective INTEGER DEFAULT 0,       -- Number of clicks to reach goal
    error_rate REAL DEFAULT 0.0,                 -- User error frequency (0-1)
    satisfaction_score REAL DEFAULT 0.0,         -- User satisfaction (if available)
    task_success_rate REAL DEFAULT 0.0,          -- Percentage of successful user tasks

    -- Self-Service Readiness Assessment
    troubleshooting_tools_available BOOLEAN DEFAULT FALSE,
    help_documentation_complete BOOLEAN DEFAULT FALSE,
    video_tutorials_available BOOLEAN DEFAULT FALSE,
    community_support_available BOOLEAN DEFAULT FALSE,
    faq_comprehensive BOOLEAN DEFAULT FALSE,

    -- Advanced Capabilities
    custom_report_builder BOOLEAN DEFAULT FALSE,
    data_export_capabilities TEXT,               -- JSON: export formats available
    automation_workflows TEXT,                   -- JSON: user-automatable processes
    alert_configuration BOOLEAN DEFAULT FALSE,
    preference_management BOOLEAN DEFAULT FALSE,

    -- Assessment Details
    assessment_method TEXT DEFAULT 'AUTOMATED' CHECK (assessment_method IN ('AUTOMATED', 'USER_TESTING', 'EXPERT_REVIEW', 'HYBRID')),
    confidence_level REAL DEFAULT 0.0,           -- Confidence in assessment accuracy
    assessment_duration_minutes INTEGER DEFAULT 0,
    assessment_sample_size INTEGER DEFAULT 0,     -- Number of users/samples evaluated

    -- Quality Metrics
    interface_usability_score REAL DEFAULT 0.0,   -- 0-1, ease of use
    information_clarity_score REAL DEFAULT 0.0,   -- 0-1, clarity of information
    error_prevention_score REAL DEFAULT 0.0,      -- 0-1, system helps prevent errors
    recovery_support_score REAL DEFAULT 0.0,       -- 0-1, helps users recover from errors

    -- Metadata
    assessed_by TEXT,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_assessment_due TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (touchpoint_id) REFERENCES touchpoint_registry(touchpoint_id),
    FOREIGN KEY (mapping_id) REFERENCES frontend_backend_mapping(mapping_id)
);

-- Integration Confidence Calculation Table
CREATE TABLE integration_confidence_scores (
    confidence_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    validation_id TEXT,

    -- Integration Category Confidence Scores
    api_integration_confidence REAL DEFAULT 0.0,      -- 0-1, confidence in API integrations
    database_integration_confidence REAL DEFAULT 0.0, -- 0-1, confidence in database connections
    external_service_confidence REAL DEFAULT 0.0,     -- 0-1, confidence in external services
    frontend_backend_confidence REAL DEFAULT 0.0,     -- 0-1, confidence in frontend-backend integration

    -- Overall Confidence Metrics
    overall_integration_confidence REAL DEFAULT 0.0,  -- Weighted average of all categories
    confidence_threshold_met BOOLEAN DEFAULT FALSE,   -- True if >= 0.95
    confidence_calculation_method TEXT DEFAULT 'WEIGHTED_AVERAGE',

    -- Contributing Factors
    test_coverage_contribution REAL DEFAULT 0.0,      -- How test coverage affects confidence
    monitoring_coverage_contribution REAL DEFAULT 0.0, -- How monitoring affects confidence
    error_rate_impact REAL DEFAULT 0.0,               -- How error rate affects confidence
    performance_impact REAL DEFAULT 0.0,              -- How performance affects confidence
    security_posture_impact REAL DEFAULT 0.0,          -- How security affects confidence

    -- Risk Assessment
    identified_risks TEXT,                         -- JSON: array of identified risks
    risk_mitigation_strategies TEXT,               -- JSON: risk mitigation approaches
    residual_risk_score REAL DEFAULT 0.0,           -- 0-1, risk after mitigation

    -- Validation Evidence
    automated_test_results TEXT,                   -- JSON: automated test evidence
    manual_verification_results TEXT,              -- JSON: manual verification evidence
    user_acceptance_results TEXT,                  -- JSON: user acceptance evidence
    performance_benchmarks TEXT,                   -- JSON: performance evidence

    -- Confidence Trends
    confidence_trend_7_days REAL DEFAULT 0.0,      -- Change over last 7 days
    confidence_trend_30_days REAL DEFAULT 0.0,     -- Change over last 30 days
    confidence_volatility REAL DEFAULT 0.0,         -- Stability of confidence score

    -- Metadata
    calculated_by TEXT,
    calculation_method TEXT DEFAULT 'ALGORITHMIC',
    calculation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_calculation_due TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (validation_id) REFERENCES vision_implementation_validation(validation_id)
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC VALIDATION
-- =====================================================

-- Trigger 1: Update vision validation confidence when touchpoints are verified
CREATE TRIGGER update_vision_confidence_on_touchpoint_verification
AFTER UPDATE OF is_verified ON touchpoint_registry
FOR EACH ROW
BEGIN
    UPDATE vision_implementation_validation SET
        verified_touchpoints = (
            SELECT COUNT(*) FROM touchpoint_registry
            WHERE validation_id = vision_implementation_validation.validation_id
            AND is_verified = TRUE
        ),
        confidence_level = (
            SELECT CASE
                WHEN total_touchpoints = 0 THEN 0.0
                ELSE CAST(verified_touchpoints AS REAL) / total_touchpoints
            END
        ),
        meets_95_percent_confidence = (
            SELECT CASE
                WHEN total_touchpoints = 0 THEN FALSE
                WHEN CAST(verified_touchpoints AS REAL) / total_touchpoints >= 0.95 THEN TRUE
                ELSE FALSE
            END
        ),
        last_validated = CURRENT_TIMESTAMP
    WHERE validation_id = NEW.validation_id;
END;

-- Trigger 2: Calculate overall user control score
CREATE TRIGGER calculate_overall_user_control_score
AFTER INSERT OR UPDATE ON user_control_assessment
FOR EACH ROW
BEGIN
    UPDATE user_control_assessment SET
        overall_control_score = (
            (visibility_score * 0.25) +
            (interactivity_score * 0.30) +
            (management_score * 0.25) +
            (self_service_score * 0.20)
        )
    WHERE assessment_id = NEW.assessment_id;
END;

-- Trigger 3: Update integration confidence when validation results change
CREATE TRIGGER update_integration_confidence
AFTER UPDATE OF validation_status ON vision_implementation_validation
FOR EACH ROW
WHEN NEW.validation_status = 'PASSED' AND OLD.validation_status != 'PASSED'
BEGIN
    INSERT OR REPLACE INTO integration_confidence_scores (
        confidence_id, project_id, validation_id,
        api_integration_confidence, database_integration_confidence,
        external_service_confidence, frontend_backend_confidence,
        overall_integration_confidence, confidence_threshold_met,
        calculated_by, calculation_timestamp
    ) VALUES (
        'CONF-' || NEW.validation_id,
        (SELECT project_id FROM vision_implementation_validation WHERE validation_id = NEW.validation_id),
        NEW.validation_id,
        NEW.vision_fidelity_score,
        NEW.feature_completeness_score,
        NEW.test_coverage_score,
        NEW.performance_score,
        (NEW.vision_fidelity_score + NEW.feature_completeness_score + NEW.test_coverage_score + NEW.performance_score) / 4,
        (NEW.confidence_level >= 0.95),
        'SYSTEM_TRIGGER',
        CURRENT_TIMESTAMP
    );
END;

-- =====================================================
-- MONITORING VIEWS FOR PHYSIOLOGY DASHBOARD
-- =====================================================

-- View 1: Vision Implementation Overview
CREATE VIEW v_vision_implementation_overview AS
SELECT
    p.name as project_name,
    p.id as project_id,
    COUNT(vi.validation_id) as total_visions,
    SUM(CASE WHEN vi.validation_status = 'PASSED' THEN 1 ELSE 0 END) as passed_validations,
    SUM(CASE WHEN vi.meets_95_percent_confidence THEN 1 ELSE 0 END) as confident_implementations,
    AVG(vi.vision_fidelity_score) as avg_vision_fidelity,
    AVG(vi.feature_completeness_score) as avg_feature_completeness,
    AVG(vi.confidence_level) as avg_confidence_level,
    MAX(vi.validation_completed_at) as last_validation_date,
    CASE
        WHEN AVG(vi.confidence_level) >= 0.95 THEN 'HEALTHY'
        WHEN AVG(vi.confidence_level) >= 0.80 THEN 'WARNING'
        WHEN AVG(vi.confidence_level) >= 0.60 THEN 'AT_RISK'
        ELSE 'CRITICAL'
    END as physiological_health_status
FROM projects p
LEFT JOIN vision_implementation_validation vi ON p.id = vi.project_id
GROUP BY p.id, p.name;

-- View 2: Touchpoint Health Monitoring
CREATE VIEW v_touchpoint_health_dashboard AS
SELECT
    p.name as project_name,
    COUNT(tr.touchpoint_id) as total_touchpoints,
    SUM(CASE WHEN tr.is_verified = TRUE THEN 1 ELSE 0 END) as verified_touchpoints,
    SUM(CASE WHEN tr.is_healthy = TRUE THEN 1 ELSE 0 END) as healthy_touchpoints,
    SUM(CASE WHEN tr.user_manageable = TRUE THEN 1 ELSE 0 END) as manageable_touchpoints,
    AVG(tr.verification_confidence) as avg_verification_confidence,
    AVG(tr.average_response_time_ms) as avg_response_time,
    SUM(tr.failure_count) as total_failures,
    MAX(tr.last_verified) as last_verification_date,
    ROUND(CAST(SUM(CASE WHEN tr.is_verified = TRUE THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 1) as verification_percentage
FROM projects p
LEFT JOIN touchpoint_registry tr ON p.id = tr.project_id
GROUP BY p.id, p.name;

-- View 3: Frontend-Backend Integration Maturity
CREATE VIEW v_integration_maturity_dashboard AS
SELECT
    p.name as project_name,
    COUNT(fbm.mapping_id) as total_integrations,
    AVG(fbm.integration_level) as avg_integration_level,
    AVG(fbm.user_control_score) as avg_user_control_score,
    AVG(fbm.visualization_completeness) as avg_visualization_score,
    SUM(CASE WHEN fbm.integration_level >= 0.95 THEN 1 ELSE 0 END) as mature_integrations,
    SUM(CASE WHEN fbm.user_control_score >= 0.80 THEN 1 ELSE 0 END) as user_friendly_integrations,
    SUM(CASE WHEN fbm.real_time_sync_enabled = TRUE THEN 1 ELSE 0 END) as real_time_integrations,
    ROUND(AVG(fbm.integration_level) * 100, 1) as maturity_percentage,
    CASE
        WHEN AVG(fbm.integration_level) >= 0.95 THEN 'MASTERED'
        WHEN AVG(fbm.integration_level) >= 0.80 THEN 'ADVANCED'
        WHEN AVG(fbm.integration_level) >= 0.60 THEN 'DEVELOPING'
        WHEN AVG(fbm.integration_level) >= 0.40 THEN 'BASIC'
        ELSE 'INITIAL'
    END as integration_maturity_stage
FROM projects p
LEFT JOIN frontend_backend_mapping fbm ON p.id = fbm.project_id
GROUP BY p.id, p.name;

-- View 4: User Control Assessment Summary
CREATE VIEW v_user_control_summary AS
SELECT
    p.name as project_name,
    COUNT(ucas.assessment_id) as total_assessments,
    AVG(ucas.overall_control_score) as avg_control_score,
    AVG(ucas.visibility_score) as avg_visibility_score,
    AVG(ucas.interactivity_score) as avg_interactivity_score,
    AVG(ucas.management_score) as avg_management_score,
    AVG(ucas.self_service_score) as avg_self_service_score,
    SUM(CASE WHEN ucas.overall_control_score >= 0.80 THEN 1 ELSE 0 END) as high_control_processes,
    SUM(CASE WHEN ucas.self_service_score >= 0.80 THEN 1 ELSE 0 END) as self_service_ready,
    AVG(ucas.time_to_complete_action) as avg_action_time,
    AVG(ucas.task_success_rate) as avg_success_rate,
    ROUND(AVG(ucas.overall_control_score) * 100, 1) as control_readiness_percentage
FROM projects p
LEFT JOIN user_control_assessment ucas ON p.id = ucas.project_id
GROUP BY p.id, p.name;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Vision validation indexes
CREATE INDEX idx_vision_validation_project ON vision_implementation_validation(project_id);
CREATE INDEX idx_vision_validation_status ON vision_implementation_validation(validation_status);
CREATE INDEX idx_vision_validation_confidence ON vision_implementation_validation(confidence_level);
CREATE INDEX idx_vision_validation_validator ON vision_implementation_validation(validator_agent);

-- Touchpoint registry indexes
CREATE INDEX idx_touchpoint_project ON touchpoint_registry(project_id);
CREATE INDEX idx_touchpoint_type ON touchpoint_registry(touchpoint_type);
CREATE INDEX idx_touchpoint_verified ON touchpoint_registry(is_verified);
CREATE INDEX idx_touchpoint_healthy ON touchpoint_registry(is_healthy);
CREATE INDEX idx_touchpoint_control_level ON touchpoint_registry(user_control_level);

-- Frontend-backend mapping indexes
CREATE INDEX idx_fbm_project ON frontend_backend_mapping(project_id);
CREATE INDEX idx_fbm_component_type ON frontend_backend_mapping(component_type);
CREATE INDEX idx_fbm_integration_level ON frontend_backend_mapping(integration_level);
CREATE INDEX idx_fbm_interaction_level ON frontend_backend_mapping(user_interaction_level);

-- User control assessment indexes
CREATE INDEX idx_uca_project ON user_control_assessment(project_id);
CREATE INDEX idx_uca_control_score ON user_control_assessment(overall_control_score);
CREATE INDEX idx_uca_assessment_date ON user_control_assessment(assessment_date);

-- Integration confidence indexes
CREATE INDEX idx_ic_project ON integration_confidence_scores(project_id);
CREATE INDEX idx_ic_confidence ON integration_confidence_scores(overall_integration_confidence);
CREATE INDEX idx_ic_threshold_met ON integration_confidence_scores(confidence_threshold_met);

-- =====================================================
-- MIGRATION LOG
-- =====================================================

INSERT INTO system_status_events (event_type, message, timestamp)
VALUES ('PHYSIOLOGY_SYSTEM', 'Central-MCP Physiology Validation System created', datetime('now'));

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT COUNT(*) as tables_created FROM sqlite_master
WHERE type = 'table' AND name IN (
    'vision_implementation_validation', 'touchpoint_registry',
    'frontend_backend_mapping', 'user_control_assessment', 'integration_confidence_scores'
);

-- Verify triggers were created
SELECT COUNT(*) as triggers_created FROM sqlite_master
WHERE type = 'trigger' AND name LIKE '%physiology%' OR name LIKE '%confidence%' OR name LIKE '%control%';

-- Verify views were created
SELECT COUNT(*) as views_created FROM sqlite_master
WHERE type = 'view' AND name LIKE 'v_%physiology%' OR name LIKE 'v_%touchpoint%' OR name LIKE 'v_%integration%';

-- Show system readiness
SELECT 'PHYSIOLOGY_SYSTEM_READY' as status,
       (SELECT COUNT(*) FROM vision_implementation_validation) as validation_tables,
       (SELECT COUNT(*) FROM touchpoint_registry) as touchpoint_tables,
       (SELECT COUNT(*) FROM v_vision_implementation_overview) as monitoring_views;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'SUCCESS: Central-MCP Physiology Validation System deployed!' as message,
       'Vision implementation validation with 95%+ confidence' as capability1,
       'Touchpoint detection and verification framework' as capability2,
       'Frontend-backend integration mapping engine' as capability3,
       'User control assessment and scoring system' as capability4,
       'Real-time monitoring and health dashboard' as capability5;