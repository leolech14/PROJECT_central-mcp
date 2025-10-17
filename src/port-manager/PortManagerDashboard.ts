/**
 * PortManagerDashboard - Real-time Port Management Interface
 * ==========================================================
 *
 * Web dashboard for monitoring and managing services across PROJECTS_ALL ecosystem
 * Provides real-time visualization and control over port allocations and IP configurations
 */

import express from 'express';
import { Server } from 'http';
import WebSocket from 'ws';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import { ServiceRegistry, ServiceEntry, PortConflict } from './ServiceRegistry.js';
import { ConfigurationUpdater } from './ConfigurationUpdater.js';
import { ServiceDiscovery } from './ServiceDiscovery.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DashboardConfig {
  port: number;
  host: string;
  enableAuth: boolean;
  authToken?: string;
  enableWebSocket: boolean;
}

export interface DashboardMessage {
  type: 'service_update' | 'conflict_detected' | 'ip_changed' | 'stats_update' | 'error';
  data: any;
  timestamp: Date;
}

export class PortManagerDashboard {
  private app: express.Application;
  private server: Server | null = null;
  private wsServer: WebSocket.Server | null = null;
  private clients: Set<WebSocket> = new Set();
  private isRunning: boolean = false;
  private dashboardTemplate: string;

  constructor(
    private serviceRegistry: ServiceRegistry,
    private configUpdater: ConfigurationUpdater,
    private serviceDiscovery: ServiceDiscovery,
    private config: DashboardConfig = {
      port: 8999,
      host: '0.0.0.0',
      enableAuth: false,
      enableWebSocket: true
    }
  ) {
    this.app = express();
    this.dashboardTemplate = this.loadTemplate('port-manager-dashboard.html');
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Load external HTML template
   */
  private loadTemplate(fileName: string): string {
    const candidates = [
      // compiled layout next to JS (dist/…)
      path.join(__dirname, 'templates', fileName),
      // fallback: project dist layout (if bundler moved files)
      path.join(process.cwd(), 'dist', 'port-manager', 'templates', fileName),
      // dev mode fallback (ts-node / local run)
      path.join(process.cwd(), 'src', 'port-manager', 'templates', fileName),
    ];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          return fs.readFileSync(p, 'utf8');
        }
      } catch (e) {
        // Continue to next candidate
      }
    }
    throw new Error(`Dashboard template not found: ${fileName}`);
  }

  /**
   * Render template with context variables
   */
  private renderTemplate(tpl: string, ctx: Record<string, string>): string {
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in ctx ? String(ctx[k]) : ''));
  }

  /**
   * Start the dashboard server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ Dashboard is already running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        this.isRunning = true;
        logger.info(`🚀 PortManager Dashboard started on http://${this.config.host}:${this.config.port}`);
        logger.info(`📊 Dashboard URL: http://localhost:${this.config.port}/port-manager`);

        // Start background monitoring
        this.startBackgroundMonitoring();

        resolve();
      });

      this.server.on('error', (error) => {
        logger.error('❌ Failed to start dashboard:', error);
        reject(error);
      });
    });
  }

  /**
   * Stop the dashboard server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          logger.info('🛑 PortManager Dashboard stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'dashboard-public')));

    // Authentication middleware
    if (this.config.enableAuth) {
      this.app.use((req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${this.config.authToken}`) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
      });
    }

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`📝 Dashboard request: ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Main dashboard page
    this.app.get('/port-manager', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API Routes

    // Get all services
    this.app.get('/api/services', async (req, res) => {
      try {
        const services = this.serviceRegistry.getAllServices();
        res.json({ success: true, data: services });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get service conflicts
    this.app.get('/api/conflicts', async (req, res) => {
      try {
        const conflicts = this.serviceRegistry.getPortConflicts();
        res.json({ success: true, data: conflicts });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get registry statistics
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = this.serviceRegistry.getStats();
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Update service IP
    this.app.put('/api/services/:id/ip', async (req, res) => {
      try {
        const { id } = req.params;
        const { newIP, reason } = req.body;

        const success = this.serviceRegistry.updateServiceIP(parseInt(id), newIP, reason);

        if (success) {
          this.broadcastMessage({
            type: 'ip_changed',
            data: { serviceId: id, newIP, reason },
            timestamp: new Date()
          });
        }

        res.json({ success, message: success ? 'IP updated successfully' : 'Failed to update IP' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Update service port
    this.app.put('/api/services/:id/port', async (req, res) => {
      try {
        const { id } = req.params;
        const { newPort, reason } = req.body;

        const success = this.serviceRegistry.updateServicePort(parseInt(id), newPort, reason);

        if (success) {
          this.broadcastMessage({
            type: 'service_update',
            data: { serviceId: id, newPort, reason },
            timestamp: new Date()
          });
        }

        res.json({ success, message: success ? 'Port updated successfully' : 'Failed to update port' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Resolve all conflicts
    this.app.post('/api/resolve-conflicts', async (req, res) => {
      try {
        const { dryRun } = req.body;
        const result = await this.configUpdater.resolvePortConflicts(dryRun);

        if (!dryRun && result.success) {
          this.broadcastMessage({
            type: 'conflict_detected',
            data: { resolved: true, count: result.filesUpdated },
            timestamp: new Date()
          });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Global IP update
    this.app.post('/api/update-global-ip', async (req, res) => {
      try {
        const { oldIP, newIP, dryRun } = req.body;
        const result = await this.configUpdater.updateIPAcrossProjects(oldIP, newIP, dryRun);

        if (!dryRun && result.success) {
          this.broadcastMessage({
            type: 'ip_changed',
            data: { oldIP, newIP, filesUpdated: result.filesUpdated },
            timestamp: new Date()
          });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Scan for services
    this.app.post('/api/scan-services', async (req, res) => {
      try {
        const services = await this.serviceDiscovery.scanAllProjects();

        this.broadcastMessage({
          type: 'service_update',
          data: { discovered: services.length, services },
          timestamp: new Date()
        });

        res.json({ success: true, data: services });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Validate configuration integrity
    this.app.get('/api/validate', async (req, res) => {
      try {
        const validation = await this.configUpdater.validateConfigurationIntegrity();
        res.json({ success: true, data: validation });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  private setupWebSocket(): void {
    if (!this.config.enableWebSocket) {
      return;
    }

    this.wsServer = new WebSocket.Server({
      server: this.server,
      path: '/ws'
    });

    this.wsServer.on('connection', (ws) => {
      logger.info('🔌 Dashboard WebSocket client connected');
      this.clients.add(ws);

      // Send initial data
      this.sendInitialData(ws);

      ws.on('close', () => {
        logger.info('🔌 Dashboard WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('❌ WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private sendInitialData(ws: WebSocket): void {
    try {
      const services = this.serviceRegistry.getAllServices();
      const conflicts = this.serviceRegistry.getPortConflicts();
      const stats = this.serviceRegistry.getStats();

      ws.send(JSON.stringify({
        type: 'initial_data',
        data: { services, conflicts, stats },
        timestamp: new Date()
      }));
    } catch (error) {
      logger.error('❌ Failed to send initial data:', error);
    }
  }

  private broadcastMessage(message: DashboardMessage): void {
    if (!this.config.enableWebSocket || this.clients.size === 0) {
      return;
    }

    const messageStr = JSON.stringify(message);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          logger.error('❌ Failed to send WebSocket message:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  private startBackgroundMonitoring(): void {
    // Monitor for changes every 30 seconds
    setInterval(async () => {
      try {
        const stats = this.serviceRegistry.getStats();
        const conflicts = this.serviceRegistry.getPortConflicts();

        this.broadcastMessage({
          type: 'stats_update',
          data: { stats, conflicts },
          timestamp: new Date()
        });

        // Check for IP changes
        const ipChanges = await this.serviceDiscovery.monitorIPChanges();
        for (const change of ipChanges) {
          this.broadcastMessage({
            type: 'ip_changed',
            data: change,
            timestamp: new Date()
          });
        }

      } catch (error) {
        logger.error('❌ Background monitoring error:', error);
        this.broadcastMessage({
          type: 'error',
          data: { message: error.message },
          timestamp: new Date()
        });
      }
    }, 30000);

    logger.info('🔄 Background monitoring started');
  }

  private generateDashboardHTML(): string {
    const services = this.serviceRegistry.getAllServices();
    return this.renderTemplate(this.dashboardTemplate, {
      SERVICES_JSON: JSON.stringify(services, null, 2),
      VERSION: '2.0.0'
    });
  }

}
