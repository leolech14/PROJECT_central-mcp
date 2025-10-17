/**
 * 🏊 DATABASE CONNECTION POOL MANAGER
 * ===================================
 *
 * High-performance connection pooling for better resource management
 * and concurrent request handling
 */

import Database from 'better-sqlite3';
import { EventEmitter } from 'events';

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeoutMillis: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

interface PoolConnection {
  id: string;
  db: Database.Database;
  createdAt: number;
  lastUsed: number;
  inUse: boolean;
  destroyed: boolean;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  acquireFailures: number;
  totalAcquires: number;
  averageAcquireTime: number;
}

export class DatabaseConnectionPool extends EventEmitter {
  private config: PoolConfig;
  private connections: Map<string, PoolConnection> = new Map();
  private waitingQueue: Array<{
    resolve: (connection: PoolConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
    timeout: NodeJS.Timeout;
  }> = [];

  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    acquireFailures: 0,
    totalAcquires: 0,
    averageAcquireTime: 0,
  };

  private reapInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  private dbPath: string;

  constructor(dbPath: string, config: Partial<PoolConfig> = {}) {
    super();
    this.dbPath = dbPath;

    this.config = {
      maxConnections: 10,
      minConnections: 2,
      idleTimeoutMillis: 30000, // 30 seconds
      acquireTimeoutMillis: 5000, // 5 seconds
      createTimeoutMillis: 30000, // 30 seconds
      reapIntervalMillis: 1000, // 1 second
      createRetryIntervalMillis: 200, // 200ms
      ...config,
    };

    this.startReapInterval();
    this.initializeMinConnections();
  }

  /**
   * Initialize minimum connections
   */
  private async initializeMinConnections(): Promise<void> {
    const promises = [];
    for (let i = 0; i < this.config.minConnections; i++) {
      promises.push(this.createConnection());
    }

    try {
      await Promise.all(promises);
      console.log(`🏊 Initialized ${this.config.minConnections} database connections`);
    } catch (error) {
      console.error('❌ Failed to initialize minimum connections:', error);
      this.emit('error', error);
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<Database.Database> {
    if (this.isDestroyed) {
      throw new Error('Connection pool has been destroyed');
    }

    const startTime = Date.now();
    this.stats.totalAcquires++;

    // Try to find an available connection
    const availableConnection = this.findAvailableConnection();
    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();
      this.updateStats();

      const acquireTime = Date.now() - startTime;
      this.updateAverageAcquireTime(acquireTime);

      return availableConnection.db;
    }

    // If no available connection and we can create more
    if (this.connections.size < this.config.maxConnections) {
      try {
        const newConnection = await this.createConnection();
        newConnection.inUse = true;
        newConnection.lastUsed = Date.now();

        const acquireTime = Date.now() - startTime;
        this.updateAverageAcquireTime(acquireTime);

        return newConnection.db;
      } catch (error) {
        this.stats.acquireFailures++;
        this.emit('error', error);
        throw error;
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        this.stats.acquireFailures++;
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeoutMillis);

      this.waitingQueue.push({
        resolve: (conn) => resolve(conn.db),
        reject,
        timestamp: Date.now(),
        timeout,
      });

      this.updateStats();
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(db: Database.Database): void {
    if (this.isDestroyed) {
      this.destroyConnection(db);
      return;
    }

    const connection = Array.from(this.connections.values())
      .find(conn => conn.db === db);

    if (!connection) {
      console.warn('⚠️ Attempted to release unknown connection');
      return;
    }

    if (!connection.inUse) {
      console.warn('⚠️ Attempted to release connection that is not in use');
      return;
    }

    connection.inUse = false;
    connection.lastUsed = Date.now();

    // Process waiting queue
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift();
      if (waiting) {
        clearTimeout(waiting.timeout);
        connection.inUse = true;
        connection.lastUsed = Date.now();
        waiting.resolve(connection);
      }
    }

    this.updateStats();
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<PoolConnection> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const attemptCreate = () => {
        try {
          const db = new Database(this.dbPath);

          // Configure connection
          db.pragma('journal_mode = WAL');
          db.pragma('synchronous = NORMAL');
          db.pragma('cache_size = 1000');
          db.pragma('temp_store = MEMORY');
          db.pragma('mmap_size = 268435456'); // 256MB

          // Enable foreign keys
          db.pragma('foreign_keys = ON');

          const connection: PoolConnection = {
            id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            db,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            inUse: false,
            destroyed: false,
          };

          this.connections.set(connection.id, connection);
          this.updateStats();

          console.log(`🏊 Created new database connection: ${connection.id}`);
          this.emit('connectionCreated', connection);

          resolve(connection);
        } catch (error) {
          const elapsed = Date.now() - startTime;

          if (elapsed < this.config.createTimeoutMillis) {
            setTimeout(attemptCreate, this.config.createRetryIntervalMillis);
          } else {
            reject(error);
          }
        }
      };

      attemptCreate();
    });
  }

