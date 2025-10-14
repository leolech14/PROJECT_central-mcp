/**
 * PHOTON SERVER - Cloud Operations Center Bootstrap
 * ==================================================
 *
 * Main server bootstrap that starts the complete PHOTON system
 * Combines PHOTON CORE, API server, and supporting services
 */

import { PhotonCore } from './PhotonCore.js';
import { PhotonAPI, PhotonAPIConfig } from './PhotonAPI.js';
import { PhotonIntegrations } from './PhotonIntegrations.js';
import { logger } from '../utils/logger.js';
import { config } from 'dotenv';
import Database from 'better-sqlite3';

// Load environment variables
config();

/**
 * PHOTON Server Configuration
 */
interface PhotonServerConfig {
  core: {
    databasePath: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  api: PhotonAPIConfig;
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
  security: {
    adminKey: string;
    apiKeys: string[];
  };
}

/**
 * Complete PHOTON Server with all systems
 */
export class PhotonServer {
  private photonCore!: PhotonCore;
  private photonAPI!: PhotonAPI;
  private photonIntegrations?: PhotonIntegrations;
  private db?: Database.Database;
  private config: PhotonServerConfig;
  private isRunning = false;

  constructor(config: PhotonServerConfig) {
    this.config = config;
    this.initializeLogger();

    logger.info('🚀 Initializing PHOTON SERVER - Cloud Agentic Operations Center');
    logger.info('🌟 Mission: Revolutionize global AI operations coordination');
    logger.info(`📡 Environment: ${this.config.api.environment}`);
  }

  /**
   * Initialize logger with appropriate level
   */
  private initializeLogger(): void {
    // Set log level based on configuration
    const logLevel = this.config.core.logLevel;
    logger.info(`📊 Log level set to: ${logLevel}`);
  }

  /**
   * Start all PHOTON systems
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ PHOTON SERVER is already running');
      return;
    }

    try {
      logger.info('🔧 Starting PHOTON CORE systems...');

      // 1. Initialize PHOTON CORE
      this.photonCore = new PhotonCore(this.config.core.databasePath);
      logger.info('✅ PHOTON CORE initialized');

      // 2. Initialize PHOTON API
      this.photonAPI = new PhotonAPI(this.config.api, this.photonCore);
      logger.info('✅ PHOTON API initialized');

      // 3. Start API server
      await this.photonAPI.start();
      logger.info(`✅ PHOTON API server started on port ${this.config.api.port}`);

      // 4. Initialize PHOTON Integrations (VM Tools + A2A Server)
      this.db = new Database(this.config.core.databasePath);
      this.photonIntegrations = new PhotonIntegrations(
        this.photonAPI,
        this.photonCore,
        this.db,
        {
          vmTools: { enabled: true },
          a2a: {
            enabled: true,
            path: '/a2a',
            enableAuth: true
          }
        }
      );
      await this.photonIntegrations.initialize();
      logger.info('✅ PHOTON Integrations initialized (VM Tools + A2A Protocol)');

      // 5. Register default agents (for development)
      if (this.config.api.environment === 'development') {
        await this.registerDefaultAgents();
      }

      // 5. Initialize AI Intelligence Engine
      logger.info('🧠 Initializing AI Intelligence Engine...');
      const { IntelligenceEngine } = await import('../intelligence/IntelligenceEngine.js');
      const intelligenceEngine = IntelligenceEngine.getInstance({
        enableZAI: true,
        enableAnthropic: false, // Not yet configured
        enableGemini: false, // Not yet configured
        realtimeModel: 'zai',
        optimizationModel: 'zai',
        predictionModel: 'zai',
        patternModel: 'zai'
      });
      await intelligenceEngine.start();
      logger.info('✅ AI Intelligence Engine started with Z.AI GLM-4-Flash');

      // 6. Start monitoring systems
      if (this.config.monitoring.enabled) {
        this.startMonitoring();
      }

      // 7. Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      this.isRunning = true;

      logger.info('🎉 PHOTON SERVER fully operational!');
      logger.info('🌍 Cloud Agentic Operations Center is ready to coordinate global AI operations');
      logger.info(`📡 API available at: http${this.config.api.ssl.enabled ? 's' : ''}://localhost:${this.config.api.port}`);
      logger.info(`📊 Health check: http${this.config.api.ssl.enabled ? 's' : ''}://localhost:${this.config.api.port}/health`);
      logger.info(`📈 Dashboard: http${this.config.api.ssl.enabled ? 's' : ''}://localhost:${this.config.api.port}/api/v1/metrics/dashboard`);

    } catch (error) {
      logger.error('❌ Failed to start PHOTON SERVER:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Register default agents for development
   */
  private async registerDefaultAgents(): Promise<void> {
    logger.info('🤖 Registering default development agents...');

    const defaultAgents = [
      {
        id: 'agent-a-dev',
        name: 'Agent A (Development)',
        model: 'GLM-4.6',
        capabilities: ['ui-development', 'rapid-prototyping', 'design-systems'],
        location: 'local' as const
      },
      {
        id: 'agent-b-dev',
        name: 'Agent B (Development)',
        model: 'Sonnet-4.5',
        capabilities: ['design-systems', 'architecture', 'accessibility'],
        location: 'cloud' as const
      },
      {
        id: 'agent-c-dev',
        name: 'Agent C (Development)',
        model: 'GLM-4.6',
        capabilities: ['backend-development', 'api-design', 'database-operations'],
        location: 'cloud' as const
      },
      {
        id: 'agent-d-dev',
        name: 'Agent D (Development)',
        model: 'Sonnet-4.5',
        capabilities: ['integration', 'system-testing', 'deployment'],
        location: 'edge' as const
      }
    ];

    for (const agent of defaultAgents) {
      await this.photonCore.registerAgent({
        ...agent,
        status: 'active',
        lastSeen: new Date(),
        currentOperations: [],
        metrics: {
          operationsCompleted: 0,
          averageResponseTime: 0,
          successRate: 100,
          cpuUsage: 0,
          memoryUsage: 0,
          networkLatency: 0
        }
      });
    }

    logger.info(`✅ Registered ${defaultAgents.length} default development agents`);
  }

