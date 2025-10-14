/**
 * Upload Context Tool
 * ====================
 *
 * Upload project context files to cloud storage.
 */

import { ContextManager } from '../../core/ContextManager.js';
import { ContextExtractor } from '../../discovery/ContextExtractor.js';
import Database from 'better-sqlite3';

export interface UploadContextArgs {
  projectId: string;
  compress?: boolean;
  types?: string[]; // Optional filter by file types
}

export async function uploadContext(
  db: Database.Database,
  args: UploadContextArgs
): Promise<{
  success: boolean;
  uploaded: number;
  failed: number;
  totalSize: number;
  compressedSize: number;
  uploadTime: number;
  message: string;
}> {
  const { projectId, compress = true, types } = args;

  try {
    const contextManager = new ContextManager(db);
    const contextExtractor = new ContextExtractor(db);

    // Get context files for project
    let files = contextExtractor.getContextFiles(projectId);

    if (!files || files.length === 0) {
      return {
        success: false,
        uploaded: 0,
        failed: 0,
        totalSize: 0,
        compressedSize: 0,
        uploadTime: 0,
        message: `No context files found for project: ${projectId}`
      };
    }

    // Filter by types if specified
    if (types && types.length > 0) {
      files = files.filter(f => types.includes(f.type));
    }

    // Upload all files
    const startTime = Date.now();
    const results = await contextManager.uploadBatch(files, compress);
    const uploadTime = Date.now() - startTime;

    // Calculate stats
    const uploaded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const compressedSize = results.reduce((sum, r) => sum + (r.compressedSize || r.originalSize), 0);

    return {
      success: true,
      uploaded,
      failed,
      totalSize,
      compressedSize,
      uploadTime,
      message: `Uploaded ${uploaded} files (${failed} failed) in ${(uploadTime / 1000).toFixed(1)}s`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      uploaded: 0,
      failed: 0,
      totalSize: 0,
      compressedSize: 0,
      uploadTime: 0,
      message: `Upload failed: ${errorMsg}`
    };
  }
}
