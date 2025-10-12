/**
 * Loop 10: RunPod Monitor
 *
 * Monitors RunPod infrastructure every 60 seconds:
 * - Pod status and health
 * - GPU utilization metrics
 * - Cost tracking (hourly/daily/monthly)
 * - Credit balance alerts
 * - Automatic cost warnings
 *
 * CRITICAL: Prevents account termination by monitoring balance and costs
 */

import { BaseLoop, LoopTriggerConfig, LoopExecutionContext } from './BaseLoop.js';
import { getRunPodStatus } from '../tools/runpod/runpodIntegration.js';
import { logger } from '../utils/logger.js';
import Database from 'better-sqlite3';
import { join } from 'path';

export interface RunPodMonitorConfig {
  intervalSeconds: number;  // How often to check (default: 60)
  warningThreshold: number; // Daily cost warning ($50/day default)
  criticalThreshold: number; // Daily cost critical ($100/day default)
}

export class RunPodMonitorLoop extends BaseLoop {
  private config: RunPodMonitorConfig;

  constructor(db: Database.Database, config?: RunPodMonitorConfig) {
    // Configure simple time-based trigger
    const triggerConfig: LoopTriggerConfig = {
      time: {
        enabled: true,
        intervalSeconds: config?.intervalSeconds || 60
      },
      manual: {
        enabled: true
      }
    };

    super(db, 10, 'RunPod Monitor', triggerConfig);

    this.config = config || {
      intervalSeconds: 60,
      warningThreshold: 50,
      criticalThreshold: 100
    };

    logger.info(`🏗️  Loop 10: RunPod Monitor configured`);
    logger.info(`   Cost thresholds: Warning=$${this.config.warningThreshold}/day, Critical=$${this.config.criticalThreshold}/day`);
  }

  protected async execute(context: LoopExecutionContext): Promise<void> {
    try {
      logger.info('[Loop 10] 🖥️  Checking RunPod infrastructure...');

      const status = await getRunPodStatus();

      if (status.success && status.summary) {
        const { summary, pods } = status;

        logger.info('[Loop 10] ✅ RunPod status retrieved:');
        logger.info(`   → Total pods: ${summary?.total_pods || 0}`);
        logger.info(`   → Running: ${summary?.running_pods || 0}`);
        logger.info(`   → Idle: ${summary?.idle_pods || 0}`);
        logger.info(`   → Total GPUs: ${summary?.total_gpus || 0}`);
        logger.info(`   → Active agents: ${summary?.active_agents || 0}`);
        logger.info(`   → Cost: $${summary?.cost_per_hour?.toFixed(2) || '0.00'}/hr`);
        logger.info(`   → Daily: $${summary?.cost_per_day?.toFixed(2) || '0.00'}`);
        logger.info(`   → Monthly: $${summary?.cost_per_month?.toFixed(2) || '0.00'}`);

        // Save cost snapshot
        if (summary) {
          this.saveCostSnapshot(summary);
        }

        // Cost alerts
        if (summary && summary.cost_per_day >= this.config.criticalThreshold) {
          logger.error(`[Loop 10] 🚨 CRITICAL: Daily cost is $${summary.cost_per_day.toFixed(2)} (threshold: $${this.config.criticalThreshold})`);
          logger.error(`[Loop 10]    Consider stopping unused pods immediately!`);
          this.triggerCostAlert('CRITICAL', summary.cost_per_day);
        } else if (summary && summary.cost_per_day >= this.config.warningThreshold) {
          logger.warn(`[Loop 10] ⚠️  WARNING: Daily cost is $${summary.cost_per_day.toFixed(2)} (threshold: $${this.config.warningThreshold})`);
          logger.warn(`[Loop 10]    Monitor costs closely`);
          this.triggerCostAlert('WARNING', summary.cost_per_day);
        }

        // Idle pod alerts
        if (pods && Array.isArray(pods)) {
          const idlePods = pods.filter((p: any) => p.status !== 'RUNNING');
          if (idlePods.length > 0) {
            logger.warn(`[Loop 10] 💤 ${idlePods.length} idle pod(s) detected`);
            idlePods.forEach((pod: any) => {
              logger.warn(`[Loop 10]    - ${pod.name} (${pod.gpu}) - ${pod.status}`);
            });
          }
        }

        // Agent session tracking
        if (summary && summary.active_agents > 0) {
          logger.info(`[Loop 10] 🤖 ${summary.active_agents} agent(s) active on RunPod`);
        }

        // TODO: Credit balance check (requires separate API call)
        // const balance = await getRunPodBalance();
        // if (balance < 10) {
        //   logger.error('[Loop 10] 🚨 LOW CREDIT BALANCE: Add funds to prevent termination!');
        // }

      } else {
        logger.error(`[Loop 10] ❌ Failed to get RunPod status: ${status.error}`);
      }

    } catch (error) {
      logger.error('[Loop 10] ❌ RunPod monitor error:', error);

      // If it's an API key error, log helpful message
      if (error instanceof Error && error.message.includes('RUNPOD_API_KEY')) {
        logger.error('[Loop 10] 💡 Add RUNPOD_API_KEY to Doppler:');
        logger.error('[Loop 10]    doppler secrets set RUNPOD_API_KEY "your-key" --project ai-tools --config dev');
      }
    }
  }

