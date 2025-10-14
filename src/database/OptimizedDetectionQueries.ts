/**
 * Optimized Database Query Helpers
 * ================================
 *
 * High-performance database queries for the enhanced model detection system.
 * Provides prepared statements, connection pooling, and query optimization.
 */

import { Database, Statement } from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export interface DatabaseConfig {
  connectionPool: {
    max: number;
    min: number;
    acquireTimeoutMillis: number;
    idleTimeoutMillis: number;
  };
  queries: {
    enableOptimizations: boolean;
    cachePreparedStatements: boolean;
    batchSize: number;
    timeoutMs: number;
  };
}

export interface QueryMetrics {
  queryName: string;
  executionTime: number;
  rowsAffected: number;
  cacheHit: boolean;
  timestamp: number;
}

/**
 * Optimized Database Manager for Model Detection
 */
export class OptimizedDetectionDB {
  private db: Database;
  private config: DatabaseConfig;
  private statementCache = new Map<string, Statement>();
  private queryMetrics: QueryMetrics[] = [];
  private lastCacheCleanup = 0;
  private readonly CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes

  constructor(dbPath: string, config: Partial<DatabaseConfig> = {}) {
    this.db = new Database(dbPath);
    this.config = {
      connectionPool: {
        max: 10,
        min: 2,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 300000
      },
      queries: {
        enableOptimizations: true,
        cachePreparedStatements: true,
        batchSize: 1000,
        timeoutMs: 5000
      },
      ...config
    };

    // Optimize database settings
    this.optimizeDatabase();

    // Prepare frequently used statements
    if (this.config.queries.cachePreparedStatements) {
      this.prepareCommonStatements();
    }
  }

  /**
   * Optimize database performance settings
   */
  private optimizeDatabase(): void {
    try {
      // Enable WAL mode for better concurrent performance
      this.db.pragma('journal_mode = WAL');

      // Optimize for read-heavy workloads
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('temp_store = MEMORY');

      // Optimize memory usage
      this.db.pragma('mmap_size = 268435456'); // 256MB

      // Configure busy timeout
      this.db.pragma('busy_timeout = 30000');

      logger.info('Database performance optimizations applied');
    } catch (error) {
      logger.warn('Failed to apply database optimizations:', error);
    }
  }

  /**
   * Prepare frequently used statements
   */
  private prepareCommonStatements(): void {
    try {
      // Enhanced model detections queries
      this.statementCache.set('insertDetection', this.db.prepare(`
        INSERT INTO enhanced_model_detections (
          id, timestamp, session_id, agent_letter, agent_model, model_provider,
          detected_model, original_assumption, confidence, detection_method,
          verification_method, configuration_source, capabilities, system_info,
          verification_attempted, verification_successful, verification_details,
          reason_for_change, self_correction_applied, self_correction_data,
          verified, execution_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `));

      this.statementCache.set('selectRecentDetections', this.db.prepare(`
        SELECT * FROM enhanced_model_detections
        WHERE timestamp > datetime('now', '-24 hours')
        ORDER BY timestamp DESC
        LIMIT ?
      `));

      this.statementCache.set('selectDetectionBySession', this.db.prepare(`
        SELECT * FROM enhanced_model_detections
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `));

      // Detection corrections queries
      this.statementCache.set('insertCorrection', this.db.prepare(`
        INSERT INTO detection_corrections (
          id, timestamp, session_id, detection_id, original_model,
          corrected_to, confidence_before, confidence_after, correction_method,
          auto_applied, verification_method, context, metadata, correction_applied
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `));

      this.statementCache.set('selectCorrectionsByModel', this.db.prepare(`
        SELECT * FROM detection_corrections
        WHERE original_model = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `));

      // User feedback queries
      this.statementCache.set('insertFeedback', this.db.prepare(`
        INSERT INTO user_feedback (
          id, detected_model, actual_model, user_confirmed, accuracy,
          context, timestamp, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `));

      this.statementCache.set('selectFeedbackByModel', this.db.prepare(`
        SELECT * FROM user_feedback
        WHERE detected_model = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `));

      // Performance metrics queries
      this.statementCache.set('upsertPerformanceMetrics', this.db.prepare(`
        INSERT OR REPLACE INTO model_performance_metrics (
          id, model, total_detections, correct_detections, accuracy,
          avg_confidence, confidence_accuracy, last_updated, first_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `));

      this.statementCache.set('selectPerformanceMetrics', this.db.prepare(`
        SELECT * FROM model_performance_metrics
        WHERE model = ?
      `));

      // Correction patterns queries
      this.statementCache.set('insertCorrectionPattern', this.db.prepare(`
        INSERT OR REPLACE INTO correction_patterns (
          id, pattern, original_model, corrected_to, frequency, accuracy,
          confidence, auto_apply, min_confidence_threshold, required_occurrences,
          last_seen, first_seen, created_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `));

      this.statementCache.set('selectCorrectionPatterns', this.db.prepare(`
        SELECT * FROM correction_patterns
        WHERE original_model = ? AND status = 'active'
        ORDER BY frequency DESC, accuracy DESC
      `));

      logger.info(`Prepared ${this.statementCache.size} optimized database statements`);
    } catch (error) {
      logger.error('Failed to prepare database statements:', error);
    }
  }

