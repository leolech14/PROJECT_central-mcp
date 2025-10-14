/**
 * 999-X-Ray-Tool: Get File Summary
 * =================================
 *
 * MCP Tool for retrieving summaries of file analysis results
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  GetFileSummaryArgs,
  XRayToolResponse,
  AnalysisResults,
  FileMetadata
} from '../types/ultrathink.js';

export const getFileSummaryTool = {
  name: "get_file_summary",
  description: "Get a summary of the last file analysis results with filtering and sorting",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "integer",
        description: "Number of files to include in summary (default: 10)",
        default: 10,
        minimum: 1,
        maximum: 100
      },
      filter_by_language: {
        type: "string",
        description: "Filter results by programming language (optional)",
        default: null
      },
      sort_by: {
        type: "string",
        enum: ["modified_at", "size_bytes", "name", "language"],
        description: "Sort results by field (default: modified_at)",
        default: "modified_at"
      }
    }
  }
};

export async function handleGetFileSummary(
  args: GetFileSummaryArgs
): Promise<XRayToolResponse> {
  try {
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

    // Filter and sort the results
    let filteredFiles = analysisData.files;

    // Apply language filter
    if (args.filter_by_language) {
      filteredFiles = filteredFiles.filter(file =>
        file.language.toLowerCase() === args.filter_by_language!.toLowerCase()
      );
    }

    // Sort results
    const sortField = args.sort_by || 'modified_at';
    const reverse = sortField === 'modified_at'; // Descending for time
    filteredFiles.sort((a, b) => {
      const aValue = (a as any)[sortField];
      const bValue = (b as any)[sortField];

      if (reverse) {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Limit results
    const limitedFiles = filteredFiles.slice(0, args.limit || 10);

    // Generate summary response
    const summary = generateSummary(limitedFiles, analysisData.metadata, args);

    return {
      success: true,
      message: `999-X-Ray-Tool file summary generated successfully`,
      data: {
        summary,
        files: limitedFiles,
        total_available: filteredFiles.length,
        analysis_file: analysisFile
      }
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to generate 999-X-Ray-Tool file summary",
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

function generateSummary(
  files: FileMetadata[],
  metadata: AnalysisResults,
  args: GetFileSummaryArgs
): string {
  let summary = `📋 **999-X-Ray-Tool FILE ANALYSIS SUMMARY**\n\n`;

  summary += `Showing ${files.length} files`;
  if (args.filter_by_language) {
    summary += ` (filtered by: ${args.filter_by_language})`;
  }
  summary += ` (sorted by: ${args.sort_by})\n\n`;

  if (files.length === 0) {
    summary += "No files match the specified criteria.\n";
    return summary;
  }

  // Language distribution
  const languages: Record<string, number> = {};
  files.forEach(file => {
    languages[file.language] = (languages[file.language] || 0) + 1;
  });

  summary += `🏷️ **Languages in this selection:**\n`;
  Object.entries(languages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([lang, count]) => {
      const percentage = (count / files.length * 100).toFixed(1);
      summary += `- ${lang}: ${count} files (${percentage}%)\n`;
    });

  summary += `\n`;

  // File details
  files.forEach((file, index) => {
    summary += `📄 **${file.name}**\n`;
    summary += `   Path: \`${file.filepath}\`\n`;
    summary += `   Language: ${file.language} | Size: ${file.size_human}\n`;
    summary += `   Modified: ${file.modified_at?.slice(0, 19) || 'Unknown'}\n`;
    summary += `   Lines: ${file.line_count}\n`;

    // Include AI context preview
    if (file.ai_context) {
      const preview = file.ai_context.length > 200
        ? file.ai_context.slice(0, 200) + "..."
        : file.ai_context;
      summary += `   AI Context: ${preview}\n`;
    }

    if (index < files.length - 1) {
      summary += "\n";
    }
  });

  return summary;
}