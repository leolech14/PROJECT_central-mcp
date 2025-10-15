/**
 * MCP Tool: get_agent_status
 * ===========================
 *
 * Get detailed status for a specific agent with beautiful formatting.
 * Shows current task, progress, velocity, completed work, and available tasks.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TaskRegistry } from '../registry/TaskRegistry.js';
import { GitTracker } from '../registry/GitTracker.js';
import { logger } from '../utils/logger.js';

export function createGetAgentStatusTool(
  registry: TaskRegistry,
  gitTracker: GitTracker
): Tool & { handler: (args: any) => Promise<any> } {
  return {
    name: 'get_agent_status',
    description: `
🤖 AGENT STATUS - Individual Agent Deep Dive

Get comprehensive status report for a specific agent including:
- 🎯 Current task with progress details
- ✅ Completed tasks with timestamps
- ⚡ Available tasks ready to claim
- 📊 Velocity and productivity metrics
- 🎉 Recent achievements and kudos
- 🚨 Blockers or issues requiring attention
- ⏱️ Time tracking and estimates

Perfect for:
- Checking what an agent is currently working on
- Understanding agent workload and capacity
- Identifying if agent needs help or unblocking
- Celebrating agent contributions
- Planning next task assignments

Example: "What is Agent C working on right now?"
    `.trim(),

    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'Agent identifier (A, B, C, D, E, or F)',
          enum: ['A', 'B', 'C', 'D', 'E', 'F']
        },
        include_history: {
          type: 'boolean',
          description: 'Include completed task history',
          default: true
        }
      },
      required: ['agent_id']
    },

    handler: async (args: any) => {
      const agentId = args.agent_id.toUpperCase();
      const includeHistory = args.include_history !== false;

      try {
        logger.info(`📊 Getting status for Agent ${agentId}...`);

        // Agent definitions
        const agents: any = {
          A: { name: 'UI Velocity Specialist', model: 'GLM-4.6', color: '🔵' },
          B: { name: 'Design System Specialist', model: 'Sonnet-4.5', color: '🟣' },
          C: { name: 'Backend Services Specialist', model: 'GLM-4.6', color: '🟢' },
          D: { name: 'Integration Specialist', model: 'Sonnet-4.5', color: '🟡' },
          E: { name: 'Ground Supervisor', model: 'Gemini-2.5-Pro', color: '🔴' },
          F: { name: 'Meta-Config Agent', model: 'ChatGPT-5', color: '⚪' }
        };

        const agentInfo = agents[agentId];
        if (!agentInfo) {
          throw new Error(`Unknown agent: ${agentId}`);
        }

        // Get all tasks from registry
        const allTasks = await registry.getAllTasks();

        // Filter tasks for this agent
        const agentTasks = allTasks.filter((t: any) =>
          t.assignedTo?.includes(`Agent ${agentId}`)
        );

        // Categorize tasks
        const currentTask = agentTasks.find((t: any) =>
          t.status === 'IN_PROGRESS' || t.status === 'CLAIMED'
        );

        const completedTasks = agentTasks
          .filter((t: any) => t.status === 'COMPLETE')
          .sort((a: any, b: any) => {
            const timeA = new Date(a.completedAt || 0).getTime();
            const timeB = new Date(b.completedAt || 0).getTime();
            return timeB - timeA;
          });

        const availableTasks = agentTasks
          .filter((t: any) => t.status === 'AVAILABLE')
          .sort((a: any, b: any) => {
            const priorityOrder: any = { P0: 0, P1: 1, P2: 2, P3: 3 };
            return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
          });

        const blockedTasks = agentTasks.filter((t: any) => t.status === 'BLOCKED');

        // Get recent commits by this agent
        const recentCommits = await gitTracker.getRecentCommits(20);
        const agentCommits = recentCommits.filter((c: any) =>
          c.message.includes(`Agent ${agentId}`)
        ).slice(0, 5);

        // Build status report
        const report = buildAgentStatusReport(
          agentId,
          agentInfo,
          currentTask,
          completedTasks,
          availableTasks,
          blockedTasks,
          agentCommits,
          includeHistory
        );

        logger.info(`✅ Status for Agent ${agentId} generated`);

        return {
          content: [{
            type: 'text',
            text: report
          }]
        };

      } catch (error) {
        logger.error(`❌ Failed to get agent status:`, error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to get agent status: ${error}`
          }],
          isError: true
        };
      }
    }
  };
}

/**
 * Build beautiful agent status report
 */
