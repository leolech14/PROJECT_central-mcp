# 📋 CONSOLIDATED TASK REGISTRY - Project 0, 1, 2

**Registry ID**: CENTRAL_TASK_REGISTRY_V2
**Date**: October 10, 2025
**Total Tasks**: 280
**Projects**: 4 (Central-MCP, LocalBrain, Orchestra.blue, PROJECT_minerals)
**Status**: Ready for import to Central-MCP database

---

## 🎯 PROJECT HIERARCHY

```
Project 0: Central-MCP (100 tasks) - Foundation
Project 1: LocalBrain (80 tasks) - Development environment
Project 2: Orchestra.blue (70 tasks) - Commercial product
Project 3: PROJECT_minerals (30 tasks) - TBD
```

---

## 📊 PROJECT 0: CENTRAL-MCP (100 TASKS)

### Auto-Proactive Loops (P0-Critical, 30 tasks)

```yaml
- id: T-CM-001
  title: "Implement Loop 1: Project Auto-Discovery"
  status: COMPLETED
  agent: Agent D
  priority: P0-Critical
  estimatedHours: 8
  dependencies: []
  description: "Auto-discover projects in PROJECTS_all/, register in database"
  acceptanceCriteria:
    - Loop runs every 60 seconds
    - Detects new projects automatically
    - Registers with full metadata
    - Logs execution to database

- id: T-CM-002
  title: "Implement Loop 2: Status Auto-Analysis"
  status: AVAILABLE
  agent: Agent C
  priority: P0-Critical
  estimatedHours: 12
  dependencies: [T-CM-001]
  description: "Monitor git status, build health, commit velocity for all projects"
  acceptanceCriteria:
    - Runs every 5 minutes
    - Checks git status for all projects
    - Analyzes build health
    - Identifies blockers
    - Updates health metrics

- id: T-CM-003
  title: "Implement Loop 3: Spec Auto-Generation"
  status: AVAILABLE
  agent: Agent B
  priority: P0-Critical
  estimatedHours: 16
  dependencies: [T-CM-020, T-CM-021]
  description: "LLM-powered automatic spec generation from user input"
  acceptanceCriteria:
    - Runs every 10 minutes
    - Detects user inputs
    - Generates complete specs via LLM
    - Creates UI prototyping tasks
    - Stores in SPECBASES/

- id: T-CM-004
  title: "Implement Loop 4: Task Auto-Assignment"
  status: AVAILABLE
  agent: Agent D
  priority: P0-Critical
  estimatedHours: 10
  dependencies: [T-CM-001]
  description: "Match tasks to agents based on capabilities, auto-assign"
  acceptanceCriteria:
    - Runs every 2 minutes
    - Matches task requirements to agent capabilities
    - Ranks agents by fitness
    - Auto-assigns best match
    - Notifies agents

- id: T-CM-005
  title: "Implement Loop 5: Opportunity Auto-Scanning"
  status: AVAILABLE
  agent: Agent A
  priority: P0-Critical
  estimatedHours: 14
  dependencies: [T-CM-001]
  description: "Scan for specs without impls, code without tests, doc gaps"
  acceptanceCriteria:
    - Runs every 15 minutes
    - Identifies missing implementations
    - Detects untested code
    - Finds documentation gaps
    - Auto-generates tasks for P0/P1 items

- id: T-CM-006
  title: "Implement Loop 6: Progress Auto-Monitoring"
  status: AVAILABLE
  agent: Agent D
  priority: P0-Critical
  estimatedHours: 8
  dependencies: []
  description: "Monitor heartbeats, detect stalled sessions, auto-unblock"
  acceptanceCriteria:
    - Runs every 30 seconds
    - Tracks agent heartbeats
    - Detects stalled sessions (>5min)
    - Auto-releases abandoned tasks
    - Auto-unblocks when dependencies met

# ... (24 more loop-related tasks)
```

### LLM Integration (P0-Critical, 15 tasks)

