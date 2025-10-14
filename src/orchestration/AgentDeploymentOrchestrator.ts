/**
 * AGENT DEPLOYMENT & ORCHESTRATION SYSTEM
 * ========================================
 *
 * THE MISSING ORCHESTRATION LAYER - How Central-MCP ACTUALLY deploys
 * agents to the VM and coordinates multi-agent teams!
 *
 * CAPABILITIES:
 * 1. SSH into VM (GCP us-central1-a)
 * 2. Create isolated agent environments
 * 3. Clone project repositories
 * 4. Assign tasks to specific agents
 * 5. Monitor agent progress via terminal
 * 6. Coordinate multi-agent teams
 * 7. Collect results back to Central-MCP
 * 8. Handle agent communication protocols
 *
 * DEPLOYMENT WORKFLOW:
 * ```
 * User Message → Task Created
 *   ↓
 * Central-MCP analyzes task requirements
 *   ↓
 * Determines optimal agent for task
 *   ↓
 * SSH to VM → Create workspace → Clone repo
 *   ↓
 * Deploy agent with task context
 *   ↓
 * Monitor agent progress (heartbeat, logs)
 *   ↓
 * Agent completes → Collect results → Update database
 *   ↓
 * Trigger next task in pipeline
 * ```
 *
 * This transforms Central-MCP from coordinator → FULL ORCHESTRATOR!
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

export interface VMConfig {
  host: string;                      // VM IP (e.g., 34.41.115.199)
  user: string;                      // SSH user (e.g., 'lech')
  sshKey?: string;                   // SSH key path
  port: number;                      // SSH port (default: 22)
  workspaceRoot: string;             // Where to create agent workspaces
}

export interface AgentDeploymentConfig {
  agentId: string;                   // Agent identity (A, B, C, D, E, F)
  agentName: string;                 // Human-readable name
  modelId: string;                   // Claude model (sonnet-4-5, etc.)
  capabilities: string[];            // [ui, backend, design, etc.]
  projectId: string;                 // Which project to work on
  taskIds: string[];                 // Tasks assigned to this agent
  workspaceId: string;               // Unique workspace identifier
}

export interface AgentWorkspace {
  id: string;
  agentId: string;
  projectId: string;
  vmPath: string;                    // Path on VM
  gitUrl: string;                    // Repository to clone
  branch: string;                    // Git branch
  status: 'creating' | 'active' | 'idle' | 'terminated';
  createdAt: Date;
  lastActivity?: Date;
  processId?: number;                // PID of agent process on VM
}

export interface AgentHeartbeat {
  agentId: string;
  workspaceId: string;
  timestamp: Date;
  status: 'working' | 'idle' | 'blocked' | 'error';
  currentTask?: string;
  progress?: number;
  message?: string;
  logs?: string[];
}

export interface TeamCoordination {
  teamId: string;
  projectId: string;
  agents: string[];                  // Agent IDs in team
  tasks: string[];                   // Tasks assigned to team
  coordinationStrategy: 'parallel' | 'sequential' | 'pipeline';
  status: 'forming' | 'active' | 'completed';
  createdAt: Date;
}

/**
 * Agent Deployment & Orchestration System
 *
 * Deploys agents to VM, manages workspaces, coordinates teams.
 */
export class AgentDeploymentOrchestrator {
  private db: Database.Database;
  private vmConfig: VMConfig;
  private eventBus: AutoProactiveEventBus;
  private activeWorkspaces: Map<string, AgentWorkspace>;
  private agentProcesses: Map<string, ChildProcess>;
  private heartbeatMonitors: Map<string, NodeJS.Timeout>;

  constructor(db: Database.Database, vmConfig: VMConfig) {
    this.db = db;
    this.vmConfig = vmConfig;
    this.eventBus = AutoProactiveEventBus.getInstance();
    this.activeWorkspaces = new Map();
    this.agentProcesses = new Map();
    this.heartbeatMonitors = new Map();

    this.subscribeToEvents();

    logger.info(`🚀 Agent Deployment Orchestrator initialized`);
    logger.info(`   VM: ${vmConfig.host}`);
    logger.info(`   Workspace root: ${vmConfig.workspaceRoot}`);
  }

