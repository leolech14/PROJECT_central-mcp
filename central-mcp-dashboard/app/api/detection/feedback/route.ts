/**
 * Detection Feedback API Route
 * ============================
 *
 * Provides endpoints for submitting user feedback on model detection.
 * Helps improve the self-correction system.
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Database path
const DB_PATH = join(process.cwd(), '../../central-mcp/data/registry.db');

interface FeedbackRequest {
  detectionId: string;
  actualModel: string;
  userConfirmed: boolean;
  context?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { detectionId, actualModel, userConfirmed, context = 'user-feedback', notes } = body;

    if (!detectionId || !actualModel) {
      return NextResponse.json(
        { error: 'Missing required fields: detectionId, actualModel' },
        { status: 400 }
      );
    }

    const db = new Database(DB_PATH);

    // Verify the detection exists
    const detection = db.prepare(`
      SELECT * FROM enhanced_model_detections WHERE id = ?
    `).get(detectionId) as any;

    if (!detection) {
      db.close();
      return NextResponse.json(
        { error: 'Detection not found' },
        { status: 404 }
      );
    }

    // Insert feedback
    db.prepare(`
      INSERT INTO user_feedback (
        id, detected_model, actual_model, user_confirmed,
        accuracy, context, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      detection.detected_model,
      actualModel,
      userConfirmed ? 1 : 0,
      userConfirmed ? 1.0 : 0.0,
      context,
      new Date().toISOString(),
      JSON.stringify({
        detectionId,
        notes,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      })
    );

    // Update performance metrics
    await updatePerformanceMetrics(db, detection.detected_model, userConfirmed);

    // Update self-correction system if needed
    if (!userConfirmed && detection.detected_model !== actualModel) {
      await updateCorrectionPattern(db, detection.detected_model, actualModel);
    }

    db.close();

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: randomUUID()
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// Helper function to update performance metrics
async function updatePerformanceMetrics(
  db: Database.Database,
  model: string,
  wasCorrect: boolean
): Promise<void> {
  const existing = db.prepare(`
    SELECT * FROM model_performance_metrics WHERE model = ?
  `).get(model) as any;

  if (existing) {
    const newTotal = existing.total_detections + 1;
    const newCorrect = existing.correct_detections + (wasCorrect ? 1 : 0);
    const newAccuracy = newCorrect / newTotal;
    const newAvgConfidence = (existing.avg_confidence * existing.total_detections + 0.8) / newTotal;

    db.prepare(`
      UPDATE model_performance_metrics
      SET total_detections = ?, correct_detections = ?, accuracy = ?,
          avg_confidence = ?, last_updated = ?
      WHERE model = ?
    `).run(
      newTotal,
      newCorrect,
      newAccuracy,
      newAvgConfidence,
      new Date().toISOString(),
      model
    );
  } else {
    db.prepare(`
      INSERT INTO model_performance_metrics (
        id, model, total_detections, correct_detections, accuracy,
        avg_confidence, confidence_accuracy, last_updated, first_seen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      model,
      1,
      wasCorrect ? 1 : 0,
      wasCorrect ? 1.0 : 0.0,
      0.8,
      0.5,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}

// Helper function to update correction patterns
async function updateCorrectionPattern(
  db: Database.Database,
  originalModel: string,
  correctedModel: string
): Promise<void> {
  // Check if this correction pattern already exists
  const existingPattern = db.prepare(`
    SELECT * FROM correction_patterns
    WHERE original_model = ? AND corrected_to = ?
    ORDER BY last_seen DESC
    LIMIT 1
  `).get(originalModel, correctedModel) as any;

  if (existingPattern) {
    // Update existing pattern
    db.prepare(`
      UPDATE correction_patterns
      SET frequency = frequency + 1,
          accuracy = (accuracy * 0.8 + 1.0 * 0.2), // Weighted average
          last_seen = ?,
          auto_apply = CASE WHEN frequency >= 3 AND accuracy > 0.7 THEN 1 ELSE auto_apply END
      WHERE id = ?
    `).run(
      new Date().toISOString(),
      existingPattern.id
    );
  } else {
    // Create new pattern
    db.prepare(`
      INSERT INTO correction_patterns (
        id, pattern, original_model, corrected_to,
        frequency, accuracy, confidence,
        auto_apply, min_confidence_threshold, required_occurrences,
        last_seen, first_seen, created_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      `${originalModel}→${correctedModel}`,
      originalModel,
      correctedModel,
      1,
      1.0,
      0.7,
      0, // Will be auto-applied after 3 occurrences
      0.8,
      3,
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      'active'
    );
  }
}

// GET endpoint to retrieve feedback history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const model = searchParams.get('model');

    const db = new Database(DB_PATH, { readonly: true });

    let query = `
      SELECT
        uf.*,
        em.detected_model,
        em.agent_letter,
        em.confidence
      FROM user_feedback uf
      JOIN enhanced_model_detections em ON uf.detected_model = em.detected_model
    `;

    const params: any[] = [];
    if (model) {
      query += ' WHERE uf.detected_model = ?';
      params.push(model);
    }

    query += ' ORDER BY uf.timestamp DESC LIMIT ?';
    params.push(limit);

    const feedback = db.prepare(query).all(...params);

    db.close();

    return NextResponse.json(feedback);

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback history' },
      { status: 500 }
    );
  }
}