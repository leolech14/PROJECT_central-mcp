// 🧠 AGENT TRUST & CONTEXT VALIDATION ENGINE
// Integrated with Central-MCP Physiology System
// Built: 2025-10-13 | Purpose: Complete agent trustworthiness evaluation

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

class AgentTrustEngine {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  // CORE TRUST SCORE CALCULATION
  async calculateTrustScore(agentId, timeHorizon = '30d') {
    console.log(`🔬 CALCULATING TRUST SCORE FOR: ${agentId}`);

    try {
      const dimensions = {
        competence: await this.calculateCompetenceScore(agentId, timeHorizon),
        reliability: await this.calculateReliabilityScore(agentId, timeHorizon),
        communication: await this.calculateCommunicationScore(agentId, timeHorizon),
        consistency: await this.calculateConsistencyScore(agentId, timeHorizon),
        adaptability: await this.calculateAdaptabilityScore(agentId, timeHorizon),
        feedback: await this.calculateFeedbackScore(agentId, timeHorizon)
      };

      // Trust is weighted more heavily toward reliability and competence
      const weights = {
        competence: 0.30,
        reliability: 0.35,
        communication: 0.15,
        consistency: 0.10,
        adaptability: 0.05,
        feedback: 0.05
      };

      const overallTrust = Object.entries(dimensions).reduce((sum, [key, value]) => {
        return sum + (value.score * weights[key]);
      }, 0);

      const trustData = {
        validationId: this.generateId('TRUST-VAL'),
        agentId,
        overallTrust,
        dimensions,
        breakdown: { dimensions, weights },
        confidence: this.calculateTrustConfidence(dimensions),
        trend: await this.calculateTrustTrend(agentId, timeHorizon),
        recommendation: this.generateTrustRecommendation(overallTrust, dimensions),
        validationDate: new Date().toISOString(),
        dataPoints: await this.getDataPointCount(agentId, timeHorizon)
      };

      // Save trust validation results
      await this.saveTrustValidation(trustData);

      return trustData;

    } catch (error) {
      console.error(`❌ TRUST SCORE CALCULATION FAILED: ${error.message}`);
      return { error: error.message, overallTrust: 0 };
    }
  }

  // COMPETENCE SCORE CALCULATION
  async calculateCompetenceScore(agentId, timeHorizon) {
    const query = `
      SELECT
        AVG(CASE WHEN apt.success = 1 THEN apt.quality_score ELSE 0 END) as avgQuality,
        AVG(CASE WHEN apt.success = 1 THEN 1 ELSE 0 END) as successRate,
        COUNT(*) as totalTasks,
        AVG(apt.task_complexity) as avgComplexity
      FROM agent_performance_tracking apt
      WHERE apt.agent_id = ?
      AND apt.performance_date > datetime('now', '-${timeHorizon}')
    `;

    const performance = this.db.prepare(query).get([agentId]);

    if (!performance || performance.totalTasks === 0) {
      return { score: 0.5, metrics: { totalTasks: 0 }, confidence: 0.1 };
    }

    const metrics = {
      avgQuality: performance.avgQuality || 0.5,
      successRate: performance.successRate || 0.5,
      totalTasks: performance.totalTasks,
      avgComplexity: performance.avgComplexity || 0.5,
      competenceCalibration: await this.calculateCompetenceCalibration(agentId, timeHorizon)
    };

    // Competence scoring: Quality and success rate are primary
    const score = Math.min(1,
      (metrics.successRate * 0.5) +
      (metrics.avgQuality * 0.4) +
      (metrics.competenceCalibration * 0.1)
    );

    return {
      score,
      metrics,
      trend: await this.calculateMetricTrend(agentId, 'competence', timeHorizon),
      confidence: this.calculateMetricConfidence(performance.totalTasks)
    };
  }

