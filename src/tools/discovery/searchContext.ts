/**
 * Search Context Tool
 * ====================
 *
 * Search project context files with advanced filtering.
 */

import { ContextManager, SearchOptions } from '../../core/ContextManager.js';
import Database from 'better-sqlite3';

export interface SearchContextArgs {
  projectId?: string;
  type?: string;
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'modified' | 'size' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export async function searchContext(
  db: Database.Database,
  args: SearchContextArgs
): Promise<{
  success: boolean;
  files: Array<{
    id: string;
    projectId: string;
    relativePath: string;
    type: string;
    size: number;
    modifiedAt: string;
  }>;
  total: number;
  searchTime: number;
  fromCache: boolean;
  message: string;
}> {
  try {
    const contextManager = new ContextManager(db);

    const searchOptions: SearchOptions = {
      projectId: args.projectId,
      type: args.type as any,
      query: args.query,
      limit: args.limit || 20,
      offset: args.offset || 0,
      sortBy: args.sortBy || 'modified',
      sortOrder: args.sortOrder || 'desc'
    };

    const result = await contextManager.search(searchOptions);

    const files = result.files.map(f => ({
      id: f.id,
      projectId: f.projectId,
      relativePath: f.relativePath,
      type: f.type,
      size: f.size,
      modifiedAt: f.modifiedAt
    }));

    return {
      success: true,
      files,
      total: result.total,
      searchTime: result.searchTime,
      fromCache: result.fromCache,
      message: `Found ${result.total} files in ${result.searchTime}ms${result.fromCache ? ' (cached)' : ''}`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      files: [],
      total: 0,
      searchTime: 0,
      fromCache: false,
      message: `Search failed: ${errorMsg}`
    };
  }
}
