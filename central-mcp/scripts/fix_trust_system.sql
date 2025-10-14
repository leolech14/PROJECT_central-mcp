-- Fix ALTER TABLE syntax error
-- Add columns individually for SQLite compatibility

ALTER TABLE vision_implementation_validation
ADD COLUMN assigned_agent_trust_score REAL DEFAULT 0.5;

ALTER TABLE vision_implementation_validation
ADD COLUMN context_quality_score REAL DEFAULT 0.5;

ALTER TABLE vision_implementation_validation
ADD COLUMN agent_match_confidence REAL DEFAULT 0.5;

ALTER TABLE vision_implementation_validation
ADD COLUMN trust_enhanced_confidence REAL DEFAULT 0.5;

ALTER TABLE vision_implementation_validation
ADD COLUMN trust_analysis_results TEXT;

SELECT 'Trust system tables fixed successfully!' as status;