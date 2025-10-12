/**
 * Jest Test Setup
 * ================
 *
 * Global setup for all tests
 */

import { existsSync, unlinkSync } from 'fs';
import path from 'path';

// Test database path
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-registry.db');

// Clean up test database before tests
beforeAll(() => {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
    console.log('🧹 Cleaned up test database');
  }
});

// Clean up after all tests
afterAll(() => {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
    console.log('🧹 Test cleanup complete');
  }
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = TEST_DB_PATH;
