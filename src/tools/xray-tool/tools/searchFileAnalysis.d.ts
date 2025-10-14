/**
 * 999-X-Ray-Tool: Search File Analysis
 * ====================================
 *
 * MCP Tool for searching through analyzed files by content
 */
import type { SearchFileAnalysisArgs, XRayToolResponse } from '../types/ultrathink.js';
export declare const searchFileAnalysisTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
                required: boolean;
            };
            search_in: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
                default: string[];
            };
            limit: {
                type: string;
                description: string;
                default: number;
                minimum: number;
                maximum: number;
            };
        };
    };
};
export declare function handleSearchFileAnalysis(args: SearchFileAnalysisArgs): Promise<XRayToolResponse>;
//# sourceMappingURL=searchFileAnalysis.d.ts.map