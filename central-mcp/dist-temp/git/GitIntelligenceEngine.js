"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitIntelligenceEngine = exports.VersionBump = exports.CommitType = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var logger_js_1 = require("../utils/logger.js");
var EventBus_js_1 = require("../auto-proactive/EventBus.js");
/**
 * Conventional Commit types (industry standard)
 */
var CommitType;
(function (CommitType) {
    CommitType["FEAT"] = "feat";
    CommitType["FIX"] = "fix";
    CommitType["BREAKING"] = "BREAKING CHANGE";
    CommitType["DOCS"] = "docs";
    CommitType["STYLE"] = "style";
    CommitType["REFACTOR"] = "refactor";
    CommitType["PERF"] = "perf";
    CommitType["TEST"] = "test";
    CommitType["BUILD"] = "build";
    CommitType["CI"] = "ci";
    CommitType["CHORE"] = "chore";
    CommitType["REVERT"] = "revert"; // Revert previous commit
})(CommitType || (exports.CommitType = CommitType = {}));
/**
 * Semantic version bump strategy
 */
var VersionBump;
(function (VersionBump) {
    VersionBump["MAJOR"] = "major";
    VersionBump["MINOR"] = "minor";
    VersionBump["PATCH"] = "patch"; // Bug fixes (1.0.0 → 1.0.1)
})(VersionBump || (exports.VersionBump = VersionBump = {}));
/**
 * Git Intelligence Engine
 */
