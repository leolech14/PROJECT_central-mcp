/**
 * Knowledge Space File Preview API Route
 * =====================================
 *
 * API endpoints for generating file previews and directory listings
 * for the Knowledge Space system.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Knowledge Space file preview API
 */

import { NextRequest, NextResponse } from 'next/server';
import { filePreviewHelper } from '../../../../src/utils/FilePreviewHelper';
import fs from 'fs/promises';

// GET /api/knowledge/preview - Generate file preview or directory listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const type = searchParams.get('type') || 'auto'; // auto, file, directory
    const maxLines = searchParams.get('maxLines');
    const maxFileSize = searchParams.get('maxFileSize');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Check if path exists
    try {
      await fs.access(path);
    } catch (error) {
      return NextResponse.json(
        { error: 'Path does not exist' },
        { status: 404 }
      );
    }

    const stats = await fs.stat(path);

    // Build preview options
    const options: any = {};
    if (maxLines) options.maxLines = parseInt(maxLines);
    if (maxFileSize) options.maxFileSize = parseInt(maxFileSize);

    if (stats.isDirectory() || type === 'directory') {
      // Generate directory listing
      const directoryListing = await filePreviewHelper.getDirectoryListing(path);

      return NextResponse.json({
        success: true,
        type: 'directory',
        data: directoryListing
      });

    } else {
      // Generate file preview
      const preview = await filePreviewHelper.generatePreview(path, options);

      return NextResponse.json({
        success: true,
        type: 'file',
        data: preview
      });
    }

  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/knowledge/preview - Batch generate previews
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paths, options = {} } = body;

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'Paths array is required' },
        { status: 400 }
      );
    }

    // Batch generate previews
    const results = await filePreviewHelper.generateMultiplePreviews(paths, options);

    // Convert to array format
    const previews = Array.from(results.entries()).map(([path, preview]) => ({
      path,
      ...preview
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalFiles: paths.length,
        generatedPreviews: previews.length,
        previews
      }
    });

  } catch (error) {
    console.error('Error batch generating previews:', error);
    return NextResponse.json(
      {
        error: 'Failed to batch generate previews',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}