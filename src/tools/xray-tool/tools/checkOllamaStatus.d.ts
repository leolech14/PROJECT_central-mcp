/**
 * 999-X-Ray-Tool: Check Ollama Status
 * =====================================
 *
 * MCP Tool for checking Ollama connectivity and available models
 */
import type { CheckOllamaStatusArgs, XRayToolResponse } from '../types/ultrathink.js';
export declare const checkOllamaStatusTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            ollama_url: {
                type: string;
                description: string;
                default: string;
            };
        };
    };
};
export declare function handleCheckOllamaStatus(args: CheckOllamaStatusArgs): Promise<XRayToolResponse>;
//# sourceMappingURL=checkOllamaStatus.d.ts.map