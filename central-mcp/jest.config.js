/**
 * Jest Configuration for Central Intelligence
 * ============================================
 *
 * Automated testing with coverage reporting
 */

export default {
  // Use TypeScript
  preset: 'ts-jest/presets/default-esm',

  // Test environment
  testEnvironment: 'node',

  // File extensions
  extensionsToTreatAsEsm: ['.ts'],

  // Module name mapper for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Transform settings
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.ts'
  ],

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 70,
      lines: 75,
      statements: 75
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/**/index.ts'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/',
    '/scripts/'
  ],

  // Globals
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Verbose output
  verbose: true,

  // Timeout
  testTimeout: 30000, // 30 seconds per test

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
