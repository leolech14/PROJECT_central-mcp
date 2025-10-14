# 🧠 Central-MCP System Logic Registry
## Complete Map of All Rules, Logic, and Algorithms

**Date**: 2025-10-09
**Purpose**: Map ALL system logic scattered across codebase
**Status**: COMPREHENSIVE REGISTRY

---

## 🎯 CORE SYSTEM LOGIC

### **1. Agent Auto-Detection Logic**

**Location**: `src/discovery/AgentRecognizer.ts`

**Logic:**
```typescript
Recognition Priority:
1. Tracking ID (100% confidence)
   └─ Check: ~/.brain/config.json
   └─ Match: agents.tracking_id = value
   └─ Result: RECOGNIZED

2. Model Signature (90% confidence)
   └─ Generate: hash(modelId + apiKeyHash + machineId)
   └─ Match: agents.model_signature = hash
   └─ Result: RECOGNIZED

3. No Match (0% confidence)
   └─ Create: New agent
   └─ Generate: tracking_id (UUID)
   └─ Save: ~/.brain/config.json
   └─ Result: NEW_AGENT
```

**Rule**: "Always try tracking ID first, signature second, create last"

---

### **2. Project Detection Logic**

**Location**: `src/discovery/ProjectDetector.ts`

**Logic:**
```typescript
Detection Priority:
1. Git Remote (highest priority)
   └─ Execute: git remote get-url origin
   └─ Normalize: Remove .git, convert SSH→HTTPS
   └─ Match: projects.git_remote = normalized
   └─ Result: FOUND

2. Directory Path (medium priority)
   └─ Check: projects.path = cwd
   └─ Result: FOUND

3. No Match (create new)
   └─ Extract: Name from git or directory
   └─ Classify: Type (COMMERCIAL_APP, TOOL, etc.)
   └─ Extract: Vision from CLAUDE.md
   └─ INSERT: New project
   └─ Result: REGISTERED

Classification Rules:
├─ Has 02_SPECBASES/ + 01_CODEBASES/ = COMMERCIAL_APP
├─ Has code but no specbase = TOOL
├─ Path contains "mcp-server" = INFRASTRUCTURE
└─ Default = UNKNOWN
```

**Rule**: "Git remote is source of truth, path is fallback"

---

### **3. Task Assignment Logic**

**Location**: `src/discovery/JobProposalEngine.ts`

**6-Factor Scoring Algorithm:**
```typescript
Score Task for Agent (0-100):

Factor 1: Role Match (30 points max)
├─ If task.agent === agent.role: +30
├─ If task.agent === 'ANY': +15
└─ Else: 0

Factor 2: Capability Match (25 points max)
├─ Required: ['UI', 'BACKEND', 'DESIGN']
├─ Agent has: {ui: true, backend: true}
├─ Matched: 2/3 capabilities
└─ Score: (2/3) × 25 = 16.7

Factor 3: History Match (15 points max)
├─ Similar tasks completed: 4
├─ Score: min(4 × 3, 15) = 12

Factor 4: Context Available (15 points max)
├─ Relevant files found: 23
├─ Score: min(23 × 0.5, 15) = 11.5

Factor 5: Readiness (10 points max)
├─ Dependencies satisfied: YES
└─ Score: 10

Factor 6: Urgency (5 points max)
├─ Priority: P0
└─ Score: 5

Total: 30 + 16.7 + 12 + 11.5 + 10 + 5 = 85.2/100

BONUS: Cost Optimization (+5 if agent is cheapest)
FINAL: 85.2 + 5 = 90.2/100
```

**Rule**: "Match capabilities first, then optimize for cost and context"

---

### **4. Task Claiming Logic (ATOMIC)**

**Location**: `src/registry/TaskStore.ts`

**ACID Transaction:**
```sql
BEGIN TRANSACTION
  UPDATE tasks
  SET status = 'CLAIMED',
      claimed_by = ?,
      claimed_at = datetime('now')
  WHERE id = ?
    AND status = 'AVAILABLE'  -- Critical: Only if AVAILABLE

  -- Check affected rows
  IF rows_affected = 1:
    COMMIT → SUCCESS ✅
  ELSE:
    ROLLBACK → FAILED (already claimed)
END TRANSACTION
```

**Rule**: "Atomic check-and-set prevents race conditions"

---

### **5. Git Verification Logic**

**Location**: `src/registry/GitTracker.ts`

**Completion Score Algorithm:**
```typescript
Calculate Completion (0-100):

File Score (70% weight):
├─ Expected files: filesCreated[] from task
├─ Find in git: git log --name-status --grep="T0XX"
├─ Files found: 8/10
├─ File score: (8/10) × 100 = 80%
└─ Weighted: 80% × 0.7 = 56 points

Commit Score (30% weight):
├─ Expected: ≥3 commits mentioning task ID
├─ Find: git log --oneline --grep="T0XX"
├─ Commits found: 3
├─ Commit score: 100%
└─ Weighted: 100% × 0.3 = 30 points

Total: 56 + 30 = 86 points

Verdict:
├─ Score ≥ 80%: AUTO-VERIFIED ✅
├─ Score 50-79%: REVIEW NEEDED ⚠️
└─ Score < 50%: REJECTED ❌
```

**Rule**: "Git commits are objective truth, 80% threshold for auto-verify"

---

### **6. Keep-in-Touch Gating Logic**

**Location**: `src/core/KeepInTouchEnforcer.ts`

