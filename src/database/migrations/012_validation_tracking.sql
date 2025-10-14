-- ═══════════════════════════════════════════════════════════════════
-- 012: VALIDATION TRACKING - SPEC LIFECYCLE & TOTALITY VERIFICATION
-- ═══════════════════════════════════════════════════════════════════
-- Created: 2025-10-11
-- Purpose: Track spec validations, lifecycle stages, and completeness
--
-- Systems Using This:
-- - SpecLifecycleValidator: 4-layer validation tracking
-- - TotalityVerificationSystem: Completeness verification
-- - Loop 0 (SystemStatusLoop): Totality checks
-- - Loop 7 (SpecGenerationLoop): Spec lifecycle management
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- SPEC VALIDATIONS - Complete validation results
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spec_validations (
  -- Identity
  id TEXT PRIMARY KEY,
  spec_id TEXT,                          -- FK to specs table (if exists)
  spec_path TEXT NOT NULL,

  -- Validation Layers (4-layer system)
  layer1_spec_structure_passed BOOLEAN DEFAULT 0,
  layer1_details TEXT,                   -- JSON

  layer2_implementation_passed BOOLEAN DEFAULT 0,
  layer2_details TEXT,                   -- JSON

  layer3_runtime_performance_passed BOOLEAN DEFAULT 0,
  layer3_details TEXT,                   -- JSON

  layer4_browser_testing_passed BOOLEAN DEFAULT 0,
  layer4_details TEXT,                   -- JSON

  -- Overall Results
  all_layers_passed BOOLEAN DEFAULT 0,
  passed_layers INTEGER DEFAULT 0,       -- Count of passed layers
  total_layers INTEGER DEFAULT 4,

  -- Lifecycle Stage
  lifecycle_stage TEXT NOT NULL DEFAULT 'spec_incomplete',
  -- Possible values:
  -- 'spec_incomplete' - Spec structure not complete
  -- 'spec_complete' - Spec structure validated
  -- 'implementation_incomplete' - Implementation not done
  -- 'implementation_complete' - Implementation validated
  -- 'runtime_validated' - Runtime performance validated
  -- 'production_ready' - All layers passed

  -- Metadata
  validated_at TEXT DEFAULT (datetime('now')),
  validator_version TEXT DEFAULT '1.0.0'
);

