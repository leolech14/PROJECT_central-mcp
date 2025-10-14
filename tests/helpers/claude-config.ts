/**
 * Claude Configuration Test Helpers
 * =================================
 *
 * Helper functions for mocking Claude Code CLI configuration files
 * during testing to simulate real-world configuration scenarios.
 */

import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, homedir } from 'path';
import { randomUUID } from 'crypto';

const TEST_CONFIG_DIR = join(homedir(), '.claude-test');

export interface MockClaudeConfig {
  model?: string;
  defaultModel?: string;
  contextWindow?: number;
  env?: {
    ANTHROPIC_API_KEY?: string;
    ANTHROPIC_AUTH_TOKEN?: string;
    ANTHROPIC_BASE_URL?: string;
    ANTHROPIC_BETA?: string;
    ANTHROPIC_ORGANIZATION?: string;
    CLAUDE_CODE_CUSTOM_LIMITS?: string;
  };
  alwaysThinkingEnabled?: boolean;
  permissions?: any;
  hooks?: any;
}

/**
 * Setup mock Claude configuration files for testing
 */
export async function mockClaudeConfigFiles(): Promise<void> {
  // Create test config directory
  if (!existsSync(TEST_CONFIG_DIR)) {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  }

  // Create Z.AI configuration (GLM-4.6)
  const zaiConfig: MockClaudeConfig = {
    model: 'glm-4.6',
    defaultModel: 'claude-sonnet-4-5-20250929',
    contextWindow: 128000,
    env: {
      ANTHROPIC_AUTH_TOKEN: 'test-zai-token-' + randomUUID(),
      ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
      ANTHROPIC_ORGANIZATION: 'test@example.com',
      CLAUDE_CODE_CUSTOM_LIMITS: 'true'
    },
    alwaysThinkingEnabled: false,
    permissions: {
      mode: 'bypassPermissions'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings-zai.json'),
    JSON.stringify(zaiConfig, null, 2)
  );

  // Create Anthropic configuration (Claude Sonnet-4.5)
  const anthropicConfig: MockClaudeConfig = {
    defaultModel: 'claude-sonnet-4-5-20250929',
    contextWindow: 200000,
    env: {
      ANTHROPIC_API_KEY: 'test-anthropic-key-' + randomUUID(),
      ANTHROPIC_BETA: 'context-1m-2025-08-07',
      ANTHROPIC_ORGANIZATION: 'test@example.com',
      CLAUDE_CODE_CUSTOM_LIMITS: 'true'
    },
    alwaysThinkingEnabled: false,
    permissions: {
      mode: 'bypassPermissions'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings.json'),
    JSON.stringify(anthropicConfig, null, 2)
  );

  // Create 1M context configuration
  const contextConfig: MockClaudeConfig = {
    defaultModel: 'claude-sonnet-4-20250514',
    contextWindow: 1000000,
    env: {
      ANTHROPIC_API_KEY: 'test-context-key-' + randomUUID(),
      ANTHROPIC_BETA: 'context-1m-2025-08-07',
      ANTHROPIC_ORGANIZATION: 'test@example.com'
    },
    alwaysThinkingEnabled: false,
    permissions: {
      mode: 'bypassPermissions'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings-1m-context.json'),
    JSON.stringify(contextConfig, null, 2)
  );

  // Create enterprise test configuration
  const enterpriseConfig: MockClaudeConfig = {
    model: 'claude-opus-4-1-20250805',
    defaultModel: 'claude-sonnet-4-5-20250929',
    contextWindow: 200000,
    env: {
      ANTHROPIC_API_KEY: 'test-enterprise-key-' + randomUUID(),
      ANTHROPIC_ORGANIZATION: 'enterprise@example.com'
    },
    alwaysThinkingEnabled: true,
    permissions: {
      mode: 'bypassPermissions'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'enterprise-test.json'),
    JSON.stringify(enterpriseConfig, null, 2)
  );
}

/**
 * Clean up mock Claude configuration files
 */
export async function cleanupMockConfigFiles(): Promise<void> {
  try {
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error cleaning up mock config files:', error);
  }
}

/**
 * Create a specific configuration scenario
 */
export async function createConfigScenario(scenario: 'zai' | 'anthropic' | '1m-context' | 'enterprise' | 'multi-config'): Promise<void> {
  // Clean up existing configs
  await cleanupMockConfigFiles();
  mkdirSync(TEST_CONFIG_DIR, { recursive: true });

  switch (scenario) {
    case 'zai':
      await createZAIConfig();
      break;
    case 'anthropic':
      await createAnthropicConfig();
      break;
    case '1m-context':
      await createContextConfig();
      break;
    case 'enterprise':
      await createEnterpriseConfig();
      break;
    case 'multi-config':
      await mockClaudeConfigFiles();
      break;
  }
}

/**
 * Create Z.AI configuration only
 */
async function createZAIConfig(): Promise<void> {
  const zaiConfig: MockClaudeConfig = {
    model: 'glm-4.6',
    defaultModel: 'claude-sonnet-4-5-20250929',
    contextWindow: 128000,
    env: {
      ANTHROPIC_AUTH_TOKEN: 'test-zai-scenario-token',
      ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings-zai.json'),
    JSON.stringify(zaiConfig, null, 2)
  );
}

/**
 * Create Anthropic configuration only
 */
async function createAnthropicConfig(): Promise<void> {
  const anthropicConfig: MockClaudeConfig = {
    model: 'claude-sonnet-4-5-20250929',
    contextWindow: 200000,
    env: {
      ANTHROPIC_API_KEY: 'test-anthropic-scenario-key'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings.json'),
    JSON.stringify(anthropicConfig, null, 2)
  );
}

/**
 * Create 1M context configuration only
 */
async function createContextConfig(): Promise<void> {
  const contextConfig: MockClaudeConfig = {
    model: 'claude-sonnet-4-20250514',
    contextWindow: 1000000,
    env: {
      ANTHROPIC_API_KEY: 'test-context-scenario-key',
      ANTHROPIC_BETA: 'context-1m-2025-08-07'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings-1m-context.json'),
    JSON.stringify(contextConfig, null, 2)
  );
}

/**
 * Create enterprise configuration only
 */
async function createEnterpriseConfig(): Promise<void> {
  const enterpriseConfig: MockClaudeConfig = {
    model: 'claude-opus-4-1-20250805',
    contextWindow: 200000,
    env: {
      ANTHROPIC_API_KEY: 'test-enterprise-scenario-key'
    },
    alwaysThinkingEnabled: true
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'enterprise-test.json'),
    JSON.stringify(enterpriseConfig, null, 2)
  );
}

/**
 * Create a malformed configuration file for error testing
 */
export async function createMalformedConfig(): Promise<void> {
  await cleanupMockConfigFiles();
  mkdirSync(TEST_CONFIG_DIR, { recursive: true });

  // Create malformed JSON
  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings.json'),
    '{ "model": "glm-4.6", "invalid": json }'
  );
}

/**
 * Create an empty configuration file for testing fallbacks
 */
export async function createEmptyConfig(): Promise<void> {
  await cleanupMockConfigFiles();
  mkdirSync(TEST_CONFIG_DIR, { recursive: true });

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings.json'),
    '{}'
  );
}

/**
 * Get test configuration directory path
 */
export function getTestConfigDir(): string {
  return TEST_CONFIG_DIR;
}

/**
 * Mock environment variables for testing
 */
export function mockEnvironmentVariables(scenario: 'zai' | 'anthropic' | 'mixed'): void {
  switch (scenario) {
    case 'zai':
      process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/api/anthropic';
      process.env.ANTHROPIC_AUTH_TOKEN = 'test-env-zai-token';
      break;
    case 'anthropic':
      process.env.ANTHROPIC_API_KEY = 'test-env-anthropic-key';
      process.env.ANTHROPIC_BETA = 'context-1m-2025-08-07';
      break;
    case 'mixed':
      process.env.ANTHROPIC_API_KEY = 'test-env-key';
      process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/api/anthropic';
      process.env.ANTHROPIC_AUTH_TOKEN = 'test-env-token';
      break;
  }
}

/**
 * Clean up mocked environment variables
 */
export function cleanupEnvironmentVariables(): void {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.ANTHROPIC_BASE_URL;
  delete process.env.ANTHROPIC_BETA;
  delete process.env.ANTHROPIC_ORGANIZATION;
  delete process.env.CLAUDE_CODE_CUSTOM_LIMITS;
}

/**
 * Create configuration with authentication errors
 */
export async function createConfigWithAuthErrors(): Promise<void> {
  await cleanupMockConfigFiles();
  mkdirSync(TEST_CONFIG_DIR, { recursive: true });

  // Config with missing authentication
  const noAuthConfig: MockClaudeConfig = {
    model: 'glm-4.6',
    contextWindow: 128000,
    env: {
      // Missing ANTHROPIC_AUTH_TOKEN
      ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic'
    }
  };

  writeFileSync(
    join(TEST_CONFIG_DIR, 'settings-zai.json'),
    JSON.stringify(noAuthConfig, null, 2)
  );
}

/**
 * Create configuration with custom endpoints
 */
export async function createConfigWithCustomEndpoints(): Promise<void> {
  await cleanupMockConfigFiles();
  mkdirSync(TEST_CONFIG_DIR, { recursive: true });

  const customEndpoints: MockClaudeConfig[] = [
    {
      model: 'glm-4.6',
      env: {
        ANTHROPIC_BASE_URL: 'https://custom.z.ai.endpoint',
        ANTHROPIC_AUTH_TOKEN: 'test-custom-token'
      }
    },
    {
      model: 'claude-sonnet-4-5-20250929',
      env: {
        ANTHROPIC_BASE_URL: 'https://custom.anthropic.endpoint',
        ANTHROPIC_API_KEY: 'test-custom-key'
      }
    },
    {
      model: 'unknown-model',
      env: {
        ANTHROPIC_BASE_URL: 'https://unknown.provider.endpoint',
        ANTHROPIC_API_KEY: 'test-unknown-key'
      }
    }
  ];

  customEndpoints.forEach((config, index) => {
    writeFileSync(
      join(TEST_CONFIG_DIR, `custom-endpoint-${index}.json`),
      JSON.stringify(config, null, 2)
    );
  });
}

/**
 * Verify configuration file structure
 */
export function verifyConfigStructure(): {
  exists: boolean;
  files: string[];
  valid: boolean;
  errors: string[];
} {
  const result = {
    exists: existsSync(TEST_CONFIG_DIR),
    files: [] as string[],
    valid: true,
    errors: [] as string[]
  };

  if (!result.exists) {
    result.errors.push('Test config directory does not exist');
    return result;
  }

  try {
    const files = require('fs').readdirSync(TEST_CONFIG_DIR);
    result.files = files.filter(file => file.endsWith('.json'));

    for (const file of result.files) {
      try {
        const content = require('fs').readFileSync(join(TEST_CONFIG_DIR, file), 'utf-8');
        JSON.parse(content);
      } catch (error) {
        result.valid = false;
        result.errors.push(`Invalid JSON in ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Error reading config directory: ${error.message}`);
  }

  return result;
}