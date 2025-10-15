#!/usr/bin/env node

/**
 * 🚀 PHOTON LITE - Instant Cloud Operations Center
 * ==================================================
 *
 * Revolutionary AI coordination platform - ZERO DEPENDENCIES
 * Runs instantly with Node.js - no compilation required!
 */

const http = require('http');
const { parse } = require('url');
const { promises: fs } = require('fs');
const { join, extname, basename } = require('path');

// Simple logger
const log = {
  info: (msg, ...args) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, ...args)
};

// Knowledge Space Cache
let knowledgeSpaceCache = {
  data: null,
  lastUpdated: 0
};

// Knowledge Space Configuration
const KNOWLEDGE_SPACE_CONFIG = {
  rootPath: join(process.cwd(), '03_CONTEXT_FILES', 'SPECIALIZED_KNOWLEDGE_PACKS'),
  enableCache: true,
  cacheDuration: 300, // 5 minutes
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedExtensions: ['.zip', '.md', '.txt', '.json', '.pdf', '.js', '.ts', '.html']
};

/**
 * PHOTON CORE LITE - In-memory coordination engine
 */
class PhotonCoreLite {
  constructor() {
    this.operations = new Map();
    this.agents = new Map();
    this.activeCoordinations = new Map();
    this.startTime = new Date();
    this.metrics = {
      totalOperations: 0,
      completedOperations: 0,
      failedOperations: 0
    };
    this.initializeDefaultData();
    this.startMetricsCollection();
    log.info('🚀 PHOTON CORE LITE initialized - Cloud Agentic Operations Center online');
    log.info('🌍 Ready to coordinate global AI operations (in-memory mode)');
  }

