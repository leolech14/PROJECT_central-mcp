-- ============================================================================
-- Migration 022: Auto-Event Triggers
-- ============================================================================
-- Purpose: Automatic event capture when tasks/specs change
-- Created: 2025-10-13
-- Dependencies: Migration 021 (Universal Write System)
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Auto-capture task events on status change
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS auto_task_event_on_update
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN NEW.status != OLD.status
BEGIN
    INSERT INTO task_events (
        event_id,
        task_id,
        event_type,
        event_category,
        event_timestamp,
        event_actor,
        event_action,
        state_before,
        state_after,
        triggered_by
    ) VALUES (
        'evt-task-' || (strftime('%s', 'now') || substr(lower(hex(randomblob(4))), 1, 8)),
        NEW.id,
        CASE NEW.status
            WHEN 'completed' THEN 'completed'
            WHEN 'in-progress' THEN 'started'
            WHEN 'blocked' THEN 'blocked'
            WHEN 'pending' THEN 'unblocked'
            ELSE 'status_changed'
        END,
        'lifecycle',
        datetime('now'),
        COALESCE(NEW.agent, 'system'),
        'Status changed: ' || OLD.status || ' → ' || NEW.status,
        json_object('status', OLD.status, 'agent', OLD.agent),
        json_object('status', NEW.status, 'agent', NEW.agent),
        'database_trigger'
    );
END;

-- ============================================================================
-- TRIGGER 2: Auto-capture spec events on completeness change
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS auto_spec_event_on_completeness_change
AFTER UPDATE ON specs_registry
FOR EACH ROW
WHEN (NEW.completeness_score != OLD.completeness_score) OR
     (NEW.validation_status != OLD.validation_status)
BEGIN
    INSERT INTO spec_events (
        event_id,
        spec_id,
        spec_name,
        spec_type,
        completeness_score,
        validation_status,
        event_timestamp,
        triggered_by
    ) VALUES (
        'evt-spec-' || (strftime('%s', 'now') || substr(lower(hex(randomblob(4))), 1, 8)),
        NEW.spec_id,
        NEW.spec_name,
        NEW.spec_type,
        NEW.completeness_score,
        NEW.validation_status,
        datetime('now'),
        'database_trigger'
    );
END;

-- ============================================================================
-- TRIGGER 3: Auto-capture task completion events
-- ============================================================================

-- Trigger 3 removed - Trigger 1 already handles completion status changes

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check triggers were created
SELECT
    'Triggers created: ' || COUNT(*) as status
FROM sqlite_master
WHERE type = 'trigger'
AND name LIKE 'auto_%event%';

-- Migration complete
SELECT '✅ Migration 022: Auto-Event Triggers COMPLETE' as status;
