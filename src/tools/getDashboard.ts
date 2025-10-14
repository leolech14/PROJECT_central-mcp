/**
 * MCP Tool: get_agent_dashboard
 * ================================
 *
 * Displays real-time agent status dashboard with beautiful CLI formatting.
 * Shows which agents are working, what they're doing, and overall system health.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TaskRegistry } from '../registry/TaskRegistry.js';
import { GitTracker } from '../registry/GitTracker.js';
import { logger } from '../utils/logger.js';

export function createGetDashboardTool(
  registry: TaskRegistry,
  gitTracker: GitTracker
): Tool & { handler: (args: any) => Promise<any> } {
  return {
    name: 'get_agent_dashboard',
    description: `
🎯 AGENT DASHBOARD - Real-Time Multi-Agent Status Monitor

Displays beautiful CLI dashboard showing:
- 🤖 Which agents are active and their current tasks
- 📊 Progress indicators for each agent
- ⏱️ Time tracking and velocity metrics
- 🎉 Recent completions and kudos
- 🚨 Blockers and alerts requiring attention
- 📈 Overall system health and velocity

Perfect for:
- Monitoring 6-agent system at a glance
- Identifying bottlenecks and blockers
- Tracking sprint velocity
- Celebrating agent achievements
- Understanding workload distribution

Automatically refreshes with latest git commits and progress updates.
    `.trim(),

    inputSchema: {
      type: 'object',
      properties: {
        detail_level: {
          type: 'string',
          enum: ['minimal', 'standard', 'detailed'],
          default: 'standard',
          description: 'Level of detail to show (minimal = status only, standard = with tasks, detailed = full metrics)'
        },
        agent_filter: {
          type: 'string',
          description: 'Filter to specific agent (A, B, C, D, E) or "all" for everyone',
          default: 'all'
        }
      }
    },

    handler: async (args: any) => {
      const detailLevel = args.detail_level || 'standard';
      const agentFilter = args.agent_filter?.toUpperCase() || 'ALL';

      try {
        logger.info(`📊 Generating agent dashboard (${detailLevel})...`);

        // Get all tasks from registry
        const allTasks = await registry.getAllTasks();

        // Get git status
        const recentCommits = await gitTracker.getRecentCommits(10);

        // Agent definitions
        const agents = {
          A: { name: 'UI Velocity Specialist', model: 'GLM-4.6' },
          B: { name: 'Design System Specialist', model: 'Sonnet-4.5' },
          C: { name: 'Backend Services Specialist', model: 'GLM-4.6' },
          D: { name: 'Integration Specialist', model: 'Sonnet-4.5' },
          E: { name: 'Ground Supervisor', model: 'Gemini-2.5-Pro' },
          F: { name: 'Meta-Config Agent', model: 'ChatGPT-5' }
        };

        // Calculate agent statistics
        interface AgentStat {
          name: string;
          model: string;
          currentTask: any;
          completed: number;
          available: number;
          velocity: string;
          status: string;
        }

        const agentStats: Record<string, AgentStat> = {};
        for (const [id, info] of Object.entries(agents)) {
          if (agentFilter !== 'ALL' && id !== agentFilter) continue;

          const agentTasks = allTasks.filter((t: any) =>
            t.assignedTo?.includes(`Agent ${id}`)
          );

          const currentTask = agentTasks.find((t: any) =>
            t.status === 'IN_PROGRESS' || t.status === 'CLAIMED'
          );

          const completedTasks = agentTasks.filter((t: any) =>
            t.status === 'COMPLETE'
          );

          const availableTasks = agentTasks.filter((t: any) =>
            t.status === 'AVAILABLE'
          );

          agentStats[id] = {
            name: info.name,
            model: info.model,
            currentTask,
            completed: completedTasks.length,
            available: availableTasks.length,
            velocity: calculateVelocity(completedTasks),
            status: currentTask ? 'working' : (availableTasks.length > 0 ? 'idle' : 'released')
          };
        }

        // System-wide statistics
        const systemStats = {
          totalTasks: allTasks.length,
          completed: allTasks.filter((t: any) => t.status === 'COMPLETE').length,
          inProgress: allTasks.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'CLAIMED').length,
          available: allTasks.filter((t: any) => t.status === 'AVAILABLE').length,
          blocked: allTasks.filter((t: any) => t.status === 'BLOCKED').length
        };

        // Recent completions
        const recentCompletions = recentCommits
          .filter((c: any) => c.message.match(/^T\d+:/))
          .slice(0, 5);

        // Build dashboard
        const dashboard = buildDashboard(
          agentStats,
          systemStats,
          recentCompletions,
          detailLevel
        );

        logger.info('✅ Dashboard generated successfully');

        return {
          content: [{
            type: 'text',
            text: dashboard
          }]
        };

      } catch (error) {
        logger.error('❌ Dashboard generation failed:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to generate dashboard: ${error}`
          }],
          isError: true
        };
      }
    }
  };
}

/**
 * Build beautiful CLI dashboard
 */
