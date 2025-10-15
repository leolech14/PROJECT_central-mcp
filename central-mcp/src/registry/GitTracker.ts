/**
 * Git Tracker (Automatic Task Completion Verification)
 * =====================================================
 *
 * BRILLIANT ADDITION BY LECH:
 * Deterministic task completion verification via git history!
 *
 * Features:
 * - Track file creation/modification timestamps
 * - Verify expected deliverables exist
 * - Automatic completion validation
 * - Safe, deterministic confirmation
 */

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { logger } from '../utils/logger.js';
import type { Task } from '../types/Task.js';

export interface FileTrackingEntry {
  path: string;
  created: string;      // ISO timestamp
  modified: string;     // ISO timestamp
  gitHash: string;      // Git commit hash
  size: number;         // File size in bytes
}

export interface TaskCompletionEvidence {
  taskId: string;
  filesExpected: string[];
  filesFound: string[];
  filesMissing: string[];
  gitCommits: string[];
  completionScore: number;  // 0-100
  autoVerified: boolean;
  verificationTime: string;
}

export class GitTracker {
  private repoPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath;
    logger.info(`🔍 GitTracker initialized for repo: ${repoPath}`);
  }

  /**
   * Get file tracking information from git
   */
  getFileTracking(filePath: string): FileTrackingEntry | null {
    try {
      // Check if file exists
      if (!existsSync(filePath)) {
        return null;
      }

      const stats = statSync(filePath);

      // Get git log for this file
      const gitLog = execSync(
        `git log --follow --format="%H|%ai" -1 -- "${filePath}"`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      if (!gitLog) {
        // File not tracked by git yet
        return {
          path: filePath,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          gitHash: 'untracked',
          size: stats.size
        };
      }

      const [hash, timestamp] = gitLog.split('|');

      // Get creation time (first commit)
      const firstCommit = execSync(
        `git log --follow --format="%ai" --diff-filter=A -- "${filePath}"`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim().split('\n')[0];

      return {
        path: filePath,
        created: firstCommit || timestamp,
        modified: timestamp,
        gitHash: hash,
        size: stats.size
      };
    } catch (error) {
      logger.error(`❌ Failed to get git tracking for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Get all commits related to a task
   */
  getTaskCommits(taskId: string, since?: string): string[] {
    try {
      const sinceArg = since ? `--since="${since}"` : '';

      const commits = execSync(
        `git log ${sinceArg} --grep="${taskId}" --format="%H|%s|%ai" --all`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      if (!commits) {
        return [];
      }

      return commits.split('\n').map(line => line.trim()).filter(Boolean);
    } catch (error) {
      logger.error(`❌ Failed to get commits for task ${taskId}:`, error);
      return [];
    }
  }

  /**
   * Verify task completion (DETERMINISTIC)
   */
  verifyTaskCompletion(task: Task): TaskCompletionEvidence {
    logger.info(`🔍 Verifying completion of task ${task.id}...`);

    const filesExpected = task.location ? this.getExpectedFiles(task) : [];
    const filesFound: string[] = [];
    const filesMissing: string[] = [];

    // Check each expected file
    for (const filePath of filesExpected) {
      const tracking = this.getFileTracking(filePath);

      if (tracking) {
        filesFound.push(filePath);
        logger.debug(`✅ Found: ${filePath} (${tracking.size} bytes, ${tracking.gitHash})`);
      } else {
        filesMissing.push(filePath);
        logger.warn(`❌ Missing: ${filePath}`);
      }
    }

    // Get commits since task started
    const gitCommits = this.getTaskCommits(task.id, task.startedAt);

    // Calculate completion score
    const fileScore = filesExpected.length > 0
      ? (filesFound.length / filesExpected.length) * 70
      : 0;

    const commitScore = gitCommits.length > 0 ? 30 : 0;

    const completionScore = Math.round(fileScore + commitScore);

    // Auto-verified if score >= 80 AND all files found
    const autoVerified = completionScore >= 80 && filesMissing.length === 0;

    const evidence: TaskCompletionEvidence = {
      taskId: task.id,
      filesExpected,
      filesFound,
      filesMissing,
      gitCommits,
      completionScore,
      autoVerified,
      verificationTime: new Date().toISOString()
    };

    if (autoVerified) {
      logger.info(`✅ Task ${task.id} AUTO-VERIFIED (score: ${completionScore})`);
    } else {
      logger.warn(`⚠️ Task ${task.id} NEEDS REVIEW (score: ${completionScore})`);
    }

    return evidence;
  }

  /**
   * Get expected files for task (from deliverables)
   */
  private getExpectedFiles(task: Task): string[] {
    // If filesCreated is populated, use that
    if (task.filesCreated && task.filesCreated.length > 0) {
      return task.filesCreated;
    }

    // Otherwise, check task location directory
    const files: string[] = [];

    try {
      const gitFiles = execSync(
        `git ls-files "${task.location}"`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      if (gitFiles) {
        files.push(...gitFiles.split('\n').filter(Boolean));
      }
    } catch (error) {
      logger.warn(`⚠️ Could not list files in ${task.location}`);
    }

    return files;
  }

  /**
   * Track repo-wide file changes (for monitoring)
   */
  getRepoSnapshot(): Map<string, FileTrackingEntry> {
    const snapshot = new Map<string, FileTrackingEntry>();

    try {
      const files = execSync(
        'git ls-files',
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim().split('\n').filter(Boolean);

      for (const file of files) {
        const tracking = this.getFileTracking(file);
        if (tracking) {
          snapshot.set(file, tracking);
        }
      }

      logger.info(`📊 Repo snapshot: ${snapshot.size} files tracked`);
    } catch (error) {
      logger.error('❌ Failed to create repo snapshot:', error);
    }

    return snapshot;
  }

  /**
   * Compare snapshots to find changes
   */
  compareSnapshots(
    before: Map<string, FileTrackingEntry>,
    after: Map<string, FileTrackingEntry>
  ): {
    created: string[];
    modified: string[];
    deleted: string[];
  } {
    const created: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    // Check for created/modified files
    for (const [path, afterEntry] of after.entries()) {
      const beforeEntry = before.get(path);

      if (!beforeEntry) {
        created.push(path);
      } else if (beforeEntry.modified !== afterEntry.modified) {
        modified.push(path);
      }
    }

    // Check for deleted files
    for (const path of before.keys()) {
      if (!after.has(path)) {
        deleted.push(path);
      }
    }

    return { created, modified, deleted };
  }

  /**
   * Auto-detect task completion from git activity
   */
  detectTaskCompletion(taskId: string, sinceMinutes: number = 60): boolean {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
    const commits = this.getTaskCommits(taskId, since);

    // Look for completion keywords in commit messages
    const completionKeywords = ['complete', 'finish', 'done', '✅'];

    for (const commit of commits) {
      const message = commit.toLowerCase();

      if (completionKeywords.some(keyword => message.includes(keyword))) {
        logger.info(`🎯 Auto-detected completion for ${taskId} in commit: ${commit}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get recent commits (for dashboard display)
   */
  getRecentCommits(limit: number = 10): Array<{ message: string; hash: string; author: string; timestamp: Date }> {
    try {
      const commits = execSync(
        `git log -${limit} --format="%H|%an|%ai|%s" --all`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      if (!commits) {
        return [];
      }

      return commits.split('\n').map(line => {
        const [hash, author, timestamp, ...messageParts] = line.split('|');
        return {
          hash,
          author,
          timestamp: new Date(timestamp),
          message: messageParts.join('|')
        };
      });
    } catch (error) {
      logger.error('❌ Failed to get recent commits:', error);
      return [];
    }
  }
}
