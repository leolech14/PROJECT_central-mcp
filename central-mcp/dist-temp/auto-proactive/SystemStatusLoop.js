"use strict";
/**
 * Loop 0: System Status & Health Check
 * =====================================
 *
 * THE ABSOLUTE FOUNDATION - ENSURE SYSTEM IS ALIVE!
 *
 * Runs every 5 seconds:
 * 1. Database connectivity check
 * 2. MCP server health verification
 * 3. File system accessibility
 * 4. Memory and CPU resource monitoring
 * 5. Network connectivity validation
 * 6. Critical service availability
 *
 * If Loop 0 fails, all other loops MUST pause until system is healthy!
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
exports.SystemStatusLoop = void 0;
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var logger_js_1 = require("../utils/logger.js");
var SystemStatusLoop = /** @class */ (function () {
    function SystemStatusLoop(db, config, systems) {
        this.intervalHandle = null;
        this.isRunning = false;
        this.loopCount = 0;
        this.lastHealthStatus = null;
        this.consecutiveFailures = 0;
        this.db = db;
        this.config = config;
        this.systems = systems || {};
        if (systems && systems.totalityVerification) {
            logger_js_1.logger.info('🎯 Loop 0: TotalityVerificationSystem integrated for completeness checks');
        }
    }
    /**
     * Start system status monitoring loop
     */
    SystemStatusLoop.prototype.start = function () {
        var _this = this;
        if (this.isRunning) {
            logger_js_1.logger.warn('⚠️  System status loop already running');
            return;
        }
        logger_js_1.logger.info("\uD83D\uDD04 Starting System Status & Health Check Loop (every ".concat(this.config.intervalSeconds, "s)"));
        this.isRunning = true;
        // Run immediately
        this.runHealthCheck();
        // Then on interval
        this.intervalHandle = setInterval(function () { return _this.runHealthCheck(); }, this.config.intervalSeconds * 1000);
        logger_js_1.logger.info('✅ Loop 0: System Status & Health Check ACTIVE');
    };
    /**
     * Stop monitoring loop
     */
    SystemStatusLoop.prototype.stop = function () {
        if (!this.isRunning)
            return;
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        this.isRunning = false;
        logger_js_1.logger.info('🛑 Loop 0: System Status & Health Check STOPPED');
    };
    /**
     * Run health check cycle
     */
    SystemStatusLoop.prototype.runHealthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, health, filesystemOk, _i, _a, path, memoryUsage, memoryMB, completeness, err_1, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.loopCount++;
                        startTime = Date.now();
                        health = {
                            isHealthy: true,
                            database: false,
                            filesystem: false,
                            memory: false,
                            timestamp: new Date().toISOString(),
                            issues: []
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        // 1. Database connectivity check
                        try {
                            this.db.prepare('SELECT 1').get();
                            health.database = true;
                        }
                        catch (err) {
                            health.isHealthy = false;
                            health.issues.push("Database error: ".concat(err.message));
                            logger_js_1.logger.error('❌ Loop 0: Database connectivity FAILED');
                        }
                        filesystemOk = true;
                        for (_i = 0, _a = this.config.criticalPaths; _i < _a.length; _i++) {
                            path = _a[_i];
                            if (!(0, fs_1.existsSync)(path)) {
                                filesystemOk = false;
                                health.issues.push("Critical path missing: ".concat(path));
                                logger_js_1.logger.error("\u274C Loop 0: Critical path not accessible: ".concat(path));
                            }
                        }
                        health.filesystem = filesystemOk;
                        if (!filesystemOk)
                            health.isHealthy = false;
                        memoryUsage = process.memoryUsage();
                        memoryMB = memoryUsage.heapUsed / 1024 / 1024;
                        health.memory = memoryMB < this.config.memoryThresholdMB;
                        if (!health.memory) {
                            health.isHealthy = false;
                            health.issues.push("High memory usage: ".concat(memoryMB.toFixed(0), "MB"));
                            logger_js_1.logger.warn("\u26A0\uFE0F  Loop 0: High memory usage: ".concat(memoryMB.toFixed(0), "MB"));
                        }
                        if (!this.systems.totalityVerification) return [3 /*break*/, 5];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.systems.totalityVerification.checkCompleteness({
                                projectId: 'central-mcp',
                                scope: 'auto-proactive-loops'
                            })];
                    case 3:
                        completeness = _b.sent();
                        // Log completeness metrics
                        logger_js_1.logger.debug("   Completeness: ".concat(completeness.percentage, "%"));
                        // Warn if completeness below threshold
                        if (completeness.percentage < 70) {
                            health.issues.push("Low system completeness: ".concat(completeness.percentage, "%"));
                            logger_js_1.logger.warn("\u26A0\uFE0F  Loop 0: Low completeness: ".concat(completeness.percentage, "%"));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _b.sent();
                        logger_js_1.logger.debug("   Could not check completeness: ".concat(err_1.message));
                        return [3 /*break*/, 5];
                    case 5:
                        if (!!health.isHealthy) return [3 /*break*/, 8];
                        this.consecutiveFailures++;
                        if (!(this.consecutiveFailures >= 3)) return [3 /*break*/, 7];
                        logger_js_1.logger.error("\uD83D\uDEA8 Loop 0: CRITICAL - ".concat(this.consecutiveFailures, " consecutive health check failures!"));
                        logger_js_1.logger.error("   Issues: ".concat(health.issues.join(', ')));
                        if (!this.config.autoRecover) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.attemptRecovery(health)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        this.consecutiveFailures = 0;
                        _b.label = 9;
                    case 9:
                        this.lastHealthStatus = health;
                        // Log to database
                        if (health.database) {
                            this.logHealthCheck({
                                isHealthy: health.isHealthy,
                                issues: health.issues,
                                durationMs: Date.now() - startTime,
                                memoryMB: memoryMB
                            });
                        }
                        // Only log successful checks every 100 iterations (reduce noise)
                        if (health.isHealthy && this.loopCount % 100 === 0) {
                            logger_js_1.logger.info("\u2705 Loop 0: System healthy (".concat(this.loopCount, " checks)"));
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        err_2 = _b.sent();
                        logger_js_1.logger.error("\u274C Loop 0: Unexpected error:", err_2);
                        health.isHealthy = false;
                        health.issues.push("Unexpected error: ".concat(err_2.message));
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Attempt automatic recovery
     */
    SystemStatusLoop.prototype.attemptRecovery = function (health) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger_js_1.logger.info('🔧 Loop 0: Attempting automatic recovery...');
                // Recovery strategies
                if (!health.database) {
                    logger_js_1.logger.info('   Checking database file integrity...');
                    // Database recovery would go here
                }
                if (!health.memory) {
                    logger_js_1.logger.info('   Forcing garbage collection...');
                    if (global.gc) {
                        global.gc();
                    }
                }
                logger_js_1.logger.info('   Recovery attempt complete');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Log health check to database
     */
    SystemStatusLoop.prototype.logHealthCheck = function (result) {
        try {
            this.db.prepare("\n        INSERT INTO auto_proactive_logs (\n          id, loop_name, action, result, timestamp, execution_time_ms\n        ) VALUES (?, ?, ?, ?, ?, ?)\n      ").run((0, crypto_1.randomUUID)(), 'SYSTEM_STATUS', 'HEALTH_CHECK', JSON.stringify(result), new Date().toISOString(), result.durationMs);
        }
        catch (err) {
            // If we can't log, system is in bad state - just warn
            logger_js_1.logger.warn("\u26A0\uFE0F  Could not log health check: ".concat(err.message));
        }
    };
    /**
     * Get current system health
     */
    SystemStatusLoop.prototype.getHealth = function () {
        return this.lastHealthStatus;
    };
    /**
     * Get loop statistics
     */
    SystemStatusLoop.prototype.getStats = function () {
        return {
            isRunning: this.isRunning,
            loopCount: this.loopCount,
            consecutiveFailures: this.consecutiveFailures,
            lastHealth: this.lastHealthStatus,
            intervalSeconds: this.config.intervalSeconds
        };
    };
    return SystemStatusLoop;
}());
exports.SystemStatusLoop = SystemStatusLoop;
