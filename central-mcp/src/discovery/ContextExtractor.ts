/**
 * Context Auto-Extractor
 * =======================
 *
 * Automatically extracts all context from project directory.
 *
 * Features:
 * - Scans specs, docs, code, architecture files
 * - Categorizes files by type
 * - Extracts metadata
 * - Prepares for cloud upload
 * - Generates statistics
 *
 * T002 - CRITICAL PATH - DISCOVERY ENGINE FOUNDATION
 */

import { execSync } from 'child_process';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface ExtractedContext {
  projectId: string;
  extractedAt: string;
  files: ContextFile[];
  categories: ContextCategories;
  statistics: ContextStatistics;
  keyFiles: KeyFiles;
}

export interface ContextFile {
  id: string;
  projectId: string;
  relativePath: string;
  absolutePath: string;
  type: ContextFileType;
  size: number;
  createdAt: string;
  modifiedAt: string;
  contentHash: string;
}

export type ContextFileType = 'SPEC' | 'DOC' | 'CODE' | 'ARCHITECTURE' | 'STATUS' | 'CONFIG' | 'ASSET' | 'UNKNOWN';

export interface ContextCategories {
  specs: ContextFile[];
  docs: ContextFile[];
  code: ContextFile[];
  architecture: ContextFile[];
  status: ContextFile[];
  config: ContextFile[];
  assets: ContextFile[];
}

export interface ContextStatistics {
  totalFiles: number;
  totalSize: number; // bytes
  byType: Record<ContextFileType, number>;
  linesOfCode?: number;
  technologies: string[];
}

export interface KeyFiles {
  claudeMd?: string;
  readmeMd?: string;
  packageJson?: string;
  taskRegistry?: string;
}

export class ContextExtractor {
  constructor(private db: Database.Database) {}

  /**
   * Extract all context from project directory
   */
  async extractContext(projectId: string, projectPath: string): Promise<ExtractedContext> {
    console.log(`🔍 Extracting context from: ${projectPath}`);

    const startTime = Date.now();

    // 1. Scan standard directories
    const files = await this.scanProjectDirectory(projectId, projectPath);

    // 2. Categorize files
    const categories = this.categorizeFiles(files);

    // 3. Read key files
    const keyFiles = this.readKeyFiles(projectPath);

    // 4. Generate statistics
    const statistics = this.generateStatistics(files, categories);

    // 5. Store in database
    await this.storeContext(files);

    const duration = Date.now() - startTime;
    console.log(`✅ Context extracted: ${files.length} files in ${duration}ms`);

    return {
      projectId,
      extractedAt: new Date().toISOString(),
      files,
      categories,
      statistics,
      keyFiles
    };
  }

  /**
   * Scan project directory for all relevant files
   */
  private async scanProjectDirectory(projectId: string, projectPath: string): Promise<ContextFile[]> {
    const files: ContextFile[] = [];

    // Define directories to scan
    const scanDirs = [
      { dir: '02_SPECBASES', type: 'SPEC' as ContextFileType },
      { dir: 'docs', type: 'DOC' as ContextFileType },
      { dir: '01_CODEBASES', type: 'CODE' as ContextFileType },
      { dir: '04_AGENT_FRAMEWORK', type: 'ARCHITECTURE' as ContextFileType },
      { dir: '05_EXECUTION_STATUS', type: 'STATUS' as ContextFileType }
    ];

    // Scan each directory
    for (const { dir, type } of scanDirs) {
      const fullPath = path.join(projectPath, dir);
      if (existsSync(fullPath)) {
        const dirFiles = this.scanDirectory(projectId, projectPath, fullPath, type);
        files.push(...dirFiles);
      }
    }

    // Also scan for specific file patterns
    const patterns = [
      { pattern: '**/CLAUDE.md', type: 'CONFIG' as ContextFileType },
      { pattern: '**/README.md', type: 'DOC' as ContextFileType },
      { pattern: '**/*ARCHITECTURE*.md', type: 'ARCHITECTURE' as ContextFileType },
      { pattern: '**/*STATUS*.md', type: 'STATUS' as ContextFileType },
      { pattern: '**/CENTRAL_TASK_REGISTRY.md', type: 'CONFIG' as ContextFileType }
    ];

    for (const { pattern, type } of patterns) {
      const matchedFiles = this.findFilesByPattern(projectId, projectPath, pattern, type);
      files.push(...matchedFiles);
    }

    // Deduplicate by path
    const uniqueFiles = new Map<string, ContextFile>();
    for (const file of files) {
      if (!uniqueFiles.has(file.relativePath)) {
        uniqueFiles.set(file.relativePath, file);
      }
    }

    return Array.from(uniqueFiles.values());
  }

