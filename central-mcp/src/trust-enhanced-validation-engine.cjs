// 🚀 TRUST-ENHANCED PHYSIOLOGY VALIDATION ENGINE
// Integrated with Central-MCP Physiology System
// Built: 2025-10-13 | Purpose: Enhanced validation with agent trust and context analysis

const Database = require('better-sqlite3');
const path = require('path');
const WorkingValidationEngine = require('./working-validation-engine.cjs');
const AgentTrustEngine = require('./agent-trust-engine.cjs');

class TrustEnhancedValidationEngine extends WorkingValidationEngine {
  constructor(dbPath) {
    super(dbPath);
    this.trustEngine = new AgentTrustEngine(dbPath);
  }

  // ENHANCED VISION VALIDATION WITH TRUST ANALYSIS
  async validateVisionImplementationAdvancedWithTrust(visionId, projectId) {
    console.log(`🚀 TRUST-ENHANCED VISION VALIDATION: ${visionId}`);

    try {
      // Step 1: Get original validation results
      const originalValidation = await this.validateVisionImplementationAdvanced(visionId, projectId);

      // Step 2: Analyze agent trustworthiness
      const agentTrustAnalysis = await this.analyzeAgentTrustForVision(visionId, projectId);

      // Step 3: Assess context quality
      const contextQualityAssessment = await this.assessContextForVision(visionId, projectId);

      // Step 4: Calculate trust-enhanced confidence
      const trustEnhancedConfidence = this.calculateTrustEnhancedConfidence({
        originalValidation,
        agentTrustAnalysis,
        contextQualityAssessment
      });

      // Step 5: Generate integrated recommendations
      const integratedRecommendations = this.generateIntegratedRecommendations({
        originalValidation,
        agentTrustAnalysis,
        contextQualityAssessment,
        trustEnhancedConfidence
      });

      // Step 6: Save enhanced validation results
      await this.saveTrustEnhancedValidation(visionId, {
        originalValidation,
        agentTrustAnalysis,
        contextQualityAssessment,
        trustEnhancedConfidence,
        integratedRecommendations
      });

      const result = {
        visionId,
        originalValidation,
        agentTrustAnalysis,
        contextQualityAssessment,
        trustEnhancedConfidence,
        integratedRecommendations,
        trustEnhanced: true
      };

      console.log(`✅ TRUST-ENHANCED VALIDATION COMPLETE: ${Math.round(trustEnhancedConfidence.confidenceLevel * 100)}% confidence`);
      console.log(`🤖 Agent Trust Impact: ${Math.round((trustEnhancedConfidence.confidenceLevel - originalValidation.confidenceLevel) * 100)}% points`);
      console.log(`📋 Total Recommendations: ${integratedRecommendations.length}`);

      return result;

    } catch (error) {
      console.error(`❌ TRUST-ENHANCED VALIDATION FAILED: ${error.message}`);
      return { error: error.message, visionId };
    }
  }

  // AGENT TRUST ANALYSIS FOR VISION
  async analyzeAgentTrustForVision(visionId, projectId) {
    console.log(`🤖 ANALYZING AGENT TRUST FOR VISION: ${visionId}`);

    try {
      // Get vision requirements
      const visionData = this.getVisionRequirements(visionId);
      if (!visionData) {
        return { error: 'Vision not found', agents: [] };
      }

      // Get all available agents
      const availableAgents = await this.getAvailableAgentsWithTrust();

      // Analyze trust for each agent
      const agentTrustScores = [];

      for (const agent of availableAgents) {
        const trustScore = await this.trustEngine.calculateTrustScore(agent.agent_id);

        agentTrustScores.push({
          agentId: agent.agent_id,
          agentModel: agent.agent_model,
          overallTrust: trustScore.overallTrust,
          reliability: trustScore.dimensions?.reliability?.score || 0.5,
          competence: trustScore.dimensions?.competence?.score || 0.5,
          communication: trustScore.dimensions?.communication?.score || 0.5,
          consistency: trustScore.dimensions?.consistency?.score || 0.5,
          adaptability: trustScore.dimensions?.adaptability?.score || 0.5,
          confidence: trustScore.confidence,
          recommendation: trustScore.recommendation,
          suitableForVision: this.assessAgentSuitabilityForVision(trustScore, visionData)
        });
      }

      // Sort by trust score
      agentTrustScores.sort((a, b) => b.overallTrust - a.overallTrust);

      // Calculate aggregate trust metrics
      const avgTrust = agentTrustScores.reduce((sum, agent) => sum + agent.overallTrust, 0) / agentTrustScores.length;
      const highTrustAgents = agentTrustScores.filter(agent => agent.overallTrust >= 0.8);
      const criticalAgents = agentTrustScores.filter(agent => agent.overallTrust < 0.6);

      return {
        visionId,
        agents: agentTrustScores,
        aggregateMetrics: {
          totalAgents: agentTrustScores.length,
          averageTrust: avgTrust,
          highTrustAgents: highTrustAgents.length,
          criticalAgents: criticalAgents.length,
          trustDistribution: this.calculateTrustDistribution(agentTrustScores)
        },
        topRecommendation: agentTrustScores[0] || null,
        trustRiskLevel: this.assessTrustRiskLevel(avgTrust, criticalAgents.length)
      };

    } catch (error) {
      console.error(`❌ AGENT TRUST ANALYSIS FAILED: ${error.message}`);
      return { error: error.message, agents: [] };
    }
  }

