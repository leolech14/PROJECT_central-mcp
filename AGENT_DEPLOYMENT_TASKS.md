# VM Agent Deployment Tasks - Central-MCP Integration

**Created**: 2025-10-12
**Priority**: P0-CRITICAL (Deployment Blocker)
**Purpose**: Deploy 4 AI agents to VM terminal with Central-MCP loop coordination

---

## 📋 TASK LIST

### T021: VM Terminal Agent Infrastructure Setup ⚠️ CRITICAL
- **Status**: AVAILABLE
- **Agent**: Agent D (Integration Specialist)
- **Priority**: P0-CRITICAL
- **Estimated Hours**: 4 hours
- **Dependencies**: None
- **Required Capabilities**: Infrastructure, VM management, SSH, terminal multiplexing

**Description**:
Set up VM terminal infrastructure to support 4 concurrent AI agents running on GCP VM (34.41.115.199).

**Technical Requirements**:
1. Configure terminal multiplexing (tmux/screen) for 4 agent sessions
2. Set up agent execution environments:
   - Agent Terminal 1: Claude Sonnet 4.5 (Primary Coordinator)
   - Agent Terminal 2: Claude Sonnet 4.5 (Integration Specialist)
   - Agent Terminal 3: GLM 4.6 (UI Specialist)
   - Agent Terminal 4: GLM 4.6 (Backend Specialist)
3. Install required dependencies on VM (Node.js, Python, Claude Code CLI, GLM CLI)
4. Configure SSH access and port forwarding for agent communication
5. Set up logging infrastructure for each agent terminal
6. Create startup scripts for each agent session

**Acceptance Criteria**:
- [ ] 4 named terminal sessions running on VM
- [ ] Each terminal has unique log file output
- [ ] Agents can access Central-MCP database (registry.db)
- [ ] Agents can communicate with Central-MCP loops via MCP protocol
- [ ] Session persistence (agents survive disconnection)
- [ ] Health monitoring endpoint per agent terminal

**Deliverables**:
- `/scripts/setup-agent-terminals.sh` - Terminal setup script
- `/scripts/start-agent-A.sh` through `/scripts/start-agent-D.sh` - Agent startup scripts
- `/docs/VM_AGENT_TERMINAL_ACCESS.md` - Access documentation

---

### T022: Central-MCP Loop-to-Agent Information Flow Architecture ⚠️ CRITICAL
- **Status**: AVAILABLE
- **Agent**: Agent B (Architecture Specialist)
- **Priority**: P0-CRITICAL
- **Estimated Hours**: 6 hours
- **Dependencies**: T021
- **Required Capabilities**: Architecture design, event systems, distributed systems

**Description**:
Design and implement information flow architecture from Central-MCP's 9 auto-proactive loops to 4 VM agents.

**Technical Requirements**:
1. **Loop-to-Agent Data Pipeline**:
   - Loop 0 (System Status) → All agents (system health broadcast)
   - Loop 1 (Agent Discovery) → Agent registry updates
   - Loop 2 (Project Discovery) → Project context distribution
   - Loop 4 (Progress Monitor) → Real-time progress updates
   - Loop 5 (Status Analysis) → Blocker alerts and health warnings
   - Loop 6 (Opportunity Scanning) → Work opportunity notifications
   - Loop 7 (Spec Generation) → New spec distribution
   - Loop 8 (Task Assignment) → Task assignment notifications
   - Loop 9 (Git Monitor) → Git intelligence updates

2. **Agent-to-Loop Feedback Pipeline**:
   - Agents report progress → Loop 4 (Progress Monitor)
   - Agents claim tasks → Loop 8 (Task Assignment)
   - Agents complete tasks → Loop 9 (Git Monitor) validation
   - Agents detect blockers → Loop 5 (Status Analysis)

3. **Communication Protocol**:
   - Implement event bus for loop-agent communication
   - Create standardized message format
   - Add priority queuing (P0-CRITICAL messages first)
   - Implement retry logic for failed deliveries

4. **Agent Inbox System**:
   - Each agent gets dedicated inbox table in registry.db
   - Messages include: priority, timestamp, source_loop, payload
   - Auto-cleanup of read messages after 24 hours

