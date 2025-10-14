-- 🧠 AGENT TRUST & CONTEXT VALIDATION SYSTEM
-- Integration with Central-MCP Physiology Database
-- Built: 2025-10-13 | Purpose: Complete agent trustworthiness framework

-- 1. AGENT TRUST VALIDATION TABLE
CREATE TABLE IF NOT EXISTS agent_trust_validation (
  validation_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  validation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trust_score REAL NOT NULL CHECK (trust_score >= 0 AND trust_score <= 1),
  reliability_score REAL NOT NULL CHECK (reliability_score >= 0 AND reliability_score <= 1),
  competence_score REAL NOT NULL CHECK (competence_score >= 0 AND competence_score <= 1),
  communication_score REAL NOT NULL CHECK (communication_score >= 0 AND communication_score <= 1),
  consistency_score REAL NOT NULL CHECK (consistency_score >= 0 AND consistency_score <= 1),
  adaptability_score REAL NOT NULL CHECK (adaptability_score >= 0 AND adaptability_score <= 1),
  validation_method TEXT NOT NULL,
  test_cases_evaluated INTEGER DEFAULT 0,
  confidence_level REAL NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
  external_validation BOOLEAN DEFAULT FALSE,
  validation_agent TEXT,
  performance_sample_size INTEGER DEFAULT 0,
  trend_analysis TEXT, -- IMPROVING/STABLE/DECLINING
  calibration_accuracy REAL DEFAULT 0.5,
  FOREIGN KEY (agent_id) REFERENCES agent_capabilities(agent_id)
);

