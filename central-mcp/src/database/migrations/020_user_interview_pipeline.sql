-- ============================================================================
-- USER INTERVIEW PIPELINE - Proactive Gap Resolution System
-- ============================================================================
-- Purpose: Automatically identify spec gaps and intelligently interview users
-- Created: 2025-10-12
-- Vision: SPEC GAPS → MINIMAL QUESTIONS → MAXIMUM RESOLUTION → COMPLETE SPEC
-- ============================================================================

-- ============================================================================
-- THE UNIVERSAL PROJECT SCHEMA
-- ============================================================================
-- Every project needs these 10 dimensions to be "complete" and actionable:
--
-- 1. PURPOSE & VISION     → Why does this exist? What problem does it solve?
-- 2. TARGET USERS         → Who is this for? What are their needs?
-- 3. CORE FEATURES        → What must it do? What's essential vs nice-to-have?
-- 4. SUCCESS CRITERIA     → How do we know it's working? What are the metrics?
-- 5. TECHNICAL STACK      → What technologies? What constraints?
-- 6. USER EXPERIENCE      → How should it feel? What's the UX priority?
-- 7. DATA & CONTENT       → What data? What structure? What sources?
-- 8. INTEGRATIONS         → What external systems? What APIs?
-- 9. DEPLOYMENT           → Where? How? What infrastructure?
-- 10. BUSINESS MODEL      → How does it create value? What's the revenue model?
-- ============================================================================

-- Universal Project Schema (what every project needs)
CREATE TABLE IF NOT EXISTS universal_project_schema (
    dimension_id TEXT PRIMARY KEY,              -- e.g. "purpose-vision", "target-users"
    dimension_name TEXT NOT NULL,               -- Display name
    dimension_category TEXT NOT NULL,           -- strategy, product, technical, business

    -- Dimension Definition
    dimension_description TEXT NOT NULL,        -- What this dimension captures
    why_critical TEXT NOT NULL,                 -- Why this must be known
    examples TEXT,                              -- JSON: example values

    -- Required Information
    required_fields TEXT NOT NULL,              -- JSON: fields that must be filled
    optional_fields TEXT,                       -- JSON: nice-to-have fields
    validation_rules TEXT,                      -- JSON: how to validate completeness

    -- Gap Detection
    gap_indicators TEXT,                        -- JSON: signals that this is missing
    gap_severity TEXT DEFAULT 'HIGH',           -- LOW, MEDIUM, HIGH, CRITICAL
    gap_impact TEXT,                            -- What happens if missing?

    -- Question Templates
    discovery_questions TEXT NOT NULL,          -- JSON: questions to ask if missing
    clarification_questions TEXT,               -- JSON: follow-up questions
    validation_questions TEXT,                  -- JSON: verify understanding

    -- Applicability
    applies_to_project_types TEXT,             -- JSON: project types needing this
    always_required BOOLEAN DEFAULT TRUE,       -- Must have for ALL projects?

    priority INTEGER DEFAULT 50,                -- 1-100 (higher = more critical)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spec gap analysis (what's missing from specs)
CREATE TABLE IF NOT EXISTS spec_gaps (
    gap_id TEXT PRIMARY KEY,                    -- e.g. "gap-minerals-001"
    spec_id TEXT NOT NULL,                      -- Specification with gap

    -- Gap Identification
    dimension_id TEXT NOT NULL,                 -- Which dimension is missing
    gap_type TEXT NOT NULL,                     -- missing, incomplete, unclear, contradictory
    gap_description TEXT NOT NULL,              -- What specifically is missing
    gap_severity TEXT NOT NULL,                 -- LOW, MEDIUM, HIGH, CRITICAL

    -- Impact Analysis
    blocks_tasks TEXT,                          -- JSON: tasks that can't start
    affects_features TEXT,                      -- JSON: features impacted
    risk_level TEXT,                            -- What risk does this create?
    business_impact TEXT,                       -- How does this affect product?

    -- Detection
    detected_by TEXT,                           -- System, agent, user
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detection_method TEXT,                      -- automated_scan, manual_review, task_blocked

    -- Resolution
    resolution_status TEXT DEFAULT 'OPEN',      -- OPEN, INVESTIGATING, RESOLVED, WONT_FIX
    resolution_method TEXT,                     -- interview, research, assumption, clarification
    resolved_by TEXT,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,

    -- Priority
    priority INTEGER DEFAULT 50,                -- 1-100 (urgency)
    recommended_action TEXT NOT NULL,           -- What to do about this

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id),
    FOREIGN KEY (dimension_id) REFERENCES universal_project_schema(dimension_id)
);

-- Interview sessions (structured user interviews)
CREATE TABLE IF NOT EXISTS interview_sessions (
    session_id TEXT PRIMARY KEY,                -- e.g. "interview-minerals-001"
    spec_id TEXT NOT NULL,                      -- Spec being expanded
    session_name TEXT NOT NULL,                 -- Clear session name

    -- Session Info
    session_type TEXT NOT NULL,                 -- gap_resolution, feature_discovery, validation, clarification
    session_goal TEXT NOT NULL,                 -- What we're trying to achieve
    target_gaps TEXT,                           -- JSON: gap IDs to resolve

    -- Session Planning
    questions_planned INTEGER DEFAULT 0,
    estimated_duration_minutes INTEGER,
    priority_dimensions TEXT,                   -- JSON: dimensions to focus on

    -- Session Execution
    status TEXT DEFAULT 'PLANNED',              -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    questions_asked INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    gaps_resolved INTEGER DEFAULT 0,

    -- Session Results
    new_information_captured TEXT,              -- JSON: key insights
    decisions_made TEXT,                        -- JSON: decisions from interview
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_topics TEXT,                      -- JSON: what to ask next time

    -- Quality
    completeness_score REAL DEFAULT 0.0,        -- 0-1 (how complete is spec now?)
    clarity_score REAL DEFAULT 0.0,             -- 0-1 (how clear is spec now?)
    confidence_score REAL DEFAULT 0.0,          -- 0-1 (how confident are we?)

    -- Participants
    interviewer TEXT,                           -- Who asked questions
    interviewee TEXT,                           -- Who answered
    conducted_by TEXT,                          -- Agent or human

    -- Timestamps
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spec_id) REFERENCES specs_registry(spec_id)
);

