/**
 * A2A Message Router
 * ==================
 *
 * Routes Agent2Agent messages across different frameworks
 * Handles protocol translation and delivery
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { A2AMessage, A2ARouteResult } from './types.js';
import { A2AAgentRegistry } from './AgentRegistry.js';
import { A2AMCPBridge } from './MCPBridge.js';
import { A2AWebSocketTransport } from './WebSocketTransport.js';

export class A2AMessageRouter {
  private registry: A2AAgentRegistry;
  private mcpBridge: A2AMCPBridge;
  private wsTransport: A2AWebSocketTransport;
  private messageHistory: Map<string, A2AMessage> = new Map();

  constructor(
    registry: A2AAgentRegistry,
    mcpBridge: A2AMCPBridge,
    wsTransport: A2AWebSocketTransport
  ) {
    this.registry = registry;
    this.mcpBridge = mcpBridge;
    this.wsTransport = wsTransport;

    logger.info('🔀 A2A Message Router initialized');
  }

  /**
   * Route A2A message to recipient
   */
  async route(message: A2AMessage): Promise<A2ARouteResult> {
    try {
      // Store in history
      this.messageHistory.set(message.id, message);

      // Validate message
      this.validateMessage(message);

      // Check TTL
      if (message.routing?.ttl) {
        const messageAge = Date.now() - message.timestamp;
        if (messageAge > message.routing.ttl * 1000) {
          logger.warn(`⏰ Message ${message.id} expired (TTL: ${message.routing.ttl}s)`);
          return {
            success: false,
            error: 'Message TTL expired'
          };
        }
      }

      // Find recipient agent
      const agent = await this.registry.getAgent(message.recipient.agent_id);

      if (!agent) {
        logger.error(`❌ Recipient agent not found: ${message.recipient.agent_id}`);
        return {
          success: false,
          error: `Agent ${message.recipient.agent_id} not found in registry`
        };
      }

      // Route based on framework
      if (agent.framework === 'mcp') {
        // Route to MCP agent via bridge
        await this.mcpBridge.routeToMCP(message);
        logger.info(`📨 Routed A2A message to MCP agent: ${agent.id}`);
      } else {
        // Route to A2A agent via WebSocket
        await this.routeToA2A(agent.endpoint, message);
        logger.info(`📨 Routed A2A message to ${agent.framework} agent: ${agent.id}`);
      }

      return {
        success: true,
        messageId: message.id,
        deliveredAt: Date.now()
      };
    } catch (error) {
      logger.error('❌ Message routing error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Route message to A2A agent endpoint
   */
  private async routeToA2A(endpoint: string, message: A2AMessage): Promise<void> {
    await this.wsTransport.send(endpoint, message);
  }

  /**
   * Validate A2A message format
   */
  private validateMessage(message: A2AMessage): void {
    if (!message.id || !message.timestamp || !message.protocol_version) {
      throw new Error('Invalid message: missing required fields');
    }

    if (!message.sender?.agent_id || !message.sender?.framework) {
      throw new Error('Invalid message: missing sender information');
    }

    if (!message.recipient?.agent_id) {
      throw new Error('Invalid message: missing recipient information');
    }

    if (!message.content?.type || message.content?.payload === undefined) {
      throw new Error('Invalid message: missing content');
    }

    // Validate protocol version
    if (message.protocol_version !== '1.0') {
      throw new Error(`Unsupported protocol version: ${message.protocol_version}`);
    }
  }

  /**
   * Create correlation ID for request/response pairing
   */
  createCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Get message from history
   */
  getMessageHistory(messageId: string): A2AMessage | undefined {
    return this.messageHistory.get(messageId);
  }

  /**
   * Get correlated messages
   */
  getCorrelatedMessages(correlationId: string): A2AMessage[] {
    return Array.from(this.messageHistory.values()).filter(
      (msg) => msg.routing?.correlation_id === correlationId
    );
  }

  /**
   * Clean up old message history (run periodically)
   */
  cleanupHistory(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    const deleted: string[] = [];

    for (const [id, message] of this.messageHistory.entries()) {
      if (now - message.timestamp > maxAgeMs) {
        this.messageHistory.delete(id);
        deleted.push(id);
      }
    }

    if (deleted.length > 0) {
      logger.info(`🧹 Cleaned up ${deleted.length} old messages from history`);
    }
  }

  /**
   * Get routing statistics
   */
  getStats() {
    return {
      totalMessages: this.messageHistory.size,
      messagesByType: this.getMessageCountsByType(),
      messagesByFramework: this.getMessageCountsByFramework()
    };
  }

  private getMessageCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const message of this.messageHistory.values()) {
      const type = message.content.type;
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }

  private getMessageCountsByFramework(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const message of this.messageHistory.values()) {
      const framework = message.sender.framework;
      counts[framework] = (counts[framework] || 0) + 1;
    }
    return counts;
  }
}