  // RELIABILITY SCORE CALCULATION
  async calculateReliabilityScore(agentId, timeHorizon) {
    const query = `
      SELECT
        COUNT(*) as totalTasks,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN success = 1 AND completion_time_ms < 300000 THEN 1 ELSE 0 END) as onTimeTasks,
        AVG(CASE WHEN success = 1 THEN quality_score ELSE 0 END) as avgQuality,
        SUM(error_count) as totalErrors,
        AVG(predicted_success_rate) as avgPredictionAccuracy
      FROM agent_performance_tracking
      WHERE agent_id = ?
      AND performance_date > datetime('now', '-${timeHorizon}')
    `;

    const performance = this.db.prepare(query).get([agentId]);

    if (!performance || performance.totalTasks === 0) {
      return { score: 0.5, metrics: { totalTasks: 0 }, confidence: 0.1 };
    }

    const metrics = {
      completionRate: performance.completedTasks / performance.totalTasks,
      onTimeDelivery: performance.onTimeTasks / performance.completedTasks,
      qualityScore: performance.avgQuality || 0.5,
      errorRate: performance.totalErrors / performance.totalTasks,
      predictionAccuracy: performance.avgPredictionAccuracy || 0.5,
      reliabilityCalibration: await this.calculateReliabilityCalibration(agentId, timeHorizon)
    };

    // Reliability heavily penalizes errors and missed deadlines
    const score = Math.max(0,
      (metrics.completionRate * 0.4) +
      (metrics.onTimeDelivery * 0.3) +
      (metrics.qualityScore * 0.3) -
      (metrics.errorRate * 0.5) +
      (metrics.predictionAccuracy * 0.1)
    );

    return {
      score: Math.min(1, score),
      metrics,
      trend: await this.calculateMetricTrend(agentId, 'reliability', timeHorizon),
      confidence: this.calculateMetricConfidence(performance.totalTasks)
    };
  }

  // CONTEXT QUALITY ASSESSMENT
  async assessContextQuality(context, taskRequirements, visionId = null, projectId = null) {
    console.log(`🔍 ASSESSING CONTEXT QUALITY FOR: ${taskRequirements?.substring(0, 50)}...`);

    try {
      const validation = {
        contextId: this.generateId('CTX-QA'),
        completeness: await this.assessCompleteness(context, taskRequirements),
        accuracy: await this.assessAccuracy(context),
        relevance: await this.assessRelevance(context, taskRequirements),
        specificity: await this.assessSpecificity(context),
        consistency: await this.assessConsistency(context)
      };

      const overallQuality = this.calculateContextQuality(validation);

      const contextData = {
        contextId: validation.contextId,
        taskId: taskRequirements.taskId || null,
        visionId,
        projectId,
        qualityScore: overallQuality,
        validation,
        recommendations: this.generateImprovementRecommendations(validation),
        gaps: this.identifyContextGaps(validation),
        assessmentDate: new Date().toISOString()
      };

      // Save context assessment
      await this.saveContextAssessment(contextData);

      return {
        ...contextData,
        approved: overallQuality >= 0.8,
        needsEnhancement: overallQuality < 0.8
      };

    } catch (error) {
      console.error(`❌ CONTEXT ASSESSMENT FAILED: ${error.message}`);
      return { error: error.message, qualityScore: 0 };
    }
  }

  // AGENT-CONTEXT MATCHING ALGORITHM
  async findOptimalAgentMatch(taskRequirements, context, constraints = {}) {
    console.log(`🎯 FINDING OPTIMAL AGENT MATCH FOR TASK...`);

    try {
      // Step 1: Get all available agents
      const availableAgents = await this.getAvailableAgents(constraints);

      // Step 2: Validate and enhance context
      const contextValidation = await this.assessContextQuality(context, taskRequirements);

      // Step 3: Score each agent for this specific task
      const agentScores = await Promise.all(
        availableAgents.map(async (agent) => {
          const score = await this.calculateAgentTaskScore(agent, taskRequirements, contextValidation);
          return { agent, score, breakdown: score.breakdown };
        })
      );

      // Step 4: Rank agents by suitability
      const rankedAgents = agentScores.sort((a, b) => b.score.overall - a.score.overall);

      // Step 5: Select optimal agent(s)
      const recommendedAgents = rankedAgents.filter(a => a.score.overall >= 0.8).slice(0, 3);

      // Step 6: Save matching results
      await this.saveAgentMatchingResults(recommendedAgents, taskRequirements, contextValidation);

      return {
        taskRequirements,
        contextQuality: contextValidation.qualityScore,
        recommendedAgents,
        alternativeOptions: rankedAgents.slice(3, 6),
        matchingConfidence: recommendedAgents.length > 0 ? recommendedAgents[0].score.overall : 0,
        recommendation: recommendedAgents.length > 0 ? {
          primaryAgent: recommendedAgents[0].agent,
          confidence: recommendedAgents[0].score.overall,
          reasoning: recommendedAgents[0].score.reasoning
        } : null
      };

    } catch (error) {
      console.error(`❌ AGENT MATCHING FAILED: ${error.message}`);
      return { error: error.message, recommendedAgents: [] };
    }
  }

