#!/usr/bin/env npx tsx
/**
 * Register The Three Core Projects in Central-MCP
 * ================================================
 *
 * Registers:
 * 1. Central-MCP (infrastructure project)
 * 2. LocalBrain (voice AI workspace)
 * 3. Orchestra.Blue (financial management)
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/registry.db');

async function registerThreeProjects() {
  console.log('🎯 Registering Three Core Projects in Central-MCP\n');

  const db = new Database(DB_PATH);

  const projects = [
    {
      id: 'central-mcp',
      name: 'Central-MCP',
      path: '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp',
      git_remote: 'https://github.com/leolech14/central-mcp',
      type: 'INFRASTRUCTURE',
      vision: 'Universal multi-agent orchestration platform for coordinating AI agents across unlimited projects with zero configuration',
      discovered_by: 'manual'
    },
    {
      id: 'localbrain',
      name: 'LocalBrain',
      path: '/Users/lech/PROJECTS_all/LocalBrain',
      git_remote: 'https://github.com/leolech14/LocalBrain',
      type: 'COMMERCIAL_APP',
      vision: 'Revolutionary AI-powered voice interface - Talk to your computer with full system access. The only app to replace them all.',
      discovered_by: 'manual'
    },
    {
      id: 'orchestra-blue',
      name: 'Orchestra.Blue',
      path: '/Users/lech/PROJECTS_all/LocalBrain/02_SPECBASES/specbase-obsidian-orchestra',
      git_remote: null,
      type: 'COMMERCIAL_APP',
      vision: 'AI-powered personal financial management system with voice interaction, budget tracking, investment analysis, and regulatory compliance',
      discovered_by: 'manual'
    }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, name, path, git_remote, type, vision,
      created_at, last_activity, discovered_by, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)
  `);

  console.log('📝 Registering projects:\n');

  for (const project of projects) {
    stmt.run(
      project.id,
      project.name,
      project.path,
      project.git_remote,
      project.type,
      project.vision,
      project.discovered_by,
      JSON.stringify({
        priority: project.id === 'central-mcp' ? 'CRITICAL' : 'HIGH',
        status: 'ACTIVE',
        specbase: `02_SPECBASES/${project.id}/`
      })
    );

    console.log(`✅ ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Type: ${project.type}`);
    console.log(`   Path: ${project.path}`);
    console.log('');
  }

  // Verify registration
  const registered = db.prepare('SELECT id, name, type FROM projects ORDER BY id').all();

  console.log('\n📊 Registered Projects:\n');
  registered.forEach((p: any) => {
    console.log(`   ${p.id}: ${p.name} (${p.type})`);
  });

  console.log('\n✅ Three core projects registered in Central-MCP!\n');

  db.close();
}

registerThreeProjects().catch(console.error);
