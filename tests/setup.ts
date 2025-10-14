/**
 * 🧪 COMPREHENSIVE JEST TEST SETUP
 * ================================
 *
 * Global test configuration and utilities for the entire test suite
 */

import { existsSync, unlinkSync, mkdirSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Test configuration
export const TEST_CONFIG = {
  databasePath: path.join(process.cwd(), 'data', 'test-registry.db'),
  testDataPath: path.join(process.cwd(), 'data', 'test'),
  testTimeout: 30000, // 30 seconds
  slowTestThreshold: 5000, // 5 seconds
};

/**
 * 🧪 Global test utilities
 */
export class TestUtils {
  /**
   * Create test database with full schema
   */
  static createTestDatabase(): Database.Database {
    // Ensure test data directory exists
    if (!existsSync(TEST_CONFIG.testDataPath)) {
      mkdirSync(TEST_CONFIG.testDataPath, { recursive: true });
    }

    // Create test database
    const db = new Database(TEST_CONFIG.databasePath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Run all migrations
    this.runMigrations(db);

    return db;
  }

  /**
   * Run all database migrations for testing
   */
  private static runMigrations(db: Database.Database): void {
    const migrationsPath = path.join(process.cwd(), 'src', 'database', 'migrations');

    if (existsSync(migrationsPath)) {
      const migrationFiles = require('fs')
        .readdirSync(migrationsPath)
        .filter((file: string) => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const migration = require('fs').readFileSync(
          path.join(migrationsPath, file),
          'utf-8'
        );
        db.exec(migration);
        console.log(`🗃️  Ran migration: ${file}`);
      }
    }
  }

  /**
   * Create test agent data
   */
  static createTestAgent(db: Database.Database, agentData: {
    agentId: string;
    agentModel: string;
    capabilities?: string[];
  }) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO agents (
        id, agent_letter, agent_model, capabilities,
        created_at, updated_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      agentData.agentId,
      agentData.agentId,
      agentData.agentModel,
      JSON.stringify(agentData.capabilities || []),
      Date.now(),
      Date.now(),
      1
    );
  }

  /**
   * Create test project data
   */
  static createTestProject(db: Database.Database, projectData: {
    projectId: string;
    name: string;
    path: string;
    description?: string;
  }) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO projects (
        id, name, path, description, status,
        created_at, updated_at, last_scanned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    stmt.run(
      projectData.projectId,
      projectData.name,
      projectData.path,
      projectData.description || '',
      'active',
      now,
      now,
      now
    );
  }

  /**
   * Create test task data
   */
  static createTestTask(db: Database.Database, taskData: {
    taskId: string;
    title: string;
    description: string;
    agentId: string;
    projectId?: string;
    status?: string;
  }) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, title, description, agent_id, project_id,
        status, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    stmt.run(
      taskData.taskId,
      taskData.title,
      taskData.description,
      taskData.agentId,
      taskData.projectId || null,
      taskData.status || 'pending',
      'normal',
      now,
      now
    );
  }

  /**
   * Wait for async operations
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random test data
   */
  static generateRandomId(prefix: string = 'test'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate random test string
   */
  static generateRandomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  /**
   * Create mock request object
   */
  static createMockRequest(overrides: Partial<any> = {}): any {
    return {
      method: 'GET',
      url: '/test',
      headers: {},
      query: {},
      params: {},
      body: {},
      ip: '127.0.0.1',
      get: (header: string) => overrides.headers?.[header] || undefined,
      ...overrides,
    };
  }

  /**
   * Create mock response object
   */
  static createMockResponse(): any {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  }

  /**
   * Clean up test database
   */
  static cleanupTestDatabase(): void {
    if (existsSync(TEST_CONFIG.databasePath)) {
      unlinkSync(TEST_CONFIG.databasePath);
    }
  }

  /**
   * Setup test environment variables
   */
  static setupTestEnv(): void {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = TEST_CONFIG.databasePath;
    process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
    process.env.OPENAI_API_KEY = 'test-key-for-testing';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
    process.env.API_KEY_SECRET = 'test-api-key-secret';
  }
}

/**
 * 🧪 Global test setup and teardown
 */

// Clean up before all tests
beforeAll(async () => {
  console.log('🧪 Setting up test environment');
  TestUtils.cleanupTestDatabase();
  TestUtils.setupTestEnv();

  // Create test database
  const db = TestUtils.createTestDatabase();

  // Insert basic test data
  TestUtils.createTestAgent(db, {
    agentId: 'test-agent-a',
    agentModel: 'claude-sonnet-4-5',
    capabilities: ['ui', 'frontend', 'testing'],
  });

  TestUtils.createTestAgent(db, {
    agentId: 'test-agent-b',
    agentModel: 'gpt-4-turbo',
    capabilities: ['backend', 'api', 'database'],
  });

  TestUtils.createTestProject(db, {
    projectId: 'test-project-1',
    name: 'Test Project 1',
    path: '/test/project1',
    description: 'A test project for unit testing',
  });

  db.close();
  console.log('✅ Test environment ready');
});

// Clean up after all tests
afterAll(() => {
  console.log('🧹 Cleaning up test environment');
  TestUtils.cleanupTestDatabase();
});

// Set timeout for slow tests
jest.setTimeout(TEST_CONFIG.testTimeout);

// Configure console output in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // Suppress console output unless explicitly needed
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console output
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

/**
 * 🧪 Global test matchers and utilities
 */

expect.extend({
  toBeValidTimestamp(received: number) {
    const pass = typeof received === 'number' && received > 0 && received <= Date.now() + 86400000;
    return {
      message: () => `expected ${received} to be a valid timestamp`,
      pass,
    };
  },

  toBeValidUUID(received: string) {
    const pass = typeof received === 'string' && /^[a-zA-Z0-9_-]+$/.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toBeValidJson(received: string) {
    try {
      JSON.parse(received);
      return {
        message: () => `expected ${received} to be valid JSON`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be valid JSON`,
        pass: false,
      };
    }
  },
});

/**
 * 🧪 Export test utilities for use in test files
 */
export default TestUtils;
