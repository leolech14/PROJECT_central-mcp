/**
 * File Preview Helper Utility
 * ==========================
 *
 * Provides file preview functionality for various file types in the Knowledge Space.
 * Handles markdown rendering, syntax highlighting, and preview generation.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Knowledge Space file preview and display utilities
 */

import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Types for file preview
export interface FilePreview {
  fileName: string;
  fileType: string;
  content: string;
  htmlContent?: string;
  metadata: FileMetadata;
  previewType: 'text' | 'markdown' | 'code' | 'image' | 'pdf' | 'binary';
  canPreview: boolean;
}

export interface FileMetadata {
  size: number;
  lastModified: string;
  encoding?: string;
  language?: string;
  lines?: number;
  truncated?: boolean;
}

export interface PreviewOptions {
  maxFileSize?: number;
  maxLines?: number;
  includeLineNumbers?: boolean;
  syntaxHighlighting?: boolean;
  truncateLongLines?: boolean;
  maxLineLength?: number;
}

export class FilePreviewHelper {
  private readonly defaultOptions: PreviewOptions = {
    maxFileSize: 1024 * 1024, // 1MB
    maxLines: 100,
    includeLineNumbers: true,
    syntaxHighlighting: true,
    truncateLongLines: true,
    maxLineLength: 500
  };

