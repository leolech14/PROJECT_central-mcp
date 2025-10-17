/**
 * PHOTON API - Cloud Operations REST Interface
 * ===========================================
 *
 * RESTful API exposing PHOTON CORE capabilities to the world
 * Enables global coordination of AI operations via HTTP/HTTPS
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { PhotonCore, Operation, AgentContext, Platform } from './PhotonCore.js';
import { logger } from '../utils/logger.js';

/**
 * PHOTON API Server Configuration
 */
export interface PhotonAPIConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  corsOrigins: string[];
  rateLimiting: {
    windowMs: number;
    max: number;
  };
  authentication: {
    enabled: boolean;
    apiKeyHeader: string;
    authorizedKeys: string[];
  };
  ssl: {
    enabled: boolean;
    certPath?: string;
    keyPath?: string;
  };
}

/**
 * API Request/Response Types
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
  timestamp: string;
  processingTime?: number;
}

export interface CoordinateOperationRequest {
  name: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  agents: string[];
  platforms: Platform[];
  workflow: Array<{
    step: number;
    agent: string;
    platform: string;
    action: string;
    inputs: Record<string, any>;
    dependencies?: number[];
  }>;
  deadline?: string;
}

export interface RegisterAgentRequest {
  id: string;
  name: string;
  model: string;
  capabilities: string[];
  location: 'local' | 'cloud' | 'edge' | 'mobile' | 'remote';
  metadata?: Record<string, any>;
}

/**
 * PHOTON API Server
 */
export class PhotonAPI {
  private app: express.Application;
  private server: any;
  private photonCore: PhotonCore;
  private config: PhotonAPIConfig;

  constructor(config: PhotonAPIConfig, photonCore: PhotonCore) {
    this.config = config;
    this.photonCore = photonCore;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', this.config.authentication.apiKeyHeader],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimiting.windowMs,
      max: this.config.rateLimiting.max,
      message: {
        success: false,
        error: 'Too many requests - please try again later',
        requestId: 'rate-limited',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = uuidv4();
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));
    this.app.get('/health/detailed', this.detailedHealthCheck.bind(this));

    // Global state
    this.app.get('/api/v1/state', this.getGlobalState.bind(this));

    // Operations
    this.app.post('/api/v1/operations', this.authenticate.bind(this), this.coordinateOperation.bind(this));
    this.app.get('/api/v1/operations', this.authenticate.bind(this), this.getOperations.bind(this));
    this.app.get('/api/v1/operations/:id', this.authenticate.bind(this), this.getOperation.bind(this));

    // Agents
    this.app.post('/api/v1/agents', this.authenticate.bind(this), this.registerAgent.bind(this));
    this.app.get('/api/v1/agents', this.authenticate.bind(this), this.getAgents.bind(this));
    this.app.get('/api/v1/agents/:id', this.authenticate.bind(this), this.getAgent.bind(this));
    this.app.post('/api/v1/agents/:id/heartbeat', this.authenticate.bind(this), this.agentHeartbeat.bind(this));

    // Platforms
    this.app.get('/api/v1/platforms', this.authenticate.bind(this), this.getPlatforms.bind(this));
    this.app.post('/api/v1/platforms/:platform/execute', this.authenticate.bind(this), this.executePlatformAction.bind(this));

    // Metrics
    this.app.get('/api/v1/metrics', this.authenticate.bind(this), this.getMetrics.bind(this));
    this.app.get('/api/v1/metrics/dashboard', this.authenticate.bind(this), this.getDashboard.bind(this));

    // WebSocket for real-time updates
    this.setupWebSocketRoutes();

    // Admin routes
    this.app.get('/api/v1/admin/system', this.authenticate.bind(this), this.requireAdmin.bind(this), this.getSystemInfo.bind(this));
    this.app.post('/api/v1/admin/shutdown', this.authenticate.bind(this), this.requireAdmin.bind(this), this.shutdown.bind(this));

