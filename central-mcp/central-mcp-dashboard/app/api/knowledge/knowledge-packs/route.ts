import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { knowledgePackProcessor } from '@/../../src/utils/KnowledgePackProcessor';
import { readmeParser } from '@/../../src/utils/ReadmeParser';

const KNOWLEDGE_PACKS_PATH = process.env.KNOWLEDGE_PACKS_PATH ||
  '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS';

export const dynamic = 'force-dynamic';

interface KnowledgePack {
  name: string;
  path: string;
  size: number;
  created: string;
  modified: string;
  extension: string;
  type: 'archive' | 'document' | 'other';
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  readmeContent?: string;
  knowledgePacks: KnowledgePack[];
  fileCount: number;
  lastModified: string;
  path: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list'; // list, stats, categories, process

    if (action === 'list') {
      // List all knowledge packs
      const packs: KnowledgePack[] = [];

      try {
        const entries = await fs.readdir(KNOWLEDGE_PACKS_PATH, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isFile() && !entry.name.startsWith('.')) {
            const filePath = path.join(KNOWLEDGE_PACKS_PATH, entry.name);
            const stats = await fs.stat(filePath);
            const ext = path.extname(entry.name).toLowerCase();

            let type: 'archive' | 'document' | 'other' = 'other';
            if (['.zip', '.tar', '.gz', '.7z'].includes(ext)) {
              type = 'archive';
            } else if (['.md', '.txt', '.pdf', '.doc', '.docx'].includes(ext)) {
              type = 'document';
            }

            packs.push({
              name: entry.name,
              path: filePath,
              size: stats.size,
              created: stats.birthtime.toISOString(),
              modified: stats.mtime.toISOString(),
              extension: ext,
              type
            });
          }
        }

        // Sort by modified date descending
        packs.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

        return NextResponse.json({ packs });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({ packs: [], error: 'Knowledge packs directory not found' });
        }
        throw error;
      }
    }

    if (action === 'stats') {
      // Get statistics
      try {
        const entries = await fs.readdir(KNOWLEDGE_PACKS_PATH, { withFileTypes: true });

        let totalSize = 0;
        let archiveCount = 0;
        let documentCount = 0;
        let otherCount = 0;

        for (const entry of entries) {
          if (entry.isFile() && !entry.name.startsWith('.')) {
            const filePath = path.join(KNOWLEDGE_PACKS_PATH, entry.name);
            const stats = await fs.stat(filePath);
            const ext = path.extname(entry.name).toLowerCase();

            totalSize += stats.size;

            if (['.zip', '.tar', '.gz', '.7z'].includes(ext)) {
              archiveCount++;
            } else if (['.md', '.txt', '.pdf', '.doc', '.docx'].includes(ext)) {
              documentCount++;
            } else {
              otherCount++;
            }
          }
        }

        return NextResponse.json({
          totalPacks: archiveCount + documentCount + otherCount,
          archiveCount,
          documentCount,
          otherCount,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({
            totalPacks: 0,
            archiveCount: 0,
            documentCount: 0,
            otherCount: 0,
            totalSize: 0,
            error: 'Knowledge packs directory not found'
          });
        }
        throw error;
      }
    }

    if (action === 'categories') {
      // Get knowledge space categories
      const categories: KnowledgeCategory[] = [];
      let totalKnowledgePacks = 0;

      try {
        const entries = await fs.readdir(KNOWLEDGE_PACKS_PATH, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const categoryPath = path.join(KNOWLEDGE_PACKS_PATH, entry.name);
            const categoryStats = await fs.stat(categoryPath);

            // Read README if exists
            let readmeContent: string | undefined;
            let description = `Knowledge category: ${entry.name}`;

            try {
              const readmePath = path.join(categoryPath, 'README.md');
              const readmeData = await readmeParser.parseReadme(readmePath);
              readmeContent = readmeData.rawContent;
              description = readmeData.metadata.description || readmeData.excerpt || description;
            } catch (error) {
              // No README or failed to parse
            }

            // Get knowledge packs in this category
            const categoryPacks: KnowledgePack[] = [];
            const packEntries = await fs.readdir(categoryPath, { withFileTypes: true });

            for (const packEntry of packEntries) {
              if (packEntry.isFile() && !packEntry.name.startsWith('.')) {
                const packPath = path.join(categoryPath, packEntry.name);
                const packStats = await fs.stat(packPath);
                const ext = path.extname(packEntry.name).toLowerCase();

                let type: 'archive' | 'document' | 'other' = 'other';
                if (['.zip', '.tar', '.gz', '.7z', '.tgz'].includes(ext)) {
                  type = 'archive';
                } else if (['.md', '.txt', '.pdf', '.doc', '.docx'].includes(ext)) {
                  type = 'document';
                }

                categoryPacks.push({
                  name: packEntry.name,
                  path: packPath,
                  size: packStats.size,
                  created: packStats.birthtime.toISOString(),
                  modified: packStats.mtime.toISOString(),
                  extension: ext,
                  type
                });
              }
            }

            categories.push({
              id: entry.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              name: entry.name,
              description,
              readmeContent,
              knowledgePacks: categoryPacks.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()),
              fileCount: categoryPacks.length,
              lastModified: categoryStats.mtime.toISOString(),
              path: categoryPath
            });

            totalKnowledgePacks += categoryPacks.length;
          }
        }

        // Sort categories by name
        categories.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
          categories,
          totalCategories: categories.length,
          totalKnowledgePacks,
          lastUpdated: new Date().toISOString()
        });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({
            categories: [],
            totalCategories: 0,
            totalKnowledgePacks: 0,
            lastUpdated: new Date().toISOString(),
            error: 'Knowledge packs directory not found'
          });
        }
        throw error;
      }
    }

    if (action === 'process') {
      // Process a specific knowledge pack
      const packPath = searchParams.get('path');

      if (!packPath) {
        return NextResponse.json({ error: 'Pack path parameter is required' }, { status: 400 });
      }

      try {
        const result = await knowledgePackProcessor.processKnowledgePack(packPath);
        const statistics = knowledgePackProcessor.generateStatistics(result.contents);

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            statistics
          }
        });

      } catch (error: any) {
        return NextResponse.json({
          error: 'Failed to process knowledge pack',
          message: error.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Knowledge packs API error:', error);
    return NextResponse.json(
      { error: 'Failed to access knowledge packs', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/knowledge/knowledge-packs - Process knowledge pack with custom options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packPath, options = {} } = body;

    if (!packPath) {
      return NextResponse.json(
        { error: 'Pack path is required' },
        { status: 400 }
      );
    }

    // Process knowledge pack with custom options
    const result = await knowledgePackProcessor.processKnowledgePack(packPath, options);

    // Generate statistics
    const statistics = knowledgePackProcessor.generateStatistics(result.contents);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        statistics,
        options
      }
    });

  } catch (error: any) {
    console.error('Error processing knowledge pack:', error);
    return NextResponse.json(
      {
        error: 'Failed to process knowledge pack',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// PUT /api/knowledge/knowledge-packs/search - Search within processed knowledge pack
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, query } = body;

    if (!contents || !Array.isArray(contents) || !query) {
      return NextResponse.json(
        { error: 'Contents array and query string are required' },
        { status: 400 }
      );
    }

    // Search within knowledge pack contents
    const searchResults = await knowledgePackProcessor.searchInPack(contents, query);

    return NextResponse.json({
      success: true,
      data: {
        query,
        ...searchResults
      }
    });

  } catch (error: any) {
    console.error('Error searching knowledge pack:', error);
    return NextResponse.json(
      {
        error: 'Failed to search knowledge pack',
        message: error.message
      },
      { status: 500 }
    );
  }
}
