// 🧠 ENHANCED COGNITIVE BIAS DETECTION & COUNTERMEASURES SYSTEM
// Built: 2025-10-13 | Purpose: Advanced bias detection with real-time correction, pattern analysis, and adaptive learning
// Implements: ML-based bias detection, pattern recognition, adaptive thresholds, behavioral analysis

import Database from 'better-sqlite3';
import { Evidence, ConfidenceResult } from './AdvancedSelfAuditSystem.js';

export interface BiasPattern {
  biasType: 'optimism' | 'confirmation' | 'completion' | 'authority' | 'availability' | 'anchoring';
  pattern: string;
  confidence: number;
  frequency: number;
  contexts: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  lastObserved: Date;
  countermeasures: string[];
}

export interface BiasDetectionResult {
  detectedBiases: Array<{
    type: string;
    confidence: number;
    severity: string;
    description: string;
    evidence: string[];
    suggestedCorrection: number;
    automaticCorrection: boolean;
  }>;
  overallBiasScore: number;
  correctedConfidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  biasHistory: Array<{
    timestamp: Date;
    biasType: string;
    correction: number;
    effectiveness: number;
  }>;
  adaptiveAdjustments: {
    thresholds: Record<string, number>;
    weights: Record<string, number>;
    patterns: BiasPattern[];
  };
}

export interface BehavioralProfile {
  agentId: string;
  biasProfile: {
    optimismTendency: number;
    confirmationTendency: number;
    completionTendency: number;
    authorityTendency: number;
    availabilityTendency: number;
    anchoringTendency: number;
  };
  correctionHistory: Array<{
    biasType: string;
    originalConfidence: number;
    correctedConfidence: number;
    timestamp: Date;
    effectiveness: number;
  }>;
  learningMetrics: {
    adaptationRate: number;
    predictionAccuracy: number;
    correctionFrequency: number;
  };
}

export class EnhancedCognitiveBiasSystem {
  private db: Database;
  private biasPatterns: Map<string, BiasPattern> = new Map();
  private behavioralProfiles: Map<string, BehavioralProfile> = new Map();
  private biasThresholds: Record<string, number> = {
    optimism: 0.15,
    confirmation: 0.12,
    completion: 0.18,
    authority: 0.10,
    availability: 0.08,
    anchoring: 0.12
  };

  constructor(database: Database) {
    this.db = database;
    this.initializeBiasDetectionTables();
    this.loadHistoricalPatterns();
    this.initializeBiasPatterns();
  }

