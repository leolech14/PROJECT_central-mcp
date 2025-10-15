#!/usr/bin/env npx tsx
/**
 * Start Auto Thread Save System
 * =============================
 *
 * Starts Central-MCP automatic thread preservation system.
 *
 * What it does:
 * 1. Monitors conversations for activity
 * 2. Creates periodic save tasks (every 30 minutes)
 * 3. Creates immediate save task when conversation ends
 * 4. Agents automatically claim and execute save tasks
 *
 * Usage:
 *   npx tsx scripts/start-auto-thread-save.ts [options]
 *
 * Options:
 *   --interval <minutes>   Save interval (default: 30)
 *   --idle <minutes>       Idle timeout for conversation end (default: 10)
 */

import * as path from 'path';
import { AutoThreadSaveSystem } from '../src/auto-tasks/ThreadSaveTaskCreator';

async function main() {
  const args = process.argv.slice(2);

  let saveIntervalMinutes = 30;
  let idleTimeoutMinutes = 10;

  // Parse options
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === '--interval') {
      saveIntervalMinutes = parseInt(args[i + 1]);
    } else if (args[i] === '--idle') {
      idleTimeoutMinutes = parseInt(args[i + 1]);
    }
  }

  const dbPath = path.join(__dirname, '../data/registry.db');

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🧵 CENTRAL-MCP AUTO THREAD SAVE SYSTEM                       ║
╚════════════════════════════════════════════════════════════════╝

🗄️  Database: ${dbPath}
📸 Save Interval: Every ${saveIntervalMinutes} minutes
⏱️  Idle Timeout: ${idleTimeoutMinutes} minutes
  `);

  const autoSave = new AutoThreadSaveSystem(dbPath, {
    saveIntervalMinutes,
    idleTimeoutMinutes
  });

  // Start the system
  autoSave.start();

  console.log(`
✅ Auto Thread Save System is NOW ACTIVE!

What happens now:
  1. ⏲️  Periodic tasks created every ${saveIntervalMinutes} minutes
  2. 🔔 Immediate task created when conversation ends
  3. 🤖 Agents automatically claim and execute save tasks
  4. 💾 All conversations preserved in Central-MCP database

Press Ctrl+C to stop...
  `);

  // Keep process running
  process.on('SIGINT', () => {
    console.log(`\n🛑 Stopping Auto Thread Save System...`);
    autoSave.stop();
    process.exit(0);
  });
}

main();