  // File type mappings
  private readonly fileTypes = {
    // Text files
    text: ['.txt', '.md', '.markdown', '.rst', '.adoc'],
    code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss', '.less', '.html', '.htm', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sql', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd', '.dockerfile', '.gitignore', '.env', '.log'],
    config: ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.env', '.dockerfile'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'],
    pdf: ['.pdf'],
    document: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp'],
    archive: ['.zip', '.tar', '.gz', '.bz2', '.7z', '.rar'],
    binary: ['.exe', '.dll', '.so', '.dylib', '.bin', '.dat']
  };

  // Language mapping for syntax highlighting
  private readonly languageMap: { [key: string]: string } = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.html': 'html',
    '.htm': 'html',
    '.xml': 'xml',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.fish': 'fish',
    '.ps1': 'powershell',
    '.dockerfile': 'dockerfile',
    '.gitignore': 'gitignore',
    '.md': 'markdown',
    '.markdown': 'markdown'
  };

  /**
   * Generate file preview
   */
  async generatePreview(filePath: string, options: Partial<PreviewOptions> = {}): Promise<FilePreview> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const fileExt = path.extname(filePath).toLowerCase();

      // Determine file type and preview capability
      const previewType = this.determinePreviewType(fileExt, stats.size, opts.maxFileSize!);
      const canPreview = this.canPreviewFile(previewType, stats.size, opts.maxFileSize!);

      const metadata: FileMetadata = {
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        truncated: false
      };

      let content = '';
      let htmlContent: string | undefined;

      if (canPreview) {
        switch (previewType) {
          case 'text':
          case 'code':
            const fileContent = await this.readTextFile(filePath, opts);
            content = fileContent.content;
            metadata.encoding = fileContent.encoding;
            metadata.lines = fileContent.lines;
            metadata.truncated = fileContent.truncated;
            metadata.language = this.getLanguageFromExtension(fileExt);

            if (opts.syntaxHighlighting && metadata.language) {
              htmlContent = await this.highlightCode(content, metadata.language, opts);
            }
            break;

          case 'markdown':
            const markdownContent = await this.readTextFile(filePath, opts);
            content = markdownContent.content;
            metadata.encoding = markdownContent.encoding;
            metadata.lines = markdownContent.lines;
            metadata.truncated = markdownContent.truncated;

            try {
              htmlContent = marked(content);
            } catch (error) {
              console.warn(`Error parsing markdown ${filePath}:`, error);
              htmlContent = `<pre>${this.escapeHtml(content)}</pre>`;
            }
            break;

          case 'image':
            content = `Image file: ${fileName} (${this.formatFileSize(stats.size)})`;
            htmlContent = `<div class="image-preview">
              <img src="/api/files/preview?path=${encodeURIComponent(filePath)}" alt="${fileName}" />
              <p>Image: ${fileName} (${this.formatFileSize(stats.size)})</p>
            </div>`;
            break;

          case 'pdf':
            content = `PDF file: ${fileName} (${this.formatFileSize(stats.size)})`;
            htmlContent = `<div class="pdf-preview">
              <p>PDF: ${fileName} (${this.formatFileSize(stats.size)})</p>
              <a href="/api/files/download?path=${encodeURIComponent(filePath)}" class="download-link">Download PDF</a>
            </div>`;
            break;

          default:
            content = `Binary file: ${fileName} (${this.formatFileSize(stats.size)})`;
            break;
        }
      } else {
        content = `File too large or not previewable: ${fileName} (${this.formatFileSize(stats.size)})`;
      }

      return {
        fileName,
        fileType: this.getFileType(fileExt),
        content,
        htmlContent,
        metadata,
        previewType,
        canPreview
      };

    } catch (error) {
      console.error(`Error generating preview for ${filePath}:`, error);

      return {
        fileName: path.basename(filePath),
        fileType: 'unknown',
        content: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          size: 0,
          lastModified: new Date().toISOString()
        },
        previewType: 'text',
        canPreview: false
      };
    }
  }

  /**
   * Determine preview type based on file extension and size
   */
  private determinePreviewType(extension: string, size: number, maxFileSize: number): FilePreview['previewType'] {
    if (size > maxFileSize) {
      return 'binary';
    }

    for (const [type, extensions] of Object.entries(this.fileTypes)) {
      if (extensions.includes(extension)) {
        if (type === 'text' || type === 'code') {
          return extension === '.md' || extension === '.markdown' ? 'markdown' : 'code';
        }
        return type as FilePreview['previewType'];
      }
    }

    return 'binary';
  }

  /**
   * Check if file can be previewed
   */
  private canPreviewFile(previewType: FilePreview['previewType'], size: number, maxFileSize: number): boolean {
    if (size > maxFileSize) {
      return false;
    }

    return ['text', 'markdown', 'code', 'image', 'pdf'].includes(previewType);
  }

  /**
   * Read text file with size and line limits
   */
  private async readTextFile(filePath: string, options: PreviewOptions): Promise<{
    content: string;
    encoding: string;
    lines: number;
    truncated: boolean;
  }> {
    const stats = await fs.stat(filePath);
    let encoding = 'utf8';
    let content = '';

    try {
      content = await fs.readFile(filePath, encoding);
    } catch (error) {
      // Try different encodings
      const encodings = ['utf8', 'latin1', 'ascii'];
      for (const enc of encodings) {
        try {
          content = await fs.readFile(filePath, enc);
          encoding = enc;
          break;
        } catch {
          continue;
        }
      }
      if (!content) {
        throw error;
      }
    }

    let truncated = false;

    // Truncate by lines if specified
    if (options.maxLines && options.maxLines > 0) {
      const lines = content.split('\n');
      if (lines.length > options.maxLines) {
        content = lines.slice(0, options.maxLines).join('\n') + '\n... (truncated)';
        truncated = true;
      }
    }

    // Truncate long lines if specified
    if (options.truncateLongLines && options.maxLineLength && options.maxLineLength > 0) {
      content = content
        .split('\n')
        .map(line => {
          if (line.length > options.maxLineLength!) {
            return line.substring(0, options.maxLineLength) + '...';
          }
          return line;
        })
        .join('\n');
    }

    // Add line numbers if specified
    if (options.includeLineNumbers) {
      const lines = content.split('\n');
      content = lines
        .map((line, index) => `${(index + 1).toString().padStart(4, ' ')} | ${line}`)
        .join('\n');
    }

    return {
      content,
      encoding,
      lines: content.split('\n').length,
      truncated
    };
  }

  /**
   * Get language from file extension
   */
  private getLanguageFromExtension(extension: string): string | undefined {
    return this.languageMap[extension];
  }

  /**
   * Apply syntax highlighting to code
   */
  private async highlightCode(code: string, language: string, options: PreviewOptions): Promise<string> {
    try {
      // For now, return simple HTML with basic styling
      // In a real implementation, you would use a library like Prism.js or highlight.js
      const escapedCode = this.escapeHtml(code);
      const className = options.includeLineNumbers ? 'line-numbers' : '';

      return `<pre class="code-highlight ${className}" data-language="${language}"><code>${escapedCode}</code></pre>`;
    } catch (error) {
      console.warn(`Error highlighting code:`, error);
      return `<pre>${this.escapeHtml(code)}</pre>`;
    }
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Get file type category from extension
   */
  private getFileType(extension: string): string {
    for (const [type, extensions] of Object.entries(this.fileTypes)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }
    return 'unknown';
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Generate preview for multiple files
   */
  async generateMultiplePreviews(filePaths: string[], options: Partial<PreviewOptions> = {}): Promise<Map<string, FilePreview>> {
    const results = new Map<string, FilePreview>();

    await Promise.allSettled(
      filePaths.map(async (filePath) => {
        try {
          const preview = await this.generatePreview(filePath, options);
          results.set(filePath, preview);
        } catch (error) {
          console.error(`Failed to generate preview for ${filePath}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Get file list with basic metadata for directory browsing
   */
  async getDirectoryListing(dirPath: string): Promise<{
    files: Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      size?: number;
      lastModified: string;
      extension?: string;
    }>;
    totalSize: number;
    fileCount: number;
  }> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      let totalSize = 0;
      let fileCount = 0;

      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          const stats = await fs.stat(fullPath);
          const extension = entry.isFile() ? path.extname(entry.name).toLowerCase() : undefined;

          if (entry.isFile()) {
            totalSize += stats.size;
            fileCount++;
          }

          return {
            name: entry.name,
            path: fullPath,
            type: entry.isFile() ? 'file' as const : 'directory' as const,
            size: entry.isFile() ? stats.size : undefined,
            lastModified: stats.mtime.toISOString(),
            extension
          };
        })
      );

      // Sort: directories first, then files, both alphabetically
      files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return {
        files,
        totalSize,
        fileCount
      };

    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return {
        files: [],
        totalSize: 0,
        fileCount: 0
      };
    }
  }

  /**
   * Search within file content (for indexed files)
   */
  async searchInFile(filePath: string, query: string, options: Partial<PreviewOptions> = {}): Promise<{
    matches: Array<{
      line: number;
      content: string;
      context: string;
    }>;
    totalMatches: number;
  }> {
    try {
      const preview = await this.generatePreview(filePath, { ...options, syntaxHighlighting: false });

      if (!['text', 'markdown', 'code'].includes(preview.previewType)) {
        return { matches: [], totalMatches: 0 };
      }

      const lines = preview.content.split('\n');
      const matches: Array<{
        line: number;
        content: string;
        context: string;
      }> = [];
      const queryLower = query.toLowerCase();

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          // Get context (2 lines before and after)
          const contextStart = Math.max(0, i - 2);
          const contextEnd = Math.min(lines.length - 1, i + 2);
          const contextLines = lines.slice(contextStart, contextEnd + 1);

          matches.push({
            line: i + 1,
            content: lines[i],
            context: contextLines.join('\n')
          });
        }
      }

      return { matches, totalMatches: matches.length };

    } catch (error) {
      console.error(`Error searching in file ${filePath}:`, error);
      return { matches: [], totalMatches: 0 };
    }
  }
}

// Export singleton instance
export const filePreviewHelper = new FilePreviewHelper();

// Export types for external use
export type { FilePreview, FileMetadata, PreviewOptions };