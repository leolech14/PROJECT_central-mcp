#!/usr/bin/env npx tsx

/**
 * Register LocalBrain Agents in Central-MCP
 * =========================================
 *
 * Populates the Central-MCP database with LocalBrain agents A, B, C, D, E, F
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LocalBrain Agent Definitions
const localBrainAgents = [
  {
    id: 'A',
    name: 'UI Velocity Specialist',
    model: 'GLM-4.6',
    context: '200K',
    specialization: 'Frontend components, React/SwiftUI development',
    capabilities: ['Rapid prototyping', 'Interface implementation', 'Design system application'],
    tools: ['SniperGunClient for HTML component analysis'],
    status: 'active',
    role: 'Worker Specialist'
  },
  {
    id: 'B',
    name: 'Design System Specialist',
    model: 'Sonnet-4.5',
    context: '200K',
    specialization: 'OKLCH color system, accessibility (WCAG 2.2 AA)',
    capabilities: ['Component library', 'Visual consistency', 'UI/UX architecture'],
    tools: ['SniperGunClient for design impact analysis'],
    status: 'active',
    role: 'Integration Specialist'
  },
  {
    id: 'C',
    name: 'Backend Services Specialist',
    model: 'GLM-4.6',
    context: '200K',
    specialization: 'API development, database operations',
    capabilities: ['Service architecture', 'Data management', 'Infrastructure implementation'],
    tools: ['SniperGunClient for component extraction and refactoring'],
    status: 'active',
    role: 'Worker Specialist'
  },
  {
    id: 'D',
    name: 'Integration Specialist',
    model: 'Sonnet-4.5',
    context: '200K',
    specialization: 'Swift ↔ Electron IPC bridge',
    capabilities: ['Multi-platform coordination', 'System integration & testing'],
    tools: ['SniperGunClient for semantic code analysis'],
    status: 'active',
    role: 'Integration Specialist'
  },
  {
    id: 'E',
    name: 'Ground Supervisor / Librarian',
    model: 'Gemini-2.5-Pro',
    context: '1M',
    specialization: 'Complete codebase understanding',
    capabilities: ['Cross-agent coordination', 'Conflict resolution', 'Knowledge management'],
    tools: ['Architectural coherence'],
    status: 'active',
    role: 'Ground Supervisor'
  },
  {
    id: 'F',
    name: 'Strategic Supervisor',
    model: 'ChatGPT-5',
    context: 'N/A',
    specialization: 'Strategic guidance & roadmap planning',
    capabilities: ['Instruction-set generation', 'Definition of Done validation', 'Zip iteration orchestration'],
    tools: ['High-level architectural decisions'],
    status: 'active',
    role: 'Cloud Supervisor'
  }
];

console.log('🤖 Registering LocalBrain Agents in Central-MCP');
console.log('===============================================\n');

try {
  // Initialize database
  const dbPath = path.join(__dirname, '../data/registry.db');
  const db = new Database(dbPath);

  // Create agents table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      context_window TEXT,
      specialization TEXT NOT NULL,
      capabilities TEXT,
      tools TEXT,
      status TEXT DEFAULT 'active',
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert agents (adapt to existing schema)
  const insertAgent = db.prepare(`
    INSERT OR REPLACE INTO agents
    (id, tracking_id, name, model_id, model_signature, capabilities, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  console.log('📝 Registering agents:');

  for (const agent of localBrainAgents) {
    const result = insertAgent.run(
      agent.id,
      `LocalBrain-${agent.id}-${Date.now()}`,
      agent.name,
      agent.model,
      `${agent.model}-${agent.context}`,
      JSON.stringify({
        specialization: agent.specialization,
        capabilities: agent.capabilities,
        tools: agent.tools,
        role: agent.role,
        status: agent.status,
        context: agent.context
      }),
      JSON.stringify({
        project: 'LocalBrain',
        role: agent.role,
        specialization: agent.specialization
      })
    );

    console.log(`   ✅ Agent ${agent.id} (${agent.name}) registered`);
    console.log(`      Model: ${agent.model} | Context: ${agent.context}`);
    console.log(`      Specialization: ${agent.specialization}`);
    console.log('');
  }

  // Verify registration
  const verifyAgents = db.prepare('SELECT * FROM agents ORDER BY id').all();

  console.log('📊 Current Agent Registry:');
  console.log('=========================');

  for (const agent of verifyAgents as any[]) {
    const capabilities = JSON.parse(agent.capabilities || '{}');
    const metadata = JSON.parse(agent.metadata || '{}');
    console.log(`🤖 ${agent.id}: ${agent.name}`);
    console.log(`   Model: ${agent.model_id} | Signature: ${agent.model_signature}`);
    console.log(`   Specialization: ${capabilities.specialization}`);
    console.log(`   Role: ${capabilities.role}`);
    console.log(`   Capabilities: ${capabilities.capabilities?.slice(0, 3).join(', ')}${capabilities.capabilities?.length > 3 ? '...' : ''}`);
    console.log(`   Status: ${capabilities.status}`);
    console.log('');
  }

  console.log('🎯 Agent Registration Complete!');
  console.log('==============================');
  console.log('✅ LocalBrain agents A-F now registered in Central-MCP');
  console.log('✅ Agents can now be assigned tasks and tracked');
  console.log('✅ Central-MCP can coordinate LocalBrain agent workflows');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Update LocalBrain agent instructions to use MCP protocol');
  console.log('2. Replace manual task tracking with Central-MCP coordination');
  console.log('3. Enable real-time agent communication through Central-MCP');

  db.close();

} catch (error) {
  console.error('❌ Failed to register agents:', error);
  process.exit(1);
}