"use strict";
/**
 * Loop 5: Status Auto-Analysis
 * ==============================
 *
 * THE HEALTH MONITOR!
 *
 * Runs every 5 minutes:
 * 1. Monitors git status for all projects
 * 2. Analyzes build health
 * 3. Tracks commit velocity
 * 4. Identifies blockers
 * 5. Updates health metrics
 * 6. Alerts on critical issues
 *
 * Keeps all projects healthy without manual monitoring!
 */
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
exports.StatusAnalysisLoop = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var crypto_1 = require("crypto");
var logger_js_1 = require("../utils/logger.js");
var StatusAnalysisLoop = /** @class */ (function () {
    function StatusAnalysisLoop(db, config) {
        this.intervalHandle = null;
        this.isRunning = false;
        this.loopCount = 0;
        this.projectsAnalyzed = 0;
        this.blockersFound = 0;
        this.db = db;
        this.config = config;
    }
    /**
     * Start status analysis loop
     */
    StatusAnalysisLoop.prototype.start = function () {
        var _this = this;
        if (this.isRunning) {
            logger_js_1.logger.warn('⚠️  Status analysis loop already running');
            return;
        }
        logger_js_1.logger.info("\uD83D\uDD04 Starting Status Auto-Analysis Loop (every ".concat(this.config.intervalSeconds, "s)"));
        this.isRunning = true;
        // Run immediately
        this.runAnalysis();
        // Then on interval
        this.intervalHandle = setInterval(function () { return _this.runAnalysis(); }, this.config.intervalSeconds * 1000);
        logger_js_1.logger.info('✅ Loop 5: Status Auto-Analysis ACTIVE');
    };
    /**
     * Stop loop
     */
    StatusAnalysisLoop.prototype.stop = function () {
        if (!this.isRunning)
            return;
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        this.isRunning = false;
        logger_js_1.logger.info('🛑 Loop 5: Status Auto-Analysis STOPPED');
    };
    /**
     * Run analysis cycle
     */
    StatusAnalysisLoop.prototype.runAnalysis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, projects, analyzed, blockers, _i, projects_1, project, status_1, duration;
            return __generator(this, function (_a) {
                this.loopCount++;
                startTime = Date.now();
                logger_js_1.logger.info("\uD83D\uDCCA Loop 2 Execution #".concat(this.loopCount, ": Analyzing project status..."));
                try {
                    projects = this.getRegisteredProjects();
                    if (projects.length === 0) {
                        logger_js_1.logger.info("   No projects to analyze");
                        return [2 /*return*/];
                    }
                    logger_js_1.logger.info("   Analyzing ".concat(projects.length, " projects"));
                    analyzed = 0;
                    blockers = 0;
                    for (_i = 0, projects_1 = projects; _i < projects_1.length; _i++) {
                        project = projects_1[_i];
                        try {
                            status_1 = this.analyzeProjectStatus(project);
                            this.updateProjectHealth(project.id, status_1);
                            analyzed++;
                            this.projectsAnalyzed++;
                            if (status_1.blockers && status_1.blockers.length > 0) {
                                blockers += status_1.blockers.length;
                                this.blockersFound += status_1.blockers.length;
                                logger_js_1.logger.warn("   \uD83D\uDEA7 ".concat(project.name, ": ").concat(status_1.blockers.length, " blockers found"));
                                if (this.config.autoAlert) {
                                    this.alertBlockers(project, status_1.blockers);
                                }
                            }
                            else {
                                logger_js_1.logger.info("   \u2705 ".concat(project.name, ": Healthy"));
                            }
                        }
                        catch (err) {
                            logger_js_1.logger.error("   \u274C Error analyzing ".concat(project.name, ": ").concat(err.message));
                        }
                    }
                    duration = Date.now() - startTime;
                    logger_js_1.logger.info("\u2705 Loop 2 Complete: Analyzed ".concat(analyzed, " projects, found ").concat(blockers, " blockers in ").concat(duration, "ms"));
                    // Log execution
                    this.logLoopExecution({
                        projectsAnalyzed: analyzed,
                        blockersFound: blockers,
                        durationMs: duration
                    });
                }
                catch (err) {
                    logger_js_1.logger.error("\u274C Loop 2 Error:", err);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get all registered projects
     */
    StatusAnalysisLoop.prototype.getRegisteredProjects = function () {
        return this.db.prepare("\n      SELECT id, name, path, type\n      FROM projects\n      ORDER BY project_number ASC\n    ").all();
    };
    /**
     * Analyze single project status
     */
    StatusAnalysisLoop.prototype.analyzeProjectStatus = function (project) {
        var status = {
            projectId: project.id,
            projectName: project.name,
            analyzedAt: new Date().toISOString(),
            health: 'HEALTHY',
            blockers: []
        };
        // Git analysis
        if (this.config.analyzeGit && (0, fs_1.existsSync)(project.path)) {
            try {
                var gitStatus = this.analyzeGitStatus(project.path);
                status.git = gitStatus;
                // Check for uncommitted changes
                if (gitStatus.hasUncommittedChanges) {
                    status.blockers.push({
                        type: 'UNCOMMITTED_CHANGES',
                        severity: 'LOW',
                        description: "".concat(gitStatus.filesChanged, " uncommitted files")
                    });
                }
            }
            catch (err) {
                status.git = { error: err.message };
            }
        }
        // Build health (simplified - check for package.json errors)
        if (this.config.analyzeBuild && (0, fs_1.existsSync)(project.path)) {
            try {
                var buildStatus = this.analyzeBuildHealth(project.path);
                status.build = buildStatus;
                if (!buildStatus.healthy) {
                    status.blockers.push({
                        type: 'BUILD_ISSUE',
                        severity: 'HIGH',
                        description: buildStatus.error || 'Build unhealthy'
                    });
                }
            }
            catch (err) {
                status.build = { error: err.message };
            }
        }
        // Set overall health
        if (status.blockers.length > 0) {
            var hasCritical = status.blockers.some(function (b) { return b.severity === 'CRITICAL'; });
            var hasHigh = status.blockers.some(function (b) { return b.severity === 'HIGH'; });
            if (hasCritical)
                status.health = 'CRITICAL';
            else if (hasHigh)
                status.health = 'DEGRADED';
            else
                status.health = 'WARNING';
        }
        return status;
    };
    /**
     * Analyze git status
     */
    StatusAnalysisLoop.prototype.analyzeGitStatus = function (projectPath) {
        try {
            var statusOutput = (0, child_process_1.execSync)('git status --porcelain', {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            var filesChanged = statusOutput.trim().split('\n').filter(function (l) { return l.trim(); }).length;
            // Get recent commits
            var commitLog = (0, child_process_1.execSync)('git log --oneline -10', {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            var commits = commitLog.trim().split('\n').length;
            return {
                hasUncommittedChanges: filesChanged > 0,
                filesChanged: filesChanged,
                recentCommits: commits,
                healthy: true
            };
        }
        catch (err) {
            return {
                error: err.message,
                healthy: false
            };
        }
    };
    /**
     * Analyze build health
     */
    StatusAnalysisLoop.prototype.analyzeBuildHealth = function (projectPath) {
        // Simplified check - just verify no critical errors
        // Full implementation would run actual builds
        try {
            // Check if package.json exists
            var hasPackageJson = (0, fs_1.existsSync)("".concat(projectPath, "/package.json"));
            return {
                healthy: true,
                hasPackageJson: hasPackageJson
            };
        }
        catch (err) {
            return {
                healthy: false,
                error: err.message
            };
        }
    };
    /**
     * Update project health metrics
     */
    StatusAnalysisLoop.prototype.updateProjectHealth = function (projectId, status) {
        this.db.prepare("\n      UPDATE projects\n      SET\n        last_activity = datetime('now'),\n        metadata = json_set(\n          COALESCE(metadata, '{}'),\n          '$.health', ?,\n          '$.lastAnalyzed', ?,\n          '$.blockers', ?\n        )\n      WHERE id = ?\n    ").run(status.health, status.analyzedAt, JSON.stringify(status.blockers), projectId);
    };
    /**
     * Alert on blockers
     */
    StatusAnalysisLoop.prototype.alertBlockers = function (project, blockers) {
        // TODO: Implement actual alerting (Slack, email, etc.)
        // For now, just log
        logger_js_1.logger.warn("   \uD83D\uDCEC Would alert: ".concat(project.name, " has ").concat(blockers.length, " blockers"));
    };
    /**
     * Log loop execution
     */
    StatusAnalysisLoop.prototype.logLoopExecution = function (result) {
        try {
            this.db.prepare("\n        INSERT INTO auto_proactive_logs (\n          id, loop_name, action, result, timestamp, execution_time_ms\n        ) VALUES (?, ?, ?, ?, ?, ?)\n      ").run((0, crypto_1.randomUUID)(), 'STATUS_ANALYSIS', 'ANALYZE_HEALTH', JSON.stringify(result), new Date().toISOString(), result.durationMs);
        }
        catch (err) {
            // Ignore if can't log
        }
    };
    /**
     * Get loop statistics
     */
    StatusAnalysisLoop.prototype.getStats = function () {
        return {
            isRunning: this.isRunning,
            loopCount: this.loopCount,
            projectsAnalyzed: this.projectsAnalyzed,
            blockersFound: this.blockersFound,
            intervalSeconds: this.config.intervalSeconds
        };
    };
    return StatusAnalysisLoop;
}());
exports.StatusAnalysisLoop = StatusAnalysisLoop;
