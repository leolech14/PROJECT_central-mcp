/**
 * 999-X-Ray-Tool: Search File Analysis
 * ====================================
 *
 * MCP Tool for searching through analyzed files by content
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  SearchFileAnalysisArgs,
  XRayToolResponse,
  AnalysisResults,
  SearchMatch
} from '../types/ultrathink.js';

export const searchFileAnalysisTool = {
  name: "search_file_analysis",
  description: "Search through analyzed files by name, path, or AI context",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for file names, paths, or AI context",
        required: true
      },
      search_in: {
        type: "array",
        items: {
          type: "string",
          enum: ["name", "filepath", "ai_context", "language", "all"]
        },
        description: "Fields to search in (default: all)",
        default: ["all"]
      },
      limit: {
        type: "integer",
        description: "Maximum results to return (default: 20)",
        default: 20,
        minimum: 1,
        maximum: 100
      }
    }
  }
};

export async function handleSearchFileAnalysis(
  args: SearchFileAnalysisArgs
): Promise<XRayToolResponse> {
  try {
    if (!args.query || args.query.trim().length === 0) {
      return {
        success: false,
        message: "Search query is required",
        error: "MISSING_QUERY"
      };
    }

    // Find the most recent analysis file
    const analysisFile = await findLatestAnalysisFile();

    if (!analysisFile) {
      return {
        success: false,
        message: "No 999-X-Ray-Tool analysis results found. Run analyze_recent_files first.",
        error: "ANALYSIS_NOT_FOUND"
      };
    }

    // Read and parse the analysis results
    const analysisData = await readAnalysisFile(analysisFile);

    // Perform the search
    const matches = await searchFiles(analysisData.files, args);

    // Generate search results response
    const searchResults = generateSearchResults(matches, args);

    return {
      success: true,
      message: `999-X-Ray-Tool search completed: ${matches.length} matches found`,
      data: {
        query: args.query,
        search_in: args.search_in,
        matches: matches,
        results_summary: searchResults,
        total_files_searched: analysisData.files.length,
        analysis_file: analysisFile
      }
    };

  } catch (error) {
    return {
      success: false,
      message: "999-X-Ray-Tool search failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function findLatestAnalysisFile(): Promise<string | null> {
  try {
    const currentDir = process.cwd();
    const files = await fs.readdir(currentDir);

    // Look for files matching our pattern
    const analysisFiles = files
      .filter(file =>
        file.startsWith('xray-analysis-') && file.endsWith('.json') ||
        file.startsWith('ultrathink_analysis_') && file.endsWith('.json') ||
        file === 'demo_analysis.json'
      )
      .map(file => ({
        name: file,
        path: path.join(currentDir, file)
      }));

    if (analysisFiles.length === 0) {
      return null;
    }

    // Get file stats to find the most recent
    const fileStats = await Promise.all(
      analysisFiles.map(async (file) => {
        try {
          const stats = await fs.stat(file.path);
          return { ...file, mtime: stats.mtime };
        } catch {
          return null;
        }
      })
    );

    // Filter out null results and sort by modification time
    const validFiles = fileStats
      .filter((file): file is NonNullable<typeof file> => file !== null)
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return validFiles.length > 0 ? validFiles[0].path : null;

  } catch (error) {
    console.warn('Error finding analysis file:', error);
    return null;
  }
}

async function readAnalysisFile(filePath: string): Promise<AnalysisResults> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to read analysis file ${filePath}: ${error}`);
  }
}

async function searchFiles(
  files: any[],
  args: SearchFileAnalysisArgs
): Promise<SearchMatch[]> {
  const query = args.query.toLowerCase();
  const searchIn = args.search_in || ['all'];
  const limit = args.limit || 20;

  const matches: SearchMatch[] = [];

  for (const file of files) {
    const matchInfo = analyzeFileMatch(file, query, searchIn);
    if (matchInfo.score > 0) {
      matches.push({
        file: file,
        score: matchInfo.score,
        reasons: matchInfo.reasons,
        context_snippet: matchInfo.context_snippet
      });
    }
  }

  // Sort by match score (descending) and limit results
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

function analyzeFileMatch(
  file: any,
  query: string,
  searchIn: string[]
): { score: number; reasons: string[]; context_snippet?: string } {
  let score = 0;
  const reasons: string[] = [];
  let context_snippet: string | undefined;

  // Search in file name
  if (searchIn.includes('name') || searchIn.includes('all')) {
    if (file.name && file.name.toLowerCase().includes(query)) {
      score += 3;
      reasons.push('name');
    }
  }

  // Search in file path
  if (searchIn.includes('filepath') || searchIn.includes('all')) {
    if (file.filepath && file.filepath.toLowerCase().includes(query)) {
      score += 2;
      reasons.push('path');
    }
  }

  // Search in language
  if (searchIn.includes('language') || searchIn.includes('all')) {
    if (file.language && file.language.toLowerCase().includes(query)) {
      score += 2;
      reasons.push('language');
    }
  }

  // Search in AI context
  if (searchIn.includes('ai_context') || searchIn.includes('all')) {
    if (file.ai_context && file.ai_context.toLowerCase().includes(query)) {
      score += 1;
      reasons.push('AI context');

      // Generate context snippet
      const context_lower = file.ai_context.toLowerCase();
      const query_pos = context_lower.indexOf(query);
      if (query_pos >= 0) {
        const start = Math.max(0, query_pos - 50);
        const end = Math.min(file.ai_context.length, query_pos + 150);
        context_snippet = file.ai_context.slice(start, end);
      }
    }
  }

  return { score, reasons, context_snippet };
}

function generateSearchResults(matches: SearchMatch[], args: SearchFileAnalysisArgs): string {
  let results = `🔍 **999-X-Ray-Tool SEARCH RESULTS FOR: '${args.query}'**\n\n`;

  results += `Found ${matches.length} matches`;

  if (args.search_in && !args.search_in.includes('all')) {
    results += ` (searched in: ${args.search_in.join(', ')})`;
  }

  results += "\n\n";

  if (matches.length === 0) {
    results += "No matches found. Try a different search term or search fields.\n";
    return results;
  }

  matches.forEach((match, index) => {
    const file = match.file;
    results += `📄 **${file.name}** (Score: ${match.score})\n`;
    results += `   Path: \`${file.filepath}\`\n`;
    results += `   Language: ${file.language} | Size: ${file.size_human}\n`;
    results += `   Matched in: ${match.reasons.join(', ')}\n`;

    // Show context snippet for AI context matches
    if (match.context_snippet) {
      results += `   Context: ...${match.context_snippet}...\n`;
    }

    results += `   Modified: ${file.modified_at?.slice(0, 19) || 'Unknown'}\n`;

    if (index < matches.length - 1) {
      results += "\n";
    }
  });

  return results;
}