-- Interview questions (questions to ask users)
CREATE TABLE IF NOT EXISTS interview_questions (
    question_id TEXT PRIMARY KEY,               -- e.g. "q-minerals-001"
    session_id TEXT NOT NULL,                   -- Interview session
    dimension_id TEXT NOT NULL,                 -- What dimension this explores

    -- Question Definition
    question_text TEXT NOT NULL,                -- The actual question
    question_type TEXT NOT NULL,                -- open_ended, multiple_choice, yes_no, scale, matrix
    question_purpose TEXT NOT NULL,             -- Why we're asking this
    expected_information TEXT,                  -- What we hope to learn

    -- Question Context
    question_context TEXT,                      -- Background for user
    examples TEXT,                              -- JSON: example answers
    follow_up_questions TEXT,                   -- JSON: conditional follow-ups

    -- Question Configuration
    is_required BOOLEAN DEFAULT TRUE,           -- Must be answered?
    skip_conditions TEXT,                       -- JSON: when to skip this
    validation_rules TEXT,                      -- JSON: answer validation

    -- Question Ordering
    question_order INTEGER,                     -- Order in interview
    depends_on_questions TEXT,                  -- JSON: must answer these first

    -- Question Results
    status TEXT DEFAULT 'PENDING',              -- PENDING, ASKED, ANSWERED, SKIPPED
    answer_text TEXT,                           -- User's answer
    answer_structured TEXT,                     -- JSON: structured answer
    answer_confidence TEXT,                     -- LOW, MEDIUM, HIGH
    answer_notes TEXT,

    -- Answer Processing
    gaps_resolved TEXT,                         -- JSON: gap IDs this resolved
    new_gaps_discovered TEXT,                   -- JSON: new gaps found
    requires_clarification BOOLEAN DEFAULT FALSE,
    clarification_notes TEXT,

    -- Timestamps
    asked_at TIMESTAMP,
    answered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
    FOREIGN KEY (dimension_id) REFERENCES universal_project_schema(dimension_id)
);

