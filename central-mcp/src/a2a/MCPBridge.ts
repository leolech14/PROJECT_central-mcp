/**
 * A2A ↔ MCP Bridge
 * =================
 *
 * Translates between Agent2Agent protocol and Model Context Protocol
 * Enables cross-protocol agent communication
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { A2AMessage, A2AMessageType } from './types.js';

export interface MCPToolCall {
  tool: string;
  arguments: Record<string, any>;
  callId: string;
}

export interface MCPEvent {
  type: string;
  data: any;
  timestamp: number;
}

export class A2AMCPBridge {
  private mcpServer: any; // Reference to MCP server instance
  private pendingResponses: Map<string, (response: any) => void> = new Map();

  constructor(mcpServer?: any) {
    this.mcpServer = mcpServer;
    logger.info('🌉 A2A ↔ MCP Bridge initialized');
  }

  /**
   * Set MCP server reference
   */
  setMCPServer(mcpServer: any): void {
    this.mcpServer = mcpServer;
  }

  /**
   * Route A2A message to MCP agent
   */
  async routeToMCP(a2aMessage: A2AMessage): Promise<any> {
    try {
      // Translate A2A message to MCP tool call
      const mcpCall = this.translateA2AToMCP(a2aMessage);

      logger.info(`🔄 Translating A2A → MCP: ${a2aMessage.content.type} → ${mcpCall.tool}`);

      // Execute MCP tool call
      if (this.mcpServer && this.mcpServer.callTool) {
        const result = await this.mcpServer.callTool(mcpCall.tool, mcpCall.arguments);

        // If there's a reply_to address, send response back as A2A message
        if (a2aMessage.routing?.reply_to) {
          await this.sendA2AResponse(a2aMessage, result);
        }

        return result;
      } else {
        logger.warn('⚠️ MCP server not configured - message queued');
        return { status: 'queued', message: 'MCP server not available' };
      }
    } catch (error) {
      logger.error('❌ A2A → MCP translation error:', error);
      throw error;
    }
  }

  /**
   * Route MCP event to A2A agent
   */
  async routeFromMCP(mcpEvent: MCPEvent, targetAgentId: string): Promise<A2AMessage> {
    try {
      // Translate MCP event to A2A message
      const a2aMessage = this.translateMCPToA2A(mcpEvent, targetAgentId);

      logger.info(`🔄 Translating MCP → A2A: ${mcpEvent.type} → ${a2aMessage.content.type}`);

      return a2aMessage;
    } catch (error) {
      logger.error('❌ MCP → A2A translation error:', error);
      throw error;
    }
  }

  /**
   * Translate A2A message to MCP tool call
   */
  private translateA2AToMCP(a2aMessage: A2AMessage): MCPToolCall {
    const callId = uuidv4();

    // Map A2A message types to MCP tools
    const toolMapping: Record<A2AMessageType, string> = {
      'task_delegation': 'claimTask',
      'task_result': 'completeTask',
      'query': 'getAvailableTasks',
      'response': 'updateProgress',
      'event_notification': 'notifyEvent',
      'capability_discovery': 'listAgents',
      'handshake': 'authenticate',
      'heartbeat': 'heartbeat',
      'error': 'reportError'
    };

    const tool = toolMapping[a2aMessage.content.type] || 'genericAction';

    // Translate payload to MCP arguments
    const arguments_ = {
      ...a2aMessage.content.payload,
      _a2a_metadata: {
        sender: a2aMessage.sender,
        messageId: a2aMessage.id,
        correlationId: a2aMessage.routing?.correlation_id
      }
    };

    return {
      tool,
      arguments: arguments_,
      callId
    };
  }

  /**
   * Translate MCP event to A2A message
   */
  private translateMCPToA2A(mcpEvent: MCPEvent, targetAgentId: string): A2AMessage {
    const messageId = uuidv4();

    // Map MCP event types to A2A message types
    const typeMapping: Record<string, A2AMessageType> = {
      'task_claimed': 'task_delegation',
      'task_completed': 'task_result',
      'progress_updated': 'event_notification',
      'error': 'error',
      'status_change': 'event_notification'
    };

    const messageType = typeMapping[mcpEvent.type] || 'event_notification';

    const a2aMessage: A2AMessage = {
      id: messageId,
      timestamp: mcpEvent.timestamp || Date.now(),
      protocol_version: '1.0',

      sender: {
        agent_id: 'central-mcp',
        framework: 'mcp',
        endpoint: 'ws://34.41.115.199:3000/mcp',
        capabilities: ['mcp:*']
      },

      recipient: {
        agent_id: targetAgentId,
        framework: undefined // Will be resolved by router
      },

      content: {
        type: messageType,
        payload: mcpEvent.data,
        metadata: {
          original_event_type: mcpEvent.type,
          translated_from: 'mcp'
        }
      },

      routing: {
        priority: 5,
        ttl: 300 // 5 minutes
      }
    };

    return a2aMessage;
  }

  /**
   * Send A2A response message
   */
  private async sendA2AResponse(originalMessage: A2AMessage, result: any): Promise<void> {
    const responseMessage: A2AMessage = {
      id: uuidv4(),
      timestamp: Date.now(),
      protocol_version: '1.0',

      sender: {
        agent_id: originalMessage.recipient.agent_id,
        framework: 'mcp',
        endpoint: 'ws://34.41.115.199:3000/mcp',
        capabilities: []
      },

      recipient: {
        agent_id: originalMessage.sender.agent_id,
        framework: originalMessage.sender.framework
      },

      content: {
        type: 'response',
        payload: result,
        metadata: {
          in_response_to: originalMessage.id
        }
      },

      routing: {
        correlation_id: originalMessage.routing?.correlation_id,
        reply_to: originalMessage.routing?.reply_to
      }
    };

    // This would be sent via the message router
    logger.debug('📤 Response message prepared:', responseMessage.id);
  }

  /**
   * Register pending response handler
   */
  registerPendingResponse(correlationId: string, handler: (response: any) => void): void {
    this.pendingResponses.set(correlationId, handler);
  }

  /**
   * Handle incoming response
   */
  handleResponse(correlationId: string, response: any): void {
    const handler = this.pendingResponses.get(correlationId);

    if (handler) {
      handler(response);
      this.pendingResponses.delete(correlationId);
      logger.debug(`✅ Response handled for correlation: ${correlationId}`);
    } else {
      logger.warn(`⚠️ No handler found for correlation: ${correlationId}`);
    }
  }

  /**
   * Get bridge statistics
   */
  getStats() {
    return {
      pendingResponses: this.pendingResponses.size,
      mcpServerConfigured: !!this.mcpServer
    };
  }

  /**
   * Clean up old pending responses
   */
  cleanupPendingResponses(maxAgeMs: number = 300000): void {
    // In production, track timestamp of each pending response
    // For now, just clear all if too many
    if (this.pendingResponses.size > 1000) {
      const oldSize = this.pendingResponses.size;
      this.pendingResponses.clear();
      logger.info(`🧹 Cleared ${oldSize} pending responses`);
    }
  }
}
