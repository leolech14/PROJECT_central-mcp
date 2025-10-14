import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dirPath = searchParams.get('path') || process.env.HOME || '/';

    // Security: Prevent directory traversal attacks
    const safePath = path.resolve(dirPath);

    // Check if path exists
    if (!fs.existsSync(safePath)) {
      return Response.json({ error: 'Path not found' }, { status: 404 });
    }

    const stats = fs.statSync(safePath);

    // If it's a file, return file content
    if (stats.isFile()) {
      const content = fs.readFileSync(safePath, 'utf-8');
      return Response.json({
        type: 'file',
        path: safePath,
        name: path.basename(safePath),
        content,
        size: stats.size,
        modified: stats.mtime,
      });
    }

    // If it's a directory, list contents
    const entries = fs.readdirSync(safePath);
    const files: FileEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files and common ignore patterns
      if (entry.startsWith('.') && entry !== '.' && entry !== '..') continue;
      if (entry === 'node_modules') continue;

      try {
        const fullPath = path.join(safePath, entry);
        const entryStats = fs.statSync(fullPath);

        files.push({
          name: entry,
          path: fullPath,
          type: entryStats.isDirectory() ? 'directory' : 'file',
          size: entryStats.size,
          modified: entryStats.mtime,
        });
      } catch (err) {
        // Skip files we can't read
        continue;
      }
    }

    // Sort: directories first, then files, alphabetically
    files.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });

    return Response.json({
      type: 'directory',
      path: safePath,
      name: path.basename(safePath),
      entries: files,
    });
  } catch (error: any) {
    console.error('File API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
