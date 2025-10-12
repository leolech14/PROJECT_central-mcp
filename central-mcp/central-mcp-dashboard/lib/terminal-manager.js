"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminalManager = exports.TerminalManager = void 0;
var node_pty_1 = require("node-pty");
var ws_1 = require("ws");
var TerminalManager = /** @class */ (function () {
    function TerminalManager() {
        this.sessions = new Map();
    }
    TerminalManager.prototype.createSession = function (options) {
        var id = options.id, type = options.type, projectPath = options.projectPath, _a = options.cwd, cwd = _a === void 0 ? process.env.HOME : _a;
        // Spawn terminal process
        var pty = (0, node_pty_1.spawn)(process.env.SHELL || 'bash', [], {
            name: 'xterm-256color',
            cols: 80,
            rows: 30,
            cwd: projectPath || cwd,
            env: process.env,
        });
        var session = {
            id: id,
            pty: pty,
            clients: new Set(),
            createdAt: new Date(),
            type: type,
            projectPath: projectPath,
        };
        this.sessions.set(id, session);
        // If it's a claude-code session, auto-start it
        if (type === 'claude-code') {
            setTimeout(function () {
                pty.write('claude-code\r');
            }, 500);
        }
        return session;
    };
    TerminalManager.prototype.getSession = function (id) {
        return this.sessions.get(id);
    };
    TerminalManager.prototype.deleteSession = function (id) {
        var session = this.sessions.get(id);
        if (session) {
            session.pty.kill();
            session.clients.forEach(function (client) { return client.close(); });
            this.sessions.delete(id);
        }
    };
    TerminalManager.prototype.attachClient = function (sessionId, ws) {
        var _this = this;
        var session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.clients.add(ws);
        // Send data from PTY to WebSocket
        session.pty.onData(function (data) {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'output', data: data }));
            }
        });
        // Handle PTY exit
        session.pty.onExit(function () {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'exit' }));
            }
            _this.deleteSession(sessionId);
        });
        // Send input from WebSocket to PTY
        ws.on('message', function (message) {
            try {
                var data = JSON.parse(message.toString());
                if (data.type === 'input') {
                    session.pty.write(data.data);
                }
                else if (data.type === 'resize') {
                    session.pty.resize(data.cols, data.rows);
                }
            }
            catch (err) {
                console.error('Error processing message:', err);
            }
        });
        ws.on('close', function () {
            session.clients.delete(ws);
            // If no more clients, optionally keep session alive or kill it
            if (session.clients.size === 0) {
                // Keep alive for 5 minutes
                setTimeout(function () {
                    if (session.clients.size === 0) {
                        _this.deleteSession(sessionId);
                    }
                }, 5 * 60 * 1000);
            }
        });
    };
    TerminalManager.prototype.listSessions = function () {
        return Array.from(this.sessions.values()).map(function (session) { return ({
            id: session.id,
            type: session.type,
            projectPath: session.projectPath,
            clients: session.clients.size,
            createdAt: session.createdAt,
        }); });
    };
    return TerminalManager;
}());
exports.TerminalManager = TerminalManager;
// Singleton instance
exports.terminalManager = new TerminalManager();
