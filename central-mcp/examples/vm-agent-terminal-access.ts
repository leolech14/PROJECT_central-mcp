/**
 * VM Agent Terminal Access Example
 * =================================
 *
 * Demonstrates how ANY agent (GLM-4.6, Gemini, Claude, etc.) can:
 * - Execute terminal commands on the VM
 * - Read/write files on the VM
 * - Work with the VM filesystem
 *
 * Through Central-MCP coordination!
 */

import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

/**
 * Example Agent that accesses VM terminal through Central-MCP
 */
class VMTerminalAgent {
  private ws?: WebSocket;
  private agentId: string;
  private centralMcpUrl: string;
  private pendingCalls: Map<string, (result: any) => void> = new Map();

  constructor(agentId: string, centralMcpUrl: string) {
    this.agentId = agentId;
    this.centralMcpUrl = centralMcpUrl;
  }

  /**
   * Connect to Central-MCP
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔗 Connecting to Central-MCP: ${this.centralMcpUrl}`);

      this.ws = new WebSocket(this.centralMcpUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.CENTRAL_MCP_JWT_TOKEN}`
        }
      });

      this.ws.on('open', () => {
        console.log('✅ Connected to Central-MCP');
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        const response = JSON.parse(data.toString());
        this.handleResponse(response);
      });

      this.ws.on('error', reject);
    });
  }

  /**
   * Execute bash command on VM
   */
  async executeBash(command: string, cwd?: string): Promise<any> {
    const callId = uuidv4();

    return this.callTool('executeBash', {
      command,
      cwd,
      timeout: 30000
    }, callId);
  }

  /**
   * Read file from VM
   */
  async readVMFile(path: string): Promise<string> {
    const result = await this.callTool('readVMFile', { path }, uuidv4());
    return result.content;
  }

  /**
   * Write file to VM
   */
  async writeVMFile(path: string, content: string): Promise<any> {
    return this.callTool('writeVMFile', {
      path,
      content,
      createDir: true
    }, uuidv4());
  }

  /**
   * List VM directory
   */
  async listVMDirectory(path: string, recursive = false): Promise<any> {
    return this.callTool('listVMDirectory', {
      path,
      recursive,
      includeHidden: false
    }, uuidv4());
  }

  /**
   * Call MCP tool
   */
  private callTool(toolName: string, arguments_: any, callId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected to Central-MCP'));
        return;
      }

      // Store callback
      this.pendingCalls.set(callId, resolve);

