// 🔀 COUNTERFACTUAL CONFIDENCE ANALYSIS SYSTEM
// Built: 2025-10-13 | Purpose: Model confidence under different failure scenarios, risk assessment, what-if analysis
// Implements: Monte Carlo simulation, failure mode analysis, sensitivity testing, confidence resilience scoring

import { Database } from 'better-sqlite3';
import { ConfidenceResult, EvidenceType } from './AdvancedSelfAuditSystem.js';

export interface FailureScenario {
  id: string;
  name: string;
  description: string;
  probability: number; // 0-1
  impactLevel: 'minor' | 'moderate' | 'major' | 'critical';
  affectedEvidenceTypes: EvidenceType[];
  confidenceImpact: number; // How much it reduces confidence (0-1)
  mitigations: string[];
  detectionMethods: string[];
}

export interface CounterfactualResult {
  originalConfidence: number;
  scenarioConfidence: number;
  confidenceDelta: number;
  resilienceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  criticalFailurePoints: string[];
  recommendedMitigations: string[];
  sensitivityAnalysis: {
    mostImpactfulFactors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    stabilityFactors: string[];
    vulnerabilityFactors: string[];
  };
  monteCarloResults: {
    simulations: number;
    meanConfidence: number;
    confidenceInterval: [number, number];
    probabilityOfSuccess: number;
  };
}

export interface RiskAssessment {
  overallRiskScore: number;
  riskCategories: {
    technical: number;
    operational: number;
    environmental: number;
    human: number;
  };
  topRisks: Array<{
    scenario: string;
    probability: number;
    impact: number;
    riskScore: number;
    mitigations: string[];
  }>;
  riskMatrix: Array<{
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high' | 'critical';
    scenarios: string[];
  }>;
  residualRisk: number;
  riskTolerance: number;
}

export class CounterfactualAnalysisSystem {
  private db: Database;
  private failureScenarios: Map<string, FailureScenario> = new Map();

  constructor(database: Database) {
    this.db = database;
    this.initializeFailureScenarios();
    this.initializeCounterfactualTables();
  }

