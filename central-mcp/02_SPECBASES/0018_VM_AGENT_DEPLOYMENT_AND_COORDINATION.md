# 🚀 VM AGENT DEPLOYMENT AND COORDINATION SYSTEM

**Document ID**: 0018_VM_AGENT_DEPLOYMENT_AND_COORDINATION
**Classification**: CRITICAL INFRASTRUCTURE
**Status**: READY FOR IMPLEMENTATION
**Date**: October 12, 2025
**Priority**: P0-CRITICAL (Deployment Blocker)

---

## 🎯 EXECUTIVE SUMMARY

### The Vision

Deploy 4 autonomous AI agents to VM terminal sessions (GCP 34.41.115.199) that work in parallel, coordinated by Central-MCP's 9 auto-proactive loops, to achieve unprecedented development velocity.

### The Revolution

```
TRADITIONAL DEVELOPMENT:
User → Manual coding → Manual testing → Manual deployment
Bottleneck: Human at every step
Result: 100 hours for full-stack application

VM AGENT DEPLOYMENT:
User input → Central-MCP loops coordinate 4 VM agents → Parallel implementation → Auto-validation → Deployment
Bottleneck: NONE (agents work simultaneously)
Result: 5 hours human oversight, 20 hours LLM parallel execution
TIME SAVINGS: 95%!
```

### Agent Configuration

| Agent | Model | Role | Terminal | Capabilities |
|-------|-------|------|----------|--------------|
| **Agent A** | Claude Sonnet 4.5 | Primary Coordinator | Terminal 1 | Coordination, P0-CRITICAL tasks, dependency management, system health |
| **Agent B** | Claude Sonnet 4.5 | Architecture & Design | Terminal 2 | Architecture, specs, integration, complex problem solving |
| **Agent C** | GLM 4.6 | Backend Specialist | Terminal 3 | Backend APIs, database, performance, server-side logic |
| **Agent D** | GLM 4.6 | UI Specialist | Terminal 4 | Frontend components, dashboards, UI design, visual systems |

---

## 📋 SPECIFICATION OVERVIEW

### Core Requirements

**MUST HAVE (P0-CRITICAL)**:
1. ✅ 4 persistent terminal sessions on VM
2. ✅ Agent-to-loop communication via event bus
3. ✅ Loop-to-agent message delivery system
4. ✅ Task claiming and progress reporting
5. ✅ Coordination protocol to prevent conflicts
6. ✅ Health monitoring with auto-recovery
7. ✅ Real-time dashboard integration

**SHOULD HAVE (P1-HIGH)**:
1. ✅ Performance metrics and analytics
2. ✅ Optimization engine for task routing
3. ✅ Alert system for critical events
4. ✅ Agent capability-based assignment

**COULD HAVE (P2-MEDIUM)**:
1. Agent skill learning from task history
2. Predictive task estimation
3. Cross-project agent sharing
4. Agent swarm scaling (add more agents dynamically)

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     GCP VM (34.41.115.199)                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              CENTRAL-MCP AUTO-PROACTIVE ENGINE              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  Loop 0: System Status (5s)     ──────┐                     │ │
│  │  Loop 1: Agent Discovery (60s)  ──────┤                     │ │
│  │  Loop 2: Project Discovery (60s) ─────┤                     │ │
│  │  Loop 4: Progress Monitor (30s)  ─────┤                     │ │
│  │  Loop 5: Status Analysis (5m)    ─────┤  EVENT BUS          │ │
│  │  Loop 6: Opportunity Scan (15m)  ─────┤  (Pub/Sub)          │ │
│  │  Loop 7: Spec Generation (10m)   ─────┤                     │ │
│  │  Loop 8: Task Assignment (2m)    ─────┤                     │ │
│  │  Loop 9: Git Monitor (60s)       ──────┘                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            ↓ ↑                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              LOOP-AGENT COMMUNICATION BUS                   │ │
│  │  - Event-driven message delivery                            │ │
│  │  - Priority queue (P0-CRITICAL first)                       │ │
│  │  - Retry logic with exponential backoff                     │ │
│  │  - Message persistence in registry.db                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            ↓ ↑                                    │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │ Terminal 1   │ Terminal 2   │ Terminal 3   │ Terminal 4   │  │
│  │ tmux:agent-a │ tmux:agent-b │ tmux:agent-c │ tmux:agent-d │  │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤  │
│  │ Agent A      │ Agent B      │ Agent C      │ Agent D      │  │
│  │ Sonnet 4.5   │ Sonnet 4.5   │ GLM 4.6      │ GLM 4.6      │  │
│  │              │              │              │              │  │
│  │ Coordinator  │ Architecture │ Backend      │ UI           │  │
│  │ P0-Critical  │ Design       │ APIs         │ Frontend     │  │
│  │ Dependencies │ Integration  │ Database     │ Dashboard    │  │
│  │ Health Check │ Specs        │ Performance  │ Components   │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                            ↓ ↑                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              CENTRAL-MCP REGISTRY DATABASE                  │ │
│  │  - agent_inbox (messages to agents)                         │ │
│  │  - agent_outbox (messages from agents)                      │ │
│  │  - agent_sessions (active agent tracking)                   │ │
│  │  - tasks (task registry with assignments)                   │ │
│  │  - agent_performance (metrics and analytics)                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌───────────────────────────────────────────────────────────────────┐
│           CENTRAL-MCP DASHBOARD (localhost:3003)                  │
│  - Real-time agent status visualization                           │
│  - Task assignment progress                                       │
│  - Performance metrics per agent                                  │
│  - System health overview                                         │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENT SPECIFICATIONS

