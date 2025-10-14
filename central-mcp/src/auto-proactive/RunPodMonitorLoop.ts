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
import { writeSystemEvent } from '../api/universal-write.js';
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

        // Credit balance check (PREVENT ACCOUNT TERMINATION)
        const balance = await this.getRunPodBalance();
        if (balance !== null && balance < 10.0) {
          logger.error(`[Loop 10] 🚨 CRITICAL: LOW CREDIT BALANCE $${balance.toFixed(2)} - Add funds immediately!`);

          // Write critical alert to Universal Write System
          await writeSystemEvent({
            eventType: 'credit_alert',
            eventCategory: 'system',
            eventActor: 'Loop-10',
            eventAction: `Critical: Low RunPod credit balance $${balance.toFixed(2)}`,
            eventDescription: `RunPod account balance below $10.00 - immediate action required to prevent service termination`,
            systemHealth: 'critical',
            eventSeverity: 'critical',
            eventMetadata: {
              balance: balance,
              threshold: 10.0,
              currency: 'USD',
              urgency: 'immediate',
              action_required: 'add_funds',
              potential_impact: 'account_termination'
            },
            timestamp: new Date().toISOString()
          });

          // Send external alert if configured
          await this.sendCreditAlert(balance);
        } else if (balance !== null && balance < 25.0) {
          logger.warn(`[Loop 10] ⚠️  WARNING: Low RunPod credit balance $${balance.toFixed(2)} - Consider adding funds`);

          await writeSystemEvent({
            eventType: 'credit_warning',
            eventCategory: 'system',
            eventActor: 'Loop-10',
            eventAction: `Warning: Low RunPod credit balance $${balance.toFixed(2)}`,
            eventDescription: `RunPod account balance below $25.00 - action recommended soon`,
            systemHealth: 'degraded',
            eventSeverity: 'warning',
            eventMetadata: {
              balance: balance,
              threshold: 25.0,
              currency: 'USD',
              urgency: 'soon',
              action_required: 'consider_adding_funds'
            },
            timestamp: new Date().toISOString()
          });
        } else if (balance !== null) {
          logger.info(`[Loop 10] 💰 RunPod credit balance: $${balance.toFixed(2)}`);
        } else {
          logger.warn('[Loop 10] ⚠️  Unable to retrieve RunPod credit balance');
        }

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
   * Get RunPod account balance to prevent account termination
   */
  private async getRunPodBalance(): Promise<number | null> {
    try {
      const apiKey = process.env.RUNPOD_API_KEY;
      if (!apiKey) {
        logger.warn('[Loop 10] ⚠️  RUNPOD_API_KEY not configured - cannot check balance');
        return null;
      }

      const response = await fetch('https://api.runpod.io/v2/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        logger.warn(`[Loop 10] ⚠️  Failed to get balance: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      // RunPod API returns balance in USD
      if (data && typeof data.balance === 'number') {
        return data.balance;
      } else if (data && typeof data.credits === 'number') {
        return data.credits;
      } else {
        logger.warn('[Loop 10] ⚠️  Unexpected balance response format:', JSON.stringify(data));
        return null;
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.warn('[Loop 10] ⚠️  Balance check timeout (10s)');
      } else {
        logger.warn('[Loop 10] ⚠️  Balance check error:', error.message);
      }
      return null;
    }
  }

  /**
   * Send credit alert via configured channels
   */
  private async sendCreditAlert(balance: number): Promise<void> {
    try {
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      const slackUrl = process.env.SLACK_WEBHOOK_URL;
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;

      const alertMessage = {
        title: '🚨 CRITICAL: RunPod Credit Balance Low',
        text: `Current balance: $${balance.toFixed(2)} - Add funds immediately to prevent account termination!`,
        color: 'danger',
        fields: [
          { name: 'Balance', value: `$${balance.toFixed(2)}`, short: true },
          { name: 'Threshold', value: '$10.00', short: true },
          { name: 'Action Required', value: 'Add funds immediately', short: true },
          { name: 'Impact', value: 'Account termination', short: true }
        ],
        timestamp: new Date().toISOString()
      };

      // Send to primary webhook
      if (webhookUrl) {
        await this.sendWebhookAlert(webhookUrl, alertMessage);
      }

      // Send to Slack
      if (slackUrl) {
        await this.sendSlackAlert(slackUrl, alertMessage);
      }

      // Send to Discord
      if (discordUrl) {
        await this.sendDiscordAlert(discordUrl, alertMessage);
      }

      logger.info(`[Loop 10] 📢 Credit alert sent via ${[webhookUrl, slackUrl, discordUrl].filter(Boolean).length} channels`);

    } catch (error: any) {
      logger.error('[Loop 10] ❌ Failed to send credit alert:', error.message);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(url: string, message: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error: any) {
      logger.warn('[Loop 10] ⚠️  Webhook alert failed:', error.message);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(url: string, message: any): Promise<void> {
    try {
      const slackPayload = {
        text: message.title,
        attachments: [{
          color: 'danger',
          fields: message.fields,
          footer: 'Central-MCP RunPod Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }
    } catch (error: any) {
      logger.warn('[Loop 10] ⚠️  Slack alert failed:', error.message);
    }
  }

  /**
   * Send Discord alert
   */
  private async sendDiscordAlert(url: string, message: any): Promise<void> {
    try {
      const discordPayload = {
        embeds: [{
          title: message.title,
          description: message.text,
          color: 0xFF0000, // Red for critical
          fields: message.fields.map((field: any) => ({
            name: field.name,
            value: field.value,
            inline: field.short
          })),
          timestamp: message.timestamp
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`);
      }
    } catch (error: any) {
      logger.warn('[Loop 10] ⚠️  Discord alert failed:', error.message);
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