  initializeDefaultData() {
    const defaultAgents = [
      {
        id: 'agent-a-ui',
        name: 'UI Velocity Specialist',
        model: 'GLM-4.6',
        capabilities: ['ui-design', 'react-development', 'prototyping'],
        location: 'cloud',
        status: 'active',
        lastSeen: new Date(),
        currentOperations: [],
        metrics: { operationsCompleted: 0, averageResponseTime: 250, successRate: 95 }
      },
      {
        id: 'agent-b-backend',
        name: 'Backend Services Specialist',
        model: 'Sonnet-4.5',
        capabilities: ['api-development', 'database-design', 'microservices'],
        location: 'edge',
        status: 'active',
        lastSeen: new Date(),
        currentOperations: [],
        metrics: { operationsCompleted: 0, averageResponseTime: 300, successRate: 97 }
      },
      {
        id: 'agent-c-integration',
        name: 'Integration Master',
        model: 'Gemini-2.5-Pro',
        capabilities: ['system-integration', 'deployment', 'testing'],
        location: 'local',
        status: 'active',
        lastSeen: new Date(),
        currentOperations: [],
        metrics: { operationsCompleted: 0, averageResponseTime: 200, successRate: 99 }
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    log.info(`🤖 Registered ${defaultAgents.length} default agents`);
  }

  async registerAgent(agent) {
    agent.lastSeen = new Date();
    this.agents.set(agent.id, agent);
    log.info(`🤖 Agent ${agent.name} (${agent.id}) registered from ${agent.location}`);
  }

  async coordinateAgents(operation) {
    const startTime = Date.now();
    log.info(`🎯 Starting global operation: ${operation.name}`);
    log.info(`   Agents: ${operation.agents.join(', ')}`);
    log.info(`   Platforms: ${operation.platforms?.map(p => p.name).join(', ') || 'simulated'}`);

    const result = {
      operationId: operation.id,
      status: 'in_progress',
      agentsAssigned: operation.agents,
      startTime: new Date(),
      progress: 0
    };

    this.activeCoordinations.set(operation.id, result);
    operation.status = 'in_progress';
    operation.startedAt = new Date();
    this.operations.set(operation.id, operation);

    try {
      // Simulate workflow execution
      for (let i = 0; i < operation.workflow?.length || 3; i++) {
        result.progress = Math.round(((i + 1) / (operation.workflow?.length || 3)) * 80);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second per step
      }

      // Complete operation
      result.status = 'completed';
      result.progress = 100;
      result.results = {
        summary: {
          totalSteps: operation.workflow?.length || 3,
          totalExecutionTime: Date.now() - startTime,
          platformsInvolved: operation.platforms?.map(p => p.name) || ['simulated'],
          agentsInvolved: operation.agents,
          successRate: 100
        }
      };
      result.processingTime = Date.now() - startTime;

      operation.status = 'completed';
      operation.completedAt = new Date();
      operation.results = result.results;

      this.metrics.completedOperations++;
      this.metrics.totalOperations++;

      log.info(`✅ Operation ${operation.name} completed successfully in ${result.processingTime}ms`);

    } catch (error) {
      result.status = 'failed';
      result.errors = [error.message];
      result.processingTime = Date.now() - startTime;

      operation.status = 'failed';
      operation.errors = result.errors;
      operation.completedAt = new Date();

      this.metrics.failedOperations++;
      this.metrics.totalOperations++;

      log.error(`❌ Operation ${operation.name} failed:`, error);
    }

    return result;
  }

  getGlobalState() {
    const activeOperations = Array.from(this.operations.values())
      .filter(op => op.status === 'in_progress').length;
    const systemHealth = this.calculateSystemHealth();
    const uptime = Date.now() - this.startTime.getTime();

    return {
      totalOperations: this.metrics.totalOperations,
      activeOperations,
      completedOperations: this.metrics.completedOperations,
      failedOperations: this.metrics.failedOperations,
      agentCount: this.agents.size,
      platformCount: 4,
      systemHealth,
      lastUpdated: new Date(),
      uptime
    };
  }

  calculateSystemHealth() {
    const activeAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'active').length;
    const totalAgents = this.agents.size;
    const agentHealthRatio = totalAgents > 0 ? activeAgents / totalAgents : 0;

    const failureRate = this.metrics.totalOperations > 0
      ? this.metrics.failedOperations / this.metrics.totalOperations
      : 0;

    if (agentHealthRatio > 0.8 && failureRate < 0.1) return 'healthy';
    if (agentHealthRatio > 0.5 && failureRate < 0.3) return 'degraded';
    return 'critical';
  }

  getAgents() {
    return Array.from(this.agents.values());
  }

  getOperations(status) {
    const allOps = Array.from(this.operations.values());
    return status ? allOps.filter(op => op.status === status) : allOps;
  }

  createOperation(operationData) {
    const operation = {
      ...operationData,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date()
    };

    this.operations.set(operation.id, operation);
    return operation;
  }

  startMetricsCollection() {
    setInterval(() => {
      const uptime = Date.now() - this.startTime.getTime();
      const avgResponseTime = this.calculateAverageResponseTime();

      // Emit metrics event (for monitoring)
      this.emit('metrics', {
        uptime,
        totalOperations: this.metrics.totalOperations,
        completedOperations: this.metrics.completedOperations,
        failedOperations: this.metrics.failedOperations,
        averageResponseTime: avgResponseTime,
        activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active').length
      });
    }, 30000);
  }

  calculateAverageResponseTime() {
    const agents = Array.from(this.agents.values());
    if (agents.length === 0) return 0;

    const totalResponseTime = agents.reduce((sum, agent) => sum + agent.metrics.averageResponseTime, 0);
    return totalResponseTime / agents.length;
  }

  async shutdown() {
    log.info('🛑 Shutting down PHOTON CORE LITE...');
    this.removeAllListeners();
    this.operations.clear();
    this.agents.clear();
    this.activeCoordinations.clear();
    log.info('✅ PHOTON CORE LITE shutdown complete');
  }
}

// Make PhotonCoreLite an EventEmitter
const EventEmitter = require('events');
PhotonCoreLite.prototype.__proto__ = EventEmitter.prototype;
PhotonCoreLite.prototype.emit = EventEmitter.prototype.emit;
PhotonCoreLite.prototype.on = EventEmitter.prototype.on;
PhotonCoreLite.prototype.removeAllListeners = EventEmitter.prototype.removeAllListeners;

/**
 * Simple HTTP server for PHOTON LITE
 */
class PhotonServerLite {
  constructor(port = 8080) {
    this.photonCore = new PhotonCoreLite();
    this.port = port;
  }

