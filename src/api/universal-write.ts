// ============================================================================
// UNIVERSAL WRITE API - Write Everything, Organize Everything
// ============================================================================
// Purpose: The simplest act to rival the most sophisticated ones - WRITING
// Vision: Capture EVERYTHING → Organize perfectly → Distill to insights
// ============================================================================

import Database from 'better-sqlite3';
import { join } from 'path';
import { randomUUID } from 'crypto';

const DB_PATH = join(process.cwd(), 'data', 'registry.db');

// ============================================================================
// CORE PRINCIPLE: EVERYTHING IS AN EVENT
// ============================================================================
// Every action, decision, change, progress is captured as a domain-specific event.
// The schema is self-explanatory - you know what happened just by looking at it.
// ============================================================================

/**
 * Base event structure (common to all domains)
 */
interface BaseEvent {
  eventActor: string;                          // Who/what caused this
  eventAction: string;                         // What happened
  eventDescription?: string;                   // Human-readable
  stateBefore?: any;                           // State before event
  stateAfter?: any;                            // State after event
  triggeredBy?: string;                        // What triggered this
  relatedEntities?: string[];                  // Related IDs
  tags?: string[];                             // Searchable tags
  impactLevel?: 'low' | 'medium' | 'high' | 'critical';
  impactDescription?: string;
  metadata?: Record<string, any>;
}

/**
 * Specification Event
 */
export interface SpecEvent extends BaseEvent {
  specId: string;
  eventType: 'created' | 'updated' | 'completed' | 'validated' | 'gap_detected' | 'gap_resolved';
  eventCategory: 'lifecycle' | 'quality' | 'progress' | 'collaboration';
}

/**
 * Task Event
 */
export interface TaskEvent extends BaseEvent {
  taskId: string;
  eventType: 'created' | 'assigned' | 'started' | 'completed' | 'blocked' | 'unblocked' | 'failed';
  eventCategory: 'lifecycle' | 'progress' | 'blocking' | 'quality';
  workPerformed?: string;
  filesChanged?: string[];
  codeChangesSummary?: string;
  progressBefore?: number;
  progressAfter?: number;
  estimatedTimeRemaining?: number;
}

/**
 * Code Generation Event
 */
export interface CodeGenEvent extends BaseEvent {
  codebaseId?: string;
  taskId?: string;
  eventType: 'generation_started' | 'template_applied' | 'file_created' | 'build_passed' | 'build_failed';
  eventCategory: 'generation' | 'validation' | 'quality';
  filesGenerated?: string[];
  templatesUsed?: string[];
  snippetsUsed?: string[];
  linesGenerated?: number;
  codeQualityScore?: number;
  testCoverage?: number;
  buildStatus?: 'passed' | 'failed' | 'not_attempted';
}

/**
 * Interview Event
 */
export interface InterviewEvent extends BaseEvent {
  sessionId: string;
  questionId?: string;
  eventType: 'session_started' | 'question_asked' | 'question_answered' | 'gap_resolved' | 'session_completed';
  eventCategory: 'interview' | 'discovery' | 'resolution';
  questionText?: string;
  answerText?: string;
  gapsResolved?: string[];
  newInformation?: Record<string, any>;
  completenessBefore?: number;
  completenessAfter?: number;
  gapsRemaining?: number;
}

/**
 * Agent Activity Event
 */
