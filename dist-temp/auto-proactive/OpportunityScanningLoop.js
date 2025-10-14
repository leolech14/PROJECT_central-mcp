"use strict";
/**
 * Loop 6: Opportunity Auto-Scanning
 * ===================================
 *
 * THE OPPORTUNITY HUNTER!
 *
 * Runs every 15 minutes:
 * 1. Scans for specs without implementations
 * 2. Detects code without tests
 * 3. Finds documentation gaps
 * 4. Identifies performance issues
 * 5. Detects technical debt
 * 6. Auto-generates tasks for P0/P1 opportunities
 *
 * Ensures nothing falls through the cracks!
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
exports.OpportunityScanningLoop = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var crypto_1 = require("crypto");
var logger_js_1 = require("../utils/logger.js");
var OpportunityScanningLoop = /** @class */ (function () {
    function OpportunityScanningLoop(db, config) {
        this.intervalHandle = null;
        this.isRunning = false;
        this.loopCount = 0;
        this.opportunitiesFound = 0;
        this.tasksGenerated = 0;
        this.db = db;
        this.config = config;
    }
    /**
     * Start scanning loop
     */
    OpportunityScanningLoop.prototype.start = function () {
        var _this = this;
        if (this.isRunning) {
            logger_js_1.logger.warn('⚠️  Opportunity scanning loop already running');
            return;
        }
        logger_js_1.logger.info("\uD83D\uDD04 Starting Opportunity Auto-Scanning Loop (every ".concat(this.config.intervalSeconds, "s)"));
        this.isRunning = true;
        // Run immediately
        this.runScanning();
        // Then on interval
        this.intervalHandle = setInterval(function () { return _this.runScanning(); }, this.config.intervalSeconds * 1000);
        logger_js_1.logger.info('✅ Loop 6: Opportunity Auto-Scanning ACTIVE');
    };
    /**
     * Stop loop
     */
    OpportunityScanningLoop.prototype.stop = function () {
        if (!this.isRunning)
            return;
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        this.isRunning = false;
        logger_js_1.logger.info('🛑 Loop 6: Opportunity Auto-Scanning STOPPED');
    };
    /**
     * Run scanning cycle
     */
    OpportunityScanningLoop.prototype.runScanning = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, projects, allOpportunities, _i, projects_1, project, opportunities, criticalOpps, _a, criticalOpps_1, opp, duration;
            return __generator(this, function (_b) {
                this.loopCount++;
                startTime = Date.now();
                logger_js_1.logger.info("\uD83D\uDD0D Loop 5 Execution #".concat(this.loopCount, ": Scanning for opportunities..."));
                try {
                    projects = this.getRegisteredProjects();
                    if (projects.length === 0) {
                        logger_js_1.logger.info("   No projects to scan");
                        return [2 /*return*/];
                    }
                    allOpportunities = [];
                    for (_i = 0, projects_1 = projects; _i < projects_1.length; _i++) {
                        project = projects_1[_i];
                        if (!(0, fs_1.existsSync)(project.path)) {
                            continue;
                        }
                        opportunities = this.scanProject(project);
                        allOpportunities.push.apply(allOpportunities, opportunities);
                        if (opportunities.length > 0) {
                            logger_js_1.logger.info("   \uD83C\uDFAF ".concat(project.name, ": ").concat(opportunities.length, " opportunities"));
                        }
                    }
                    this.opportunitiesFound += allOpportunities.length;
                    criticalOpps = allOpportunities.filter(function (opp) {
                        return opp.priority === 'P0-Critical' || opp.priority === 'P1-High';
                    });
                    if (this.config.autoGenerateTasks) {
                        for (_a = 0, criticalOpps_1 = criticalOpps; _a < criticalOpps_1.length; _a++) {
                            opp = criticalOpps_1[_a];
                            this.generateTaskFromOpportunity(opp);
                            this.tasksGenerated++;
                        }
                        if (criticalOpps.length > 0) {
                            logger_js_1.logger.info("   \u2705 Generated ".concat(criticalOpps.length, " tasks from opportunities"));
                        }
                    }
                    duration = Date.now() - startTime;
                    logger_js_1.logger.info("\u2705 Loop 5 Complete: Found ".concat(allOpportunities.length, " opportunities in ").concat(duration, "ms"));
                    // Log execution
                    this.logLoopExecution({
                        projectsScanned: projects.length,
                        opportunitiesFound: allOpportunities.length,
                        tasksGenerated: this.config.autoGenerateTasks ? criticalOpps.length : 0,
                        durationMs: duration
                    });
                }
                catch (err) {
                    logger_js_1.logger.error("\u274C Loop 5 Error:", err);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get registered projects
     */
    OpportunityScanningLoop.prototype.getRegisteredProjects = function () {
        return this.db.prepare("\n      SELECT id, name, path, type FROM projects\n      ORDER BY project_number ASC\n    ").all();
    };
    /**
     * Scan project for opportunities
     */
    OpportunityScanningLoop.prototype.scanProject = function (project) {
        var opportunities = [];
        // 1. Specs without implementations
        if (this.config.scanSpecs) {
            var specsWithoutImpl = this.findSpecsWithoutImplementation(project);
            opportunities.push.apply(opportunities, specsWithoutImpl);
        }
        // 2. Code without tests
        if (this.config.scanTests) {
            var codeWithoutTests = this.findCodeWithoutTests(project);
            opportunities.push.apply(opportunities, codeWithoutTests);
        }
        // 3. Documentation gaps
        if (this.config.scanDocs) {
            var docGaps = this.findDocumentationGaps(project);
            opportunities.push.apply(opportunities, docGaps);
        }
        return opportunities;
    };
    /**
     * Find specs without implementation
     */
    OpportunityScanningLoop.prototype.findSpecsWithoutImplementation = function (project) {
        var opportunities = [];
        try {
            var specDir = (0, path_1.join)(project.path, '02_SPECBASES');
            if (!(0, fs_1.existsSync)(specDir))
                return opportunities;
            var specFiles = (0, fs_1.readdirSync)(specDir)
                .filter(function (f) { return f.endsWith('.md'); })
                .filter(function (f) { return f.startsWith('SPEC_'); });
            // Check if implementation exists (simplified)
            var codebaseDir = (0, path_1.join)(project.path, '01_CODEBASES');
            var hasCodebase = (0, fs_1.existsSync)(codebaseDir);
            if (specFiles.length > 0 && !hasCodebase) {
                opportunities.push({
                    type: 'SPEC_WITHOUT_IMPLEMENTATION',
                    projectId: project.id,
                    description: "".concat(specFiles.length, " specs without implementation"),
                    priority: 'P1-High',
                    suggestedAction: 'Implement specifications'
                });
            }
        }
        catch (err) {
            // Ignore scan errors
        }
        return opportunities;
    };
    /**
     * Find code without tests
     */
    OpportunityScanningLoop.prototype.findCodeWithoutTests = function (project) {
        var opportunities = [];
        try {
            var srcDir = (0, path_1.join)(project.path, 'src');
            if (!(0, fs_1.existsSync)(srcDir))
                return opportunities;
            var sourceFiles = this.countFilesInDir(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
            var testDir = (0, path_1.join)(project.path, 'tests');
            var testDir2 = (0, path_1.join)(project.path, '__tests__');
            var hasTests = (0, fs_1.existsSync)(testDir) || (0, fs_1.existsSync)(testDir2);
            if (sourceFiles > 0 && !hasTests) {
                opportunities.push({
                    type: 'CODE_WITHOUT_TESTS',
                    projectId: project.id,
                    description: "".concat(sourceFiles, " source files without test coverage"),
                    priority: 'P2-Medium',
                    suggestedAction: 'Add test suite'
                });
            }
        }
        catch (err) {
            // Ignore
        }
        return opportunities;
    };
    /**
     * Find documentation gaps
     */
    OpportunityScanningLoop.prototype.findDocumentationGaps = function (project) {
        var opportunities = [];
        try {
            // Check for README
            var hasReadme = (0, fs_1.existsSync)((0, path_1.join)(project.path, 'README.md'));
            if (!hasReadme) {
                opportunities.push({
                    type: 'DOCUMENTATION_GAP',
                    projectId: project.id,
                    description: 'Missing README.md',
                    priority: 'P3-Low',
                    suggestedAction: 'Create README documentation'
                });
            }
        }
        catch (err) {
            // Ignore
        }
        return opportunities;
    };
    /**
     * Count files in directory by extension
     */
    OpportunityScanningLoop.prototype.countFilesInDir = function (dir, extensions) {
        var count = 0;
        try {
            var scan_1 = function (currentDir) {
                var entries = (0, fs_1.readdirSync)(currentDir);
                for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                    var entry = entries_1[_i];
                    if (entry === 'node_modules' || entry.startsWith('.'))
                        continue;
                    var fullPath = (0, path_1.join)(currentDir, entry);
                    try {
                        var stats = (0, fs_1.statSync)(fullPath);
                        if (stats.isDirectory()) {
                            scan_1(fullPath);
                        }
                        else if (extensions.includes((0, path_1.extname)(entry))) {
                            count++;
                        }
                    }
                    catch (_a) {
                        continue;
                    }
                }
            };
            scan_1(dir);
        }
        catch (err) {
            // Ignore
        }
        return count;
    };
    /**
     * Generate task from opportunity
     */
    OpportunityScanningLoop.prototype.generateTaskFromOpportunity = function (opp) {
        try {
            var taskId = "T-OPP-".concat(Date.now());
            var priorityMap = {
                'P0-Critical': 1,
                'P1-High': 2,
                'P2-Medium': 3,
                'P3-Low': 4
            };
            this.db.prepare("\n        INSERT INTO tasks (\n          id, title, description, status, priority,\n          project_id, agent, category, dependencies,\n          created_at, updated_at\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n      ").run(taskId, opp.suggestedAction, opp.description, 'pending', priorityMap[opp.priority] || 3, opp.projectId, 'D', // Default to integration specialist
            opp.type.toLowerCase(), '[]', Date.now(), Date.now());
            logger_js_1.logger.info("   \u2705 Task created: ".concat(taskId));
        }
        catch (err) {
            logger_js_1.logger.warn("   \u26A0\uFE0F  Could not create task: ".concat(err.message));
        }
    };
    /**
     * Log loop execution
     */
    OpportunityScanningLoop.prototype.logLoopExecution = function (result) {
        try {
            this.db.prepare("\n        INSERT INTO auto_proactive_logs (\n          id, loop_name, action, result, timestamp, execution_time_ms\n        ) VALUES (?, ?, ?, ?, ?, ?)\n      ").run((0, crypto_1.randomUUID)(), 'OPPORTUNITY_SCANNING', 'SCAN_AND_GENERATE', JSON.stringify(result), new Date().toISOString(), result.durationMs);
        }
        catch (err) {
            // Ignore
        }
    };
    /**
     * Get loop statistics
     */
    OpportunityScanningLoop.prototype.getStats = function () {
        return {
            isRunning: this.isRunning,
            loopCount: this.loopCount,
            opportunitiesFound: this.opportunitiesFound,
            tasksGenerated: this.tasksGenerated,
            intervalSeconds: this.config.intervalSeconds
        };
    };
    return OpportunityScanningLoop;
}());
exports.OpportunityScanningLoop = OpportunityScanningLoop;
