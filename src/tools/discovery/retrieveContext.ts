/**
 * Retrieve Context Tool
 * ======================
 *
 * Retrieve context files by project and type.
 */

import { ContextManager } from '../../core/ContextManager.js';
import { ContextFileType } from '../../discovery/ContextExtractor.js';
import Database from 'better-sqlite3';

export interface RetrieveContextArgs {
  projectId: string;
  type?: string; // Optional filter by type
}

export async function retrieveContext(
  db: Database.Database,
  args: RetrieveContextArgs
): Promise<{
  success: boolean;
  files: Array<{
    id: string;
    relativePath: string;
    type: string;
    size: number;
    modifiedAt: string;
  }>;
  count: number;
  totalSize: number;
  message: string;
}> {
  try {
    const contextManager = new ContextManager(db);

    const files = contextManager.getContextByProject(
      args.projectId,
      args.type as ContextFileType
    );

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    const fileList = files.map(f => ({
      id: f.id,
      relativePath: f.relativePath,
      type: f.type,
      size: f.size,
      modifiedAt: f.modifiedAt
    }));

    return {
      success: true,
      files: fileList,
      count: files.length,
      totalSize,
      message: `Retrieved ${files.length} files (${formatBytes(totalSize)})`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      files: [],
      count: 0,
      totalSize: 0,
      message: `Retrieval failed: ${errorMsg}`
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
