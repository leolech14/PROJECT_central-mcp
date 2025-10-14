/**
 * agent_disconnect - Close agent session
 */

import { z } from 'zod';
import { SessionManager } from '../../intelligence/SessionManager.js';
import Database from 'better-sqlite3';

const AgentDisconnectArgsSchema = z.object({
  sessionId: z.string()
});

export const agentDisconnectTool = {
  name: 'agent_disconnect',
  description: 'Close agent session and update final statistics',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: {
        type: 'string',
        description: 'Session ID to close'
      }
    },
    required: ['sessionId']
  }
};

export async function handleAgentDisconnect(args: unknown, db: Database.Database) {
  const parsed = AgentDisconnectArgsSchema.parse(args);

  const sessionManager = new SessionManager(db);

  // Close session first (this calculates duration)
  sessionManager.closeSession(parsed.sessionId);

  // Then fetch updated session
  const session = sessionManager.getSession(parsed.sessionId);

  if (!session) {
    throw new Error(`Session ${parsed.sessionId} not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'DISCONNECTED',
        sessionId: parsed.sessionId,
        agent: session.agent_letter,
        sessionDuration: session.session_duration_minutes,
        tasksClaimed: session.tasks_claimed,
        tasksCompleted: session.tasks_completed,
        timestamp: new Date().toISOString()
      }, null, 2)
    }]
  };
}
