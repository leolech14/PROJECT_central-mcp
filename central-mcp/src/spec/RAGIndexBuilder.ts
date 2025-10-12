/**
 * RAG Index for Specifications
 * ============================
 *
 * Creates searchable vector index from all specification files.
 * Enables intelligent retrieval of relevant specifications.
 *
 * Task: T018 - RAG Index for Specifications
 * Agent: C (Backend Services Specialist)
 * Status: IMPLEMENTING
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export interface SpecChunk {
  id: string;
  specId: string;
  chunkIndex: number;
  content: string;
  metadata: {
    filePath: string;
    fileName: string;
    section?: string;
    subsection?: string;
    chunkType: 'requirement' | 'implementation' | 'testing' | 'validation' | 'metadata';
    importance: 'critical' | 'high' | 'medium' | 'low';
    tags: string[];
    lineStart: number;
    lineEnd: number;
  };
  embedding?: number[]; // Placeholder for future vector embeddings
}

export interface SpecIndex {
  specId: string;
  title: string;
  type: string;
  layer: string;
  purpose: string;
  filePath: string;
  lastModified: string;
  chunks: SpecChunk[];
  totalChunks: number;
  keywords: string[];
}

export class RAGIndexBuilder {
  constructor(private db: Database.Database) {}

  /**
   * Main entry point - build RAG index from all specifications
   */
  async buildRAGIndex(projectPath: string): Promise<void> {
    console.log('🔍 Building RAG Index for Specifications...');
    console.log(`   Project path: ${projectPath}`);

    // 1. Discover all specification files
    const specFiles = this.discoverSpecFiles(projectPath);
    console.log(`   Found ${specFiles.length} specification files`);

    // 2. Process each specification file
    const processedSpecs: SpecIndex[] = [];

    for (const specFile of specFiles) {
      console.log(`   Processing: ${path.relative(projectPath, specFile)}`);
      const specIndex = await this.processSpecFile(specFile, projectPath);
      if (specIndex) {
        processedSpecs.push(specIndex);
      }
    }

    // 3. Store in database
    await this.storeSpecIndex(processedSpecs);

    // 4. Create searchable metadata
    await this.createSearchableMetadata();

    console.log(`✅ RAG Index built successfully!`);
    console.log(`   Specifications indexed: ${processedSpecs.length}`);
    console.log(`   Total chunks: ${processedSpecs.reduce((sum, spec) => sum + spec.totalChunks, 0)}`);
  }

  /**
   * Discover all specification files in project
   */
  private discoverSpecFiles(projectPath: string): string[] {
    const specFiles: string[] = [];
    const specDirectories = [
      '02_SPECBASES',
      '04_AGENT_FRAMEWORK',
      'docs',
      'documentation'
    ];

    for (const dir of specDirectories) {
      const fullPath = path.join(projectPath, dir);
      if (existsSync(fullPath)) {
        this.scanDirectory(fullPath, specFiles);
      }
    }

    return specFiles.filter(file =>
      file.endsWith('.md') ||
      file.endsWith('.spec.md') ||
      file.endsWith('.specification.md')
    );
  }

  /**
   * Recursively scan directory for spec files
   */
  private scanDirectory(dirPath: string, specFiles: string[]): void {
    try {
      const entries = readdirSync(dirPath);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          this.scanDirectory(fullPath, specFiles);
        } else if (stat.isFile() && this.isSpecFile(fullPath)) {
          specFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.log(`   Warning: Could not scan ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if file is a specification file
   */
  private isSpecFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    const isSpec = fileName.includes('spec') ||
                   fileName.includes('SPEC') ||
                   fileName.includes('requirement') ||
                   fileName.includes('REQUIREMENT') ||
                   filePath.includes('SPECBASES') ||
                   filePath.includes('AGENT_FRAMEWORK');

    return isSpec && (filePath.endsWith('.md') || filePath.endsWith('.txt'));
  }

  /**
   * Process individual specification file
   */
  private async processSpecFile(filePath: string, projectPath: string): Promise<SpecIndex | null> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(projectPath, filePath);
      const fileName = path.basename(filePath);

      // Extract metadata from filename and content
      const specId = this.generateSpecId(relativePath);
      const title = this.extractTitle(content, fileName);
      const type = this.inferSpecType(content, fileName);
      const layer = this.inferSpecLayer(content, relativePath);
      const purpose = this.extractPurpose(content);

      // Split content into chunks
      const chunks = await this.chunkContent(content, filePath);

      // Extract keywords
      const keywords = this.extractKeywords(content);

      return {
        specId,
        title,
        type,
        layer,
        purpose,
        filePath: relativePath,
        lastModified: new Date().toISOString(),
        chunks,
        totalChunks: chunks.length,
        keywords
      };
    } catch (error) {
      console.log(`   Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Generate specification ID
   */
  private generateSpecId(filePath: string): string {
    const normalized = filePath
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return `SPEC_${normalized}`;
  }

  /**
   * Extract title from content or filename
   */
  private extractTitle(content: string, fileName: string): string {
    // Look for # Title pattern
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Look for **Title:** pattern
    const titleMatch2 = content.match(/\*\*Title:\*\*\s*(.+)$/m);
    if (titleMatch2) {
      return titleMatch2[1].trim();
    }

    // Fallback to filename
    return fileName.replace(/\.(md|txt)$/i, '').replace(/_/g, ' ');
  }

  /**
   * Infer specification type
   */
  private inferSpecType(content: string, fileName: string): string {
    if (content.includes('API') || content.includes('endpoint')) return 'API_SPEC';
    if (content.includes('UI') || content.includes('Component')) return 'UI_SPEC';
    if (content.includes('DATABASE') || content.includes('SCHEMA')) return 'DATABASE_SPEC';
    if (content.includes('SECURITY') || content.includes('AUTH')) return 'SECURITY_SPEC';
    if (content.includes('PERFORMANCE') || content.includes('SCALING')) return 'PERFORMANCE_SPEC';
    if (content.includes('TEST') || content.includes('VALIDATION')) return 'TEST_SPEC';
    if (content.includes('ARCHITECTURE') || content.includes('SYSTEM')) return 'ARCHITECTURE_SPEC';

    return 'GENERAL_SPEC';
  }

  /**
   * Infer specification layer
   */
  private inferSpecLayer(content: string, filePath: string): string {
    if (filePath.includes('AGENT_FRAMEWORK')) return 'AGENTS';
    if (filePath.includes('SPECBASES')) return 'REQUIREMENTS';
    if (content.includes('FRONTEND') || content.includes('UI')) return 'FRONTEND';
    if (content.includes('BACKEND') || content.includes('API')) return 'BACKEND';
    if (content.includes('INFRASTRUCTURE') || content.includes('DEPLOYMENT')) return 'INFRASTRUCTURE';
    if (content.includes('DATABASE')) return 'DATA';

    return 'SYSTEM';
  }

  /**
   * Extract purpose from content
   */
  private extractPurpose(content: string): string {
    const purposeMatch = content.match(/\*\*Purpose:\*\*\s*(.+)$/m);
    if (purposeMatch) {
      return purposeMatch[1].trim();
    }

    // Look for purpose-like paragraphs
    const lines = content.split('\n');
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 50 && line.length < 200 && !line.startsWith('#')) {
        return line;
      }
    }

    return 'Specification purpose not explicitly defined';
  }

  /**
   * Split content into intelligent chunks
   */
  private async chunkContent(content: string, filePath: string): Promise<SpecChunk[]> {
    const chunks: SpecChunk[] = [];
    const lines = content.split('\n');
    let currentChunk = '';
    let chunkIndex = 0;
    let lineStart = 0;
    let currentSection = '';
    let currentSubsection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect section headers
      if (line.startsWith('# ')) {
        currentSection = line.slice(2).trim();
        currentSubsection = '';
      } else if (line.startsWith('## ')) {
        currentSubsection = line.slice(3).trim();
      }

      currentChunk += line + '\n';

      // Create chunk based on conditions
      const shouldCreateChunk =
        currentChunk.length > 1000 || // Size limit
        line.startsWith('# ') ||      // New major section
        line.startsWith('## ') ||     // New subsection
        i === lines.length - 1;       // End of content

      if (shouldCreateChunk && currentChunk.trim()) {
        const chunkType = this.determineChunkType(currentChunk);
        const importance = this.determineImportance(currentChunk, currentSection);
        const tags = this.extractChunkTags(currentChunk, currentSection);

        chunks.push({
          id: `${this.generateSpecId(filePath)}_CHUNK_${String(chunkIndex).padStart(3, '0')}`,
          specId: this.generateSpecId(filePath),
          chunkIndex,
          content: currentChunk.trim(),
          metadata: {
            filePath,
            fileName: path.basename(filePath),
            section: currentSection || 'General',
            subsection: currentSubsection,
            chunkType,
            importance,
            tags,
            lineStart: lineStart + 1,
            lineEnd: i + 1
          }
        });

        currentChunk = '';
        chunkIndex++;
        lineStart = i + 1;
      }
    }

    return chunks;
  }

  /**
   * Determine chunk type
   */
  private determineChunkType(content: string): SpecChunk['metadata']['chunkType'] {
    if (content.toLowerCase().includes('requirement')) return 'requirement';
    if (content.toLowerCase().includes('implement') || content.toLowerCase().includes('code')) return 'implementation';
    if (content.toLowerCase().includes('test') || content.toLowerCase().includes('validation')) return 'testing';
    if (content.toLowerCase().includes('metadata') || content.toLowerCase().includes('info')) return 'metadata';
    return 'validation';
  }

  /**
   * Determine chunk importance
   */
  private determineImportance(content: string, section: string): SpecChunk['metadata']['importance'] {
    if (section.toLowerCase().includes('critical') || content.toLowerCase().includes('must')) return 'critical';
    if (section.toLowerCase().includes('important') || content.toLowerCase().includes('should')) return 'high';
    if (section.toLowerCase().includes('minor') || content.toLowerCase().includes('could')) return 'low';
    return 'medium';
  }

  /**
   * Extract tags from chunk
   */
  private extractChunkTags(content: string, section: string): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();

    // Common specification tags
    const tagPatterns = [
      { keywords: ['api', 'endpoint'], tag: 'API' },
      { keywords: ['ui', 'component', 'interface'], tag: 'UI' },
      { keywords: ['security', 'auth', 'authentication'], tag: 'SECURITY' },
      { keywords: ['performance', 'scalability', 'speed'], tag: 'PERFORMANCE' },
      { keywords: ['database', 'data', 'storage'], tag: 'DATA' },
      { keywords: ['test', 'testing', 'validation'], tag: 'TESTING' },
      { keywords: ['deployment', 'infrastructure', 'cloud'], tag: 'INFRA' }
    ];

    for (const pattern of tagPatterns) {
      if (pattern.keywords.some(keyword => contentLower.includes(keyword))) {
        tags.push(pattern.tag);
      }
    }

    if (section) {
      tags.push(section.toUpperCase().replace(/\s+/g, '_'));
    }

    return tags;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isCommonWord(word));

    // Count word frequency
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Check if word is common/stop word
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'must', 'have', 'has', 'had', 'do', 'does', 'did', 'be', 'been', 'being',
      'from', 'into', 'onto', 'upon', 'about', 'above', 'after', 'before',
      'during', 'under', 'over', 'between', 'among', 'through', 'throughout'
    ];

    return commonWords.includes(word);
  }

  /**
   * Store specification index in database
   */
  private async storeSpecIndex(specs: SpecIndex[]): Promise<void> {
    const createTable = `
      CREATE TABLE IF NOT EXISTS rag_spec_index (
        id TEXT PRIMARY KEY,
        spec_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        layer TEXT NOT NULL,
        purpose TEXT,
        file_path TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        total_chunks INTEGER NOT NULL,
        keywords TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createChunksTable = `
      CREATE TABLE IF NOT EXISTS rag_spec_chunks (
        id TEXT PRIMARY KEY,
        spec_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        section TEXT,
        subsection TEXT,
        chunk_type TEXT NOT NULL,
        importance TEXT NOT NULL,
        tags TEXT,
        line_start INTEGER,
        line_end INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        -- FOREIGN KEY constraint removed for bulk loading
      );
    `;

    this.db.exec(createTable);
    this.db.exec(createChunksTable);

    const insertSpec = this.db.prepare(`
      INSERT OR REPLACE INTO rag_spec_index
      (id, spec_id, title, type, layer, purpose, file_path, last_modified, total_chunks, keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertChunk = this.db.prepare(`
      INSERT OR REPLACE INTO rag_spec_chunks
      (id, spec_id, chunk_index, content, file_path, file_name, section, subsection, chunk_type, importance, tags, line_start, line_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      for (const spec of specs) {
        insertSpec.run(
          spec.specId,
          spec.specId,
          spec.title,
          spec.type,
          spec.layer,
          spec.purpose,
          spec.filePath,
          spec.lastModified,
          spec.totalChunks,
          JSON.stringify(spec.keywords)
        );

        for (const chunk of spec.chunks) {
          insertChunk.run(
            chunk.id,
            chunk.specId,
            chunk.chunkIndex,
            chunk.content,
            chunk.metadata.filePath,
            chunk.metadata.fileName,
            chunk.metadata.section,
            chunk.metadata.subsection,
            chunk.metadata.chunkType,
            chunk.metadata.importance,
            JSON.stringify(chunk.metadata.tags),
            chunk.metadata.lineStart,
            chunk.metadata.lineEnd
          );
        }
      }
    });

    transaction();
  }

  /**
   * Create searchable metadata and indexes
   */
  private async createSearchableMetadata(): Promise<void> {
    // Create FTS (Full-Text Search) table
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS rag_spec_fts USING fts5(
        spec_id,
        title,
        content,
        keywords,
        tags,
        content='rag_spec_chunks',
        content_rowid='rowid'
      );
    `);

    // Populate FTS table
    this.db.exec(`
      INSERT INTO rag_spec_fts (spec_id, title, content, keywords, tags)
      SELECT
        c.spec_id,
        s.title,
        c.content,
        s.keywords,
        c.tags
      FROM rag_spec_chunks c
      JOIN rag_spec_index s ON c.spec_id = s.id;
    `);

    // Create indexes for fast queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_rag_specs_type ON rag_spec_index (type);
      CREATE INDEX IF NOT EXISTS idx_rag_specs_layer ON rag_spec_index (layer);
      CREATE INDEX IF NOT EXISTS idx_rag_chunks_importance ON rag_spec_chunks (importance);
      CREATE INDEX IF NOT EXISTS idx_rag_chunks_type ON rag_spec_chunks (chunk_type);
    `);

    console.log('   ✅ Full-text search enabled');
    console.log('   ✅ Database indexes created');
  }

  /**
   * Search specifications using natural language
   */
  async searchSpecifications(query: string, limit: number = 10): Promise<any[]> {
    const searchQuery = `
      SELECT
        s.spec_id,
        s.title,
        s.type,
        s.layer,
        s.purpose,
        c.content as snippet,
        c.section,
        c.importance,
        rank
      FROM rag_spec_fts fts
      JOIN rag_spec_chunks c ON fts.rowid = c.rowid
      JOIN rag_spec_index s ON c.spec_id = s.id
      WHERE rag_spec_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `;

    return this.db.prepare(searchQuery).all(query, limit);
  }

  /**
   * Get specification statistics
   */
  getStatistics(): any {
    const specCount = this.db.prepare('SELECT COUNT(*) as count FROM rag_spec_index').get() as { count: number };
    const chunkCount = this.db.prepare('SELECT COUNT(*) as count FROM rag_spec_chunks').get() as { count: number };

    const stats = {
      totalSpecs: specCount.count,
      totalChunks: chunkCount.count,
      typeDistribution: this.db.prepare('SELECT type, COUNT(*) as count FROM rag_spec_index GROUP BY type').all(),
      layerDistribution: this.db.prepare('SELECT layer, COUNT(*) as count FROM rag_spec_index GROUP BY layer').all(),
      importanceDistribution: this.db.prepare('SELECT importance, COUNT(*) as count FROM rag_spec_chunks GROUP BY importance').all()
    };

    return stats;
  }
}