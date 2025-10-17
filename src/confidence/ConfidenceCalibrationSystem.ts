// 🎯 CONFIDENCE CALIBRATION & VALIDATION SYSTEM
// Built: 2025-10-13 | Purpose: Ensure confidence scores match actual performance over time with statistical validation
// Implements: Reliability curves, calibration metrics, Brier score analysis, statistical validation, adaptive learning

import Database from 'better-sqlite3';
import { ConfidenceResult } from './AdvancedSelfAuditSystem.js';

export interface CalibrationData {
  confidenceScore: number;
  actualOutcome: number; // 0 for failure, 1 for success
  timestamp: Date;
  claimCategory: string;
  evidenceCount: number;
  contextData?: any;
}

export interface CalibrationMetrics {
  brierScore: number; // Lower is better (0-1)
  reliabilityDiagram: Array<{
    confidenceBin: number;
    predictedProbability: number;
    actualFrequency: number;
    sampleCount: number;
    calibrationError: number;
  }>;
  expectedCalibrationError: number; // ECE - weighted average calibration error
  maximumCalibrationError: number; // MCE - maximum calibration error
  sharpness: number; // Measure of confidence distribution
  overallCalibrationQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unreliable';
  confidenceAccuracy: number; // How well confidence predicts actual outcomes
}

export interface ValidationCurve {
  timePoints: Array<{
    timestamp: Date;
    sampleSize: number;
    brierScore: number;
    calibrationError: number;
    accuracy: number;
  }>;
  learningCurve: Array<{
    trainingSamples: number;
    validationBrierScore: number;
    expectedCalibrationError: number;
  }>;
  performanceProjection: {
    nextPeriodBrierScore: number;
    nextPeriodCalibrationError: number;
    confidenceInProjection: number;
  };
}

export interface AdaptiveCalibrationModel {
  currentModel: {
    calibrationFunction: (confidence: number, context: any) => number;
    parameters: Record<string, number>;
    lastTrained: Date;
    trainingSamples: number;
  };
  modelHistory: Array<{
    version: number;
    brierScore: number;
    calibrationError: number;
    trainingDate: Date;
    improvements: string[];
  }>;
  performanceMetrics: {
    predictionAccuracy: number;
    stabilityScore: number;
    adaptationRate: number;
  };
}

export class ConfidenceCalibrationSystem {
  private db: Database;
  private calibrationData: CalibrationData[] = [];
  private adaptiveModel: AdaptiveCalibrationModel;
  private calibrationBins: number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  constructor(database: Database) {
    this.db = database;
    this.initializeCalibrationTables();
    this.loadCalibrationData();
    this.initializeAdaptiveModel();
  }

