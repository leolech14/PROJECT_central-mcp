// 🧭 ADVANCED METACOGNITIVE AWARENESS MODULE
// Built: 2025-10-13 | Purpose: System that knows what it knows and doesn't know with explicit uncertainty boundaries
// Implements: Knowledge state mapping, uncertainty quantification, introspection algorithms, adaptive learning boundaries

import { Database } from 'better-sqlite3';
import { Evidence, ConfidenceResult } from './AdvancedSelfAuditSystem.js';

export interface KnowledgeBoundary {
  domain: string;
  knownKnowns: Array<{
    concept: string;
    confidence: number;
    evidence: string[];
    lastVerified: Date;
    stability: 'stable' | 'evolving' | 'degrading';
  }>;
  knownUnknowns: Array<{
    concept: string;
    uncertaintyType: 'conceptual' | 'procedural' | 'empirical' | 'temporal';
    uncertaintyLevel: number; // 0-1
    informationGaps: string[];
    potentialAcquisitionMethods: string[];
  }>;
  unknownUnknowns: Array<{
    category: string;
    detectionMethod: 'boundary_analysis' | 'peer_comparison' | 'failure_analysis' | 'extrapolation';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    explorationStrategy: string;
  }>;
  uncertaintyMetrics: {
    totalUncertainty: number;
    uncertaintyDistribution: Record<string, number>;
    uncertaintyTrend: 'increasing' | 'decreasing' | 'stable';
    boundaryStability: number;
  };
}

export interface IntrospectionResult {
  selfAssessment: {
    knowledgeCoverage: number; // How much of the domain is known
    uncertaintyAwareness: number; // How well the system knows its limitations
    confidenceCalibration: number; // How well confidence matches knowledge
    metaLearningAbility: number; // Ability to learn about learning
  };
  cognitiveState: {
    clarityLevel: number; // How clear current understanding is
    confusionPoints: string[];
    knowledgeGaps: string[];
    overconfidenceAreas: string[];
    underconfidenceAreas: string[];
  };
  adaptiveBoundaries: {
    expandableDomains: string[];
    contractableDomains: string[];
    stableDomains: string[];
    highUncertaintyDomains: string[];
  };
  learningRecommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    domain: string;
    learningObjective: string;
    suggestedMethods: string[];
    expectedUncertaintyReduction: number;
  }>;
}

export interface UncertaintyQuantification {
  aleatoryUncertainty: number; // Random uncertainty in the system itself
  epistemicUncertainty: number; // Uncertainty due to lack of knowledge
  ontologicalUncertainty: number; // Uncertainty about the problem structure
  totalUncertainty: number;
  uncertaintyDecomposition: {
    sources: Array<{
      source: string;
      contribution: number;
      reducible: boolean;
      reductionStrategy?: string;
    }>;
    interactions: Array<{
      source1: string;
      source2: string;
      interaction: number;
      description: string;
    }>;
  };
}

export class MetacognitiveAwarenessModule {
  private db: Database;
  private knowledgeBoundaries: Map<string, KnowledgeBoundary> = new Map();
  private introspectionHistory: Array<{
    timestamp: Date;
    assessment: IntrospectionResult;
    context: string;
  }> = [];

  constructor(database: Database) {
    this.db = database;
    this.initializeMetacognitiveTables();
    this.loadKnowledgeBoundaries();
  }

