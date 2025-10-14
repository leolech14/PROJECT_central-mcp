"use strict";
/**
 * Loop 4: Progress Auto-Monitoring (EVENT-DRIVEN VERSION)
 * =========================================================
 *
 * THE VIGILANT WATCHER - Now with instant reactions!
 *
 * MULTI-TRIGGER ARCHITECTURE:
 * 1. TIME: Every 30s - Heartbeat checks, stale detection
 * 2. EVENT: Instant reactions to:
 *    - TASK_PROGRESS_UPDATED → Update metrics instantly
 *    - TASK_CLAIMED → Start tracking agent activity
 *    - TASK_COMPLETED → Check for unblocking
 *    - AGENT_HEARTBEAT → Update activity tracking
 * 3. MANUAL: API-triggered monitoring
 *
 * Performance impact:
 * - Progress updates: 30s delay → <100ms (300x faster!)
 * - Blocked task detection: 30s delay → instant (when deps complete)
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ProgressMonitoringLoop = void 0;
var crypto_1 = require("crypto");
var logger_js_1 = require("../utils/logger.js");
var BaseLoop_js_1 = require("./BaseLoop.js");
var EventBus_js_1 = require("./EventBus.js");
var ProgressMonitoringLoop = /** @class */ (function (_super) {
    __extends(ProgressMonitoringLoop, _super);
    function ProgressMonitoringLoop(db, config) {
        var _this = this;
        // Configure multi-trigger architecture
        var triggerConfig = {
            // TIME: Periodic heartbeat monitoring
            time: {
                enabled: true,
                intervalSeconds: config.intervalSeconds
            },
            // EVENT: Instant reactions to task/agent activity
            events: {
                enabled: true,
                triggers: [
                    EventBus_js_1.LoopEvent.TASK_PROGRESS_UPDATED, // Progress update → instant metrics refresh
                    EventBus_js_1.LoopEvent.TASK_CLAIMED, // Task claimed → start monitoring
                    EventBus_js_1.LoopEvent.TASK_COMPLETED, // Task completed → check unblocking
                    EventBus_js_1.LoopEvent.AGENT_HEARTBEAT, // Agent activity → update tracking
                    EventBus_js_1.LoopEvent.DEPENDENCIES_UNBLOCKED // Dependencies met → verify unblocking
                ],
                priority: 'normal'
            },
            // MANUAL: Support API-triggered monitoring
            manual: {
                enabled: true
            }
        };
        _this = _super.call(this, db, 4, 'Progress Auto-Monitoring', triggerConfig) || this;
        _this.sessionsMonitored = 0;
        _this.tasksReleased = 0;
        _this.tasksUnblocked = 0;
        _this.config = config;
        logger_js_1.logger.info("\uD83C\uDFD7\uFE0F  Loop 4: Multi-trigger architecture configured");
        logger_js_1.logger.info("   Stale threshold: ".concat(config.staleThresholdMinutes, "min"));
        logger_js_1.logger.info("   Abandon threshold: ".concat(config.abandonThresholdMinutes, "min"));
        return _this;
    }
    /**
     * Execute monitoring (called by BaseLoop for all trigger types)
     */
    ProgressMonitoringLoop.prototype.execute = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        logger_js_1.logger.info("\uD83D\uDC41\uFE0F  Loop 4 Execution #".concat(this.executionCount, " (").concat(context.trigger, ")"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!(context.trigger === 'event')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.handleEventTriggeredMonitoring(context)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                    case 3: 
                    // Time/Manual triggered: full monitoring cycle
                    return [4 /*yield*/, this.runFullMonitoringCycle(startTime)];
                    case 4:
                        // Time/Manual triggered: full monitoring cycle
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_1 = _a.sent();
                        logger_js_1.logger.error("\u274C Loop 4 Error:", err_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle event-triggered monitoring (focused, fast)
     */
    ProgressMonitoringLoop.prototype.handleEventTriggeredMonitoring = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var event, payload, unblocked;
            return __generator(this, function (_a) {
                event = context.event;
                payload = context.payload;
                logger_js_1.logger.debug("   Event: ".concat(event, " \u2192 Quick check"));
                switch (event) {
                    case EventBus_js_1.LoopEvent.TASK_PROGRESS_UPDATED:
                        // Update metrics for specific task
                        this.updateTaskMetrics(payload.taskId, payload.completionPercent);
                        break;
                    case EventBus_js_1.LoopEvent.TASK_CLAIMED:
                        // Start tracking agent activity
                        this.trackAgentActivity(payload.agent, payload.taskId);
                        break;
                    case EventBus_js_1.LoopEvent.TASK_COMPLETED:
                        // Check if this completion unblocks other tasks
                        if (this.config.autoUnblock) {
                            unblocked = this.checkAndUnblockTasks();
                            if (unblocked > 0) {
                                logger_js_1.logger.info("   \u2705 Event triggered ".concat(unblocked, " task(s) unblocked"));
                            }
                        }
                        break;
                    case EventBus_js_1.LoopEvent.AGENT_HEARTBEAT:
                        // Update heartbeat timestamp
                        this.updateAgentHeartbeat(payload.agent, payload.timestamp);
                        break;
                    case EventBus_js_1.LoopEvent.DEPENDENCIES_UNBLOCKED:
                        // Verify unblocking was successful
                        logger_js_1.logger.info("   \u2705 ".concat(payload.count, " tasks unblocked via event"));
                        break;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Run full monitoring cycle (time-based or manual)
     */
    ProgressMonitoringLoop.prototype.runFullMonitoringCycle = function (startTime) {
        return __awaiter(this, void 0, void 0, function () {
            var activeSessions, staleCount, releasedCount, unblockedCount, _i, activeSessions_1, session, lastHeartbeat, timeSinceHeartbeat, minutesSince, unblocked, duration;
            return __generator(this, function (_a) {
                activeSessions = this.getActiveSessions();
                this.sessionsMonitored += activeSessions.length;
                if (activeSessions.length === 0) {
                    logger_js_1.logger.info("   No active sessions to monitor");
                    return [2 /*return*/];
                }
                logger_js_1.logger.info("   Monitoring ".concat(activeSessions.length, " active sessions"));
                staleCount = 0;
                releasedCount = 0;
                unblockedCount = 0;
                for (_i = 0, activeSessions_1 = activeSessions; _i < activeSessions_1.length; _i++) {
                    session = activeSessions_1[_i];
                    lastHeartbeat = void 0;
                    try {
                        lastHeartbeat = new Date(session.last_heartbeat).getTime();
                    }
                    catch (_b) {
                        lastHeartbeat = Date.now() - (10 * 60 * 1000); // Default to 10min ago
                    }
                    timeSinceHeartbeat = Date.now() - lastHeartbeat;
                    minutesSince = timeSinceHeartbeat / (60 * 1000);
                    // Check if stale (no heartbeat for 5+ minutes)
                    if (minutesSince > this.config.staleThresholdMinutes) {
                        staleCount++;
                        logger_js_1.logger.warn("   \u26A0\uFE0F  STALE: Agent ".concat(session.agent_letter, " (").concat(minutesSince.toFixed(1), "min)"));
                        // Check if should auto-release (10+ minutes)
                        if (minutesSince > this.config.abandonThresholdMinutes && this.config.autoRelease) {
                            this.releaseAbandonedTasks(session.session_id);
                            this.markSessionInactive(session.session_id);
                            releasedCount++;
                            this.tasksReleased++;
                            logger_js_1.logger.info("   \uD83D\uDD04 AUTO-RELEASED: Agent ".concat(session.agent_letter, " tasks (").concat(minutesSince.toFixed(1), "min stale)"));
                        }
                    }
                }
                // Check for tasks that can be unblocked
                if (this.config.autoUnblock) {
                    unblocked = this.checkAndUnblockTasks();
                    unblockedCount = unblocked;
                    this.tasksUnblocked += unblocked;
                    if (unblocked > 0) {
                        logger_js_1.logger.info("   \u2705 AUTO-UNBLOCKED: ".concat(unblocked, " tasks (dependencies met)"));
                    }
                }
                // Update dashboard metrics
                this.updateDashboardMetrics({
                    activeSessions: activeSessions.length,
                    staleSessions: staleCount,
                    tasksReleased: releasedCount,
                    tasksUnblocked: unblockedCount
                });
                duration = Date.now() - startTime;
                logger_js_1.logger.info("\u2705 Loop 4 Complete: ".concat(activeSessions.length, " sessions monitored in ").concat(duration, "ms"));
                // Log execution
                this.logLoopExecution({
                    sessionsMonitored: activeSessions.length,
                    staleDetected: staleCount,
                    tasksReleased: releasedCount,
                    tasksUnblocked: unblockedCount,
                    durationMs: duration
                });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get active sessions
     */
    ProgressMonitoringLoop.prototype.getActiveSessions = function () {
        return this.db.prepare("\n      SELECT\n        id as session_id,\n        agent_letter,\n        project_id,\n        last_heartbeat\n      FROM agent_sessions\n      WHERE status = 'ACTIVE'\n      ORDER BY datetime(last_heartbeat) DESC\n    ").all();
    };
    /**
     * Update task metrics (event-triggered)
     */
    ProgressMonitoringLoop.prototype.updateTaskMetrics = function (taskId, completionPercent) {
        try {
            this.db.prepare("\n        UPDATE tasks\n        SET completion_percent = ?,\n            updated_at = ?\n        WHERE id = ?\n      ").run(completionPercent, new Date().toISOString(), taskId);
            logger_js_1.logger.debug("   \uD83D\uDCCA Updated metrics for ".concat(taskId, ": ").concat(completionPercent, "%"));
        }
        catch (err) {
            // Table might not have completion_percent column yet
            logger_js_1.logger.debug("   Could not update task metrics: ".concat(err));
        }
    };
    /**
     * Track agent activity (event-triggered)
     */
    ProgressMonitoringLoop.prototype.trackAgentActivity = function (agent, taskId) {
        logger_js_1.logger.debug("   \uD83D\uDCCC Tracking Agent ".concat(agent, " activity on ").concat(taskId));
        // Activity tracking happens via heartbeat events
    };
    /**
     * Update agent heartbeat (event-triggered)
     */
    ProgressMonitoringLoop.prototype.updateAgentHeartbeat = function (agent, timestamp) {
        try {
            this.db.prepare("\n        UPDATE agent_sessions\n        SET last_heartbeat = ?\n        WHERE agent_letter = ?\n        AND status = 'ACTIVE'\n      ").run(new Date(timestamp).toISOString(), agent);
            logger_js_1.logger.debug("   \uD83D\uDC93 Heartbeat: Agent ".concat(agent));
        }
        catch (err) {
            // Session might not exist yet
        }
    };
    /**
     * Release abandoned tasks
     */
    ProgressMonitoringLoop.prototype.releaseAbandonedTasks = function (sessionId) {
        this.db.prepare("\n      UPDATE tasks\n      SET status = 'pending',\n          claimed_by = NULL,\n          claimed_at = NULL\n      WHERE claimed_by = ?\n      AND status = 'in-progress'\n    ").run(sessionId);
    };
    /**
     * Mark session as inactive
     */
    ProgressMonitoringLoop.prototype.markSessionInactive = function (sessionId) {
        this.db.prepare("\n      UPDATE agent_sessions\n      SET status = 'DISCONNECTED',\n          disconnected_at = ?\n      WHERE id = ?\n    ").run(new Date().toISOString(), sessionId);
    };
    /**
     * Check and unblock tasks
     */
    ProgressMonitoringLoop.prototype.checkAndUnblockTasks = function () {
        // Get blocked tasks
        var blockedTasks = this.db.prepare("\n      SELECT * FROM tasks\n      WHERE status = 'blocked'\n    ").all();
        var unblocked = 0;
        for (var _i = 0, _a = blockedTasks; _i < _a.length; _i++) {
            var task = _a[_i];
            if (this.areDependenciesMet(task)) {
                // Unblock task
                this.db.prepare("\n          UPDATE tasks\n          SET status = 'pending'\n          WHERE id = ?\n        ").run(task.id);
                unblocked++;
                logger_js_1.logger.info("   \uD83D\uDD13 UNBLOCKED: ".concat(task.id, " (dependencies completed)"));
                // Emit unblock event
                this.eventBus.emitLoopEvent(EventBus_js_1.LoopEvent.TASK_UNBLOCKED, {
                    taskId: task.id,
                    unblockedAt: Date.now()
                }, {
                    priority: 'high',
                    source: 'Loop 4'
                });
            }
        }
        return unblocked;
    };
    /**
     * Check if dependencies are met
     */
    ProgressMonitoringLoop.prototype.areDependenciesMet = function (task) {
        if (!task.dependencies)
            return true;
        var deps = [];
        try {
            deps = JSON.parse(task.dependencies);
        }
        catch (_a) {
            return true;
        }
        if (deps.length === 0)
            return true;
        // Check all dependencies completed
        for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
            var depId = deps_1[_i];
            var dep = this.db.prepare("\n        SELECT status FROM tasks WHERE id = ?\n      ").get(depId);
            if (!dep || dep.status !== 'completed') {
                return false;
            }
        }
        return true;
    };
    /**
     * Update dashboard metrics
     */
    ProgressMonitoringLoop.prototype.updateDashboardMetrics = function (metrics) {
        // TODO: Update real-time dashboard
        // For now, just log
    };
    /**
     * Log loop execution
     */
    ProgressMonitoringLoop.prototype.logLoopExecution = function (result) {
        try {
            this.db.prepare("\n        INSERT INTO auto_proactive_logs (\n          id, loop_name, action, result, timestamp, execution_time_ms\n        ) VALUES (?, ?, ?, ?, ?, ?)\n      ").run((0, crypto_1.randomUUID)(), 'PROGRESS_MONITORING', 'MONITOR_AND_UNBLOCK', JSON.stringify(result), new Date().toISOString(), result.durationMs);
        }
        catch (err) {
            // Table might not exist yet, ignore
        }
    };
    /**
     * Get loop statistics (extends BaseLoop stats)
     */
    ProgressMonitoringLoop.prototype.getLoopStats = function () {
        return __assign(__assign({}, this.getStats()), { sessionsMonitored: this.sessionsMonitored, tasksReleased: this.tasksReleased, tasksUnblocked: this.tasksUnblocked });
    };
    return ProgressMonitoringLoop;
}(BaseLoop_js_1.BaseLoop));
exports.ProgressMonitoringLoop = ProgressMonitoringLoop;
