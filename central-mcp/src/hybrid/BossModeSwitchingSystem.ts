/**
 * 🧠 INTELLIGENT BOSS MODE SWITCHING SYSTEM
 * =======================================
 *
 * Automatically decides when to activate "Final Boss Mode" based on:
 * - Task complexity analysis
 * - Cost-benefit calculations
 * - Resource availability
 * - User preferences
 * - System performance metrics
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { writeSystemEvent } from '../api/universal-write.js';

export interface TaskRequest {
  id: string;
  type: 'monitoring' | 'basic-spec' | 'complex-spec' | 'strategic-analysis' | 'code-refactoring' | 'system-optimization';
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: 'system' | 'agent' | 'user';
  estimatedComplexity: number; // 0.0 - 1.0
  deadline?: Date;
  metadata?: Record<string, any>;
}

export interface SwitchingDecision {
  shouldSwitch: boolean;
  reason: string;
  confidence: number; // 0.0 - 1.0
  estimatedCost: number;
  estimatedBenefit: number;
  recommendedDuration: number; // minutes
  alternative: {
    approach: string;
    cost: number;
    timeToComplete: number;
    qualityImpact: number;
  };
}

export interface BossModeSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  reason: string;
  tasksProcessed: TaskRequest[];
  totalCost: number;
  totalBenefit: number;
  performance: {
    tokensGenerated: number;
    averageResponseTime: number;
    qualityScore: number;
  };
}

/**
 * Intelligent Boss Mode Switching System
 */
