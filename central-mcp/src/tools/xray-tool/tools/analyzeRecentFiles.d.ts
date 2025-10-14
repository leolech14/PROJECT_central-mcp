/**
 * 999-X-Ray-Tool: Analyze Recent Files
 * =====================================
 *
 * MCP Tool for analyzing recent files with AI-generated context
 */
import type { AnalyzeRecentFilesArgs, XRayToolResponse } from '../types/ultrathink.js';
export declare const analyzeRecentFilesTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            directory: {
                type: string;
                description: string;
                default: string;
            };
            max_files: {
                type: string;
                description: string;
                default: number;
                minimum: number;
                maximum: number;
            };
            ollama_model: {
                type: string;
                description: string;
                default: string;
            };
            output_file: {
                type: string;
                description: string;
                default: null;
            };
            include_binary: {
                type: string;
                description: string;
                default: boolean;
            };
            parallel_processing: {
                type: string;
                description: string;
                default: boolean;
            };
        };
    };
};
export declare function handleAnalyzeRecentFiles(args: AnalyzeRecentFilesArgs): Promise<XRayToolResponse>;
//# sourceMappingURL=analyzeRecentFiles.d.ts.map