  /**
   * Scan directory recursively (OPTIMIZED - Parallel + Smart Skipping)
   */
  private scanDirectory(
    projectId: string,
    projectPath: string,
    directory: string,
    defaultType: ContextFileType
  ): ContextFile[] {
    const files: ContextFile[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const maxFilesPerDir = 500; // Limit files per directory

    try {
      const entries = readdirSync(directory, { withFileTypes: true });

      // Separate files and directories
      const dirs: string[] = [];
      const fileEntries: any[] = [];

      for (const entry of entries) {
        if (this.shouldSkip(entry.name)) continue;

        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          dirs.push(fullPath);
        } else if (entry.isFile()) {
          fileEntries.push({ name: entry.name, fullPath });
        }

        // Limit files to prevent explosion
        if (fileEntries.length >= maxFilesPerDir) {
          console.warn(`⚠️  Directory ${directory} has ${entries.length} files, limiting to ${maxFilesPerDir}`);
          break;
        }
      }

      // Process files (quick - just metadata)
      for (const entry of fileEntries) {
        try {
          const stats = statSync(entry.fullPath);

          // Skip large files (likely binaries)
          if (stats.size > maxFileSize) {
            console.warn(`⚠️  Skipping large file: ${entry.name} (${stats.size} bytes)`);
            continue;
          }

          const file = this.createContextFile(projectId, projectPath, entry.fullPath, defaultType);
          if (file) {
            files.push(file);
          }
        } catch (error) {
          // Skip inaccessible files
          continue;
        }
      }

      // Recurse into subdirectories (limit depth)
      const depth = directory.split('/').length - projectPath.split('/').length;
      if (depth < 10) { // Max depth of 10
        for (const dir of dirs) {
          const subFiles = this.scanDirectory(projectId, projectPath, dir, defaultType);
          files.push(...subFiles);
        }
      } else {
        console.warn(`⚠️  Max depth reached at: ${directory}`);
      }
    } catch (error) {
      // Directory not accessible
      console.warn(`⚠️  Cannot scan directory: ${directory}`);
    }

    return files;
  }

