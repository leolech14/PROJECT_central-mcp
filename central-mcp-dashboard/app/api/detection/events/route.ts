/**
 * Detection Events API Route
 * ==========================
 *
 * Provides recent detection events for the monitoring dashboard.
 * Supports time range filtering and pagination.
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { join } from 'path';

// Database path
const DB_PATH = join(process.cwd(), '../../central-mcp/data/registry.db');

interface DetectionEvent {
  id: string;
  timestamp: string;
  detectedModel: string;
  agentLetter: string;
  confidence: number;
  verified: boolean;
  detectionMethod: string;
  selfCorrectionApplied: boolean;
  executionTime: number;
  selfCorrectionData?: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';

    // Calculate time filter based on range
    let timeFilter = '';
    switch (range) {
      case '1h':
        timeFilter = "datetime('now', '-1 hour')";
        break;
      case '6h':
        timeFilter = "datetime('now', '-6 hours')";
        break;
      case '24h':
        timeFilter = "datetime('now', '-1 day')";
        break;
      case '7d':
        timeFilter = "datetime('now', '-7 days')";
        break;
      default:
        timeFilter = "datetime('now', '-1 day')";
    }

    const db = new Database(DB_PATH, { readonly: true });

    // Get recent detection events
    const eventsQuery = db.prepare(`
      SELECT
        id,
        timestamp,
        detected_model,
        agent_letter,
        confidence,
        verified,
        detection_method,
        self_correction_applied,
        execution_time_ms as executionTime,
        self_correction_data
      FROM enhanced_model_detections
      WHERE timestamp > ${timeFilter}
      ORDER BY timestamp DESC
      LIMIT 100
    `).all() as any[];

    // Transform the data
    const events: DetectionEvent[] = eventsQuery.map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      detectedModel: row.detected_model,
      agentLetter: row.agent_letter,
      confidence: row.confidence,
      verified: row.verified === 1,
      detectionMethod: row.detection_method,
      selfCorrectionApplied: row.self_correction_applied === 1,
      executionTime: row.executionTime || 0,
      selfCorrectionData: row.self_correction_data ? JSON.parse(row.self_correction_data) : undefined
    }));

    db.close();

    return NextResponse.json(events);

  } catch (error) {
    console.error('Error fetching detection events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detection events' },
      { status: 500 }
    );
  }
}