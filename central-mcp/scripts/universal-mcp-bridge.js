#!/usr/bin/env node

/**
 * 🌍 UNIVERSAL MCP CLIENT BRIDGE - Plug-n-Play Central-MCP Connection
 *
 * AUTO-DETECTS: Project name, capabilities, ecosystem
 * CONNECTS: Automatically to Central-MCP
 * WORKS: In ALL projects (no hardcoding!)
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

// ============================================================================
// AUTO-DETECTION FUNCTIONS
// ============================================================================

function detectProject() {
  const cwd = process.cwd();

  // Check if in PROJECTS_all/ ecosystem
  if (cwd.includes('/PROJECTS_all/')) {
    const projectMatch = cwd.match(/\/PROJECTS_all\/([^\/]+)/);
    if (projectMatch) {
      return {
        name: projectMatch[1],
        path: cwd,
        ecosystem: 'PROJECTS_all'
      };
    }
  }

  // Check for CLAUDE.md (project marker)
  if (fs.existsSync(path.join(cwd, 'CLAUDE.md'))) {
    return {
      name: path.basename(cwd),
      path: cwd,
      ecosystem: 'standalone'
    };
  }

  // Check for package.json
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
      return {
        name: pkg.name || path.basename(cwd),
        path: cwd,
        ecosystem: 'npm-project'
      };
    } catch (err) {
      // Ignore
    }
  }

  return {
    name: path.basename(cwd),
    path: cwd,
    ecosystem: 'unknown'
  };
}

function detectCapabilities(projectPath) {
  const capabilities = [];

  // Check directory structure
  if (fs.existsSync(path.join(projectPath, '01_CODEBASES'))) {
    capabilities.push('implementation');
  }
  if (fs.existsSync(path.join(projectPath, '02_SPECBASES'))) {
    capabilities.push('architecture', 'coordination');
  }
  if (fs.existsSync(path.join(projectPath, '04_AGENT_FRAMEWORK'))) {
    capabilities.push('agent-coordination');
  }

  // Check for specific tech stacks
  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    capabilities.push('backend', 'nodejs');

    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
      if (pkg.dependencies) {
        if (pkg.dependencies.react || pkg.dependencies.next) capabilities.push('ui', 'frontend');
        if (pkg.dependencies.express || pkg.dependencies.fastify) capabilities.push('api');
        if (pkg.dependencies.prisma || pkg.dependencies['@prisma/client']) capabilities.push('database');
      }
    } catch (err) {
      // Ignore
    }
  }

  if (fs.existsSync(path.join(projectPath, 'src/components'))) {
    capabilities.push('ui', 'frontend');
  }

  if (fs.existsSync(path.join(projectPath, 'LocalBrain.xcodeproj'))) {
    capabilities.push('swift', 'macos', 'desktop');
  }

  // Default capabilities if none detected
  if (capabilities.length === 0) {
    capabilities.push('general', 'development');
  }

  // Remove duplicates
  return [...new Set(capabilities)];
}

// ============================================================================
// AUTO-DETECTED CONFIGURATION
// ============================================================================

const CENTRAL_MCP_URL = process.env.CENTRAL_MCP_URL || 'ws://34.41.115.199:3000/mcp';
const PROJECT_INFO = detectProject();
const WORKING_DIRECTORY = PROJECT_INFO.path;
const PROJECT_NAME = PROJECT_INFO.name;

// Agent information (auto-discovered!)
const AGENT_INFO = {
  model: process.env.AGENT_MODEL || 'claude-sonnet-4-5',
  contextWindow: parseInt(process.env.CONTEXT_WINDOW || '200000', 10),
  workingDirectory: WORKING_DIRECTORY,
  projectName: PROJECT_NAME,
  projectEcosystem: PROJECT_INFO.ecosystem,
  capabilities: detectCapabilities(PROJECT_INFO.path),
  sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

console.error('');
console.error('🌍 ========================================');
console.error('   UNIVERSAL MCP CLIENT BRIDGE');
console.error('   Plug-n-Play Central-MCP Connection');
console.error('========================================');
console.error('');
console.error('🔍 AUTO-DETECTED CONFIGURATION:');
console.error('📍 Working Directory:', WORKING_DIRECTORY);
console.error('🎯 Project Name:', PROJECT_NAME);
console.error('🏗️  Ecosystem:', PROJECT_INFO.ecosystem);
console.error('🤖 Agent Model:', AGENT_INFO.model);
console.error('🧠 Context Window:', AGENT_INFO.contextWindow.toLocaleString(), 'tokens');
console.error('🎨 Capabilities:', AGENT_INFO.capabilities.join(', '));
console.error('🆔 Session ID:', AGENT_INFO.sessionId);
console.error('');
console.error('☁️  Connecting to Central-MCP:', CENTRAL_MCP_URL);
console.error('');

// ============================================================================
// CENTRAL-MCP CONNECTION (EXACT WORKING CODE FROM mcp-client-bridge.js)
// ============================================================================

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
        console.error('');

        resolve();
      });

      centralMCP.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());

          // Handle different message types
          switch (message.type) {
            case 'discovery_ack':
              console.error('✅ AUTO-DISCOVERY SUCCESSFUL!');
              console.error('   Session ID:', message.sessionId);
              console.error('   Project Soul Loaded:', message.projectSoulLoaded ? 'YES' : 'NO');
              console.error('   Available Tasks:', message.availableTasks || 0);
              console.error('');
              console.error('🎯 THIS AGENT IS NOW PART OF DISTRIBUTED INTELLIGENCE!');
              console.error('');
              break;

            case 'keep_in_touch_ping':
              // Respond to heartbeat
              centralMCP.send(JSON.stringify({
                type: 'keep_in_touch_pong',
                sessionId: AGENT_INFO.sessionId,
                activity: 'Active in Claude Code',
                timestamp: Date.now()
              }));
              break;

            case 'opportunity_notification':
              console.error('🎯 OPPORTUNITY DETECTED:');
              console.error('   Type:', message.opportunity.type);
              console.error('   Description:', message.opportunity.description);
              console.error('');
              break;

            case 'task_suggestion':
              console.error('📋 TASK SUGGESTED:');
              console.error('   Task:', message.task.title);
              console.error('   Priority:', message.task.priority);
              console.error('   Estimated:', message.task.estimatedHours, 'hours');
              console.error('');
              break;
          }
        } catch (err) {
          console.error('⚠️  Error parsing message:', err.message);
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

// ============================================================================
// MCP SERVER FOR CLAUDE CODE (EXACT WORKING CODE FROM mcp-client-bridge.js)
// ============================================================================

// Create MCP server for Claude Code
const server = new Server(
  {
    name: 'central-mcp-universal',
    version: '2.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register tools that proxy to Central-MCP
server.setRequestHandler(ListToolsRequestSchema, async () => {
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
              description: 'Name of the project (defaults to current project)'
            }
          }
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
              description: 'Filter by project name (defaults to current project)'
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
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

  // Default project name to current project if not specified
  if (!args.projectName && (name === 'get_project_soul' || name === 'get_available_tasks')) {
    args.projectName = PROJECT_NAME;
  }

  // Send JSON-RPC request to Central-MCP via WebSocket (standard MCP protocol)
  const requestId = Date.now();
  const message = {
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/call',
    params: {
      name: name,
      arguments: args
    }
  };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Central-MCP request timeout'));
    }, 30000); // 30s timeout

    // Listen for JSON-RPC response
    const responseHandler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        // Check for JSON-RPC response matching our request ID
        if (response.jsonrpc === '2.0' && response.id === requestId) {
          clearTimeout(timeout);
          centralMCP.off('message', responseHandler);

          // Return result or error
          if (response.error) {
            reject(new Error(response.error.message || 'MCP tool call failed'));
          } else {
            resolve({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(response.result, null, 2)
                }
              ]
            });
          }
        }
      } catch (err) {
        // Ignore parsing errors for non-response messages
      }
    };

    centralMCP.on('message', responseHandler);
    centralMCP.send(JSON.stringify(message));
  });
});

// ============================================================================
// START SERVER
// ============================================================================

// Start server
async function main() {
  try {
    // Connect to Central-MCP first
    await connectToCentralMCP();

    // Then start MCP server for Claude Code
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('✅ UNIVERSAL MCP BRIDGE READY!');
    console.error('');
    console.error('🎯 Claude Code can now use Central-MCP tools');
    console.error('🌍 Works automatically in ANY project!');
    console.error('🧠 This agent is now part of distributed intelligence!');
    console.error('');

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
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('   1. Is Central-MCP server running? (ws://34.41.115.199:3000/mcp)');
    console.error('   2. Check network connectivity');
    console.error('   3. Verify dependencies: ws, @modelcontextprotocol/sdk');
    console.error('');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('');
  console.error('🔌 Shutting down Universal MCP Bridge...');
  if (centralMCP) centralMCP.close();
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
