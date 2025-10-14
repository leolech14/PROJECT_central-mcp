/**
 * 🏭 DATABASE FACTORY WITH CONNECTION POOLING
 * =============================================
 *
 * Centralized database access with connection pooling
 * and performance monitoring
 */

import Database from 'better-sqlite3';
import { DatabaseConnectionPool, initializeConnectionPool, getConnectionPool } from './ConnectionPool.js';

export interface DatabaseConfig {
  path: string;
  pool?: {
    maxConnections?: number;
    minConnections?: number;
    idleTimeoutMillis?: number;
    acquireTimeoutMillis?: number;
  };
  wal?: boolean;
  foreignKeys?: boolean;
  cacheSize?: number;
  mmapSize?: number;
}

export class DatabaseFactory {
  private static instance: DatabaseFactory | null = null;
  private config: DatabaseConfig;
  private pool: DatabaseConnectionPool;
  private isInitialized = false;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.pool = initializeConnectionPool(config.path, config.pool);
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: DatabaseConfig): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      if (!config) {
        throw new Error('Database config required for first initialization');
      }
      DatabaseFactory.instance = new DatabaseFactory(config);
    }
    return DatabaseFactory.instance;
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Run migrations and setup
    await this.runMigrations();
    this.isInitialized = true;
  }

  /**
   * Get a database connection from the pool
   */
  async getConnection(): Promise<Database.Database> {
    return this.pool.acquire();
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connection: Database.Database): void {
    this.pool.release(connection);
  }

  /**
   * Execute a query with automatic connection management
   */
  async withConnection<T>(
    operation: (db: Database.Database) => T
  ): Promise<T> {
    return this.pool.withConnection(operation);
  }

  /**
   * Execute a transaction with automatic connection management
   */
  async withTransaction<T>(
    operation: (db: Database.Database) => T
  ): Promise<T> {
    return this.pool.withTransaction(operation);
  }

  /**
   * Run all database migrations
   */
  private async runMigrations(): Promise<void> {
    await this.withConnection((db) => {
      // Run all migration files
      const migrationsPath = new URL('../database/migrations', import.meta.url).pathname;
      const fs = require('fs');

      if (fs.existsSync(migrationsPath)) {
        const migrationFiles = fs.readdirSync(migrationsPath)
          .filter((file: string) => file.endsWith('.sql'))
          .sort();

        for (const file of migrationFiles) {
          const migration = fs.readFileSync(
            `${migrationsPath}/${file}`,
            'utf-8'
          );
          db.exec(migration);
          console.log(`🗃️  Ran migration: ${file}`);
        }
      }
    });
  }

  /**
   * Get database statistics
   */
  getStats() {
    return this.pool.getStats();
  }

  /**
   * Get connection pool health
   */
  async getHealth() {
    return this.pool.healthCheck();
  }

  /**
   * Close the database factory and pool
   */
  async close(): Promise<void> {
    await this.pool.destroy();
    DatabaseFactory.instance = null;
  }

  /**
   * Create a simple database instance (for backwards compatibility)
   */
  static createSimple(path: string): Database.Database {
    const db = new Database(path);

    // Optimize for performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000');
    db.pragma('temp_store = MEMORY');
    db.pragma('mmap_size = 268435456'); // 256MB
    db.pragma('foreign_keys = ON');

    return db;
  }
}

/**
 * Initialize the database factory with default configuration
 */
export function initializeDatabase(config?: Partial<DatabaseConfig>): DatabaseFactory {
  const defaultConfig: DatabaseConfig = {
    path: './data/registry.db',
    pool: {
      maxConnections: 10,
      minConnections: 2,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000,
    },
    wal: true,
    foreignKeys: true,
    cacheSize: 1000,
    mmapSize: 268435456, // 256MB
    ...config,
  };

  return DatabaseFactory.getInstance(defaultConfig);
}

/**
 * Get the global database factory instance
 */
export function getDatabase(): DatabaseFactory {
  const factory = DatabaseFactory.getInstance();
  if (!factory) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return factory;
}

export default DatabaseFactory;