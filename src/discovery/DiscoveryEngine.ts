/**
 * Discovery Engine (Main Orchestrator)
 * =====================================
 *
 * Orchestrates automatic project detection, context extraction,
 * agent recognition, and job proposal generation.
 *
 * Features:
 * - Complete environment discovery in <30 seconds
 * - Automatic project registration
 * - Intelligent context extraction
 * - Agent recognition (persistent identity)
 * - Job proposal generation
 * - Plug-n-play experience (zero manual setup)
 *
 * T005 - CRITICAL PATH - DISCOVERY ENGINE INTEGRATION
 */

import Database from 'better-sqlite3';
import { ProjectDetector, Project } from './ProjectDetector.js';
import { ContextExtractor, ExtractedContext } from './ContextExtractor.js';
import { AgentRecognizer, Agent, AgentIdentity, ConnectionRequest } from './AgentRecognizer.js';
import { JobProposalEngine, JobProposal } from './JobProposalEngine.js';
import { ContextManager } from '../core/ContextManager.js';

export interface EnvironmentDiscovery {
  // Project information
  project: Project;
  projectRecognized: boolean;

  // Context information
  context: ExtractedContext;
  contextExtracted: boolean;

  // Agent information
  agent: Agent;
  agentIdentity: AgentIdentity;

  // Job proposals
  proposals: JobProposal[];
  proposalsGenerated: boolean;

  // Metadata
  discoveryTime: number; // milliseconds
  timestamp: string;
}

export class DiscoveryEngine {
  private projectDetector: ProjectDetector;
  private contextExtractor: ContextExtractor;
  private contextManager: ContextManager;
  private agentRecognizer: AgentRecognizer;
  private jobProposalEngine: JobProposalEngine;

  constructor(private db: Database.Database) {
    this.projectDetector = new ProjectDetector(db);
    this.contextExtractor = new ContextExtractor(db);
    this.contextManager = new ContextManager(db);
    this.agentRecognizer = new AgentRecognizer(db);
    this.jobProposalEngine = new JobProposalEngine(db);
  }