-- Interview templates (reusable interview formats)
CREATE TABLE IF NOT EXISTS interview_templates (
    template_id TEXT PRIMARY KEY,               -- e.g. "webapp-discovery"
    template_name TEXT NOT NULL,
    template_description TEXT,

    -- Template Configuration
    template_type TEXT NOT NULL,                -- gap_resolution, feature_discovery, validation
    applies_to_project_types TEXT,             -- JSON: project types
    target_dimensions TEXT NOT NULL,            -- JSON: dimensions to explore

    -- Question Structure
    question_template TEXT NOT NULL,            -- JSON: question structure
    question_order TEXT NOT NULL,               -- JSON: recommended order
    conditional_logic TEXT,                     -- JSON: skip/follow-up rules

    -- Template Metrics
    avg_duration_minutes REAL,
    avg_questions_asked REAL,
    avg_gaps_resolved REAL,
    avg_completeness_improvement REAL,          -- How much spec improves

    -- Template Usage
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,              -- 0-1

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question bank (library of reusable questions)
CREATE TABLE IF NOT EXISTS question_bank (
    bank_question_id TEXT PRIMARY KEY,          -- e.g. "qb-purpose-001"
    dimension_id TEXT NOT NULL,

    -- Question Definition
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    question_category TEXT NOT NULL,            -- discovery, clarification, validation
    question_difficulty TEXT DEFAULT 'MEDIUM',  -- EASY, MEDIUM, HARD

    -- Question Metadata
    tags TEXT,                                  -- JSON: searchable tags
    use_cases TEXT,                             -- JSON: when to use this
    best_practices TEXT,                        -- Tips for asking

    -- Question Effectiveness
    times_used INTEGER DEFAULT 0,
    avg_gap_resolution_count REAL DEFAULT 0.0,  -- How many gaps it typically resolves
    effectiveness_score REAL DEFAULT 0.0,       -- 0-1

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dimension_id) REFERENCES universal_project_schema(dimension_id)
);

