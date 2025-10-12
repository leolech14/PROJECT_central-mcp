import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list'; // list, stats

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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Knowledge packs API error:', error);
    return NextResponse.json(
      { error: 'Failed to access knowledge packs', details: error.message },
      { status: 500 }
    );
  }
}
