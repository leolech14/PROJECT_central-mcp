/**
 * Cost-Aware Task Scheduler
 * ==========================
 *
 * Assigns tasks based on cost optimization and agent capabilities.
 *
 * Strategy:
 * - Prioritize GLM-4.6 (cheapest) for 70% of tasks
 * - Use Sonnet 200K for quality-critical 20%
 * - Use Sonnet 1M sparingly for supervision 5%
 * - Enforce daily/weekly limits
 * - Track costs in real-time
 * - Alert on budget issues
 */

import Database from 'better-sqlite3';

export interface CostEstimate {
  taskId: string;
  estimatedHours: number;
  costByModel: Record<string, number>;
  recommendedModel: string;
  reason: string;
  savings: number; // vs most expensive option
}

export interface UsageLimitStatus {
  agentId: string;
  modelId: string;
  hoursUsedToday: number;
  hoursUsedThisWeek: number;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  canWork: boolean;
  hoursRemaining: number;
  alert?: string;
}

export class CostAwareScheduler {
  constructor(private db: Database.Database) {}

  /**
   * Estimate task cost for all available models
   */
  estimateTaskCost(taskId: string): CostEstimate {
    const task = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const estimatedHours = task.estimated_hours || 4;

    // Get all active models
    const models = this.db.prepare(`
      SELECT * FROM model_catalog WHERE active = 1 ORDER BY priority DESC
    `).all() as any[];

    const costByModel: Record<string, number> = {};
    let cheapest: { model: string; cost: number } | null = null;
    let mostExpensive = 0;

    for (const model of models) {
      const cost = estimatedHours * model.cost_per_hour;
      costByModel[model.model_id] = cost;

      if (!cheapest || cost < cheapest.cost) {
        cheapest = { model: model.model_id, cost };
      }

      if (cost > mostExpensive) {
        mostExpensive = cost;
      }
    }

    // Determine recommended model (cheapest that can handle it)
    const recommended = this.recommendCostOptimalModel(task, models);

    const savings = mostExpensive - (cheapest?.cost || 0);

    return {
      taskId,
      estimatedHours,
      costByModel,
      recommendedModel: recommended.model_id,
      reason: recommended.reason,
      savings
    };
  }

  /**
   * Recommend cost-optimal model for task
   */
  private recommendCostOptimalModel(task: any, models: any[]): { model_id: string; reason: string } {
    const taskText = `${task.name} ${task.description || ''}`.toLowerCase();

    // Check if task requires special capabilities
    const needsUltrathink = taskText.includes('ultrathink') || taskText.includes('strategic') || task.priority === 'P0' && taskText.includes('architecture');
    const needsLargeContext = taskText.includes('complete') || taskText.includes('entire') || taskText.includes('all');
    const isQualityCritical = taskText.includes('design') || taskText.includes('accessibility') || taskText.includes('security');

    // If needs 1M context + ULTRATHINK → Sonnet 1M (expensive but necessary)
    if (needsLargeContext && needsUltrathink) {
      const sonnet1m = models.find(m => m.model_id === 'claude-sonnet-4-5-1m');
      if (sonnet1m) {
        return {
          model_id: sonnet1m.model_id,
          reason: 'Requires 1M context + ULTRATHINK (strategic task)'
        };
      }
    }

    // If quality-critical → Sonnet 200K
    if (isQualityCritical) {
      const sonnet200k = models.find(m => m.model_id === 'claude-sonnet-4-5-200k');
      if (sonnet200k) {
        return {
          model_id: sonnet200k.model_id,
          reason: 'Quality-critical work (design/security)'
        };
      }
    }

    // DEFAULT: Use GLM-4.6 (cheapest, most tasks) ⭐
    const glm = models.find(m => m.model_id === 'glm-4.6');
    if (glm) {
      return {
        model_id: glm.model_id,
        reason: 'Cost-optimized: GLM-4.6 can handle this ($2/hr vs $40/hr!) ⭐'
      };
    }

    // Fallback: Cheapest available
    const sorted = [...models].sort((a, b) => a.cost_per_hour - b.cost_per_hour);
    return {
      model_id: sorted[0].model_id,
      reason: 'Cheapest available option'
    };
  }

