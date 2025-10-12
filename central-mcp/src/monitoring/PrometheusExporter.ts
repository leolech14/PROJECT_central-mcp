/**
 * Prometheus Metrics Exporter for Central-MCP
 * ============================================
 *
 * Exposes all Central-MCP intelligence metrics to Prometheus
 *
 * Metrics exposed:
 * - Loop execution counts
 * - Loop execution duration
 * - Database query performance
 * - Agent session metrics
 * - Task completion rates
 * - Project health scores
 * - System resource usage
 *
 * Endpoint: http://localhost:9091/metrics
 */

import * as promClient from 'prom-client';
import { Database } from 'better-sqlite3';
import { AutoProactiveEngine } from '../auto-proactive/AutoProactiveEngine.js';
import express from 'express';

export class PrometheusExporter {
  private register: promClient.Registry;
  private db: Database.Database;
  private engine?: AutoProactiveEngine;

  // Metrics definitions
  private loopExecutionCounter: promClient.Counter;
  private loopExecutionDuration: promClient.Histogram;
  private loopExecutionErrors: promClient.Counter;
  private activeAgentsGauge: promClient.Gauge;
  private projectHealthGauge: promClient.Gauge;
  private tasksGauge: promClient.Gauge;
  private databaseQueryDuration: promClient.Histogram;
  private systemHealthGauge: promClient.Gauge;
  private uptimeGauge: promClient.Gauge;

