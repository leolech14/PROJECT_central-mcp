/**
 * 999-X-Ray-Tool: Get File Summary
 * =================================
 *
 * MCP Tool for retrieving summaries of file analysis results
 */
import type { GetFileSummaryArgs, XRayToolResponse } from '../types/ultrathink.js';
export declare const getFileSummaryTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            limit: {
                type: string;
                description: string;
                default: number;
                minimum: number;
                maximum: number;
            };
            filter_by_language: {
                type: string;
                description: string;
                default: null;
            };
            sort_by: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
        };
    };
};
export declare function handleGetFileSummary(args: GetFileSummaryArgs): Promise<XRayToolResponse>;
//# sourceMappingURL=getFileSummary.d.ts.map