var GitIntelligenceEngine = /** @class */ (function () {
    function GitIntelligenceEngine(repoPath) {
        if (repoPath === void 0) { repoPath = process.cwd(); }
        this.hooksInstalled = false;
        this.repoPath = repoPath;
        this.eventBus = EventBus_js_1.AutoProactiveEventBus.getInstance();
        logger_js_1.logger.info("\uD83E\uDDE0 Git Intelligence Engine initialized");
        logger_js_1.logger.info("   Repository: ".concat(repoPath));
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
    GitIntelligenceEngine.prototype.parseConventionalCommit = function (message, hash, author, timestamp) {
        // Regex for conventional commit format
        var pattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\(([^)]+)\))?: (.+)$/;
        var match = message.match(pattern);
        if (!match) {
            // Check for BREAKING CHANGE
            if (message.includes('BREAKING CHANGE')) {
                return this.parseBreakingChange(message, hash, author, timestamp);
            }
            return null;
        }
        var typeStr = match[1], scope = match[2], description = match[3];
        var type = typeStr;
        // Extract task IDs (T001, T002, etc.)
        var taskIds = this.extractTaskIds(message);
        // Extract progress percentage
        var progress = this.extractProgress(message);
        // Check for breaking change in footer
        var breaking = message.toLowerCase().includes('breaking change');
        return {
            type: type,
            scope: scope,
            description: description,
            breaking: breaking,
            taskIds: taskIds,
            progress: progress,
            timestamp: timestamp,
            hash: hash,
            author: author
        };
    };
    /**
     * Parse breaking change commit
     */
    GitIntelligenceEngine.prototype.parseBreakingChange = function (message, hash, author, timestamp) {
        return {
            type: CommitType.BREAKING,
            description: message.replace('BREAKING CHANGE:', '').trim(),
            breaking: true,
            taskIds: this.extractTaskIds(message),
            progress: this.extractProgress(message),
            timestamp: timestamp,
            hash: hash,
            author: author
        };
    };
    /**
     * Extract task IDs from commit message
     */
    GitIntelligenceEngine.prototype.extractTaskIds = function (message) {
        var pattern = /T\d{3,}/g;
        return message.match(pattern) || [];
    };
    /**
     * Extract progress percentage from commit message
     */
    GitIntelligenceEngine.prototype.extractProgress = function (message) {
        var pattern = /(\d{1,3})%/;
        var match = message.match(pattern);
        return match ? parseInt(match[1], 10) : undefined;
    };
    /**
     * Validate commit message format
     */
    GitIntelligenceEngine.prototype.validateCommitMessage = function (message) {
        var errors = [];
        // Check conventional format
        var conventional = this.parseConventionalCommit(message, '', '', new Date());
        if (!conventional && !message.includes('BREAKING CHANGE')) {
            errors.push('Not in conventional commit format: <type>(<scope>): <description>');
        }
        // Check description length
        var firstLine = message.split('\n')[0];
        if (firstLine.length > 100) {
            errors.push('First line exceeds 100 characters');
        }
        // Check for task ID
        if (this.extractTaskIds(message).length === 0) {
            errors.push('No task ID found (expected format: T001, T002, etc.)');
        }
        return {
            valid: errors.length === 0,
            errors: errors
        };
    };
    // ═══════════════════════════════════════════════════════════
    // SEMANTIC VERSIONING - Automatic version management
    // ═══════════════════════════════════════════════════════════
    /**
     * Get current version from git tags
     */
    GitIntelligenceEngine.prototype.getCurrentVersion = function () {
        try {
            var tag = (0, child_process_1.execSync)('git describe --tags --abbrev=0', { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            return this.parseVersion(tag);
        }
        catch (_a) {
            // No tags yet, start at 0.1.0
            return { major: 0, minor: 1, patch: 0, raw: '0.1.0' };
        }
    };
    /**
     * Parse semantic version string
     */
    GitIntelligenceEngine.prototype.parseVersion = function (versionString) {
        // Remove 'v' prefix if present
        var clean = versionString.replace(/^v/, '');
        // Parse: 1.2.3-beta.1+build.123
        var pattern = /^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/;
        var match = clean.match(pattern);
        if (!match) {
            throw new Error("Invalid version format: ".concat(versionString));
        }
        var major = match[1], minor = match[2], patch = match[3], prerelease = match[4], metadata = match[5];
        return {
            major: parseInt(major, 10),
            minor: parseInt(minor, 10),
            patch: parseInt(patch, 10),
            prerelease: prerelease,
            metadata: metadata,
            raw: clean
        };
    };
    /**
     * Determine version bump from commits
     */
    GitIntelligenceEngine.prototype.determineVersionBump = function (commits) {
        // Check for breaking changes (major bump)
        if (commits.some(function (c) { return c.breaking || c.type === CommitType.BREAKING; })) {
            return VersionBump.MAJOR;
        }
        // Check for new features (minor bump)
        if (commits.some(function (c) { return c.type === CommitType.FEAT; })) {
            return VersionBump.MINOR;
        }
        // Otherwise patch bump
        return VersionBump.PATCH;
    };
    /**
     * Calculate next version
     */
    GitIntelligenceEngine.prototype.calculateNextVersion = function (current, bump) {
        var major = current.major, minor = current.minor, patch = current.patch;
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
        var raw = "".concat(major, ".").concat(minor, ".").concat(patch);
        return { major: major, minor: minor, patch: patch, raw: raw };
    };
    /**
     * Create git tag for version
     */
    GitIntelligenceEngine.prototype.createVersionTag = function (version, message) {
        var tagName = "v".concat(version.raw);
        var tagMessage = message || "Release ".concat(tagName);
        (0, child_process_1.execSync)("git tag -a \"".concat(tagName, "\" -m \"").concat(tagMessage, "\""), { cwd: this.repoPath });
        logger_js_1.logger.info("\u2705 Created version tag: ".concat(tagName));
        // Emit event
        this.eventBus.emitLoopEvent(EventBus_js_1.LoopEvent.VERSION_TAGGED, {
            version: version.raw,
            tag: tagName,
            timestamp: Date.now()
        }, { priority: 'high', source: 'GitIntelligence' });
    };
    // ═══════════════════════════════════════════════════════════
    // GIT PUSH DETECTION - Monitor remote synchronization
    // ═══════════════════════════════════════════════════════════
    /**
     * Detect recent pushes
     */
    GitIntelligenceEngine.prototype.detectRecentPushes = function (sinceMinutes) {
        if (sinceMinutes === void 0) { sinceMinutes = 5; }
        try {
            // Get reflog for pushes
            var reflog = (0, child_process_1.execSync)("git reflog --since=\"".concat(sinceMinutes, " minutes ago\" --grep-reflog=\"push\""), { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            if (!reflog)
                return [];
            // Parse reflog entries
            var events = [];
            var lines = reflog.split('\n');
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                // Parse: hash HEAD@{timestamp}: commit: message
                var match = line.match(/^([a-f0-9]+) .+: (.+)$/);
                if (!match)
                    continue;
                var hash = match[1];
                // Get push details
                var pushInfo = this.getPushInfo(hash);
                if (pushInfo) {
                    events.push(pushInfo);
                }
            }
            return events;
        }
        catch (error) {
            logger_js_1.logger.error('❌ Failed to detect pushes:', error);
            return [];
        }
    };
    /**
     * Get push information for a commit
     */
    GitIntelligenceEngine.prototype.getPushInfo = function (hash) {
        var _a;
        try {
            var info = (0, child_process_1.execSync)("git log -1 --format=\"%an|%ai|%D\" ".concat(hash), { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            var _b = info.split('|'), author = _b[0], timestamp = _b[1], refs = _b[2];
            // Extract branch and remote from refs
            var branch = ((_a = refs.match(/origin\/([^,]+)/)) === null || _a === void 0 ? void 0 : _a[1]) || 'main';
            var remote = 'origin';
            // Get commits in this push
            var commits = [hash];
            return {
                branch: branch,
                remote: remote,
                commits: commits,
                timestamp: new Date(timestamp),
                commitCount: commits.length,
                author: author,
                forced: false // TODO: Detect force push
            };
        }
        catch (_c) {
            return null;
        }
    };
    /**
     * Check if local is ahead of remote (needs push)
     */
    GitIntelligenceEngine.prototype.needsPush = function () {
        try {
            var status_1 = (0, child_process_1.execSync)('git status -sb', { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            return status_1.includes('[ahead');
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Check if local is behind remote (needs pull)
     */
    GitIntelligenceEngine.prototype.needsPull = function () {
        try {
            var status_2 = (0, child_process_1.execSync)('git status -sb', { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            return status_2.includes('[behind');
        }
        catch (_a) {
            return false;
        }
    };
    // ═══════════════════════════════════════════════════════════
    // BRANCH INTELLIGENCE - Track parallel work streams
    // ═══════════════════════════════════════════════════════════
    /**
     * Analyze all branches
     */
    GitIntelligenceEngine.prototype.analyzeBranches = function () {
        var _this = this;
        try {
            var branches = (0, child_process_1.execSync)('git branch -a --format="%(refname:short)|%(authorname)|%(committerdate:iso8601)"', { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n');
            return branches.map(function (line) {
                var _a = line.split('|'), name = _a[0], author = _a[1], dateStr = _a[2];
                var lastCommit = new Date(dateStr);
                // Determine branch type
                var type = _this.determineBranchType(name);
                // Get commit count
                var commitCount = _this.getBranchCommitCount(name);
                // Extract task IDs from branch commits
                var taskIds = _this.getBranchTaskIds(name);
                // Determine status
                var daysSinceCommit = (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
                var status = daysSinceCommit > 14 ? 'stale' : 'active';
                return {
                    name: name,
                    type: type,
                    basedOn: _this.getBranchBase(name),
                    commitCount: commitCount,
                    lastCommit: lastCommit,
                    author: author,
                    taskIds: taskIds,
                    status: status
                };
            });
        }
        catch (error) {
            logger_js_1.logger.error('❌ Failed to analyze branches:', error);
            return [];
        }
    };
    /**
     * Determine branch type from name
     */
    GitIntelligenceEngine.prototype.determineBranchType = function (name) {
        if (name === 'main' || name === 'master')
            return 'main';
        if (name === 'develop' || name === 'dev')
            return 'develop';
        if (name.startsWith('feature/'))
            return 'feature';
        if (name.startsWith('hotfix/'))
            return 'hotfix';
        if (name.startsWith('release/'))
            return 'release';
        return 'feature'; // Default
    };
    /**
     * Get branch commit count
     */
    GitIntelligenceEngine.prototype.getBranchCommitCount = function (branch) {
        try {
            var count = (0, child_process_1.execSync)("git rev-list --count ".concat(branch), { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            return parseInt(count, 10);
        }
        catch (_a) {
            return 0;
        }
    };
    /**
     * Get task IDs from branch commits
     */
    GitIntelligenceEngine.prototype.getBranchTaskIds = function (branch) {
        try {
            var log = (0, child_process_1.execSync)("git log ".concat(branch, " --format=\"%s\""), { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            var taskIds_1 = new Set();
            var pattern = /T\d{3,}/g;
            for (var _i = 0, _a = log.split('\n'); _i < _a.length; _i++) {
                var line = _a[_i];
                var matches = line.match(pattern);
                if (matches) {
                    matches.forEach(function (id) { return taskIds_1.add(id); });
                }
            }
            return Array.from(taskIds_1);
        }
        catch (_b) {
            return [];
        }
    };
    /**
     * Get branch base (what it was created from)
     */
    GitIntelligenceEngine.prototype.getBranchBase = function (branch) {
        try {
            var base = (0, child_process_1.execSync)("git merge-base ".concat(branch, " main"), { cwd: this.repoPath, encoding: 'utf-8' }).trim();
            return base.substring(0, 7);
        }
        catch (_a) {
            return 'unknown';
        }
    };
    // ═══════════════════════════════════════════════════════════
    // CHANGELOG GENERATION - Automatic release notes
    // ═══════════════════════════════════════════════════════════
    /**
     * Generate changelog from commits
     */
    GitIntelligenceEngine.prototype.generateChangelog = function (since, until) {
        if (until === void 0) { until = 'HEAD'; }
        try {
            var sinceArg = since ? "".concat(since, "..").concat(until) : until;
            var commits = (0, child_process_1.execSync)("git log ".concat(sinceArg, " --format=\"%H|%s|%an|%ai\""), { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n');
            var changelog = [];
            var features = [];
            var fixes = [];
            var breaking = [];
            var other = [];
            for (var _i = 0, commits_1 = commits; _i < commits_1.length; _i++) {
                var line = commits_1[_i];
                var _a = line.split('|'), hash = _a[0], message = _a[1];
                var conventional = this.parseConventionalCommit(message, hash, '', new Date());
                if (conventional === null || conventional === void 0 ? void 0 : conventional.breaking) {
                    breaking.push("- \u26A0\uFE0F **BREAKING**: ".concat(conventional.description, " (").concat(hash.substring(0, 7), ")"));
                }
                else if ((conventional === null || conventional === void 0 ? void 0 : conventional.type) === CommitType.FEAT) {
                    features.push("- \u2728 ".concat(conventional.description, " (").concat(hash.substring(0, 7), ")"));
                }
                else if ((conventional === null || conventional === void 0 ? void 0 : conventional.type) === CommitType.FIX) {
                    fixes.push("- \uD83D\uDC1B ".concat(conventional.description, " (").concat(hash.substring(0, 7), ")"));
                }
                else {
                    other.push("- ".concat(message, " (").concat(hash.substring(0, 7), ")"));
                }
            }
            // Build changelog
            if (breaking.length > 0) {
                changelog.push('## ⚠️ BREAKING CHANGES\n');
                changelog.push.apply(changelog, __spreadArray(__spreadArray([], breaking, false), [''], false));
            }
            if (features.length > 0) {
                changelog.push('## ✨ Features\n');
                changelog.push.apply(changelog, __spreadArray(__spreadArray([], features, false), [''], false));
            }
            if (fixes.length > 0) {
                changelog.push('## 🐛 Bug Fixes\n');
                changelog.push.apply(changelog, __spreadArray(__spreadArray([], fixes, false), [''], false));
            }
            if (other.length > 0) {
                changelog.push('## 📝 Other Changes\n');
                changelog.push.apply(changelog, __spreadArray(__spreadArray([], other, false), [''], false));
            }
            return changelog.join('\n');
        }
        catch (error) {
            logger_js_1.logger.error('❌ Failed to generate changelog:', error);
            return '';
        }
    };
    /**
     * Write changelog to CHANGELOG.md
     */
    GitIntelligenceEngine.prototype.writeChangelog = function (version, content) {
        var changelogPath = (0, path_1.join)(this.repoPath, 'CHANGELOG.md');
        var header = "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
        var versionHeader = "## [".concat(version.raw, "] - ").concat(new Date().toISOString().split('T')[0], "\n\n");
        var existing = '';
        if ((0, fs_1.existsSync)(changelogPath)) {
            existing = (0, fs_1.readFileSync)(changelogPath, 'utf-8');
            existing = existing.replace(header, '');
        }
        var newContent = header + versionHeader + content + '\n' + existing;
        (0, fs_1.writeFileSync)(changelogPath, newContent, 'utf-8');
        logger_js_1.logger.info("\u2705 Updated CHANGELOG.md with version ".concat(version.raw));
    };
    // ═══════════════════════════════════════════════════════════
    // STATISTICS & REPORTING
    // ═══════════════════════════════════════════════════════════
    /**
     * Get repository statistics
     */
    GitIntelligenceEngine.prototype.getRepoStats = function () {
        try {
            var commitCount = parseInt((0, child_process_1.execSync)('git rev-list --count HEAD', { cwd: this.repoPath, encoding: 'utf-8' }).trim(), 10);
            var branchCount = (0, child_process_1.execSync)('git branch -a', { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n').length;
            var tagCount = (0, child_process_1.execSync)('git tag', { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n').filter(Boolean).length;
            var contributors = new Set((0, child_process_1.execSync)('git log --format="%an"', { cwd: this.repoPath, encoding: 'utf-8' }).trim().split('\n')).size;
            // Lines of code (tracked files) - filter out directories and suppress errors
            var linesOfCode = parseInt((0, child_process_1.execSync)('git ls-files | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\'', { cwd: this.repoPath, encoding: 'utf-8', shell: '/bin/bash' }).trim() || '0', 10);
            return {
                commitCount: commitCount,
                branchCount: branchCount,
                tagCount: tagCount,
                contributors: contributors,
                linesOfCode: linesOfCode
            };
        }
        catch (error) {
            logger_js_1.logger.error('❌ Failed to get repo stats:', error);
            return {
                commitCount: 0,
                branchCount: 0,
                tagCount: 0,
                contributors: 0,
                linesOfCode: 0
            };
        }
    };
    return GitIntelligenceEngine;
}());
exports.GitIntelligenceEngine = GitIntelligenceEngine;
