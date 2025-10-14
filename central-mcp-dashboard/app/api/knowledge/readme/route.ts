/**
 * Knowledge Space README API Route
 * ===============================
 *
 * API endpoints for parsing and retrieving README file information
 * from knowledge space directories and packs.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Knowledge Space README parsing API
 */

import { NextRequest, NextResponse } from 'next/server';
import { readmeParser } from '@/../../src/utils/ReadmeParser';
import { knowledgePackProcessor } from '@/../../src/utils/KnowledgePackProcessor';

// GET /api/knowledge/readme - Parse README from path
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Parse README file
    const readmeContent = await readmeParser.parseReadme(path);

    // Generate card summary
    const cardSummary = readmeParser.getCardSummary(readmeContent);

    return NextResponse.json({
      success: true,
      data: {
        path,
        ...readmeContent,
        cardSummary
      }
    });

  } catch (error) {
    console.error('Error parsing README:', error);
    return NextResponse.json(
      {
        error: 'Failed to parse README',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/knowledge/readme - Batch parse README files
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paths, directory } = body;

    let filePaths: string[] = [];

    if (directory) {
      // Find README files in directory
      filePaths = await readmeParser.findReadmesInDirectory(directory);
    } else if (paths && Array.isArray(paths)) {
      filePaths = paths;
    } else {
      return NextResponse.json(
        { error: 'Either "paths" array or "directory" string is required' },
        { status: 400 }
      );
    }

    // Batch parse README files
    const results = await readmeParser.parseMultipleReadmes(filePaths);

    // Convert to array format
    const parsedFiles = Array.from(results.entries()).map(([path, content]) => ({
      path,
      ...content,
      cardSummary: readmeParser.getCardSummary(content)
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalFiles: filePaths.length,
        parsedFiles: parsedFiles.length,
        files: parsedFiles
      }
    });

  } catch (error) {
    console.error('Error batch parsing READMEs:', error);
    return NextResponse.json(
      {
        error: 'Failed to batch parse README files',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}