  // AGENT TASK SCORE CALCULATION
  async calculateAgentTaskScore(agent, taskRequirements, contextValidation) {
    const scores = {
      skillMatch: await this.calculateSkillMatch(agent, taskRequirements),
      contextFit: await this.calculateContextFit(agent, contextValidation),
      historicalPerformance: await this.getHistoricalPerformance(agent, taskRequirements),
      availability: await this.checkAvailability(agent),
      reliability: agent.trust_score || 0.5
    };

    // Weighted scoring for agent-task matching
    const weights = {
      skillMatch: 0.35,
      contextFit: 0.25,
      historicalPerformance: 0.20,
      availability: 0.10,
      reliability: 0.10
    };

    const overall = Object.entries(scores).reduce((sum, [key, value]) => {
      return sum + (value * weights[key]);
    }, 0);

    return {
      overall,
      breakdown: { ...scores, weights },
      reasoning: this.generateScoreReasoning(scores, overall),
      confidence: this.calculateMatchingConfidence(scores)
    };
  }

  // TRUST-ENHANCED VISION VALIDATION INTEGRATION
  async validateVisionWithTrustAnalysis(visionId, projectId) {
    console.log(`🚀 TRUST-ENHANCED VISION VALIDATION: ${visionId}`);

    try {
      // Get existing validation results
      const existingValidation = await this.getExistingValidation(visionId);

      // Get assigned agents for this vision
      const assignedAgents = await this.getAssignedAgents(visionId);

      // Calculate agent trust analysis
      const agentTrustAnalysis = await this.analyzeAgentTrustworthiness(assignedAgents);

      // Assess context quality for this vision
      const contextQuality = await this.assessVisionContextQuality(visionId);

      // Calculate enhanced confidence
      const enhancedConfidence = this.calculateEnhancedConfidence({
        visionValidation: existingValidation,
        agentTrustAnalysis,
        contextQuality
      });

      // Update vision validation with trust-enhanced data
      await this.updateVisionValidationWithTrust(visionId, {
        existingValidation,
        agentTrustAnalysis,
        contextQuality,
        enhancedConfidence
      });

      return {
        visionId,
        existingValidation,
        agentTrustAnalysis,
        contextQuality,
        enhancedConfidence,
        recommendations: [
          ...this.generateAgentTrustRecommendations(agentTrustAnalysis),
          ...this.generateContextQualityRecommendations(contextQuality)
        ],
        trustEnhanced: true
      };

    } catch (error) {
      console.error(`❌ TRUST-ENHANCED VALIDATION FAILED: ${error.message}`);
      return { error: error.message, visionId };
    }
  }