  /**
   * Subscribe to deployment events
   */
  private subscribeToEvents(): void {
    // Listen for task assignment events
    this.eventBus.onLoopEvent(
      LoopEvent.TASK_ASSIGNED,
      async (payload) => {
        await this.handleTaskAssignment(payload.data);
      },
      { loopName: 'AgentOrchestrator' }
    );

    // Listen for task completion events
    this.eventBus.onLoopEvent(
      LoopEvent.TASK_COMPLETED,
      async (payload) => {
        await this.handleTaskCompletion(payload.data);
      },
      { loopName: 'AgentOrchestrator' }
    );

    logger.info(`🔗 Agent Orchestrator subscribed to events`);
  }

  /**
   * Deploy agent to VM with task assignment
   */
  async deployAgent(config: AgentDeploymentConfig): Promise<string> {
    logger.info(`🚀 Deploying Agent ${config.agentId} to VM...`);

    try {
      // Step 1: Create workspace on VM
      const workspace = await this.createAgentWorkspace(config);

      // Step 2: Clone project repository
      await this.cloneRepository(workspace);

      // Step 3: Install dependencies
      await this.installDependencies(workspace);

      // Step 4: Create agent context file
      await this.createAgentContext(workspace, config);

      // Step 5: Start agent process
      await this.startAgentProcess(workspace, config);

      // Step 6: Start heartbeat monitoring
      this.startHeartbeatMonitoring(workspace);

      logger.info(`✅ Agent ${config.agentId} deployed successfully`);
      logger.info(`   Workspace: ${workspace.vmPath}`);

      // Emit deployment event
      this.eventBus.emitLoopEvent(
        LoopEvent.AGENT_SESSION_STARTED,
        {
          agentId: config.agentId,
          workspaceId: workspace.id,
          projectId: config.projectId,
          tasks: config.taskIds
        },
        {
          priority: 'high',
          source: 'AgentOrchestrator'
        }
      );

      return workspace.id;

    } catch (err: any) {
      logger.error(`❌ Agent deployment failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Create agent workspace on VM
   */
  private async createAgentWorkspace(config: AgentDeploymentConfig): Promise<AgentWorkspace> {
    const workspaceId = randomUUID();
    const vmPath = join(
      this.vmConfig.workspaceRoot,
      `agent-${config.agentId}-${workspaceId.substring(0, 8)}`
    );

    logger.info(`   📁 Creating workspace: ${vmPath}`);

    // Create directory on VM
    const createCmd = this.sshCommand(`mkdir -p ${vmPath}`);
    execSync(createCmd, { encoding: 'utf-8' });

    // Get project Git URL
    const project = this.db.prepare(`
      SELECT git_remote, path FROM projects WHERE id = ?
    `).get(config.projectId) as any;

    if (!project) {
      throw new Error(`Project ${config.projectId} not found`);
    }

    const workspace: AgentWorkspace = {
      id: workspaceId,
      agentId: config.agentId,
      projectId: config.projectId,
      vmPath,
      gitUrl: project.git_remote || '',
      branch: 'main',
      status: 'creating',
      createdAt: new Date()
    };

    this.activeWorkspaces.set(workspaceId, workspace);

    return workspace;
  }

  /**
   * Clone repository to workspace
   */
  private async cloneRepository(workspace: AgentWorkspace): Promise<void> {
    logger.info(`   📦 Cloning repository: ${workspace.gitUrl}`);

    if (!workspace.gitUrl) {
      logger.warn(`   ⚠️  No Git URL for project, skipping clone`);
      return;
    }

    const cloneCmd = this.sshCommand(
      `cd ${workspace.vmPath} && git clone ${workspace.gitUrl} project`
    );

    try {
      execSync(cloneCmd, { encoding: 'utf-8', stdio: 'pipe' });
      logger.info(`   ✅ Repository cloned`);
    } catch (err: any) {
      logger.error(`   ❌ Clone failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Install project dependencies
   */
  private async installDependencies(workspace: AgentWorkspace): Promise<void> {
    logger.info(`   📦 Installing dependencies...`);

    // Check if package.json exists
    const checkCmd = this.sshCommand(
      `test -f ${workspace.vmPath}/project/package.json && echo "exists" || echo "missing"`
    );

    try {
      const result = execSync(checkCmd, { encoding: 'utf-8' }).trim();

      if (result === 'exists') {
        const installCmd = this.sshCommand(
          `cd ${workspace.vmPath}/project && npm install`
        );

        execSync(installCmd, { encoding: 'utf-8', stdio: 'pipe' });
        logger.info(`   ✅ Dependencies installed`);
      } else {
        logger.info(`   ℹ️  No package.json found, skipping install`);
      }
    } catch (err: any) {
      logger.warn(`   ⚠️  Dependency install failed: ${err.message}`);
      // Don't throw - not all projects need npm install
    }
  }

  /**
   * Create agent context file (agent orientation)
   */
  private async createAgentContext(
    workspace: AgentWorkspace,
    config: AgentDeploymentConfig
  ): Promise<void> {
    logger.info(`   📝 Creating agent context file...`);

    // Get project info
    const project = this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(config.projectId) as any;

    // Get assigned tasks
    const tasks = this.db.prepare(`
      SELECT * FROM tasks
      WHERE id IN (${config.taskIds.map(() => '?').join(',')})
    `).all(...config.taskIds) as any[];

    // Generate context markdown
    const contextContent = this.generateAgentContext(config, project, tasks);

    // Write to temporary file
    const tempPath = `/tmp/agent-context-${workspace.id}.md`;
    writeFileSync(tempPath, contextContent, 'utf-8');

    // Copy to VM
    const copyCmd = `scp ${this.sshOptions()} ${tempPath} ${this.vmConfig.user}@${this.vmConfig.host}:${workspace.vmPath}/AGENT_CONTEXT.md`;
    execSync(copyCmd, { encoding: 'utf-8' });

    logger.info(`   ✅ Agent context created`);
  }

  /**
   * Generate agent context markdown
   */
  private generateAgentContext(
    config: AgentDeploymentConfig,
    project: any,
    tasks: any[]
  ): string {
    const lines: string[] = [];

    lines.push(`# Agent ${config.agentId} Context`);
    lines.push('');
    lines.push(`**Deployed by:** Central-MCP Auto-Proactive System`);
    lines.push(`**Workspace ID:** ${config.workspaceId}`);
    lines.push(`**Timestamp:** ${new Date().toISOString()}`);
    lines.push('');

    lines.push(`## Your Identity`);
    lines.push('');
    lines.push(`- **Agent ID:** ${config.agentId}`);
    lines.push(`- **Agent Name:** ${config.agentName}`);
    lines.push(`- **Model:** ${config.modelId}`);
    lines.push(`- **Capabilities:** ${config.capabilities.join(', ')}`);
    lines.push('');

    lines.push(`## Project Context`);
    lines.push('');
    lines.push(`- **Project:** ${project.name}`);
    lines.push(`- **Type:** ${project.type}`);
    lines.push(`- **Path:** ${project.path}`);
    if (project.vision) {
      lines.push(`- **Vision:** ${project.vision}`);
    }
    lines.push('');

    lines.push(`## Your Tasks (${tasks.length})`);
    lines.push('');

    for (const task of tasks) {
      lines.push(`### Task: ${task.id}`);
      lines.push(`**Title:** ${task.title}`);
      lines.push(`**Priority:** ${task.priority}`);
      lines.push(`**Status:** ${task.status}`);
      lines.push('');
      lines.push(`**Description:**`);
      lines.push(task.description || 'No description provided');
      lines.push('');

      if (task.dependencies) {
        const deps = JSON.parse(task.dependencies);
        if (deps.length > 0) {
          lines.push(`**Dependencies:** ${deps.join(', ')}`);
          lines.push('');
        }
      }

      lines.push('---');
      lines.push('');
    }

    lines.push(`## Instructions`);
    lines.push('');
    lines.push(`1. **Connect to Central-MCP:** Use \`connect_to_mcp\` tool for coordination`);
    lines.push(`2. **Claim tasks:** Use \`claimTask\` tool to start working`);
    lines.push(`3. **Report progress:** Use \`updateProgress\` tool regularly`);
    lines.push(`4. **Complete tasks:** Use \`completeTask\` tool when done`);
    lines.push(`5. **Use conventional commits:** Format: \`type(scope): description\``);
    lines.push('');

    lines.push(`## Central-MCP Connection`);
    lines.push('');
    lines.push(`**MCP Server:** http://${this.vmConfig.host}:3000`);
    lines.push(`**Dashboard:** http://${this.vmConfig.host}:8000/dashboard.html`);
    lines.push('');

    lines.push(`## Reporting Back`);
    lines.push('');
    lines.push(`Use MCP tools to report progress. Central-MCP monitors:`);
    lines.push(`- Task progress (via updateProgress)`);
    lines.push(`- Git commits (via Git intelligence)`);
    lines.push(`- Heartbeats (automatic via monitoring)`);
    lines.push('');

    lines.push(`---`);
    lines.push(`🤖 Generated by Central-MCP Agent Deployment Orchestrator`);

    return lines.join('\n');
  }

  /**
   * Start agent process on VM
   */
  private async startAgentProcess(
    workspace: AgentWorkspace,
    config: AgentDeploymentConfig
  ): Promise<void> {
    logger.info(`   🚀 Starting agent process...`);

    // Command to start Claude Code with agent context
    const startCmd = `cd ${workspace.vmPath}/project && claude-code --context ../AGENT_CONTEXT.md`;

    const sshCmd = this.sshCommand(startCmd);

    // Spawn process (non-blocking)
    const process = spawn('bash', ['-c', sshCmd], {
      detached: true,
      stdio: 'ignore'
    });

    process.unref();

    workspace.processId = process.pid;
    workspace.status = 'active';

    this.agentProcesses.set(workspace.id, process);

    logger.info(`   ✅ Agent process started (PID: ${process.pid})`);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(workspace: AgentWorkspace): void {
    logger.info(`   💓 Starting heartbeat monitoring...`);

    const monitor = setInterval(async () => {
      await this.checkAgentHeartbeat(workspace);
    }, 30000); // Every 30 seconds

    this.heartbeatMonitors.set(workspace.id, monitor);
  }

  /**
   * Check agent heartbeat
   */
  private async checkAgentHeartbeat(workspace: AgentWorkspace): Promise<void> {
    try {
      // Query agent_sessions table for latest heartbeat
      const session = this.db.prepare(`
        SELECT * FROM agent_sessions
        WHERE agent_letter = ?
        AND project_id = ?
        AND status = 'ACTIVE'
        ORDER BY last_heartbeat DESC
        LIMIT 1
      `).get(workspace.agentId, workspace.projectId) as any;

      if (session) {
        const lastHeartbeat = new Date(session.last_heartbeat);
        const timeSince = Date.now() - lastHeartbeat.getTime();
        const minutesSince = timeSince / (60 * 1000);

        if (minutesSince > 5) {
          logger.warn(`   ⚠️  Agent ${workspace.agentId} heartbeat stale (${minutesSince.toFixed(1)}min)`);

          // Emit stale agent event
          this.eventBus.emitLoopEvent(
            LoopEvent.AGENT_STALE_DETECTED,
            {
              agentId: workspace.agentId,
              workspaceId: workspace.id,
              minutesSince
            },
            {
              priority: 'high',
              source: 'AgentOrchestrator'
            }
          );
        }

        workspace.lastActivity = lastHeartbeat;
      } else {
        logger.debug(`   No active session found for Agent ${workspace.agentId}`);
      }

    } catch (err: any) {
      logger.error(`   ❌ Heartbeat check failed: ${err.message}`);
    }
  }

  /**
   * Handle task assignment event
   */
  private async handleTaskAssignment(data: any): Promise<void> {
    const { taskId, agent, projectId } = data;

    logger.info(`📋 Task ${taskId} assigned to Agent ${agent}`);

    // Check if agent already has workspace for this project
    const existingWorkspace = Array.from(this.activeWorkspaces.values()).find(
      w => w.agentId === agent && w.projectId === projectId && w.status === 'active'
    );

    if (existingWorkspace) {
      logger.info(`   ℹ️  Agent ${agent} already has workspace, adding task`);
      // TODO: Send task to existing workspace
      return;
    }

    // Deploy new agent workspace
    const agentConfig: AgentDeploymentConfig = {
      agentId: agent,
      agentName: `Agent ${agent}`,
      modelId: 'claude-sonnet-4-5',
      capabilities: this.getAgentCapabilities(agent),
      projectId,
      taskIds: [taskId],
      workspaceId: randomUUID()
    };

    try {
      await this.deployAgent(agentConfig);
    } catch (err: any) {
      logger.error(`❌ Failed to deploy agent: ${err.message}`);
    }
  }

  /**
   * Handle task completion event
   */
  private async handleTaskCompletion(data: any): Promise<void> {
    const { taskId, agent } = data;

    logger.info(`✅ Task ${taskId} completed by Agent ${agent}`);

    // Check if agent has more tasks
    const moreTasks = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE agent = ?
      AND status IN ('pending', 'in-progress')
    `).get(agent) as any;

    if (moreTasks.count === 0) {
      logger.info(`   ℹ️  Agent ${agent} has no more tasks, marking idle`);

      // Mark workspace as idle (but keep alive for new assignments)
      const workspace = Array.from(this.activeWorkspaces.values()).find(
        w => w.agentId === agent && w.status === 'active'
      );

      if (workspace) {
        workspace.status = 'idle';
      }
    }
  }

  /**
   * Coordinate multi-agent team
   */
  async coordinateTeam(team: TeamCoordination): Promise<void> {
    logger.info(`🤝 Coordinating team: ${team.teamId}`);
    logger.info(`   Agents: ${team.agents.join(', ')}`);
    logger.info(`   Strategy: ${team.coordinationStrategy}`);

    // Deploy agents based on coordination strategy
    switch (team.coordinationStrategy) {
      case 'parallel':
        await this.coordinateParallelTeam(team);
        break;

      case 'sequential':
        await this.coordinateSequentialTeam(team);
        break;

      case 'pipeline':
        await this.coordinatePipelineTeam(team);
        break;
    }
  }

  /**
   * Coordinate parallel team (all agents work simultaneously)
   */
  private async coordinateParallelTeam(team: TeamCoordination): Promise<void> {
    logger.info(`   🔀 Parallel coordination: All agents work simultaneously`);

    // Deploy all agents at once
    const deployments: Promise<string>[] = [];

    for (const agentId of team.agents) {
      // Get tasks for this agent
      const tasks = this.db.prepare(`
        SELECT id FROM tasks
        WHERE id IN (${team.tasks.map(() => '?').join(',')})
        AND agent = ?
      `).all(...team.tasks, agentId) as any[];

      if (tasks.length > 0) {
        const config: AgentDeploymentConfig = {
          agentId,
          agentName: `Agent ${agentId}`,
          modelId: 'claude-sonnet-4-5',
          capabilities: this.getAgentCapabilities(agentId),
          projectId: team.projectId,
          taskIds: tasks.map((t: any) => t.id),
          workspaceId: randomUUID()
        };

        deployments.push(this.deployAgent(config));
      }
    }

    await Promise.all(deployments);

    logger.info(`   ✅ All ${team.agents.length} agents deployed`);
  }

  /**
   * Coordinate sequential team (agents work one after another)
   */
  private async coordinateSequentialTeam(team: TeamCoordination): Promise<void> {
    logger.info(`   ➡️  Sequential coordination: Agents work in order`);

    // Deploy first agent only
    // Others will be deployed when previous completes
    const firstAgent = team.agents[0];

    const tasks = this.db.prepare(`
      SELECT id FROM tasks
      WHERE id IN (${team.tasks.map(() => '?').join(',')})
      AND agent = ?
    `).all(...team.tasks, firstAgent) as any[];

    if (tasks.length > 0) {
      const config: AgentDeploymentConfig = {
        agentId: firstAgent,
        agentName: `Agent ${firstAgent}`,
        modelId: 'claude-sonnet-4-5',
        capabilities: this.getAgentCapabilities(firstAgent),
        projectId: team.projectId,
        taskIds: tasks.map((t: any) => t.id),
        workspaceId: randomUUID()
      };

      await this.deployAgent(config);
    }

    logger.info(`   ✅ First agent deployed (${firstAgent})`);
  }

  /**
   * Coordinate pipeline team (output of one feeds into next)
   */
  private async coordinatePipelineTeam(team: TeamCoordination): Promise<void> {
    logger.info(`   🔄 Pipeline coordination: Output feeds into next stage`);

    // Similar to sequential, but with explicit data passing
    await this.coordinateSequentialTeam(team);
  }

  /**
   * Get agent capabilities
   */
  private getAgentCapabilities(agentId: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'A': ['ui', 'frontend', 'react', 'design'],
      'B': ['architecture', 'design-systems', 'planning'],
      'C': ['backend', 'api', 'database', 'infrastructure'],
      'D': ['integration', 'coordination', 'full-stack'],
      'E': ['supervision', 'quality', 'review'],
      'F': ['strategy', 'planning', 'architecture']
    };

    return capabilityMap[agentId] || ['general'];
  }

  /**
   * Generate SSH command
   */
  private sshCommand(command: string): string {
    return `ssh ${this.sshOptions()} ${this.vmConfig.user}@${this.vmConfig.host} "${command}"`;
  }

  /**
   * Get SSH options
   */
  private sshOptions(): string {
    const options: string[] = [];

    if (this.vmConfig.sshKey) {
      options.push(`-i ${this.vmConfig.sshKey}`);
    }

    if (this.vmConfig.port !== 22) {
      options.push(`-p ${this.vmConfig.port}`);
    }

    options.push('-o StrictHostKeyChecking=no');
    options.push('-o UserKnownHostsFile=/dev/null');
    options.push('-o LogLevel=ERROR');

    return options.join(' ');
  }

  /**
   * Terminate agent workspace
   */
  async terminateWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.activeWorkspaces.get(workspaceId);
    if (!workspace) {
      logger.warn(`⚠️  Workspace ${workspaceId} not found`);
      return;
    }

    logger.info(`🛑 Terminating workspace: ${workspaceId}`);

    // Stop heartbeat monitoring
    const monitor = this.heartbeatMonitors.get(workspaceId);
    if (monitor) {
      clearInterval(monitor);
      this.heartbeatMonitors.delete(workspaceId);
    }

    // Kill agent process
    const process = this.agentProcesses.get(workspaceId);
    if (process) {
      process.kill();
      this.agentProcesses.delete(workspaceId);
    }

    // Clean up workspace on VM
    const cleanupCmd = this.sshCommand(`rm -rf ${workspace.vmPath}`);
    try {
      execSync(cleanupCmd, { encoding: 'utf-8' });
    } catch (err) {
      logger.warn(`⚠️  Failed to clean up workspace: ${err}`);
    }

    workspace.status = 'terminated';
    this.activeWorkspaces.delete(workspaceId);

    logger.info(`✅ Workspace terminated`);
  }

  /**
   * Get active workspaces
   */
  getActiveWorkspaces(): AgentWorkspace[] {
    return Array.from(this.activeWorkspaces.values());
  }

  /**
   * Get workspace by agent
   */
  getWorkspaceByAgent(agentId: string, projectId: string): AgentWorkspace | undefined {
    return Array.from(this.activeWorkspaces.values()).find(
      w => w.agentId === agentId && w.projectId === projectId && w.status === 'active'
    );
  }
}