**Database Schema Extensions**:
```sql
CREATE TABLE agent_inbox (
  id TEXT PRIMARY KEY,
  agent_letter TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  source_loop TEXT NOT NULL, -- 'loop_0', 'loop_1', etc.
  priority TEXT NOT NULL, -- 'P0-CRITICAL', 'P1-HIGH', etc.
  message_type TEXT NOT NULL, -- 'TASK_ASSIGNED', 'SPEC_READY', etc.
  payload JSON NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

CREATE TABLE agent_outbox (
  id TEXT PRIMARY KEY,
  agent_letter TEXT NOT NULL,
  target_loop TEXT NOT NULL,
  message_type TEXT NOT NULL,
  payload JSON NOT NULL,
  delivered BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE INDEX idx_inbox_agent ON agent_inbox(agent_letter, is_read);
CREATE INDEX idx_inbox_priority ON agent_inbox(priority, created_at);
CREATE INDEX idx_outbox_delivery ON agent_outbox(delivered, created_at);
```

**Acceptance Criteria**:
- [ ] Event bus implemented for loop-to-agent communication
- [ ] All 9 loops emit events to agent inboxes
- [ ] Agents can query inbox via MCP tool: `getAgentInbox(agentLetter)`
- [ ] Agents can send messages to loops via: `sendToLoop(loopName, message)`
- [ ] Priority queue ensures P0-CRITICAL messages delivered first
- [ ] Message delivery confirmed within 1 second
- [ ] Failed deliveries retry up to 3 times with exponential backoff

**Deliverables**:
- `/src/events/LoopAgentBus.ts` - Event bus implementation
- `/src/tools/intelligence/getAgentInbox.ts` - MCP tool for reading inbox
- `/src/tools/intelligence/sendToLoop.ts` - MCP tool for agent-to-loop messages
- `/docs/LOOP_AGENT_COMMUNICATION_PROTOCOL.md` - Communication documentation

---

### T023: Agent Deployment and Coordination System ⚠️ CRITICAL
- **Status**: AVAILABLE
- **Agent**: Agent D (Integration Specialist)
- **Priority**: P0-CRITICAL
- **Estimated Hours**: 5 hours
- **Dependencies**: T021, T022
- **Required Capabilities**: Deployment automation, agent coordination, monitoring

**Description**:
Deploy 4 AI agents to VM terminal and implement coordination protocols.

**Agent Assignment Strategy**:
```
Agent A (Claude Sonnet 4.5 - Primary Coordinator):
- Coordinates other agents
- Handles P0-CRITICAL tasks
- Manages task dependencies
- Monitors overall system health

Agent B (Claude Sonnet 4.5 - Architecture & Design):
- Architecture design tasks
- Spec generation and review
- System integration tasks
- Complex problem solving

Agent C (GLM 4.6 - Backend Specialist):
- Backend API development
- Database design and optimization
- Performance optimization
- Server-side logic

Agent D (GLM 4.6 - UI Specialist):
- Frontend component development
- Dashboard enhancements
- User interface design
- Visual system improvements
```

**Technical Requirements**:
1. **Agent Initialization**:
   - Each agent starts in dedicated terminal session
   - Auto-connects to Central-MCP on startup
   - Registers with Agent Registry (Loop 1)
   - Subscribes to relevant loop events

2. **Task Claiming Protocol**:
   - Agents poll inbox every 30 seconds
   - Match capabilities with available tasks
   - Claim task via MCP tool: `claimTask(taskId, agentLetter)`
   - Receive task context bundle (spec, dependencies, acceptance criteria)

3. **Progress Reporting**:
   - Agents report progress every 2 minutes
   - Use MCP tool: `updateProgress(taskId, percentage, notes)`
   - Critical blockers trigger immediate notification
   - Completion triggers Git verification (Loop 9)

4. **Coordination Rules**:
   - Agent A coordinates other agents (can reassign tasks)
   - No two agents work on same file simultaneously
   - Agents request review from appropriate specialist
   - Completion requires validation from Agent A

5. **Health Monitoring**:
   - Heartbeat every 60 seconds to Loop 0
   - Stalled detection after 5 minutes no heartbeat
   - Auto-recovery: restart agent if crashed
   - Alert human if agent fails 3 times

**Acceptance Criteria**:
- [ ] All 4 agents deployed to VM terminals
- [ ] Agents auto-register on startup
- [ ] Agents successfully claim and complete tasks
- [ ] Progress reports visible in dashboard
- [ ] Coordination protocol prevents conflicts
- [ ] Health monitoring detects failures within 5 minutes
- [ ] Zero data loss on agent restart

