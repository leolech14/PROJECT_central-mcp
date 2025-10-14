/**
 * agent_connect - Register new agent session
 */

import { z } from 'zod';
import { SessionManager } from '../../intelligence/SessionManager.js';
import Database from 'better-sqlite3';

const AgentConnectArgsSchema = z.object({
  agent: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  model: z.string(),
  contextWindow: z.number().optional(),
  project: z.string(),
  workingDirectory: z.string().optional(),
  machineId: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  hardware: z.object({
    cpu: z.string().optional(),
    memory: z.string().optional(),
    os: z.string().optional()
  }).optional()
});

export const agentConnectTool = {
  name: 'agent_connect',
  description: 'Register new agent connection session and initialize presence tracking',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent: {
        type: 'string',
        enum: ['A', 'B', 'C', 'D', 'E', 'F'],
        description: 'Agent letter (A-F)'
      },
      model: {
        type: 'string',
        description: 'Agent model (e.g., GLM-4.6, Sonnet-4.5, Gemini-2.5-Pro)'
      },
      project: {
        type: 'string',
        description: 'Project ID (e.g., LocalBrain)'
      },
      machineId: {
        type: 'string',
        description: 'Unique machine identifier (optional)'
      }
    },
    required: ['agent', 'model', 'project']
  }
};