export class BossModeSwitchingSystem {
  private db: Database.Database;
  private currentMode: 'daily' | 'boss' = 'daily';
  private currentSession?: BossModeSession;
  private switchingRules: SwitchingRule[] = [];
  private performanceHistory: PerformanceRecord[] = [];

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeSwitchingRules();
    this.loadPerformanceHistory();
  }

  /**
   * Main decision engine - should we switch to boss mode?
   */
  async evaluateSwitchingDecision(task: TaskRequest): Promise<SwitchingDecision> {
    logger.debug(`🧠 Evaluating boss mode for task: ${task.id}`);

    // Step 1: Check basic prerequisites
    const prerequisites = await this.checkPrerequisites();
    if (!prerequisites.canActivateBossMode) {
      return this.createNegativeDecision(prerequisites.reason, task);
    }

    // Step 2: Analyze task complexity
    const complexityAnalysis = await this.analyzeTaskComplexity(task);

    // Step 3: Calculate cost-benefit
    const costBenefitAnalysis = await this.calculateCostBenefit(task, complexityAnalysis);

    // Step 4: Apply switching rules
    const ruleBasedDecision = await this.applySwitchingRules(task, complexityAnalysis, costBenefitAnalysis);

    // Step 5: Consider system performance
    const performanceConsideration = await this.considerSystemPerformance();

    // Step 6: Make final decision
    const finalDecision = await this.makeFinalDecision(
      task,
      complexityAnalysis,
      costBenefitAnalysis,
      ruleBasedDecision,
      performanceConsideration
    );

    // Log the decision
    await this.logSwitchingDecision(task, finalDecision);

    return finalDecision;
  }

  /**
   * Switch to boss mode
   */
  async activateBossMode(reason: string, estimatedDuration: number): Promise<void> {
    if (this.currentMode === 'boss') {
      logger.warn('⚠️ Boss mode already active');
      return;
    }

    logger.info(`🚀 ACTIVATING BOSS MODE: ${reason}`);

    try {
      // Step 1: Pause daily operations
      await this.pauseDailyOperations();

      // Step 2: Initialize local Llama 70B
      await this.initializeLocalBrain();

      // Step 3: Start boss mode session
      this.currentSession = {
        id: `boss-${Date.now()}`,
        startTime: new Date(),
        reason,
        tasksProcessed: [],
        totalCost: 0,
        totalBenefit: 0,
        performance: {
          tokensGenerated: 0,
          averageResponseTime: 0,
          qualityScore: 0
        }
      };

      this.currentMode = 'boss';

      // Write activation event
      writeSystemEvent({
        eventType: 'loop_execution',
        eventCategory: 'system',
        eventActor: 'BossMode-Switcher',
        eventAction: `Boss mode activated: ${reason}`,
        systemHealth: 'healthy',
        activeLoops: 10, // +1 for boss mode
        avgResponseTimeMs: 0,
        successRate: 1.0,
        tags: ['boss-mode', 'llama-70b', 'hybrid-system', 'mode-switch'],
        metadata: {
          sessionId: this.currentSession.id,
          reason,
          estimatedDuration,
          activatedAt: new Date().toISOString()
        }
      });

      // Schedule automatic deactivation
      setTimeout(async () => {
        await this.deactivateBossMode('timeout');
      }, estimatedDuration * 60 * 1000);

      logger.info(`✅ Boss mode activated (session: ${this.currentSession.id})`);

    } catch (error: any) {
      logger.error('❌ Failed to activate boss mode:', error);
      await this.revertToDailyMode('activation-failed');
    }
  }

  /**
   * Deactivate boss mode
   */
  async deactivateBossMode(reason: string): Promise<void> {
    if (this.currentMode !== 'boss' || !this.currentSession) {
      return;
    }

    logger.info(`💤 DEACTIVATING BOSS MODE: ${reason}`);

    try {
      // Step 1: Complete pending tasks
      await this.completePendingTasks();

      // Step 2: Save session results
      await this.saveSessionResults();

      // Step 3: Shutdown local brain
      await this.shutdownLocalBrain();

      // Step 4: Resume daily operations
      await this.resumeDailyOperations();

      this.currentSession.endTime = new Date();
      this.currentMode = 'daily';

      const sessionDuration = (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 1000 / 60;

      // Write deactivation event
      writeSystemEvent({
        eventType: 'loop_execution',
        eventCategory: 'system',
        eventActor: 'BossMode-Switcher',
        eventAction: `Boss mode deactivated: ${reason}`,
        systemHealth: 'healthy',
        activeLoops: 9, // Back to normal
        avgResponseTimeMs: 0,
        successRate: 1.0,
        tags: ['boss-mode', 'llama-70b', 'hybrid-system', 'mode-switch'],
        metadata: {
          sessionId: this.currentSession.id,
          sessionDurationMinutes: Math.round(sessionDuration),
          tasksProcessed: this.currentSession.tasksProcessed.length,
          totalCost: this.currentSession.totalCost,
          totalBenefit: this.currentSession.totalBenefit,
          roi: this.currentSession.totalBenefit / Math.max(this.currentSession.totalCost, 1)
        }
      });

      logger.info(`✅ Boss mode deactivated (session: ${this.currentSession.id}, duration: ${Math.round(sessionDuration)} minutes)`);

      // Archive session
      await this.archiveSession(this.currentSession);
      this.currentSession = undefined;

    } catch (error: any) {
      logger.error('❌ Failed to deactivate boss mode:', error);
      await this.revertToDailyMode('deactivation-failed');
    }
  }

  /**
   * Process task in current mode
   */
  async processTask(task: TaskRequest): Promise<any> {
    if (this.currentMode === 'boss') {
      return await this.processInBossMode(task);
    } else {
      return await this.processInDailyMode(task);
    }
  }

  /**
   * Initialize switching rules
   */
  private initializeSwitchingRules(): void {
    this.switchingRules = [
      // Rule 1: High complexity tasks
      {
        name: 'high-complexity',
        condition: (task, analysis) => analysis.complexity > 0.8,
        priority: 100,
        action: 'activate-boss',
        reason: 'High complexity task requires Llama 70B power'
      },

      // Rule 2: Strategic importance
      {
        name: 'strategic-importance',
        condition: (task, analysis) => task.priority === 'critical' || task.type === 'strategic-analysis',
        priority: 90,
        action: 'activate-boss',
        reason: 'Strategic importance requires advanced AI'
      },

      // Rule 3: Cost-benefit threshold
      {
        name: 'cost-benefit',
        condition: (task, analysis, costBenefit) => costBenefit.estimatedBenefit / costBenefit.estimatedCost > 5,
        priority: 80,
        action: 'activate-boss',
        reason: 'Cost-benefit ratio favors boss mode'
      },

      // Rule 4: Batch processing
      {
        name: 'batch-processing',
        condition: (task, analysis) => task.metadata?.batchProcessing || false,
        priority: 70,
        action: 'activate-boss',
        reason: 'Batch processing optimization'
      },

      // Rule 5: Time-sensitive tasks
      {
        name: 'time-sensitive',
        condition: (task, analysis) => {
          if (!task.deadline) return false;
          const timeToDeadline = task.deadline.getTime() - Date.now();
          const estimatedDailyTime = this.estimateDailyProcessingTime(task);
          return timeToDeadline < estimatedDailyTime * 2;
        },
        priority: 60,
        action: 'activate-boss',
        reason: 'Time-sensitive task requires boss mode speed'
      }
    ];
  }

  /**
   * Check if prerequisites are met for boss mode
   */
  private async checkPrerequisites(): Promise<{canActivateBossMode: boolean; reason: string}> {
    try {
      // Check if local brain is available
      const localBrainAvailable = await this.checkLocalBrainAvailability();
      if (!localBrainAvailable) {
        return { canActivateBossMode: false, reason: 'Local Llama 70B not available' };
      }

      // Check system resources
      const systemResources = await this.checkSystemResources();
      if (!systemResources.sufficient) {
        return { canActivateBossMode: false, reason: 'Insufficient system resources' };
      }

      // Check if another session is active
      if (this.currentMode === 'boss') {
        return { canActivateBossMode: false, reason: 'Boss mode already active' };
      }

      return { canActivateBossMode: true, reason: 'All prerequisites met' };

    } catch (error: any) {
      return { canActivateBossMode: false, reason: `Prerequisite check failed: ${error.message}` };
    }
  }

  /**
   * Analyze task complexity
   */
  private async analyzeTaskComplexity(task: TaskRequest): Promise<ComplexityAnalysis> {
    const contentLength = task.content.length;
    const contentType = this.detectContentType(task.content);
    const hasTechnicalElements = this.detectTechnicalElements(task.content);
    const requiresDeepAnalysis = this.requiresDeepAnalysis(task.content);

    let complexity = 0.0;

    // Base complexity from content length
    if (contentLength > 10000) complexity += 0.3;
    if (contentLength > 50000) complexity += 0.2;

    // Content type complexity
    switch (contentType) {
      case 'code': complexity += 0.2; break;
      case 'specification': complexity += 0.3; break;
      case 'strategic': complexity += 0.4; break;
      case 'analysis': complexity += 0.3; break;
    }

    // Technical elements complexity
    if (hasTechnicalElements) complexity += 0.2;

    // Deep analysis requirement
    if (requiresDeepAnalysis) complexity += 0.3;

    // User-specified complexity
    complexity = Math.max(complexity, task.estimatedComplexity);

    return {
      complexity: Math.min(complexity, 1.0),
      factors: {
        contentLength,
        contentType,
        hasTechnicalElements,
        requiresDeepAnalysis
      }
    };
  }

  /**
   * Calculate cost-benefit analysis
   */
  private async calculateCostBenefit(task: TaskRequest, complexity: ComplexityAnalysis): Promise<CostBenefitAnalysis> {
    // Estimated costs
    const cloudCost = this.estimateCloudCost(task, complexity);
    const localCost = this.estimateLocalCost(task, complexity);

    // Estimated benefits
    const timeBenefit = this.estimateTimeBenefit(task, complexity);
    const qualityBenefit = this.estimateQualityBenefit(task, complexity);
    const totalBenefit = timeBenefit + qualityBenefit;

    // ROI calculation
    const roi = (totalBenefit - Math.min(cloudCost, localCost)) / Math.min(cloudCost, localCost);

    return {
      estimatedCost: Math.min(cloudCost, localCost),
      estimatedBenefit: totalBenefit,
      roi,
      recommended: localCost < cloudCost || roi > 2,
      cloudCost,
      localCost,
      timeBenefit,
      qualityBenefit
    };
  }

  /**
   * Apply switching rules
   */
  private async applySwitchingRules(
    task: TaskRequest,
    complexity: ComplexityAnalysis,
    costBenefit: CostBenefitAnalysis
  ): Promise<RuleBasedDecision> {
    const applicableRules = this.switchingRules.filter(rule =>
      rule.condition(task, complexity, costBenefit)
    );

    if (applicableRules.length === 0) {
      return { shouldActivate: false, reason: 'No rules triggered', priority: 0 };
    }

    // Sort by priority (highest first)
    applicableRules.sort((a, b) => b.priority - a.priority);

    const topRule = applicableRules[0];

    return {
      shouldActivate: topRule.action === 'activate-boss',
      reason: topRule.reason,
      priority: topRule.priority,
      rule: topRule.name
    };
  }

  /**
   * Consider system performance
   */
  private async considerSystemPerformance(): Promise<PerformanceConsideration> {
    const recentPerformance = this.getRecentPerformance();
    const systemLoad = await this.getSystemLoad();

    // Activate boss mode if current performance is poor
    if (recentPerformance.averageResponseTime > 10000 || systemLoad > 0.8) {
      return {
        performanceDegraded: true,
        reason: 'System performance degradation detected',
        recommendation: 'activate-boss'
      };
    }

    return {
      performanceDegraded: false,
      systemLoad,
        averageResponseTime: recentPerformance.averageResponseTime
    };
  }

  /**
   * Make final decision
   */
  private async makeFinalDecision(
    task: TaskRequest,
    complexity: ComplexityAnalysis,
    costBenefit: CostBenefitAnalysis,
    ruleDecision: RuleBasedDecision,
    performance: PerformanceConsideration
  ): Promise<SwitchingDecision> {
    let shouldSwitch = false;
    let reason = '';
    let confidence = 0.0;

    // Rule-based decision
    if (ruleDecision.shouldActivate) {
      shouldSwitch = true;
      reason = ruleDecision.reason;
      confidence = 0.8 + (ruleDecision.priority / 100) * 0.2;
    }

    // Performance consideration
    if (performance.performanceDegraded) {
      shouldSwitch = true;
      reason = performance.reason;
      confidence = Math.max(confidence, 0.7);
    }

    // Cost-benefit consideration
    if (costBenefit.roi > 3) {
      shouldSwitch = true;
      reason = `High ROI detected (${costBenefit.roi.toFixed(1)}x)`;
      confidence = Math.max(confidence, 0.6);
    }

    // Alternative approach
    const alternative = this.generateAlternativeApproach(task, complexity);

    return {
      shouldSwitch,
      reason,
      confidence,
      estimatedCost: shouldSwitch ? costBenefit.localCost : costBenefit.cloudCost,
      estimatedBenefit: costBenefit.estimatedBenefit,
      recommendedDuration: this.estimateRequiredDuration(task, complexity),
      alternative
    };
  }

  /**
   * Generate alternative approach for non-boss mode
   */
  private generateAlternativeApproach(task: TaskRequest, complexity: ComplexityAnalysis): SwitchingDecision['alternative'] {
    const alternativeCost = this.estimateCloudCost(task, complexity);
    const alternativeTime = this.estimateDailyProcessingTime(task);

    return {
      approach: 'Use cloud APIs with task breakdown',
      cost: alternativeCost,
      timeToComplete: alternativeTime,
      qualityImpact: complexity.complexity > 0.7 ? -30 : -10
    };
  }

  /**
   * Estimate processing time in daily mode
   */
  private estimateDailyProcessingTime(task: TaskRequest): number {
    // Base time estimates (in seconds)
    const baseTimes = {
      'monitoring': 5,
      'basic-spec': 60,
      'complex-spec': 300,
      'strategic-analysis': 600,
      'code-refactoring': 240,
      'system-optimization': 180
    };

    const baseTime = baseTimes[task.type] || 60;
    const complexityMultiplier = 1 + task.estimatedComplexity;
    const priorityMultiplier = task.priority === 'critical' ? 0.5 : 1.0;

    return baseTime * complexityMultiplier * priorityMultiplier;
  }

  /**
   * Log switching decision for analytics
   */
  private async logSwitchingDecision(task: TaskRequest, decision: SwitchingDecision): Promise<void> {
    await this.db.prepare(`
      INSERT INTO switching_decisions (
        id, task_id, task_type, should_switch, reason, confidence,
        estimated_cost, estimated_benefit, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `decision-${Date.now()}`,
      task.id,
      task.type,
      decision.shouldSwitch ? 1 : 0,
      decision.reason,
      decision.confidence,
      decision.estimatedCost,
      decision.estimatedBenefit,
      new Date().toISOString()
    );
  }

  // Helper methods (implementations would go here)
  private async checkLocalBrainAvailability(): Promise<boolean> { /* implementation */ return true; }
  private async checkSystemResources(): Promise<{sufficient: boolean}> { /* implementation */ return { sufficient: true }; }
  private detectContentType(content: string): string { /* implementation */ return 'text'; }
  private detectTechnicalElements(content: string): boolean { /* implementation */ return false; }
  private requiresDeepAnalysis(content: string): boolean { /* implementation */ return false; }
  private estimateCloudCost(task: TaskRequest, complexity: ComplexityAnalysis): number { /* implementation */ return 1.0; }
  private estimateLocalCost(task: TaskRequest, complexity: ComplexityAnalysis): number { /* implementation */ return 0.3; }
  private estimateTimeBenefit(task: TaskRequest, complexity: ComplexityAnalysis): number { /* implementation */ return 10.0; }
  private estimateQualityBenefit(task: TaskRequest, complexity: ComplexityAnalysis): number { /* implementation */ return 5.0; }
  private estimateRequiredDuration(task: TaskRequest, complexity: ComplexityAnalysis): number { /* implementation */ return 30; }
  private async pauseDailyOperations(): Promise<void> { /* implementation */ }
  private async resumeDailyOperations(): Promise<void> { /* implementation */ }
  private async initializeLocalBrain(): Promise<void> { /* implementation */ }
  private async shutdownLocalBrain(): Promise<void> { /* implementation */ }
  private async processInBossMode(task: TaskRequest): Promise<any> { /* implementation */ return {}; }
  private async processInDailyMode(task: TaskRequest): Promise<any> { /* implementation */ return {}; }
  private async completePendingTasks(): Promise<void> { /* implementation */ }
  private async saveSessionResults(): Promise<void> { /* implementation */ }
  private async archiveSession(session: BossModeSession): Promise<void> { /* implementation */ }
  private async revertToDailyMode(reason: string): Promise<void> { /* implementation */ }
  private getRecentPerformance(): any { /* implementation */ return { averageResponseTime: 500 }; }
  private async getSystemLoad(): Promise<number> { /* implementation */ return 0.3; }
  private loadPerformanceHistory(): void { /* implementation */ }
}

// Type definitions
interface SwitchingRule {
  name: string;
  condition: (task: TaskRequest, analysis: any, costBenefit?: any) => boolean;
  priority: number;
  action: 'activate-boss' | 'stay-daily';
  reason: string;
}

interface ComplexityAnalysis {
  complexity: number;
  factors: {
    contentLength: number;
    contentType: string;
    hasTechnicalElements: boolean;
    requiresDeepAnalysis: boolean;
  };
}

interface CostBenefitAnalysis {
  estimatedCost: number;
  estimatedBenefit: number;
  roi: number;
  recommended: boolean;
  cloudCost: number;
  localCost: number;
  timeBenefit: number;
  qualityBenefit: number;
}

interface RuleBasedDecision {
  shouldActivate: boolean;
  reason: string;
  priority: number;
  rule: string;
}

interface PerformanceConsideration {
  performanceDegraded: boolean;
  reason?: string;
  recommendation?: string;
  systemLoad?: number;
  averageResponseTime?: number;
}

interface PerformanceRecord {
  timestamp: Date;
  responseTime: number;
  accuracy: number;
  mode: 'daily' | 'boss';
}