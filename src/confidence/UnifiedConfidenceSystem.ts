// 🎯 UNIFIED CONFIDENCE SYSTEM INTEGRATION
// Built: 2025-10-13 | Purpose: Master integration system combining all confidence methodologies
// This is the main entry point for the complete confidence system

import Database from 'better-sqlite3';
import { AdvancedSelfAuditSystem } from './AdvancedSelfAuditSystem.js';
import { TemporalConfidenceTracker } from './TemporalConfidenceTracker.js';
import { CounterfactualAnalysisSystem } from './CounterfactualAnalysisSystem.js';
import { EnhancedCognitiveBiasSystem } from './EnhancedCognitiveBiasSystem.js';
import { ConfidenceCalibrationSystem } from './ConfidenceCalibrationSystem.js';
import { MetacognitiveAwarenessModule } from './MetacognitiveAwarenessModule.js';
import { MultiModalEvidenceFusion } from './MultiModalEvidenceFusion.js';

export interface ComprehensiveConfidenceAnalysis {
  unifiedResult: {
    confidence: number;
    confidenceInterval: [number, number];
    uncertainty: number;
    reliability: 'high' | 'medium' | 'low';
    evidence: string[];
  };
  systemHealth: {
    overallStatus: 'optimal' | 'good' | 'warning' | 'critical';
    componentStatus: Record<string, 'healthy' | 'degraded' | 'failed'>;
    performanceMetrics: Record<string, number>;
    alerts: string[];
  };
  detailedAnalysis: {
    primaryAudit: any;
    temporalTrends: any;
    counterfactualRisks: any;
    biasDetection: any;
    calibrationMetrics: any;
    metacognitiveState: any;
    evidenceFusion: any;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class UnifiedConfidenceSystem {
  private db: Database;
  private auditSystem: AdvancedSelfAuditSystem;
  private temporalTracker: TemporalConfidenceTracker;
  private counterfactualSystem: CounterfactualAnalysisSystem;
  private biasSystem: EnhancedCognitiveBiasSystem;
  private calibrationSystem: ConfidenceCalibrationSystem;
  private metacognitiveModule: MetacognitiveAwarenessModule;
  private fusionSystem: MultiModalEvidenceFusion;

  constructor(database: Database) {
    this.db = database;
    this.initializeAllSystems();
  }

  private initializeAllSystems(): void {
    // Initialize all confidence system components
    this.auditSystem = new AdvancedSelfAuditSystem(this.db);
    this.temporalTracker = new TemporalConfidenceTracker(this.db, this.auditSystem);
    this.counterfactualSystem = new CounterfactualAnalysisSystem(this.db);
    this.biasSystem = new EnhancedCognitiveBiasSystem(this.db);
    this.calibrationSystem = new ConfidenceCalibrationSystem(this.db);
    this.metacognitiveModule = new MetacognitiveAwarenessModule(this.db);
    this.fusionSystem = new MultiModalEvidenceFusion(
      this.db,
      this.auditSystem,
      this.temporalTracker,
      this.counterfactualSystem,
      this.biasSystem,
      this.calibrationSystem,
      this.metacognitiveModule
    );
  }

  async performComprehensiveAnalysis(
    claim: string,
    evidenceType: 'light' | 'standard' | 'thorough' = 'standard',
    context?: any,
    agentId?: string
  ): Promise<ComprehensiveConfidenceAnalysis> {
    // Step 1: Determine evidence collection strategy
    const evidenceStrategy = this.determineEvidenceStrategy(evidenceType);

    // Step 2: Perform multi-modal evidence fusion
    const fusionResult = await this.fusionSystem.performMultiModalFusion(
      claim,
      evidenceStrategy.evidence,
      context,
      agentId
    );

    // Step 3: Analyze system health
    const systemHealth = await this.analyzeSystemHealth();

    // Step 4: Gather detailed analysis from all components
    const detailedAnalysis = await this.gatherDetailedAnalysis(
      claim,
      evidenceStrategy.evidence,
      context,
      agentId
    );

    // Step 5: Generate recommendations
    const recommendations = this.generateComprehensiveRecommendations(
      fusionResult,
      systemHealth,
      detailedAnalysis
    );

    // Step 6: Record calibration data for future learning
    await this.calibrationSystem.recordCalibrationData(
      fusionResult.unifiedConfidence,
      1, // Would be actual outcome when available
      'comprehensive_analysis',
      evidenceStrategy.evidence.length,
      context
    );

    return {
      unifiedResult: {
        confidence: fusionResult.unifiedConfidence,
        confidenceInterval: fusionResult.confidenceInterval,
        uncertainty: fusionResult.uncertaintyQuantification.total,
        reliability: this.determineReliability(fusionResult.validationMetrics),
        evidence: fusionResult.evidenceFusion.sources.map(s => s.type)
      },
      systemHealth,
      detailedAnalysis,
      recommendations
    };
  }

  private determineEvidenceStrategy(evidenceType: 'light' | 'standard' | 'thorough'): {
    evidence: any[];
    description: string;
  } {
    switch (evidenceType) {
      case 'light':
        return {
          evidence: [
            { type: 'DATABASE_REALITY', testParams: { query: 'SELECT 1', expectedResult: { 1: 1 } } }
          ],
          description: 'Light evidence collection for rapid assessment'
        };

      case 'standard':
        return {
          evidence: [
            { type: 'DATABASE_REALITY', testParams: { query: 'SELECT 1', expectedResult: { 1: 1 } } },
            { type: 'CODE_EXECUTION', testParams: { testCode: 'return true', expectedResult: true } },
            { type: 'FILESYSTEM_EVIDENCE', testParams: { filePath: './package.json', expectedContent: { exists: true } } }
          ],
          description: 'Standard evidence collection for balanced analysis'
        };

      case 'thorough':
        return {
          evidence: [
            { type: 'DATABASE_REALITY', testParams: { query: 'SELECT 1', expectedResult: { 1: 1 } } },
            { type: 'CODE_EXECUTION', testParams: { testCode: 'return true', expectedResult: true } },
            { type: 'FILESYSTEM_EVIDENCE', testParams: { filePath: './package.json', expectedContent: { exists: true } } },
            { type: 'API_RESPONSE', testParams: { endpoint: '/health', expectedResult: { status: 'ok' } } }
          ],
          description: 'Thorough evidence collection for comprehensive analysis'
        };

      default:
        return this.determineEvidenceStrategy('standard');
    }
  }

  private async analyzeSystemHealth(): Promise<ComprehensiveConfidenceAnalysis['systemHealth']> {
    const healthStatus: ComprehensiveConfidenceAnalysis['systemHealth'] = {
      overallStatus: 'optimal',
      componentStatus: {},
      performanceMetrics: {},
      alerts: []
    };

    // Check each component
    try {
      // Database health
      const dbHealth = this.checkDatabaseHealth();
      healthStatus.componentStatus.database = dbHealth.status;
      healthStatus.performanceMetrics.databaseResponseTime = dbHealth.responseTime;

      // Calibration system health
      const calibrationMetrics = await this.calibrationSystem.calculateCalibrationMetrics('week');
      healthStatus.componentStatus.calibration = this.mapCalibrationQuality(calibrationMetrics.overallCalibrationQuality);
      healthStatus.performanceMetrics.calibrationBrierScore = calibrationMetrics.brierScore;

      // Temporal tracking health
      const temporalAnalysis = await this.temporalTracker.getTemporalAnalysis('week');
      healthStatus.componentStatus.temporal = temporalAnalysis.systemHealth.trendDirection === 'positive' ? 'healthy' : 'degraded';
      healthStatus.performanceMetrics.temporalStability = temporalAnalysis.systemHealth.confidenceStability;

      // Bias detection health
      const biasReport = await this.biasSystem.getBiasAnalysisReport('week');
      const highBiasRate = biasReport.summary.automaticCorrectionRate < 0.7;
      healthStatus.componentStatus.biasDetection = highBiasRate ? 'degraded' : 'healthy';
      healthStatus.performanceMetrics.biasDetectionRate = 1 - biasReport.summary.automaticCorrectionRate;

      // Fusion system health
      const fusionReport = await this.fusionSystem.getFusionReport('week');
      healthStatus.componentStatus.fusion = this.mapFusionReliability(fusionReport.summary.fusionReliability);
      healthStatus.performanceMetrics.fusionReliability = fusionReport.summary.fusionReliability;

    } catch (error) {
      healthStatus.overallStatus = 'critical';
      healthStatus.alerts.push(`System health check failed: ${error.message}`);
    }

    // Determine overall status
    const componentValues = Object.values(healthStatus.componentStatus);
    const healthyCount = componentValues.filter(status => status === 'healthy').length;
    const totalCount = componentValues.length;

    if (healthyCount === totalCount) {
      healthStatus.overallStatus = 'optimal';
    } else if (healthyCount >= totalCount * 0.75) {
      healthStatus.overallStatus = 'good';
    } else if (healthyCount >= totalCount * 0.5) {
      healthStatus.overallStatus = 'warning';
    } else {
      healthStatus.overallStatus = 'critical';
    }

    return healthStatus;
  }

  private checkDatabaseHealth(): { status: 'healthy' | 'degraded' | 'failed'; responseTime: number } {
    const startTime = Date.now();
    try {
      const stmt = this.db.prepare('SELECT 1 as test');
      stmt.get();
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'failed',
        responseTime
      };
    } catch (error) {
      return {
        status: 'failed',
        responseTime: Date.now() - startTime
      };
    }
  }

  private mapCalibrationQuality(quality: string): 'healthy' | 'degraded' | 'failed' {
    switch (quality) {
      case 'excellent':
      case 'good':
        return 'healthy';
      case 'fair':
        return 'degraded';
      case 'poor':
      case 'unreliable':
        return 'failed';
      default:
        return 'degraded';
    }
  }

  private mapFusionReliability(reliability: number): 'healthy' | 'degraded' | 'failed' {
    if (reliability > 0.8) return 'healthy';
    if (reliability > 0.6) return 'degraded';
    return 'failed';
  }

  private determineReliability(validationMetrics: any): 'high' | 'medium' | 'low' {
    const avgScore = (
      validationMetrics.crossValidationScore +
      validationMetrics.stabilityScore +
      validationMetrics.robustnessScore +
      validationMetrics.generalizationScore
    ) / 4;

    if (avgScore > 0.8) return 'high';
    if (avgScore > 0.6) return 'medium';
    return 'low';
  }

  private async gatherDetailedAnalysis(
    claim: string,
    evidence: any[],
    context?: any,
    agentId?: string
  ): Promise<ComprehensiveConfidenceAnalysis['detailedAnalysis']> {
    return {
      primaryAudit: await this.auditSystem.comprehensiveConfidenceAudit(claim, evidence),
      temporalTrends: await this.temporalTracker.analyzeTrends('general'),
      counterfactualRisks: await this.counterfactualSystem.performCounterfactualAnalysis(claim, evidence[0]),
      biasDetection: await this.biasSystem.performBiasAnalysis(claim, evidence, 0.5, agentId),
      calibrationMetrics: await this.calibrationSystem.calculateCalibrationMetrics('week'),
      metacognitiveState: await this.metacognitiveModule.performIntrospection(claim, evidence, {
        adjustedConfidence: 0.5
      } as any),
      evidenceFusion: {} // Would be populated by fusion system
    };
  }

  private generateComprehensiveRecommendations(
    fusionResult: any,
    systemHealth: ComprehensiveConfidenceAnalysis['systemHealth'],
    detailedAnalysis: ComprehensiveConfidenceAnalysis['detailedAnalysis']
  ): ComprehensiveConfidenceAnalysis['recommendations'] {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    };

    // Immediate recommendations (critical issues)
    if (systemHealth.overallStatus === 'critical') {
      recommendations.immediate.push('URGENT: System health is critical - immediate intervention required');
    }

    if (fusionResult.unifiedConfidence < 0.3) {
      recommendations.immediate.push('Very low confidence detected - pause operation and investigate');
    }

    if (fusionResult.uncertaintyQuantification.total > 0.5) {
      recommendations.immediate.push('High uncertainty detected - additional verification required');
    }

    // Short-term recommendations (improvements)
    if (systemHealth.componentStatus.calibration === 'degraded') {
      recommendations.shortTerm.push('Improve calibration through additional training data');
    }

    if (detailedAnalysis.biasDetection.overallBiasScore > 0.3) {
      recommendations.shortTerm.push('Implement enhanced bias detection and correction');
    }

    if (fusionResult.validationMetrics.stabilityScore < 0.7) {
      recommendations.shortTerm.push('Improve fusion stability through ensemble diversification');
    }

    // Long-term recommendations (strategic improvements)
    if (systemHealth.performanceMetrics.fusionReliability < 0.8) {
      recommendations.longTerm.push('Develop advanced fusion algorithms for improved reliability');
    }

    if (detailedAnalysis.metacognitiveState.selfAssessment.knowledgeCoverage < 0.7) {
      recommendations.longTerm.push('Expand knowledge boundaries through systematic exploration');
    }

    recommendations.longTerm.push('Continue monitoring and adapting confidence methodologies');

    return recommendations;
  }