### 1. VM Terminal Infrastructure

**Requirement**: 4 persistent, isolated terminal sessions on VM.

**Technical Implementation**:

```bash
# tmux session configuration
# File: /scripts/setup-agent-terminals.sh

#!/bin/bash
# Setup 4 tmux sessions for agent terminals

# Session 1: Agent A (Coordinator)
tmux new-session -d -s agent-a
tmux send-keys -t agent-a "cd /home/lech/central-mcp" C-m
tmux send-keys -t agent-a "export AGENT_LETTER=A" C-m
tmux send-keys -t agent-a "export AGENT_MODEL=claude-sonnet-4-5" C-m
tmux send-keys -t agent-a "export AGENT_ROLE=coordinator" C-m

# Session 2: Agent B (Architecture)
tmux new-session -d -s agent-b
tmux send-keys -t agent-b "cd /home/lech/central-mcp" C-m
tmux send-keys -t agent-b "export AGENT_LETTER=B" C-m
tmux send-keys -t agent-b "export AGENT_MODEL=claude-sonnet-4-5" C-m
tmux send-keys -t agent-b "export AGENT_ROLE=architecture" C-m

# Session 3: Agent C (Backend)
tmux new-session -d -s agent-c
tmux send-keys -t agent-c "cd /home/lech/central-mcp" C-m
tmux send-keys -t agent-c "export AGENT_LETTER=C" C-m
tmux send-keys -t agent-c "export AGENT_MODEL=glm-4-6" C-m
tmux send-keys -t agent-c "export AGENT_ROLE=backend" C-m

# Session 4: Agent D (UI)
tmux new-session -d -s agent-d
tmux send-keys -t agent-d "cd /home/lech/central-mcp" C-m
tmux send-keys -t agent-d "export AGENT_LETTER=D" C-m
tmux send-keys -t agent-d "export AGENT_MODEL=glm-4-6" C-m
tmux send-keys -t agent-d "export AGENT_ROLE=ui" C-m

echo "✅ 4 agent terminal sessions created"
tmux list-sessions
```

**Validation Criteria**:
- [ ] 4 named tmux sessions running
- [ ] Each session has unique environment variables
- [ ] Sessions persist after SSH disconnection
- [ ] Each session accessible via `tmux attach -t agent-X`

---

### 2. Loop-to-Agent Communication Bus

**Requirement**: Event-driven message delivery from Central-MCP loops to VM agents.

**Technical Implementation**:

```typescript
// File: /src/events/LoopAgentBus.ts

import { EventEmitter } from 'events';
import Database from 'better-sqlite3';

interface AgentMessage {
  id: string;
  agentLetter: 'A' | 'B' | 'C' | 'D';
  sourceLoop: string; // 'loop_0', 'loop_1', etc.
  priority: 'P0-CRITICAL' | 'P1-HIGH' | 'P2-MEDIUM' | 'P3-LOW';
  messageType: string; // 'TASK_ASSIGNED', 'SPEC_READY', 'BLOCKER_DETECTED', etc.
  payload: any;
  createdAt: Date;
}

export class LoopAgentBus extends EventEmitter {
  private db: Database.Database;
  private priorityQueue: Map<string, AgentMessage[]>;

  constructor(dbPath: string) {
    super();
    this.db = new Database(dbPath);
    this.priorityQueue = new Map();
    this.initializeSchema();
    this.startMessageProcessor();
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_inbox (
        id TEXT PRIMARY KEY,
        agent_letter TEXT NOT NULL,
        source_loop TEXT NOT NULL,
        priority TEXT NOT NULL,
        message_type TEXT NOT NULL,
        payload JSON NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_inbox_agent
        ON agent_inbox(agent_letter, is_read);
      CREATE INDEX IF NOT EXISTS idx_inbox_priority
        ON agent_inbox(priority, created_at);
    `);
  }

  /**
   * Send message from loop to agent
   */
  sendToAgent(message: AgentMessage): void {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert into database
    this.db.prepare(`
      INSERT INTO agent_inbox (id, agent_letter, source_loop, priority, message_type, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      messageId,
      message.agentLetter,
      message.sourceLoop,
      message.priority,
      message.messageType,
      JSON.stringify(message.payload)
    );

    // Add to priority queue for immediate delivery
    this.addToQueue(message.agentLetter, { ...message, id: messageId });

    // Emit event for real-time processing
    this.emit(`agent:${message.agentLetter}:message`, message);

    console.log(`📨 Message sent to Agent ${message.agentLetter} from ${message.sourceLoop}: ${message.messageType}`);
  }

  /**
   * Send message from agent to loop
   */
  sendToLoop(agentLetter: string, targetLoop: string, messageType: string, payload: any): void {
    const messageId = `loop_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.db.prepare(`
      INSERT INTO agent_outbox (id, agent_letter, target_loop, message_type, payload, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(
      messageId,
      agentLetter,
      targetLoop,
      messageType,
      JSON.stringify(payload)
    );

    // Emit event to target loop
    this.emit(`loop:${targetLoop}:message`, {
      id: messageId,
      agentLetter,
      messageType,
      payload
    });

    console.log(`📨 Message sent from Agent ${agentLetter} to ${targetLoop}: ${messageType}`);
  }

  /**
   * Get unread messages for agent (priority sorted)
   */
  getAgentInbox(agentLetter: string): AgentMessage[] {
    const messages = this.db.prepare(`
      SELECT * FROM agent_inbox
      WHERE agent_letter = ? AND is_read = false
      ORDER BY
        CASE priority
          WHEN 'P0-CRITICAL' THEN 0
          WHEN 'P1-HIGH' THEN 1
          WHEN 'P2-MEDIUM' THEN 2
          WHEN 'P3-LOW' THEN 3
        END,
        created_at ASC
    `).all(agentLetter) as any[];

    return messages.map(msg => ({
      id: msg.id,
      agentLetter: msg.agent_letter,
      sourceLoop: msg.source_loop,
      priority: msg.priority,
      messageType: msg.message_type,
      payload: JSON.parse(msg.payload),
      createdAt: new Date(msg.created_at)
    }));
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): void {
    this.db.prepare(`
      UPDATE agent_inbox
      SET is_read = true, read_at = datetime('now')
      WHERE id = ?
    `).run(messageId);
  }

  private addToQueue(agentLetter: string, message: AgentMessage): void {
    if (!this.priorityQueue.has(agentLetter)) {
      this.priorityQueue.set(agentLetter, []);
    }
    const queue = this.priorityQueue.get(agentLetter)!;
    queue.push(message);
    queue.sort((a, b) => {
      const priorityOrder = { 'P0-CRITICAL': 0, 'P1-HIGH': 1, 'P2-MEDIUM': 2, 'P3-LOW': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private startMessageProcessor(): void {
    // Process queue every 1 second
    setInterval(() => {
      for (const [agentLetter, queue] of this.priorityQueue.entries()) {
        if (queue.length > 0) {
          const message = queue.shift()!;
          this.emit(`agent:${agentLetter}:deliver`, message);
        }
      }
    }, 1000);
  }
}

// Singleton instance
export const loopAgentBus = new LoopAgentBus(
  process.env.CENTRAL_MCP_DB_PATH || '/data/registry.db'
);
```

**Validation Criteria**:
- [ ] Messages delivered within 1 second
- [ ] P0-CRITICAL messages always delivered first
- [ ] Failed deliveries retry with exponential backoff
- [ ] Message persistence survives system restart
- [ ] Real-time event emission working

---

### 3. Loop Integration Points

**Requirement**: Each of the 9 loops must emit events to agents when relevant actions occur.

**Technical Implementation**:

```typescript
// File: /src/auto-proactive/AutoProactiveEngine.ts (modifications)

import { loopAgentBus } from '../events/LoopAgentBus';

// Loop 0: System Status (every 5 seconds)
async function runSystemStatusLoop() {
  const systemHealth = await calculateSystemHealth();

  // Broadcast to all agents if health degraded
  if (systemHealth.percentage < 80) {
    ['A', 'B', 'C', 'D'].forEach(agentLetter => {
      loopAgentBus.sendToAgent({
        agentLetter: agentLetter as any,
        sourceLoop: 'loop_0',
        priority: 'P1-HIGH',
        messageType: 'SYSTEM_HEALTH_DEGRADED',
        payload: systemHealth,
        createdAt: new Date()
      });
    });
  }
}

// Loop 1: Agent Discovery (every 60 seconds)
async function runAgentDiscoveryLoop() {
  const newAgents = await discoverNewAgents();

  if (newAgents.length > 0) {
    // Notify Agent A (coordinator)
    loopAgentBus.sendToAgent({
      agentLetter: 'A',
      sourceLoop: 'loop_1',
      priority: 'P2-MEDIUM',
      messageType: 'NEW_AGENTS_DISCOVERED',
      payload: { newAgents, count: newAgents.length },
      createdAt: new Date()
    });
  }
}

// Loop 7: Spec Generation (every 10 minutes)
async function runSpecGenerationLoop() {
  const newSpec = await generateSpecFromUserMessage();

  if (newSpec) {
    // Notify Agent B (architecture specialist)
    loopAgentBus.sendToAgent({
      agentLetter: 'B',
      sourceLoop: 'loop_7',
      priority: 'P0-CRITICAL',
      messageType: 'SPEC_GENERATED',
      payload: {
        specId: newSpec.id,
        specPath: newSpec.path,
        projectName: newSpec.projectName,
        taskCount: newSpec.estimatedTasks
      },
      createdAt: new Date()
    });
  }
}

// Loop 8: Task Assignment (every 2 minutes)
async function runTaskAssignmentLoop() {
  const assignments = await assignTasksToAgents();

  for (const assignment of assignments) {
    loopAgentBus.sendToAgent({
      agentLetter: assignment.agentLetter as any,
      sourceLoop: 'loop_8',
      priority: assignment.priority as any,
      messageType: 'TASK_ASSIGNED',
      payload: {
        taskId: assignment.taskId,
        title: assignment.title,
        description: assignment.description,
        acceptanceCriteria: assignment.criteria,
        estimatedHours: assignment.hours,
        dependencies: assignment.dependencies
      },
      createdAt: new Date()
    });
  }
}

// Loop 9: Git Monitor (every 60 seconds)
async function runGitMonitorLoop() {
  const pushEvents = await detectGitPushes();

  for (const push of pushEvents) {
    // Notify agent who completed the task
    loopAgentBus.sendToAgent({
      agentLetter: push.agentLetter as any,
      sourceLoop: 'loop_9',
      priority: 'P2-MEDIUM',
      messageType: 'GIT_PUSH_DETECTED',
      payload: {
        taskId: push.taskId,
        commitHash: push.commitHash,
        filesChanged: push.filesChanged,
        validationStatus: push.validationStatus
      },
      createdAt: new Date()
    });
  }
}
```

**Validation Criteria**:
- [ ] All 9 loops emit events to agents
- [ ] Events include complete context payload
- [ ] Priority assigned correctly per event type
- [ ] Events logged in database for audit trail

---

### 4. Agent MCP Tools

**Requirement**: Agents need MCP tools to interact with Central-MCP.

**Technical Implementation**:

```typescript
// File: /src/tools/intelligence/getAgentInbox.ts

import { loopAgentBus } from '../../events/LoopAgentBus';

export async function getAgentInbox(agentLetter: string) {
  const messages = loopAgentBus.getAgentInbox(agentLetter);

  return {
    success: true,
    agentLetter,
    messageCount: messages.length,
    messages: messages.map(msg => ({
      id: msg.id,
      sourceLoop: msg.sourceLoop,
      priority: msg.priority,
      type: msg.messageType,
      payload: msg.payload,
      receivedAt: msg.createdAt
    }))
  };
}

// File: /src/tools/intelligence/sendToLoop.ts

export async function sendToLoop(
  agentLetter: string,
  targetLoop: string,
  messageType: string,
  payload: any
) {
  loopAgentBus.sendToLoop(agentLetter, targetLoop, messageType, payload);

  return {
    success: true,
    message: `Message sent from Agent ${agentLetter} to ${targetLoop}`,
    messageType,
    timestamp: new Date()
  };
}

// File: /src/tools/intelligence/agentConnect.ts (enhanced)

export async function agentConnect(
  agentLetter: string,
  model: string,
  role: string,
  projectName: string
) {
  // Register agent session
  const sessionId = await registerAgentSession({
    agentLetter,
    model,
    role,
    projectName,
    connectedAt: new Date()
  });

  // Subscribe to inbox events
  loopAgentBus.on(`agent:${agentLetter}:message`, (message) => {
    console.log(`📬 Agent ${agentLetter} received: ${message.messageType}`);
  });

  // Send heartbeat every 60 seconds
  const heartbeatInterval = setInterval(() => {
    loopAgentBus.sendToLoop(
      agentLetter,
      'loop_0',
      'HEARTBEAT',
      { sessionId, timestamp: new Date() }
    );
  }, 60000);

  return {
    success: true,
    sessionId,
    agentLetter,
    role,
    welcome: `Welcome Agent ${agentLetter}! You are connected to Central-MCP.`,
    inboxMessageCount: loopAgentBus.getAgentInbox(agentLetter).length
  };
}
```

**MCP Tool Registry**:
- `getAgentInbox(agentLetter)` - Retrieve unread messages
- `markMessageRead(messageId)` - Mark message as processed
- `sendToLoop(agentLetter, targetLoop, type, payload)` - Send message to loop
- `agentConnect(agentLetter, model, role, project)` - Register agent session
- `claimTask(taskId, agentLetter)` - Claim available task
- `updateProgress(taskId, percentage, notes)` - Report progress
- `completeTask(taskId, deliverables, timeSpent)` - Mark task complete
- `reportBlocker(taskId, blockerDescription)` - Report blocker immediately

**Validation Criteria**:
- [ ] All 8 MCP tools registered and accessible
- [ ] Tools return proper JSON responses
- [ ] Error handling for invalid inputs
- [ ] Tools update database atomically

---

### 5. Agent Coordination Protocol

**Requirement**: Prevent conflicts when multiple agents work simultaneously.

**Coordination Rules**:

```typescript
// File: /src/coordination/AgentCoordinator.ts

interface CoordinationRule {
  rule: string;
  enforcement: 'BLOCKING' | 'WARNING' | 'INFO';
  check: (context: any) => Promise<boolean>;
  action: (context: any) => Promise<void>;
}

export const coordinationRules: CoordinationRule[] = [
  {
    rule: 'NO_CONCURRENT_FILE_EDITS',
    enforcement: 'BLOCKING',
    check: async (context) => {
      // Check if another agent is editing same file
      const activeEdits = await getActiveFileEdits();
      return !activeEdits.some(edit =>
        edit.filePath === context.filePath &&
        edit.agentLetter !== context.agentLetter
      );
    },
    action: async (context) => {
      throw new Error(`File ${context.filePath} is being edited by Agent ${context.otherAgent}`);
    }
  },

  {
    rule: 'ARCHITECTURE_TASKS_REQUIRE_AGENT_B',
    enforcement: 'WARNING',
    check: async (context) => {
      if (context.taskType === 'ARCHITECTURE' && context.agentLetter !== 'B') {
        return false;
      }
      return true;
    },
    action: async (context) => {
      loopAgentBus.sendToAgent({
        agentLetter: 'A',
        sourceLoop: 'coordination',
        priority: 'P2-MEDIUM',
        messageType: 'ARCHITECTURE_TASK_WARNING',
        payload: {
          taskId: context.taskId,
          assignedTo: context.agentLetter,
          recommendation: 'Consider reassigning to Agent B (Architecture Specialist)'
        },
        createdAt: new Date()
      });
    }
  },

  {
    rule: 'AGENT_A_REVIEWS_P0_CRITICAL',
    enforcement: 'BLOCKING',
    check: async (context) => {
      // P0-CRITICAL task completion requires Agent A validation
      if (context.priority === 'P0-CRITICAL' && context.action === 'COMPLETE') {
        const validated = await checkAgentAValidation(context.taskId);
        return validated;
      }
      return true;
    },
    action: async (context) => {
      // Request validation from Agent A
      loopAgentBus.sendToAgent({
        agentLetter: 'A',
        sourceLoop: 'coordination',
        priority: 'P0-CRITICAL',
        messageType: 'VALIDATION_REQUIRED',
        payload: {
          taskId: context.taskId,
          completedBy: context.agentLetter,
          deliverables: context.deliverables
        },
        createdAt: new Date()
      });
    }
  }
];

export async function enforceCoordination(context: any): Promise<void> {
  for (const rule of coordinationRules) {
    const passed = await rule.check(context);

    if (!passed) {
      if (rule.enforcement === 'BLOCKING') {
        await rule.action(context);
      } else if (rule.enforcement === 'WARNING') {
        await rule.action(context);
        console.warn(`⚠️  Coordination warning: ${rule.rule}`);
      }
    }
  }
}
```

**Validation Criteria**:
- [ ] Concurrent file edits blocked
- [ ] Architecture tasks routed to Agent B
- [ ] P0-CRITICAL completions require Agent A validation
- [ ] Coordination warnings logged
- [ ] Rules configurable via settings

---

### 6. Health Monitoring & Auto-Recovery

**Requirement**: Detect agent failures and recover automatically.

**Technical Implementation**:

```typescript
// File: /src/monitoring/AgentHealthMonitor.ts

export class AgentHealthMonitor {
  private checkInterval: NodeJS.Timeout;
  private recoveryAttempts: Map<string, number> = new Map();

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Check agent health every 30 seconds
    this.checkInterval = setInterval(async () => {
      const agents = await getActiveAgentSessions();

      for (const agent of agents) {
        const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat.getTime();

        // Stalled detection (5 minutes no heartbeat)
        if (timeSinceHeartbeat > 300000) {
          console.warn(`⚠️  Agent ${agent.agentLetter} stalled (${Math.floor(timeSinceHeartbeat / 60000)} minutes)`);

          // Release any claimed tasks
          if (agent.currentTask) {
            await releaseTask(agent.currentTask);
            console.log(`🔄 Released task ${agent.currentTask} from stalled agent`);
          }

          // Attempt recovery after 10 minutes
          if (timeSinceHeartbeat > 600000) {
            await this.attemptRecovery(agent);
          }
        }
      }
    }, 30000);
  }

  private async attemptRecovery(agent: any) {
    const attempts = this.recoveryAttempts.get(agent.sessionId) || 0;

    if (attempts >= 3) {
      // Alert human after 3 failed recoveries
      await this.alertHuman({
        severity: 'CRITICAL',
        message: `Agent ${agent.agentLetter} failed 3 recovery attempts`,
        agent: agent.agentLetter,
        sessionId: agent.sessionId,
        action: 'Manual intervention required'
      });

      // Mark agent as failed
      await markAgentFailed(agent.sessionId);
      return;
    }

    // Attempt restart
    console.log(`🔄 Attempting recovery for Agent ${agent.agentLetter} (attempt ${attempts + 1}/3)`);

    try {
      // Execute restart script
      await execShellCommand(`/scripts/restart-agent-${agent.agentLetter.toLowerCase()}.sh`);

      // Reset recovery counter on success
      this.recoveryAttempts.set(agent.sessionId, 0);

      console.log(`✅ Agent ${agent.agentLetter} recovered successfully`);
    } catch (error) {
      // Increment recovery attempts
      this.recoveryAttempts.set(agent.sessionId, attempts + 1);

      console.error(`❌ Recovery failed for Agent ${agent.agentLetter}:`, error);
    }
  }

  private async alertHuman(alert: any) {
    // Send alert via multiple channels
    await Promise.all([
      // Email alert
      sendEmail({
        to: process.env.ALERT_EMAIL,
        subject: `[CRITICAL] Agent Failure: ${alert.agent}`,
        body: JSON.stringify(alert, null, 2)
      }),

      // Slack alert (if configured)
      sendSlackAlert({
        channel: '#central-mcp-alerts',
        message: alert.message,
        severity: alert.severity,
        details: alert
      }),

      // Dashboard alert
      createDashboardAlert({
        type: 'AGENT_FAILURE',
        severity: 'CRITICAL',
        message: alert.message,
        timestamp: new Date()
      })
    ]);
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Start monitoring
export const agentHealthMonitor = new AgentHealthMonitor();
```

**Validation Criteria**:
- [ ] Stalled agents detected within 5 minutes
- [ ] Tasks released from stalled agents
- [ ] Auto-recovery attempted up to 3 times
- [ ] Human alerted after 3 failed recoveries
- [ ] Health metrics visible in dashboard

---

## 📊 PERFORMANCE TARGETS

### Response Time Targets

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| Message delivery (loop → agent) | <1s | TBD | ⏳ |
| Message delivery (agent → loop) | <1s | TBD | ⏳ |
| Inbox query response | <100ms | TBD | ⏳ |
| Task claim response | <500ms | TBD | ⏳ |
| Heartbeat processing | <50ms | TBD | ⏳ |
| Health check execution | <2s | TBD | ⏳ |

### Throughput Targets

| Metric | Target | Status |
|--------|--------|--------|
| Messages processed/minute | 100+ | ⏳ |
| Concurrent agents supported | 4-10 | ⏳ |
| Tasks assigned/hour | 50+ | ⏳ |
| Task completions/day | 100+ | ⏳ |

### Reliability Targets

| Metric | Target | Status |
|--------|--------|--------|
| Message delivery success rate | >99% | ⏳ |
| Agent uptime | >95% | ⏳ |
| Recovery success rate | >90% | ⏳ |
| Zero data loss on crash | 100% | ⏳ |

---

## 🚀 DEPLOYMENT PLAN

### Phase 1: Infrastructure Setup (4 hours)

**Tasks**:
1. ✅ Create tmux terminal sessions on VM
2. ✅ Install dependencies (Node.js, Claude Code CLI, GLM CLI)
3. ✅ Configure environment variables per agent
4. ✅ Test terminal persistence and reconnection
5. ✅ Create startup scripts for each agent

**Deliverables**:
- `/scripts/setup-agent-terminals.sh`
- `/scripts/start-agent-A.sh` through `/scripts/start-agent-D.sh`
- `/docs/VM_AGENT_TERMINAL_ACCESS.md`

**Validation**:
- [ ] 4 tmux sessions running
- [ ] Agents can be started via scripts
- [ ] Sessions survive SSH disconnection

---

### Phase 2: Communication Infrastructure (6 hours)

**Tasks**:
1. ✅ Implement LoopAgentBus event system
2. ✅ Create agent_inbox and agent_outbox tables
3. ✅ Integrate all 9 loops with event emissions
4. ✅ Implement priority queue system
5. ✅ Add retry logic with exponential backoff
6. ✅ Create MCP tools (getAgentInbox, sendToLoop)

**Deliverables**:
- `/src/events/LoopAgentBus.ts`
- `/src/tools/intelligence/getAgentInbox.ts`
- `/src/tools/intelligence/sendToLoop.ts`
- Database schema migration

**Validation**:
- [ ] Messages delivered within 1 second
- [ ] P0-CRITICAL messages prioritized
- [ ] Retry logic working on failures
- [ ] MCP tools accessible to agents

---

### Phase 3: Agent Deployment (5 hours)

**Tasks**:
1. ✅ Deploy Agent A (Claude Sonnet 4.5 - Coordinator)
2. ✅ Deploy Agent B (Claude Sonnet 4.5 - Architecture)
3. ✅ Deploy Agent C (GLM 4.6 - Backend)
4. ✅ Deploy Agent D (GLM 4.6 - UI)
5. ✅ Test agent registration and heartbeats
6. ✅ Validate task claiming workflow
7. ✅ Test coordination protocol

**Deliverables**:
- 4 agents running on VM terminals
- Agent registry populated
- First tasks claimed and in progress

**Validation**:
- [ ] All 4 agents registered
- [ ] Heartbeats received every 60s
- [ ] Agents successfully claim tasks
- [ ] Coordination prevents conflicts

---

### Phase 4: Monitoring & Optimization (3 hours)

**Tasks**:
1. ✅ Implement AgentHealthMonitor
2. ✅ Create dashboard components for agent status
3. ✅ Add performance metrics collection
4. ✅ Implement alerting system
5. ✅ Test auto-recovery on simulated failure

**Deliverables**:
- `/src/monitoring/AgentHealthMonitor.ts`
- `/app/components/monitoring/AgentStatus.tsx`
- Alert system configured

**Validation**:
- [ ] Health monitoring active
- [ ] Dashboard shows agent status
- [ ] Alerts trigger on failures
- [ ] Auto-recovery working

---

## ✅ SUCCESS CRITERIA

### Functional Requirements

- [x] 4 agents deployed to VM terminals
- [ ] Agents receive messages from loops within 1 second
- [ ] Agents can send messages to loops
- [ ] Task claiming and progress reporting working
- [ ] Coordination prevents file conflicts
- [ ] Health monitoring detects failures
- [ ] Auto-recovery restarts failed agents
- [ ] Dashboard visualizes agent status

### Non-Functional Requirements

- [ ] Message delivery >99% success rate
- [ ] Response times meet targets (<1s delivery)
- [ ] Zero data loss on agent crash
- [ ] System supports 4-10 concurrent agents
- [ ] Logs provide complete audit trail
- [ ] Documentation complete and accurate

### Business Requirements

- [ ] 4 agents work in parallel on different tasks
- [ ] Development velocity increased 5-10x
- [ ] Human oversight reduced to 5% of time
- [ ] System operates 24/7 without human intervention
- [ ] Quality maintained (tests pass, no regressions)

---

## 📝 ACCEPTANCE TESTING

### Test Scenario 1: Message Delivery

```bash
# Loop sends message to Agent A
POST /api/loops/send-message
{
  "agentLetter": "A",
  "sourceLoop": "loop_8",
  "priority": "P0-CRITICAL",
  "messageType": "TASK_ASSIGNED",
  "payload": { "taskId": "T025", "title": "Fix critical bug" }
}

# Agent A queries inbox
GET /api/agents/A/inbox

# Expected: Message delivered within 1 second
# Expected: Message appears in inbox with P0-CRITICAL priority
```

### Test Scenario 2: Task Claiming

```bash
# Agent C claims backend task
POST /api/tasks/T026/claim
{ "agentLetter": "C" }

# Expected: Task status changes to IN_PROGRESS
# Expected: Agent C receives task context bundle
# Expected: Loop 4 begins monitoring progress
```

### Test Scenario 3: Coordination Conflict

```bash
# Agent A starts editing file
POST /api/coordination/file-lock
{ "agentLetter": "A", "filePath": "/src/index.ts" }

# Agent C tries to edit same file
POST /api/coordination/file-lock
{ "agentLetter": "C", "filePath": "/src/index.ts" }

# Expected: Agent C receives blocking error
# Expected: Coordination rule logged
```

### Test Scenario 4: Agent Failure Recovery

```bash
# Simulate Agent D crash
kill -9 <agent-d-pid>

# Expected: Health monitor detects within 5 minutes
# Expected: Task released from Agent D
# Expected: Auto-recovery attempts restart
# Expected: Alert sent if 3 attempts fail
```

---

## 🎯 IMPACT PROJECTION

### Development Velocity

**Before VM Agents**:
- Tasks assigned manually: 10-30 minutes per task
- Human implementation: 1-8 hours per task
- Manual coordination: 15-30 minutes per day
- Total human time: ~100 hours per application

**After VM Agents**:
- Tasks auto-assigned: <2 minutes
- Agent implementation: 1-8 hours (parallel)
- Auto-coordination: 0 minutes human time
- Total human time: ~5 hours oversight per application

**TIME SAVINGS: 95%**

### Quality Improvements

- ✅ Consistent code quality (agents follow specs exactly)
- ✅ Zero forgotten tasks (auto-assignment ensures coverage)
- ✅ Faster bug detection (4 agents reviewing each other)
- ✅ Complete test coverage (agents write tests for all code)
- ✅ Documentation always up-to-date (agents update docs)

### Scalability Path

**Current (4 agents)**:
- 4 parallel tasks
- 20-30 tasks/day completion rate
- 1 project at a time

**Future (8 agents)**:
- 8 parallel tasks
- 40-60 tasks/day completion rate
- 2 projects simultaneously

**Future (16 agents)**:
- 16 parallel tasks
- 80-120 tasks/day completion rate
- 4 projects simultaneously

---

## 📚 RELATED SPECIFICATIONS

- **0010_AUTO_PROACTIVE_INTELLIGENCE_ARCHITECTURE.md** - Core loop system
- **0013_USER_MESSAGE_INTELLIGENCE_SYSTEM.md** - Message capture and processing
- **0015_COMPLETE_IDEA_LIFECYCLE_ARCHITECTURE.md** - End-to-end workflow
- **SPEC_JWT_Authentication.md** - Security for agent API access

---

## 🔗 DEPENDENCIES

**Required Systems**:
- ✅ Central-MCP Auto-Proactive Engine (9 loops active)
- ✅ Central-MCP Registry Database (registry.db)
- ✅ VM Infrastructure (GCP 34.41.115.199)
- ⏳ LLM Integration (Claude API, GLM API)
- ⏳ MCP Protocol Implementation

**Blocking Issues**:
- None (all dependencies available)

**Nice-to-Have**:
- JWT Authentication for agent API access
- WebSocket for real-time updates
- Redis caching for performance

---

## ✅ VALIDATION CHECKLIST

### Pre-Deployment

- [ ] VM has sufficient resources (4 CPU, 16GB RAM minimum)
- [ ] Database schema updated (agent_inbox, agent_outbox tables)
- [ ] All 9 loops emit events correctly
- [ ] MCP tools registered and tested
- [ ] Terminal infrastructure tested
- [ ] Startup scripts validated

### Post-Deployment

- [ ] All 4 agents connected and registered
- [ ] Heartbeats received from all agents
- [ ] Message delivery working bidirectionally
- [ ] Task assignment and claiming functional
- [ ] Coordination rules enforced
- [ ] Health monitoring active
- [ ] Dashboard shows accurate status

### Performance Validation

- [ ] Message delivery <1s
- [ ] Inbox queries <100ms
- [ ] Task claims <500ms
- [ ] Health checks <2s
- [ ] No memory leaks detected
- [ ] CPU usage reasonable (<50% average)

---

## 🚀 CONCLUSION

This specification defines a **revolutionary multi-agent coordination system** where 4 AI agents work in parallel on VM terminals, coordinated by Central-MCP's 9 auto-proactive loops, achieving **95% reduction in human development time**.

**Key Innovations**:
1. ✅ Event-driven loop-to-agent communication
2. ✅ Priority-based message delivery
3. ✅ Coordination protocol preventing conflicts
4. ✅ Auto-recovery on agent failure
5. ✅ Real-time health monitoring
6. ✅ Parallel task execution (4 simultaneous tasks)

**Expected Outcome**:
- From 100 hours human coding → 5 hours human oversight
- From 1 task at a time → 4 parallel tasks
- From manual coordination → autonomous coordination
- From reactive debugging → proactive monitoring

**Status**: ✅ READY FOR IMPLEMENTATION

**Next Step**: Execute deployment tasks T021-T024

---

**Last Updated**: October 12, 2025
**Document Owner**: Central-MCP System Architecture
**Implementation Priority**: P0-CRITICAL (Deployment Blocker)
