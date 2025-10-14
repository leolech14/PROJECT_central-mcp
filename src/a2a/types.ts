/**
 * Agent2Agent (A2A) Protocol Type Definitions
 * ============================================
 *
 * Google's Agent2Agent protocol types for cross-framework communication
 * Released: October 9-10, 2025
 *
 * Supports: Google ADK, LangGraph, Crew.ai, MCP, custom frameworks
 */

export type A2AFramework = 'adk' | 'langraph' | 'crew.ai' | 'mcp' | 'custom';

export type A2AMessageType =
  | 'task_delegation'      // Delegate task to another agent
  | 'task_result'          // Return task result
  | 'query'                // Query another agent
  | 'response'             // Response to query
  | 'event_notification'   // Broadcast event
  | 'capability_discovery' // Discover agent capabilities
  | 'handshake'            // Initial connection
  | 'heartbeat'            // Keep-alive
  | 'error';               // Error notification

export interface A2AMessage {
  // Message metadata
  id: string;
  timestamp: number;
  protocol_version: string; // "1.0"

  // Sender information
  sender: {
    agent_id: string;
    framework: A2AFramework;
    endpoint: string;
    capabilities: string[];
  };

  // Recipient information
  recipient: {
    agent_id: string;
    framework?: A2AFramework;
    endpoint?: string;
  };

  // Message content
  content: {
    type: A2AMessageType;
    payload: any;
    metadata?: Record<string, any>;
  };

  // Routing & delivery
  routing?: {
    reply_to?: string;
    correlation_id?: string;
    ttl?: number;
    priority?: number; // 0-10 (10 = highest)
  };
}

export interface A2AAgent {
  id: string;
  name: string;
  framework: A2AFramework;
  endpoint: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  metadata: {
    version: string;
    llm?: string;
    last_heartbeat: number;
  };
}

export interface A2ARouteResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: number;
}

export interface A2ARegistryStats {
  totalAgents: number;
  onlineAgents: number;
  frameworkCounts: Record<A2AFramework, number>;
  totalCapabilities: number;
}