-- Gap resolution history (tracking how gaps were resolved)
CREATE TABLE IF NOT EXISTS gap_resolution_history (
    resolution_id INTEGER PRIMARY KEY AUTOINCREMENT,
    gap_id TEXT NOT NULL,
    session_id TEXT,
    question_id TEXT,

    -- Resolution Details
    resolution_method TEXT NOT NULL,            -- interview, research, assumption, clarification
    information_captured TEXT NOT NULL,         -- What was learned
    spec_updates TEXT,                          -- JSON: changes made to spec

    -- Quality
    confidence_level TEXT DEFAULT 'MEDIUM',     -- LOW, MEDIUM, HIGH
    validation_status TEXT DEFAULT 'NOT_VALIDATED', -- NOT_VALIDATED, VALIDATED, DISPUTED
    validation_notes TEXT,

    resolved_by TEXT,
    resolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (gap_id) REFERENCES spec_gaps(gap_id),
    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
    FOREIGN KEY (question_id) REFERENCES interview_questions(question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spec_gaps_spec ON spec_gaps(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_gaps_severity ON spec_gaps(gap_severity, resolution_status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_spec ON interview_sessions(spec_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_dimension ON interview_questions(dimension_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Critical gaps (high priority, unresolved)
CREATE VIEW IF NOT EXISTS critical_gaps AS
SELECT
    sg.gap_id,
    sg.spec_id,
    s.spec_name,
    sg.dimension_id,
    ups.dimension_name,
    sg.gap_description,
    sg.gap_severity,
    sg.business_impact,
    sg.priority,
    sg.resolution_status,
    sg.detected_at
FROM spec_gaps sg
JOIN specs_registry s ON sg.spec_id = s.spec_id
JOIN universal_project_schema ups ON sg.dimension_id = ups.dimension_id
WHERE sg.resolution_status = 'OPEN'
AND sg.gap_severity IN ('HIGH', 'CRITICAL')
ORDER BY sg.priority DESC, sg.detected_at ASC;

-- Spec completeness dashboard
CREATE VIEW IF NOT EXISTS spec_completeness_dashboard AS
SELECT
    s.spec_id,
    s.spec_name,
    COUNT(DISTINCT ups.dimension_id) as total_dimensions,
    COUNT(DISTINCT CASE WHEN sg.gap_id IS NULL THEN ups.dimension_id END) as complete_dimensions,
    COUNT(DISTINCT sg.gap_id) as total_gaps,
    COUNT(DISTINCT CASE WHEN sg.resolution_status = 'OPEN' THEN sg.gap_id END) as open_gaps,
    ROUND(
        CAST(COUNT(DISTINCT CASE WHEN sg.gap_id IS NULL THEN ups.dimension_id END) AS REAL) /
        NULLIF(COUNT(DISTINCT ups.dimension_id), 0) * 100, 1
    ) as completeness_percentage,
    COUNT(DISTINCT isc.session_id) as interview_sessions_conducted,
    AVG(isc.completeness_score) as avg_completeness_score
FROM specs_registry s
CROSS JOIN universal_project_schema ups
LEFT JOIN spec_gaps sg ON s.spec_id = sg.spec_id AND ups.dimension_id = sg.dimension_id
LEFT JOIN interview_sessions isc ON s.spec_id = isc.spec_id AND isc.status = 'COMPLETED'
GROUP BY s.spec_id;

-- Interview effectiveness
CREATE VIEW IF NOT EXISTS interview_effectiveness AS
SELECT
    is2.session_id,
    is2.spec_id,
    s.spec_name,
    is2.session_type,
    is2.questions_asked,
    is2.questions_answered,
    is2.gaps_resolved,
    ROUND(CAST(is2.gaps_resolved AS REAL) / NULLIF(is2.questions_asked, 0), 2) as gaps_per_question,
    is2.completeness_score,
    is2.clarity_score,
    is2.confidence_score,
    CAST((julianday(is2.completed_at) - julianday(is2.started_at)) * 24 * 60 AS INTEGER) as duration_minutes,
    is2.started_at,
    is2.completed_at
FROM interview_sessions is2
JOIN specs_registry s ON is2.spec_id = s.spec_id
WHERE is2.status = 'COMPLETED'
ORDER BY is2.completed_at DESC;

-- Question effectiveness
CREATE VIEW IF NOT EXISTS question_effectiveness AS
SELECT
    qb.bank_question_id,
    qb.dimension_id,
    ups.dimension_name,
    qb.question_text,
    qb.question_type,
    qb.times_used,
    qb.avg_gap_resolution_count,
    qb.effectiveness_score,
    COUNT(DISTINCT iq.question_id) as times_asked,
    COUNT(DISTINCT CASE WHEN iq.status = 'ANSWERED' THEN iq.question_id END) as times_answered,
    AVG(CASE WHEN iq.status = 'ANSWERED' THEN
        json_array_length(iq.gaps_resolved)
    END) as avg_gaps_resolved_per_use
FROM question_bank qb
JOIN universal_project_schema ups ON qb.dimension_id = ups.dimension_id
LEFT JOIN interview_questions iq ON qb.question_text = iq.question_text
GROUP BY qb.bank_question_id;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update interview session metrics
CREATE TRIGGER IF NOT EXISTS update_interview_metrics
AFTER UPDATE ON interview_questions
FOR EACH ROW
WHEN NEW.status = 'ANSWERED' AND OLD.status != 'ANSWERED'
BEGIN
    UPDATE interview_sessions
    SET
        questions_answered = questions_answered + 1,
        gaps_resolved = gaps_resolved + COALESCE(json_array_length(NEW.gaps_resolved), 0)
    WHERE session_id = NEW.session_id;
END;

-- Mark gaps as resolved when answered
CREATE TRIGGER IF NOT EXISTS resolve_gaps_from_answers
AFTER UPDATE ON interview_questions
FOR EACH ROW
WHEN NEW.status = 'ANSWERED' AND NEW.gaps_resolved IS NOT NULL
BEGIN
    -- This would require JSON processing - simplified for now
    UPDATE spec_gaps
    SET
        resolution_status = 'RESOLVED',
        resolution_method = 'interview',
        resolved_at = CURRENT_TIMESTAMP
    WHERE gap_id IN (
        SELECT value FROM json_each(NEW.gaps_resolved)
    );
END;

-- Calculate completeness score after session
CREATE TRIGGER IF NOT EXISTS calculate_completeness_after_interview
AFTER UPDATE ON interview_sessions
FOR EACH ROW
WHEN NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED'
BEGIN
    UPDATE interview_sessions
    SET
        completeness_score = (
            SELECT CAST(COUNT(DISTINCT CASE WHEN sg.gap_id IS NULL THEN ups.dimension_id END) AS REAL) /
                   NULLIF(COUNT(DISTINCT ups.dimension_id), 0)
            FROM universal_project_schema ups
            LEFT JOIN spec_gaps sg ON sg.spec_id = NEW.spec_id
                AND sg.dimension_id = ups.dimension_id
                AND sg.resolution_status != 'RESOLVED'
        )
    WHERE session_id = NEW.session_id;
END;

-- ============================================================================
-- Universal Project Schema Data (The 10 Dimensions)
-- ============================================================================

INSERT OR IGNORE INTO universal_project_schema (
    dimension_id,
    dimension_name,
    dimension_category,
    dimension_description,
    why_critical,
    required_fields,
    gap_indicators,
    gap_severity,
    discovery_questions,
    always_required,
    priority
) VALUES

-- 1. PURPOSE & VISION
(
    'purpose-vision',
    'Purpose & Vision',
    'strategy',
    'Why the project exists and what problem it solves',
    'Without clear purpose, team can''t make aligned decisions or prioritize features',
    '["problem_statement", "solution_approach", "target_outcome", "success_definition"]',
    '["spec has no why statement", "unclear what problem is being solved", "no vision statement"]',
    'CRITICAL',
    '[
        "What problem are you trying to solve with this project?",
        "Who experiences this problem and how does it affect them?",
        "What would success look like? How would you know the problem is solved?",
        "What is the core value this project will provide?"
    ]',
    TRUE,
    100
),

-- 2. TARGET USERS
(
    'target-users',
    'Target Users',
    'product',
    'Who will use this and what are their needs',
    'Can''t design good UX or prioritize features without knowing users',
    '["user_personas", "user_needs", "user_pain_points", "user_goals"]',
    '["no user personas defined", "unclear who will use this", "no user research mentioned"]',
    'CRITICAL',
    '[
        "Who are the primary users of this project?",
        "What are their main goals when using this?",
        "What pain points or frustrations do they currently have?",
        "How tech-savvy are they? What devices do they use?"
    ]',
    TRUE,
    95
),

-- 3. CORE FEATURES
(
    'core-features',
    'Core Features',
    'product',
    'What the project must do - essential vs nice-to-have',
    'Without feature prioritization, scope creeps and nothing ships',
    '["must_have_features", "nice_to_have_features", "feature_priorities", "mvp_scope"]',
    '["no feature list", "everything marked high priority", "mvp not defined"]',
    'HIGH',
    '[
        "What are the absolutely essential features for v1?",
        "What features would be nice but aren''t critical?",
        "If you had to ship in 2 weeks, what would you include?",
        "What features can wait for v2?"
    ]',
    TRUE,
    90
),

-- 4. SUCCESS CRITERIA
(
    'success-criteria',
    'Success Criteria',
    'product',
    'How we know the project is working and delivering value',
    'Can''t validate success or make data-driven decisions without metrics',
    '["success_metrics", "acceptance_criteria", "kpis", "measurement_methods"]',
    '["no metrics defined", "no acceptance criteria", "unclear how to validate success"]',
    'HIGH',
    '[
        "How will you measure if this project is successful?",
        "What specific metrics or KPIs matter?",
        "What would make you consider this a failure?",
        "How will you track these metrics?"
    ]',
    TRUE,
    85
),

-- 5. TECHNICAL STACK
(
    'technical-stack',
    'Technical Stack',
    'technical',
    'Technologies, frameworks, and technical constraints',
    'Can''t start building without knowing tech stack and constraints',
    '["programming_languages", "frameworks", "databases", "infrastructure", "constraints"]',
    '["no tech stack specified", "framework not chosen", "infrastructure unclear"]',
    'HIGH',
    '[
        "What technologies or frameworks should we use?",
        "Are there any technical constraints we must work within?",
        "What infrastructure or hosting requirements exist?",
        "Any existing systems we need to integrate with?"
    ]',
    TRUE,
    80
),

-- 6. USER EXPERIENCE
(
    'user-experience',
    'User Experience',
    'product',
    'How the project should feel and UX priorities',
    'UX drives adoption and satisfaction - must be intentional',
    '["ux_principles", "interaction_patterns", "accessibility_requirements", "responsive_design"]',
    '["no UX guidance", "accessibility not mentioned", "no design principles"]',
    'MEDIUM',
    '[
        "How should this feel to use? What''s the desired user experience?",
        "What are your accessibility requirements?",
        "Should this work on mobile? What devices are priority?",
        "Any design language or style guidelines to follow?"
    ]',
    TRUE,
    75
),

