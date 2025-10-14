/**
 * Real-Time Detection Monitoring API Route
 * =====================================
 *
 * High-performance API for real-time model detection monitoring.
 * Provides streaming updates, performance metrics, and system health status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { createOptimizedDetectionDB } from '../../central-mcp/src/database/OptimizedDetectionQueries.js';
import { getDetectionCache } from '../../central-mcp/src/performance/DetectionCache.js';

// Database path
const DB_PATH = join(process.cwd(), '../../central-mcp/data/registry.db');

interface MonitoringRequest {
  timeRange: '1h' | '6h' | '24h' | '7d';
  metrics: 'all' | 'performance' | 'accuracy' | 'health';
  refreshInterval?: number;
}

interface MonitoringResponse {
  timestamp: string;
  timeRange: string;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    activeAgents: number;
    lastDetection: string;
  };
  performance: {
    avgDetectionTime: number;
    detectionsPerMinute: number;
    cacheHitRate: number;
    databasePerformance: any;
  };
  accuracy: {
    overallAccuracy: number;
    recentDetections: number;
    correctionsApplied: number;
    topModels: Array<{
      model: string;
      count: number;
      accuracy: number;
    }>;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    details?: any;
  }>;
}

// SSE connection management
const activeConnections = new Set<ReadableStreamDefaultController>();
const MAX_CONNECTIONS = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = (searchParams.get('range') || '24h') as MonitoringRequest['timeRange'];
  const metrics = (searchParams.get('metrics') || 'all') as MonitoringRequest['metrics'];
  const stream = searchParams.get('stream') === 'true';

  if (stream) {
    // Handle Server-Sent Events for real-time updates
    return handleSSEStream(timeRange, metrics);
  } else {
    // Handle one-time monitoring request
    return handleMonitoringRequest(timeRange, metrics);
  }
}

/**
 * Handle Server-Sent Events for real-time monitoring
 */