      // Send tool call request (MCP format)
      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_
        },
        id: callId
      };

      this.ws.send(JSON.stringify(request));

      // Timeout after 60 seconds
      setTimeout(() => {
        if (this.pendingCalls.has(callId)) {
          this.pendingCalls.delete(callId);
          reject(new Error('Tool call timeout'));
        }
      }, 60000);
    });
  }

  /**
   * Handle MCP response
   */
  private handleResponse(response: any): void {
    const { id, result, error } = response;

    if (this.pendingCalls.has(id)) {
      const callback = this.pendingCalls.get(id)!;
      this.pendingCalls.delete(id);

      if (error) {
        console.error('❌ Tool call error:', error);
      } else {
        callback(result);
      }
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}

/**
 * Example Usage Scenarios
 */
async function demonstrateVMAccess() {
  // Create agent (could be GLM-4.6, Gemini, Claude, etc.)
  const agent = new VMTerminalAgent(
    'glm-worker-001',
    'ws://34.41.115.199:3000/mcp'
  );

  try {
    // Connect to Central-MCP
    await agent.connect();

    console.log('\n🎯 Example 1: Execute bash command on VM');
    console.log('─────────────────────────────────────────');
    const lsResult = await agent.executeBash('ls -la /opt/central-mcp/src');
    console.log('📂 VM directory listing:');
    console.log(lsResult.stdout);

    console.log('\n🎯 Example 2: Read file from VM');
    console.log('─────────────────────────────────────────');
    const packageJson = await agent.readVMFile('/opt/central-mcp/package.json');
    const pkg = JSON.parse(packageJson);
    console.log('📦 VM package.json:', pkg.name, pkg.version);

    console.log('\n🎯 Example 3: Write file to VM');
    console.log('─────────────────────────────────────────');
    const testContent = `
# Test File Created by ${agent['agentId']}
Created at: ${new Date().toISOString()}
Agent Framework: GLM-4.6
Action: Remote file write through Central-MCP
`.trim();

    await agent.writeVMFile('/tmp/agent-test.txt', testContent);
    console.log('✅ File written to VM: /tmp/agent-test.txt');

    // Verify file was written
    const verification = await agent.readVMFile('/tmp/agent-test.txt');
    console.log('📝 Verification read:', verification.substring(0, 100) + '...');

    console.log('\n🎯 Example 4: List VM directory');
    console.log('─────────────────────────────────────────');
    const dirListing = await agent.listVMDirectory('/opt/central-mcp/src', false);
    console.log(`📁 Found ${dirListing.totalFiles} files, ${dirListing.totalDirectories} directories`);
    console.log('First 5 items:');
    dirListing.files.slice(0, 5).forEach((file: any) => {
      console.log(`  ${file.type === 'directory' ? '📁' : '📄'} ${file.name}`);
    });

    console.log('\n🎯 Example 5: Build project on VM');
    console.log('─────────────────────────────────────────');
    const buildResult = await agent.executeBash(
      'npm run build',
      '/opt/central-mcp'
    );
    console.log('🔨 Build output:', buildResult.stdout.substring(0, 200) + '...');
    console.log('Exit code:', buildResult.exitCode);

    console.log('\n🎯 Example 6: Check VM system info');
    console.log('─────────────────────────────────────────');
    const unameResult = await agent.executeBash('uname -a');
    console.log('💻 VM System:', unameResult.stdout);

    const uptimeResult = await agent.executeBash('uptime');
    console.log('⏰ VM Uptime:', uptimeResult.stdout);

    console.log('\n✅ All VM access demonstrations complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    agent.disconnect();
  }
}

/**
 * Example: Multi-Agent Coordination on VM
 */
async function demonstrateMultiAgentVMWork() {
  console.log('\n🤝 Multi-Agent VM Coordination Example');
  console.log('═══════════════════════════════════════════\n');

  // Create multiple agents
  const agentA = new VMTerminalAgent('glm-ui-agent', 'ws://34.41.115.199:3000/mcp');
  const agentB = new VMTerminalAgent('gemini-backend-agent', 'ws://34.41.115.199:3000/mcp');

  try {
    // Connect both agents
    await agentA.connect();
    await agentB.connect();

    console.log('📋 Agent A (UI): Checking frontend files on VM...');
    const frontendFiles = await agentA.listVMDirectory('/opt/central-mcp/src/photon', false);
    console.log(`   Found ${frontendFiles.totalFiles} files`);

    console.log('\n📋 Agent B (Backend): Checking backend files on VM...');
    const backendFiles = await agentB.listVMDirectory('/opt/central-mcp/src/tools', false);
    console.log(`   Found ${backendFiles.totalFiles} files`);

    console.log('\n🔨 Agent A: Modifying frontend code on VM...');
    await agentA.writeVMFile(
      '/tmp/ui-component.tsx',
      'export const TestComponent = () => <div>Agent A was here</div>;'
    );

    console.log('🔨 Agent B: Modifying backend code on VM...');
    await agentB.writeVMFile(
      '/tmp/api-endpoint.ts',
      'export const testEndpoint = (req, res) => { res.json({ agent: "B" }); };'
    );

    console.log('\n✅ Both agents successfully modified VM files!');
    console.log('🎯 This demonstrates multi-agent coordination on the same VM!');

  } finally {
    agentA.disconnect();
    agentB.disconnect();
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 VM Agent Terminal Access Examples');
  console.log('════════════════════════════════════════════════════\n');

  // Run demonstrations
  await demonstrateVMAccess();
  await demonstrateMultiAgentVMWork();

  console.log('\n✅ All examples complete!');
  console.log('\n💡 Key Takeaway:');
  console.log('   ANY agent (GLM-4.6, Gemini, Claude, custom) can:');
  console.log('   - Execute bash commands on VM');
  console.log('   - Read/write files on VM');
  console.log('   - Coordinate with other agents');
  console.log('   - All through Central-MCP! 🎯');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { VMTerminalAgent, demonstrateVMAccess, demonstrateMultiAgentVMWork };