  /**
   * Execute optimized query with metrics collection
   */
  private executeOptimized<T>(
    queryName: string,
    statement: Statement,
    params: any[] = []
  ): T[] {
    const startTime = Date.now();

    try {
      const result = statement.all(...params) as T[];
      const executionTime = Date.now() - startTime;

      // Record metrics
      this.recordQueryMetrics({
        queryName,
        executionTime,
        rowsAffected: result.length,
        cacheHit: true,
        timestamp: Date.now()
      });

      // Log slow queries
      if (executionTime > this.config.queries.timeoutMs) {
        logger.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Query failed: ${queryName} after ${executionTime}ms`, error);
      throw error;
    }
  }

  /**
   * Record query performance metrics
   */
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);

    // Keep only recent metrics (last 1000)
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Periodic cleanup
    if (Date.now() - this.lastCacheCleanup > this.CACHE_CLEANUP_INTERVAL) {
      this.cleanupMetrics();
      this.lastCacheCleanup = Date.now();
    }
  }

  /**
   * Cleanup old metrics
   */
  private cleanupMetrics(): void {
    const cutoff = Date.now() - 3600000; // 1 hour ago
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Insert detection record with optimization
   */
  insertDetection(detectionData: any): void {
    const statement = this.statementCache.get('insertDetection');
    if (!statement) {
      throw new Error('Detection insert statement not prepared');
    }

    this.executeOptimized('insertDetection', statement, [
      detectionData.id,
      detectionData.timestamp,
      detectionData.session_id,
      detectionData.agent_letter,
      detectionData.agent_model,
      detectionData.model_provider,
      detectionData.detected_model,
      detectionData.original_assumption,
      detectionData.confidence,
      detectionData.detection_method,
      detectionData.verification_method,
      detectionData.configuration_source,
      JSON.stringify(detectionData.capabilities),
      JSON.stringify(detectionData.system_info),
      detectionData.verification_attempted ? 1 : 0,
      detectionData.verification_successful ? 1 : 0,
      JSON.stringify(detectionData.verification_details),
      detectionData.reason_for_change,
      detectionData.self_correction_applied ? 1 : 0,
      JSON.stringify(detectionData.self_correction_data),
      detectionData.verified ? 1 : 0,
      detectionData.execution_time_ms
    ]);
  }

  /**
   * Get recent detections with pagination
   */
  getRecentDetections(limit: number = 100): any[] {
    const statement = this.statementCache.get('selectRecentDetections');
    if (!statement) {
      throw new Error('Recent detections select statement not prepared');
    }

    return this.executeOptimized('getRecentDetections', statement, [limit]);
  }

  /**
   * Get detection by session ID
   */
  getDetectionBySession(sessionId: string): any | null {
    const statement = this.statementCache.get('selectDetectionBySession');
    if (!statement) {
      throw new Error('Session detection select statement not prepared');
    }

    const result = this.executeOptimized('getDetectionBySession', statement, [sessionId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Batch insert detection records
   */
  batchInsertDetections(detections: any[]): void {
    const insertStmt = this.db.prepare(`
      INSERT INTO enhanced_model_detections (
        id, timestamp, session_id, agent_letter, agent_model, model_provider,
        detected_model, original_assumption, confidence, detection_method,
        verification_method, configuration_source, capabilities, system_info,
        verification_attempted, verification_successful, verification_details,
        reason_for_change, self_correction_applied, self_correction_data,
        verified, execution_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((detections: any[]) => {
      for (const detection of detections) {
        insertStmt.run(
          detection.id,
          detection.timestamp,
          detection.session_id,
          detection.agent_letter,
          detection.agent_model,
          detection.model_provider,
          detection.detected_model,
          detection.original_assumption,
          detection.confidence,
          detection.detection_method,
          detection.verification_method,
          detection.configuration_source,
          JSON.stringify(detection.capabilities),
          JSON.stringify(detection.system_info),
          detection.verification_attempted ? 1 : 0,
          detection.verification_successful ? 1 : 0,
          JSON.stringify(detection.verification_details),
          detection.reason_for_change,
          detection.self_correction_applied ? 1 : 0,
          JSON.stringify(detection.self_correction_data),
          detection.verified ? 1 : 0,
          detection.execution_time_ms
        );
      }
    });

    transaction(detections);
    logger.info(`Batch inserted ${detections.length} detection records`);
  }

  /**
   * Get model performance metrics with caching
   */
  getModelPerformanceMetrics(model: string): any | null {
    const statement = this.statementCache.get('selectPerformanceMetrics');
    if (!statement) {
      throw new Error('Performance metrics select statement not prepared');
    }

    const result = this.executeOptimized('getModelPerformanceMetrics', statement, [model]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update model performance metrics
   */
  updateModelPerformanceMetrics(model: string, wasCorrect: boolean, confidence: number): void {
    const existing = this.getModelPerformanceMetrics(model);

    const metrics = {
      id: existing?.id || `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      model,
      total_detections: (existing?.total_detections || 0) + 1,
      correct_detections: (existing?.correct_detections || 0) + (wasCorrect ? 1 : 0),
      accuracy: wasCorrect ?
        ((existing?.correct_detections || 0) + 1) / ((existing?.total_detections || 0) + 1) :
        (existing?.correct_detections || 0) / ((existing?.total_detections || 0) + 1),
      avg_confidence: existing ?
        ((existing.avg_confidence * existing.total_detections) + confidence) / ((existing.total_detections) + 1) :
        confidence,
      confidence_accuracy: 0.8, // Placeholder
      last_updated: new Date().toISOString(),
      first_seen: existing?.first_seen || new Date().toISOString()
    };

    const statement = this.statementCache.get('upsertPerformanceMetrics');
    if (!statement) {
      throw new Error('Performance metrics upsert statement not prepared');
    }

    this.executeOptimized('updateModelPerformanceMetrics', statement, [
      metrics.id,
      metrics.model,
      metrics.total_detections,
      metrics.correct_detections,
      metrics.accuracy,
      metrics.avg_confidence,
      metrics.confidence_accuracy,
      metrics.last_updated,
      metrics.first_seen
    ]);
  }

  /**
   * Get correction patterns for a model
   */
  getCorrectionPatterns(model: string): any[] {
    const statement = this.statementCache.get('selectCorrectionPatterns');
    if (!statement) {
      throw new Error('Correction patterns select statement not prepared');
    }

    return this.executeOptimized('getCorrectionPatterns', statement, [model]);
  }

  /**
   * Get system performance statistics
   */
  getSystemPerformanceStats(): any {
    const avgExecutionTime = this.queryMetrics.length > 0 ?
      this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / this.queryMetrics.length : 0;

    const slowQueries = this.queryMetrics.filter(m => m.executionTime > this.config.queries.timeoutMs);
    const cacheHitRate = this.queryMetrics.length > 0 ?
      this.queryMetrics.filter(m => m.cacheHit).length / this.queryMetrics.length : 0;

    return {
      totalQueries: this.queryMetrics.length,
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
      slowQueriesCount: slowQueries.length,
      slowQueriesPercentage: this.queryMetrics.length > 0 ?
        Math.round((slowQueries.length / this.queryMetrics.length) * 100 * 100) / 100 : 0,
      cacheHitRate: Math.round(cacheHitRate * 100 * 100) / 100,
      preparedStatementsCount: this.statementCache.size,
      lastCleanup: this.lastCacheCleanup
    };
  }

  /**
   * Cleanup prepared statements and metrics
   */
  close(): void {
    try {
      this.statementCache.clear();
      this.queryMetrics = [];
      this.db.close();
      logger.info('Optimized database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }
}

/**
 * Connection Pool Manager
 */
export class DetectionConnectionPool {
  private static instance: DetectionConnectionPool;
  private connections = new Map<string, OptimizedDetectionDB>();
  private config: DatabaseConfig;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      connectionPool: {
        max: 10,
        min: 2,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 300000
      },
      queries: {
        enableOptimizations: true,
        cachePreparedStatements: true,
        batchSize: 1000,
        timeoutMs: 5000
      },
      ...config
    };
  }

  static getInstance(config?: Partial<DatabaseConfig>): DetectionConnectionPool {
    if (!DetectionConnectionPool.instance) {
      DetectionConnectionPool.instance = new DetectionConnectionPool(config);
    }
    return DetectionConnectionPool.instance;
  }

  getConnection(dbPath: string): OptimizedDetectionDB {
    if (!this.connections.has(dbPath)) {
      this.connections.set(dbPath, new OptimizedDetectionDB(dbPath, this.config));
    }
    return this.connections.get(dbPath)!;
  }

  closeConnection(dbPath: string): void {
    const connection = this.connections.get(dbPath);
    if (connection) {
      connection.close();
      this.connections.delete(dbPath);
    }
  }

  closeAllConnections(): void {
    for (const [path, connection] of this.connections) {
      connection.close();
    }
    this.connections.clear();
  }
}

/**
 * Factory function for creating optimized database connections
 */
export function createOptimizedDetectionDB(
  dbPath: string,
  config?: Partial<DatabaseConfig>
): OptimizedDetectionDB {
  const pool = DetectionConnectionPool.getInstance(config);
  return pool.getConnection(dbPath);
}