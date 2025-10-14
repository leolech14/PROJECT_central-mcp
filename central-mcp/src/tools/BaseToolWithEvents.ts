/**
 * Base Tool with Events - MCP Tool Intelligence Layer
 * ====================================================
 *
 * All MCP tools inherit from this base class to emit system events.
 *
 * Every MCP call = intelligence about system state!
 *
 * Events emitted by tools trigger instant loop reactions:
 * - claimTask() → Loop 1, 4, 8 react instantly
 * - completeTask() → Cascades across entire system
 * - captureMessage() → Loop 7 generates spec in <1 second
 *
 * This is how AGENTIC CALLS become the PRIMARY EVENT SOURCE!
 */

import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';
import { logger } from '../utils/logger.js';

/**
 * Base class for all MCP tools with event emission capabilities
 */
export abstract class BaseToolWithEvents {
  protected eventBus: AutoProactiveEventBus;
  protected toolName: string;

  constructor(toolName?: string) {
    this.eventBus = AutoProactiveEventBus.getInstance();
    this.toolName = toolName || this.constructor.name;
  }

  /**
   * Emit a system event (primary interface)
   */
  protected emit(
    event: LoopEvent,
    data: any,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
    }
  ): void {
    this.eventBus.emitLoopEvent(event, data, {
      tool: this.toolName,
      priority: options?.priority || 'normal',
      source: 'MCP Tool'
    });
  }

  /**
   * Emit multiple related events (for cascading effects)
   */
  protected emitCascade(events: Array<{ event: LoopEvent; data: any }>): void {
    for (const { event, data } of events) {
      this.emit(event, data);
    }
  }

  /**
   * Emit critical event (highest priority)
   */
  protected emitCritical(event: LoopEvent, data: any): void {
    this.emit(event, data, { priority: 'critical' });
  }

  /**
   * Log tool execution
   */
  protected logExecution(action: string, details?: any): void {
    logger.info(`🔧 ${this.toolName}: ${action}`, details);
  }

  /**
   * Log tool error
   */
  protected logError(action: string, error: any): void {
    logger.error(`❌ ${this.toolName}: ${action} failed`, error);
  }
}