  async start() {
    this.server = http.createServer((req, res) => {
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

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          log.error(`❌ Port ${this.port} is already in use`);
        } else {
          log.error('❌ Failed to start server:', error);
        }
        reject(error);
      });
    });
  }

  async handleRequest(req, res) {
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
      if (path === '/health' && method === 'GET') {
        this.handleHealth(req, res);
      } else if (path === '/api/v1/state' && method === 'GET') {
        this.handleGlobalState(req, res);
      } else if (path === '/api/v1/operations' && method === 'GET') {
        this.handleGetOperations(req, res);
      } else if (path === '/api/v1/operations' && method === 'POST') {
        await this.handleCoordinateOperation(req, res);
      } else if (path === '/api/v1/agents' && method === 'GET') {
        this.handleGetAgents(req, res);
      } else if (path === '/api/v1/metrics/dashboard' && method === 'GET') {
        this.handleDashboard(req, res);
      } else if (path === '/api/knowledge/space' && method === 'GET') {
        await this.handleKnowledgeSpace(req, res);
      } else if (path === '/api/knowledge/preview' && method === 'GET') {
        await this.handleFilePreview(req, res);
      } else if (path === '/api/knowledge/readme' && method === 'GET') {
        await this.handleReadmeParser(req, res);
      } else if (path === '/' && method === 'GET') {
        this.handleRoot(req, res);
      } else {
        this.handle404(req, res);
      }
    } catch (error) {
      this.handleError(req, res, error);
    }
  }

  handleHealth(req, res) {
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

  handleGlobalState(req, res) {
    const state = this.photonCore.getGlobalState();
    this.sendJson(res, 200, {
      success: true,
      data: state
    });
  }

  handleGetOperations(req, res) {
    const url = parse(req.url, true);
    const status = url.query.status;
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

  async handleCoordinateOperation(req, res) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const operationData = JSON.parse(body);

        const operation = this.photonCore.createOperation({
          name: operationData.name,
          description: operationData.description,
          priority: operationData.priority || 'medium',
          agents: operationData.agents,
          platforms: operationData.platforms,
          workflow: operationData.workflow
        });

        const result = await this.photonCore.coordinateAgents(operation);

        this.sendJson(res, 200, {
          success: true,
          data: result
        });

      } catch (error) {
        this.sendJson(res, 400, {
          success: false,
          error: error.message || 'Invalid request'
        });
      }
    });
  }

  handleGetAgents(req, res) {
    const agents = this.photonCore.getAgents();
    this.sendJson(res, 200, {
      success: true,
      data: {
        agents,
        total: agents.length
      }
    });
  }

  handleDashboard(req, res) {
    const state = this.photonCore.getGlobalState();
    const agents = this.photonCore.getAgents();

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
        distribution: {
          local: agents.filter(a => a.location === 'local').length,
          cloud: agents.filter(a => a.location === 'cloud').length,
          edge: agents.filter(a => a.location === 'edge').length
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

  async handleKnowledgeSpace(req, res) {
    try {
      const url = parse(req.url, true);
      const query = url.query;

      // Parse query parameters
      const filters = {
        categories: query.categories ? query.categories.split(',') : undefined,
        search: query.search,
        fileTypes: query.fileTypes ? query.fileTypes.split(',') : undefined,
        sortBy: query.sortBy || 'lastModified',
        sortOrder: query.sortOrder || 'desc',
        offset: query.offset ? parseInt(query.offset) : undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        featuredOnly: query.featuredOnly === 'true'
      };

      const knowledgeSpace = await getKnowledgeSpace();

      // Apply filters
      let categories = [...knowledgeSpace.categories];

      if (filters.categories && filters.categories.length > 0) {
        categories = categories.filter(cat => filters.categories.includes(cat.id));
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        categories = categories.map(category => ({
          ...category,
          knowledgePacks: category.knowledgePacks.filter(pack =>
            pack.name.toLowerCase().includes(searchTerm) ||
            pack.description?.toLowerCase().includes(searchTerm)
          )
        })).filter(category => category.knowledgePacks.length > 0);
      }

      if (filters.fileTypes && filters.fileTypes.length > 0) {
        categories = categories.map(category => ({
          ...category,
          knowledgePacks: category.knowledgePacks.filter(pack =>
            filters.fileTypes.includes(pack.extension || '')
          )
        })).filter(category => category.knowledgePacks.length > 0);
      }

      if (filters.featuredOnly) {
        categories = categories.map(category => ({
          ...category,
          knowledgePacks: category.knowledgePacks.filter(pack => pack.featured)
        })).filter(category => category.knowledgePacks.length > 0);
      }

      // Sort knowledge packs within categories
      categories = categories.map(category => ({
        ...category,
        knowledgePacks: [...category.knowledgePacks].sort((a, b) => {
          let comparison = 0;

          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'size':
              comparison = a.size - b.size;
              break;
            case 'lastModified':
              comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
              break;
          }

          return filters.sortOrder === 'asc' ? comparison : -comparison;
        })
      }));

      // Apply pagination
      if (filters.offset || filters.limit) {
        const offset = filters.offset || 0;
        const limit = filters.limit || categories.length;
        categories = categories.slice(offset, offset + limit);
      }

      const response = {
        ...knowledgeSpace,
        categories,
        totalCategories: categories.length,
        totalKnowledgePacks: categories.reduce((sum, cat) => sum + cat.knowledgePacks.length, 0),
        query: filters
      };

      this.sendJson(res, 200, {
        success: true,
        data: response
      });

    } catch (error) {
      log.error('Knowledge Space API error:', error);
      this.sendJson(res, 500, {
        success: false,
        error: 'Failed to retrieve knowledge space data',
        details: error.message
      });
    }
  }

  async handleFilePreview(req, res) {
    try {
      const url = parse(req.url, true);
      const filePath = url.query.path;

      if (!filePath) {
        return this.sendJson(res, 400, {
          success: false,
          error: 'Path parameter is required'
        });
      }

      const fullPath = join(KNOWLEDGE_SPACE_CONFIG.rootPath, filePath);

      // Security check - ensure path is within knowledge space
      if (!fullPath.startsWith(KNOWLEDGE_SPACE_CONFIG.rootPath)) {
        return this.sendJson(res, 403, {
          success: false,
          error: 'Access denied - path outside knowledge space'
        });
      }

      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        // Directory listing
        const files = await fs.readdir(fullPath);
        const fileList = await Promise.all(files.map(async (file) => {
          const filePath = join(fullPath, file);
          const fileStats = await fs.stat(filePath);
          return {
            name: file,
            type: fileStats.isDirectory() ? 'directory' : 'file',
            size: fileStats.size,
            lastModified: fileStats.mtime.toISOString(),
            extension: extname(file).toLowerCase()
          };
        }));

        return this.sendJson(res, 200, {
          success: true,
          data: {
            type: 'directory',
            path: filePath,
            files: fileList,
            totalFiles: files.length
          }
        });
      }

      // File preview
      const extension = extname(filePath).toLowerCase();
      const allowedExtensions = KNOWLEDGE_SPACE_CONFIG.allowedExtensions;

      if (!allowedExtensions.includes(extension)) {
        return this.sendJson(res, 400, {
          success: false,
          error: `File type ${extension} not supported for preview`
        });
      }

      // Handle different file types
      if (stats.size > KNOWLEDGE_SPACE_CONFIG.maxFileSize) {
        return this.sendJson(res, 200, {
          success: true,
          data: {
            type: 'file',
            fileName: basename(filePath),
            fileType: extension,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            previewType: 'too-large',
            content: 'File too large for preview',
            canPreview: false
          }
        });
      }

      let content = '';
      let previewType = 'text';

      if (extension === '.md') {
        content = await fs.readFile(fullPath, 'utf-8');
        previewType = 'markdown';
      } else if (['.txt', '.js', '.ts', '.json', '.html'].includes(extension)) {
        content = await fs.readFile(fullPath, 'utf-8');
        previewType = 'code';
      } else if (['.zip', '.pdf', '.jpg', '.png', '.gif'].includes(extension)) {
        previewType = 'binary';
        content = `Binary file (${extension}) - ${stats.size} bytes`;
      } else {
        content = await fs.readFile(fullPath, 'utf-8');
      }

      this.sendJson(res, 200, {
        success: true,
        data: {
          type: 'file',
          fileName: basename(filePath),
          fileType: extension,
          content: content.substring(0, 10000), // Limit content size
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          previewType: previewType,
          canPreview: true
        }
      });

    } catch (error) {
      log.error('File preview error:', error);
      this.sendJson(res, 500, {
        success: false,
        error: 'Failed to generate file preview',
        details: error.message
      });
    }
  }

  async handleReadmeParser(req, res) {
    try {
      const url = parse(req.url, true);
      const categoryPath = url.query.path;

      if (!categoryPath) {
        return this.sendJson(res, 400, {
          success: false,
          error: 'Path parameter is required'
        });
      }

      const readmePath = join(KNOWLEDGE_SPACE_CONFIG.rootPath, categoryPath, 'README.md');

      try {
        const content = await fs.readFile(readmePath, 'utf-8');

        // Extract title
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : categoryPath;

        // Extract description
        const descMatch = content.match(/##\s+🎯\s+Purpose\s*\n\s*\n(.+?)(?=\n##|\n#|$)/s);
        const description = descMatch ? descMatch[1].trim() : '';

        // Extract key info
        const sections = {};
        const sectionMatches = content.matchAll(/##\s+(.+?)\s*\n([\s\S]*?)(?=##|$)/g);
        for (const match of sectionMatches) {
          sections[match[1]] = match[2].trim();
        }

        this.sendJson(res, 200, {
          success: true,
          data: {
            path: categoryPath,
            title: title,
            description: description,
            sections: sections,
            content: content.substring(0, 5000), // Limit for API
            lastModified: (await fs.stat(readmePath)).mtime.toISOString()
          }
        });

      } catch (fileError) {
        this.sendJson(res, 200, {
          success: true,
          data: {
            path: categoryPath,
            title: categoryPath,
            description: `No README.md found for ${categoryPath}`,
            sections: {},
            content: '',
            error: 'README file not found'
          }
        });
      }

    } catch (error) {
      log.error('README parser error:', error);
      this.sendJson(res, 500, {
        success: false,
        error: 'Failed to parse README',
        details: error.message
      });
    }
  }

  handleRoot(req, res) {
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
        dashboard: '/api/v1/metrics/dashboard',
        knowledgeSpace: '/api/knowledge/space',
        filePreview: '/api/knowledge/preview',
        readmeParser: '/api/knowledge/readme'
      },
      timestamp: new Date().toISOString(),
      features: [
        'Multi-agent coordination',
        'Real-time operation tracking',
        'RESTful API',
        'Knowledge Space management',
        'Zero dependencies',
        'Instant deployment'
      ]
    };

    this.sendJson(res, 200, {
      success: true,
      data: rootInfo
    });
  }

  handle404(req, res) {
    this.sendJson(res, 404, {
      success: false,
      error: 'Endpoint not found',
      path: req.url,
      method: req.method
    });
  }

  handleError(req, res, error) {
    log.error('Request error:', error);
    this.sendJson(res, 500, {
      success: false,
      error: 'Internal server error'
    });
  }

  sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  async stop() {
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
async function quickStart() {
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
    const shutdown = async (signal) => {
      log.info(`📡 Received ${signal}, starting graceful shutdown...`);
      await server.stop();
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
if (require.main === module) {
  quickStart().catch((error) => {
    log.error('💥 Quick start failed:', error);
    process.exit(1);
  });
}

// ============================================================================
// KNOWLEDGE SPACE API IMPLEMENTATION
// ============================================================================

/**
 * Get category icon based on folder name
 */
function getCategoryIcon(categoryName) {
  const iconMap = {
    'voice-systems': '🎤',
    'ai-integration': '🤖',
    'web-development': '🌐',
    'backend-services': '⚙️',
    'deployment': '🚀',
    'miscellaneous': '📚'
  };
  return iconMap[categoryName] || '📁';
}

/**
 * Extract category description from README content
 */
function extractDescription(readmeContent) {
  const lines = readmeContent.split('\n');
  const purposeIndex = lines.findIndex(line =>
    line.toLowerCase().includes('## 🎯 purpose') ||
    line.toLowerCase().includes('## purpose')
  );

  if (purposeIndex !== -1 && lines[purposeIndex + 1]) {
    return lines[purposeIndex + 1].replace(/^This category contains /, '');
  }

  const titleIndex = lines.findIndex(line => line.startsWith('# '));
  if (titleIndex !== -1) {
    for (let i = titleIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('```')) {
        return line;
      }
    }
  }

  return 'Knowledge resources and implementation guides';
}

/**
 * Extract tags from README content
 */
function extractTags(readmeContent) {
  const tags = [];
  const lines = readmeContent.split('\n');

  lines.forEach(line => {
    const match = line.match(/(?:tags?|labels?):\s*(.+)$/i);
    if (match) {
      tags.push(...match[1].split(',').map(t => t.trim()));
    }
  });

  const content = readmeContent.toLowerCase();
  const keywords = [
    'react', 'vue', 'angular', 'nodejs', 'python', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'rest', 'graphql', 'api', 'database', 'security',
    'testing', 'ci/cd', 'deployment', 'monitoring', 'performance', 'webrtc',
    'ai', 'machine learning', 'microservices', 'serverless'
  ];

  keywords.forEach(keyword => {
    if (content.includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  });

  return tags.slice(0, 10);
}

/**
 * Check if a knowledge pack is featured
 */
function isFeaturedPack(fileName) {
  const featuredKeywords = [
    'ultrathink', 'mastery', 'complete', 'ultimate', 'pro', 'advanced',
    'production-ready', 'comprehensive', 'definitive'
  ];
  const name = fileName.toLowerCase();
  return featuredKeywords.some(keyword => name.includes(keyword));
}

/**
 * Generate description from filename
 */
function generateDescription(fileName) {
  const name = basename(fileName, extname(fileName));
  const description = name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/([A-Z])/g, ' $1')
    .trim();

  const ext = extname(fileName);
  const typeMap = {
    '.zip': 'Compressed knowledge pack',
    '.md': 'Documentation',
    '.pdf': 'PDF document',
    '.json': 'JSON data',
    '.js': 'JavaScript code',
    '.ts': 'TypeScript code',
    '.txt': 'Text file',
    '.html': 'HTML file'
  };

  return `${description} - ${typeMap[ext] || 'File'}`;
}

/**
 * Scan directory for knowledge packs
 */
async function scanDirectory(dirPath, relativePath = '') {
  try {
    const entries = await fs.readdir(dirPath);
    const packs = [];

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const entryRelativePath = relativePath ? join(relativePath, entry) : entry;
      const stats = await fs.stat(fullPath);

      if (entry.startsWith('.') || entry === 'node_modules') {
        continue;
      }

      if (stats.isDirectory()) {
        const subPacks = await scanDirectory(fullPath, entryRelativePath);
        packs.push(...subPacks);
      } else {
        const ext = extname(entry);
        if (KNOWLEDGE_SPACE_CONFIG.allowedExtensions.includes(ext)) {
          const pack = {
            name: entry,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            description: generateDescription(entry),
            extension: ext,
            path: entryRelativePath,
            featured: isFeaturedPack(entry)
          };
          packs.push(pack);
        }
      }
    }

    return packs.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });
  } catch (error) {
    log.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Get knowledge space data
 */
async function getKnowledgeSpace() {
  if (KNOWLEDGE_SPACE_CONFIG.enableCache && knowledgeSpaceCache.data) {
    const now = Date.now();
    if (now - knowledgeSpaceCache.lastUpdated < KNOWLEDGE_SPACE_CONFIG.cacheDuration * 1000) {
      return knowledgeSpaceCache.data;
    }
  }

  try {
    const categories = [];
    const entries = await fs.readdir(KNOWLEDGE_SPACE_CONFIG.rootPath);
    let totalKnowledgePacks = 0;
    let totalSize = 0;

    for (const entry of entries) {
      const categoryPath = join(KNOWLEDGE_SPACE_CONFIG.rootPath, entry);
      const stats = await fs.stat(categoryPath);

      if (stats.isDirectory() && !entry.startsWith('.')) {
        let readmeContent = '';
        try {
          const readmePath = join(categoryPath, 'README.md');
          readmeContent = await fs.readFile(readmePath, 'utf-8');
        } catch (error) {
          // README not found
        }

        const knowledgePacks = await scanDirectory(categoryPath);
        const fileCount = knowledgePacks.length;
        const categorySize = knowledgePacks.reduce((sum, pack) => sum + pack.size, 0);

        const category = {
          id: entry,
          name: entry.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          description: extractDescription(readmeContent),
          readmeContent,
          knowledgePacks,
          fileCount,
          totalSize: categorySize,
          lastModified: stats.mtime.toISOString(),
          icon: getCategoryIcon(entry),
          tags: extractTags(readmeContent)
        };

        categories.push(category);
        totalKnowledgePacks += fileCount;
        totalSize += categorySize;
      }
    }

    categories.sort((a, b) => {
      const aFeatured = a.knowledgePacks.some(p => p.featured);
      const bFeatured = b.knowledgePacks.some(p => p.featured);

      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    const response = {
      categories,
      totalCategories: categories.length,
      totalKnowledgePacks,
      totalSize,
      lastUpdated: new Date().toISOString(),
      systemInfo: {
        version: '1.0.0',
        apiVersion: 'v1',
        uptime: process.uptime()
      }
    };

    if (KNOWLEDGE_SPACE_CONFIG.enableCache) {
      knowledgeSpaceCache = {
        data: response,
        lastUpdated: Date.now()
      };
    }

    return response;
  } catch (error) {
    log.error('Error getting knowledge space:', error);
    throw new Error(`Failed to get knowledge space: ${error.message}`);
  }
}

module.exports = { PhotonServerLite, quickStart, getKnowledgeSpace };