# 📊 DASHBOARD DATA MAP - What We Can Actually Display

**Date**: October 10, 2025
**Purpose**: Map ALL available data and controls for Central-MCP dashboard
**Source**: Live VM database queries

---

## 🗄️ AVAILABLE DATABASE TABLES (24)

### CORE COORDINATION
```
✅ projects               - Projects being managed (0, 1, 2 hierarchy)
✅ tasks                  - Task registry (11 tasks, 2 done, 9 pending)
✅ agent_sessions         - Active/past agent connections
✅ agents                 - Agent identity registry
```

### AUTO-PROACTIVE INTELLIGENCE
```
✅ auto_proactive_logs    - Loop execution history (159+ executions!)
✅ conversation_messages  - User messages captured
✅ extracted_insights     - Intelligence from messages
✅ behavior_rules         - Generated behavioral rules
✅ workflow_templates     - Workflow definitions
```

### MONITORING & TRACKING
```
✅ agent_activity         - Agent actions log
✅ agent_metrics          - Performance metrics
✅ agent_presence         - Heartbeat tracking
✅ agent_usage            - Usage statistics
✅ task_history           - Task state changes
✅ task_costs             - Cost per task
```

### INTELLIGENCE & OPTIMIZATION
```
✅ agent_collaboration    - Multi-agent coordination
✅ agent_context_reports  - Context snapshots
✅ context_files          - Project context tracking
✅ model_catalog          - Available AI models
✅ budget_alerts          - Cost alerts
✅ rules                  - Coordination rules
```

---

## 📊 QUERYABLE METRICS (What We Can Display)

### 1. AUTO-PROACTIVE LOOPS STATUS

**Query:**
```sql
SELECT
  loop_name,
  COUNT(*) as executions,
  MAX(timestamp) as last_run
FROM auto_proactive_logs
WHERE timestamp > datetime('now', '-1 hour')
GROUP BY loop_name
ORDER BY loop_name
```

**Display:**
```
Loop 1 (Project Discovery):     147 executions ✅ ACTIVE
Loop 2 (Status Analysis):       0 executions   ⏸️ IDLE
Loop 3 (Spec Generation):       2 executions   ✅ ACTIVE
Loop 4 (Task Assignment):       1 execution    ✅ ACTIVE
Loop 5 (Opportunity Scan):      0 executions   ⏸️ IDLE
Loop 6 (Progress Monitor):      9 executions   ✅ ACTIVE

Visual: Progress bar for each loop, pulse animation if active
```

---

### 2. TASK COMPLETION PROGRESS

**Query:**
```sql
SELECT
  project_id,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgress,
  SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
FROM tasks
GROUP BY project_id
```

**Display:**
```
PROJECT_central-mcp:
  ██████████░░░░░░░░░░ 18% (2/11 tasks)

  Completed:   2 ✅
  In Progress: 0 🔵
  Pending:     9 ⏸️
  Blocked:     0 🚫

Visual: Animated filling progress bar, color-coded segments
```

---

### 3. AGENT STATUS (Who's Working)

**Query:**
```sql
SELECT
  agent_letter,
  agent_model,
  project_id,
  status,
  tasks_claimed,
  tasks_completed,
  last_heartbeat,
  datetime('now') as now,
  (julianday('now') - julianday(last_heartbeat)) * 24 * 60 as minutes_since
FROM agent_sessions
ORDER BY last_heartbeat DESC
LIMIT 10
```

**Display:**
```
ACTIVE AGENTS:

Agent A (glm-4-6)           [LocalBrain]
  Last seen: 5 min ago      Status: DISCONNECTED
  Tasks: 0 claimed, 0 done

No agents currently active.

Visual: Agent cards with heartbeat pulse when active
```

---

### 4. CONVERSATION INTELLIGENCE

**Query:**
```sql
SELECT
  COUNT(*) as total_messages,
  SUM(CASE WHEN input_method = 'WRITTEN' THEN 1 ELSE 0 END) as written,
  SUM(CASE WHEN input_method = 'SPOKEN' THEN 1 ELSE 0 END) as spoken,
  AVG(semantic_density) as avg_density
FROM conversation_messages
```

**Display:**
```
CONVERSATION INTELLIGENCE:
  Total Messages: 1
  Written (CAPS): 0
  Spoken (flow): 1
  Avg Density: 0.85

Insights Extracted: 0
Rules Generated: 0
Workflows Created: 0

Visual: Intelligence pipeline visualization
```

