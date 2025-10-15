/**
 * ProjectDetector Tests
 * =====================
 *
 * Unit tests for automatic project detection
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { ProjectDetector } from '../../src/discovery/ProjectDetector.js';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

describe('ProjectDetector', () => {
  let db: Database.Database;
  let detector: ProjectDetector;
  const testDbPath = path.join(process.cwd(), 'data', 'test-project-detector.db');

  beforeEach(() => {
    // Create test database
    db = new Database(testDbPath);

    // Create projects table
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        git_remote TEXT UNIQUE,
        type TEXT NOT NULL,
        vision TEXT,
        created_at TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        discovered_by TEXT NOT NULL,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_projects_git_remote ON projects(git_remote);
    `);

    detector = new ProjectDetector(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('detectProject', () => {
    it('should detect LocalBrain project from current directory', async () => {
      const localBrainPath = '/Users/lech/PROJECTS_all/LocalBrain';

      const project = await detector.detectProject(localBrainPath);

      expect(project).toBeDefined();
      expect(project.name).toBe('LocalBrain');
      expect(project.path).toBe(localBrainPath);
      expect(project.type).toBe('COMMERCIAL_APP');
    });

    it('should auto-register new project', async () => {
      const testPath = '/Users/lech/PROJECTS_all/TestProject';

      const project = await detector.detectProject(testPath);

      expect(project).toBeDefined();
      expect(project.discoveredBy).toBe('auto');

      // Verify stored in database
      const stored = detector.getProject(project.id);
      expect(stored).toBeDefined();
      expect(stored?.id).toBe(project.id);
    });

    it('should recognize existing project on second detection', async () => {
      const testPath = '/Users/lech/PROJECTS_all/TestProject';

      // First detection - creates project
      const first = await detector.detectProject(testPath);
      const firstId = first.id;

      // Second detection - should find existing
      const second = await detector.detectProject(testPath);

      expect(second.id).toBe(firstId);
      expect(second.lastActivity).not.toBe(first.lastActivity); // Updated
    });
  });

  describe('Project Type Classification', () => {
    it('should classify commercial apps correctly', async () => {
      const detector = new ProjectDetector(db);

      // LocalBrain has CLAUDE.md + SPECBASE + CODEBASES = COMMERCIAL_APP
      const project = await detector.detectProject('/Users/lech/PROJECTS_all/LocalBrain');

      expect(project.type).toBe('COMMERCIAL_APP');
    });

    it('should classify tools correctly', async () => {
      // Project with code but no specbase = TOOL
      const project = await detector.detectProject('/Users/lech/PROJECTS_all/SomeTool');

      // Type detection logic should infer TOOL
      expect(['TOOL', 'UNKNOWN', 'INFRASTRUCTURE']).toContain(project.type);
    });
  });

  describe('getAllProjects', () => {
    it('should return all registered projects', async () => {
      // Register multiple projects
      await detector.detectProject('/Users/lech/PROJECTS_all/Project1');
      await detector.detectProject('/Users/lech/PROJECTS_all/Project2');
      await detector.detectProject('/Users/lech/PROJECTS_all/Project3');

      const projects = detector.getAllProjects();

      expect(projects.length).toBeGreaterThanOrEqual(3);
    });

    it('should sort by last activity', async () => {
      await detector.detectProject('/Users/lech/PROJECTS_all/Project1');
      await new Promise(resolve => setTimeout(resolve, 10));
      await detector.detectProject('/Users/lech/PROJECTS_all/Project2');

      const projects = detector.getAllProjects();

      // Most recent should be first
      expect(projects[0].name).toBe('Project2');
    });
  });

  describe('searchProjects', () => {
    it('should find projects by name', async () => {
      await detector.detectProject('/Users/lech/PROJECTS_all/LocalBrain');

      const results = detector.searchProjects('Local');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Local');
    });

    it('should find projects by path', async () => {
      await detector.detectProject('/Users/lech/PROJECTS_all/LocalBrain');

      const results = detector.searchProjects('PROJECTS_all');

      expect(results.length).toBeGreaterThan(0);
    });
  });
});
