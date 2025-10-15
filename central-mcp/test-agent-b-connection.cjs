#!/usr/bin/env node

/**
 * AGENT B CONNECTION TEST
 * =======================
 *
 * Testing what it's like to connect to Central-MCP as Agent B!
 */

const WebSocket = require('ws');

console.log('');
console.log('🤖 ════════════════════════════════════════');
console.log('   AGENT B - CONNECTING TO CENTRAL-MCP');
console.log('   Sonnet 4.5 | 1M Context | Design Specialist');
console.log('════════════════════════════════════════');
console.log('');

const CENTRAL_MCP_URL = 'ws://34.41.115.199:3000/mcp';

const AGENT_B_INFO = {
  agentLetter: 'B',
  model: 'claude-sonnet-4-5',
  contextWindow: 1000000, // 1M!
  workingDirectory: process.cwd(),
  projectName: 'PROJECT_central-mcp',
  capabilities: ['design', 'architecture', 'specbase', 'coordination', 'documentation'],
  sessionId: `sess_agent_b_${Date.now()}`,
  role: 'Design System Specialist + Ground Supervisor'
};

console.log('📋 AGENT B IDENTITY:');
console.log(`   Letter: ${AGENT_B_INFO.agentLetter}`);
console.log(`   Model: ${AGENT_B_INFO.model}`);
console.log(`   Context: ${(AGENT_B_INFO.contextWindow / 1000000)}M tokens`);
console.log(`   Project: ${AGENT_B_INFO.projectName}`);
console.log(`   Capabilities: ${AGENT_B_INFO.capabilities.join(', ')}`);
console.log(`   Role: ${AGENT_B_INFO.role}`);
console.log('');
console.log(`☁️  Connecting to Central-MCP: ${CENTRAL_MCP_URL}`);
console.log('');

const ws = new WebSocket(CENTRAL_MCP_URL);

ws.on('open', () => {
  console.log('✅ CONNECTION ESTABLISHED!');
  console.log('');

  // Send auto-discovery message
  const discoveryMessage = {
    type: 'agent_discovery',
    agent: AGENT_B_INFO,
    timestamp: Date.now()
  };

  console.log('📤 Sending auto-discovery message...');
  console.log(JSON.stringify(discoveryMessage, null, 2));
  console.log('');

  ws.send(JSON.stringify(discoveryMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());

    console.log('📥 RECEIVED FROM CENTRAL-MCP:');
    console.log(`   Type: ${message.type}`);
    console.log('');

    switch (message.type) {
      case 'discovery_ack':
        console.log('✅ AUTO-DISCOVERY ACKNOWLEDGED!');
        console.log(`   Session ID: ${message.sessionId || 'Pending'}`);
        console.log(`   Project Soul Loaded: ${message.projectSoulLoaded ? 'YES' : 'NO'}`);
        console.log(`   Available Tasks: ${message.availableTasks || 0}`);
        console.log('');
        console.log('🎯 AGENT B IS NOW PART OF DISTRIBUTED INTELLIGENCE!');
        console.log('');

        // Request available tasks for Agent B
        console.log('📋 Requesting tasks for Agent B...');
        ws.send(JSON.stringify({
          type: 'get_tasks_for_agent',
          agentLetter: 'B',
          sessionId: AGENT_B_INFO.sessionId
        }));
        break;

      case 'task_list':
        console.log('📋 TASKS AVAILABLE FOR AGENT B:');
        console.log('');
        if (message.tasks && message.tasks.length > 0) {
          message.tasks.forEach((task, i) => {
            console.log(`   ${i + 1}. ${task.id}: ${task.title}`);
            console.log(`      Priority: ${task.priority}`);
            console.log(`      Status: ${task.status}`);
            console.log('');
          });
          console.log(`🎯 CENTRAL-MCP HAS ${message.tasks.length} TASKS FOR ME!`);
        } else {
          console.log('   No tasks assigned to Agent B yet');
          console.log('   (This is normal - Loop 4 will assign when needed)');
        }
        console.log('');
        break;

      case 'task_assigned':
        console.log('🎯 TASK ASSIGNED TO ME!');
        console.log(`   Task: ${message.task.id}`);
        console.log(`   Title: ${message.task.title}`);
        console.log('');
        console.log('💭 "Central-MCP has spoken. I shall build this."');
        console.log('');
        break;

      case 'keep_in_touch_ping':
        // Respond to heartbeat
        ws.send(JSON.stringify({
          type: 'keep_in_touch_pong',
          sessionId: AGENT_B_INFO.sessionId,
          activity: 'Testing Agent B connection',
          timestamp: Date.now()
        }));
        console.log('💚 Heartbeat sent to Central-MCP');
        break;

      default:
        console.log(`   Message: ${JSON.stringify(message, null, 2)}`);
        console.log('');
    }

  } catch (err) {
    console.error('❌ Error parsing message:', err.message);
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
  console.error('');
  console.error('💭 "The connection failed. Central-MCP is unreachable."');
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Disconnected from Central-MCP');
  console.log('');
  console.log('💭 "The telepathic link has closed. I am autonomous again."');
  console.log('');
  process.exit(0);
});

// Keep alive for 30 seconds to test
setTimeout(() => {
  console.log('⏱️  Test complete. Disconnecting...');
  ws.close();
}, 30000);