function handleSSEStream(timeRange: string, metrics: string): Response {
  if (activeConnections.size >= MAX_CONNECTIONS) {
    return new Response('Too many connections', { status: 429 });
  }

  const stream = new ReadableStream({
    start(controller) {
      activeConnections.add(controller);

      // Send initial data
      const interval = setInterval(async () => {
        try {
          const data = await gatherMonitoringData(timeRange as MonitoringRequest['timeRange'], metrics as MonitoringRequest['metrics']);
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.error('Error in SSE stream:', error);
          controller.enqueue(`data: ${JSON.stringify({ error: 'Monitoring data unavailable' })}\n\n`);
        }
      }, 5000); // Update every 5 seconds

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        activeConnections.delete(controller);
      });
    },

    cancel() {
      activeConnections.forEach(controller => {
        try {
          controller.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      activeConnections.clear();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

/**
 * Handle one-time monitoring request
 */
async function handleMonitoringRequest(timeRange: string, metrics: string): Promise<NextResponse> {
  try {
    const data = await gatherMonitoringData(
      timeRange as MonitoringRequest['timeRange'],
      metrics as MonitoringRequest['metrics']
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Gather comprehensive monitoring data
 */
async function gatherMonitoringData(
  timeRange: MonitoringRequest['timeRange'],
  metrics: MonitoringRequest['metrics']
): Promise<MonitoringResponse> {
  const db = createOptimizedDetectionDB(DB_PATH);
  const cache = getDetectionCache();

  try {
    const timeFilter = getTimeFilter(timeRange);
    const now = new Date().toISOString();

    // Get system health
    const systemHealth = await getSystemHealth(db, timeFilter);

    // Get performance metrics
    const performance = metrics === 'all' || metrics === 'performance'
      ? await getPerformanceMetrics(db, cache, timeFilter)
      : undefined;

    // Get accuracy metrics
    const accuracy = metrics === 'all' || metrics === 'accuracy'
      ? await getAccuracyMetrics(db, timeFilter)
      : undefined;

    // Generate alerts
    const alerts = await generateAlerts(db, cache, systemHealth, performance, accuracy);

    return {
      timestamp: now,
      timeRange,
      systemHealth,
      performance: performance || {
        avgDetectionTime: 0,
        detectionsPerMinute: 0,
        cacheHitRate: 0,
        databasePerformance: {}
      },
      accuracy: accuracy || {
        overallAccuracy: 0,
        recentDetections: 0,
        correctionsApplied: 0,
        topModels: []
      },
      alerts
    };
  } finally {
    db.close();
  }
}

/**
 * Get system health metrics
 */
async function getSystemHealth(db: any, timeFilter: string): Promise<MonitoringResponse['systemHealth']> {
  // Get recent detection count
  const recentCount = db.prepare(`
    SELECT COUNT(*) as count FROM enhanced_model_detections
    WHERE timestamp > ${timeFilter}
  `).get() as { count: number };

  // Get active agents
  const activeAgents = db.prepare(`
    SELECT COUNT(DISTINCT agent_letter) as count FROM agent_sessions
    WHERE status = 'ACTIVE' AND connected_at > ${timeFilter}
  `).get() as { count: number };

  // Get last detection time
  const lastDetection = db.prepare(`
    SELECT MAX(timestamp) as last_detection FROM enhanced_model_detections
  `).get() as { last_detection: string };

  // Determine system health status
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
  const now = Date.now();
  const lastDetectionTime = lastDetection?.last_detection ? new Date(lastDetection.last_detection).getTime() : 0;
  const timeSinceLastDetection = now - lastDetectionTime;

  if (timeSinceLastDetection > 1800000) { // 30 minutes
    status = 'critical';
  } else if (timeSinceLastDetection > 600000) { // 10 minutes
    status = 'degraded';
  }

  // Calculate uptime (mock - would use actual process start time)
  const uptime = process.uptime();

  return {
    status,
    uptime: Math.floor(uptime),
    activeAgents: activeAgents?.count || 0,
    lastDetection: lastDetection?.last_detection || 'Never'
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(db: any, cache: any, timeFilter: string): Promise<MonitoringResponse['performance']> {
  // Get average detection time
  const avgTimeQuery = db.prepare(`
    SELECT AVG(execution_time_ms) as avg_time FROM enhanced_model_detections
    WHERE timestamp > ${timeFilter} AND execution_time_ms IS NOT NULL
  `).get() as { avg_time: number };

  // Get detections per minute
  const totalDetections = db.prepare(`
    SELECT COUNT(*) as count FROM enhanced_model_detections
    WHERE timestamp > ${timeFilter}
  `).get() as { count: number };

  const timeRanges = {
    '1h': 60,
    '6h': 360,
    '24h': 1440,
    '7d': 10080
  };

  const detectionsPerMinute = totalDetections?.count / (timeRanges[timeRange] || 1440);

  // Get cache statistics
  const cacheStats = cache.getStats();
  const cacheHitRate = cacheStats.hitRate;

  // Get database performance metrics
  const dbPerformance = db.getSystemPerformanceStats();

  return {
    avgDetectionTime: Math.round((avgTimeQuery?.avg_time || 0) * 100) / 100,
    detectionsPerMinute: Math.round(detectionsPerMinute * 100) / 100,
    cacheHitRate: Math.round(cacheHitRate * 100 * 100) / 100,
    databasePerformance: dbPerformance
  };
}

/**
 * Get accuracy metrics
 */
async function getAccuracyMetrics(db: any, timeFilter: string): Promise<MonitoringResponse['accuracy']> {
  // Get overall accuracy
  const accuracyQuery = db.prepare(`
    SELECT
      AVG(CASE WHEN verified = 1 THEN 1.0 ELSE 0.0 END) as accuracy,
      COUNT(*) as total,
      SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified
    FROM enhanced_model_detections
    WHERE timestamp > ${timeFilter}
  `).get() as { accuracy: number; total: number; verified: number };

  // Get corrections applied
  const correctionsQuery = db.prepare(`
    SELECT COUNT(*) as corrections FROM detection_corrections
    WHERE correction_applied = 1 AND timestamp > ${timeFilter}
  `).get() as { corrections: number };

  // Get top models
  const topModelsQuery = db.prepare(`
    SELECT
      detected_model as model,
      COUNT(*) as count,
      AVG(CASE WHEN verified = 1 THEN 1.0 ELSE 0.0 END) as accuracy
    FROM enhanced_model_detections
    WHERE timestamp > ${timeFilter}
    GROUP BY detected_model
    ORDER BY count DESC
    LIMIT 5
  `).all() as Array<{ model: string; count: number; accuracy: number }>;

  return {
    overallAccuracy: Math.round((accuracyQuery?.accuracy || 0) * 100 * 100) / 100,
    recentDetections: accuracyQuery?.total || 0,
    correctionsApplied: correctionsQuery?.corrections || 0,
    topModels: topModelsQuery.map(m => ({
      model: m.model,
      count: m.count,
      accuracy: Math.round(m.accuracy * 100 * 100) / 100
    }))
  };
}

/**
 * Generate system alerts
 */
async function generateAlerts(
  db: any,
  cache: any,
  systemHealth: MonitoringResponse['systemHealth'],
  performance?: MonitoringResponse['performance'],
  accuracy?: MonitoringResponse['accuracy']
): Promise<MonitoringResponse['alerts']> {
  const alerts: MonitoringResponse['alerts'] = [];
  const now = new Date().toISOString();

  // System health alerts
  if (systemHealth.status === 'critical') {
    alerts.push({
      level: 'error',
      message: 'System critical: No detections in over 30 minutes',
      timestamp: now,
      details: { lastDetection: systemHealth.lastDetection }
    });
  } else if (systemHealth.status === 'degraded') {
    alerts.push({
      level: 'warning',
      message: 'System degraded: No detections in over 10 minutes',
      timestamp: now,
      details: { lastDetection: systemHealth.lastDetection }
    });
  }

  // Performance alerts
  if (performance) {
    if (performance.avgDetectionTime > 1000) {
      alerts.push({
        level: 'warning',
        message: 'High detection latency detected',
        timestamp: now,
        details: { avgDetectionTime: performance.avgDetectionTime }
      });
    }

    if (performance.cacheHitRate < 0.5) {
      alerts.push({
        level: 'info',
        message: 'Low cache hit rate - consider warming up cache',
        timestamp: now,
        details: { cacheHitRate: performance.cacheHitRate }
      });
    }
  }

  // Accuracy alerts
  if (accuracy) {
    if (accuracy.overallAccuracy < 0.8 && accuracy.recentDetections > 10) {
      alerts.push({
        level: 'warning',
        message: 'Detection accuracy below optimal threshold',
        timestamp: now,
        details: { accuracy: accuracy.overallAccuracy }
      });
    }

    if (accuracy.correctionsApplied > accuracy.recentDetections * 0.3) {
      alerts.push({
        level: 'info',
        message: 'High correction rate - detection patterns may need review',
        timestamp: now,
        details: {
          corrections: accuracy.correctionsApplied,
          total: accuracy.recentDetections,
          rate: Math.round((accuracy.correctionsApplied / accuracy.recentDetections) * 100 * 100) / 100
        }
      });
    }
  }

  return alerts;
}

/**
 * Get time filter SQL string
 */
function getTimeFilter(timeRange: string): string {
  switch (timeRange) {
    case '1h':
      return "datetime('now', '-1 hour')";
    case '6h':
      return "datetime('now', '-6 hours')";
    case '24h':
      return "datetime('now', '-1 day')";
    case '7d':
      return "datetime('now', '-7 days')";
    default:
      return "datetime('now', '-1 day')";
  }
}

/**
 * POST endpoint for manual cache warmup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'warmup_cache') {
      const cache = getDetectionCache();

      // Preload common patterns (mock implementation)
      const preloadData = [
        {
          key: 'detection:common_pattern_1',
          data: { model: 'gpt-4', confidence: 0.9 },
          ttl: 600000
        },
        {
          key: 'detection:common_pattern_2',
          data: { model: 'claude-3', confidence: 0.85 },
          ttl: 600000
        }
      ];

      cache.warmUp(preloadData);

      return NextResponse.json({
        success: true,
        message: 'Cache warmed up successfully',
        cacheStats: cache.getStats()
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: (error as Error).message },
      { status: 500 }
    );
  }
}