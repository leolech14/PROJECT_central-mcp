/**
 * Monitoring API Endpoints
 * ========================
 *
 * Real-time monitoring API for Central-MCP dashboard
 * Serves system status, loop statistics, and intelligence metrics
 */

import Database from 'better-sqlite3';
import { AutoProactiveEngine } from '../auto-proactive/AutoProactiveEngine.js';
import express, { Request, Response } from 'express';

export class MonitoringAPI {
  private db: Database.Database;
  private engine?: AutoProactiveEngine;

  constructor(db: Database.Database, engine?: AutoProactiveEngine) {
    this.db = db;
    this.engine = engine;
  }

  /**
   * Register monitoring API routes
   */
  registerRoutes(app: express.Application) {
    // System status endpoint
    app.get('/api/system/status', (req: Request, res: Response) => {
      this.getSystemStatus(req, res);
    });

    // Loop statistics endpoint
    app.get('/api/loops/stats', (req: Request, res: Response) => {
      this.getLoopStats(req, res);
    });

    // Project statistics
    app.get('/api/projects/stats', (req: Request, res: Response) => {
      this.getProjectStats(req, res);
    });

    // Agent statistics
    app.get('/api/agents/stats', (req: Request, res: Response) => {
      this.getAgentStats(req, res);
    });

    // Task statistics
    app.get('/api/tasks/stats', (req: Request, res: Response) => {
      this.getTaskStats(req, res);
    });
  }

