/**
 * Event Utilities - Type-Safe Event Data Access
 * ==============================================
 *
 * Provides type-safe accessors for event data across discriminated union types.
 */

import {
  Event,
  AgentLogEvent,
  AgentProgressEvent,
  AgentStatusEvent,
  TaskClaimedEvent,
  TaskCompletedEvent,
  TaskUpdateEvent
} from '../events/EventBroadcaster.js';

/**
 * Type guards for event discrimination
 */
export function isAgentLogEvent(event: Event): event is AgentLogEvent {
  return event.type === 'agent_log';
}

export function isAgentProgressEvent(event: Event): event is AgentProgressEvent {
  return event.type === 'agent_progress';
}

export function isAgentStatusEvent(event: Event): event is AgentStatusEvent {
  return event.type === 'agent_status';
}

export function isTaskClaimedEvent(event: Event): event is TaskClaimedEvent {
  return event.type === 'task_claimed';
}

export function isTaskCompletedEvent(event: Event): event is TaskCompletedEvent {
  return event.type === 'task_completed';
}

export function isTaskUpdateEvent(event: Event): event is TaskUpdateEvent {
  return event.type === 'task_update';
}

/**
 * Safe accessors for common event data
 */
export function getAgentId(event: Event): string | undefined {
  if (isAgentLogEvent(event)) return event.agentId;
  if (isAgentProgressEvent(event)) return event.agentId;
  if (isAgentStatusEvent(event)) return event.agentId;
  if (isTaskClaimedEvent(event)) return event.agentId;
  if (isTaskCompletedEvent(event)) return event.agentId;
  return undefined;
}

export function getTaskId(event: Event): string | undefined {
  if (isAgentProgressEvent(event)) return event.taskId;
  if (isTaskClaimedEvent(event)) return event.taskId;
  if (isTaskCompletedEvent(event)) return event.taskId;
  if (isTaskUpdateEvent(event)) return event.taskId;
  return undefined;
}

export function getTaskName(event: Event): string | undefined {
  if (isTaskClaimedEvent(event)) return event.taskName;
  if (isTaskCompletedEvent(event)) return event.taskName;
  return undefined;
}

export function getLogLevel(event: Event): string | undefined {
  if (isAgentLogEvent(event)) return event.level || 'info';
  return undefined;
}

export function getMessage(event: Event): string | undefined {
  if (isAgentLogEvent(event)) return event.message;
  return undefined;
}

export function getPercentage(event: Event): number | undefined {
  if (isAgentProgressEvent(event)) return event.percentage;
  if (isTaskUpdateEvent(event)) return event.progress;
  return undefined;
}

export function getStatus(event: Event): string | undefined {
  if (isAgentStatusEvent(event)) return event.status;
  if (isTaskUpdateEvent(event)) return event.status;
  return undefined;
}

export function getVelocity(event: Event): number | undefined {
  if (isTaskCompletedEvent(event)) return event.velocity;
  return undefined;
}

/**
 * Generic data extractor with type safety
 */
export interface EventData {
  agentId?: string;
  taskId?: string;
  taskName?: string;
  message?: string;
  level?: string;
  percentage?: number;
  status?: string;
  velocity?: number;
  taskType?: string;
  agent?: string;
}

export function extractEventData(event: Event): EventData {
  return {
    agentId: getAgentId(event),
    taskId: getTaskId(event),
    taskName: getTaskName(event),
    message: getMessage(event),
    level: getLogLevel(event),
    percentage: getPercentage(event),
    status: getStatus(event),
    velocity: getVelocity(event),
    agent: getAgentId(event) // Alias for compatibility
  };
}
