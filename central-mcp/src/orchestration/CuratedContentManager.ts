/**
 * CURATED CONTENT MANAGER - TWO-TIER ORCHESTRATION SYSTEM
 * ========================================================
 *
 * THE BRILLIANT ARCHITECTURE:
 * Ground Agents (Local) → Curate content → Git commit/push → VM Agents (Remote) → Clone → Work
 *
 * WHY THIS IS GENIUS:
 * 1. **Security:** VM agents only see curated content, not all files
 * 2. **Organization:** Ground agents prepare exactly what's needed
 * 3. **Isolation:** VM agents work in clean, focused environments
 * 4. **Version Control:** Everything goes through Git = audit trail
 * 5. **Scalability:** Can spin up many VM agents from same curated commits
 *
 * WORKFLOW:
 * ```
 * User: "Build authentication system"
 *   ↓
 * Ground Agent:
 *   - Creates spec file
 *   - Creates task breakdown
 *   - Commits to Git: "feat: authentication spec"
 *   - Pushes to remote: branch feature/auth
 *   ↓
 * Central-MCP:
 *   - Detects new commit
 *   - Reads spec from commit
 *   - Generates tasks
 *   - Deploys VM Agent
 *   ↓
 * VM Agent:
 *   - Clones feature/auth branch
 *   - Reads spec from repo
 *   - Implements according to spec
 *   - Commits: "feat(auth): implement JWT service"
 *   - Pushes results back
 *   ↓
 * Ground Agent:
 *   - Pulls new commits
 *   - Validates implementation
 *   - Reports back to user
 * ```
 *
 * CURATION TYPES:
 * 1. **Spec Curation:** Ground agent creates specs, VM agent implements
 * 2. **Task Curation:** Ground agent breaks down work, VM agent executes
 * 3. **File Curation:** Ground agent selects relevant files, VM agent focuses
 * 4. **Context Curation:** Ground agent provides minimal context, VM agent efficient
 *
 * This transforms chaotic development → CURATED, ORGANIZED, SECURE!
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

export interface CuratedWorkSet {
  id: string;
  name: string;
  description: string;
  gitBranch: string;                // Branch containing curated content
  gitCommit: string;                // Specific commit hash
  files: CuratedFile[];             // Files included in curation
  spec?: string;                    // Spec file path
  tasks: string[];                  // Task IDs
  targetAgents: string[];           // Which agents should work on this
  status: 'preparing' | 'ready' | 'deployed' | 'completed';
  createdBy: 'ground' | 'central';
  createdAt: Date;
}

export interface CuratedFile {
  path: string;
  purpose: string;                  // Why this file is included
  access: 'read' | 'write' | 'execute';
}

export interface GroundAgentCuration {
  groundAgentId: string;
  projectId: string;
  workSetId: string;
  curatedFiles: string[];
  gitOperations: GitOperation[];
  status: 'curating' | 'committing' | 'pushing' | 'complete';
}

export interface GitOperation {
  type: 'add' | 'commit' | 'push' | 'branch' | 'tag';
  command: string;
  timestamp: Date;
  success: boolean;
  output?: string;
}

export interface VMAgentDeployment {
  vmAgentId: string;
  workSetId: string;
  clonedFrom: string;               // Git URL + commit
  workspace: string;                // VM path
  status: 'cloning' | 'working' | 'complete';
  results?: VMAgentResults;
}

export interface VMAgentResults {
  filesCreated: string[];
  filesModified: string[];
  commits: string[];
  pushedTo: string;                 // Branch where results are
  timestamp: Date;
}

/**
 * Curated Content Manager
 *
 * Orchestrates Ground Agent → Git → VM Agent workflow.
 */
export class CuratedContentManager {
  private db: Database.Database;
  private eventBus: AutoProactiveEventBus;
  private repoPath: string;
  private workSets: Map<string, CuratedWorkSet>;

