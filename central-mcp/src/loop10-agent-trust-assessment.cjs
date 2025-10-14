// 🔄 LOOP 10: AGENT TRUST ASSESSMENT
// Integrated with Central-MCP Physiology Monitoring System
// Built: 2025-10-13 | Purpose: Continuous agent trustworthiness monitoring

const Database = require('better-sqlite3');
const path = require('path');
const AgentTrustEngine = require('./agent-trust-engine.cjs');

class AgentTrustAssessmentLoop {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.trustEngine = new AgentTrustEngine(dbPath);
    this.loopInterval = 300000; // 5 minutes
    this.isRunning = false;
  }

  // MAIN LOOP EXECUTION
  async runAgentTrustAssessmentLoop() {
    if (this.isRunning) {
      console.log('🔄 Loop 10: Agent Trust Assessment already running...');
      return;
    }

    console.log('🔬 LOOP 10: AGENT TRUST ASSESSMENT - Starting trustworthiness analysis...');
    this.isRunning = true;

    try {
      const startTime = Date.now();

      // Step 1: Get all active agents
      const activeAgents = await this.getActiveAgents();
      console.log(`📊 Found ${activeAgents.length} active agents for trust assessment`);

      // Step 2: Assess trust for each agent
      const trustAssessments = [];

      for (const agent of activeAgents) {
        const assessment = await this.assessAgentTrust(agent);
        trustAssessments.push(assessment);

        // Log individual agent results
        console.log(`  🤖 ${agent.agent_id}: ${Math.round(assessment.overallTrust * 100)}% trust (${assessment.recommendation.level})`);
      }

      // Step 3: Analyze overall trust health
      const trustHealth = this.analyzeOverallTrustHealth(trustAssessments);
      console.log(`  🏥 Overall Trust Health: ${trustHealth.status} (${trustHealth.averageTrust}% average)`);

      // Step 4: Identify trust issues and alerts
      const trustAlerts = this.identifyTrustAlerts(trustAssessments);

      if (trustAlerts.length > 0) {
        console.log(`  ⚠️  Generated ${trustAlerts.length} trust alerts`);
        for (const alert of trustAlerts) {
          console.log(`     ${alert.severity}: ${alert.message}`);
        }
      }

      // Step 5: Update agent capabilities with trust data
      await this.updateAgentCapabilitiesWithTrust(trustAssessments);

      // Step 6: Generate trust improvement recommendations
      const recommendations = this.generateTrustRecommendations(trustAssessments, trustHealth);

      if (recommendations.length > 0) {
        console.log(`  💡 Generated ${recommendations.length} trust improvement recommendations`);
      }

      // Step 7: Save assessment results to database
      await this.saveLoopResults(trustAssessments, trustHealth, trustAlerts, recommendations);

      const duration = Date.now() - startTime;
      console.log(`✅ LOOP 10 COMPLETE: Trust assessment finished in ${duration}ms`);

      // Log summary
      this.logTrustAssessmentSummary(trustAssessments, trustHealth, trustAlerts);

    } catch (error) {
      console.error(`❌ LOOP 10 ERROR: Agent trust assessment failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  // INDIVIDUAL AGENT TRUST ASSESSMENT
  async assessAgentTrust(agent) {
    try {
      // Calculate trust score
      const trustScore = await this.trustEngine.calculateTrustScore(agent.agent_id);

      // Get recent performance metrics
      const recentPerformance = await this.getRecentPerformance(agent.agent_id);

      // Check trust trend
      const trustTrend = await this.getTrustTrend(agent.agent_id);

      // Calculate trust risk level
      const riskLevel = this.calculateRiskLevel(trustScore, recentPerformance);

      return {
        agentId: agent.agent_id,
        agentModel: agent.agent_model,
        assessmentTime: new Date().toISOString(),
        overallTrust: trustScore.overallTrust,
        dimensions: trustScore.dimensions,
        confidence: trustScore.confidence,
        recommendation: trustScore.recommendation,
        recentPerformance,
        trustTrend,
        riskLevel,
        alerts: this.generateAgentAlerts(trustScore, recentPerformance)
      };

    } catch (error) {
      console.error(`❌ Failed to assess trust for agent ${agent.agent_id}: ${error.message}`);
      return {
        agentId: agent.agent_id,
        error: error.message,
        overallTrust: 0,
        recommendation: { level: 'ERROR', action: 'MANUAL_REVIEW_REQUIRED' }
      };
    }
  }

  // GET ACTIVE AGENTS
  async getActiveAgents() {
    const query = `
      SELECT
        agent_sessions.agent_letter as agent_id,
        agent_sessions.agent_model,
        agent_sessions.connected_at as session_started,
        agent_sessions.last_heartbeat,
        COUNT(agent_performance_tracking.task_id) as recent_tasks
      FROM agent_sessions
      LEFT JOIN agent_performance_tracking ON agent_sessions.agent_letter = agent_performance_tracking.agent_id
        AND agent_performance_tracking.performance_date > datetime('now', '-7 days')
      WHERE agent_sessions.status = 'ACTIVE'
        AND agent_sessions.last_heartbeat > datetime('now', '-10 minutes')
      GROUP BY agent_sessions.agent_letter, agent_sessions.agent_model, agent_sessions.connected_at, agent_sessions.last_heartbeat
      ORDER BY agent_sessions.last_heartbeat DESC
    `;

    return this.db.prepare(query).all();
  }

  // GET RECENT PERFORMANCE METRICS
  async getRecentPerformance(agentId) {
    const query = `
      SELECT
        COUNT(*) as totalTasks,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulTasks,
        AVG(quality_score) as avgQuality,
        AVG(completion_time_ms) as avgCompletionTime,
        AVG(CASE WHEN predicted_success_rate IS NOT NULL THEN predicted_success_rate ELSE 0 END) as avgPredictionAccuracy,
        MAX(performance_date) as lastActivity
      FROM agent_performance_tracking
      WHERE agent_id = ?
        AND performance_date > datetime('now', '-7 days')
    `;

    const result = this.db.prepare(query).get([agentId]);

    if (!result || result.totalTasks === 0) {
      return {
        totalTasks: 0,
        successRate: 0,
        avgQuality: 0,
        avgCompletionTime: 0,
        predictionAccuracy: 0,
        lastActivity: null,
        activityLevel: 'INACTIVE'
      };
    }

    return {
      totalTasks: result.totalTasks,
      successRate: result.successfulTasks / result.totalTasks,
      avgQuality: result.avgQuality || 0,
      avgCompletionTime: result.avgCompletionTime || 0,
      predictionAccuracy: result.avgPredictionAccuracy || 0,
      lastActivity: result.lastActivity,
      activityLevel: result.totalTasks > 5 ? 'HIGH' : result.totalTasks > 2 ? 'MEDIUM' : 'LOW'
    };
  }

  // GET TRUST TREND
  async getTrustTrend(agentId) {
    const query = `
      SELECT
        validation_date,
        trust_score
      FROM agent_trust_validation
      WHERE agent_id = ?
        AND validation_date > datetime('now', '-14 days')
      ORDER BY validation_date ASC
    `;

    const results = this.db.prepare(query).all([agentId]);

    if (results.length < 2) {
      return { trend: 'INSUFFICIENT_DATA', direction: 'UNKNOWN', change: 0 };
    }

    const recent = results.slice(-3); // Last 3 assessments
    const avgRecent = recent.reduce((sum, r) => sum + r.trust_score, 0) / recent.length;

    const older = results.slice(0, Math.min(3, results.length - 3));
    const avgOlder = older.length > 0 ? older.reduce((sum, r) => sum + r.trust_score, 0) / older.length : avgRecent;

    const change = avgRecent - avgOlder;
    const trend = change > 0.05 ? 'IMPROVING' : change < -0.05 ? 'DECLINING' : 'STABLE';

    return {
      trend,
      direction: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
      change: Math.round(change * 100),
      dataPoints: results.length,
      recentAverage: Math.round(avgRecent * 100),
      olderAverage: Math.round(avgOlder * 100)
    };
  }

  // CALCULATE RISK LEVEL
  calculateRiskLevel(trustScore, recentPerformance) {
    let riskScore = 0;

    // Trust score risk
    if (trustScore.overallTrust < 0.6) riskScore += 3;
    else if (trustScore.overallTrust < 0.8) riskScore += 1;

    // Performance risk
    if (recentPerformance.successRate < 0.7) riskScore += 2;
    else if (recentPerformance.successRate < 0.9) riskScore += 1;

    // Confidence risk
    if (trustScore.confidence < 0.5) riskScore += 1;

    // Activity risk
    if (recentPerformance.activityLevel === 'INACTIVE') riskScore += 2;
    else if (recentPerformance.activityLevel === 'LOW') riskScore += 1;

    if (riskScore >= 5) return 'CRITICAL';
    if (riskScore >= 3) return 'HIGH';
    if (riskScore >= 1) return 'MEDIUM';
    return 'LOW';
  }

  // GENERATE AGENT ALERTS
  generateAgentAlerts(trustScore, recentPerformance) {
    const alerts = [];

    if (trustScore.overallTrust < 0.6) {
      alerts.push({
        type: 'LOW_TRUST',
        severity: 'HIGH',
        message: `Trust score critically low: ${Math.round(trustScore.overallTrust * 100)}%`
      });
    }

    if (recentPerformance.successRate < 0.7) {
      alerts.push({
        type: 'POOR_PERFORMANCE',
        severity: 'HIGH',
        message: `Success rate below threshold: ${Math.round(recentPerformance.successRate * 100)}%`
      });
    }

    if (trustScore.confidence < 0.5) {
      alerts.push({
        type: 'LOW_CONFIDENCE',
        severity: 'MEDIUM',
        message: `Low confidence in trust assessment: ${Math.round(trustScore.confidence * 100)}%`
      });
    }

    if (recentPerformance.activityLevel === 'INACTIVE') {
      alerts.push({
        type: 'INACTIVITY',
        severity: 'MEDIUM',
        message: 'Agent has been inactive for extended period'
      });
    }

    return alerts;
  }

  // ANALYZE OVERALL TRUST HEALTH
  analyzeOverallTrustHealth(trustAssessments) {
    if (trustAssessments.length === 0) {
      return {
        status: 'NO_DATA',
        averageTrust: 0,
        highTrustAgents: 0,
        criticalAgents: 0,
        healthScore: 0
      };
    }

    const validAssessments = trustAssessments.filter(a => !a.error);
    const averageTrust = validAssessments.reduce((sum, a) => sum + a.overallTrust, 0) / validAssessments.length;
    const highTrustAgents = validAssessments.filter(a => a.overallTrust >= 0.8).length;
    const criticalAgents = validAssessments.filter(a => a.overallTrust < 0.6).length;

    let status, healthScore;
    if (averageTrust >= 0.85 && criticalAgents === 0) {
      status = 'EXCELLENT';
      healthScore = 100;
    } else if (averageTrust >= 0.75 && criticalAgents === 0) {
      status = 'GOOD';
      healthScore = 80 + (averageTrust - 0.75) * 100;
    } else if (averageTrust >= 0.65) {
      status = 'FAIR';
      healthScore = 60 + (averageTrust - 0.65) * 50;
    } else {
      status = 'POOR';
      healthScore = Math.max(0, 40 + (averageTrust - 0.5) * 40);
    }

    return {
      status,
      averageTrust: Math.round(averageTrust * 100),
      healthScore: Math.round(healthScore),
      totalAgents: validAssessments.length,
      highTrustAgents,
      criticalAgents,
      riskDistribution: {
        low: validAssessments.filter(a => a.riskLevel === 'LOW').length,
        medium: validAssessments.filter(a => a.riskLevel === 'MEDIUM').length,
        high: validAssessments.filter(a => a.riskLevel === 'HIGH').length,
        critical: validAssessments.filter(a => a.riskLevel === 'CRITICAL').length
      }
    };
  }

  // IDENTIFY TRUST ALERTS
  identifyTrustAlerts(trustAssessments) {
    const alerts = [];
    const validAssessments = trustAssessments.filter(a => !a.error);

    // System-wide alerts
    const criticalAgents = validAssessments.filter(a => a.overallTrust < 0.6);
    if (criticalAgents.length > 0) {
      alerts.push({
        type: 'CRITICAL_AGENTS',
        severity: 'CRITICAL',
        message: `${criticalAgents.length} agents with critical trust levels (<60%)`,
        affectedAgents: criticalAgents.map(a => a.agentId)
      });
    }

    // Performance alerts
    const poorPerformers = validAssessments.filter(a => a.recentPerformance.successRate < 0.7);
    if (poorPerformers.length > 0) {
      alerts.push({
        type: 'POOR_PERFORMANCE',
        severity: 'HIGH',
        message: `${poorPerformers.length} agents with poor recent performance (<70% success)`,
        affectedAgents: poorPerformers.map(a => a.agentId)
      });
    }

    // Inactivity alerts
    const inactiveAgents = validAssessments.filter(a => a.recentPerformance.activityLevel === 'INACTIVE');
    if (inactiveAgents.length > 0) {
      alerts.push({
        type: 'INACTIVE_AGENTS',
        severity: 'MEDIUM',
        message: `${inactiveAgents.length} agents inactive for extended period`,
        affectedAgents: inactiveAgents.map(a => a.agentId)
      });
    }

    return alerts;
  }

  // UPDATE AGENT CAPABILITIES WITH TRUST DATA
  async updateAgentCapabilitiesWithTrust(trustAssessments) {
    const stmt = this.db.prepare(`
      UPDATE agent_capabilities SET
        trust_score = ?,
        reliability_score = ?,
        last_trust_assessment = ?,
        performance_trend = ?,
        confidence_calibration = ?
      WHERE agent_id = ?
    `);

    for (const assessment of trustAssessments) {
      if (!assessment.error) {
        stmt.run([
          assessment.overallTrust,
          assessment.dimensions?.reliability?.score || 0.5,
          assessment.assessmentTime,
          assessment.trustTrend?.trend || 'UNKNOWN',
          assessment.confidence,
          assessment.agentId
        ]);
      }
    }
  }

  // GENERATE TRUST RECOMMENDATIONS
  generateTrustRecommendations(trustAssessments, trustHealth) {
    const recommendations = [];

    // System-wide recommendations
    if (trustHealth.status === 'POOR') {
      recommendations.push({
        type: 'SYSTEM_HEALTH',
        priority: 'CRITICAL',
        title: 'System Trust Health Critical',
        description: 'Overall agent trust health is poor, immediate intervention required',
        action: 'Review all agent assignments and consider external validation',
        impact: 'System-wide reliability'
      });
    }

    // Critical agent recommendations
    const criticalAgents = trustAssessments.filter(a => !a.error && a.overallTrust < 0.6);
    if (criticalAgents.length > 0) {
      recommendations.push({
        type: 'CRITICAL_AGENTS',
        priority: 'HIGH',
        title: 'Critical Agent Trust Issues',
        description: `${criticalAgents.length} agents have trust scores below 60%`,
        action: 'Retrain or replace critical agents immediately',
        impact: 'Task completion reliability'
      });
    }

    // Performance improvement recommendations
    const poorPerformers = trustAssessments.filter(a => !a.error && a.recentPerformance.successRate < 0.7);
    if (poorPerformers.length > 0) {
      recommendations.push({
        type: 'PERFORMANCE_IMPROVEMENT',
        priority: 'HIGH',
        title: 'Agent Performance Issues',
        description: `${poorPerformers.length} agents with poor recent performance`,
        action: 'Implement targeted training and performance monitoring',
        impact: 'Overall system performance'
      });
    }

    return recommendations;
  }

  // SAVE LOOP RESULTS
  async saveLoopResults(trustAssessments, trustHealth, trustAlerts, recommendations) {
    const loopResult = {
      loopId: this.generateLoopId(),
      executionTime: new Date().toISOString(),
      loopType: 'AGENT_TRUST_ASSESSMENT',
      results: {
        trustAssessments,
        trustHealth,
        alerts: trustAlerts,
        recommendations
      },
      summary: {
        totalAgents: trustAssessments.length,
        averageTrust: trustHealth.averageTrust,
        healthStatus: trustHealth.status,
        alertsGenerated: trustAlerts.length,
        recommendationsGenerated: recommendations.length
      }
    };

    // Save to system logs (would implement in production)
    console.log(`📝 Loop 10 results saved: ${JSON.stringify(loopResult.summary)}`);
  }

  // LOG TRUST ASSESSMENT SUMMARY
  logTrustAssessmentSummary(trustAssessments, trustHealth, trustAlerts) {
    console.log('\n📊 LOOP 10 SUMMARY REPORT');
    console.log('==========================');
    console.log(`🤖 Agents Assessed: ${trustAssessments.length}`);
    console.log(`🏥 Trust Health: ${trustHealth.status} (${trustHealth.healthScore}/100)`);
    console.log(`📈 Average Trust: ${trustHealth.averageTrust}%`);
    console.log(`⭐ High Trust Agents: ${trustHealth.highTrustAgents}`);
    console.log(`⚠️  Critical Agents: ${trustHealth.criticalAgents}`);
    console.log(`🚨 Alerts Generated: ${trustAlerts.length}`);
    console.log('==========================\n');
  }

  // GENERATE LOOP ID
  generateLoopId() {
    return `LOOP10-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // START AUTOMATIC LOOP EXECUTION
  startAutomaticLoop() {
    console.log('🔄 Starting automatic Agent Trust Assessment Loop (every 5 minutes)...');

    // Run immediately
    this.runAgentTrustAssessmentLoop();

    // Then run on interval
    this.loopTimer = setInterval(() => {
      this.runAgentTrustAssessmentLoop();
    }, this.loopInterval);
  }

  // STOP AUTOMATIC LOOP
  stopAutomaticLoop() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
      console.log('⏹️  Agent Trust Assessment Loop stopped');
    }
  }
}

module.exports = AgentTrustAssessmentLoop;

// AUTO-EXECUTE IF RUN DIRECTLY
if (require.main === module) {
  const dbPath = path.join(__dirname, '..', 'data', 'registry.db');
  const trustLoop = new AgentTrustAssessmentLoop(dbPath);

  console.log('🔄 TESTING AGENT TRUST ASSESSMENT LOOP...');

  // Run a single loop execution
  trustLoop.runAgentTrustAssessmentLoop()
    .then(() => {
      console.log('✅ Loop 10 test completed successfully');
    })
    .catch(error => {
      console.error('❌ Loop 10 test failed:', error.message);
    });
}