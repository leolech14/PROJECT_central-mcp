/**
 * Job Proposal Engine
 * ====================
 *
 * Generates intelligent job proposals for agents based on discovery.
 *
 * Features:
 * - Task scoring algorithm (0-100%)
 * - Role-capability matching
 * - History-based recommendations
 * - Context relevance scoring
 * - Proposal ranking
 *
 * T004 - CRITICAL PATH - DISCOVERY ENGINE
 */

import Database from 'better-sqlite3';
import type { Agent, AgentCapabilities } from './AgentRecognizer.js';
import type { Project } from './ProjectDetector.js';
import type { ExtractedContext, ContextFile } from './ContextExtractor.js';

export interface JobProposal {
  taskId: string;
  taskName: string;
  description: string;
  priority: string;
  matchScore: number; // 0-100
  matchReason: string;
  relevantContext: RelevantContext;
  estimatedEffort: number; // hours
  impact: string;
  readyToStart: boolean;
  dependencies: string[];
  recommended: boolean;
}

export interface RelevantContext {
  specs: ContextFile[];
  docs: ContextFile[];
  codeExamples: ContextFile[];
  total: number;
}

export interface TaskScore {
  roleMatch: number; // 0-30
  capabilityMatch: number; // 0-25
  historyMatch: number; // 0-15
  contextAvailable: number; // 0-15
  readiness: number; // 0-10
  urgency: number; // 0-5
  total: number; // 0-100
}

export class JobProposalEngine {
  constructor(private db: Database.Database) {}

  /**
   * Generate job proposals for agent
   */
  async generateProposals(
    agent: Agent,
    project: Project,
    context: ExtractedContext
  ): Promise<JobProposal[]> {
    console.log(`🎯 Generating job proposals for ${agent.name} in ${project.name}...`);

    // 1. Get all available tasks for project
    const availableTasks = this.db.prepare(`
      SELECT * FROM tasks
      WHERE project_id = ?
        AND status = 'AVAILABLE'
      ORDER BY priority
    `).all(project.id) as any[];

    if (availableTasks.length === 0) {
      console.log(`📋 No available tasks in ${project.name}`);
      return [];
    }

    // 2. Score each task for this agent
    const scoredTasks = availableTasks.map(task => {
      const score = this.scoreTask(task, agent, context);
      return { task, score };
    });

    // 3. Sort by score (highest first)
    scoredTasks.sort((a, b) => b.score.total - a.score.total);

    // 4. Generate rich proposals
    const proposals = scoredTasks.map((item, index) => {
      const relevantContext = this.findRelevantContext(item.task, context);

      return {
        taskId: item.task.id,
        taskName: item.task.name,
        description: item.task.description || 'No description',
        priority: item.task.priority,
        matchScore: Math.round(item.score.total),
        matchReason: this.explainMatch(item.score),
        relevantContext,
        estimatedEffort: item.task.estimated_hours || 4,
        impact: this.calculateImpact(item.task),
        readyToStart: this.checkReadyToStart(item.task),
        dependencies: item.task.dependencies ? JSON.parse(item.task.dependencies) : [],
        recommended: index === 0 // Top match
      };
    });

    console.log(`✅ Generated ${proposals.length} proposals (top match: ${proposals[0]?.matchScore}%)`);

    return proposals;
  }

