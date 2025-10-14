/**
 * get_system_health - Health check and self-healing
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { HealthChecker } from '../../health/HealthChecker.js';

const GetSystemHealthArgsSchema = z.object({
  autoHeal: z.boolean().optional().default(true)
});

export const getSystemHealthTool = {
  name: 'get_system_health',
  description: 'Check system health and trigger automatic recovery if needed',
  inputSchema: {
    type: 'object' as const,
    properties: {
      autoHeal: {
        type: 'boolean',
        description: 'Enable automatic recovery (default: true)'
      }
    }
  }
};

export async function handleGetSystemHealth(args: unknown, db: Database.Database, dbPath: string) {
  const parsed = GetSystemHealthArgsSchema.parse(args);

  const healthChecker = new HealthChecker(db, dbPath);

  // Perform health check
  const health = await healthChecker.performHealthCheck();

  // Auto-heal if enabled and issues found
  if (parsed.autoHeal && health.status !== 'HEALTHY') {
    console.log('🔧 AUTO-HEAL: Attempting automatic recovery...');

    // Attempt recovery actions
    await healthChecker.resetAgentPresence();
    const unblocked = await healthChecker.unblockReadyTasks();

    if (health.checks.some(c => c.name === 'Database Size' && c.status === 'WARN')) {
      await healthChecker.vacuumDatabase();
    }

    // Re-check health after recovery
    const afterHeal = await healthChecker.performHealthCheck();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          initialHealth: health.status,
          afterRecovery: afterHeal.status,
          recovered: afterHeal.status === 'HEALTHY',
          checks: afterHeal.checks.map(c => ({
            name: c.name,
            status: c.status,
            message: c.message,
            duration: c.duration
          })),
          recoveryActions: [
            'Agent presence reset',
            `${unblocked} tasks unblocked`,
            'Database optimized'
          ],
          summary: healthChecker.getHealthSummary(afterHeal)
        }, null, 2)
      }]
    };
  }

  // Return health status without auto-heal
  const summary = healthChecker.getHealthSummary(health);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: health.status,
        healthy: health.healthy,
        timestamp: health.timestamp,
        checks: health.checks.map(c => ({
          name: c.name,
          status: c.status,
          message: c.message,
          duration: c.duration
        })),
        issues: health.issues,
        autoRecoveryAttempted: health.autoRecoveryAttempted,
        summary
      }, null, 2)
    }]
  };
}