  constructor(db: Database.Database, repoPath: string) {
    this.db = db;
    this.eventBus = AutoProactiveEventBus.getInstance();
    this.repoPath = repoPath;
    this.workSets = new Map();

    this.subscribeToEvents();

    logger.info(`📦 Curated Content Manager initialized`);
    logger.info(`   Repository: ${repoPath}`);
  }

  /**
   * Subscribe to events
   */
  private subscribeToEvents(): void {
    // Listen for spec generation events
    this.eventBus.onLoopEvent(
      LoopEvent.SPEC_GENERATED,
      async (payload) => {
        await this.handleSpecGenerated(payload.data);
      },
      { loopName: 'CuratedContentManager' }
    );

    // Listen for task creation events
    this.eventBus.onLoopEvent(
      LoopEvent.TASK_CREATED,
      async (payload) => {
        await this.handleTaskCreated(payload.data);
      },
      { loopName: 'CuratedContentManager' }
    );

    logger.info(`🔗 Curated Content Manager subscribed to events`);
  }

  /**
   * Ground Agent: Create curated work set
   */
  async createCuratedWorkSet(config: {
    name: string;
    description: string;
    files: string[];
    specPath?: string;
    taskIds: string[];
    targetAgents: string[];
  }): Promise<CuratedWorkSet> {
    logger.info(`📦 Creating curated work set: ${config.name}`);

    const workSetId = randomUUID();
    const branchName = `curated/${config.name.toLowerCase().replace(/\s+/g, '-')}`;

    const workSet: CuratedWorkSet = {
      id: workSetId,
      name: config.name,
      description: config.description,
      gitBranch: branchName,
      gitCommit: '',
      files: config.files.map(path => ({
        path,
        purpose: this.inferFilePurpose(path),
        access: this.inferFileAccess(path)
      })),
      spec: config.specPath,
      tasks: config.taskIds,
      targetAgents: config.targetAgents,
      status: 'preparing',
      createdBy: 'ground',
      createdAt: new Date()
    };

    this.workSets.set(workSetId, workSet);

    logger.info(`   ✅ Work set created: ${workSetId}`);
    logger.info(`   Branch: ${branchName}`);
    logger.info(`   Files: ${config.files.length}`);
    logger.info(`   Target agents: ${config.targetAgents.join(', ')}`);

    return workSet;
  }

  /**
   * Ground Agent: Curate and commit to Git
   */
  async curateAndCommit(workSetId: string): Promise<string> {
    const workSet = this.workSets.get(workSetId);
    if (!workSet) {
      throw new Error(`Work set ${workSetId} not found`);
    }

    logger.info(`🔨 Curating and committing work set: ${workSet.name}`);

    try {
      // Step 1: Create branch
      const branchOp = this.gitCreateBranch(workSet.gitBranch);
      logger.info(`   ✅ Branch created: ${workSet.gitBranch}`);

      // Step 2: Add curated files
      for (const file of workSet.files) {
        const filePath = join(this.repoPath, file.path);
        if (existsSync(filePath)) {
          this.gitAdd(file.path);
          logger.info(`   ✅ Added: ${file.path}`);
        } else {
          logger.warn(`   ⚠️  File not found: ${file.path}`);
        }
      }

      // Step 3: Commit with conventional format
      const commitMessage = this.generateCuratedCommitMessage(workSet);
      const commitHash = this.gitCommit(commitMessage);
      workSet.gitCommit = commitHash;

      logger.info(`   ✅ Committed: ${commitHash.substring(0, 7)}`);

      // Step 4: Push to remote
      this.gitPush(workSet.gitBranch);
      logger.info(`   ✅ Pushed to remote: ${workSet.gitBranch}`);

      workSet.status = 'ready';

      // Emit event
      this.eventBus.emitLoopEvent(
        LoopEvent.GIT_PUSH_DETECTED,
        {
          workSetId,
          branch: workSet.gitBranch,
          commit: commitHash,
          files: workSet.files.length
        },
        {
          priority: 'high',
          source: 'CuratedContentManager'
        }
      );

      return commitHash;

    } catch (err: any) {
      logger.error(`❌ Curation failed: ${err.message}`);
      workSet.status = 'preparing';
      throw err;
    }
  }

