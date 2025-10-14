"use strict";
/**
 * Loop 10: RunPod Monitor
 *
 * Monitors RunPod infrastructure every 60 seconds:
 * - Pod status and health
 * - GPU utilization metrics
 * - Cost tracking (hourly/daily/monthly)
 * - Credit balance alerts
 * - Automatic cost warnings
 *
 * CRITICAL: Prevents account termination by monitoring balance and costs
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
exports.RunPodMonitorLoop = void 0;
var BaseLoop_js_1 = require("./BaseLoop.js");
var runpodIntegration_js_1 = require("../tools/runpod/runpodIntegration.js");
var logger_js_1 = require("../utils/logger.js");
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var RunPodMonitorLoop = /** @class */ (function (_super) {
    __extends(RunPodMonitorLoop, _super);
    function RunPodMonitorLoop(db, config) {
        var _this = this;
        // Configure simple time-based trigger
        var triggerConfig = {
            time: {
                enabled: true,
                intervalSeconds: (config === null || config === void 0 ? void 0 : config.intervalSeconds) || 60
            },
            manual: {
                enabled: true
            }
        };
        _this = _super.call(this, db, 10, 'RunPod Monitor', triggerConfig) || this;
        _this.config = config || {
            intervalSeconds: 60,
            warningThreshold: 50,
            criticalThreshold: 100
        };
        logger_js_1.logger.info("\uD83C\uDFD7\uFE0F  Loop 10: RunPod Monitor configured");
        logger_js_1.logger.info("   Cost thresholds: Warning=$".concat(_this.config.warningThreshold, "/day, Critical=$").concat(_this.config.criticalThreshold, "/day"));
        return _this;
    }
    RunPodMonitorLoop.prototype.execute = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var status_1, summary, pods, idlePods, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        logger_js_1.logger.info('[Loop 10] 🖥️  Checking RunPod infrastructure...');
                        return [4 /*yield*/, (0, runpodIntegration_js_1.getRunPodStatus)()];
                    case 1:
                        status_1 = _d.sent();
                        if (status_1.success && status_1.summary) {
                            summary = status_1.summary, pods = status_1.pods;
                            logger_js_1.logger.info('[Loop 10] ✅ RunPod status retrieved:');
                            logger_js_1.logger.info("   \u2192 Total pods: ".concat((summary === null || summary === void 0 ? void 0 : summary.total_pods) || 0));
                            logger_js_1.logger.info("   \u2192 Running: ".concat((summary === null || summary === void 0 ? void 0 : summary.running_pods) || 0));
                            logger_js_1.logger.info("   \u2192 Idle: ".concat((summary === null || summary === void 0 ? void 0 : summary.idle_pods) || 0));
                            logger_js_1.logger.info("   \u2192 Total GPUs: ".concat((summary === null || summary === void 0 ? void 0 : summary.total_gpus) || 0));
                            logger_js_1.logger.info("   \u2192 Active agents: ".concat((summary === null || summary === void 0 ? void 0 : summary.active_agents) || 0));
                            logger_js_1.logger.info("   \u2192 Cost: $".concat(((_a = summary === null || summary === void 0 ? void 0 : summary.cost_per_hour) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || '0.00', "/hr"));
                            logger_js_1.logger.info("   \u2192 Daily: $".concat(((_b = summary === null || summary === void 0 ? void 0 : summary.cost_per_day) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || '0.00'));
                            logger_js_1.logger.info("   \u2192 Monthly: $".concat(((_c = summary === null || summary === void 0 ? void 0 : summary.cost_per_month) === null || _c === void 0 ? void 0 : _c.toFixed(2)) || '0.00'));
                            // Save cost snapshot
                            if (summary) {
                                this.saveCostSnapshot(summary);
                            }
                            // Cost alerts
                            if (summary && summary.cost_per_day >= this.config.criticalThreshold) {
                                logger_js_1.logger.error("[Loop 10] \uD83D\uDEA8 CRITICAL: Daily cost is $".concat(summary.cost_per_day.toFixed(2), " (threshold: $").concat(this.config.criticalThreshold, ")"));
                                logger_js_1.logger.error("[Loop 10]    Consider stopping unused pods immediately!");
                                this.triggerCostAlert('CRITICAL', summary.cost_per_day);
                            }
                            else if (summary && summary.cost_per_day >= this.config.warningThreshold) {
                                logger_js_1.logger.warn("[Loop 10] \u26A0\uFE0F  WARNING: Daily cost is $".concat(summary.cost_per_day.toFixed(2), " (threshold: $").concat(this.config.warningThreshold, ")"));
                                logger_js_1.logger.warn("[Loop 10]    Monitor costs closely");
                                this.triggerCostAlert('WARNING', summary.cost_per_day);
                            }
                            // Idle pod alerts
                            if (pods && Array.isArray(pods)) {
                                idlePods = pods.filter(function (p) { return p.status !== 'RUNNING'; });
                                if (idlePods.length > 0) {
                                    logger_js_1.logger.warn("[Loop 10] \uD83D\uDCA4 ".concat(idlePods.length, " idle pod(s) detected"));
                                    idlePods.forEach(function (pod) {
                                        logger_js_1.logger.warn("[Loop 10]    - ".concat(pod.name, " (").concat(pod.gpu, ") - ").concat(pod.status));
                                    });
                                }
                            }
                            // Agent session tracking
                            if (summary && summary.active_agents > 0) {
                                logger_js_1.logger.info("[Loop 10] \uD83E\uDD16 ".concat(summary.active_agents, " agent(s) active on RunPod"));
                            }
                            // TODO: Credit balance check (requires separate API call)
                            // const balance = await getRunPodBalance();
                            // if (balance < 10) {
                            //   logger.error('[Loop 10] 🚨 LOW CREDIT BALANCE: Add funds to prevent termination!');
                            // }
                        }
                        else {
                            logger_js_1.logger.error("[Loop 10] \u274C Failed to get RunPod status: ".concat(status_1.error));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _d.sent();
                        logger_js_1.logger.error('[Loop 10] ❌ RunPod monitor error:', error_1);
                        // If it's an API key error, log helpful message
                        if (error_1 instanceof Error && error_1.message.includes('RUNPOD_API_KEY')) {
                            logger_js_1.logger.error('[Loop 10] 💡 Add RUNPOD_API_KEY to Doppler:');
                            logger_js_1.logger.error('[Loop 10]    doppler secrets set RUNPOD_API_KEY "your-key" --project ai-tools --config dev');
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Save cost snapshot to database for historical tracking
     */
    RunPodMonitorLoop.prototype.saveCostSnapshot = function (summary) {
        try {
            var dbPath = (0, path_1.join)(process.cwd(), 'src', 'database', 'registry.db');
            var db = new better_sqlite3_1.default(dbPath);
            // Create table if not exists
            db.exec("\n        CREATE TABLE IF NOT EXISTS runpod_cost_snapshots (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n          total_pods INTEGER,\n          running_pods INTEGER,\n          idle_pods INTEGER,\n          total_gpus INTEGER,\n          active_agents INTEGER,\n          cost_per_hour REAL,\n          cost_per_day REAL,\n          cost_per_month REAL\n        );\n\n        CREATE INDEX IF NOT EXISTS idx_cost_snapshots_timestamp\n        ON runpod_cost_snapshots(timestamp DESC);\n      ");
            // Insert snapshot
            db.prepare("\n        INSERT INTO runpod_cost_snapshots\n        (total_pods, running_pods, idle_pods, total_gpus, active_agents,\n         cost_per_hour, cost_per_day, cost_per_month)\n        VALUES (?, ?, ?, ?, ?, ?, ?, ?)\n      ").run(summary.total_pods, summary.running_pods, summary.idle_pods, summary.total_gpus, summary.active_agents, summary.cost_per_hour, summary.cost_per_day, summary.cost_per_month);
            db.close();
        }
        catch (error) {
            logger_js_1.logger.error('[Loop 10] Failed to save cost snapshot:', error);
        }
    };
    /**
     * Trigger cost alert (future: send to Slack/Discord/Email)
     */
    RunPodMonitorLoop.prototype.triggerCostAlert = function (level, dailyCost) {
        try {
            var dbPath = (0, path_1.join)(process.cwd(), 'src', 'database', 'registry.db');
            var db = new better_sqlite3_1.default(dbPath);
            // Create alerts table
            db.exec("\n        CREATE TABLE IF NOT EXISTS runpod_cost_alerts (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n          alert_level TEXT NOT NULL,\n          daily_cost REAL NOT NULL,\n          message TEXT NOT NULL,\n          acknowledged BOOLEAN DEFAULT 0\n        );\n      ");
            // Insert alert
            var message = level === 'CRITICAL'
                ? "CRITICAL: Daily RunPod cost is $".concat(dailyCost.toFixed(2), "! Stop unused pods immediately!")
                : "WARNING: Daily RunPod cost is $".concat(dailyCost.toFixed(2), ". Monitor costs closely.");
            db.prepare("\n        INSERT INTO runpod_cost_alerts (alert_level, daily_cost, message)\n        VALUES (?, ?, ?)\n      ").run(level, dailyCost, message);
            db.close();
            // TODO: Send to external alerting system (Slack, Discord, Email)
            // await sendSlackAlert(level, message);
            // await sendEmailAlert(level, message);
        }
        catch (error) {
            logger_js_1.logger.error('[Loop 10] Failed to save cost alert:', error);
        }
    };
    /**
     * Get cost history for dashboard charts
     */
    RunPodMonitorLoop.getCostHistory = function (hours) {
        if (hours === void 0) { hours = 24; }
        try {
            var dbPath = (0, path_1.join)(process.cwd(), 'src', 'database', 'registry.db');
            var db = new better_sqlite3_1.default(dbPath);
            var snapshots = db.prepare("\n        SELECT *\n        FROM runpod_cost_snapshots\n        WHERE timestamp > datetime('now', '-".concat(hours, " hours')\n        ORDER BY timestamp ASC\n      ")).all();
            db.close();
            return snapshots;
        }
        catch (error) {
            logger_js_1.logger.error('[Loop 10] Failed to get cost history:', error);
            return [];
        }
    };
    /**
     * Get recent alerts
     */
    RunPodMonitorLoop.getRecentAlerts = function (limit) {
        if (limit === void 0) { limit = 10; }
        try {
            var dbPath = (0, path_1.join)(process.cwd(), 'src', 'database', 'registry.db');
            var db = new better_sqlite3_1.default(dbPath);
            var alerts = db.prepare("\n        SELECT *\n        FROM runpod_cost_alerts\n        WHERE acknowledged = 0\n        ORDER BY timestamp DESC\n        LIMIT ?\n      ").all(limit);
            db.close();
            return alerts;
        }
        catch (error) {
            logger_js_1.logger.error('[Loop 10] Failed to get recent alerts:', error);
            return [];
        }
    };
    return RunPodMonitorLoop;
}(BaseLoop_js_1.BaseLoop));
exports.RunPodMonitorLoop = RunPodMonitorLoop;