function buildDashboard(
  agentStats: Record<string, {
    name: string;
    model: string;
    currentTask: any;
    completed: number;
    available: number;
    velocity: string;
    status: string;
  }>,
  systemStats: {
    totalTasks: number;
    completed: number;
    inProgress: number;
    available: number;
    blocked: number;
  },
  recentCompletions: any[],
  detailLevel: string
): string {
  const lines: string[] = [];
  const w = 80; // Width

  // Header
  lines.push('━'.repeat(w));
  lines.push(center('🎯 AGENT COORDINATION DASHBOARD', w));
  lines.push(center(`Keep-In-Touch System • ${new Date().toLocaleString()}`, w));
  lines.push('━'.repeat(w));
  lines.push('');

  // System Health Overview
  lines.push('📊 SYSTEM OVERVIEW');
  lines.push('─'.repeat(w));

  const completionRate = Math.round((systemStats.completed / systemStats.totalTasks) * 100);
  const progressBar = createProgressBar(completionRate, 30);

  lines.push(`Total Tasks:     ${systemStats.totalTasks}`);
  lines.push(`✅ Completed:    ${systemStats.completed} (${completionRate}%) ${progressBar}`);
  lines.push(`🔄 In Progress:  ${systemStats.inProgress}`);
  lines.push(`⚡ Available:    ${systemStats.available}`);
  lines.push(`🚫 Blocked:      ${systemStats.blocked}`);
  lines.push('');

  // Agent Status Grid
  lines.push('🤖 AGENT STATUS');
  lines.push('─'.repeat(w));

  for (const [id, stats] of Object.entries(agentStats)) {
    const statusIcon = stats.status === 'working' ? '🔥' :
                       stats.status === 'idle' ? '⏸️' : '🏁';

    lines.push('');
    lines.push(`${statusIcon} Agent ${id} - ${stats.name} (${stats.model})`);

    if (detailLevel !== 'minimal') {
      lines.push(`   Status: ${stats.status.toUpperCase()}`);

      if (stats.currentTask) {
        lines.push(`   📋 Current: ${stats.currentTask.id} - ${stats.currentTask.title}`);
        lines.push(`   ⏱️  Started: ${stats.currentTask.timeEstimate || 'Unknown'}`);
      }

      lines.push(`   ✅ Completed: ${stats.completed} tasks`);

      if (detailLevel === 'detailed') {
        lines.push(`   ⚡ Available: ${stats.available} tasks waiting`);
        lines.push(`   📈 Velocity: ${stats.velocity}`);
      }
    } else {
      const status = stats.currentTask
        ? `Working on ${stats.currentTask.id}`
        : `${stats.status} (${stats.completed} completed)`;
      lines.push(`   ${status}`);
    }
  }

  lines.push('');

  // Recent Completions
  if (detailLevel !== 'minimal' && recentCompletions.length > 0) {
    lines.push('🎉 RECENT COMPLETIONS');
    lines.push('─'.repeat(w));

    recentCompletions.forEach((commit: any) => {
      const taskId = commit.message.match(/^(T\d+):/)?.[1] || '???';
      const relativeTime = getRelativeTime(commit.timestamp);
      lines.push(`   ✨ ${taskId} - ${commit.author} - ${relativeTime}`);
    });

    lines.push('');
  }

  // Alerts & Actions
  if (systemStats.blocked > 0) {
    lines.push('🚨 ATTENTION REQUIRED');
    lines.push('─'.repeat(w));
    lines.push(`   ⚠️  ${systemStats.blocked} tasks are blocked by dependencies`);
    lines.push('   💡 Complete blocking tasks to unblock dependent work');
    lines.push('');
  }

  // Footer
  lines.push('━'.repeat(w));
  lines.push(center('💡 Use get_available_tasks to see details • Real-time updates', w));
  lines.push('━'.repeat(w));

  return lines.join('\n');
}

/**
 * Create ASCII progress bar
 */
function createProgressBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

/**
 * Center text within width
 */
function center(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Calculate agent velocity (completed tasks per day)
 */
function calculateVelocity(completedTasks: any[]): string {
  if (completedTasks.length === 0) return 'N/A';

  // Calculate average time per task
  const avgHours = completedTasks.reduce((sum: number, t: any) => {
    const hours = parseTimeEstimate(t.timeEstimate || '4 hours');
    return sum + hours;
  }, 0) / completedTasks.length;

  return `${avgHours.toFixed(1)}h/task avg`;
}

/**
 * Parse time estimate to hours
 */
function parseTimeEstimate(estimate: string): number {
  const match = estimate.match(/(\d+)\s*(hour|day|week)/i);
  if (!match) return 4;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('day')) return value * 8;
  if (unit.startsWith('week')) return value * 40;
  return value;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
function getRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
