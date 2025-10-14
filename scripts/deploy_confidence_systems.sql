-- Confidence Systems Database Schema Deployment
-- Created: 2025-10-13
-- Purpose: Deploy missing confidence system tables for Central-MCP

BEGIN TRANSACTION;

-- 1. Confidence Audit Log Table
CREATE TABLE IF NOT EXISTS confidence_audit_log (
    id TEXT PRIMARY KEY,
    claim TEXT NOT NULL,
    confidence_level REAL NOT NULL,
    evidence_type TEXT NOT NULL,
    evidence_result TEXT,
    bayesian_update REAL,
    cognitive_bias_detected TEXT DEFAULT 'NONE',
    bias_correction_applied REAL DEFAULT 1.0,
    metacognitive_state TEXT,
    uncertainty_quantification REAL DEFAULT 0.0,
    validation_method TEXT DEFAULT 'AUTOMATED',
    agent_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Temporal Confidence History Table
CREATE TABLE IF NOT EXISTS temporal_confidence_history (
    id TEXT PRIMARY KEY,
    confidence_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_value REAL NOT NULL,
    trend_direction TEXT DEFAULT 'STABLE',
    anomaly_detected BOOLEAN DEFAULT FALSE,
    anomaly_severity REAL DEFAULT 0.0,
    system_health_impact REAL DEFAULT 0.0,
    performance_projection REAL DEFAULT 0.0,
    FOREIGN KEY (confidence_id) REFERENCES confidence_audit_log(id)
);

-- 3. Counterfactual Analysis Table
CREATE TABLE IF NOT EXISTS counterfactual_analysis (
    id TEXT PRIMARY KEY,
    confidence_id TEXT NOT NULL,
    failure_scenario TEXT NOT NULL,
    failure_probability REAL DEFAULT 0.0,
    impact_level TEXT DEFAULT 'LOW',
    mitigation_strategy TEXT,
    resilience_score REAL DEFAULT 0.0,
    risk_assessment TEXT,
    sensitivity_factors TEXT, -- JSON array
    monte_carlo_iterations INTEGER DEFAULT 1000,
    confidence_interval_lower REAL DEFAULT 0.0,
    confidence_interval_upper REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (confidence_id) REFERENCES confidence_audit_log(id)
);

-- 4. Bias Detection Records Table
CREATE TABLE IF NOT EXISTS bias_detections (
    id TEXT PRIMARY KEY,
    confidence_id TEXT NOT NULL,
    bias_type TEXT NOT NULL, -- optimism, confirmation, completion, authority, availability, anchoring
    bias_score REAL NOT NULL,
    detection_confidence REAL DEFAULT 0.0,
    automatic_correction BOOLEAN DEFAULT FALSE,
    manual_override BOOLEAN DEFAULT FALSE,
    correction_effectiveness REAL DEFAULT 0.0,
    learning_rate_adjustment REAL DEFAULT 0.0,
    agent_behavioral_profile TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (confidence_id) REFERENCES confidence_audit_log(id)
);

-- 5. Calibration Metrics Table
CREATE TABLE IF NOT EXISTS calibration_metrics (
    id TEXT PRIMARY KEY,
    confidence_id TEXT NOT NULL,
    predicted_confidence REAL NOT NULL,
    actual_outcome REAL NOT NULL,
    brier_score REAL DEFAULT 0.0,
    reliability_diagram_bin INTEGER DEFAULT 0,
    expected_calibration_error REAL DEFAULT 0.0,
    maximum_calibration_error REAL DEFAULT 0.0,
    learning_effectiveness TEXT DEFAULT 'UNKNOWN',
    adaptive_weight_adjustment REAL DEFAULT 0.0,
    validation_curve_stage TEXT DEFAULT 'INITIAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (confidence_id) REFERENCES confidence_audit_log(id)
);

-- 6. Knowledge Boundaries Table
CREATE TABLE IF NOT EXISTS knowledge_boundaries (
    id TEXT PRIMARY KEY,
    confidence_id TEXT NOT NULL,
    boundary_type TEXT NOT NULL, -- KNOWN_KNOWN, KNOWN_UNKNOWN, UNKNOWN_UNKNOWN
    knowledge_domain TEXT NOT NULL,
    uncertainty_source TEXT NOT NULL, -- aleatory, epistemic, ontological
    uncertainty_value REAL DEFAULT 0.0,
    stability_analysis REAL DEFAULT 0.0,
    introspection_result TEXT,
    learning_recommendation TEXT,
    strategic_insight TEXT,
    meta_learning_capability REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (confidence_id) REFERENCES confidence_audit_log(id)
);

-- 7. Evidence Fusion Results Table
CREATE TABLE IF NOT EXISTS evidence_fusion (
    id TEXT PRIMARY KEY,
    confidence_id TEXT NOT NULL,
    evidence_source TEXT NOT NULL,
    source_reliability REAL DEFAULT 1.0,
    evidence_weight REAL DEFAULT 1.0,
    fusion_method TEXT DEFAULT 'WEIGHTED_AVERAGE',
    ensemble_agreement REAL DEFAULT 0.0,
    cross_validation_score REAL DEFAULT 0.0,
    stability_score REAL DEFAULT 0.0,
    robustness_score REAL DEFAULT 0.0,
    generalization_score REAL DEFAULT 0.0,
    uncertainty_propagation REAL DEFAULT 0.0,
    unified_confidence REAL DEFAULT 0.0,
    confidence_interval_lower REAL DEFAULT 0.0,
    confidence_interval_upper REAL DEFAULT 1.0,
    validation_metrics TEXT, -- JSON object
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (confidence_id) REFERENCES confidence_audit_log(id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_confidence_audit_created_at ON confidence_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_confidence_audit_agent_id ON confidence_audit_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_temporal_confidence_timestamp ON temporal_confidence_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_temporal_confidence_confidence_id ON temporal_confidence_history(confidence_id);
CREATE INDEX IF NOT EXISTS idx_counterfactual_confidence_id ON counterfactual_analysis(confidence_id);
CREATE INDEX IF NOT EXISTS idx_bias_detections_confidence_id ON bias_detections(confidence_id);
CREATE INDEX IF NOT EXISTS idx_bias_detections_type ON bias_detections(bias_type);
CREATE INDEX IF NOT EXISTS idx_calibration_metrics_confidence_id ON calibration_metrics(confidence_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_boundaries_confidence_id ON knowledge_boundaries(confidence_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_boundaries_type ON knowledge_boundaries(boundary_type);
CREATE INDEX IF NOT EXISTS idx_evidence_fusion_confidence_id ON evidence_fusion(confidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_fusion_source ON evidence_fusion(evidence_source);

COMMIT;

-- Verification
SELECT 'Confidence System Tables Deployed Successfully' as status,
       (SELECT COUNT(*) FROM confidence_audit_log) as audit_records,
       (SELECT COUNT(*) FROM temporal_confidence_history) as temporal_records,
       (SELECT COUNT(*) FROM counterfactual_analysis) as counterfactual_records,
       (SELECT COUNT(*) FROM bias_detections) as bias_records,
       (SELECT COUNT(*) FROM calibration_metrics) as calibration_records,
       (SELECT COUNT(*) FROM knowledge_boundaries) as boundary_records,
       (SELECT COUNT(*) FROM evidence_fusion) as fusion_records;