  /**
   * Check if agent can work (within usage limits)
   */
  checkUsageLimits(agentId: string): UsageLimitStatus {
    const agent = this.db.prepare(`SELECT * FROM agents WHERE id = ?`).get(agentId) as any;

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const model = this.db.prepare(`
      SELECT * FROM model_catalog WHERE model_id = ?
    `).get(agent.model_id) as any;

    if (!model) {
      return {
        agentId,
        modelId: agent.model_id,
        hoursUsedToday: 0,
        hoursUsedThisWeek: 0,
        dailyLimit: null,
        weeklyLimit: null,
        canWork: true,
        hoursRemaining: 999
      };
    }

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = this.db.prepare(`
      SELECT COALESCE(SUM(hours_used), 0) as hours
      FROM agent_usage
      WHERE agent_id = ? AND date = ?
    `).get(agentId, today) as { hours: number };

    // Get this week's usage
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weekUsage = this.db.prepare(`
      SELECT COALESCE(SUM(hours_used), 0) as hours
      FROM agent_usage
      WHERE agent_id = ? AND date >= ?
    `).get(agentId, weekStartStr) as { hours: number };

    const hoursUsedToday = todayUsage.hours;
    const hoursUsedThisWeek = weekUsage.hours;

    // Check limits
    const dailyLimit = model.daily_hour_limit;
    const weeklyLimit = model.weekly_hour_limit;

    const dailyRemaining = dailyLimit ? dailyLimit - hoursUsedToday : 999;
    const weeklyRemaining = weeklyLimit ? weeklyLimit - hoursUsedThisWeek : 999;
    const hoursRemaining = Math.min(dailyRemaining, weeklyRemaining);

    const canWork = hoursRemaining > 0;

    // Generate alert if approaching limit
    let alert: string | undefined;
    if (dailyLimit && dailyRemaining < 1) {
      alert = `⚠️  Approaching daily limit (${dailyRemaining.toFixed(1)}h remaining)`;
    } else if (weeklyLimit && weeklyRemaining < 5) {
      alert = `⚠️  Approaching weekly limit (${weeklyRemaining.toFixed(1)}h remaining)`;
    }

    return {
      agentId,
      modelId: agent.model_id,
      hoursUsedToday,
      hoursUsedThisWeek,
      dailyLimit,
      weeklyLimit,
      canWork,
      hoursRemaining,
      alert
    };
  }

  /**
   * Track task completion cost
   */
  trackTaskCost(taskId: string, agentId: string, hoursSpent: number): void {
    const agent = this.db.prepare(`SELECT * FROM agents WHERE id = ?`).get(agentId) as any;
    const model = this.db.prepare(`SELECT * FROM model_catalog WHERE model_id = ?`).get(agent.model_id) as any;

    const cost = hoursSpent * model.cost_per_hour;

    // Update agent usage for today
    const today = new Date().toISOString().split('T')[0];

    this.db.prepare(`
      INSERT INTO agent_usage (agent_id, model_id, date, hours_used, tasks_completed, estimated_cost)
      VALUES (?, ?, ?, ?, 1, ?)
      ON CONFLICT(agent_id, model_id, date) DO UPDATE SET
        hours_used = hours_used + excluded.hours_used,
        tasks_completed = tasks_completed + 1,
        estimated_cost = estimated_cost + excluded.estimated_cost
    `).run(agentId, agent.model_id, today, hoursSpent, cost);

    // Store actual task cost
    this.db.prepare(`
      INSERT OR REPLACE INTO task_costs (task_id, actual_cost, completed_by_model)
      VALUES (?, ?, ?)
    `).run(taskId, cost, agent.model_id);

    console.log(`💰 Task ${taskId} cost: $${cost.toFixed(2)} (${hoursSpent}h × $${model.cost_per_hour}/h)`);

    // Check if we should alert
    this.checkBudgetAlerts(agentId, model);
  }

  /**
   * Check and create budget alerts
   */
  private checkBudgetAlerts(agentId: string, model: any): void {
    const limits = this.checkUsageLimits(agentId);

    // Daily limit warning (80% used)
    if (limits.dailyLimit && limits.hoursUsedToday >= limits.dailyLimit * 0.8) {
      this.createAlert({
        alert_type: limits.hoursUsedToday >= limits.dailyLimit ? 'DAILY_LIMIT_EXCEEDED' : 'DAILY_LIMIT_WARNING',
        agent_id: agentId,
        model_id: model.model_id,
        threshold_value: limits.dailyLimit,
        current_value: limits.hoursUsedToday,
        message: `Agent using ${model.name} has used ${limits.hoursUsedToday.toFixed(1)}/${limits.dailyLimit}h today`
      });
    }

    // Weekly limit warning (80% used)
    if (limits.weeklyLimit && limits.hoursUsedThisWeek >= limits.weeklyLimit * 0.8) {
      this.createAlert({
        alert_type: limits.hoursUsedThisWeek >= limits.weeklyLimit ? 'WEEKLY_LIMIT_EXCEEDED' : 'WEEKLY_LIMIT_WARNING',
        agent_id: agentId,
        model_id: model.model_id,
        threshold_value: limits.weeklyLimit,
        current_value: limits.hoursUsedThisWeek,
        message: `Agent using ${model.name} has used ${limits.hoursUsedThisWeek.toFixed(1)}/${limits.weeklyLimit}h this week`
      });
    }
  }

