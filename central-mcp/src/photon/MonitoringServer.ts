/**
 * Monitoring HTTP Server
 * ======================
 *
 * HTTP server for the monitoring dashboard
 * Serves static files and monitoring API endpoints
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { Database } from 'better-sqlite3';
import { AutoProactiveEngine } from '../auto-proactive/AutoProactiveEngine.js';
import { MonitoringAPI } from '../api/MonitoringAPI.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class MonitoringServer {
  private app: express.Application;
  private db: Database.Database;
  private engine?: AutoProactiveEngine;
  private port: number;

  constructor(db: Database.Database, engine?: AutoProactiveEngine, port: number = 8000) {
    this.app = express();
    this.db = db;
    this.engine = engine;
    this.port = port;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // CORS
    this.app.use(cors());

    // JSON body parser
    this.app.use(express.json());

    // Static files from public directory
    const publicPath = path.join(__dirname, '../../public');
    this.app.use(express.static(publicPath));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  private setupRoutes() {
    // Register monitoring API
    const monitoringAPI = new MonitoringAPI(this.db, this.engine);
    monitoringAPI.registerRoutes(this.app);

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Root redirect to dashboard
    this.app.get('/', (req, res) => {
      res.redirect('/central-mcp-monitor.html');
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.url
      });
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
      });
    });
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║   📊 Central-MCP Monitoring Dashboard                        ║');
      console.log('╠═══════════════════════════════════════════════════════════════╣');
      console.log(`║   🌐 Dashboard:  http://localhost:${this.port}                    ║`);
      console.log(`║   🌐 External:   http://34.41.115.199:${this.port}                ║`);
      console.log('║   📡 API:        /api/system/status                          ║');
      console.log('║   📡 API:        /api/loops/stats                            ║');
      console.log('║   🔄 Updates:    Real-time (2s interval)                     ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('');
    });
  }

  stop() {
    // Server stop logic if needed
  }
}
