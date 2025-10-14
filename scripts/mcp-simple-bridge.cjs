#!/usr/bin/env node

/**
 * Simple MCP Bridge to Central-MCP
 * Connects Claude Code to Central-MCP cloud intelligence
 */

const WebSocket = require('ws');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const CENTRAL_MCP_URL = process.env.CENTRAL_MCP_URL || 'ws://34.41.115.199:3000/mcp';
const PROJECT_NAME = process.env.PROJECT_NAME || 'PROJECT_central-mcp';

console.error('🔌 Connecting to Central-MCP...');
console.error('   URL:', CENTRAL_MCP_URL);
console.error('   Project:', PROJECT_NAME);

let centralMCP = null;
let connected = false;

// Create MCP server
const server = new Server(
  {
    name: 'central-mcp-bridge',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    }
  }
);

// Simple tool list
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'ping_central_mcp',
      description: 'Ping Central-MCP to check connection',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_health',
      description: 'Get Central-MCP health status',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const toolName = request.params.name;

  try {
    if (toolName === 'ping_central_mcp') {
      const response = await fetch('http://34.41.115.199:3000/health');
      const data = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'connected',
              central_mcp: data,
              message: '✅ Central-MCP is reachable!'
            }, null, 2)
          }
        ]
      };
    }

    if (toolName === 'get_health') {
      const response = await fetch('http://34.41.115.199:3000/health');
      const data = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${toolName}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ MCP Bridge ready!');
}

main().catch(console.error);
