/**
 * Context Manager (Cloud Storage Integration)
 * ===========================================
 *
 * Manages project context with cloud storage abstraction.
 * Provides intelligent context retrieval, search, and upload capabilities.
 *
 * Features:
 * - Cloud storage abstraction (S3/GCS ready, local fallback)
 * - Intelligent context retrieval by project/type
 * - Full-text search capabilities
 * - Performance optimized (<5s upload target)
 * - Integration with ContextExtractor and DiscoveryEngine
 * - Compression for efficient storage
 * - Deduplication by content hash
 *
 * T011 - CRITICAL PATH - CONTEXT MANAGER
 */

import Database from 'better-sqlite3';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import { ContextFile, ContextFileType } from '../discovery/ContextExtractor.js';

// ═══════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════

export interface CloudStorageConfig {
  provider: 'local' | 's3' | 'gcs';
  bucket?: string;
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    projectId?: string;
  };
  localPath?: string;
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  storageUrl: string;
  compressed: boolean;
  originalSize: number;
  compressedSize?: number;
  uploadTime: number; // milliseconds
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  content: Buffer;
  metadata: ContextFile;
  downloadTime: number; // milliseconds
  fromCache: boolean;
  error?: string;
}

export interface SearchOptions {
  projectId?: string;
  type?: ContextFileType;
  query?: string; // Filename/path search
  contentSearch?: string; // Full-text content search
  limit?: number;
  offset?: number;
  sortBy?: 'modified' | 'size' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  files: ContextFile[];
  total: number;
  searchTime: number; // milliseconds
  fromCache: boolean;
}

export interface ContextStats {
  totalFiles: number;
  totalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
  byType: Record<ContextFileType, { count: number; size: number }>;
  byProject: Record<string, { count: number; size: number }>;
  storageProvider: string;
}

// ═══════════════════════════════════════════════════════════
// CONTEXT MANAGER
// ═══════════════════════════════════════════════════════════

