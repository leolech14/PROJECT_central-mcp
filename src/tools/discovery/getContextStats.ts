/**
 * Get Context Statistics Tool
 * ============================
 *
 * Get detailed statistics about context storage.
 */

import { ContextManager } from '../../core/ContextManager.js';
import Database from 'better-sqlite3';

export async function getContextStats(
  db: Database.Database
): Promise<{
  success: boolean;
  stats: {
    totalFiles: number;
    totalSize: string;
    totalCompressedSize: string;
    compressionRatio: string;
    storageProvider: string;
    byType: Record<string, { count: number; size: string }>;
    byProject: Record<string, { count: number; size: string }>;
  };
  message: string;
}> {
  try {
    const contextManager = new ContextManager(db);
    const stats = contextManager.getStatistics();

    // Format byte sizes for readability
    const byType: Record<string, { count: number; size: string }> = {};
    for (const [type, data] of Object.entries(stats.byType)) {
      byType[type] = {
        count: data.count,
        size: formatBytes(data.size)
      };
    }

    const byProject: Record<string, { count: number; size: string }> = {};
    for (const [project, data] of Object.entries(stats.byProject)) {
      byProject[project] = {
        count: data.count,
        size: formatBytes(data.size)
      };
    }

    return {
      success: true,
      stats: {
        totalFiles: stats.totalFiles,
        totalSize: formatBytes(stats.totalSize),
        totalCompressedSize: formatBytes(stats.totalCompressedSize),
        compressionRatio: `${stats.compressionRatio.toFixed(2)}x`,
        storageProvider: stats.storageProvider,
        byType,
        byProject
      },
      message: `Storage stats: ${stats.totalFiles} files, ${formatBytes(stats.totalSize)}`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      stats: {
        totalFiles: 0,
        totalSize: '0 B',
        totalCompressedSize: '0 B',
        compressionRatio: '0x',
        storageProvider: 'unknown',
        byType: {},
        byProject: {}
      },
      message: `Failed to get stats: ${errorMsg}`
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
