/**
 * Thread Save Task Creator - Automates Thread Preservation
 * ========================================================
 *
 * Central-MCP automatically creates tasks for agents to save threads:
 * 1. Detects conversation end (or periodic intervals)
 * 2. Creates "Save Thread" task in task registry
 * 3. Assigns to available agent (any agent can do this)
 * 4. Agent exports conversation
 * 5. Agent imports to Central-MCP database
 * 6. Thread preserved forever!
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

interface ThreadSaveTask {
  id: string;
  description: string;
  agent_assigned?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  conversation_context: string;
  created_at: string;
  auto_created: boolean;
}

export class ThreadSaveTaskCreator {
  private db: Database.Database;
  private saveInterval: number; // Minutes between auto-saves

  constructor(dbPath: string, saveInterval: number = 30) {
    this.db = new Database(dbPath);
    this.saveInterval = saveInterval;
  }

  /**
   * Create automatic thread save task
   */
  createThreadSaveTask(conversationContext?: string): ThreadSaveTask {
    const taskId = `T_SAVE_${Date.now()}`;

    const task: ThreadSaveTask = {
      id: taskId,
      description: 'AUTO: Save current conversation thread to Central-MCP',
      priority: 'high',
      conversation_context: conversationContext || 'Current active conversation',
      created_at: new Date().toISOString(),
      auto_created: true
    };

    // Insert into tasks table
    const insertTask = this.db.prepare(`
      INSERT INTO tasks (
        id,
        title,
        description,
        status,
        priority,
        project,
        created_at,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      task.id,
      'Save Conversation Thread',
      task.description,
      'available', // Available for any agent to claim
      task.priority,
      'central-mcp', // Central-MCP project
      task.created_at,
      JSON.stringify({
        auto_created: true,
        task_type: 'thread_save',
        conversation_context: task.conversation_context
      })
    );

    console.log(`✅ Auto-task created: ${task.id} - Save conversation thread`);

    return task;
  }

  /**
   * Start automatic thread save scheduler
   */
  startAutoSave(): void {
    console.log(`🔄 Thread auto-save started (every ${this.saveInterval} minutes)`);

    setInterval(() => {
      // Create periodic save task
      this.createThreadSaveTask('Periodic auto-save checkpoint');
      console.log(`📸 Periodic thread save task created`);
    }, this.saveInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  /**
   * Create immediate save task (triggered by conversation end)
   */
  createImmediateSaveTask(): ThreadSaveTask {
    console.log(`🔔 Conversation ending - creating immediate save task`);
    return this.createThreadSaveTask('Conversation end - final save');
  }

  /**
   * Check if thread save task exists for current conversation
   */
  hasPendingSaveTask(): boolean {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE metadata LIKE '%"task_type":"thread_save"%'
        AND status IN ('available', 'claimed')
    `).get() as { count: number };

    return result.count > 0;
  }

  /**
   * Get thread save task instructions for agent
   */
  getSaveTaskInstructions(taskId: string): string {
    return `
# Thread Save Task: ${taskId}

## Objective
Save the current Claude Code conversation to Central-MCP database for permanent preservation.

## Steps to Complete

1. **Export Conversation:**
   \`\`\`bash
   # Use Claude Code export command (ctrl+shift+e)
   # OR use /export command
   # This will create a markdown file with full conversation
   \`\`\`

2. **Import to Central-MCP:**
   \`\`\`bash
   npx tsx scripts/save-thread-to-central-mcp.ts <exported-file.md>
   \`\`\`

3. **Verify Import:**
   \`\`\`bash
   sqlite3 data/registry.db "SELECT COUNT(*) FROM messages WHERE conversation_id = '<new-conv-id>';"
   \`\`\`

4. **Mark Task Complete:**
   \`\`\`typescript
   await centralMCP.completeTask('${taskId}', {
     conversation_id: '<new-conv-id>',
     messages_saved: <count>,
     files_tracked: <count>,
     ideas_captured: <count>
   });
   \`\`\`

## Success Criteria

- ✅ Conversation exported to markdown
- ✅ Imported into Central-MCP database
- ✅ All messages preserved
- ✅ All file actions tracked
- ✅ All ideas captured
- ✅ Verification query successful

## Auto-Task Information

- **Created**: ${new Date().toISOString()}
- **Priority**: HIGH
- **Auto-Generated**: Yes
- **Task Type**: Thread Save

**🎯 This ensures we NEVER LOSE any conversation, idea, file, or output!**
`;
  }
}

/**
 * Conversation End Detector - Detects when conversation is ending
 */
export class ConversationEndDetector {
  private idleTimeoutMs: number;
  private lastActivityTime: number;
  private timeoutHandle?: NodeJS.Timeout;
  private onConversationEnd: () => void;

  constructor(idleTimeoutMinutes: number, onConversationEnd: () => void) {
    this.idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
    this.lastActivityTime = Date.now();
    this.onConversationEnd = onConversationEnd;
    this.startMonitoring();
  }

  /**
   * Register activity (message sent/received)
   */
  registerActivity(): void {
    this.lastActivityTime = Date.now();
    this.resetTimeout();
  }

  /**
   * Start monitoring for conversation end
   */
  private startMonitoring(): void {
    this.resetTimeout();
  }

  /**
   * Reset idle timeout
   */
  private resetTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }

    this.timeoutHandle = setTimeout(() => {
      console.log(`🔔 Conversation appears to have ended (no activity for ${this.idleTimeoutMs / 60000} minutes)`);
      this.onConversationEnd();
    }, this.idleTimeoutMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
  }
}

/**
 * Integrated Thread Save System
 */
export class AutoThreadSaveSystem {
  private taskCreator: ThreadSaveTaskCreator;
  private endDetector: ConversationEndDetector;

  constructor(dbPath: string, options?: {
    saveIntervalMinutes?: number;
    idleTimeoutMinutes?: number;
  }) {
    this.taskCreator = new ThreadSaveTaskCreator(dbPath, options?.saveIntervalMinutes || 30);

    this.endDetector = new ConversationEndDetector(
      options?.idleTimeoutMinutes || 10,
      () => this.handleConversationEnd()
    );
  }

  /**
   * Start the auto-save system
   */
  start(): void {
    console.log(`🚀 Auto Thread Save System started`);

    // Start periodic auto-save
    this.taskCreator.startAutoSave();

    console.log(`✅ System monitoring conversations...`);
  }

  /**
   * Register activity (call this on every message)
   */
  activity(): void {
    this.endDetector.registerActivity();
  }

  /**
   * Handle conversation end
   */
  private handleConversationEnd(): void {
    // Create immediate save task
    const task = this.taskCreator.createImmediateSaveTask();

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🔔 CONVERSATION ENDING - AUTO-SAVE TASK CREATED               ║
╚════════════════════════════════════════════════════════════════╝

✅ Task ID: ${task.id}
📝 Description: ${task.description}
🎯 Priority: ${task.priority}

An agent will claim this task and save the conversation to Central-MCP!

Your ideas, files, and outputs will be preserved forever! 🎊
`);
  }

  /**
   * Stop the auto-save system
   */
  stop(): void {
    this.endDetector.stop();
    console.log(`🛑 Auto Thread Save System stopped`);
  }
}