function buildAgentStatusReport(
  agentId: string,
  agentInfo: any,
  currentTask: any,
  completedTasks: any[],
  availableTasks: any[],
  blockedTasks: any[],
  recentCommits: any[],
  includeHistory: boolean
): string {
  const lines: string[] = [];
  const w = 80;

  // Header
  lines.push('━'.repeat(w));
  lines.push(center(`${agentInfo.color} AGENT ${agentId} STATUS REPORT`, w));
  lines.push(center(`${agentInfo.name} • ${agentInfo.model}`, w));
  lines.push(center(new Date().toLocaleString(), w));
  lines.push('━'.repeat(w));
  lines.push('');

  // Current Status
  if (currentTask) {
    lines.push('🔥 CURRENTLY WORKING ON');
    lines.push('─'.repeat(w));
    lines.push('');
    lines.push(`📋 ${currentTask.id} - ${currentTask.title}`);
    lines.push(`🎯 Priority: ${currentTask.priority}`);
    lines.push(`⏱️  Estimate: ${currentTask.timeEstimate || 'Unknown'}`);

    if (currentTask.dependencies?.length > 0) {
      lines.push(`🔗 Dependencies: ${currentTask.dependencies.join(', ')}`);
    }

    if (currentTask.acceptanceCriteria?.length > 0) {
      lines.push('');
      lines.push('✅ Acceptance Criteria:');
      currentTask.acceptanceCriteria.forEach((criterion: string, i: number) => {
        lines.push(`   ${i + 1}. ${criterion}`);
      });
    }

    lines.push('');
    lines.push(`📍 Status: ${currentTask.status}`);
    lines.push('');
  } else if (availableTasks.length > 0) {
    lines.push('⏸️  IDLE - TASKS AVAILABLE');
    lines.push('─'.repeat(w));
    lines.push(`Agent has ${availableTasks.length} task${availableTasks.length > 1 ? 's' : ''} ready to claim`);
    lines.push('');
  } else if (blockedTasks.length > 0) {
    lines.push('🚫 BLOCKED - WAITING ON DEPENDENCIES');
    lines.push('─'.repeat(w));
    lines.push(`Agent has ${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''} blocked`);
    lines.push('');
  } else {
    lines.push('🏁 RELEASED - ALL TASKS COMPLETE');
    lines.push('─'.repeat(w));
    lines.push('Agent has completed all assigned work. Take a break! 🎉');
    lines.push('');
  }

  // Statistics
  lines.push('📊 PRODUCTIVITY METRICS');
  lines.push('─'.repeat(w));
  lines.push(`✅ Tasks Completed: ${completedTasks.length}`);
  lines.push(`⚡ Tasks Available: ${availableTasks.length}`);
  lines.push(`🚫 Tasks Blocked: ${blockedTasks.length}`);

  if (completedTasks.length > 0) {
    const velocity = calculateAgentVelocity(completedTasks);
    lines.push(`📈 Average Velocity: ${velocity}`);
  }

  lines.push('');

  // Completed Tasks History
  if (includeHistory && completedTasks.length > 0) {
    lines.push('✅ RECENTLY COMPLETED');
    lines.push('─'.repeat(w));

    completedTasks.slice(0, 5).forEach((task: any) => {
      const time = task.completedAt
        ? new Date(task.completedAt).toLocaleDateString()
        : 'Unknown';
      lines.push(`   🎉 ${task.id} - ${task.title}`);
      lines.push(`      Completed: ${time}`);
    });

    if (completedTasks.length > 5) {
      lines.push(`   ... and ${completedTasks.length - 5} more`);
    }

    lines.push('');
  }

  // Next Available Tasks
  if (availableTasks.length > 0) {
    lines.push('⚡ NEXT AVAILABLE TASKS');
    lines.push('─'.repeat(w));

    availableTasks.slice(0, 3).forEach((task: any) => {
      lines.push(`   📋 ${task.id} - ${task.title}`);
      lines.push(`      Priority: ${task.priority} | Estimate: ${task.timeEstimate || 'Unknown'}`);
    });

    if (availableTasks.length > 3) {
      lines.push(`   ... and ${availableTasks.length - 3} more available`);
    }

    lines.push('');
  }

  // Recent Git Activity
  if (recentCommits.length > 0) {
    lines.push('📝 RECENT GIT ACTIVITY');
    lines.push('─'.repeat(w));

    recentCommits.forEach((commit: any) => {
      const relTime = getRelativeTime(commit.timestamp);
      lines.push(`   💾 ${commit.message.split('\n')[0]}`);
      lines.push(`      ${relTime} • ${commit.hash.substring(0, 7)}`);
    });

    lines.push('');
  }

  // Footer
  lines.push('━'.repeat(w));
  lines.push(center('💡 Use claim_task to start work • update_progress to report', w));
  lines.push('━'.repeat(w));

  return lines.join('\n');
}

/**
 * Center text within width
 */
function center(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Calculate agent velocity
 */
function calculateAgentVelocity(completedTasks: any[]): string {
  if (completedTasks.length === 0) return 'N/A';

  const avgHours = completedTasks.reduce((sum: number, t: any) => {
    const hours = parseTimeEstimate(t.timeEstimate || '4 hours');
    return sum + hours;
  }, 0) / completedTasks.length;

  return `${avgHours.toFixed(1)}h per task`;
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
 * Get relative time string
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
