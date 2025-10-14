#!/usr/bin/env node

// ============================================================================
// UNIVERSAL WRITE SYSTEM - CLI Wrapper
// ============================================================================
// Purpose: Allow bash scripts to write events to Universal Write System
// Usage: ./write-event.cjs [EVENT_TYPE] [JSON_DATA]
// ============================================================================

const {
  writeSpecEvent,
  writeTaskEvent,
  writeCodeGenEvent,
  writeInterviewEvent,
  writeAgentEvent,
  writeSystemEvent
} = require('../dist/universal-write.cjs');

const eventType = process.argv[2];
const eventDataJson = process.argv[3];

if (!eventType || !eventDataJson) {
  console.error('Usage: ./write-event.cjs [EVENT_TYPE] [JSON_DATA]');
  console.error('');
  console.error('EVENT_TYPES:');
  console.error('  spec         - Specification events');
  console.error('  task         - Task events');
  console.error('  code         - Code generation events');
  console.error('  interview    - Interview events');
  console.error('  agent        - Agent activity events');
  console.error('  system       - System status events');
  console.error('');
  console.error('EXAMPLE:');
  console.error('  ./write-event.cjs interview \'{"sessionId":"interview-001","eventType":"session_started","eventCategory":"interview","eventActor":"system","eventAction":"Started gap resolution session"}\'');
  process.exit(1);
}

try {
  const eventData = JSON.parse(eventDataJson);
  let eventId;

  switch (eventType) {
    case 'spec':
      eventId = writeSpecEvent(eventData);
      break;
    case 'task':
      eventId = writeTaskEvent(eventData);
      break;
    case 'code':
      eventId = writeCodeGenEvent(eventData);
      break;
    case 'interview':
      eventId = writeInterviewEvent(eventData);
      break;
    case 'agent':
      eventId = writeAgentEvent(eventData);
      break;
    case 'system':
      eventId = writeSystemEvent(eventData);
      break;
    default:
      console.error(`Unknown event type: ${eventType}`);
      process.exit(1);
  }

  console.log(eventId);
  process.exit(0);
} catch (error) {
  console.error(`Error writing event: ${error.message}`);
  process.exit(1);
}
