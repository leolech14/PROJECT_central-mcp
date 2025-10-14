/**
 * Capture Message MCP Tool
 * =========================
 *
 * Allows agents to send their conversation messages to Central-MCP
 * for permanent storage and intelligence extraction.
 *
 * This is how THIS conversation becomes part of the system!
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ConversationCapture } from '../../intelligence/ConversationCapture.js';
import Database from 'better-sqlite3';

export const captureMessageTool = {
  name: 'capture_user_message',
  description: 'Capture user message to Central-MCP intelligence system (auto-called on every user input)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      content: {
        type: 'string',
        description: 'The user message content to capture'
      },
      projectId: {
        type: 'string',
        description: 'Project ID (auto-detected if not provided)'
      }
    },
    required: ['content']
  }
};

export async function handleCaptureMessage(
  args: any,
  db: Database.Database
): Promise<any> {
  try {
    const { content, projectId, sessionId, agentLetter } = args;

    if (!content) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'content is required'
      );
    }

    const capture = new ConversationCapture(db.name);

    // Defaults
    const effectiveProjectId = projectId || 'PROJECT_central-mcp';
    const effectiveSessionId = sessionId || `sess_${Date.now()}`;
    const effectiveAgentLetter = agentLetter || 'SONNET-4.5';

    // Capture the message
    const message = capture.captureUserMessage(
      content,
      effectiveSessionId,
      effectiveProjectId,
      effectiveAgentLetter
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          messageId: message.id,
          captured: {
            inputMethod: message.inputMethod,
            language: message.language,
            wordCount: message.wordCount,
            semanticDensity: message.semanticDensity.toFixed(3)
          },
          message: `✅ Message captured! This conversation is now part of ${effectiveProjectId} intelligence.`
        }, null, 2)
      }]
    };

  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to capture message: ${error.message}`
    );
  }
}
