/**
 * Knowledge Space API
 * ===================
 *
 * API endpoint for the Central-MCP Knowledge Space system.
 * Provides automatic category generation from directory structure.
 */

import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { promisify } from 'util';
import { createReadStream, statSync } from 'fs';
import type {
  KnowledgeSpaceResponse,
  KnowledgeCategory,
  KnowledgePack,
  KnowledgeSpaceQuery,
  KnowledgePackDownloadResponse,
  KnowledgeSpaceStats,
  KnowledgeSpaceSearchResult
} from '../types/knowledge-space.js';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

/**
 * Knowledge Space configuration
 */
const KNOWLEDGE_SPACE_CONFIG = {
  rootPath: join(process.cwd(), '03_CONTEXT_FILES', 'SPECIALIZED_KNOWLEDGE_PACKS'),
  enableCache: true,
  cacheDuration: 300, // 5 minutes
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedExtensions: ['.zip', '.md', '.txt', '.json', '.pdf', '.js', '.ts'],
  generateDownloadUrls: true,
  downloadBaseUrl: '/api/knowledge/download',
  trackStats: true
};

/**
 * Cache for knowledge space data
 */
let knowledgeSpaceCache: {
  data: KnowledgeSpaceResponse | null;
  lastUpdated: number;
} = {
  data: null,
  lastUpdated: 0
};

/**
 * Extract category description from README content
 */
function extractDescription(readmeContent: string): string {
  const lines = readmeContent.split('\n');

  // Look for purpose section
  const purposeIndex = lines.findIndex(line =>
    line.toLowerCase().includes('## 🎯 purpose') ||
    line.toLowerCase().includes('## purpose')
  );

  if (purposeIndex !== -1 && lines[purposeIndex + 1]) {
    return lines[purposeIndex + 1].replace(/^This category contains /, '');
  }

  // Fallback to first paragraph after title
  const titleIndex = lines.findIndex(line => line.startsWith('# '));
  if (titleIndex !== -1) {
    for (let i = titleIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('```')) {
        return line;
      }
    }
  }

  return 'Knowledge resources and implementation guides';
}

/**
 * Extract tags from README content
 */
function extractTags(readmeContent: string): string[] {
  const tags: string[] = [];
  const lines = readmeContent.split('\n');

  // Look for tags in various formats
  lines.forEach(line => {
    const match = line.match(/(?:tags?|labels?):\s*(.+)$/i);
    if (match) {
      tags.push(...match[1].split(',').map(t => t.trim()));
    }
  });

  // Extract keywords from content
  const content = readmeContent.toLowerCase();
  const keywords = [
    'react', 'vue', 'angular', 'nodejs', 'python', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'rest', 'graphql', 'api', 'database', 'security',
    'testing', 'ci/cd', 'deployment', 'monitoring', 'performance', 'webRTC',
    'ai', 'machine learning', 'microservices', 'serverless'
  ];

  keywords.forEach(keyword => {
    if (content.includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  });

  return tags.slice(0, 10); // Limit to 10 tags
}

/**
 * Get icon for category based on folder name
 */
function getCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    'voice-systems': '🎤',
    'ai-integration': '🤖',
    'web-development': '🌐',
    'backend-services': '⚙️',
    'deployment': '🚀',
    'miscellaneous': '📚'
  };

  return iconMap[categoryName] || '📁';
}

/**
 * Check if a knowledge pack is featured
 */
function isFeaturedPack(fileName: string): boolean {
  const featuredKeywords = [
    'ultrathink', 'mastery', 'complete', 'ultimate', 'pro', 'advanced',
    'production-ready', 'comprehensive', 'definitive'
  ];

  const name = fileName.toLowerCase();
  return featuredKeywords.some(keyword => name.includes(keyword));
}

/**
 * Extract version from filename
 */
function extractVersion(fileName: string): string | undefined {
  const match = fileName.match(/v?(\d+\.\d+\.\d+)/i);
  return match ? match[1] : undefined;
}

/**
 * Scan directory for knowledge packs
 */