-- 2. CONTEXT QUALITY ASSESSMENT TABLE
CREATE TABLE IF NOT EXISTS context_quality_assessment (
  context_id TEXT PRIMARY KEY,
  assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  task_id TEXT,
  vision_id TEXT,
  project_id TEXT,
  context_quality_score REAL NOT NULL CHECK (context_quality_score >= 0 AND context_quality_score <= 1),
  completeness_score REAL NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 1),
  accuracy_score REAL NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  relevance_score REAL NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  specificity_score REAL NOT NULL CHECK (specificity_score >= 0 AND specificity_score <= 1),
  consistency_score REAL NOT NULL CHECK (consistency_score >= 0 AND consistency_score <= 1),
  gaps_identified TEXT, -- JSON array of missing elements
  recommendations TEXT, -- JSON array of improvement suggestions
  validation_agent TEXT,
  enhancement_applied BOOLEAN DEFAULT FALSE,
  original_quality REAL,
  improvement_amount REAL,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (vision_id) REFERENCES vision_registry(vision_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 3. AGENT-CONTEXT MATCHING TABLE
CREATE TABLE IF NOT EXISTS agent_context_matching (
  match_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  context_id TEXT NOT NULL,
  task_id TEXT,
  vision_id TEXT,
  project_id TEXT,
  match_score REAL NOT NULL CHECK (match_score >= 0 AND match_score <= 1),
  skill_match_score REAL NOT NULL CHECK (skill_match_score >= 0 AND skill_match_score <= 1),
  context_fit_score REAL NOT NULL CHECK (context_fit_score >= 0 AND context_fit_score <= 1),
  historical_performance_score REAL NOT NULL CHECK (historical_performance_score >= 0 AND historical_performance_score <= 1),
  availability_score REAL NOT NULL CHECK (availability_score >= 0 AND availability_score <= 1),
  trust_weighted_score REAL NOT NULL CHECK (trust_weighted_score >= 0 AND trust_weighted_score <= 1),
  match_confidence REAL NOT NULL CHECK (match_confidence >= 0 AND match_confidence <= 1),
  recommendation BOOLEAN DEFAULT FALSE,
  match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  outcome_tracking TEXT, -- Track actual performance vs prediction
  actual_success_rate REAL,
  prediction_accuracy REAL,
  FOREIGN KEY (agent_id) REFERENCES agent_capabilities(agent_id),
  FOREIGN KEY (context_id) REFERENCES context_quality_assessment(context_id),
  FOREIGN KEY (vision_id) REFERENCES vision_registry(vision_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 4. AGENT PERFORMANCE TRACKING TABLE
CREATE TABLE IF NOT EXISTS agent_performance_tracking (
  performance_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_id TEXT,
  vision_id TEXT,
  project_id TEXT,
  performance_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  task_complexity REAL CHECK (task_complexity >= 0 AND task_complexity <= 1),
  completion_time_ms INTEGER,
  quality_score REAL CHECK (quality_score >= 0 AND quality_score <= 1),
  success BOOLEAN,
  error_count INTEGER DEFAULT 0,
  context_quality REAL,
  predicted_success_rate REAL,
  actual_vs_predicted_delta REAL,
  feedback_score REAL CHECK (feedback_score >= 0 AND feedback_score <= 1),
  learning_insights TEXT, -- JSON array of lessons learned
  improvement_recommendations TEXT, -- JSON array
  FOREIGN KEY (agent_id) REFERENCES agent_capabilities(agent_id),
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (vision_id) REFERENCES vision_registry(vision_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 5. TRUST RELIABILITY TRACKING TABLE
CREATE TABLE IF NOT EXISTS trust_reliability_tracking (
  reliability_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  predicted_trust_score REAL CHECK (predicted_trust_score >= 0 AND predicted_trust_score <= 1),
  actual_performance_outcome REAL CHECK (actual_performance_outcome >= 0 AND actual_performance_outcome <= 1),
  prediction_accuracy REAL CHECK (prediction_accuracy >= 0 AND prediction_accuracy <= 1),
  confidence_interval REAL,
  sample_size INTEGER,
  calibration_error REAL,
  time_horizon_days INTEGER,
  prediction_method TEXT,
  external_validation BOOLEAN DEFAULT FALSE,
  learning_applied BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (agent_id) REFERENCES agent_capabilities(agent_id)
);

-- 6. VISION VALIDATION ENHANCEMENT
ALTER TABLE vision_implementation_validation
ADD COLUMN assigned_agent_trust_score REAL DEFAULT 0.5,
ADD COLUMN context_quality_score REAL DEFAULT 0.5,
ADD COLUMN agent_match_confidence REAL DEFAULT 0.5,
ADD COLUMN trust_enhanced_confidence REAL DEFAULT 0.5,
ADD COLUMN trust_analysis_results TEXT; -- JSON object

-- 7. ENHANCED INDICES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agent_trust_validation_agent_id ON agent_trust_validation(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_trust_validation_date ON agent_trust_validation(validation_date);
CREATE INDEX IF NOT EXISTS idx_context_quality_assessment_vision_id ON context_quality_assessment(vision_id);
CREATE INDEX IF NOT EXISTS idx_agent_context_matching_agent_id ON agent_context_matching(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_context_matching_score ON agent_context_matching(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_performance_tracking_agent_id ON agent_performance_tracking(agent_id);
CREATE INDEX IF NOT EXISTS idx_trust_reliability_tracking_agent_id ON trust_reliability_tracking(agent_id);

-- 8. TRIGGERS FOR AUTOMATIC TRUST SCORE UPDATES
CREATE TRIGGER IF NOT EXISTS update_agent_trust_on_performance
AFTER INSERT ON agent_performance_tracking
FOR EACH ROW
BEGIN
  -- Update agent capabilities with new performance data
  UPDATE agent_capabilities SET
    trust_score = (
      SELECT AVG(CASE WHEN success = 1 THEN quality_score ELSE 0 END)
      FROM agent_performance_tracking
      WHERE agent_id = NEW.agent_id
      AND performance_date > datetime('now', '-30 days')
    ),
    last_trust_assessment = CURRENT_TIMESTAMP,
    performance_trend = CASE
      WHEN (
        SELECT AVG(CASE WHEN success = 1 THEN quality_score ELSE 0 END)
        FROM agent_performance_tracking
        WHERE agent_id = NEW.agent_id
        AND performance_date > datetime('now', '-7 days')
      ) > (
        SELECT AVG(CASE WHEN success = 1 THEN quality_score ELSE 0 END)
        FROM agent_performance_tracking
        WHERE agent_id = NEW.agent_id
        AND performance_date BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days')
      ) THEN 'IMPROVING'
      WHEN (
        SELECT AVG(CASE WHEN success = 1 THEN quality_score ELSE 0 END)
        FROM agent_performance_tracking
        WHERE agent_id = NEW.agent_id
        AND performance_date > datetime('now', '-7 days')
      ) < (
        SELECT AVG(CASE WHEN success = 1 THEN quality_score ELSE 0 END)
        FROM agent_performance_tracking
        WHERE agent_id = NEW.agent_id
        AND performance_date BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days')
      ) THEN 'DECLINING'
      ELSE 'STABLE'
    END
  WHERE agent_id = NEW.agent_id;
END;

CREATE TRIGGER IF NOT EXISTS update_match_accuracy_on_outcome
AFTER UPDATE OF actual_success_rate ON agent_context_matching
FOR EACH ROW
WHEN NEW.actual_success_rate IS NOT NULL
BEGIN
  -- Update prediction accuracy for future matching
  UPDATE agent_context_matching SET
    prediction_accuracy = 1 - ABS(NEW.actual_success_rate - match_score),
    outcome_tracking = JSON_OBJECT(
      'predicted', match_score,
      'actual', NEW.actual_success_rate,
      'accuracy', 1 - ABS(NEW.actual_success_rate - match_score),
      'date', CURRENT_TIMESTAMP
    )
  WHERE match_id = NEW.match_id;
END;

-- 9. VIEWS FOR ENHANCED MONITORING
CREATE VIEW IF NOT EXISTS v_agent_trust_dashboard AS
SELECT
  ac.agent_id,
  ac.agent_model,
  ac.skill_category,
  ac.trust_score,
  ac.reliability_score,
  ac.context_fit_score,
  ac.performance_trend,
  ac.last_trust_assessment,
  atv.validation_date as latest_validation,
  atv.competence_score,
  atv.communication_score,
  atv.consistency_score,
  atv.adaptability_score,
  apt.recent_success_rate,
  apt.recent_task_count,
  CASE
    WHEN ac.trust_score >= 0.9 THEN 'HIGH_TRUST'
    WHEN ac.trust_score >= 0.7 THEN 'MEDIUM_TRUST'
    WHEN ac.trust_score >= 0.5 THEN 'LOW_TRUST'
    ELSE 'CRITICAL'
  END as trust_level,
  CASE
    WHEN ac.performance_trend = 'IMPROVING' THEN '📈'
    WHEN ac.performance_trend = 'DECLINING' THEN '📉'
    ELSE '➡️'
  END as trend_indicator
FROM agent_capabilities ac
LEFT JOIN agent_trust_validation atv ON ac.agent_id = atv.agent_id
LEFT JOIN (
  SELECT
    agent_id,
    AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) as recent_success_rate,
    COUNT(*) as recent_task_count
  FROM agent_performance_tracking
  WHERE performance_date > datetime('now', '-30 days')
  GROUP BY agent_id
) apt ON ac.agent_id = apt.agent_id
ORDER BY ac.trust_score DESC;

CREATE VIEW IF NOT EXISTS v_context_quality_dashboard AS
SELECT
  cqa.context_id,
  cqa.vision_id,
  cqa.project_id,
  cqa.context_quality_score,
  cqa.completeness_score,
  cqa.accuracy_score,
  cqa.relevance_score,
  cqa.specificity_score,
  cqa.consistency_score,
  cqa.enhancement_applied,
  cqa.improvement_amount,
  vr.user_intent as vision_intent,
  p.project_name,
  CASE
    WHEN cqa.context_quality_score >= 0.9 THEN 'OPTIMAL'
    WHEN cqa.context_quality_score >= 0.8 THEN 'GOOD'
    WHEN cqa.context_quality_score >= 0.7 THEN 'ACCEPTABLE'
    ELSE 'NEEDS_IMPROVEMENT'
  END as quality_level,
  JSON_ARRAY_LENGTH(cqa.gaps_identified) as gap_count,
  JSON_ARRAY_LENGTH(cqa.recommendations) as recommendation_count
FROM context_quality_assessment cqa
LEFT JOIN vision_registry vr ON cqa.vision_id = vr.vision_id
LEFT JOIN projects p ON cqa.project_id = p.project_id
ORDER BY cqa.context_quality_score DESC;

CREATE VIEW IF NOT EXISTS v_agent_context_matching_dashboard AS
SELECT
  acm.match_id,
  acm.agent_id,
  acm.vision_id,
  acm.project_id,
  acm.match_score,
  acm.trust_weighted_score,
  acm.match_confidence,
  acm.recommendation,
  acm.actual_success_rate,
  acm.prediction_accuracy,
  ac.trust_score,
  acm.skill_match_score,
  acm.context_fit_score,
  vr.user_intent as vision_intent,
  CASE
    WHEN acm.recommendation = 1 AND acm.prediction_accuracy > 0.8 THEN 'SUCCESSFUL_MATCH'
    WHEN acm.recommendation = 1 AND acm.prediction_accuracy < 0.6 THEN 'POOR_MATCH'
    WHEN acm.recommendation = 0 AND acm.actual_success_rate > 0.8 THEN 'MISSED_OPPORTUNITY'
    ELSE 'CORRECTLY_NOT_RECOMMENDED'
  END as match_assessment,
  CASE
    WHEN acm.actual_success_rate IS NOT NULL THEN 'COMPLETED'
    ELSE 'PENDING'
  END as status
FROM agent_context_matching acm
LEFT JOIN agent_capabilities ac ON acm.agent_id = ac.agent_id
LEFT JOIN vision_registry vr ON acm.vision_id = vr.vision_id
ORDER BY acm.match_score DESC;

-- Success message
SELECT 'Agent Trust & Context System database schema created successfully!' as status;