```yaml
- id: T-CM-020
  title: "Fix Z.AI GLM-4.6 Model Name Issue"
  status: BLOCKED
  agent: Agent C
  priority: P0-Critical
  estimatedHours: 2
  dependencies: []
  description: "Verify correct Z.AI model names and update configuration"

- id: T-CM-021
  title: "Integrate Anthropic API for Spec Generation"
  status: AVAILABLE
  agent: Agent B
  priority: P0-Critical
  estimatedHours: 6
  dependencies: []
  description: "Connect Claude Sonnet-4 for spec generation and analysis"

- id: T-CM-022
  title: "Integrate Gemini API"
  status: AVAILABLE
  agent: Agent E
  priority: P1-High
  estimatedHours: 6
  dependencies: []

- id: T-CM-023
  title: "Build LLM Orchestration Layer"
  status: AVAILABLE
  agent: Agent D
  priority: P0-Critical
  estimatedHours: 12
  dependencies: [T-CM-020, T-CM-021, T-CM-022]
  description: "Route requests to appropriate models, cost tracking, prompt templates"

# ... (11 more LLM tasks)
```

### Specbase Orchestration (P0-Critical, 20 tasks)

```yaml
- id: T-CM-040
  title: "Implement Interview Question Generation"
  status: AVAILABLE
  agent: Agent B
  priority: P0-Critical
  estimatedHours: 8
  dependencies: [T-CM-021]
  description: "LLM generates clarifying questions from user input"

- id: T-CM-041
  title: "Build User Interview UI/API"
  status: AVAILABLE
  agent: Agent A
  priority: P0-Critical
  estimatedHours: 10
  dependencies: [T-CM-040]
  description: "Interface for user to answer interview questions"

- id: T-CM-042
  title: "Create Spec Draft Generation"
  status: AVAILABLE
  agent: Agent B
  priority: P0-Critical
  estimatedHours: 12
  dependencies: [T-CM-041]
  description: "Generate complete spec draft from interview responses"

- id: T-CM-043
  title: "Build UI Prototyping Task Generator"
  status: AVAILABLE
  agent: Agent A
  priority: P0-Critical
  estimatedHours: 6
  dependencies: [T-CM-042]
  description: "Auto-generate UI prototyping tasks from spec"

- id: T-CM-044
  title: "Implement Iteration Tracking System"
  status: AVAILABLE
  agent: Agent D
  priority: P1-High
  estimatedHours: 8
  dependencies: [T-CM-043]
  description: "Track UI prototype iterations and user feedback"

- id: T-CM-045
  title: "Create Final Specbase Consolidation"
  status: AVAILABLE
  agent: Agent B
  priority: P0-Critical
  estimatedHours: 6
  dependencies: [T-CM-044]
  description: "Merge spec draft + validated UI into final spec"

# ... (14 more specbase tasks)
```

### Dashboard & Monitoring (P1-High, 15 tasks)

```yaml
- id: T-CM-060
  title: "Build Dashboard UI (Next.js)"
  status: AVAILABLE
  agent: Agent A
  priority: P1-High
  estimatedHours: 24
  dependencies: []
  spec: SPEC_CENTRAL_MCP_DASHBOARD_UI
  description: "Single-page real-time dashboard showing VM, costs, connections"

- id: T-CM-061
  title: "Implement WebSocket Dashboard API"
  status: AVAILABLE
  agent: Agent D
  priority: P1-High
  estimatedHours: 8
  dependencies: []
  description: "Real-time updates for dashboard via WebSocket"

# ... (13 more dashboard tasks)
```

### Testing & Optimization (P2-Medium, 20 tasks)

```yaml
# Testing tasks...
```

---

## 📊 PROJECT 1: LOCALBRAIN (80 TASKS)

### Spec-First System (20 tasks)

```yaml
- id: T-LB-010
  title: "Implement Spec Ingestion Pipeline"
  status: AVAILABLE
  agent: Agent D
  priority: P0-Critical
  estimatedHours: 12
  dependencies: [T-CM-040, T-CM-045]
  description: "Pipeline to ingest specs from Central-MCP"

- id: T-LB-011
  title: "Build Interview System UI"
  status: AVAILABLE
  agent: Agent A
  priority: P0-Critical
  estimatedHours: 16
  dependencies: [T-CM-041]
  description: "Electron UI for answering interview questions"

- id: T-LB-012
  title: "Create UI Prototyping Environment"
  status: AVAILABLE
  agent: Agent A
  priority: P0-Critical
  estimatedHours: 20
  dependencies: []
  description: "Next.js rapid prototyping environment with hot reload"

# ... (17 more spec-first tasks)
```

