/**
 * Write File on VM
 * =================
 *
 * MCP tool that allows connected agents to write files on the VM
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { z } from 'zod';

export const writeVMFileSchema = z.object({
  path: z.string().describe('Absolute path to file on VM'),
  content: z.string().describe('File content to write'),
  encoding: z.enum(['utf8', 'base64']).optional().default('utf8').describe('File encoding'),
  createDir: z.boolean().optional().default(true).describe('Create parent directories if needed')
});

export type WriteVMFileInput = z.infer<typeof writeVMFileSchema>;

export interface WriteVMFileResult {
  path: string;
  size: number;
  encoding: string;
  writtenAt: number;
}

/**
 * Write file to VM filesystem
 */
export async function writeVMFile(input: WriteVMFileInput): Promise<WriteVMFileResult> {
  const { path, content, encoding = 'utf8', createDir = true } = input;

  try {
    // Create parent directories if needed
    if (createDir) {
      const dir = dirname(path);
      await mkdir(dir, { recursive: true });
    }

    // Write file
    await writeFile(path, content, encoding);

    // Get file size
    const stats = await import('fs/promises').then(fs => fs.stat(path));

    return {
      path,
      size: stats.size,
      encoding,
      writtenAt: Date.now()
    };

  } catch (error: any) {
    throw new Error(`Failed to write file ${path}: ${error.message}`);
  }
}

