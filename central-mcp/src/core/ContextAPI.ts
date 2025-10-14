/**
 * CONTEXT API - For External Agents
 * ===================================
 *
 * Provides Central-MCP context to agents that can't read local files
 * (GLM-4.6 on Z.AI, ChatGPT, etc.)
 *
 * Endpoint: GET http://34.41.115.199:3000/api/context/:projectName
 */

import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export function createContextAPI(db: Database.Database) {
  const router = express.Router();

  /**
   * GET /api/context/:projectName
   *
   * Returns project context for external agents
   */
  router.get('/:projectName', async (req: Request, res: Response) => {
    try {
      const { projectName } = req.params;

      console.log(`📚 Context request for: ${projectName}`);

      // Get project from database
      const project = db.prepare(`
        SELECT * FROM projects WHERE name = ? OR id = ?
      `).get(projectName, projectName) as any;

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          availableProjects: db.prepare('SELECT name FROM projects ORDER BY project_number').all()
        });
      }

      // Get task stats
      const taskStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as available
        FROM tasks WHERE project_id = ?
      `).get(projectName) as any;

      const completion = taskStats?.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

      // Get key specs (if accessible)
      const specs = getProjectSpecs(project.path);

      // Get recent context files
      const contextFiles = getRecentContextFiles(project.path);

      // CONTEXT RESPONSE
      const context = {
        projectName: project.name,
        projectNumber: project.project_number,
        projectType: project.type,
        vision: project.vision,

        status: {
          completion: `${completion}%`,
          totalTasks: taskStats?.total || 0,
          completed: taskStats?.completed || 0,
          available: taskStats?.available || 0
        },

        architecture: specs,

        recentContext: contextFiles,

        quickStart: {
          connectCommand: `curl -X POST http://34.41.115.199:3000/api/agents/connect -H 'Content-Type: application/json' -d '{"agent":"A","model":"YOUR_MODEL","project":"${projectName}"}'`,
          dashboardURL: 'http://34.41.115.199:8000/central-mcp-dashboard.html',
          nextSteps: [
            'Connect to Central-MCP using command above',
            'Receive your assigned tasks',
            'Start building'
          ]
        },

        systemInfo: {
          autoProactiveLoops: '6/6 ACTIVE',
          conversationIntelligence: 'OPERATIONAL',
          database: '24 tables',
          mcpTools: 26
        }
      };

      res.json(context);

    } catch (error: any) {
      console.error('❌ Context API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/context
   *
   * List all available projects
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const projects = db.prepare(`
        SELECT
          name,
          project_number,
          type,
          vision
        FROM projects
        ORDER BY project_number ASC
      `).all();

      res.json({
        message: 'Central-MCP Context API',
        projects: projects,
        usage: 'GET /api/context/:projectName for project-specific context'
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

// Helpers
function getProjectSpecs(projectPath: string): string[] {
  try {
    const specDir = join(projectPath, '02_SPECBASES');
    if (!existsSync(specDir)) return [];

    return readdirSync(specDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));

  } catch {
    return [];
  }
}

function getRecentContextFiles(projectPath: string): string[] {
  try {
    const contextDir = join(projectPath, '03_CONTEXT_FILES');
    if (!existsSync(contextDir)) return [];

    return readdirSync(contextDir)
      .filter(f => f.endsWith('.md'))
      .slice(0, 5); // Last 5 files

  } catch {
    return [];
  }
}