  private initializeMetacognitiveTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_boundaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT UNIQUE NOT NULL,
        known_knowns TEXT NOT NULL,
        known_unknowns TEXT NOT NULL,
        unknown_unknowns TEXT NOT NULL,
        uncertainty_metrics TEXT NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS introspection_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        knowledge_coverage REAL NOT NULL,
        uncertainty_awareness REAL NOT NULL,
        confidence_calibration REAL NOT NULL,
        meta_learning_ability REAL NOT NULL,
        cognitive_state TEXT NOT NULL,
        adaptive_boundaries TEXT NOT NULL,
        learning_recommendations TEXT NOT NULL,
        context TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS uncertainty_quantification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT NOT NULL,
        claim TEXT NOT NULL,
        aleatory_uncertainty REAL NOT NULL,
        epistemic_uncertainty REAL NOT NULL,
        ontological_uncertainty REAL NOT NULL,
        total_uncertainty REAL NOT NULL,
        uncertainty_decomposition TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS learning_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT NOT NULL,
        event_type TEXT NOT NULL,
        before_state TEXT NOT NULL,
        after_state TEXT NOT NULL,
        learning_effectiveness REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_boundaries_domain ON knowledge_boundaries(domain);
      CREATE INDEX IF NOT EXISTS idx_introspection_context ON introspection_history(context);
      CREATE INDEX IF NOT EXISTS idx_uncertainty_domain ON uncertainty_quantification(domain);
      CREATE INDEX IF NOT EXISTS idx_learning_events_domain ON learning_events(domain);
    `);
  }

  private loadKnowledgeBoundaries(): void {
    const stmt = this.db.prepare('SELECT * FROM knowledge_boundaries');
    const boundaries = stmt.all() as any[];

    for (const boundary of boundaries) {
      this.knowledgeBoundaries.set(boundary.domain, {
        domain: boundary.domain,
        knownKnowns: JSON.parse(boundary.known_knowns || '[]'),
        knownUnknowns: JSON.parse(boundary.known_unknowns || '[]'),
        unknownUnknowns: JSON.parse(boundary.unknown_unknowns || '[]'),
        uncertaintyMetrics: JSON.parse(boundary.uncertainty_metrics || '{}')
      });
    }
  }

  async performIntrospection(
    claim: string,
    evidence: Evidence[],
    confidenceResult: ConfidenceResult,
    domain: string = 'general'
  ): Promise<IntrospectionResult> {
    // Analyze current knowledge state
    const knowledgeBoundary = await this.analyzeKnowledgeBoundary(domain, claim, evidence);

    // Quantify uncertainty
    const uncertaintyQuantification = await this.quantifyUncertainty(claim, evidence, domain);

    // Assess metacognitive abilities
    const selfAssessment = this.assessMetacognitiveAbilities(knowledgeBoundary, uncertaintyQuantification);

    // Analyze cognitive state
    const cognitiveState = this.analyzeCognitiveState(knowledgeBoundary, confidenceResult);

    // Determine adaptive boundaries
    const adaptiveBoundaries = this.determineAdaptiveBoundaries(knowledgeBoundary);

    // Generate learning recommendations
    const learningRecommendations = this.generateLearningRecommendations(
      knowledgeBoundary,
      cognitiveState,
      uncertaintyQuantification
    );

    const introspectionResult: IntrospectionResult = {
      selfAssessment,
      cognitiveState,
      adaptiveBoundaries,
      learningRecommendations
    };

    // Store introspection results
    await this.storeIntrospectionResult(introspectionResult, claim);

    // Update knowledge boundary
    this.knowledgeBoundaries.set(domain, knowledgeBoundary);
    await this.storeKnowledgeBoundary(knowledgeBoundary);

    return introspectionResult;
  }

  private async analyzeKnowledgeBoundary(
    domain: string,
    claim: string,
    evidence: Evidence[]
  ): Promise<KnowledgeBoundary> {
    // Get or create knowledge boundary for domain
    let boundary = this.knowledgeBoundaries.get(domain);

    if (!boundary) {
      boundary = {
        domain,
        knownKnowns: [],
        knownUnknowns: [],
        unknownUnknowns: [],
        uncertaintyMetrics: {
          totalUncertainty: 0.5,
          uncertaintyDistribution: {},
          uncertaintyTrend: 'stable',
          boundaryStability: 0.5
        }
      };
    }

    // Analyze evidence to update known knowns
    const highConfidenceEvidence = evidence.filter(ev => ev.confidence > 0.8);
    for (const ev of highConfidenceEvidence) {
      const existingKnown = boundary.knownKnowns.find(kk => kk.concept === ev.claim);
      if (existingKnown) {
        existingKnown.confidence = (existingKnown.confidence + ev.confidence) / 2;
        existingKnown.lastVerified = new Date();
        existingKnown.evidence.push(ev.type);
      } else {
        boundary.knownKnowns.push({
          concept: ev.claim,
          confidence: ev.confidence,
          evidence: [ev.type],
          lastVerified: new Date(),
          stability: 'stable'
        });
      }
    }

    // Identify known unknowns from medium confidence evidence
    const mediumConfidenceEvidence = evidence.filter(ev => ev.confidence > 0.4 && ev.confidence <= 0.8);
    for (const ev of mediumConfidenceEvidence) {
      const existingUnknown = boundary.knownUnknowns.find(ku => ku.concept === ev.claim);
      if (!existingUnknown) {
        boundary.knownUnknowns.push({
          concept: ev.claim,
          uncertaintyType: this.classifyUncertaintyType(ev),
          uncertaintyLevel: 1 - ev.confidence,
          informationGaps: this.identifyInformationGaps(ev),
          potentialAcquisitionMethods: this.suggestAcquisitionMethods(ev)
        });
      }
    }

    // Detect unknown unknowns through boundary analysis
    const unknownUnknowns = this.detectUnknownUnknowns(boundary, claim);
    boundary.unknownUnknowns = [...boundary.unknownUnknowns, ...unknownUnknowns];

    // Update uncertainty metrics
    boundary.uncertaintyMetrics = this.calculateUncertaintyMetrics(boundary);

    return boundary;
  }

  private classifyUncertaintyType(evidence: Evidence): 'conceptual' | 'procedural' | 'empirical' | 'temporal' {
    if (evidence.type === 'DATABASE_REALITY' || evidence.type === 'FILESYSTEM_EVIDENCE') {
      return 'empirical';
    }
    if (evidence.type === 'CODE_EXECUTION') {
      return 'procedural';
    }
    if (evidence.executionTime > 1000) {
      return 'temporal';
    }
    return 'conceptual';
  }

  private identifyInformationGaps(evidence: Evidence): string[] {
    const gaps: string[] = [];

    if (evidence.confidence < 0.8) {
      gaps.push('Insufficient verification depth');
    }

    if (evidence.executionTime > 500) {
      gaps.push('Performance characteristics unknown');
    }

    if (evidence.evidenceCount < 3) {
      gaps.push('Limited evidence diversity');
    }

    if (evidence.metadata?.error) {
      gaps.push('Error conditions not fully understood');
    }

    return gaps;
  }

  private suggestAcquisitionMethods(evidence: Evidence): string[] {
    const methods: string[] = [];

    switch (evidence.type) {
      case 'DATABASE_REALITY':
        methods.push('Additional database queries', 'Cross-table validation', 'Historical data analysis');
        break;
      case 'CODE_EXECUTION':
        methods.push('Extended testing', 'Edge case exploration', 'Performance profiling');
        break;
      case 'FILESYSTEM_EVIDENCE':
        methods.push('Comprehensive file scanning', 'Permission testing', 'Integrity verification');
        break;
      case 'API_RESPONSE':
        methods.push('Additional API endpoints', 'Error condition testing', 'Rate limiting analysis');
        break;
    }

    return methods;
  }

  private detectUnknownUnknowns(boundary: KnowledgeBoundary, claim: string): Array<{
    category: string;
    detectionMethod: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    explorationStrategy: string;
  }> {
    const unknownUnknowns: any[] = [];

    // Boundary analysis: what's at the edge of known knowledge?
    if (boundary.knownKnowns.length > 0 && boundary.knownUnknowns.length === 0) {
      unknownUnknowns.push({
        category: 'knowledge_boundary_edge',
        detectionMethod: 'boundary_analysis',
        riskLevel: 'medium',
        explorationStrategy: 'Systematic exploration of adjacent knowledge domains'
      });
    }

    // Failure analysis: what could go wrong that we haven't considered?
    if (!claim.includes('error') && !claim.includes('failure') && !claim.includes('exception')) {
      unknownUnknowns.push({
        category: 'failure_modes',
        detectionMethod: 'failure_analysis',
        riskLevel: 'high',
        explorationStrategy: 'Comprehensive failure mode and effects analysis'
      });
    }

    // Extrapolation: what assumptions might we be making?
    const assumptionIndicators = ['assume', 'expect', 'should', 'would', 'typically'];
    const hasAssumptions = assumptionIndicators.some(indicator => claim.toLowerCase().includes(indicator));

    if (hasAssumptions) {
      unknownUnknowns.push({
        category: 'hidden_assumptions',
        detectionMethod: 'extrapolation',
        riskLevel: 'medium',
        explorationStrategy: 'Assumption extraction and validation'
      });
    }

    return unknownUnknowns;
  }

  private calculateUncertaintyMetrics(boundary: KnowledgeBoundary): KnowledgeBoundary['uncertaintyMetrics'] {
    // Calculate total uncertainty
    const knownKnownsAvgConfidence = boundary.knownKnowns.length > 0 ?
      boundary.knownKnowns.reduce((sum, kk) => sum + kk.confidence, 0) / boundary.knownKnowns.length : 0.5;

    const knownUnknownsAvgUncertainty = boundary.knownUnknowns.length > 0 ?
      boundary.knownUnknowns.reduce((sum, ku) => sum + ku.uncertaintyLevel, 0) / boundary.knownUnknowns.length : 0.5;

    const unknownUnknownsPenalty = Math.min(0.3, boundary.unknownUnknowns.length * 0.1);

    const totalUncertainty = (1 - knownKnownsAvgConfidence) * 0.4 +
                           knownUnknownsAvgUncertainty * 0.4 +
                           unknownUnknownsPenalty * 0.2;

    // Calculate uncertainty distribution
    const uncertaintyDistribution: Record<string, number> = {
      conceptual: 0,
      procedural: 0,
      empirical: 0,
      temporal: 0
    };

    for (const ku of boundary.knownUnknowns) {
      if (uncertaintyDistribution[ku.uncertaintyType] !== undefined) {
        uncertaintyDistribution[ku.uncertaintyType] += ku.uncertaintyLevel;
      }
    }

    // Normalize distribution
    const totalDistribution = Object.values(uncertaintyDistribution).reduce((sum, val) => sum + val, 0);
    if (totalDistribution > 0) {
      for (const key in uncertaintyDistribution) {
        uncertaintyDistribution[key] /= totalDistribution;
      }
    }

    // Calculate boundary stability
    const stableKnowns = boundary.knownKnowns.filter(kk => kk.stability === 'stable').length;
    const boundaryStability = boundary.knownKnowns.length > 0 ?
      stableKnowns / boundary.knownKnowns.length : 0.5;

    return {
      totalUncertainty,
      uncertaintyDistribution,
      uncertaintyTrend: 'stable', // Would calculate from historical data
      boundaryStability
    };
  }

  private async quantifyUncertainty(
    claim: string,
    evidence: Evidence[],
    domain: string
  ): Promise<UncertaintyQuantification> {
    // Aleatory uncertainty: inherent randomness in the system
    const aleatoryUncertainty = this.calculateAleatoryUncertainty(evidence);

    // Epistemic uncertainty: lack of knowledge
    const epistemicUncertainty = this.calculateEpistemicUncertainty(evidence);

    // Ontological uncertainty: uncertainty about problem structure
    const ontologicalUncertainty = this.calculateOntologicalUncertainty(claim, evidence);

    const totalUncertainty = Math.sqrt(
      aleatoryUncertainty * aleatoryUncertainty +
      epistemicUncertainty * epistemicUncertainty +
      ontologicalUncertainty * ontologicalUncertainty
    );

    // Decompose uncertainty sources
    const sources = this.decomposeUncertaintySources(claim, evidence);

    // Analyze interactions between sources
    const interactions = this.analyzeUncertaintyInteractions(sources);

    const uncertaintyQuantification: UncertaintyQuantification = {
      aleatoryUncertainty,
      epistemicUncertainty,
      ontologicalUncertainty,
      totalUncertainty,
      uncertaintyDecomposition: {
        sources,
        interactions
      }
    };

    // Store uncertainty quantification
    await this.storeUncertaintyQuantification(claim, uncertaintyQuantification, domain);

    return uncertaintyQuantification;
  }

  private calculateAleatoryUncertainty(evidence: Evidence[]): number {
    // Aleatory uncertainty from evidence variance and execution time variability
    const confidenceValues = evidence.map(ev => ev.confidence);
    const meanConfidence = confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;
    const variance = confidenceValues.reduce((sum, c) => sum + Math.pow(c - meanConfidence, 2), 0) / confidenceValues.length;

    const executionTimes = evidence.map(ev => ev.executionTime);
    const meanTime = executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length;
    const timeVariance = executionTimes.reduce((sum, t) => sum + Math.pow(t - meanTime, 2), 0) / executionTimes.length;

    // Normalize and combine
    const confidenceVariability = Math.sqrt(variance);
    const timeVariability = Math.sqrt(timeVariance) / 1000; // Convert to seconds

    return Math.min(0.5, (confidenceVariability + timeVariability) / 2);
  }

  private calculateEpistemicUncertainty(evidence: Evidence[]): number {
    // Epistemic uncertainty from lack of evidence and evidence diversity
    const evidenceTypes = new Set(evidence.map(ev => ev.type));
    const typeDiversity = evidenceTypes.size / 4; // Normalize by max possible types

    const avgConfidence = evidence.reduce((sum, ev) => sum + ev.confidence, 0) / evidence.length;
    const confidenceGap = 1 - avgConfidence;

    const informationGaps = evidence.reduce((sum, ev) => {
      const gaps = this.identifyInformationGaps(ev);
      return sum + gaps.length;
    }, 0) / evidence.length;

    return Math.min(0.8, (confidenceGap * 0.5 + (1 - typeDiversity) * 0.3 + informationGaps * 0.2));
  }

  private calculateOntologicalUncertainty(claim: string, evidence: Evidence[]): number {
    // Ontological uncertainty from ambiguous problem definition
    const ambiguityIndicators = [
      'maybe', 'possibly', 'could', 'might', 'approximately', 'roughly',
      'tend to', 'typically', 'generally', 'often', 'sometimes'
    ];

    const ambiguityCount = ambiguityIndicators.filter(indicator =>
      claim.toLowerCase().includes(indicator)
    ).length;

    const structuralComplexity = claim.split(' ').length / 50; // Normalize by sentence length

    const evidenceCoverage = evidence.length / 10; // Normalize by ideal evidence count

    return Math.min(0.6, (ambiguityCount * 0.1 + structuralComplexity * 0.3 + (1 - evidenceCoverage) * 0.6));
  }

  private decomposeUncertaintySources(claim: string, evidence: Evidence[]): Array<{
    source: string;
    contribution: number;
    reducible: boolean;
    reductionStrategy?: string;
  }> {
    const sources = [
      {
        source: 'measurement_error',
        contribution: this.calculateMeasurementErrorContribution(evidence),
        reducible: true,
        reductionStrategy: 'Increase measurement precision and sample size'
      },
      {
        source: 'model_uncertainty',
        contribution: this.calculateModelUncertaintyContribution(evidence),
        reducible: true,
        reductionStrategy: 'Improve model accuracy and complexity'
      },
      {
        source: 'parameter_uncertainty',
        contribution: this.calculateParameterUncertaintyContribution(evidence),
        reducible: true,
        reductionStrategy: 'Conduct parameter sensitivity analysis'
      },
      {
        source: 'structural_uncertainty',
        contribution: this.calculateStructuralUncertaintyContribution(claim),
        reducible: false,
        reductionStrategy: 'Accept as inherent limitation'
      },
      {
        source: 'temporal_uncertainty',
        contribution: this.calculateTemporalUncertaintyContribution(evidence),
        reducible: true,
        reductionStrategy: 'Increase temporal sampling frequency'
      }
    ];

    // Normalize contributions
    const totalContribution = sources.reduce((sum, s) => sum + s.contribution, 0);
    if (totalContribution > 0) {
      sources.forEach(s => s.contribution /= totalContribution);
    }

    return sources;
  }

  private analyzeUncertaintyInteractions(sources: Array<{
    source: string;
    contribution: number;
    reducible: boolean;
  }>): Array<{
    source1: string;
    source2: string;
    interaction: number;
    description: string;
  }> {
    const interactions = [];

    // Analyze pairwise interactions
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const source1 = sources[i];
        const source2 = sources[j];

        // Simple interaction model: product of contributions
        const interaction = source1.contribution * source2.contribution;

        if (interaction > 0.01) { // Only include significant interactions
          interactions.push({
            source1: source1.source,
            source2: source2.source,
            interaction,
            description: `${source1.source} and ${source2.source} interact synergistically`
          });
        }
      }
    }

    return interactions.sort((a, b) => b.interaction - a.interaction);
  }

  private calculateMeasurementErrorContribution(evidence: Evidence[]): number {
    // Estimate from evidence variance
    const confidenceValues = evidence.map(ev => ev.confidence);
    const meanConfidence = confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;
    const variance = confidenceValues.reduce((sum, c) => sum + Math.pow(c - meanConfidence, 2), 0) / confidenceValues.length;
    return Math.min(0.3, Math.sqrt(variance));
  }

  private calculateModelUncertaintyContribution(evidence: Evidence[]): number {
    // Estimate from evidence type diversity
    const evidenceTypes = new Set(evidence.map(ev => ev.type));
    return Math.max(0.1, (4 - evidenceTypes.size) / 4 * 0.2);
  }

  private calculateParameterUncertaintyContribution(evidence: Evidence[]): number {
    // Estimate from metadata variability
    const metadataComplexity = evidence.reduce((sum, ev) => {
      return sum + Object.keys(ev.metadata || {}).length;
    }, 0) / evidence.length;

    return Math.min(0.2, metadataComplexity / 10);
  }

  private calculateStructuralUncertaintyContribution(claim: string): number {
    // Estimate from claim complexity and ambiguity
    const complexity = claim.split(' ').length / 20; // Normalize by typical sentence length
    const ambiguity = (claim.match(/\b(maybe|possibly|could|might|approximately)\b/gi) || []).length / 10;
    return Math.min(0.3, complexity + ambiguity);
  }

  private calculateTemporalUncertaintyContribution(evidence: Evidence[]): number {
    // Estimate from execution time variability
    const executionTimes = evidence.map(ev => ev.executionTime);
    const meanTime = executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length;
    const variance = executionTimes.reduce((sum, t) => sum + Math.pow(t - meanTime, 2), 0) / executionTimes.length;
    return Math.min(0.15, Math.sqrt(variance) / 1000);
  }

  private assessMetacognitiveAbilities(
    boundary: KnowledgeBoundary,
    uncertainty: UncertaintyQuantification
  ): IntrospectionResult['selfAssessment'] {
    // Knowledge coverage: how much of the domain is known
    const totalKnowledgeItems = boundary.knownKnowns.length + boundary.knownUnknowns.length;
    const knowledgeCoverage = totalKnowledgeItems > 0 ?
      boundary.knownKnowns.length / totalKnowledgeItems : 0.5;

    // Uncertainty awareness: how well the system knows its limitations
    const uncertaintyAwareness = 1 - Math.abs(uncertainty.totalUncertainty - boundary.uncertaintyMetrics.totalUncertainty);

    // Confidence calibration: how well confidence matches knowledge
    const avgKnownConfidence = boundary.knownKnowns.length > 0 ?
      boundary.knownKnowns.reduce((sum, kk) => sum + kk.confidence, 0) / boundary.knownKnowns.length : 0.5;
    const confidenceCalibration = 1 - Math.abs(avgKnownConfidence - (1 - uncertainty.totalUncertainty));

    // Meta-learning ability: ability to learn about learning
    const metaLearningAbility = this.calculateMetaLearningAbility(boundary);

    return {
      knowledgeCoverage,
      uncertaintyAwareness,
      confidenceCalibration,
      metaLearningAbility
    };
  }

  private calculateMetaLearningAbility(boundary: KnowledgeBoundary): number {
    // Estimate from boundary stability and uncertainty trends
    const stabilityScore = boundary.uncertaintyMetrics.boundaryStability;
    const knownKnownsStability = boundary.knownKnowns.filter(kk => kk.stability === 'stable').length /
                                Math.max(1, boundary.knownKnowns.length);

    return (stabilityScore + knownKnownsStability) / 2;
  }

  private analyzeCognitiveState(
    boundary: KnowledgeBoundary,
    confidenceResult: ConfidenceResult
  ): IntrospectionResult['cognitiveState'] {
    // Clarity level: how clear current understanding is
    const clarityLevel = 1 - boundary.uncertaintyMetrics.totalUncertainty;

    // Confusion points: areas with high uncertainty
    const confusionPoints = boundary.knownUnknowns
      .filter(ku => ku.uncertaintyLevel > 0.7)
      .map(ku => ku.concept);

    // Knowledge gaps: known unknowns with actionable acquisition methods
    const knowledgeGaps = boundary.knownUnknowns
      .filter(ku => ku.potentialAcquisitionMethods.length > 0)
      .map(ku => `${ku.concept}: ${ku.informationGaps.join(', ')}`);

    // Overconfidence areas: high confidence with limited evidence
    const overconfidenceAreas = boundary.knownKnowns
      .filter(kk => kk.confidence > 0.9 && kk.evidence.length < 2)
      .map(kk => kk.concept);

    // Underconfidence areas: low confidence with substantial evidence
    const underconfidenceAreas = boundary.knownKnowns
      .filter(kk => kk.confidence < 0.6 && kk.evidence.length > 3)
      .map(kk => kk.concept);

    return {
      clarityLevel,
      confusionPoints,
      knowledgeGaps,
      overconfidenceAreas,
      underconfidenceAreas
    };
  }

  private determineAdaptiveBoundaries(boundary: KnowledgeBoundary): IntrospectionResult['adaptiveBoundaries'] {
    const expandableDomains: string[] = [];
    const contractableDomains: string[] = [];
    const stableDomains: string[] = [];
    const highUncertaintyDomains: string[] = [];

    // Analyze uncertainty distribution
    const uncertaintyDistribution = boundary.uncertaintyMetrics.uncertaintyDistribution;

    for (const [type, level] of Object.entries(uncertaintyDistribution)) {
      if (level > 0.4) {
        highUncertaintyDomains.push(type);
      }
      if (level < 0.2) {
        stableDomains.push(type);
      }
      if (boundary.knownUnknowns.some(ku => ku.uncertaintyType === type && ku.potentialAcquisitionMethods.length > 0)) {
        expandableDomains.push(type);
      }
    }

    return {
      expandableDomains,
      contractableDomains,
      stableDomains,
      highUncertaintyDomains
    };
  }

  private generateLearningRecommendations(
    boundary: KnowledgeBoundary,
    cognitiveState: IntrospectionResult['cognitiveState'],
    uncertainty: UncertaintyQuantification
  ): IntrospectionResult['learningRecommendations'] {
    const recommendations: IntrospectionResult['learningRecommendations'] = [];

    // Priority 1: Address critical confusion points
    for (const confusionPoint of cognitiveState.confusionPoints) {
      const unknown = boundary.knownUnknowns.find(ku => ku.concept === confusionPoint);
      if (unknown && unknown.uncertaintyLevel > 0.8) {
        recommendations.push({
          priority: 'critical',
          domain: boundary.domain,
          learningObjective: `Resolve critical uncertainty in ${confusionPoint}`,
          suggestedMethods: unknown.potentialAcquisitionMethods,
          expectedUncertaintyReduction: unknown.uncertaintyLevel * 0.8
        });
      }
    }

    // Priority 2: Reduce epistemic uncertainty
    if (uncertainty.epistemicUncertainty > 0.5) {
      recommendations.push({
        priority: 'high',
        domain: boundary.domain,
        learningObjective: 'Reduce epistemic uncertainty through additional evidence collection',
        suggestedMethods: ['Expand evidence types', 'Increase verification depth', 'Cross-validation'],
        expectedUncertaintyReduction: uncertainty.epistemicUncertainty * 0.5
      });
    }

    // Priority 3: Address overconfidence
    for (const overconfidenceArea of cognitiveState.overconfidenceAreas) {
      recommendations.push({
        priority: 'medium',
        domain: boundary.domain,
        learningObjective: `Validate overconfident assessment of ${overconfidenceArea}`,
        suggestedMethods: ['Independent verification', 'Adversarial testing', 'Error analysis'],
        expectedUncertaintyReduction: 0.2
      });
    }

    // Priority 4: Explore expandable domains
    for (const domain of boundary.adaptiveBoundaries?.expandableDomains || []) {
      recommendations.push({
        priority: 'low',
        domain: boundary.domain,
        learningObjective: `Explore knowledge expansion in ${domain} domain`,
        suggestedMethods: ['Boundary analysis', 'Adjacent domain exploration', 'Pattern recognition'],
        expectedUncertaintyReduction: 0.1
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async storeIntrospectionResult(result: IntrospectionResult, context: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO introspection_history (
        knowledge_coverage, uncertainty_awareness, confidence_calibration,
        meta_learning_ability, cognitive_state, adaptive_boundaries,
        learning_recommendations, context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.selfAssessment.knowledgeCoverage,
      result.selfAssessment.uncertaintyAwareness,
      result.selfAssessment.confidenceCalibration,
      result.selfAssessment.metaLearningAbility,
      JSON.stringify(result.cognitiveState),
      JSON.stringify(result.adaptiveBoundaries),
      JSON.stringify(result.learningRecommendations),
      context
    );

    // Add to history
    this.introspectionHistory.push({
      timestamp: new Date(),
      assessment: result,
      context
    });

    // Keep only recent history
    if (this.introspectionHistory.length > 100) {
      this.introspectionHistory = this.introspectionHistory.slice(-50);
    }
  }

  private async storeKnowledgeBoundary(boundary: KnowledgeBoundary): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO knowledge_boundaries (
        domain, known_knowns, known_unknowns, unknown_unknowns,
        uncertainty_metrics, last_updated
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      boundary.domain,
      JSON.stringify(boundary.knownKnowns),
      JSON.stringify(boundary.knownUnknowns),
      JSON.stringify(boundary.unknownUnknowns),
      JSON.stringify(boundary.uncertaintyMetrics)
    );
  }

  private async storeUncertaintyQuantification(
    claim: string,
    uncertainty: UncertaintyQuantification,
    domain: string
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO uncertainty_quantification (
        domain, claim, aleatory_uncertainty, epistemic_uncertainty,
        ontological_uncertainty, total_uncertainty, uncertainty_decomposition
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      domain,
      claim,
      uncertainty.aleatoryUncertainty,
      uncertainty.epistemicUncertainty,
      uncertainty.ontologicalUncertainty,
      uncertainty.totalUncertainty,
      JSON.stringify(uncertainty.uncertaintyDecomposition)
    );
  }

  // Get comprehensive metacognitive report
  async getMetacognitiveReport(timeRange: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    selfAssessmentTrends: Array<{
      date: Date;
      knowledgeCoverage: number;
      uncertaintyAwareness: number;
      confidenceCalibration: number;
      metaLearningAbility: number;
    }>;
    domainAnalysis: Array<{
      domain: string;
      knowledgeBoundary: KnowledgeBoundary;
      maturityLevel: 'emerging' | 'developing' | 'mature' | 'expert';
    }>;
    uncertaintyEvolution: Array<{
      date: Date;
      totalUncertainty: number;
      aleatoryUncertainty: number;
      epistemicUncertainty: number;
      ontologicalUncertainty: number;
    }>;
    learningEffectiveness: Array<{
      learningObjective: string;
      effectivenessScore: number;
      timeToAchieve: number;
      retentionRate: number;
    }>;
    strategicInsights: string[];
  }> {
    const timeFilter = this.getTimeFilter(timeRange);

    // Get self-assessment trends
    const trendsStmt = this.db.prepare(`
      SELECT
        DATE(created_at) as date,
        AVG(knowledge_coverage) as knowledge_coverage,
        AVG(uncertainty_awareness) as uncertainty_awareness,
        AVG(confidence_calibration) as confidence_calibration,
        AVG(meta_learning_ability) as meta_learning_ability
      FROM introspection_history
      WHERE created_at > ${timeFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const rawTrends = trendsStmt.all();
    const selfAssessmentTrends = rawTrends.map(t => ({
      date: new Date(t.date),
      knowledgeCoverage: t.knowledge_coverage,
      uncertaintyAwareness: t.uncertainty_awareness,
      confidenceCalibration: t.confidence_calibration,
      metaLearningAbility: t.meta_learning_ability
    }));

    // Domain analysis
    const domainAnalysis = Array.from(this.knowledgeBoundaries.values()).map(boundary => ({
      domain: boundary.domain,
      knowledgeBoundary: boundary,
      maturityLevel: this.calculateDomainMaturity(boundary)
    }));

    // Uncertainty evolution
    const uncertaintyStmt = this.db.prepare(`
      SELECT
        DATE(created_at) as date,
        AVG(total_uncertainty) as total_uncertainty,
        AVG(aleatory_uncertainty) as aleatory_uncertainty,
        AVG(epistemic_uncertainty) as epistemic_uncertainty,
        AVG(ontological_uncertainty) as ontological_uncertainty
      FROM uncertainty_quantification
      WHERE created_at > ${timeFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const rawUncertainty = uncertaintyStmt.all();
    const uncertaintyEvolution = rawUncertainty.map(u => ({
      date: new Date(u.date),
      totalUncertainty: u.total_uncertainty,
      aleatoryUncertainty: u.aleatory_uncertainty,
      epistemicUncertainty: u.epistemic_uncertainty,
      ontologicalUncertainty: u.ontological_uncertainty
    }));

    // Learning effectiveness (simplified - would use actual learning event data)
    const learningEffectiveness = this.calculateLearningEffectiveness();

    // Strategic insights
    const strategicInsights = this.generateStrategicInsights(
      selfAssessmentTrends,
      domainAnalysis,
      uncertaintyEvolution
    );

    return {
      selfAssessmentTrends,
      domainAnalysis,
      uncertaintyEvolution,
      learningEffectiveness,
      strategicInsights
    };
  }

  private calculateDomainMaturity(boundary: KnowledgeBoundary): 'emerging' | 'developing' | 'mature' | 'expert' {
    const knowledgeRatio = boundary.knownKnowns.length / Math.max(1, boundary.knownKnowns.length + boundary.knownUnknowns.length);
    const uncertaintyLevel = boundary.uncertaintyMetrics.totalUncertainty;
    const boundaryStability = boundary.uncertaintyMetrics.boundaryStability;

    const maturityScore = (knowledgeRatio * 0.4) + ((1 - uncertaintyLevel) * 0.4) + (boundaryStability * 0.2);

    if (maturityScore > 0.8) return 'expert';
    if (maturityScore > 0.6) return 'mature';
    if (maturityScore > 0.4) return 'developing';
    return 'emerging';
  }

  private calculateLearningEffectiveness(): IntrospectionResult['learningRecommendations'] {
    // Simplified implementation - would analyze actual learning events
    return [
      {
        priority: 'high',
        domain: 'general',
        learningObjective: 'Improve evidence collection diversity',
        suggestedMethods: ['Expand verification types', 'Cross-domain validation'],
        expectedUncertaintyReduction: 0.3
      }
    ];
  }

  private generateStrategicInsights(
    trends: any[],
    domains: any[],
    uncertainty: any[]
  ): string[] {
    const insights: string[] = [];

    // Trend-based insights
    if (trends.length > 1) {
      const recent = trends[0];
      const previous = trends[1];

      if (recent.knowledgeCoverage > previous.knowledgeCoverage + 0.05) {
        insights.push('Knowledge coverage is improving significantly - current learning strategy is effective');
      }

      if (recent.uncertaintyAwareness < previous.uncertaintyAwareness - 0.05) {
        insights.push('Uncertainty awareness is declining - review introspection processes');
      }
    }

    // Domain-based insights
    const matureDomains = domains.filter(d => d.maturityLevel === 'expert' || d.maturityLevel === 'mature');
    const emergingDomains = domains.filter(d => d.maturityLevel === 'emerging');

    if (matureDomains.length > 0) {
      insights.push(`${matureDomains.length} domains show mature knowledge levels - consider leveraging these for mentorship`);
    }

    if (emergingDomains.length > domains.length * 0.5) {
      insights.push('Majority of domains are emerging - focus on foundational knowledge building');
    }

    // Uncertainty-based insights
    if (uncertainty.length > 1) {
      const recentUncertainty = uncertainty[0];
      const epistemicDominance = recentUncertainty.epistemicUncertainty > recentUncertainty.aleatoryUncertainty &&
                                  recentUncertainty.epistemicUncertainty > recentUncertainty.ontologicalUncertainty;

      if (epistemicDominance) {
        insights.push('Epistemic uncertainty dominates - prioritize evidence collection and knowledge acquisition');
      }
    }

    if (insights.length === 0) {
      insights.push('System metacognitive state is stable - continue current approach');
    }

    return insights;
  }

  private getTimeFilter(timeRange: 'week' | 'month' | 'quarter'): string {
    const intervals = {
      week: "datetime('now', '-7 days')",
      month: "datetime('now', '-30 days')",
      quarter: "datetime('now', '-90 days')"
    };
    return intervals[timeRange];
  }
}

export default MetacognitiveAwarenessModule;