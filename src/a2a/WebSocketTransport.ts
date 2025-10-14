/**
 * A2A WebSocket Transport
 * ========================
 *
 * WebSocket transport layer for Agent2Agent protocol
 * Manages connections to remote A2A agents
 */

import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import { A2AMessage } from './types.js';

export interface A2AConnection {
  endpoint: string;
  ws: WebSocket;
  connected: boolean;
  lastActivity: number;
  reconnectAttempts: number;
}

export class A2AWebSocketTransport {
  private connections: Map<string, A2AConnection> = new Map();
  private messageHandlers: ((message: A2AMessage) => void)[] = [];
  private reconnectInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startReconnectMonitor();
    logger.info('🔌 A2A WebSocket Transport initialized');
  }

  /**
   * Connect to remote A2A endpoint
   */
  async connect(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if already connected
        const existing = this.connections.get(endpoint);
        if (existing && existing.connected) {
          logger.debug(`Already connected to ${endpoint}`);
          resolve();
          return;
        }

        logger.info(`🔗 Connecting to A2A endpoint: ${endpoint}`);

        const ws = new WebSocket(endpoint);

        ws.on('open', () => {
          const connection: A2AConnection = {
            endpoint,
            ws,
            connected: true,
            lastActivity: Date.now(),
            reconnectAttempts: 0
          };

          this.connections.set(endpoint, connection);
          logger.info(`✅ Connected to ${endpoint}`);
          resolve();
        });

        ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString()) as A2AMessage;
            this.handleIncomingMessage(endpoint, message);

            // Update last activity
            const connection = this.connections.get(endpoint);
            if (connection) {
              connection.lastActivity = Date.now();
            }
          } catch (error) {
            logger.error(`❌ Failed to parse A2A message from ${endpoint}:`, error);
          }
        });

        ws.on('close', () => {
          const connection = this.connections.get(endpoint);
          if (connection) {
            connection.connected = false;
            logger.warn(`🔌 Disconnected from ${endpoint}`);
          }
        });

        ws.on('error', (error) => {
          logger.error(`❌ WebSocket error for ${endpoint}:`, error);
          reject(error);
        });

        // Connection timeout
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.terminate();
            reject(new Error(`Connection timeout for ${endpoint}`));
          }
        }, 10000); // 10 second timeout

      } catch (error) {
        logger.error(`❌ Failed to connect to ${endpoint}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from endpoint
   */
  disconnect(endpoint: string): void {
    const connection = this.connections.get(endpoint);

    if (connection) {
      connection.ws.close();
      this.connections.delete(endpoint);
      logger.info(`🔌 Disconnected from ${endpoint}`);
    }
  }

  /**
   * Send A2A message to endpoint
   */
  async send(endpoint: string, message: A2AMessage): Promise<void> {
    let connection = this.connections.get(endpoint);

    // Auto-connect if not connected
    if (!connection || !connection.connected) {
      await this.connect(endpoint);
      connection = this.connections.get(endpoint);
    }

    if (!connection || !connection.connected) {
      throw new Error(`Not connected to ${endpoint}`);
    }

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(message);

      connection!.ws.send(data, (error) => {
        if (error) {
          logger.error(`❌ Failed to send message to ${endpoint}:`, error);
          reject(error);
        } else {
          logger.debug(`📤 Sent A2A message to ${endpoint}: ${message.id}`);
          connection!.lastActivity = Date.now();
          resolve();
        }
      });
    });
  }

  /**
   * Broadcast message to all connected endpoints
   */
  async broadcast(message: A2AMessage, excludeEndpoint?: string): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [endpoint, connection] of this.connections.entries()) {
      if (endpoint === excludeEndpoint) continue;
      if (!connection.connected) continue;

      promises.push(this.send(endpoint, message).catch((error) => {
        logger.error(`❌ Broadcast to ${endpoint} failed:`, error);
      }));
    }

    await Promise.all(promises);
    logger.info(`📢 Broadcasted message to ${promises.length} endpoints`);
  }

  /**
   * Handle incoming A2A message
   */
  private handleIncomingMessage(endpoint: string, message: A2AMessage): void {
    logger.debug(`📥 Received A2A message from ${endpoint}: ${message.content.type}`);

    // Call all registered handlers
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        logger.error('❌ Message handler error:', error);
      }
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler: (message: A2AMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove message handler
   */
  offMessage(handler: (message: A2AMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Start reconnect monitor
   */
  private startReconnectMonitor(): void {
    const CHECK_INTERVAL = 30000; // 30 seconds
    const MAX_RECONNECT_ATTEMPTS = 5;

    this.reconnectInterval = setInterval(() => {
      for (const [endpoint, connection] of this.connections.entries()) {
        // Check if connection is stale
        if (!connection.connected && connection.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          logger.info(`🔄 Attempting to reconnect to ${endpoint} (attempt ${connection.reconnectAttempts + 1})`);

          this.connect(endpoint).catch((error) => {
            connection.reconnectAttempts++;
            logger.error(`❌ Reconnect failed for ${endpoint}:`, error);

            if (connection.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
              logger.error(`❌ Max reconnect attempts reached for ${endpoint} - giving up`);
              this.connections.delete(endpoint);
            }
          });
        }
      }
    }, CHECK_INTERVAL);
  }

  /**
   * Stop reconnect monitor
   */
  stopReconnectMonitor(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(endpoint: string): A2AConnection | null {
    return this.connections.get(endpoint) || null;
  }

  /**
   * List all connections
   */
  listConnections(): A2AConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get transport statistics
   */
  getStats() {
    const connections = Array.from(this.connections.values());

    return {
      totalConnections: connections.length,
      connectedCount: connections.filter((c) => c.connected).length,
      disconnectedCount: connections.filter((c) => !c.connected).length,
      totalHandlers: this.messageHandlers.length
    };
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(maxInactiveMs: number = 300000): void {
    const now = Date.now();
    const deleted: string[] = [];

    for (const [endpoint, connection] of this.connections.entries()) {
      if (!connection.connected) {
        const inactiveTime = now - connection.lastActivity;

        if (inactiveTime > maxInactiveMs) {
          this.connections.delete(endpoint);
          deleted.push(endpoint);
        }
      }
    }

    if (deleted.length > 0) {
      logger.info(`🧹 Cleaned up ${deleted.length} stale connections`);
    }
  }

  /**
   * Shutdown transport
   */
  shutdown(): void {
    this.stopReconnectMonitor();

    // Close all connections
    for (const [endpoint, connection] of this.connections.entries()) {
      connection.ws.close();
    }

    this.connections.clear();
    this.messageHandlers = [];

    logger.info('🛑 A2A WebSocket Transport shutdown');
  }
}