  /**
   * Save cost snapshot to database for historical tracking
   */
  private saveCostSnapshot(summary: any): void {
    try {
      const dbPath = join(process.cwd(), 'src', 'database', 'registry.db');
      const db = new Database(dbPath);

      // Create table if not exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS runpod_cost_snapshots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_pods INTEGER,
          running_pods INTEGER,
          idle_pods INTEGER,
          total_gpus INTEGER,
          active_agents INTEGER,
          cost_per_hour REAL,
          cost_per_day REAL,
          cost_per_month REAL
        );

        CREATE INDEX IF NOT EXISTS idx_cost_snapshots_timestamp
        ON runpod_cost_snapshots(timestamp DESC);
      `);

      // Insert snapshot
      db.prepare(`
        INSERT INTO runpod_cost_snapshots
        (total_pods, running_pods, idle_pods, total_gpus, active_agents,
         cost_per_hour, cost_per_day, cost_per_month)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        summary.total_pods,
        summary.running_pods,
        summary.idle_pods,
        summary.total_gpus,
        summary.active_agents,
        summary.cost_per_hour,
        summary.cost_per_day,
        summary.cost_per_month
      );

      db.close();
    } catch (error) {
      logger.error('[Loop 10] Failed to save cost snapshot:', error);
    }
  }

  /**
   * Trigger cost alert (future: send to Slack/Discord/Email)
   */
  private triggerCostAlert(level: 'WARNING' | 'CRITICAL', dailyCost: number): void {
    try {
      const dbPath = join(process.cwd(), 'src', 'database', 'registry.db');
      const db = new Database(dbPath);

      // Create alerts table
      db.exec(`
        CREATE TABLE IF NOT EXISTS runpod_cost_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          alert_level TEXT NOT NULL,
          daily_cost REAL NOT NULL,
          message TEXT NOT NULL,
          acknowledged BOOLEAN DEFAULT 0
        );
      `);

      // Insert alert
      const message = level === 'CRITICAL'
        ? `CRITICAL: Daily RunPod cost is $${dailyCost.toFixed(2)}! Stop unused pods immediately!`
        : `WARNING: Daily RunPod cost is $${dailyCost.toFixed(2)}. Monitor costs closely.`;

      db.prepare(`
        INSERT INTO runpod_cost_alerts (alert_level, daily_cost, message)
        VALUES (?, ?, ?)
      `).run(level, dailyCost, message);

      db.close();

      // TODO: Send to external alerting system (Slack, Discord, Email)
      // await sendSlackAlert(level, message);
      // await sendEmailAlert(level, message);

    } catch (error) {
      logger.error('[Loop 10] Failed to save cost alert:', error);
    }
  }

  /**
   * Get cost history for dashboard charts
   */
  public static getCostHistory(hours: number = 24): any[] {
    try {
      const dbPath = join(process.cwd(), 'src', 'database', 'registry.db');
      const db = new Database(dbPath);

      const snapshots = db.prepare(`
        SELECT *
        FROM runpod_cost_snapshots
        WHERE timestamp > datetime('now', '-${hours} hours')
        ORDER BY timestamp ASC
      `).all();

      db.close();
      return snapshots;
    } catch (error) {
      logger.error('[Loop 10] Failed to get cost history:', error);
      return [];
    }
  }

  /**
   * Get recent alerts
   */
  public static getRecentAlerts(limit: number = 10): any[] {
    try {
      const dbPath = join(process.cwd(), 'src', 'database', 'registry.db');
      const db = new Database(dbPath);

      const alerts = db.prepare(`
        SELECT *
        FROM runpod_cost_alerts
        WHERE acknowledged = 0
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);

      db.close();
      return alerts;
    } catch (error) {
      logger.error('[Loop 10] Failed to get recent alerts:', error);
      return [];
    }
  }
}