  /**
   * Start monitoring and metrics collection
   */
  private startMonitoring(): void {
    logger.info('📊 Starting monitoring systems...');

    // Metrics collection interval
    setInterval(() => {
      const state = this.photonCore.getGlobalState();

      // Log key metrics
      logger.info(`📈 Metrics Update:`, {
        totalOps: state.totalOperations,
        activeOps: state.activeOperations,
        completedOps: state.completedOperations,
        systemHealth: state.systemHealth,
        agents: state.agentCount,
        platforms: state.platformCount
      });

      // Check for alerts
      this.checkSystemAlerts(state);

    }, this.config.monitoring.metricsInterval);

    // Health check interval
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.monitoring.healthCheckInterval);

    logger.info(`✅ Monitoring started (metrics: ${this.config.monitoring.metricsInterval}ms, health: ${this.config.monitoring.healthCheckInterval}ms)`);
  }

  /**
   * Check for system alerts
   */
  private checkSystemAlerts(state: any): void {
    if (state.systemHealth === 'critical') {
      logger.error('🚨 CRITICAL: System health is critical!');
    }

    if (state.activeOperations > 100) {
      logger.warn('⚠️ WARNING: High number of active operations:', state.activeOperations);
    }

    if (state.failedOperations / Math.max(state.totalOperations, 1) > 0.2) {
      logger.error('🚨 CRITICAL: High failure rate detected!');
    }
  }