  private initializeCalibrationTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS calibration_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        confidence_score REAL NOT NULL,
        actual_outcome REAL NOT NULL,
        claim_category TEXT NOT NULL,
        evidence_count INTEGER,
        context_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calibration_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time_period TEXT NOT NULL,
        brier_score REAL NOT NULL,
        expected_calibration_error REAL NOT NULL,
        maximum_calibration_error REAL NOT NULL,
        sharpness REAL NOT NULL,
        calibration_quality TEXT NOT NULL,
        confidence_accuracy REAL NOT NULL,
        reliability_diagram TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS validation_curves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time_point TIMESTAMP NOT NULL,
        sample_size INTEGER NOT NULL,
        brier_score REAL NOT NULL,
        calibration_error REAL NOT NULL,
        accuracy REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS adaptive_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        model_parameters TEXT NOT NULL,
        brier_score REAL NOT NULL,
        calibration_error REAL NOT NULL,
        training_samples INTEGER NOT NULL,
        improvements TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_calibration_confidence ON calibration_data(confidence_score);
      CREATE INDEX IF NOT EXISTS idx_calibration_category ON calibration_data(claim_category);
      CREATE INDEX IF NOT EXISTS idx_calibration_created ON calibration_data(created_at);
      CREATE INDEX IF NOT EXISTS idx_validation_curves_time ON validation_curves(time_point);
    `);
  }

  private loadCalibrationData(): void {
    const stmt = this.db.prepare(`
      SELECT confidence_score, actual_outcome, claim_category, evidence_count,
             context_data, created_at
      FROM calibration_data
      ORDER BY created_at ASC
    `);

    const rawData = stmt.all() as any[];

    this.calibrationData = rawData.map(row => ({
      confidenceScore: row.confidence_score,
      actualOutcome: row.actual_outcome,
      claimCategory: row.claim_category,
      evidenceCount: row.evidence_count || 1,
      contextData: row.context_data ? JSON.parse(row.context_data) : undefined,
      timestamp: new Date(row.created_at)
    }));
  }

  private initializeAdaptiveModel(): void {
    // Initialize with simple linear calibration model
    this.adaptiveModel = {
      currentModel: {
        calibrationFunction: (confidence: number, context: any) => {
          // Simple sigmoid-based calibration function
          const parameters = this.adaptiveModel.currentModel.parameters;
          const adjusted = confidence * parameters.slope + parameters.intercept;
          return 1 / (1 + Math.exp(-10 * (adjusted - 0.5))); // Sigmoid with steepness
        },
        parameters: {
          slope: 1.0,
          intercept: 0.0,
          temperature: 1.0
        },
        lastTrained: new Date(),
        trainingSamples: 0
      },
      modelHistory: [],
      performanceMetrics: {
        predictionAccuracy: 0.5,
        stabilityScore: 0.5,
        adaptationRate: 0.1
      }
    };
  }

  async recordCalibrationData(
    confidenceScore: number,
    actualOutcome: number,
    claimCategory: string,
    evidenceCount: number = 1,
    contextData?: any
  ): Promise<void> {
    const calibrationPoint: CalibrationData = {
      confidenceScore,
      actualOutcome,
      claimCategory,
      evidenceCount,
      contextData,
      timestamp: new Date()
    };

    // Store in database
    const stmt = this.db.prepare(`
      INSERT INTO calibration_data (
        confidence_score, actual_outcome, claim_category,
        evidence_count, context_data
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      confidenceScore,
      actualOutcome,
      claimCategory,
      evidenceCount,
      contextData ? JSON.stringify(contextData) : null
    );

    // Add to in-memory data
    this.calibrationData.push(calibrationPoint);

    // Trigger adaptive model update if enough data
    if (this.calibrationData.length % 50 === 0) {
      await this.updateAdaptiveModel();
    }