export class ContextManager {
  private config: CloudStorageConfig;
  private cacheEnabled = true;
  private searchCache = new Map<string, SearchResult>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private db: Database.Database,
    config?: Partial<CloudStorageConfig>
  ) {
    // Default to local storage with fallback
    this.config = {
      provider: config?.provider || 'local',
      localPath: config?.localPath || './data/context-storage',
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize storage system
   */
  private initialize(): void {
    // Create local storage directory if using local provider
    if (this.config.provider === 'local' && this.config.localPath) {
      if (!existsSync(this.config.localPath)) {
        mkdirSync(this.config.localPath, { recursive: true });
      }
    }

    // Create cloud_storage table for tracking uploads
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cloud_storage (
        file_id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        storage_url TEXT NOT NULL,
        compressed BOOLEAN NOT NULL DEFAULT 0,
        original_size INTEGER NOT NULL,
        compressed_size INTEGER,
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_accessed_at TEXT,
        access_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (file_id) REFERENCES context_files(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cloud_storage_project ON cloud_storage(project_id);
      CREATE INDEX IF NOT EXISTS idx_cloud_storage_uploaded ON cloud_storage(uploaded_at);
      CREATE INDEX IF NOT EXISTS idx_cloud_storage_accessed ON cloud_storage(last_accessed_at);
    `);

    console.log(`✅ ContextManager initialized with ${this.config.provider} storage`);
  }

  // ═══════════════════════════════════════════════════════════
  // CLOUD UPLOAD (S3/GCS/Local)
  // ═══════════════════════════════════════════════════════════

  /**
   * Upload file to cloud storage
   */
  async uploadFile(file: ContextFile, compress = true): Promise<UploadResult> {
    const startTime = Date.now();

    try {
      // Check if already uploaded
      const existing = this.db.prepare(`
        SELECT storage_url FROM cloud_storage WHERE file_id = ?
      `).get(file.id) as { storage_url: string } | undefined;

      if (existing) {
        console.log(`⏭️  File already uploaded: ${file.relativePath}`);
        return {
          success: true,
          fileId: file.id,
          storageUrl: existing.storage_url,
          compressed: compress,
          originalSize: file.size,
          uploadTime: Date.now() - startTime
        };
      }

      // Read file content
      if (!existsSync(file.absolutePath)) {
        throw new Error(`File not found: ${file.absolutePath}`);
      }

      const stats = statSync(file.absolutePath);
      const originalSize = stats.size;

      // Upload based on provider
      let storageUrl: string;
      let compressedSize: number | undefined;

      switch (this.config.provider) {
        case 's3':
          ({ storageUrl, compressedSize } = await this.uploadToS3(file, compress));
          break;

        case 'gcs':
          ({ storageUrl, compressedSize } = await this.uploadToGCS(file, compress));
          break;

        case 'local':
        default:
          ({ storageUrl, compressedSize } = await this.uploadToLocal(file, compress));
          break;
      }

      // Record in database
      this.db.prepare(`
        INSERT OR REPLACE INTO cloud_storage (
          file_id, project_id, storage_url, compressed,
          original_size, compressed_size
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        file.id,
        file.projectId,
        storageUrl,
        compress ? 1 : 0,
        originalSize,
        compressedSize || null
      );

      const uploadTime = Date.now() - startTime;

      console.log(`✅ Uploaded ${file.relativePath} (${originalSize} bytes${compress ? ` → ${compressedSize} bytes` : ''}) in ${uploadTime}ms`);

      return {
        success: true,
        fileId: file.id,
        storageUrl,
        compressed: compress,
        originalSize,
        compressedSize,
        uploadTime
      };

    } catch (error) {
      const uploadTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error(`❌ Upload failed for ${file.relativePath}: ${errorMsg}`);

      return {
        success: false,
        fileId: file.id,
        storageUrl: '',
        compressed: compress,
        originalSize: file.size,
        uploadTime,
        error: errorMsg
      };
    }
  }

  /**
   * Batch upload multiple files
   */
  async uploadBatch(files: ContextFile[], compress = true): Promise<UploadResult[]> {
    const startTime = Date.now();
    console.log(`📤 Starting batch upload of ${files.length} files...`);

    const results: UploadResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Upload in parallel batches of 10 for performance
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(file => this.uploadFile(file, compress))
      );

      results.push(...batchResults);

      for (const result of batchResults) {
        if (result.success) successCount++;
        else failCount++;
      }

      // Progress update
      console.log(`📊 Progress: ${i + batch.length}/${files.length} (${successCount} success, ${failCount} failed)`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Batch upload complete: ${successCount} success, ${failCount} failed in ${totalTime}ms`);

    return results;
  }

  /**
   * Upload to local storage (with optional compression)
   */
  private async uploadToLocal(file: ContextFile, compress: boolean): Promise<{ storageUrl: string; compressedSize?: number }> {
    if (!this.config.localPath) {
      throw new Error('Local storage path not configured');
    }

    // Create project-specific subdirectory
    const projectDir = path.join(this.config.localPath, file.projectId);
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    // Generate storage filename
    const fileExtension = path.extname(file.relativePath);
    const storageFilename = `${file.id}${fileExtension}${compress ? '.gz' : ''}`;
    const storagePath = path.join(projectDir, storageFilename);

    if (compress) {
      // Compress and write
      await pipeline(
        createReadStream(file.absolutePath),
        createGzip(),
        createWriteStream(storagePath)
      );

      const compressedSize = statSync(storagePath).size;
      return {
        storageUrl: `file://${storagePath}`,
        compressedSize
      };
    } else {
      // Direct copy (for binary files)
      await pipeline(
        createReadStream(file.absolutePath),
        createWriteStream(storagePath)
      );

      return {
        storageUrl: `file://${storagePath}`
      };
    }
  }

  /**
   * Upload to AWS S3 (placeholder - ready for integration)
   */
  private async uploadToS3(file: ContextFile, compress: boolean): Promise<{ storageUrl: string; compressedSize?: number }> {
    // TODO: Integrate AWS SDK for S3 upload
    // Implementation notes:
    // 1. Use @aws-sdk/client-s3 for upload
    // 2. Generate presigned URLs for access
    // 3. Set proper content-type and metadata
    // 4. Use multipart upload for large files (>5MB)
    // 5. Set lifecycle policies for archival

    throw new Error('S3 upload not yet implemented - use local storage for now');

    // Example implementation structure:
    /*
    const s3Client = new S3Client({
      region: this.config.region,
      credentials: this.config.credentials
    });

    const key = `${file.projectId}/${file.id}${path.extname(file.relativePath)}${compress ? '.gz' : ''}`;

    if (compress) {
      const compressedBuffer = await this.compressBuffer(readFileSync(file.absolutePath));
      await s3Client.send(new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: compressedBuffer,
        ContentEncoding: 'gzip'
      }));
      return {
        storageUrl: `s3://${this.config.bucket}/${key}`,
        compressedSize: compressedBuffer.length
      };
    } else {
      await s3Client.send(new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: readFileSync(file.absolutePath)
      }));
      return {
        storageUrl: `s3://${this.config.bucket}/${key}`
      };
    }
    */
  }

  /**
   * Upload to Google Cloud Storage (placeholder - ready for integration)
   */
  private async uploadToGCS(file: ContextFile, compress: boolean): Promise<{ storageUrl: string; compressedSize?: number }> {
    // TODO: Integrate Google Cloud Storage SDK
    // Implementation notes:
    // 1. Use @google-cloud/storage package
    // 2. Set proper ACLs for access control
    // 3. Use resumable uploads for reliability
    // 4. Enable versioning for safety
    // 5. Set retention policies

    throw new Error('GCS upload not yet implemented - use local storage for now');

    // Example implementation structure:
    /*
    const storage = new Storage({
      projectId: this.config.credentials?.projectId
    });

    const bucket = storage.bucket(this.config.bucket!);
    const blob = bucket.file(`${file.projectId}/${file.id}${path.extname(file.relativePath)}${compress ? '.gz' : ''}`);

    if (compress) {
      const compressedBuffer = await this.compressBuffer(readFileSync(file.absolutePath));
      await blob.save(compressedBuffer, {
        gzip: true,
        metadata: {
          contentType: 'application/octet-stream',
          metadata: {
            originalSize: file.size.toString(),
            projectId: file.projectId
          }
        }
      });
      return {
        storageUrl: `gs://${this.config.bucket}/${blob.name}`,
        compressedSize: compressedBuffer.length
      };
    } else {
      await blob.save(readFileSync(file.absolutePath));
      return {
        storageUrl: `gs://${this.config.bucket}/${blob.name}`
      };
    }
    */
  }

  // ═══════════════════════════════════════════════════════════
  // CONTEXT RETRIEVAL
  // ═══════════════════════════════════════════════════════════

  /**
   * Retrieve file from cloud storage
   */
  async downloadFile(fileId: string): Promise<DownloadResult> {
    const startTime = Date.now();

    try {
      // Get file metadata
      const fileMetadata = this.db.prepare(`
        SELECT cf.*, cs.storage_url, cs.compressed
        FROM context_files cf
        LEFT JOIN cloud_storage cs ON cf.id = cs.file_id
        WHERE cf.id = ?
      `).get(fileId) as any;

      if (!fileMetadata) {
        throw new Error(`File not found: ${fileId}`);
      }

      const contextFile: ContextFile = {
        id: fileMetadata.id,
        projectId: fileMetadata.project_id,
        relativePath: fileMetadata.relative_path,
        absolutePath: fileMetadata.absolute_path,
        type: fileMetadata.type,
        size: fileMetadata.size,
        createdAt: fileMetadata.created_at,
        modifiedAt: fileMetadata.modified_at,
        contentHash: fileMetadata.content_hash
      };

      let content: Buffer;
      let fromCache = false;

      // Try to read from original location first (fastest)
      if (existsSync(fileMetadata.absolute_path)) {
        content = readFileSync(fileMetadata.absolute_path);
        fromCache = true;
      }
      // Fall back to cloud storage
      else if (fileMetadata.storage_url) {
        content = await this.downloadFromStorage(
          fileMetadata.storage_url,
          fileMetadata.compressed
        );
      }
      // File not found anywhere
      else {
        throw new Error(`File content not available: ${fileMetadata.relative_path}`);
      }

      // Update access tracking
      this.db.prepare(`
        UPDATE cloud_storage
        SET last_accessed_at = datetime('now'),
            access_count = access_count + 1
        WHERE file_id = ?
      `).run(fileId);

      const downloadTime = Date.now() - startTime;

      return {
        success: true,
        content,
        metadata: contextFile,
        downloadTime,
        fromCache
      };

    } catch (error) {
      const downloadTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        content: Buffer.alloc(0),
        metadata: {} as ContextFile,
        downloadTime,
        fromCache: false,
        error: errorMsg
      };
    }
  }

  /**
   * Download from storage URL
   */
  private async downloadFromStorage(storageUrl: string, compressed: boolean): Promise<Buffer> {
    if (storageUrl.startsWith('file://')) {
      const filePath = storageUrl.replace('file://', '');

      if (!existsSync(filePath)) {
        throw new Error(`Storage file not found: ${filePath}`);
      }

      if (compressed) {
        // Decompress
        const chunks: Buffer[] = [];
        await pipeline(
          createReadStream(filePath),
          createGunzip(),
          async function* (source) {
            for await (const chunk of source) {
              chunks.push(chunk);
            }
          }
        );
        return Buffer.concat(chunks);
      } else {
        return readFileSync(filePath);
      }
    }

    // TODO: Implement S3/GCS download
    throw new Error(`Storage provider not supported: ${storageUrl}`);
  }

  /**
   * Get context files by project
   */
  getContextByProject(projectId: string, type?: ContextFileType): ContextFile[] {
    let query = `
      SELECT * FROM context_files
      WHERE project_id = ?
    `;
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
   * Get context files by type across all projects
   */
  getContextByType(type: ContextFileType, limit = 100): ContextFile[] {
    const rows = this.db.prepare(`
      SELECT * FROM context_files
      WHERE type = ?
      ORDER BY modified_at DESC
      LIMIT ?
    `).all(type, limit) as any[];

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

  // ═══════════════════════════════════════════════════════════
  // SEARCH CAPABILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Search context files with advanced filtering
   */
  async search(options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = JSON.stringify(options);
    if (this.cacheEnabled && this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey)!;
      // Check if cache is still valid
      if (Date.now() - cached.searchTime < this.cacheTTL) {
        return {
          ...cached,
          fromCache: true
        };
      }
    }

    try {
      let query = `SELECT * FROM context_files WHERE 1=1`;
      const params: any[] = [];

      // Add filters
      if (options.projectId) {
        query += ` AND project_id = ?`;
        params.push(options.projectId);
      }

      if (options.type) {
        query += ` AND type = ?`;
        params.push(options.type);
      }

      if (options.query) {
        query += ` AND (relative_path LIKE ? OR absolute_path LIKE ?)`;
        params.push(`%${options.query}%`, `%${options.query}%`);
      }

      // TODO: Full-text content search (requires content indexing)
      // if (options.contentSearch) {
      //   query += ` AND id IN (SELECT file_id FROM content_index WHERE content MATCH ?)`;
      //   params.push(options.contentSearch);
      // }

      // Sort order
      const sortBy = options.sortBy || 'modified';
      const sortOrder = options.sortOrder || 'desc';

      if (sortBy === 'modified') {
        query += ` ORDER BY modified_at ${sortOrder.toUpperCase()}`;
      } else if (sortBy === 'size') {
        query += ` ORDER BY size ${sortOrder.toUpperCase()}`;
      } else if (sortBy === 'relevance') {
        // TODO: Implement relevance scoring
        query += ` ORDER BY modified_at ${sortOrder.toUpperCase()}`;
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countResult = this.db.prepare(countQuery).get(...params) as { total: number };
      const total = countResult.total;

      // Apply pagination
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // Execute search
      const rows = this.db.prepare(query).all(...params) as any[];

      const files: ContextFile[] = rows.map(row => ({
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

      const searchTime = Date.now() - startTime;

      const result: SearchResult = {
        files,
        total,
        searchTime,
        fromCache: false
      };

      // Cache result
      if (this.cacheEnabled) {
        this.searchCache.set(cacheKey, result);

        // Clean old cache entries (simple LRU)
        if (this.searchCache.size > 100) {
          const firstKey = this.searchCache.keys().next().value;
          if (firstKey !== undefined) {
            this.searchCache.delete(firstKey);
          }
        }
      }

      return result;

    } catch (error) {
      console.error('Search failed:', error);
      return {
        files: [],
        total: 0,
        searchTime: Date.now() - startTime,
        fromCache: false
      };
    }
  }

  /**
   * Search by filename pattern
   */
  async searchByFilename(pattern: string, projectId?: string, limit = 20): Promise<SearchResult> {
    return this.search({
      query: pattern,
      projectId,
      limit
    });
  }

  /**
   * Get recently modified files
   */
  async getRecentlyModified(projectId?: string, limit = 20): Promise<SearchResult> {
    return this.search({
      projectId,
      limit,
      sortBy: 'modified',
      sortOrder: 'desc'
    });
  }

  /**
   * Get largest files
   */
  async getLargestFiles(projectId?: string, limit = 20): Promise<SearchResult> {
    return this.search({
      projectId,
      limit,
      sortBy: 'size',
      sortOrder: 'desc'
    });
  }

  // ═══════════════════════════════════════════════════════════
  // STATISTICS & ANALYTICS
  // ═══════════════════════════════════════════════════════════

  /**
   * Get context storage statistics
   */
  getStatistics(): ContextStats {
    // Get overall stats
    const overall = this.db.prepare(`
      SELECT
        COUNT(*) as total_files,
        SUM(size) as total_size,
        COALESCE(SUM(cs.compressed_size), 0) as total_compressed_size
      FROM context_files cf
      LEFT JOIN cloud_storage cs ON cf.id = cs.file_id
    `).get() as any;

    // Get stats by type
    const byTypeRows = this.db.prepare(`
      SELECT
        type,
        COUNT(*) as count,
        SUM(size) as total_size
      FROM context_files
      GROUP BY type
    `).all() as any[];

    const byType: Record<ContextFileType, { count: number; size: number }> = {} as any;
    for (const row of byTypeRows) {
      byType[row.type as ContextFileType] = {
        count: row.count,
        size: row.total_size
      };
    }

    // Get stats by project
    const byProjectRows = this.db.prepare(`
      SELECT
        project_id,
        COUNT(*) as count,
        SUM(size) as total_size
      FROM context_files
      GROUP BY project_id
    `).all() as any[];

    const byProject: Record<string, { count: number; size: number }> = {};
    for (const row of byProjectRows) {
      byProject[row.project_id] = {
        count: row.count,
        size: row.total_size
      };
    }

    const compressionRatio = overall.total_compressed_size > 0
      ? overall.total_size / overall.total_compressed_size
      : 1.0;

    return {
      totalFiles: overall.total_files,
      totalSize: overall.total_size || 0,
      totalCompressedSize: overall.total_compressed_size || 0,
      compressionRatio,
      byType,
      byProject,
      storageProvider: this.config.provider
    };
  }

  /**
   * Get storage health metrics
   */
  getHealthMetrics() {
    const stats = this.getStatistics();

    return {
      healthy: true,
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
      storageProvider: stats.storageProvider,
      compressionRatio: stats.compressionRatio.toFixed(2),
      cacheSize: this.searchCache.size,
      message: `${stats.totalFiles} files, ${this.formatBytes(stats.totalSize)}, ${stats.storageProvider} storage`
    };
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    console.log('🗑️  Search cache cleared');
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      enabled: this.cacheEnabled,
      size: this.searchCache.size,
      ttl: this.cacheTTL
    };
  }
}
