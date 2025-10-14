/**
 * Base Loop - Multi-Trigger Architecture Foundation
 * ==================================================
 *
 * All auto-proactive loops extend this base class.
 *
 * Supports FOUR types of triggers:
 * 1. TIME: Periodic polling (every N seconds)
 * 2. EVENT: React to system events instantly
 * 3. CASCADE: Trigger when other loops complete
 * 4. MANUAL: Explicit API-triggered execution
 *
 * This transforms loops from "dumb pollers" to "intelligent reactors"!
 */

import Database from 'better-sqlite3';
import { AutoProactiveEventBus, LoopEvent, EventPayload } from './EventBus.js';
import { logger } from '../utils/logger.js';

/**
 * Multi-trigger configuration for loops
 */
export interface LoopTriggerConfig {
  // Time-based polling
  time?: {
    enabled: boolean;
    intervalSeconds: number;
  };

  // Event-based reactions
  events?: {
    enabled: boolean;
    triggers: LoopEvent[];
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };

  // Cascade from other loops
  cascade?: {
    enabled: boolean;
    afterLoops: number[];  // Loop numbers that trigger this loop
  };

  // Manual API triggering
  manual?: {
    enabled: boolean;
  };
}

/**
 * Loop execution context
 */
export interface LoopExecutionContext {
  trigger: 'time' | 'event' | 'cascade' | 'manual';
  event?: LoopEvent;
  payload?: any;
  reason?: string;
  timestamp: number;
}

/**
 * Loop statistics
 */
export interface LoopStats {
  isRunning: boolean;
  loopNumber: number;
  loopName: string;
  executionCount: number;
  eventTriggeredCount: number;
  manualTriggeredCount: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
  lastExecutionDuration: number;
  triggerConfig: LoopTriggerConfig;
}

/**
 * Abstract base class for all auto-proactive loops
 */
export abstract class BaseLoop {
  protected db: Database.Database;
  protected eventBus: AutoProactiveEventBus;
  protected triggerConfig: LoopTriggerConfig;
  protected loopNumber: number;
  protected loopName: string;

  // State
  protected isRunning: boolean = false;
  protected intervalHandle: NodeJS.Timeout | null = null;

  // Statistics
  protected executionCount: number = 0;
  protected eventTriggeredCount: number = 0;
  protected manualTriggeredCount: number = 0;
  protected executionDurations: number[] = [];
  protected lastExecutionTime: number = 0;

  constructor(
    db: Database.Database,
    loopNumber: number,
    loopName: string,
    triggerConfig: LoopTriggerConfig
  ) {
    this.db = db;
    this.loopNumber = loopNumber;
    this.loopName = loopName;
    this.triggerConfig = triggerConfig;
    this.eventBus = AutoProactiveEventBus.getInstance();
  }

  /**
   * Start the loop (all configured triggers)
   */
  start(): void {
    if (this.isRunning) {
      logger.warn(`⚠️  Loop ${this.loopNumber} already running`);
      return;
    }

    this.isRunning = true;
    logger.info(`🔄 Starting Loop ${this.loopNumber}: ${this.loopName}`);

    // Start time-based trigger
    if (this.triggerConfig.time?.enabled) {
      this.startTimeTrigger();
    }

    // Register event-based triggers
    if (this.triggerConfig.events?.enabled) {
      this.registerEventTriggers();
    }

    // Register cascade triggers
    if (this.triggerConfig.cascade?.enabled) {
      this.registerCascadeTriggers();
    }

    logger.info(`✅ Loop ${this.loopNumber}: ${this.loopName} ACTIVE`);
    this.logTriggerConfiguration();
  }

  /**
   * Stop the loop (all triggers)
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    logger.info(`🛑 Loop ${this.loopNumber}: ${this.loopName} STOPPED`);
  }

  /**
   * Start time-based polling trigger
   */
  private startTimeTrigger(): void {
    const interval = this.triggerConfig.time!.intervalSeconds;

    logger.debug(`   ⏰ Time trigger: every ${interval}s`);

    // Run immediately
    this.executeWithTracking({
      trigger: 'time',
      timestamp: Date.now()
    });

    // Then run on interval
    this.intervalHandle = setInterval(() => {
      this.executeWithTracking({
        trigger: 'time',
        timestamp: Date.now()
      });
    }, interval * 1000);
  }

  /**
   * Register event-based triggers
   */
  private registerEventTriggers(): void {
    const triggers = this.triggerConfig.events!.triggers;

    for (const event of triggers) {
      this.eventBus.onLoopEvent(
        event,
        async (payload: EventPayload) => {
          this.eventTriggeredCount++;

          logger.info(`⚡ Loop ${this.loopNumber} triggered by event: ${event}`);

          await this.executeWithTracking({
            trigger: 'event',
            event,
            payload: payload.data,
            timestamp: Date.now()
          });
        },
        {
          loopName: `Loop ${this.loopNumber}`,
          priority: this.triggerConfig.events!.priority === 'critical' ? 1 : 2
        }
      );

      logger.debug(`   📡 Event trigger: ${event}`);
    }
  }