  /**
   * Score task for agent (0-100)
   */
  private scoreTask(task: any, agent: Agent, context: ExtractedContext): TaskScore {
    const score: TaskScore = {
      roleMatch: 0,
      capabilityMatch: 0,
      historyMatch: 0,
      contextAvailable: 0,
      readiness: 0,
      urgency: 0,
      total: 0
    };

    // 1. Role Match (30 points max)
    // For now, assign based on agent letter (simplified)
    const taskAgent = task.agent;
    if (taskAgent === 'ANY' || taskAgent === 'UNASSIGNED') {
      score.roleMatch = 15;
    } else {
      // Match based on capabilities
      const taskType = this.inferTaskType(task);
      if (taskType === 'UI' && agent.capabilities.ui) score.roleMatch = 30;
      if (taskType === 'BACKEND' && agent.capabilities.backend) score.roleMatch = 30;
      if (taskType === 'DESIGN' && agent.capabilities.design) score.roleMatch = 30;
      if (taskType === 'INTEGRATION' && agent.capabilities.integration) score.roleMatch = 30;
    }

    // 2. Capability Match (25 points max)
    const requiredCaps = this.inferRequiredCapabilities(task);
    let matchedCaps = 0;
    let totalCaps = requiredCaps.length;

    if (totalCaps === 0) {
      score.capabilityMatch = 12; // Neutral if no specific requirements
    } else {
      if (requiredCaps.includes('ui') && agent.capabilities.ui) matchedCaps++;
      if (requiredCaps.includes('backend') && agent.capabilities.backend) matchedCaps++;
      if (requiredCaps.includes('design') && agent.capabilities.design) matchedCaps++;
      if (requiredCaps.includes('integration') && agent.capabilities.integration) matchedCaps++;

      score.capabilityMatch = (matchedCaps / totalCaps) * 25;
    }

    // 3. History Match (15 points max)
    // Check if agent has completed similar tasks
    const similarTasks = this.db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE status = 'COMPLETE'
        AND (name LIKE ? OR description LIKE ?)
    `).get(`%${task.name.split(' ')[0]}%`, `%${task.name.split(' ')[0]}%`) as { count: number };

    score.historyMatch = Math.min(similarTasks.count * 3, 15);

    // 4. Context Available (15 points max)
    const relevantFiles = this.findRelevantContext(task, context);
    const contextScore = Math.min(relevantFiles.total * 2, 15);
    score.contextAvailable = contextScore;

    // 5. Readiness (10 points max)
    const ready = this.checkReadyToStart(task);
    score.readiness = ready ? 10 : 0;

    // 6. Urgency (5 points max)
    const urgencyMap = { 'P0': 5, 'P1': 4, 'P2': 2, 'P3': 1 };
    score.urgency = urgencyMap[task.priority as keyof typeof urgencyMap] || 1;

    // Total score
    score.total = score.roleMatch + score.capabilityMatch + score.historyMatch +
                  score.contextAvailable + score.readiness + score.urgency;

    return score;
  }

  /**
   * Infer task type from name and description
   */
  private inferTaskType(task: any): string {
    const text = `${task.name} ${task.description || ''}`.toLowerCase();

    if (text.includes('ui') || text.includes('component') || text.includes('frontend')) return 'UI';
    if (text.includes('backend') || text.includes('api') || text.includes('database')) return 'BACKEND';
    if (text.includes('design') || text.includes('token') || text.includes('color')) return 'DESIGN';
    if (text.includes('integration') || text.includes('ipc') || text.includes('bridge')) return 'INTEGRATION';

    return 'GENERAL';
  }

  /**
   * Infer required capabilities from task
   */
  private inferRequiredCapabilities(task: any): string[] {
    const caps: string[] = [];
    const text = `${task.name} ${task.description || ''}`.toLowerCase();

    if (text.includes('ui') || text.includes('component')) caps.push('ui');
    if (text.includes('backend') || text.includes('database')) caps.push('backend');
    if (text.includes('design') || text.includes('token')) caps.push('design');
    if (text.includes('integration') || text.includes('bridge')) caps.push('integration');

    return caps;
  }

  /**
   * Find relevant context for task
   */
  private findRelevantContext(task: any, context: ExtractedContext): RelevantContext {
    const taskKeywords = this.extractKeywords(task.name);

    const specs = context.categories.specs.filter(file =>
      taskKeywords.some(keyword => file.relativePath.toLowerCase().includes(keyword))
    ).slice(0, 10);

    const docs = context.categories.docs.filter(file =>
      taskKeywords.some(keyword => file.relativePath.toLowerCase().includes(keyword))
    ).slice(0, 10);

    const codeExamples = context.categories.code.filter(file =>
      taskKeywords.some(keyword => file.relativePath.toLowerCase().includes(keyword))
    ).slice(0, 10);

    return {
      specs,
      docs,
      codeExamples,
      total: specs.length + docs.length + codeExamples.length
    };
  }

  /**
   * Extract keywords from task name
   */
  private extractKeywords(taskName: string): string[] {
    return taskName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // Words longer than 3 chars
  }

  /**
   * Explain match score
   */
  private explainMatch(score: TaskScore): string {
    const reasons: string[] = [];

    if (score.roleMatch >= 25) reasons.push('Perfect role match');
    else if (score.roleMatch >= 15) reasons.push('Good role match');

    if (score.capabilityMatch >= 20) reasons.push('Strong capability match');
    if (score.historyMatch >= 10) reasons.push('Similar task history');
    if (score.contextAvailable >= 10) reasons.push('Rich context available');
    if (score.readiness === 10) reasons.push('All dependencies satisfied');
    if (score.urgency >= 4) reasons.push('High priority');

    return reasons.join(', ') || 'General match';
  }

  /**
   * Calculate impact of completing task
   */
  private calculateImpact(task: any): string {
    // Check how many tasks depend on this one
    const dependentTasks = this.db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE dependencies LIKE ?
    `).get(`%"${task.id}"%`) as { count: number };

    if (dependentTasks.count >= 3) return 'HIGH - Unblocks multiple tasks';
    if (dependentTasks.count >= 1) return 'MEDIUM - Unblocks downstream tasks';
    if (task.priority === 'P0') return 'HIGH - Critical priority';
    if (task.priority === 'P1') return 'MEDIUM - High priority';

    return 'LOW - Independent task';
  }

  /**
   * Check if task is ready to start
   */
  private checkReadyToStart(task: any): boolean {
    const dependencies = task.dependencies ? JSON.parse(task.dependencies) : [];

    if (dependencies.length === 0) return true;

    // Check if all dependencies are complete
    for (const depId of dependencies) {
      const dep = this.db.prepare(`
        SELECT status FROM tasks WHERE id = ?
      `).get(depId) as { status: string } | undefined;

      if (!dep || dep.status !== 'COMPLETE') {
        return false;
      }
    }

    return true;
  }
}
