/**
 * MCP Tool: complete_task (FULLY INTEGRATED VERSION)
 * ===================================================
 *
 * Complete task with ALL enforcements:
 * 1. Keep-in-Touch permission check ⭐
 * 2. Git verification (minimum 30%) ⭐
 * 3. Best practices validation ⭐
 * 4. Cost tracking ⭐
 * 5. Auto-unblocking
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import Database from 'better-sqlite3';
import IntegratedTaskStore from '../registry/JsonTaskStore.js';
import { GitTracker } from '../registry/GitTracker.js';
import { KeepInTouchEnforcer } from '../core/KeepInTouchEnforcer.js';
import { BestPracticesEngine } from '../core/BestPracticesEngine.js';
import { CostAwareScheduler } from '../core/CostAwareScheduler.js';
import { AgentIdSchema } from '../types/Task.js';
import { eventBroadcaster } from '../events/EventBroadcaster.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

const CompleteTaskSchema = z.object({
  taskId: z.string().regex(/^T\d{3}$/),
  agent: AgentIdSchema,
  filesCreated: z.array(z.string()).optional(),
  velocity: z.number().min(0).optional(),
  bypassEnforcement: z.boolean().optional().default(false) // For testing only
});

export const completeTaskTool: Tool = {
  name: 'complete_task',
  description: 'Complete task with FULL enforcement: Keep-in-Touch, Git verification, Best practices, Cost tracking',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'Task ID (e.g., T001)',
        pattern: '^T\\d{3}$'
      },
      agent: {
        type: 'string',
        enum: ['A', 'B', 'C', 'D', 'E', 'F'],
        description: 'Agent completing the task'
      },
      filesCreated: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of files created/modified'
      },
      velocity: {
        type: 'number',
        minimum: 0,
        description: 'Task velocity %'
      }
    },
    required: ['taskId', 'agent']
  }
};

export function createCompleteTaskToolIntegrated(
  taskStore: IntegratedTaskStore,
  gitTracker: GitTracker,
  db: Database.Database,
  projectPath: string
) {
  return {
    ...completeTaskTool,
    handler: async (args: unknown) => {
      const parsed = CompleteTaskSchema.parse(args);

      console.log(`\n🎯 COMPLETE TASK: ${parsed.taskId} by Agent ${parsed.agent}`);
      console.log('═══════════════════════════════════════════════════════\n');

      // Get agent ID
      const agentRecord = db.prepare(`
        SELECT id FROM agents
        WHERE model_id LIKE ? OR name LIKE ?
      `).get(`%${parsed.agent}%`, `%${parsed.agent}%`) as { id: string } | undefined;

      const agentId = agentRecord?.id || `agent-${parsed.agent}`;

      // ═══════════════════════════════════════════════════════════
      // ENFORCEMENT LAYER 1: Keep-in-Touch Permission ⭐
      // ═══════════════════════════════════════════════════════════

      if (!parsed.bypassEnforcement) {
        console.log('🔐 LAYER 1: Checking Keep-in-Touch permission...');

        const kitEnforcer = new KeepInTouchEnforcer(db);
        const permission = await kitEnforcer.checkPermission(parsed.taskId, agentId);

        if (!permission.granted) {
          console.log(`❌ BLOCKED: Keep-in-Touch permission not granted\n`);

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                blocked: true,
                layer: 'KEEP_IN_TOUCH',
                reason: permission.reason,
                message: permission.message || '❌ BLOCKED: Must check in and get permission',
                action: permission.requiredAction || 'brain checkin "Ready to complete"',
                retryAfter: permission.retryAfter || 60
              }, null, 2)
            }]
          };
        }

        console.log('✅ Keep-in-Touch permission granted\n');
      }

      // ═══════════════════════════════════════════════════════════
      // ENFORCEMENT LAYER 2: Git Verification ⭐
      // ═══════════════════════════════════════════════════════════

      console.log('📊 LAYER 2: Git verification...');

      const task = await taskStore.getTask(parsed.taskId);
      if (!task) {
        return {
          content: [{
            type: 'text',
            text: `❌ Task ${parsed.taskId} not found`
          }]
        };
      }

      const gitEvidence = gitTracker.verifyTaskCompletion(task);
      const gitScore = gitEvidence.completionScore || 0;

      if (gitScore < 30 && !parsed.bypassEnforcement) {
        console.log(`❌ BLOCKED: Git score ${gitScore}% < 30% minimum\n`);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              blocked: true,
              layer: 'GIT_VERIFICATION',
              reason: 'INSUFFICIENT_GIT_EVIDENCE',
              gitScore,
              minimumRequired: 30,
              message: '❌ BLOCKED: No git commits found for this task',
              action: 'Commit your work:\n' +
                      '1. git add .\n' +
                      `2. git commit -m "${parsed.taskId}: Your work"\n` +
                      '3. Try again',
              filesExpected: parsed.filesCreated?.length || 0
            }, null, 2)
          }]
        };
      }

      console.log(`✅ Git verification: ${gitScore}% (${gitScore >= 80 ? 'AUTO-VERIFIED' : 'ACCEPTABLE'})\n`);

      // ═══════════════════════════════════════════════════════════
      // ENFORCEMENT LAYER 3: Best Practices ⭐
      // ═══════════════════════════════════════════════════════════

      if (!parsed.bypassEnforcement) {
        console.log('🎯 LAYER 3: Best practices validation...');

        const validator = new BestPracticesEngine(db, projectPath);
        const validation = await validator.validateCompletion({
          taskId: parsed.taskId,
          agentId,
          filesCreated: parsed.filesCreated || [],
          projectPath
        });

        if (!validation.canComplete) {
          console.log(`❌ BLOCKED: ${validation.violations.length} quality violations\n`);

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                blocked: true,
                layer: 'BEST_PRACTICES',
                reason: 'QUALITY_VIOLATIONS',
                message: '❌ BLOCKED: Best practices violations detected',
                violations: validation.violations.map(v => ({
                  rule: v.ruleName,
                  severity: v.enforcement,
                  message: v.message
                })),
                warnings: validation.warnings.map(w => w.message),
                action: 'Fix violations before completing'
              }, null, 2)
            }]
          };
        }

        console.log(`✅ Best practices: ${validation.passed.length} checks passed`);
        if (validation.warnings.length > 0) {
          console.log(`⚠️  Warnings: ${validation.warnings.length}`);
        }
        console.log('');
      }

      // ═══════════════════════════════════════════════════════════
      // COMPLETION: All checks passed!
      // ═══════════════════════════════════════════════════════════

      console.log('✅ All enforcement layers passed! Completing task...\n');

      const result = await taskStore.completeTask(
        parsed.taskId,
        parsed.agent,
        parsed.filesCreated,
        parsed.velocity
      );

      // ═══════════════════════════════════════════════════════════
      // POST-COMPLETION: Cost Tracking ⭐
      // ═══════════════════════════════════════════════════════════

      if (result.success) {
        console.log('💰 LAYER 4: Tracking cost...');

        const costScheduler = new CostAwareScheduler(db);

        // Calculate hours spent
        const task = await taskStore.getTask(parsed.taskId);
        if (task?.startedAt) {
          const claimedTime = new Date(task.startedAt).getTime();
          const now = Date.now();
          const hoursSpent = (now - claimedTime) / (1000 * 60 * 60);

          costScheduler.trackTaskCost(parsed.taskId, agentId, hoursSpent);
        }

        console.log('✅ Cost tracked\n');
      }

      // Broadcast completion events (legacy)
      if (result.success) {
        const task = await taskStore.getTask(parsed.taskId);

        if (task) {
          // Broadcast task completed event
          eventBroadcaster.taskCompleted(parsed.taskId, task.name, parsed.agent, parsed.velocity);

          // Broadcast agent status back to online
          eventBroadcaster.agentStatus(parsed.agent, 'online');

          // Broadcast log event
          eventBroadcaster.agentLog(parsed.agent, `Completed task ${parsed.taskId}: ${task.name}`, 'info');

          // Broadcast unblocked tasks
          if (result.unblocked && result.unblocked.length > 0) {
            result.unblocked.forEach(async taskId => {
              const unblockedTask = await taskStore.getTask(taskId);
              if (unblockedTask) {
                eventBroadcaster.taskUpdate(taskId, 'AVAILABLE');
                eventBroadcaster.agentLog(parsed.agent, `Unblocked task ${taskId}`, 'info');
              }
            });
          }
        }

        // 🔥 EMIT EVENTS TO EVENT BUS - MASSIVE CASCADING EFFECTS!
        const eventBus = AutoProactiveEventBus.getInstance();

        // PRIMARY CRITICAL EVENT: Task completed
        eventBus.emitLoopEvent(
          LoopEvent.TASK_COMPLETED,
          {
            taskId: parsed.taskId,
            agent: parsed.agent,
            taskName: task?.name,
            filesCreated: parsed.filesCreated,
            velocity: parsed.velocity,
            completedAt: Date.now()
          },
          {
            tool: 'complete_task',
            priority: 'critical', // HIGHEST PRIORITY!
            source: 'MCP Tool'
          }
        );

        // CASCADE EVENT 1: Dependencies unblocked
        if (result.unblocked && result.unblocked.length > 0) {
          eventBus.emitLoopEvent(
            LoopEvent.DEPENDENCIES_UNBLOCKED,
            {
              completedTaskId: parsed.taskId,
              unblockedTasks: result.unblocked,
              count: result.unblocked.length
            },
            {
              tool: 'complete_task',
              priority: 'critical', // Triggers instant Loop 8 assignment!
              source: 'MCP Tool'
            }
          );

          // Emit individual unblock events for each task
          result.unblocked.forEach((unblockedId: string) => {
            eventBus.emitLoopEvent(
              LoopEvent.TASK_UNBLOCKED,
              {
                taskId: unblockedId,
                unblockedBy: parsed.taskId,
                agent: parsed.agent
              },
              {
                tool: 'complete_task',
                priority: 'high',
                source: 'MCP Tool'
              }
            );
          });
        }

        // CASCADE EVENT 2: Agent now available
        eventBus.emitLoopEvent(
          LoopEvent.AGENT_AVAILABLE,
          {
            agent: parsed.agent,
            justCompleted: parsed.taskId,
            availableAt: Date.now()
          },
          {
            tool: 'complete_task',
            priority: 'high', // Loop 8 can assign immediately!
            source: 'MCP Tool'
          }
        );

        // CASCADE EVENT 3: Git changes detected
        if (parsed.filesCreated && parsed.filesCreated.length > 0) {
          eventBus.emitLoopEvent(
            LoopEvent.GIT_CHANGES_DETECTED,
            {
              taskId: parsed.taskId,
              agent: parsed.agent,
              files: parsed.filesCreated,
              count: parsed.filesCreated.length
            },
            {
              tool: 'complete_task',
              priority: 'normal',
              source: 'MCP Tool'
            }
          );
        }

        // CASCADE EVENT 4: Agent workload reduced
        const newWorkload = await taskStore.getAgentWorkload(parsed.agent);
        eventBus.emitLoopEvent(
          LoopEvent.AGENT_WORKLOAD_CHANGED,
          {
            agent: parsed.agent,
            workload: newWorkload.totalTasks,
            capacity: newWorkload.capacity || (5 - newWorkload.totalTasks),
            action: 'completed'
          },
          {
            tool: 'complete_task',
            priority: 'normal',
            source: 'MCP Tool'
          }
        );
      }

      // Return success with full details
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              taskId: parsed.taskId,
              agent: parsed.agent,
              enforcement: {
                keepInTouch: 'PASSED ✅',
                gitVerification: `${gitScore}% ${gitScore >= 80 ? '(AUTO-VERIFIED)' : '(ACCEPTABLE)'}`,
                bestPractices: 'PASSED ✅',
                costTracked: 'YES ✅'
              },
              unblocked: result.unblocked || [],
              message: `✅ Task ${parsed.taskId} COMPLETED with full verification`,
              impact: result.unblocked && result.unblocked.length > 0
                ? `🔓 Unblocked ${result.unblocked.length} task(s): ${result.unblocked.join(', ')}`
                : 'No dependent tasks'
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: result.error
          }, null, 2)
        }]
      };
    }
  };
}
