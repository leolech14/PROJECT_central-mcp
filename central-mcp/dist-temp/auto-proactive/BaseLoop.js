"use strict";
/**
 * Base Loop - Multi-Trigger Architecture Foundation
 * ==================================================
 *
 * All auto-proactive loops extend this base class.
 *
 * Supports FOUR types of triggers:
 * 1. TIME: Periodic polling (every N seconds)
 * 2. EVENT: React to system events instantly
 * 3. CASCADE: Trigger when other loops complete
 * 4. MANUAL: Explicit API-triggered execution
 *
 * This transforms loops from "dumb pollers" to "intelligent reactors"!
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
exports.BaseLoop = void 0;
var EventBus_js_1 = require("./EventBus.js");
var logger_js_1 = require("../utils/logger.js");
/**
 * Abstract base class for all auto-proactive loops
 */
var BaseLoop = /** @class */ (function () {
    function BaseLoop(db, loopNumber, loopName, triggerConfig) {
        // State
        this.isRunning = false;
        this.intervalHandle = null;
        // Statistics
        this.executionCount = 0;
        this.eventTriggeredCount = 0;
        this.manualTriggeredCount = 0;
        this.executionDurations = [];
        this.lastExecutionTime = 0;
        this.db = db;
        this.loopNumber = loopNumber;
        this.loopName = loopName;
        this.triggerConfig = triggerConfig;
        this.eventBus = EventBus_js_1.AutoProactiveEventBus.getInstance();
    }
    /**
     * Start the loop (all configured triggers)
     */
    BaseLoop.prototype.start = function () {
        var _a, _b, _c;
        if (this.isRunning) {
            logger_js_1.logger.warn("\u26A0\uFE0F  Loop ".concat(this.loopNumber, " already running"));
            return;
        }
        this.isRunning = true;
        logger_js_1.logger.info("\uD83D\uDD04 Starting Loop ".concat(this.loopNumber, ": ").concat(this.loopName));
        // Start time-based trigger
        if ((_a = this.triggerConfig.time) === null || _a === void 0 ? void 0 : _a.enabled) {
            this.startTimeTrigger();
        }
        // Register event-based triggers
        if ((_b = this.triggerConfig.events) === null || _b === void 0 ? void 0 : _b.enabled) {
            this.registerEventTriggers();
        }
        // Register cascade triggers
        if ((_c = this.triggerConfig.cascade) === null || _c === void 0 ? void 0 : _c.enabled) {
            this.registerCascadeTriggers();
        }
        logger_js_1.logger.info("\u2705 Loop ".concat(this.loopNumber, ": ").concat(this.loopName, " ACTIVE"));
        this.logTriggerConfiguration();
    };
    /**
     * Stop the loop (all triggers)
     */
    BaseLoop.prototype.stop = function () {
        if (!this.isRunning)
            return;
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        this.isRunning = false;
        logger_js_1.logger.info("\uD83D\uDED1 Loop ".concat(this.loopNumber, ": ").concat(this.loopName, " STOPPED"));
    };
    /**
     * Start time-based polling trigger
     */
    BaseLoop.prototype.startTimeTrigger = function () {
        var _this = this;
        var interval = this.triggerConfig.time.intervalSeconds;
        logger_js_1.logger.debug("   \u23F0 Time trigger: every ".concat(interval, "s"));
        // Run immediately
        this.executeWithTracking({
            trigger: 'time',
            timestamp: Date.now()
        });
        // Then run on interval
        this.intervalHandle = setInterval(function () {
            _this.executeWithTracking({
                trigger: 'time',
                timestamp: Date.now()
            });
        }, interval * 1000);
    };
    /**
     * Register event-based triggers
     */
    BaseLoop.prototype.registerEventTriggers = function () {
        var _this = this;
        var triggers = this.triggerConfig.events.triggers;
        var _loop_1 = function (event_1) {
            this_1.eventBus.onLoopEvent(event_1, function (payload) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.eventTriggeredCount++;
                            logger_js_1.logger.info("\u26A1 Loop ".concat(this.loopNumber, " triggered by event: ").concat(event_1));
                            return [4 /*yield*/, this.executeWithTracking({
                                    trigger: 'event',
                                    event: event_1,
                                    payload: payload.data,
                                    timestamp: Date.now()
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }, {
                loopName: "Loop ".concat(this_1.loopNumber),
                priority: this_1.triggerConfig.events.priority === 'critical' ? 1 : 2
            });
            logger_js_1.logger.debug("   \uD83D\uDCE1 Event trigger: ".concat(event_1));
        };
        var this_1 = this;
        for (var _i = 0, triggers_1 = triggers; _i < triggers_1.length; _i++) {
            var event_1 = triggers_1[_i];
            _loop_1(event_1);
        }
    };
    /**
     * Register cascade triggers (triggered by other loops)
     */
    BaseLoop.prototype.registerCascadeTriggers = function () {
        var _this = this;
        var afterLoops = this.triggerConfig.cascade.afterLoops;
        var _loop_2 = function (loopNum) {
            // Listen for loop completion events
            var event_2 = "loop:".concat(loopNum, ":completed");
            this_2.eventBus.onLoopEvent(event_2, function (payload) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger_js_1.logger.info("\uD83D\uDD17 Loop ".concat(this.loopNumber, " cascading from Loop ").concat(loopNum));
                            return [4 /*yield*/, this.executeWithTracking({
                                    trigger: 'cascade',
                                    payload: payload.data,
                                    timestamp: Date.now()
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }, { loopName: "Loop ".concat(this_2.loopNumber) });
            logger_js_1.logger.debug("   \uD83D\uDD17 Cascade trigger: after Loop ".concat(loopNum));
        };
        var this_2 = this;
        for (var _i = 0, afterLoops_1 = afterLoops; _i < afterLoops_1.length; _i++) {
            var loopNum = afterLoops_1[_i];
            _loop_2(loopNum);
        }
    };
    /**
     * Manual trigger support (via API)
     */
    BaseLoop.prototype.triggerManually = function (reason, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = this.triggerConfig.manual) === null || _a === void 0 ? void 0 : _a.enabled)) {
                            throw new Error("Manual triggering not enabled for Loop ".concat(this.loopNumber));
                        }
                        this.manualTriggeredCount++;
                        logger_js_1.logger.info("\uD83D\uDD90\uFE0F  Loop ".concat(this.loopNumber, " manually triggered: ").concat(reason));
                        return [4 /*yield*/, this.executeWithTracking({
                                trigger: 'manual',
                                reason: reason,
                                payload: data,
                                timestamp: Date.now()
                            })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute with performance tracking
     */
    BaseLoop.prototype.executeWithTracking = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, duration, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        this.executionCount++;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Call subclass implementation
                        return [4 /*yield*/, this.execute(context)];
                    case 2:
                        // Call subclass implementation
                        _a.sent();
                        duration = Date.now() - startTime;
                        this.lastExecutionTime = startTime;
                        // Track performance
                        this.executionDurations.push(duration);
                        if (this.executionDurations.length > 100) {
                            this.executionDurations.shift();
                        }
                        if (duration > 5000) {
                            logger_js_1.logger.warn("\u26A0\uFE0F  Loop ".concat(this.loopNumber, " took ").concat(duration, "ms (slow!)"));
                        }
                        // Emit completion event for cascades
                        this.eventBus.emitLoopEvent("loop:".concat(this.loopNumber, ":completed"), { loopNumber: this.loopNumber, duration: duration }, { source: "Loop ".concat(this.loopNumber) });
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        logger_js_1.logger.error("\u274C Loop ".concat(this.loopNumber, " error:"), err_1);
                        // Emit error event
                        this.eventBus.emitLoopEvent(EventBus_js_1.LoopEvent.SYSTEM_ERROR, {
                            loop: this.loopNumber,
                            error: err_1.message,
                            stack: err_1.stack
                        }, { priority: 'high', source: "Loop ".concat(this.loopNumber) });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Log trigger configuration
     */
    BaseLoop.prototype.logTriggerConfiguration = function () {
        var _a, _b, _c, _d;
        var triggers = [];
        if ((_a = this.triggerConfig.time) === null || _a === void 0 ? void 0 : _a.enabled) {
            triggers.push("\u23F0 Time (".concat(this.triggerConfig.time.intervalSeconds, "s)"));
        }
        if ((_b = this.triggerConfig.events) === null || _b === void 0 ? void 0 : _b.enabled) {
            triggers.push("\uD83D\uDCE1 Events (".concat(this.triggerConfig.events.triggers.length, ")"));
        }
        if ((_c = this.triggerConfig.cascade) === null || _c === void 0 ? void 0 : _c.enabled) {
            triggers.push("\uD83D\uDD17 Cascade (".concat(this.triggerConfig.cascade.afterLoops.length, ")"));
        }
        if ((_d = this.triggerConfig.manual) === null || _d === void 0 ? void 0 : _d.enabled) {
            triggers.push("\uD83D\uDD90\uFE0F  Manual");
        }
        logger_js_1.logger.info("   Triggers: ".concat(triggers.join(' | ')));
    };
    /**
     * Get loop statistics
     */
    BaseLoop.prototype.getStats = function () {
        var avgDuration = this.executionDurations.length > 0
            ? this.executionDurations.reduce(function (a, b) { return a + b; }, 0) / this.executionDurations.length
            : 0;
        return {
            isRunning: this.isRunning,
            loopNumber: this.loopNumber,
            loopName: this.loopName,
            executionCount: this.executionCount,
            eventTriggeredCount: this.eventTriggeredCount,
            manualTriggeredCount: this.manualTriggeredCount,
            averageExecutionTime: Math.round(avgDuration),
            lastExecutionTime: this.lastExecutionTime,
            lastExecutionDuration: this.executionDurations[this.executionDurations.length - 1] || 0,
            triggerConfig: this.triggerConfig
        };
    };
    return BaseLoop;
}());
exports.BaseLoop = BaseLoop;
