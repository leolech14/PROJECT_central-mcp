"use strict";
/**
 * Auto-Proactive Engine - THE LIVING SYSTEM
 * ==========================================
 *
 * Manages all 9 auto-proactive loops that make Central-MCP ALIVE!
 *
 * The system that never sits still.
 * The system with an agenda.
 * The machine that builds itself.
 *
 * Natural Order (Inside-Out Building):
 * Loop 0: System Status (foundation - health checks)
 * Loop 1: Agent Auto-Discovery (awareness - who/what/where)
 * Loop 2: Project Auto-Discovery (projects - what exists)
 * Loop 3: Context Learning (RESERVED - future)
 * Loop 4: Progress Auto-Monitoring (monitoring - real-time tracking)
 * Loop 5: Status Auto-Analysis (status - health analysis)
 * Loop 6: Opportunity Auto-Scanning (opportunities - what's needed)
 * Loop 7: Spec Auto-Generation (specs - what to build)
 * Loop 8: Task Auto-Assignment (execution - who does what)
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
exports.AutoProactiveEngine = void 0;
var SystemStatusLoop_js_1 = require("./SystemStatusLoop.js");
var AgentAutoDiscoveryLoop_js_1 = require("./AgentAutoDiscoveryLoop.js");
var ProjectDiscoveryLoop_js_1 = require("./ProjectDiscoveryLoop.js");
var ProgressMonitoringLoop_js_1 = require("./ProgressMonitoringLoop.js");
var StatusAnalysisLoop_js_1 = require("./StatusAnalysisLoop.js");
var OpportunityScanningLoop_js_1 = require("./OpportunityScanningLoop.js");
var SpecGenerationLoop_js_1 = require("./SpecGenerationLoop.js");
var TaskAssignmentLoop_js_1 = require("./TaskAssignmentLoop.js");
var logger_js_1 = require("../utils/logger.js");
var AutoProactiveEngine = /** @class */ (function () {
    function AutoProactiveEngine(db, config) {
        this.loops = new Map();
        this.startTime = 0;
        this.db = db;
        this.config = config;
        this.systems = config.systems || {}; // Store systems for loops to access
        if (config.systems) {
            logger_js_1.logger.info('🎯 AutoProactiveEngine initialized with 10 revolutionary systems');
        }
    }
    /**
     * Start all enabled loops in natural dependency order
     */
    AutoProactiveEngine.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var loop0, loop1, loop2, loop4, loop5, GitPushMonitor, loop9, RunPodMonitorLoop, loop10, loop6, loop7, loop8, maxLoops;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_js_1.logger.info('');
                        logger_js_1.logger.info('⚡ ════════════════════════════════════════════');
                        logger_js_1.logger.info('   AUTO-PROACTIVE ENGINE STARTING');
                        logger_js_1.logger.info('   The Living System Awakening...');
                        logger_js_1.logger.info('════════════════════════════════════════════');
                        logger_js_1.logger.info('');
                        this.startTime = Date.now();
                        // ═══════════════════════════════════════════════════
                        // LAYER 0: FOUNDATION & SYSTEM HEALTH
                        // ═══════════════════════════════════════════════════
                        // Loop 0: System Status (MUST RUN FIRST!)
                        if (this.config.enableLoop0) {
                            loop0 = new SystemStatusLoop_js_1.SystemStatusLoop(this.db, {
                                intervalSeconds: this.config.loop0Interval,
                                dbPath: this.config.dbPath,
                                criticalPaths: this.config.criticalPaths,
                                memoryThresholdMB: 512,
                                autoRecover: true
                            }, this.systems);
                            loop0.start();
                            this.loops.set('loop0', loop0);
                            logger_js_1.logger.info('✅ Loop 0: System Status ACTIVE (Foundation)');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop0Interval, "s"));
                            logger_js_1.logger.info('');
                        }
                        // Loop 1: Agent Auto-Discovery (WHO/WHAT/WHERE awareness)
                        if (this.config.enableLoop1) {
                            loop1 = new AgentAutoDiscoveryLoop_js_1.AgentAutoDiscoveryLoop(this.db, {
                                intervalSeconds: this.config.loop1Interval,
                                autoRegister: true,
                                trackHeartbeats: true,
                                sessionTimeoutMinutes: 10
                            });
                            loop1.start();
                            this.loops.set('loop1', loop1);
                            logger_js_1.logger.info('✅ Loop 1: Agent Auto-Discovery ACTIVE (Awareness)');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop1Interval, "s"));
                            logger_js_1.logger.info('');
                        }
                        // ═══════════════════════════════════════════════════
                        // LAYER 1: OBSERVATION & TRACKING
                        // ═══════════════════════════════════════════════════
                        // Loop 2: Project Auto-Discovery
                        if (this.config.enableLoop2) {
                            loop2 = new ProjectDiscoveryLoop_js_1.ProjectDiscoveryLoop(this.db, {
                                scanPaths: this.config.projectScanPaths,
                                intervalSeconds: this.config.loop2Interval,
                                autoRegister: true,
                                extractContext: true
                            });
                            loop2.start();
                            this.loops.set('loop2', loop2);
                            logger_js_1.logger.info('✅ Loop 2: Project Auto-Discovery ACTIVE');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop2Interval, "s"));
                            logger_js_1.logger.info("   Scanning: ".concat(this.config.projectScanPaths.join(', ')));
                            logger_js_1.logger.info('');
                        }
                        // Loop 3: Context Learning (RESERVED for future implementation)
                        logger_js_1.logger.info('⏸️  Loop 3: Context Learning (RESERVED)');
                        logger_js_1.logger.info('');
                        // Loop 4: Progress Auto-Monitoring
                        if (this.config.enableLoop4) {
                            loop4 = new ProgressMonitoringLoop_js_1.ProgressMonitoringLoop(this.db, {
                                intervalSeconds: this.config.loop4Interval,
                                staleThresholdMinutes: 5,
                                abandonThresholdMinutes: 10,
                                autoRelease: true,
                                autoUnblock: true
                            });
                            loop4.start();
                            this.loops.set('loop4', loop4);
                            logger_js_1.logger.info('✅ Loop 4: Progress Auto-Monitoring ACTIVE');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop4Interval, "s"));
                            logger_js_1.logger.info('');
                        }
                        // Loop 5: Status Auto-Analysis
                        if (this.config.enableLoop5) {
                            loop5 = new StatusAnalysisLoop_js_1.StatusAnalysisLoop(this.db, {
                                intervalSeconds: this.config.loop5Interval,
                                analyzeGit: true,
                                analyzeBuild: true,
                                detectBlockers: true,
                                autoAlert: true
                            });
                            loop5.start();
                            this.loops.set('loop5', loop5);
                            logger_js_1.logger.info('✅ Loop 5: Status Auto-Analysis ACTIVE');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop5Interval, "s"));
                            logger_js_1.logger.info('');
                        }
                        if (!this.config.enableLoop9) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./GitPushMonitor.js'); })];
                    case 1:
                        GitPushMonitor = (_a.sent()).GitPushMonitor;
                        loop9 = new GitPushMonitor(this.db, {
                            intervalSeconds: this.config.loop9Interval,
                            repoPath: process.cwd(),
                            autoVersion: true,
                            autoChangelog: true,
                            autoDeploy: false, // Manual deployment approval for now
                            deployBranches: ['main', 'develop'],
                            versionPrefix: 'v',
                            changelogPath: './CHANGELOG.md'
                        }, this.systems);
                        loop9.start();
                        this.loops.set('loop9', loop9);
                        logger_js_1.logger.info('✅ Loop 9: Git Push Monitor ACTIVE (Senior Engineer Workflows)');
                        logger_js_1.logger.info("   Interval: ".concat(this.config.loop9Interval, "s"));
                        logger_js_1.logger.info("   Features: Auto-versioning, Changelog, Deployment detection");
                        logger_js_1.logger.info('');
                        _a.label = 2;
                    case 2:
                        if (!this.config.enableLoop10) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./RunPodMonitorLoop.js'); })];
                    case 3:
                        RunPodMonitorLoop = (_a.sent()).RunPodMonitorLoop;
                        loop10 = new RunPodMonitorLoop(this.db, {
                            intervalSeconds: this.config.loop10Interval,
                            warningThreshold: 50, // $50/day warning
                            criticalThreshold: 100 // $100/day critical
                        });
                        loop10.start();
                        this.loops.set('loop10', loop10);
                        logger_js_1.logger.info('✅ Loop 10: RunPod Monitor ACTIVE (Infrastructure Cost Tracking)');
                        logger_js_1.logger.info("   Interval: ".concat(this.config.loop10Interval, "s"));
                        logger_js_1.logger.info("   Features: Cost tracking, Pod monitoring, Auto-alerts");
                        logger_js_1.logger.info('');
                        _a.label = 4;
                    case 4:
                        // ═══════════════════════════════════════════════════
                        // LAYER 2: DETECTION & PLANNING
                        // ═══════════════════════════════════════════════════
                        // Loop 6: Opportunity Auto-Scanning
                        if (this.config.enableLoop6) {
                            loop6 = new OpportunityScanningLoop_js_1.OpportunityScanningLoop(this.db, {
                                intervalSeconds: this.config.loop6Interval,
                                scanSpecs: true,
                                scanTests: true,
                                scanDocs: true,
                                autoGenerateTasks: true
                            });
                            loop6.start();
                            this.loops.set('loop6', loop6);
                            logger_js_1.logger.info('✅ Loop 6: Opportunity Auto-Scanning ACTIVE');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop6Interval, "s"));
                            logger_js_1.logger.info('');
                        }
                        // Loop 7: Spec Auto-Generation
                        if (this.config.enableLoop7) {
                            loop7 = new SpecGenerationLoop_js_1.SpecGenerationLoop(this.db, {
                                intervalSeconds: this.config.loop7Interval,
                                autoGenerate: false, // Detection mode until LLM integrated
                                createTasks: true,
                                llmProvider: 'anthropic',
                                llmModel: 'claude-sonnet-4-5'
                            }, this.systems);
                            loop7.start();
                            this.loops.set('loop7', loop7);
                            logger_js_1.logger.info('✅ Loop 7: Spec Auto-Generation ACTIVE');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop7Interval, "s"));
                            logger_js_1.logger.info("   Mode: DETECTION (LLM pending)");
                            logger_js_1.logger.info('');
                        }
                        // ═══════════════════════════════════════════════════
                        // LAYER 3: EXECUTION
                        // ═══════════════════════════════════════════════════
                        // Loop 8: Task Auto-Assignment
                        if (this.config.enableLoop8) {
                            loop8 = new TaskAssignmentLoop_js_1.TaskAssignmentLoop(this.db, {
                                intervalSeconds: this.config.loop8Interval,
                                autoAssign: true,
                                notifyAgents: true
                            }, this.systems);
                            loop8.start();
                            this.loops.set('loop8', loop8);
                            logger_js_1.logger.info('✅ Loop 8: Task Auto-Assignment ACTIVE');
                            logger_js_1.logger.info("   Interval: ".concat(this.config.loop8Interval, "s"));
                            logger_js_1.logger.info('');
                        }
                        logger_js_1.logger.info('════════════════════════════════════════════');
                        logger_js_1.logger.info('🧠 AUTO-PROACTIVE ENGINE: ONLINE');
                        maxLoops = (this.config.enableLoop9 ? 1 : 0) + (this.config.enableLoop10 ? 1 : 0) + 8;
                        logger_js_1.logger.info("   Active Loops: ".concat(this.loops.size, "/").concat(maxLoops, " (Loop 3 reserved)"));
                        logger_js_1.logger.info('   Natural Order: Foundation → Execution');
                        logger_js_1.logger.info('   The system is now ALIVE with purpose!');
                        if (this.loops.size === 9) {
                            logger_js_1.logger.info('   🎉 PERFECT 9/9 LOOPS ACTIVE!');
                        }
                        logger_js_1.logger.info('════════════════════════════════════════════');
                        logger_js_1.logger.info('');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop all loops
     */
    AutoProactiveEngine.prototype.stop = function () {
        logger_js_1.logger.info('🛑 Stopping Auto-Proactive Engine...');
        for (var _i = 0, _a = this.loops.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], name_1 = _b[0], loop = _b[1];
            if (loop.stop) {
                loop.stop();
                logger_js_1.logger.info("   Stopped: ".concat(name_1));
            }
        }
        this.loops.clear();
        logger_js_1.logger.info('✅ Auto-Proactive Engine stopped');
    };
    /**
     * Get engine status
     */
    AutoProactiveEngine.prototype.getStatus = function () {
        var uptime = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;
        var loopStats = [];
        for (var _i = 0, _a = this.loops.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], name_2 = _b[0], loop = _b[1];
            if (loop.getStats) {
                loopStats.push(__assign({ name: name_2 }, loop.getStats()));
            }
        }
        return {
            isRunning: this.loops.size > 0,
            uptimeSeconds: uptime,
            activeLoops: this.loops.size,
            loopStats: loopStats
        };
    };
    return AutoProactiveEngine;
}());
exports.AutoProactiveEngine = AutoProactiveEngine;
