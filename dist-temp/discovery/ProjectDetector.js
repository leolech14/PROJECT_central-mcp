"use strict";
/**
 * Project Auto-Detector
 * =====================
 *
 * Automatically detects and registers projects from agent's environment.
 *
 * Features:
 * - Detects project from git remote
 * - Detects project from directory path
 * - Auto-registers new projects
 * - Classifies project type
 * - Extracts vision from CLAUDE.md
 *
 * T001 - CRITICAL PATH - DISCOVERY ENGINE FOUNDATION
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDetector = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var uuid_1 = require("uuid");
var ProjectDetector = /** @class */ (function () {
    function ProjectDetector(db) {
        this.db = db;
    }
    /**
     * Detect project from current directory
     */
    ProjectDetector.prototype.detectProject = function (cwd) {
        return __awaiter(this, void 0, void 0, function () {
            var gitRemote, existingProject_1, existingProject;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDD0D Detecting project from: ".concat(cwd));
                gitRemote = this.getGitRemote(cwd);
                if (gitRemote) {
                    existingProject_1 = this.findProjectByGitRemote(gitRemote);
                    if (existingProject_1) {
                        console.log("\u2705 Found existing project: ".concat(existingProject_1.name, " (by git remote)"));
                        return [2 /*return*/, this.updateLastActivity(existingProject_1)];
                    }
                }
                existingProject = this.findProjectByPath(cwd);
                if (existingProject) {
                    console.log("\u2705 Found existing project: ".concat(existingProject.name, " (by path)"));
                    return [2 /*return*/, this.updateLastActivity(existingProject)];
                }
                // 3. Not found - create new project
                console.log("\uD83C\uDD95 New project detected, auto-registering...");
                return [2 /*return*/, this.createNewProject(cwd, gitRemote)];
            });
        });
    };
    /**
     * Get git remote URL from directory
     */
    ProjectDetector.prototype.getGitRemote = function (cwd) {
        try {
            var remote = (0, child_process_1.execSync)('git remote get-url origin', {
                cwd: cwd,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            // Normalize remote URL
            return this.normalizeGitRemote(remote);
        }
        catch (error) {
            // Not a git repository or no remote
            return null;
        }
    };
    /**
     * Normalize git remote URL for consistent matching
     */
    ProjectDetector.prototype.normalizeGitRemote = function (remote) {
        // Remove .git suffix
        remote = remote.replace(/\.git$/, '');
        // Convert SSH to HTTPS format for consistency
        // git@github.com:user/repo → https://github.com/user/repo
        remote = remote.replace(/^git@([^:]+):(.+)$/, 'https://$1/$2');
        return remote;
    };
    /**
     * Find project by git remote
     */
    ProjectDetector.prototype.findProjectByGitRemote = function (gitRemote) {
        var row = this.db.prepare("\n      SELECT * FROM projects WHERE git_remote = ?\n    ").get(gitRemote);
        return row ? this.rowToProject(row) : null;
    };
    /**
     * Find project by path
     */
    ProjectDetector.prototype.findProjectByPath = function (projectPath) {
        var row = this.db.prepare("\n      SELECT * FROM projects WHERE path = ?\n    ").get(projectPath);
        return row ? this.rowToProject(row) : null;
    };
    /**
     * Create new project from detection
     */
    ProjectDetector.prototype.createNewProject = function (cwd, gitRemote) {
        var projectName = path_1.default.basename(cwd);
        var metadata = this.detectMetadata(cwd);
        var projectType = this.classifyProjectType(cwd, metadata);
        var vision = this.extractVision(cwd);
        var project = {
            id: (0, uuid_1.v4)(),
            name: projectName,
            path: cwd,
            gitRemote: gitRemote,
            type: projectType,
            vision: vision,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            discoveredBy: 'auto',
            metadata: metadata
        };
        // Insert into database
        this.db.prepare("\n      INSERT INTO projects (\n        id, name, path, git_remote, type, vision,\n        created_at, last_activity, discovered_by, metadata\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ").run(project.id, project.name, project.path, project.gitRemote, project.type, project.vision, project.createdAt, project.lastActivity, project.discoveredBy, JSON.stringify(project.metadata));
        console.log("\u2705 Project registered: ".concat(project.name, " (").concat(project.type, ")"));
        return project;
    };
    /**
     * Detect project metadata
     */
    ProjectDetector.prototype.detectMetadata = function (cwd) {
        var metadata = {
            hasClaudeMd: (0, fs_1.existsSync)(path_1.default.join(cwd, 'CLAUDE.md')),
            hasPackageJson: (0, fs_1.existsSync)(path_1.default.join(cwd, 'package.json')),
            hasSpecBase: (0, fs_1.existsSync)(path_1.default.join(cwd, '02_SPECBASES')),
            hasCodebase: (0, fs_1.existsSync)(path_1.default.join(cwd, '01_CODEBASES')),
            hasTaskRegistry: (0, fs_1.existsSync)(path_1.default.join(cwd, '04_AGENT_FRAMEWORK/CENTRAL_TASK_REGISTRY.md')),
            technologies: this.detectTechnologies(cwd),
            estimatedSize: this.estimateSize(cwd)
        };
        return metadata;
    };
    /**
     * Classify project type
     */
    ProjectDetector.prototype.classifyProjectType = function (cwd, metadata) {
        // Check CLAUDE.md for explicit type
        var claudeMd = this.readClaudeMd(cwd);
        if (claudeMd) {
            if (claudeMd.includes('COMMERCIAL_APP') || claudeMd.includes('Commercial App')) {
                return 'COMMERCIAL_APP';
            }
            if (claudeMd.includes('KNOWLEDGE_SYSTEM') || claudeMd.includes('Knowledge System')) {
                return 'KNOWLEDGE_SYSTEM';
            }
            if (claudeMd.includes('TOOL') || claudeMd.includes('Internal Tool')) {
                return 'TOOL';
            }
            if (claudeMd.includes('INFRASTRUCTURE')) {
                return 'INFRASTRUCTURE';
            }
            if (claudeMd.includes('EXPERIMENTAL')) {
                return 'EXPERIMENTAL';
            }
        }
        // Infer from structure
        if (metadata.hasSpecBase && metadata.hasCodebase) {
            return 'COMMERCIAL_APP'; // Full 6-layer architecture
        }
        if (cwd.includes('PROJECT_') && cwd.includes('KNOWLEDGE')) {
            return 'KNOWLEDGE_SYSTEM';
        }
        if (metadata.hasCodebase && !metadata.hasSpecBase) {
            return 'TOOL'; // Code without specs = utility tool
        }
        if (cwd.includes('mcp-server') || cwd.includes('infrastructure')) {
            return 'INFRASTRUCTURE';
        }
        return 'UNKNOWN';
    };
    /**
     * Extract vision from CLAUDE.md
     */
    ProjectDetector.prototype.extractVision = function (cwd) {
        var claudeMd = this.readClaudeMd(cwd);
        if (!claudeMd)
            return null;
        // Extract first section or overview
        var lines = claudeMd.split('\n');
        var vision = '';
        var inVisionSection = false;
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            if (line.startsWith('# ') || line.startsWith('## Project Overview') || line.startsWith('## 🎯')) {
                inVisionSection = true;
                continue;
            }
            if (inVisionSection && line.startsWith('##')) {
                break; // End of vision section
            }
            if (inVisionSection && line.trim()) {
                vision += line + '\n';
            }
            if (vision.length > 500)
                break; // Limit to 500 chars
        }
        return vision.trim() || null;
    };
    /**
     * Read CLAUDE.md file
     */
    ProjectDetector.prototype.readClaudeMd = function (cwd) {
        var claudePath = path_1.default.join(cwd, 'CLAUDE.md');
        if (!(0, fs_1.existsSync)(claudePath))
            return null;
        try {
            return (0, fs_1.readFileSync)(claudePath, 'utf-8');
        }
        catch (error) {
            return null;
        }
    };
    /**
     * Detect technologies used in project
     */
    ProjectDetector.prototype.detectTechnologies = function (cwd) {
        var technologies = new Set();
        // Check package.json
        var packagePath = path_1.default.join(cwd, 'package.json');
        if ((0, fs_1.existsSync)(packagePath)) {
            try {
                var pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
                var deps = __assign(__assign({}, pkg.dependencies), pkg.devDependencies);
                if (deps['react'])
                    technologies.add('React');
                if (deps['next'])
                    technologies.add('Next.js');
                if (deps['vue'])
                    technologies.add('Vue');
                if (deps['typescript'])
                    technologies.add('TypeScript');
                if (deps['@modelcontextprotocol/sdk'])
                    technologies.add('MCP');
                if (deps['better-sqlite3'])
                    technologies.add('SQLite');
                if (deps['postgres'] || deps['pg'])
                    technologies.add('PostgreSQL');
            }
            catch (error) {
                // Invalid package.json
            }
        }
        // Check for Swift
        try {
            var xcodeproj = (0, child_process_1.execSync)('find . -maxdepth 2 -name "*.xcodeproj" -type d', {
                cwd: cwd,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            if (xcodeproj) {
                technologies.add('Swift');
                technologies.add('macOS');
            }
        }
        catch (error) {
            // No Xcode project
        }
        // Check for Python
        if ((0, fs_1.existsSync)(path_1.default.join(cwd, 'requirements.txt')) || (0, fs_1.existsSync)(path_1.default.join(cwd, 'setup.py'))) {
            technologies.add('Python');
        }
        return Array.from(technologies);
    };
    /**
     * Estimate project size
     */
    ProjectDetector.prototype.estimateSize = function (cwd) {
        try {
            // Count files
            var fileCount = (0, child_process_1.execSync)('find . -type f | wc -l', {
                cwd: cwd,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            var count = parseInt(fileCount, 10);
            if (count < 100)
                return 'small';
            if (count < 500)
                return 'medium';
            return 'large';
        }
        catch (error) {
            return 'medium';
        }
    };
    /**
     * Update project last activity
     */
    ProjectDetector.prototype.updateLastActivity = function (project) {
        var now = new Date().toISOString();
        this.db.prepare("\n      UPDATE projects SET last_activity = ? WHERE id = ?\n    ").run(now, project.id);
        return __assign(__assign({}, project), { lastActivity: now });
    };
    /**
     * Convert database row to Project object
     */
    ProjectDetector.prototype.rowToProject = function (row) {
        return {
            id: row.id,
            name: row.name,
            path: row.path,
            gitRemote: row.git_remote,
            type: row.type,
            vision: row.vision,
            createdAt: row.created_at,
            lastActivity: row.last_activity,
            discoveredBy: row.discovered_by,
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
        };
    };
    /**
     * Get all projects
     */
    ProjectDetector.prototype.getAllProjects = function () {
        var _this = this;
        var rows = this.db.prepare("\n      SELECT * FROM projects\n      ORDER BY last_activity DESC\n    ").all();
        return rows.map(function (row) { return _this.rowToProject(row); });
    };
    /**
     * Get project by ID
     */
    ProjectDetector.prototype.getProject = function (projectId) {
        var row = this.db.prepare("\n      SELECT * FROM projects WHERE id = ?\n    ").get(projectId);
        return row ? this.rowToProject(row) : null;
    };
    /**
     * Get projects by type
     */
    ProjectDetector.prototype.getProjectsByType = function (type) {
        var _this = this;
        var rows = this.db.prepare("\n      SELECT * FROM projects WHERE type = ?\n      ORDER BY last_activity DESC\n    ").all(type);
        return rows.map(function (row) { return _this.rowToProject(row); });
    };
    /**
     * Search projects by name or path
     */
    ProjectDetector.prototype.searchProjects = function (query) {
        var _this = this;
        var rows = this.db.prepare("\n      SELECT * FROM projects\n      WHERE name LIKE ? OR path LIKE ?\n      ORDER BY last_activity DESC\n      LIMIT 20\n    ").all("%".concat(query, "%"), "%".concat(query, "%"));
        return rows.map(function (row) { return _this.rowToProject(row); });
    };
    /**
     * Get project statistics
     */
    ProjectDetector.prototype.getProjectStats = function (projectId) {
        var _a, _b, _c;
        var project = this.getProject(projectId);
        if (!project)
            return null;
        // Count tasks
        var taskStats = this.db.prepare("\n      SELECT\n        status,\n        COUNT(*) as count\n      FROM tasks\n      WHERE project_id = ?\n      GROUP BY status\n    ").all(projectId);
        // Count active sessions
        var activeSessions = this.db.prepare("\n      SELECT COUNT(*) as count\n      FROM agent_sessions\n      WHERE project_id = ? AND status IN ('ACTIVE', 'IDLE')\n    ").get(projectId);
        // Get agent count
        var agentCount = this.db.prepare("\n      SELECT COUNT(DISTINCT agent_letter) as count\n      FROM agent_sessions\n      WHERE project_id = ?\n    ").get(projectId);
        return {
            projectId: projectId,
            projectName: project.name,
            totalTasks: taskStats.reduce(function (sum, s) { return sum + s.count; }, 0),
            completedTasks: ((_a = taskStats.find(function (s) { return s.status === 'COMPLETE'; })) === null || _a === void 0 ? void 0 : _a.count) || 0,
            inProgressTasks: ((_b = taskStats.find(function (s) { return s.status === 'IN_PROGRESS'; })) === null || _b === void 0 ? void 0 : _b.count) || 0,
            availableTasks: ((_c = taskStats.find(function (s) { return s.status === 'AVAILABLE'; })) === null || _c === void 0 ? void 0 : _c.count) || 0,
            activeSessions: activeSessions.count,
            totalAgents: agentCount.count,
            lastActivity: project.lastActivity
        };
    };
    return ProjectDetector;
}());
exports.ProjectDetector = ProjectDetector;
