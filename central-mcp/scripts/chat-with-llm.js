#!/usr/bin/env node
/**
 * DIRECT LLM CHAT - Terminal Interface
 * =====================================
 *
 * Talk directly to OpenAI GPT-4 Turbo from your terminal!
 *
 * Usage:
 *   node chat-with-llm.js "Your message here"
 *   OR
 *   node chat-with-llm.js  (interactive mode)
 *
 * With Doppler:
 *   doppler run --project ai-tools --config dev -- node chat-with-llm.js
 */

import OpenAI from 'openai';
import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY;
const orgId = process.env.OPENAI_ORG_ID;

if (!apiKey) {
  console.error('❌ ERROR: OPENAI_API_KEY not found!');
  console.error('');
  console.error('Set it with:');
  console.error('  export OPENAI_API_KEY="your-key"');
  console.error('  export OPENAI_ORG_ID="your-org-id"  # If using organization key');
  console.error('');
  console.error('OR use Doppler:');
  console.error('  doppler run --project ai-tools --config dev -- node chat-with-llm.js');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey,
  organization: orgId || undefined,  // Use org ID if provided
  dangerouslyAllowBrowser: false
});

// Conversation history
const conversationHistory = [];

// System prompt
const SYSTEM_PROMPT = `You are a helpful AI assistant integrated with Central-MCP, a revolutionary multi-agent coordination system. You can help with:

- Software architecture and design
- Code implementation guidance
- System integration strategies
- Technical problem solving
- Project planning and task breakdown

You're powered by GPT-4 Turbo and integrated with a system that can automatically generate specs and coordinate multiple AI agents to build what users need.

Be concise, direct, and helpful. When discussing implementation, think in terms of specifications and tasks that could be generated and assigned to specialized agents.`;

/**
 * Send message to OpenAI and stream response
 */
async function sendMessage(userMessage) {
  // Add user message to history
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });

  try {
    console.log('\n🤖 GPT-4 Turbo:\n');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory
      ],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      process.stdout.write(content);
    }

    console.log('\n');

    // Add assistant response to history
    conversationHistory.push({
      role: 'assistant',
      content: fullResponse
    });

    return fullResponse;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

/**
 * Interactive mode
 */
async function interactiveMode() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🧠 DIRECT LLM CHAT - GPT-4 Turbo                    ║');
  console.log('║     Connected to Central-MCP Intelligence System         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('💬 Type your message and press Enter');
  console.log('📝 Type "exit" or "quit" to leave');
  console.log('🔄 Type "clear" to reset conversation');
  console.log('📊 Type "history" to see conversation');
  console.log('');

  const rl = readline.createInterface({ input, output });

  const askQuestion = () => {
    rl.question('\n💬 You: ', async (answer) => {
      const input = answer.trim();

      if (!input) {
        askQuestion();
        return;
      }

      if (input === 'exit' || input === 'quit') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        return;
      }

      if (input === 'clear') {
        conversationHistory.length = 0;
        console.log('\n✅ Conversation history cleared!\n');
        askQuestion();
        return;
      }

      if (input === 'history') {
        console.log('\n📊 Conversation History:');
        console.log('═══════════════════════════════════════\n');
        conversationHistory.forEach((msg, idx) => {
          const role = msg.role === 'user' ? '💬 You' : '🤖 GPT-4';
          console.log(`${role}:`);
          console.log(msg.content);
          console.log('');
        });
        askQuestion();
        return;
      }

      try {
        await sendMessage(input);
      } catch (error) {
        console.error('Failed to send message. Try again.');
      }

      askQuestion();
    });
  };

  askQuestion();
}

/**
 * Single message mode
 */
async function singleMessageMode(message) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🧠 DIRECT LLM CHAT - GPT-4 Turbo                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n💬 You:', message);

  await sendMessage(message);
}

/**
 * Main
 */
async function main() {
  // Check if message provided as argument
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Single message mode
    const message = args.join(' ');
    await singleMessageMode(message);
  } else {
    // Interactive mode
    await interactiveMode();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
