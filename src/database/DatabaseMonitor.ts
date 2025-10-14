/**
 * 📊 DATABASE PERFORMANCE MONITOR
 * ================================
 *
 * Real-time monitoring of database performance metrics
 * and query optimization recommendations
 */

import { EventEmitter } from 'events';
import { getConnectionPool } from './ConnectionPool.js';

interface QueryMetrics {
  query: string;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP';
  duration: number;
  timestamp: number;
  rowsAffected?: number;
  error?: string;
}

interface PerformanceMetrics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  failedQueries: number;
  connectionUsage: {
    max: number;
    average: number;
    current: number;
  };
  recentQueries: QueryMetrics[];
  slowestQueries: QueryMetrics[];
  frequentQueries: Array<{
    query: string;
    count: number;
    averageTime: number;
  }>;
}

export class DatabaseMonitor extends EventEmitter {
  private queryHistory: QueryMetrics[] = [];
  private queryPatterns: Map<string, { count: number; totalTime: number }> = new Map();
  private slowQueryThreshold = 100; // 100ms
  private maxHistorySize = 10000;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(private slowThreshold: number = 100) {
    super();
    this.slowQueryThreshold = slowThreshold;
  }

  /**
   * Start monitoring database performance
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log('📊 Database monitoring started');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('📊 Database monitoring stopped');
  }

  /**
   * Record a query execution
   */
  recordQuery(
    query: string,
    duration: number,
    rowsAffected?: number,
    error?: string
  ): void {
    const normalizedQuery = this.normalizeQuery(query);
    const queryType = this.extractQueryType(query);

    const metrics: QueryMetrics = {
      query: normalizedQuery,
      type: queryType,
      duration,
      timestamp: Date.now(),
      rowsAffected,
      error,
    };

    // Add to history
    this.queryHistory.push(metrics);
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory.shift();
    }

