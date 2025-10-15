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
import path from 'path';
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
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
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
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Port Manager V2 - PROJECTS_ALL Ecosystem</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            /* OKLCH Color System - Matching Central-MCP Design */
            --bg: oklch(0.96 0.01 250);
            --surface: oklch(1 0.01 250);
            --surface-2: oklch(0.98 0.01 250);
            --surface-3: oklch(0.95 0.01 250);
            --text: oklch(0.15 0.02 250);
            --text-2: oklch(0.35 0.02 250);
            --accent: oklch(0.65 0.2 250);
            --accent-hover: oklch(0.55 0.25 250);
            --success: oklch(0.65 0.2 145);
            --warning: oklch(0.75 0.15 65);
            --error: oklch(0.65 0.2 25);
            --border: oklch(0.85 0.02 250);
            --shadow: 0 4px 6px -1px oklch(0.2 0.03 250 / 0.1);
            --shadow-lg: 0 10px 15px -3px oklch(0.2 0.03 250 / 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            min-height: 100vh;
        }

        /* Header Styles */
        .header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            box-shadow: var(--shadow);
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .header-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .header-title h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text);
        }

        .header-title p {
            font-size: 0.875rem;
            color: var(--text-2);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        /* Button Styles */
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-primary {
            background: var(--accent);
            color: white;
        }

        .btn-primary:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow);
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .btn-success:hover {
            background: oklch(0.55 0.25 145);
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: var(--surface-2);
            color: var(--text);
            border: 1px solid var(--border);
        }

        .btn-secondary:hover {
            background: var(--surface-3);
        }

        /* Card Styles */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            padding: 1.5rem;
            box-shadow: var(--shadow);
            transition: all 0.2s ease;
        }

        .card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .stat-content h3 {
            font-size: 0.875rem;
            color: var(--text-2);
            margin-bottom: 0.25rem;
        }

        .stat-content p {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text);
        }

        .stat-icon {
            width: 3rem;
            height: 3rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }

        .stat-icon.blue { background: oklch(0.9 0.1 250); color: oklch(0.6 0.2 250); }
        .stat-icon.green { background: oklch(0.9 0.1 145); color: var(--success); }
        .stat-icon.red { background: oklch(0.9 0.1 25); color: var(--error); }
        .stat-icon.purple { background: oklch(0.9 0.1 280); color: oklch(0.6 0.2 280); }

        /* Alert Styles */
        .alert {
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .alert-warning {
            background: oklch(0.98 0.05 65);
            border: 1px solid oklch(0.9 0.1 65);
            color: oklch(0.4 0.15 65);
        }

        .alert-success {
            background: oklch(0.98 0.05 145);
            border: 1px solid oklch(0.9 0.1 145);
            color: var(--success);
        }

        .alert-error {
            background: oklch(0.98 0.05 25);
            border: 1px solid oklch(0.9 0.1 25);
            color: var(--error);
        }

        /* Table Styles */
        .table-container {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: var(--shadow);
        }

        .table-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .table-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text);
        }

        .table-controls {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .search-input {
            padding: 0.5rem 0.75rem;
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            background: var(--surface-2);
            color: var(--text);
            font-size: 0.875rem;
            width: 200px;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px oklch(0.6 0.2 250 / 0.1);
        }

        select {
            padding: 0.5rem 0.75rem;
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            background: var(--surface-2);
            color: var(--text);
            font-size: 0.875rem;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: var(--surface-2);
        }

        th {
            padding: 1rem 1.5rem;
            text-align: left;
            font-weight: 600;
            color: var(--text);
            font-size: 0.875rem;
            border-bottom: 1px solid var(--border);
        }

        td {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
        }

        tbody tr {
            transition: background-color 0.2s ease;
        }

        tbody tr:hover {
            background: var(--surface-2);
        }

        /* Status Indicators */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .status-active {
            background: oklch(0.9 0.1 145);
            color: var(--success);
        }

        .status-inactive {
            background: oklch(0.95 0.01 250);
            color: var(--text-2);
        }

        .status-conflict {
            background: oklch(0.9 0.1 25);
            color: var(--error);
            animation: pulse 2s infinite;
        }

        .status-unknown {
            background: oklch(0.9 0.1 65);
            color: var(--warning);
        }

        /* Connection Status */
        .connection-status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .status-dot.connected {
            background: var(--success);
        }

        .status-dot.disconnected {
            background: var(--error);
        }

        /* Modal Styles */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: oklch(0.2 0.03 250 / 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
        }

        .modal-content {
            background: var(--surface);
            border-radius: 1rem;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            box-shadow: var(--shadow-lg);
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 1.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text);
            margin-bottom: 0.5rem;
        }

        .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            background: var(--surface-2);
            color: var(--text);
            font-size: 0.875rem;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px oklch(0.6 0.2 250 / 0.1);
        }

        .modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
        }

        /* Global Actions */
        .global-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .global-actions-row {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }

        /* Animations */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* Notification Toast */
        .notification {
            position: fixed;
            top: 1rem;
            right: 1rem;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 100;
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s ease;
        }

        .notification.success { background: var(--success); }
        .notification.error { background: var(--error); }
        .notification.warning { background: var(--warning); }
        .notification.info { background: var(--accent); }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
                align-items: flex-start;
            }

            .header-actions {
                width: 100%;
                justify-content: space-between;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .global-actions {
                grid-template-columns: 1fr;
            }

            .table-controls {
                flex-direction: column;
                width: 100%;
            }

            .search-input {
                width: 100%;
            }

            .table-container {
                overflow-x: auto;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="header-title">
                <i class="fas fa-network-wired" style="font-size: 1.5rem; color: var(--accent);"></i>
                <div>
                    <h1>Port Manager V2</h1>
                    <p>PROJECTS_ALL Ecosystem Management</p>
                </div>
            </div>
            <div class="header-actions">
                <button onclick="refreshData()" class="btn btn-secondary">
                    <i class="fas fa-sync-alt"></i>Refresh
                </button>
                <button onclick="scanServices()" class="btn btn-success">
                    <i class="fas fa-search"></i>Scan Services
                </button>
                <div class="connection-status">
                    <span>Status:</span>
                    <span id="connection-status">
                        <span class="status-dot connected"></span>
                        Connected
                    </span>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="card">
                <div class="stat-card">
                    <div class="stat-content">
                        <h3>Total Services</h3>
                        <p id="total-services">-</p>
                    </div>
                    <div class="stat-icon blue">
                        <i class="fas fa-server"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="stat-card">
                    <div class="stat-content">
                        <h3>Active Services</h3>
                        <p id="active-services" style="color: var(--success);">-</p>
                    </div>
                    <div class="stat-icon green">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="stat-card">
                    <div class="stat-content">
                        <h3>Conflicts</h3>
                        <p id="conflict-count" style="color: var(--error);">-</p>
                    </div>
                    <div class="stat-icon red">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="stat-card">
                    <div class="stat-content">
                        <h3>Unique IPs</h3>
                        <p id="unique-ips">-</p>
                    </div>
                    <div class="stat-icon purple">
                        <i class="fas fa-globe"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Global Actions -->
        <div class="card">
            <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Global Actions</h2>
            <div class="global-actions">
                <div class="global-actions-row">
                    <input type="text" id="old-ip" placeholder="Old IP (e.g., 34.41.115.199)"
                           class="form-input" style="flex: 1;">
                    <input type="text" id="new-ip" placeholder="New IP (e.g., 136.112.123.243)"
                           class="form-input" style="flex: 1;">
                    <button onclick="updateGlobalIP()" class="btn btn-primary">Update All</button>
                </div>
                <div class="global-actions-row">
                    <button onclick="resolveConflicts(false)" class="btn btn-secondary">
                        <i class="fas fa-magic"></i>Resolve Conflicts
                    </button>
                    <button onclick="validateConfigs()" class="btn btn-secondary">
                        <i class="fas fa-check-circle"></i>Validate Configs
                    </button>
                </div>
            </div>
        </div>

        <!-- Conflicts Alert -->
        <div id="conflicts-alert" class="alert alert-warning" style="display: none;">
            <div>
                <h3 style="font-weight: 600; margin-bottom: 0.25rem;">
                    <i class="fas fa-exclamation-triangle"></i>Port Conflicts Detected
                </h3>
                <p id="conflicts-description" style="font-size: 0.875rem;"></p>
            </div>
            <button onclick="resolveConflicts(false)" class="btn btn-secondary">Resolve All</button>
        </div>

        <!-- Services Table -->
        <div class="table-container">
            <div class="table-header">
                <h2 class="table-title">Services</h2>
                <div class="table-controls">
                    <input type="text" id="search-services" placeholder="Search services..."
                           onkeyup="filterServices()"
                           class="search-input">
                    <select id="status-filter" onchange="filterServices()">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="conflict">Conflict</option>
                        <option value="unknown">Unknown</option>
                    </select>
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Service</th>
                            <th>IP</th>
                            <th>Port</th>
                            <th>Protocol</th>
                            <th>Status</th>
                            <th>Config Files</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="services-table-body">
                        <!-- Services will be populated here -->
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Modals -->
    <div id="edit-service-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3 class="modal-title">Edit Service</h3>
            <div class="form-group">
                <label class="form-label">IP Address</label>
                <input type="text" id="edit-ip" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Port</label>
                <input type="number" id="edit-port" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Reason</label>
                <input type="text" id="edit-reason" placeholder="Update reason..." class="form-input">
            </div>
            <div class="modal-actions">
                <button onclick="closeEditModal()" class="btn btn-secondary">Cancel</button>
                <button onclick="saveServiceEdit()" class="btn btn-primary">Save</button>
            </div>
        </div>
    </div>

    <script>
        let currentServices = [];
        let currentConflicts = [];
        let currentEditingService = null;
        let ws = null;

        // Initialize WebSocket connection
        function initWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                updateConnectionStatus(true);
                console.log('WebSocket connected');
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };

            ws.onclose = () => {
                updateConnectionStatus(false);
                console.log('WebSocket disconnected');
                // Try to reconnect after 5 seconds
                setTimeout(initWebSocket, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                updateConnectionStatus(false);
            };
        }

        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'initial_data':
                    updateDashboard(message.data.services, message.data.conflicts, message.data.stats);
                    break;
                case 'stats_update':
                    updateStats(message.data.stats);
                    updateConflicts(message.data.conflicts);
                    break;
                case 'service_update':
                    refreshData();
                    break;
                case 'conflict_detected':
                    showNotification('Port conflicts updated', 'warning');
                    refreshData();
                    break;
                case 'ip_changed':
                    showNotification('IP configuration updated', 'info');
                    refreshData();
                    break;
                case 'error':
                    showNotification(message.data.message, 'error');
                    break;
            }
        }

        function updateConnectionStatus(connected) {
            const statusEl = document.getElementById('connection-status');
            if (connected) {
                statusEl.innerHTML = '<span class="status-dot connected"></span> Connected';
            } else {
                statusEl.innerHTML = '<span class="status-dot disconnected"></span> Disconnected';
            }
        }

        // API functions
        async function fetchAPI(endpoint, method = 'GET', data = null) {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(\`/api\${endpoint}\`, options);
            return await response.json();
        }

        async function refreshData() {
            try {
                const [servicesRes, conflictsRes, statsRes] = await Promise.all([
                    fetchAPI('/services'),
                    fetchAPI('/conflicts'),
                    fetchAPI('/stats')
                ]);

                if (servicesRes.success && conflictsRes.success && statsRes.success) {
                    updateDashboard(servicesRes.data, conflictsRes.data, statsRes.data);
                }
            } catch (error) {
                console.error('Failed to refresh data:', error);
                showNotification('Failed to refresh data', 'error');
            }
        }

        function updateDashboard(services, conflicts, stats) {
            currentServices = services;
            currentConflicts = conflicts;

            updateStats(stats);
            updateServicesTable(services);
            updateConflicts(conflicts);
        }

        function updateStats(stats) {
            document.getElementById('total-services').textContent = stats.totalServices || 0;
            document.getElementById('active-services').textContent = stats.activeServices || 0;
            document.getElementById('conflict-count').textContent = stats.conflictCount || 0;
            document.getElementById('unique-ips').textContent = stats.uniqueIPs || 0;
        }

        function updateServicesTable(services) {
            const tbody = document.getElementById('services-table-body');
            tbody.innerHTML = '';

            services.forEach(service => {
                const row = createServiceRow(service);
                tbody.appendChild(row);
            });
        }

        function createServiceRow(service) {
            const row = document.createElement('tr');
            row.id = \`service-\${service.id}\`;

            const statusClass = \`status-badge status-\${service.config.status}\`;
            const protocolIcon = service.protocol === 'ws' ? 'fa-plug' : 'fa-globe';

            row.innerHTML = \`
                <td>
                    <span style="font-weight: 500; font-size: 0.875rem;">\${service.projectId}</span>
                </td>
                <td>
                    <span style="font-size: 0.875rem;">\${service.serviceName}</span>
                </td>
                <td>
                    <span style="font-family: monospace; font-size: 0.875rem;">\${service.externalIP}</span>
                </td>
                <td>
                    <span style="font-family: monospace; font-size: 0.875rem;">\${service.externalPort}</span>
                </td>
                <td>
                    <i class="fas \${protocolIcon}" style="font-size: 0.75rem; color: var(--text-2);"></i>
                    <span style="font-size: 0.875rem; margin-left: 0.25rem;">\${service.protocol.toUpperCase()}</span>
                </td>
                <td>
                    <span class="\${statusClass}">
                        <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 0.25rem;"></i>
                        \${service.config.status}
                    </span>
                </td>
                <td>
                    <span style="font-size: 0.75rem; color: var(--text-2);">
                        \${service.config.configFiles.length} files
                    </span>
                </td>
                <td>
                    <button onclick="editService(\${service.id})"
                            class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="viewServiceDetails(\${service.id})"
                            class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            \`;

            return row;
        }

        function updateConflicts(conflicts) {
            const alertEl = document.getElementById('conflicts-alert');
            const descEl = document.getElementById('conflicts-description');

            if (conflicts.length > 0) {
                alertEl.style.display = 'flex';
                descEl.textContent = \`Found \${conflicts.length} port conflicts that need resolution\`;
            } else {
                alertEl.style.display = 'none';
            }
        }

        function filterServices() {
            const searchTerm = document.getElementById('search-services').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;

            const filteredServices = currentServices.filter(service => {
                const matchesSearch = !searchTerm ||
                    service.projectId.toLowerCase().includes(searchTerm) ||
                    service.serviceName.toLowerCase().includes(searchTerm) ||
                    service.externalIP.includes(searchTerm);

                const matchesStatus = !statusFilter || service.config.status === statusFilter;

                return matchesSearch && matchesStatus;
            });

            updateServicesTable(filteredServices);
        }

        async function editService(serviceId) {
            const service = currentServices.find(s => s.id === serviceId);
            if (!service) return;

            currentEditingService = service;
            document.getElementById('edit-ip').value = service.externalIP;
            document.getElementById('edit-port').value = service.externalPort;
            document.getElementById('edit-reason').value = '';

            document.getElementById('edit-service-modal').style.display = 'flex';
        }

        function closeEditModal() {
            document.getElementById('edit-service-modal').style.display = 'none';
            currentEditingService = null;
        }

        async function saveServiceEdit() {
            if (!currentEditingService) return;

            const newIP = document.getElementById('edit-ip').value;
            const newPort = parseInt(document.getElementById('edit-port').value);
            const reason = document.getElementById('edit-reason').value;

            try {
                const promises = [];

                if (newIP !== currentEditingService.externalIP) {
                    promises.push(fetchAPI(\`/services/\${currentEditingService.id}/ip\`, 'PUT', {
                        newIP,
                        reason: reason || 'Manual IP update'
                    }));
                }

                if (newPort !== currentEditingService.externalPort) {
                    promises.push(fetchAPI(\`/services/\${currentEditingService.id}/port\`, 'PUT', {
                        newPort,
                        reason: reason || 'Manual port update'
                    }));
                }

                await Promise.all(promises);
                closeEditModal();
                refreshData();
                showNotification('Service updated successfully', 'success');

            } catch (error) {
                console.error('Failed to update service:', error);
                showNotification('Failed to update service', 'error');
            }
        }

        async function scanServices() {
            try {
                showNotification('Scanning services...', 'info');
                const result = await fetchAPI('/scan-services', 'POST');

                if (result.success) {
                    showNotification(\`Discovered \${result.data.length} services\`, 'success');
                    refreshData();
                } else {
                    showNotification('Service scan failed', 'error');
                }
            } catch (error) {
                console.error('Service scan failed:', error);
                showNotification('Service scan failed', 'error');
            }
        }

        async function resolveConflicts(dryRun = false) {
            try {
                const result = await fetchAPI('/resolve-conflicts', 'POST', { dryRun });

                if (result.success) {
                    if (dryRun) {
                        showNotification(\`Would resolve conflicts in \${result.filesUpdated} files\`, 'info');
                    } else {
                        showNotification(\`Resolved conflicts in \${result.filesUpdated} files\`, 'success');
                        refreshData();
                    }
                } else {
                    showNotification('Failed to resolve conflicts', 'error');
                }
            } catch (error) {
                console.error('Conflict resolution failed:', error);
                showNotification('Failed to resolve conflicts', 'error');
            }
        }

        async function updateGlobalIP() {
            const oldIP = document.getElementById('old-ip').value;
            const newIP = document.getElementById('new-ip').value;

            if (!oldIP || !newIP) {
                showNotification('Please provide both old and new IP addresses', 'error');
                return;
            }

            if (oldIP === newIP) {
                showNotification('Old and new IP addresses are the same', 'error');
                return;
            }

            if (!confirm(\`This will update all references from \${oldIP} to \${newIP} across all projects. Continue?\`)) {
                return;
            }

            try {
                showNotification('Updating global IP...', 'info');
                const result = await fetchAPI('/update-global-ip', 'POST', {
                    oldIP,
                    newIP,
                    dryRun: false
                });

                if (result.success) {
                    showNotification(\`Updated \${result.filesUpdated} files across ecosystem\`, 'success');
                    refreshData();
                } else {
                    showNotification(\`Failed: \${result.errors.join(', ')}`, 'error');
                }
            } catch (error) {
                console.error('Global IP update failed:', error);
                showNotification('Global IP update failed', 'error');
            }
        }

        async function validateConfigs() {
            try {
                const result = await fetchAPI('/validate');

                if (result.success) {
                    if (result.data.valid) {
                        showNotification('All configurations are valid', 'success');
                    } else {
                        showNotification(\`Found \${result.data.issues.length} configuration issues\`, 'warning');
                    }
                } else {
                    showNotification('Configuration validation failed', 'error');
                }
            } catch (error) {
                console.error('Validation failed:', error);
                showNotification('Configuration validation failed', 'error');
            }
        }

        function viewServiceDetails(serviceId) {
            const service = currentServices.find(s => s.id === serviceId);
            if (!service) return;

            alert(\`Service Details:\\n\\nProject: \${service.projectId}\\nService: \${service.serviceName}\\nIP: \${service.externalIP}\\nPort: \${service.externalPort}\\nProtocol: \${service.protocol}\\nStatus: \${service.config.status}\\nConfig Files: \${service.config.configFiles.join(', ')}\`);
        }

        function showNotification(message, type = 'info') {
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                warning: 'bg-orange-600',
                info: 'bg-blue-600'
            };

            const notification = document.createElement('div');
            notification.className = \`fixed top-4 right-4 \${colors[type]} text-white px-4 py-2 rounded shadow-lg z-50\`;
            notification.textContent = message;

            document.body.appendChild(notification);

            setTimeout(() => {
                document.body.removeChild(notification);
            }, 5000);
        }

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            initWebSocket();
            refreshData();
        });
    </script>
</body>
</html>`;
  }
}