    // Update validation curves
    await this.updateValidationCurves();
  }

  async calculateCalibrationMetrics(
    timeRange?: 'week' | 'month' | 'quarter' | 'year',
    categoryFilter?: string
  ): Promise<CalibrationMetrics> {
    let data = this.calibrationData;

    // Apply time filter
    if (timeRange) {
      const cutoffDate = this.getCutoffDate(timeRange);
      data = data.filter(d => d.timestamp >= cutoffDate);
    }

    // Apply category filter
    if (categoryFilter) {
      data = data.filter(d => d.claimCategory === categoryFilter);
    }

    if (data.length === 0) {
      throw new Error('No calibration data available for the specified criteria');
    }

    // Calculate Brier score
    const brierScore = this.calculateBrierScore(data);

    // Create reliability diagram
    const reliabilityDiagram = this.createReliabilityDiagram(data);

    // Calculate Expected Calibration Error (ECE)
    const expectedCalibrationError = this.calculateExpectedCalibrationError(reliabilityDiagram);

    // Calculate Maximum Calibration Error (MCE)
    const maximumCalibrationError = Math.max(...reliabilityDiagram.map(bin => Math.abs(bin.calibrationError)));

    // Calculate sharpness
    const sharpness = this.calculateSharpness(data);

    // Determine overall calibration quality
    const overallCalibrationQuality = this.determineCalibrationQuality(
      brierScore, expectedCalibrationError, maximumCalibrationError
    );

    // Calculate confidence accuracy
    const confidenceAccuracy = this.calculateConfidenceAccuracy(data);

    const metrics: CalibrationMetrics = {
      brierScore,
      reliabilityDiagram,
      expectedCalibrationError,
      maximumCalibrationError,
      sharpness,
      overallCalibrationQuality,
      confidenceAccuracy
    };

    // Store metrics
    await this.storeCalibrationMetrics(metrics, timeRange, categoryFilter);

    return metrics;
  }

  private calculateBrierScore(data: CalibrationData[]): number {
    // Brier score: mean squared error between predicted probabilities and outcomes
    const totalError = data.reduce((sum, point) => {
      const error = Math.pow(point.confidenceScore - point.actualOutcome, 2);
      return sum + error;
    }, 0);

    return totalError / data.length;
  }

  private createReliabilityDiagram(data: CalibrationData[]): CalibrationMetrics['reliabilityDiagram'] {
    const diagram: CalibrationMetrics['reliabilityDiagram'] = [];

    for (const binEdge of this.calibrationBins) {
      // Find data points in this bin (±0.05 from bin edge)
      const binData = data.filter(point =>
        point.confidenceScore >= binEdge - 0.05 &&
        point.confidenceScore < binEdge + 0.05
      );

      if (binData.length > 0) {
        const predictedProbability = binEdge;
        const actualFrequency = binData.reduce((sum, point) => sum + point.actualOutcome, 0) / binData.length;
        const calibrationError = actualFrequency - predictedProbability;

        diagram.push({
          confidenceBin: binEdge,
          predictedProbability,
          actualFrequency,
          sampleCount: binData.length,
          calibrationError
        });
      }
    }

    return diagram;
  }

  private calculateExpectedCalibrationError(reliabilityDiagram: CalibrationMetrics['reliabilityDiagram']): number {
    let weightedError = 0;
    let totalSamples = 0;

    for (const bin of reliabilityDiagram) {
      weightedError += Math.abs(bin.calibrationError) * bin.sampleCount;
      totalSamples += bin.sampleCount;
    }

    return totalSamples > 0 ? weightedError / totalSamples : 0;
  }

  private calculateSharpness(data: CalibrationData[]): number {
    // Sharpness: variance of confidence scores (higher means more confident predictions)
    const meanConfidence = data.reduce((sum, point) => sum + point.confidenceScore, 0) / data.length;
    const variance = data.reduce((sum, point) => {
      return sum + Math.pow(point.confidenceScore - meanConfidence, 2);
    }, 0) / data.length;

    // Convert to sharpness score (0-1, higher is sharper)
    return Math.sqrt(variance);
  }

  private determineCalibrationQuality(
    brierScore: number,
    ece: number,
    mce: number
  ): CalibrationMetrics['overallCalibrationQuality'] {
    if (brierScore < 0.05 && ece < 0.02 && mce < 0.05) return 'excellent';
    if (brierScore < 0.1 && ece < 0.05 && mce < 0.1) return 'good';
    if (brierScore < 0.2 && ece < 0.1 && mce < 0.15) return 'fair';
    if (brierScore < 0.3 && ece < 0.15 && mce < 0.2) return 'poor';
    return 'unreliable';
  }

  private calculateConfidenceAccuracy(data: CalibrationData[]): number {
    // Calculate correlation between confidence scores and actual outcomes
    const n = data.length;
    if (n === 0) return 0;

    const sumConfidence = data.reduce((sum, point) => sum + point.confidenceScore, 0);
    const sumOutcome = data.reduce((sum, point) => sum + point.actualOutcome, 0);
    const sumConfidenceOutcome = data.reduce((sum, point) => sum + point.confidenceScore * point.actualOutcome, 0);
    const sumConfidenceSq = data.reduce((sum, point) => sum + point.confidenceScore * point.confidenceScore, 0);

    const correlation = (n * sumConfidenceOutcome - sumConfidence * sumOutcome) /
                     (Math.sqrt(n * sumConfidenceSq - sumConfidence * sumConfidence) *
                      Math.sqrt(n * data.reduce((sum, point) => sum + point.actualOutcome, 0) - sumOutcome * sumOutcome));

    return isNaN(correlation) ? 0 : Math.abs(correlation);
  }

  async updateAdaptiveModel(): Promise<void> {
    if (this.calibrationData.length < 100) {
      return; // Not enough data for reliable training
    }

    // Use recent data for training
    const trainingData = this.calibrationData.slice(-1000);

    // Simple parameter optimization using gradient descent
    const learningRate = 0.01;
    const iterations = 100;

    let bestParameters = { ...this.adaptiveModel.currentModel.parameters };
    let bestError = Infinity;

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate current error
      let totalError = 0;
      const gradients: Record<string, number> = {
        slope: 0,
        intercept: 0,
        temperature: 0
      };

      for (const point of trainingData) {
        const calibrated = this.adaptiveModel.currentModel.calibrationFunction(
          point.confidenceScore,
          point.contextData
        );
        const error = calibrated - point.actualOutcome;
        totalError += error * error;

        // Calculate gradients (simplified)
        gradients.slope += 2 * error * point.confidenceScore * 0.1; // Simplified gradient
        gradients.intercept += 2 * error * 0.1;
      }

      // Update parameters
      const currentError = totalError / trainingData.length;

      if (currentError < bestError) {
        bestError = currentError;
        bestParameters = { ...this.adaptiveModel.currentModel.parameters };
      }

      // Gradient descent update
      this.adaptiveModel.currentModel.parameters.slope -= learningRate * gradients.slope / trainingData.length;
      this.adaptiveModel.currentModel.parameters.intercept -= learningRate * gradients.intercept / trainingData.length;

      // Constrain parameters
      this.adaptiveModel.currentModel.parameters.slope = Math.max(0.1, Math.min(3.0, this.adaptiveModel.currentModel.parameters.slope));
      this.adaptiveModel.currentModel.parameters.intercept = Math.max(-0.5, Math.min(0.5, this.adaptiveModel.currentModel.parameters.intercept));
    }

    // Keep best parameters found
    this.adaptiveModel.currentModel.parameters = bestParameters;
    this.adaptiveModel.currentModel.lastTrained = new Date();
    this.adaptiveModel.currentModel.trainingSamples = trainingData.length;

    // Store model version
    await this.storeModelVersion(bestError);
  }

  async generateValidationCurve(
    timeRange: 'month' | 'quarter' | 'year' = 'quarter'
  ): Promise<ValidationCurve> {
    const cutoffDate = this.getCutoffDate(timeRange);
    const data = this.calibrationData.filter(d => d.timestamp >= cutoffDate);

    // Generate time points for learning curve
    const timePoints: ValidationCurve['timePoints'] = [];
    const learningCurve: ValidationCurve['learningCurve'] = [];

    // Calculate metrics at different time points
    const intervalMs = 7 * 24 * 60 * 60 * 1000; // Weekly intervals
    const startTime = data[0]?.timestamp || new Date();
    const endTime = new Date();

    for (let time = startTime.getTime(); time <= endTime.getTime(); time += intervalMs) {
      const pointDate = new Date(time);
      const pointData = data.filter(d => d.timestamp <= pointDate);

      if (pointData.length >= 10) { // Minimum samples for reliable metrics
        const brierScore = this.calculateBrierScore(pointData);
        const reliabilityDiagram = this.createReliabilityDiagram(pointData);
        const calibrationError = this.calculateExpectedCalibrationError(reliabilityDiagram);
        const accuracy = this.calculateConfidenceAccuracy(pointData);

        timePoints.push({
          timestamp: pointDate,
          sampleSize: pointData.length,
          brierScore,
          calibrationError,
          accuracy
        });

        // Learning curve points (every 50 samples)
        if (pointData.length % 50 === 0) {
          learningCurve.push({
            trainingSamples: pointData.length,
            validationBrierScore: brierScore,
            expectedCalibrationError: calibrationError
          });
        }
      }
    }

    // Project future performance
    const performanceProjection = this.projectFuturePerformance(timePoints);

    return {
      timePoints,
      learningCurve,
      performanceProjection
    };
  }

  private projectFuturePerformance(timePoints: ValidationCurve['timePoints']): ValidationCurve['performanceProjection'] {
    if (timePoints.length < 3) {
      return {
        nextPeriodBrierScore: 0.25,
        nextPeriodCalibrationError: 0.1,
        confidenceInProjection: 0.1
      };
    }

    // Simple linear projection based on recent trend
    const recentPoints = timePoints.slice(-5);
    const n = recentPoints.length;

    // Calculate trend for Brier score
    const brierScores = recentPoints.map(p => p.brierScore);
    const brierTrend = (brierScores[n - 1] - brierScores[0]) / (n - 1);

    // Calculate trend for calibration error
    const calibrationErrors = recentPoints.map(p => p.calibrationError);
    const calibrationTrend = (calibrationErrors[n - 1] - calibrationErrors[0]) / (n - 1);

    // Project next period
    const nextPeriodBrierScore = Math.max(0, Math.min(1, brierScores[n - 1] + brierTrend));
    const nextPeriodCalibrationError = Math.max(0, Math.min(1, calibrationErrors[n - 1] + calibrationTrend));

    // Confidence in projection based on trend stability
    const brierStability = 1 - Math.abs(brierTrend) / brierScores[n - 1];
    const calibrationStability = 1 - Math.abs(calibrationTrend) / Math.max(0.01, calibrationErrors[n - 1]);
    const confidenceInProjection = (brierStability + calibrationStability) / 2;

    return {
      nextPeriodBrierScore,
      nextPeriodCalibrationError,
      confidenceInProjection
    };
  }

  async applyCalibration(
    confidenceScore: number,
    context?: any
  ): Promise<{
    calibratedConfidence: number;
    calibrationMethod: string;
    uncertaintyRange: [number, number];
    reliability: 'high' | 'medium' | 'low';
  }> {
    // Apply adaptive model calibration
    let calibratedConfidence = this.adaptiveModel.currentModel.calibrationFunction(confidenceScore, context);

    // Ensure bounds
    calibratedConfidence = Math.max(0.01, Math.min(0.99, calibratedConfidence));

    // Calculate uncertainty range based on calibration reliability
    const reliability = this.getCalibrationReliability();
    const uncertaintyRange = this.calculateUncertaintyRange(calibratedConfidence, reliability);

    return {
      calibratedConfidence,
      calibrationMethod: 'adaptive_model',
      uncertaintyRange,
      reliability
    };
  }

  private getCalibrationReliability(): 'high' | 'medium' | 'low' {
    const samples = this.adaptiveModel.currentModel.trainingSamples;
    const performance = this.adaptiveModel.performanceMetrics.predictionAccuracy;

    if (samples > 500 && performance > 0.8) return 'high';
    if (samples > 100 && performance > 0.6) return 'medium';
    return 'low';
  }

  private calculateUncertaintyRange(
    confidence: number,
    reliability: 'high' | 'medium' | 'low'
  ): [number, number] {
    const reliabilityFactors = {
      high: 0.05,
      medium: 0.1,
      low: 0.2
    };

    const uncertainty = reliabilityFactors[reliability];
    const lower = Math.max(0, confidence - uncertainty);
    const upper = Math.min(1, confidence + uncertainty);

    return [lower, upper];
  }

  private async storeCalibrationMetrics(
    metrics: CalibrationMetrics,
    timeRange?: string,
    categoryFilter?: string
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO calibration_metrics (
        time_period, brier_score, expected_calibration_error, maximum_calibration_error,
        sharpness, calibration_quality, confidence_accuracy, reliability_diagram
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const timePeriod = `${timeRange || 'all'}_${categoryFilter || 'all_categories'}`;

    stmt.run(
      timePeriod,
      metrics.brierScore,
      metrics.expectedCalibrationError,
      metrics.maximumCalibrationError,
      metrics.sharpness,
      metrics.overallCalibrationQuality,
      metrics.confidenceAccuracy,
      JSON.stringify(metrics.reliabilityDiagram)
    );
  }

  private async storeModelVersion(brierScore: number): Promise<void> {
    const currentVersion = this.adaptiveModel.modelHistory.length + 1;

    const stmt = this.db.prepare(`
      INSERT INTO adaptive_models (
        version, model_parameters, brier_score, calibration_error,
        training_samples, improvements
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const improvements: string[] = [];
    if (this.adaptiveModel.modelHistory.length > 0) {
      const lastModel = this.adaptiveModel.modelHistory[this.adaptiveModel.modelHistory.length - 1];
      if (brierScore < lastModel.brierScore) {
        improvements.push(`Brier score improved by ${(lastModel.brierScore - brierScore).toFixed(4)}`);
      }
    } else {
      improvements.push('Initial model trained');
    }

    stmt.run(
      currentVersion,
      JSON.stringify(this.adaptiveModel.currentModel.parameters),
      brierScore,
      0, // Would calculate calibration error
      this.adaptiveModel.currentModel.trainingSamples,
      JSON.stringify(improvements)
    );

    // Update model history
    this.adaptiveModel.modelHistory.push({
      version: currentVersion,
      brierScore,
      calibrationError: 0, // Would calculate
      trainingDate: new Date(),
      improvements
    });

    // Update performance metrics
    this.updatePerformanceMetrics(brierScore);
  }

  private updatePerformanceMetrics(brierScore: number): void {
    const history = this.adaptiveModel.modelHistory;
    if (history.length < 2) return;

    const recent = history.slice(-5);
    const avgBrierScore = recent.reduce((sum, m) => sum + m.brierScore, 0) / recent.length;

    // Calculate metrics
    this.adaptiveModel.performanceMetrics.predictionAccuracy = Math.max(0, 1 - avgBrierScore);

    // Stability: inverse of recent variance
    const variance = recent.reduce((sum, m) => sum + Math.pow(m.brierScore - avgBrierScore, 2), 0) / recent.length;
    this.adaptiveModel.performanceMetrics.stabilityScore = Math.max(0, 1 - variance * 10);

    // Adaptation rate: how quickly the model is improving
    if (recent.length >= 2) {
      const improvement = recent[0].brierScore - recent[recent.length - 1].brierScore;
      this.adaptiveModel.performanceMetrics.adaptationRate = Math.max(0, Math.min(1, improvement * 10));
    }
  }

  private async updateValidationCurves(): Promise<void> {
    const latestData = this.calibrationData.slice(-100);
    if (latestData.length < 10) return;

    const brierScore = this.calculateBrierScore(latestData);
    const reliabilityDiagram = this.createReliabilityDiagram(latestData);
    const calibrationError = this.calculateExpectedCalibrationError(reliabilityDiagram);
    const accuracy = this.calculateConfidenceAccuracy(latestData);

    const stmt = this.db.prepare(`
      INSERT INTO validation_curves (
        time_point, sample_size, brier_score, calibration_error, accuracy
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      new Date(),
      latestData.length,
      brierScore,
      calibrationError,
      accuracy
    );
  }

  private getCutoffDate(timeRange: 'week' | 'month' | 'quarter' | 'year'): Date {
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const cutoff = new Date(now.getTime() - ranges[timeRange] * 24 * 60 * 60 * 1000);
    return cutoff;
  }

  // Get comprehensive calibration report
  async getCalibrationReport(timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    currentMetrics: CalibrationMetrics;
    validationCurve: ValidationCurve;
    modelPerformance: AdaptiveCalibrationModel;
    categoryBreakdown: Array<{
      category: string;
      sampleCount: number;
      brierScore: number;
      calibrationQuality: string;
    }>;
    recommendations: string[];
  }> {
    // Get current metrics
    const currentMetrics = await this.calculateCalibrationMetrics(timeRange);

    // Get validation curve
    const validationCurve = await this.generateValidationCurve(timeRange);

    // Get category breakdown
    const categoryBreakdown = await this.getCategoryBreakdown(timeRange);

    // Generate recommendations
    const recommendations = this.generateCalibrationRecommendations(currentMetrics, validationCurve, categoryBreakdown);

    return {
      currentMetrics,
      validationCurve,
      modelPerformance: this.adaptiveModel,
      categoryBreakdown,
      recommendations
    };
  }

  private async getCategoryBreakdown(timeRange: 'week' | 'month' | 'quarter' | 'year'): Promise<Array<{
    category: string;
    sampleCount: number;
    brierScore: number;
    calibrationQuality: string;
  }>> {
    const cutoffDate = this.getCutoffDate(timeRange);
    const data = this.calibrationData.filter(d => d.timestamp >= cutoffDate);

    const categories = [...new Set(data.map(d => d.claimCategory))];
    const breakdown = [];

    for (const category of categories) {
      const categoryData = data.filter(d => d.claimCategory === category);

      if (categoryData.length >= 5) { // Minimum samples for reliable metrics
        const brierScore = this.calculateBrierScore(categoryData);
        const reliabilityDiagram = this.createReliabilityDiagram(categoryData);
        const ece = this.calculateExpectedCalibrationError(reliabilityDiagram);
        const mce = Math.max(...reliabilityDiagram.map(bin => Math.abs(bin.calibrationError)));
        const calibrationQuality = this.determineCalibrationQuality(brierScore, ece, mce);

        breakdown.push({
          category,
          sampleCount: categoryData.length,
          brierScore,
          calibrationQuality
        });
      }
    }

    return breakdown.sort((a, b) => b.sampleCount - a.sampleCount);
  }

  private generateCalibrationRecommendations(
    metrics: CalibrationMetrics,
    validationCurve: ValidationCurve,
    categoryBreakdown: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Based on overall calibration quality
    switch (metrics.overallCalibrationQuality) {
      case 'unreliable':
        recommendations.push('URGENT: Calibration is unreliable - comprehensive model retraining required');
        recommendations.push('Consider reducing confidence thresholds until calibration improves');
        break;
      case 'poor':
        recommendations.push('Calibration quality is poor - increase training data frequency');
        break;
      case 'fair':
        recommendations.push('Calibration is fair - continue monitoring and gradual improvement');
        break;
      case 'good':
        recommendations.push('Good calibration achieved - maintain current approach');
        break;
      case 'excellent':
        recommendations.push('Excellent calibration - consider expanding to new domains');
        break;
    }

    // Based on Brier score trend
    if (validationCurve.timePoints.length > 1) {
      const recent = validationCurve.timePoints.slice(-3);
      const trend = recent[recent.length - 1].brierScore - recent[0].brierScore;

      if (trend > 0.02) {
        recommendations.push('Brier score is increasing - investigate recent changes in data or model');
      } else if (trend < -0.02) {
        recommendations.push('Brier score improving - current adaptation strategy is effective');
      }
    }

    // Based on category performance
    const poorCategories = categoryBreakdown.filter(c =>
      c.calibrationQuality === 'poor' || c.calibrationQuality === 'unreliable'
    );

    if (poorCategories.length > 0) {
      recommendations.push(`${poorCategories.length} categories showing poor calibration - consider category-specific models`);
    }

    // Based on model performance
    if (this.adaptiveModel.performanceMetrics.stabilityScore < 0.5) {
      recommendations.push('Model stability is low - consider reducing learning rate or increasing sample size');
    }

    if (recommendations.length === 0) {
      recommendations.push('Calibration system performing optimally - continue current approach');
    }

    return recommendations;
  }
}

export default ConfidenceCalibrationSystem;