/**
 * Knowledge Space API Route
 * =========================
 *
 * Main API endpoint for Central-MCP Knowledge Space system.
 * Provides automatic category generation from directory structure
 * and comprehensive knowledge pack information.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Central-MCP Knowledge Space main API
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { readmeParser } from '@/../../src/utils/ReadmeParser';

const KNOWLEDGE_SPACE_PATH = process.env.KNOWLEDGE_SPACE_PATH ||
  '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS';

export const dynamic = 'force-dynamic';

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  readmeContent?: string;
  readmeMetadata?: any;
  knowledgePacks: KnowledgePack[];
  fileCount: number;
  totalSize: number;
  lastModified: string;
  path: string;
}

interface KnowledgePack {
  name: string;
  path: string;
  size: number;
  created: string;
  modified: string;
  extension: string;
  type: 'archive' | 'document' | 'code' | 'other';
  description?: string;
}

interface KnowledgeSpaceResponse {
  categories: KnowledgeCategory[];
  totalCategories: number;
  totalKnowledgePacks: number;
  totalSize: number;
  lastUpdated: string;
  knowledgeSpacePath: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeReadmeContent = searchParams.get('includeReadme') === 'true';
    const categoryId = searchParams.get('category');

    const categories: KnowledgeCategory[] = [];
    let totalKnowledgePacks = 0;
    let totalSize = 0;

    try {
      const entries = await fs.readdir(KNOWLEDGE_SPACE_PATH, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // Skip if specific category requested and this doesn't match
          if (categoryId && entry.name.toLowerCase() !== categoryId.toLowerCase()) {
            continue;
          }

          const categoryPath = path.join(KNOWLEDGE_SPACE_PATH, entry.name);
          const categoryStats = await fs.stat(categoryPath);

          // Read and parse README if exists
          let readmeContent: string | undefined;
          let readmeMetadata: any;
          let description = `Knowledge category: ${entry.name}`;

          try {
            const readmePath = path.join(categoryPath, 'README.md');
            const readmeData = await readmeParser.parseReadme(readmePath);

            if (includeReadmeContent) {
              readmeContent = readmeData.rawContent;
            }

            readmeMetadata = readmeData.metadata;
            description = readmeData.metadata.description ||
                         readmeData.excerpt ||
                         description;
          } catch (error) {
            // No README or failed to parse - continue with default description
          }

          // Get knowledge packs in this category
          const categoryPacks: KnowledgePack[] = [];
          let categoryTotalSize = 0;

          try {
            const packEntries = await fs.readdir(categoryPath, { withFileTypes: true });

            for (const packEntry of packEntries) {
              if (packEntry.isFile() && !packEntry.name.startsWith('.')) {
                const packPath = path.join(categoryPath, packEntry.name);
                const packStats = await fs.stat(packPath);
                const ext = path.extname(packEntry.name).toLowerCase();

                let type: 'archive' | 'document' | 'code' | 'other' = 'other';
                if (['.zip', '.tar', '.gz', '.7z', '.tgz'].includes(ext)) {
                  type = 'archive';
                } else if (['.md', '.txt', '.pdf', '.doc', '.docx'].includes(ext)) {
                  type = 'document';
                } else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html'].includes(ext)) {
                  type = 'code';
                }

                // Extract description from filename if it's a knowledge pack
                let packDescription: string | undefined;
                if (packEntry.name.includes('v1.') || packEntry.name.includes('v2.')) {
                  const versionMatch = packEntry.name.match(/v(\d+\.\d+\.\d+)/);
                  if (versionMatch) {
                    packDescription = `Version ${versionMatch[1]} knowledge pack`;
                  }
                }

                categoryPacks.push({
                  name: packEntry.name,
                  path: packPath,
                  size: packStats.size,
                  created: packStats.birthtime.toISOString(),
                  modified: packStats.mtime.toISOString(),
                  extension: ext,
                  type,
                  description: packDescription
                });

                categoryTotalSize += packStats.size;
              }
            }

            // Sort packs by modified date descending, archives first
            categoryPacks.sort((a, b) => {
              if (a.type !== b.type) {
                const typeOrder = { 'archive': 0, 'document': 1, 'code': 2, 'other': 3 };
                return typeOrder[a.type] - typeOrder[b.type];
              }
              return new Date(b.modified).getTime() - new Date(a.modified).getTime();
            });

          } catch (error) {
            console.warn(`Failed to read directory ${categoryPath}:`, error);
          }

          const category: KnowledgeCategory = {
            id: entry.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: entry.name,
            description,
            readmeContent: includeReadmeContent ? readmeContent : undefined,
            readmeMetadata,
            knowledgePacks: categoryPacks,
            fileCount: categoryPacks.length,
            totalSize: categoryTotalSize,
            lastModified: categoryStats.mtime.toISOString(),
            path: categoryPath
          };

          categories.push(category);
          totalKnowledgePacks += categoryPacks.length;
          totalSize += categoryTotalSize;
        }
      }

      // Sort categories by name
      categories.sort((a, b) => a.name.localeCompare(b.name));

      const response: KnowledgeSpaceResponse = {
        categories,
        totalCategories: categories.length,
        totalKnowledgePacks,
        totalSize,
        lastUpdated: new Date().toISOString(),
        knowledgeSpacePath: KNOWLEDGE_SPACE_PATH
      };

      return NextResponse.json(response);

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        const emptyResponse: KnowledgeSpaceResponse = {
          categories: [],
          totalCategories: 0,
          totalKnowledgePacks: 0,
          totalSize: 0,
          lastUpdated: new Date().toISOString(),
          knowledgeSpacePath: KNOWLEDGE_SPACE_PATH,
          error: 'Knowledge space directory not found'
        };

        return NextResponse.json(emptyResponse);
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Knowledge Space API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to access knowledge space',
        details: error.message,
        knowledgeSpacePath: KNOWLEDGE_SPACE_PATH
      },
      { status: 500 }
    );
  }
}

// POST /api/knowledge/space - Search knowledge space
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, categories, types } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Get all categories
    const getResponse = await GET(request);
    const spaceData: KnowledgeSpaceResponse = await getResponse.json();

    const searchResults = {
      query,
      matchedCategories: [] as KnowledgeCategory[],
      totalMatches: 0,
      totalFiles: 0
    };

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);

    for (const category of spaceData.categories) {
      // Filter by categories if specified
      if (categories && categories.length > 0 && !categories.includes(category.id)) {
        continue;
      }

      const categoryMatches = {
        ...category,
        knowledgePacks: [] as KnowledgePack[],
        matchReason: [] as string[]
      };

      // Check category name and description
      const categoryText = `${category.name} ${category.description}`.toLowerCase();
      const categoryMatch = searchTerms.some(term => categoryText.includes(term));

      if (categoryMatch) {
        categoryMatches.matchReason.push('Category matches search');
      }

      // Check knowledge packs
      for (const pack of category.knowledgePacks) {
        // Filter by types if specified
        if (types && types.length > 0 && !types.includes(pack.type)) {
          continue;
        }

        const packText = `${pack.name} ${pack.description || ''}`.toLowerCase();
        const packMatch = searchTerms.some(term => packText.includes(term));

        if (packMatch) {
          categoryMatches.knowledgePacks.push(pack);
          searchResults.totalFiles++;
        }
      }

      // Include category if it matches or has matching packs
      if (categoryMatch || categoryMatches.knowledgePacks.length > 0) {
        searchResults.matchedCategories.push(categoryMatches);
        searchResults.totalMatches++;
      }
    }

    return NextResponse.json({
      success: true,
      data: searchResults
    });

  } catch (error: any) {
    console.error('Knowledge Space search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search knowledge space',
        message: error.message
      },
      { status: 500 }
    );
  }
}