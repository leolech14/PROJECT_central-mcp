/**
 * analyze_project - Mr. Fix My Project Please Integration
 *
 * Runs comprehensive ULTRATHINK analysis on any project:
 * - Dependency mapping with Mermaid diagrams
 * - GPT-4O purpose discovery
 * - Sniper Gun entity extraction
 * - Ripple effect analysis
 * - Interactive HTML report generation
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

const AnalyzeProjectArgsSchema = z.object({
  projectPath: z.string().optional(),
  htmlOnly: z.boolean().optional(),
  outputPath: z.string().optional()
});

export const analyzeProjectTool = {
  name: 'analyze_project',
  description: 'Run ULTRATHINK analysis on a project using Mr. Fix My Project Please. Generates comprehensive HTML report with dependency maps, GPT-4O purpose discovery, entity extraction, and interactive visualizations.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to project to analyze (defaults to current directory)'
      },
      htmlOnly: {
        type: 'boolean',
        description: 'Generate HTML report only (faster, skips some analysis)'
      },
      outputPath: {
        type: 'string',
        description: 'Custom output path for HTML report'
      }
    },
    required: []
  }
};

export async function handleAnalyzeProject(args: unknown, db: Database.Database) {
  const parsed = AnalyzeProjectArgsSchema.parse(args);
  const projectPath = parsed.projectPath || process.cwd();
  const htmlOnly = parsed.htmlOnly || false;

  try {
    logger.info(`🚀 Starting ULTRATHINK analysis for: ${projectPath}`);

    // Path to mr-fix-my-project-please.py
    const analyzerPath = path.join('/Users/lech/PROJECTS_all/LocalBrain', 'mr-fix-my-project-please.py');

    // Build command
    const flags = htmlOnly ? '--html-only' : '';
    const command = `python3 "${analyzerPath}" "${projectPath}" ${flags}`;

    logger.info(`📊 Executing: ${command}`);

    // Execute analysis (with 5 minute timeout for large projects)
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectPath,
      timeout: 300000, // 5 minutes
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    // Parse output to find HTML report path
    const htmlMatch = stdout.match(/Complete analysis saved to: (.+\.html)/);
    const htmlPath = htmlMatch ? htmlMatch[1] : 'Unknown';

    // Extract statistics
    const filesMatch = stdout.match(/Found (\d+) files/);
    const dirsMatch = stdout.match(/(\d+) directories/);
    const purposeMatch = stdout.match(/GPT-4O analysis complete: (.+)/);

    const totalFiles = filesMatch ? parseInt(filesMatch[1]) : 0;
    const totalDirs = dirsMatch ? parseInt(dirsMatch[1]) : 0;
    const projectPurpose = purposeMatch ? purposeMatch[1] : 'Unknown';

    // Log to central-mcp database for tracking
    const timestamp = new Date().toISOString();
    try {
      const insertStmt = db.prepare(`
        INSERT INTO project_analyses (project_path, timestamp, total_files, total_dirs, purpose, html_report_path)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_path) DO UPDATE SET
          timestamp = ?,
          total_files = ?,
          total_dirs = ?,
          purpose = ?,
          html_report_path = ?
      `);

      insertStmt.run(
        projectPath, timestamp, totalFiles, totalDirs, projectPurpose, htmlPath,
        timestamp, totalFiles, totalDirs, projectPurpose, htmlPath
      );
    } catch (dbError) {
      // Table might not exist yet - that's okay, create it
      logger.warn('Creating project_analyses table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS project_analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_path TEXT UNIQUE NOT NULL,
          timestamp TEXT NOT NULL,
          total_files INTEGER,
          total_dirs INTEGER,
          purpose TEXT,
          html_report_path TEXT
        )
      `);

      const insertStmt = db.prepare(`
        INSERT INTO project_analyses (project_path, timestamp, total_files, total_dirs, purpose, html_report_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(projectPath, timestamp, totalFiles, totalDirs, projectPurpose, htmlPath);
    }

    logger.info(`✅ ULTRATHINK analysis complete: ${htmlPath}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          project_path: projectPath,
          html_report: htmlPath,
          statistics: {
            total_files: totalFiles,
            total_directories: totalDirs,
            project_purpose: projectPurpose
          },
          features: [
            '🚀 ULTRATHINK Dependency Maps (5 Mermaid diagrams)',
            '🔬 GPT-4O Purpose Discovery',
            '🔫 Sniper Gun Entity Extraction',
            '🌊 Ripple Effect Analysis',
            '📊 Interactive HTML Report',
            '🌙 Dark Theme Mermaid Diagrams',
            '🔍 Right-Click Zoom Mode',
            '📚 MEGALITH INDEX Navigation'
          ],
          stdout: stdout.trim(),
          stderr: stderr ? stderr.trim() : null
        }, null, 2)
      }]
    };

  } catch (error: any) {
    logger.error(`❌ ULTRATHINK analysis failed:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          stderr: error.stderr || null,
          stdout: error.stdout || null,
          project_path: projectPath
        }, null, 2)
      }],
      isError: true
    };
  }
}
