/**
 * Event Broadcaster
 * ==================
 *
 * Central event broadcasting system for real-time updates.
 * Broadcasts events to all connected WebSocket clients.
 */

import { WebSocketMCPTransport } from '../transport/WebSocketTransport.js';
import { logger } from '../utils/logger.js';

export type EventType =
  | 'agent_log'
  | 'agent_progress'
  | 'project_assignment'
  | 'task_update'
  | 'task_claimed'
  | 'task_completed'
  | 'agent_status'
  | 'rule_created'
  | 'rule_updated'
  | 'rule_deleted'
  | 'intelligence_insight';

export interface BaseEvent {
  type: EventType;
  timestamp: number;
}

export interface AgentLogEvent extends BaseEvent {
  type: 'agent_log';
  agentId: string;
  message: string;
  level?: 'info' | 'warn' | 'error';
}

export interface AgentProgressEvent extends BaseEvent {
  type: 'agent_progress';
  agentId: string;
  taskId: string;
  percentage: number;
  currentStep?: string;
}

export interface ProjectAssignmentEvent extends BaseEvent {
  type: 'project_assignment';
  agentId: string;
  project: string;
  action: 'assigned' | 'unassigned';
}

export interface TaskUpdateEvent extends BaseEvent {
  type: 'task_update';
  taskId: string;
  status: string;
  agent?: string;
  progress?: number;
}

export interface TaskClaimedEvent extends BaseEvent {
  type: 'task_claimed';
  taskId: string;
  taskName: string;
  agentId: string;
}

export interface TaskCompletedEvent extends BaseEvent {
  type: 'task_completed';
  taskId: string;
  taskName: string;
  agentId: string;
  velocity?: number;
}

export interface AgentStatusEvent extends BaseEvent {
  type: 'agent_status';
  agentId: string;
  status: 'online' | 'busy' | 'offline';
  currentTask?: string;
  project?: string;
}

export interface RuleEvent extends BaseEvent {
  type: 'rule_created' | 'rule_updated' | 'rule_deleted';
  ruleId: number;
  ruleName: string;
}

export interface IntelligenceInsightEvent extends BaseEvent {
  type: 'intelligence_insight';
  data: {
    type: 'pattern' | 'anomaly' | 'optimization' | 'prediction';
    title: string;
    description: string;
    confidence: number;
    action_required: boolean;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export type Event =
  | AgentLogEvent
  | AgentProgressEvent
  | ProjectAssignmentEvent
  | TaskUpdateEvent
  | TaskClaimedEvent
  | TaskCompletedEvent
  | AgentStatusEvent
  | RuleEvent
  | IntelligenceInsightEvent;

/**
 * Singleton event broadcaster
 */
export class EventBroadcaster {
  private static instance: EventBroadcaster | null = null;
  private wsTransport: WebSocketMCPTransport | null = null;
  private eventLog: Event[] = [];
  private maxLogSize = 1000; // Keep last 1000 events

  private constructor() {
    logger.info('📡 EventBroadcaster initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventBroadcaster {
    if (!EventBroadcaster.instance) {
      EventBroadcaster.instance = new EventBroadcaster();
    }
    return EventBroadcaster.instance;
  }

  /**
   * Set WebSocket transport for broadcasting
   */
  setTransport(transport: WebSocketMCPTransport): void {
    this.wsTransport = transport;
    logger.info('📡 EventBroadcaster connected to WebSocket transport');
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: Event): void {
    // Add timestamp if not set
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // Add to event log
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift(); // Remove oldest event
    }

    // Broadcast via WebSocket if available
    if (this.wsTransport) {
      this.wsTransport.broadcast(event);
      logger.debug(`📡 Broadcasted event: ${event.type}`);
    } else {
      logger.warn(`⚠️ Cannot broadcast event ${event.type} - WebSocket transport not set`);
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): Event[] {
    return this.eventLog.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: EventType, limit: number = 100): Event[] {
    return this.eventLog
      .filter(e => e.type === type)
      .slice(-limit);
  }

  /**
   * Clear event log
   */
  clearLog(): void {
    this.eventLog = [];
    logger.info('📡 Event log cleared');
  }

  // Convenience methods for common events

  /**
   * Broadcast agent log
   */
  agentLog(agentId: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.broadcast({
      type: 'agent_log',
      agentId,
      message,
      level,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast agent progress
   */
  agentProgress(agentId: string, taskId: string, percentage: number, currentStep?: string): void {
    this.broadcast({
      type: 'agent_progress',
      agentId,
      taskId,
      percentage,
      currentStep,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast project assignment
   */
  projectAssignment(agentId: string, project: string, action: 'assigned' | 'unassigned'): void {
    this.broadcast({
      type: 'project_assignment',
      agentId,
      project,
      action,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast task update
   */
  taskUpdate(taskId: string, status: string, agent?: string, progress?: number): void {
    this.broadcast({
      type: 'task_update',
      taskId,
      status,
      agent,
      progress,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast task claimed
   */
  taskClaimed(taskId: string, taskName: string, agentId: string): void {
    this.broadcast({
      type: 'task_claimed',
      taskId,
      taskName,
      agentId,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast task completed
   */
  taskCompleted(taskId: string, taskName: string, agentId: string, velocity?: number): void {
    this.broadcast({
      type: 'task_completed',
      taskId,
      taskName,
      agentId,
      velocity,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast agent status
   */
  agentStatus(agentId: string, status: 'online' | 'busy' | 'offline', currentTask?: string, project?: string): void {
    this.broadcast({
      type: 'agent_status',
      agentId,
      status,
      currentTask,
      project,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast rule event
   */
  ruleEvent(type: 'rule_created' | 'rule_updated' | 'rule_deleted', ruleId: number, ruleName: string): void {
    this.broadcast({
      type,
      ruleId,
      ruleName,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const eventBroadcaster = EventBroadcaster.getInstance();
