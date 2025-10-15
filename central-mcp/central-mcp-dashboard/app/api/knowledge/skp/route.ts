import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';

// Open database connection
async function openDb(): Promise<Database> {
  return open({
    filename: path.join(process.cwd(), '../data/registry.db'),
    driver: sqlite3.Database,
  });
}

// GET /api/knowledge/skp - List all SKPs
// GET /api/knowledge/skp?skp_id=XXX - Get specific SKP info
// GET /api/knowledge/skp?skp_id=XXX&action=contents - List SKP contents
// GET /api/knowledge/skp?skp_id=XXX&file=YYY - Get specific file from SKP
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skp_id = searchParams.get('skp_id');
    const action = searchParams.get('action');
    const file = searchParams.get('file');

    const db = await openDb();

    // List all SKPs
    if (!skp_id) {
      const skps = await db.all(`
        SELECT
          skp_id,
          display_name,
          category,
          current_version,
          file_count,
          total_words,
          file_path,
          created_at,
          updated_at
        FROM skp_registry
        ORDER BY created_at DESC
      `);

      await db.close();

      return NextResponse.json({
        success: true,
        skps,
        total: skps.length,
      });
    }

    // Get specific SKP info
    const skp = await db.get(
      `SELECT * FROM skp_registry WHERE skp_id = ?`,
      [skp_id]
    );

    if (!skp) {
      await db.close();
      return NextResponse.json(
        { success: false, error: 'SKP not found' },
        { status: 404 }
      );
    }

    // List SKP contents
    if (action === 'contents') {
      const filePath = path.join(process.cwd(), '..', skp.file_path);

      try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();

        const contents = entries.map(entry => ({
          name: entry.entryName,
          size: entry.header.size,
          compressedSize: entry.header.compressedSize,
          date: entry.header.time,
          isDirectory: entry.isDirectory,
        }));

        await db.close();

        return NextResponse.json({
          success: true,
          skp_id,
          contents,
          total_files: contents.length,
        });
      } catch (error) {
        await db.close();
        return NextResponse.json(
          { success: false, error: `Failed to read SKP: ${error}` },
          { status: 500 }
        );
      }
    }

    // Get specific file from SKP
    if (file) {
      const filePath = path.join(process.cwd(), '..', skp.file_path);

      try {
        const zip = new AdmZip(filePath);
        const entry = zip.getEntry(file);

        if (!entry) {
          await db.close();
          return NextResponse.json(
            { success: false, error: 'File not found in SKP' },
            { status: 404 }
          );
        }

        const content = zip.readAsText(entry);

        // Log usage
        await db.run(
          `INSERT INTO skp_usage (skp_id, usage_type, accessed_by, context) VALUES (?, ?, ?, ?)`,
          [skp_id, 'file_accessed', 'dashboard', file]
        );

        await db.close();

        return NextResponse.json({
          success: true,
          skp_id,
          file,
          content,
        });
      } catch (error) {
        await db.close();
        return NextResponse.json(
          { success: false, error: `Failed to read file: ${error}` },
          { status: 500 }
        );
      }
    }

    // Get SKP info with version history
    const versions = await db.all(
      `SELECT version, changelog, files_added, files_updated, created_at, created_by
       FROM skp_versions WHERE skp_id = ? ORDER BY created_at DESC`,
      [skp_id]
    );

    // Log usage
    await db.run(
      `INSERT INTO skp_usage (skp_id, usage_type, accessed_by) VALUES (?, ?, ?)`,
      [skp_id, 'info_accessed', 'dashboard']
    );

    await db.close();

    return NextResponse.json({
      success: true,
      skp,
      versions,
    });
  } catch (error) {
    console.error('SKP API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/knowledge/skp - Search within SKPs
export async function POST(request: NextRequest) {
  try {
    const { skp_id, query } = await request.json();

    if (!skp_id || !query) {
      return NextResponse.json(
        { success: false, error: 'skp_id and query required' },
        { status: 400 }
      );
    }

    const db = await openDb();

    const skp = await db.get(
      `SELECT * FROM skp_registry WHERE skp_id = ?`,
      [skp_id]
    );

    if (!skp) {
      await db.close();
      return NextResponse.json(
        { success: false, error: 'SKP not found' },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), '..', skp.file_path);

    try {
      const zip = new AdmZip(filePath);
      const entries = zip.getEntries();

      const results: any[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        try {
          const content = zip.readAsText(entry);
          const lines = content.split('\n');

          lines.forEach((line, lineNumber) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                file: entry.entryName,
                line: lineNumber + 1,
                content: line.trim(),
              });
            }
          });
        } catch (e) {
          // Skip binary files
        }
      }

      // Log usage
      await db.run(
        `INSERT INTO skp_usage (skp_id, usage_type, accessed_by, context) VALUES (?, ?, ?, ?)`,
        [skp_id, 'searched', 'dashboard', query]
      );

      await db.close();

      return NextResponse.json({
        success: true,
        skp_id,
        query,
        results,
        total_matches: results.length,
      });
    } catch (error) {
      await db.close();
      return NextResponse.json(
        { success: false, error: `Search failed: ${error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('SKP search error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
