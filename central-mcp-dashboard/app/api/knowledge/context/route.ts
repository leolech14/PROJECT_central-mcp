import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const CONTEXT_STORAGE_PATH = process.env.CONTEXT_STORAGE_PATH ||
  '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/context-storage';

export const dynamic = 'force-dynamic';

interface ContextFile {
  id: string;
  path: string;
  size: number;
  created: string;
  modified: string;
  extension: string;
  compressed: boolean;
}

interface ContextCollection {
  id: string;
  path: string;
  fileCount: number;
  totalSize: number;
  files: ContextFile[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list'; // list, read, stats
    const collectionId = searchParams.get('collection') || '';
    const fileId = searchParams.get('file') || '';

    if (action === 'list') {
      // List all context collections
      const collections: ContextCollection[] = [];

      try {
        const entries = await fs.readdir(CONTEXT_STORAGE_PATH, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const collectionPath = path.join(CONTEXT_STORAGE_PATH, entry.name);
            const files = await fs.readdir(collectionPath, { withFileTypes: true });

            const fileInfos: ContextFile[] = [];
            let totalSize = 0;

            for (const file of files) {
              if (file.isFile()) {
                const filePath = path.join(collectionPath, file.name);
                const stats = await fs.stat(filePath);

                fileInfos.push({
                  id: file.name,
                  path: filePath,
                  size: stats.size,
                  created: stats.birthtime.toISOString(),
                  modified: stats.mtime.toISOString(),
                  extension: path.extname(file.name),
                  compressed: file.name.endsWith('.gz')
                });

                totalSize += stats.size;
              }
            }

            collections.push({
              id: entry.name,
              path: collectionPath,
              fileCount: fileInfos.length,
              totalSize,
              files: fileInfos
            });
          }
        }

        return NextResponse.json({ collections });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({ collections: [], error: 'Context storage not found' });
        }
        throw error;
      }
    }

    if (action === 'read' && collectionId && fileId) {
      // Read a specific context file
      const filePath = path.join(CONTEXT_STORAGE_PATH, collectionId, fileId);

      try {
        // Check if file exists
        await fs.access(filePath);

        // Read file
        const buffer = await fs.readFile(filePath);

        // If gzipped, decompress
        if (fileId.endsWith('.gz')) {
          const decompressed = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const readable = Readable.from(buffer);
            const gunzip = createGunzip();

            gunzip.on('data', (chunk) => chunks.push(chunk));
            gunzip.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            gunzip.on('error', reject);

            readable.pipe(gunzip);
          });

          return NextResponse.json({
            collection: collectionId,
            file: fileId,
            content: decompressed,
            compressed: true,
            size: buffer.length,
            decompressedSize: decompressed.length
          });
        } else {
          // Return as text
          const content = buffer.toString('utf-8');

          return NextResponse.json({
            collection: collectionId,
            file: fileId,
            content,
            compressed: false,
            size: buffer.length
          });
        }

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        throw error;
      }
    }

    if (action === 'stats') {
      // Get overall statistics
      const collections: ContextCollection[] = [];
      let totalFiles = 0;
      let totalSize = 0;

      try {
        const entries = await fs.readdir(CONTEXT_STORAGE_PATH, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const collectionPath = path.join(CONTEXT_STORAGE_PATH, entry.name);
            const files = await fs.readdir(collectionPath, { withFileTypes: true });

            let collectionSize = 0;
            for (const file of files) {
              if (file.isFile()) {
                const filePath = path.join(collectionPath, file.name);
                const stats = await fs.stat(filePath);
                collectionSize += stats.size;
              }
            }

            totalFiles += files.length;
            totalSize += collectionSize;

            collections.push({
              id: entry.name,
              path: collectionPath,
              fileCount: files.length,
              totalSize: collectionSize,
              files: []
            });
          }
        }

        return NextResponse.json({
          totalCollections: collections.length,
          totalFiles,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          collections
        });

      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return NextResponse.json({
            totalCollections: 0,
            totalFiles: 0,
            totalSize: 0,
            error: 'Context storage not found'
          });
        }
        throw error;
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Context API error:', error);
    return NextResponse.json(
      { error: 'Failed to access context storage', details: error.message },
      { status: 500 }
    );
  }
}