    // Root endpoint
    this.app.get('/', this.getRoot.bind(this));
  }

  /**
   * Setup WebSocket routes for real-time communication
   */
  private setupWebSocketRoutes(): void {
    // WebSocket implementation would go here
    // For now, we'll provide Server-Sent Events endpoint
    this.app.get('/api/v1/events', this.authenticate.bind(this), this.getEvents.bind(this));
  }

  /**
   * Authentication middleware
   */
  private authenticate(req: any, res: express.Response, next: express.NextFunction): void {
    if (!this.config.authentication.enabled) {
      return next();
    }

    const apiKey = req.headers[this.config.authentication.apiKeyHeader.toLowerCase()] as string;

    if (!apiKey || !this.config.authentication.authorizedKeys.includes(apiKey)) {
      return res.status(401).json(this.createErrorResponse(req.requestId, 'Invalid or missing API key', 401));
    }

    next();
  }

  /**
   * Admin role requirement middleware
   */
  private requireAdmin(req: any, res: express.Response, next: express.NextFunction): void {
    // Check if user has admin privileges
    const adminKey = req.headers['x-admin-key'] as string;

    if (!adminKey || adminKey !== process.env.PHOTON_ADMIN_KEY) {
      return res.status(403).json(this.createErrorResponse(req.requestId, 'Admin privileges required', 403));
    }

    next();
  }

  /**
   * Route Handlers
   */

  private async healthCheck(req: any, res: express.Response): Promise<void> {
    const health = this.photonCore.getGlobalState();
    res.json(this.createSuccessResponse(req.requestId, {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      systemHealth: health.systemHealth
    }));
  }

  private async detailedHealthCheck(req: any, res: express.Response): Promise<void> {
    const state = this.photonCore.getGlobalState();
    res.json(this.createSuccessResponse(req.requestId, {
      ...state,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: this.config.environment,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }));
  }

  private async getGlobalState(req: any, res: express.Response): Promise<void> {
    try {
      const state = this.photonCore.getGlobalState();
      res.json(this.createSuccessResponse(req.requestId, state));
    } catch (error) {
      logger.error('Error getting global state:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get global state', 500));
    }
  }

  private async coordinateOperation(req: any, res: express.Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: CoordinateOperationRequest = req.body;

      // Validate request
      if (!request.name || !request.agents || !request.platforms || !request.workflow) {
        return res.status(400).json(this.createErrorResponse(req.requestId, 'Missing required fields', 400));
      }

      // Create operation
      const operation: Operation = {
        id: uuidv4(),
        name: request.name,
        description: request.description,
        priority: request.priority || 'medium',
        agents: request.agents,
        platforms: request.platforms,
        workflow: request.workflow,
        deadline: request.deadline ? new Date(request.deadline) : undefined
      };

      // Coordinate operation
      const result = await this.photonCore.coordinateAgents(operation);

      const processingTime = Date.now() - startTime;
      res.json(this.createSuccessResponse(req.requestId, result, processingTime));

    } catch (error) {
      logger.error('Error coordinating operation:', error);
      const processingTime = Date.now() - startTime;
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to coordinate operation', 500, processingTime));
    }
  }

  private async registerAgent(req: any, res: express.Response): Promise<void> {
    try {
      const request: RegisterAgentRequest = req.body;

      // Validate request
      if (!request.id || !request.name || !request.model || !request.location) {
        return res.status(400).json(this.createErrorResponse(req.requestId, 'Missing required agent fields', 400));
      }

      // Create agent context
      const agent: AgentContext = {
        id: request.id,
        name: request.name,
        model: request.model,
        capabilities: request.capabilities || [],
        location: request.location,
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
      };

      // Register agent
      await this.photonCore.registerAgent(agent);

      res.status(201).json(this.createSuccessResponse(req.requestId, {
        message: 'Agent registered successfully',
        agent: agent
      }));

    } catch (error) {
      logger.error('Error registering agent:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to register agent', 500));
    }
  }

  private async getAgents(req: any, res: express.Response): Promise<void> {
    try {
      // This would need to be implemented in PhotonCore
      const agents: any[] = []; // await this.photonCore.getAllAgents();
      res.json(this.createSuccessResponse(req.requestId, { agents }));
    } catch (error) {
      logger.error('Error getting agents:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get agents', 500));
    }
  }

  private async getAgent(req: any, res: express.Response): Promise<void> {
    try {
      const agentId = req.params.id;
      // const agent = await this.photonCore.getAgent(agentId);
      const agent = null; // Placeholder

      if (!agent) {
        return res.status(404).json(this.createErrorResponse(req.requestId, 'Agent not found', 404));
      }

      res.json(this.createSuccessResponse(req.requestId, { agent }));
    } catch (error) {
      logger.error('Error getting agent:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get agent', 500));
    }
  }

  private async agentHeartbeat(req: any, res: express.Response): Promise<void> {
    try {
      const agentId = req.params.id;
      const { status, currentOperations } = req.body;

      // Update agent heartbeat
      // await this.photonCore.updateAgentHeartbeat(agentId, status, currentOperations);

      res.json(this.createSuccessResponse(req.requestId, {
        message: 'Heartbeat received',
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      logger.error('Error processing heartbeat:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to process heartbeat', 500));
    }
  }

  private async getPlatforms(req: any, res: express.Response): Promise<void> {
    try {
      const platforms = [
        { name: 'cursor', status: 'active', capabilities: ['code-editing', 'window-management'] },
        { name: 'claude-code', status: 'active', capabilities: ['command-execution', 'code-analysis'] },
        { name: 'gemini', status: 'active', capabilities: ['content-generation', 'multimodal-analysis'] },
        { name: 'zai', status: 'active', capabilities: ['database-queries', 'workflows'] }
      ];

      res.json(this.createSuccessResponse(req.requestId, { platforms }));
    } catch (error) {
      logger.error('Error getting platforms:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get platforms', 500));
    }
  }

  private async executePlatformAction(req: any, res: express.Response): Promise<void> {
    try {
      const platform = req.params.platform;
      const { action, inputs } = req.body;

      if (!action || !inputs) {
        return res.status(400).json(this.createErrorResponse(req.requestId, 'Missing action or inputs', 400));
      }

      // Execute platform action
      // const result = await this.photonCore.executePlatformAction(platform, action, inputs);
      const result = { success: true, platform, action, result: 'Action executed successfully' };

      res.json(this.createSuccessResponse(req.requestId, result));
    } catch (error) {
      logger.error('Error executing platform action:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to execute platform action', 500));
    }
  }

  private async getOperations(req: any, res: express.Response): Promise<void> {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      // Get operations from database
      // const operations = await this.photonCore.getOperations(status, limit, offset);
      const operations: any[] = []; // Placeholder

      res.json(this.createSuccessResponse(req.requestId, { operations, pagination: { limit, offset } }));
    } catch (error) {
      logger.error('Error getting operations:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get operations', 500));
    }
  }

  private async getOperation(req: any, res: express.Response): Promise<void> {
    try {
      const operationId = req.params.id;
      // const operation = await this.photonCore.getOperation(operationId);
      const operation = null; // Placeholder

      if (!operation) {
        return res.status(404).json(this.createErrorResponse(req.requestId, 'Operation not found', 404));
      }

      res.json(this.createSuccessResponse(req.requestId, { operation }));
    } catch (error) {
      logger.error('Error getting operation:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get operation', 500));
    }
  }

  private async getMetrics(req: any, res: express.Response): Promise<void> {
    try {
      const state = this.photonCore.getGlobalState();
      const metrics = {
        ...state,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };

      res.json(this.createSuccessResponse(req.requestId, metrics));
    } catch (error) {
      logger.error('Error getting metrics:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get metrics', 500));
    }
  }

  private async getDashboard(req: any, res: express.Response): Promise<void> {
    try {
      const state = this.photonCore.getGlobalState();

      const dashboard = {
        overview: {
          totalOperations: state.totalOperations,
          activeOperations: state.activeOperations,
          completedOperations: state.completedOperations,
          successRate: state.totalOperations > 0 ? (state.completedOperations / state.totalOperations) * 100 : 0,
          systemHealth: state.systemHealth
        },
        agents: {
          total: state.agentCount,
          active: 0, // Would be calculated from actual agent data
          distribution: {
            local: 0,
            cloud: 0,
            edge: 0,
            mobile: 0,
            remote: 0
          }
        },
        platforms: {
          total: state.platformCount,
          active: state.platformCount // All are active for now
        },
        performance: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      };

      res.json(this.createSuccessResponse(req.requestId, dashboard));
    } catch (error) {
      logger.error('Error getting dashboard:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get dashboard', 500));
    }
  }

  private async getEvents(req: any, res: express.Response): Promise<void> {
    // Server-Sent Events for real-time updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial state
    res.write(`data: ${JSON.stringify({ type: 'initial', data: this.photonCore.getGlobalState() })}\n\n`);

    // Set up event listeners
    const onOperationStarted = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'operationStarted', data })}\n\n`);
    };

    const onOperationCompleted = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'operationCompleted', data })}\n\n`);
    };

    const onAgentRegistered = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'agentRegistered', data })}\n\n`);
    };

    // Subscribe to PHOTON CORE events
    this.photonCore.on('operationStarted', onOperationStarted);
    this.photonCore.on('operationCompleted', onOperationCompleted);
    this.photonCore.on('agentRegistered', onAgentRegistered);

    // Cleanup on disconnect
    req.on('close', () => {
      this.photonCore.removeListener('operationStarted', onOperationStarted);
      this.photonCore.removeListener('operationCompleted', onOperationCompleted);
      this.photonCore.removeListener('agentRegistered', onAgentRegistered);
    });
  }

  private async getSystemInfo(req: any, res: express.Response): Promise<void> {
    try {
      const systemInfo = {
        version: process.env.npm_package_version || '1.0.0',
        environment: this.config.environment,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        config: {
          rateLimiting: this.config.rateLimiting,
          corsOrigins: this.config.corsOrigins,
          authentication: {
            enabled: this.config.authentication.enabled,
            authorizedKeysCount: this.config.authentication.authorizedKeys.length
          }
        }
      };

      res.json(this.createSuccessResponse(req.requestId, systemInfo));
    } catch (error) {
      logger.error('Error getting system info:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to get system info', 500));
    }
  }

  private async shutdown(req: any, res: express.Response): Promise<void> {
    try {
      res.json(this.createSuccessResponse(req.requestId, {
        message: 'PHOTON API server shutting down...'
      }));

      // Graceful shutdown
      setTimeout(async () => {
        await this.photonCore.shutdown();
        this.server.close(() => {
          logger.info('🛑 PHOTON API server shutdown complete');
          process.exit(0);
        });
      }, 1000);

    } catch (error) {
      logger.error('Error during shutdown:', error);
      res.status(500).json(this.createErrorResponse(req.requestId, 'Failed to shutdown gracefully', 500));
    }
  }

  private async getRoot(req: any, res: express.Response): Promise<void> {
    const rootInfo = {
      name: 'PHOTON API',
      description: 'Cloud Agentic Operations Center - REST API',
      version: process.env.npm_package_version || '1.0.0',
      environment: this.config.environment,
      endpoints: {
        health: '/health',
        globalState: '/api/v1/state',
        operations: '/api/v1/operations',
        agents: '/api/v1/agents',
        platforms: '/api/v1/platforms',
        metrics: '/api/v1/metrics',
        dashboard: '/api/v1/metrics/dashboard',
        events: '/api/v1/events'
      },
      documentation: '/docs',
      timestamp: new Date().toISOString()
    };

    res.json(this.createSuccessResponse(req.requestId, rootInfo));
  }

  /**
   * Error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json(this.createErrorResponse('unknown', 'Endpoint not found', 404));
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json(this.createErrorResponse(
        (req as any).requestId || 'unknown',
        'Internal server error',
        500
      ));
    });
  }

  /**
   * Utility methods
   */
  private createSuccessResponse<T>(requestId: string, data: T, processingTime?: number): APIResponse<T> {
    return {
      success: true,
      data,
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    };
  }

  private createErrorResponse(requestId: string, error: string, code: number, processingTime?: number): APIResponse {
    return {
      success: false,
      error,
      requestId,
      timestamp: new Date().toISOString(),
      processingTime
    };
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.config.ssl.enabled && this.config.ssl.certPath && this.config.ssl.keyPath) {
          // HTTPS server
          const fs = require('fs');
          const https = require('https');

          const options = {
            cert: fs.readFileSync(this.config.ssl.certPath),
            key: fs.readFileSync(this.config.ssl.keyPath)
          };

          this.server = https.createServer(options, this.app);
        } else {
          // HTTP server
          this.server = require('http').createServer(this.app);
        }

        this.server.listen(this.config.port, () => {
          logger.info(`🚀 PHOTON API server started on port ${this.config.port}`);
          logger.info(`📡 Environment: ${this.config.environment}`);
          logger.info(`🔐 SSL: ${this.config.ssl.enabled ? 'Enabled' : 'Disabled'}`);
          logger.info(`🔑 Authentication: ${this.config.authentication.enabled ? 'Enabled' : 'Disabled'}`);
          resolve();
        });

        this.server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            logger.error(`❌ Port ${this.config.port} is already in use`);
          } else {
            logger.error('❌ Failed to start server:', error);
          }
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('🛑 PHOTON API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default PhotonAPI;