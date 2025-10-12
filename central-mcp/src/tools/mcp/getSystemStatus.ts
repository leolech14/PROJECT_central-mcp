
import { AutoProactiveEngine, AutoProactiveConfig } from '../../auto-proactive/AutoProactiveEngine.js';
import { TaskRegistry } from '../../registry/TaskRegistry.js';
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

  // TaskRegistry expects a dbPath string, not a Database instance
  // We'll create a new instance and access its store
  const taskRegistry = new TaskRegistry(config.dbPath);
  const taskStore = (taskRegistry as any).store; // Access private store
  const tasks = taskStore.getAllTasks();

  const agentPresence = db.prepare('SELECT * FROM agent_presence').all();

  return {
    engineStatus,
    tasks: {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === 'PENDING').length,
      in_progress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t: any) => t.status === 'COMPLETE').length,
    },
    agents: agentPresence,
  };
}