**Completion Permission Flow:**
```typescript
Agent requests completion:
  ↓
Check 1: Recent Check-in?
├─ Last check-in: 2025-10-09 22:00:00
├─ Current time: 2025-10-09 22:45:00
├─ Gap: 45 minutes
├─ Max allowed: 30 min × 1.5 = 45 min (grace period)
└─ Result: PASS ✅

Check 2: Permission exists?
├─ Query: completion_permissions table
├─ Found: NO permission request
└─ Action: CREATE permission request (PENDING)

Check 3: Auto-approval timeout?
├─ Requested at: 2025-10-09 22:45:00
├─ Current time: 2025-10-09 22:46:00
├─ Elapsed: 60 seconds
├─ Threshold: 60 seconds
└─ Result: AUTO-APPROVE ✅

Permission GRANTED → Allow completion
```

**Rule**: "Check-in every 30 min, auto-approve after 60s, block if missed"

---

### **7. Cost Routing Logic**

**Location**: `src/core/CostAwareScheduler.ts`

**Model Selection Algorithm:**
```typescript
Select Model for Task:

Analyze Requirements:
├─ Needs ULTRATHINK? (strategic/architecture)
├─ Needs 1M context? (complete codebase)
├─ Quality critical? (design/security)
└─ Default implementation?

Decision Tree:
IF (needs 1M context AND needs ULTRATHINK):
  → Sonnet 4.5 1M ($40/hr) - Expensive but necessary

ELSE IF (quality critical):
  → Sonnet 4.5 200K ($40/hr) - Quality work

ELSE:
  → GLM-4.6 ($2/hr) ⭐ - Default for 70% of work

Cost Calculation:
Task hours: 16
Model: GLM-4.6
Cost: 16 × $2 = $32 ⭐

vs Sonnet: 16 × $40 = $640
Savings: $608 (95%!)
```

**Rule**: "Default to GLM-4.6, use Sonnet only when necessary"

---

### **8. Auto-Unblocking Logic**

**Location**: `src/registry/DependencyResolver.ts`

**Dependency Satisfaction:**
```typescript
Task T014 depends on [T011]:

When T011 completes:
  ↓
findTasksToUnblock(T011):
  ├─ Find all tasks with T011 in dependencies
  ├─ Found: T014
  ├─ Check T014's other dependencies: []
  ├─ All satisfied: YES ✅
  └─ Action: UPDATE T014 SET status='AVAILABLE'

Automatic:
├─ No human intervention
├─ Happens on every task completion
└─ Triggers cascade (T014 → unlocks T020 → unlocks...)
```

**Rule**: "Auto-unblock immediately when all dependencies complete"

---

### **9. Self-Healing Logic**

**Location**: `src/health/HealthChecker.ts`

**7 Auto-Recovery Mechanisms:**
```typescript
1. Zombie Agent Detection:
   Condition: status='ONLINE' AND last_seen < NOW() - 300 seconds
   Action: UPDATE SET status='OFFLINE'
   Trigger: Every health check

2. Stuck Task Detection:
   Condition: status='IN_PROGRESS' AND claimed_at < NOW() - 24 hours
   Action: Alert for review
   Trigger: Every health check

3. Activity Log Cleanup:
   Condition: COUNT(agent_activity) > 50,000
   Action: DELETE old, keep last 10,000
   Trigger: Every health check

4. Database Vacuum:
   Condition: Size > 100 MB OR fragmented
   Action: VACUUM
   Trigger: Weekly

5. Presence Reset:
   Condition: Presence doesn't match active sessions
   Action: Reset to OFFLINE
   Trigger: On corruption detection

6. Task Auto-Unblocking:
   Condition: Blocked with completed dependencies
   Action: Set AVAILABLE
   Trigger: Every health check

7. Performance Monitoring:
   Condition: Query time > 100ms
   Action: Alert
   Trigger: Continuous
```

**Rule**: "System heals itself, no human intervention"

---

### **10. Context-Aware Assignment Logic**

**Location**: `src/core/AgentContextBuilder.ts` + `JobProposalEngine.ts`

**Context Bonus System:**
```typescript
Agent reports context:
{
  loadedProjects: ['LocalBrain'],
  canStartImmediately: ['T011', 'T014']
}

Task assignment for T011:
Base score: 75/100

Context bonus:
├─ Agent has T011 context loaded: +50 points
├─ Agent has LocalBrain project loaded: +30 points
└─ New score: 75 + 50 + 30 = 155/100 (capped at 100)

Result: Agent with context gets HUGE priority! ⭐
No loading time needed! ✅
```

**Rule**: "Prioritize agents with context already loaded (+50 bonus)"

---

## 📊 COMPLETE LOGIC REGISTRY

### **All Rules Categorized:**

**Discovery Rules (4):**
1. Agent recognition: Tracking ID → Signature → Create
2. Project detection: Git remote → Path → Create
3. Context extraction: Smart skip, size limits, depth limits
4. Job proposals: 6-factor scoring with cost bonus

**Coordination Rules (5):**
5. Task claiming: ACID atomic operations
6. Task completion: 4-layer enforcement
7. Auto-unblocking: Immediate on dependency satisfaction
8. Keep-in-Touch: 30 min check-ins, 60s auto-approve
9. Context-aware: +50 bonus for loaded context

**Quality Rules (3):**
10. Git verification: 70% files + 30% commits ≥ 80%
11. Best practices: 7 validators, blocking enforcement
12. Cost optimization: Default GLM-4.6, Sonnet for quality

**System Rules (3):**
13. Self-healing: 7 autonomous mechanisms
14. Database truth: Database > markdown > agent claims
15. Parallel execution: Independent ops run simultaneously

**Total: 15 Core Logic Systems** ✅

---

## 🎊 **PROJECTS REGISTERED!**

**Executing registration now...**

**Status: CONSOLIDATING CENTRAL-MCP!** 🚀