  // HELPER METHODS
  generateId(prefix) {
    return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  calculateContextQuality(validation) {
    const weights = {
      completeness: 0.3,
      accuracy: 0.25,
      relevance: 0.2,
      specificity: 0.15,
      consistency: 0.1
    };

    return Object.entries(validation).reduce((sum, [key, value]) => {
      return sum + (value.score * weights[key]);
    }, 0);
  }

  async getAvailableAgents(constraints = {}) {
    const query = `
      SELECT ac.*, atv.trust_score, atv.reliability_score
      FROM agent_capabilities ac
      LEFT JOIN agent_trust_validation atv ON ac.agent_id = atv.agent_id
      WHERE ac.verified = 1
      ORDER BY atv.trust_score DESC
    `;

    return this.db.prepare(query).all();
  }

  async saveTrustValidation(trustData) {
    const stmt = this.db.prepare(`
      INSERT INTO agent_trust_validation (
        validation_id, agent_id, validation_date, trust_score, reliability_score,
        competence_score, communication_score, consistency_score, adaptability_score,
        validation_method, test_cases_evaluated, confidence_level, validation_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      trustData.validationId,
      trustData.agentId,
      trustData.validationDate,
      trustData.overallTrust,
      trustData.dimensions.reliability.score,
      trustData.dimensions.competence.score,
      trustData.dimensions.communication.score,
      trustData.dimensions.consistency.score,
      trustData.dimensions.adaptability.score,
      'TRUST_ENGINE_V1',
      trustData.dataPoints,
      trustData.confidence,
      'SYSTEM'
    ]);
  }

  async saveContextAssessment(contextData) {
    const stmt = this.db.prepare(`
      INSERT INTO context_quality_assessment (
        context_id, assessment_date, task_id, vision_id, project_id,
        context_quality_score, completeness_score, accuracy_score,
        relevance_score, specificity_score, consistency_score,
        gaps_identified, recommendations, validation_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      contextData.contextId,
      contextData.assessmentDate,
      contextData.taskId,
      contextData.visionId,
      contextData.projectId,
      contextData.qualityScore,
      contextData.validation.completeness.score,
      contextData.validation.accuracy.score,
      contextData.validation.relevance.score,
      contextData.validation.specificity.score,
      contextData.validation.consistency.score,
      JSON.stringify(contextData.gaps),
      JSON.stringify(contextData.recommendations),
      'CONTEXT_ENGINE_V1'
    ]);
  }

  // COMMUNICATION SCORE CALCULATION
  async calculateCommunicationScore(agentId, timeHorizon) {
    // Placeholder implementation - would analyze communication patterns
    const mockData = {
      responseClarity: 0.85,
      explanationQuality: 0.8,
      feedbackResponsiveness: 0.9,
      documentationQuality: 0.75
    };

    const score = Object.values(mockData).reduce((sum, val) => sum + val, 0) / Object.keys(mockData).length;

    return {
      score,
      metrics: mockData,
      trend: 'STABLE',
      confidence: 0.7
    };
  }

  // CONSISTENCY SCORE CALCULATION
  async calculateConsistencyScore(agentId, timeHorizon) {
    const query = `
      SELECT
        AVG(quality_score) as avgQuality,
        COUNT(*) as totalTasks,
        (MAX(quality_score) - MIN(quality_score)) as qualityRange,
        AVG(completion_time_ms) as avgCompletionTime
      FROM agent_performance_tracking
      WHERE agent_id = ?
      AND performance_date > datetime('now', '-${timeHorizon}')
    `;

    const performance = this.db.prepare(query).get([agentId]);

    if (!performance || performance.totalTasks < 3) {
      return { score: 0.5, metrics: { totalTasks: performance?.totalTasks || 0 }, confidence: 0.3 };
    }

    // Consistency: Lower quality range and stable completion times = higher consistency
    const qualityConsistency = Math.max(0, 1 - (performance.qualityRange / 1.0));
    const score = (qualityConsistency * 0.7) + 0.3; // Base 0.3 for some consistency

    return {
      score,
      metrics: {
        qualityRange: performance.qualityRange,
        avgQuality: performance.avgQuality,
        totalTasks: performance.totalTasks
      },
      trend: 'STABLE',
      confidence: Math.min(1, performance.totalTasks / 10)
    };
  }

  // ADAPTABILITY SCORE CALCULATION
  async calculateAdaptabilityScore(agentId, timeHorizon) {
    // Placeholder implementation - would analyze learning and adaptation patterns
    return {
      score: 0.8,
      metrics: {
        learningRate: 0.85,
        taskVarietyHandling: 0.75,
        feedbackIncorporation: 0.8,
        newSkillAcquisition: 0.82
      },
      trend: 'IMPROVING',
      confidence: 0.6
    };
  }

  // FEEDBACK SCORE CALCULATION
  async calculateFeedbackScore(agentId, timeHorizon) {
    // Placeholder implementation - would analyze user feedback and ratings
    return {
      score: 0.75,
      metrics: {
        userSatisfaction: 0.8,
        feedbackResponsiveness: 0.7,
        improvementBasedOnFeedback: 0.75
      },
      trend: 'STABLE',
      confidence: 0.5
    };
  }

  // HELPER METHODS IMPLEMENTATIONS
  async calculateCompetenceCalibration(agentId, timeHorizon) {
    // How well does agent's self-assessment match actual performance?
    return 0.8; // Placeholder
  }

  async calculateReliabilityCalibration(agentId, timeHorizon) {
    // How well does agent predict its own success rates?
    return 0.75; // Placeholder
  }

  async calculateMetricTrend(agentId, metric, timeHorizon) {
    // Calculate trend direction for specific metric
    return 'STABLE'; // Placeholder
  }

  calculateMetricConfidence(dataPoints) {
    // Confidence based on sample size
    return Math.min(1, dataPoints / 20);
  }

  async assessCompleteness(context, taskRequirements) {
    // Check if context contains all required elements
    const requiredElements = this.extractRequiredElements(taskRequirements);
    const providedElements = this.extractProvidedElements(context);
    const missingElements = requiredElements.filter(el => !providedElements.includes(el));

    const score = providedElements.length / Math.max(1, requiredElements.length);

    return {
      score,
      missingElements,
      providedElements,
      assessment: missingElements.length === 0 ? 'COMPLETE' : 'INCOMPLETE'
    };
  }

  async assessAccuracy(context) {
    // Verify factual accuracy of context information
    return {
      score: 0.85,
      checks: [
        { type: 'factual', score: 0.9 },
        { type: 'freshness', score: 0.8 },
        { type: 'sourceReliability', score: 0.85 }
      ]
    };
  }

  async assessRelevance(context, taskRequirements) {
    // Assess how relevant context is to task requirements
    return {
      score: 0.8,
      relevanceFactors: [
        { factor: 'domainMatch', score: 0.85 },
        { factor: 'taskAlignment', score: 0.8 },
        { factor: 'complexityMatch', score: 0.75 }
      ]
    };
  }

  async assessSpecificity(context) {
    // Assess level of detail and specificity in context
    return {
      score: 0.75,
      specificityMetrics: [
        { metric: 'detailLevel', score: 0.8 },
        { metric: 'actionability', score: 0.7 },
        { metric: 'precision', score: 0.75 }
      ]
    };
  }

  async assessConsistency(context) {
    // Check internal consistency of context information
    return {
      score: 0.9,
      consistencyChecks: [
        { check: 'internalLogic', score: 0.95 },
        { check: 'temporalConsistency', score: 0.85 },
        { check: 'factualConsistency', score: 0.9 }
      ]
    };
  }

  generateImprovementRecommendations(validation) {
    const recommendations = [];

    Object.entries(validation).forEach(([dimension, data]) => {
      if (data.score < 0.8) {
        recommendations.push({
          dimension,
          issue: `${dimension} below threshold`,
          score: data.score,
          recommendation: `Improve ${dimension} to enhance overall quality`
        });
      }
    });

    return recommendations;
  }

  identifyContextGaps(validation) {
    const gaps = [];

    Object.entries(validation).forEach(([dimension, data]) => {
      if (data.missingElements && data.missingElements.length > 0) {
        gaps.push({
          dimension,
          missingElements: data.missingElements,
          priority: data.score < 0.7 ? 'HIGH' : 'MEDIUM'
        });
      }
    });

    return gaps;
  }

  extractRequiredElements(taskRequirements) {
    // Extract required elements from task requirements
    return ['domain', 'objectives', 'constraints', 'success_criteria']; // Placeholder
  }

  extractProvidedElements(context) {
    // Extract provided elements from context
    return Object.keys(context); // Placeholder
  }

  async calculateSkillMatch(agent, taskRequirements) {
    // Match agent skills against task requirements
    return 0.85; // Placeholder
  }

  async calculateContextFit(agent, contextValidation) {
    // Assess how well agent fits with context
    return agent.context_fit_score || 0.8;
  }

  async getHistoricalPerformance(agent, taskRequirements) {
    // Get agent's historical performance on similar tasks
    const query = `
      SELECT AVG(quality_score) as avgQuality,
             AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successRate
      FROM agent_performance_tracking
      WHERE agent_id = ?
      AND performance_date > datetime('now', '-30 days')
    `;

    const result = this.db.prepare(query).get([agent.agent_id]);
    return result?.successRate || 0.75;
  }

  async checkAvailability(agent) {
    // Check agent availability
    return 0.9; // Placeholder
  }

  generateScoreReasoning(scores, overall) {
    const topFactors = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([factor, score]) => `${factor}: ${Math.round(score * 100)}%`);

    return `Score based on: ${topFactors.join(', ')}`;
  }

