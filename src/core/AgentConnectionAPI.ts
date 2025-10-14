/**
 * AGENT CONNECTION HTTP API
 * ==========================
 *
 * REST endpoint so ANY agent can connect (not just MCP-enabled ones!)
 *
 * Endpoint: POST http://34.41.115.199:3000/api/agents/connect
 *
 * Works for:
 * - GLM-4.6 on Z.AI
 * - ChatGPT-5
 * - Gemini
 * - ANY agent that can make HTTP calls!
 */

import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import { execSync } from 'child_process';
import os from 'os';

export function createAgentConnectionAPI(db: Database.Database) {
  const router = express.Router();

  /**
   * POST /api/agents/connect
   *
   * SEAMLESS CONNECTION - Auto-detects everything!
   */
  router.post('/connect', async (req: Request, res: Response) => {
    try {
      // Get minimal info from request (or auto-detect)
      const {
        agent,
        model,
        project,
        contextWindow,
        workingDirectory,
        capabilities,
        hardware
      } = req.body || {};

      // AUTO-DETECT MISSING FIELDS
      const detected = {
        agent: agent || detectAgentFromModel(model),
        model: model || 'unknown',
        contextWindow: contextWindow || detectContextFromModel(model),
        project: project || 'unknown-project',
        workingDirectory: workingDirectory || 'unknown',
        capabilities: capabilities || getDefaultCapabilities(agent || 'D'),
        hardware: hardware || {}
      };

      console.log(`🔗 Agent connecting: ${detected.agent} (${detected.model}) on ${detected.project}`);

      // CREATE SESSION
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      db.prepare(`
        INSERT INTO agent_sessions (
          id, agent_letter, agent_model, project_id,
          connected_at, last_heartbeat, status,
          tasks_claimed, tasks_completed, total_queries
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sessionId,
        detected.agent,
        detected.model,
        detected.project,
        new Date().toISOString(),
        new Date().toISOString(),
        'ACTIVE',
        0,
        0,
        0
      );

      // GATHER PROJECT INTELLIGENCE
      const projectData = db.prepare(`
        SELECT * FROM projects WHERE name = ? OR id = ?
      `).get(detected.project, detected.project) as any;

      // Get task stats
      const taskStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgress
        FROM tasks
        WHERE project_id = ?
      `).get(detected.project) as any;

      const completion = taskStats?.total > 0
        ? Math.round(((taskStats.completed || 0) / taskStats.total) * 100)
        : 0;

      // Get agent's tasks
      const myTasks = db.prepare(`
        SELECT id, title, status, priority, description
        FROM tasks
        WHERE agent = ?
        AND project_id = ?
        AND status IN ('pending', 'in-progress')
        ORDER BY priority ASC
        LIMIT 5
      `).all(detected.agent, detected.project);

      // Get team
      const team = db.prepare(`
        SELECT agent_letter, agent_model, tasks_completed
        FROM agent_sessions
        WHERE project_id = ? AND status = 'ACTIVE'
      `).all(detected.project);

      // AUTONOMOUS INTELLIGENT RESPONSE
      const response = {
        success: true,
        sessionId: sessionId,
        status: 'CONNECTED',

        agentIdentity: {
          letter: detected.agent,
          model: detected.model,
          contextWindow: detected.contextWindow,
          role: getRoleDescription(detected.agent),
          capabilities: detected.capabilities
        },

        environment: {
          project: detected.project,
          projectType: projectData?.type || 'unknown',
          projectNumber: projectData?.project_number || 999,
          workingDirectory: detected.workingDirectory
        },

        projectOverview: {
          name: detected.project,
          vision: projectData?.vision || 'Vision pending',
          completion: {
            percentage: completion,
            totalTasks: taskStats?.total || 0,
            completed: taskStats?.completed || 0,
            available: taskStats?.available || 0,
            inProgress: taskStats?.inProgress || 0
          },
          teamStatus: {
            activeAgents: team.length,
            agents: team
          }
        },

        yourTasks: myTasks,

        guidance: generateGuidance(detected.agent, myTasks.length, completion),

        contextProvided: {
          specsDirectory: `${detected.project}/02_SPECBASES/`,
          contextFiles: `${detected.project}/03_CONTEXT_FILES/`,
          architecture: 'See documents 0010-0015 in SPECBASES'
        },

        nextSteps: myTasks.length > 0
          ? `Start with task: ${(myTasks[0] as any).id}`
          : 'Stand by - Central-MCP will auto-assign tasks when available'
      };

      res.json(response);

    } catch (error: any) {
      console.error('❌ Agent connection error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

// Helper functions
function detectAgentFromModel(model?: string): string {
  if (!model) return 'D';

  const m = model.toLowerCase();
  if (m.includes('glm')) return 'A';
  if (m.includes('sonnet')) return 'B';
  if (m.includes('gemini')) return 'E';
  if (m.includes('gpt')) return 'F';

  return 'D';
}

function detectContextFromModel(model?: string): number {
  if (!model) return 200000;

  const m = model.toLowerCase();
  if (m.includes('sonnet-4')) return 1000000;
  if (m.includes('gemini-2.5')) return 1000000;
  if (m.includes('glm-plus')) return 1000000;

  return 200000;
}

function getDefaultCapabilities(agent: string): string[] {
  const caps: Record<string, string[]> = {
    'A': ['ui', 'frontend', 'react'],
    'B': ['design', 'architecture', 'specbase'],
    'C': ['backend', 'api', 'database'],
    'D': ['integration', 'coordination'],
    'E': ['supervision', 'analysis'],
    'F': ['strategy', 'planning']
  };
  return caps[agent] || ['general'];
}

function getRoleDescription(agent: string): string {
  const roles: Record<string, string> = {
    'A': 'UI Velocity Specialist - Frontend & React expert',
    'B': 'Design System Specialist - Architecture & coherence',
    'C': 'Backend Services Specialist - API & database',
    'D': 'Integration Specialist - Coordination',
    'E': 'Ground Supervisor - Knowledge management',
    'F': 'Strategic Supervisor - Planning & validation'
  };
  return roles[agent] || 'General Agent';
}

function generateGuidance(agent: string, taskCount: number, completion: number): string {
  if (taskCount === 0) {
    return `Welcome Agent ${agent}! No tasks assigned yet. Central-MCP will auto-assign when work becomes available. You're part of a ${completion}% complete project. Stand by for coordination.`;
  }

  return `Welcome Agent ${agent}! You have ${taskCount} task${taskCount > 1 ? 's' : ''} assigned. Project is ${completion}% complete. You are part of a coordinated team building something bigger than any single agent can comprehend. Your specific outputs will integrate seamlessly. Central-MCP is guiding you. Execute with precision.`;
}