  // CONTEXT QUALITY ASSESSMENT FOR VISION
  async assessContextForVision(visionId, projectId) {
    console.log(`📝 ASSESSING CONTEXT QUALITY FOR VISION: ${visionId}`);

    try {
      // Get vision requirements
      const visionData = this.getVisionRequirements(visionId);
      if (!visionData) {
        return { error: 'Vision not found', qualityScore: 0 };
      }

      // Create context from vision data
      const context = {
        visionId,
        userIntent: visionData.userIntent,
        businessContext: visionData.businessContext,
        successCriteria: visionData.successCriteria,
        constraints: visionData.constraints,
        projectId
      };

      // Create task requirements
      const taskRequirements = {
        taskId: `TASK-${visionId}`,
        visionId,
        complexity: this.assessVisionComplexity(visionData),
        requiredSkills: this.extractRequiredSkills(visionData),
        domain: this.extractDomain(visionData.businessContext)
      };

      // Assess context quality
      const contextAssessment = await this.trustEngine.assessContextQuality(context, taskRequirements, visionId, projectId);

      return {
        visionId,
        contextAssessment,
        enhancementOpportunities: this.identifyEnhancementOpportunities(contextAssessment),
        recommendedActions: this.generateContextRecommendations(contextAssessment)
      };

    } catch (error) {
      console.error(`❌ CONTEXT ASSESSMENT FAILED: ${error.message}`);
      return { error: error.message, qualityScore: 0 };
    }
  }

  // TRUST-ENHANCED CONFIDENCE CALCULATION
  calculateTrustEnhancedConfidence({ originalValidation, agentTrustAnalysis, contextQualityAssessment }) {
    const baseConfidence = originalValidation.confidenceLevel || 0;

    // Calculate agent trust factor
    const avgAgentTrust = agentTrustAnalysis.aggregateMetrics?.averageTrust || 0.5;
    const agentTrustFactor = Math.max(0.5, avgAgentTrust); // Minimum 0.5 factor

    // Calculate context quality factor
    const contextQualityScore = contextQualityAssessment.contextAssessment?.qualityScore || 0.5;
    const contextQualityFactor = Math.max(0.5, contextQualityScore);

    // Risk adjustment based on critical agents
    const riskAdjustment = agentTrustAnalysis.aggregateMetrics?.criticalAgents > 0 ?
      -0.1 * (agentTrustAnalysis.aggregateMetrics.criticalAgents / agentTrustAnalysis.aggregateMetrics.totalAgents) : 0;

    // Enhanced confidence calculation
    const trustEnhancedConfidence = Math.min(1,
      (baseConfidence * 0.4) +           // 40% original validation
      (agentTrustFactor * 0.35) +        // 35% agent trust
      (contextQualityFactor * 0.25)      // 25% context quality
    ) + riskAdjustment;

    return {
      confidenceLevel: Math.max(0, trustEnhancedConfidence),
      meets95PercentConfidence: trustEnhancedConfidence >= 0.95,
      components: {
        originalValidation: baseConfidence,
        agentTrustFactor,
        contextQualityFactor,
        riskAdjustment
      },
      enhancementImpact: trustEnhancedConfidence - baseConfidence,
      enhancementReasons: [
        ...(agentTrustFactor > 0.7 ? ['High agent trustworthiness'] : []),
        ...(contextQualityFactor > 0.8 ? ['Excellent context quality'] : []),
        ...(riskAdjustment < 0 ? ['Risk adjustment applied'] : [])
      ]
    };
  }