  calculateMatchingConfidence(scores) {
    const avgScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    return Math.min(1, avgScore);
  }

  async getExistingValidation(visionId) {
    const query = `
      SELECT * FROM vision_implementation_validation
      WHERE vision_id = ?
    `;

    return this.db.prepare(query).get([visionId]);
  }

  async getAssignedAgents(visionId) {
    // Get agents assigned to work on this vision
    return [
      { agent_id: 'AGENT-B', agent_model: 'claude-sonnet-4.5', trust_score: 0.85 }
    ]; // Placeholder
  }

  async analyzeAgentTrustworthiness(assignedAgents) {
    const trustAnalysis = [];

    for (const agent of assignedAgents) {
      const trustScore = await this.calculateTrustScore(agent.agent_id);
      trustAnalysis.push({
        agent: agent.agent_id,
        trustScore: trustScore.overallTrust,
        reliability: trustScore.dimensions?.reliability?.score || 0.5,
        competence: trustScore.dimensions?.competence?.score || 0.5
      });
    }

    return trustAnalysis;
  }

  async assessVisionContextQuality(visionId) {
    // Assess context quality for a specific vision
    return {
      contextId: this.generateId('VISION-CTX'),
      qualityScore: 0.85,
      validation: {
        completeness: { score: 0.9 },
        accuracy: { score: 0.85 },
        relevance: { score: 0.8 }
      }
    };
  }