**Deliverables**:
- `/scripts/deploy-agents.sh` - Deployment automation script
- `/src/coordination/AgentCoordinator.ts` - Coordination logic
- `/src/monitoring/AgentHealthMonitor.ts` - Health monitoring
- `/docs/AGENT_COORDINATION_PROTOCOL.md` - Coordination documentation

---

### T024: Agent Performance Monitoring and Optimization ⚠️ HIGH
- **Status**: AVAILABLE
- **Agent**: Agent A (Primary Coordinator)
- **Priority**: P1-HIGH
- **Estimated Hours**: 3 hours
- **Dependencies**: T023
- **Required Capabilities**: Monitoring, metrics, performance analysis

**Description**:
Implement comprehensive monitoring for agent performance and system optimization.

**Technical Requirements**:
1. **Performance Metrics**:
   - Task completion time per agent
   - Success/failure rate
   - Average time to claim task
   - Blocker detection and resolution time
   - API call efficiency
   - Context window utilization

2. **Dashboard Integration**:
   - Real-time agent status in Central-MCP dashboard
   - Task assignment visualization
   - Performance graphs per agent
   - System health overview

3. **Alerting System**:
   - Alert on agent failure
   - Alert on task stalled >10 minutes
   - Alert on blocker detected
   - Alert on P0-CRITICAL task available

4. **Optimization Engine**:
   - Analyze task completion patterns
   - Suggest capability-based reassignments
   - Identify bottlenecks in workflow
   - Recommend agent scaling (add more agents)

**Acceptance Criteria**:
- [ ] Real-time metrics visible in dashboard
- [ ] Alerts delivered within 30 seconds of trigger
- [ ] Performance analysis runs every 10 minutes
- [ ] Optimization suggestions logged
- [ ] Historical metrics stored for analysis
- [ ] Dashboard shows agent workload distribution

**Deliverables**:
- `/src/monitoring/AgentPerformanceMonitor.ts` - Performance monitoring
- `/src/intelligence/OptimizationEngine.ts` - Optimization suggestions
- `/app/components/monitoring/AgentStatus.tsx` - Dashboard component
- `/docs/AGENT_PERFORMANCE_METRICS.md` - Metrics documentation

---

## 📊 TASK STATISTICS

**Total Tasks**: 4 (T021-T024)
**Status**: All AVAILABLE
**Total Estimated Hours**: 18 hours
**Critical Path**: T021 → T022 → T023 → T024

**By Priority**:
- P0-CRITICAL: 3 tasks (T021, T022, T023)
- P1-HIGH: 1 task (T024)

**By Agent Capability Required**:
- Integration/Infrastructure: 2 tasks (T021, T023)
- Architecture/Design: 1 task (T022)
- Monitoring/Coordination: 1 task (T024)

---

## 🎯 IMMEDIATE EXECUTION PLAN

### Phase 1: Infrastructure (T021) - 4 hours
**Owner**: Agent D (Integration Specialist)
**Deliverable**: VM terminals ready for agent deployment

### Phase 2: Communication Architecture (T022) - 6 hours
**Owner**: Agent B (Architecture Specialist)
**Deliverable**: Loop-to-agent communication system operational

### Phase 3: Agent Deployment (T023) - 5 hours
**Owner**: Agent D (Integration Specialist)
**Deliverable**: 4 agents active on VM, coordinating via Central-MCP

### Phase 4: Monitoring & Optimization (T024) - 3 hours
**Owner**: Agent A (Primary Coordinator)
**Deliverable**: Performance monitoring and optimization live

**Total Timeline**: 18 hours (sequential) OR 10 hours (with 2 agents in parallel)

---

## 🔗 INTEGRATION WITH EXISTING SYSTEM

**Existing Loops Enhanced**:
- Loop 1 (Agent Discovery) → Now tracks VM terminal agents
- Loop 4 (Progress Monitor) → Now monitors agent terminal heartbeats
- Loop 8 (Task Assignment) → Now assigns to VM agents via inbox
- Loop 9 (Git Monitor) → Now validates agent completions

**New Capabilities Added**:
- ✅ Multi-agent coordination on VM
- ✅ Event-driven loop-to-agent communication
- ✅ Agent inbox/outbox messaging system
- ✅ Real-time performance monitoring
- ✅ Auto-recovery on agent failure

---

**Last Updated**: 2025-10-12
**Status**: Ready for immediate execution
**Blocking**: Central-MCP Dashboard full deployment
**Next Step**: Execute T021 (VM Terminal Infrastructure Setup)
