#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Applies SQL migrations to registry.db
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../data/registry.db');
const MIGRATIONS_PATH = join(__dirname, '../src/database/migrations');

interface Migration {
  version: number;
  filename: string;
  sql: string;
}

function getMigrations(): Migration[] {
  const files = readdirSync(MIGRATIONS_PATH)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(filename => {
    const match = filename.match(/^(\d+)_/);
    const version = match ? parseInt(match[1]) : 0;
    const sql = readFileSync(join(MIGRATIONS_PATH, filename), 'utf-8');

    return { version, filename, sql };
  });
}

function getCurrentVersion(db: Database.Database): number {
  try {
    const result = db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null };
    return result.version || 0;
  } catch (error) {
    // Migrations table doesn't exist yet
    return 0;
  }
}

function createMigrationsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      filename TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function applyMigrations() {
  console.log('🔄 Starting database migration...\n');

  const db = new Database(DB_PATH);

  // Ensure migrations table exists
  createMigrationsTable(db);

  const currentVersion = getCurrentVersion(db);
  console.log(`📊 Current database version: ${currentVersion}`);

  const migrations = getMigrations();
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log('✅ Database is up to date. No migrations needed.\n');
    db.close();
    return;
  }

  console.log(`📋 Found ${pendingMigrations.length} pending migration(s):\n`);

  for (const migration of pendingMigrations) {
    console.log(`🔄 Applying migration ${migration.version}: ${migration.filename}`);

    try {
      // Execute migration in transaction
      const applyMigration = db.transaction(() => {
        db.exec(migration.sql);
        db.prepare('INSERT INTO migrations (version, filename) VALUES (?, ?)').run(
          migration.version,
          migration.filename
        );
      });

      applyMigration();

      console.log(`✅ Migration ${migration.version} applied successfully\n`);
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      db.close();
      process.exit(1);
    }
  }

  // Verify final state
  const finalVersion = getCurrentVersion(db);
  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 New database version: ${finalVersion}`);

  // Show table counts
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all() as Array<{ name: string }>;

  console.log(`\n📊 Database contains ${tables.length} tables:`);
  for (const table of tables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
    console.log(`   - ${table.name}: ${count.count} rows`);
  }

  db.close();
}

// Run migrations
try {
  applyMigrations();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