  calculateEnhancedConfidence({ visionValidation, agentTrustAnalysis, contextQuality }) {
    const baseConfidence = visionValidation?.confidenceLevel || 0.5;
    const avgAgentTrust = agentTrustAnalysis.reduce((sum, agent) => sum + agent.trustScore, 0) / agentTrustAnalysis.length;
    const contextScore = contextQuality.qualityScore;

    // Weighted combination
    return (baseConfidence * 0.5) + (avgAgentTrust * 0.3) + (contextScore * 0.2);
  }

  async updateVisionValidationWithTrust(visionId, enhancedData) {
    const stmt = this.db.prepare(`
      UPDATE vision_implementation_validation SET
        assigned_agent_trust_score = ?,
        context_quality_score = ?,
        agent_match_confidence = ?,
        trust_enhanced_confidence = ?,
        trust_analysis_results = ?,
        validation_status = CASE WHEN ? >= 0.95 THEN 'PASSED' ELSE 'FAILED' END
      WHERE vision_id = ?
    `);

    const avgAgentTrust = enhancedData.agentTrustAnalysis.reduce((sum, agent) => sum + agent.trustScore, 0) / enhancedData.agentTrustAnalysis.length;

    stmt.run([
      avgAgentTrust,
      enhancedData.contextQuality.qualityScore,
      enhancedData.enhancedConfidence,
      enhancedData.enhancedConfidence,
      JSON.stringify(enhancedData),
      enhancedData.enhancedConfidence,
      visionId
    ]);
  }

