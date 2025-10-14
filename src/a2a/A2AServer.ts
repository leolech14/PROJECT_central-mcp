/**
 * A2A Server
 * ===========
 *
 * Main server for Agent2Agent protocol
 * Integrates registry, router, bridge, and transport layers
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { A2AAgentRegistry } from './AgentRegistry.js';
import { A2AMessageRouter } from './MessageRouter.js';
import { A2AMCPBridge } from './MCPBridge.js';
import { A2AWebSocketTransport } from './WebSocketTransport.js';
import { A2AMessage, A2AAgent, A2AFramework } from './types.js';
import { authenticateWebSocket } from '../auth/middleware/authenticateWebSocket.js';
import { TokenManager } from '../auth/TokenManager.js';
import { ApiKeyManager } from '../auth/ApiKeyManager.js';

export interface A2AServerConfig {
  port?: number;
  path?: string;
  enableAuth?: boolean;
}

export class A2AServer {
  private wss: WebSocketServer;
  private registry: A2AAgentRegistry;
  private router: A2AMessageRouter;
  private bridge: A2AMCPBridge;
  private transport: A2AWebSocketTransport;
  private tokenManager?: TokenManager;
  private apiKeyManager?: ApiKeyManager;
  private clients: Map<string, WebSocket> = new Map();

  constructor(
    httpServer: HTTPServer,
    db: Database.Database,
    config: A2AServerConfig = {}
  ) {
    const { path = '/a2a', enableAuth = false } = config;

    // Initialize WebSocket server
    this.wss = new WebSocketServer({
      server: httpServer,
      path
    });

    // Initialize A2A components
    this.transport = new A2AWebSocketTransport();
    this.registry = new A2AAgentRegistry(db);
    this.bridge = new A2AMCPBridge();
    this.router = new A2AMessageRouter(this.registry, this.bridge, this.transport);

    // Setup authentication if enabled
    if (enableAuth) {
      this.tokenManager = new TokenManager();
      this.apiKeyManager = new ApiKeyManager(db);
    }

    // Setup WebSocket handlers
    this.setupWebSocketHandlers();

    // Setup transport message handler
    this.transport.onMessage((message) => {
      this.handleIncomingA2AMessage(message);
    });

    logger.info(`🚀 A2A Server initialized on ${path}`);
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
      const clientId = uuidv4();

      try {
        // Authenticate connection if auth enabled
        if (this.tokenManager && this.apiKeyManager) {
          const authResult = await authenticateWebSocket(
            request,
            this.tokenManager,
            this.apiKeyManager
          );

          if (!authResult.authenticated) {
            logger.warn('❌ Unauthorized A2A connection attempt');
            ws.close(1008, 'Unauthorized');
            return;
          }

          logger.info(`✅ Authenticated A2A connection: ${authResult.agentId}`);
        }

        // Store client connection
        this.clients.set(clientId, ws);

        logger.info(`🔌 A2A client connected: ${clientId}`);

        // Handle messages
        ws.on('message', async (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString()) as A2AMessage;
            await this.handleClientMessage(clientId, message);
          } catch (error) {
            logger.error(`❌ Failed to handle A2A message from ${clientId}:`, error);
            this.sendError(ws, 'Invalid message format');
          }
        });

        // Handle disconnection
        ws.on('close', () => {
          this.clients.delete(clientId);
          logger.info(`🔌 A2A client disconnected: ${clientId}`);
        });

        // Handle errors
        ws.on('error', (error) => {
          logger.error(`❌ WebSocket error for ${clientId}:`, error);
        });

        // Send welcome message
        this.sendWelcome(ws);

      } catch (error) {
        logger.error('❌ Connection setup error:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  /**
   * Handle message from connected client
   */
  private async handleClientMessage(clientId: string, message: A2AMessage): Promise<void> {
    logger.debug(`📥 Received A2A message from client ${clientId}: ${message.content.type}`);

    // Handle special message types
    if (message.content.type === 'handshake') {
      await this.handleHandshake(clientId, message);
      return;
    }

    if (message.content.type === 'heartbeat') {
      await this.handleHeartbeat(message);
      return;
    }

    if (message.content.type === 'capability_discovery') {
      await this.handleDiscovery(clientId, message);
      return;
    }

    // Route message
    const result = await this.router.route(message);

    // Send acknowledgment to sender
    const ws = this.clients.get(clientId);
    if (ws) {
      this.sendAcknowledgment(ws, message.id, result.success);
    }
  }

  /**
   * Handle incoming A2A message from transport
   */
  private async handleIncomingA2AMessage(message: A2AMessage): Promise<void> {
    logger.debug(`📨 Handling incoming A2A message: ${message.content.type}`);

    // Route message
    await this.router.route(message);
  }

  /**
   * Handle agent handshake
   */
  private async handleHandshake(clientId: string, message: A2AMessage): Promise<void> {
    try {
      const { name, framework, capabilities, version, llm } = message.content.payload;

      // Register agent
      const agent = {
        id: message.sender.agent_id,
        name,
        framework: framework as A2AFramework,
        endpoint: message.sender.endpoint,
        capabilities,
        metadata: {
          version,
          llm,
          last_heartbeat: Date.now()
        }
      };

      const registered = await this.registry.register(agent);

      // Send handshake acknowledgment
      const ws = this.clients.get(clientId);
      if (ws) {
        const response: A2AMessage = {
          id: uuidv4(),
          timestamp: Date.now(),
          protocol_version: '1.0',
          sender: {
            agent_id: 'central-mcp',
            framework: 'mcp',
            endpoint: 'ws://34.41.115.199:3000/a2a',
            capabilities: ['registry', 'routing', 'bridge']
          },
          recipient: {
            agent_id: registered.id
          },
          content: {
            type: 'handshake',
            payload: {
              status: 'registered',
              agentId: registered.id,
              capabilities: ['messaging', 'discovery', 'routing']
            }
          }
        };

        ws.send(JSON.stringify(response));
        logger.info(`🤝 Handshake completed with ${registered.name}`);
      }
    } catch (error) {
      logger.error('❌ Handshake error:', error);
    }
  }

  /**
   * Handle agent heartbeat
   */
  private async handleHeartbeat(message: A2AMessage): Promise<void> {
    await this.registry.heartbeat(message.sender.agent_id);
    logger.debug(`💓 Heartbeat from ${message.sender.agent_id}`);
  }

  /**
   * Handle capability discovery
   */
  private async handleDiscovery(clientId: string, message: A2AMessage): Promise<void> {
    const { capability } = message.content.payload;

    let agents: A2AAgent[];

    if (capability) {
      agents = await this.registry.discover(capability);
    } else {
      agents = this.registry.listAgents();
    }

    // Send discovery response
    const ws = this.clients.get(clientId);
    if (ws) {
      const response: A2AMessage = {
        id: uuidv4(),
        timestamp: Date.now(),
        protocol_version: '1.0',
        sender: {
          agent_id: 'central-mcp',
          framework: 'mcp',
          endpoint: 'ws://34.41.115.199:3000/a2a',
          capabilities: []
        },
        recipient: {
          agent_id: message.sender.agent_id
        },
        content: {
          type: 'response',
          payload: {
            agents: agents.map((a) => ({
              id: a.id,
              name: a.name,
              framework: a.framework,
              capabilities: a.capabilities,
              status: a.status
            }))
          }
        },
        routing: {
          correlation_id: message.routing?.correlation_id
        }
      };

      ws.send(JSON.stringify(response));
      logger.info(`🔍 Discovery response sent: ${agents.length} agents found`);
    }
  }

  /**
   * Send welcome message to new client
   */
  private sendWelcome(ws: WebSocket): void {
    const welcome = {
      type: 'welcome',
      protocol_version: '1.0',
      server: 'Central-MCP A2A Hub',
      timestamp: Date.now(),
      capabilities: ['messaging', 'discovery', 'routing', 'bridge']
    };

    ws.send(JSON.stringify(welcome));
  }

  /**
   * Send acknowledgment
   */
  private sendAcknowledgment(ws: WebSocket, messageId: string, success: boolean): void {
    const ack = {
      type: 'ack',
      messageId,
      success,
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(ack));
  }

  /**
   * Send error message
   */
  private sendError(ws: WebSocket, error: string): void {
    const errorMsg = {
      type: 'error',
      error,
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(errorMsg));
  }

  /**
   * Broadcast message to all connected clients
   */
  async broadcast(message: A2AMessage): Promise<void> {
    const data = JSON.stringify(message);

    for (const ws of this.clients.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }

    logger.info(`📢 Broadcasted message to ${this.clients.size} clients`);
  }

  /**
   * Set MCP server reference for bridge
   */
  setMCPServer(mcpServer: any): void {
    this.bridge.setMCPServer(mcpServer);
    logger.info('🌉 MCP server connected to A2A bridge');
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      registry: this.registry.getStats(),
      router: this.router.getStats(),
      bridge: this.bridge.getStats(),
      transport: this.transport.getStats()
    };
  }

  /**
   * Shutdown A2A server
   */
  shutdown(): void {
    // Close all client connections
    for (const ws of this.clients.values()) {
      ws.close();
    }

    // Shutdown components
    this.registry.shutdown();
    this.transport.shutdown();

    // Close WebSocket server
    this.wss.close();

    logger.info('🛑 A2A Server shutdown complete');
  }
}
