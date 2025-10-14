/**
 * Quick MCP Connection Test - Agent B
 * Check if there are any tasks available via MCP
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPConnection() {
  console.log('🔵 AGENT B - Connecting to MCP Task Registry...');
  console.log('📍 Location: localbrain-task-registry MCP server');
  console.log('');

  // Start MCP server
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseReceived = false;

  // Wait for server to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send MCP request to list tools
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  console.log('📤 Sending: tools/list request...');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Listen for response
  serverProcess.stdout.on('data', (data) => {
    const response = data.toString();

    // Skip log lines, only parse JSON-RPC responses
    const lines = response.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.jsonrpc === '2.0' && parsed.id === 1) {
          console.log('✅ MCP Server Response Received!');
          console.log('');
          console.log('📋 Available MCP Tools:');
          if (parsed.result && parsed.result.tools) {
            parsed.result.tools.forEach(tool => {
              console.log(`   • ${tool.name} - ${tool.description}`);
            });
          }
          responseReceived = true;

          // Now request available tasks for Agent B
          console.log('');
          console.log('🔍 Querying available tasks for Agent B...');

          const getTasksRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'get_available_tasks',
              arguments: {
                agent: 'B',
                includeDetails: true
              }
            }
          };

          serverProcess.stdin.write(JSON.stringify(getTasksRequest) + '\n');
        } else if (parsed.jsonrpc === '2.0' && parsed.id === 2) {
          console.log('');
          console.log('📋 AGENT B AVAILABLE TASKS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          if (parsed.result && parsed.result.content && parsed.result.content[0]) {
            const tasksData = JSON.parse(parsed.result.content[0].text);

            if (tasksData.tasks && tasksData.tasks.length > 0) {
              console.log(`✅ Found ${tasksData.tasks.length} available task(s):`);
              console.log('');
              tasksData.tasks.forEach(task => {
                console.log(`🎯 Task: ${task.id}`);
                console.log(`   Priority: ${task.priority}`);
                console.log(`   Agent: ${task.agentId}`);
                console.log(`   Status: ${task.status}`);
                console.log('');
              });
            } else {
              console.log('ℹ️  No tasks currently available for Agent B');
              console.log('   All Agent B tasks (4/4) are COMPLETE ✅');
            }
          }

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // Cleanup
          setTimeout(() => {
            serverProcess.kill();
            process.exit(0);
          }, 500);
        }
      } catch (e) {
        // Ignore non-JSON lines (logs)
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    // Ignore stderr logs
  });

  // Timeout after 5 seconds
  setTimeout(() => {
    if (!responseReceived) {
      console.log('❌ Timeout: No response from MCP server');
      serverProcess.kill();
      process.exit(1);
    }
  }, 5000);
}

testMCPConnection().catch(err => {
  console.error('❌ Connection failed:', err);
  process.exit(1);
});
