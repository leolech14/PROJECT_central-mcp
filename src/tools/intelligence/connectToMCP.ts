/**
 * SEAMLESS MCP CONNECTION
 * ========================
 *
 * ONE COMMAND: "Connect to MCP"
 * AUTO-DETECTS EVERYTHING!
 *
 * No parameters needed - fully automatic!
 */

import { execSync } from 'child_process';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { handleAgentConnect } from './agentConnect.js';

const ConnectToMCPSchema = z.object({
  // All optional - will auto-detect!
  agent: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).optional(),
  model: z.string().optional(),
  project: z.string().optional()
});

export const connectToMCPTool = {
  name: 'connect_to_mcp',
  description: 'SEAMLESS: Connect to Central-MCP with auto-detection (just say "CONNECT TO MCP"!)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent: {
        type: 'string',
        enum: ['A', 'B', 'C', 'D', 'E', 'F'],
        description: 'Agent letter (auto-detected if not provided)'
      },
      model: {
        type: 'string',
        description: 'Model name (auto-detected if not provided)'
      },
      project: {
        type: 'string',
        description: 'Project name (auto-detected from working directory)'
      }
    },
    required: [] // NOTHING required - all auto-detected!
  }
};

export async function handleConnectToMCP(args: unknown, db: Database.Database) {
  const parsed = ConnectToMCPSchema.parse(args);

  console.log('🔍 AUTO-DETECTING agent parameters...');

  // AUTO-DETECT EVERYTHING!
  const autoDetected = {
    // 1. Detect agent letter
    agent: parsed.agent || detectAgentLetter(),

    // 2. Detect model
    model: parsed.model || detectModel(),

    // 3. Detect context window
    contextWindow: detectContextWindow(),

    // 4. Detect project
    project: parsed.project || detectProject(),

    // 5. Detect working directory
    workingDirectory: process.cwd(),

    // 6. Detect capabilities
    capabilities: detectCapabilities(),

    // 7. Detect hardware
    hardware: detectHardware(),

    // 8. Machine ID
    machineId: getMachineId()
  };

  console.log(`✅ Detected: Agent ${autoDetected.agent}, ${autoDetected.model}, Project: ${autoDetected.project}`);

  // Call the full agent_connect with auto-detected parameters
  return await handleAgentConnect(autoDetected, db);
}

// AUTO-DETECTION FUNCTIONS

function detectAgentLetter(): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  // Check environment variable
  if (process.env.AGENT_LETTER) {
    return process.env.AGENT_LETTER as any;
  }

  // Detect from model
  const model = detectModel().toLowerCase();

  if (model.includes('glm')) return 'A'; // GLM = Worker agents (A or C)
  if (model.includes('sonnet')) return 'B'; // Sonnet = Specialists (B or D)
  if (model.includes('gemini')) return 'E'; // Gemini = Supervisor
  if (model.includes('gpt')) return 'F'; // GPT = Strategic

  // Default: B (this agent!)
  return 'B';
}

function detectModel(): string {
  // Check environment
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  if (process.env.AGENT_MODEL) return process.env.AGENT_MODEL;

  // Try to detect from running process
  try {
    // Check if Claude Code environment
    if (process.env.CLAUDE_CODE_VERSION) {
      return 'claude-sonnet-4-5'; // Default for Claude Code
    }
  } catch {
    // Ignore
  }

  return 'claude-sonnet-4-5'; // Safe default
}

function detectContextWindow(): number {
  const model = detectModel().toLowerCase();

  // Model-specific context windows
  if (model.includes('sonnet-4')) return 1000000; // 1M for Sonnet 4.5
  if (model.includes('gemini-2.5')) return 1000000; // 1M for Gemini 2.5
  if (model.includes('glm-4-plus')) return 1000000; // 1M for GLM-4-Plus
  if (model.includes('glm')) return 200000; // 200K for GLM-4
  if (model.includes('gpt-5')) return 200000; // Assume 200K for GPT-5

  return 200000; // Safe default
}

function detectProject(): string {
  const cwd = process.cwd();

  // Check for PROJECTS_all/ pattern
  const match = cwd.match(/PROJECTS_all\/([^\/]+)/);
  if (match) return match[1];

  // Check for PROJECT_ prefix in current directory
  const dirname = cwd.split('/').pop() || '';
  if (dirname.startsWith('PROJECT_')) return dirname;

  // Check for package.json name
  try {
    const pkg = require(cwd + '/package.json');
    if (pkg.name) return pkg.name;
  } catch {
    // Ignore
  }

  // Check for CLAUDE.md
  try {
    const fs = require('fs');
    if (fs.existsSync(cwd + '/CLAUDE.md')) {
      return dirname;
    }
  } catch {
    // Ignore
  }

  return 'unknown-project';
}

function detectCapabilities(): string[] {
  const agent = detectAgentLetter();

  const defaultCaps: Record<string, string[]> = {
    'A': ['ui', 'frontend', 'react', 'rapid-prototyping'],
    'B': ['design', 'architecture', 'specbase', 'coordination', 'coherence'],
    'C': ['backend', 'api', 'database', 'services'],
    'D': ['integration', 'coordination', 'testing', 'deployment'],
    'E': ['supervision', 'analysis', 'knowledge-management'],
    'F': ['strategy', 'planning', 'validation']
  };

  return defaultCaps[agent] || ['general'];
}

function detectHardware(): { cpu?: string; memory?: string; os?: string } {
  const hardware: any = {};

  try {
    // Detect OS
    hardware.os = process.platform;

    // Detect CPU (simplified)
    if (process.arch) {
      hardware.cpu = process.arch;
    }

    // Detect available memory
    const os = require('os');
    const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    hardware.memory = `${totalMemGB}GB`;

  } catch {
    // Ignore detection errors
  }

  return hardware;
}

function getMachineId(): string {
  try {
    const os = require('os');
    return os.hostname() || 'unknown';
  } catch {
    return 'unknown';
  }
}
