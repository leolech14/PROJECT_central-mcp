#!/usr/bin/env node
/**
 * PROMETHEUS METRICS EXPORTER FOR CENTRAL-MCP
 * ============================================
 *
 * Exposes /metrics endpoint for Prometheus scraping
 * Runs on port 8001 (separate from main server)
 */

const http = require('http');
const Database = require('better-sqlite3');

const PORT = 8001;
const DB_PATH = process.env.DB_PATH || './data/registry.db';

console.log('🚀 Starting Prometheus Metrics Exporter...');
console.log(`📊 Database: ${DB_PATH}`);
console.log(`🔌 Port: ${PORT}`);

// Prometheus metrics format helpers
function metric(name, type, help, value, labels = {}) {
  const labelStr = Object.keys(labels).length > 0
    ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
    : '';

  return `# HELP ${name} ${help}
# TYPE ${name} ${type}
${name}${labelStr} ${value}
`;
}

function getMetrics(db) {
  const lines = [];
  const now = Date.now();

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM METRICS
    // ═══════════════════════════════════════════════════════════════════════

    lines.push(metric(
      'central_mcp_up',
      'gauge',
      'Central-MCP server status (1 = up, 0 = down)',
      1
    ));

    lines.push(metric(
      'central_mcp_uptime_seconds',
      'counter',
      'Server uptime in seconds',
      Math.floor(process.uptime())
    ));

    // Memory usage
    const mem = process.memoryUsage();
    lines.push(metric(
      'central_mcp_memory_heap_used_bytes',
      'gauge',
      'Node.js heap memory used',
      mem.heapUsed
    ));

    lines.push(metric(
      'central_mcp_memory_heap_total_bytes',
      'gauge',
      'Node.js heap memory total',
      mem.heapTotal
    ));

    lines.push(metric(
      'central_mcp_memory_rss_bytes',
      'gauge',
      'Node.js RSS memory',
      mem.rss
    ));

    // ═══════════════════════════════════════════════════════════════════════
    // PROJECT METRICS
    // ═══════════════════════════════════════════════════════════════════════

    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
    lines.push(metric(
      'central_mcp_projects_total',
      'gauge',
      'Total number of projects registered',
      projectCount.count
    ));

    // Projects by type
    const projectsByType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM projects
      GROUP BY type
    `).all();

    for (const row of projectsByType) {
      lines.push(metric(
        'central_mcp_projects_by_type',
        'gauge',
        'Number of projects by type',
        row.count,
        { type: row.type || 'UNKNOWN' }
      ));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT METRICS
    // ═══════════════════════════════════════════════════════════════════════

    const activeAgents = db.prepare(`
      SELECT COUNT(*) as count
      FROM agent_sessions
      WHERE status = 'ACTIVE'
    `).get();

    lines.push(metric(
      'central_mcp_active_agents_total',
      'gauge',
      'Number of currently active agents',
      activeAgents.count
    ));

    // Agents by letter
    const agentsByLetter = db.prepare(`
      SELECT agent_letter, COUNT(*) as count
      FROM agent_sessions
      WHERE status = 'ACTIVE'
      GROUP BY agent_letter
    `).all();

    for (const row of agentsByLetter) {
      lines.push(metric(
        'central_mcp_agents_active',
        'gauge',
        'Active agents by letter',
        row.count,
        { agent: row.agent_letter }
      ));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TASK METRICS
    // ═══════════════════════════════════════════════════════════════════════

    const taskStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked
      FROM tasks
    `).get();

    lines.push(metric(
      'central_mcp_tasks_total',
      'gauge',
      'Total number of tasks',
      taskStats.total || 0
    ));

    lines.push(metric(
      'central_mcp_tasks_pending',
      'gauge',
      'Number of pending tasks',
      taskStats.pending || 0
    ));

    lines.push(metric(
      'central_mcp_tasks_in_progress',
      'gauge',
      'Number of tasks in progress',
      taskStats.in_progress || 0
    ));

    lines.push(metric(
      'central_mcp_tasks_completed',
      'counter',
      'Number of completed tasks',
      taskStats.completed || 0
    ));

    lines.push(metric(
      'central_mcp_tasks_blocked',
      'gauge',
      'Number of blocked tasks',
      taskStats.blocked || 0
    ));

    // Task completion rate
    const completionRate = taskStats.total > 0
      ? (taskStats.completed / taskStats.total)
      : 0;

    lines.push(metric(
      'central_mcp_task_completion_rate',
      'gauge',
      'Task completion rate (0-1)',
      completionRate.toFixed(3)
    ));

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-PROACTIVE LOOP METRICS
    // ═══════════════════════════════════════════════════════════════════════

    const loopNames = [
      'SYSTEM_STATUS',
      'AGENT_AUTO_DISCOVERY',
      'PROJECT_DISCOVERY',
      'PROGRESS_MONITORING',
      'STATUS_ANALYSIS',
      'OPPORTUNITY_SCANNING',
      'SPEC_GENERATION',
      'TASK_ASSIGNMENT',
      'GIT_PUSH_MONITOR'
    ];

    for (const loopName of loopNames) {
      const loopStats = db.prepare(`
        SELECT
          COUNT(*) as execution_count,
          AVG(execution_time_ms) as avg_duration,
          MAX(execution_time_ms) as max_duration,
          MIN(execution_time_ms) as min_duration,
          MAX(timestamp) as last_execution
        FROM auto_proactive_logs
        WHERE loop_name = ?
          AND timestamp > datetime('now', '-10 minutes')
      `).get(loopName);

      const labels = { loop_name: loopName };

      lines.push(metric(
        'central_mcp_loop_execution_count',
        'counter',
        'Number of loop executions in last 10 minutes',
        loopStats.execution_count || 0,
        labels
      ));

      lines.push(metric(
        'central_mcp_loop_duration_avg_ms',
        'gauge',
        'Average loop execution duration in milliseconds',
        loopStats.avg_duration || 0,
        labels
      ));

      lines.push(metric(
        'central_mcp_loop_duration_max_ms',
        'gauge',
        'Maximum loop execution duration in milliseconds',
        loopStats.max_duration || 0,
        labels
      ));
    }

    // Loop health (has it run in last 10 minutes?)
    for (const loopName of loopNames) {
      const hasRun = db.prepare(`
        SELECT COUNT(*) as count
        FROM auto_proactive_logs
        WHERE loop_name = ?
          AND timestamp > datetime('now', '-10 minutes')
      `).get(loopName);

      lines.push(metric(
        'central_mcp_loop_healthy',
        'gauge',
        'Loop health status (1 = healthy, 0 = stale)',
        hasRun.count > 0 ? 1 : 0,
        { loop_name: loopName }
      ));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DATABASE METRICS
    // ═══════════════════════════════════════════════════════════════════════

    // Count records in key tables
    const tables = ['projects', 'tasks', 'agent_sessions', 'auto_proactive_logs'];

    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        lines.push(metric(
          'central_mcp_database_rows',
          'gauge',
          `Number of rows in ${table} table`,
          count.count,
          { table }
        ));
      } catch (e) {
        // Table might not exist, skip
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCRAPE METRICS
    // ═══════════════════════════════════════════════════════════════════════

    lines.push(metric(
      'central_mcp_scrape_duration_ms',
      'gauge',
      'Duration of metrics collection in milliseconds',
      Date.now() - now
    ));

    lines.push(metric(
      'central_mcp_scrape_timestamp',
      'gauge',
      'Unix timestamp of last scrape',
      Math.floor(now / 1000)
    ));

  } catch (error) {
    console.error('❌ Error collecting metrics:', error);
    lines.push(metric(
      'central_mcp_scrape_error',
      'gauge',
      'Whether an error occurred during scrape (1 = error)',
      1
    ));
  }

  return lines.join('\n');
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/metrics') {
    try {
      const db = new Database(DB_PATH, { readonly: true });
      const metrics = getMetrics(db);
      db.close();

      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      res.end(metrics);
    } catch (error) {
      console.error('❌ Error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`# Error: ${error.message}\n`);
    }
  }
  else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n\nEndpoints:\n  GET /metrics - Prometheus metrics\n  GET /health  - Health check\n');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   📊 Central-MCP Prometheus Metrics Exporter                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║   🔌 Metrics:  http://localhost:${PORT}/metrics                   ║`);
  console.log(`║   🏥 Health:   http://localhost:${PORT}/health                    ║`);
  console.log('║   🔄 Scrape:   Prometheus scrapes every 15s                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Ready for Prometheus scraping!');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