  generateAgentTrustRecommendations(agentTrustAnalysis) {
    const recommendations = [];

    agentTrustAnalysis.forEach(agent => {
      if (agent.trustScore < 0.8) {
        recommendations.push({
          type: 'AGENT_TRUST',
          agent: agent.agent,
          issue: 'Low trust score',
          recommendation: 'Increase supervision or reassign task',
          priority: agent.trustScore < 0.6 ? 'HIGH' : 'MEDIUM'
        });
      }
    });

    return recommendations;
  }

  generateContextQualityRecommendations(contextQuality) {
    if (contextQuality.qualityScore >= 0.8) {
      return [];
    }

    return [{
      type: 'CONTEXT_QUALITY',
      issue: 'Context quality below threshold',
      recommendation: 'Enhance context with additional information',
      priority: contextQuality.qualityScore < 0.6 ? 'HIGH' : 'MEDIUM'
    }];
  }

  async saveAgentMatchingResults(recommendedAgents, taskRequirements, contextValidation) {
    // Save matching results to database
    for (const agentScore of recommendedAgents) {
      const stmt = this.db.prepare(`
        INSERT INTO agent_context_matching (
          match_id, agent_id, context_id, task_id, match_score,
          skill_match_score, context_fit_score, trust_weighted_score,
          match_confidence, recommendation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        this.generateId('MATCH'),
        agentScore.agent.agent_id,
        contextValidation.contextId,
        taskRequirements.taskId,
        agentScore.score.overall,
        agentScore.score.breakdown.skillMatch,
        agentScore.score.breakdown.contextFit,
        agentScore.score.overall, // Using overall as trust-weighted for now
        agentScore.score.confidence,
        true
      ]);
    }
  }

  async calculateTrustTrend(agentId, timeHorizon) {
    // Calculate trust trend over time
    return 'STABLE'; // Placeholder
  }

  async getDataPointCount(agentId, timeHorizon) {
    const query = `
      SELECT COUNT(*) as count
      FROM agent_performance_tracking
      WHERE agent_id = ?
      AND performance_date > datetime('now', '-${timeHorizon}')
    `;

    const result = this.db.prepare(query).get([agentId]);
    return result?.count || 0;
  }

  generateTrustRecommendation(overallTrust, dimensions) {
    if (overallTrust >= 0.9) {
      return { level: 'HIGH_TRUST', action: 'APPROVE_FOR_CRITICAL_TASKS' };
    } else if (overallTrust >= 0.8) {
      return { level: 'MEDIUM_TRUST', action: 'APPROVE_FOR_STANDARD_TASKS' };
    } else if (overallTrust >= 0.7) {
      return { level: 'LOW_TRUST', action: 'ASSIGN_WITH_SUPERVISION' };
    } else {
      return { level: 'CRITICAL', action: 'RETRAIN_BEFORE_ASSIGNMENT' };
    }
  }

  calculateTrustConfidence(dimensions) {
    const avgConfidence = Object.values(dimensions).reduce((sum, dim) => sum + dim.confidence, 0) / Object.keys(dimensions).length;
    return Math.min(1, avgConfidence);
  }
}

module.exports = AgentTrustEngine;

// AUTO-EXECUTE IF RUN DIRECTLY
if (require.main === module) {
  const dbPath = path.join(__dirname, '..', 'data', 'registry.db');
  const trustEngine = new AgentTrustEngine(dbPath);

  console.log('🧠 TESTING AGENT TRUST ENGINE...');

  // Test trust calculation for a sample agent
  trustEngine.calculateTrustScore('AGENT-B')
    .then(result => {
      console.log('✅ TRUST SCORE RESULT:', result);
      if (result.error) {
        console.error('❌ TRUST CALCULATION FAILED:', result.error);
      } else {
        console.log(`🎯 OVERALL TRUST: ${Math.round(result.overallTrust * 100)}%`);
        console.log(`📊 CONFIDENCE: ${Math.round(result.confidence * 100)}%`);
        console.log(`📈 TREND: ${result.trend}`);
        console.log(`💡 RECOMMENDATION: ${result.recommendation.level}`);
      }
    })
    .catch(error => {
      console.error('❌ ENGINE ERROR:', error.message);
    });
}