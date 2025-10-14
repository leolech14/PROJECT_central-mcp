#!/usr/bin/env python3
"""
╔════════════════════════════════════════════════════════════════════════════════════╗
║                 🧠 CENTRAL-MCP ULTRATHINK FILE ANALYSIS SERVER                     ║
║                       Advanced File Intelligence for MCP Networks                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝

MCP Server providing ULTRATHINK file analysis capabilities to Central-MCP network.
Integrates with local Ollama for AI-powered file content analysis.

Author: Claude Code + Central-MCP Integration
Version: 1.0.0
Purpose: MCP Server for advanced file analysis with AI context
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.session import ServerSession
from mcp.types import (
    CallToolRequest,
    CallToolResult,
    GetPromptRequest,
    GetPromptResult,
    ListPromptsRequest,
    ListPromptsResult,
    ListResourcesRequest,
    ListResourcesResult,
    ListToolsRequest,
    ListToolsResult,
    Prompt,
    Resource,
    TextContent,
    Tool,
    ToolInfo
)

# Import the ULTRATHINK analyzer
from ULTRATHINK_FILE_ANALYZER import UltraThinkFileAnalyzer, FileMetadata

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ultrathink-mcp")

class UltraThinkMCPServer:
    """MCP Server for ULTRATHINK file analysis capabilities"""

    def __init__(self):
        self.server = Server("ultrathink-file-analyzer")
        self.analyzer = None
        self.last_analysis = None
        self.last_analysis_time = None

        # Register MCP handlers
        self._register_handlers()

    def _register_handlers(self):
        """Register MCP protocol handlers"""

        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            """List available ULTRATHINK tools"""
            return [
                Tool(
                    name="analyze_recent_files",
                    description="Analyze the last 999 modified files with AI-generated context using local Ollama",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "directory": {
                                "type": "string",
                                "description": "Directory to analyze (default: current directory)",
                                "default": "."
                            },
                            "max_files": {
                                "type": "integer",
                                "description": "Maximum number of files to analyze (default: 999)",
                                "default": 999,
                                "minimum": 1,
                                "maximum": 9999
                            },
                            "ollama_model": {
                                "type": "string",
                                "description": "Ollama model to use (default: llama3.1:8b)",
                                "default": "llama3.1:8b"
                            },
                            "output_file": {
                                "type": "string",
                                "description": "Output JSON file path (optional)",
                                "default": None
                            },
                            "include_binary": {
                                "type": "boolean",
                                "description": "Include binary files in analysis (default: false)",
                                "default": False
                            },
                            "parallel_processing": {
                                "type": "boolean",
                                "description": "Use parallel processing (default: true)",
                                "default": True
                            }
                        }
                    }
                ),
                Tool(
                    name="get_file_summary",
                    description="Get a summary of the last file analysis results",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "limit": {
                                "type": "integer",
                                "description": "Number of files to include in summary (default: 10)",
                                "default": 10,
                                "minimum": 1,
                                "maximum": 100
                            },
                            "filter_by_language": {
                                "type": "string",
                                "description": "Filter results by programming language (optional)",
                                "default": None
                            },
                            "sort_by": {
                                "type": "string",
                                "enum": ["modified_at", "size_bytes", "name", "language"],
                                "description": "Sort results by field (default: modified_at)",
                                "default": "modified_at"
                            }
                        }
                    }
                ),
                Tool(
                    name="search_file_analysis",
                    description="Search through analyzed files by name, path, or AI context",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Search query for file names, paths, or AI context",
                                "required": True
                            },
                            "search_in": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["name", "filepath", "ai_context", "language", "all"]
                                },
                                "description": "Fields to search in (default: all)",
                                "default": ["all"]
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum results to return (default: 20)",
                                "default": 20,
                                "minimum": 1,
                                "maximum": 100
                            }
                        }
                    }
                ),
                Tool(
                    name="get_analysis_stats",
                    description="Get statistics about file analysis including performance metrics",
                    inputSchema={
                        "type": "object",
                        "properties": {}
                    }
                ),
                Tool(
                    name="check_ollama_status",
                    description="Check if Ollama is running and what models are available",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "ollama_url": {
                                "type": "string",
                                "description": "Ollama API URL (default: http://localhost:11434)",
                                "default": "http://localhost:11434"
                            }
                        }
                    }
                )
            ]

        @self.server.call_tool()
        async def handle_call_tool(
            name: str, arguments: Optional[Dict[str, Any]]
        ) -> CallToolResult:
            """Handle tool calls"""
            try:
                if name == "analyze_recent_files":
                    return await self._handle_analyze_recent_files(arguments or {})
                elif name == "get_file_summary":
                    return await self._handle_get_file_summary(arguments or {})
                elif name == "search_file_analysis":
                    return await self._handle_search_file_analysis(arguments or {})
                elif name == "get_analysis_stats":
                    return await self._handle_get_analysis_stats(arguments or {})
                elif name == "check_ollama_status":
                    return await self._handle_check_ollama_status(arguments or {})
                else:
                    raise ValueError(f"Unknown tool: {name}")

            except Exception as e:
                logger.error(f"Error in tool {name}: {e}")
                return CallToolResult(
                    content=[
                        TextContent(
                            type="text",
                            text=f"Error: {str(e)}"
                        )
                    ],
                    isError=True
                )

        @self.server.list_prompts()
        async def handle_list_prompts() -> List[Prompt]:
            """List available prompts"""
            return [
                Prompt(
                    name="ultrathink_analysis",
                    description="Generate ULTRATHINK file analysis report",
                    arguments=[
                        {
                            "name": "directory",
                            "description": "Directory to analyze",
                            "required": False,
                            "type": "string"
                        },
                        {
                            "name": "focus",
                            "description": "Analysis focus (e.g., 'security', 'performance', 'dependencies')",
                            "required": False,
                            "type": "string"
                        }
                    ]
                )
            ]

        @self.server.get_prompt()
        async def handle_get_prompt(
            name: str, arguments: Optional[Dict[str, Any]]
        ) -> GetPromptResult:
            """Get prompt content"""
            if name == "ultrathink_analysis":
                directory = arguments.get("directory", ".") if arguments else "."
                focus = arguments.get("focus", "general") if arguments else "general"

                prompt_text = f"""
