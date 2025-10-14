/**
 * 999-X-Ray-Tool: Get Analysis Statistics
 * ========================================
 *
 * MCP Tool for retrieving comprehensive statistics about file analysis
 */
import type { GetAnalysisStatsArgs, XRayToolResponse } from '../types/ultrathink.js';
export declare const getAnalysisStatsTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {};
    };
};
export declare function handleGetAnalysisStats(args: GetAnalysisStatsArgs): Promise<XRayToolResponse>;
//# sourceMappingURL=getAnalysisStats.d.ts.map