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
import Database from 'better-sqlite3';
import { AutoProactiveEngine } from '../auto-proactive/AutoProactiveEngine.js';
import { MonitoringAPI } from '../api/MonitoringAPI.js';
import { ModelDetectionAPI } from '../api/model-detection-api.js';
import { AgentRealityAPI } from '../api/agent-reality-api.js';
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

    // 🚀 INTEGRATION: Register Model Detection API
    const modelDetectionAPI = new ModelDetectionAPI(this.db);
    this.app.get('/api/model-detection/current', modelDetectionAPI.detectCurrentModel.bind(modelDetectionAPI));
    this.app.get('/api/model-detection/verify-context', modelDetectionAPI.verifyContextWindow.bind(modelDetectionAPI));
    this.app.get('/api/model-detection/agent-mapping', modelDetectionAPI.getAgentMapping.bind(modelDetectionAPI));
    this.app.get('/api/model-detection/config-analysis', modelDetectionAPI.analyzeConfiguration.bind(modelDetectionAPI));
    this.app.get('/api/model-detection/history', modelDetectionAPI.getDetectionHistory.bind(modelDetectionAPI));
    this.app.post('/api/model-detection/force-detection', modelDetectionAPI.forceDetection.bind(modelDetectionAPI));

    // 🛡️ INTEGRATION: Register Agent Reality API
    const agentRealityAPI = new AgentRealityAPI(this.db);
    this.app.get('/api/agent-reality/check/:agentLetter', agentRealityAPI.checkAgentReality.bind(agentRealityAPI));
    this.app.get('/api/agent-reality/exploration-verify', agentRealityAPI.verifyExplorationReality.bind(agentRealityAPI));
    this.app.get('/api/agent-reality/temporal-disclaimer/:agentLetter', agentRealityAPI.getTemporalDisclaimer.bind(agentRealityAPI));
    this.app.get('/api/agent-reality/reality-dashboard', agentRealityAPI.getRealityDashboard.bind(agentRealityAPI));
    this.app.get('/api/agent-reality/educational-warnings', agentRealityAPI.getEducationalWarnings.bind(agentRealityAPI));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        integrations: {
          modelDetectionAPI: true,
          agentRealityAPI: true
        }
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
        path: req.url,
        availableEndpoints: [
          '/api/model-detection/current',
          '/api/agent-reality/check/:agentLetter',
          '/health'
        ]
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
