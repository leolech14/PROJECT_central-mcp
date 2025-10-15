/**
 * 🔗 DATABASE INTEGRATION LAYER
 * ================================
 *
 * Integration bridge between new database systems and Central MCP
 * Ensures compatibility while enabling advanced features
 */

import { initializeDatabaseSystem, getDatabaseInitializer } from '../database/DatabaseInitializer.js';
import { initializeDatabaseIntegrityValidator, getDatabaseIntegrityValidator } from '../database/DatabaseIntegrityValidator.js';
import { initializeDatabaseMonitor, getDatabaseMonitor } from '../database/DatabaseMonitor.js';
import { JsonTaskStore } from '../registry/JsonTaskStore.js';
import { logger } from '../utils/logger.js';

export interface DatabaseConfig {
  databasePath: string;
  enableConnectionPooling: boolean;
  enableMonitoring: boolean;
  enableIntegrityValidation: boolean;
  enableJsonColumns: boolean;
  poolConfig?: {
    maxConnections?: number;
    minConnections?: number;
    idleTimeoutMillis?: number;
  };
  monitoringConfig?: {
    slowQueryThreshold?: number;
    monitoringInterval?: number;
  };
}

export class DatabaseIntegrationLayer {
  private static instance: DatabaseIntegrationLayer | null = null;
  private isInitialized = false;
  private config: DatabaseConfig;

  // System components
  private jsonTaskStore: JsonTaskStore | null = null;
  private databaseMonitor = getDatabaseMonitor();
  private integrityValidator = getDatabaseIntegrityValidator();
  private databaseInitializer = getDatabaseInitializer();

