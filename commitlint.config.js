/**
 * Commitlint Configuration for Central-MCP
 *
 * Enforces Conventional Commits standard for automatic versioning and changelog generation
 *
 * Commit Format: <type>(<scope>): <subject>
 *
 * Types:
 * - feat:     New feature (bumps minor version)
 * - fix:      Bug fix (bumps patch version)
 * - docs:     Documentation only
 * - style:    Code style (formatting, no code change)
 * - refactor: Code refactoring (no feature/bug)
 * - perf:     Performance improvement
 * - test:     Adding tests
 * - chore:    Build process, dependencies
 * - ci:       CI/CD configuration
 * - revert:   Revert previous commit
 *
 * Breaking Changes: Add "BREAKING CHANGE:" in footer or "!" after type
 *
 * Examples:
 * - feat(api): add RunPod integration endpoints
 * - fix(dashboard): resolve duplicate agent keys
 * - feat!: remove deprecated MCP tools
 * - chore(deps): update dependencies
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Type must be one of these
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code refactoring
        'perf',     // Performance
        'test',     // Tests
        'chore',    // Build/tooling
        'ci',       // CI/CD
        'revert',   // Revert commit
        'wip',      // Work in progress (discouraged)
      ],
    ],

    // Subject must not be empty
    'subject-empty': [2, 'never'],

    // Subject must not end with period
    'subject-full-stop': [2, 'never', '.'],

    // Subject must be lowercase
    'subject-case': [2, 'always', 'lower-case'],

    // Subject max length
    'subject-max-length': [2, 'always', 100],

    // Body max line length
    'body-max-line-length': [2, 'always', 100],

    // Footer max line length
    'footer-max-line-length': [2, 'always', 100],

    // Scope is optional but encouraged
    'scope-case': [2, 'always', 'lower-case'],

    // Allowed scopes (optional enforcement)
    'scope-enum': [
      1, // Warning, not error
      'always',
      [
        'api',
        'dashboard',
        'loops',
        'agents',
        'tasks',
        'specs',
        'git',
        'auth',
        'db',
        'ui',
        'docker',
        'runpod',
        'deployment',
        'monitoring',
        'intelligence',
        'deps',
      ],
    ],
  },
};
