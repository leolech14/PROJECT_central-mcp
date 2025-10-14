/**
 * Database Test Helpers
 * =====================
 *
 * Helper functions for setting up and cleaning up test databases
 * with all required migrations and test data.
 */

import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Setup test database with all migrations
 */
export async function setupTestDatabase(): Promise<Database.Database> {
  const db = new Database(':memory:');

  // Load and run all migration files
  const migrationsDir = join(__dirname, '../../src/database/migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure migrations run in order

  for (const migrationFile of migrationFiles) {
    try {
      const migrationSQL = readFileSync(join(migrationsDir, migrationFile), 'utf-8');
      db.exec(migrationSQL);
    } catch (error) {
      console.error(`Error running migration ${migrationFile}:`, error);
      throw error;
    }
  }

  // Insert basic test data
  await insertTestData(db);

  return db;
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(db: Database.Database): Promise<void> {
  try {
    db.close();
  } catch (error) {
    console.error('Error closing test database:', error);
  }
}

/**
 * Insert basic test data for integration tests
 */
async function insertTestData(db: Database.Database): Promise<void> {
  try {
    // Insert basic model performance metrics
    db.prepare(`
      INSERT OR IGNORE INTO model_performance_metrics (
        id, model, total_detections, correct_detections, accuracy,
        avg_confidence, confidence_accuracy, last_updated, first_seen
      ) VALUES
        (hex(randomblob(16)), 'glm-4.6', 0, 0, 0.0, 0.0, 0.90, datetime('now'), datetime('now')),
        (hex(randomblob(16)), 'claude-sonnet-4-5-20250929', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now')),
        (hex(randomblob(16)), 'claude-sonnet-4-20250514', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now')),
        (hex(randomblob(16)), 'claude-opus-4-1-20250805', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now')),
        (hex(randomblob(16)), 'gemini-2.5-pro', 0, 0, 0.0, 0.0, 0.95, datetime('now'), datetime('now')),
        (hex(randomblob(16)), 'unknown', 0, 0, 0.0, 0.0, 0.30, datetime('now'), datetime('now'))
    `).run();

    // Insert basic analytics summary
    db.prepare(`
      INSERT OR IGNORE INTO detection_analytics_summary (
        id, period_start, period_end, period_type,
        total_detections, successful_detections, failed_detections,
        created_at, updated_at
      ) VALUES (
        hex(randomblob(16)),
        datetime('now', '-1 hour'),
        datetime('now'),
        'hourly',
        0, 0, 0,
        datetime('now'),
        datetime('now')
      )
    `).run();

  } catch (error) {
    console.error('Error inserting test data:', error);
    throw error;
  }
}

/**
 * Create a test database with specific test scenarios
 */
export async function setupScenarioDatabase(scenario: 'basic' | 'corrections' | 'feedback' | 'performance'): Promise<Database.Database> {
  const db = await setupTestDatabase();

  switch (scenario) {
    case 'corrections':
      await setupCorrectionScenario(db);
      break;
    case 'feedback':
      await setupFeedbackScenario(db);
      break;
    case 'performance':
      await setupPerformanceScenario(db);
      break;
    default:
      // Basic setup already done
      break;
  }

  return db;
}

/**
 * Setup correction scenario test data
 */
async function setupCorrectionScenario(db: Database.Database): Promise<void> {
  // Insert historical corrections
  const corrections = [
    {
      original_model: 'glm-4.6-mistaken',
      corrected_to: 'claude-sonnet-4-5-20250929',
      correction_reason: 'historical',
      confidence_before: 0.7,
      confidence_after: 0.9
    },
    {
      original_model: 'glm-4.6-mistaken',
      corrected_to: 'claude-sonnet-4-5-20250929',
      correction_reason: 'feedback',
      confidence_before: 0.6,
      confidence_after: 0.85
    },
    {
      original_model: 'claude-sonnet-4-v1',
      corrected_to: 'claude-sonnet-4-5-20250929',
      correction_reason: 'pattern',
      confidence_before: 0.65,
      confidence_after: 0.88
    }
  ];

  const insertCorrection = db.prepare(`
    INSERT INTO detection_corrections (
      id, original_model, corrected_to, correction_reason,
      confidence_before, confidence_after, correction_applied, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  corrections.forEach((correction, index) => {
    insertCorrection.run(
      `test-correction-${index}`,
      correction.original_model,
      correction.corrected_to,
      correction.correction_reason,
      correction.confidence_before,
      correction.confidence_after,
      1,
      new Date(Date.now() - (index + 1) * 100000).toISOString()
    );
  });
}

/**
 * Setup feedback scenario test data
 */
async function setupFeedbackScenario(db: Database.Database): Promise<void> {
  // Insert user feedback
  const feedback = [
    {
      detected_model: 'glm-4.6',
      actual_model: 'glm-4.6',
      user_confirmed: true,
      accuracy: 1.0,
      context: 'production'
    },
    {
      detected_model: 'glm-4.6',
      actual_model: 'claude-sonnet-4-5-20250929',
      user_confirmed: false,
      accuracy: 0.0,
      context: 'user-testing'
    },
    {
      detected_model: 'claude-sonnet-4-5-20250929',
      actual_model: 'claude-sonnet-4-5-20250929',
      user_confirmed: true,
      accuracy: 1.0,
      context: 'production'
    }
  ];

  const insertFeedback = db.prepare(`
    INSERT INTO user_feedback (
      id, detected_model, actual_model, user_confirmed,
      accuracy, context, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  feedback.forEach((item, index) => {
    insertFeedback.run(
      `test-feedback-${index}`,
      item.detected_model,
      item.actual_model,
      item.user_confirmed ? 1 : 0,
      item.accuracy,
      item.context,
      new Date(Date.now() - (index + 1) * 50000).toISOString()
    );
  });
}

/**
 * Setup performance scenario test data
 */
async function setupPerformanceScenario(db: Database.Database): Promise<void> {
  // Insert historical detection data
  const models = ['glm-4.6', 'claude-sonnet-4-5-20250929', 'claude-sonnet-4-20250514'];
  const agents = ['A', 'B', 'D'];
  const providers = ['zhipu', 'anthropic'];

  const insertDetection = db.prepare(`
    INSERT INTO enhanced_model_detections (
      id, detected_model, provider, endpoint, context_window,
      config_source, config_path, detection_method, confidence,
      verified, agent_letter, agent_role, capabilities, loop_integration,
      metadata, timestamp, detection_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Generate 100 historical detections
  for (let i = 0; i < 100; i++) {
    const model = models[i % models.length];
    const agent = agents[i % agents.length];
    const provider = providers[i % providers.length];

    insertDetection.run(
      `historical-detection-${i}`,
      model,
      provider,
      provider === 'zhipu' ? 'https://api.z.ai/api/anthropic' : 'https://api.anthropic.com',
      provider === 'zhipu' ? 128000 : 200000,
      'settings.json',
      '/test/path',
      'enhanced-file',
      0.7 + Math.random() * 0.3,
      1,
      agent,
      agent === 'A' ? 'UI Velocity Specialist' : agent === 'B' ? 'Design & Architecture Specialist' : 'Integration Specialist',
      '{}',
      '{}',
      '{}',
      new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
      1
    );
  }

  // Update performance metrics based on historical data
  models.forEach(model => {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        AVG(confidence) as avg_confidence,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_count
      FROM enhanced_model_detections
      WHERE detected_model = ?
    `).get(model) as any;

    if (stats.total > 0) {
      db.prepare(`
        UPDATE model_performance_metrics
        SET total_detections = ?, correct_detections = ?, accuracy = ?,
            avg_confidence = ?, last_updated = ?
        WHERE model = ?
      `).run(
        stats.total,
        stats.verified_count,
        stats.verified_count / stats.total,
        stats.avg_confidence,
        new Date().toISOString(),
        model
      );
    }
  });
}

/**
 * Execute a query and return results with error handling
 */
export function executeQuery<T = any>(db: Database.Database, query: string, params: any[] = []): T[] {
  try {
    return db.prepare(query).all(...params) as T[];
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

/**
 * Execute a single query and return first result
 */
export function executeQueryOne<T = any>(db: Database.Database, query: string, params: any[] = []): T | null {
  try {
    return db.prepare(query).get(...params) as T || null;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

/**
 * Get database statistics for testing
 */
export function getDatabaseStats(db: Database.Database): {
  tables: Array<{ name: string; rows: number }>;
  totalRows: number;
} {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;

  let totalRows = 0;
  const tableStats = tables.map(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
    totalRows += count.count;
    return { name: table.name, rows: count.count };
  });

  return { tables: tableStats, totalRows };
}