#!/usr/bin/env tsx
/**
 * Load LocalBrain Tasks into MCP Database
 *
 * This script parses CENTRAL_TASK_REGISTRY.md and loads all tasks
 * into the MCP database so agents can claim and work on them.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REGISTRY_PATH = '/Users/lech/PROJECTS_all/LocalBrain/04_AGENT_FRAMEWORK/CENTRAL_TASK_REGISTRY.md';
const DB_PATH = join(__dirname, '../data/registry.db');

interface Task {
  id: string;
  title: string;
  agent: string;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'CLAIMED' | 'AVAILABLE' | 'BLOCKED';
  priority: 'P0' | 'P1' | 'P2';
  dependencies: string[];
  estimated_hours: number;
  actual_minutes?: number;
  files_created?: string[];
  completion_percentage?: number;
  completed_at?: string;
  started_at?: string;
  claimed_by?: string;
}

function parseRegistry(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split('\n');

  let currentTask: Partial<Task> | null = null;
  let inTask = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect task header: ### **T001 - Title**
    const taskHeaderMatch = line.match(/^### \*\*(T\d+) - (.+?)\*\*/);
    if (taskHeaderMatch) {
      // Save previous task
      if (currentTask && currentTask.id) {
        tasks.push(currentTask as Task);
      }

      // Start new task
      currentTask = {
        id: taskHeaderMatch[1],
        title: taskHeaderMatch[2].replace(/⚡|🔄|🔗|🔥/g, '').trim(),
        dependencies: [],
        estimated_hours: 8, // Default
        completion_percentage: 0
      };
      inTask = true;
      continue;
    }

    if (!inTask || !currentTask) continue;

    // Parse fields
    if (line.includes('**Agent**:')) {
      const agentMatch = line.match(/\*\*Agent\*\*:\s*([A-F])/);
      if (agentMatch) currentTask.agent = agentMatch[1];
    }

    if (line.includes('**Status**:')) {
      if (line.includes('COMPLETE')) currentTask.status = 'COMPLETE';
      else if (line.includes('IN PROGRESS') || line.includes('IN_PROGRESS')) currentTask.status = 'IN_PROGRESS';
      else if (line.includes('CLAIMED')) currentTask.status = 'CLAIMED';
      else if (line.includes('BLOCKED')) currentTask.status = 'BLOCKED';
      else if (line.includes('AVAILABLE')) currentTask.status = 'AVAILABLE';
      else currentTask.status = 'AVAILABLE'; // Default
    }

    if (line.includes('**Priority**:')) {
      if (line.includes('P0')) currentTask.priority = 'P0';
      else if (line.includes('P1')) currentTask.priority = 'P1';
      else currentTask.priority = 'P2';
    }

    if (line.includes('**Dependencies**:') || line.includes('DEPS:')) {
      const depsMatch = line.match(/DEPS:\s*\[([^\]]*)\]/);
      if (depsMatch && depsMatch[1].trim()) {
        currentTask.dependencies = depsMatch[1].split(',').map(d => d.trim()).filter(d => d);
      }
    }

    if (line.includes('**Timeline**:')) {
      const hoursMatch = line.match(/(\d+)\s*hours?/);
      if (hoursMatch) currentTask.estimated_hours = parseInt(hoursMatch[1]);
    }

    if (line.includes('**Completed At**:')) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
      if (dateMatch) {
        currentTask.completed_at = dateMatch[1];
        currentTask.completion_percentage = 100;
      }
    }

    if (line.includes('**Started At**:')) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
      if (dateMatch) currentTask.started_at = dateMatch[1];
    }

    if (line.includes('**Claimed By**:')) {
      const agentMatch = line.match(/Agent ([A-F])/);
      if (agentMatch) currentTask.claimed_by = agentMatch[1];
    }
  }

  // Save last task
  if (currentTask && currentTask.id) {
    tasks.push(currentTask as Task);
  }

  return tasks;
}

