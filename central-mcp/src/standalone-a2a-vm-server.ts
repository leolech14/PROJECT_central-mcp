/**
 * Standalone A2A + VM Tools Server
 * ==================================
 *
 * Lightweight server running A2A Protocol and VM Tools
 * without full PHOTON system dependencies
 */

import { createServer } from 'http';
import Database from 'better-sqlite3';
import { A2AServer } from './a2a/A2AServer.js';
import { getVMTools } from './tools/vm/index.js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
config({ path: path.join(__dirname, '../.env.production') });

const PORT = parseInt(process.env.PHOTON_PORT || '3000');
const HOST = '0.0.0.0';

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  Central-MCP: A2A Protocol + VM Tools Server          ║');
console.log('║  Lightweight standalone deployment                     ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');
console.log(`📡 Starting server on ${HOST}:${PORT}...`);
console.log('');

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      features: {
        a2a: true,
        vmTools: true
      }
    }));
    return;
  }

  // Root endpoint
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Central-MCP A2A + VM Tools Server',
      version: '1.0.0',
      endpoints: {
        a2a: `ws://${HOST}:${PORT}/a2a`,
        health: `http://${HOST}:${PORT}/health`
      },
      features: {
        a2a: 'Agent2Agent cross-framework protocol',
        vmTools: ['executeBash', 'readVMFile', 'writeVMFile', 'listVMDirectory']
      }
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Initialize database
const dbPath = process.env.PHOTON_DB_PATH || './data/central-mcp.db';
console.log(`📊 Opening database: ${dbPath}`);
const db = new Database(dbPath);

// Initialize VM Tools
console.log('🖥️  Initializing VM Tools...');
const vmTools = getVMTools();
console.log(`✅ VM Tools initialized: ${vmTools.length} tools available`);
vmTools.forEach(tool => {
  console.log(`   - ${tool.name}: ${tool.description}`);
});
console.log('');

// Initialize A2A Server
console.log('🤝 Initializing Agent2Agent (A2A) Protocol Server...');
const a2aServer = new A2AServer(httpServer, db, {
  path: process.env.A2A_PATH || '/a2a',
  enableAuth: process.env.A2A_AUTH_ENABLED === 'true'
});
console.log('✅ A2A Server initialized');
console.log(`   - Protocol: Agent2Agent v1.0`);
console.log(`   - WebSocket endpoint: ws://${HOST}:${PORT}${process.env.A2A_PATH || '/a2a'}`);
console.log(`   - Authentication: ${process.env.A2A_AUTH_ENABLED === 'true' ? 'Enabled (JWT/API Key)' : 'Disabled'}`);
console.log(`   - Supported frameworks: Google ADK, LangGraph, Crew.ai, MCP, Custom`);
console.log('');

// Start HTTP server
httpServer.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           🎉 SERVER RUNNING! 🎉                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Central-MCP Server listening on ${HOST}:${PORT}`);
  console.log('');
  console.log('📍 Available Endpoints:');
  console.log(`   - A2A Protocol:  ws://${HOST}:${PORT}/a2a`);
  console.log(`   - Health Check:  http://${HOST}:${PORT}/health`);
  console.log(`   - Server Info:   http://${HOST}:${PORT}/`);
  console.log('');
  console.log('🛠️  VM Tools Available (via A2A/MCP):');
  console.log('   - executeBash: Execute terminal commands on VM');
  console.log('   - readVMFile: Read files from VM filesystem');
  console.log('   - writeVMFile: Write files to VM filesystem');
  console.log('   - listVMDirectory: List VM directory contents');
  console.log('');
  console.log('🚀 Ready to coordinate agents across ANY framework!');
  console.log('');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('');
  console.log('🛑 Shutting down server...');

  // Close A2A server
  if (a2aServer) {
    a2aServer.shutdown();
    console.log('✅ A2A Server closed');
  }

  // Close database
  if (db) {
    db.close();
    console.log('✅ Database closed');
  }

  // Close HTTP server
  httpServer.close(() => {
    console.log('✅ HTTP Server closed');
    console.log('👋 Goodbye!');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown);

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
