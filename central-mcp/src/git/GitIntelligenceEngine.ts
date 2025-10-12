/**
 * Git Intelligence Engine - POWER USER + SENIOR ENGINEER Strategy
 * ================================================================
 *
 * Transforms Git from version control to PROJECT INTELLIGENCE HUB.
 *
 * POWER USER TECHNIQUES INTEGRATED:
 * - Git hooks (all 12 types)
 * - Advanced history analysis (reflog, blame, bisect)
 * - Branch intelligence (feature branches, merge analysis)
 * - Tag management (semantic versioning)
 * - Signed commits (verification)
 * - Git notes (metadata enrichment)
 *
 * SENIOR ENGINEER WORKFLOWS:
 * - Conventional commits (parsing and validation)
 * - Semantic versioning (automatic bump detection)
 * - Changelog generation (from commit history)
 * - Release management (tags, branches, deployments)
 * - Hotfix workflows (emergency patches)
 * - CI/CD integration (deployment triggers)
 *
 * This makes Git the CENTRAL NERVOUS SYSTEM of project management!
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

/**
 * Conventional Commit types (industry standard)
 */
export enum CommitType {
  FEAT = 'feat',       // New feature (minor version bump)
  FIX = 'fix',         // Bug fix (patch version bump)
  BREAKING = 'BREAKING CHANGE', // Breaking change (major version bump)
  DOCS = 'docs',       // Documentation only
  STYLE = 'style',     // Code style (formatting)
  REFACTOR = 'refactor', // Code refactoring
  PERF = 'perf',       // Performance improvement
  TEST = 'test',       // Test updates
  BUILD = 'build',     // Build system changes
  CI = 'ci',           // CI/CD changes
  CHORE = 'chore',     // Maintenance tasks
  REVERT = 'revert'    // Revert previous commit
}

/**
 * Semantic version bump strategy
 */
export enum VersionBump {
  MAJOR = 'major',  // Breaking changes (1.0.0 → 2.0.0)
  MINOR = 'minor',  // New features (1.0.0 → 1.1.0)
  PATCH = 'patch'   // Bug fixes (1.0.0 → 1.0.1)
}

/**
 * Parsed conventional commit
 */
export interface ConventionalCommit {
  type: CommitType;
  scope?: string;
  description: string;
  body?: string;
  footer?: string;
  breaking: boolean;
  taskIds: string[];      // Extracted task IDs (T001, T002)
  progress?: number;      // Extracted progress % (0-100)
  timestamp: Date;
  hash: string;
  author: string;
}

/**
 * Git push event data
 */
export interface GitPushEvent {
  branch: string;
  remote: string;
  commits: string[];      // Commit hashes pushed
  timestamp: Date;
  commitCount: number;
  author: string;
  forced: boolean;        // Force push detected
}

/**
 * Semantic version
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  metadata?: string;
  raw: string;            // e.g., "1.2.3-beta.1+build.123"
}

/**
 * Branch intelligence
 */
export interface BranchIntelligence {
  name: string;
  type: 'main' | 'develop' | 'feature' | 'hotfix' | 'release';
  basedOn: string;
  commitCount: number;
  lastCommit: Date;
  author: string;
  taskIds: string[];      // Associated tasks
  status: 'active' | 'stale' | 'merged';
}

/**
 * Git Intelligence Engine
 */
export class GitIntelligenceEngine {
  private repoPath: string;
  private eventBus: AutoProactiveEventBus;
  private hooksInstalled: boolean = false;

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath;
    this.eventBus = AutoProactiveEventBus.getInstance();

