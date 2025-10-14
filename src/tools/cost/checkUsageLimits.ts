/**
 * check_usage_limits - Check if agent can work (within budget limits)
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { CostAwareScheduler } from '../../core/CostAwareScheduler.js';

const CheckUsageLimitsArgsSchema = z.object({
  agentId: z.string()
});

export const checkUsageLimitsTool = {
  name: 'check_usage_limits',
  description: 'Check agent usage limits and remaining hours',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agentId: {
        type: 'string',
        description: 'Agent ID to check'
      }
    },
    required: ['agentId']
  }
};

export async function handleCheckUsageLimits(args: unknown, db: Database.Database) {
  const parsed = CheckUsageLimitsArgsSchema.parse(args);

  const scheduler = new CostAwareScheduler(db);
  const status = scheduler.checkUsageLimits(parsed.agentId);

  const summary = [
    `📊 Usage Limits for Agent`,
    ``,
    `Model: ${status.modelId}`,
    ``,
    `Today:`,
    `├─ Used: ${status.hoursUsedToday.toFixed(1)}h`,
    `├─ Limit: ${status.dailyLimit ? `${status.dailyLimit}h` : 'Unlimited'}`,
    `└─ Remaining: ${status.dailyLimit ? `${(status.dailyLimit - status.hoursUsedToday).toFixed(1)}h` : 'Unlimited'}`,
    ``,
    `This Week:`,
    `├─ Used: ${status.hoursUsedThisWeek.toFixed(1)}h`,
    `├─ Limit: ${status.weeklyLimit ? `${status.weeklyLimit}h` : 'Unlimited'}`,
    `└─ Remaining: ${status.weeklyLimit ? `${(status.weeklyLimit - status.hoursUsedThisWeek).toFixed(1)}h` : 'Unlimited'}`,
    ``,
    `Status: ${status.canWork ? '✅ CAN WORK' : '❌ LIMIT EXCEEDED'}`,
  ];

  if (status.alert) {
    summary.push(``, status.alert);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...status,
        summary: summary.join('\n')
      }, null, 2)
    }]
  };
}
