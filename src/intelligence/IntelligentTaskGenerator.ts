/**
 * INTELLIGENT TASK GENERATION SYSTEM
 * ===================================
 *
 * TRANSFORMS SPECS → INTELLIGENT, WELL-STRUCTURED TASKS
 *
 * This is the CRITICAL LINK in the clockwork mechanism:
 * User Message → Insight → Spec → **INTELLIGENT TASKS** → Agents → Implementation
 *
 * CAPABILITIES:
 * 1. Parse spec files (markdown with sections)
 * 2. Extract implementation requirements
 * 3. Generate dependency graph (which tasks depend on what)
 * 4. Create properly-ordered tasks
 * 5. Assign to optimal agents based on capabilities
 * 6. Estimate effort and priority
 * 7. Create test tasks for validation
 *
 * INTELLIGENCE FEATURES:
 * - **Dependency Detection:** "API needs database" → database task first
 * - **Agent Matching:** UI task → Agent A, Backend → Agent C
 * - **Parallel Opportunities:** Independent tasks can run simultaneously
 * - **Test Generation:** For every implementation task, create test task
 * - **Priority Calculation:** Critical path gets higher priority
 *
 * Example Spec → Tasks Flow:
 * ```
 * Spec: "User Authentication System"
 *
 * Intelligent Tasks Generated:
 * 1. T001: Database schema (Agent C, P0) → No dependencies
 * 2. T002: Auth service (Agent C, P0) → Depends on T001
 * 3. T003: API endpoints (Agent C, P1) → Depends on T002
 * 4. T004: UI login form (Agent A, P1) → Depends on T003
 * 5. T005: Tests for auth (Agent E, P1) → Depends on T002
 * ```
 *
 * This transforms manual task creation → AUTOMATIC, INTELLIGENT GENERATION!
 */

import { readFileSync, existsSync } from 'fs';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

export interface SpecParseResult {
  specId: string;
  title: string;
  sections: Map<string, string>;
  requirements: ImplementationRequirement[];
  testRequirements: TestRequirement[];
}

export interface ImplementationRequirement {
  id: string;
  type: 'DATABASE' | 'API' | 'SERVICE' | 'UI' | 'INTEGRATION' | 'INFRASTRUCTURE';
  description: string;
  dependencies: string[];           // IDs of other requirements
  estimatedHours: number;
  priority: number;                 // 0-4 (0=critical, 4=nice-to-have)
  optimalAgent: string;             // A, B, C, D, E, F
  files: string[];                  // Expected output files
}

export interface TestRequirement {
  id: string;
  requirementId: string;            // Which requirement this tests
  type: 'UNIT' | 'INTEGRATION' | 'E2E';
  description: string;
  testFiles: string[];
}

export interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  status: 'pending';
  priority: number;
  agent: string;
  category: string;
  dependencies: string[];
  estimatedHours: number;
  location?: string;
  deliverables: string[];
  testTask?: string;                // ID of associated test task
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
  criticalPath: string[];
  parallelGroups: string[][];
}

export interface DependencyNode {
  id: string;
  type: string;
  depth: number;                    // How deep in dependency tree
  inDegree: number;                 // Number of dependencies
  outDegree: number;                // Number of dependents
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'REQUIRES' | 'USES' | 'BUILDS_ON';
}

/**
 * Intelligent Task Generator
 *
 * Converts specs into well-structured, intelligent task graphs.
 */
export class IntelligentTaskGenerator {
  private db: Database.Database;
  private eventBus: AutoProactiveEventBus;

  // Agent capability mapping
  private readonly AGENT_CAPABILITIES = {
    'A': { focus: 'UI', keywords: ['ui', 'frontend', 'react', 'component', 'design', 'ux'] },
    'B': { focus: 'Architecture', keywords: ['architecture', 'design', 'system', 'pattern', 'structure'] },
    'C': { focus: 'Backend', keywords: ['backend', 'api', 'database', 'server', 'service', 'endpoint'] },
    'D': { focus: 'Integration', keywords: ['integration', 'full-stack', 'coordination', 'glue'] },
    'E': { focus: 'Quality', keywords: ['test', 'quality', 'validation', 'review', 'qa'] },
    'F': { focus: 'Strategy', keywords: ['strategy', 'planning', 'roadmap', 'vision'] }
  };

