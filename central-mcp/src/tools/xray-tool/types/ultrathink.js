/**
 * ULTRATHINK Type Definitions
 * ==========================
 *
 * TypeScript interfaces for the ULTRATHINK X-Ray Vision system
 */
// Error types
export class XRayToolError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'XRayToolError';
    }
}
export class OllamaConnectionError extends XRayToolError {
    url;
    constructor(message, url) {
        super(message, 'OLLAMA_CONNECTION_ERROR', { url });
        this.url = url;
        this.name = 'OllamaConnectionError';
    }
}
export class AnalysisError extends XRayToolError {
    filepath;
    constructor(message, filepath) {
        super(message, 'ANALYSIS_ERROR', { filepath });
        this.filepath = filepath;
        this.name = 'AnalysisError';
    }
}
//# sourceMappingURL=ultrathink.js.map