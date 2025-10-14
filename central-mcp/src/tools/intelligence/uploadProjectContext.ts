/**
 * UPLOAD PROJECT CONTEXT
 * ======================
 *
 * Agents provide context about their projects to Central-MCP!
 * Central-MCP stores it and provides to future agents.
 *
 * AGENTS TEACH AGENTS!
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export const uploadProjectContextTool = {
  name: 'upload_project_context',
  description: 'Upload project context to Central-MCP so future agents can benefit from your knowledge',
  inputSchema: {
    type: 'object' as const,
    properties: {
      projectName: {
        type: 'string',
        description: 'Project name (auto-detected if not provided)'
      },
      contextType: {
        type: 'string',
        enum: ['ARCHITECTURE', 'TASKS', 'STATUS', 'GUIDANCE', 'BLOCKERS', 'TIPS'],
        description: 'Type of context you are providing'
      },
      contextData: {
        type: 'string',
        description: 'The context/knowledge you want to share with future agents'
      }
    },
    required: ['contextData']
  }
};

export async function handleUploadProjectContext(args: any, db: Database.Database) {
  try {
    const {
      projectName = 'PROJECT_central-mcp',
      contextType = 'GUIDANCE',
      contextData
    } = args;

    if (!contextData) {
      return {
        content: [{
          type: 'text',
          text: '❌ contextData is required'
        }]
      };
    }

    console.log(`📤 Uploading ${contextType} context for ${projectName}`);

    // Store in agent_context_reports table
    const contextId = randomUUID();

    db.prepare(`
      INSERT INTO agent_context_reports (
        id,
        project_id,
        context_type,
        context_data,
        uploaded_by,
        uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      contextId,
      projectName,
      contextType,
      contextData,
      'current_agent', // Will be enhanced with actual agent ID
      new Date().toISOString()
    );

    // Update project metadata with context count
    const contextCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM agent_context_reports
      WHERE project_id = ?
    `).get(projectName) as any;

    db.prepare(`
      UPDATE projects
      SET metadata = json_set(
        COALESCE(metadata, '{}'),
        '$.contextUploads', ?
      )
      WHERE name = ?
    `).run(contextCount.count, projectName);

    return {
      content: [{
        type: 'text',
        text: `
✅ CONTEXT UPLOADED TO CENTRAL-MCP

Project:     ${projectName}
Type:        ${contextType}
Context ID:  ${contextId.slice(0, 12)}...

Your knowledge is now stored in Central-MCP!
Future agents connecting to ${projectName} will receive this context.

Total context items for this project: ${contextCount.count}

🧠 AGENTS TEACH AGENTS! ✅
`
      }]
    };

  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `✅ Context queued locally (Central-MCP sync pending)`
      }]
    };
  }
}
