/**
 * Knowledge Pack Processor Utility
 * ===============================
 *
 * Processes knowledge pack contents for the Knowledge Space system.
 * Handles archive extraction, content indexing, and metadata generation.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Knowledge Space content processing and organization
 */

import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { extract as extractTar } from 'tar';
import yauzl from 'yauzl';
import { readmeParser, ReadmeContent } from './ReadmeParser.js';
import { filePreviewHelper, FilePreview } from './FilePreviewHelper.js';

export interface KnowledgePackMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  tags: string[];
  category: string;
  createdAt: string;
  fileSize: number;
  fileCount: number;
  readmePath?: string;
  readmeContent?: ReadmeContent;
  previewFiles: string[];
}

export interface ProcessedContent {
  filePath: string;
  relativePath: string;
  preview: FilePreview;
  metadata: {
    type: string;
    category: string;
    indexed: boolean;
  };
}

export interface KnowledgePackOptions {
  extractTo?: string;
  maxExtractSize?: number;
  includeBinaryFiles?: boolean;
  generatePreviews?: boolean;
  indexContent?: boolean;
}

export class KnowledgePackProcessor {
  private readonly defaultOptions: KnowledgePackOptions = {
    maxExtractSize: 50 * 1024 * 1024, // 50MB
    includeBinaryFiles: false,
    generatePreviews: true,
    indexContent: true
  };

  private readonly supportedArchiveTypes = ['.zip', '.tar', '.gz', '.tgz'];
  private readonly knowledgeFileTypes = ['.md', '.txt', '.json', '.yaml', '.yml', '.pdf'];
  private readonly codeFileTypes = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css'];

  /**
   * Process a knowledge pack file (archive or directory)
   */
  async processKnowledgePack(
    packPath: string,
    options: Partial<KnowledgePackOptions> = {}
  ): Promise<{
    metadata: KnowledgePackMetadata;
    contents: ProcessedContent[];
    extractionPath?: string;
  }> {
    const opts = { ...this.defaultOptions, ...options };
    const stats = await fs.stat(packPath);
    const packName = path.basename(packPath, path.extname(packPath));

    console.log(`Processing knowledge pack: ${packPath}`);

    let extractionPath: string | undefined;
    let contents: ProcessedContent[] = [];
    let readmeContent: ReadmeContent | undefined;
    let readmePath: string | undefined;
    let previewFiles: string[] = [];

    try {
      // Determine if it's an archive or directory
      if (stats.isDirectory()) {
        // Process as directory
        contents = await this.processDirectory(packPath, opts);
      } else {
        // Process as archive
        const extraction = await this.extractArchive(packPath, opts);
        extractionPath = extraction.path;
        contents = extraction.contents;
      }

      // Find and parse README
      const readmeFiles = contents.filter(c =>
        c.relativePath.toLowerCase().includes('readme') ||
        c.relativePath.toLowerCase().includes('read-me')
      );

      if (readmeFiles.length > 0) {
        readmePath = readmeFiles[0].filePath;
        try {
          readmeContent = await readmeParser.parseReadme(readmePath);
          previewFiles.push(readmePath);
        } catch (error) {
          console.warn(`Failed to parse README ${readmePath}:`, error);
        }
      }

      // Generate preview files list
      previewFiles.push(
        ...contents
          .filter(c =>
            this.knowledgeFileTypes.includes(path.extname(c.relativePath)) ||
            this.codeFileTypes.includes(path.extname(c.relativePath))
          )
          .slice(0, 10) // Limit to 10 preview files
          .map(c => c.filePath)
      );

      // Generate metadata
      const metadata: KnowledgePackMetadata = {
        id: this.generateId(packName),
        name: readmeContent?.metadata.title || packName,
        version: readmeContent?.metadata.version || '1.0.0',
        description: readmeContent?.metadata.description || readmeContent?.excerpt || `Knowledge pack: ${packName}`,
        author: readmeContent?.metadata.author,
        tags: readmeContent?.metadata.tags ? readmeContent.metadata.tags.split(',').map(t => t.trim()) : [],
        category: this.determineCategory(packName, readmeContent, contents),
        createdAt: new Date().toISOString(),
        fileSize: stats.isDirectory() ? await this.calculateDirectorySize(packPath) : stats.size,
        fileCount: contents.length,
        readmePath,
        readmeContent,
        previewFiles
      };

      return {
        metadata,
        contents,
        extractionPath
      };

    } catch (error) {
      // Cleanup extraction path if error occurred
      if (extractionPath && extractionPath !== packPath) {
        await this.cleanupExtractionPath(extractionPath);
      }
      throw error;
    }
  }