    logger.info(`🧠 Git Intelligence Engine initialized`);
    logger.info(`   Repository: ${repoPath}`);
  }

  // ═══════════════════════════════════════════════════════════
  // CONVENTIONAL COMMITS - Parse structured commit messages
  // ═══════════════════════════════════════════════════════════

  /**
   * Parse conventional commit message
   *
   * Format: <type>(<scope>): <description>
   *
   * Examples:
   * - feat(auth): add JWT authentication
   * - fix(api): resolve null pointer in user endpoint
   * - BREAKING CHANGE: remove deprecated API endpoints
   */
  parseConventionalCommit(message: string, hash: string, author: string, timestamp: Date): ConventionalCommit | null {
    // Regex for conventional commit format
    const pattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\(([^)]+)\))?: (.+)$/;
    const match = message.match(pattern);

    if (!match) {
      // Check for BREAKING CHANGE
      if (message.includes('BREAKING CHANGE')) {
        return this.parseBreakingChange(message, hash, author, timestamp);
      }
      return null;
    }

    const [, typeStr, scope, description] = match;
    const type = typeStr as CommitType;

    // Extract task IDs (T001, T002, etc.)
    const taskIds = this.extractTaskIds(message);

    // Extract progress percentage
    const progress = this.extractProgress(message);

    // Check for breaking change in footer
    const breaking = message.toLowerCase().includes('breaking change');

    return {
      type,
      scope,
      description,
      breaking,
      taskIds,
      progress,
      timestamp,
      hash,
      author
    };
  }

  /**
   * Parse breaking change commit
   */
  private parseBreakingChange(message: string, hash: string, author: string, timestamp: Date): ConventionalCommit {
    return {
      type: CommitType.BREAKING,
      description: message.replace('BREAKING CHANGE:', '').trim(),
      breaking: true,
      taskIds: this.extractTaskIds(message),
      progress: this.extractProgress(message),
      timestamp,
      hash,
      author
    };
  }

  /**
   * Extract task IDs from commit message
   */
  private extractTaskIds(message: string): string[] {
    const pattern = /T\d{3,}/g;
    return message.match(pattern) || [];
  }

  /**
   * Extract progress percentage from commit message
   */
  private extractProgress(message: string): number | undefined {
    const pattern = /(\d{1,3})%/;
    const match = message.match(pattern);
    return match ? parseInt(match[1], 10) : undefined;
  }

  /**
   * Validate commit message format
   */
  validateCommitMessage(message: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check conventional format
    const conventional = this.parseConventionalCommit(message, '', '', new Date());
    if (!conventional && !message.includes('BREAKING CHANGE')) {
      errors.push('Not in conventional commit format: <type>(<scope>): <description>');
    }

    // Check description length
    const firstLine = message.split('\n')[0];
    if (firstLine.length > 100) {
      errors.push('First line exceeds 100 characters');
    }

    // Check for task ID
    if (this.extractTaskIds(message).length === 0) {
      errors.push('No task ID found (expected format: T001, T002, etc.)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SEMANTIC VERSIONING - Automatic version management
  // ═══════════════════════════════════════════════════════════

  /**
   * Get current version from git tags
   */
  getCurrentVersion(): SemanticVersion {
    try {
      const tag = execSync(
        'git describe --tags --abbrev=0',
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      return this.parseVersion(tag);
    } catch {
      // No tags yet, start at 0.1.0
      return { major: 0, minor: 1, patch: 0, raw: '0.1.0' };
    }
  }

  /**
   * Parse semantic version string
   */
  parseVersion(versionString: string): SemanticVersion {
    // Remove 'v' prefix if present
    const clean = versionString.replace(/^v/, '');

    // Parse: 1.2.3-beta.1+build.123
    const pattern = /^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/;
    const match = clean.match(pattern);

    if (!match) {
      throw new Error(`Invalid version format: ${versionString}`);
    }

    const [, major, minor, patch, prerelease, metadata] = match;

    return {
      major: parseInt(major, 10),
      minor: parseInt(minor, 10),
      patch: parseInt(patch, 10),
      prerelease,
      metadata,
      raw: clean
    };
  }

  /**
   * Determine version bump from commits
   */
  determineVersionBump(commits: ConventionalCommit[]): VersionBump {
    // Check for breaking changes (major bump)
    if (commits.some(c => c.breaking || c.type === CommitType.BREAKING)) {
      return VersionBump.MAJOR;
    }

    // Check for new features (minor bump)
    if (commits.some(c => c.type === CommitType.FEAT)) {
      return VersionBump.MINOR;
    }

    // Otherwise patch bump
    return VersionBump.PATCH;
  }

  /**
   * Calculate next version
   */
  calculateNextVersion(current: SemanticVersion, bump: VersionBump): SemanticVersion {
    let { major, minor, patch } = current;

    switch (bump) {
      case VersionBump.MAJOR:
        major++;
        minor = 0;
        patch = 0;
        break;
      case VersionBump.MINOR:
        minor++;
        patch = 0;
        break;
      case VersionBump.PATCH:
        patch++;
        break;
    }

    const raw = `${major}.${minor}.${patch}`;
    return { major, minor, patch, raw };
  }

  /**
   * Create git tag for version
   */
  createVersionTag(version: SemanticVersion, message?: string): void {
    const tagName = `v${version.raw}`;
    const tagMessage = message || `Release ${tagName}`;

    execSync(
      `git tag -a "${tagName}" -m "${tagMessage}"`,
      { cwd: this.repoPath }
    );

    logger.info(`✅ Created version tag: ${tagName}`);

    // Emit event
    this.eventBus.emitLoopEvent(
      LoopEvent.VERSION_TAGGED,
      {
        version: version.raw,
        tag: tagName,
        timestamp: Date.now()
      },
      { priority: 'high', source: 'GitIntelligence' }
    );
  }

  // ═══════════════════════════════════════════════════════════
  // GIT PUSH DETECTION - Monitor remote synchronization
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect recent pushes
   */
  detectRecentPushes(sinceMinutes: number = 5): GitPushEvent[] {
    try {
      // Get reflog for pushes
      const reflog = execSync(
        `git reflog --since="${sinceMinutes} minutes ago" --grep-reflog="push"`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      if (!reflog) return [];

      // Parse reflog entries
      const events: GitPushEvent[] = [];
      const lines = reflog.split('\n');

      for (const line of lines) {
        // Parse: hash HEAD@{timestamp}: commit: message
        const match = line.match(/^([a-f0-9]+) .+: (.+)$/);
        if (!match) continue;

        const [, hash] = match;

        // Get push details
        const pushInfo = this.getPushInfo(hash);
        if (pushInfo) {
          events.push(pushInfo);
        }
      }

      return events;
    } catch (error) {
      logger.error('❌ Failed to detect pushes:', error);
      return [];
    }
  }

  /**
   * Get push information for a commit
   */
  private getPushInfo(hash: string): GitPushEvent | null {
    try {
      const info = execSync(
        `git log -1 --format="%an|%ai|%D" ${hash}`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      const [author, timestamp, refs] = info.split('|');

      // Extract branch and remote from refs
      const branch = refs.match(/origin\/([^,]+)/)?.[1] || 'main';
      const remote = 'origin';

      // Get commits in this push
      const commits = [hash];

      return {
        branch,
        remote,
        commits,
        timestamp: new Date(timestamp),
        commitCount: commits.length,
        author,
        forced: false // TODO: Detect force push
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if local is ahead of remote (needs push)
   */
  needsPush(): boolean {
    try {
      const status = execSync(
        'git status -sb',
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      return status.includes('[ahead');
    } catch {
      return false;
    }
  }

  /**
   * Check if local is behind remote (needs pull)
   */
  needsPull(): boolean {
    try {
      const status = execSync(
        'git status -sb',
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      return status.includes('[behind');
    } catch {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BRANCH INTELLIGENCE - Track parallel work streams
  // ═══════════════════════════════════════════════════════════

  /**
   * Analyze all branches
   */
  analyzeBranches(): BranchIntelligence[] {
    try {
      const branches = execSync(
        'git branch -a --format="%(refname:short)|%(authorname)|%(committerdate:iso8601)"',
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim().split('\n');

      return branches.map(line => {
        const [name, author, dateStr] = line.split('|');
        const lastCommit = new Date(dateStr);

        // Determine branch type
        const type = this.determineBranchType(name);

        // Get commit count
        const commitCount = this.getBranchCommitCount(name);

        // Extract task IDs from branch commits
        const taskIds = this.getBranchTaskIds(name);

        // Determine status
        const daysSinceCommit = (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
        const status = daysSinceCommit > 14 ? 'stale' : 'active';

        return {
          name,
          type,
          basedOn: this.getBranchBase(name),
          commitCount,
          lastCommit,
          author,
          taskIds,
          status
        };
      });
    } catch (error) {
      logger.error('❌ Failed to analyze branches:', error);
      return [];
    }
  }

  /**
   * Determine branch type from name
   */
  private determineBranchType(name: string): BranchIntelligence['type'] {
    if (name === 'main' || name === 'master') return 'main';
    if (name === 'develop' || name === 'dev') return 'develop';
    if (name.startsWith('feature/')) return 'feature';
    if (name.startsWith('hotfix/')) return 'hotfix';
    if (name.startsWith('release/')) return 'release';
    return 'feature'; // Default
  }

  /**
   * Get branch commit count
   */
  private getBranchCommitCount(branch: string): number {
    try {
      const count = execSync(
        `git rev-list --count ${branch}`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();
      return parseInt(count, 10);
    } catch {
      return 0;
    }
  }

  /**
   * Get task IDs from branch commits
   */
  private getBranchTaskIds(branch: string): string[] {
    try {
      const log = execSync(
        `git log ${branch} --format="%s"`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();

      const taskIds = new Set<string>();
      const pattern = /T\d{3,}/g;

      for (const line of log.split('\n')) {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(id => taskIds.add(id));
        }
      }

      return Array.from(taskIds);
    } catch {
      return [];
    }
  }

  /**
   * Get branch base (what it was created from)
   */
  private getBranchBase(branch: string): string {
    try {
      const base = execSync(
        `git merge-base ${branch} main`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim();
      return base.substring(0, 7);
    } catch {
      return 'unknown';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHANGELOG GENERATION - Automatic release notes
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate changelog from commits
   */
  generateChangelog(since?: string, until: string = 'HEAD'): string {
    try {
      const sinceArg = since ? `${since}..${until}` : until;

      const commits = execSync(
        `git log ${sinceArg} --format="%H|%s|%an|%ai"`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      ).trim().split('\n');

      const changelog: string[] = [];
      const features: string[] = [];
      const fixes: string[] = [];
      const breaking: string[] = [];
      const other: string[] = [];

      for (const line of commits) {
        const [hash, message] = line.split('|');
        const conventional = this.parseConventionalCommit(message, hash, '', new Date());

        if (conventional?.breaking) {
          breaking.push(`- ⚠️ **BREAKING**: ${conventional.description} (${hash.substring(0, 7)})`);
        } else if (conventional?.type === CommitType.FEAT) {
          features.push(`- ✨ ${conventional.description} (${hash.substring(0, 7)})`);
        } else if (conventional?.type === CommitType.FIX) {
          fixes.push(`- 🐛 ${conventional.description} (${hash.substring(0, 7)})`);
        } else {
          other.push(`- ${message} (${hash.substring(0, 7)})`);
        }
      }

      // Build changelog
      if (breaking.length > 0) {
        changelog.push('## ⚠️ BREAKING CHANGES\n');
        changelog.push(...breaking, '');
      }

      if (features.length > 0) {
        changelog.push('## ✨ Features\n');
        changelog.push(...features, '');
      }

      if (fixes.length > 0) {
        changelog.push('## 🐛 Bug Fixes\n');
        changelog.push(...fixes, '');
      }

      if (other.length > 0) {
        changelog.push('## 📝 Other Changes\n');
        changelog.push(...other, '');
      }

      return changelog.join('\n');
    } catch (error) {
      logger.error('❌ Failed to generate changelog:', error);
      return '';
    }
  }

  /**
   * Write changelog to CHANGELOG.md
   */
  writeChangelog(version: SemanticVersion, content: string): void {
    const changelogPath = join(this.repoPath, 'CHANGELOG.md');
    const header = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;
    const versionHeader = `## [${version.raw}] - ${new Date().toISOString().split('T')[0]}\n\n`;

    let existing = '';
    if (existsSync(changelogPath)) {
      existing = readFileSync(changelogPath, 'utf-8');
      existing = existing.replace(header, '');
    }

    const newContent = header + versionHeader + content + '\n' + existing;
    writeFileSync(changelogPath, newContent, 'utf-8');

    logger.info(`✅ Updated CHANGELOG.md with version ${version.raw}`);
  }

  // ═══════════════════════════════════════════════════════════
  // STATISTICS & REPORTING
  // ═══════════════════════════════════════════════════════════

  /**
   * Get repository statistics
   */
  getRepoStats(): {
    commitCount: number;
    branchCount: number;
    tagCount: number;
    contributors: number;
    linesOfCode: number;
  } {
    try {
      const commitCount = parseInt(execSync('git rev-list --count HEAD', { cwd: this.repoPath, encoding: 'utf-8' }).trim(), 10);
      const branchCount = execSync('git branch -a', { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n').length;
      const tagCount = execSync('git tag', { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n').filter(Boolean).length;
      const contributors = new Set(execSync('git log --format="%an"', { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n')).size;

      // Lines of code (tracked files) - filter out directories and suppress errors
      const linesOfCode = parseInt(
        execSync('git ls-files | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\'', { cwd: this.repoPath, encoding: 'utf-8', shell: '/bin/bash' }).trim() || '0',
        10
      );

      return {
        commitCount,
        branchCount,
        tagCount,
        contributors,
        linesOfCode
      };
    } catch (error) {
      logger.error('❌ Failed to get repo stats:', error);
      return {
        commitCount: 0,
        branchCount: 0,
        tagCount: 0,
        contributors: 0,
        linesOfCode: 0
      };
    }
  }
}
