/**
 * Complete Workflow Integration Tests
 * =====================================
 *
 * End-to-end tests for complete agent workflows
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import { DiscoveryEngine } from '../../src/discovery/DiscoveryEngine.js';
import { TaskRegistry } from '../../src/registry/TaskRegistry.js';
import { SessionManager } from '../../src/intelligence/SessionManager.js';
import { KeepInTouchEnforcer } from '../../src/core/KeepInTouchEnforcer.js';
import { execSync } from 'child_process';
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

describe('Complete Workflow Integration Tests', () => {
  let db: Database.Database;
  let discovery: DiscoveryEngine;
  let registry: TaskRegistry;
  let sessionMgr: SessionManager;
  let kitEnforcer: KeepInTouchEnforcer;

  const testDbPath = path.join(process.cwd(), 'data', 'test-integration.db');
  const testRepoPath = path.join(process.cwd(), 'test-integration-repo');

  beforeAll(async () => {
    // Create test database with all tables
    db = new Database(testDbPath);

    // Run all migrations
    const migrations = [
      '001_initial_schema.sql',
      '002_agent_intelligence.sql',
      '003_projects_table.sql',
      '004_agents_table.sql',
      '005_context_files_table.sql',
      '006_add_claimed_at_column.sql'
    ];

    for (const migration of migrations) {
      const migPath = path.join(process.cwd(), 'src/database/migrations', migration);
      if (existsSync(migPath)) {
        const sql = require('fs').readFileSync(migPath, 'utf-8');
        try {
          db.exec(sql);
        } catch (error) {
          // Migration might fail if already applied
        }
      }
    }

    // Initialize components
    discovery = new DiscoveryEngine(db);
    registry = new TaskRegistry(testDbPath);
    await registry.initialize();
    sessionMgr = new SessionManager(db);
    kitEnforcer = new KeepInTouchEnforcer(db);

    // Create test git repo
    if (existsSync(testRepoPath)) {
      execSync(`rm -rf ${testRepoPath}`, { stdio: 'ignore' });
    }

    mkdirSync(testRepoPath, { recursive: true });
    execSync('git init', { cwd: testRepoPath, stdio: 'ignore' });
    execSync('git config user.email "test@test.com"', { cwd: testRepoPath, stdio: 'ignore' });
    execSync('git config user.name "Test"', { cwd: testRepoPath, stdio: 'ignore' });

    writeFileSync(path.join(testRepoPath, 'README.md'), '# Test');
    execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
    execSync('git commit -m "Initial"', { cwd: testRepoPath, stdio: 'ignore' });

    // Insert test project and tasks
    db.exec(`
      INSERT INTO projects (id, name, path, type, created_at, last_activity, discovered_by, git_remote, vision, metadata)
      VALUES ('test-proj', 'TestProject', '${testRepoPath}', 'TOOL', datetime('now'), datetime('now'), 'auto', 'github.com/test/test', 'Test project', '{}');

      INSERT INTO tasks (id, name, agent, status, priority, dependencies, project_id, estimated_hours)
      VALUES
        ('T001', 'Foundation', 'A', 'AVAILABLE', 'P0', '[]', 'test-proj', 4),
        ('T002', 'Feature', 'A', 'BLOCKED', 'P1', '["T001"]', 'test-proj', 6);
    `);
  });

  afterAll(() => {
    registry.close();
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
    if (existsSync(testRepoPath)) {
      execSync(`rm -rf ${testRepoPath}`, { stdio: 'ignore' });
    }
  });

  it('Complete agent workflow: discover → claim → work → complete', async () => {
    // 1. Agent connects and discovers environment
    const discoveryResult = await discovery.discoverEnvironment({
      cwd: testRepoPath,
      modelId: 'glm-4.6'
    });

    expect(discoveryResult.project).toBeDefined();
    expect(discoveryResult.project.name).toBe('TestProject');
    expect(discoveryResult.agent).toBeDefined();

    const agentId = discoveryResult.agent.id;

    // 2. Create session
    const session = sessionMgr.createSession({
      agent: 'A',
      model: 'GLM-4.6',
      project: 'test-proj'
    });

    expect(session).toBeDefined();

    // 3. Create Keep-in-Touch session
    const kitSession = kitEnforcer.createSession(agentId, 'test-proj', 'T001');
    expect(kitSession.status).toBe('ACTIVE');

    // 4. Claim task
    const claimResult = await registry.claimTask('T001', 'A');
    expect(claimResult.success).toBe(true);

    // 5. Update progress
    const task = registry.getTask('T001');
    expect(task?.status).toBe('CLAIMED');

    // 6. Send heartbeat
    sessionMgr.updateHeartbeat(session.id);

    // 7. Check in
    kitEnforcer.checkIn(kitSession.id, agentId, {
      currentActivity: 'Working on task',
      progress: 50
    });

    // 8. Complete work (create files)
    writeFileSync(path.join(testRepoPath, 'feature.ts'), 'const x = 1;');
    execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
    execSync('git commit -m "T001: Add feature"', { cwd: testRepoPath, stdio: 'ignore' });

    // 9. Request completion permission
    const permission = await kitEnforcer.checkPermission('T001', agentId);

    // Should create pending permission
    expect(permission.granted).toBe(false);
    expect(permission.blocked).toBe(true);

    // Wait for auto-approval or grant manually
    const permissions = kitEnforcer.getPendingPermissions();
    if (permissions.length > 0) {
      kitEnforcer.grantPermission(permissions[0].id, 'AUTO');
    }

    // 10. Complete task
    const completeResult = await registry.completeTask('T001', 'A', ['feature.ts'], 100);

    expect(completeResult.success).toBe(true);
    expect(completeResult.unblocked).toContain('T002');

    // 11. Verify T002 is now available
    const task2 = registry.getTask('T002');
    expect(task2?.status).toBe('AVAILABLE');

    // 12. Disconnect
    sessionMgr.closeSession(session.id);
    kitEnforcer.closeSession(kitSession.id);

    const closedSession = sessionMgr.getSession(session.id);
    expect(closedSession?.status).toBe('DISCONNECTED');

    console.log('✅ Complete workflow test PASSED!');
  }, 30000);

  it('Multi-agent coordination: two agents, no conflicts', async () => {
    // Agent A discovers
    const discoveryA = await discovery.discoverEnvironment({
      cwd: testRepoPath,
      modelId: 'glm-4.6'
    });

    // Agent C discovers
    const discoveryC = await discovery.discoverEnvironment({
      cwd: testRepoPath,
      modelId: 'glm-4.6'
    });

    // Both should get different agent IDs
    expect(discoveryA.agent.id).not.toBe(discoveryC.agent.id);

    // Reset T001 to available
    db.prepare(`UPDATE tasks SET status = 'AVAILABLE', claimed_by = NULL WHERE id = 'T001'`).run();

    // Both try to claim same task
    const claimA = await registry.claimTask('T001', 'A');
    const claimC = await registry.claimTask('T001', 'C');

    // Only one should succeed (atomic operation)
    const successCount = [claimA.success, claimC.success].filter(Boolean).length;
    expect(successCount).toBe(1);

    console.log('✅ Multi-agent coordination test PASSED (no conflicts)!');
  });
});