function loadTasksIntoDatabase(tasks: Task[]) {
  console.log(`📊 Loading ${tasks.length} tasks into MCP database...`);

  const db = new Database(DB_PATH);

  // Clear existing tasks
  db.exec('DELETE FROM tasks');

  // Insert tasks using existing schema (name, not title)
  const insert = db.prepare(`
    INSERT INTO tasks (
      id, name, agent, status, priority, phase, timeline, dependencies,
      deliverables, acceptance_criteria, location, claimed_by, started_at,
      completed_at, estimated_hours, actual_minutes, files_created
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertMany = db.transaction((tasks: Task[]) => {
    for (const task of tasks) {
      insert.run(
        task.id,                                      // id
        task.title,                                   // name
        task.agent || 'UNASSIGNED',                   // agent (required NOT NULL)
        task.status || 'AVAILABLE',                   // status
        task.priority || 'P1',                        // priority
        'META_LAYER',                                 // phase (default for all LocalBrain tasks)
        `${task.estimated_hours || 8} hours`,         // timeline
        JSON.stringify(task.dependencies || []),      // dependencies
        JSON.stringify([]),                           // deliverables (empty array)
        JSON.stringify([]),                           // acceptance_criteria (empty array)
        '04_AGENT_FRAMEWORK',                         // location (default for META layer tasks)
        task.claimed_by || null,                      // claimed_by
        task.started_at || null,                      // started_at (ISO string)
        task.completed_at || null,                    // completed_at (ISO string)
        task.estimated_hours || 8,                    // estimated_hours
        task.actual_minutes || null,                  // actual_minutes
        JSON.stringify(task.files_created || [])      // files_created
      );
    }
  });

  insertMany(tasks);

  // Verify
  const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };

  db.close();

  console.log(`✅ Loaded ${count.count} tasks into database`);

  // Show status breakdown
  const statusDb = new Database(DB_PATH);
  const statuses = statusDb.prepare(`
    SELECT status, COUNT(*) as count
    FROM tasks
    GROUP BY status
  `).all() as Array<{ status: string; count: number }>;

  console.log('\n📊 Task Status Breakdown:');
  for (const { status, count } of statuses) {
    console.log(`   ${status}: ${count} tasks`);
  }

  statusDb.close();
}

// Main execution
try {
  console.log('🚀 Loading LocalBrain tasks into MCP database...');
  console.log(`📖 Reading from: ${REGISTRY_PATH}`);
  console.log(`💾 Writing to: ${DB_PATH}\n`);

  const content = readFileSync(REGISTRY_PATH, 'utf-8');
  const tasks = parseRegistry(content);

  if (tasks.length === 0) {
    console.error('❌ No tasks found in registry!');
    process.exit(1);
  }

  console.log(`📋 Parsed ${tasks.length} tasks from registry`);

  // Check for duplicate task IDs
  const taskIds = tasks.map(t => t.id);
  const uniqueIds = new Set(taskIds);
  if (taskIds.length !== uniqueIds.size) {
    console.log('⚠️  Found duplicate task IDs:');
    const idCounts = taskIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(idCounts).forEach(([id, count]) => {
      if (count > 1) console.log(`   ${id}: ${count} times`);
    });
    console.log('\n🔧 Filtering to unique tasks...');
    // Keep only the first occurrence of each task ID
    const seen = new Set<string>();
    const uniqueTasks = tasks.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    console.log(`   Reduced from ${tasks.length} to ${uniqueTasks.length} tasks\n`);
    loadTasksIntoDatabase(uniqueTasks);
  } else {
    loadTasksIntoDatabase(tasks);
  }

  console.log('\n✅ Task loading complete!');
  console.log('🎯 Agents can now query and claim tasks via MCP');

} catch (error) {
  console.error('❌ Error loading tasks:', error);
  process.exit(1);
}
