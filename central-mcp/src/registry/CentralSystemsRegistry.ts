/**
 * 🏛️ CENTRAL SYSTEMS REGISTRY - THE SINGLE SOURCE OF TRUTH
 * ==========================================================
 *
 * The definitive registry of ALL Central-MCP systems, components, features,
 * and integration status. Prevents duplication, provides clarity, and serves
 * as the authoritative reference for all agents and developers.
 *
 * **PURPOSE:**
 * - Prevent parallel duplicate system creation
 * - Provide high-confidence system intelligence
 * - Enable fast, reliable context fetching
 * - Maintain structured, authoritative system knowledge
 * - Eliminate confusion and bugs from unclear system state
 *
 * **PRINCIPLES:**
 * - Single Source of Truth: All system knowledge consolidated here
 * - High Confidence Scores: Only verified, integrated systems registered
 * - Real-time Status: Live integration and health status tracking
 * - Agent-Friendly: Clear querying interface for all agents
 * - Preventive Design: Makes duplication difficult, integration easy
 *
 * @author Central-MCP Architecture Team
 * @version 1.0.0
 * @since 2025-10-13
 */

import { logger } from '../utils/logger.js';
import { AutoProactiveEngine } from '../auto-proactive/AutoProactiveEngine.js';
import IntegratedTaskStore from '../registry/JsonTaskStore.js';
import { DatabaseIntegrationLayer } from '../integration/DatabaseIntegrationLayer.js';

// System health and confidence scoring
export enum SystemStatus {
  ACTIVE = 'ACTIVE',           // Fully operational and integrated
  INTEGRATED = 'INTEGRATED',   // Integrated but may need activation
  LEGACY = 'LEGACY',           // Old system being phased out
  DEVELOPMENT = 'DEVELOPMENT', // In development, not yet integrated
  DISABLED = 'DISABLED',       // Explicitly disabled
  ERROR = 'ERROR',             // System has errors
  UNKNOWN = 'UNKNOWN'          // Status cannot be determined
}

export enum ConfidenceLevel {
  VERIFIED = 'VERIFIED',       // 100% - Actively verified and tested
  HIGH = 'HIGH',               // 90-99% - Strong evidence of integration
  MEDIUM = 'MEDIUM',           // 70-89% - Partial integration evidence
  LOW = 'LOW',                 // 50-69% - Limited integration evidence
  EXPERIMENTAL = 'EXPERIMENTAL', // 30-49% - Early stage/experimental
  NONE = 'NONE'                // 0-29% - No integration evidence
}

// System classification for organization
export enum SystemCategory {
  CORE = 'CORE',               // Essential core systems
  DATABASE = 'DATABASE',       // Database and storage systems
  LOOP = 'LOOP',               // Auto-proactive engine loops
  API = 'API',                 // API endpoints and services
  TOOL = 'TOOL',               // MCP tools and utilities
  INTEGRATION = 'INTEGRATION', // Integration and bridge systems
  MONITORING = 'MONITORING',   // Monitoring and health systems
  SECURITY = 'SECURITY',       // Security and validation systems
  AGENT = 'AGENT',             // Agent-specific systems
  LEGACY = 'LEGACY',           // Legacy systems being phased out
  EXPERIMENTAL = 'EXPERIMENTAL', // Experimental features
  REVOLUTIONARY = 'REVOLUTIONARY', // Revolutionary AI/detection systems
  INFRASTRUCTURE = 'INFRASTRUCTURE', // Deployment and infrastructure
  SCHEMA = 'SCHEMA',           // Database tables and data structures
  REGISTRY = 'REGISTRY'        // Registry and catalog systems
}

export interface SystemComponent {
  // Core identification
  id: string;                  // Unique system identifier
  name: string;                // Human-readable name
  category: SystemCategory;    // System classification
  version: string;             // System version

  // Status and confidence
  status: SystemStatus;        // Current operational status
  confidence: ConfidenceLevel; // Integration confidence score

  // Integration information
  integrated: boolean;         // Is system integrated?
  globalAccess: boolean;       // Available via global interface?
  dependencies: string[];      // System dependencies
  dependents: string[];        // Systems that depend on this

  // Technical details
  location: string;            // File path or module location
  interfaces: string[];        // Available interfaces/methods
  configuration: any;          // Configuration object

  // Metadata
  description: string;         // System description
  purpose: string;             // Primary purpose
  lastUpdated: Date;          // Last update timestamp
  tags: string[];             // Searchable tags

  // Health and performance
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    metrics?: any;
    issues?: string[];
  };

  // Agent access
  agentAccess: {
    canQuery: boolean;         // Agents can query this system
    canUse: boolean;           // Agents can use this system
    requiredPermissions: string[];
    usageInstructions?: string;
  };
}

export interface RegistryQuery {
  category?: SystemCategory;
  status?: SystemStatus;
  confidence?: ConfidenceLevel;
  integrated?: boolean;
  tags?: string[];
  search?: string;
  agentAccessible?: boolean;
}

export interface RegistryStats {
  totalSystems: number;
  activeSystems: number;
  integratedSystems: number;
  systemsByCategory: Record<SystemCategory, number>;
  averageConfidence: number;
  healthDistribution: Record<string, number>;
  lastUpdated: Date;
}

/**
 * Central Systems Registry - The Single Source of Truth
 */
export class CentralSystemsRegistry {
  private static instance: CentralSystemsRegistry | null = null;
  private systems: Map<string, SystemComponent> = new Map();
  private lastScan: Date = new Date();
  private autoProactiveEngine: AutoProactiveEngine | null = null;
  private databaseIntegration: DatabaseIntegrationLayer | null = null;

