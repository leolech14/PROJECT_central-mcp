/**
 * estimate_task_cost - Calculate cost for task across all models
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { CostAwareScheduler } from '../../core/CostAwareScheduler.js';

const EstimateTaskCostArgsSchema = z.object({
  taskId: z.string()
});

export const estimateTaskCostTool = {
  name: 'estimate_task_cost',
  description: 'Calculate estimated cost for task across all available models',
  inputSchema: {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'Task ID to estimate'
      }
    },
    required: ['taskId']
  }
};

export async function handleEstimateTaskCost(args: unknown, db: Database.Database) {
  const parsed = EstimateTaskCostArgsSchema.parse(args);

  const scheduler = new CostAwareScheduler(db);
  const estimate = scheduler.estimateTaskCost(parsed.taskId);

  // Format for display
  const costLines = Object.entries(estimate.costByModel)
    .sort((a, b) => a[1] - b[1])
    .map(([model, cost]) => {
      const icon = model === estimate.recommendedModel ? '⭐' : '  ';
      return `${icon} ${model}: $${cost.toFixed(2)}`;
    });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        taskId: estimate.taskId,
        estimatedHours: estimate.estimatedHours,
        costByModel: estimate.costByModel,
        recommendedModel: estimate.recommendedModel,
        reason: estimate.reason,
        savings: `$${estimate.savings.toFixed(2)} vs most expensive`,
        summary: `\n💰 Cost Estimate for ${estimate.taskId}:\n\n` +
                 `Estimated time: ${estimate.estimatedHours} hours\n\n` +
                 `Cost by model:\n${costLines.join('\n')}\n\n` +
                 `⭐ Recommended: ${estimate.recommendedModel}\n` +
                 `Reason: ${estimate.reason}\n` +
                 `Savings: $${estimate.savings.toFixed(2)}`
      }, null, 2)
    }]
  };
}