  /**
   * Get overall system status
   */
  private getSystemStatus(req: Request, res: Response) {
    try {
      // Get engine status if available
      let engineStatus = null;
      if (this.engine) {
        engineStatus = this.engine.getStatus();
      }

      // Get memory usage
      const memUsage = process.memoryUsage();

      // Get active loops count
      const activeLoops = engineStatus?.activeLoops || 0;

      // Get projects count
      const projectsCount = this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };

      // Get active agents
      const activeAgents = this.db.prepare(`
        SELECT agent_letter, project_id as projectName, last_heartbeat
        FROM agent_sessions
        WHERE status = 'ACTIVE'
        ORDER BY last_heartbeat DESC
      `).all();

      // Get tasks summary
      const tasksSummary = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) as completed
        FROM tasks
      `).get() as any;

      // Calculate system health (0-1)
      const systemHealth = this.calculateSystemHealth(activeLoops, memUsage);

      // Build response
      const status = {
        timestamp: new Date().toISOString(),
        system: {
          health: systemHealth,
          uptime: process.uptime(),
          memory: {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss
          },
          activeLoops,
          cpu: null // Would need external monitoring for real CPU
        },
        projects: {
          total: projectsCount.count,
          healthyPercent: 77 // Mock for now - would calculate from actual health scores
        },
        agents: {
          active: activeAgents,
          total: activeAgents.length
        },
        tasks: {
          total: tasksSummary.total || 0,
          pending: tasksSummary.pending || 0,
          in_progress: tasksSummary.in_progress || 0,
          completed: tasksSummary.completed || 0
        },
        engine: engineStatus
      };

      res.json(status);

    } catch (error) {
      console.error('Error getting system status:', error);
      res.status(500).json({
        error: 'Failed to get system status',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get loop execution statistics
   */
  private getLoopStats(req: Request, res: Response) {
    try {
      // Get stats for each loop from the last 10 minutes
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

      const stats: any = {};

      for (let i = 0; i < loopNames.length; i++) {
        const loopName = loopNames[i];
        const loopId = i === 3 ? 4 : i === 4 ? 5 : i === 5 ? 6 : i === 6 ? 7 : i === 7 ? 8 : i === 8 ? 9 : i; // Map indices

        const loopStats = this.db.prepare(`
          SELECT
            COUNT(*) as executionCount,
            AVG(execution_time_ms) as avgDuration,
            MAX(execution_time_ms) as maxDuration,
            MIN(execution_time_ms) as minDuration,
            MAX(timestamp) as lastExecution
          FROM auto_proactive_logs
          WHERE loop_name = ?
            AND timestamp > datetime('now', '-10 minutes')
        `).get(loopName) as any;

        stats[`loop${loopId}`] = {
          name: loopName,
          executionCount: loopStats.executionCount || 0,
          avgDuration: loopStats.avgDuration || 0,
          maxDuration: loopStats.maxDuration || 0,
          minDuration: loopStats.minDuration || 0,
          lastExecution: loopStats.lastExecution
        };
      }

      res.json(stats);

    } catch (error) {
      console.error('Error getting loop stats:', error);
      res.status(500).json({
        error: 'Failed to get loop stats',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get project statistics
   */
  private getProjectStats(req: Request, res: Response) {
    try {
      const stats = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN health_score >= 80 THEN 1 ELSE 0 END) as healthy,
          SUM(CASE WHEN health_score BETWEEN 50 AND 79 THEN 1 ELSE 0 END) as warning,
          SUM(CASE WHEN health_score < 50 THEN 1 ELSE 0 END) as critical,
          AVG(health_score) as avgHealthScore
        FROM projects
        WHERE health_score IS NOT NULL
      `).get() as any;

      res.json({
        total: stats.total || 0,
        healthy: stats.healthy || 0,
        warning: stats.warning || 0,
        critical: stats.critical || 0,
        avgHealthScore: stats.avgHealthScore || 0,
        healthyPercent: stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0
      });

    } catch (error) {
      console.error('Error getting project stats:', error);
      res.status(500).json({
        error: 'Failed to get project stats',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get agent statistics
   */
  private getAgentStats(req: Request, res: Response) {
    try {
      const agents = this.db.prepare(`
        SELECT
          agent_letter,
          agent_model,
          project_id,
          connected_at,
          last_heartbeat,
          status,
          tasks_claimed,
          tasks_completed
        FROM agent_sessions
        WHERE status = 'ACTIVE'
        ORDER BY last_heartbeat DESC
      `).all() as any[];

      const summary = this.db.prepare(`
        SELECT
          COUNT(DISTINCT agent_letter) as uniqueAgents,
          COUNT(*) as totalSessions,
          SUM(tasks_claimed) as totalClaimed,
          SUM(tasks_completed) as totalCompleted
        FROM agent_sessions
        WHERE status = 'ACTIVE'
      `).get() as any;

      res.json({
        active: agents,
        summary: {
          uniqueAgents: summary.uniqueAgents || 0,
          totalSessions: summary.totalSessions || 0,
          totalClaimed: summary.totalClaimed || 0,
          totalCompleted: summary.totalCompleted || 0
        }
      });

    } catch (error) {
      console.error('Error getting agent stats:', error);
      res.status(500).json({
        error: 'Failed to get agent stats',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get task statistics
   */
  private getTaskStats(req: Request, res: Response) {
    try {
      const stats = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'COMPLETE' THEN 1 ELSE 0 END) as completed,
          AVG(CASE WHEN actual_minutes IS NOT NULL THEN actual_minutes ELSE NULL END) as avgCompletionTime
        FROM tasks
      `).get() as any;

      // Get recent completions (last hour)
      const recentCompletions = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE status = 'COMPLETE'
          AND completed_at > datetime('now', '-1 hour')
      `).get() as any;

      res.json({
        total: stats.total || 0,
        pending: stats.pending || 0,
        in_progress: stats.in_progress || 0,
        completed: stats.completed || 0,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        avgCompletionTime: stats.avgCompletionTime || 0,
        recentCompletions: recentCompletions.count || 0
      });

    } catch (error) {
      console.error('Error getting task stats:', error);
      res.status(500).json({
        error: 'Failed to get task stats',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Calculate overall system health (0-1)
   */
  private calculateSystemHealth(activeLoops: number, memUsage: NodeJS.MemoryUsage): number {
    let health = 1.0;

    // Check loop health (expect 7-9 active loops)
    if (activeLoops < 7) {
      health *= 0.7;
    } else if (activeLoops < 9) {
      health *= 0.9;
    }

    // Check memory usage
    const memPercent = memUsage.heapUsed / memUsage.heapTotal;
    if (memPercent > 0.95) {
      health *= 0.5; // Critical memory
    } else if (memPercent > 0.85) {
      health *= 0.8; // High memory
    }

    // Check if database is accessible
    try {
      this.db.prepare('SELECT 1').get();
    } catch (error) {
      health *= 0.3; // Database issue
    }

    return health;
  }
}
