/**
 * 999-X-Ray-Tool: Main Entry Point
 * ================================
 *
 * Central-MCP integration for ULTRATHINK Time-Traveling X-Ray Vision
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
// Import 999-X-Ray-Tool implementations
import { analyzeRecentFilesTool, handleAnalyzeRecentFiles } from './tools/analyzeRecentFiles.js';
import { getFileSummaryTool, handleGetFileSummary } from './tools/getFileSummary.js';
import { searchFileAnalysisTool, handleSearchFileAnalysis } from './tools/searchFileAnalysis.js';
import { getAnalysisStatsTool, handleGetAnalysisStats } from './tools/getAnalysisStats.js';
import { checkOllamaStatusTool, handleCheckOllamaStatus } from './tools/checkOllamaStatus.js';
class XRayToolServer {
    server;
    constructor() {
        this.server = new Server({
            name: "999-x-ray-tool",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    analyzeRecentFilesTool,
                    getFileSummaryTool,
                    searchFileAnalysisTool,
                    getAnalysisStatsTool,
                    checkOllamaStatusTool
                ]
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                console.log(`🧠 999-X-Ray-Tool: Executing ${name}`);
                switch (name) {
                    case 'analyze_recent_files':
                        return await handleAnalyzeRecentFiles(args);
                    case 'get_file_summary':
                        return await handleGetFileSummary(args);
                    case 'search_file_analysis':
                        return await handleSearchFileAnalysis(args);
                    case 'get_analysis_stats':
                        return await handleGetAnalysisStats(args);
                    case 'check_ollama_status':
                        return await handleCheckOllamaStatus(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`🚨 999-X-Ray-Tool Error in ${name}:`, errorMessage);
                return {
                    content: [{
                            type: "text",
                            text: `999-X-Ray-Tool Error: ${errorMessage}`
                        }],
                    isError: true
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('🚀 999-X-Ray-Tool: Server started and ready for analysis');
    }
}
// Global error handling
process.on('uncaughtException', (error) => {
    console.error('🚨 999-X-Ray-Tool Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 999-X-Ray-Tool Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start the server
async function main() {
    try {
        const server = new XRayToolServer();
        await server.run();
    }
    catch (error) {
        console.error('🚨 999-X-Ray-Tool failed to start:', error);
        process.exit(1);
    }
}
// Run main function
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
//# sourceMappingURL=index.js.map