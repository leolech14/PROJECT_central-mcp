/**
 * 999-X-Ray-Tool: Get Analysis Statistics
 * ========================================
 *
 * MCP Tool for retrieving comprehensive statistics about file analysis
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  GetAnalysisStatsArgs,
  XRayToolResponse,
  AnalysisResults,
  AnalysisStats
} from '../types/ultrathink.js';

export const getAnalysisStatsTool = {
  name: "get_analysis_stats",
  description: "Get comprehensive statistics about file analysis including performance metrics",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

export async function handleGetAnalysisStats(
  args: GetAnalysisStatsArgs
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

    // Calculate comprehensive statistics
    const stats = calculateStats(analysisData);

    // Generate statistics report
    const report = generateStatsReport(stats);

    return {
      success: true,
      message: "999-X-Ray-Tool statistics generated successfully",
      data: {
        stats,
        report,
        analysis_file: analysisFile
      }
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to generate 999-X-Ray-Tool statistics",
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

function calculateStats(analysisData: AnalysisResults): AnalysisStats {
  const files = analysisData.files;
  const metadata = analysisData.metadata;

  // Basic stats
  const total_files = files.length;
  const total_size = files.reduce((sum, file) => sum + file.size_bytes, 0);
  const total_lines = files.reduce((sum, file) => sum + file.line_count, 0);
  const average_file_size = total_files > 0 ? Math.round(total_size / total_files) : 0;

  // Language distribution
  const languages: Record<string, number> = {};
  files.forEach(file => {
    languages[file.language] = (languages[file.language] || 0) + 1;
  });

  // File size distribution
  const size_ranges = {
    'Small (< 1KB)': 0,
    'Medium (1KB - 10KB)': 0,
    'Large (10KB - 100KB)': 0,
    'Very Large (> 100KB)': 0
  };

  files.forEach(file => {
    const size = file.size_bytes;
    if (size < 1024) {
      size_ranges['Small (< 1KB)']++;
    } else if (size < 10240) {
      size_ranges['Medium (1KB - 10KB)']++;
    } else if (size < 102400) {
      size_ranges['Large (10KB - 100KB)']++;
    } else {
      size_ranges['Very Large (> 100KB)']++;
    }
  });

  // Most recent files (top 5)
  const most_recent_files = files
    .filter(file => file.modified_at)
    .sort((a, b) => new Date(b.modified_at!).getTime() - new Date(a.modified_at!).getTime())
    .slice(0, 5)
    .map(file => ({
      name: file.name,
      modified_at: file.modified_at!,
      size_human: file.size_human
    }));

  return {
    total_files,
    total_size,
    total_lines,
    average_file_size,
    processing_time: metadata.processing_time_seconds,
    cache_hit_rate: parseFloat(metadata.cache_hit_rate) || 0,
    llm_calls: metadata.llm_calls,
    language_distribution: languages,
    size_distribution: size_ranges,
    most_recent_files
  };
}

function generateStatsReport(stats: AnalysisStats): string {
  let report = `📊 **999-X-Ray-Tool ANALYSIS STATISTICS**\n\n`;

  // Basic Stats
  report += `🔢 **Basic Stats:**\n`;
  report += `- Total files: ${stats.total_files.toLocaleString()}\n`;
  report += `- Total size: ${formatBytes(stats.total_size)}\n`;
  report += `- Total lines: ${stats.total_lines.toLocaleString()}\n`;
  report += `- Average file size: ${formatBytes(stats.average_file_size)}\n`;
  report += `- Analysis time: ${stats.processing_time.toFixed(2)} seconds\n`;
  report += `- Cache hit rate: ${stats.cache_hit_rate.toFixed(1)}%\n`;
  report += `- LLM calls made: ${stats.llm_calls}\n\n`;

  // Top Languages
  report += `🏷️ **Top Languages:**\n`;
  const sorted_languages = Object.entries(stats.language_distribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  sorted_languages.forEach(([lang, count]) => {
    const percentage = (count / stats.total_files * 100).toFixed(1);
    report += `- ${lang}: ${count.toLocaleString()} files (${percentage}%)\n`;
  });

  // File Size Distribution
  report += `\n📏 **File Size Distribution:**\n`;
  Object.entries(stats.size_distribution).forEach(([range, count]) => {
    const percentage = (count / stats.total_files * 100).toFixed(1);
    report += `- ${range}: ${count.toLocaleString()} files (${percentage}%)\n`;
  });

  // Most Recent Files
  report += `\n🕒 **Most Recent Files:**\n`;
  stats.most_recent_files.forEach((file, index) => {
    const modified = file.modified_at.slice(0, 19);
    report += `${index + 1}. ${modified} | ${file.name} (${file.size_human})\n`;
  });

  // Performance Metrics
  report += `\n⚡ **Performance Metrics:**\n`;
  const files_per_second = stats.total_files / stats.processing_time;
  report += `- Processing rate: ${files_per_second.toFixed(1)} files/second\n`;
  report += `- Average analysis time: ${(stats.processing_time / stats.total_files * 1000).toFixed(1)}ms/file\n`;

  if (stats.llm_calls > 0) {
    const avg_llm_time = stats.processing_time / stats.llm_calls;
    report += `- Average LLM processing time: ${avg_llm_time.toFixed(2)}s/call\n`;
  }

  report += `\n📅 **Analysis performed:** ${new Date().toISOString()}`;

  return report;
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(1)} ${sizes[i]}`;
}