  private initializeFailureScenarios(): void {
    // Technical failure scenarios
    this.failureScenarios.set('database_corruption', {
      id: 'database_corruption',
      name: 'Database Corruption',
      description: 'Critical database tables become corrupted or inaccessible',
      probability: 0.05,
      impactLevel: 'critical',
      affectedEvidenceTypes: [EvidenceType.DATABASE_REALITY],
      confidenceImpact: 0.9,
      mitigations: [
        'Implement regular database backups',
        'Add database integrity checks',
        'Create redundant data storage'
      ],
      detectionMethods: [
        'Database checksum verification',
        'Query result validation',
        'Connection monitoring'
      ]
    });

    this.failureScenarios.set('api_timeout', {
      id: 'api_timeout',
      name: 'API Service Timeout',
      description: 'External API services become unresponsive',
      probability: 0.15,
      impactLevel: 'moderate',
      affectedEvidenceTypes: [EvidenceType.API_RESPONSE],
      confidenceImpact: 0.6,
      mitigations: [
        'Implement retry mechanisms',
        'Add circuit breakers',
        'Cache critical API responses'
      ],
      detectionMethods: [
        'Response time monitoring',
        'Timeout detection',
        'Error rate tracking'
      ]
    });

    this.failureScenarios.set('code_execution_failure', {
      id: 'code_execution_failure',
      name: 'Code Execution Environment Failure',
      description: 'Verification code execution fails due to environment issues',
      probability: 0.08,
      impactLevel: 'major',
      affectedEvidenceTypes: [EvidenceType.CODE_EXECUTION],
      confidenceImpact: 0.7,
      mitigations: [
        'Containerized execution environments',
        'Resource usage monitoring',
        'Sandbox isolation'
      ],
      detectionMethods: [
        'Process monitoring',
        'Resource usage alerts',
        'Error log analysis'
      ]
    });

    this.failureScenarios.set('filesystem_inaccessibility', {
      id: 'filesystem_inaccessibility',
      name: 'File System Inaccessibility',
      description: 'Critical files or directories become inaccessible',
      probability: 0.12,
      impactLevel: 'moderate',
      affectedEvidenceTypes: [EvidenceType.FILESYSTEM_EVIDENCE],
      confidenceImpact: 0.5,
      mitigations: [
        'Implement file system monitoring',
        'Create redundant storage',
        'Add file integrity checks'
      ],
      detectionMethods: [
        'File access verification',
        'Disk space monitoring',
        'Permission checks'
      ]
    });

    // Environmental failure scenarios
    this.failureScenarios.set('memory_exhaustion', {
      id: 'memory_exhaustion',
      name: 'Memory Exhaustion',
      description: 'System runs out of memory during verification',
      probability: 0.1,
      impactLevel: 'major',
      affectedEvidenceTypes: [EvidenceType.CODE_EXECUTION, EvidenceType.DATABASE_REALITY],
      confidenceImpact: 0.6,
      mitigations: [
        'Memory usage monitoring',
        'Garbage collection optimization',
        'Resource allocation limits'
      ],
      detectionMethods: [
        'Memory usage alerts',
        'Performance monitoring',
        'Process health checks'
      ]
    });

    this.failureScenarios.set('network_partition', {
      id: 'network_partition',
      name: 'Network Partition',
      description: 'Loss of connectivity to critical services',
      probability: 0.07,
      impactLevel: 'moderate',
      affectedEvidenceTypes: [EvidenceType.API_RESPONSE],
      confidenceImpact: 0.4,
      mitigations: [
        'Implement offline operation mode',
        'Add local caching',
        'Create network health monitoring'
      ],
      detectionMethods: [
        'Connectivity checks',
        'Latency monitoring',
        'Packet loss detection'
      ]
    });

    // Human/operator failure scenarios
    this.failureScenarios.set('verification_logic_error', {
      id: 'verification_logic_error',
      name: 'Verification Logic Error',
      description: 'Logic error in verification code leads to false positives/negatives',
      probability: 0.03,
      impactLevel: 'critical',
      affectedEvidenceTypes: [EvidenceType.CODE_EXECUTION, EvidenceType.DATABASE_REALITY],
      confidenceImpact: 0.8,
      mitigations: [
        'Comprehensive code reviews',
        'Automated testing of verification logic',
        'Multiple verification approaches'
      ],
      detectionMethods: [
        'Cross-validation with other methods',
        'Manual spot checks',
        'Consistency analysis'
      ]
    });

    this.failureScenarios.set('configuration_error', {
      id: 'configuration_error',
      name: 'Configuration Error',
      description: 'Incorrect system configuration affects verification',
      probability: 0.2,
      impactLevel: 'moderate',
      affectedEvidenceTypes: [EvidenceType.DATABASE_REALITY, EvidenceType.CODE_EXECUTION],
      confidenceImpact: 0.5,
      mitigations: [
        'Configuration validation',
        'Environment parity checks',
        'Automated configuration testing'
      ],
      detectionMethods: [
        'Configuration audits',
        'Environment comparison',
        'Behavior validation'
      ]
    });
  }

