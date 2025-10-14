/**
 * Read File on VM
 * ================
 *
 * MCP tool that allows connected agents to read files on the VM
 */

import { readFile } from 'fs/promises';
import { z } from 'zod';

export const readVMFileSchema = z.object({
  path: z.string().describe('Absolute path to file on VM'),
  encoding: z.enum(['utf8', 'base64']).optional().default('utf8').describe('File encoding')
});

export type ReadVMFileInput = z.infer<typeof readVMFileSchema>;

export interface ReadVMFileResult {
  content: string;
  path: string;
  size: number;
  encoding: string;
  readAt: number;
}

/**
 * Read file from VM filesystem
 */
export async function readVMFile(input: ReadVMFileInput): Promise<ReadVMFileResult> {
  const { path, encoding = 'utf8' } = input;

  try {
    const content = await readFile(path, encoding);
    const stats = await import('fs/promises').then(fs => fs.stat(path));

    return {
      content,
      path,
      size: stats.size,
      encoding,
      readAt: Date.now()
    };

  } catch (error: any) {
    throw new Error(`Failed to read file ${path}: ${error.message}`);
  }
}