export interface AgentActivityEvent {
  agentId: string;
  eventType: 'connected' | 'disconnected' | 'task_claimed' | 'task_completed' | 'context_received';
  eventCategory: 'connection' | 'work' | 'communication';
  eventAction: string;
  eventDescription?: string;
  projectId?: string;
  taskId?: string;
  sessionDurationSeconds?: number;
  workSummary?: string;
  triggeredBy?: string;
  relatedEntities?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * System Status Event
 */
export interface SystemEvent {
  eventType: 'loop_execution' | 'migration_run' | 'backup_created' | 'health_check';
  eventCategory: 'system' | 'maintenance' | 'health';
  eventActor: string;
  eventAction: string;
  eventDescription?: string;
  systemHealth?: 'healthy' | 'warning' | 'critical';
  activeLoops?: number;
  activeAgents?: number;
  activeTasks?: number;
  databaseSizeMb?: number;
  avgResponseTimeMs?: number;
  errorRate?: number;
  successRate?: number;
  triggeredBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// WRITE API - Simple Functions to Write Everything
// ============================================================================

/**
 * Write a specification event
 */
export function writeSpecEvent(event: SpecEvent): string {
  const db = new Database(DB_PATH);
  const eventId = `evt-spec-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO spec_events (
      event_id, spec_id, event_type, event_category,
      event_actor, event_action, event_description,
      state_before, state_after, delta,
      triggered_by, related_entities, tags,
      impact_level, impact_description, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    event.specId,
    event.eventType,
    event.eventCategory,
    event.eventActor,
    event.eventAction,
    event.eventDescription || null,
    event.stateBefore ? JSON.stringify(event.stateBefore) : null,
    event.stateAfter ? JSON.stringify(event.stateAfter) : null,
    event.stateBefore && event.stateAfter ? JSON.stringify({
      changed: Object.keys(event.stateAfter).filter(
        k => JSON.stringify(event.stateBefore![k]) !== JSON.stringify(event.stateAfter![k])
      )
    }) : null,
    event.triggeredBy || null,
    event.relatedEntities ? JSON.stringify(event.relatedEntities) : null,
    event.tags ? JSON.stringify(event.tags) : null,
    event.impactLevel || 'low',
    event.impactDescription || null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );

  db.close();
  return eventId;
}

/**
 * Write a task event
 */
export function writeTaskEvent(event: TaskEvent): string {
  const db = new Database(DB_PATH);
  const eventId = `evt-task-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO task_events (
      event_id, task_id, event_type, event_category,
      event_actor, event_action, event_description,
      state_before, state_after, delta,
      work_performed, files_changed, code_changes_summary,
      progress_before, progress_after, estimated_time_remaining,
      triggered_by, related_entities, tags,
      impact_level, impact_description, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    event.taskId,
    event.eventType,
    event.eventCategory,
    event.eventActor,
    event.eventAction,
    event.eventDescription || null,
    event.stateBefore ? JSON.stringify(event.stateBefore) : null,
    event.stateAfter ? JSON.stringify(event.stateAfter) : null,
    null, // delta
    event.workPerformed || null,
    event.filesChanged ? JSON.stringify(event.filesChanged) : null,
    event.codeChangesSummary || null,
    event.progressBefore || null,
    event.progressAfter || null,
    event.estimatedTimeRemaining || null,
    event.triggeredBy || null,
    event.relatedEntities ? JSON.stringify(event.relatedEntities) : null,
    event.tags ? JSON.stringify(event.tags) : null,
    event.impactLevel || 'low',
    event.impactDescription || null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );

  db.close();
  return eventId;
}

/**
 * Write a code generation event
 */
export function writeCodeGenEvent(event: CodeGenEvent): string {
  const db = new Database(DB_PATH);
  const eventId = `evt-code-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO code_generation_events (
      event_id, codebase_id, task_id, event_type, event_category,
      event_actor, event_action, event_description,
      files_generated, templates_used, snippets_used, lines_generated,
      code_quality_score, test_coverage, build_status,
      triggered_by, related_entities, tags,
      impact_level, impact_description, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    event.codebaseId || null,
    event.taskId || null,
    event.eventType,
    event.eventCategory,
    event.eventActor,
    event.eventAction,
    event.eventDescription || null,
    event.filesGenerated ? JSON.stringify(event.filesGenerated) : null,
    event.templatesUsed ? JSON.stringify(event.templatesUsed) : null,
    event.snippetsUsed ? JSON.stringify(event.snippetsUsed) : null,
    event.linesGenerated || 0,
    event.codeQualityScore || null,
    event.testCoverage || null,
    event.buildStatus || null,
    event.triggeredBy || null,
    event.relatedEntities ? JSON.stringify(event.relatedEntities) : null,
    event.tags ? JSON.stringify(event.tags) : null,
    event.impactLevel || 'low',
    event.impactDescription || null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );

  db.close();
  return eventId;
}

/**
 * Write an interview event
 */
export function writeInterviewEvent(event: InterviewEvent): string {
  const db = new Database(DB_PATH);
  const eventId = `evt-interview-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO interview_events (
      event_id, session_id, question_id, event_type, event_category,
      event_actor, event_action, event_description,
      question_text, answer_text, gaps_resolved, new_information,
      completeness_before, completeness_after, gaps_remaining,
      triggered_by, related_entities, tags,
      impact_level, impact_description, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    event.sessionId,
    event.questionId || null,
    event.eventType,
    event.eventCategory,
    event.eventActor,
    event.eventAction,
    event.eventDescription || null,
    event.questionText || null,
    event.answerText || null,
    event.gapsResolved ? JSON.stringify(event.gapsResolved) : null,
    event.newInformation ? JSON.stringify(event.newInformation) : null,
    event.completenessBefore || null,
    event.completenessAfter || null,
    event.gapsRemaining || null,
    event.triggeredBy || null,
    event.relatedEntities ? JSON.stringify(event.relatedEntities) : null,
    event.tags ? JSON.stringify(event.tags) : null,
    event.impactLevel || 'low',
    event.impactDescription || null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );

  db.close();
  return eventId;
}

/**
 * Write an agent activity event
 */
export function writeAgentEvent(event: AgentActivityEvent): string {
  const db = new Database(DB_PATH);
  const eventId = `evt-agent-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO agent_activity_events (
      event_id, agent_id, event_type, event_category,
      event_action, event_description,
      project_id, task_id, session_duration_seconds, work_summary,
      triggered_by, related_entities, tags, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    event.agentId,
    event.eventType,
    event.eventCategory,
    event.eventAction,
    event.eventDescription || null,
    event.projectId || null,
    event.taskId || null,
    event.sessionDurationSeconds || null,
    event.workSummary || null,
    event.triggeredBy || null,
    event.relatedEntities ? JSON.stringify(event.relatedEntities) : null,
    event.tags ? JSON.stringify(event.tags) : null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );

  db.close();
  return eventId;
}

/**
 * Write a system status event
 */
export function writeSystemEvent(event: SystemEvent): string {
  const db = new Database(DB_PATH);
  const eventId = `evt-system-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO system_status_events (
      event_id, event_type, event_category,
      event_actor, event_action, event_description,
      system_health, active_loops, active_agents, active_tasks, database_size_mb,
      avg_response_time_ms, error_rate, success_rate,
      triggered_by, tags, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    event.eventType,
    event.eventCategory,
    event.eventActor,
    event.eventAction,
    event.eventDescription || null,
    event.systemHealth || null,
    event.activeLoops || null,
    event.activeAgents || null,
    event.activeTasks || null,
    event.databaseSizeMb || null,
    event.avgResponseTimeMs || null,
    event.errorRate || null,
    event.successRate || null,
    event.triggeredBy || null,
    event.tags ? JSON.stringify(event.tags) : null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );

  db.close();
  return eventId;
}

// ============================================================================
// READ API - Query Events and Status
// ============================================================================

/**
 * Get recent activity across all domains
 */
export function getRecentActivity(hours: number = 24, limit: number = 100) {
  const db = new Database(DB_PATH, { readonly: true });

  const activity = db.prepare(`
    SELECT * FROM recent_activity
    WHERE event_timestamp > datetime('now', '-${hours} hours')
    ORDER BY event_timestamp DESC
    LIMIT ${limit}
  `).all();

  db.close();
  return activity;
}

/**
 * Get current system status
 */
export function getCurrentSystemStatus() {
  const db = new Database(DB_PATH, { readonly: true });

  const status = db.prepare(`
    SELECT * FROM current_system_status WHERE status_id = 'current'
  `).get();

  db.close();
  return status;
}

/**
 * Get critical events requiring attention
 */
export function getCriticalEvents() {
  const db = new Database(DB_PATH, { readonly: true });

  const events = db.prepare(`
    SELECT * FROM critical_events
    ORDER BY event_timestamp DESC
  `).all();

  db.close();
  return events;
}

/**
 * Get activity summary by domain
 */
export function getActivitySummary() {
  const db = new Database(DB_PATH, { readonly: true });

  const summary = db.prepare(`
    SELECT * FROM activity_summary
  `).all();

  db.close();
  return summary;
}

/**
 * Create a status snapshot (for historical tracking)
 */
export function createStatusSnapshot(trigger: string, notes?: string): string {
  const db = new Database(DB_PATH);
  const snapshotId = `snapshot-${Date.now()}`;

  const currentStatus: any = db.prepare(`
    SELECT * FROM current_system_status WHERE status_id = 'current'
  `).get();

  db.prepare(`
    INSERT INTO status_snapshots (
      snapshot_id, snapshot_trigger, notes,
      system_health, health_score,
      specs_total, specs_complete,
      tasks_total, tasks_completed,
      codebases_total, agents_active,
      events_last_24h, avg_spec_completeness, avg_code_quality
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    snapshotId,
    trigger,
    notes || null,
    currentStatus.system_health,
    currentStatus.health_score,
    currentStatus.specs_total,
    currentStatus.specs_complete,
    currentStatus.tasks_total,
    currentStatus.tasks_completed,
    currentStatus.codebases_total,
    currentStatus.agents_active,
    currentStatus.events_last_24h,
    currentStatus.avg_spec_completeness,
    currentStatus.avg_code_quality
  );

  db.close();
  return snapshotId;
}
