/**
 * QUICK PATCH: Add HTTP API endpoint to existing server
 * ======================================================
 *
 * This adds POST /api/agents/connect endpoint
 * So ANY agent (GLM, GPT, etc.) can connect via simple HTTP!
 */

import express from 'express';
import Database from 'better-sqlite3';

const app = express();
app.use(express.json());

const db = new Database('./data/registry.db');

// SEAMLESS AGENT CONNECTION ENDPOINT
app.post('/api/agents/connect', async (req, res) => {
  try {
    console.log('🔗 Agent connection request received');

    // Minimal auto-detection
    const agent = req.body.agent || 'A';
    const model = req.body.model || 'glm-4-6';
    const project = req.body.project || 'PROJECT_central-mcp';

    // Create session
    const sessionId = `sess_${Date.now()}`;

    db.prepare(`
      INSERT INTO agent_sessions (
        id, agent_letter, agent_model, project_id,
        connected_at, last_heartbeat, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      agent,
      model,
      project,
      new Date().toISOString(),
      new Date().toISOString(),
      'ACTIVE'
    );

    // Get project overview
    const taskStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks WHERE project_id = ?
    `).get(project) as any;

    const completion = taskStats?.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

    // Get agent's tasks
    const myTasks = db.prepare(`
      SELECT id, title, status, priority
      FROM tasks
      WHERE agent = ? AND project_id = ?
      AND status = 'pending'
      LIMIT 5
    `).all(agent, project);

    // RESPONSE
    res.json({
      success: true,
      sessionId,
      message: `✅ Welcome Agent ${agent}!`,

      projectStatus: {
        name: project,
        completion: `${completion}%`,
        totalTasks: taskStats?.total || 0,
        completed: taskStats?.completed || 0
      },

      yourTasks: myTasks,

      guidance: `You're Agent ${agent} working on ${project} (${completion}% complete). ${myTasks.length > 0 ? `Start with: ${(myTasks[0] as any).id}` : 'Stand by for auto-assignment.'}`,

      nextSteps: [
        'Read project specs in 02_SPECBASES/',
        'Check your tasks above',
        'Start working on highest priority',
        'Use agent_heartbeat to stay connected'
      ]
    });

  } catch (error: any) {
    console.error('❌ Connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server on port 3000 (if not already running)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Agent Connection API running on port ${PORT}`);
    console.log(`📍 Endpoint: POST http://localhost:${PORT}/api/agents/connect`);
  });
}

export { app };
