-- ============================================================================
-- CODE SNIPPETS REGISTRY SYSTEM - Official Snippet Management
-- ============================================================================
-- Purpose: Store, catalog, and manage reusable code snippets
-- Created: 2025-10-12
-- Part of: Central-MCP Atomic Entities Infrastructure
-- ============================================================================

-- Main snippets registry
CREATE TABLE IF NOT EXISTS snippets_registry (
    snippet_id TEXT PRIMARY KEY,                 -- e.g. "react-auth-hook", "nodejs-error-handler"
    snippet_name TEXT NOT NULL,                  -- Display name
    category TEXT NOT NULL,                      -- component, hook, utility, api, config, etc.
    language TEXT NOT NULL,                      -- typescript, javascript, python, bash, sql, etc.
    framework TEXT,                              -- react, nextjs, express, fastapi, etc.

    -- Code
    code TEXT NOT NULL,                          -- The actual snippet code
    code_hash TEXT,                              -- SHA-256 hash for deduplication
    line_count INTEGER DEFAULT 0,
    char_count INTEGER DEFAULT 0,

    -- Metadata
    description TEXT NOT NULL,                   -- What it does
    use_case TEXT,                               -- When to use it
    tags TEXT,                                   -- JSON array of tags
    complexity TEXT DEFAULT 'simple',            -- simple, moderate, complex

    -- Usage
    usage_example TEXT,                          -- Example of how to use
    installation_notes TEXT,                     -- Dependencies or setup
    related_snippets TEXT,                       -- JSON array of related snippet IDs

    -- Quality
    test_code TEXT,                              -- Test code for snippet
    has_tests BOOLEAN DEFAULT FALSE,
    is_production_ready BOOLEAN DEFAULT FALSE,
    quality_score REAL DEFAULT 0.0,              -- 0-1 quality score

    -- Source
    source_file TEXT,                            -- Original file path
    source_url TEXT,                             -- Original URL
    author TEXT,                                 -- Who created it
    license TEXT DEFAULT 'MIT',

    -- Stats
    usage_count INTEGER DEFAULT 0,               -- How many times used
    last_used_at TIMESTAMP,
    copy_count INTEGER DEFAULT 0,                -- How many times copied
    favorite_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by TEXT DEFAULT 'system'
);

-- Snippet dependencies (what does this snippet need?)
CREATE TABLE IF NOT EXISTS snippet_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id TEXT NOT NULL,
    dependency_type TEXT NOT NULL,               -- npm, pip, gem, package, snippet
    dependency_name TEXT NOT NULL,               -- Package or snippet name
    version_constraint TEXT,                     -- >=1.0.0, ^2.0.0
    is_required BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (snippet_id) REFERENCES snippets_registry(snippet_id)
);

-- Snippet versions (track changes over time)
CREATE TABLE IF NOT EXISTS snippet_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id TEXT NOT NULL,
    version TEXT NOT NULL,                       -- v1.0.0, v1.1.0
    code TEXT NOT NULL,                          -- Code at this version
    changelog TEXT,                              -- What changed
    breaking_changes BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (snippet_id) REFERENCES snippets_registry(snippet_id)
);

-- Snippet usage history
CREATE TABLE IF NOT EXISTS snippet_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id TEXT NOT NULL,
    used_by TEXT,                                -- agent_id, user_id
    project_id TEXT,                             -- Where it was used
    usage_type TEXT DEFAULT 'copied',            -- copied, referenced, modified
    context TEXT,                                -- Additional context
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snippet_id) REFERENCES snippets_registry(snippet_id)
);