  /**
   * Find an available connection
   */
  private findAvailableConnection(): PoolConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.inUse && !connection.destroyed) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Destroy a connection
   */
  private destroyConnection(db: Database.Database): void {
    const connection = Array.from(this.connections.values())
      .find(conn => conn.db === db);

    if (connection && !connection.destroyed) {
      connection.destroyed = true;
      connection.db.close();
      this.connections.delete(connection.id);
      this.updateStats();

      console.log(`🏊 Destroyed database connection: ${connection.id}`);
      this.emit('connectionDestroyed', connection);
    }
  }

  /**
   * Start the reap interval to clean up idle connections
   */
  private startReapInterval(): void {
    this.reapInterval = setInterval(() => {
      this.reapIdleConnections();
    }, this.config.reapIntervalMillis);
  }

  /**
   * Reap idle connections
   */
  private reapIdleConnections(): void {
    const now = Date.now();
    const connectionsToReap: PoolConnection[] = [];

    for (const connection of this.connections.values()) {
      if (!connection.inUse &&
          !connection.destroyed &&
          now - connection.lastUsed > this.config.idleTimeoutMillis &&
          this.connections.size > this.config.minConnections) {
        connectionsToReap.push(connection);
      }
    }

    connectionsToReap.forEach(connection => {
      this.destroyConnection(connection.db);
    });

    if (connectionsToReap.length > 0) {
      console.log(`🏊 Reaped ${connectionsToReap.length} idle connections`);
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.totalConnections = this.connections.size;
    this.stats.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.inUse).length;
    this.stats.idleConnections = this.stats.totalConnections - this.stats.activeConnections;
    this.stats.waitingRequests = this.waitingQueue.length;
  }

  /**
   * Update average acquire time
   */
  private updateAverageAcquireTime(acquireTime: number): void {
    if (this.stats.totalAcquires === 1) {
      this.stats.averageAcquireTime = acquireTime;
    } else {
      this.stats.averageAcquireTime =
        (this.stats.averageAcquireTime * (this.stats.totalAcquires - 1) + acquireTime) /
        this.stats.totalAcquires;
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get detailed connection information
   */
  getConnectionInfo(): Array<{
    id: string;
    createdAt: number;
    lastUsed: number;
    inUse: boolean;
    age: number;
    idleTime: number;
  }> {
    const now = Date.now();
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      createdAt: conn.createdAt,
      lastUsed: conn.lastUsed,
      inUse: conn.inUse,
      age: now - conn.createdAt,
      idleTime: now - conn.lastUsed,
    }));
  }

  /**
   * Health check for the pool
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    connections: number;
    idleConnections: number;
    activeConnections: number;
    waitingRequests: number;
    canAcquireConnection: boolean;
  }> {
    try {
      // Try to acquire and release a connection
      const connection = await this.acquire();
      this.release(connection);

      return {
        healthy: true,
        connections: this.connections.size,
        idleConnections: this.stats.idleConnections,
        activeConnections: this.stats.activeConnections,
        waitingRequests: this.stats.waitingRequests,
        canAcquireConnection: true,
      };
    } catch (error) {
      return {
        healthy: false,
        connections: this.connections.size,
        idleConnections: this.stats.idleConnections,
        activeConnections: this.stats.activeConnections,
        waitingRequests: this.stats.waitingRequests,
        canAcquireConnection: false,
      };
    }
  }

  /**
   * Destroy the pool and all connections
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // Clear reaping interval
    if (this.reapInterval) {
      clearInterval(this.reapInterval);
      this.reapInterval = null;
    }

    // Reject all waiting requests
    this.waitingQueue.forEach(waiting => {
      clearTimeout(waiting.timeout);
      waiting.reject(new Error('Connection pool destroyed'));
    });
    this.waitingQueue = [];

    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(connection => {
      return new Promise<void>((resolve) => {
        connection.db.close();
        resolve();
      });
    });

    await Promise.all(closePromises);
    this.connections.clear();

    console.log('🏊 Database connection pool destroyed');
    this.emit('destroyed');
  }

  /**
   * Execute a query with automatic connection management
   */
  async withConnection<T>(
    operation: (db: Database.Database) => T
  ): Promise<T> {
    const connection = await this.acquire();
    try {
      return operation(connection);
    } finally {
      this.release(connection);
    }
  }

  /**
   * Execute a transaction with automatic connection management
   */
  async withTransaction<T>(
    operation: (db: Database.Database) => T
  ): Promise<T> {
    return this.withConnection((db) => {
      const transaction = db.transaction(() => operation(db));
      return transaction();
    });
  }
}

/**
 * Global connection pool instance
 */
let globalPool: DatabaseConnectionPool | null = null;

/**
 * Initialize the global connection pool
 */
export function initializeConnectionPool(dbPath: string, config?: Partial<PoolConfig>): DatabaseConnectionPool {
  if (globalPool) {
    throw new Error('Connection pool already initialized');
  }

  globalPool = new DatabaseConnectionPool(dbPath, config);
  return globalPool;
}

/**
 * Get the global connection pool
 */
export function getConnectionPool(): DatabaseConnectionPool {
  if (!globalPool) {
    throw new Error('Connection pool not initialized');
  }
  return globalPool;
}

/**
 * Close the global connection pool
 */
export async function closeConnectionPool(): Promise<void> {
  if (globalPool) {
    await globalPool.destroy();
    globalPool = null;
  }
}

export default DatabaseConnectionPool;