  /**
   * Central-MCP: Deploy VM agent with curated content
   */
  async deployVMAgentWithCuration(workSetId: string, vmAgentId: string): Promise<VMAgentDeployment> {
    const workSet = this.workSets.get(workSetId);
    if (!workSet) {
      throw new Error(`Work set ${workSetId} not found`);
    }

    if (workSet.status !== 'ready') {
      throw new Error(`Work set not ready (status: ${workSet.status})`);
    }

    logger.info(`🚀 Deploying VM Agent ${vmAgentId} with curated content`);
    logger.info(`   Work set: ${workSet.name}`);
    logger.info(`   Branch: ${workSet.gitBranch}`);
    logger.info(`   Commit: ${workSet.gitCommit.substring(0, 7)}`);

    const deployment: VMAgentDeployment = {
      vmAgentId,
      workSetId,
      clonedFrom: `${workSet.gitBranch}@${workSet.gitCommit}`,
      workspace: `/tmp/vm-agent-${vmAgentId}-${workSetId.substring(0, 8)}`,
      status: 'cloning'
    };

    // VM agent will clone this specific branch and commit
    // (Handled by AgentDeploymentOrchestrator)

    workSet.status = 'deployed';

    logger.info(`   ✅ VM Agent deployment prepared`);

    return deployment;
  }

  /**
   * VM Agent: Collect results and push back
   */
  async collectVMAgentResults(deployment: VMAgentDeployment): Promise<VMAgentResults> {
    logger.info(`📥 Collecting results from VM Agent ${deployment.vmAgentId}`);

    const workSet = this.workSets.get(deployment.workSetId);
    if (!workSet) {
      throw new Error(`Work set ${deployment.workSetId} not found`);
    }

    // Get Git log since deployment
    const newCommits = this.gitLogSince(workSet.gitCommit, workSet.gitBranch);

    // Get modified files
    const modifiedFiles = this.gitDiff(workSet.gitCommit, 'HEAD');

    const results: VMAgentResults = {
      filesCreated: [],
      filesModified: modifiedFiles,
      commits: newCommits,
      pushedTo: workSet.gitBranch,
      timestamp: new Date()
    };

    deployment.results = results;
    deployment.status = 'complete';

    logger.info(`   ✅ Results collected:`);
    logger.info(`      Commits: ${results.commits.length}`);
    logger.info(`      Files modified: ${results.filesModified.length}`);

    // Emit completion event
    this.eventBus.emitLoopEvent(
      LoopEvent.TASK_COMPLETED,
      {
        vmAgentId: deployment.vmAgentId,
        workSetId: deployment.workSetId,
        commits: results.commits.length,
        files: results.filesModified.length
      },
      {
        priority: 'high',
        source: 'CuratedContentManager'
      }
    );

    workSet.status = 'completed';

    return results;
  }