    // Update pattern statistics
    const existing = this.queryPatterns.get(normalizedQuery);
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
    } else {
      this.queryPatterns.set(normalizedQuery, {
        count: 1,
        totalTime: duration,
      });
    }

    // Emit events for slow and failed queries
    if (duration > this.slowQueryThreshold) {
      this.emit('slowQuery', metrics);
    }

    if (error) {
      this.emit('failedQuery', metrics);
    }
  }

  /**
   * Wrap a database function with monitoring
   */
  wrapWithMonitoring<T extends any[], R>(
    fn: (...args: T) => R,
    queryContext?: string
  ): (...args: T) => R {
    return (...args: T) => {
      const startTime = Date.now();
      try {
        const result = fn(...args);
        const duration = Date.now() - startTime;

        // Handle different types of results
        let rowsAffected: number | undefined;
        if (result && typeof result === 'object') {
          if ('changes' in result) {
            rowsAffected = result.changes;
          } else if ('length' in result) {
            rowsAffected = result.length;
          }
        }

        const query = queryContext || this.extractQueryFromArgs(args);
        this.recordQuery(query, duration, rowsAffected);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const query = queryContext || this.extractQueryFromArgs(args);
        this.recordQuery(query, duration, undefined, String(error));
        throw error;
      }
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const recentQueries = this.queryHistory.slice(-100);
    const slowQueries = this.queryHistory.filter(q => q.duration > this.slowQueryThreshold);
    const failedQueries = this.queryHistory.filter(q => q.error);

    // Calculate average query time
    const totalQueryTime = this.queryHistory.reduce((sum, q) => sum + q.duration, 0);
    const averageQueryTime = this.queryHistory.length > 0
      ? totalQueryTime / this.queryHistory.length
      : 0;

    // Get connection pool stats
    const pool = getConnectionPool();
    const poolStats = pool.getStats();

    // Find slowest queries
    const slowestQueries = [...this.queryHistory]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Find most frequent queries
    const frequentQueries = Array.from(this.queryPatterns.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        averageTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalQueries: this.queryHistory.length,
      averageQueryTime,
      slowQueries: slowQueries.length,
      failedQueries: failedQueries.length,
      connectionUsage: {
        max: poolStats.totalConnections,
        average: poolStats.totalConnections,
        current: poolStats.activeConnections,
      },
      recentQueries,
      slowestQueries,
      frequentQueries,
    };
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): Array<{
    type: 'index' | 'query' | 'pool' | 'schema';
    priority: 'high' | 'medium' | 'low';
    message: string;
    details?: any;
  }> {
    const recommendations = [];
    const metrics = this.getMetrics();

    // Check for slow queries
    if (metrics.slowestQueries.length > 0) {
      const avgSlowTime = metrics.slowestQueries.reduce((sum, q) => sum + q.duration, 0) / metrics.slowestQueries.length;

      if (avgSlowTime > 500) {
        recommendations.push({
          type: 'index',
          priority: 'high',
          message: `Very slow queries detected (average ${avgSlowTime.toFixed(0)}ms)`,
          details: {
            slowQueries: metrics.slowestQueries.slice(0, 5),
          },
        });
      }
    }

    // Check connection pool usage
    if (metrics.connectionUsage.current / metrics.connectionUsage.max > 0.8) {
      recommendations.push({
        type: 'pool',
        priority: 'high',
        message: 'Connection pool near capacity (80%+ usage)',
        details: {
          current: metrics.connectionUsage.current,
          max: metrics.connectionUsage.max,
        },
      });
    }

    // Check failed queries
    if (metrics.failedQueries > 0) {
      const failureRate = metrics.failedQueries / metrics.totalQueries;
      if (failureRate > 0.05) { // 5% failure rate
        recommendations.push({
          type: 'query',
          priority: 'medium',
          message: `High query failure rate: ${(failureRate * 100).toFixed(1)}%`,
          details: {
            failedQueries: metrics.failedQueries,
            totalQueries: metrics.totalQueries,
          },
        });
      }
    }

    // Check average query time
    if (metrics.averageQueryTime > 100) {
      recommendations.push({
        type: 'query',
        priority: 'medium',
        message: `Average query time is high: ${metrics.averageQueryTime.toFixed(0)}ms`,
        details: {
          averageTime: metrics.averageQueryTime,
        },
      });
    }

    // Suggest indexes for frequent slow queries
    const frequentSlowQueries = metrics.frequentQueries.filter(q => q.averageTime > this.slowQueryThreshold);
    if (frequentSlowQueries.length > 0) {
      recommendations.push({
        type: 'index',
        priority: 'medium',
        message: 'Frequently executed queries are slow',
        details: {
          queries: frequentSlowQueries.slice(0, 3),
        },
      });
    }

    return recommendations;
  }

  /**
   * Normalize a query for pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\d+\b/g, '?')
      .replace(/\b'[^']*'\b/g, '?')
      .replace(/\b"[^"]*"\b/g, '?');
  }

  /**
   * Extract query type
   */
  private extractQueryType(query: string): QueryMetrics['type'] {
    const normalized = query.trim().toUpperCase();

    if (normalized.startsWith('SELECT')) return 'SELECT';
    if (normalized.startsWith('INSERT')) return 'INSERT';
    if (normalized.startsWith('UPDATE')) return 'UPDATE';
    if (normalized.startsWith('DELETE')) return 'DELETE';
    if (normalized.startsWith('CREATE')) return 'CREATE';
    if (normalized.startsWith('DROP')) return 'DROP';

    return 'SELECT'; // Default
  }

  /**
   * Try to extract query from function arguments
   */
  private extractQueryFromArgs(args: any[]): string {
    if (args.length > 0 && typeof args[0] === 'string') {
      return args[0];
    }
    return 'Unknown query';
  }

  /**
   * Collect periodic metrics
   */
  private collectMetrics(): void {
    const metrics = this.getMetrics();
    this.emit('metrics', metrics);

    // Log warnings for concerning metrics
    if (metrics.averageQueryTime > 200) {
      console.warn(`⚠️ High average query time: ${metrics.averageQueryTime.toFixed(0)}ms`);
    }

    if (metrics.connectionUsage.current / metrics.connectionUsage.max > 0.9) {
      console.warn('⚠️ Connection pool at critical capacity');
    }

    if (metrics.failedQueries > this.queryHistory.length * 0.1) {
      console.warn('⚠️ High query failure rate detected');
    }
  }

  /**
   * Export metrics data
   */
  exportMetrics(): {
    timestamp: number;
    metrics: PerformanceMetrics;
    recommendations: Array<{
      type: 'index' | 'query' | 'pool' | 'schema';
      priority: 'high' | 'medium' | 'low';
      message: string;
      details?: any;
    }>;
  } {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      recommendations: this.getRecommendations(),
    };
  }

  /**
   * Clear all collected metrics
   */
  clearMetrics(): void {
    this.queryHistory = [];
    this.queryPatterns.clear();
    console.log('📊 Database metrics cleared');
  }
}

/**
 * Global database monitor instance
 */
let globalMonitor: DatabaseMonitor | null = null;

/**
 * Initialize the global database monitor
 */
export function initializeDatabaseMonitor(slowThreshold?: number): DatabaseMonitor {
  if (globalMonitor) {
    return globalMonitor;
  }

  globalMonitor = new DatabaseMonitor(slowThreshold);
  return globalMonitor;
}

/**
 * Get the global database monitor
 */
export function getDatabaseMonitor(): DatabaseMonitor {
  if (!globalMonitor) {
    throw new Error('Database monitor not initialized');
  }
  return globalMonitor;
}

export default DatabaseMonitor;