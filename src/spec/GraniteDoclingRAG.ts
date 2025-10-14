/**
 * Granite-Docling RAG Integration
 * ==============================
 *
 * Advanced RAG system using IBM's Granite-Docling for document processing
 * and intelligent chunking with metadata extraction.
 *
 * Features:
 * - Multi-format support (PDF, DOCX, PPTX, HTML, Images, Audio, Video)
 * - Granite Vision models for image understanding
 * - OCR with multiple engines
 * - Code enrichment
 * - Formula extraction
 * - Table structure recognition
 * - Picture classification and description
 *
 * Task: T018 - RAG Index for Specifications (Granite-Docling Enhanced)
 * Agent: C (Backend Services Specialist) + Docling Integration
 * Status: IMPLEMENTING
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { promisify } from 'util';

export interface DoclingProcessedDocument {
  id: string;
  title: string;
  filePath: string;
  fileType: string;
  processedAt: string;
  chunks: DoclingChunk[];
  metadata: {
    pageCount?: number;
    hasImages: boolean;
    hasTables: boolean;
    hasCode: boolean;
    hasFormulas: boolean;
    languages: string[];
    processingTime: number;
    doclingVersion: string;
  };
}

export interface DoclingChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  contentType: 'text' | 'table' | 'image' | 'code' | 'formula' | 'chart';
  metadata: {
    page?: number;
    section?: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
    tags: string[];
    extractedAt: string;
  };
  embedding?: number[];
}

export interface RAGSearchResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  content: string;
  contentType: string;
  relevanceScore: number;
  metadata: any;
}

export class GraniteDoclingRAG {
  private doclingPath: string;
  private outputPath: string;
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.doclingPath = '/Users/lech/.langflow/.langflow-venv/bin/docling';

    // Handle both ES modules and CommonJS
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));
    this.outputPath = path.join(currentDir, '../../data/docling_output');

    // Ensure output directory exists
    if (!existsSync(this.outputPath)) {
      mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Build RAG index using Granite-Docling for document processing
   */
  async buildRAGIndex(projectPath: string): Promise<void> {
    console.log('🔍 Building RAG Index with Granite-Docling...');
    console.log(`   Project path: ${projectPath}`);
    console.log(`   Docling path: ${this.doclingPath}`);

    // 1. Discover all documents supported by Docling
    const documents = this.discoverDocuments(projectPath);
    console.log(`   Found ${documents.length} documents for processing`);

    // 2. Process documents with Docling
    const processedDocs: DoclingProcessedDocument[] = [];

    for (const doc of documents) {
      console.log(`   Processing: ${path.relative(projectPath, doc)}`);
      const processed = await this.processDocumentWithDocling(doc, projectPath);
      if (processed) {
        processedDocs.push(processed);
      }
    }

    // 3. Store processed documents in database
    await this.storeProcessedDocuments(processedDocs);

    // 4. Create vector-ready index
    await this.createVectorIndex();

    console.log(`✅ Granite-Docling RAG Index built successfully!`);
    console.log(`   Documents processed: ${processedDocs.length}`);
    console.log(`   Total chunks: ${processedDocs.reduce((sum, doc) => sum + doc.chunks.length, 0)}`);
  }

  /**
   * Discover all documents supported by Docling
   */
  private discoverDocuments(projectPath: string): string[] {
    const documents: string[] = [];
    const supportedExtensions = [
      '.pdf', '.docx', '.pptx', '.html', '.htm', '.md', '.txt',
      '.csv', '.xlsx', '.json', '.xml', '.jpg', '.jpeg', '.png',
      '.gif', '.bmp', '.tiff', '.mp3', '.wav', '.mp4', '.avi', '.mov'
    ];

    const specDirectories = [
      '02_SPECBASES',
      '04_AGENT_FRAMEWORK',
      'docs',
      'documentation',
      'assets',
      'media'
    ];

    for (const dir of specDirectories) {
      const fullPath = path.join(projectPath, dir);
      if (existsSync(fullPath)) {
        this.scanDirectoryForDocuments(fullPath, documents, supportedExtensions);
      }
    }

    return documents;
  }

  /**
   * Recursively scan directory for supported documents
   */
  private scanDirectoryForDocuments(dirPath: string, documents: string[], supportedExtensions: string[]): void {
    try {
      const entries = readdirSync(dirPath);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other large directories
          if (!entry.includes('node_modules') && !entry.includes('.git') && !entry.includes('dist')) {
            this.scanDirectoryForDocuments(fullPath, documents, supportedExtensions);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(entry).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            documents.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.log(`   Warning: Could not scan ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process document using Granite-Docling
   */
  private async processDocumentWithDocling(filePath: string, projectPath: string): Promise<DoclingProcessedDocument | null> {
    try {
      const startTime = Date.now();
      const relativePath = path.relative(projectPath, filePath);
      const documentId = this.generateDocumentId(relativePath);
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath).substring(1);

      console.log(`     📄 Using Granite-Docling for ${fileName}...`);

      // Prepare Docling output directory
      const docOutputDir = path.join(this.outputPath, documentId);
      if (!existsSync(docOutputDir)) {
        mkdirSync(docOutputDir, { recursive: true });
      }

      // Determine Docling options based on file type
      const doclingOptions = this.getDoclingOptions(fileType);

      // Run Docling processing
      const doclingResult = await this.runDocling(filePath, docOutputDir, doclingOptions);

      if (!doclingResult.success) {
        console.log(`     ❌ Docling processing failed: ${doclingResult.error}`);
        return null;
      }

      // Parse Docling output and create chunks
      const chunks = await this.parseDoclingOutput(doclingResult.outputPath!, documentId);

      // Extract metadata
      const metadata = await this.extractDocumentMetadata(filePath, chunks, Date.now() - startTime);

      return {
        id: documentId,
        title: this.extractTitleFromPath(relativePath),
        filePath: relativePath,
        fileType,
        processedAt: new Date().toISOString(),
        chunks,
        metadata
      };

    } catch (error) {
      console.log(`     ❌ Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get Docling processing options based on file type
   */
  private getDoclingOptions(fileType: string): any {
    const baseOptions = {
      output: this.outputPath,
      ocr: true,
      'enrich-code': true,
      'enrich-formula': true,
      'table-mode': 'accurate',
      verbose: 1
    };

    switch (fileType) {
      case 'pdf':
        return {
          ...baseOptions,
          pipeline: 'standard',
          'vlm-model': 'granite_docling'
        };

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'tiff':
        return {
          ...baseOptions,
          from: 'image',
          pipeline: 'vlm',
          'vlm-model': 'granite_vision'
        };

      case 'mp3':
      case 'wav':
        return {
          ...baseOptions,
          from: fileType,
          'asr-model': 'whisper_medium'
        };

      case 'mp4':
      case 'avi':
      case 'mov':
        return {
          ...baseOptions,
          from: fileType,
          'asr-model': 'whisper_medium'
        };

      case 'docx':
      case 'pptx':
        return {
          ...baseOptions,
          from: fileType
        };

      default:
        return baseOptions;
    }
  }

  /**
   * Run Docling as subprocess
   */
  private async runDocling(inputPath: string, outputPath: string, options: any): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const args = [inputPath, '--output', outputPath, '--to', 'json'];

      // Add options to args
      Object.entries(options).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          if (value) args.push(`--${key}`);
        } else {
          args.push(`--${key}`, String(value));
        }
      });

      const doclingProcess = spawn(this.doclingPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 300000 // 5 minutes timeout
      });

      let stdout = '';
      let stderr = '';

      doclingProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      doclingProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      doclingProcess.on('close', (code) => {
        if (code === 0) {
          // Find the output JSON file
          const jsonFileName = path.basename(inputPath, path.extname(inputPath)) + '.json';
          const jsonOutputPath = path.join(outputPath, jsonFileName);

          if (existsSync(jsonOutputPath)) {
            resolve({ success: true, outputPath: jsonOutputPath });
          } else {
            resolve({ success: false, error: `Docling output file not found: ${jsonOutputPath}` });
          }
        } else {
          resolve({ success: false, error: `Docling failed with code ${code}: ${stderr}` });
        }
      });

      doclingProcess.on('error', (error) => {
        resolve({ success: false, error: `Docling process error: ${error.message}` });
      });
    });
  }

  /**
   * Parse Docling JSON output and create chunks
   */
  private async parseDoclingOutput(jsonPath: string, documentId: string): Promise<DoclingChunk[]> {
    try {
      const jsonContent = readFileSync(jsonPath, 'utf-8');
      const doclingData = JSON.parse(jsonContent);

      const chunks: DoclingChunk[] = [];

      if (doclingData.pages) {
        doclingData.pages.forEach((page: any, pageIndex: number) => {
          if (page.elements) {
            page.elements.forEach((element: any, elementIndex: number) => {
              const chunk: DoclingChunk = {
                id: `${documentId}_page${pageIndex}_elem${elementIndex}`,
                documentId,
                chunkIndex: chunks.length,
                content: this.extractContentFromElement(element),
                contentType: this.inferContentType(element),
                metadata: {
                  page: pageIndex + 1,
                  section: element.type || 'unknown',
                  boundingBox: element.bbox || undefined,
                  confidence: element.confidence || 1.0,
                  tags: this.extractTagsFromElement(element),
                  extractedAt: new Date().toISOString()
                }
              };

              chunks.push(chunk);
            });
          }
        });
      }

      return chunks;

    } catch (error) {
      console.log(`     ❌ Error parsing Docling output: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Extract content from Docling element
   */
  private extractContentFromElement(element: any): string {
    if (element.text) return element.text;
    if (element.content) return element.content;
    if (element.caption) return element.caption;
    if (element.title) return element.title;
    if (element.cells) {
      // Table content
      return element.cells.map((cell: any) => cell.text || '').join(' | ');
    }
    return JSON.stringify(element);
  }

  /**
   * Infer content type from Docling element
   */
  private inferContentType(element: any): DoclingChunk['contentType'] {
    if (element.type === 'table') return 'table';
    if (element.type === 'image') return 'image';
    if (element.type === 'formula') return 'formula';
    if (element.type === 'code') return 'code';
    if (element.type === 'chart') return 'chart';
    return 'text';
  }

  /**
   * Extract tags from Docling element
   */
  private extractTagsFromElement(element: any): string[] {
    const tags: string[] = [];

    if (element.type) tags.push(element.type);
    if (element.category) tags.push(element.category);
    if (element.language) tags.push(element.language);
    if (element.format) tags.push(element.format);

    return tags;
  }

  /**
   * Extract document metadata
   */
  private async extractDocumentMetadata(filePath: string, chunks: DoclingChunk[], processingTime: number): Promise<any> {
    return {
      pageCount: Math.max(...chunks.map(c => c.metadata.page || 1)),
      hasImages: chunks.some(c => c.contentType === 'image'),
      hasTables: chunks.some(c => c.contentType === 'table'),
      hasCode: chunks.some(c => c.contentType === 'code'),
      hasFormulas: chunks.some(c => c.contentType === 'formula'),
      languages: [...new Set(chunks.flatMap(c => c.metadata.tags.filter(t => t.includes('lang') || t.includes('language'))))],
      processingTime,
      doclingVersion: '1.0.0', // TODO: Get actual version
      chunkCount: chunks.length,
      averageConfidence: chunks.reduce((sum, c) => sum + c.metadata.confidence, 0) / chunks.length
    };
  }

  /**
   * Generate document ID
   */
  private generateDocumentId(filePath: string): string {
    const normalized = filePath
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return `DOC_${normalized}`;
  }

  /**
   * Extract title from file path
   */
  private extractTitleFromPath(filePath: string): string {
    const fileName = path.basename(filePath);
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return nameWithoutExt.replace(/_/g, ' ').replace(/-/g, ' ');
  }

  /**
   * Store processed documents in database
   */
  private async storeProcessedDocuments(documents: DoclingProcessedDocument[]): Promise<void> {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS docling_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        processed_at TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS docling_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        content_type TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES docling_documents (id)
      );
    `);

    // Create FTS table
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS docling_fts USING fts5(
        document_id,
        title,
        content,
        content_type,
        tags,
        content='docling_chunks',
        content_rowid='rowid'
      );
    `);

    // Insert documents and chunks
    const insertDoc = this.db.prepare(`
      INSERT OR REPLACE INTO docling_documents
      (id, title, file_path, file_type, processed_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertChunk = this.db.prepare(`
      INSERT OR REPLACE INTO docling_chunks
      (id, document_id, chunk_index, content, content_type, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      for (const doc of documents) {
        insertDoc.run(
          doc.id,
          doc.title,
          doc.filePath,
          doc.fileType,
          doc.processedAt,
          JSON.stringify(doc.metadata)
        );

        for (const chunk of doc.chunks) {
          insertChunk.run(
            chunk.id,
            chunk.documentId,
            chunk.chunkIndex,
            chunk.content,
            chunk.contentType,
            JSON.stringify(chunk.metadata)
          );
        }
      }
    });

    transaction();

    // Populate FTS table
    this.db.exec(`
      INSERT INTO docling_fts (document_id, title, content, content_type, tags)
      SELECT
        c.document_id,
        d.title,
        c.content,
        c.content_type,
        json_extract(c.metadata, '$.tags')
      FROM docling_chunks c
      JOIN docling_documents d ON c.document_id = d.id;
    `);

    console.log('   ✅ Documents stored in database');
    console.log('   ✅ Full-text search enabled');
  }

  /**
   * Create vector-ready index
   */
  private async createVectorIndex(): Promise<void> {
    // Create indexes for efficient querying
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_docling_docs_type ON docling_documents (file_type);
      CREATE INDEX IF NOT EXISTS idx_docling_chunks_type ON docling_chunks (content_type);
      CREATE INDEX IF NOT EXISTS idx_docling_chunks_doc ON docling_chunks (document_id);
    `);

    console.log('   ✅ Vector-ready indexes created');
  }

  /**
   * Search documents using natural language
   */
  async searchDocuments(query: string, limit: number = 10, contentType?: string): Promise<RAGSearchResult[]> {
    let sql = `
      SELECT
        d.id as document_id,
        d.title as document_title,
        c.id as chunk_id,
        c.content,
        c.content_type,
        c.metadata,
        rank
      FROM docling_fts fts
      JOIN docling_chunks c ON fts.rowid = c.rowid
      JOIN docling_documents d ON c.document_id = d.id
      WHERE docling_fts MATCH ?
    `;

    const params = [query];

    if (contentType) {
      sql += ` AND c.content_type = ?`;
      params.push(contentType);
    }

    sql += ` ORDER BY rank LIMIT ?`;
    params.push(String(limit));

    const results = this.db.prepare(sql).all(...params);

    return results.map((row: any) => ({
      documentId: row.document_id,
      documentTitle: row.document_title,
      chunkId: row.chunk_id,
      content: row.content,
      contentType: row.content_type,
      relevanceScore: row.rank,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  /**
   * Get statistics about processed documents
   */
  getStatistics(): any {
    const docStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_documents,
        COUNT(DISTINCT file_type) as unique_file_types,
        AVG(json_extract(metadata, '$.processingTime')) as avg_processing_time,
        AVG(json_extract(metadata, '$.chunkCount')) as avg_chunks_per_doc
      FROM docling_documents
    `).get() as any;

    const chunkStats = this.db.prepare(`
      SELECT
        content_type,
        COUNT(*) as count,
        AVG(json_extract(metadata, '$.confidence')) as avg_confidence
      FROM docling_chunks
      GROUP BY content_type
    `).all();

    const fileTypeStats = this.db.prepare(`
      SELECT
        file_type,
        COUNT(*) as count
      FROM docling_documents
      GROUP BY file_type
    `).all();

    return {
      documents: docStats,
      chunksByType: chunkStats,
      filesByType: fileTypeStats,
      totalChunks: (this.db.prepare('SELECT COUNT(*) as count FROM docling_chunks').get() as { count: number }).count
    };
  }

  /**
   * Get document by ID with all chunks
   */
  getDocument(documentId: string): any {
    const doc = this.db.prepare(`
      SELECT * FROM docling_documents WHERE id = ?
    `).get(documentId);

    if (!doc) return null;

    const chunks = this.db.prepare(`
      SELECT * FROM docling_chunks WHERE document_id = ? ORDER BY chunk_index
    `).all(documentId);

    return {
      ...doc,
      metadata: JSON.parse((doc as any).metadata || '{}'),
      chunks: (chunks as any[]).map((chunk: any) => ({
        ...chunk,
        metadata: JSON.parse(chunk.metadata || '{}')
      }))
    };
  }
}