  private initializeCounterfactualTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS counterfactual_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim TEXT NOT NULL,
        original_confidence REAL NOT NULL,
        scenario_id TEXT NOT NULL,
        scenario_confidence REAL NOT NULL,
        confidence_delta REAL NOT NULL,
        resilience_score REAL NOT NULL,
        risk_level TEXT NOT NULL,
        sensitivity_analysis TEXT,
        monte_carlo_results TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS risk_assessment_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim TEXT NOT NULL,
        overall_risk_score REAL NOT NULL,
        risk_categories TEXT NOT NULL,
        top_risks TEXT NOT NULL,
        risk_matrix TEXT NOT NULL,
        residual_risk REAL NOT NULL,
        risk_tolerance REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS failure_scenario_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario_id TEXT NOT NULL,
        occurred_at TIMESTAMP NOT NULL,
        impact_description TEXT,
        mitigation_effectiveness REAL,
        lessons_learned TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_counterfactual_claim ON counterfactual_analysis(claim);
      CREATE INDEX IF NOT EXISTS idx_risk_assessment_claim ON risk_assessment_log(claim);
      CREATE INDEX IF NOT EXISTS idx_failure_scenario ON failure_scenario_history(scenario_id);
    `);
  }

  async performCounterfactualAnalysis(
    claim: string,
    originalResult: ConfidenceResult,
    scenariosToAnalyze?: string[]
  ): Promise<CounterfactualResult> {
    const scenarios = scenariosToAnalyze || Array.from(this.failureScenarios.keys());
    let minScenarioConfidence = originalResult.adjustedConfidence;
    const criticalFailurePoints: string[] = [];
    const recommendedMitigations: string[] = [];

    // Analyze each scenario
    for (const scenarioId of scenarios) {
      const scenario = this.failureScenarios.get(scenarioId);
      if (!scenario) continue;

      const scenarioConfidence = this.calculateScenarioConfidence(originalResult, scenario);
      minScenarioConfidence = Math.min(minScenarioConfidence, scenarioConfidence);

      if (scenario.impactLevel === 'critical') {
        criticalFailurePoints.push(scenario.name);
        recommendedMitigations.push(...scenario.mitigations);
      }
    }

    // Calculate confidence delta
    const confidenceDelta = originalResult.adjustedConfidence - minScenarioConfidence;

    // Calculate resilience score
    const resilienceScore = this.calculateResilienceScore(originalResult, scenarios);

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(confidenceDelta, criticalFailurePoints.length);

    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(originalResult, scenarios);

    // Run Monte Carlo simulation
    const monteCarloResults = this.runMonteCarloSimulation(originalResult, scenarios);

    const result: CounterfactualResult = {
      originalConfidence: originalResult.adjustedConfidence,
      scenarioConfidence: minScenarioConfidence,
      confidenceDelta,
      resilienceScore,
      riskLevel,
      criticalFailurePoints,
      recommendedMitigations: Array.from(new Set(recommendedMitigations)), // Remove duplicates
      sensitivityAnalysis,
      monteCarloResults
    };

    // Store results
    this.storeCounterfactualResult(claim, result);

    return result;
  }

  private calculateScenarioConfidence(originalResult: ConfidenceResult, scenario: FailureScenario): number {
    let scenarioConfidence = originalResult.adjustedConfidence;

    // Apply scenario impact based on affected evidence types
    for (const evidenceType of scenario.affectedEvidenceTypes) {
      // Check if the claim relied on this evidence type
      const hasEvidenceType = originalResult.verificationMethods.some(method => {
        switch (evidenceType) {
          case EvidenceType.DATABASE_REALITY:
            return method.includes('Database');
          case EvidenceType.CODE_EXECUTION:
            return method.includes('Code');
          case EvidenceType.FILESYSTEM_EVIDENCE:
            return method.includes('File');
          case EvidenceType.API_RESPONSE:
            return method.includes('API');
          default:
            return false;
        }
      });

      if (hasEvidenceType) {
        scenarioConfidence *= (1 - scenario.confidenceImpact);
      }
    }

    // Add some uncertainty based on scenario probability
    const uncertaintyFactor = 1 - (scenario.probability * 0.2);
    scenarioConfidence *= uncertaintyFactor;

    return Math.max(0, scenarioConfidence);
  }

  private calculateResilienceScore(originalResult: ConfidenceResult, scenarios: string[]): number {
    let totalResilience = 0;
    let scenarioCount = 0;

    for (const scenarioId of scenarios) {
      const scenario = this.failureScenarios.get(scenarioId);
      if (!scenario) continue;

      const scenarioConfidence = this.calculateScenarioConfidence(originalResult, scenario);
      const resilienceImpact = 1 - (originalResult.adjustedConfidence - scenarioConfidence);
      totalResilience += resilienceImpact;
      scenarioCount++;
    }

    return scenarioCount > 0 ? totalResilience / scenarioCount : 1;
  }

  private calculateRiskLevel(confidenceDelta: number, criticalFailures: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidenceDelta > 0.5 || criticalFailures > 2) return 'critical';
    if (confidenceDelta > 0.3 || criticalFailures > 1) return 'high';
    if (confidenceDelta > 0.1) return 'medium';
    return 'low';
  }

  private performSensitivityAnalysis(
    originalResult: ConfidenceResult,
    scenarios: string[]
  ): CounterfactualResult['sensitivityAnalysis'] {
    const factorImpacts: Array<{factor: string; impact: number; description: string}> = [];
    const stabilityFactors: string[] = [];
    const vulnerabilityFactors: string[] = [];

    // Analyze impact of each evidence type
    const evidenceTypeImpacts: Record<string, number> = {};

    for (const scenarioId of scenarios) {
      const scenario = this.failureScenarios.get(scenarioId);
      if (!scenario) continue;

      for (const evidenceType of scenario.affectedEvidenceTypes) {
        if (!evidenceTypeImpacts[evidenceType]) {
          evidenceTypeImpacts[evidenceType] = 0;
        }
        evidenceTypeImpacts[evidenceType] += scenario.confidenceImpact * scenario.probability;
      }
    }

    // Convert to factor impacts
    for (const [evidenceType, impact] of Object.entries(evidenceTypeImpacts)) {
      factorImpacts.push({
        factor: evidenceType,
        impact,
        description: `Evidence type ${evidenceType} contributes ${Math.round(impact * 100)}% to confidence vulnerability`
      });
    }

    // Sort by impact
    factorImpacts.sort((a, b) => b.impact - a.impact);

    // Identify stability factors (low impact)
    stabilityFactors.push(...factorImpacts.filter(f => f.impact < 0.1).map(f => f.factor));

    // Identify vulnerability factors (high impact)
    vulnerabilityFactors.push(...factorImpacts.filter(f => f.impact > 0.3).map(f => f.factor));

    return {
      mostImpactfulFactors: factorImpacts.slice(0, 5),
      stabilityFactors,
      vulnerabilityFactors
    };
  }

  private runMonteCarloSimulation(
    originalResult: ConfidenceResult,
    scenarios: string[],
    simulations: number = 1000
  ): CounterfactualResult['monteCarloResults'] {
    const results: number[] = [];

    for (let i = 0; i < simulations; i++) {
      let simulationConfidence = originalResult.adjustedConfidence;

      // Randomly apply scenarios based on their probability
      for (const scenarioId of scenarios) {
        const scenario = this.failureScenarios.get(scenarioId);
        if (!scenario) continue;

        // Monte Carlo: determine if scenario occurs in this simulation
        if (Math.random() < scenario.probability) {
          simulationConfidence = this.calculateScenarioConfidence(originalResult, scenario);
        }
      }

      results.push(simulationConfidence);
    }

    // Calculate statistics
    results.sort((a, b) => a - b);
    const meanConfidence = results.reduce((sum, r) => sum + r, 0) / results.length;
    const lowerIndex = Math.floor(results.length * 0.025); // 2.5th percentile
    const upperIndex = Math.floor(results.length * 0.975); // 97.5th percentile
    const confidenceInterval: [number, number] = [results[lowerIndex], results[upperIndex]];
    const probabilityOfSuccess = results.filter(r => r > 0.7).length / results.length;

    return {
      simulations,
      meanConfidence,
      confidenceInterval,
      probabilityOfSuccess
    };
  }

  async performRiskAssessment(
    claim: string,
    originalResult: ConfidenceResult
  ): Promise<RiskAssessment> {
    const scenarios = Array.from(this.failureScenarios.values());

    // Calculate risk scores for each scenario
    const scenarioRisks = scenarios.map(scenario => ({
      scenario: scenario.name,
      probability: scenario.probability,
      impact: scenario.confidenceImpact,
      riskScore: scenario.probability * scenario.confidenceImpact,
      mitigations: scenario.mitigations
    }));

    // Sort by risk score
    scenarioRisks.sort((a, b) => b.riskScore - a.riskScore);
    const topRisks = scenarioRisks.slice(0, 5);

    // Categorize risks
    const riskCategories = {
      technical: this.calculateCategoryRisk(scenarios, ['database_corruption', 'api_timeout', 'code_execution_failure', 'filesystem_inaccessibility']),
      operational: this.calculateCategoryRisk(scenarios, ['memory_exhaustion', 'network_partition']),
      environmental: this.calculateCategoryRisk(scenarios, ['configuration_error']),
      human: this.calculateCategoryRisk(scenarios, ['verification_logic_error'])
    };

    const overallRiskScore = Math.max(...Object.values(riskCategories));

    // Create risk matrix
    const riskMatrix = this.createRiskMatrix(scenarioRisks);

    // Calculate residual risk after mitigations
    const residualRisk = this.calculateResidualRisk(scenarioRisks);

    // Set risk tolerance (adjustable based on organizational preferences)
    const riskTolerance = 0.3; // 30% risk tolerance

    const assessment: RiskAssessment = {
      overallRiskScore,
      riskCategories,
      topRisks,
      riskMatrix,
      residualRisk,
      riskTolerance
    };

    // Store assessment
    this.storeRiskAssessment(claim, assessment);

    return assessment;
  }

  private calculateCategoryRisk(scenarios: FailureScenario[], scenarioIds: string[]): number {
    const categoryScenarios = scenarios.filter(s => scenarioIds.includes(s.id));
    return categoryScenarios.reduce((sum, s) => sum + (s.probability * s.confidenceImpact), 0);
  }

  private createRiskMatrix(scenarioRisks: any[]): RiskAssessment['riskMatrix'] {
    const matrix: RiskAssessment['riskMatrix'] = [];

    const probabilityLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const impactLevels: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];

    for (const probLevel of probabilityLevels) {
      for (const impactLevel of impactLevels) {
        const scenarios = scenarioRisks
          .filter(r => this.getRiskLevel(r.probability) === probLevel)
          .filter(r => this.getImpactLevel(r.impact) === impactLevel)
          .map(r => r.scenario);

        if (scenarios.length > 0) {
          matrix.push({
            probability: probLevel,
            impact: impactLevel,
            scenarios
          });
        }
      }
    }

    return matrix;
  }

  private getRiskLevel(probability: number): 'low' | 'medium' | 'high' {
    if (probability < 0.1) return 'low';
    if (probability < 0.3) return 'medium';
    return 'high';
  }

  private getImpactLevel(impact: number): 'low' | 'medium' | 'high' | 'critical' {
    if (impact < 0.3) return 'low';
    if (impact < 0.6) return 'medium';
    if (impact < 0.8) return 'high';
    return 'critical';
  }

  private calculateResidualRisk(scenarioRisks: any[]): number {
    // Assume mitigations reduce risk by 50% on average
    const mitigationEffectiveness = 0.5;
    return scenarioRisks.reduce((sum, r) => sum + (r.riskScore * (1 - mitigationEffectiveness)), 0);
  }

  private storeCounterfactualResult(claim: string, result: CounterfactualResult): void {
    const stmt = this.db.prepare(`
      INSERT INTO counterfactual_analysis (
        claim, original_confidence, scenario_confidence, confidence_delta,
        resilience_score, risk_level, sensitivity_analysis, monte_carlo_results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      claim,
      result.originalConfidence,
      result.scenarioConfidence,
      result.confidenceDelta,
      result.resilienceScore,
      result.riskLevel,
      JSON.stringify(result.sensitivityAnalysis),
      JSON.stringify(result.monteCarloResults)
    );
  }

  private storeRiskAssessment(claim: string, assessment: RiskAssessment): void {
    const stmt = this.db.prepare(`
      INSERT INTO risk_assessment_log (
        claim, overall_risk_score, risk_categories, top_risks,
        risk_matrix, residual_risk, risk_tolerance
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      claim,
      assessment.overallRiskScore,
      JSON.stringify(assessment.riskCategories),
      JSON.stringify(assessment.topRisks),
      JSON.stringify(assessment.riskMatrix),
      assessment.residualRisk,
      assessment.riskTolerance
    );
  }

  // Get comprehensive counterfactual analysis report
  async getCounterfactualReport(claim: string, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    recentAnalyses: CounterfactualResult[];
    riskTrends: Array<{
      date: Date;
      overallRisk: number;
      topRiskFactors: string[];
    }>;
    scenarioEffectiveness: Array<{
      scenarioId: string;
      scenarioName: string;
      frequency: number;
      averageImpact: number;
      mitigationEffectiveness: number;
    }>;
    recommendations: string[];
  }> {
    const timeFilter = this.getTimeFilter(timeRange);

    // Get recent analyses
    const analysesStmt = this.db.prepare(`
      SELECT * FROM counterfactual_analysis
      WHERE claim = ? AND created_at > ${timeFilter}
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const rawAnalyses = analysesStmt.all(claim) as {
      original_confidence: number;
      scenario_confidence: number;
      confidence_delta: number;
      resilience_score: number;
      risk_level: string;
      sensitivity_analysis: string;
      monte_carlo_results: string;
    }[];

    const recentAnalyses = rawAnalyses.map(a => ({
      originalConfidence: a.original_confidence,
      scenarioConfidence: a.scenario_confidence,
      confidenceDelta: a.confidence_delta,
      resilienceScore: a.resilience_score,
      riskLevel: a.risk_level,
      criticalFailurePoints: JSON.parse(a.sensitivity_analysis || '{}')?.vulnerabilityFactors || [],
      recommendedMitigations: JSON.parse(a.sensitivity_analysis || '{}')?.mostImpactfulFactors?.map((f: any) => f.factor) || [],
      sensitivityAnalysis: JSON.parse(a.sensitivity_analysis || '{}'),
      monteCarloResults: JSON.parse(a.monte_carlo_results || '{}')
    }));

    // Get risk trends
    const trendsStmt = this.db.prepare(`
      SELECT
        DATE(created_at) as date,
        AVG(confidence_delta) as overall_risk
      FROM counterfactual_analysis
      WHERE claim = ? AND created_at > ${timeFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const rawTrends = trendsStmt.all(claim) as {
      date: string;
      overall_risk: number;
    }[];

    const riskTrends = rawTrends.map(t => ({
      date: new Date(t.date),
      overallRisk: t.overall_risk,
      topRiskFactors: [] // Would need more detailed analysis
    }));

    // Get scenario effectiveness
    const effectivenessStmt = this.db.prepare(`
      SELECT
        scenario_id,
        COUNT(*) as frequency,
        AVG(confidence_delta) as average_impact
      FROM counterfactual_analysis
      WHERE claim = ? AND created_at > ${timeFilter}
      GROUP BY scenario_id
      ORDER BY frequency DESC
    `);

    const rawEffectiveness = effectivenessStmt.all(claim) as {
      scenario_id: string;
      frequency: number;
      average_impact: number;
    }[];

    const scenarioEffectiveness = rawEffectiveness.map(e => {
      const scenario = this.failureScenarios.get(e.scenario_id);
      return {
        scenarioId: e.scenario_id,
        scenarioName: scenario?.name || e.scenario_id,
        frequency: e.frequency,
        averageImpact: e.average_impact,
        mitigationEffectiveness: 0.7 // Would be calculated from actual mitigation data
      };
    });

    // Generate recommendations
    const recommendations = this.generateCounterfactualRecommendations(recentAnalyses, scenarioEffectiveness);

    return {
      recentAnalyses,
      riskTrends,
      scenarioEffectiveness,
      recommendations
    };
  }

  private getTimeFilter(timeRange: 'day' | 'week' | 'month'): string {
    const intervals = {
      day: "datetime('now', '-1 day')",
      week: "datetime('now', '-7 days')",
      month: "datetime('now', '-30 days')"
    };
    return intervals[timeRange];
  }

  private generateCounterfactualRecommendations(
    analyses: CounterfactualResult[],
    scenarioEffectiveness: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Based on recent risk levels
    const highRiskCount = analyses.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length;
    if (highRiskCount > analyses.length * 0.5) {
      recommendations.push('High risk levels detected - immediate mitigation actions required');
    }

    // Based on resilience scores
    const avgResilience = analyses.reduce((sum, a) => sum + a.resilienceScore, 0) / analyses.length;
    if (avgResilience < 0.7) {
      recommendations.push('Low system resilience - implement additional safeguards and redundancy');
    }

    // Based on Monte Carlo results
    const lowSuccessProbability = analyses.filter(a => a.monteCarloResults.probabilityOfSuccess < 0.8).length;
    if (lowSuccessProbability > 0) {
      recommendations.push('Low probability of success in failure scenarios - review system architecture');
    }

    // Based on frequent failure scenarios
    const frequentScenarios = scenarioEffectiveness.filter(s => s.frequency > 3);
    if (frequentScenarios.length > 0) {
      recommendations.push(`${frequentScenarios.length} scenarios showing frequent occurrence - prioritize mitigation efforts`);
    }

    if (recommendations.length === 0) {
      recommendations.push('System resilience is within acceptable parameters - continue monitoring');
    }

    return recommendations;
  }
}

export default CounterfactualAnalysisSystem;