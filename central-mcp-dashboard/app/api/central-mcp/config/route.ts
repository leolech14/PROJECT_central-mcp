import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export const runtime = 'nodejs';

const DB_PATH = '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db';

// Default Configuration for Central-MCP
const DEFAULT_CONFIG = {
  loops: {
    loop0: { enabled: true, interval: 5, name: 'System Status' },
    loop1: { enabled: true, interval: 60, name: 'Agent Auto-Discovery' },
    loop2: { enabled: true, interval: 60, name: 'Project Discovery' },
    loop3: { enabled: false, interval: 1200, name: 'Context Learning (Reserved)' },
    loop4: { enabled: true, interval: 30, name: 'Progress Monitoring' },
    loop5: { enabled: true, interval: 300, name: 'Status Analysis' },
    loop6: { enabled: true, interval: 900, name: 'Opportunity Scanning' },
    loop7: { enabled: true, interval: 600, name: 'Spec Generation' },
    loop8: { enabled: true, interval: 120, name: 'Task Assignment' },
    loop9: { enabled: true, interval: 60, name: 'Git Push Monitor' },
  },
  database: {
    path: '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db',
    criticalPaths: [
      '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/data/registry.db',
      '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/02_SPECBASES/',
    ],
    backupEnabled: true,
    backupInterval: 86400, // 24 hours in seconds
    connectionPoolSize: 5,
    queryTimeout: 30000, // 30 seconds
  },
  projects: {
    scanPaths: ['/Users/lech/PROJECTS_all/'],
    excludePatterns: ['node_modules', '.git', 'dist', 'build', '.next'],
    scanInterval: 60, // seconds
    autoRegister: true,
  },
  agents: {
    sessionTimeout: 3600, // 1 hour in seconds
    maxConcurrentAgents: 10,
    autoAssignment: true,
    skillMatching: true,
    loadBalancing: true,
  },
  tasks: {
    autoAssignment: true,
    dependencyResolution: true,
    priorityLevels: ['P0-CRITICAL', 'P1-HIGH', 'P2-MEDIUM', 'P3-LOW'],
    maxBlockedDuration: 604800, // 7 days in seconds
  },
  rag: {
    chunkSize: 512,
    chunkOverlap: 50,
    ftsEnabled: true,
    indexRebuildInterval: 7200, // 2 hours
    maxChunksPerSpec: 1000,
  },
  api: {
    pollingInterval: 5000, // 5 seconds in ms
    cacheMaxAge: 5, // seconds
    rateLimitPerMinute: 100,
    enableCORS: true,
  },
  monitoring: {
    healthCheckInterval: 30, // seconds
    alertThresholds: {
      cpuUsage: 80, // percent
      memoryUsage: 80, // percent
      diskUsage: 90, // percent
      loopFailureRate: 5, // percent
    },
    notificationChannels: {
      email: false,
      slack: false,
      discord: false,
    },
  },
  git: {
    autoVersioning: true,
    commitMessageTemplate: '{{type}}: {{message}}\\n\\n{{body}}',
    pushMonitoring: true,
    branchProtection: ['main', 'master'],
  },
  systems: {
    modelRegistry: { enabled: false },
    llmOrchestrator: { enabled: false },
    gitIntelligence: { enabled: true },
    autoDeployer: { enabled: false },
    specValidator: { enabled: true },
    totalityVerification: { enabled: false },
    agentOrchestrator: { enabled: true },
    contentManager: { enabled: false },
    taskGenerator: { enabled: true },
    specParser: { enabled: true },
  },
};

// GET: Retrieve current configuration
export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Try to get config from database
    let config = DEFAULT_CONFIG;

    try {
      const configRow = db.prepare(`
        SELECT config_data
        FROM system_config
        WHERE config_key = 'central_mcp_config'
        LIMIT 1
      `).get() as { config_data?: string } | undefined;

      if (configRow && configRow.config_data) {
        config = JSON.parse(configRow.config_data);
      }
    } catch (e) {
      // Table might not exist, use default config
      console.log('Using default config (system_config table not found)');
    }

    db.close();

    return NextResponse.json({
      status: 'success',
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Config GET error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      config: DEFAULT_CONFIG,
    }, { status: 500 });
  }
}

// POST: Update configuration
export async function POST(request: Request) {
  try {
    const { config } = await request.json();

    if (!config) {
      return NextResponse.json({
        status: 'error',
        message: 'Config data is required',
      }, { status: 400 });
    }

    const db = new Database(DB_PATH);

    // Create system_config table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key TEXT UNIQUE NOT NULL,
        config_data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT
      )
    `);

    // Upsert configuration
    const stmt = db.prepare(`
      INSERT INTO system_config (config_key, config_data, updated_at)
      VALUES ('central_mcp_config', ?, datetime('now'))
      ON CONFLICT(config_key) DO UPDATE SET
        config_data = excluded.config_data,
        updated_at = excluded.updated_at
    `);

    stmt.run(JSON.stringify(config));

    db.close();

    return NextResponse.json({
      status: 'success',
      message: 'Configuration saved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Config POST error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}

// PUT: Reset to default configuration
export async function PUT() {
  try {
    const db = new Database(DB_PATH);

    db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key TEXT UNIQUE NOT NULL,
        config_data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT
      )
    `);

    const stmt = db.prepare(`
      INSERT INTO system_config (config_key, config_data, updated_at)
      VALUES ('central_mcp_config', ?, datetime('now'))
      ON CONFLICT(config_key) DO UPDATE SET
        config_data = excluded.config_data,
        updated_at = excluded.updated_at
    `);

    stmt.run(JSON.stringify(DEFAULT_CONFIG));

    db.close();

    return NextResponse.json({
      status: 'success',
      message: 'Configuration reset to defaults',
      config: DEFAULT_CONFIG,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Config PUT error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}