-- 7. DATA & CONTENT
(
    'data-content',
    'Data & Content',
    'technical',
    'What data the project handles and how it''s structured',
    'Data model drives architecture - must be clear early',
    '["data_model", "data_sources", "data_flows", "content_types"]',
    '["no data model", "unclear what data is needed", "no schema defined"]',
    'HIGH',
    '[
        "What data does this project need to store and manage?",
        "Where does the data come from? What are the sources?",
        "How should the data be structured?",
        "What data privacy or security concerns exist?"
    ]',
    TRUE,
    70
),

-- 8. INTEGRATIONS
(
    'integrations',
    'Integrations',
    'technical',
    'External systems and APIs to integrate with',
    'Integration complexity affects timeline and architecture',
    '["external_apis", "third_party_services", "authentication_methods", "data_sync"]',
    '["no integrations listed", "external APIs not specified", "auth unclear"]',
    'MEDIUM',
    '[
        "What external systems need to be integrated?",
        "What third-party APIs or services will you use?",
        "How will authentication work?",
        "Any data synchronization requirements?"
    ]',
    FALSE,
    65
),

-- 9. DEPLOYMENT
(
    'deployment',
    'Deployment',
    'technical',
    'Where and how the project will be deployed',
    'Deployment strategy affects architecture and cost',
    '["hosting_platform", "deployment_method", "environment_setup", "ci_cd"]',
    '["no deployment plan", "hosting not chosen", "no CI/CD mentioned"]',
    'MEDIUM',
    '[
        "Where will this be hosted/deployed?",
        "What environments do you need (dev, staging, prod)?",
        "How should deployment work? Manual or automated?",
        "Any uptime or reliability requirements?"
    ]',
    TRUE,
    60
),

