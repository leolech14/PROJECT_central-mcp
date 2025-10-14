"use strict";
/**
 * Loop 2: Project Auto-Discovery
 * ================================
 *
 * THE FIRST AUTO-PROACTIVE LOOP!
 *
 * Runs every 60 seconds:
 * 1. Scans PROJECTS_all/ directory
 * 2. Detects new projects
 * 3. Auto-registers in database
 * 4. Loads project soul (specs + context)
 * 5. Triggers downstream analysis
 *
 * This is the foundation of the self-building system!
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
exports.ProjectDiscoveryLoop = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var crypto_1 = require("crypto");
var ProjectDetector_js_1 = require("../discovery/ProjectDetector.js");
var ContextExtractor_js_1 = require("../discovery/ContextExtractor.js");
var logger_js_1 = require("../utils/logger.js");
var ProjectDiscoveryLoop = /** @class */ (function () {
    function ProjectDiscoveryLoop(db, config) {
        this.intervalHandle = null;
        this.isRunning = false;
        this.loopCount = 0;
        this.projectsDiscovered = 0;
        this.db = db;
        this.config = config;
        this.detector = new ProjectDetector_js_1.ProjectDetector(db);
        this.extractor = new ContextExtractor_js_1.ContextExtractor(db);
    }
    /**
     * Start the auto-discovery loop
     */
    ProjectDiscoveryLoop.prototype.start = function () {
        var _this = this;
        if (this.isRunning) {
            logger_js_1.logger.warn('⚠️  Project discovery loop already running');
            return;
        }
        logger_js_1.logger.info("\uD83D\uDD04 Starting Project Auto-Discovery Loop (every ".concat(this.config.intervalSeconds, "s)"));
        logger_js_1.logger.info("\uD83D\uDCC1 Scanning paths: ".concat(this.config.scanPaths.join(', ')));
        this.isRunning = true;
        // Run immediately on start
        this.runDiscovery();
        // Then run on interval
        this.intervalHandle = setInterval(function () { return _this.runDiscovery(); }, this.config.intervalSeconds * 1000);
        logger_js_1.logger.info('✅ Loop 2: Project Auto-Discovery ACTIVE');
    };
    /**
     * Stop the loop
     */
    ProjectDiscoveryLoop.prototype.stop = function () {
        if (!this.isRunning) {
            logger_js_1.logger.warn('⚠️  Project discovery loop not running');
            return;
        }
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        this.isRunning = false;
        logger_js_1.logger.info('🛑 Loop 2: Project Auto-Discovery STOPPED');
    };
    /**
     * Run discovery cycle
     */
    ProjectDiscoveryLoop.prototype.runDiscovery = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, projectsFound, newProjects, _i, _a, scanPath, projects, _b, projects_1, projectPath, existing, project, err_1, duration, err_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.loopCount++;
                        startTime = Date.now();
                        logger_js_1.logger.info("\uD83D\uDD0D Loop 1 Execution #".concat(this.loopCount, ": Scanning for projects..."));
                        projectsFound = 0;
                        newProjects = 0;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 12, , 13]);
                        _i = 0, _a = this.config.scanPaths;
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        scanPath = _a[_i];
                        if (!(0, fs_1.existsSync)(scanPath)) {
                            logger_js_1.logger.warn("\u26A0\uFE0F  Scan path does not exist: ".concat(scanPath));
                            return [3 /*break*/, 10];
                        }
                        projects = this.scanDirectory(scanPath);
                        projectsFound += projects.length;
                        _b = 0, projects_1 = projects;
                        _c.label = 3;
                    case 3:
                        if (!(_b < projects_1.length)) return [3 /*break*/, 10];
                        projectPath = projects_1[_b];
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 8, , 9]);
                        existing = this.db.prepare("\n              SELECT id FROM projects WHERE path = ?\n            ").get(projectPath);
                        if (!existing) return [3 /*break*/, 5];
                        // Already registered - update last_activity
                        this.db.prepare("\n                UPDATE projects\n                SET last_activity = datetime('now')\n                WHERE path = ?\n              ").run(projectPath);
                        return [3 /*break*/, 7];
                    case 5:
                        // New project - auto-register!
                        logger_js_1.logger.info("\uD83C\uDD95 NEW PROJECT DISCOVERED: ".concat(projectPath));
                        if (!this.config.autoRegister) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.detector.detectProject(projectPath)];
                    case 6:
                        project = _c.sent();
                        newProjects++;
                        this.projectsDiscovered++;
                        logger_js_1.logger.info("\u2705 Registered: ".concat(project.name, " (").concat(project.type, ")"));
                        // Extract context if enabled (optional - implementation pending)
                        if (this.config.extractContext) {
                            try {
                                // TODO: Implement context extraction
                                logger_js_1.logger.info("   \uD83D\uDCC4 Context extraction: Pending implementation");
                            }
                            catch (err) {
                                logger_js_1.logger.warn("   \u26A0\uFE0F  Context extraction failed: ".concat(err.message));
                            }
                        }
                        _c.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        err_1 = _c.sent();
                        logger_js_1.logger.error("\u274C Error processing ".concat(projectPath, ":"), err_1.message);
                        return [3 /*break*/, 9];
                    case 9:
                        _b++;
                        return [3 /*break*/, 3];
                    case 10:
                        _i++;
                        return [3 /*break*/, 2];
                    case 11:
                        duration = Date.now() - startTime;
                        logger_js_1.logger.info("\u2705 Loop 1 Complete: Found ".concat(projectsFound, " projects (").concat(newProjects, " new) in ").concat(duration, "ms"));
                        // Log loop execution to database
                        this.logLoopExecution('PROJECT_DISCOVERY', {
                            projectsScanned: projectsFound,
                            projectsRegistered: newProjects,
                            durationMs: duration
                        });
                        return [3 /*break*/, 13];
                    case 12:
                        err_2 = _c.sent();
                        logger_js_1.logger.error("\u274C Loop 1 Error:", err_2);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Scan directory for projects
     */
    ProjectDiscoveryLoop.prototype.scanDirectory = function (basePath) {
        var projects = [];
        try {
            var entries = (0, fs_1.readdirSync)(basePath);
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                // Skip hidden directories and common non-projects
                if (entry.startsWith('.') || entry === 'node_modules') {
                    continue;
                }
                var fullPath = (0, path_1.join)(basePath, entry);
                try {
                    var stats = (0, fs_1.statSync)(fullPath);
                    if (stats.isDirectory()) {
                        // Check if it looks like a project
                        if (this.looksLikeProject(fullPath)) {
                            projects.push(fullPath);
                        }
                    }
                }
                catch (err) {
                    // Permission error or similar - skip
                    continue;
                }
            }
        }
        catch (err) {
            logger_js_1.logger.error("\u274C Error scanning ".concat(basePath, ":"), err.message);
        }
        return projects;
    };
    /**
     * Check if directory looks like a project
     */
    ProjectDiscoveryLoop.prototype.looksLikeProject = function (path) {
        // Project indicators
        var indicators = [
            'CLAUDE.md', // Claude Code project marker
            'package.json', // Node.js project
            '01_CODEBASES', // 6-layer architecture
            '02_SPECBASES', // 6-layer architecture
            '.git', // Git repository
            'Cargo.toml', // Rust project
            'pyproject.toml', // Python project
            'pom.xml', // Java project
            'go.mod' // Go project
        ];
        for (var _i = 0, indicators_1 = indicators; _i < indicators_1.length; _i++) {
            var indicator = indicators_1[_i];
            if ((0, fs_1.existsSync)((0, path_1.join)(path, indicator))) {
                return true;
            }
        }
        return false;
    };
    /**
     * Log loop execution to database
     */
    ProjectDiscoveryLoop.prototype.logLoopExecution = function (loopName, result) {
        try {
            // Create auto_proactive_logs table if not exists
            this.db.exec("\n        CREATE TABLE IF NOT EXISTS auto_proactive_logs (\n          id TEXT PRIMARY KEY,\n          loop_name TEXT NOT NULL,\n          action TEXT NOT NULL,\n          project_name TEXT,\n          result TEXT,\n          timestamp TEXT NOT NULL,\n          execution_time_ms INTEGER\n        )\n      ");
            this.db.prepare("\n        INSERT INTO auto_proactive_logs (\n          id, loop_name, action, result, timestamp, execution_time_ms\n        ) VALUES (?, ?, ?, ?, ?, ?)\n      ").run((0, crypto_1.randomUUID)(), loopName, 'SCAN_AND_REGISTER', JSON.stringify(result), new Date().toISOString(), result.durationMs);
        }
        catch (err) {
            logger_js_1.logger.warn("\u26A0\uFE0F  Could not log loop execution: ".concat(err.message));
        }
    };
    /**
     * Get loop statistics
     */
    ProjectDiscoveryLoop.prototype.getStats = function () {
        return {
            isRunning: this.isRunning,
            loopCount: this.loopCount,
            projectsDiscovered: this.projectsDiscovered,
            intervalSeconds: this.config.intervalSeconds
        };
    };
    return ProjectDiscoveryLoop;
}());
exports.ProjectDiscoveryLoop = ProjectDiscoveryLoop;
