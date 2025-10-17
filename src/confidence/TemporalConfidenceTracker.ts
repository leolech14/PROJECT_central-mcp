// 📈 TEMPORAL CONFIDENCE TRACKING WITH HISTORICAL ANALYSIS
// Built: 2025-10-13 | Purpose: Track confidence patterns over time, detect trends, predict future confidence
// Implements: Time series analysis, trend detection, confidence degradation alerts, performance analytics

import Database from 'better-sqlite3';
import { AdvancedSelfAuditSystem, ConfidenceResult } from './AdvancedSelfAuditSystem.js';

export interface TemporalConfidenceData {
  timestamp: Date;
  claim: string;
  claimCategory: string;
  confidenceScore: number;
  evidenceCount: number;
  verificationMethods: string[];
  systemState: {
    databaseConnections: number;
    memoryUsage: number;
    cpuUsage: number;
    activeAgents: number;
  };
  biasAdjustments: {
    optimismBiasPenalty: number;
    confirmationBiasPenalty: number;
    completionBiasPenalty: number;
  };
  metacognitiveMetrics: {
    knownKnownsCount: number;
    knownUnknownsCount: number;
    unknownUnknownsCount: number;
  };
}

export interface ConfidenceTrend {
  claimCategory: string;
  trend: 'improving' | 'degrading' | 'stable' | 'volatile';
  slope: number;
  correlation: number;
  confidenceHistory: Array<{timestamp: Date; score: number}>;
  predictionNext: {
    predictedScore: number;
    confidenceInPrediction: number;
    expectedChange: number;
  };
  alertLevel: 'normal' | 'warning' | 'critical';
  insights: string[];
}

export interface ConfidenceAnomaly {
  timestamp: Date;
  claimCategory: string;
  expectedScore: number;
  actualScore: number;
  deviation: number;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  possibleCauses: string[];
  recommendedActions: string[];
}

export class TemporalConfidenceTracker {
  private db: Database;
  private auditSystem: AdvancedSelfAuditSystem;

  constructor(database: Database, auditSystem: AdvancedSelfAuditSystem) {
    this.db = database;
    this.auditSystem = auditSystem;
    this.initializeTemporalTables();
  }

