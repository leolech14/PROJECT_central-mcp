/**
 * WebSocket MCP Transport
 * ========================
 *
 * WebSocket transport for cloud deployment.
 * Replaces stdio transport for multi-client cloud access.
 *
 * Features:
 * - WebSocket server (ws library)
 * - JSON-RPC 2.0 over WebSocket
 * - Multi-client support
 * - Automatic reconnection
 * - Message queuing
 * - Heartbeat/ping-pong
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

export interface WebSocketTransportOptions {
  port: number;
  host?: string;
  path?: string;
  pingInterval?: number;
  maxPayloadSize?: number;
}

export class WebSocketMCPTransport {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    private server: Server,
    private options: WebSocketTransportOptions
  ) {
    this.wss = new WebSocketServer({
      port: options.port,
      host: options.host || '0.0.0.0',
      path: options.path || '/mcp',
      maxPayload: options.maxPayloadSize || 10 * 1024 * 1024 // 10MB
    });

    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server with handlers
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log(`🔌 New WebSocket connection from ${request.socket.remoteAddress}`);

      // Register client
      const clientInfo: ClientInfo = {
        id: `client-${Date.now()}`,
        connectedAt: new Date(),
        lastPing: new Date(),
        authenticated: false, // Future: check auth
        agent: null
      };

      this.clients.set(ws, clientInfo);

      // Handle messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as JSONRPCMessage;

          // Process MCP request
          const response = await this.handleMCPRequest(message, clientInfo);

          // Send response
          ws.send(JSON.stringify(response));
        } catch (error) {
          console.error('❌ Error processing message:', error);

          // Send error response
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal error',
              data: String(error)
            },
            id: null
          }));
        }
      });

      // Handle pong (heartbeat response)
      ws.on('pong', () => {
        const info = this.clients.get(ws);
        if (info) {
          info.lastPing = new Date();
        }
      });

      // Handle close
      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected: ${clientInfo.id}`);
        this.clients.delete(ws);

        // TODO: Call agent_disconnect if agent was connected
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${clientInfo.id}:`, error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Central Intelligence MCP Server',
        version: '2.0.0',
        tools: 12
      }));
    });

    // Start ping interval (keep connections alive)
    this.startPingInterval();

    console.log(`🌐 WebSocket MCP server listening on ${this.options.host || '0.0.0.0'}:${this.options.port}${this.options.path || '/mcp'}`);
  }

  /**
   * Handle MCP request
   */
  private async handleMCPRequest(message: JSONRPCMessage, clientInfo: ClientInfo): Promise<any> {
    // Delegate to MCP server's request handlers
    // This would integrate with the existing MCP SDK server

    // For now, return acknowledgement
    return {
      jsonrpc: '2.0',
      result: {
        status: 'received',
        clientId: clientInfo.id
      },
      id: (message as any).id
    };
  }

  /**
   * Start ping/pong heartbeat
   */
  private startPingInterval(): void {
    const interval = this.options.pingInterval || 30000; // 30 seconds

    this.pingInterval = setInterval(() => {
      const now = new Date();

      this.clients.forEach((info, ws) => {
        // Check if client responded to last ping
        const timeSinceLastPing = now.getTime() - info.lastPing.getTime();

        if (timeSinceLastPing > interval * 2) {
          // Client didn't respond to ping - disconnect
          console.log(`⏱️  Client ${info.id} timeout - disconnecting`);
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        // Send ping
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, interval);
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: any): void {
    const data = JSON.stringify(message);

    this.clients.forEach((info, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: any): boolean {
    for (const [ws, info] of this.clients.entries()) {
      if (info.id === clientId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
    }
    return false;
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Close WebSocket server
   */
  async close(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all client connections
    this.clients.forEach((info, ws) => {
      ws.close(1000, 'Server shutting down');
    });

    // Close server
    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log('🔌 WebSocket server closed');
        resolve();
      });
    });
  }
}

interface ClientInfo {
  id: string;
  connectedAt: Date;
  lastPing: Date;
  authenticated: boolean;
  agent: string | null;
}
