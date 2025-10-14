/**
 * agent_checkin - Check in with Keep-in-Touch system
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { KeepInTouchEnforcer } from '../../core/KeepInTouchEnforcer.js';

const AgentCheckInArgsSchema = z.object({
  sessionId: z.string(),
  agentId: z.string(),
  currentActivity: z.string(),
  progress: z.number().min(0).max(100).optional().default(0),
  blockers: z.array(z.string()).optional()
});

export const agentCheckInTool = {
  name: 'agent_checkin',
  description: 'Check in with Keep-in-Touch system (required every 30 minutes)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: {
        type: 'string',
        description: 'Keep-in-Touch session ID'
      },
      agentId: {
        type: 'string',
        description: 'Agent ID'
      },
      currentActivity: {
        type: 'string',
        description: 'What agent is currently doing'
      },
      progress: {
        type: 'number',
        description: 'Task progress percentage (0-100)',
        minimum: 0,
        maximum: 100
      },
      blockers: {
        type: 'array',
        description: 'Optional list of blockers',
        items: { type: 'string' }
      }
    },
    required: ['sessionId', 'agentId', 'currentActivity']
  }
};

export async function handleAgentCheckIn(args: unknown, db: Database.Database) {
  const parsed = AgentCheckInArgsSchema.parse(args);

  const enforcer = new KeepInTouchEnforcer(db);

  const success = enforcer.checkIn(parsed.sessionId, parsed.agentId, {
    currentActivity: parsed.currentActivity,
    progress: parsed.progress,
    blockers: parsed.blockers
  });

  const session = enforcer.getSession(parsed.sessionId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'CHECK_IN_RECEIVED',
        sessionId: parsed.sessionId,
        timestamp: new Date().toISOString(),
        nextCheckInDue: new Date(Date.now() + session!.checkInInterval * 1000).toISOString(),
        missedCheckIns: session!.missedCheckIns,
        message: '✅ Check-in successful. Keep up the good work!'
      }, null, 2)
    }]
  };
}