  private initializeTemporalTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS temporal_confidence_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim TEXT NOT NULL,
        claim_category TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        evidence_count INTEGER NOT NULL,
        verification_methods TEXT,
        system_state TEXT,
        bias_adjustments TEXT,
        metacognitive_metrics TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS confidence_trends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_category TEXT UNIQUE NOT NULL,
        current_trend TEXT,
        slope REAL,
        correlation REAL,
        trend_data TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS confidence_anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_category TEXT NOT NULL,
        expected_score REAL NOT NULL,
        actual_score REAL NOT NULL,
        deviation REAL NOT NULL,
        severity TEXT NOT NULL,
        possible_causes TEXT,
        recommended_actions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_temporal_confidence_category ON temporal_confidence_history(claim_category);
      CREATE INDEX IF NOT EXISTS idx_temporal_confidence_timestamp ON temporal_confidence_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_confidence_anomalies_category ON confidence_anomalies(claim_category);
    `);
  }

  async recordConfidenceData(
    claim: string,
    claimCategory: string,
    result: ConfidenceResult,
    systemState?: any
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO temporal_confidence_history (
        claim, claim_category, confidence_score, evidence_count,
        verification_methods, system_state, bias_adjustments, metacognitive_metrics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      claim,
      claimCategory,
      result.adjustedConfidence,
      result.evidenceCount,
      JSON.stringify(result.verificationMethods),
      JSON.stringify(systemState || this.getCurrentSystemState()),
      JSON.stringify(result.cognitiveBiasAdjustments),
      JSON.stringify({
        knownKnownsCount: result.metacognitiveAwareness.knownKnowns.length,
        knownUnknownsCount: result.metacognitiveAwareness.knownUnknowns.length,
        unknownUnknownsCount: result.metacognitiveAwareness.unknownUnknowns.length
      })
    );

    // Trigger trend analysis
    await this.analyzeTrends(claimCategory);
  }

  private getCurrentSystemState(): any {
    return {
      databaseConnections: 1, // Would be actual connection count
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // Would require system monitoring
      activeAgents: this.getActiveAgentCount()
    };
  }

  private getActiveAgentCount(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM agent_sessions
      WHERE status = 'ACTIVE' AND datetime('now', '-5 minutes') < last_activity
    `);

    return stmt.get()?.count || 0;
  }

  async analyzeTrends(claimCategory: string): Promise<ConfidenceTrend> {
    // Get historical data for the category
    const historyStmt = this.db.prepare(`
      SELECT confidence_score, created_at
      FROM temporal_confidence_history
      WHERE claim_category = ?
      ORDER BY created_at ASC
    `);

    const history = historyStmt.all(claimCategory);

    if (history.length < 3) {
      // Not enough data for trend analysis
      return {
        claimCategory,
        trend: 'stable',
        slope: 0,
        correlation: 0,
        confidenceHistory: [],
        predictionNext: {
          predictedScore: 0,
          confidenceInPrediction: 0,
          expectedChange: 0
        },
        alertLevel: 'normal',
        insights: ['Insufficient historical data for trend analysis']
      };
    }

    // Calculate trend using linear regression
    const trend = this.calculateLinearTrend(history);

    // Detect anomalies
    const anomalies = await this.detectAnomalies(claimCategory, history);

    // Predict next confidence score
    const prediction = this.predictNextScore(history, trend);

    // Generate insights
    const insights = this.generateTrendInsights(claimCategory, trend, anomalies, history);

    // Determine alert level
    const alertLevel = this.calculateAlertLevel(trend, anomalies);

    const confidenceTrend: ConfidenceTrend = {
      claimCategory,
      trend: trend.direction,
      slope: trend.slope,
      correlation: trend.correlation,
      confidenceHistory: history.map(h => ({
        timestamp: new Date(h.created_at),
        score: h.confidence_score
      })),
      predictionNext: prediction,
      alertLevel,
      insights
    };

    // Store trend analysis
    this.storeTrendAnalysis(confidenceTrend);

    return confidenceTrend;
  }

  private calculateLinearTrend(history: any[]): {
    direction: 'improving' | 'degrading' | 'stable' | 'volatile';
    slope: number;
    correlation: number;
    volatility: number;
  } {
    const n = history.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = history.map(h => h.confidence_score);

    // Calculate linear regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denominatorX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denominatorY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    const correlation = denominatorX && denominatorY ? numerator / (denominatorX * denominatorY) : 0;

    // Calculate volatility (standard deviation of residuals)
    const predictions = x.map(xi => intercept + slope * xi);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const volatility = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / n);

    // Determine trend direction
    let direction: 'improving' | 'degrading' | 'stable' | 'volatile';
    if (Math.abs(slope) < 0.01) {
      direction = volatility > 0.1 ? 'volatile' : 'stable';
    } else {
      direction = slope > 0 ? 'improving' : 'degrading';
    }

    return { direction, slope, correlation, volatility };
  }

  private async detectAnomalies(
    claimCategory: string,
    history: any[]
  ): Promise<ConfidenceAnomaly[]> {
    if (history.length < 5) return [];

    const anomalies: ConfidenceAnomaly[] = [];

    // Calculate moving average and standard deviation
    const windowSize = Math.min(5, Math.floor(history.length / 2));

    for (let i = windowSize; i < history.length; i++) {
      const window = history.slice(i - windowSize, i);
      const mean = window.reduce((sum, h) => sum + h.confidence_score, 0) / windowSize;
      const variance = window.reduce((sum, h) => sum + Math.pow(h.confidence_score - mean, 2), 0) / windowSize;
      const stdDev = Math.sqrt(variance);

      const currentScore = history[i].confidence_score;
      const deviation = Math.abs(currentScore - mean);

      // Check if it's an anomaly (more than 2 standard deviations)
      if (deviation > 2 * stdDev) {
        const severity = this.calculateAnomalySeverity(deviation, stdDev);

        const anomaly: ConfidenceAnomaly = {
          timestamp: new Date(history[i].created_at),
          claimCategory,
          expectedScore: mean,
          actualScore: currentScore,
          deviation,
          severity,
          possibleCauses: this.identifyAnomalyCauses(history, i),
          recommendedActions: this.getRecommendedActions(severity, deviation)
        };

        anomalies.push(anomaly);
        this.storeAnomaly(anomaly);
      }
    }

    return anomalies;
  }

  private calculateAnomalySeverity(deviation: number, stdDev: number): 'minor' | 'moderate' | 'major' | 'critical' {
    const sigma = deviation / stdDev;

    if (sigma < 2.5) return 'minor';
    if (sigma < 3.5) return 'moderate';
    if (sigma < 4.5) return 'major';
    return 'critical';
  }

  private identifyAnomalyCauses(history: any[], index: number): string[] {
    const causes: string[] = [];
    const current = history[index];

    // Check for evidence count changes
    const previous = history[index - 1];
    if (previous && current.evidence_count !== previous.evidence_count) {
      causes.push('Change in evidence collection methodology');
    }

    // Check for system state changes
    if (current.system_state) {
      const state = JSON.parse(current.system_state);
      if (state.memoryUsage > 100) { // 100MB threshold
        causes.push('High memory usage detected');
      }
      if (state.activeAgents > 5) {
        causes.push('High agent concurrency');
      }
    }

    // Check for bias adjustments
    if (current.bias_adjustments) {
      const biases = JSON.parse(current.bias_adjustments);
      const totalBias = biases.optimismBiasPenalty + biases.confirmationBiasPenalty + biases.completionBiasPenalty;
      if (totalBias > 0.1) {
        causes.push('Significant cognitive bias adjustments applied');
      }
    }

    if (causes.length === 0) {
      causes.push('Unknown cause - requires investigation');
    }

    return causes;
  }

  private getRecommendedActions(severity: string, deviation: number): string[] {
    const actions: string[] = [];

    switch (severity) {
      case 'critical':
        actions.push('Immediate investigation required');
        actions.push('Pause automated operations');
        actions.push('Manual verification of confidence calculations');
        break;
      case 'major':
        actions.push('Increase verification frequency');
        actions.push('Review evidence collection methodology');
        actions.push('Consider recalibrating confidence thresholds');
        break;
      case 'moderate':
        actions.push('Monitor closely for next few cycles');
        actions.push('Check for environmental changes');
        break;
      case 'minor':
        actions.push('Continue monitoring');
        actions.push('Document for pattern analysis');
        break;
    }

    return actions;
  }

  private predictNextScore(history: any[], trend: any): {
    predictedScore: number;
    confidenceInPrediction: number;
    expectedChange: number;
  } {
    const n = history.length;
    const lastScore = history[n - 1].confidence_score;

    // Linear prediction
    const predictedScore = Math.max(0, Math.min(1, lastScore + trend.slope));

    // Confidence in prediction based on correlation and volatility
    const baseConfidence = Math.abs(trend.correlation);
    const volatilityPenalty = Math.min(0.3, trend.volatility * 2);
    const confidenceInPrediction = Math.max(0.1, baseConfidence - volatilityPenalty);

    const expectedChange = trend.slope;

    return {
      predictedScore,
      confidenceInPrediction,
      expectedChange
    };
  }

  private generateTrendInsights(
    claimCategory: string,
    trend: any,
    anomalies: ConfidenceAnomaly[],
    history: any[]
  ): string[] {
    const insights: string[] = [];

    // Trend insights
    switch (trend.direction) {
      case 'improving':
        insights.push(`Confidence in ${claimCategory} is consistently improving (+${(trend.slope * 100).toFixed(2)}% per cycle)`);
        break;
      case 'degrading':
        insights.push(`Warning: Confidence in ${claimCategory} is degrading (${(trend.slope * 100).toFixed(2)}% per cycle)`);
        insights.push('Investigate potential causes of confidence decline');
        break;
      case 'stable':
        insights.push(`Confidence in ${claimCategory} is stable (low volatility: ${trend.volatility.toFixed(3)})`);
        break;
      case 'volatile':
        insights.push(`Confidence in ${claimCategory} is highly volatile (volatility: ${trend.volatility.toFixed(3)})`);
        insights.push('Consider increasing evidence collection or stabilizing environmental factors');
        break;
    }

    // Correlation insights
    if (Math.abs(trend.correlation) > 0.8) {
      insights.push(`Strong ${trend.correlation > 0 ? 'positive' : 'negative'} correlation detected (R² = ${(trend.correlation * trend.correlation).toFixed(3)})`);
    }

    // Anomaly insights
    if (anomalies.length > 0) {
      insights.push(`${anomalies.length} confidence anomalies detected in recent history`);
      const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
      if (criticalAnomalies > 0) {
        insights.push(`${criticalAnomalies} critical anomalies require immediate attention`);
      }
    }

    // Evidence quality insights
    const avgEvidenceCount = history.reduce((sum, h) => sum + (h.evidence_count || 1), 0) / history.length;
    if (avgEvidenceCount < 3) {
      insights.push('Low evidence collection - consider increasing verification depth');
    }

    // Recent performance insights
    const recentScores = history.slice(-5).map(h => h.confidence_score);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const overallAvg = history.reduce((sum, h) => sum + h.confidence_score, 0) / history.length;

    if (Math.abs(recentAvg - overallAvg) > 0.1) {
      insights.push(`Recent performance (${(recentAvg * 100).toFixed(1)}%) differs from historical average (${(overallAvg * 100).toFixed(1)}%)`);
    }

    return insights;
  }

  private calculateAlertLevel(trend: any, anomalies: ConfidenceAnomaly[]): 'normal' | 'warning' | 'critical' {
    // Check for critical anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
    if (criticalAnomalies > 0) return 'critical';

    // Check for major anomalies
    const majorAnomalies = anomalies.filter(a => a.severity === 'major').length;
    if (majorAnomalies > 2) return 'critical';
    if (majorAnomalies > 0) return 'warning';

    // Check trend direction
    if (trend.direction === 'degrading' && Math.abs(trend.slope) > 0.05) {
      return 'warning';
    }

    // Check volatility
    if (trend.volatility > 0.2) {
      return 'warning';
    }

    return 'normal';
  }

  private storeTrendAnalysis(trend: ConfidenceTrend): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO confidence_trends (
        claim_category, current_trend, slope, correlation, trend_data, last_updated
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      trend.claimCategory,
      trend.trend,
      trend.slope,
      trend.correlation,
      JSON.stringify({
        prediction: trend.predictionNext,
        alertLevel: trend.alertLevel,
        insights: trend.insights,
        lastAnalyzed: new Date().toISOString()
      })
    );
  }

  private storeAnomaly(anomaly: ConfidenceAnomaly): void {
    const stmt = this.db.prepare(`
      INSERT INTO confidence_anomalies (
        claim_category, expected_score, actual_score, deviation,
        severity, possible_causes, recommended_actions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      anomaly.claimCategory,
      anomaly.expectedScore,
      anomaly.actualScore,
      anomaly.deviation,
      anomaly.severity,
      JSON.stringify(anomaly.possibleCauses),
      JSON.stringify(anomaly.recommendedActions)
    );
  }

  // Get comprehensive temporal analysis
  async getTemporalAnalysis(timeRange: 'hour' | 'day' | 'week' | 'month' = 'week'): Promise<{
    overallTrends: ConfidenceTrend[];
    recentAnomalies: ConfidenceAnomaly[];
    systemHealth: {
      overallConfidence: number;
      confidenceStability: number;
      anomalyRate: number;
      trendDirection: string;
    };
    recommendations: string[];
  }> {
    const timeFilter = this.getTimeFilter(timeRange);

    // Get overall trends
    const categoriesStmt = this.db.prepare(`
      SELECT DISTINCT claim_category FROM temporal_confidence_history
      WHERE created_at > ${timeFilter}
    `);

    const categories = categoriesStmt.all() as any[];
    const overallTrends: ConfidenceTrend[] = [];

    for (const category of categories) {
      const trend = await this.analyzeTrends(category.claim_category);
      overallTrends.push(trend);
    }

    // Get recent anomalies
    const anomaliesStmt = this.db.prepare(`
      SELECT * FROM confidence_anomalies
      WHERE created_at > ${timeFilter}
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const rawAnomalies = anomaliesStmt.all();
    const recentAnomalies = rawAnomalies.map(a => ({
      timestamp: new Date(a.created_at),
      claimCategory: a.claim_category,
      expectedScore: a.expected_score,
      actualScore: a.actual_score,
      deviation: a.deviation,
      severity: a.severity,
      possibleCauses: JSON.parse(a.possible_causes || '[]'),
      recommendedActions: JSON.parse(a.recommended_actions || '[]')
    }));

    // Calculate system health metrics
    const systemHealth = this.calculateSystemHealth(overallTrends, recentAnomalies);

    // Generate recommendations
    const recommendations = this.generateSystemRecommendations(overallTrends, recentAnomalies, systemHealth);

    return {
      overallTrends,
      recentAnomalies,
      systemHealth,
      recommendations
    };
  }

  private getTimeFilter(timeRange: 'hour' | 'day' | 'week' | 'month'): string {
    const intervals = {
      hour: "datetime('now', '-1 hour')",
      day: "datetime('now', '-1 day')",
      week: "datetime('now', '-7 days')",
      month: "datetime('now', '-30 days')"
    };
    return intervals[timeRange];
  }

  private calculateSystemHealth(trends: ConfidenceTrend[], anomalies: ConfidenceAnomaly[]): any {
    const avgConfidence = trends.reduce((sum, t) => sum + t.predictionNext.predictedScore, 0) / trends.length;

    const improvingTrends = trends.filter(t => t.trend === 'improving').length;
    const degradingTrends = trends.filter(t => t.trend === 'degrading').length;
    const stabilityScore = (improvingTrends - degradingTrends) / trends.length;

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
    const anomalyRate = anomalies.length / Math.max(1, trends.length);

    const trendDirection = improvingTrends > degradingTrends ? 'positive' :
                         degradingTrends > improvingTrends ? 'negative' : 'neutral';

    return {
      overallConfidence: avgConfidence,
      confidenceStability: stabilityScore,
      anomalyRate,
      trendDirection
    };
  }

  private generateSystemRecommendations(
    trends: ConfidenceTrend[],
    anomalies: ConfidenceAnomaly[],
    systemHealth: any
  ): string[] {
    const recommendations: string[] = [];

    // Based on overall confidence
    if (systemHealth.overallConfidence < 0.7) {
      recommendations.push('System confidence below 70% - comprehensive review recommended');
    }

    // Based on trend analysis
    const degradingCategories = trends.filter(t => t.trend === 'degrading');
    if (degradingCategories.length > 0) {
      recommendations.push(`${degradingCategories.length} categories showing degrading confidence - investigate root causes`);
    }

    // Based on anomalies
    if (anomalies.length > 5) {
      recommendations.push('High anomaly detection rate - review verification methodologies');
    }

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push(`${criticalAnomalies.length} critical anomalies detected - immediate investigation required`);
    }

    // Based on volatility
    const volatileCategories = trends.filter(t => t.trend === 'volatile');
    if (volatileCategories.length > 0) {
      recommendations.push(`${volatileCategories.length} categories showing volatile confidence - stabilize environmental factors`);
    }

    // Proactive recommendations
    if (recommendations.length === 0) {
      recommendations.push('System performing well - continue monitoring');
      recommendations.push('Consider expanding verification coverage to improve confidence accuracy');
    }

    return recommendations;
  }
}

export default TemporalConfidenceTracker;