  /**
   * Perform comprehensive health check
   */
  private performHealthCheck(): void {
    const state = this.photonCore.getGlobalState();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    logger.debug('🔍 Health Check:', {
      systemHealth: state.systemHealth,
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      activeOperations: state.activeOperations
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`📡 Received ${signal}, starting graceful shutdown...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      this.shutdown().then(() => process.exit(1));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  /**
   * Get current server status
   */
  getStatus() {
    if (!this.isRunning) {
      return { status: 'stopped' };
    }

    return {
      status: 'running',
      uptime: process.uptime(),
      core: this.photonCore ? this.photonCore.getGlobalState() : null,
      config: {
        environment: this.config.api.environment,
        port: this.config.api.port,
        authentication: this.config.api.authentication.enabled,
        ssl: this.config.api.ssl.enabled
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('🛑 Shutting down PHOTON SERVER...');

    try {
      // Stop integrations first
      if (this.photonIntegrations) {
        await this.photonIntegrations.shutdown();
        logger.info('✅ PHOTON Integrations stopped');
      }

      // Stop API server
      if (this.photonAPI) {
        await this.photonAPI.stop();
        logger.info('✅ PHOTON API stopped');
      }

      // Close database
      if (this.db) {
        this.db.close();
        logger.info('✅ Database closed');
      }

      // Shutdown CORE last
      if (this.photonCore) {
        await this.photonCore.shutdown();
        logger.info('✅ PHOTON CORE stopped');
      }

      this.isRunning = false;
      logger.info('✅ PHOTON SERVER shutdown complete');

    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
    }
  }
}

/**
 * Create default configuration
 */
function createDefaultConfig(): PhotonServerConfig {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  return {
    core: {
      databasePath: process.env.PHOTON_DB_PATH || './data/photon.db',
      logLevel: (process.env.PHOTON_LOG_LEVEL as any) || (isProduction ? 'info' : 'debug')
    },
    api: {
      port: parseInt(process.env.PHOTON_PORT || '8080'),
      environment: env as any,
      corsOrigins: process.env.PHOTON_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      rateLimiting: {
        windowMs: parseInt(process.env.PHOTON_RATE_WINDOW_MS || '900000'), // 15 minutes
        max: parseInt(process.env.PHOTON_RATE_MAX || '1000')
      },
      authentication: {
        enabled: process.env.PHOTON_AUTH_ENABLED === 'true' || isProduction,
        apiKeyHeader: process.env.PHOTON_API_KEY_HEADER || 'X-API-Key',
        authorizedKeys: process.env.PHOTON_API_KEYS?.split(',') || ['photon-dev-key']
      },
      ssl: {
        enabled: process.env.PHOTON_SSL_ENABLED === 'true' && isProduction,
        certPath: process.env.PHOTON_SSL_CERT_PATH,
        keyPath: process.env.PHOTON_SSL_KEY_PATH
      }
    },
    monitoring: {
      enabled: process.env.PHOTON_MONITORING_ENABLED !== 'false',
      metricsInterval: parseInt(process.env.PHOTON_METRICS_INTERVAL || '30000'), // 30 seconds
      healthCheckInterval: parseInt(process.env.PHOTON_HEALTH_CHECK_INTERVAL || '60000') // 1 minute
    },
    security: {
      adminKey: process.env.PHOTON_ADMIN_KEY || 'photon-admin-key',
      apiKeys: process.env.PHOTON_API_KEYS?.split(',') || ['photon-dev-key']
    }
  };
}

/**
 * Bootstrap PHOTON SERVER
 */
async function bootstrap(): Promise<void> {
  try {
    logger.info('🌟 PHOTON SERVER - Cloud Agentic Operations Center');
    logger.info('==================================================');
    logger.info('🚀 Starting revolutionary AI coordination system...');
    logger.info('');

    // Create configuration
    const config = createDefaultConfig();

    // Create and start server
    const server = new PhotonServer(config);
    await server.start();

    // Set global reference for external access
    (global as any).photonServer = server;

    logger.info('');
    logger.info('🎯 PHOTON SERVER is ready for global AI operations!');
    logger.info('📚 Documentation: https://github.com/leolech14/central-mcp');
    logger.info('🔗 API Health: http://localhost:' + config.api.port + '/health');
    logger.info('📊 Dashboard: http://localhost:' + config.api.port + '/api/v1/metrics/dashboard');
    logger.info('');
    logger.info('💡 To start coordinating operations, send POST to:');
    logger.info('   http://localhost:' + config.api.port + '/api/v1/operations');
    logger.info('');
    logger.info('🌍 Welcome to the future of AI operations coordination!');

  } catch (error) {
    logger.error('💥 Failed to bootstrap PHOTON SERVER:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrap().catch((error) => {
    logger.error('💥 Bootstrap failed:', error);
    process.exit(1);
  });
}

export default PhotonServer;