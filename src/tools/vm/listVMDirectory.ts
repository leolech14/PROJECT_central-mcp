/**
 * List VM Directory
 * ==================
 *
 * MCP tool that allows connected agents to list directory contents on the VM
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

export const listVMDirectorySchema = z.object({
  path: z.string().describe('Absolute path to directory on VM'),
  recursive: z.boolean().optional().default(false).describe('List recursively'),
  includeHidden: z.boolean().optional().default(false).describe('Include hidden files')
});

export type ListVMDirectoryInput = z.infer<typeof listVMDirectorySchema>;

export interface VMFileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modified: number;
}

export interface ListVMDirectoryResult {
  path: string;
  files: VMFileInfo[];
  totalFiles: number;
  totalDirectories: number;
  listedAt: number;
}

/**
 * List directory contents on VM
 */
export async function listVMDirectory(input: ListVMDirectoryInput): Promise<ListVMDirectoryResult> {
  const { path, recursive = false, includeHidden = false } = input;

  try {
    const files: VMFileInfo[] = [];

    await listDir(path, files, recursive, includeHidden);

    const totalFiles = files.filter(f => f.type === 'file').length;
    const totalDirectories = files.filter(f => f.type === 'directory').length;

    return {
      path,
      files,
      totalFiles,
      totalDirectories,
      listedAt: Date.now()
    };

  } catch (error: any) {
    throw new Error(`Failed to list directory ${path}: ${error.message}`);
  }
}

async function listDir(
  dirPath: string,
  files: VMFileInfo[],
  recursive: boolean,
  includeHidden: boolean
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    // Skip hidden files if not included
    if (!includeHidden && entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = join(dirPath, entry.name);
    const stats = await stat(fullPath);

    const fileInfo: VMFileInfo = {
      name: entry.name,
      path: fullPath,
      type: entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file',
      size: stats.size,
      modified: stats.mtimeMs
    };

    files.push(fileInfo);

    // Recurse into subdirectories
    if (recursive && entry.isDirectory()) {
      await listDir(fullPath, files, recursive, includeHidden);
    }
  }
}

