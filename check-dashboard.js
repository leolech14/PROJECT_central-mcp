/**
 * Check Agent Dashboard via MCP
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkDashboard() {
  console.log('🔵 AGENT B - Requesting Agent Dashboard...');
  console.log('');

  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  const dashboardRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'get_agent_dashboard',
      arguments: {
        agentFilter: 'ALL',
        detailLevel: 'summary'
      }
    }
  };

  serverProcess.stdin.write(JSON.stringify(dashboardRequest) + '\n');

  serverProcess.stdout.on('data', (data) => {
    const response = data.toString();
    const lines = response.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.jsonrpc === '2.0' && parsed.id === 1) {
          if (parsed.result && parsed.result.content && parsed.result.content[0]) {
            const dashboardText = parsed.result.content[0].text;
            console.log(dashboardText);
          }

          setTimeout(() => {
            serverProcess.kill();
            process.exit(0);
          }, 500);
        }
      } catch (e) {
        // Ignore
      }
    }
  });

  setTimeout(() => {
    serverProcess.kill();
    process.exit(1);
  }, 5000);
}

checkDashboard();