CREATE INDEX IF NOT EXISTS idx_spec_validations_spec_id ON spec_validations(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_validations_lifecycle ON spec_validations(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_spec_validations_all_passed ON spec_validations(all_layers_passed);
CREATE INDEX IF NOT EXISTS idx_spec_validations_validated_at ON spec_validations(validated_at);

-- ───────────────────────────────────────────────────────────────────
-- SPEC LIFECYCLE HISTORY - Track lifecycle stage changes
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spec_lifecycle_history (
  -- Identity
  id TEXT PRIMARY KEY,
  spec_id TEXT NOT NULL,
  validation_id TEXT,

  -- Stage Change
  from_stage TEXT,
  to_stage TEXT NOT NULL,

  -- Why Changed
  reason TEXT,                           -- Why stage changed
  triggered_by TEXT DEFAULT 'validation', -- 'validation', 'manual', 'system'

  -- Metadata
  changed_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (validation_id) REFERENCES spec_validations(id)
);

CREATE INDEX IF NOT EXISTS idx_spec_lifecycle_spec ON spec_lifecycle_history(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_lifecycle_to_stage ON spec_lifecycle_history(to_stage);
CREATE INDEX IF NOT EXISTS idx_spec_lifecycle_changed_at ON spec_lifecycle_history(changed_at);

-- ───────────────────────────────────────────────────────────────────
-- TOTALITY REPORTS - Completeness verification
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS totality_reports (
  -- Identity
  id TEXT PRIMARY KEY,

  -- Overall Completeness
  overall_completeness REAL NOT NULL,    -- 0.0 to 1.0

  -- Layer Completeness (6-layer system)
  layer1_message_capture REAL,          -- % of messages captured
  layer2_insight_extraction REAL,       -- % of messages → insights
  layer3_spec_generation REAL,          -- % of insights → specs
  layer4_task_creation REAL,            -- % of specs → tasks
  layer5_implementation REAL,           -- % of tasks → implemented
  layer6_validation REAL,               -- % of implementations → validated

  -- Gap Summary
  total_gaps INTEGER DEFAULT 0,
  gap_details TEXT,                      -- JSON array of gaps

  -- Recommendations
  recommendations TEXT,                  -- JSON array of recommendations

  -- Metadata
  generated_at TEXT DEFAULT (datetime('now')),
  generated_by TEXT DEFAULT 'loop_0'     -- 'loop_0', 'manual', 'mcp_tool'
);

CREATE INDEX IF NOT EXISTS idx_totality_completeness ON totality_reports(overall_completeness);
CREATE INDEX IF NOT EXISTS idx_totality_gaps ON totality_reports(total_gaps);
CREATE INDEX IF NOT EXISTS idx_totality_generated_at ON totality_reports(generated_at);

-- ───────────────────────────────────────────────────────────────────
-- TOTALITY GAPS - Specific unprocessed entities
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS totality_gaps (
  -- Identity
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,

  -- Gap Details
  gap_category TEXT NOT NULL,           -- 'UNEXTRACTED_INSIGHT', 'UNSPECCED_INSIGHT', etc.
  entity_type TEXT NOT NULL,            -- 'message', 'insight', 'spec', 'task'
  entity_id TEXT,                       -- Reference to specific entity

  -- Impact
  severity TEXT DEFAULT 'medium',       -- 'critical', 'high', 'medium', 'low'
  description TEXT NOT NULL,

  -- Resolution
  resolved BOOLEAN DEFAULT 0,
  resolved_at TEXT,
  resolution_notes TEXT,

  -- Metadata
  detected_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (report_id) REFERENCES totality_reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_totality_gaps_report ON totality_gaps(report_id);
CREATE INDEX IF NOT EXISTS idx_totality_gaps_category ON totality_gaps(gap_category);
CREATE INDEX IF NOT EXISTS idx_totality_gaps_resolved ON totality_gaps(resolved);
CREATE INDEX IF NOT EXISTS idx_totality_gaps_severity ON totality_gaps(severity);

-- ───────────────────────────────────────────────────────────────────
-- VALIDATION CRITERIA - Store validation criteria from specs
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS validation_criteria (
  -- Identity
  id TEXT PRIMARY KEY,
  spec_id TEXT NOT NULL,
  spec_path TEXT NOT NULL,

  -- Criteria (parsed from YAML frontmatter)
  criteria_type TEXT NOT NULL,          -- 'spec_structure', 'implementation', 'runtime', 'browser'

  -- Criteria Details (JSON)
  criteria_details TEXT NOT NULL,       -- Full criteria definition

  -- Status
  enabled BOOLEAN DEFAULT 1,

  -- Metadata
  extracted_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_validation_criteria_spec ON validation_criteria(spec_id);
CREATE INDEX IF NOT EXISTS idx_validation_criteria_type ON validation_criteria(criteria_type);
CREATE INDEX IF NOT EXISTS idx_validation_criteria_enabled ON validation_criteria(enabled);

-- ═══════════════════════════════════════════════════════════════════
-- VIEWS - Useful queries for validation intelligence
-- ═══════════════════════════════════════════════════════════════════

-- Spec Lifecycle Summary
CREATE VIEW IF NOT EXISTS v_spec_lifecycle_summary AS
SELECT
  lifecycle_stage,
  COUNT(*) as spec_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM spec_validations), 2) as percentage
FROM spec_validations
GROUP BY lifecycle_stage
ORDER BY
  CASE lifecycle_stage
    WHEN 'production_ready' THEN 1
    WHEN 'runtime_validated' THEN 2
    WHEN 'implementation_complete' THEN 3
    WHEN 'spec_complete' THEN 4
    WHEN 'spec_incomplete' THEN 5
    ELSE 6
  END;

-- Recent Validations (Last 24 Hours)
CREATE VIEW IF NOT EXISTS v_recent_validations AS
SELECT
  spec_path,
  lifecycle_stage,
  all_layers_passed,
  passed_layers,
  total_layers,
  validated_at
FROM spec_validations
WHERE validated_at > datetime('now', '-1 day')
ORDER BY validated_at DESC;

-- Production Ready Specs
CREATE VIEW IF NOT EXISTS v_production_ready_specs AS
SELECT
  spec_path,
  lifecycle_stage,
  validated_at
FROM spec_validations
WHERE lifecycle_stage = 'production_ready'
ORDER BY validated_at DESC;

-- Current Totality Status
CREATE VIEW IF NOT EXISTS v_current_totality AS
SELECT
  overall_completeness,
  layer1_message_capture,
  layer2_insight_extraction,
  layer3_spec_generation,
  layer4_task_creation,
  layer5_implementation,
  layer6_validation,
  total_gaps,
  generated_at
FROM totality_reports
ORDER BY generated_at DESC
LIMIT 1;

-- Unresolved Gaps
CREATE VIEW IF NOT EXISTS v_unresolved_gaps AS
SELECT
  g.gap_category,
  g.severity,
  COUNT(*) as gap_count,
  GROUP_CONCAT(g.description, '; ') as descriptions
FROM totality_gaps g
WHERE g.resolved = 0
GROUP BY g.gap_category, g.severity
ORDER BY
  CASE g.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  gap_count DESC;

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS - Auto-track lifecycle changes
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER IF NOT EXISTS track_lifecycle_changes
AFTER INSERT ON spec_validations
BEGIN
  -- Record lifecycle stage in history
  INSERT INTO spec_lifecycle_history (
    id,
    spec_id,
    validation_id,
    from_stage,
    to_stage,
    reason,
    triggered_by
  )
  VALUES (
    hex(randomblob(16)),
    NEW.spec_id,
    NEW.id,
    NULL,  -- First validation, no previous stage
    NEW.lifecycle_stage,
    'Initial validation',
    'validation'
  );
END;

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════
-- Tables: 5 (validations, lifecycle_history, totality_reports, gaps, criteria)
-- Indexes: 15+
-- Views: 5 (lifecycle summary, recent validations, production ready, totality, gaps)
-- Triggers: 1 (track lifecycle changes)
-- ═══════════════════════════════════════════════════════════════════