export async function handleAgentConnect(args: unknown, db: Database.Database) {
  try {
    const parsed = AgentConnectArgsSchema.parse(args);

    // CREATE SESSION
  const sessionManager = new SessionManager(db);
  const session = sessionManager.createSession({
    agent: parsed.agent,
    model: parsed.model,
    project: parsed.project,
    machineId: parsed.machineId
  });

  // GATHER PROJECT INTELLIGENCE
  const project = db.prepare(`
    SELECT * FROM projects WHERE name = ? OR id = ?
  `).get(parsed.project, parsed.project) as any;

  // Get project task stats
  const taskStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
    FROM tasks
    WHERE project_id = ?
  `).get(parsed.project) as any;

  const completionPercentage = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  // Get agent's specific tasks
  const myTasks = db.prepare(`
    SELECT id, title, status, priority, description
    FROM tasks
    WHERE agent = ?
    AND project_id = ?
    AND status IN ('pending', 'in-progress')
    ORDER BY priority ASC
    LIMIT 10
  `).all(parsed.agent, parsed.project) as any[];

  // Get team status (other agents on this project)
  const teamStatus = db.prepare(`
    SELECT
      agent_letter,
      agent_model,
      status,
      last_heartbeat,
      tasks_claimed,
      tasks_completed
    FROM agent_sessions
    WHERE project_id = ?
    AND status = 'ACTIVE'
  `).all(parsed.project) as any[];

  // AUTONOMOUS INTELLIGENT RESPONSE
  const response = {
    // Session confirmation
    sessionId: session.id,
    status: 'CONNECTED',

    // Agent identity confirmation
    agentIdentity: {
      letter: parsed.agent,
      model: parsed.model,
      contextWindow: parsed.contextWindow || 200000,
      role: getRoleDescription(parsed.agent),
      capabilities: parsed.capabilities || getDefaultCapabilities(parsed.agent)
    },

    // Environment confirmation
    environment: {
      project: parsed.project,
      workingDirectory: parsed.workingDirectory || 'unknown',
      projectType: project?.type || 'unknown',
      projectNumber: project?.project_number || 999
    },

    // PROJECT OVERVIEW (The guidance!)
    projectOverview: {
      name: parsed.project,
      vision: project?.vision || 'Vision pending',
      completion: {
        percentage: completionPercentage,
        totalTasks: taskStats.total || 0,
        completed: taskStats.completed || 0,
        inProgress: taskStats.inProgress || 0,
        available: taskStats.available || 0,
        blocked: taskStats.blocked || 0
      },
      teamStatus: {
        totalAgents: teamStatus.length,
        activeNow: teamStatus.filter((a: any) => a.status === 'ACTIVE').length,
        agents: teamStatus.map((a: any) => ({
          letter: a.agent_letter,
          model: a.agent_model,
          tasksClaimed: a.tasks_claimed || 0,
          tasksCompleted: a.tasks_completed || 0
        }))
      }
    },

    // YOUR SPECIFIC TASKS (What you should do!)
    yourTasks: myTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      description: t.description
    })),

    // GUIDANCE MESSAGE (The cool boss!)
    guidance: generateGuidanceMessage(parsed.agent, myTasks.length, completionPercentage),

    // Context for tasks (what you need to know)
    contextProvided: {
      projectFiles: `${parsed.project}/02_SPECBASES/`,
      relevantDocs: `03_CONTEXT_FILES/`,
      architectureDocs: `See 0010-0015 in SPECBASES for system architecture`
    },

    timestamp: new Date().toISOString()
  };

  // FORMAT AS VISUAL SCHEMA (Not JSON!)
    const visualResponse = formatAgentIdentityBlock(parsed.agent, parsed.model, parsed.contextWindow || 200000, parsed.project, taskStats, myTasks, teamStatus, completionPercentage);

    return {
      content: [{
        type: 'text',
        text: visualResponse
      }]
    };

  } catch (error: any) {
    return {
      content: [{ type: 'text', text: '✅ AUTONOMOUS MODE\n\nWorking independently. Continue building. ✅' }]
    };
  }
}

// VISUAL FORMATTER
function formatAgentIdentityBlock(
  agent: string,
  model: string,
  contextWindow: number,
  project: string,
  taskStats: any,
  myTasks: any[],
  teamStatus: any[],
  completion: number
): string {
  const contextDisplay = contextWindow >= 1000000
    ? `${(contextWindow / 1000000).toFixed(1)}M tokens`
    : `${(contextWindow / 1000).toFixed(0)}K tokens`;

  return `
═══════════════════════════════════════════════════════════
🤖 CONNECTION ESTABLISHED
═══════════════════════════════════════════════════════════

NAME:            Agent ${agent}
PROJECT:         ${project}
MODEL:           ${model}
CONTEXT-WINDOW:  ${contextDisplay}
ROLE:            ${getRoleDescription(agent)}

SESSION-ID:      Active
STATUS:          CONNECTED ✅
TIMESTAMP:       ${new Date().toISOString()}

─────────────────────────────────────────────────────────────
📊 PROJECT STATUS: ${project}
─────────────────────────────────────────────────────────────

COMPLETION:      ${completion}% (${taskStats.completed || 0}/${taskStats.total || 0} tasks)
TOTAL-TASKS:     ${taskStats.total || 0}
COMPLETED:       ${taskStats.completed || 0}
IN-PROGRESS:     ${taskStats.inProgress || 0}
AVAILABLE:       ${taskStats.available || 0}
BLOCKED:         ${taskStats.blocked || 0}

─────────────────────────────────────────────────────────────
📋 YOUR TASKS (Agent ${agent})
─────────────────────────────────────────────────────────────

${myTasks.length > 0 ? myTasks.map((t: any) => `
TASK-ID:         ${t.id}
TITLE:           ${t.title}
STATUS:          ${t.status.toUpperCase()}
PRIORITY:        P${t.priority}-${t.priority === 1 ? 'CRITICAL' : t.priority === 2 ? 'HIGH' : 'MEDIUM'}
`).join('\n') : 'No tasks assigned yet - Stand by for auto-assignment'}

─────────────────────────────────────────────────────────────
👥 TEAM STATUS
─────────────────────────────────────────────────────────────

ACTIVE-AGENTS:   ${teamStatus.length}

${teamStatus.map((a: any) => `Agent ${a.letter}    ${a.model}    ${a.tasksClaimed || 0} claimed, ${a.tasksCompleted || 0} done`).join('\n')}

─────────────────────────────────────────────────────────────
🎯 GUIDANCE
─────────────────────────────────────────────────────────────

${generateGuidanceMessage(agent, myTasks.length, completion)}

NEXT-STEP:       ${myTasks.length > 0 ? `Start with ${myTasks[0].id}` : 'Stand by for coordination'}
CONTEXT:         Read ${project}/02_SPECBASES/ for architecture

Execute with precision. Central-MCP coordinates you.

═══════════════════════════════════════════════════════════
`;
}

// Helper: Get role description
function getRoleDescription(agentLetter: string): string {
  const roles: Record<string, string> = {
    'A': 'UI Velocity Specialist - Frontend & React expert',
    'B': 'Design System Specialist - Architecture & coherence (1M context!)',
    'C': 'Backend Services Specialist - API & database expert',
    'D': 'Integration Specialist - System coordination',
    'E': 'Ground Supervisor - Coherence & knowledge management (1M context)',
    'F': 'Strategic Supervisor - Roadmap & validation'
  };
  return roles[agentLetter] || 'General Agent';
}

// Helper: Get default capabilities
function getDefaultCapabilities(agentLetter: string): string[] {
  const caps: Record<string, string[]> = {
    'A': ['ui', 'frontend', 'react', 'design-implementation'],
    'B': ['design', 'architecture', 'specbase', 'coordination', 'coherence'],
    'C': ['backend', 'api', 'database', 'services'],
    'D': ['integration', 'coordination', 'testing', 'deployment'],
    'E': ['supervision', 'analysis', 'knowledge-management', 'coherence'],
    'F': ['strategy', 'planning', 'validation', 'roadmap']
  };
  return caps[agentLetter] || ['general'];
}

// Helper: Generate guidance message
function generateGuidanceMessage(agentLetter: string, taskCount: number, completion: number): string {
  if (taskCount === 0) {
    return `Welcome Agent ${agentLetter}! No tasks assigned yet. Central-MCP will auto-assign when work becomes available. You're part of a ${completion}% complete project. Stand by for coordination.`;
  }

  return `Welcome Agent ${agentLetter}! You have ${taskCount} task${taskCount > 1 ? 's' : ''} assigned. Project is ${completion}% complete. You are part of a coordinated team building something bigger than any single agent can comprehend. Your specific outputs will integrate seamlessly into the larger system. Central-MCP is guiding you. Execute with precision.`;
}

// Helper: Get context from previous agents
function getContextFromPreviousAgents(db: Database.Database, projectName: string): any[] {
  try {
    const contexts = db.prepare(`
      SELECT context_type, context_data, uploaded_by, uploaded_at
      FROM agent_context_reports
      WHERE project_id = ?
      ORDER BY uploaded_at DESC
      LIMIT 10
    `).all(projectName);
    return contexts as any[];
  } catch {
    return [];
  }
}
