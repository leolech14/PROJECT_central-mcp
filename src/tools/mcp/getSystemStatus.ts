
import { AutoProactiveEngine, AutoProactiveConfig } from '../../auto-proactive/AutoProactiveEngine.js';
import IntegratedTaskStore from '../../registry/JsonTaskStore.js';
import Database from 'better-sqlite3';

// Mock config for status reporting
const config: AutoProactiveConfig = {
  enableLoop0: false,  // Don't actually run loops for status check
  enableLoop1: false,
  enableLoop2: false,
  enableLoop4: false,
  enableLoop5: false,
  enableLoop9: false,
  enableLoop10: false,
  enableLoop6: false,
  enableLoop7: false,
  enableLoop8: false,
  dbPath: './data/registry.db',
  criticalPaths: ['./data'],
  projectScanPaths: ['/Users/lech/PROJECTS_all'],
  loop0Interval: 5,
  loop1Interval: 60,
  loop2Interval: 60,
  loop4Interval: 30,
  loop5Interval: 300,
  loop9Interval: 60,
  loop10Interval: 60,
  loop6Interval: 900,
  loop7Interval: 600,
  loop8Interval: 120,
};

export async function getSystemStatus(db: Database.Database): Promise<any> {
  const engine = new AutoProactiveEngine(db, config);
  const engineStatus = engine.getStatus();

  // Use integrated task store for enhanced status reporting
  const taskStore = new IntegratedTaskStore(config.dbPath);
  await taskStore.initialize();

  // Get comprehensive task information
  const tasks = await taskStore.getAllTasks();
  const taskStats = await taskStore.getTaskStats();

  const agentPresence = db.prepare('SELECT * FROM agent_presence').all();

  // Get enhanced registry metrics
  const registryMetrics = await taskStore.getRegistryMetrics();

  await taskStore.close();

  return {
    engineStatus,
    tasks: {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === 'PENDING').length,
      in_progress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t: any) => t.status === 'COMPLETE').length,
      available: tasks.filter((t: any) => t.status === 'AVAILABLE').length,
      blocked: tasks.filter((t: any) => t.status === 'BLOCKED').length,
    },
    agents: agentPresence,
    registryMetrics,
    taskStats,
  };
}
