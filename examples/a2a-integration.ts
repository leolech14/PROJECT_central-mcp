/**
 * A2A Integration Example
 * ========================
 *
 * Example showing how to integrate A2A Server into Central-MCP
 */

import { createServer } from 'http';
import Database from 'better-sqlite3';
import { A2AServer } from '../src/a2a/A2AServer.js';
import { logger } from '../src/utils/logger.js';

/**
 * Example: Adding A2A to existing HTTP server
 */
async function main() {
  // Create HTTP server (or use existing one)
  const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', timestamp: Date.now() }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  // Initialize database
  const db = new Database('./data/central-mcp.db');

  // Create A2A server on /a2a endpoint
  const a2aServer = new A2AServer(httpServer, db, {
    path: '/a2a',
    enableAuth: true
  });

  // Start HTTP server
  const PORT = 3000;
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server listening on port ${PORT}`);
    logger.info(`📡 MCP endpoint: ws://localhost:${PORT}/mcp`);
    logger.info(`🤝 A2A endpoint: ws://localhost:${PORT}/a2a`);
  });

  // Example: Connect A2A to MCP server
  // a2aServer.setMCPServer(mcpServerInstance);

  // Example: Get statistics
  setInterval(() => {
    const stats = a2aServer.getStats();
    logger.info('📊 A2A Stats:', {
      clients: stats.connectedClients,
      agents: stats.registry.totalAgents,
      online: stats.registry.onlineAgents
    });
  }, 60000); // Every minute

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('🛑 Shutting down...');
    a2aServer.shutdown();
    db.close();
    httpServer.close(() => {
      logger.info('✅ Server shut down gracefully');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  logger.error('❌ Fatal error:', error);
  process.exit(1);
});