-- 10. BUSINESS MODEL
(
    'business-model',
    'Business Model',
    'business',
    'How the project creates and captures value',
    'Revenue model affects features and monetization strategy',
    '["revenue_model", "pricing_strategy", "cost_structure", "value_proposition"]',
    '["no business model", "monetization unclear", "pricing not defined"]',
    'MEDIUM',
    '[
        "How will this generate revenue or create value?",
        "What''s the pricing strategy?",
        "What are the expected costs?",
        "What''s the target ROI or payback period?"
    ]',
    FALSE,
    55
);

-- ============================================================================
-- Sample Interview Template
-- ============================================================================

INSERT OR IGNORE INTO interview_templates (
    template_id,
    template_name,
    template_description,
    template_type,
    applies_to_project_types,
    target_dimensions,
    question_template,
    question_order
) VALUES (
    'webapp-discovery',
    'Web Application Discovery Interview',
    'Standard interview template for new web application projects',
    'feature_discovery',
    '["webapp", "saas", "platform"]',
    '["purpose-vision", "target-users", "core-features", "technical-stack", "user-experience"]',
    '{
        "sections": [
            {"name": "Vision & Purpose", "dimensions": ["purpose-vision"], "questions": 3},
            {"name": "Users & Needs", "dimensions": ["target-users"], "questions": 4},
            {"name": "Features & Scope", "dimensions": ["core-features"], "questions": 5},
            {"name": "Tech & UX", "dimensions": ["technical-stack", "user-experience"], "questions": 4}
        ]
    }',
    '["purpose-vision", "target-users", "core-features", "technical-stack", "user-experience"]'
);