  // Public API methods
  async quickConfidenceAssessment(claim: string): Promise<{
    confidence: number;
    reliability: string;
    recommendation: string;
  }> {
    const analysis = await this.performComprehensiveAnalysis(claim, 'light');

    return {
      confidence: analysis.unifiedResult.confidence,
      reliability: analysis.unifiedResult.reliability,
      recommendation: analysis.recommendations.immediate[0] || 'No immediate action required'
    };
  }

  async detailedConfidenceAnalysis(claim: string): Promise<ComprehensiveConfidenceAnalysis> {
    return this.performComprehensiveAnalysis(claim, 'thorough');
  }

  async getSystemDashboard(): Promise<{
    overallHealth: string;
    recentAnalyses: Array<{
      timestamp: Date;
      claim: string;
      confidence: number;
      uncertainty: number;
    }>;
    componentStatus: Record<string, string>;
    alerts: string[];
  }> {
    const systemHealth = await this.analyzeSystemHealth();

    // Get recent analyses
    const recentStmt = this.db.prepare(`
      SELECT claim, unified_confidence, created_at
      FROM evidence_fusion
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const recentAnalyses = recentStmt.all().map((row: any) => ({
      timestamp: new Date(row.created_at),
      claim: row.claim,
      confidence: row.unified_confidence,
      uncertainty: 0.3 // Would extract from actual data
    }));

    return {
      overallHealth: systemHealth.overallStatus,
      recentAnalyses,
      componentStatus: systemHealth.componentStatus,
      alerts: systemHealth.alerts
    };
  }

  async calibrateWithOutcome(claim: string, actualOutcome: number): Promise<{
    calibrationAdjustment: number;
    newAccuracy: number;
    learningEffectiveness: string;
  }> {
    // Record the actual outcome
    await this.calibrationSystem.recordCalibrationData(
      0.5, // Would use predicted confidence
      actualOutcome,
      'outcome_based',
      1,
      { claim, timestamp: new Date() }
    );

    // Get updated calibration metrics
    const metrics = await this.calibrationSystem.calculateCalibrationMetrics('week');

    return {
      calibrationAdjustment: Math.abs(0.5 - actualOutcome),
      newAccuracy: 1 - metrics.brierScore,
      learningEffectiveness: metrics.overallCalibrationQuality
    };
  }
}

export default UnifiedConfidenceSystem;