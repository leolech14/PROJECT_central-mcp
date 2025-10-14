/**
 * Detection Stats API Route
 * ==========================
 *
 * Provides statistics for the enhanced model detection system.
 * Returns accuracy metrics, system health, and performance data.
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { join } from 'path';

// Database path
const DB_PATH = join(process.cwd(), '../../central-mcp/data/registry.db');

export async function GET(request: NextRequest) {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get detection statistics from enhanced_model_detections table
    const statsQuery = db.prepare(`
      SELECT
        COUNT(*) as total_detections,
        AVG(confidence) as avg_confidence,
        AVG(CASE WHEN verified = 1 THEN 1.0 ELSE 0.0 END) as accuracy_rate,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_count
      FROM enhanced_model_detections
      WHERE timestamp > datetime('now', '-24 hours')
    `).get() as any;

    // Get top models
    const topModelsQuery = db.prepare(`
      SELECT detected_model, COUNT(*) as count
      FROM enhanced_model_detections
      WHERE timestamp > datetime('now', '-24 hours')
      GROUP BY detected_model
      ORDER BY count DESC
      LIMIT 5
    `).all() as any[];

    // Get self-correction statistics
    const correctionsStatsQuery = db.prepare(`
      SELECT
        COUNT(*) as total_corrections,
        AVG(confidence_after - confidence_before) as avg_improvement
      FROM detection_corrections
      WHERE correction_applied = 1
        AND timestamp > datetime('now', '-24 hours')
    `).get() as any;

    // Get top corrected models
    const topCorrectedModelsQuery = db.prepare(`
      SELECT
        original_model as model,
        COUNT(*) as corrections
      FROM detection_corrections
      WHERE correction_applied = 1
        AND timestamp > datetime('now', '-24 hours')
      GROUP BY original_model
      ORDER BY corrections DESC
      LIMIT 5
    `).all() as any[];

    // Get system health
    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (statsQuery.avg_confidence < 0.7 || statsQuery.accuracy_rate < 0.8) {
      systemHealth = 'degraded';
    }
    if (statsQuery.avg_confidence < 0.5 || statsQuery.accuracy_rate < 0.6) {
      systemHealth = 'critical';
    }

    // Get recent patterns (mock for now)
    const recentPatterns = [];

    const stats = {
      totalDetections: statsQuery.total_detections || 0,
      avgConfidence: statsQuery.avg_confidence || 0,
      accuracyRate: statsQuery.accuracy_rate || 0,
      topModels: topModelsQuery.map((row: any) => ({
        model: row.detected_model,
        count: row.count
      })),
      selfCorrectionStats: {
        totalCorrections: correctionsStatsQuery.total_corrections || 0,
        accuracyImprovement: correctionsStatsQuery.avg_improvement || 0,
        topCorrectedModels: topCorrectedModelsQuery.map((row: any) => ({
          model: row.model,
          corrections: row.corrections
        })),
        recentPatterns
      },
      systemHealth
    };

    db.close();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching detection stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detection statistics' },
      { status: 500 }
    );
  }
}