Perform ULTRATHINK file analysis on directory: {directory}
Focus: {focus}

Use the analyze_recent_files tool to get comprehensive file analysis with AI-generated context.
Then provide insights based on the {focus} area.

The analysis should include:
1. File structure and organization
2. Code quality indicators
3. Security considerations (if security focus)
4. Performance patterns (if performance focus)
5. Dependencies and integrations (if dependencies focus)
6. Recommendations for improvements
"""

                return GetPromptResult(
                    description=f"ULTRATHINK analysis for {directory}",
                    messages=[
                        {
                            "role": "user",
                            "content": {"type": "text", "text": prompt_text}
                        }
                    ]
                )
            else:
                raise ValueError(f"Unknown prompt: {name}")

    async def _handle_analyze_recent_files(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle analyze_recent_files tool call"""
        try:
            # Initialize analyzer with config
            config = {
                'ollama_url': arguments.get('ollama_url', 'http://localhost:11434'),
                'ollama_model': arguments.get('ollama_model', 'llama3.1:8b'),
                'max_files': arguments.get('max_files', 999),
                'parallel_processing': arguments.get('parallel_processing', True)
            }

            self.analyzer = UltraThinkFileAnalyzer(config)

            # Perform analysis
            directory = arguments.get('directory', '.')
            output_file = arguments.get('output_file')

            logger.info(f"Starting ULTRATHINK analysis of {directory}")
            results = self.analyzer.analyze_directory(directory, output_file)

            # Store results for other tools
            self.last_analysis = results
            self.last_analysis_time = datetime.now().isoformat()

            # Generate summary
            if not results:
                return CallToolResult(
                    content=[
                        TextContent(
                            type="text",
                            text="No files found to analyze or analysis failed."
                        )
                    ]
                )

            # Create summary response
            total_size = sum(r.size_bytes for r in results)
            languages = {}
            for result in results:
                lang = result.language
                languages[lang] = languages.get(lang, 0) + 1

            top_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:10]

            response = f"""🧠 **ULTRATHINK FILE ANALYSIS COMPLETE**

📊 **Summary:**
- Files analyzed: {len(results)}
- Total size: {self.analyzer._format_size(total_size)}
- Processing time: {self.analyzer.files_processed / (len(results) / (time.time() - self.analyzer.start_time)):.1f} files/sec
- Cache hits: {self.analyzer.cache_hits} ({(self.analyzer.cache_hits/len(results)*100):.1f}%)
- LLM calls: {self.analyzer.llm_calls}

🏷️ **Top Languages:**
"""
            for lang, count in top_languages:
                percentage = (count / len(results)) * 100
                response += f"- {lang}: {count} files ({percentage:.1f}%)\n"

            response += f"""
🕒 **Most Recent Files:**
"""
            for result in results[:5]:
                response += f"- {result.modified_at[:19]} | {result.name} ({result.size_human})\n"

            if output_file:
                response += f"\n📄 Full report saved to: {output_file}"

            return CallToolResult(
                content=[
                    TextContent(type="text", text=response)
                ]
            )

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Analysis failed: {str(e)}"
                    )
                ],
                isError=True
            )

    async def _handle_get_file_summary(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle get_file_summary tool call"""
        if not self.last_analysis:
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text="No analysis results available. Run analyze_recent_files first."
                    )
                ]
            )

        try:
            limit = arguments.get('limit', 10)
            filter_by_language = arguments.get('filter_by_language')
            sort_by = arguments.get('sort_by', 'modified_at')

            # Filter results
            results = self.last_analysis
            if filter_by_language:
                results = [r for r in results if r.language.lower() == filter_by_language.lower()]

            # Sort results
            reverse = sort_by == 'modified_at'  # Descending for time
            results.sort(key=lambda x: getattr(x, sort_by), reverse=reverse)

            # Limit results
            results = results[:limit]

            # Generate summary
            response = f"📋 **FILE ANALYSIS SUMMARY**\n\n"
            response += f"Showing {len(results)} files"
            if filter_by_language:
                response += f" (filtered by: {filter_by_language})"
            response += f" (sorted by: {sort_by})\n\n"

            for result in results:
                response += f"📄 **{result.name}**\n"
                response += f"   Path: `{result.filepath}`\n"
                response += f"   Language: {result.language} | Size: {result.size_human}\n"
                response += f"   Modified: {result.modified_at[:19]}\n"
                response += f"   Lines: {result.line_count}\n"

                # Include AI context preview
                if result.ai_context:
                    preview = result.ai_context[:200] + "..." if len(result.ai_context) > 200 else result.ai_context
                    response += f"   AI Context: {preview}\n"

                response += "\n"

            return CallToolResult(
                content=[
                    TextContent(type="text", text=response)
                ]
            )

        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Summary generation failed: {str(e)}"
                    )
                ],
                isError=True
            )

    async def _handle_search_file_analysis(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle search_file_analysis tool call"""
        if not self.last_analysis:
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text="No analysis results available. Run analyze_recent_files first."
                    )
                ]
            )

        try:
            query = arguments.get('query', '').lower()
            search_in = arguments.get('search_in', ['all'])
            limit = arguments.get('limit', 20)

            if not query:
                return CallToolResult(
                    content=[
                        TextContent(
                            type="text",
                            text="Search query is required."
                        )
                    ],
                    isError=True
                )

            # Search through results
            matches = []
            for result in self.last_analysis:
                match_score = 0
                match_reasons = []

                # Search in different fields
                if 'name' in search_in or 'all' in search_in:
                    if query in result.name.lower():
                        match_score += 3
                        match_reasons.append("name")

                if 'filepath' in search_in or 'all' in search_in:
                    if query in result.filepath.lower():
                        match_score += 2
                        match_reasons.append("path")

                if 'language' in search_in or 'all' in search_in:
                    if query in result.language.lower():
                        match_score += 2
                        match_reasons.append("language")

                if 'ai_context' in search_in or 'all' in search_in:
                    if query in result.ai_context.lower():
                        match_score += 1
                        match_reasons.append("AI context")

                if match_score > 0:
                    matches.append((match_score, result, match_reasons))

            # Sort by match score (descending)
            matches.sort(key=lambda x: x[0], reverse=True)
            matches = matches[:limit]

            # Generate response
            response = f"🔍 **SEARCH RESULTS FOR: '{query}'**\n\n"
            response += f"Found {len(matches)} matches"

            if 'all' not in search_in:
                response += f" (searched in: {', '.join(search_in)})"

            response += "\n\n"

            if not matches:
                response += "No matches found. Try a different search term or search fields."
            else:
                for score, result, reasons in matches:
                    response += f"📄 **{result.name}** (Score: {score})\n"
                    response += f"   Path: `{result.filepath}`\n"
                    response += f"   Language: {result.language} | Size: {result.size_human}\n"
                    response += f"   Matched in: {', '.join(reasons)}\n"

                    # Show context snippet for AI context matches
                    if 'ai_context' in reasons and result.ai_context:
                        # Find the query context in AI analysis
                        context_lower = result.ai_context.lower()
                        query_pos = context_lower.find(query)
                        if query_pos >= 0:
                            start = max(0, query_pos - 50)
                            end = min(len(result.ai_context), query_pos + 150)
                            snippet = result.ai_context[start:end]
                            response += f"   Context: ...{snippet}...\n"

                    response += "\n"

            return CallToolResult(
                content=[
                    TextContent(type="text", text=response)
                ]
            )

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Search failed: {str(e)}"
                    )
                ],
                isError=True
            )

    async def _handle_get_analysis_stats(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle get_analysis_stats tool call"""
        try:
            if not self.last_analysis:
                return CallToolResult(
                    content=[
                        TextContent(
                            type="text",
                            text="No analysis results available. Run analyze_recent_files first."
                        )
                    ]
                )

            # Calculate statistics
            results = self.last_analysis
            total_files = len(results)
            total_size = sum(r.size_bytes for r in results)
            total_lines = sum(r.line_count for r in results)

            # Language distribution
            languages = {}
            for result in results:
                lang = result.language
                languages[lang] = languages.get(lang, 0) + 1

            # File size distribution
            size_ranges = {
                'Small (< 1KB)': 0,
                'Medium (1KB - 10KB)': 0,
                'Large (10KB - 100KB)': 0,
                'Very Large (> 100KB)': 0
            }

            for result in results:
                size = result.size_bytes
                if size < 1024:
                    size_ranges['Small (< 1KB)'] += 1
                elif size < 10240:
                    size_ranges['Medium (1KB - 10KB)'] += 1
                elif size < 102400:
                    size_ranges['Large (10KB - 100KB)'] += 1
                else:
                    size_ranges['Very Large (> 100KB)'] += 1

            # Generate response
            response = f"📊 **ULTRATHINK ANALYSIS STATISTICS**\n\n"
            response += f"🔢 **Basic Stats:**\n"
            response += f"- Total files: {total_files}\n"
            response += f"- Total size: {self.analyzer._format_size(total_size)}\n"
            response += f"- Total lines: {total_lines:,}\n"
            response += f"- Average file size: {self.analyzer._format_size(total_size // total_files) if total_files > 0 else 'N/A'}\n"
            response += f"- Analysis time: {time.time() - self.analyzer.start_time:.2f} seconds\n"
            response += f"- Cache hit rate: {(self.analyzer.cache_hits/total_files*100):.1f}%\n"
            response += f"- LLM calls made: {self.analyzer.llm_calls}\n\n"

            response += f"🏷️ **Top Languages:**\n"
            for lang, count in sorted(languages.items(), key=lambda x: x[1], reverse=True)[:10]:
                percentage = (count / total_files) * 100
                response += f"- {lang}: {count} files ({percentage:.1f}%)\n"

            response += f"\n📏 **File Size Distribution:**\n"
            for range_name, count in size_ranges.items():
                percentage = (count / total_files) * 100
                response += f"- {range_name}: {count} files ({percentage:.1f}%)\n"

            response += f"\n🕒 **Analysis performed:** {self.last_analysis_time}"

            return CallToolResult(
                content=[
                    TextContent(type="text", text=response)
                ]
            )

        except Exception as e:
            logger.error(f"Stats generation failed: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Stats generation failed: {str(e)}"
                    )
                ],
                isError=True
            )

    async def _handle_check_ollama_status(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle check_ollama_status tool call"""
        try:
            import requests

            ollama_url = arguments.get('ollama_url', 'http://localhost:11434')

            # Check if Ollama is running
            try:
                response = requests.get(f"{ollama_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    models_data = response.json()
                    models = models_data.get('models', [])

                    response_text = f"✅ **OLLAMA STATUS: CONNECTED**\n\n"
                    response_text += f"🔗 URL: {ollama_url}\n"
                    response_text += f"🤖 Available models: {len(models)}\n\n"

                    if models:
                        response_text += f"**Models:**\n"
                        for model in models:
                            name = model.get('name', 'Unknown')
                            size = model.get('size', 0)
                            size_gb = size / (1024**3) if size else 0
                            response_text += f"- {name} ({size_gb:.1f}GB)\n"
                    else:
                        response_text += "⚠️ No models available. Pull a model with: ollama pull llama3.1:8b\n"

                    return CallToolResult(
                        content=[
                            TextContent(type="text", text=response_text)
                        ]
                    )
                else:
                    raise Exception(f"HTTP {response.status_code}")

            except requests.exceptions.RequestException as e:
                response_text = f"❌ **OLLAMA STATUS: NOT CONNECTED**\n\n"
                response_text += f"🔗 URL: {ollama_url}\n"
                response_text += f"❌ Error: {str(e)}\n\n"
                response_text += f"**To install Ollama:**\n"
                response_text += f"```bash\n"
                response_text += f"curl -fsSL https://ollama.ai/install.sh | sh\n"
                response_text += f"```\n\n"
                response_text += f"**To start Ollama:**\n"
                response_text += f"```bash\n"
                response_text += f"ollama serve\n"
                response_text += f"```\n\n"
                response_text += f"**To pull a model:**\n"
                response_text += f"```bash\n"
                response_text += f"ollama pull llama3.1:8b\n"
                response_text += f"```"

                return CallToolResult(
                    content=[
                        TextContent(type="text", text=response_text)
                    ],
                    isError=True
                )

        except Exception as e:
            logger.error(f"Ollama status check failed: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Ollama status check failed: {str(e)}"
                    )
                ],
                isError=True
            )

    async def run(self):
        """Run the MCP server"""
        # For stdio transport (default MCP communication)
        from mcp.server.stdio import stdio_server

        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="ultrathink-file-analyzer",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=None,
                        experimental_capabilities=None
                    )
                )
            )

async def main():
    """Main entry point for MCP server"""
    logging.info("Starting ULTRATHINK MCP Server...")

    server = UltraThinkMCPServer()
    await server.run()

if __name__ == "__main__":
    asyncio.run(main())