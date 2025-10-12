/**
 * DiscoveryEngine Integration Tests
 * ==================================
 *
 * Tests for complete discovery flow
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { DiscoveryEngine } from '../../src/discovery/DiscoveryEngine.js';
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('DiscoveryEngine', () => {
  let db: Database.Database;
  let engine: DiscoveryEngine;
  const testDbPath = path.join(process.cwd(), 'data', 'test-discovery-engine.db');
  const testProjectPath = path.join(process.cwd(), 'test-discovery-project');

  beforeEach(() => {
    // Create test database with all required tables
    db = new Database(testDbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        git_remote TEXT,
        type TEXT NOT NULL,
        vision TEXT,
        created_at TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        discovered_by TEXT NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        tracking_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        model_id TEXT NOT NULL,
        model_signature TEXT NOT NULL,
        capabilities TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        total_sessions INTEGER DEFAULT 0,
        total_tasks INTEGER DEFAULT 0,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS context_files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        absolute_path TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        indexed_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(project_id, relative_path)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT,
        agent TEXT,
        status TEXT DEFAULT 'AVAILABLE',
        priority TEXT,
        dependencies TEXT,
        project_id TEXT DEFAULT 'test-project'
      );

      INSERT INTO tasks (id, name, agent, status, priority, dependencies)
      VALUES ('T001', 'Test Task', 'A', 'AVAILABLE', 'P0', '[]');
    `);

    engine = new DiscoveryEngine(db);

    // Create minimal test project
    if (!existsSync(testProjectPath)) {
      mkdirSync(testProjectPath, { recursive: true});
      writeFileSync(path.join(testProjectPath, 'README.md'), '# Test');
      writeFileSync(path.join(testProjectPath, 'CLAUDE.md'), '# Test Project');

      // Initialize git
      try {
        execSync('git init', { cwd: testProjectPath, stdio: 'ignore' });
        execSync('git config user.email "test@test.com"', { cwd: testProjectPath, stdio: 'ignore' });
        execSync('git config user.name "Test"', { cwd: testProjectPath, stdio: 'ignore' });
        execSync('git add .', { cwd: testProjectPath, stdio: 'ignore' });
        execSync('git commit -m "Initial"', { cwd: testProjectPath, stdio: 'ignore' });
      } catch (e) {
        // Git might already be initialized
      }
    }
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
  });

  describe('discoverEnvironment', () => {
    it('should complete full discovery flow', async () => {
      const result = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      expect(result).toBeDefined();
      expect(result.project).toBeDefined();
      expect(result.agent).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.proposals).toBeDefined();
      expect(result.discoveryTime).toBeGreaterThan(0);
    });

    it('should recognize project', async () => {
      const result = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      expect(result.project.name).toBe('test-discovery-project');
      expect(result.project.path).toBe(testProjectPath);
    });

    it('should create or recognize agent', async () => {
      const result = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      expect(result.agent.id).toBeDefined();
      expect(result.agent.trackingId).toBeDefined();
      expect(result.agent.modelId).toBe('test-model');
    });

    it('should extract context files', async () => {
      const result = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      expect(result.context.files.length).toBeGreaterThan(0);
      expect(result.context.statistics.totalFiles).toBeGreaterThan(0);
    });

    it('should generate job proposals', async () => {
      const result = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      expect(result.proposals).toBeDefined();
      expect(Array.isArray(result.proposals)).toBe(true);
    });

    it('should complete discovery in reasonable time', async () => {
      const result = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      expect(result.discoveryTime).toBeLessThan(30000); // Under 30 seconds
    }, 35000);

    it('should recognize returning agent', async () => {
      // First connection
      const first = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      const trackingId = first.agent.trackingId;

      // Second connection with tracking ID
      const second = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model',
        trackingId
      });

      expect(second.agentIdentity.recognized).toBe(true);
      expect(second.agentIdentity.confidence).toBe(100);
      expect(second.agent.id).toBe(first.agent.id);
    });
  });

  describe('Discovery Summary', () => {
    it('should generate readable summary', async () => {
      const result = await engine.discoverEnvironment({
        cwd: testProjectPath,
        modelId: 'test-model'
      });

      const summary = engine.getDiscoverySummary(result);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('ENVIRONMENT DISCOVERY COMPLETE');
    });
  });
});
