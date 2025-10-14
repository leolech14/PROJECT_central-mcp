/**
 * GitTracker Tests
 * =================
 *
 * Unit tests for Git-based verification system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GitTracker } from '../../src/registry/GitTracker.js';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import path from 'path';

describe('GitTracker', () => {
  let gitTracker: GitTracker;
  const testRepoPath = path.join(process.cwd(), 'test-git-repo');

  beforeEach(() => {
    // Create test git repository
    if (existsSync(testRepoPath)) {
      rmSync(testRepoPath, { recursive: true, force: true });
    }

    mkdirSync(testRepoPath, { recursive: true });

    // Initialize git repo
    execSync('git init', { cwd: testRepoPath, stdio: 'ignore' });
    execSync('git config user.email "test@test.com"', { cwd: testRepoPath, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: testRepoPath, stdio: 'ignore' });

    // Create initial commit
    writeFileSync(path.join(testRepoPath, 'README.md'), '# Test Repo');
    execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: testRepoPath, stdio: 'ignore' });

    gitTracker = new GitTracker(testRepoPath);
  });

  afterEach(() => {
    if (existsSync(testRepoPath)) {
      rmSync(testRepoPath, { recursive: true, force: true });
    }
  });

  describe('getFileTimestamps', () => {
    it('should detect created files', () => {
      // Create new file and commit
      writeFileSync(path.join(testRepoPath, 'new-file.ts'), 'const x = 1;');
      execSync('git add new-file.ts', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "Add new file"', { cwd: testRepoPath, stdio: 'ignore' });

      const timestamps = gitTracker.getFileTimestamps(['new-file.ts']);

      expect(timestamps['new-file.ts']).toBeDefined();
      expect(timestamps['new-file.ts'].created).toBe(true);
      expect(timestamps['new-file.ts'].timestamp).toBeTruthy();
    });

    it('should detect modified files', () => {
      // Create and commit file
      writeFileSync(path.join(testRepoPath, 'file.ts'), 'const x = 1;');
      execSync('git add file.ts', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "Initial version"', { cwd: testRepoPath, stdio: 'ignore' });

      // Modify file
      writeFileSync(path.join(testRepoPath, 'file.ts'), 'const x = 2;');
      execSync('git add file.ts', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "Update file"', { cwd: testRepoPath, stdio: 'ignore' });

      const timestamps = gitTracker.getFileTimestamps(['file.ts']);

      expect(timestamps['file.ts']).toBeDefined();
      expect(timestamps['file.ts'].created).toBe(false);
      expect(timestamps['file.ts'].modified).toBe(true);
    });

    it('should handle multiple files', () => {
      // Create multiple files
      writeFileSync(path.join(testRepoPath, 'file1.ts'), 'const x = 1;');
      writeFileSync(path.join(testRepoPath, 'file2.ts'), 'const y = 2;');
      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "Add files"', { cwd: testRepoPath, stdio: 'ignore' });

      const timestamps = gitTracker.getFileTimestamps(['file1.ts', 'file2.ts']);

      expect(Object.keys(timestamps).length).toBe(2);
      expect(timestamps['file1.ts'].created).toBe(true);
      expect(timestamps['file2.ts'].created).toBe(true);
    });

    it('should handle non-existent files gracefully', () => {
      const timestamps = gitTracker.getFileTimestamps(['non-existent.ts']);

      expect(timestamps['non-existent.ts']).toBeUndefined();
    });
  });

  describe('getCommitHistory', () => {
    it('should retrieve commits mentioning task ID', () => {
      // Create commits with task ID
      writeFileSync(path.join(testRepoPath, 'feature.ts'), 'code');
      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "T001: Implement feature"', { cwd: testRepoPath, stdio: 'ignore' });

      writeFileSync(path.join(testRepoPath, 'test.ts'), 'tests');
      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "T001: Add tests"', { cwd: testRepoPath, stdio: 'ignore' });

      const commits = gitTracker.getCommitHistory('T001');

      expect(commits.length).toBeGreaterThanOrEqual(2);
      expect(commits.some(c => c.message.includes('T001'))).toBe(true);
    });

    it('should return empty array for non-existent task ID', () => {
      const commits = gitTracker.getCommitHistory('T999');

      expect(commits).toEqual([]);
    });

    it('should include commit metadata', () => {
      writeFileSync(path.join(testRepoPath, 'feature.ts'), 'code');
      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "T001: Feature"', { cwd: testRepoPath, stdio: 'ignore' });

      const commits = gitTracker.getCommitHistory('T001');

      expect(commits[0].hash).toBeTruthy();
      expect(commits[0].message).toBeTruthy();
      expect(commits[0].timestamp).toBeTruthy();
    });
  });

  describe('calculateCompletionScore', () => {
    it('should give high score when all files created', () => {
      // Create expected files
      const filesCreated = ['auth.ts', 'auth.test.ts'];

      filesCreated.forEach(file => {
        writeFileSync(path.join(testRepoPath, file), 'code');
      });

      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "T001: Implement auth"', { cwd: testRepoPath, stdio: 'ignore' });

      const score = gitTracker.calculateCompletionScore('T001', filesCreated);

      // Should be high (files created + commits with task ID)
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('should give lower score when some files missing', () => {
      const filesCreated = ['auth.ts', 'auth.test.ts', 'auth.docs.md'];

      // Only create 2 of 3 files
      writeFileSync(path.join(testRepoPath, 'auth.ts'), 'code');
      writeFileSync(path.join(testRepoPath, 'auth.test.ts'), 'tests');

      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "T001: Partial implementation"', { cwd: testRepoPath, stdio: 'ignore' });

      const score = gitTracker.calculateCompletionScore('T001', filesCreated);

      // Should be lower (missing file)
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(40); // But still decent (2/3 files + commit)
    });

    it('should pass 80% threshold for auto-verification', () => {
      const filesCreated = ['feature.ts', 'feature.test.ts'];

      filesCreated.forEach(file => {
        writeFileSync(path.join(testRepoPath, file), 'code');
      });

      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "T001: Complete implementation"', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit --allow-empty -m "T001: Documentation"', { cwd: testRepoPath, stdio: 'ignore' });

      const score = gitTracker.calculateCompletionScore('T001', filesCreated);

      // Should exceed 80% threshold
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should weight files 70% and commits 30%', () => {
      const filesCreated = ['only-file.ts'];

      // Create file (100% file score) but no commits mentioning task
      writeFileSync(path.join(testRepoPath, 'only-file.ts'), 'code');
      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "Generic commit"', { cwd: testRepoPath, stdio: 'ignore' });

      const score = gitTracker.calculateCompletionScore('T999', filesCreated);

      // Should be ~70 (100% files × 0.7 + 0% commits × 0.3)
      expect(score).toBeGreaterThanOrEqual(65);
      expect(score).toBeLessThanOrEqual(75);
    });
  });

  describe('getAgentActivity', () => {
    it('should retrieve agent git activity', () => {
      // Create commits as different agents
      writeFileSync(path.join(testRepoPath, 'feature-a.ts'), 'code by A');
      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "Agent A: Feature"', { cwd: testRepoPath, stdio: 'ignore' });

      const activity = gitTracker.getAgentActivity('A', 10);

      expect(activity).toBeDefined();
      expect(activity.length).toBeGreaterThan(0);
    });

    it('should limit results by count parameter', () => {
      // Create multiple commits
      for (let i = 0; i < 5; i++) {
        writeFileSync(path.join(testRepoPath, `file${i}.ts`), `code ${i}`);
        execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
        execSync(`git commit -m "Agent A: Commit ${i}"`, { cwd: testRepoPath, stdio: 'ignore' });
      }

      const activity = gitTracker.getAgentActivity('A', 3);

      expect(activity.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle repository with no commits (except initial)', () => {
      const commits = gitTracker.getCommitHistory('T001');

      // Should return empty array (no commits for T001)
      expect(commits).toEqual([]);
    });

    it('should handle files with special characters in names', () => {
      const fileName = 'file-with-dash_and_underscore.ts';
      writeFileSync(path.join(testRepoPath, fileName), 'code');
      execSync('git add .', { cwd: testRepoPath, stdio: 'ignore' });
      execSync('git commit -m "Add special file"', { cwd: testRepoPath, stdio: 'ignore' });

      const timestamps = gitTracker.getFileTimestamps([fileName]);

      expect(timestamps[fileName]).toBeDefined();
      expect(timestamps[fileName].created).toBe(true);
    });

    it('should handle empty file list', () => {
      const score = gitTracker.calculateCompletionScore('T001', []);

      // No files expected, so file score is 0, but commits might exist
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(30); // Max 30% from commits
    });
  });
});