  constructor(db: Database.Database, engine?: AutoProactiveEngine) {
    this.db = db;
    this.engine = engine;
    this.register = new promClient.Registry();

    // Add default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register: this.register });

    // Initialize custom metrics
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Loop execution counter
    this.loopExecutionCounter = new promClient.Counter({
      name: 'central_mcp_loop_executions_total',
      help: 'Total number of loop executions',
      labelNames: ['loop_name', 'action', 'status'],
      registers: [this.register]
    });

    // Loop execution duration
    this.loopExecutionDuration = new promClient.Histogram({
      name: 'central_mcp_loop_duration_seconds',
      help: 'Duration of loop executions in seconds',
      labelNames: ['loop_name', 'action'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });

    // Loop execution errors
    this.loopExecutionErrors = new promClient.Counter({
      name: 'central_mcp_loop_errors_total',
      help: 'Total number of loop execution errors',
      labelNames: ['loop_name', 'error_type'],
      registers: [this.register]
    });

    // Active agents gauge
    this.activeAgentsGauge = new promClient.Gauge({
      name: 'central_mcp_active_agents',
      help: 'Number of currently active agents',
      labelNames: ['agent_letter', 'project'],
      registers: [this.register]
    });

    // Project health gauge
    this.projectHealthGauge = new promClient.Gauge({
      name: 'central_mcp_project_health_score',
      help: 'Health score of each project (0-100)',
      labelNames: ['project_name', 'project_type'],
      registers: [this.register]
    });

    // Tasks gauge
    this.tasksGauge = new promClient.Gauge({
      name: 'central_mcp_tasks',
      help: 'Number of tasks by status',
      labelNames: ['status', 'agent', 'project'],
      registers: [this.register]
    });

    // Database query duration
    this.databaseQueryDuration = new promClient.Histogram({
      name: 'central_mcp_database_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['query_type', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register]
    });

    // System health gauge
    this.systemHealthGauge = new promClient.Gauge({
      name: 'central_mcp_system_health',
      help: 'Overall system health (0=down, 1=healthy)',
      registers: [this.register]
    });

    // Uptime gauge
    this.uptimeGauge = new promClient.Gauge({
      name: 'central_mcp_uptime_seconds',
      help: 'System uptime in seconds',
      registers: [this.register]
    });
  }

  /**
   * Update metrics from database
   */
  async updateMetrics() {
    try {
      // Update loop execution metrics
      this.updateLoopMetrics();

      // Update agent metrics
      this.updateAgentMetrics();

      // Update project metrics
      this.updateProjectMetrics();

      // Update task metrics
      this.updateTaskMetrics();

      // Update system health
      this.updateSystemHealth();

      // Update uptime
      this.uptimeGauge.set(process.uptime());

    } catch (error) {
      console.error('Error updating Prometheus metrics:', error);
    }
  }

  private updateLoopMetrics() {
    // Get loop execution counts from last 5 minutes
    const loopStats = this.db.prepare(`
      SELECT
        loop_name,
        action,
        COUNT(*) as count,
        AVG(execution_time_ms) as avg_duration,
        MAX(execution_time_ms) as max_duration
      FROM auto_proactive_logs
      WHERE timestamp > datetime('now', '-5 minutes')
      GROUP BY loop_name, action
    `).all();

    for (const stat of loopStats) {
      // Update counter
      this.loopExecutionCounter.inc({
        loop_name: stat.loop_name,
        action: stat.action,
        status: 'success'
      }, stat.count);

      // Update duration histogram (convert ms to seconds)
      const durationSeconds = stat.avg_duration / 1000;
      this.loopExecutionDuration.observe({
        loop_name: stat.loop_name,
        action: stat.action
      }, durationSeconds);
    }
  }

  private updateAgentMetrics() {
    // Reset gauge
    this.activeAgentsGauge.reset();

    // Get active agent sessions
    const agents = this.db.prepare(`
      SELECT agent_letter, project_id, COUNT(*) as count
      FROM agent_sessions
      WHERE status = 'ACTIVE'
      GROUP BY agent_letter, project_id
    `).all();

    for (const agent of agents) {
      this.activeAgentsGauge.set({
        agent_letter: agent.agent_letter,
        project: agent.project_id
      }, agent.count);
    }
  }

  private updateProjectMetrics() {
    // Reset gauge
    this.projectHealthGauge.reset();

    // Get project health scores
    const projects = this.db.prepare(`
      SELECT
        project_name,
        project_type,
        health_score
      FROM projects
      WHERE health_score IS NOT NULL
    `).all();

    for (const project of projects) {
      this.projectHealthGauge.set({
        project_name: project.project_name,
        project_type: project.project_type || 'UNKNOWN'
      }, project.health_score || 0);
    }
  }

  private updateTaskMetrics() {
    // Reset gauge
    this.tasksGauge.reset();

    // Get task counts by status
    const tasks = this.db.prepare(`
      SELECT
        status,
        agent,
        project_id,
        COUNT(*) as count
      FROM tasks
      GROUP BY status, agent, project_id
    `).all();

    for (const task of tasks) {
      this.tasksGauge.set({
        status: task.status,
        agent: task.agent,
        project: task.project_id
      }, task.count);
    }
  }

  private updateSystemHealth() {
    // Check system health indicators
    let healthScore = 1;

    try {
      // Check database connectivity
      this.db.prepare('SELECT 1').get();

      // Check if loops are running
      if (this.engine) {
        const status = this.engine.getStatus();
        if (!status.isRunning || status.activeLoops === 0) {
          healthScore = 0;
        }
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
      if (memUsagePercent > 0.95) {
        healthScore = 0.5; // Degraded
      }

    } catch (error) {
      healthScore = 0; // Down
    }

    this.systemHealthGauge.set(healthScore);
  }

  /**
   * Record a database query for performance tracking
   */
  recordDatabaseQuery(queryType: string, table: string, durationMs: number) {
    this.databaseQueryDuration.observe({
      query_type: queryType,
      table
    }, durationMs / 1000);
  }

  /**
   * Record a loop execution error
   */
  recordLoopError(loopName: string, errorType: string) {
    this.loopExecutionErrors.inc({
      loop_name: loopName,
      error_type: errorType
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    await this.updateMetrics();
    return this.register.metrics();
  }

  /**
   * Start HTTP server to expose metrics
   */
  startServer(port: number = 9091) {
    const app = express();

    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', this.register.contentType);
        res.end(await this.getMetrics());
      } catch (error) {
        res.status(500).end(error);
      }
    });

    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    app.listen(port, () => {
      console.log(`📊 Prometheus metrics server listening on port ${port}`);
      console.log(`   Metrics: http://localhost:${port}/metrics`);
      console.log(`   Health:  http://localhost:${port}/health`);
    });
  }
}
