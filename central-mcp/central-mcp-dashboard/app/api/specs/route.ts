import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// Force Node.js runtime for better-sqlite3 support
export const runtime = 'nodejs';

const DB_PATH = '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db';

/**
 * GET /api/specs
 *
 * Returns REAL specification data from Central-MCP database:
 * - rag_spec_index (32 rows)
 * - Comprehensive spec metadata and status
 */
export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get all specs from RAG index
    const specs = db.prepare(`
      SELECT
        id,
        spec_id,
        title,
        type,
        layer,
        purpose,
        file_path,
        last_modified,
        total_chunks,
        keywords,
        created_at
      FROM rag_spec_index
      ORDER BY spec_id DESC
    `).all();

    // Get chunk statistics
    const chunkStats = db.prepare(`
      SELECT
        spec_id,
        COUNT(*) as total_chunks
      FROM rag_spec_chunks
      GROUP BY spec_id
    `).all();

    // Build chunk map
    const chunkMap = chunkStats.reduce((acc: any, stat: any) => {
      acc[stat.spec_id] = stat.total_chunks;
      return acc;
    }, {});

    // Enrich specs with chunk data
    const enrichedSpecs = specs.map((spec: any) => ({
      ...spec,
      chunks: spec.total_chunks || 0,
      keywordsList: spec.keywords ? spec.keywords.split(',').map((k: string) => k.trim()) : []
    }));

    // Calculate summary statistics
    const summary = {
      total: specs.length,
      byType: specs.reduce((acc: any, spec: any) => {
        acc[spec.type] = (acc[spec.type] || 0) + 1;
        return acc;
      }, {}),
      byLayer: specs.reduce((acc: any, spec: any) => {
        acc[spec.layer] = (acc[spec.layer] || 0) + 1;
        return acc;
      }, {}),
      totalChunks: specs.reduce((sum: number, spec: any) => sum + (spec.total_chunks || 0), 0),
      avgChunksPerSpec: specs.length > 0
        ? specs.reduce((sum: number, spec: any) => sum + (spec.total_chunks || 0), 0) / specs.length
        : 0
    };

    // Get latest specs
    const latestSpecs = enrichedSpecs.slice(0, 10);

    // Group by type
    const specsByType = enrichedSpecs.reduce((acc: any, spec: any) => {
      if (!acc[spec.type]) {
        acc[spec.type] = [];
      }
      acc[spec.type].push(spec);
      return acc;
    }, {});

    db.close();

    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      specs: enrichedSpecs,
      latest: latestSpecs,
      byType: specsByType
    });

    // Cache for 5 seconds
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');

    return response;
  } catch (error: any) {
    console.error('Specs API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch spec data',
      message: error.message
    }, { status: 500 });
  }
}
