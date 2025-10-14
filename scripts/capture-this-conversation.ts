#!/usr/bin/env npx tsx

/**
 * EMERGENCY CONVERSATION CAPTURE
 * ===============================
 *
 * Captures THIS EXACT conversation manually and stores in Central-MCP
 * Use this while full auto-capture system is being deployed
 *
 * Run: npx tsx scripts/capture-this-conversation.ts
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import * as readline from 'readline';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '../data/registry.db');

interface ConversationMessage {
  speaker: 'USER' | 'AGENT';
  content: string;
  timestamp: string;
}

async function captureConversation() {
  console.log('');
  console.log('🧠 EMERGENCY CONVERSATION CAPTURE');
  console.log('==================================');
  console.log('');
  console.log('This will capture the CURRENT conversation and store it in Central-MCP.');
  console.log('');

  const db = new Database(DB_PATH);

  // First, run migration if not already run
  console.log('🗄️ Ensuring database schema is ready...');
  try {
    const migrationSQL = `
-- Quick schema check and creation
CREATE TABLE IF NOT EXISTS conversation_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  project_id TEXT,
  agent_letter TEXT,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT,
  input_method TEXT,
  word_count INTEGER,
  character_count INTEGER,
  semantic_density REAL,
  timestamp TEXT NOT NULL,
  metadata TEXT
);
    `;
    db.exec(migrationSQL);
    console.log('✅ Database schema ready');
  } catch (err: any) {
    console.log('⚠️  Schema might already exist:', err.message);
  }

  console.log('');
  console.log('📋 CONVERSATION CAPTURE MODE');
  console.log('');
  console.log('Enter conversation messages (type "DONE" when finished):');
  console.log('Format: USER: message content');
  console.log('        AGENT: response content');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const messages: ConversationMessage[] = [];
  const sessionId = `sess_${Date.now()}_manual_capture`;
  const projectId = 'PROJECT_central-mcp'; // Project 0!

  // Or use a simpler approach - just paste the key user messages
  console.log('🎯 QUICK CAPTURE: Paste key user messages below (one per line):');
  console.log('(Press Ctrl+D when done)');
  console.log('');

  const lines: string[] = [];

  rl.on('line', (line) => {
    if (line.trim() === 'DONE' || line.trim() === '') {
      rl.close();
    } else {
      lines.push(line);
    }
  });

  rl.on('close', () => {
    console.log('');
    console.log(`📥 Captured ${lines.length} lines`);
    console.log('');

    // Process and store each line
    let messageCount = 0;
    for (const line of lines) {
      if (!line.trim()) continue;

      // Detect if USER or AGENT message
      const isUserMessage = line.startsWith('USER:') ||
                           line.match(/^[A-Z\s!?]{10,}/) ||
                           !line.startsWith('AGENT:');

      const content = line.replace(/^(USER:|AGENT:)\s*/, '').trim();

      if (!content) continue;

      // Analyze message
      const words = content.split(/\s+/).length;
      const capitals = (content.match(/[A-Z]/g) || []).length;
      const letters = (content.match(/[a-zA-Z]/g) || []).length;
      const capitalRatio = letters > 0 ? capitals / letters : 0;

      const inputMethod = capitalRatio > 0.3 ? 'WRITTEN' : (capitalRatio < 0.05 ? 'SPOKEN' : 'UNKNOWN');
      const language = /então|quando|pode|muito|para/i.test(content) ? 'pt-BR' : 'en';

      const messageType = isUserMessage ? 'USER_INPUT' : 'AGENT_RESPONSE';

      // Store in database
      const stmt = db.prepare(`
        INSERT INTO conversation_messages (
          id, session_id, project_id, agent_letter,
          message_type, content, language, input_method,
          word_count, character_count, semantic_density,
          timestamp, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        randomUUID(),
        sessionId,
        projectId,
        'SONNET-4.5', // Current agent
        messageType,
        content,
        language,
        inputMethod,
        words,
        content.length,
        0.5, // Placeholder
        new Date().toISOString(),
        JSON.stringify({
          hasCapitalLetters: capitalRatio > 0.2,
          capitalLetterRatio: capitalRatio,
          manualCapture: true
        })
      );

      messageCount++;
    }

    console.log(`✅ CAPTURED ${messageCount} messages to Central-MCP`);
    console.log('');
    console.log('📊 Conversation Stats:');

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN message_type = 'USER_INPUT' THEN 1 ELSE 0 END) as user_messages,
        SUM(CASE WHEN input_method = 'WRITTEN' THEN 1 ELSE 0 END) as written,
        SUM(CASE WHEN input_method = 'SPOKEN' THEN 1 ELSE 0 END) as spoken,
        SUM(word_count) as total_words
      FROM conversation_messages
      WHERE session_id = ?
    `).get(sessionId) as any;

    console.log(`  Total messages: ${stats.total}`);
    console.log(`  User messages: ${stats.user_messages}`);
    console.log(`  Written (CAPITAL): ${stats.written}`);
    console.log(`  Spoken (transcribed): ${stats.spoken}`);
    console.log(`  Total words: ${stats.total_words}`);
    console.log('');
    console.log(`🎯 Session ID: ${sessionId}`);
    console.log(`📁 Project: ${projectId} (Project 0 - Central-MCP building itself!)`);
    console.log('');
    console.log('🧠 THIS CONVERSATION IS NOW PERMANENT INTELLIGENCE! 🚀');
    console.log('');

    db.close();
    process.exit(0);
  });
}

captureConversation().catch(console.error);