  /**
   * Register cascade triggers (triggered by other loops)
   */
  private registerCascadeTriggers(): void {
    const afterLoops = this.triggerConfig.cascade!.afterLoops;

    for (const loopNum of afterLoops) {
      // Listen for loop completion events
      const event = `loop:${loopNum}:completed` as LoopEvent;

      this.eventBus.onLoopEvent(
        event,
        async (payload: EventPayload) => {
          logger.info(`🔗 Loop ${this.loopNumber} cascading from Loop ${loopNum}`);

          await this.executeWithTracking({
            trigger: 'cascade',
            payload: payload.data,
            timestamp: Date.now()
          });
        },
        { loopName: `Loop ${this.loopNumber}` }
      );

      logger.debug(`   🔗 Cascade trigger: after Loop ${loopNum}`);
    }
  }

  /**
   * Manual trigger support (via API)
   */
  async triggerManually(reason: string, data?: any): Promise<void> {
    if (!this.triggerConfig.manual?.enabled) {
      throw new Error(`Manual triggering not enabled for Loop ${this.loopNumber}`);
    }

    this.manualTriggeredCount++;

    logger.info(`🖐️  Loop ${this.loopNumber} manually triggered: ${reason}`);

    await this.executeWithTracking({
      trigger: 'manual',
      reason,
      payload: data,
      timestamp: Date.now()
    });
  }

  /**
   * Execute with performance tracking
   */
  private async executeWithTracking(context: LoopExecutionContext): Promise<void> {
    const startTime = Date.now();
    this.executionCount++;

    try {
      // Call subclass implementation
      await this.execute(context);

      const duration = Date.now() - startTime;
      this.lastExecutionTime = startTime;

      // Track performance
      this.executionDurations.push(duration);
      if (this.executionDurations.length > 100) {
        this.executionDurations.shift();
      }

      if (duration > 5000) {
        logger.warn(`⚠️  Loop ${this.loopNumber} took ${duration}ms (slow!)`);
      }

      // Emit completion event for cascades
      this.eventBus.emitLoopEvent(
        `loop:${this.loopNumber}:completed` as LoopEvent,
        { loopNumber: this.loopNumber, duration },
        { source: `Loop ${this.loopNumber}` }
      );

    } catch (err: any) {
      logger.error(`❌ Loop ${this.loopNumber} error:`, err);

      // Emit error event
      this.eventBus.emitLoopEvent(
        LoopEvent.SYSTEM_ERROR,
        {
          loop: this.loopNumber,
          error: err.message,
          stack: err.stack
        },
        { priority: 'high', source: `Loop ${this.loopNumber}` }
      );
    }
  }

  /**
   * Log trigger configuration
   */
  private logTriggerConfiguration(): void {
    const triggers: string[] = [];

    if (this.triggerConfig.time?.enabled) {
      triggers.push(`⏰ Time (${this.triggerConfig.time.intervalSeconds}s)`);
    }
    if (this.triggerConfig.events?.enabled) {
      triggers.push(`📡 Events (${this.triggerConfig.events.triggers.length})`);
    }
    if (this.triggerConfig.cascade?.enabled) {
      triggers.push(`🔗 Cascade (${this.triggerConfig.cascade.afterLoops.length})`);
    }
    if (this.triggerConfig.manual?.enabled) {
      triggers.push(`🖐️  Manual`);
    }

    logger.info(`   Triggers: ${triggers.join(' | ')}`);
  }

  /**
   * Get loop statistics
   */
  getStats(): LoopStats {
    const avgDuration = this.executionDurations.length > 0
      ? this.executionDurations.reduce((a, b) => a + b, 0) / this.executionDurations.length
      : 0;

    return {
      isRunning: this.isRunning,
      loopNumber: this.loopNumber,
      loopName: this.loopName,
      executionCount: this.executionCount,
      eventTriggeredCount: this.eventTriggeredCount,
      manualTriggeredCount: this.manualTriggeredCount,
      averageExecutionTime: Math.round(avgDuration),
      lastExecutionTime: this.lastExecutionTime,
      lastExecutionDuration: this.executionDurations[this.executionDurations.length - 1] || 0,
      triggerConfig: this.triggerConfig
    };
  }

  /**
   * Abstract method - subclasses implement their specific logic
   */
  protected abstract execute(context: LoopExecutionContext): Promise<void>;
}
