"use strict";
/**
 * Loop 1: Agent Auto-Discovery
 * =============================
 *
 * THE IDENTITY LAYER - WHO IS AVAILABLE TO WORK?
 *
 * Runs on startup and every 60 seconds:
 * 1. Detects available AI agent models
 * 2. Maps agents to capability letters (A-F)
 * 3. Registers agent working directories
 * 4. Tracks active agent sessions
 * 5. Updates agent-project-location matrix
 * 6. Monitors agent heartbeats
 *
 * This enables all other loops to know WHO can do WHAT and WHERE!
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
exports.AgentAutoDiscoveryLoop = void 0;
var crypto_1 = require("crypto");
var logger_js_1 = require("../utils/logger.js");
// Agent capability mapping (from SPECBASE 0016)
var AGENT_CAPABILITIES = {
    'A': {
        letter: 'A',
        role: 'UI Velocity Specialist',
        models: ['glm-4.6', 'glm-4-flash'],
        specializations: ['ui', 'react', 'design-systems', 'rapid-prototyping']
    },
    'B': {
        letter: 'B',
        role: 'Design & Architecture',
        models: ['claude-sonnet-4-5'],
        specializations: ['architecture', 'design-patterns', 'system-design', 'documentation']
    },
    'C': {
        letter: 'C',
        role: 'Backend Specialist',
        models: ['glm-4.6', 'deepseek-coder'],
        specializations: ['backend', 'databases', 'apis', 'performance']
    },
    'D': {
        letter: 'D',
        role: 'Integration Specialist',
        models: ['claude-sonnet-4-5'],
        specializations: ['integration', 'coordination', 'testing', 'deployment']
    },
    'E': {
        letter: 'E',
        role: 'Operations & Supervisor',
        models: ['gemini-2.5-pro'],
        specializations: ['operations', 'monitoring', 'optimization', 'supervision']
    },
    'F': {
        letter: 'F',
        role: 'Strategic Planning',
        models: ['claude-opus-4'],
        specializations: ['strategy', 'product', 'planning', 'vision']
    }
};
var AgentAutoDiscoveryLoop = /** @class */ (function () {
    function AgentAutoDiscoveryLoop(db, config) {
        this.intervalHandle = null;
        this.isRunning = false;
        this.loopCount = 0;
        this.agentsDiscovered = 0;
        this.db = db;
        this.config = config;
    }
    /**
     * Start agent discovery loop
     */
    AgentAutoDiscoveryLoop.prototype.start = function () {
        var _this = this;
        if (this.isRunning) {
            logger_js_1.logger.warn('⚠️  Agent auto-discovery loop already running');
            return;
        }
        logger_js_1.logger.info("\uD83D\uDD04 Starting Agent Auto-Discovery Loop (every ".concat(this.config.intervalSeconds, "s)"));
        this.isRunning = true;
        // Run immediately
        this.runDiscovery();
        // Then on interval
        this.intervalHandle = setInterval(function () { return _this.runDiscovery(); }, this.config.intervalSeconds * 1000);
        logger_js_1.logger.info('✅ Loop 1: Agent Auto-Discovery ACTIVE');
    };
    /**
     * Stop discovery loop
     */
    AgentAutoDiscoveryLoop.prototype.stop = function () {
        if (!this.isRunning)
            return;
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        this.isRunning = false;
        logger_js_1.logger.info('🛑 Loop 1: Agent Auto-Discovery STOPPED');
    };
    /**
     * Run agent discovery cycle
     */
    AgentAutoDiscoveryLoop.prototype.runDiscovery = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, currentAgent, activeAgents, duration;
            return __generator(this, function (_a) {
                this.loopCount++;
                startTime = Date.now();
                logger_js_1.logger.info("\uD83D\uDD0D Loop 1 Execution #".concat(this.loopCount, ": Discovering agents..."));
                try {
                    currentAgent = this.detectCurrentAgent();
                    if (currentAgent) {
                        logger_js_1.logger.info("   Identified: Agent ".concat(currentAgent.agentLetter, " (").concat(currentAgent.modelId, ")"));
                        logger_js_1.logger.info("   Working in: ".concat(currentAgent.projectName));
                        logger_js_1.logger.info("   Capabilities: ".concat(currentAgent.capabilities.join(', ')));
                        // 2. Register or update agent session
                        if (this.config.autoRegister) {
                            this.registerAgentSession(currentAgent);
                        }
                        this.agentsDiscovered++;
                    }
                    // 3. Check for other active agents (via heartbeats)
                    if (this.config.trackHeartbeats) {
                        this.updateHeartbeats();
                        this.detectStaleAgents();
                    }
                    activeAgents = this.getActiveAgents();
                    logger_js_1.logger.info("   Active agents: ".concat(activeAgents.length));
                    duration = Date.now() - startTime;
                    logger_js_1.logger.info("\u2705 Loop 1 Complete: ".concat(activeAgents.length, " agents active in ").concat(duration, "ms"));
                    // Log execution
                    this.logLoopExecution({
                        currentAgent: currentAgent === null || currentAgent === void 0 ? void 0 : currentAgent.agentLetter,
                        activeAgents: activeAgents.length,
                        durationMs: duration
                    });
                }
                catch (err) {
                    logger_js_1.logger.error("\u274C Loop 1 Error:", err);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Detect current agent model and map to letter
     */
    AgentAutoDiscoveryLoop.prototype.detectCurrentAgent = function () {
        try {
            // Try to detect from environment or config
            var modelId = process.env.AGENT_MODEL_ID || this.guessModelFromContext();
            var agentLetter = this.mapModelToAgentLetter(modelId);
            if (!agentLetter) {
                logger_js_1.logger.warn('   Could not map model to agent letter');
                return null;
            }
            var agentConfig = AGENT_CAPABILITIES[agentLetter];
            var cwd = process.cwd();
            var projectName = this.extractProjectName(cwd);
            return {
                agentLetter: agentLetter,
                modelId: modelId,
                workingDirectory: cwd,
                projectName: projectName,
                capabilities: agentConfig.specializations,
                sessionStarted: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString(),
                status: 'active'
            };
        }
        catch (err) {
            logger_js_1.logger.warn("   Agent detection failed: ".concat(err.message));
            return null;
        }
    };
    /**
     * Guess model from context (placeholder - would use API detection in production)
     */
    AgentAutoDiscoveryLoop.prototype.guessModelFromContext = function () {
        // In production, this would detect from:
        // - API response headers
        // - MCP server connection info
        // - Process environment
        // For now, default to Sonnet-4.5 (Agent D)
        return 'claude-sonnet-4-5';
    };
    /**
     * Map model ID to agent letter
     */
    AgentAutoDiscoveryLoop.prototype.mapModelToAgentLetter = function (modelId) {
        for (var _i = 0, _a = Object.entries(AGENT_CAPABILITIES); _i < _a.length; _i++) {
            var _b = _a[_i], letter = _b[0], config = _b[1];
            if (config.models.some(function (model) { return modelId.includes(model); })) {
                return letter;
            }
        }
        return null;
    };
    /**
     * Extract project name from working directory
     */
    AgentAutoDiscoveryLoop.prototype.extractProjectName = function (cwd) {
        var parts = cwd.split('/');
        var projectIndex = parts.findIndex(function (p) { return p.startsWith('PROJECT_'); });
        if (projectIndex >= 0) {
            return parts[projectIndex];
        }
        // Fallback to directory name
        return parts[parts.length - 1] || 'unknown';
    };
    /**
     * Register or update agent session in database
     */
    AgentAutoDiscoveryLoop.prototype.registerAgentSession = function (agent) {
        try {
            // Use existing agent_sessions table (already created by TaskStore)
            // Database schema: agent_letter, agent_model, project_id, connected_at, last_heartbeat, status
            // Upsert agent session
            var existing = this.db.prepare("\n        SELECT id FROM agent_sessions WHERE agent_letter = ? AND project_id = ?\n      ").get(agent.agentLetter, agent.projectName);
            if (existing) {
                // Update existing session
                this.db.prepare("\n          UPDATE agent_sessions\n          SET last_heartbeat = ?,\n              status = ?\n          WHERE id = ?\n        ").run(agent.lastHeartbeat, agent.status.toUpperCase(), // Database expects ACTIVE/IDLE/DISCONNECTED in uppercase
                existing.id);
            }
            else {
                // Insert new session using actual database columns
                this.db.prepare("\n          INSERT INTO agent_sessions (\n            id, agent_letter, agent_model,\n            project_id, connected_at,\n            last_heartbeat, status\n          ) VALUES (?, ?, ?, ?, ?, ?, ?)\n        ").run((0, crypto_1.randomUUID)(), agent.agentLetter, agent.modelId, agent.projectName, agent.sessionStarted, // Maps to connected_at
                agent.lastHeartbeat, agent.status.toUpperCase() // Database expects ACTIVE/IDLE/DISCONNECTED
                );
                logger_js_1.logger.info("   \u2705 Registered new agent session: ".concat(agent.agentLetter));
            }
        }
        catch (err) {
            logger_js_1.logger.warn("   \u26A0\uFE0F  Could not register agent session: ".concat(err.message));
        }
    };
    /**
     * Update heartbeats for current agent
     */
    AgentAutoDiscoveryLoop.prototype.updateHeartbeats = function () {
        try {
            var currentAgent = this.detectCurrentAgent();
            if (currentAgent) {
                this.db.prepare("\n          UPDATE agent_sessions\n          SET last_heartbeat = ?,\n              status = 'active',\n              updated_at = ?\n          WHERE agent_letter = ? AND project_id = ?\n        ").run(new Date().toISOString(), Date.now(), currentAgent.agentLetter, currentAgent.projectName);
            }
        }
        catch (err) {
            // Ignore heartbeat errors
        }
    };
    /**
     * Detect and mark stale agent sessions
     */
    AgentAutoDiscoveryLoop.prototype.detectStaleAgents = function () {
        try {
            var timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
            var cutoff = new Date(Date.now() - timeoutMs).toISOString();
            this.db.prepare("\n        UPDATE agent_sessions\n        SET status = 'offline',\n            updated_at = ?\n        WHERE last_heartbeat < ?\n          AND status != 'offline'\n      ").run(Date.now(), cutoff);
        }
        catch (err) {
            // Ignore stale detection errors
        }
    };
    /**
     * Get all active agent sessions
     */
    AgentAutoDiscoveryLoop.prototype.getActiveAgents = function () {
        try {
            var rows = this.db.prepare("\n        SELECT * FROM agent_sessions\n        WHERE status = 'ACTIVE'\n        ORDER BY last_heartbeat DESC\n      ").all();
            return rows.map(function (row) { return ({
                agentLetter: row.agent_letter,
                modelId: row.agent_model, // Database column is agent_model
                workingDirectory: process.cwd(), // Not in database, use current working directory
                projectName: row.project_id,
                capabilities: [], // Not in database, return empty array
                sessionStarted: row.connected_at, // Database column is connected_at
                lastHeartbeat: row.last_heartbeat,
                status: row.status.toLowerCase() // Convert ACTIVE to active for consistency
            }); });
        }
        catch (err) {
            return [];
        }
    };
    /**
     * Log loop execution
     */
    AgentAutoDiscoveryLoop.prototype.logLoopExecution = function (result) {
        try {
            this.db.prepare("\n        INSERT INTO auto_proactive_logs (\n          id, loop_name, action, result, timestamp, execution_time_ms\n        ) VALUES (?, ?, ?, ?, ?, ?)\n      ").run((0, crypto_1.randomUUID)(), 'AGENT_AUTO_DISCOVERY', 'DISCOVER_AND_REGISTER', JSON.stringify(result), new Date().toISOString(), result.durationMs);
        }
        catch (err) {
            // Ignore logging errors
        }
    };
    /**
     * Get loop statistics
     */
    AgentAutoDiscoveryLoop.prototype.getStats = function () {
        var activeAgents = this.getActiveAgents();
        return {
            isRunning: this.isRunning,
            loopCount: this.loopCount,
            agentsDiscovered: this.agentsDiscovered,
            activeAgents: activeAgents.length,
            agents: activeAgents,
            intervalSeconds: this.config.intervalSeconds
        };
    };
    return AgentAutoDiscoveryLoop;
}());
exports.AgentAutoDiscoveryLoop = AgentAutoDiscoveryLoop;