async function scanDirectory(dirPath: string, relativePath: string = ''): Promise<KnowledgePack[]> {
  try {
    const entries = await fs.readdir(dirPath) as string[];
    const packs: KnowledgePack[] = [];

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const entryRelativePath = relativePath ? join(relativePath, entry) : entry;
      const stats = await fs.stat(fullPath) as { isDirectory: () => boolean; size: number; mtime: Date };

      if (entry.startsWith('.') || entry === 'node_modules') {
        continue;
      }

      if (stats.isDirectory()) {
        // Recursively scan subdirectories
        const subPacks = await scanDirectory(fullPath, entryRelativePath);
        packs.push(...subPacks);
      } else {
        // Check if file extension is allowed
        const ext = extname(entry);
        if (KNOWLEDGE_SPACE_CONFIG.allowedExtensions.includes(ext)) {
          const pack: KnowledgePack = {
            name: entry,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            description: generateDescription(entry),
            extension: ext,
            path: entryRelativePath,
            featured: isFeaturedPack(entry),
            version: extractVersion(entry)
          };
          packs.push(pack);
        }
      }
    }

    return packs.sort((a, b) => {
      // Featured items first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Then by last modified
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Generate description from filename
 */
function generateDescription(fileName: string): string {
  const name = basename(fileName, extname(fileName));
  const description = name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/([A-Z])/g, ' $1')
    .trim();

  const ext = extname(fileName);
  const typeMap: Record<string, string> = {
    '.zip': 'Compressed knowledge pack',
    '.md': 'Documentation',
    '.pdf': 'PDF document',
    '.json': 'JSON data',
    '.js': 'JavaScript code',
    '.ts': 'TypeScript code',
    '.txt': 'Text file'
  };

  return `${description} - ${typeMap[ext] || 'File'}`;
}

/**
 * Get knowledge space data
 */
export async function getKnowledgeSpace(query?: KnowledgeSpaceQuery): Promise<KnowledgeSpaceResponse> {
  // Check cache
  if (KNOWLEDGE_SPACE_CONFIG.enableCache && knowledgeSpaceCache.data) {
    const now = Date.now();
    if (now - knowledgeSpaceCache.lastUpdated < KNOWLEDGE_SPACE_CONFIG.cacheDuration * 1000) {
      return filterKnowledgeSpace(knowledgeSpaceCache.data, query);
    }
  }

  try {
    const categories: KnowledgeCategory[] = [];
    const entries = await fs.readdir(KNOWLEDGE_SPACE_CONFIG.rootPath) as string[];
    let totalKnowledgePacks = 0;
    let totalSize = 0;

    for (const entry of entries) {
      const categoryPath = join(KNOWLEDGE_SPACE_CONFIG.rootPath, entry);
      const stats = await fs.stat(categoryPath) as { isDirectory: () => boolean; size: number; mtime: Date };

      if (stats.isDirectory() && !entry.startsWith('.')) {
        // Read README.md if it exists
        let readmeContent = '';
        try {
          const readmePath = join(categoryPath, 'README.md');
          readmeContent = await readFile(readmePath, 'utf-8') as string;
        } catch (error) {
          // README not found, continue with empty content
        }

        // Scan for knowledge packs
        const knowledgePacks = await scanDirectory(categoryPath);
        const fileCount = knowledgePacks.length;
        const categorySize = knowledgePacks.reduce((sum, pack) => sum + pack.size, 0);

        const category: KnowledgeCategory = {
          id: entry,
          name: entry.split('-').map((word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          description: extractDescription(readmeContent),
          readmeContent,
          knowledgePacks,
          fileCount,
          totalSize: categorySize,
          lastModified: stats.mtime.toISOString(),
          icon: getCategoryIcon(entry),
          tags: extractTags(readmeContent)
        };

        categories.push(category);
        totalKnowledgePacks += fileCount;
        totalSize += categorySize;
      }
    }

    // Sort categories
    categories.sort((a, b) => {
      // Categories with featured packs first
      const aFeatured = a.knowledgePacks.some(p => p.featured);
      const bFeatured = b.knowledgePacks.some(p => p.featured);

      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;

      // Then by last modified
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    const response: KnowledgeSpaceResponse = {
      categories,
      totalCategories: categories.length,
      totalKnowledgePacks,
      totalSize,
      lastUpdated: new Date().toISOString(),
      systemInfo: {
        version: '1.0.0',
        apiVersion: 'v1',
        uptime: process.uptime()
      }
    };

    // Update cache
    if (KNOWLEDGE_SPACE_CONFIG.enableCache) {
      knowledgeSpaceCache = {
        data: response,
        lastUpdated: Date.now()
      };
    }

    return filterKnowledgeSpace(response, query);
  } catch (error) {
    console.error('Error getting knowledge space:', error);
    throw new Error(`Failed to get knowledge space: ${(error as Error).message}`);
  }
}

/**
 * Filter knowledge space based on query parameters
 */
function filterKnowledgeSpace(
  knowledgeSpace: KnowledgeSpaceResponse,
  query?: KnowledgeSpaceQuery
): KnowledgeSpaceResponse {
  if (!query) return knowledgeSpace;

  let categories = [...knowledgeSpace.categories];

  // Filter by categories
  if (query.categories && query.categories.length > 0) {
    categories = categories.filter(cat => query.categories!.includes(cat.id));
  }

  // Search within categories
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    categories = categories.map(category => ({
      ...category,
      knowledgePacks: category.knowledgePacks.filter(pack =>
        pack.name.toLowerCase().includes(searchTerm) ||
        pack.description?.toLowerCase().includes(searchTerm)
      )
    })).filter(category => category.knowledgePacks.length > 0);
  }

  // Filter by file types
  if (query.fileTypes && query.fileTypes.length > 0) {
    categories = categories.map(category => ({
      ...category,
      knowledgePacks: category.knowledgePacks.filter(pack =>
        query.fileTypes!.includes(pack.extension || '')
      )
    })).filter(category => category.knowledgePacks.length > 0);
  }

  // Featured only
  if (query.featuredOnly) {
    categories = categories.map(category => ({
      ...category,
      knowledgePacks: category.knowledgePacks.filter(pack => pack.featured)
    })).filter(category => category.knowledgePacks.length > 0);
  }

  // Sort knowledge packs within categories
  const sortBy = query.sortBy || 'lastModified';
  const sortOrder = query.sortOrder || 'desc';

  categories = categories.map(category => ({
    ...category,
    knowledgePacks: [...category.knowledgePacks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'lastModified':
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
          break;
        case 'downloads':
          comparison = (category.stats?.downloads || 0) - (b.featured ? 1 : 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    })
  }));

  // Apply pagination
  if (query.offset || query.limit) {
    const offset = query.offset || 0;
    const limit = query.limit || categories.length;
    categories = categories.slice(offset, offset + limit);
  }

  return {
    ...knowledgeSpace,
    categories,
    totalCategories: categories.length,
    totalKnowledgePacks: categories.reduce((sum, cat) => sum + cat.knowledgePacks.length, 0)
  };
}

/**
 * Get knowledge space statistics
 */
export async function getKnowledgeSpaceStats(): Promise<KnowledgeSpaceStats> {
  const knowledgeSpace = await getKnowledgeSpace();

  const popularCategories = knowledgeSpace.categories
    .map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      downloadCount: category.stats?.downloads || 0
    }))
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 5);

  const recentlyUpdated = knowledgeSpace.categories
    .map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      lastModified: category.lastModified
    }))
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 5);

  const storageByCategory = knowledgeSpace.categories.map(category => ({
    categoryId: category.id,
    categoryName: category.name,
    size: category.totalSize,
    fileCount: category.fileCount
  }));

  const fileTypeDistribution: Record<string, { count: number; totalSize: number }> = {};

  knowledgeSpace.categories.forEach(category => {
    category.knowledgePacks.forEach(pack => {
      const ext = pack.extension || 'unknown';
      if (!fileTypeDistribution[ext]) {
        fileTypeDistribution[ext] = { count: 0, totalSize: 0 };
      }
      fileTypeDistribution[ext].count++;
      fileTypeDistribution[ext].totalSize += pack.size;
    });
  });

  const fileTypeDistributionArray = Object.entries(fileTypeDistribution).map(([extension, data]) => ({
    extension,
    count: data.count,
    totalSize: data.totalSize
  }));

  return {
    totalCategories: knowledgeSpace.totalCategories,
    totalKnowledgePacks: knowledgeSpace.totalKnowledgePacks,
    totalStorageUsed: knowledgeSpace.totalSize,
    popularCategories,
    recentlyUpdated,
    storageByCategory,
    fileTypeDistribution: fileTypeDistributionArray
  };
}

