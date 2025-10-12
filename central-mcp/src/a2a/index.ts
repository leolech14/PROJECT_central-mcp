/**
 * Agent2Agent (A2A) Protocol Module
 * ==================================
 *
 * Google's Agent2Agent protocol integration for cross-framework communication
 * Released: October 9-10, 2025
 */

export { A2AServer } from './A2AServer.js';
export { A2AAgentRegistry } from './AgentRegistry.js';
export { A2AMessageRouter } from './MessageRouter.js';
export { A2AMCPBridge } from './MCPBridge.js';
export { A2AWebSocketTransport } from './WebSocketTransport.js';

export type {
  A2AMessage,
  A2AAgent,
  A2AFramework,
  A2AMessageType,
  A2ARouteResult,
  A2ARegistryStats
} from './types.js';

export type { A2AConnection } from './WebSocketTransport.js';
export type { MCPToolCall, MCPEvent } from './MCPBridge.js';
export type { A2AServerConfig } from './A2AServer.js';