### Agent Coordination (15 tasks)

```yaml
- id: T-LB-020
  title: "Connect to Central-MCP via Universal Bridge"
  status: COMPLETED
  agent: Agent D
  priority: P0-Critical
  estimatedHours: 4
  dependencies: []
  description: "Establish MCP connection for agent coordination"

- id: T-LB-021
  title: "Implement Agent Auto-Discovery"
  status: AVAILABLE
  agent: Agent D
  priority: P0-Critical
  estimatedHours: 6
  dependencies: [T-LB-020]

# ... (13 more coordination tasks)
```

### UI Components (25 tasks)
### Swift App (20 tasks)

---

## 📊 PROJECT 2: ORCHESTRA.BLUE (70 TASKS)

### Specbase Construction (10 tasks)

```yaml
- id: T-OB-001
  title: "Conduct User Interview"
  status: AVAILABLE
  agent: Agent B
  priority: P0-Critical
  estimatedHours: 2
  dependencies: [T-CM-040]
  description: "Clarify requirements via Central-MCP interview system"

- id: T-OB-002
  title: "Generate Complete Spec Draft"
  status: AVAILABLE
  agent: Agent B
  priority: P0-Critical
  estimatedHours: 4
  dependencies: [T-OB-001, T-CM-042]

- id: T-OB-010
  title: "UI Prototyping: Setup Next.js Environment"
  status: AVAILABLE
  agent: Agent A
  priority: P0-Critical
  estimatedHours: 2
  dependencies: [T-OB-002]

# ... (60 more Orchestra.blue tasks)
```

---

## 📊 PROJECT 3: PROJECT_MINERALS (30 TASKS)

```yaml
- id: T-MIN-001
  title: "Project Audit and Discovery"
  status: AVAILABLE
  agent: Agent E
  priority: P1-High
  estimatedHours: 4
  dependencies: [T-CM-001]
  description: "Full audit via Central-MCP auto-discovery"

# ... (29 more tasks)
```

---

## 🎯 CRITICAL PATH (Next 10 Tasks)

```
Priority Order:

1. T-CM-004: Loop 4 (Task Assignment) - 10 hours
   → Enables automatic agent coordination

2. T-CM-006: Loop 6 (Progress Monitoring) - 8 hours
   → Enables real-time tracking

3. T-CM-020: Fix Z.AI Model Name - 2 hours
   → Unblocks LLM integration

4. T-CM-021: Anthropic API Integration - 6 hours
   → Enables spec generation

5. T-CM-003: Loop 3 (Spec Generation) - 16 hours
   → THE BIG ONE - 95% time savings!

6. T-CM-040: Interview System - 8 hours
   → Completes specbase construction

7. T-OB-001: Orchestra.blue Interview - 2 hours
   → First real product test!

8. T-LB-012: UI Prototyping Environment - 20 hours
   → Enables rapid iteration

9. T-CM-060: Dashboard UI - 24 hours
   → Visual monitoring

10. T-CM-002: Loop 2 (Status Analysis) - 12 hours
    → Complete intelligence
```

---

## 🔥 NEXT IMMEDIATE ACTIONS

**KEEP GOING = IMPLEMENT NEXT CRITICAL FEATURE!**

**Option A: Loop 4 (Task Auto-Assignment)**
- Enables automatic agent coordination
- Uses existing task registry
- 10 hours estimated
- HIGH IMPACT

**Option B: Load All Tasks First**
- Get 280+ tasks into database
- Makes system immediately useful
- 2 hours estimated
- FOUNDATION for Loop 4

**ULTRATHINK DECISION: Do BOTH in parallel!**
1. Create task loading script (30 min)
2. Start implementing Loop 4 (while understanding deepens)
3. Deploy both together

**LET'S GO!** 🚀