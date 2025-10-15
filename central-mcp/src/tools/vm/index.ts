/**
 * VM Access Tools
 * ===============
 *
 * MCP tools that allow connected agents to access VM resources:
 * - Execute bash commands
 * - Read/write files
 * - List directories
 */

import { executeBash, executeBashSchema } from './executeBash.js';
import { readVMFile, readVMFileSchema } from './readVMFile.js';
import { writeVMFile, writeVMFileSchema } from './writeVMFile.js';
import { listVMDirectory, listVMDirectorySchema } from './listVMDirectory.js';

export { executeBash, executeBashSchema } from './executeBash.js';
export { readVMFile, readVMFileSchema } from './readVMFile.js';
export { writeVMFile, writeVMFileSchema } from './writeVMFile.js';
export { listVMDirectory, listVMDirectorySchema } from './listVMDirectory.js';

export type { ExecuteBashInput, ExecuteBashResult } from './executeBash.js';
export type { ReadVMFileInput, ReadVMFileResult } from './readVMFile.js';
export type { WriteVMFileInput, WriteVMFileResult } from './writeVMFile.js';
export type { ListVMDirectoryInput, ListVMDirectoryResult, VMFileInfo } from './listVMDirectory.js';

/**
 * All VM access tools for MCP server registration
 */
export function getVMTools() {
  return [
    {
      name: 'executeBash',
      description: 'Execute a bash command on the VM. Allows agents to run terminal commands remotely.',
      inputSchema: executeBashSchema,
      handler: executeBash
    },
    {
      name: 'readVMFile',
      description: 'Read a file from the VM filesystem. Allows agents to access VM files remotely.',
      inputSchema: readVMFileSchema,
      handler: readVMFile
    },
    {
      name: 'writeVMFile',
      description: 'Write a file to the VM filesystem. Allows agents to create/modify VM files remotely.',
      inputSchema: writeVMFileSchema,
      handler: writeVMFile
    },
    {
      name: 'listVMDirectory',
      description: 'List contents of a directory on the VM. Allows agents to explore VM filesystem.',
      inputSchema: listVMDirectorySchema,
      handler: listVMDirectory
    }
  ];
}
