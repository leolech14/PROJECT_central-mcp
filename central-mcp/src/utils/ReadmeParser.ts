/**
 * README Parser Utility
 * =====================
 *
 * Extracts structured information from README files for knowledge space context.
 * Supports multiple README formats and provides consistent metadata extraction.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Knowledge Space README parsing and metadata extraction
 */

import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import matter from 'gray-matter';

export interface ReadmeMetadata {
  title?: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  lastModified?: string;
  purpose?: string;
  status?: string;
  category?: string;
}

export interface ReadmeContent {
  rawContent: string;
  htmlContent: string;
  excerpt: string;
  sections: ReadmeSection[];
  metadata: ReadmeMetadata;
  wordCount: number;
  readingTime: number;
}

export interface ReadmeSection {
  title: string;
  level: number;
  content: string;
  htmlContent: string;
}

export class ReadmeParser {
  private readonly commonPatterns = {
    title: [
      /^#\s+(.+)$/m,
      /^<h1[^>]*>(.+?)<\/h1>$/mi,
      /^title:\s*(.+)$/mi,
      /^Title:\s*(.+)$/mi
    ],
    description: [
      /^##\s+(?:Description|Overview|Purpose|About)\s*\n\n([^#\n]+)/mi,
      /^description:\s*(.+)$/mi,
      /^Description:\s*(.+)$/mi,
      /<p[^>]*>([^<]{50,300})<\/p>/mi
    ],
    author: [
      /^author:\s*(.+)$/mi,
      /^Author:\s*(.+)$/mi,
      /^by\s+(.+)$/mi,
      /\*\*Author\*\*:\s*(.+)$/mi
    ],
    version: [
      /^version:\s*(.+)$/mi,
      /^Version:\s*(.+)$/mi,
      /^v(\d+\.\d+\.\d+)/mi,
      /\*\*Version\*\*:\s*(.+)$/mi
    ],
    tags: [
      /^tags?:\s*\[([^\]]+)\]/mi,
      /^Tags?:\s*(.+)$/mi,
      /\*\*Tags?\*\*:\s*(.+)$/mi
    ],
    status: [
      /^status:\s*(.+)$/mi,
      /^Status:\s*(.+)$/mi,
      /\*\*Status\*\*:\s*(.+)$/mi
    ],
    category: [
      /^category:\s*(.+)$/mi,
      /^Category:\s*(.+)$/mi,
      /\*\*Category\*\*:\s*(.+)$/mi
    ]
  };

  /**
   * Parse a README file and extract structured content
   */
  async parseReadme(filePath: string): Promise<ReadmeContent> {
    try {
      const stats = await fs.stat(filePath);
      const rawContent = await fs.readFile(filePath, 'utf-8');

      // Parse frontmatter if present
      const { data: frontmatter, content: markdownContent } = matter(rawContent);

      // Extract sections from markdown
      const sections = this.extractSections(markdownContent);

      // Extract metadata
      const metadata = await this.extractMetadata(
        rawContent,
        frontmatter,
        stats.mtime
      );

      // Convert to HTML
      const htmlContent = marked(markdownContent);

      // Generate excerpt
      const excerpt = this.generateExcerpt(markdownContent, sections);

      // Calculate metrics
      const wordCount = this.countWords(markdownContent);
      const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

      return {
        rawContent,
        htmlContent,
        excerpt,
        sections,
        metadata,
        wordCount,
        readingTime
      };
    } catch (error) {
      console.error(`Error parsing README ${filePath}:`, error);
      throw new Error(`Failed to parse README: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract sections from markdown content
   */
  private extractSections(content: string): ReadmeSection[] {
    const sections: ReadmeSection[] = [];
    const lines = content.split('\n');
    let currentSection: ReadmeSection | null = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line is a header
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          currentSection.htmlContent = marked(currentSection.content);
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: headerMatch[2].trim(),
          level: headerMatch[1].length,
          content: '',
          htmlContent: ''
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      currentSection.htmlContent = marked(currentSection.content);
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract metadata from content and frontmatter
   */
  private async extractMetadata(
    content: string,
    frontmatter: any,
    lastModified: Date
  ): Promise<ReadmeMetadata> {
    const metadata: ReadmeMetadata = {
      lastModified: lastModified.toISOString()
    };

    // Extract from frontmatter first (highest priority)
    if (frontmatter) {
      metadata.title = frontmatter.title;
      metadata.description = frontmatter.description;
      metadata.author = frontmatter.author;
      metadata.version = frontmatter.version;
      metadata.tags = frontmatter.tags;
      metadata.status = frontmatter.status;
      metadata.category = frontmatter.category;
      metadata.purpose = frontmatter.purpose;
    }

    // Extract from content patterns if not in frontmatter
    for (const [key, patterns] of Object.entries(this.commonPatterns)) {
      if (metadata[key as keyof ReadmeMetadata]) continue; // Skip if already found

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          let value = match[1]?.trim();

          if (key === 'tags') {
            // Parse tags from various formats
            value = value
              ?.replace(/[\[\]]/g, '')
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean)
              .join(', ');
          }

          if (value) {
            (metadata as any)[key] = value;
            break;
          }
        }
      }
    }

    // Try to infer title from filename if not found
    if (!metadata.title) {
      const inferredTitle = content.match(/^#\s+(.+)$/m);
      if (inferredTitle) {
        metadata.title = inferredTitle[1].trim();
      }
    }

    // Generate description from first paragraph if not found
    if (!metadata.description) {
      const firstParagraph = content.match(/^#+\s+.*?\n\n(.+?)(?=\n\n|\n#|$)/s);
      if (firstParagraph) {
        metadata.description = firstParagraph[1].trim().replace(/\n+/g, ' ');
      }
    }

    return metadata;
  }

  /**
   * Generate a concise excerpt from content
   */
  private generateExcerpt(content: string, sections: ReadmeSection[]): string {
    // Try to get description section first
    const descriptionSection = sections.find(s =>
      /description|overview|purpose|about/i.test(s.title)
    );

    if (descriptionSection) {
      return this.truncateText(descriptionSection.content, 200);
    }

    // Try first non-header section
    const firstSection = sections.find(s => s.level > 1);
    if (firstSection) {
      return this.truncateText(firstSection.content, 200);
    }

    // Fallback to first paragraph
    const firstParagraph = content.match(/^#\s+.*?\n\n(.+?)(?=\n\n|\n#|$)/s);
    if (firstParagraph) {
      return this.truncateText(firstParagraph[1], 200);
    }

    // Last resort
    return this.truncateText(content, 200);
  }

  /**
   * Truncate text to specified length with ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    const cleanText = text.replace(/\n+/g, ' ').trim();
    if (cleanText.length <= maxLength) return cleanText;

    return cleanText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Find and parse README files in a directory
   */
  async findReadmesInDirectory(dirPath: string): Promise<string[]> {
    const readmeNames = [
      'README.md',
      'readme.md',
      'README',
      'readme',
      'README.markdown',
      'README.txt'
    ];

    const foundReadmes: string[] = [];

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile() && readmeNames.includes(file)) {
          foundReadmes.push(filePath);
        } else if (stats.isDirectory()) {
          // Recursively search subdirectories
          const subDirReadmes = await this.findReadmesInDirectory(filePath);
          foundReadmes.push(...subDirReadmes);
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dirPath}:`, error);
    }

    return foundReadmes;
  }

  /**
   * Batch parse multiple README files
   */
  async parseMultipleReadmes(filePaths: string[]): Promise<Map<string, ReadmeContent>> {
    const results = new Map<string, ReadmeContent>();

    await Promise.allSettled(
      filePaths.map(async (filePath) => {
        try {
          const content = await this.parseReadme(filePath);
          results.set(filePath, content);
        } catch (error) {
          console.error(`Failed to parse ${filePath}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Search for specific keywords in README content
   */
  searchKeywords(content: ReadmeContent, keywords: string[]): boolean {
    const searchText = (
      content.rawContent.toLowerCase() +
      ' ' +
      Object.values(content.metadata).join(' ').toLowerCase()
    );

    return keywords.some(keyword =>
      searchText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Get README summary for category cards
   */
  getCardSummary(content: ReadmeContent): {
    title: string;
    description: string;
    tags: string[];
    status?: string;
    readingTime: number;
  } {
    return {
      title: content.metadata.title || 'Untitled',
      description: content.excerpt || content.metadata.description || 'No description available',
      tags: content.metadata.tags ? content.metadata.tags.split(',').map(t => t.trim()) : [],
      status: content.metadata.status,
      readingTime: content.readingTime
    };
  }
}

// Export singleton instance
export const readmeParser = new ReadmeParser();

// Export types for external use
export type { ReadmeMetadata, ReadmeContent, ReadmeSection };