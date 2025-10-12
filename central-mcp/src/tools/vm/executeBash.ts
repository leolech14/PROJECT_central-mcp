/**
 * Execute Bash Command on VM
 * ===========================
 *
 * MCP tool that allows connected agents to execute bash commands on the VM
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execAsync = promisify(exec);

export const executeBashSchema = z.object({
  command: z.string().describe('Bash command to execute on VM'),
  cwd: z.string().optional().describe('Working directory (optional)'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 30000)')
});

export type ExecuteBashInput = z.infer<typeof executeBashSchema>;

export interface ExecuteBashResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  executedAt: number;
}

/**
 * Execute bash command on VM
 */
export async function executeBash(input: ExecuteBashInput): Promise<ExecuteBashResult> {
  const { command, cwd, timeout = 30000 } = input;

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
      command,
      executedAt: startTime
    };

  } catch (error: any) {
    return {
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message,
      exitCode: error.code || 1,
      command,
      executedAt: startTime
    };
  }
}