/**
 * Search knowledge space
 */
export async function searchKnowledgeSpace(query: string): Promise<KnowledgeSpaceSearchResult> {
  const startTime = Date.now();
  const knowledgeSpace = await getKnowledgeSpace();
  const searchTerm = query.toLowerCase();
  const matches: Array<{
    category: KnowledgeCategory;
    pack: KnowledgePack;
    relevanceScore: number;
    matchedFields: string[];
  }> = [];

  knowledgeSpace.categories.forEach(category => {
    category.knowledgePacks.forEach(pack => {
      const matchedFields: string[] = [];
      let relevanceScore = 0;

      // Search in name
      if (pack.name.toLowerCase().includes(searchTerm)) {
        matchedFields.push('name');
        relevanceScore += 10;
      }

      // Search in description
      if (pack.description?.toLowerCase().includes(searchTerm)) {
        matchedFields.push('description');
        relevanceScore += 5;
      }

      // Search in category name
      if (category.name.toLowerCase().includes(searchTerm)) {
        matchedFields.push('category');
        relevanceScore += 3;
      }

      // Search in tags
      if (category.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
        matchedFields.push('tags');
        relevanceScore += 7;
      }

      // Search in readme content
      if (category.readmeContent.toLowerCase().includes(searchTerm)) {
        matchedFields.push('content');
        relevanceScore += 2;
      }

      if (relevanceScore > 0) {
        matches.push({
          category,
          pack,
          relevanceScore,
          matchedFields
        });
      }
    });
  });

  // Sort by relevance score
  matches.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Generate suggestions
  const suggestions = knowledgeSpace.categories
    .flatMap(cat => cat.tags)
    .filter(tag => tag.toLowerCase().includes(searchTerm))
    .slice(0, 5);

  return {
    query,
    totalMatches: matches.length,
    matches: matches.slice(0, 50), // Limit to 50 results
    suggestions,
    searchDuration: Date.now() - startTime
  };
}

/**
 * Clear knowledge space cache
 */
export function clearKnowledgeSpaceCache(): void {
  knowledgeSpaceCache = {
    data: null,
    lastUpdated: 0
  };
}