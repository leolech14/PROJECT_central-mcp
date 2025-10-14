/**
 * 🚀 DATABASE INITIALIZATION SYSTEM
 * =================================
 *
 * Comprehensive database setup with connection pooling,
 * monitoring, and performance optimization
 */

import path from 'path';
import { logger } from '../utils/logger.js';
import { initializeDatabase, DatabaseFactory } from './DatabaseFactory.js';
import { initializeDatabaseMonitor } from './DatabaseMonitor.js';

export interface DatabaseInitConfig {
  databasePath: string;
  pool?: {
    maxConnections?: number;
    minConnections?: number;
    idleTimeoutMillis?: number;
    acquireTimeoutMillis?: number;
  };
  monitoring?: {
    enabled?: boolean;
    slowQueryThreshold?: number;
    monitoringInterval?: number;
  };
  optimization?: {
    enableWAL?: boolean;
    enableForeignKeys?: boolean;
    cacheSize?: number;
    mmapSize?: number;
    journalMode?: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'WAL';
    synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
  };
}

export class DatabaseInitializer {
  private static instance: DatabaseInitializer | null = null;
  private databaseFactory: DatabaseFactory | null = null;
  private isInitialized = false;
  private config: DatabaseInitConfig;

  private constructor(config: DatabaseInitConfig) {
    this.config = config;
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: DatabaseInitConfig): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      if (!config) {
        throw new Error('Database config required for first initialization');
      }
      DatabaseInitializer.instance = new DatabaseInitializer(config);
    }
    return DatabaseInitializer.instance;
  }

  /**
   * Initialize the complete database system
   */
  async initialize(): Promise<DatabaseFactory> {
    if (this.isInitialized) {
      return this.databaseFactory!;
    }

    try {
      logger.info('🚀 Initializing database system...');

      // Ensure database directory exists
      await this.ensureDatabaseDirectory();

      // Initialize database factory with connection pooling
      this.databaseFactory = initializeDatabase(this.config);

      // Wait for database to be fully initialized
      await this.databaseFactory.initialize();

      // Initialize monitoring if enabled
      if (this.config.monitoring?.enabled !== false) {
        this.initializeMonitoring();
      }

      // Run performance optimizations
      await this.runPerformanceOptimizations();

      // Verify database health
      await this.verifyDatabaseHealth();

      this.isInitialized = true;
      logger.info('✅ Database system initialized successfully');

      return this.databaseFactory;
    } catch (error) {
      logger.error('❌ Failed to initialize database system:', error);
      throw error;
    }
  }

  /**
   * Ensure database directory exists
   */
  private async ensureDatabaseDirectory(): Promise<void> {
    const dbDir = path.dirname(this.config.databasePath);
    const fs = require('fs');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info(`📁 Created database directory: ${dbDir}`);
    }
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    const monitor = initializeDatabaseMonitor(
      this.config.monitoring?.slowQueryThreshold || 100
    );

    if (this.config.monitoring?.enabled !== false) {
      monitor.startMonitoring(this.config.monitoring?.monitoringInterval || 5000);
      logger.info('📊 Database monitoring started');
    }

    // Set up event listeners
    monitor.on('slowQuery', (metrics) => {
      logger.warn(`⚠️ Slow query detected: ${metrics.duration}ms - ${metrics.query}`);
    });

    monitor.on('failedQuery', (metrics) => {
      logger.error(`❌ Query failed: ${metrics.error} - ${metrics.query}`);
    });

    monitor.on('metrics', (metrics) => {
      if (metrics.averageQueryTime > 200) {
        logger.warn(`⚠️ High average query time: ${metrics.averageQueryTime.toFixed(0)}ms`);
      }
    });
  }

  /**
   * Run performance optimizations
   */
  private async runPerformanceOptimizations(): Promise<void> {
    if (!this.databaseFactory) {
      throw new Error('Database factory not initialized');
    }

    await this.databaseFactory.withConnection(async (db) => {
      const optimizations = [];

      // Enable WAL mode if configured
      if (this.config.optimization?.enableWAL !== false) {
        const journalMode = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
        if (journalMode.journal_mode !== 'wal') {
          db.exec('PRAGMA journal_mode = WAL');
          optimizations.push('WAL mode enabled');
        }
      }

      // Enable foreign keys if configured
      if (this.config.optimization?.enableForeignKeys !== false) {
        db.exec('PRAGMA foreign_keys = ON');
        optimizations.push('Foreign keys enabled');
      }

      // Set cache size if configured
      if (this.config.optimization?.cacheSize) {
        db.exec(`PRAGMA cache_size = ${this.config.optimization.cacheSize}`);
        optimizations.push(`Cache size set to ${this.config.optimization.cacheSize}`);
      }

      // Set mmap size if configured
      if (this.config.optimization?.mmapSize) {
        db.exec(`PRAGMA mmap_size = ${this.config.optimization.mmapSize}`);
        optimizations.push(`MMap size set to ${this.config.optimization.mmapSize}`);
      }

      // Set synchronous mode if configured
      if (this.config.optimization?.synchronous) {
        db.exec(`PRAGMA synchronous = ${this.config.optimization.synchronous}`);
        optimizations.push(`Synchronous mode set to ${this.config.optimization.synchronous}`);
      }

      // Set journal mode if configured
      if (this.config.optimization?.journalMode) {
        db.exec(`PRAGMA journal_mode = ${this.config.optimization.journalMode}`);
        optimizations.push(`Journal mode set to ${this.config.optimization.journalMode}`);
      }

      if (optimizations.length > 0) {
        logger.info(`⚡ Applied performance optimizations: ${optimizations.join(', ')}`);
      }
    });
  }

  /**
   * Verify database health
   */
  private async verifyDatabaseHealth(): Promise<void> {
    if (!this.databaseFactory) {
      throw new Error('Database factory not initialized');
    }

    try {
      // Test basic connectivity
      await this.databaseFactory.withConnection((db) => {
        const result = db.prepare('SELECT 1 as test').get() as { test: number };
        if (result.test !== 1) {
          throw new Error('Database connectivity test failed');
        }
      });

      // Check connection pool health
      const health = await this.databaseFactory.getHealth();
      if (!health.healthy) {
        throw new Error('Connection pool health check failed');
      }

      // Get database stats
      const stats = this.databaseFactory.getStats();
      logger.info(`📊 Database pool stats: ${stats.totalConnections} connections, ${stats.activeConnections} active`);

      logger.info('✅ Database health verification passed');
    } catch (error) {
      logger.error('❌ Database health verification failed:', error);
      throw error;
    }
  }

  /**
   * Get database factory instance
   */
  getDatabaseFactory(): DatabaseFactory {
    if (!this.databaseFactory) {
      throw new Error('Database not initialized');
    }
    return this.databaseFactory;
  }

  /**
   * Get current configuration
   */
  getConfig(): DatabaseInitConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (note: some changes may require reinitialization)
   */
  updateConfig(newConfig: Partial<DatabaseInitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('🔧 Database configuration updated');
  }

  /**
   * Close the database system
   */
  async close(): Promise<void> {
    if (this.databaseFactory) {
      await this.databaseFactory.close();
      this.databaseFactory = null;
    }

    this.isInitialized = false;
    logger.info('🔌 Database system closed');
  }

  /**
   * Get comprehensive status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    healthy: boolean;
    config: DatabaseInitConfig;
    poolStats?: any;
    monitoringMetrics?: any;
    recommendations?: any;
  }> {
    const status = {
      initialized: this.isInitialized,
      healthy: false,
      config: this.config,
    };

    if (this.databaseFactory && this.isInitialized) {
      try {
        const health = await this.databaseFactory.getHealth();
        status.healthy = health.healthy;
        status.poolStats = this.databaseFactory.getStats();

        // Get monitoring metrics if available
        try {
          const monitor = initializeDatabaseMonitor();
          status.monitoringMetrics = monitor.getMetrics();
          status.recommendations = monitor.getRecommendations();
        } catch {
          // Monitoring might not be initialized
        }
      } catch (error) {
        logger.error('❌ Error getting database status:', error);
        status.healthy = false;
      }
    }

    return status;
  }
}

/**
 * Initialize database system with default configuration
 */
export async function initializeDatabaseSystem(config?: Partial<DatabaseInitConfig>): Promise<DatabaseFactory> {
  const defaultConfig: DatabaseInitConfig = {
    databasePath: './data/registry.db',
    pool: {
      maxConnections: 10,
      minConnections: 2,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000,
    },
    monitoring: {
      enabled: true,
      slowQueryThreshold: 100,
      monitoringInterval: 5000,
    },
    optimization: {
      enableWAL: true,
      enableForeignKeys: true,
      cacheSize: 1000,
      mmapSize: 268435456, // 256MB
      journalMode: 'WAL',
      synchronous: 'NORMAL',
    },
    ...config,
  };

  const initializer = DatabaseInitializer.getInstance(defaultConfig);
  return initializer.initialize();
}

/**
 * Get the global database initializer instance
 */
export function getDatabaseInitializer(): DatabaseInitializer {
  const initializer = DatabaseInitializer.getInstance();
  if (!initializer) {
    throw new Error('Database initializer not initialized');
  }
  return initializer;
}

export default DatabaseInitializer;