/**
 * Context Management MCP Tools
 * =============================
 *
 * MCP tool wrappers for context management operations.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { uploadContext, UploadContextArgs } from './uploadContext.js';
import { searchContext, SearchContextArgs } from './searchContext.js';
import { retrieveContext, RetrieveContextArgs } from './retrieveContext.js';
import { getContextStats } from './getContextStats.js';

// ═══════════════════════════════════════════════════════════
// UPLOAD CONTEXT TOOL
// ═══════════════════════════════════════════════════════════

export const uploadContextTool: Tool = {
  name: 'uploadContext',
  description: 'Upload project context files to cloud storage with optional compression',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to upload context for'
      },
      compress: {
        type: 'boolean',
        description: 'Whether to compress files (default: true)',
        default: true
      },
      types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional filter by file types (SPEC, DOC, CODE, ARCHITECTURE, STATUS, CONFIG, ASSET)'
      }
    },
    required: ['projectId']
  }
};

export async function handleUploadContext(args: unknown, db: Database.Database) {
  const result = await uploadContext(db, args as UploadContextArgs);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

// ═══════════════════════════════════════════════════════════
// SEARCH CONTEXT TOOL
// ═══════════════════════════════════════════════════════════

export const searchContextTool: Tool = {
  name: 'searchContext',
  description: 'Search project context files with advanced filtering and sorting',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to search in (optional, searches all projects if not specified)'
      },
      type: {
        type: 'string',
        description: 'Filter by file type (SPEC, DOC, CODE, ARCHITECTURE, STATUS, CONFIG, ASSET)'
      },
      query: {
        type: 'string',
        description: 'Search query for filename/path matching'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 20)',
        default: 20
      },
      offset: {
        type: 'number',
        description: 'Offset for pagination (default: 0)',
        default: 0
      },
      sortBy: {
        type: 'string',
        enum: ['modified', 'size', 'relevance'],
        description: 'Sort field (default: modified)',
        default: 'modified'
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order (default: desc)',
        default: 'desc'
      }
    }
  }
};

export async function handleSearchContext(args: unknown, db: Database.Database) {
  const result = await searchContext(db, args as SearchContextArgs);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

// ═══════════════════════════════════════════════════════════
// RETRIEVE CONTEXT TOOL
// ═══════════════════════════════════════════════════════════

export const retrieveContextTool: Tool = {
  name: 'retrieveContext',
  description: 'Retrieve all context files for a project, optionally filtered by type',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to retrieve context for'
      },
      type: {
        type: 'string',
        description: 'Optional filter by file type (SPEC, DOC, CODE, ARCHITECTURE, STATUS, CONFIG, ASSET)'
      }
    },
    required: ['projectId']
  }
};

export async function handleRetrieveContext(args: unknown, db: Database.Database) {
  const result = await retrieveContext(db, args as RetrieveContextArgs);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

// ═══════════════════════════════════════════════════════════
// GET CONTEXT STATS TOOL
// ═══════════════════════════════════════════════════════════

export const getContextStatsTool: Tool = {
  name: 'getContextStats',
  description: 'Get detailed statistics about context storage across all projects',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

export async function handleGetContextStats(args: unknown, db: Database.Database) {
  const result = await getContextStats(db);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}
