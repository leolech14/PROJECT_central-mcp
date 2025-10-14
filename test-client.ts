/**
 * MCP Client Test
 * =================
 *
 * A simple script to test the implemented TaskRegistryClient.
 */

import pkg from '../../../04_AGENT_FRAMEWORK/mcp-integration/TaskRegistryClient.js';
const { TaskRegistryClient } = pkg;

async function runTest() {
  console.log('🚀 Initializing MCP client for Agent A...');
  const client = new TaskRegistryClient('A');

  try {
    console.log('🔍 Calling getAvailableTasks()...');
    const availableTasks = await client.getAvailableTasks();

    console.log('✅ MCP Server Response:');
    console.log(JSON.stringify(availableTasks, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔌 Disconnecting client and stopping server...');
    client.disconnect();
  }
}

runTest();