  // INTEGRATED RECOMMENDATIONS GENERATION
  generateIntegratedRecommendations({ originalValidation, agentTrustAnalysis, contextQualityAssessment, trustEnhancedConfidence }) {
    const recommendations = [];

    // Agent trust recommendations
    if (agentTrustAnalysis.aggregateMetrics?.criticalAgents > 0) {
      recommendations.push({
        type: 'AGENT_TRUST_CRITICAL',
        priority: 'HIGH',
        title: 'Critical Agent Trust Issues',
        description: `${agentTrustAnalysis.aggregateMetrics.criticalAgents} agents have trust scores below 60%`,
        action: 'Retrain or replace critical agents before proceeding',
        impact: 'High'
      });
    }

    if (agentTrustAnalysis.aggregateMetrics?.highTrustAgents === 0) {
      recommendations.push({
        type: 'AGENT_TRUST_NONE',
        priority: 'HIGH',
        title: 'No High-Trust Agents Available',
        description: 'No agents meet 80% trust threshold',
        action: 'Consider manual review or external validation',
        impact: 'High'
      });
    }

    // Context quality recommendations
    if (contextQualityAssessment.contextAssessment?.qualityScore < 0.8) {
      recommendations.push({
        type: 'CONTEXT_QUALITY',
        priority: 'MEDIUM',
        title: 'Context Quality Enhancement Needed',
        description: `Context quality score: ${Math.round((contextQualityAssessment.contextAssessment.qualityScore || 0) * 100)}%`,
        action: 'Enhance context with additional information and clarifications',
        impact: 'Medium'
      });
    }

    // Confidence threshold recommendations
    if (!trustEnhancedConfidence.meets95PercentConfidence) {
      const gap = 0.95 - trustEnhancedConfidence.confidenceLevel;

      recommendations.push({
        type: 'CONFIDENCE_GAP',
        priority: 'HIGH',
        title: 'Below 95% Confidence Threshold',
        description: `${Math.round(gap * 100)}% gap from required threshold`,
        action: 'Address agent trust and context quality issues to meet threshold',
        impact: 'Critical'
      });
    }

    // Positive reinforcement recommendations
    if (agentTrustAnalysis.aggregateMetrics?.highTrustAgents > 0 &&
        contextQualityAssessment.contextAssessment?.qualityScore >= 0.8) {
      recommendations.push({
        type: 'POSITIVE_REINFORCEMENT',
        priority: 'LOW',
        title: 'Strong Foundation',
        description: 'High agent trust and good context quality established',
        action: 'Proceed with implementation while maintaining standards',
        impact: 'Positive'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // HELPER METHODS
  async getAvailableAgentsWithTrust() {
    const query = `
      SELECT DISTINCT
        as.agent_id,
        as.agent_model,
        ac.trust_score,
        ac.reliability_score,
        ac.context_fit_score,
        ac.performance_trend
      FROM agent_sessions as
      LEFT JOIN agent_capabilities ac ON as.agent_id = ac.agent_id
      WHERE as.status = 'ACTIVE'
      ORDER BY ac.trust_score DESC
    `;

    return this.db.prepare(query).all();
  }

  assessAgentSuitabilityForVision(trustScore, visionData) {
    // Assess if agent is suitable based on trust scores and vision complexity
    const visionComplexity = this.assessVisionComplexity(visionData);

    if (trustScore.overallTrust >= 0.9 && visionComplexity <= 0.7) {
      return 'HIGHLY_SUITABLE';
    } else if (trustScore.overallTrust >= 0.8 && visionComplexity <= 0.8) {
      return 'SUITABLE';
    } else if (trustScore.overallTrust >= 0.7) {
      return 'MARGINAL';
    } else {
      return 'NOT_SUITABLE';
    }
  }

  assessVisionComplexity(visionData) {
    // Simple complexity assessment based on vision characteristics
    let complexity = 0.5; // Base complexity

    if (visionData.successCriteria.length > 3) complexity += 0.1;
    if (visionData.constraints.length > 2) complexity += 0.1;
    if (visionData.userIntent.length > 100) complexity += 0.1;
    if (visionData.businessContext.includes('complex') || visionData.businessContext.includes('enterprise')) {
      complexity += 0.2;
    }

    return Math.min(1, complexity);
  }

  extractRequiredSkills(visionData) {
    // Extract required skills from vision data
    const skills = [];

    if (visionData.userIntent.includes('analysis')) skills.push('data_analysis');
    if (visionData.userIntent.includes('development')) skills.push('software_development');
    if (visionData.userIntent.includes('design')) skills.push('ui_design');
    if (visionData.userIntent.includes('testing')) skills.push('quality_assurance');

    return skills.length > 0 ? skills : ['general_development'];
  }

  extractDomain(businessContext) {
    // Extract domain from business context
    if (businessContext.includes('e-commerce')) return 'ecommerce';
    if (businessContext.includes('healthcare')) return 'healthcare';
    if (businessContext.includes('finance')) return 'finance';
    if (businessContext.includes('education')) return 'education';
    return 'general';
  }

  calculateTrustDistribution(agentTrustScores) {
    const distribution = {
      high: agentTrustScores.filter(a => a.overallTrust >= 0.8).length,
      medium: agentTrustScores.filter(a => a.overallTrust >= 0.6 && a.overallTrust < 0.8).length,
      low: agentTrustScores.filter(a => a.overallTrust < 0.6).length
    };

    return distribution;
  }

  assessTrustRiskLevel(avgTrust, criticalCount) {
    if (criticalCount > 0 || avgTrust < 0.6) return 'HIGH';
    if (avgTrust < 0.8 || criticalCount > 0) return 'MEDIUM';
    return 'LOW';
  }

  identifyEnhancementOpportunities(contextAssessment) {
    const opportunities = [];

    if (contextAssessment.gaps && contextAssessment.gaps.length > 0) {
      opportunities.push({
        type: 'GAPS_FILLING',
        description: `Fill ${contextAssessment.gaps.length} identified context gaps`
      });
    }

    if (contextAssessment.recommendations && contextAssessment.recommendations.length > 0) {
      opportunities.push({
        type: 'RECOMMENDATIONS_IMPLEMENTATION',
        description: `Implement ${contextAssessment.recommendations.length} context improvements`
      });
    }

    return opportunities;
  }

  generateContextRecommendations(contextAssessment) {
    if (!contextAssessment.recommendations) {
      return ['No specific context recommendations needed'];
    }

    return contextAssessment.recommendations.map(rec => rec.recommendation || rec.description);
  }

  async saveTrustEnhancedValidation(visionId, enhancedData) {
    const stmt = this.db.prepare(`
      UPDATE vision_implementation_validation SET
        assigned_agent_trust_score = ?,
        context_quality_score = ?,
        agent_match_confidence = ?,
        trust_enhanced_confidence = ?,
        trust_analysis_results = ?,
        validation_status = CASE WHEN ? >= 0.95 THEN 'PASSED' ELSE 'FAILED' END,
        validation_completed_at = datetime('now')
      WHERE vision_id = ?
    `);

    const avgAgentTrust = enhancedData.agentTrustAnalysis.aggregateMetrics?.averageTrust || 0.5;
    const contextQualityScore = enhancedData.contextQualityAssessment.contextAssessment?.qualityScore || 0.5;
    const trustEnhancedConfidence = enhancedData.trustEnhancedConfidence.confidenceLevel;

    stmt.run([
      avgAgentTrust,
      contextQualityScore,
      trustEnhancedConfidence,
      trustEnhancedConfidence,
      JSON.stringify(enhancedData),
      trustEnhancedConfidence,
      visionId
    ]);
  }
}

module.exports = TrustEnhancedValidationEngine;

// AUTO-EXECUTE IF RUN DIRECTLY
if (require.main === module) {
  const dbPath = path.join(__dirname, '..', 'data', 'registry.db');
  const enhancedEngine = new TrustEnhancedValidationEngine(dbPath);

  console.log('🚀 TESTING TRUST-ENHANCED VALIDATION ENGINE...');

  // Test with our actual Vector-UI project
  enhancedEngine.validateVisionImplementationAdvancedWithTrust('VISION-VECTORUI-001', 'cbe30e8e-c53a-4e9b-a7e3-d2bf1419b442')
    .then(result => {
      console.log('✅ TRUST-ENHANCED VALIDATION RESULT:');
      console.log(`🎯 Enhanced Confidence: ${Math.round((result.trustEnhancedConfidence?.confidenceLevel || 0) * 100)}%`);
      console.log(`📊 Original Confidence: ${Math.round((result.originalValidation?.confidenceLevel || 0) * 100)}%`);
      console.log(`🚀 Enhancement Impact: ${Math.round((result.trustEnhancedConfidence?.enhancementImpact || 0) * 100)}% points`);
      console.log(`🤖 Agent Trust Analysis: ${result.agentTrustAnalysis?.agents?.length || 0} agents analyzed`);
      console.log(`📝 Context Quality: ${Math.round((result.contextQualityAssessment?.contextAssessment?.qualityScore || 0) * 100)}%`);
      console.log(`📋 Integrated Recommendations: ${result.integratedRecommendations?.length || 0}`);

      if (result.error) {
        console.error('❌ VALIDATION FAILED:', result.error);
      } else {
        console.log('\n🔧 TOP INTEGRATED RECOMMENDATIONS:');
        result.integratedRecommendations?.slice(0, 3).forEach((rec, i) => {
          console.log(`  ${i + 1}. [${rec.priority}] ${rec.title}`);
          console.log(`     ${rec.description}`);
          console.log(`     Action: ${rec.action}`);
        });
      }
    })
    .catch(error => {
      console.error('❌ ENGINE ERROR:', error.message);
    });
}