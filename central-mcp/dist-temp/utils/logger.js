"use strict";
/**
 * Logger Utility
 * ==============
 *
 * Simple logging for MCP server with timestamp and level.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var Logger = /** @class */ (function () {
    function Logger(level) {
        if (level === void 0) { level = 'info'; }
        this.level = level;
    }
    Logger.prototype.shouldLog = function (level) {
        var levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    };
    Logger.prototype.formatMessage = function (level, message, data) {
        var timestamp = new Date().toISOString();
        var levelStr = level.toUpperCase().padEnd(5);
        var baseMsg = "[".concat(timestamp, "] ").concat(levelStr, " ").concat(message);
        if (data !== undefined) {
            return "".concat(baseMsg, "\n").concat(JSON.stringify(data, null, 2));
        }
        return baseMsg;
    };
    Logger.prototype.debug = function (message, data) {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, data));
        }
    };
    Logger.prototype.info = function (message, data) {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, data));
        }
    };
    Logger.prototype.warn = function (message, data) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, data));
        }
    };
    Logger.prototype.error = function (message, error) {
        if (this.shouldLog('error')) {
            if (error instanceof Error) {
                console.error(this.formatMessage('error', message, {
                    errorMessage: error.message,
                    stack: error.stack
                }));
            }
            else {
                console.error(this.formatMessage('error', message, error));
            }
        }
    };
    Logger.prototype.setLevel = function (level) {
        this.level = level;
    };
    return Logger;
}());
// Singleton instance
exports.logger = new Logger(process.env.LOG_LEVEL || 'info');
