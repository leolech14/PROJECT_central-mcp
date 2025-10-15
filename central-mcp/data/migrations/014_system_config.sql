-- Migration 014: System Configuration Table
-- Date: 2025-10-12
-- Purpose: Store Central-MCP dashboard configuration settings

CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_data TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on config_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Insert default configuration if not exists
INSERT OR IGNORE INTO system_config (config_key, config_data, updated_at)
VALUES (
  'central_mcp_config',
  '{
    "loops": {
      "loop0": {"enabled": true, "interval": 5, "name": "System Status"},
      "loop1": {"enabled": true, "interval": 60, "name": "Agent Auto-Discovery"},
      "loop2": {"enabled": true, "interval": 60, "name": "Project Discovery"},
      "loop3": {"enabled": false, "interval": 1200, "name": "Context Learning (Reserved)"},
      "loop4": {"enabled": true, "interval": 30, "name": "Progress Monitoring"},
      "loop5": {"enabled": true, "interval": 300, "name": "Status Analysis"},
      "loop6": {"enabled": true, "interval": 900, "name": "Opportunity Scanning"},
      "loop7": {"enabled": true, "interval": 600, "name": "Spec Generation"},
      "loop8": {"enabled": true, "interval": 120, "name": "Task Assignment"},
      "loop9": {"enabled": true, "interval": 60, "name": "Git Push Monitor"}
    },
    "database": {
      "path": "/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db",
      "criticalPaths": [
        "/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db",
        "/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/02_SPECBASES/"
      ],
      "backupEnabled": true,
      "backupInterval": 86400,
      "connectionPoolSize": 5,
      "queryTimeout": 30000
    }
  }',
  datetime('now')
);
