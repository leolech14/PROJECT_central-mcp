/**
 * RunPod API Endpoints
 *
 * Provides HTTP API for accessing RunPod infrastructure data:
 * - /api/runpod/status - Current pod status and costs
 * - /api/runpod/history - Cost history for charts
 * - /api/runpod/alerts - Recent cost alerts
 * - /api/runpod/control/:podId/:action - Start/stop/restart pods
 */

import * as express from 'express';
import { getRunPodStatus, controlPod } from '../tools/runpod/runpodIntegration.js';
import { RunPodMonitorLoop } from '../auto-proactive/RunPodMonitorLoop.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/runpod/status
 * Returns current RunPod infrastructure status
 */
router.get('/status', async (req, res) => {
  try {
    logger.info('[API] Getting RunPod status...');
    const status = await getRunPodStatus();
    res.json(status);
  } catch (error) {
    logger.error('[API] RunPod status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/runpod/history?hours=24
 * Returns cost history for charts
 */
router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const history = RunPodMonitorLoop.getCostHistory(hours);

    res.json({
      success: true,
      history,
      hours
    });
  } catch (error) {
    logger.error('[API] RunPod history error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/runpod/alerts?limit=10
 * Returns recent cost alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const alerts = RunPodMonitorLoop.getRecentAlerts(limit);

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    logger.error('[API] RunPod alerts error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/runpod/control/:podId/:action
 * Controls a RunPod pod (start/stop/restart)
 */
router.post('/control/:podId/:action', async (req, res) => {
  try {
    const { podId, action } = req.params;

    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: start, stop, or restart'
      });
    }

    logger.info(`[API] Controlling pod ${podId}: ${action}`);
    const result = await controlPod(podId, action as 'start' | 'stop' | 'restart');

    res.json(result);
  } catch (error) {
    logger.error('[API] RunPod control error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/runpod/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'RunPod API',
    timestamp: new Date().toISOString()
  });
});

export default router;