-- Snippet collections (grouped snippets)
CREATE TABLE IF NOT EXISTS snippet_collections (
    collection_id TEXT PRIMARY KEY,              -- e.g. "react-hooks-essentials"
    collection_name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📦',
    snippet_ids TEXT NOT NULL,                   -- JSON array of snippet IDs
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Snippet ratings and feedback
CREATE TABLE IF NOT EXISTS snippet_ratings (
    rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    feedback TEXT,
    rated_by TEXT,
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snippet_id) REFERENCES snippets_registry(snippet_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets_registry(category);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets_registry(language);
CREATE INDEX IF NOT EXISTS idx_snippets_framework ON snippets_registry(framework);
CREATE INDEX IF NOT EXISTS idx_snippets_quality ON snippets_registry(is_production_ready, quality_score);
CREATE INDEX IF NOT EXISTS idx_snippets_usage_count ON snippets_registry(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_snippet_dependencies_snippet ON snippet_dependencies(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_snippet ON snippet_usage(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_project ON snippet_usage(project_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Popular snippets
CREATE VIEW IF NOT EXISTS popular_snippets AS
SELECT
    snippet_id,
    snippet_name,
    category,
    language,
    framework,
    usage_count,
    copy_count,
    favorite_count,
    quality_score,
    AVG(r.rating) as avg_rating,
    COUNT(r.rating_id) as rating_count
FROM snippets_registry s
LEFT JOIN snippet_ratings r ON s.snippet_id = r.snippet_id
GROUP BY s.snippet_id
HAVING usage_count > 0
ORDER BY usage_count DESC, avg_rating DESC
LIMIT 50;

-- Production-ready snippets
CREATE VIEW IF NOT EXISTS production_ready_snippets AS
SELECT
    snippet_id,
    snippet_name,
    category,
    language,
    framework,
    description,
    has_tests,
    quality_score,
    usage_count
FROM snippets_registry
WHERE is_production_ready = TRUE AND quality_score >= 0.7
ORDER BY quality_score DESC, usage_count DESC;

-- Recent snippets
CREATE VIEW IF NOT EXISTS recent_snippets AS
SELECT
    snippet_id,
    snippet_name,
    category,
    language,
    framework,
    description,
    created_at,
    registered_by
FROM snippets_registry
ORDER BY created_at DESC
LIMIT 20;

-- Snippet usage stats
CREATE VIEW IF NOT EXISTS snippet_usage_stats AS
SELECT
    s.snippet_id,
    s.snippet_name,
    COUNT(DISTINCT u.usage_id) as total_uses,
    COUNT(DISTINCT u.project_id) as projects_used_in,
    COUNT(DISTINCT u.used_by) as unique_users,
    MAX(u.used_at) as last_used
FROM snippets_registry s
LEFT JOIN snippet_usage u ON s.snippet_id = u.snippet_id
GROUP BY s.snippet_id
ORDER BY total_uses DESC;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp
CREATE TRIGGER IF NOT EXISTS update_snippets_timestamp
AFTER UPDATE ON snippets_registry
FOR EACH ROW
BEGIN
    UPDATE snippets_registry SET updated_at = CURRENT_TIMESTAMP WHERE snippet_id = NEW.snippet_id;
END;

-- Increment usage count
CREATE TRIGGER IF NOT EXISTS increment_snippet_usage_count
AFTER INSERT ON snippet_usage
FOR EACH ROW
BEGIN
    UPDATE snippets_registry
    SET usage_count = usage_count + 1,
        last_used_at = NEW.used_at,
        copy_count = CASE WHEN NEW.usage_type = 'copied' THEN copy_count + 1 ELSE copy_count END
    WHERE snippet_id = NEW.snippet_id;
END;

-- ============================================================================
-- Initial snippet population (essential patterns)
-- ============================================================================

-- React Custom Hook: useLocalStorage
INSERT OR IGNORE INTO snippets_registry (
    snippet_id, snippet_name, category, language, framework,
    code, description, use_case, tags, complexity,
    is_production_ready, quality_score, registered_by
) VALUES (
    'react-use-localstorage',
    'useLocalStorage Hook',
    'hook',
    'typescript',
    'react',
    'import { useState, useEffect } from ''react'';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}',
    'React hook for syncing state with localStorage',
    'Store user preferences, form data, or any state that should persist across sessions',
    '["react", "hook", "localstorage", "state", "typescript"]',
    'simple',
    TRUE,
    0.95,
    'system'
);

-- Node.js Error Handler Middleware
INSERT OR IGNORE INTO snippets_registry (
    snippet_id, snippet_name, category, language, framework,
    code, description, use_case, tags, complexity,
    is_production_ready, quality_score, registered_by
) VALUES (
    'nodejs-error-handler',
    'Express Error Handler Middleware',
    'api',
    'typescript',
    'express',
    'import { Request, Response, NextFunction } from ''express'';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || ''Internal Server Error'';

  console.error(`[Error] ${statusCode}: ${message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === ''development'' && { stack: err.stack }),
    },
  });
};

export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};',
    'Centralized error handling middleware for Express applications',
    'Handle all application errors consistently with proper logging',
    '["nodejs", "express", "middleware", "error-handling", "api"]',
    'moderate',
    TRUE,
    0.92,
    'system'
);

-- Python FastAPI CORS Configuration
INSERT OR IGNORE INTO snippets_registry (
    snippet_id, snippet_name, category, language, framework,
    code, description, use_case, tags, complexity,
    is_production_ready, quality_score, registered_by
) VALUES (
    'python-fastapi-cors',
    'FastAPI CORS Configuration',
    'config',
    'python',
    'fastapi',
    'from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://yourdomain.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)',
    'CORS middleware setup for FastAPI applications',
    'Enable cross-origin requests in FastAPI backend',
    '["python", "fastapi", "cors", "middleware", "api"]',
    'simple',
    TRUE,
    0.88,
    'system'
);

-- SQL Query: Active Users Last 30 Days
INSERT OR IGNORE INTO snippets_registry (
    snippet_id, snippet_name, category, language, framework,
    code, description, use_case, tags, complexity,
    is_production_ready, quality_score, registered_by
) VALUES (
    'sql-active-users-30d',
    'Active Users Last 30 Days',
    'query',
    'sql',
    NULL,
    'SELECT
    u.user_id,
    u.username,
    u.email,
    COUNT(DISTINCT DATE(a.created_at)) as active_days,
    MAX(a.created_at) as last_activity,
    COUNT(a.activity_id) as total_activities
FROM users u
JOIN activities a ON u.user_id = a.user_id
WHERE a.created_at >= DATE(''now'', ''-30 days'')
GROUP BY u.user_id, u.username, u.email
HAVING active_days >= 5
ORDER BY active_days DESC, total_activities DESC;',
    'Find active users in the last 30 days with activity metrics',
    'Identify engaged users for retention analysis',
    '["sql", "analytics", "users", "activity", "metrics"]',
    'simple',
    TRUE,
    0.85,
    'system'
);

-- Bash Script: Git Branch Cleanup
INSERT OR IGNORE INTO snippets_registry (
    snippet_id, snippet_name, category, language, framework,
    code, description, use_case, tags, complexity,
    is_production_ready, quality_score, registered_by
) VALUES (
    'bash-git-branch-cleanup',
    'Git Branch Cleanup Script',
    'utility',
    'bash',
    NULL,
    '#!/bin/bash
# Clean up merged Git branches

# Fetch and prune remote branches
git fetch -p

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Delete local branches that have been merged
git branch --merged | grep -v "^\*" | grep -v "main" | grep -v "master" | grep -v "develop" | xargs -n 1 git branch -d

# List remote branches that are merged
echo "Remote branches merged into $CURRENT_BRANCH:"
git branch -r --merged | grep -v "main" | grep -v "master" | grep -v "develop"',
    'Clean up local and list remote Git branches that have been merged',
    'Maintain clean repository by removing stale branches',
    '["bash", "git", "cleanup", "automation", "devops"]',
    'simple',
    TRUE,
    0.80,
    'system'
);