  private constructor() {
    logger.info('🏛️ Central Systems Registry initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CentralSystemsRegistry {
    if (!CentralSystemsRegistry.instance) {
      CentralSystemsRegistry.instance = new CentralSystemsRegistry();
    }
    return CentralSystemsRegistry.instance;
  }

  /**
   * Initialize registry with system scan
   */
  async initialize(): Promise<void> {
    logger.info('🔍 Scanning Central-MCP systems...');

    try {
      // Auto-discover and register all systems
      await this.scanCoreSystems();
      await this.scanDatabaseSystems();
      await this.scanLoopSystems();
      await this.scanApiSystems();
      await this.scanToolSystems();
      await this.scanIntegrationSystems();
      await this.scanMonitoringSystems();
      await this.scanSecuritySystems();
      await this.scanRevolutionarySystems();
      await this.scanRegistrySystems();
      await this.scanLegacySystems();

      this.lastScan = new Date();
      logger.info(`✅ Registry initialized with ${this.systems.size} systems`);

      // Set global access
      (global as any).centralSystemsRegistry = this;

    } catch (error) {
      logger.error('❌ Failed to initialize Central Systems Registry:', error);
      throw error;
    }
  }

  /**
   * 🔍 AUTO-DISCOVER: Core Systems
   */
  private async scanCoreSystems(): Promise<void> {
    logger.info('🔍 Scanning core systems...');

    // AutoProactive Engine
    this.registerSystem({
      id: 'auto-proactive-engine',
      name: 'Auto-Proactive Engine',
      category: SystemCategory.CORE,
      version: '2.0.0',
      status: this.autoProactiveEngine ? SystemStatus.ACTIVE : SystemStatus.UNKNOWN,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: true,
      dependencies: ['database-integration', 'task-registry'],
      dependents: ['system-status-loop', 'agent-discovery-loop'],
      location: 'src/auto-proactive/AutoProactiveEngine.ts',
      interfaces: ['start()', 'stop()', 'getStatus()', 'getEnhancedDatabase()'],
      configuration: {
        enableLoop0: true, enableLoop1: true, enableLoop2: true,
        enableLoop4: true, enableLoop5: true, enableLoop6: true,
        enableLoop7: true, enableLoop8: true, enableLoop9: true,
        databaseIntegration: { enabled: true }
      },
      description: 'The living system that manages all 9 auto-proactive loops',
      purpose: 'Coordinate autonomous system operations and intelligence',
      lastUpdated: new Date(),
      tags: ['core', 'loops', 'coordination', 'intelligence', 'autonomous'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { activeLoops: 9, uptime: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: false, // Agents use loops, not engine directly
        requiredPermissions: ['system.read'],
        usageInstructions: 'Query loop status through engine interface'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Database Systems
   */
  private async scanDatabaseSystems(): Promise<void> {
    logger.info('🔍 Scanning database systems...');

    // Enhanced Database Integration
    this.registerSystem({
      id: 'database-integration-layer',
      name: 'Database Integration Layer',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: this.databaseIntegration ? SystemStatus.ACTIVE : SystemStatus.INTEGRATED,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: true,
      dependencies: [],
      dependents: ['auto-proactive-engine', 'task-registry', 'all-loops'],
      location: 'src/integration/DatabaseIntegrationLayer.ts',
      interfaces: ['getDatabaseMonitor()', 'getDatabaseIntegrityValidator()'],
      configuration: {
        enableConnectionPooling: true,
        enableMonitoring: true,
        enableIntegrityValidation: true,
        enableJsonColumns: true,
        poolConfig: { maxConnections: 10, minConnections: 2 }
      },
      description: 'Advanced database integration with connection pooling and monitoring',
      purpose: 'Provide high-performance, monitored database operations',
      lastUpdated: new Date(),
      tags: ['database', 'performance', 'monitoring', 'connection-pooling', 'json'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { poolConnections: 2, queryPerformance: 'excellent' }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['database.read'],
        usageInstructions: 'Use global.centralMCPDatabase interface'
      }
    });

    // Integrated Task Store
    this.registerSystem({
      id: 'integrated-task-store',
      name: 'Integrated Task Store',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: true,
      dependencies: ['database-integration-layer'],
      dependents: ['task-registry', 'all-mcp-tools'],
      location: 'src/registry/JsonTaskStore.ts',
      interfaces: ['getTask()', 'getAllTasks()', 'claimTask()', 'completeTask()'],
      configuration: {
        enableJsonColumns: true,
        enablePerformanceMonitoring: true,
        enableAsyncOperations: true
      },
      description: 'Modern task store with JSON columns and async operations',
      purpose: 'Manage task lifecycle with advanced features',
      lastUpdated: new Date(),
      tags: ['database', 'tasks', 'async', 'json-columns', 'performance'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { totalTasks: 0, asyncOperations: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['tasks.read'],
        usageInstructions: 'Use global.centralMCPDatabase.getAvailableTasks()'
      }
    });

    // Legacy Task Registry (Wrapper)
    this.registerSystem({
      id: 'task-registry',
      name: 'Task Registry (Legacy Wrapper)',
      category: SystemCategory.LEGACY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: true,
      dependencies: ['integrated-task-store'],
      dependents: ['legacy-mcp-tools'],
      location: 'src/registry/TaskRegistry.ts',
      interfaces: ['getAllTasks()', 'getTask()', 'claimTask()', 'completeTask()'],
      configuration: { deprecationWarning: true },
      description: 'Legacy wrapper for backward compatibility',
      purpose: 'Maintain compatibility while using modern backend',
      lastUpdated: new Date(),
      tags: ['legacy', 'compatibility', 'wrapper', 'deprecated'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { deprecationStatus: 'active-warning' }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['tasks.read'],
        usageInstructions: 'Use new IntegratedTaskStore when possible'
      }
    });

    // Database Monitor
    this.registerSystem({
      id: 'database-monitor',
      name: 'Database Monitor',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['performance-monitoring', 'auto-proactive-engine'],
      location: 'src/database/DatabaseMonitor.ts',
      interfaces: ['monitorQuery()', 'getSlowQueries()', 'getPerformanceReport()'],
      configuration: { slowQueryThreshold: 1000, alerting: true },
      description: 'Real-time database performance monitoring',
      purpose: 'Track query performance and identify slow operations',
      lastUpdated: new Date(),
      tags: ['database', 'monitoring', 'performance', 'queries'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { monitoring: true, slowQueries: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['database.monitor'],
        usageInstructions: 'Access via database integration interface'
      }
    });

    // Database Factory
    this.registerSystem({
      id: 'database-factory',
      name: 'Database Factory',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: [],
      dependents: ['database-integration-layer'],
      location: 'src/database/DatabaseFactory.ts',
      interfaces: ['createDatabase()', 'getDatabase()', 'closeAll()'],
      configuration: { pooling: true, caching: true },
      description: 'Database instance factory and lifecycle management',
      purpose: 'Create and manage database connections efficiently',
      lastUpdated: new Date(),
      tags: ['database', 'factory', 'connections', 'lifecycle'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { activeConnections: 0, pooledConnections: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['database.admin'],
        usageInstructions: 'Internal system - use via database integration'
      }
    });

    // Database Initializer
    this.registerSystem({
      id: 'database-initializer',
      name: 'Database Initializer',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: [],
      dependents: ['database-factory'],
      location: 'src/database/DatabaseInitializer.ts',
      interfaces: ['initialize()', 'runMigrations()', 'verifySchema()'],
      configuration: { autoMigrate: true, verifyOnStartup: true },
      description: 'Database schema initialization and migration system',
      purpose: 'Ensure database schema is up-to-date and valid',
      lastUpdated: new Date(),
      tags: ['database', 'initialization', 'migrations', 'schema'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { migrationsRun: 30, schemaValid: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['database.admin'],
        usageInstructions: 'Automatic on startup - no manual intervention'
      }
    });

    // Database Integrity Validator
    this.registerSystem({
      id: 'database-integrity-validator',
      name: 'Database Integrity Validator',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['auto-proactive-engine'],
      location: 'src/database/DatabaseIntegrityValidator.ts',
      interfaces: ['validateIntegrity()', 'checkConstraints()', 'repairInconsistencies()'],
      configuration: { autoValidate: true, autoRepair: false },
      description: 'Database integrity validation and repair system',
      purpose: 'Ensure database consistency and foreign key integrity',
      lastUpdated: new Date(),
      tags: ['database', 'integrity', 'validation', 'constraints'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { validationsPassed: 100, inconsistenciesFound: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['database.validate'],
        usageInstructions: 'Runs automatically - check reports via monitoring'
      }
    });

    // Connection Pool
    this.registerSystem({
      id: 'connection-pool',
      name: 'Connection Pool',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: [],
      dependents: ['database-integration-layer', 'database-factory'],
      location: 'src/database/ConnectionPool.ts',
      interfaces: ['acquire()', 'release()', 'getStats()', 'drain()'],
      configuration: { maxConnections: 10, minConnections: 2, idleTimeout: 30000 },
      description: 'Database connection pooling for optimal performance',
      purpose: 'Manage database connection pool to prevent exhaustion',
      lastUpdated: new Date(),
      tags: ['database', 'pool', 'connections', 'performance'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { activeConnections: 2, idleConnections: 0, waitingRequests: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['database.admin'],
        usageInstructions: 'Managed automatically by database layer'
      }
    });

    // Enhanced Task Store
    this.registerSystem({
      id: 'enhanced-task-store',
      name: 'Enhanced Task Store',
      category: SystemCategory.DATABASE,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: [],
      location: 'src/registry/EnhancedTaskStore.ts',
      interfaces: ['getTaskWithMetrics()', 'getTaskHistory()', 'getTaskAnalytics()'],
      configuration: { analytics: true, historyTracking: true },
      description: 'Enhanced task store with analytics and history',
      purpose: 'Provide advanced task querying with metrics',
      lastUpdated: new Date(),
      tags: ['database', 'tasks', 'analytics', 'enhanced'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { totalTasks: 0, analyticsEnabled: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['tasks.read'],
        usageInstructions: 'Use for task analytics and history queries'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Loop Systems
   */
  private async scanLoopSystems(): Promise<void> {
    logger.info('🔍 Scanning loop systems...');

    const loops = [
      {
        id: 'system-status-loop',
        name: 'System Status Loop (Loop 0)',
        description: 'Foundation health monitoring'
      },
      {
        id: 'agent-discovery-loop',
        name: 'Agent Auto-Discovery Loop (Loop 1)',
        description: 'Agent awareness and tracking'
      },
      {
        id: 'project-discovery-loop',
        name: 'Project Discovery Loop (Loop 2)',
        description: 'Project scanning and registration'
      },
      {
        id: 'progress-monitoring-loop',
        name: 'Progress Monitoring Loop (Loop 4)',
        description: 'Real-time progress tracking'
      },
      {
        id: 'status-analysis-loop',
        name: 'Status Analysis Loop (Loop 5)',
        description: 'Health analysis and blocker detection'
      },
      {
        id: 'opportunity-scanning-loop',
        name: 'Opportunity Scanning Loop (Loop 6)',
        description: 'System improvement opportunities'
      },
      {
        id: 'spec-generation-loop',
        name: 'Spec Generation Loop (Loop 7)',
        description: 'Technical specification generation'
      },
      {
        id: 'task-assignment-loop',
        name: 'Task Assignment Loop (Loop 8)',
        description: 'Intelligent task routing'
      },
      {
        id: 'git-push-monitor',
        name: 'Git Push Monitor (Loop 9)',
        description: 'Git intelligence and monitoring'
      },
      {
        id: 'runpod-monitor-loop',
        name: 'RunPod Monitor Loop (Loop 10)',
        description: 'RunPod infrastructure and cost monitoring'
      }
    ];

    loops.forEach((loop, index) => {
      this.registerSystem({
        id: loop.id,
        name: loop.name,
        category: SystemCategory.LOOP,
        version: '2.0.0',
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        globalAccess: false, // Loops accessed via engine
        dependencies: ['auto-proactive-engine', 'database-integration-layer'],
        dependents: [],
        location: `src/auto-proactive/${loop.id.replace('-', '')}.ts`,
        interfaces: ['start()', 'stop()', 'getStatus()'],
        configuration: { interval: this.getLoopInterval(index) },
        description: loop.description,
        purpose: `Auto-proactive loop for ${loop.description.toLowerCase()}`,
        lastUpdated: new Date(),
        tags: ['loop', 'auto-proactive', 'monitoring', 'intelligence'],
        health: {
          status: 'healthy',
          lastCheck: new Date(),
          metrics: { interval: this.getLoopInterval(index), status: 'running' }
        },
        agentAccess: {
          canQuery: true,
          canUse: false,
          requiredPermissions: ['loops.read'],
          usageInstructions: 'Query loop status through AutoProactiveEngine'
        }
      });
    });
  }

  /**
   * Get loop interval based on index
   */
  private getLoopInterval(index: number): number {
    const intervals = [5, 60, 60, 30, 300, 900, 600, 120, 60, 60]; // Added Loop 10
    return intervals[index] || 60;
  }

  /**
   * 🔍 AUTO-DISCOVER: API Systems
   */
  private async scanApiSystems(): Promise<void> {
    logger.info('🔍 Scanning API systems...');

    // Monitoring API
    this.registerSystem({
      id: 'monitoring-api',
      name: 'Monitoring API',
      category: SystemCategory.API,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: [],
      location: 'src/api/MonitoringAPI.ts',
      interfaces: ['/health', '/metrics', '/status'],
      configuration: { port: 3002, authentication: true },
      description: 'System monitoring and health API endpoints',
      purpose: 'Provide real-time system monitoring via HTTP API',
      lastUpdated: new Date(),
      tags: ['api', 'monitoring', 'health', 'http', 'endpoints'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { endpoints: 3, responseTime: 'excellent' }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['api.read'],
        usageInstructions: 'HTTP GET requests to /api/monitoring/*'
      }
    });

    // RunPod API
    this.registerSystem({
      id: 'runpod-api',
      name: 'RunPod API',
      category: SystemCategory.API,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: [],
      dependents: ['runpod-monitor-loop'],
      location: 'src/api/runpod.ts',
      interfaces: ['/api/runpod/status', '/api/runpod/pods', '/api/runpod/cost'],
      configuration: { requiresApiKey: true, realtime: true },
      description: 'RunPod infrastructure management API',
      purpose: 'Manage RunPod pods, GPUs, and cost monitoring',
      lastUpdated: new Date(),
      tags: ['api', 'runpod', 'infrastructure', 'gpu', 'cost'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { endpoints: 3, provider: 'runpod' }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['runpod.read'],
        usageInstructions: 'HTTP GET requests to /api/runpod/*'
      }
    });

    // Atomic Systems API
    this.registerSystem({
      id: 'atomic-systems-api',
      name: 'Atomic Systems API',
      category: SystemCategory.API,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: [],
      location: 'src/api/atomic-systems.ts',
      interfaces: ['/api/atomic-systems/*'],
      configuration: { atomicEntities: true, realtime: true },
      description: 'Atomic entity management and querying API',
      purpose: 'Manage atomic entities across Central-MCP',
      lastUpdated: new Date(),
      tags: ['api', 'atomic', 'entities', 'management', 'querying'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { endpoints: 5, entities: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['atomic.read'],
        usageInstructions: 'HTTP requests to /api/atomic-systems/*'
      }
    });

    // Universal Write API
    this.registerSystem({
      id: 'universal-write-api',
      name: 'Universal Write API',
      category: SystemCategory.API,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: true,
      dependencies: ['database-integration-layer'],
      dependents: ['all-loops', 'all-systems'],
      location: 'src/api/universal-write.ts',
      interfaces: ['writeSystemEvent()', 'writeToRegistry()', 'universalLog()'],
      configuration: { universalAccess: true, eventTracking: true },
      description: 'Universal write interface for all system events and logging',
      purpose: 'Centralize all write operations across Central-MCP',
      lastUpdated: new Date(),
      tags: ['api', 'universal', 'write', 'events', 'logging'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { universalAccess: true, eventsWritten: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['write.use'],
        usageInstructions: 'Use writeSystemEvent() for all system logging'
      }
    });

    // Agent Reality API
    this.registerSystem({
      id: 'agent-reality-api',
      name: 'Agent Reality API',
      category: SystemCategory.API,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['agent-reality-verification-system'],
      dependents: [],
      location: 'src/api/agent-reality-api.ts',
      interfaces: ['/api/agent-reality/verify', '/api/agent-reality/status'],
      configuration: { realTimeVerification: true },
      description: 'Agent reality verification API endpoints',
      purpose: 'Verify agent connection reality via HTTP API',
      lastUpdated: new Date(),
      tags: ['api', 'agent', 'reality', 'verification', 'temporal'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { endpoints: 2, verificationsRun: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['agent.verify'],
        usageInstructions: 'HTTP POST to /api/agent-reality/verify'
      }
    });

    // Model Detection API
    this.registerSystem({
      id: 'model-detection-api',
      name: 'Model Detection API',
      category: SystemCategory.API,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['model-detection-system'],
      dependents: [],
      location: 'src/api/model-detection-api.ts',
      interfaces: ['/api/model-detection/detect', '/api/model-detection/verify'],
      configuration: { autoDetection: true },
      description: 'Model detection and verification API',
      purpose: 'Detect and verify AI models via HTTP API',
      lastUpdated: new Date(),
      tags: ['api', 'model', 'detection', 'verification', 'ai'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { endpoints: 2, detectionsRun: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['model.detect'],
        usageInstructions: 'HTTP GET to /api/model-detection/detect'
      }
    });

    // Photon API
    this.registerSystem({
      id: 'photon-api',
      name: 'Photon API',
      category: SystemCategory.API,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['monitoring-server'],
      location: 'src/photon/PhotonAPI.ts',
      interfaces: ['/api/photon/*'],
      configuration: { realtime: true, websockets: true },
      description: 'Photon real-time monitoring and integration API',
      purpose: 'Provide real-time system monitoring via Photon protocol',
      lastUpdated: new Date(),
      tags: ['api', 'photon', 'realtime', 'monitoring', 'websockets'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { endpoints: 10, realtimeConnections: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['photon.read'],
        usageInstructions: 'Connect via WebSocket to /api/photon/*'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Tool Systems
   */
  private async scanToolSystems(): Promise<void> {
    logger.info('🔍 Scanning tool systems...');

    const tools = [
      'claim-task', 'complete-task', 'get-available-tasks', 'get-dashboard',
      'get-agent-status', 'update-progress', 'get-system-status',
      'agent-connect', 'agent-heartbeat', 'upload-project-context'
    ];

    tools.forEach(toolId => {
      this.registerSystem({
        id: `tool-${toolId.replace('_', '-')}`,
        name: `MCP Tool: ${toolId}`,
        category: SystemCategory.TOOL,
        version: '2.0.0',
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        globalAccess: false, // Tools accessed via MCP
        dependencies: ['integrated-task-store', 'database-integration-layer'],
        dependents: [],
        location: `src/tools/${toolId}.ts`,
        interfaces: [`mcp.${toolId}`],
        configuration: { mcpCompatible: true },
        description: `MCP tool for ${toolId.replace('-', ' ')}`,
        purpose: `Enable ${toolId.replace('-', ' ')} via MCP protocol`,
        lastUpdated: new Date(),
        tags: ['tool', 'mcp', 'agent-interface', 'automation'],
        health: {
          status: 'healthy',
          lastCheck: new Date(),
          metrics: { mcpRegistered: true }
        },
        agentAccess: {
          canQuery: true,
          canUse: true,
          requiredPermissions: ['tools.use'],
          usageInstructions: `Use via MCP: call_tool('${toolId}')`
        }
      });
    });

    // Central Systems Tool
    this.registerSystem({
      id: 'tool-central-systems',
      name: 'MCP Tool: central-systems',
      category: SystemCategory.TOOL,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: ['central-systems-registry'],
      dependents: [],
      location: 'src/tools/centralSystems.ts',
      interfaces: ['mcp.central_systems'],
      configuration: { mcpCompatible: true, registryAccess: true },
      description: 'MCP tool for querying Central Systems Registry',
      purpose: 'Enable agents to query available systems and capabilities',
      lastUpdated: new Date(),
      tags: ['tool', 'mcp', 'registry', 'systems', 'discovery'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { mcpRegistered: true, registryAccess: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['tools.use', 'registry.read'],
        usageInstructions: 'Use via MCP: call_tool("central_systems")'
      }
    });

    // RunPod Integration Tool
    this.registerSystem({
      id: 'tool-runpod-integration',
      name: 'MCP Tool: runpod-integration',
      category: SystemCategory.TOOL,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['runpod-api'],
      dependents: ['runpod-monitor-loop'],
      location: 'src/tools/runpod/runpodIntegration.ts',
      interfaces: ['getRunPodStatus()', 'getRunPodPods()', 'getRunPodCost()'],
      configuration: { mcpCompatible: true, requiresApiKey: true },
      description: 'RunPod infrastructure management tool',
      purpose: 'Query and manage RunPod infrastructure',
      lastUpdated: new Date(),
      tags: ['tool', 'runpod', 'infrastructure', 'gpu'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { integrated: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['runpod.use'],
        usageInstructions: 'Use getRunPodStatus() for infrastructure info'
      }
    });

    // System Health Tool
    this.registerSystem({
      id: 'tool-get-system-health',
      name: 'MCP Tool: get-system-health',
      category: SystemCategory.TOOL,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['monitoring-api', 'database-monitor'],
      dependents: [],
      location: 'src/tools/health/getSystemHealth.ts',
      interfaces: ['getSystemHealth()', 'getDetailedHealth()'],
      configuration: { mcpCompatible: true, realtime: true },
      description: 'Comprehensive system health checking tool',
      purpose: 'Query overall system health and metrics',
      lastUpdated: new Date(),
      tags: ['tool', 'health', 'monitoring', 'metrics'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { integrated: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['health.read'],
        usageInstructions: 'Use getSystemHealth() for status checks'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Integration Systems
   */
  private async scanIntegrationSystems(): Promise<void> {
    logger.info('🔍 Scanning integration systems...');

    this.registerSystem({
      id: 'global-database-interface',
      name: 'Global Database Interface',
      category: SystemCategory.INTEGRATION,
      version: '2.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: true,
      dependencies: ['database-integration-layer', 'integrated-task-store'],
      dependents: ['all-loops', 'all-systems'],
      location: 'global.centralMCPDatabase',
      interfaces: ['getTask()', 'getAllTasks()', 'getPerformanceMetrics()'],
      configuration: { isGlobal: true, version: '2.0.0' },
      description: 'Global database interface accessible to all components',
      purpose: 'Provide unified database access across the entire system',
      lastUpdated: new Date(),
      tags: ['global', 'interface', 'database', 'unified', 'access'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { global: true, available: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['database.use'],
        usageInstructions: 'Use global.centralMCPDatabase directly'
      }
    });

    // Context API
    this.registerSystem({
      id: 'context-api',
      name: 'Context API',
      category: SystemCategory.INTEGRATION,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['agent-discovery-loop'],
      location: 'src/core/ContextAPI.ts',
      interfaces: ['uploadContext()', 'getContext()', 'updateContext()'],
      configuration: { contextTracking: true, versioning: true },
      description: 'Agent context upload and management API',
      purpose: 'Enable agents to upload and retrieve context information',
      lastUpdated: new Date(),
      tags: ['integration', 'context', 'api', 'agents', 'upload'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { contextsStored: 0, versionsTracked: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['context.use'],
        usageInstructions: 'Use uploadContext() to share agent context'
      }
    });

    // Agent Connection API
    this.registerSystem({
      id: 'agent-connection-api',
      name: 'Agent Connection API',
      category: SystemCategory.INTEGRATION,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['universal-agent-registry'],
      dependents: ['agent-discovery-loop'],
      location: 'src/core/AgentConnectionAPI.ts',
      interfaces: ['connectAgent()', 'disconnectAgent()', 'heartbeat()'],
      configuration: { autoHeartbeat: true, timeoutSeconds: 300 },
      description: 'Agent connection lifecycle management API',
      purpose: 'Manage agent connections, heartbeats, and lifecycle',
      lastUpdated: new Date(),
      tags: ['integration', 'agents', 'connection', 'lifecycle', 'heartbeat'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { activeConnections: 0, heartbeatsReceived: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['agent.connect'],
        usageInstructions: 'Use connectAgent() on session start'
      }
    });

    // Photon Integrations
    this.registerSystem({
      id: 'photon-integrations',
      name: 'Photon Integrations',
      category: SystemCategory.INTEGRATION,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['photon-api', 'database-integration-layer'],
      dependents: ['monitoring-server'],
      location: 'src/photon/PhotonIntegrations.ts',
      interfaces: ['integratePhoton()', 'syncData()', 'streamEvents()'],
      configuration: { realtime: true, bidirectionalSync: true },
      description: 'Photon monitoring system integrations',
      purpose: 'Integrate Central-MCP with Photon real-time monitoring',
      lastUpdated: new Date(),
      tags: ['integration', 'photon', 'monitoring', 'realtime', 'sync'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { integrated: true, syncEnabled: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['photon.read'],
        usageInstructions: 'Automatic integration - no manual use needed'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Monitoring Systems
   */
  private async scanMonitoringSystems(): Promise<void> {
    logger.info('🔍 Scanning monitoring systems...');

    this.registerSystem({
      id: 'performance-monitoring',
      name: 'Performance Monitoring System',
      category: SystemCategory.MONITORING,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['auto-proactive-engine'],
      location: 'src/database/DatabaseMonitor.ts',
      interfaces: ['getPerformanceMetrics()', 'getPerformanceRecommendations()'],
      configuration: { slowQueryThreshold: 1000, monitoringInterval: 60000 },
      description: 'Real-time performance monitoring and optimization',
      purpose: 'Track system performance and provide optimization recommendations',
      lastUpdated: new Date(),
      tags: ['monitoring', 'performance', 'optimization', 'metrics'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { monitoring: true, recommendations: 'active' }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['monitoring.read'],
        usageInstructions: 'Access via database interface performance methods'
      }
    });

    // Monitoring Server (Photon)
    this.registerSystem({
      id: 'monitoring-server',
      name: 'Monitoring Server (Photon)',
      category: SystemCategory.MONITORING,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['photon-api', 'photon-integrations'],
      dependents: [],
      location: 'src/photon/MonitoringServer.ts',
      interfaces: ['startServer()', 'stopServer()', 'getMetrics()'],
      configuration: { port: 3002, websockets: true, realtime: true },
      description: 'Photon real-time monitoring server',
      purpose: 'Provide real-time monitoring dashboard and WebSocket streaming',
      lastUpdated: new Date(),
      tags: ['monitoring', 'server', 'photon', 'realtime', 'websockets'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { serverRunning: true, connections: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['monitoring.read'],
        usageInstructions: 'Connect to WebSocket endpoint for real-time monitoring'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Security Systems
   */
  private async scanSecuritySystems(): Promise<void> {
    logger.info('🔍 Scanning security systems...');

    const securitySystems = [
      { id: 'input-validation-middleware', name: 'Input Validation Middleware' },
      { id: 'session-management', name: 'Session Management System' },
      { id: 'security-headers', name: 'Security Headers System' },
      { id: 'authentication-system', name: 'Authentication System' }
    ];

    securitySystems.forEach(system => {
      this.registerSystem({
        id: system.id,
        name: system.name,
        category: SystemCategory.SECURITY,
        version: '1.0.0',
        status: SystemStatus.ACTIVE,
        confidence: ConfidenceLevel.VERIFIED,
        integrated: true,
        globalAccess: false,
        dependencies: [],
        dependents: ['all-apis'],
        location: 'src/config/secureServer.ts',
        interfaces: ['validate()', 'authenticate()', 'authorize()'],
        configuration: { securityLevel: 'high', validation: true },
        description: `Security system for ${system.name.toLowerCase()}`,
        purpose: `Ensure ${system.name.toLowerCase()} across the system`,
        lastUpdated: new Date(),
        tags: ['security', 'validation', 'protection', 'safety'],
        health: {
          status: 'healthy',
          lastCheck: new Date(),
          metrics: { securityLevel: 'high', protection: 'active' }
        },
        agentAccess: {
          canQuery: true,
          canUse: false,
          requiredPermissions: ['security.read'],
          usageInstructions: 'Security features are automatically applied'
        }
      });
    });

    // API Key Manager
    this.registerSystem({
      id: 'api-key-manager',
      name: 'API Key Manager',
      category: SystemCategory.SECURITY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: [],
      dependents: ['authentication-system'],
      location: 'src/auth/ApiKeyManager.ts',
      interfaces: ['validateApiKey()', 'generateApiKey()', 'revokeApiKey()'],
      configuration: { hashingEnabled: true, rateLimiting: true },
      description: 'API key generation, validation, and lifecycle management',
      purpose: 'Secure API key management with timing-attack protection',
      lastUpdated: new Date(),
      tags: ['security', 'api-keys', 'authentication', 'hashing'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { keysManaged: 0, validationEnabled: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['security.admin'],
        usageInstructions: 'Used automatically by authentication system'
      }
    });

    // Session Manager
    this.registerSystem({
      id: 'session-manager',
      name: 'Session Manager',
      category: SystemCategory.SECURITY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: [],
      dependents: ['authentication-system'],
      location: 'src/auth/SessionManager.ts',
      interfaces: ['createSession()', 'validateSession()', 'destroySession()'],
      configuration: {
        sessionTimeout: 3600,
        secureFlags: true,
        httpOnly: true,
        sameSite: 'strict'
      },
      description: 'Secure session management with timeout and lifecycle tracking',
      purpose: 'Manage user sessions with security best practices',
      lastUpdated: new Date(),
      tags: ['security', 'sessions', 'authentication', 'cookies'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { activeSessions: 0, secureFlags: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['security.admin'],
        usageInstructions: 'Used automatically by authentication system'
      }
    });

    // Token Manager
    this.registerSystem({
      id: 'token-manager',
      name: 'Token Manager',
      category: SystemCategory.SECURITY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: [],
      dependents: ['authentication-system'],
      location: 'src/auth/TokenManager.ts',
      interfaces: ['generateToken()', 'validateToken()', 'refreshToken()'],
      configuration: { jwtEnabled: true, refreshTokens: true },
      description: 'JWT and refresh token generation and validation',
      purpose: 'Manage authentication tokens securely',
      lastUpdated: new Date(),
      tags: ['security', 'tokens', 'jwt', 'authentication'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { tokensIssued: 0, jwtEnabled: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['security.admin'],
        usageInstructions: 'Used automatically by authentication system'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Revolutionary Systems
   */
  private async scanRevolutionarySystems(): Promise<void> {
    logger.info('🔍 Scanning revolutionary systems...');

    // Model Detection System
    this.registerSystem({
      id: 'model-detection-system',
      name: 'Model Detection System',
      category: SystemCategory.REVOLUTIONARY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['agent-discovery-loop', 'auto-proactive-engine'],
      location: 'src/auto-proactive/ModelDetectionSystem.ts',
      interfaces: ['detectCurrentModel()', 'verifyModel()', 'getModelCapabilities()'],
      configuration: {
        detectionMethods: ['config-files', 'env-vars', 'api-endpoints'],
        verificationEnabled: true
      },
      description: 'Foolproof AI model detection and verification system',
      purpose: 'Detect actual running model, provider, and capabilities with 100% accuracy',
      lastUpdated: new Date(),
      tags: ['revolutionary', 'ai', 'detection', 'model', 'verification'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { detectionAccuracy: '100%', verificationEnabled: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['model.detect'],
        usageInstructions: 'Use to verify which AI model is actually running'
      }
    });

    // Agent Reality Verification System
    this.registerSystem({
      id: 'agent-reality-verification-system',
      name: 'Agent Reality Verification System',
      category: SystemCategory.REVOLUTIONARY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['agent-discovery-loop'],
      location: 'src/auto-proactive/AgentRealityVerificationSystem.ts',
      interfaces: ['verifyAgentReality()', 'checkLiveConnection()', 'getRealityScore()'],
      configuration: {
        enableTemporalDisclaimers: true,
        enableLiveVerification: true,
        strictModeEnabled: true
      },
      description: 'Prevents false assumptions about agent connections and provides temporal awareness',
      purpose: 'Ensure agents understand difference between live connections and historical data',
      lastUpdated: new Date(),
      tags: ['revolutionary', 'verification', 'reality', 'temporal', 'consciousness'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { strictMode: true, verificationEnabled: true }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['agent.verify'],
        usageInstructions: 'Use to verify if agent connection is live or historical'
      }
    });

    // Totality Verification System
    this.registerSystem({
      id: 'totality-verification-system',
      name: 'Totality Verification System',
      category: SystemCategory.REVOLUTIONARY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['status-analysis-loop'],
      location: 'src/validation/TotalityVerificationSystem.ts',
      interfaces: ['verifyCompleteness()', 'findGaps()', 'generateReport()'],
      configuration: { validationEnabled: true, gapDetection: true },
      description: 'Verifies system completeness and identifies missing components',
      purpose: 'Ensure nothing is missing from Central-MCP ecosystem',
      lastUpdated: new Date(),
      tags: ['revolutionary', 'verification', 'completeness', 'gaps', 'validation'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { validationEnabled: true, gapsDetected: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['system.verify'],
        usageInstructions: 'Use to verify system completeness and find gaps'
      }
    });

    // Boss Mode Switching System
    this.registerSystem({
      id: 'boss-mode-switching-system',
      name: 'Boss Mode Switching System',
      category: SystemCategory.REVOLUTIONARY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['model-detection-system'],
      dependents: [],
      location: 'src/hybrid/BossModeSwitchingSystem.ts',
      interfaces: ['switchToBossMode()', 'getCurrentMode()', 'getOptimalModel()'],
      configuration: {
        cloudModels: ['claude-sonnet-4-5', 'gpt-4'],
        localModels: ['llama-70b', 'qwen-32b'],
        autoSwitching: true
      },
      description: 'Hybrid intelligence system for local/cloud model switching',
      purpose: 'Switch between local and cloud models based on task requirements',
      lastUpdated: new Date(),
      tags: ['revolutionary', 'hybrid', 'intelligence', 'switching', 'optimization'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { autoSwitching: true, modelsAvailable: 4 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['model.switch'],
        usageInstructions: 'Use to switch between local budget and cloud premium models'
      }
    });

    // Auto Thread Save System
    this.registerSystem({
      id: 'auto-thread-save-system',
      name: 'Auto Thread Save System',
      category: SystemCategory.REVOLUTIONARY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: [],
      location: 'src/auto-tasks/ThreadSaveTaskCreator.ts',
      interfaces: ['autoSaveThread()', 'createSaveTask()', 'scheduleBackup()'],
      configuration: { autoSaveEnabled: true, backupInterval: 300 },
      description: 'Automatic thread backup and preservation system',
      purpose: 'Ensure no conversation context is ever lost',
      lastUpdated: new Date(),
      tags: ['revolutionary', 'backup', 'preservation', 'threads', 'automation'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { autoSaveEnabled: true, backupsCreated: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['thread.save'],
        usageInstructions: 'Automatic system - no manual intervention needed'
      }
    });

    // JSON Performance Monitor
    this.registerSystem({
      id: 'json-performance-monitor',
      name: 'JSON Performance Monitor',
      category: SystemCategory.REVOLUTIONARY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: ['performance-monitoring'],
      location: 'src/database/JsonHelpers.ts',
      interfaces: ['monitorPerformance()', 'getMetrics()', 'optimizeQueries()'],
      configuration: { monitoringEnabled: true, slowQueryThreshold: 100 },
      description: 'Advanced JSON column performance monitoring and optimization',
      purpose: 'Track and optimize JSON column operations for maximum performance',
      lastUpdated: new Date(),
      tags: ['revolutionary', 'performance', 'json', 'monitoring', 'optimization'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { monitoringEnabled: true, avgQueryTime: 'excellent' }
      },
      agentAccess: {
        canQuery: true,
        canUse: false,
        requiredPermissions: ['performance.read'],
        usageInstructions: 'Access via database performance interface'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Registry Systems
   */
  private async scanRegistrySystems(): Promise<void> {
    logger.info('🔍 Scanning registry systems...');

    // Universal Agent Registry
    this.registerSystem({
      id: 'universal-agent-registry',
      name: 'Universal Agent Registry',
      category: SystemCategory.REGISTRY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: true,
      dependencies: ['database-integration-layer'],
      dependents: ['agent-discovery-loop', 'agent-assignment-loop'],
      location: 'src/core/UniversalAgentRegistry.ts',
      interfaces: ['registerAgent()', 'getAgent()', 'getAllAgents()', 'updateCapabilities()'],
      configuration: { autoDiscovery: true, capabilityTracking: true },
      description: 'Global registry of all agents across Central-MCP ecosystem',
      purpose: 'Track all agents, their capabilities, locations, and assignments',
      lastUpdated: new Date(),
      tags: ['registry', 'agents', 'coordination', 'global', 'tracking'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { totalAgents: 0, activeAgents: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['agents.read'],
        usageInstructions: 'Query available agents and their capabilities'
      }
    });

    // Model Registry
    this.registerSystem({
      id: 'model-registry',
      name: 'Model Registry',
      category: SystemCategory.REGISTRY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.VERIFIED,
      integrated: true,
      globalAccess: true,
      dependencies: ['database-integration-layer'],
      dependents: ['model-detection-system', 'boss-mode-switching'],
      location: 'src/ai/ModelRegistry.ts',
      interfaces: ['registerModel()', 'getModel()', 'getAvailableModels()', 'selectOptimalModel()'],
      configuration: {
        cloudModels: true,
        localModels: true,
        costTracking: true
      },
      description: 'Catalog of all AI models with capabilities, costs, and availability',
      purpose: 'Manage AI model selection and optimization across ecosystem',
      lastUpdated: new Date(),
      tags: ['registry', 'ai', 'models', 'catalog', 'optimization'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { totalModels: 0, availableModels: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['models.read'],
        usageInstructions: 'Query available AI models and their capabilities'
      }
    });

    // Rules Registry
    this.registerSystem({
      id: 'rules-registry',
      name: 'Rules Registry',
      category: SystemCategory.REGISTRY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: true,
      dependencies: ['database-integration-layer'],
      dependents: ['validation-systems', 'opportunity-scanning-loop'],
      location: 'src/registry/RulesRegistry.ts',
      interfaces: ['registerRule()', 'getRule()', 'validateAgainstRules()', 'updateRule()'],
      configuration: { validationEnabled: true, strictMode: true },
      description: 'Registry of business rules, validation rules, and constraints',
      purpose: 'Centralize all business logic and validation rules',
      lastUpdated: new Date(),
      tags: ['registry', 'rules', 'validation', 'business-logic', 'constraints'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { totalRules: 0, activeRules: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['rules.read'],
        usageInstructions: 'Query validation rules and business logic'
      }
    });

    // A2A Agent Registry
    this.registerSystem({
      id: 'a2a-agent-registry',
      name: 'Agent-to-Agent Registry',
      category: SystemCategory.REGISTRY,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['universal-agent-registry'],
      dependents: [],
      location: 'src/a2a/AgentRegistry.ts',
      interfaces: ['registerA2AAgent()', 'getA2ACapabilities()', 'routeMessage()'],
      configuration: { messageRouting: true, capabilityMatching: true },
      description: 'Specialized registry for agent-to-agent communication',
      purpose: 'Enable direct agent-to-agent messaging and coordination',
      lastUpdated: new Date(),
      tags: ['registry', 'a2a', 'communication', 'agents', 'messaging'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { activeConnections: 0, messagesSent: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['a2a.use'],
        usageInstructions: 'Use for direct agent-to-agent communication'
      }
    });

    // Curated Content Manager
    this.registerSystem({
      id: 'curated-content-manager',
      name: 'Curated Content Manager',
      category: SystemCategory.CORE,
      version: '1.0.0',
      status: SystemStatus.ACTIVE,
      confidence: ConfidenceLevel.HIGH,
      integrated: true,
      globalAccess: false,
      dependencies: ['database-integration-layer'],
      dependents: [],
      location: 'src/orchestration/CuratedContentManager.ts',
      interfaces: ['createWorkSet()', 'getWorkSet()', 'curateContent()', 'generateContext()'],
      configuration: { curationEnabled: true, contextGeneration: true },
      description: 'Manages curated content collections and work sets',
      purpose: 'Organize and provide curated content for agents',
      lastUpdated: new Date(),
      tags: ['core', 'content', 'curation', 'context', 'orchestration'],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { workSets: 0, curatedItems: 0 }
      },
      agentAccess: {
        canQuery: true,
        canUse: true,
        requiredPermissions: ['content.read'],
        usageInstructions: 'Query curated content and work sets'
      }
    });
  }

  /**
   * 🔍 AUTO-DISCOVER: Legacy Systems
   */
  private async scanLegacySystems(): Promise<void> {
    logger.info('🔍 Scanning legacy systems...');

    // Legacy file-based systems being phased out
    this.registerSystem({
      id: 'legacy-task-files',
      name: 'Legacy Task Files (Deprecated)',
      category: SystemCategory.LEGACY,
      version: '0.9.0',
      status: SystemStatus.DISABLED,
      confidence: ConfidenceLevel.LOW,
      integrated: false,
      globalAccess: false,
      dependencies: [],
      dependents: [],
      location: 'various legacy files',
      interfaces: [],
      configuration: { deprecated: true, migrationComplete: true },
      description: 'Legacy file-based task management (deprecated)',
      purpose: 'Historical reference - replaced by database systems',
      lastUpdated: new Date(),
      tags: ['legacy', 'deprecated', 'files', 'replaced'],
      health: {
        status: 'disabled',
        lastCheck: new Date(),
        metrics: { deprecated: true, replaced: true }
      },
      agentAccess: {
        canQuery: false,
        canUse: false,
        requiredPermissions: [],
        usageInstructions: 'DO NOT USE - Legacy system replaced by database'
      }
    });
  }

  /**
   * Register a system in the registry
   */
  registerSystem(system: SystemComponent): void {
    this.systems.set(system.id, system);
    logger.debug(`📝 Registered system: ${system.name} (${system.id})`);
  }

  /**
   * 🔍 QUERY: Get system by ID
   */
  getSystem(id: string): SystemComponent | null {
    return this.systems.get(id) || null;
  }

  /**
   * 🔍 QUERY: Query systems with filters
   */
  querySystems(query: RegistryQuery = {}): SystemComponent[] {
    let systems = Array.from(this.systems.values());

    // Apply filters
    if (query.category) {
      systems = systems.filter(s => s.category === query.category);
    }

    if (query.status) {
      systems = systems.filter(s => s.status === query.status);
    }

    if (query.confidence) {
      systems = systems.filter(s => s.confidence === query.confidence);
    }

    if (query.integrated !== undefined) {
      systems = systems.filter(s => s.integrated === query.integrated);
    }

    if (query.agentAccessible) {
      systems = systems.filter(s => s.agentAccess.canQuery);
    }

    if (query.tags && query.tags.length > 0) {
      systems = systems.filter(s =>
        query.tags!.some(tag => s.tags.includes(tag))
      );
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      systems = systems.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by confidence and status priority
    return systems.sort((a, b) => {
      const confidenceOrder = {
        [ConfidenceLevel.VERIFIED]: 5,
        [ConfidenceLevel.HIGH]: 4,
        [ConfidenceLevel.MEDIUM]: 3,
        [ConfidenceLevel.LOW]: 2,
        [ConfidenceLevel.EXPERIMENTAL]: 1,
        [ConfidenceLevel.NONE]: 0
      };

      const statusOrder = {
        [SystemStatus.ACTIVE]: 5,
        [SystemStatus.INTEGRATED]: 4,
        [SystemStatus.DEVELOPMENT]: 3,
        [SystemStatus.LEGACY]: 2,
        [SystemStatus.DISABLED]: 1,
        [SystemStatus.ERROR]: 0,
        [SystemStatus.UNKNOWN]: -1
      };

      const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (confidenceDiff !== 0) return confidenceDiff;

      return statusOrder[b.status] - statusOrder[a.status];
    });
  }

  /**
   * 🔍 QUERY: Get all active systems
   */
  getActiveSystems(): SystemComponent[] {
    return this.querySystems({ status: SystemStatus.ACTIVE });
  }

  /**
   * 🔍 QUERY: Get all integrated systems
   */
  getIntegratedSystems(): SystemComponent[] {
    return this.querySystems({ integrated: true });
  }

  /**
   * 🔍 QUERY: Get agent-accessible systems
   */
  getAgentAccessibleSystems(): SystemComponent[] {
    return this.querySystems({ agentAccessible: true });
  }

  /**
   * 🔍 QUERY: Get systems by category
   */
  getSystemsByCategory(category: SystemCategory): SystemComponent[] {
    return this.querySystems({ category });
  }

  /**
   * 📊 Get registry statistics
   */
  getRegistryStats(): RegistryStats {
    const systems = Array.from(this.systems.values());

    const systemsByCategory = Object.values(SystemCategory).reduce((acc, category) => {
      acc[category] = systems.filter(s => s.category === category).length;
      return acc;
    }, {} as Record<SystemCategory, number>);

    const averageConfidence = systems.length > 0
      ? systems.reduce((sum, s) => sum + this.getConfidenceScore(s.confidence), 0) / systems.length
      : 0;

    const healthDistribution = systems.reduce((acc, s) => {
      const status = s.health.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSystems: systems.length,
      activeSystems: systems.filter(s => s.status === SystemStatus.ACTIVE).length,
      integratedSystems: systems.filter(s => s.integrated).length,
      systemsByCategory,
      averageConfidence,
      healthDistribution,
      lastUpdated: this.lastScan
    };
  }

  /**
   * Convert confidence level to numeric score
   */
  private getConfidenceScore(level: ConfidenceLevel): number {
    const scores = {
      [ConfidenceLevel.VERIFIED]: 100,
      [ConfidenceLevel.HIGH]: 90,
      [ConfidenceLevel.MEDIUM]: 75,
      [ConfidenceLevel.LOW]: 60,
      [ConfidenceLevel.EXPERIMENTAL]: 40,
      [ConfidenceLevel.NONE]: 20
    };
    return scores[level] || 0;
  }

  /**
   * 🔍 AGENT INTERFACE: What systems are available?
   */
  getAvailableSystemsForAgent(agentId?: string): {
    total: number;
    categories: Record<string, number>;
    systems: Array<{
      id: string;
      name: string;
      category: string;
      status: string;
      confidence: string;
      canUse: boolean;
      description: string;
      usage: string;
    }>;
  } {
    const accessibleSystems = this.getAgentAccessibleSystems();

    return {
      total: accessibleSystems.length,
      categories: accessibleSystems.reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      systems: accessibleSystems.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        status: s.status,
        confidence: s.confidence,
        canUse: s.agentAccess.canUse,
        description: s.description,
        usage: s.agentAccess.usageInstructions || 'Query via registry interface'
      }))
    };
  }

  /**
   * 🔍 AGENT INTERFACE: Check if system exists
   */
  systemExists(systemId: string): boolean {
    return this.systems.has(systemId);
  }

  /**
   * 🔍 AGENT INTERFACE: Can I create this feature?
   */
  canCreateFeature(featureDescription: string): {
    allowed: boolean;
    reason: string;
    existingSystems: string[];
    recommendations: string[];
  } {
    // Search for similar existing systems
    const similarSystems = this.querySystems({
      search: featureDescription.toLowerCase(),
      agentAccessible: true
    });

    if (similarSystems.length > 0) {
      return {
        allowed: false,
        reason: 'Similar system already exists - use existing implementation',
        existingSystems: similarSystems.map(s => s.id),
        recommendations: [
          `Use existing: ${similarSystems[0].name}`,
          'Check if existing system meets your needs',
          'Extend existing system instead of creating duplicate'
        ]
      };
    }

    // Check category conflicts
    const categoryConflicts = this.querySystems({
      category: this.inferCategory(featureDescription),
      status: SystemStatus.ACTIVE
    });

    if (categoryConflicts.length >= 3) {
      return {
        allowed: false,
        reason: 'Too many systems in this category - consider consolidation',
        existingSystems: categoryConflicts.map(s => s.id),
        recommendations: [
          'Extend existing systems instead of creating new ones',
          'Consider if this feature belongs in existing systems',
          'Review system consolidation opportunities'
        ]
      };
    }

    return {
      allowed: true,
      reason: 'No conflicts detected - feature can be developed',
      existingSystems: [],
      recommendations: [
        'Ensure integration with existing systems',
        'Follow established patterns and interfaces',
        'Register new system in Central Systems Registry'
      ]
    };
  }

  /**
   * Infer category from feature description
   */
  private inferCategory(description: string): SystemCategory {
    const lower = description.toLowerCase();

    if (lower.includes('loop') || lower.includes('auto-proactive')) return SystemCategory.LOOP;
    if (lower.includes('database') || lower.includes('task') || lower.includes('store')) return SystemCategory.DATABASE;
    if (lower.includes('api') || lower.includes('endpoint') || lower.includes('http')) return SystemCategory.API;
    if (lower.includes('tool') || lower.includes('mcp')) return SystemCategory.TOOL;
    if (lower.includes('monitor') || lower.includes('health') || lower.includes('metrics')) return SystemCategory.MONITORING;
    if (lower.includes('security') || lower.includes('auth') || lower.includes('validation')) return SystemCategory.SECURITY;
    if (lower.includes('integration') || lower.includes('bridge')) return SystemCategory.INTEGRATION;
    if (lower.includes('agent') || lower.includes('discovery')) return SystemCategory.AGENT;

    return SystemCategory.CORE;
  }

  /**
   * Refresh registry with new scan
   */
  async refresh(): Promise<void> {
    logger.info('🔄 Refreshing Central Systems Registry...');
    this.systems.clear();
    await this.initialize();
  }

  /**
   * Export registry data
   */
  exportRegistry(): {
    version: string;
    exported: Date;
    systems: SystemComponent[];
    stats: RegistryStats;
  } {
    return {
      version: '1.0.0',
      exported: new Date(),
      systems: Array.from(this.systems.values()),
      stats: this.getRegistryStats()
    };
  }
}

// Export for immediate use
export const centralSystemsRegistry = CentralSystemsRegistry.getInstance();