  /**
   * Create ContextFile object from file path
   */
  private createContextFile(
    projectId: string,
    projectPath: string,
    filePath: string,
    defaultType: ContextFileType
  ): ContextFile | null {
    try {
      const stats = statSync(filePath);
      const relativePath = path.relative(projectPath, filePath);

      // Classify file type
      const type = this.classifyFileType(filePath, defaultType);

      // Get file hash (simple size+mtime hash)
      const hash = `${stats.size}-${stats.mtimeMs}`;

      return {
        id: uuidv4(),
        projectId,
        relativePath,
        absolutePath: filePath,
        type,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        contentHash: hash
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Classify file type from path and extension
   */
  private classifyFileType(filePath: string, defaultType: ContextFileType): ContextFileType {
    const basename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Specific files
    if (basename === 'CLAUDE.md' || basename === 'package.json') return 'CONFIG';
    if (basename.includes('ARCHITECTURE')) return 'ARCHITECTURE';
    if (basename.includes('STATUS')) return 'STATUS';
    if (basename.includes('TASK_REGISTRY')) return 'CONFIG';

    // By directory
    if (filePath.includes('02_SPECBASES')) return 'SPEC';
    if (filePath.includes('/docs/')) return 'DOC';
    if (filePath.includes('01_CODEBASES')) return 'CODE';

    // By extension
    if (['.md', '.mdx'].includes(ext)) return 'DOC';
    if (['.ts', '.tsx', '.js', '.jsx', '.swift', '.py'].includes(ext)) return 'CODE';
    if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) return 'CONFIG';
    if (['.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(ext)) return 'ASSET';

    return defaultType;
  }

  /**
   * Find files by glob pattern
   */
  private findFilesByPattern(
    projectId: string,
    projectPath: string,
    pattern: string,
    type: ContextFileType
  ): ContextFile[] {
    try {
      const command = `find . -path "${pattern}" -type f`;
      const result = execSync(command, {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      if (!result) return [];

      const paths = result.split('\n').filter(p => p.trim());
      return paths
        .map(p => {
          const fullPath = path.join(projectPath, p);
          return this.createContextFile(projectId, projectPath, fullPath, type);
        })
        .filter((f): f is ContextFile => f !== null);
    } catch (error) {
      return [];
    }
  }

  /**
   * Should skip this directory/file? (EXPANDED - More aggressive filtering)
   */
  private shouldSkip(name: string): boolean {
    const skipList = [
      // Dependencies
      'node_modules',
      'vendor',
      'packages',

      // Version control
      '.git',
      '.svn',
      '.hg',

      // Build outputs
      '.next',
      'dist',
      'build',
      'out',
      '.vercel',
      'coverage',
      '.turbo',

      // Caches
      '.cache',
      '__pycache__',
      '.pytest_cache',
      '.eslintcache',

      // IDE
      '.idea',
      '.vscode',
      '.vs',
      'DerivedData',

      // OS
      '.DS_Store',
      'Thumbs.db',

      // Large assets (skip for performance)
      'videos',
      'images',
      'assets',
      'public/uploads'
    ];

    return skipList.includes(name) || name.startsWith('.');
  }

  /**
   * Categorize files by type
   */
  categorizeFiles(files: ContextFile[]): ContextCategories {
    return {
      specs: files.filter(f => f.type === 'SPEC'),
      docs: files.filter(f => f.type === 'DOC'),
      code: files.filter(f => f.type === 'CODE'),
      architecture: files.filter(f => f.type === 'ARCHITECTURE'),
      status: files.filter(f => f.type === 'STATUS'),
      config: files.filter(f => f.type === 'CONFIG'),
      assets: files.filter(f => f.type === 'ASSET')
    };
  }

  /**
   * Read key project files
   */
  readKeyFiles(projectPath: string): KeyFiles {
    const keyFiles: KeyFiles = {};

    // CLAUDE.md
    const claudePath = path.join(projectPath, 'CLAUDE.md');
    if (existsSync(claudePath)) {
      keyFiles.claudeMd = readFileSync(claudePath, 'utf-8');
    }

    // README.md
    const readmePath = path.join(projectPath, 'README.md');
    if (existsSync(readmePath)) {
      keyFiles.readmeMd = readFileSync(readmePath, 'utf-8');
    }

    // package.json
    const packagePath = path.join(projectPath, 'package.json');
    if (existsSync(packagePath)) {
      keyFiles.packageJson = readFileSync(packagePath, 'utf-8');
    }

    // Task registry
    const taskRegistryPath = path.join(projectPath, '04_AGENT_FRAMEWORK/CENTRAL_TASK_REGISTRY.md');
    if (existsSync(taskRegistryPath)) {
      keyFiles.taskRegistry = readFileSync(taskRegistryPath, 'utf-8');
    }

    return keyFiles;
  }

  /**
   * Generate statistics
   */
  private generateStatistics(files: ContextFile[], categories: ContextCategories): ContextStatistics {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    const byType: Record<ContextFileType, number> = {
      SPEC: categories.specs.length,
      DOC: categories.docs.length,
      CODE: categories.code.length,
      ARCHITECTURE: categories.architecture.length,
      STATUS: categories.status.length,
      CONFIG: categories.config.length,
      ASSET: categories.assets.length,
      UNKNOWN: files.filter(f => f.type === 'UNKNOWN').length
    };

    // Count lines of code (approximation)
    const linesOfCode = categories.code.reduce((sum, file) => {
      try {
        const content = readFileSync(file.absolutePath, 'utf-8');
        return sum + content.split('\n').length;
      } catch (error) {
        return sum;
      }
    }, 0);

    // Extract technologies from code files
    const technologies = this.detectTechnologies(categories.code);

    return {
      totalFiles: files.length,
      totalSize,
      byType,
      linesOfCode,
      technologies
    };
  }

  /**
   * Detect technologies from code files
   */
  private detectTechnologies(codeFiles: ContextFile[]): string[] {
    const technologies = new Set<string>();

    for (const file of codeFiles.slice(0, 50)) { // Sample first 50 files
      const ext = path.extname(file.relativePath);

      if (ext === '.ts' || ext === '.tsx') technologies.add('TypeScript');
      if (ext === '.js' || ext === '.jsx') technologies.add('JavaScript');
      if (ext === '.swift') technologies.add('Swift');
      if (ext === '.py') technologies.add('Python');

      if (file.relativePath.includes('next')) technologies.add('Next.js');
      if (file.relativePath.includes('react')) technologies.add('React');
      if (file.relativePath.includes('electron')) technologies.add('Electron');
    }

    return Array.from(technologies);
  }

  /**
   * Store context in database
   */
  private async storeContext(files: ContextFile[]): Promise<void> {
    // Create context_files table if needed
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS context_files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        absolute_path TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        indexed_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(project_id, relative_path),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_context_project ON context_files(project_id);
      CREATE INDEX IF NOT EXISTS idx_context_type ON context_files(type);
      CREATE INDEX IF NOT EXISTS idx_context_modified ON context_files(modified_at);
    `);

    // Insert all files
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO context_files (
        id, project_id, relative_path, absolute_path, type,
        size, created_at, modified_at, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((files: ContextFile[]) => {
      for (const file of files) {
        insert.run(
          file.id,
          file.projectId,
          file.relativePath,
          file.absolutePath,
          file.type,
          file.size,
          file.createdAt,
          file.modifiedAt,
          file.contentHash
        );
      }
    });

    insertMany(files);

    console.log(`✅ Stored ${files.length} files in database`);
  }

  /**
   * Get context files for project
   */
  getContextFiles(projectId: string, type?: ContextFileType): ContextFile[] {
    let query = `SELECT * FROM context_files WHERE project_id = ?`;
    const params: any[] = [projectId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY modified_at DESC`;

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      relativePath: row.relative_path,
      absolutePath: row.absolute_path,
      type: row.type as ContextFileType,
      size: row.size,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      contentHash: row.content_hash
    }));
  }

  /**
   * Search context files by content or name
   */
  searchContextFiles(projectId: string, query: string, limit = 20): ContextFile[] {
    const rows = this.db.prepare(`
      SELECT * FROM context_files
      WHERE project_id = ?
        AND (relative_path LIKE ? OR absolute_path LIKE ?)
      ORDER BY modified_at DESC
      LIMIT ?
    `).all(projectId, `%${query}%`, `%${query}%`, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      relativePath: row.relative_path,
      absolutePath: row.absolute_path,
      type: row.type as ContextFileType,
      size: row.size,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      contentHash: row.content_hash
    }));
  }

  /**
   * Get context statistics for project
   */
  getContextStatistics(projectId: string): ContextStatistics {
    const files = this.getContextFiles(projectId);
    const categories = this.categorizeFiles(files);

    return this.generateStatistics(files, categories);
  }

  /**
   * Check if context needs update (files changed)
   */
  needsUpdate(projectId: string, projectPath: string): boolean {
    const storedFiles = this.getContextFiles(projectId);

    // Quick check: count files in directory vs database
    try {
      const currentFileCount = execSync('find . -type f | wc -l', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      const count = parseInt(currentFileCount, 10);

      if (Math.abs(count - storedFiles.length) > 10) {
        return true; // Significant change in file count
      }
    } catch (error) {
      return true; // Assume needs update
    }

    // Check if any key files modified
    const keyFilePaths = [
      'CLAUDE.md',
      '04_AGENT_FRAMEWORK/CENTRAL_TASK_REGISTRY.md',
      'package.json'
    ];

    for (const keyPath of keyFilePaths) {
      const fullPath = path.join(projectPath, keyPath);
      if (existsSync(fullPath)) {
        const stats = statSync(fullPath);
        const storedFile = storedFiles.find(f => f.relativePath === keyPath);

        if (!storedFile || stats.mtime.toISOString() !== storedFile.modifiedAt) {
          return true; // Key file changed
        }
      }
    }

    return false; // No significant changes
  }
}
