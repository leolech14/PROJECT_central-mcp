
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/scripts/universal-mcp-bridge.js']
  });

  const client = new Client({ name: 'bridge-checker', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  try {
    const result = await client.callTool({ name: 'get_session_status', arguments: {} });
    console.log('Result from get_session_status:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error calling tool:', error);
  } 
}

main().catch(console.error);