  /**
   * Discover complete environment for agent
   * THIS IS THE MAIN PLUG-N-PLAY ENTRY POINT
   */
  async discoverEnvironment(request: ConnectionRequest): Promise<EnvironmentDiscovery> {
    console.log('\n🚀 STARTING ENVIRONMENT DISCOVERY...\n');
    const startTime = Date.now();

    // ═══════════════════════════════════════════════════════════
    // STEP 1: IDENTIFY OR CREATE AGENT (3 seconds)
    // ═══════════════════════════════════════════════════════════

    console.log('🔍 STEP 1: Identifying agent...');
    const agentIdentity = await this.agentRecognizer.recognizeAgent(request);

    if (agentIdentity.recognized) {
      console.log(`✅ Agent recognized: ${agentIdentity.agent.name} (${agentIdentity.previousSessions} previous sessions)`);
    } else {
      console.log(`🆕 New agent created: ${agentIdentity.agent.name}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: DETECT PROJECT (3 seconds)
    // ═══════════════════════════════════════════════════════════

    console.log('\n🔍 STEP 2: Detecting project...');
    const project = await this.projectDetector.detectProject(request.cwd);

    const projectRecognized = this.db.prepare(`
      SELECT COUNT(*) as count FROM projects WHERE id = ?
    `).get(project.id) as { count: number };

    if (projectRecognized.count > 0) {
      console.log(`✅ Project recognized: ${project.name} (${project.type})`);
    } else {
      console.log(`🆕 Project auto-registered: ${project.name} (${project.type})`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: EXTRACT CONTEXT (10-15 seconds)
    // ═══════════════════════════════════════════════════════════

    console.log('\n🔍 STEP 3: Extracting context...');

    // Check if context needs update
    const needsUpdate = this.contextExtractor.needsUpdate(project.id, project.path);

    let context: ExtractedContext;
    if (needsUpdate) {
      console.log('📊 Context scan needed...');
      context = await this.contextExtractor.extractContext(project.id, project.path);
      console.log(`✅ Context extracted: ${context.statistics.totalFiles} files, ${this.formatBytes(context.statistics.totalSize)}`);
    } else {
      console.log('✅ Context up-to-date, loading from database...');
      const files = this.contextExtractor.getContextFiles(project.id);
      const categories = this.contextExtractor.categorizeFiles(files);
      const statistics = this.contextExtractor.getContextStatistics(project.id);
      const keyFiles = this.contextExtractor.readKeyFiles(project.path);

      context = {
        projectId: project.id,
        extractedAt: new Date().toISOString(),
        files,
        categories,
        statistics,
        keyFiles
      };
      console.log(`✅ Loaded ${files.length} files from cache`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: GENERATE JOB PROPOSALS (2-3 seconds)
    // ═══════════════════════════════════════════════════════════

    console.log('\n🔍 STEP 4: Generating job proposals...');
    const proposals = await this.jobProposalEngine.generateProposals(
      agentIdentity.agent,
      project,
      context
    );

    if (proposals.length > 0) {
      console.log(`✅ Generated ${proposals.length} job proposals`);
      console.log(`🎯 Top match: ${proposals[0].taskId} (${proposals[0].matchScore}% match)`);
    } else {
      console.log(`📋 No available tasks for ${agentIdentity.agent.name} in ${project.name}`);
    }

    // ═══════════════════════════════════════════════════════════
    // COMPLETE!
    // ═══════════════════════════════════════════════════════════

    const discoveryTime = Date.now() - startTime;
    console.log(`\n✅ DISCOVERY COMPLETE in ${(discoveryTime / 1000).toFixed(1)}s\n`);

    return {
      project,
      projectRecognized: projectRecognized.count > 0,
      context,
      contextExtracted: needsUpdate,
      agent: agentIdentity.agent,
      agentIdentity,
      proposals,
      proposalsGenerated: proposals.length > 0,
      discoveryTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get ContextManager instance for direct access
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }

  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Get discovery summary for display
   */
  getDiscoverySummary(discovery: EnvironmentDiscovery): string {
    const lines: string[] = [];

    lines.push('┌────────────────────────────────────────────────────────────┐');
    lines.push('│  ✅ ENVIRONMENT DISCOVERY COMPLETE                          │');
    lines.push('├────────────────────────────────────────────────────────────┤');
    lines.push(`│  Agent: ${discovery.agent.name.padEnd(48)}  │`);
    lines.push(`│  Status: ${discovery.agentIdentity.recognized ? 'Recognized' : 'New Agent'} (${discovery.agentIdentity.confidence}% confidence)${' '.repeat(26 - discovery.agentIdentity.method.length)}│`);
    lines.push(`│  Sessions: ${discovery.agentIdentity.previousSessions.toString().padEnd(45)} │`);
    lines.push('├────────────────────────────────────────────────────────────┤');
    lines.push(`│  Project: ${discovery.project.name.padEnd(47)}  │`);
    lines.push(`│  Type: ${discovery.project.type.padEnd(50)}  │`);
    lines.push(`│  Context: ${discovery.context.statistics.totalFiles} files, ${this.formatBytes(discovery.context.statistics.totalSize).padEnd(40)} │`);
    lines.push('├────────────────────────────────────────────────────────────┤');
    lines.push(`│  Job Proposals: ${discovery.proposals.length.toString().padEnd(43)} │`);

    if (discovery.proposals.length > 0) {
      const top = discovery.proposals[0];
      lines.push(`│  Top Match: ${top.taskId} (${top.matchScore}% match)${' '.repeat(32 - top.taskId.length)}│`);
      lines.push(`│  Task: ${top.taskName.substring(0, 48).padEnd(48)}  │`);
    }

    lines.push('├────────────────────────────────────────────────────────────┤');
    lines.push(`│  Discovery Time: ${(discovery.discoveryTime / 1000).toFixed(1)}s${' '.repeat(38)}│`);
    lines.push('└────────────────────────────────────────────────────────────┘');

    return lines.join('\n');
  }
}