  private constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: DatabaseConfig): DatabaseIntegrationLayer {
    if (!DatabaseIntegrationLayer.instance) {
      if (!config) {
        throw new Error('Database config required for first initialization');
      }
      DatabaseIntegrationLayer.instance = new DatabaseIntegrationLayer(config);
    }
    return DatabaseIntegrationLayer.instance;
  }

  /**
   * 🚀 NEW: Get Database Monitor instance
   */
  getDatabaseMonitor() {
    return this.databaseMonitor;
  }

  /**
   * 🚀 NEW: Get Database Integrity Validator instance
   */
  getDatabaseIntegrityValidator() {
    return this.integrityValidator;
  }

  /**
   * 🚀 NEW: Get Database Initializer instance
   */
  getDatabaseInitializer() {
    return this.databaseInitializer;
  }

  /**
   * Initialize the complete database integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('🔗 Initializing Database Integration Layer...');

      // Step 1: Initialize core database system with connection pooling
      if (this.config.enableConnectionPooling) {
        await this.initializeConnectionPooling();
      }

      // Step 2: Initialize monitoring if enabled
      if (this.config.enableMonitoring) {
        this.initializeMonitoring();
      }

      // Step 3: Initialize integrity validation if enabled
      if (this.config.enableIntegrityValidation) {
        this.initializeIntegrityValidation();
      }

      // Step 4: Initialize JSON TaskStore if JSON columns enabled
      if (this.config.enableJsonColumns) {
        this.initializeJsonTaskStore();
      }

      // Step 5: Run health checks
      await this.runHealthChecks();

      // Step 6: Set up Central MCP integration hooks
      this.setupCentralMCPIntegration();

      this.isInitialized = true;
      logger.info('✅ Database Integration Layer initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize Database Integration Layer:', error);
      throw error;
    }
  }

  /**
   * Initialize connection pooling system
   */
  private async initializeConnectionPooling(): Promise<void> {
    logger.info('🏊 Initializing connection pooling...');

    const dbConfig = {
      databasePath: this.config.databasePath,
      pool: {
        maxConnections: this.config.poolConfig?.maxConnections || 10,
        minConnections: this.config.poolConfig?.minConnections || 2,
        idleTimeoutMillis: this.config.poolConfig?.idleTimeoutMillis || 30000,
        acquireTimeoutMillis: 5000,
      },
      monitoring: {
        enabled: this.config.enableMonitoring,
        slowQueryThreshold: this.config.monitoringConfig?.slowQueryThreshold || 100,
        monitoringInterval: this.config.monitoringConfig?.monitoringInterval || 5000,
      },
      optimization: {
        enableWAL: true,
        enableForeignKeys: true,
        cacheSize: 1000,
        mmapSize: 268435456, // 256MB
      }
    };

    await initializeDatabaseSystem(dbConfig);
    logger.info('✅ Connection pooling initialized');
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    logger.info('📊 Initializing database monitoring...');

    const monitor = initializeDatabaseMonitor(
      this.config.monitoringConfig?.slowQueryThreshold || 100
    );

    if (this.config.enableMonitoring) {
      monitor.startMonitoring(this.config.monitoringConfig?.monitoringInterval || 5000);
    }

    // Set up event handlers for Central MCP integration
    monitor.on('slowQuery', (metrics) => {
      logger.warn(`⚠️ Slow query detected: ${metrics.duration}ms - ${metrics.query}`);
      this.notifyCentralMCP('slow_query', metrics);
    });

    monitor.on('failedQuery', (metrics) => {
      logger.error(`❌ Query failed: ${metrics.error} - ${metrics.query}`);
      this.notifyCentralMCP('query_failed', metrics);
    });

    monitor.on('metrics', (metrics) => {
      if (metrics.averageQueryTime > 200) {
        this.notifyCentralMCP('performance_degradation', metrics);
      }
    });

    logger.info('✅ Database monitoring initialized');
  }

  /**
   * Initialize integrity validation
   */
  private initializeIntegrityValidation(): void {
    logger.info('🔒 Initializing integrity validation...');

    const validator = initializeDatabaseIntegrityValidator();

    validator.startMonitoring(60000); // Every minute

    validator.on('criticalViolation', (violations) => {
      logger.error('🚨 Critical integrity violations detected:', violations);
      this.notifyCentralMCP('critical_integrity_violation', violations);
    });

    validator.on('validationComplete', (report) => {
      if (report.healthScore < 80) {
        this.notifyCentralMCP('integrity_health_warning', report);
      }
    });

    logger.info('✅ Integrity validation initialized');
  }

  /**
   * Initialize JSON TaskStore
   */
  private initializeJsonTaskStore(): void {
    logger.info('📄 Initializing JSON TaskStore...');

    this.jsonTaskStore = new JsonTaskStore();

    logger.info('✅ JSON TaskStore initialized');
  }

  /**
   * Run comprehensive health checks
   */
  private async runHealthChecks(): Promise<void> {
    logger.info('🏥 Running database health checks...');

    // Check database factory health
    const dbStatus = await this.databaseInitializer.getStatus();
    if (!dbStatus.healthy) {
      throw new Error(`Database factory unhealthy: ${JSON.stringify(dbStatus)}`);
    }

    // Check integrity validator health
    const integrityReport = this.integrityValidator.getLastReport();
    if (integrityReport && integrityReport.healthScore < 70) {
      logger.warn(`⚠️ Database integrity health is low: ${integrityReport.healthScore}%`);
    }

    // Check monitor health
    const monitorMetrics = this.databaseMonitor.getMetrics();
    if (monitorMetrics.averageQueryTime > 500) {
      logger.warn(`⚠️ High average query time: ${monitorMetrics.averageQueryTime.toFixed(0)}ms`);
    }

    logger.info('✅ Database health checks passed');
  }

  /**
   * Set up integration hooks for Central MCP
   */
  private setupCentralMCPIntegration(): void {
    logger.info('🔌 Setting up Central MCP integration...');

    // Create global database interface for Central MCP loops
    (global as any).centralMCPDatabase = {
      // Task operations
      getTask: (taskId: string) => this.jsonTaskStore?.getTask(taskId),
      getAllTasks: () => this.jsonTaskStore?.getAllTasks(),
      getTasksByStatus: (status: string) => this.jsonTaskStore?.getTasksByStatus(status as any),
      getTasksByAgent: (agent: string) => this.jsonTaskStore?.getTasksByAgent(agent as any),
      upsertTask: (task: any) => this.jsonTaskStore?.upsertTask(task),

      // Advanced operations
      getAvailableTasks: (agent: string, limit?: number) => this.jsonTaskStore?.getAvailableTasks(agent as any, limit),
      getBlockedTasks: () => this.jsonTaskStore?.getBlockedTasks(),
      getTasksDependingOn: (taskId: string) => this.jsonTaskStore?.getTasksDependingOn(taskId),

      // Statistics
      getTaskStats: () => this.jsonTaskStore?.getTaskStats(),

      // Dependency management
      addDependency: (taskId: string, dependencyId: string) => this.jsonTaskStore?.addDependency(taskId, dependencyId),
      removeDependency: (taskId: string, dependencyId: string) => this.jsonTaskStore?.removeDependency(taskId, dependencyId),
      addDeliverable: (taskId: string, deliverable: any) => this.jsonTaskStore?.addDeliverable(taskId, deliverable),

      // Performance monitoring
      getPerformanceMetrics: () => this.databaseMonitor.getMetrics(),
      getPerformanceRecommendations: () => this.databaseMonitor.getPerformanceRecommendations(),
      getJsonPerformanceStats: () => this.jsonTaskStore?.getJsonPerformanceStats(),

      // Integrity monitoring
      getIntegrityReport: () => this.integrityValidator.getLastReport(),
      runIntegrityCheck: () => this.integrityValidator.runValidation(),

      // System health
      getSystemHealth: () => this.getSystemHealth(),
    };

    logger.info('✅ Central MCP integration hooks set up');
  }

  /**
   * Notify Central MCP of database events
   */
  private notifyCentralMCP(eventType: string, data: any): void {
    // Emit events for Central MCP to consume
    if ((global as any).centralMCPEventBus) {
      (global as any).centralMCPEventBus.emit('database_event', {
        type: eventType,
        timestamp: Date.now(),
        data
      });
    }

    // Log for AutoProactiveEngine monitoring
    logger.info(`📡 Database event for Central MCP: ${eventType}`, {
      type: eventType,
      timestamp: Date.now(),
      summary: typeof data === 'object' ? JSON.stringify(data).substring(0, 100) + '...' : String(data)
    });
  }

  /**
   * Get comprehensive system health
   */
  async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    database: any;
    monitoring: any;
    integrity: any;
    performance: any;
    recommendations: string[];
  }> {
    const dbStatus = await this.databaseInitializer.getStatus();
    const monitorMetrics = this.databaseMonitor.getMetrics();
    const integrityReport = this.integrityValidator.getLastReport();
    const jsonStats = this.jsonTaskStore?.getJsonPerformanceStats();

    // Calculate overall health
    let healthScore = 100;
    const recommendations: string[] = [];

    if (!dbStatus.healthy) {
      healthScore -= 40;
      recommendations.push('🚨 Database factory is unhealthy');
    }

    if (monitorMetrics.averageQueryTime > 200) {
      healthScore -= 20;
      recommendations.push('⚠️ High average query time detected');
    }

    if (integrityReport && integrityReport.healthScore < 80) {
      healthScore -= 20;
      recommendations.push('⚠️ Database integrity issues detected');
    }

    if (monitorMetrics.failedQueries > 0) {
      healthScore -= 15;
      recommendations.push('⚠️ Failed queries detected');
    }

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (healthScore < 50) overall = 'unhealthy';
    else if (healthScore < 80) overall = 'degraded';

    return {
      overall,
      database: dbStatus,
      monitoring: monitorMetrics,
      integrity: integrityReport,
      performance: jsonStats,
      recommendations
    };
  }

  /**
   * Get JSON TaskStore instance
   */
  getJsonTaskStore(): JsonTaskStore | null {
    return this.jsonTaskStore;
  }

  /**
   * Get current configuration
   */
  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('🔧 Database integration configuration updated');
  }

  /**
   * Get integration status
   */
  getStatus(): {
    initialized: boolean;
    components: {
      connectionPooling: boolean;
      monitoring: boolean;
      integrityValidation: boolean;
      jsonTaskStore: boolean;
    };
    health: any;
  } {
    return {
      initialized: this.isInitialized,
      components: {
        connectionPooling: this.config.enableConnectionPooling,
        monitoring: this.config.enableMonitoring,
        integrityValidation: this.config.enableIntegrityValidation,
        jsonTaskStore: this.config.enableJsonColumns,
      },
      health: this.databaseInitializer.getStatus()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('🔌 Shutting down Database Integration Layer...');

    if (this.config.enableMonitoring) {
      this.databaseMonitor.stopMonitoring();
    }

    if (this.config.enableIntegrityValidation) {
      this.integrityValidator.stopMonitoring();
    }

    if (this.config.enableConnectionPooling) {
      await this.databaseInitializer.close();
    }

    // Remove global interface
    delete (global as any).centralMCPDatabase;

    this.isInitialized = false;
    logger.info('✅ Database Integration Layer shut down');
  }
}

/**
 * Initialize database integration with default configuration
 */
export async function initializeDatabaseIntegration(config?: Partial<DatabaseConfig>): Promise<DatabaseIntegrationLayer> {
  const defaultConfig: DatabaseConfig = {
    databasePath: './data/registry.db',
    enableConnectionPooling: true,
    enableMonitoring: true,
    enableIntegrityValidation: true,
    enableJsonColumns: true,
    poolConfig: {
      maxConnections: 10,
      minConnections: 2,
      idleTimeoutMillis: 30000,
    },
    monitoringConfig: {
      slowQueryThreshold: 100,
      monitoringInterval: 5000,
    },
    ...config,
  };

  const integration = DatabaseIntegrationLayer.getInstance(defaultConfig);
  await integration.initialize();
  return integration;
}

/**
 * Get the global database integration instance
 */
export function getDatabaseIntegration(): DatabaseIntegrationLayer {
  const integration = DatabaseIntegrationLayer.getInstance();
  if (!integration.getStatus().initialized) {
    throw new Error('Database integration not initialized');
  }
  return integration;
}

export default DatabaseIntegrationLayer;