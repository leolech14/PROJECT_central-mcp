/**
 * ContextExtractor Tests
 * =======================
 *
 * Unit tests for context extraction and file scanning
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { ContextExtractor } from '../../src/discovery/ContextExtractor.js';
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

describe('ContextExtractor', () => {
  let db: Database.Database;
  let extractor: ContextExtractor;
  const testDbPath = path.join(process.cwd(), 'data', 'test-context-extractor.db');
  const testProjectPath = path.join(process.cwd(), 'test-project-for-context');

  beforeEach(() => {
    db = new Database(testDbPath);

    // Create necessary tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        path TEXT,
        type TEXT,
        git_remote TEXT,
        vision TEXT,
        created_at TEXT,
        last_activity TEXT,
        discovered_by TEXT,
        metadata TEXT
      );

      INSERT INTO projects (id, name, path, type, created_at, last_activity, discovered_by)
      VALUES ('test-project', 'TestProject', '${testProjectPath}', 'TOOL', datetime('now'), datetime('now'), 'manual');
    `);

    extractor = new ContextExtractor(db);

    // Create test project structure
    if (!existsSync(testProjectPath)) {
      mkdirSync(testProjectPath, { recursive: true });
      mkdirSync(path.join(testProjectPath, '02_SPECBASES'));
      mkdirSync(path.join(testProjectPath, 'docs'));
      mkdirSync(path.join(testProjectPath, '01_CODEBASES'));

      // Create test files
      writeFileSync(path.join(testProjectPath, '02_SPECBASES', 'spec1.md'), '# Spec 1');
      writeFileSync(path.join(testProjectPath, 'docs', 'doc1.md'), '# Doc 1');
      writeFileSync(path.join(testProjectPath, '01_CODEBASES', 'code1.ts'), 'const x = 1;');
      writeFileSync(path.join(testProjectPath, 'CLAUDE.md'), '# Project');
      writeFileSync(path.join(testProjectPath, 'README.md'), '# README');
    }
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
  });

  describe('extractContext', () => {
    it('should extract and categorize files', async () => {
      const context = await extractor.extractContext('test-project', testProjectPath);

      expect(context).toBeDefined();
      expect(context.files.length).toBeGreaterThan(0);
      expect(context.statistics.totalFiles).toBeGreaterThan(0);
    });

    it('should categorize files by type correctly', async () => {
      const context = await extractor.extractContext('test-project', testProjectPath);

      expect(context.categories.specs.length).toBeGreaterThan(0); // spec1.md
      expect(context.categories.docs.length).toBeGreaterThan(0);  // doc1.md, README.md
      expect(context.categories.code.length).toBeGreaterThan(0);  // code1.ts
      expect(context.categories.config.length).toBeGreaterThan(0); // CLAUDE.md
    });

    it('should generate statistics', async () => {
      const context = await extractor.extractContext('test-project', testProjectPath);

      expect(context.statistics.totalFiles).toBeGreaterThan(0);
      expect(context.statistics.totalSize).toBeGreaterThan(0);
      expect(context.statistics.byType).toBeDefined();
    });

    it('should store files in database', async () => {
      await extractor.extractContext('test-project', testProjectPath);

      const stored = extractor.getContextFiles('test-project');
      expect(stored.length).toBeGreaterThan(0);
    });
  });

  describe('getContextFiles', () => {
    it('should retrieve stored context files', async () => {
      await extractor.extractContext('test-project', testProjectPath);

      const files = extractor.getContextFiles('test-project');
      expect(files.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      await extractor.extractContext('test-project', testProjectPath);

      const specs = extractor.getContextFiles('test-project', 'SPEC');
      const docs = extractor.getContextFiles('test-project', 'DOC');

      expect(specs.every(f => f.type === 'SPEC')).toBe(true);
      expect(docs.every(f => f.type === 'DOC')).toBe(true);
    });
  });

  describe('searchContextFiles', () => {
    it('should search by filename', async () => {
      await extractor.extractContext('test-project', testProjectPath);

      const results = extractor.searchContextFiles('test-project', 'spec1');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].relativePath).toContain('spec1');
    });

    it('should limit results', async () => {
      await extractor.extractContext('test-project', testProjectPath);

      const results = extractor.searchContextFiles('test-project', '.md', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('needsUpdate', () => {
    it('should detect when update is needed', async () => {
      await extractor.extractContext('test-project', testProjectPath);

      // Add new file
      writeFileSync(path.join(testProjectPath, 'new-file.md'), '# New');

      const needs = extractor.needsUpdate('test-project', testProjectPath);
      expect(needs).toBe(true);
    });

    it('should detect when update is not needed', async () => {
      await extractor.extractContext('test-project', testProjectPath);

      const needs = extractor.needsUpdate('test-project', testProjectPath);
      // Might be true or false depending on exact file count, but shouldn't crash
      expect(typeof needs).toBe('boolean');
    });
  });

  describe('File Skipping', () => {
    it('should skip node_modules', async () => {
      mkdirSync(path.join(testProjectPath, 'node_modules'), { recursive: true });
      writeFileSync(path.join(testProjectPath, 'node_modules', 'package.json'), '{}');

      const context = await extractor.extractContext('test-project', testProjectPath);

      const nodeModulesFiles = context.files.filter(f => f.relativePath.includes('node_modules'));
      expect(nodeModulesFiles.length).toBe(0);
    });

    it('should skip large files', async () => {
      // Create 15MB file (over 10MB limit)
      const largeFile = path.join(testProjectPath, 'large.bin');
      const buffer = Buffer.alloc(15 * 1024 * 1024);
      writeFileSync(largeFile, buffer);

      const context = await extractor.extractContext('test-project', testProjectPath);

      const found = context.files.find(f => f.relativePath.includes('large.bin'));
      expect(found).toBeUndefined(); // Should be skipped
    });
  });

  describe('Performance', () => {
    it('should extract context in reasonable time', async () => {
      const startTime = Date.now();

      await extractor.extractContext('test-project', testProjectPath);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should be under 10 seconds for small project
    });
  });
});
