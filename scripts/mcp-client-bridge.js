#!/usr/bin/env node

/**
 * MCP Client Bridge - Connects Claude Code to Central-MCP
 *
 * This bridge allows THIS Claude Code session to connect to Central-MCP
 * and become part of the distributed intelligence system.
 *
 * Flow:
 * Claude Code → MCP Client Bridge → Central-MCP (ws://34.41.115.199:3000/mcp)
 */

import WebSocket from 'ws';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Central-MCP connection details
const CENTRAL_MCP_URL = 'ws://136.112.123.243:3000/mcp';
const PROJECT_NAME = 'PROJECT_central-mcp';
const WORKING_DIRECTORY = process.cwd();

// Agent information (auto-discovered)
const AGENT_INFO = {
  model: 'claude-sonnet-4-5',
  contextWindow: 200000,
  workingDirectory: WORKING_DIRECTORY,
  projectName: PROJECT_NAME,
  capabilities: ['coordination', 'architecture', 'implementation'],
  sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

console.error('🔌 MCP Client Bridge Starting...');
console.error('📍 Working Directory:', WORKING_DIRECTORY);
console.error('🎯 Project:', PROJECT_NAME);
console.error('🤖 Agent:', AGENT_INFO.model);
console.error('🧠 Context:', AGENT_INFO.contextWindow, 'tokens');
console.error('☁️  Connecting to Central-MCP:', CENTRAL_MCP_URL);

// Create WebSocket connection to Central-MCP
let centralMCP = null;
let connected = false;

function connectToCentralMCP() {
  return new Promise((resolve, reject) => {
    try {
      centralMCP = new WebSocket(CENTRAL_MCP_URL);

      centralMCP.on('open', () => {
        console.error('✅ Connected to Central-MCP!');
        connected = true;

        // Send auto-discovery message
        const discoveryMessage = {
          type: 'agent_discovery',
          agent: AGENT_INFO,
          timestamp: Date.now()
        };

        centralMCP.send(JSON.stringify(discoveryMessage));
        console.error('📤 Sent auto-discovery message');

        resolve();
      });

      centralMCP.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.error('📥 Received from Central-MCP:', message.type || 'unknown');

          // Handle different message types
          switch (message.type) {
            case 'discovery_ack':
              console.error('✅ Auto-discovery acknowledged!');
              console.error('   Session ID:', message.sessionId);
              console.error('   Project Soul loaded:', message.projectSoulLoaded);
              break;

            case 'keep_in_touch_ping':
              // Respond to heartbeat
              centralMCP.send(JSON.stringify({
                type: 'keep_in_touch_pong',
                sessionId: AGENT_INFO.sessionId,
                activity: 'Connected via MCP Client Bridge',
                timestamp: Date.now()
              }));
              break;

            case 'opportunity_notification':
              console.error('🎯 Opportunity:', message.opportunity.type);
              console.error('   Description:', message.opportunity.description);
              break;

            case 'task_suggestion':
              console.error('📋 Task suggested:', message.task.title);
              console.error('   Priority:', message.task.priority);
              break;
          }
        } catch (err) {
          console.error('❌ Error parsing message:', err.message);
        }
      });

      centralMCP.on('error', (err) => {
        console.error('❌ WebSocket error:', err.message);
        connected = false;
        reject(err);
      });

      centralMCP.on('close', () => {
        console.error('🔌 Disconnected from Central-MCP');
        connected = false;
      });
    } catch (err) {
      console.error('❌ Connection error:', err.message);
      reject(err);
    }
  });
}

// Create MCP server for Claude Code
const server = new Server(
  {
    name: 'central-mcp-client',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register tools that proxy to Central-MCP
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
    return {
      tools: [
        {
          name: 'get_project_soul',
          description: 'Load project soul (specs + context) from Central-MCP',
          inputSchema: {
            type: 'object',
            properties: {
              projectName: {
                type: 'string',
                description: 'Name of the project (e.g., PROJECT_central-mcp)'
              }
            },
            required: ['projectName']
          }
        },
        {
          name: 'get_available_tasks',
          description: 'Get available tasks from Central-MCP task registry',
          inputSchema: {
            type: 'object',
            properties: {
              projectName: {
                type: 'string',
                description: 'Filter by project name (optional)'
              }
            }
          }
        },
        {
          name: 'claim_task',
          description: 'Claim a task from Central-MCP',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task ID to claim'
              }
            },
            required: ['taskId']
          }
        },
        {
          name: 'report_progress',
          description: 'Report task progress to Central-MCP',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task ID'
              },
              progress: {
                type: 'number',
                description: 'Progress percentage (0-100)'
              },
              notes: {
                type: 'string',
                description: 'Progress notes'
              }
            },
            required: ['taskId', 'progress']
          }
        },
        {
          name: 'complete_task',
          description: 'Mark task as complete in Central-MCP',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task ID'
              },
              completionNotes: {
                type: 'string',
                description: 'Completion notes'
              }
            },
            required: ['taskId']
          }
        },
        {
          name: 'scan_opportunities',
          description: 'Trigger opportunity scanning for current project',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_session_status',
          description: 'Get current session status from Central-MCP',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  }
);

server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
    const { name, arguments: args } = request.params;

  if (!connected) {
    return {
      content: [
        {
          type: 'text',
          text: '❌ Not connected to Central-MCP. Connection lost.'
        }
      ]
    };
  }

  // Send request to Central-MCP via WebSocket
  const requestId = `req_${Date.now()}`;
  const message = {
    type: 'mcp_tool_call',
    requestId: requestId,
    tool: name,
    arguments: args,
    sessionId: AGENT_INFO.sessionId,
    timestamp: Date.now()
  };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Central-MCP request timeout'));
      }, 30000); // 30s timeout

      // Listen for response
      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.type === 'mcp_tool_response' && response.requestId === requestId) {
            clearTimeout(timeout);
            centralMCP.off('message', responseHandler);

            resolve({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(response.result, null, 2)
                }
              ]
            });
          }
        } catch (err) {
          // Ignore parsing errors for non-response messages
        }
      };

      centralMCP.on('message', responseHandler);
      centralMCP.send(JSON.stringify(message));
    });
  }
);

// Start server
async function main() {
  try {
    // Connect to Central-MCP first
    await connectToCentralMCP();

    // Then start MCP server for Claude Code
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('✅ MCP Client Bridge ready!');
    console.error('🔌 Claude Code can now use Central-MCP tools');
    console.error('');
    console.error('🎯 This agent is now part of the distributed intelligence!');

    // Send heartbeat every 30s
    setInterval(() => {
      if (connected) {
        centralMCP.send(JSON.stringify({
          type: 'keep_in_touch_heartbeat',
          sessionId: AGENT_INFO.sessionId,
          activity: 'Active in Claude Code',
          timestamp: Date.now()
        }));
      }
    }, 30000);
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
