/**
 * agent_heartbeat - Update agent presence (every 30s)
 */

import { z } from 'zod';
import { SessionManager } from '../../intelligence/SessionManager.js';
import Database from 'better-sqlite3';

const AgentHeartbeatArgsSchema = z.object({
  sessionId: z.string(),
  currentActivity: z.string().optional()
});

export const agentHeartbeatTool = {
  name: 'agent_heartbeat',
  description: 'Send heartbeat to maintain agent presence and session status',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: {
        type: 'string',
        description: 'Session ID returned from agent_connect'
      },
      currentActivity: {
        type: 'string',
        description: 'Current activity status (e.g., IDLE, WORKING, REVIEWING)'
      }
    },
    required: ['sessionId']
  }
};

export async function handleAgentHeartbeat(args: unknown, db: Database.Database) {
  const parsed = AgentHeartbeatArgsSchema.parse(args);

  const sessionManager = new SessionManager(db);
  sessionManager.updateHeartbeat(parsed.sessionId, parsed.currentActivity);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'HEARTBEAT_RECEIVED',
        sessionId: parsed.sessionId,
        timestamp: new Date().toISOString()
      }, null, 2)
    }]
  };
}
