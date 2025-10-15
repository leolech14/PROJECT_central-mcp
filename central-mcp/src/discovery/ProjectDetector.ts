/**
 * Project Auto-Detector
 * =====================
 *
 * Automatically detects and registers projects from agent's environment.
 *
 * Features:
 * - Detects project from git remote
 * - Detects project from directory path
 * - Auto-registers new projects
 * - Classifies project type
 * - Extracts vision from CLAUDE.md
 *
 * T001 - CRITICAL PATH - DISCOVERY ENGINE FOUNDATION
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  path: string;
  gitRemote: string | null;
  type: ProjectType;
  vision: string | null;
  createdAt: string;
  lastActivity: string;
  discoveredBy: 'auto' | 'manual';
  metadata: ProjectMetadata;
}

export type ProjectType =
  | 'COMMERCIAL_APP'
  | 'KNOWLEDGE_SYSTEM'
  | 'TOOL'
  | 'INFRASTRUCTURE'
  | 'EXPERIMENTAL'
  | 'UNKNOWN';

export interface ProjectMetadata {
  hasClaudeMd: boolean;
  hasPackageJson: boolean;
  hasSpecBase: boolean;
  hasCodebase: boolean;
  hasTaskRegistry: boolean;
  technologies: string[];
  estimatedSize: 'small' | 'medium' | 'large';
}

export class ProjectDetector {
  constructor(private db: Database.Database) {}

  /**
   * Detect project from current directory
   */
  async detectProject(cwd: string): Promise<Project> {
    console.log(`🔍 Detecting project from: ${cwd}`);

    // 1. Try to find by git remote first
    const gitRemote = this.getGitRemote(cwd);
    if (gitRemote) {
      const existingProject = this.findProjectByGitRemote(gitRemote);
      if (existingProject) {
        console.log(`✅ Found existing project: ${existingProject.name} (by git remote)`);
        return this.updateLastActivity(existingProject);
      }
    }

    // 2. Try to find by path
    const existingProject = this.findProjectByPath(cwd);
    if (existingProject) {
      console.log(`✅ Found existing project: ${existingProject.name} (by path)`);
      return this.updateLastActivity(existingProject);
    }

    // 3. Not found - create new project
    console.log(`🆕 New project detected, auto-registering...`);
    return this.createNewProject(cwd, gitRemote);
  }

  /**
   * Get git remote URL from directory
   */
  private getGitRemote(cwd: string): string | null {
    try {
      const remote = execSync('git remote get-url origin', {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      // Normalize remote URL
      return this.normalizeGitRemote(remote);
    } catch (error) {
      // Not a git repository or no remote
      return null;
    }
  }

  /**
   * Normalize git remote URL for consistent matching
   */
  private normalizeGitRemote(remote: string): string {
    // Remove .git suffix
    remote = remote.replace(/\.git$/, '');

    // Convert SSH to HTTPS format for consistency
    // git@github.com:user/repo → https://github.com/user/repo
    remote = remote.replace(/^git@([^:]+):(.+)$/, 'https://$1/$2');

    return remote;
  }

  /**
   * Find project by git remote
   */
  private findProjectByGitRemote(gitRemote: string): Project | null {
    const row = this.db.prepare(`
      SELECT * FROM projects WHERE git_remote = ?
    `).get(gitRemote) as any;

    return row ? this.rowToProject(row) : null;
  }

  /**
   * Find project by path
   */
  private findProjectByPath(projectPath: string): Project | null {
    const row = this.db.prepare(`
      SELECT * FROM projects WHERE path = ?
    `).get(projectPath) as any;

    return row ? this.rowToProject(row) : null;
  }

  /**
   * Create new project from detection
   */
  private createNewProject(cwd: string, gitRemote: string | null): Project {
    const projectName = path.basename(cwd);
    const metadata = this.detectMetadata(cwd);
    const projectType = this.classifyProjectType(cwd, metadata);
    const vision = this.extractVision(cwd);

    const project: Project = {
      id: uuidv4(),
      name: projectName,
      path: cwd,
      gitRemote,
      type: projectType,
      vision,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      discoveredBy: 'auto',
      metadata
    };

    // Insert into database
    this.db.prepare(`
      INSERT INTO projects (
        id, name, path, git_remote, type, vision,
        created_at, last_activity, discovered_by, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      project.id,
      project.name,
      project.path,
      project.gitRemote,
      project.type,
      project.vision,
      project.createdAt,
      project.lastActivity,
      project.discoveredBy,
      JSON.stringify(project.metadata)
    );

    console.log(`✅ Project registered: ${project.name} (${project.type})`);

    return project;
  }

  /**
   * Detect project metadata
   */
  private detectMetadata(cwd: string): ProjectMetadata {
    const metadata: ProjectMetadata = {
      hasClaudeMd: existsSync(path.join(cwd, 'CLAUDE.md')),
      hasPackageJson: existsSync(path.join(cwd, 'package.json')),
      hasSpecBase: existsSync(path.join(cwd, '02_SPECBASES')),
      hasCodebase: existsSync(path.join(cwd, '01_CODEBASES')),
      hasTaskRegistry: existsSync(path.join(cwd, '04_AGENT_FRAMEWORK/CENTRAL_TASK_REGISTRY.md')),
      technologies: this.detectTechnologies(cwd),
      estimatedSize: this.estimateSize(cwd)
    };

    return metadata;
  }

  /**
   * Classify project type
   */
  private classifyProjectType(cwd: string, metadata: ProjectMetadata): ProjectType {
    // Check CLAUDE.md for explicit type
    const claudeMd = this.readClaudeMd(cwd);
    if (claudeMd) {
      if (claudeMd.includes('COMMERCIAL_APP') || claudeMd.includes('Commercial App')) {
        return 'COMMERCIAL_APP';
      }
      if (claudeMd.includes('KNOWLEDGE_SYSTEM') || claudeMd.includes('Knowledge System')) {
        return 'KNOWLEDGE_SYSTEM';
      }
      if (claudeMd.includes('TOOL') || claudeMd.includes('Internal Tool')) {
        return 'TOOL';
      }
      if (claudeMd.includes('INFRASTRUCTURE')) {
        return 'INFRASTRUCTURE';
      }
      if (claudeMd.includes('EXPERIMENTAL')) {
        return 'EXPERIMENTAL';
      }
    }

    // Infer from structure
    if (metadata.hasSpecBase && metadata.hasCodebase) {
      return 'COMMERCIAL_APP'; // Full 6-layer architecture
    }

    if (cwd.includes('PROJECT_') && cwd.includes('KNOWLEDGE')) {
      return 'KNOWLEDGE_SYSTEM';
    }

    if (metadata.hasCodebase && !metadata.hasSpecBase) {
      return 'TOOL'; // Code without specs = utility tool
    }

    if (cwd.includes('mcp-server') || cwd.includes('infrastructure')) {
      return 'INFRASTRUCTURE';
    }

    return 'UNKNOWN';
  }

  /**
   * Extract vision from CLAUDE.md
   */
  private extractVision(cwd: string): string | null {
    const claudeMd = this.readClaudeMd(cwd);
    if (!claudeMd) return null;

    // Extract first section or overview
    const lines = claudeMd.split('\n');
    let vision = '';
    let inVisionSection = false;

    for (const line of lines) {
      if (line.startsWith('# ') || line.startsWith('## Project Overview') || line.startsWith('## 🎯')) {
        inVisionSection = true;
        continue;
      }

      if (inVisionSection && line.startsWith('##')) {
        break; // End of vision section
      }

      if (inVisionSection && line.trim()) {
        vision += line + '\n';
      }

      if (vision.length > 500) break; // Limit to 500 chars
    }

    return vision.trim() || null;
  }

  /**
   * Read CLAUDE.md file
   */
  private readClaudeMd(cwd: string): string | null {
    const claudePath = path.join(cwd, 'CLAUDE.md');
    if (!existsSync(claudePath)) return null;

    try {
      return readFileSync(claudePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect technologies used in project
   */
  private detectTechnologies(cwd: string): string[] {
    const technologies: Set<string> = new Set();

    // Check package.json
    const packagePath = path.join(cwd, 'package.json');
    if (existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps['react']) technologies.add('React');
        if (deps['next']) technologies.add('Next.js');
        if (deps['vue']) technologies.add('Vue');
        if (deps['typescript']) technologies.add('TypeScript');
        if (deps['@modelcontextprotocol/sdk']) technologies.add('MCP');
        if (deps['better-sqlite3']) technologies.add('SQLite');
        if (deps['postgres'] || deps['pg']) technologies.add('PostgreSQL');
      } catch (error) {
        // Invalid package.json
      }
    }

    // Check for Swift
    try {
      const xcodeproj = execSync('find . -maxdepth 2 -name "*.xcodeproj" -type d', {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      if (xcodeproj) {
        technologies.add('Swift');
        technologies.add('macOS');
      }
    } catch (error) {
      // No Xcode project
    }

    // Check for Python
    if (existsSync(path.join(cwd, 'requirements.txt')) || existsSync(path.join(cwd, 'setup.py'))) {
      technologies.add('Python');
    }

    return Array.from(technologies);
  }

  /**
   * Estimate project size
   */
  private estimateSize(cwd: string): 'small' | 'medium' | 'large' {
    try {
      // Count files
      const fileCount = execSync('find . -type f | wc -l', {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      const count = parseInt(fileCount, 10);

      if (count < 100) return 'small';
      if (count < 500) return 'medium';
      return 'large';
    } catch (error) {
      return 'medium';
    }
  }

  /**
   * Update project last activity
   */
  private updateLastActivity(project: Project): Project {
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE projects SET last_activity = ? WHERE id = ?
    `).run(now, project.id);

    return {
      ...project,
      lastActivity: now
    };
  }

  /**
   * Convert database row to Project object
   */
  private rowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      gitRemote: row.git_remote,
      type: row.type as ProjectType,
      vision: row.vision,
      createdAt: row.created_at,
      lastActivity: row.last_activity,
      discoveredBy: row.discovered_by as 'auto' | 'manual',
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }

  /**
   * Get all projects
   */
  getAllProjects(): Project[] {
    const rows = this.db.prepare(`
      SELECT * FROM projects
      ORDER BY last_activity DESC
    `).all() as any[];

    return rows.map(row => this.rowToProject(row));
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): Project | null {
    const row = this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(projectId) as any;

    return row ? this.rowToProject(row) : null;
  }

  /**
   * Get projects by type
   */
  getProjectsByType(type: ProjectType): Project[] {
    const rows = this.db.prepare(`
      SELECT * FROM projects WHERE type = ?
      ORDER BY last_activity DESC
    `).all(type) as any[];

    return rows.map(row => this.rowToProject(row));
  }

  /**
   * Search projects by name or path
   */
  searchProjects(query: string): Project[] {
    const rows = this.db.prepare(`
      SELECT * FROM projects
      WHERE name LIKE ? OR path LIKE ?
      ORDER BY last_activity DESC
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`) as any[];

    return rows.map(row => this.rowToProject(row));
  }

  /**
   * Get project statistics
   */
  getProjectStats(projectId: string): ProjectStats | null {
    const project = this.getProject(projectId);
    if (!project) return null;

    // Count tasks
    const taskStats = this.db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM tasks
      WHERE project_id = ?
      GROUP BY status
    `).all(projectId) as Array<{ status: string; count: number }>;

    // Count active sessions
    const activeSessions = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM agent_sessions
      WHERE project_id = ? AND status IN ('ACTIVE', 'IDLE')
    `).get(projectId) as { count: number };

    // Get agent count
    const agentCount = this.db.prepare(`
      SELECT COUNT(DISTINCT agent_letter) as count
      FROM agent_sessions
      WHERE project_id = ?
    `).get(projectId) as { count: number };

    return {
      projectId,
      projectName: project.name,
      totalTasks: taskStats.reduce((sum, s) => sum + s.count, 0),
      completedTasks: taskStats.find(s => s.status === 'COMPLETE')?.count || 0,
      inProgressTasks: taskStats.find(s => s.status === 'IN_PROGRESS')?.count || 0,
      availableTasks: taskStats.find(s => s.status === 'AVAILABLE')?.count || 0,
      activeSessions: activeSessions.count,
      totalAgents: agentCount.count,
      lastActivity: project.lastActivity
    };
  }
}

interface ProjectStats {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  availableTasks: number;
  activeSessions: number;
  totalAgents: number;
  lastActivity: string;
}
