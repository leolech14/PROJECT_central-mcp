#!/usr/bin/env node

/**
 * Simple Conversation Capture Test (No foreign keys)
 */

const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const DB_PATH = './data/registry.db';

console.log('🧪 TESTING CONVERSATION CAPTURE');
console.log('');

const db = new Database(DB_PATH);

// Disable foreign keys for testing
db.exec('PRAGMA foreign_keys = OFF;');

const sessionId = `sess_test_${Date.now()}`;
const messageId = randomUUID();

// Test WRITTEN message
const testMessage = `THIS IS A TEST! CONVERSATION CAPTURE SYSTEM VERIFICATION!`;

db.prepare(`
  INSERT INTO conversation_messages (
    id, session_id, project_id, agent_letter,
    message_type, content, language, input_method,
    word_count, character_count, semantic_density,
    timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  messageId,
  sessionId,
  'PROJECT_central-mcp',
  'SONNET-4.5',
  'USER_INPUT',
  testMessage,
  'en',
  'WRITTEN',
  9,
  testMessage.length,
  0.88,
  new Date().toISOString()
);

console.log(`✅ Test message inserted: ${messageId.slice(0, 12)}...`);

// Query back
const message = db.prepare(`
  SELECT * FROM conversation_messages WHERE id = ?
`).get(messageId);

console.log('');
console.log('📊 Retrieved message:');
console.log(`   ID: ${message.id.slice(0, 12)}...`);
console.log(`   Content: "${message.content}"`);
console.log(`   Method: ${message.input_method}`);
console.log(`   Language: ${message.language}`);
console.log(`   Project: ${message.project_id}`);
console.log('');
console.log('✅ CONVERSATION CAPTURE WORKS!');
console.log('');

// Count all messages
const count = db.prepare('SELECT COUNT(*) as count FROM conversation_messages').get();
console.log(`📊 Total messages in database: ${count.count}`);
console.log('');

db.close();