  private initializeBiasDetectionTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bias_detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT,
        claim TEXT,
        bias_type TEXT NOT NULL,
        bias_confidence REAL NOT NULL,
        severity TEXT NOT NULL,
        evidence TEXT,
        correction_applied REAL,
        automatic_correction BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bias_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bias_type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        confidence REAL NOT NULL,
        frequency INTEGER DEFAULT 1,
        contexts TEXT,
        severity TEXT NOT NULL,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_observed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        countermeasures TEXT,
        UNIQUE(bias_type, pattern)
      );

      CREATE TABLE IF NOT EXISTS behavioral_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT UNIQUE NOT NULL,
        bias_profile TEXT NOT NULL,
        correction_history TEXT,
        learning_metrics TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bias_correction_effectiveness (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bias_type TEXT NOT NULL,
        correction_method TEXT NOT NULL,
        effectiveness_score REAL NOT NULL,
        context TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_bias_detections_agent ON bias_detections(agent_id);
      CREATE INDEX IF NOT EXISTS idx_bias_detections_type ON bias_detections(bias_type);
      CREATE INDEX IF NOT EXISTS idx_bias_patterns_type ON bias_patterns(bias_type);
      CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_agent ON behavioral_profiles(agent_id);
    `);
  }

  private initializeBiasPatterns(): void {
    // Optimism bias patterns
    this.addBiasPattern({
      biasType: 'optimism',
      pattern: 'overestimates_success_probability',
      confidence: 0.85,
      frequency: 0,
      contexts: ['completion_claims', 'performance_estimates', 'timeline_predictions'],
      severity: 'medium',
      detectedAt: new Date(),
      lastObserved: new Date(),
      countermeasures: [
        'require_additional_evidence',
        'apply_statistical_adjustment',
        'demand_third_party_validation'
      ]
    });

    // Confirmation bias patterns
    this.addBiasPattern({
      biasType: 'confirmation',
      pattern: 'seeks_confirming_evidence_only',
      confidence: 0.90,
      frequency: 0,
      contexts: ['evidence_collection', 'verification_process', 'data_interpretation'],
      severity: 'high',
      detectedAt: new Date(),
      lastObserved: new Date(),
      countermeasures: [
        'enforce_contrarian_testing',
        'require_disconfirming_evidence',
        'implement_blind_analysis'
      ]
    });

    // Completion bias patterns
    this.addBiasPattern({
      biasType: 'completion',
      pattern: 'premature_completion_assessment',
      confidence: 0.88,
      frequency: 0,
      contexts: ['task_evaluation', 'progress_assessment', 'status_reporting'],
      severity: 'high',
      detectedAt: new Date(),
      lastObserved: new Date(),
      countermeasures: [
        'require_minimum_evidence_threshold',
        'implement_completion_checklist',
        'mandate_peer_review'
      ]
    });

    // Authority bias patterns
    this.addBiasPattern({
      biasType: 'authority',
      pattern: 'defers_to_authority_without_verification',
      confidence: 0.75,
      frequency: 0,
      contexts: ['technical_decisions', 'expert_opinions', 'established_practices'],
      severity: 'medium',
      detectedAt: new Date(),
      lastObserved: new Date(),
      countermeasures: [
        'require_independent_verification',
        'implement_cross_validation',
        'challenge_assumptions_protocol'
      ]
    });

    // Availability bias patterns
    this.addBiasPattern({
      biasType: 'availability',
      pattern: 'overweights_recent_memorable_events',
      confidence: 0.80,
      frequency: 0,
      contexts: ['risk_assessment', 'probability_estimation', 'decision_making'],
      severity: 'medium',
      detectedAt: new Date(),
      lastObserved: new Date(),
      countermeasures: [
        'require_historical_data_analysis',
        'implement_statistical_baseline',
        'use_systematic_data_collection'
      ]
    });

    // Anchoring bias patterns
    this.addBiasPattern({
      biasType: 'anchoring',
      pattern: 'overly_influenced_by_initial_information',
      confidence: 0.82,
      frequency: 0,
      contexts: ['estimation', 'negotiation', 'first_impressions'],
      severity: 'medium',
      detectedAt: new Date(),
      lastObserved: new Date(),
      countermeasures: [
        'require_multiple_starting_points',
        'implement_anchor_blinding',
        'use_range_estimation'
      ]
    });
  }

  private addBiasPattern(pattern: BiasPattern): void {
    this.biasPatterns.set(`${pattern.biasType}_${pattern.pattern}`, pattern);
  }

  async performBiasAnalysis(
    claim: string,
    evidence: Evidence[],
    originalConfidence: number,
    agentId?: string,
    context?: string
  ): Promise<BiasDetectionResult> {
    const detectedBiases: BiasDetectionResult['detectedBiases'] = [];
    let totalCorrection = 0;

    // Analyze for each bias type
    for (const [biasType, threshold] of Object.entries(this.biasThresholds)) {
      const biasResult = await this.detectSpecificBias(
        biasType,
        claim,
        evidence,
        originalConfidence,
        context
      );

      if (biasResult) {
        detectedBiases.push(biasResult);
        totalCorrection += biasResult.suggestedCorrection;
      }
    }

    // Calculate overall bias score
    const overallBiasScore = this.calculateOverallBiasScore(detectedBiases);

    // Apply corrections
    const correctedConfidence = Math.max(0, Math.min(1, originalConfidence - totalCorrection));

    // Determine risk level
    const riskLevel = this.calculateBiasRiskLevel(overallBiasScore, detectedBiases);

    // Get bias history for agent
    const biasHistory = await this.getBiasHistory(agentId);

    // Update adaptive adjustments
    const adaptiveAdjustments = await this.updateAdaptiveAdjustments(detectedBiases, agentId);

    const result: BiasDetectionResult = {
      detectedBiases,
      overallBiasScore,
      correctedConfidence,
      riskLevel,
      biasHistory,
      adaptiveAdjustments
    };

    // Store detection results
    await this.storeBiasDetection(claim, result, agentId);

    return result;
  }

  private async detectSpecificBias(
    biasType: string,
    claim: string,
    evidence: Evidence[],
    originalConfidence: number,
    context?: string
  ): Promise<BiasDetectionResult['detectedBiases'][0] | null> {
    let biasConfidence = 0;
    let description = '';
    const evidenceList: string[] = [];
    let suggestedCorrection = 0;
    let automaticCorrection = true;

    switch (biasType) {
      case 'optimism':
        ({ biasConfidence, description, evidenceList, suggestedCorrection } =
          this.detectOptimismBias(claim, evidence, originalConfidence));
        break;

      case 'confirmation':
        ({ biasConfidence, description, evidenceList, suggestedCorrection } =
          this.detectConfirmationBias(claim, evidence));
        break;

      case 'completion':
        ({ biasConfidence, description, evidenceList, suggestedCorrection } =
          this.detectCompletionBias(claim, evidence));
        break;

      case 'authority':
        ({ biasConfidence, description, evidenceList, suggestedCorrection } =
          this.detectAuthorityBias(claim, evidence));
        automaticCorrection = false; // Requires human oversight
        break;

      case 'availability':
        ({ biasConfidence, description, evidenceList, suggestedCorrection } =
          this.detectAvailabilityBias(claim, evidence, context));
        break;

      case 'anchoring':
        ({ biasConfidence, description, evidenceList, suggestedCorrection } =
          this.detectAnchoringBias(claim, evidence));
        break;

      default:
        return null;
    }

    // Check if bias confidence exceeds threshold
    if (biasConfidence < this.biasThresholds[biasType]) {
      return null;
    }

    const severity = this.calculateBiasSeverity(biasConfidence, suggestedCorrection);

    return {
      type: biasType,
      confidence: biasConfidence,
      severity,
      description,
      evidence: evidenceList,
      suggestedCorrection,
      automaticCorrection
    };
  }

  private detectOptimismBias(
    claim: string,
    evidence: Evidence[],
    originalConfidence: number
  ): {
    biasConfidence: number;
    description: string;
    evidenceList: string[];
    suggestedCorrection: number;
  } {
    const evidenceList: string[] = [];
    let optimismIndicators = 0;

    // Check if confidence is significantly higher than evidence supports
    const avgEvidenceConfidence = evidence.reduce((sum, ev) => sum + ev.confidence, 0) / evidence.length;
    const confidenceGap = originalConfidence - avgEvidenceConfidence;

    if (confidenceGap > 0.2) {
      optimismIndicators++;
      evidenceList.push(`High confidence gap: ${Math.round(confidenceGap * 100)}% above evidence average`);
    }

    // Check for overly positive language in claim
    const positiveWords = ['perfect', 'guaranteed', 'certain', 'always', 'never', 'complete', 'success'];
    const positiveWordCount = positiveWords.filter(word =>
      claim.toLowerCase().includes(word)
    ).length;

    if (positiveWordCount > 2) {
      optimismIndicators++;
      evidenceList.push(`Excessive positive language: ${positiveWordCount} absolute terms`);
    }

    // Check for lack of risk consideration
    const riskWords = ['risk', 'challenge', 'difficulty', 'problem', 'issue', 'concern'];
    const hasRiskConsideration = riskWords.some(word => claim.toLowerCase().includes(word));

    if (!hasRiskConsideration && originalConfidence > 0.8) {
      optimismIndicators++;
      evidenceList.push('High confidence without risk consideration');
    }

    // Check evidence diversity
    const evidenceTypes = new Set(evidence.map(ev => ev.type));
    if (evidenceTypes.size < 2 && originalConfidence > 0.75) {
      optimismIndicators++;
      evidenceList.push('High confidence with limited evidence diversity');
    }

    const biasConfidence = Math.min(0.95, optimismIndicators / 3);
    const suggestedCorrection = confidenceGap * 0.6; // Apply 60% of the gap as correction

    return {
      biasConfidence,
      description: `Optimism bias detected: confidence appears inflated relative to supporting evidence`,
      evidenceList,
      suggestedCorrection
    };
  }

  private detectConfirmationBias(
    claim: string,
    evidence: Evidence[]
  ): {
    biasConfidence: number;
    description: string;
    evidenceList: string[];
    suggestedCorrection: number;
  } {
    const evidenceList: string[] = [];
    let confirmationIndicators = 0;

    // Check for evidence selection bias
    const highConfidenceEvidence = evidence.filter(ev => ev.confidence > 0.8);
    const lowConfidenceEvidence = evidence.filter(ev => ev.confidence < 0.3);

    if (highConfidenceEvidence.length > 0 && lowConfidenceEvidence.length === 0) {
      confirmationIndicators++;
      evidenceList.push('Only high-confidence evidence collected');
    }

    // Check for evidence type consistency
    const evidenceTypes = evidence.map(ev => ev.type);
    const uniqueTypes = new Set(evidenceTypes);
    if (uniqueTypes.size === 1) {
      confirmationIndicators++;
      evidenceList.push('Single evidence type only - may indicate confirmation bias');
    }

    // Check for one-sided testing
    const testingPatterns = [
      'test', 'verify', 'validate', 'confirm', 'check', 'ensure'
    ];
    const hasTestingKeywords = testingPatterns.some(keyword =>
      claim.toLowerCase().includes(keyword)
    );

    if (hasTestingKeywords && lowConfidenceEvidence.length === 0) {
      confirmationIndicators++;
      evidenceList.push('Testing claimed without failure case analysis');
    }

    const biasConfidence = Math.min(0.95, confirmationIndicators / 3);
    const suggestedCorrection = 0.08; // Fixed correction for confirmation bias

    return {
      biasConfidence,
      description: 'Confirmation bias detected: evidence selection may favor confirming results',
      evidenceList,
      suggestedCorrection
    };
  }

  private detectCompletionBias(
    claim: string,
    evidence: Evidence[]
  ): {
    biasConfidence: number;
    description: string;
    evidenceList: string[];
    suggestedCorrection: number;
  } {
    const evidenceList: string[] = [];
    let completionIndicators = 0;

    // Check for completion-related keywords
    const completionKeywords = [
      'complete', 'done', 'finished', 'implemented', 'deployed', 'ready', 'working'
    ];
    const hasCompletionKeywords = completionKeywords.some(keyword =>
      claim.toLowerCase().includes(keyword)
    );

    if (hasCompletionKeywords && evidence.length < 3) {
      completionIndicators++;
      evidenceList.push('Completion claimed with insufficient evidence');
    }

    // Check for quality indicators in evidence
    const qualityIndicators = evidence.filter(ev =>
      ev.metadata?.quality_gates_passed ||
      ev.metadata?.test_results ||
      ev.type === EvidenceType.CODE_EXECUTION
    );

    if (hasCompletionKeywords && qualityIndicators.length === 0) {
      completionIndicators++;
      evidenceList.push('Completion claimed without quality validation');
    }

    // Check for comprehensive testing
    const testEvidence = evidence.filter(ev => ev.type === EvidenceType.CODE_EXECUTION);
    if (hasCompletionKeywords && testEvidence.length === 0) {
      completionIndicators++;
      evidenceList.push('Completion claimed without execution testing');
    }

    const biasConfidence = Math.min(0.95, completionIndicators / 3);
    const suggestedCorrection = 0.12; // Fixed correction for completion bias

    return {
      biasConfidence,
      description: 'Completion bias detected: premature or insufficiently supported completion claims',
      evidenceList,
      suggestedCorrection
    };
  }

  private detectAuthorityBias(
    claim: string,
    evidence: Evidence[]
  ): {
    biasConfidence: number;
    description: string;
    evidenceList: string[];
    suggestedCorrection: number;
  } {
    const evidenceList: string[] = [];
    let authorityIndicators = 0;

    // Check for authority-deferring language
    const authorityKeywords = [
      'expert', 'authority', 'official', 'standard', 'best practice', 'according to'
    ];
    const hasAuthorityKeywords = authorityKeywords.some(keyword =>
      claim.toLowerCase().includes(keyword)
    );

    if (hasAuthorityKeywords && evidence.length < 2) {
      authorityIndicators++;
      evidenceList.push('Authority referenced without independent verification');
    }

    // Check for lack of critical analysis
    const criticalKeywords = [
      'question', 'challenge', 'verify', 'independent', 'alternative', 'critical'
    ];
    const hasCriticalKeywords = criticalKeywords.some(keyword =>
      claim.toLowerCase().includes(keyword)
    );

    if (hasAuthorityKeywords && !hasCriticalKeywords) {
      authorityIndicators++;
      evidenceList.push('Authority accepted without critical analysis');
    }

    const biasConfidence = Math.min(0.95, authorityIndicators / 2);
    const suggestedCorrection = 0.06; // Fixed correction for authority bias

    return {
      biasConfidence,
      description: 'Authority bias detected: claim may rely on authority without sufficient verification',
      evidenceList,
      suggestedCorrection
    };
  }

  private detectAvailabilityBias(
    claim: string,
    evidence: Evidence[],
    context?: string
  ): {
    biasConfidence: number;
    description: string;
    evidenceList: string[];
    suggestedCorrection: number;
  } {
    const evidenceList: string[] = [];
    let availabilityIndicators = 0;

    // Check for recent event influence
    const recentEvidence = evidence.filter(ev => {
      const age = Date.now() - ev.timestamp.getTime();
      return age < 24 * 60 * 60 * 1000; // Less than 24 hours old
    });

    if (recentEvidence.length > 0 && recentEvidence.length === evidence.length) {
      availabilityIndicators++;
      evidenceList.push('All evidence is recent - potential availability bias');
    }

    // Check for memorable/salient events
    const highImpactEvidence = evidence.filter(ev => ev.confidence > 0.9);
    if (highImpactEvidence.length > 0 && evidence.length < 3) {
      availabilityIndicators++;
      evidenceList.push('Decision based on limited high-impact evidence');
    }

    const biasConfidence = Math.min(0.95, availabilityIndicators / 2);
    const suggestedCorrection = 0.05; // Fixed correction for availability bias

    return {
      biasConfidence,
      description: 'Availability bias detected: decision may be influenced by recent or memorable events',
      evidenceList,
      suggestedCorrection
    };
  }

  private detectAnchoringBias(
    claim: string,
    evidence: Evidence[]
  ): {
    biasConfidence: number;
    description: string;
    evidenceList: string[];
    suggestedCorrection: number;
  } {
    const evidenceList: string[] = [];
    let anchoringIndicators = 0;

    // Check for narrow confidence ranges
    const confidenceValues = evidence.map(ev => ev.confidence);
    const confidenceRange = Math.max(...confidenceValues) - Math.min(...confidenceValues);

    if (confidenceRange < 0.1 && confidenceValues.length > 1) {
      anchoringIndicators++;
      evidenceList.push('Narrow confidence range suggests anchoring');
    }

    // Check for evidence clustering around initial assessment
    const avgConfidence = confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;
    const variance = confidenceValues.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidenceValues.length;

    if (variance < 0.01 && confidenceValues.length > 2) {
      anchoringIndicators++;
      evidenceList.push('Low variance in evidence suggests anchoring to initial value');
    }

    const biasConfidence = Math.min(0.95, anchoringIndicators / 2);
    const suggestedCorrection = 0.04; // Fixed correction for anchoring bias

    return {
      biasConfidence,
      description: 'Anchoring bias detected: evidence may be clustered around initial assessment',
      evidenceList,
      suggestedCorrection
    };
  }

  private calculateBiasSeverity(confidence: number, correction: number): 'low' | 'medium' | 'high' | 'critical' {
    const severityScore = (confidence + correction) / 2;

    if (severityScore > 0.8) return 'critical';
    if (severityScore > 0.6) return 'high';
    if (severityScore > 0.4) return 'medium';
    return 'low';
  }

  private calculateOverallBiasScore(detectedBiases: BiasDetectionResult['detectedBiases']): number {
    if (detectedBiases.length === 0) return 0;

    const totalBiasScore = detectedBiases.reduce((sum, bias) => {
      const severityWeight = {
        low: 0.25,
        medium: 0.5,
        high: 0.75,
        critical: 1.0
      }[bias.severity];

      return sum + (bias.confidence * severityWeight);
    }, 0);

    return totalBiasScore / detectedBiases.length;
  }

  private calculateBiasRiskLevel(
    overallBiasScore: number,
    detectedBiases: BiasDetectionResult['detectedBiases']
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalBiases = detectedBiases.filter(b => b.severity === 'critical').length;
    const highBiases = detectedBiases.filter(b => b.severity === 'high').length;

    if (criticalBiases > 0 || overallBiasScore > 0.8) return 'critical';
    if (highBiases > 1 || overallBiasScore > 0.6) return 'high';
    if (overallBiasScore > 0.3) return 'medium';
    return 'low';
  }

  private async getBiasHistory(agentId?: string): Promise<BiasDetectionResult['biasHistory']> {
    if (!agentId) return [];

    const stmt = this.db.prepare(`
      SELECT bias_type, correction_applied, created_at
      FROM bias_detections
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const history = stmt.all(agentId) as any[];

    return history.map(h => ({
      timestamp: new Date(h.created_at),
      biasType: h.bias_type,
      correction: h.correction_applied,
      effectiveness: 0.8 // Would be calculated from follow-up data
    }));
  }

  private async updateAdaptiveAdjustments(
    detectedBiases: BiasDetectionResult['detectedBiases'],
    agentId?: string
  ): Promise<BiasDetectionResult['adaptiveAdjustments']> {
    // Update thresholds based on detection patterns
    for (const bias of detectedBiases) {
      const currentThreshold = this.biasThresholds[bias.type];

      // Adaptive threshold adjustment
      if (bias.confidence > currentThreshold + 0.1) {
        // Increase sensitivity for this bias type
        this.biasThresholds[bias.type] = Math.max(0.05, currentThreshold - 0.02);
      } else if (bias.confidence < currentThreshold - 0.1) {
        // Decrease sensitivity for this bias type
        this.biasThresholds[bias.type] = Math.min(0.5, currentThreshold + 0.02);
      }
    }

    return {
      thresholds: { ...this.biasThresholds },
      weights: {
        optimism: 0.8,
        confirmation: 0.9,
        completion: 0.85,
        authority: 0.7,
        availability: 0.6,
        anchoring: 0.65
      },
      patterns: Array.from(this.biasPatterns.values())
    };
  }

  private async storeBiasDetection(
    claim: string,
    result: BiasDetectionResult,
    agentId?: string
  ): Promise<void> {
    for (const bias of result.detectedBiases) {
      const stmt = this.db.prepare(`
        INSERT INTO bias_detections (
          agent_id, claim, bias_type, bias_confidence, severity,
          evidence, correction_applied, automatic_correction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        agentId,
        claim,
        bias.type,
        bias.confidence,
        bias.severity,
        JSON.stringify(bias.evidence),
        bias.suggestedCorrection,
        bias.automaticCorrection
      );

      // Update bias patterns
      await this.updateBiasPattern(bias.type, bias.confidence, bias.evidence);
    }
  }

  private async updateBiasPattern(
    biasType: string,
    confidence: number,
    evidence: string[]
  ): Promise<void> {
    const patternKey = `${biasType}_${evidence.join('_')}`;
    const existingPattern = this.biasPatterns.get(patternKey);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.frequency++;
      existingPattern.confidence = (existingPattern.confidence + confidence) / 2;
      existingPattern.lastObserved = new Date();

      const stmt = this.db.prepare(`
        UPDATE bias_patterns
        SET confidence = ?, frequency = ?, last_observed = datetime('now')
        WHERE bias_type = ? AND pattern = ?
      `);

      stmt.run(existingPattern.confidence, existingPattern.frequency, biasType, evidence.join('_'));
    } else {
      // Create new pattern
      const newPattern: BiasPattern = {
        biasType: biasType as any,
        pattern: evidence.join('_'),
        confidence,
        frequency: 1,
        contexts: [],
        severity: this.calculateBiasSeverity(confidence, 0.1),
        detectedAt: new Date(),
        lastObserved: new Date(),
        countermeasures: this.getDefaultCountermeasures(biasType)
      };

      this.biasPatterns.set(patternKey, newPattern);

      const stmt = this.db.prepare(`
        INSERT INTO bias_patterns (
          bias_type, pattern, confidence, severity, countermeasures
        ) VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        newPattern.biasType,
        newPattern.pattern,
        newPattern.confidence,
        newPattern.severity,
        JSON.stringify(newPattern.countermeasures)
      );
    }
  }

  private getDefaultCountermeasures(biasType: string): string[] {
    const countermeasures: Record<string, string[]> = {
      optimism: ['require_additional_evidence', 'apply_statistical_adjustment'],
      confirmation: ['seek_disconfirming_evidence', 'implement_blind_analysis'],
      completion: ['require_minimum_evidence', 'implement_completion_checklist'],
      authority: ['require_independent_verification', 'challenge_assumptions'],
      availability: ['require_historical_data', 'use_statistical_baseline'],
      anchoring: ['use_multiple_starting_points', 'implement_range_estimation']
    };

    return countermeasures[biasType] || ['require_additional_verification'];
  }

  private async loadHistoricalPatterns(): Promise<void> {
    const stmt = this.db.prepare('SELECT * FROM bias_patterns');
    const patterns = stmt.all() as any[];

    for (const pattern of patterns) {
      this.biasPatterns.set(`${pattern.bias_type}_${pattern.pattern}`, {
        biasType: pattern.bias_type,
        pattern: pattern.pattern,
        confidence: pattern.confidence,
        frequency: pattern.frequency,
        contexts: JSON.parse(pattern.contexts || '[]'),
        severity: pattern.severity,
        detectedAt: new Date(pattern.detected_at),
        lastObserved: new Date(pattern.last_observed),
        countermeasures: JSON.parse(pattern.countermeasures || '[]')
      });
    }
  }

  // Get comprehensive bias analysis report
  async getBiasAnalysisReport(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    summary: {
      totalDetections: number;
      biasTypeDistribution: Record<string, number>;
      severityDistribution: Record<string, number>;
      averageCorrection: number;
      automaticCorrectionRate: number;
    };
    trends: Array<{
      date: Date;
      biasType: string;
      frequency: number;
      averageConfidence: number;
    }>;
    effectiveness: Array<{
      biasType: string;
      correctionMethod: string;
      averageEffectiveness: number;
    }>;
    recommendations: string[];
  }> {
    const timeFilter = this.getTimeFilter(timeRange);

    // Get summary statistics
    const summaryStmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_detections,
        AVG(correction_applied) as average_correction,
        AVG(CASE WHEN automatic_correction = 1 THEN 1 ELSE 0 END) as automatic_correction_rate
      FROM bias_detections
      WHERE created_at > ${timeFilter}
    `);

    const summaryData = summaryStmt.get();

    // Get bias type distribution
    const typeDistStmt = this.db.prepare(`
      SELECT bias_type, COUNT(*) as count
      FROM bias_detections
      WHERE created_at > ${timeFilter}
      GROUP BY bias_type
    `);

    const biasTypeDistribution = typeDistStmt.all().reduce((acc, row: any) => {
      acc[row.bias_type] = row.count;
      return acc;
    }, {});

    // Get severity distribution
    const severityDistStmt = this.db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM bias_detections
      WHERE created_at > ${timeFilter}
      GROUP BY severity
    `);

    const severityDistribution = severityDistStmt.all().reduce((acc, row: any) => {
      acc[row.severity] = row.count;
      return acc;
    }, {});

    // Get trends
    const trendsStmt = this.db.prepare(`
      SELECT
        DATE(created_at) as date,
        bias_type,
        COUNT(*) as frequency,
        AVG(bias_confidence) as average_confidence
      FROM bias_detections
      WHERE created_at > ${timeFilter}
      GROUP BY DATE(created_at), bias_type
      ORDER BY date DESC
    `);

    const rawTrends = trendsStmt.all();
    const trends = rawTrends.map(t => ({
      date: new Date(t.date),
      biasType: t.bias_type,
      frequency: t.frequency,
      averageConfidence: t.average_confidence
    }));

    // Get effectiveness data
    const effectivenessStmt = this.db.prepare(`
      SELECT
        bias_type,
        correction_method,
        AVG(effectiveness_score) as average_effectiveness
      FROM bias_correction_effectiveness
      WHERE created_at > ${timeFilter}
      GROUP BY bias_type, correction_method
      ORDER BY average_effectiveness DESC
    `);

    const effectiveness = effectivenessStmt.all();

    // Generate recommendations
    const recommendations = this.generateBiasRecommendations(summaryData, biasTypeDistribution, trends);

    return {
      summary: {
        totalDetections: summaryData?.total_detections || 0,
        biasTypeDistribution,
        severityDistribution,
        averageCorrection: summaryData?.average_correction || 0,
        automaticCorrectionRate: summaryData?.automatic_correction_rate || 0
      },
      trends,
      effectiveness,
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

  private generateBiasRecommendations(
    summaryData: any,
    biasTypeDistribution: Record<string, number>,
    trends: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Based on overall detection frequency
    if (summaryData.total_detections > 50) {
      recommendations.push('High bias detection frequency - consider system-wide awareness training');
    }

    // Based on bias type patterns
    const topBiasType = Object.entries(biasTypeDistribution)
      .sort(([,a], [,b]) => b - a)[0];

    if (topBiasType) {
      const [biasType, count] = topBiasType;
      recommendations.push(`${biasType} bias most common (${count} detections) - target for focused intervention`);
    }

    // Based on correction effectiveness
    const lowAutomaticCorrection = summaryData.automatic_correction_rate < 0.7;
    if (lowAutomaticCorrection) {
      recommendations.push('Low automatic correction rate - review bias detection thresholds');
    }

    // Based on trends
    const recentTrends = trends.slice(0, 7); // Last 7 days
    const increasingBiases = recentTrends.filter(t => t.frequency > 3);

    if (increasingBiases.length > 0) {
      recommendations.push('Increasing bias detection trend - investigate systemic causes');
    }

    if (recommendations.length === 0) {
      recommendations.push('Bias detection system performing within normal parameters');
    }

    return recommendations;
  }
}

export default EnhancedCognitiveBiasSystem;