  /**
   * Create budget alert
   */
  private createAlert(alert: any): void {
    this.db.prepare(`
      INSERT INTO budget_alerts (alert_type, agent_id, model_id, threshold_value, current_value, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      alert.alert_type,
      alert.agent_id,
      alert.model_id,
      alert.threshold_value,
      alert.current_value,
      alert.message
    );

    console.log(`⚠️  BUDGET ALERT: ${alert.message}`);
  }

  /**
   * Get cost report for period
   */
  getCostReport(startDate: string, endDate: string): any {
    const report = this.db.prepare(`
      SELECT
        m.name as model_name,
        m.monthly_subscription,
        COUNT(DISTINCT au.agent_id) as agents_using,
        SUM(au.hours_used) as total_hours,
        SUM(au.tasks_completed) as total_tasks,
        SUM(au.estimated_cost) as total_cost,
        AVG(au.estimated_cost / au.tasks_completed) as avg_cost_per_task
      FROM agent_usage au
      JOIN model_catalog m ON au.model_id = m.model_id
      WHERE au.date BETWEEN ? AND ?
      GROUP BY au.model_id
      ORDER BY total_cost DESC
    `).all(startDate, endDate) as any[];

    const totalCost = report.reduce((sum, r) => sum + r.total_cost, 0);

    return {
      period: { start: startDate, end: endDate },
      byModel: report,
      totalCost,
      totalTasks: report.reduce((sum, r) => sum + r.total_tasks, 0),
      totalHours: report.reduce((sum, r) => sum + r.total_hours, 0)
    };
  }

  /**
   * Recommend cheapest available agent for task
   */
  recommendCheapestAgent(taskId: string): { agentId: string; cost: number; reason: string } | null {
    const task = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;

    if (!task) return null;

    // Get all agents with this model capability
    const agents = this.db.prepare(`
      SELECT a.*, m.*
      FROM agents a
      JOIN model_catalog m ON a.model_id = m.model_id
      WHERE m.active = 1
      ORDER BY m.priority DESC, m.cost_per_hour ASC
    `).all() as any[];

    // Filter by availability and limits
    const available = agents.filter(agent => {
      const limits = this.checkUsageLimits(agent.id);
      return limits.canWork && limits.hoursRemaining >= (task.estimated_hours || 4);
    });

    if (available.length === 0) {
      return null;
    }

    // Return cheapest available
    const cheapest = available[0];
    const cost = (task.estimated_hours || 4) * cheapest.cost_per_hour;

    return {
      agentId: cheapest.id,
      cost,
      reason: `Most cost-effective: ${cheapest.name} ($${cost.toFixed(2)} vs $${((task.estimated_hours || 4) * available[available.length - 1].cost_per_hour).toFixed(2)})`
    };
  }

  /**
   * Warn if expensive agent being used unnecessarily
   */
  checkExpensiveAssignment(agentId: string, taskId: string): { warning: boolean; message?: string; savings?: number } {
    const agent = this.db.prepare(`SELECT * FROM agents WHERE id = ?`).get(agentId) as any;
    const model = this.db.prepare(`SELECT * FROM model_catalog WHERE model_id = ?`).get(agent.model_id) as any;
    const task = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;

    // If using expensive model (Sonnet 1M)
    if (model.model_id === 'claude-sonnet-4-5-1m') {
      // Check if cheaper model could handle it
      const glm = this.db.prepare(`SELECT * FROM model_catalog WHERE model_id = 'glm-4.6'`).get() as any;

      const expensiveCost = (task.estimated_hours || 4) * model.cost_per_hour;
      const cheapCost = (task.estimated_hours || 4) * glm.cost_per_hour;
      const savings = expensiveCost - cheapCost;

      // If not strategic/planning task, warn
      const taskText = `${task.name} ${task.description || ''}`.toLowerCase();
      const needsSupervision = taskText.includes('plan') || taskText.includes('architecture') || taskText.includes('strategic');

      if (!needsSupervision && savings > 20) {
        return {
          warning: true,
          message: `⚠️  Using Sonnet 1M ($${expensiveCost.toFixed(2)}) for task that GLM-4.6 could do for $${cheapCost.toFixed(2)}`,
          savings
        };
      }
    }

    return { warning: false };
  }

  /**
   * Get daily cost summary
   */
  getDailyCostSummary(): any {
    const today = new Date().toISOString().split('T')[0];

    return this.db.prepare(`
      SELECT
        m.name,
        SUM(au.hours_used) as hours,
        SUM(au.tasks_completed) as tasks,
        SUM(au.estimated_cost) as cost
      FROM agent_usage au
      JOIN model_catalog m ON au.model_id = m.model_id
      WHERE au.date = ?
      GROUP BY au.model_id
      ORDER BY cost DESC
    `).all(today) as any[];
  }
}
