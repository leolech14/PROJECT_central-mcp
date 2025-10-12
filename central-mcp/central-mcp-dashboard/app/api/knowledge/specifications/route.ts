import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SPECBASES_PATH = process.env.SPECBASES_PATH ||
  '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/02_SPECBASES';

export const dynamic = 'force-dynamic';

interface Specification {
  id: string;
  name: string;
  path: string;
  size: number;
  created: string;
  modified: string;
  number: number | null;
  title: string;
  preview: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list'; // list, read, stats
    const specId = searchParams.get('id') || '';
    const search = searchParams.get('search') || '';

    if (action === 'list') {
      // List all specifications
      const specs: Specification[] = [];

      try {
        const entries = await fs.readdir(SPECBASES_PATH, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.md')) {
            const filePath = path.join(SPECBASES_PATH, entry.name);
            const stats = await fs.stat(filePath);

            // Extract spec number and title from filename
            const match = entry.name.match(/^(\d+)_(.+)\.md$/);
            const specNumber = match ? parseInt(match[1]) : null;
            const title = match ? match[2].replace(/_/g, ' ') : entry.name.replace('.md', '');

            // Read first 500 characters as preview
            const content = await fs.readFile(filePath, 'utf-8');
            const preview = content.substring(0, 500).replace(/\n/g, ' ').trim() + '...';

            // Filter by search if provided
            if (search && !title.toLowerCase().includes(search.toLowerCase()) && !content.toLowerCase().includes(search.toLowerCase())) {
              continue;
            }

            specs.push({
              id: entry.name,
              name: entry.name,
              path: filePath,
              size: stats.size,
              created: stats.birthtime.toISOString(),
              modified: stats.mtime.toISOString(),
              number: specNumber,
              title,
              preview
            });
          }
        }

        // Sort by spec number
        specs.sort((a, b) => (a.number || 0) - (b.number || 0));

        return NextResponse.json({ specs });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({ specs: [], error: 'Specbases directory not found' });
        }
        throw error;
      }
    }

    if (action === 'read' && specId) {
      // Read a specific specification
      const filePath = path.join(SPECBASES_PATH, specId);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);

        return NextResponse.json({
          id: specId,
          name: specId,
          content,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({ error: 'Specification not found' }, { status: 404 });
        }
        throw error;
      }
    }

    if (action === 'stats') {
      // Get statistics
      try {
        const entries = await fs.readdir(SPECBASES_PATH, { withFileTypes: true });

        let totalSize = 0;
        let specCount = 0;

        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.md')) {
            const filePath = path.join(SPECBASES_PATH, entry.name);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
            specCount++;
          }
        }

        return NextResponse.json({
          totalSpecs: specCount,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({
            totalSpecs: 0,
            totalSize: 0,
            error: 'Specbases directory not found'
          });
        }
        throw error;
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Specifications API error:', error);
    return NextResponse.json(
      { error: 'Failed to access specifications', details: error.message },
      { status: 500 }
    );
  }
}