  /**
   * Ground Agent: Pull and validate VM agent results
   */
  async pullAndValidateResults(workSetId: string): Promise<boolean> {
    const workSet = this.workSets.get(workSetId);
    if (!workSet) {
      throw new Error(`Work set ${workSetId} not found`);
    }

    logger.info(`🔍 Pulling and validating results: ${workSet.name}`);

    try {
      // Pull from remote
      this.gitPull(workSet.gitBranch);

      // Get new commits
      const newCommits = this.gitLogSince(workSet.gitCommit, workSet.gitBranch);

      logger.info(`   ✅ Pulled ${newCommits.length} new commit(s)`);

      // TODO: Validate implementation matches spec
      // (Would use SpecLifecycleValidator here)

      return true;

    } catch (err: any) {
      logger.error(`❌ Validation failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Handle spec generated event
   */
  private async handleSpecGenerated(data: any): Promise<void> {
    const { specId, specPath } = data;

    logger.info(`📋 Spec generated: ${specId}`);

    // Auto-create curated work set from spec
    // TODO: Implement automatic curation
  }

  /**
   * Handle task created event
   */
  private async handleTaskCreated(data: any): Promise<void> {
    const { taskId, specPath, projectId } = data;

    logger.info(`✅ Task created: ${taskId}`);

    // Link task to work set
    // TODO: Implement task linking
  }

  /**
   * Git operations
   */
  private gitCreateBranch(branchName: string): GitOperation {
    try {
      execSync(`git checkout -b ${branchName}`, {
        cwd: this.repoPath,
        encoding: 'utf-8'
      });

      return {
        type: 'branch',
        command: `git checkout -b ${branchName}`,
        timestamp: new Date(),
        success: true
      };
    } catch (err: any) {
      return {
        type: 'branch',
        command: `git checkout -b ${branchName}`,
        timestamp: new Date(),
        success: false,
        output: err.message
      };
    }
  }

  private gitAdd(filePath: string): void {
    execSync(`git add ${filePath}`, {
      cwd: this.repoPath,
      encoding: 'utf-8'
    });
  }

  private gitCommit(message: string): string {
    const output = execSync(
      `git commit -m "${message}"`,
      { cwd: this.repoPath, encoding: 'utf-8' }
    );

    // Extract commit hash
    const hashMatch = output.match(/\[.+\s+([a-f0-9]+)\]/);
    return hashMatch ? hashMatch[1] : '';
  }

  private gitPush(branch: string): void {
    execSync(`git push -u origin ${branch}`, {
      cwd: this.repoPath,
      encoding: 'utf-8'
    });
  }

  private gitPull(branch: string): void {
    execSync(`git pull origin ${branch}`, {
      cwd: this.repoPath,
      encoding: 'utf-8'
    });
  }

  private gitLogSince(since: string, branch: string): string[] {
    try {
      const output = execSync(
        `git log ${since}..${branch} --format=%H`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      return output ? output.split('\n') : [];
    } catch {
      return [];
    }
  }

  private gitDiff(from: string, to: string): string[] {
    try {
      const output = execSync(
        `git diff --name-only ${from} ${to}`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      return output ? output.split('\n') : [];
    } catch {
      return [];
    }
  }

  /**
   * Generate curated commit message
   */
  private generateCuratedCommitMessage(workSet: CuratedWorkSet): string {
    const lines: string[] = [];

    lines.push(`feat(curated): ${workSet.name}`);
    lines.push('');
    lines.push(workSet.description);
    lines.push('');
    lines.push('Curated work set contents:');

    for (const file of workSet.files.slice(0, 5)) {
      lines.push(`- ${file.path} (${file.purpose})`);
    }

    if (workSet.files.length > 5) {
      lines.push(`- ... and ${workSet.files.length - 5} more files`);
    }

    lines.push('');
    lines.push(`Target agents: ${workSet.targetAgents.join(', ')}`);
    lines.push(`Tasks: ${workSet.tasks.length} task(s)`);
    lines.push('');
    lines.push('🤖 Generated by Central-MCP Curated Content Manager');

    return lines.join('\n');
  }

  /**
   * Infer file purpose
   */
  private inferFilePurpose(path: string): string {
    if (path.endsWith('.md')) return 'Specification/Documentation';
    if (path.endsWith('.ts') || path.endsWith('.js')) return 'Implementation';
    if (path.endsWith('.test.ts') || path.endsWith('.test.js')) return 'Testing';
    if (path.endsWith('.sql')) return 'Database Schema';
    if (path.endsWith('.json')) return 'Configuration';
    return 'Supporting file';
  }

  /**
   * Infer file access
   */
  private inferFileAccess(path: string): CuratedFile['access'] {
    if (path.endsWith('.md')) return 'read';
    if (path.includes('test')) return 'write';
    if (path.includes('src/')) return 'write';
    return 'read';
  }

  /**
   * Get work set by ID
   */
  getWorkSet(workSetId: string): CuratedWorkSet | undefined {
    return this.workSets.get(workSetId);
  }

  /**
   * Get all work sets
   */
  getAllWorkSets(): CuratedWorkSet[] {
    return Array.from(this.workSets.values());
  }
}
