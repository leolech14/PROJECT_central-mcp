/**
 * Model Discovery & Recommendation
 * ==================================
 *
 * Intelligent model recommendation based on task requirements.
 *
 * Features:
 * - Model catalog with capabilities
 * - Intelligent recommendation algorithm
 * - Performance-based selection
 * - Cost-efficiency analysis
 * - Context size matching
 *
 * T015 - MODEL INTELLIGENCE
 */

import Database from 'better-sqlite3';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextSize: number;
  capabilities: string[]; // ['UI', 'BACKEND', 'DESIGN', etc.]
  strengths: string[];
  costPer1MTokens: number;
  speedScore: number; // 1-10
  qualityScore: number; // 1-10
}

export interface ModelRecommendation {
  modelId: string;
  modelName: string;
  score: number; // 0-100
  reason: string;
  alternatives: Array<{ modelId: string; score: number }>;
}

export class ModelDiscovery {
  private modelCatalog: ModelInfo[] = [
    {
      id: 'claude-sonnet-4-5',
      name: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      contextSize: 1000000,
      capabilities: ['UI', 'BACKEND', 'DESIGN', 'INTEGRATION', 'ARCHITECTURE'],
      strengths: ['Complex reasoning', 'Code generation', 'Long context'],
      costPer1MTokens: 15,
      speedScore: 8,
      qualityScore: 10
    },
    {
      id: 'glm-4.6',
      name: 'GLM-4.6',
      provider: 'Zhipu AI',
      contextSize: 200000,
      capabilities: ['UI', 'BACKEND', 'CODE'],
      strengths: ['Fast execution', 'Code generation', 'Cost effective'],
      costPer1MTokens: 2,
      speedScore: 9,
      qualityScore: 7
    },
    {
      id: 'gemini-2-pro',
      name: 'Gemini 2.0 Pro',
      provider: 'Google',
      contextSize: 1000000,
      capabilities: ['UI', 'BACKEND', 'MULTIMODAL', 'RESEARCH'],
      strengths: ['Multimodal', 'Research', 'Long context'],
      costPer1MTokens: 10,
      speedScore: 7,
      qualityScore: 9
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      contextSize: 128000,
      capabilities: ['UI', 'DESIGN', 'CREATIVE'],
      strengths: ['Creative writing', 'UI/UX', 'General purpose'],
      costPer1MTokens: 20,
      speedScore: 6,
      qualityScore: 9
    }
  ];

  constructor(private db: Database.Database) {}

  /**
   * Recommend best model for task
   */
  async recommendModel(taskId: string, agentCapabilities?: any): Promise<ModelRecommendation> {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Analyze task requirements
    const requirements = this.analyzeTaskRequirements(task);

    // Score each model
    const scored = this.modelCatalog.map(model => ({
      model,
      score: this.scoreModel(model, requirements, agentCapabilities)
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    return {
      modelId: best.model.id,
      modelName: best.model.name,
      score: Math.round(best.score),
      reason: this.explainRecommendation(best.model, requirements),
      alternatives: scored.slice(1, 4).map(s => ({
        modelId: s.model.id,
        score: Math.round(s.score)
      }))
    };
  }

  /**
   * Score model for task (0-100)
   */
  private scoreModel(
    model: ModelInfo,
    requirements: TaskRequirements,
    currentCaps?: any
  ): number {
    let score = 0;

    // Context size match (20%)
    if (requirements.estimatedContext <= model.contextSize) {
      score += 20;
    } else {
      score += 10; // Partial credit if close
    }

    // Capability match (30%)
    const matchedCaps = requirements.requiredCapabilities.filter(cap =>
      model.capabilities.includes(cap)
    );
    const capScore = (matchedCaps.length / requirements.requiredCapabilities.length) * 30;
    score += capScore;

    // Task type match (20%)
    const taskType = requirements.taskType;
    if (model.strengths.some(s => s.toLowerCase().includes(taskType.toLowerCase()))) {
      score += 20;
    } else {
      score += 10; // Partial
    }

    // Cost efficiency (15%)
    const costScore = (1 - (model.costPer1MTokens / 20)) * 15;
    score += Math.max(0, costScore);

    // Speed (10%)
    score += model.speedScore;

    // Quality (5%)
    score += model.qualityScore / 2;

    // Agent compatibility bonus (if agent already uses this model)
    if (currentCaps && model.contextSize >= currentCaps.contextSize) {
      score += 5; // Bonus for agent familiarity
    }

    return Math.min(100, score);
  }

  /**
   * Analyze task requirements
   */
  private analyzeTaskRequirements(task: any): TaskRequirements {
    const text = `${task.name} ${task.description || ''}`.toLowerCase();

    const requiredCapabilities: string[] = [];
    if (text.includes('ui') || text.includes('component') || text.includes('frontend')) {
      requiredCapabilities.push('UI');
    }
    if (text.includes('backend') || text.includes('api') || text.includes('database')) {
      requiredCapabilities.push('BACKEND');
    }
    if (text.includes('design') || text.includes('color') || text.includes('token')) {
      requiredCapabilities.push('DESIGN');
    }
    if (text.includes('integration') || text.includes('bridge') || text.includes('ipc')) {
      requiredCapabilities.push('INTEGRATION');
    }

    const taskType = requiredCapabilities[0] || 'GENERAL';

    // Estimate context needed (rough heuristic)
    const estimatedContext = (task.estimated_hours || 4) * 10000; // 10K tokens per hour

    return {
      requiredCapabilities,
      taskType,
      estimatedContext,
      priority: task.priority
    };
  }

  /**
   * Explain recommendation
   */
  private explainRecommendation(model: ModelInfo, requirements: TaskRequirements): string {
    const reasons: string[] = [];

    if (requirements.estimatedContext <= model.contextSize) {
      reasons.push(`Sufficient context (${model.contextSize} tokens)`);
    }

    const matchedCaps = requirements.requiredCapabilities.filter(cap =>
      model.capabilities.includes(cap)
    );

    if (matchedCaps.length > 0) {
      reasons.push(`Has capabilities: ${matchedCaps.join(', ')}`);
    }

    if (model.speedScore >= 8) {
      reasons.push('Fast execution');
    }

    if (model.qualityScore >= 9) {
      reasons.push('High quality output');
    }

    if (model.costPer1MTokens < 10) {
      reasons.push('Cost effective');
    }

    return reasons.join(', ') || 'General purpose match';
  }

  /**
   * Get model info
   */
  getModelInfo(modelId: string): ModelInfo | null {
    return this.modelCatalog.find(m => m.id === modelId) || null;
  }

  /**
   * Get all models with capability
   */
  getModelsByCapability(capability: string): ModelInfo[] {
    return this.modelCatalog.filter(m =>
      m.capabilities.includes(capability)
    );
  }

  /**
   * Helper: Get task
   */
  private getTask(taskId: string): any | null {
    return this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;
  }
}

interface TaskRequirements {
  requiredCapabilities: string[];
  taskType: string;
  estimatedContext: number;
  priority: string;
}