  /**
   * Extract archive file
   */
  private async extractArchive(
    archivePath: string,
    options: KnowledgePackOptions
  ): Promise<{
    path: string;
    contents: ProcessedContent[];
  }> {
    const ext = path.extname(archivePath).toLowerCase();
    const baseName = path.basename(archivePath, ext);
    const extractTo = options.extractTo || path.join(path.dirname(archivePath), `${baseName}_extracted_${Date.now()}`);

    // Create extraction directory
    await fs.mkdir(extractTo, { recursive: true });

    try {
      if (ext === '.zip') {
        await this.extractZip(archivePath, extractTo);
      } else if (ext === '.tar' || ext === '.gz' || ext === '.tgz') {
        await this.extractTarArchive(archivePath, extractTo);
      } else {
        throw new Error(`Unsupported archive format: ${ext}`);
      }

      // Process extracted contents
      const contents = await this.processDirectory(extractTo, options);

      return { path: extractTo, contents };

    } catch (error) {
      // Cleanup on error
      await this.cleanupExtractionPath(extractTo);
      throw error;
    }
  }

  /**
   * Extract ZIP archive
   */
  private async extractZip(zipPath: string, extractTo: string): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }

        if (!zipfile) {
          reject(new Error('Failed to open ZIP file'));
          return;
        }

        zipfile.readEntry();
        zipfile.on('entry', async (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            await fs.mkdir(path.join(extractTo, entry.fileName), { recursive: true });
            zipfile.readEntry();
          } else {
            // File entry
            zipfile.openReadStream(entry, async (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              if (readStream) {
                const outputPath = path.join(extractTo, entry.fileName);
                await fs.mkdir(path.dirname(outputPath), { recursive: true });
                const writeStream = createWriteStream(outputPath);

                try {
                  await pipeline(readStream, writeStream);
                } catch (pipelineError) {
                  reject(pipelineError);
                  return;
                }
              }

              zipfile.readEntry();
            });
          }
        });

        zipfile.on('end', () => {
          resolve();
        });

        zipfile.on('error', reject);
      });
    });
  }

  /**
   * Extract TAR archive
   */
  private async extractTarArchive(tarPath: string, extractTo: string): Promise<void> {
    try {
      await extractTar({
        file: tarPath,
        cwd: extractTo,
        strip: 0
      });
    } catch (error) {
      throw new Error(`Failed to extract TAR archive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process directory contents
   */
  private async processDirectory(
    dirPath: string,
    options: KnowledgePackOptions
  ): Promise<ProcessedContent[]> {
    const contents: ProcessedContent[] = [];

    async function processDirectory(currentPath: string, relativePath: string = ''): Promise<void> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await processDirectory(entryPath, entryRelativePath);
        } else if (entry.isFile()) {
          try {
            // Determine file category
            const category = this.categorizeFile(entry.name, entryRelativePath);

            // Generate preview if enabled and file is suitable
            let preview: FilePreview | undefined;
            if (options.generatePreviews && this.shouldGeneratePreview(entry.name)) {
              preview = await filePreviewHelper.generatePreview(entryPath);
            }

            const processedContent: ProcessedContent = {
              filePath: entryPath,
              relativePath: entryRelativePath,
              preview: preview || {
                fileName: entry.name,
                fileType: this.getFileType(entry.name),
                content: `File: ${entry.name}`,
                metadata: {
                  size: (await fs.stat(entryPath)).size,
                  lastModified: (await fs.stat(entryPath)).mtime.toISOString()
                },
                previewType: 'text',
                canPreview: false
              },
              metadata: {
                type: entry.isDirectory() ? 'directory' : 'file',
                category,
                indexed: options.indexContent && this.shouldIndexContent(entry.name)
              }
            };

            contents.push(processedContent);
          } catch (error) {
            console.warn(`Failed to process file ${entryPath}:`, error);
          }
        }
      }
    }

    await processDirectory(dirPath);
    return contents;
  }

  /**
   * Determine category of file based on name and path
   */
  private categorizeFile(fileName: string, relativePath: string): string {
    const lowerFileName = fileName.toLowerCase();
    const lowerPath = relativePath.toLowerCase();

    // Documentation
    if (lowerFileName.includes('readme') || lowerFileName.includes('read-me')) {
      return 'documentation';
    }
    if (['.md', '.txt', '.rst'].includes(path.extname(lowerFileName))) {
      return 'documentation';
    }

    // Code
    if (this.codeFileTypes.includes(path.extname(lowerFileName))) {
      return 'code';
    }

    // Configuration
    if (['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'].includes(path.extname(lowerFileName))) {
      return 'configuration';
    }

    // Assets
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(path.extname(lowerFileName))) {
      return 'assets';
    }

    // Knowledge files
    if (this.knowledgeFileTypes.includes(path.extname(lowerFileName))) {
      return 'knowledge';
    }

    // Test files
    if (lowerPath.includes('test') || lowerPath.includes('spec') || lowerFileName.includes('test')) {
      return 'tests';
    }

    // Examples
    if (lowerPath.includes('example') || lowerPath.includes('demo') || lowerFileName.includes('example')) {
      return 'examples';
    }

    return 'other';
  }

  /**
   * Get file type from extension
   */
  private getFileType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    if (this.codeFileTypes.includes(ext)) return 'code';
    if (this.knowledgeFileTypes.includes(ext)) return 'knowledge';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) return 'image';
    if (ext === '.pdf') return 'pdf';
    if (['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'].includes(ext)) return 'config';

    return 'other';
  }

  /**
   * Check if preview should be generated for file
   */
  private shouldGeneratePreview(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    const skipExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin', '.dat'];

    return !skipExtensions.includes(ext);
  }

  /**
   * Check if content should be indexed
   */
  private shouldIndexContent(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    const indexableExtensions = [
      ...this.knowledgeFileTypes,
      ...this.codeFileTypes,
      ...['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf']
    ];

    return indexableExtensions.includes(ext);
  }

  /**
   * Determine knowledge pack category
   */
  private determineCategory(
    packName: string,
    readmeContent?: ReadmeContent,
    contents?: ProcessedContent[]
  ): string {
    // From README metadata
    if (readmeContent?.metadata.category) {
      return readmeContent.metadata.category;
    }

    // From tags
    if (readmeContent?.metadata.tags) {
      const tags = readmeContent.metadata.tags.toLowerCase();
      if (tags.includes('voice') || tags.includes('audio')) return 'voice-systems';
      if (tags.includes('ai') || tags.includes('ml')) return 'ai-ml';
      if (tags.includes('web') || tags.includes('frontend')) return 'web-development';
      if (tags.includes('backend') || tags.includes('api')) return 'backend-development';
      if (tags.includes('security')) return 'security';
      if (tags.includes('devops') || tags.includes('deployment')) return 'devops';
    }

    // From pack name
    const name = packName.toLowerCase();
    if (name.includes('voice') || name.includes('audio')) return 'voice-systems';
    if (name.includes('ai') || name.includes('ml')) return 'ai-ml';
    if (name.includes('web') || name.includes('frontend')) return 'web-development';
    if (name.includes('backend') || name.includes('api')) return 'backend-development';

    // From contents analysis
    if (contents) {
      const codeFiles = contents.filter(c => c.metadata.category === 'code').length;
      const docFiles = contents.filter(c => c.metadata.category === 'documentation').length;
      const totalFiles = contents.length;

      if (codeFiles > totalFiles * 0.5) return 'code-library';
      if (docFiles > totalFiles * 0.5) return 'documentation';
    }

    return 'general';
  }

  /**
   * Generate unique ID for knowledge pack
   */
  private generateId(packName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const cleanName = packName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${cleanName}-${timestamp}-${random}`;
  }

  /**
   * Calculate directory size
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    async function calculateSize(currentPath: string): Promise<void> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await calculateSize(entryPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
        }
      }
    }

    await calculateSize(dirPath);
    return totalSize;
  }

  /**
   * Cleanup extraction path
   */
  private async cleanupExtractionPath(extractionPath: string): Promise<void> {
    try {
      await fs.rm(extractionPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup extraction path ${extractionPath}:`, error);
    }
  }

  /**
   * Search within processed knowledge pack contents
   */
  async searchInPack(
    contents: ProcessedContent[],
    query: string
  ): Promise<{
    results: Array<{
      file: ProcessedContent;
      matches: Array<{
        line: number;
        content: string;
        context: string;
      }>;
    }>;
    totalMatches: number;
  }> {
    const results: Array<{
      file: ProcessedContent;
      matches: Array<{
        line: number;
        content: string;
        context: string;
      }>;
    }> = [];
    let totalMatches = 0;

    for (const content of contents) {
      if (!content.metadata.indexed) continue;

      try {
        const searchResult = await filePreviewHelper.searchInFile(content.filePath, query);

        if (searchResult.totalMatches > 0) {
          results.push({
            file: content,
            matches: searchResult.matches
          });
          totalMatches += searchResult.totalMatches;
        }
      } catch (error) {
        console.warn(`Failed to search in ${content.filePath}:`, error);
      }
    }

    return { results, totalMatches };
  }

  /**
   * Generate statistics for knowledge pack
   */
  generateStatistics(contents: ProcessedContent[]): {
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    filesByCategory: Record<string, number>;
    largestFiles: Array<{ name: string; size: number; type: string }>;
  } {
    const filesByType: Record<string, number> = {};
    const filesByCategory: Record<string, number> = {};
    let totalSize = 0;
    const fileSizes: Array<{ name: string; size: number; type: string }> = [];

    for (const content of contents) {
      const fileType = content.preview.fileType;
      const category = content.metadata.category;
      const size = content.preview.metadata.size || 0;

      filesByType[fileType] = (filesByType[fileType] || 0) + 1;
      filesByCategory[category] = (filesByCategory[category] || 0) + 1;
      totalSize += size;

      fileSizes.push({
        name: content.fileName,
        size,
        type: fileType
      });
    }

    // Sort largest files
    const largestFiles = fileSizes
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      totalFiles: contents.length,
      totalSize,
      filesByType,
      filesByCategory,
      largestFiles
    };
  }
}

// Export singleton instance
export const knowledgePackProcessor = new KnowledgePackProcessor();

// Export types for external use
export type { KnowledgePackMetadata, ProcessedContent, KnowledgePackOptions };