---

### 5. COST TRACKING

**Query:**
```sql
SELECT
  provider,
  SUM(input_tokens) as total_input,
  SUM(output_tokens) as total_output,
  SUM(cost_usd) as total_cost,
  COUNT(*) as api_calls
FROM cost_tracking
WHERE timestamp > datetime('now', '-1 day')
GROUP BY provider
```

**Display (Current):**
```
COST TRACKING:

VM: $0.00 (Free tier)
API Calls: 0
Total: $0.00

Budget: $0/$23 (0% used)

Visual: Cost meter with budget indicator
```

---

### 6. VM SYSTEM METRICS

**Available via:**
- Health endpoint: `/health` (uptime, status)
- System commands on VM: `top`, `df -h`, `free -m`

**Display:**
```
VM STATUS:
  Uptime: 67m 26s
  CPU: ~5% (estimate from process)
  Memory: ~60MB / 1GB (6%)
  Disk: 2.5GB / 30GB (8%)
  Network: Active

Visual: Sparklines for trends
```

---

## 🎮 AVAILABLE CONTROLS (What We Can Actually Do)

### SERVER CONTROLS

```bash
✅ View Logs: tail /opt/central-mcp/logs/*.log
✅ Restart Server: pkill node && node dist/index.js
✅ Check Health: curl http://localhost:3000/health
✅ Database Query: sqlite3 /opt/central-mcp/data/registry.db
```

### LOOP CONTROLS

```
⏸️ Enable/Disable Loop: Edit config, restart (no API yet)
⏸️ Trigger Manual Run: No API yet
⏸️ Adjust Interval: Edit config, restart
```

### TASK CONTROLS

```
Via Database:
✅ View tasks: SELECT * FROM tasks
✅ Update task status: UPDATE tasks SET status=...
⏸️ Claim task: Would need MCP tool call
⏸️ Complete task: Would need MCP tool call
```

### AGENT CONTROLS

```
✅ View connected agents: SELECT * FROM agent_sessions
✅ View agent history: Past sessions
⏸️ Send message to agent: Would need A2A integration
⏸️ Assign task: Would need MCP tool
```

---

## 🎯 REALISTIC DASHBOARD V1 (Achievable)

### READ-ONLY MONITORING (Can build NOW):

```
✅ VM Status Card
   - Uptime
   - Health status
   - Basic metrics

✅ Loops Status Card
   - 6 loops with execution counts
   - Last run time
   - Active/Idle indicators

✅ Task Progress Card
   - Total tasks
   - Completion percentage
   - Progress bar visual
   - Breakdown by status

✅ Agent Sessions Card
   - Recent connections
   - Agent letter, model
   - Last seen time
   - Tasks completed

✅ Database Stats Card
   - Table count
   - Message count
   - Loop log count
   - Total records

✅ Cost Tracking Card
   - Daily/monthly costs
   - Budget status
   - Free tier indicator
```

### CONTROLS (Need to Build):

```
⏸️ Authentication (Login required)
⏸️ Server restart button
⏸️ Log viewer (live tail)
⏸️ Manual loop trigger
⏸️ Task creation/assignment
⏸️ Agent messaging

Status: Not implemented yet
```

---

## 🎯 WHAT'S REALISTIC FOR V1:

**Dashboard Can Show:**
```
✅ Real-time VM health (from /health endpoint)
✅ Loop execution counts (from auto_proactive_logs)
✅ Task completion progress (from tasks table)
✅ Agent connection history (from agent_sessions)
✅ Database statistics (from table queries)
✅ Cost tracking (from task_costs - currently $0)

= ALL READ-ONLY MONITORING
= NO AUTHENTICATION YET
= NO CONTROL ACTIONS YET
```

**Timeline:**
- Monitoring dashboard: 4 hours
- Authentication: +2 hours
- Control actions: +3 hours

---

## 🎯 RECOMMENDATION:

**Build V1 (Monitoring Only) - 4 hours:**
- Real-time data display
- Visual progress bars
- Task completion tracking
- Loop status visualization
- All queryable data shown

**V2 Later (Controls) - +5 hours:**
- Authentication
- Server controls
- Task management
- Agent coordination

---

**Should I build the monitoring dashboard now (V1 - 4 hrs)?** 🚀