  constructor(db: Database.Database) {
    this.db = db;
    this.eventBus = AutoProactiveEventBus.getInstance();
  }

  /**
   * Generate tasks from spec file
   */
  async generateTasksFromSpec(specPath: string, projectId: string): Promise<GeneratedTask[]> {
    logger.info(`🧠 Generating intelligent tasks from spec: ${specPath}`);

    try {
      // Step 1: Parse spec file
      const specParsed = await this.parseSpec(specPath);

      // Step 2: Extract implementation requirements
      const requirements = await this.extractRequirements(specParsed);

      // Step 3: Build dependency graph
      const graph = await this.buildDependencyGraph(requirements);

      // Step 4: Generate tasks from requirements
      const tasks = await this.generateTasks(requirements, graph, projectId);

      // Step 5: Generate test tasks
      const testTasks = await this.generateTestTasks(tasks, requirements);

      // Step 6: Combine and save to database
      const allTasks = [...tasks, ...testTasks];
      await this.saveTasks(allTasks);

      logger.info(`✅ Generated ${allTasks.length} tasks (${tasks.length} impl + ${testTasks.length} tests)`);
      logger.info(`   Critical path: ${graph.criticalPath.length} tasks`);
      logger.info(`   Parallel groups: ${graph.parallelGroups.length}`);

      // Emit task creation events
      for (const task of allTasks) {
        this.eventBus.emitLoopEvent(
          LoopEvent.TASK_CREATED,
          {
            taskId: task.id,
            specPath,
            projectId,
            agent: task.agent,
            priority: task.priority
          },
          {
            priority: task.priority <= 2 ? 'high' : 'normal',
            source: 'IntelligentTaskGenerator'
          }
        );
      }

      return allTasks;

    } catch (err: any) {
      logger.error(`❌ Task generation failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Parse spec file
   */
  private async parseSpec(specPath: string): Promise<SpecParseResult> {
    if (!existsSync(specPath)) {
      throw new Error(`Spec file not found: ${specPath}`);
    }

    const content = readFileSync(specPath, 'utf-8');

    // Extract spec ID from frontmatter or filename
    const specIdMatch = content.match(/spec_id:\s*([A-Z0-9_]+)/);
    const specId = specIdMatch ? specIdMatch[1] : 'SPEC_UNKNOWN';

    // Extract title
    const titleMatch = content.match(/title:\s*(.+)/);
    const title = titleMatch ? titleMatch[1] : 'Untitled Spec';

    // Parse sections
    const sections = this.parseSections(content);

    // Parse requirements from sections
    const requirements = this.extractRequirementsFromSections(sections);

    // Parse test requirements
    const testRequirements = this.extractTestRequirements(sections);

    return {
      specId,
      title,
      sections,
      requirements,
      testRequirements
    };
  }

  /**
   * Parse markdown sections
   */
  private parseSections(content: string): Map<string, string> {
    const sections = new Map<string, string>();

    // Split by ## headers
    const headerPattern = /^##\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headerPattern));

    for (let i = 0; i < matches.length; i++) {
      const headerName = matches[i][1];
      const headerIndex = matches[i].index!;

      // Get content until next header or end
      const nextHeaderIndex = i < matches.length - 1
        ? matches[i + 1].index!
        : content.length;

      const sectionContent = content.substring(headerIndex, nextHeaderIndex).trim();
      sections.set(headerName, sectionContent);
    }

    return sections;
  }

  /**
   * Extract implementation requirements from sections
   */
  private extractRequirementsFromSections(sections: Map<string, string>): ImplementationRequirement[] {
    const requirements: ImplementationRequirement[] = [];

    // Look for sections that indicate implementation work
    const implementationSections = [
      'Technical Architecture',
      'Implementation Requirements',
      'API Specifications',
      'Database Schema',
      'UI Components',
      'System Components'
    ];

    for (const sectionName of implementationSections) {
      const section = sections.get(sectionName);
      if (!section) continue;

      // Extract requirements from section content
      const sectionReqs = this.extractRequirementsFromText(section, sectionName);
      requirements.push(...sectionReqs);
    }

    return requirements;
  }

  /**
   * Extract requirements from text
   */
  private extractRequirementsFromText(text: string, context: string): ImplementationRequirement[] {
    const requirements: ImplementationRequirement[] = [];

    // Look for bullet points or numbered lists
    const itemPattern = /^[\s]*[-*\d.]+\s+(.+)$/gm;
    const matches = Array.from(text.matchAll(itemPattern));

    for (const match of matches) {
      const description = match[1].trim();

      // Determine type based on keywords
      const type = this.determineRequirementType(description, context);

      // Determine optimal agent
      const optimalAgent = this.determineOptimalAgent(description, type);

      // Estimate hours (simple heuristic based on complexity indicators)
      const estimatedHours = this.estimateHours(description);

      // Determine priority (based on keywords)
      const priority = this.determinePriority(description);

      // Extract expected files
      const files = this.extractExpectedFiles(description);

      requirements.push({
        id: randomUUID(),
        type,
        description,
        dependencies: [],
        estimatedHours,
        priority,
        optimalAgent,
        files
      });
    }

    return requirements;
  }

  /**
   * Determine requirement type
   */
  private determineRequirementType(
    description: string,
    context: string
  ): ImplementationRequirement['type'] {
    const lower = description.toLowerCase();

    if (context.includes('Database') || lower.includes('schema') || lower.includes('table')) {
      return 'DATABASE';
    }

    if (context.includes('API') || lower.includes('endpoint') || lower.includes('route')) {
      return 'API';
    }

    if (lower.includes('service') || lower.includes('business logic')) {
      return 'SERVICE';
    }

    if (context.includes('UI') || lower.includes('component') || lower.includes('page')) {
      return 'UI';
    }

    if (lower.includes('integrat') || lower.includes('connect') || lower.includes('glue')) {
      return 'INTEGRATION';
    }

    if (lower.includes('deploy') || lower.includes('infrastructure') || lower.includes('ci/cd')) {
      return 'INFRASTRUCTURE';
    }

    return 'SERVICE';
  }

  /**
   * Determine optimal agent
   */
  private determineOptimalAgent(
    description: string,
    type: ImplementationRequirement['type']
  ): string {
    const lower = description.toLowerCase();

    // Count keyword matches for each agent
    const scores: Record<string, number> = {};

    for (const [agent, capabilities] of Object.entries(this.AGENT_CAPABILITIES)) {
      let score = 0;

      for (const keyword of capabilities.keywords) {
        if (lower.includes(keyword)) {
          score += 10;
        }
      }

      // Bonus for type match
      if (
        (type === 'UI' && agent === 'A') ||
        (type === 'DATABASE' && agent === 'C') ||
        (type === 'API' && agent === 'C') ||
        (type === 'SERVICE' && agent === 'C') ||
        (type === 'INTEGRATION' && agent === 'D')
      ) {
        score += 20;
      }

      scores[agent] = score;
    }

    // Return agent with highest score
    const bestAgent = Object.entries(scores).reduce((best, [agent, score]) =>
      score > best[1] ? [agent, score] : best
    , ['D', 0])[0]; // Default to Agent D (Integration specialist)

    return bestAgent;
  }

  /**
   * Estimate hours for requirement
   */
  private estimateHours(description: string): number {
    const lower = description.toLowerCase();

    // Complexity indicators
    let hours = 2; // Base

    if (lower.includes('complex') || lower.includes('advanced')) hours += 4;
    if (lower.includes('simple') || lower.includes('basic')) hours -= 1;
    if (lower.includes('integrate') || lower.includes('connect')) hours += 3;
    if (lower.includes('refactor')) hours += 2;
    if (lower.includes('test')) hours += 1;

    return Math.max(1, Math.min(hours, 16));
  }

  /**
   * Determine priority
   */
  private determinePriority(description: string): number {
    const lower = description.toLowerCase();

    if (lower.includes('critical') || lower.includes('blocker')) return 0;
    if (lower.includes('high') || lower.includes('important')) return 1;
    if (lower.includes('medium') || lower.includes('standard')) return 2;
    if (lower.includes('low') || lower.includes('optional')) return 3;
    if (lower.includes('nice') || lower.includes('future')) return 4;

    return 2; // Default: medium
  }

  /**
   * Extract expected files
   */
  private extractExpectedFiles(description: string): string[] {
    const files: string[] = [];

    // Look for file path patterns
    const filePattern = /`?([a-zA-Z0-9/_-]+\.(ts|js|tsx|jsx|sql|md|json))`?/g;
    const matches = description.matchAll(filePattern);

    for (const match of matches) {
      files.push(match[1]);
    }

    return files;
  }

  /**
   * Extract test requirements
   */
  private extractTestRequirements(sections: Map<string, string>): TestRequirement[] {
    const testReqs: TestRequirement[] = [];

    const testSection = sections.get('Testing') || sections.get('Test Plan');
    if (!testSection) return testReqs;

    // Parse test requirements
    // TODO: Implement test requirement extraction

    return testReqs;
  }

  /**
   * Extract requirements (wrapper)
   */
  private async extractRequirements(specParsed: SpecParseResult): Promise<ImplementationRequirement[]> {
    return specParsed.requirements;
  }

  /**
   * Build dependency graph
   */
  private async buildDependencyGraph(requirements: ImplementationRequirement[]): Promise<DependencyGraph> {
    const nodes = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];

    // Create nodes
    for (const req of requirements) {
      nodes.set(req.id, {
        id: req.id,
        type: req.type,
        depth: 0,
        inDegree: 0,
        outDegree: 0
      });
    }

    // Infer dependencies based on types
    for (const req of requirements) {
      // Database schemas come first
      if (req.type === 'DATABASE') {
        req.dependencies = [];
      }

      // Services depend on database
      if (req.type === 'SERVICE' || req.type === 'API') {
        const dbReqs = requirements.filter(r => r.type === 'DATABASE');
        for (const dbReq of dbReqs) {
          if (!req.dependencies.includes(dbReq.id)) {
            req.dependencies.push(dbReq.id);
            edges.push({ from: dbReq.id, to: req.id, type: 'REQUIRES' });
          }
        }
      }

      // UI depends on API
      if (req.type === 'UI') {
        const apiReqs = requirements.filter(r => r.type === 'API');
        for (const apiReq of apiReqs) {
          if (!req.dependencies.includes(apiReq.id)) {
            req.dependencies.push(apiReq.id);
            edges.push({ from: apiReq.id, to: req.id, type: 'USES' });
          }
        }
      }

      // Integration depends on everything
      if (req.type === 'INTEGRATION') {
        const allReqs = requirements.filter(r => r.type !== 'INTEGRATION');
        for (const otherReq of allReqs) {
          if (!req.dependencies.includes(otherReq.id)) {
            req.dependencies.push(otherReq.id);
            edges.push({ from: otherReq.id, to: req.id, type: 'BUILDS_ON' });
          }
        }
      }
    }

    // Calculate in/out degrees
    for (const edge of edges) {
      const fromNode = nodes.get(edge.from)!;
      const toNode = nodes.get(edge.to)!;

      fromNode.outDegree++;
      toNode.inDegree++;
    }

    // Calculate depths (topological sort)
    this.calculateDepths(nodes, edges);

    // Find critical path
    const criticalPath = this.findCriticalPath(requirements, nodes);

    // Find parallel groups
    const parallelGroups = this.findParallelGroups(requirements, nodes);

    return {
      nodes,
      edges,
      criticalPath,
      parallelGroups
    };
  }

  /**
   * Calculate node depths
   */
  private calculateDepths(
    nodes: Map<string, DependencyNode>,
    edges: DependencyEdge[]
  ): void {
    const visited = new Set<string>();

    const visit = (nodeId: string, depth: number): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.get(nodeId)!;
      node.depth = Math.max(node.depth, depth);

      // Visit dependents
      const outgoingEdges = edges.filter(e => e.from === nodeId);
      for (const edge of outgoingEdges) {
        visit(edge.to, depth + 1);
      }
    };

    // Start with nodes that have no dependencies
    for (const [nodeId, node] of nodes.entries()) {
      if (node.inDegree === 0) {
        visit(nodeId, 0);
      }
    }
  }

  /**
   * Find critical path (longest dependency chain)
   */
  private findCriticalPath(
    requirements: ImplementationRequirement[],
    nodes: Map<string, DependencyNode>
  ): string[] {
    // Find deepest node
    let maxDepth = 0;
    let deepestNode: string = '';

    for (const [nodeId, node] of nodes.entries()) {
      if (node.depth > maxDepth) {
        maxDepth = node.depth;
        deepestNode = nodeId;
      }
    }

    // Trace back to root
    const path: string[] = [deepestNode];
    let current = deepestNode;

    while (current) {
      const req = requirements.find(r => r.id === current)!;
      if (!req.dependencies || req.dependencies.length === 0) break;

      // Find dependency with highest depth
      let nextNode = '';
      let nextDepth = -1;

      for (const depId of req.dependencies) {
        const depNode = nodes.get(depId)!;
        if (depNode.depth > nextDepth) {
          nextDepth = depNode.depth;
          nextNode = depId;
        }
      }

      if (nextNode) {
        path.unshift(nextNode);
        current = nextNode;
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Find parallel groups (tasks that can run simultaneously)
   */
  private findParallelGroups(
    requirements: ImplementationRequirement[],
    nodes: Map<string, DependencyNode>
  ): string[][] {
    const groups: string[][] = [];

    // Group by depth (same depth = can run in parallel)
    const depthMap = new Map<number, string[]>();

    for (const [nodeId, node] of nodes.entries()) {
      if (!depthMap.has(node.depth)) {
        depthMap.set(node.depth, []);
      }
      depthMap.get(node.depth)!.push(nodeId);
    }

    // Convert to array
    for (const [depth, nodeIds] of Array.from(depthMap.entries()).sort((a, b) => a[0] - b[0])) {
      if (nodeIds.length > 1) {
        groups.push(nodeIds);
      }
    }

    return groups;
  }

  /**
   * Generate tasks from requirements
   */
  private async generateTasks(
    requirements: ImplementationRequirement[],
    graph: DependencyGraph,
    projectId: string
  ): Promise<GeneratedTask[]> {
    const tasks: GeneratedTask[] = [];

    for (const req of requirements) {
      const taskId = `T-${projectId.substring(0, 4).toUpperCase()}-${Date.now()}-${tasks.length + 1}`;

      const task: GeneratedTask = {
        id: taskId,
        title: this.generateTaskTitle(req),
        description: req.description,
        status: 'pending',
        priority: req.priority,
        agent: req.optimalAgent,
        category: req.type.toLowerCase(),
        dependencies: req.dependencies.map(depId =>
          `T-${projectId.substring(0, 4).toUpperCase()}-${Date.now()}-${requirements.findIndex(r => r.id === depId) + 1}`
        ),
        estimatedHours: req.estimatedHours,
        deliverables: req.files
      };

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Generate task title
   */
  private generateTaskTitle(req: ImplementationRequirement): string {
    const typePrefix = {
      'DATABASE': 'Database:',
      'API': 'API:',
      'SERVICE': 'Service:',
      'UI': 'UI:',
      'INTEGRATION': 'Integration:',
      'INFRASTRUCTURE': 'Infrastructure:'
    };

    return `${typePrefix[req.type]} ${req.description.substring(0, 60)}`;
  }

  /**
   * Generate test tasks
   */
  private async generateTestTasks(
    implementationTasks: GeneratedTask[],
    requirements: ImplementationRequirement[]
  ): Promise<GeneratedTask[]> {
    const testTasks: GeneratedTask[] = [];

    for (const task of implementationTasks) {
      // Skip infrastructure tasks (no tests needed)
      if (task.category === 'infrastructure') continue;

      const testId = `${task.id}-TEST`;

      const testTask: GeneratedTask = {
        id: testId,
        title: `Test: ${task.title}`,
        description: `Write tests for: ${task.description}`,
        status: 'pending',
        priority: task.priority + 1, // Lower priority than implementation
        agent: 'E', // Quality specialist
        category: 'test',
        dependencies: [task.id], // Depends on implementation
        estimatedHours: Math.ceil(task.estimatedHours * 0.5), // 50% of impl time
        deliverables: task.deliverables.map(f => f.replace(/\.(ts|js)$/, '.test.$1'))
      };

      // Link back
      task.testTask = testId;

      testTasks.push(testTask);
    }

    return testTasks;
  }

  /**
   * Save tasks to database
   */
  private async saveTasks(tasks: GeneratedTask[]): Promise<void> {
    for (const task of tasks) {
      try {
        this.db.prepare(`
          INSERT INTO tasks (
            id, title, description, status, priority,
            agent, category, dependencies, estimated_hours,
            location, deliverables, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          task.id,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.agent,
          task.category,
          JSON.stringify(task.dependencies),
          task.estimatedHours,
          task.location || null,
          JSON.stringify(task.deliverables),
          Date.now(),
          Date.now()
        );
      } catch (err: any) {
        logger.warn(`⚠️  Could not save task ${task.id}: ${err.message}`);
      }
    }
  }
}
