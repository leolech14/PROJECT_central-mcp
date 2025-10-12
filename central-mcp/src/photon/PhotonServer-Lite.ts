/**
 * PHOTON SERVER LITE - Quick Start Version (No Dependencies)
 * ==========================================================
 *
 * Instant deployment version of PHOTON Cloud Operations Center
 * Zero compilation required - runs with Node.js built-ins only
 */

import { createServer } from 'http';
import { parse } from 'url';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PhotonCoreLite } from './PhotonCore-Lite.js';

// Simple logger since we can't use external dependencies
const log = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, ...args)
};

/**
 * Simple HTTP server for PHOTON LITE
 */
class PhotonServerLite {
  private photonCore: PhotonCoreLite;
  private server: any;
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
    this.photonCore = new PhotonCoreLite();
  }

  /**
   * Start the PHOTON LITE server
   */
  async start(): Promise<void> {
    this.server = createServer((req: any, res: any) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        log.info(`🚀 PHOTON LITE server started on port ${this.port}`);
        log.info('🌍 Cloud Agentic Operations Center ready - No dependencies required!');
        log.info(`📡 Health check: http://localhost:${this.port}/health`);
        log.info(`📊 Dashboard: http://localhost:${this.port}/api/v1/state`);
        log.info(`🎯 Coordinate operations: POST http://localhost:${this.port}/api/v1/operations`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          log.error(`❌ Port ${this.port} is already in use`);
        } else {
          log.error('❌ Failed to start server:', error);
        }
        reject(error);
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  private async handleRequest(req: any, res: any): Promise<void> {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    try {
      // Route handling
      if (path === '/health' && method === 'GET') {
        this.handleHealth(req, res);
      } else if (path === '/api/v1/state' && method === 'GET') {
        this.handleGlobalState(req, res);
      } else if (path === '/api/v1/operations' && method === 'GET') {
        this.handleGetOperations(req, res);
      } else if (path === '/api/v1/operations' && method === 'POST') {
        this.handleCoordinateOperation(req, res);
      } else if (path === '/api/v1/agents' && method === 'GET') {
        this.handleGetAgents(req, res);
      } else if (path === '/api/v1/agents' && method === 'POST') {
        this.handleRegisterAgent(req, res);
      } else if (path === '/api/v1/metrics/dashboard' && method === 'GET') {
        this.handleDashboard(req, res);
      } else if (path === '/' && method === 'GET') {
        this.handleRoot(req, res);
      } else if (path?.startsWith('/ui-studio.html') || path?.startsWith('/ui-configpro-dashboard.html') || path?.startsWith('/central-mcp-dashboard.html')) {
        await this.handleStaticFile(req, res, path);
      } else {
        this.handle404(req, res);
      }
    } catch (error) {
      this.handleError(req, res, error);
    }
  }

  /**
   * Health check endpoint
   */
  private handleHealth(req: any, res: any): void {
    const state = this.photonCore.getGlobalState();
    this.sendJson(res, 200, {
      success: true,
      data: {
        status: 'healthy',
        uptime: Math.floor(state.uptime / 1000),
        timestamp: new Date().toISOString(),
        systemHealth: state.systemHealth,
        version: '1.0.0-lite',
        mode: 'in-memory'
      }
    });
  }

  /**
   * Global state endpoint
   */
  private handleGlobalState(req: any, res: any): void {
    const state = this.photonCore.getGlobalState();
    this.sendJson(res, 200, {
      success: true,
      data: state
    });
  }

  /**
   * Get operations endpoint
   */
  private handleGetOperations(req: any, res: any): void {
    const url = parse(req.url, true);
    const status = url.query.status as string;
    const operations = this.photonCore.getOperations(status);

    this.sendJson(res, 200, {
      success: true,
      data: {
        operations,
        total: operations.length,
        status: status || 'all'
      }
    });
  }

  /**
   * Coordinate operation endpoint
   */
  private async handleCoordinateOperation(req: any, res: any): Promise<void> {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const operationData = JSON.parse(body);

        // Create operation
        const operation = this.photonCore.createOperation({
          name: operationData.name,
          description: operationData.description,
          priority: operationData.priority || 'medium',
          agents: operationData.agents,
          platforms: operationData.platforms,
          workflow: operationData.workflow
        });

        // Coordinate operation
        const result = await this.photonCore.coordinateAgents(operation);

        this.sendJson(res, 200, {
          success: true,
          data: result
        });

      } catch (error) {
        this.sendJson(res, 400, {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid request'
        });
      }
    });
  }

  /**
   * Get agents endpoint
   */
  private handleGetAgents(req: any, res: any): void {
    const agents = this.photonCore.getAgents();
    this.sendJson(res, 200, {
      success: true,
      data: {
        agents,
        total: agents.length
      }
    });
  }

  /**
   * Register agent endpoint
   */
  private async handleRegisterAgent(req: any, res: any): Promise<void> {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const agentData = JSON.parse(body);
        await this.photonCore.registerAgent(agentData);

        this.sendJson(res, 201, {
          success: true,
          data: {
            message: 'Agent registered successfully',
            agent: agentData
          }
        });

      } catch (error) {
        this.sendJson(res, 400, {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid agent data'
        });
      }
    });
  }

  /**
   * Dashboard endpoint
   */
  private handleDashboard(req: any, res: any): void {
    const state = this.photonCore.getGlobalState();
    const agents = this.photonCore.getAgents();
    const operations = this.photonCore.getOperations();

    const dashboard = {
      overview: {
        totalOperations: state.totalOperations,
        activeOperations: state.activeOperations,
        completedOperations: state.completedOperations,
        successRate: state.totalOperations > 0 ? (state.completedOperations / state.totalOperations) * 100 : 0,
        systemHealth: state.systemHealth,
        uptime: Math.floor(state.uptime / 1000)
      },
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        busy: agents.filter(a => a.status === 'busy').length,
        distribution: {
          local: agents.filter(a => a.location === 'local').length,
          cloud: agents.filter(a => a.location === 'cloud').length,
          edge: agents.filter(a => a.location === 'edge').length,
          mobile: agents.filter(a => a.location === 'mobile').length,
          remote: agents.filter(a => a.location === 'remote').length
        }
      },
      platforms: {
        total: 4,
        active: 4,
        names: ['cursor', 'claude-code', 'gemini', 'zai']
      },
      performance: {
        uptime: Math.floor(state.uptime / 1000),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    this.sendJson(res, 200, {
      success: true,
      data: dashboard
    });
  }

  /**
   * Root endpoint
   */
  private handleRoot(req: any, res: any): void {
    const rootInfo = {
      name: 'PHOTON LITE',
      description: 'Cloud Agentic Operations Center - Zero Dependencies Version',
      version: '1.0.0-lite',
      mode: 'in-memory',
      endpoints: {
        health: '/health',
        globalState: '/api/v1/state',
        operations: '/api/v1/operations',
        agents: '/api/v1/agents',
        dashboard: '/api/v1/metrics/dashboard'
      },
      timestamp: new Date().toISOString(),
      features: [
        'Multi-agent coordination',
        'Real-time operation tracking',
        'RESTful API',
        'Zero dependencies',
        'Instant deployment'
      ]
    };

    this.sendJson(res, 200, {
      success: true,
      data: rootInfo
    });
  }

  /**
   * Serve static files from public directory
   */
  private async handleStaticFile(req: any, res: any, path: string): Promise<void> {
    try {
      // Security: Only allow specific files
      const allowedFiles = [
        '/ui-studio.html',
        '/ui-configpro-dashboard.html',
        '/central-mcp-dashboard.html'
      ];

      if (!allowedFiles.includes(path)) {
        this.handle404(req, res);
        return;
      }

      // Construct file path
      const publicDir = join(process.cwd(), 'public');
      const filePath = join(publicDir, path.substring(1)); // Remove leading /

      // Read file
      const content = await readFile(filePath, 'utf-8');

      // Set appropriate content type
      const contentType = path.endsWith('.html') ? 'text/html' : 'text/plain';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);

      log.info(`✅ Served static file: ${path}`);

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        log.warn(`⚠️ File not found: ${path}`);
        this.handle404(req, res);
      } else {
        log.error(`❌ Error serving static file ${path}:`, error);
        this.handleError(req, res, error);
      }
    }
  }

  /**
   * 404 handler
   */
  private handle404(req: any, res: any): void {
    this.sendJson(res, 404, {
      success: false,
      error: 'Endpoint not found',
      path: req.url,
      method: req.method
    });
  }

  /**
   * Error handler
   */
  private handleError(req: any, res: any, error: any): void {
    log.error('Request error:', error);
    this.sendJson(res, 500, {
      success: false,
      error: 'Internal server error'
    });
  }

  /**
   * Send JSON response
   */
  private sendJson(res: any, statusCode: number, data: any): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(async () => {
          log.info('🛑 PHOTON LITE server stopped');
          await this.photonCore.shutdown();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

/**
 * Quick start function
 */
async function quickStart(): Promise<void> {
  log.info('🌟 PHOTON LITE - Cloud Operations Center');
  log.info('==========================================');
  log.info('🚀 Starting revolutionary AI coordination system...');
  log.info('⚡ Zero dependencies - Instant deployment!');
  log.info('');

  const port = parseInt(process.env.PHOTON_PORT || '8080');
  const server = new PhotonServerLite(port);

  try {
    await server.start();

    log.info('');
    log.info('🎉 PHOTON LITE is ready for global AI operations!');
    log.info('📚 Try these commands:');
    log.info(`   curl http://localhost:${port}/health`);
    log.info(`   curl http://localhost:${port}/api/v1/state`);
    log.info(`   curl http://localhost:${port}/api/v1/metrics/dashboard`);
    log.info('');
    log.info('🌍 Welcome to the future of AI operations coordination!');

    // Setup graceful shutdown
    const shutdown = async (signal: string) => {
      log.info(`📡 Received ${signal}, starting graceful shutdown...`);
      await server.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    log.error('💥 Failed to start PHOTON LITE:', error);
    process.exit(1);
  }
}

// Start if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickStart().catch((error) => {
    log.error('💥 Quick start failed:', error);
    process.exit(1);
  });
}

export { PhotonServerLite, quickStart };