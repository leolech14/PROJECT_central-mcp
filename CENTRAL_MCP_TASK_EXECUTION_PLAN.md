# 🚀 CENTRAL-MCP TASK EXECUTION PLAN
## Using Central-MCP's Full Capabilities to Complete Remaining Work

**Created**: 2025-10-15
**Method**: Use Central-MCP infrastructure (not bypass it!)
**Purpose**: Prove autonomous agent coordination works

---

## 📋 TASKS NOW IN CENTRAL-MCP DATABASE

### **✅ 8 TASKS INSERTED AND READY:**

```sql
T-CM-GIT-001 | Delete 4 Legacy GitHub Repositories      | READY | HIGH     | Agent B
T-CM-GIT-002 | Fix VM Synchronization with PROJECT_     | READY | CRITICAL | Agent D
T-CM-GIT-003 | Create 26 Missing GitHub Repos (BATCH 6) | READY | MEDIUM   | Agent B
T-CM-INT-001 | Integrate Git Hooks with Central-MCP API | READY | CRITICAL | Agent D
T-CM-CI-001  | Fix and Verify Deploy Workflow           | READY | HIGH     | Agent D
T-CM-VER-001 | Verify Data Integrity of Merged Repos    | READY | MEDIUM   | Agent B
T-CM-INT-002 | Activate Context Ingestion Pipeline      | READY | MEDIUM   | Agent C
T-CM-META-001| Test Central-MCP Autonomous Coordination | READY | CRITICAL | Agent B
```

**Total**: 8 tasks, 6.25 estimated hours
**Status**: All READY (dependencies satisfied)
**Location**: `data/registry.db` (tasks table)

---

## 🎯 EXECUTION METHOD: USE CENTRAL-MCP INFRASTRUCTURE

### **NOT This (What I Did Before):**
```
❌ Work directly without Central-MCP
❌ Assume tasks complete without verification
❌ Bypass official APIs
❌ Manual task tracking
```

### **YES This (Proper Integration):**
```
✅ Connect to Central-MCP via MCP bridge
✅ Query tasks via get_available_tasks
✅ Claim task via claim_task
✅ Execute work
✅ Report progress via report_progress
✅ Complete via complete_task
✅ Central-MCP validates and updates
```

---

## 🔄 COMPLETE WORKFLOW (Using Central-MCP)

### **STEP 1: Connect Local Agent to Central-MCP**

```bash
# Start MCP bridge (connects to VM)
node scripts/mcp-client-bridge.js &

# Bridge automatically:
# • Connects to ws://136.112.123.243:3000/mcp
# • Sends agent_discovery
# • Registers as Agent B (Sonnet 4.5)
# • Makes 7 MCP tools available
```

**Verification**:
```
Output should show:
✅ Connected to Central-MCP!
📥 Received from Central-MCP: welcome
```

---

### **STEP 2: Query Available Tasks from Central-MCP**

**Using MCP Tool (via Claude Code if MCP configured):**
```
Tool: get_available_tasks
Arguments: {"projectName": "central-mcp"}

Expected Response:
{
  "tasks": [
    {"id": "T-CM-GIT-002", "name": "Fix VM Sync", "priority": "CRITICAL"},
    {"id": "T-CM-INT-001", "name": "Integrate Hooks", "priority": "CRITICAL"},
    {"id": "T-CM-META-001", "name": "Test Coordination", "priority": "CRITICAL"},
    ...
  ]
}
```

**Alternative (Direct API):**
```bash
curl http://136.112.123.243:3000/api/tasks/available \
    -H "Content-Type: application/json" \
    -d '{"project": "central-mcp", "agent": "B"}'
```

---

### **STEP 3: Claim Task via Central-MCP**

**Using MCP Tool:**
```
Tool: claim_task
Arguments: {"taskId": "T-CM-INT-001"}

Effect:
• Database UPDATE: status = 'IN_PROGRESS'
• Database UPDATE: claimed_by = 'Agent-B-session-XYZ'
• Database UPDATE: started_at = CURRENT_TIMESTAMP
• Trigger fires: INSERT INTO task_events
• Dashboard updates in real-time
```

**Verification:**
```bash
# Check task status in database
sqlite3 data/registry.db "SELECT id, status, claimed_by FROM tasks WHERE id='T-CM-INT-001';"

# Expected:
T-CM-INT-001|IN_PROGRESS|Agent-B-session-abc123
```

---

### **STEP 4: Execute Task (Connect Hooks to Central-MCP)**

**Task**: T-CM-INT-001 - Integrate Git Hooks with Central-MCP Task API

**Implementation:**
```bash
# Edit post-commit hook to notify Central-MCP
cat >> .git/hooks/post-commit << 'EOF'

# Notify Central-MCP of task completion (if batch completion detected)
if is_potential_batch_completion "$COMMIT_MSG" "$COMMIT_BODY"; then
    # Extract task ID from commit
    TASK_ID=$(echo "$COMMIT_MSG" | grep -oE 'T-[A-Z]+-[0-9]+' | head -1)

    if [ -n "$TASK_ID" ]; then
        # Notify Central-MCP
        curl -X POST http://136.112.123.243:3000/api/tasks/complete \
            -H "Content-Type: application/json" \
            -d "{
                \"taskId\": \"$TASK_ID\",
                \"commitHash\": \"$COMMIT_HASH\",
                \"completionNotes\": \"Completed via git commit\"
            }" 2>/dev/null || echo "⚠️  Central-MCP notification failed"
    fi
fi
EOF
```

---

### **STEP 5: Report Progress to Central-MCP**

**Using MCP Tool:**
```
Tool: report_progress
Arguments: {
  "taskId": "T-CM-INT-001",
  "progress": 75,
  "notes": "Hook integration code written, testing remaining"
}

Effect:
• Database UPDATE: actual_minutes updated
• Progress logged
• Dashboard shows 75% complete
• Loop 4 (Progress Monitor) tracks update
```

---

### **STEP 6: Complete Task via Central-MCP**

**After verification, mark complete:**
```
Tool: complete_task
Arguments: {
  "taskId": "T-CM-INT-001",
  "completionNotes": "Git hooks now call Central-MCP API on batch completions. Tested and verified working."
}

Effect:
• Database UPDATE: status = 'COMPLETED', completed_at = NOW
• Trigger: satisfy_dependencies_on_completion fires
• Dependent tasks (T-CM-INT-002) auto-unblock
• Task event logged
• Dashboard updates
```

---

## 🎯 PRIORITY EXECUTION ORDER

### **Day 1 - Critical Path (2 hours):**

**1. T-CM-INT-001** (15 min) - **DO FIRST!**
   - Integrate hooks with Central-MCP API
   - This enables all future automation
   - Agent D (Integration)

**2. T-CM-META-001** (1 hour) - **VALIDATION**
   - Test complete agent lifecycle
   - Prove Central-MCP coordination works
   - Agent B (Architecture)
   - **This gives us the greatest peace of mind!**

**3. T-CM-GIT-002** (30 min) - **CRITICAL**
   - Fix VM synchronization
   - Enables proper 3-way consistency
   - Agent D (Integration)

**4. T-CM-GIT-001** (30 min) - **CLEANUP**
   - Delete 4 legacy repositories
   - Clean GitHub ecosystem
   - Agent B (Architecture)

### **Day 2 - Completion (4 hours):**

**5. T-CM-CI-001** (1 hour)
   - Fix deploy workflow
   - Enable automated deployments
   - Agent D (Integration)

**6. T-CM-VER-001** (30 min)
   - Verify merged repo integrity
   - Ensure zero data loss
   - Agent B (Architecture)

**7. T-CM-GIT-003** (2 hours)
   - Create 26 missing repos
   - Complete GitHub backup
   - Agent B (Architecture)

**8. T-CM-INT-002** (30 min)
   - Activate context ingestion
   - Auto-update knowledge base
   - Agent C (Backend)

---

## 🤖 USING CENTRAL-MCP TO COMMAND AGENT

### **Method 1: Via MCP Tools (If Configured in Claude Code)**

If Central-MCP MCP server is configured in Claude Code:

```
User: "Get available tasks from Central-MCP"

Claude: Uses get_available_tasks tool
        → Shows 8 tasks

User: "Claim task T-CM-INT-001"

Claude: Uses claim_task tool
        → Task marked IN_PROGRESS
        → Begins execution

Claude: Executes task, reports progress
        Uses report_progress tool
        → Dashboard updates in real-time

Claude: Completes work
        Uses complete_task tool
        → Task marked COMPLETED
        → Next task auto-unblocks
```

### **Method 2: Via MCP Client Bridge (Current Setup)**

```bash
# Terminal 1: Start bridge
node scripts/mcp-client-bridge.js

# Terminal 2: Use Central-MCP API
curl http://136.112.123.243:3000/api/tasks/available

# Claude Code: Execute task normally
# Post-commit hook: Notifies Central-MCP automatically
```

### **Method 3: Via Dashboard (Visual)**

```
1. Open: http://136.112.123.243:3002
2. View tasks in dashboard
3. Click "Assign to Agent B"
4. Agent receives notification
5. Agent executes
6. Reports back via API
```

---

## 📊 TRACKING PREVIOUS TASKS + NEW TASKS

### **Consolidation Strategy:**

```sql
-- Query ALL tasks (previous + new)
SELECT
    id,
    name,
    status,
    priority,
    project_id,
    CASE
        WHEN project_id = 'localbrain' THEN 'LocalBrain'
        WHEN project_id = 'central-mcp' THEN 'Central-MCP'
        ELSE 'Other'
    END as project_group
FROM tasks
ORDER BY
    priority DESC,
    CASE status
        WHEN 'IN_PROGRESS' THEN 1
        WHEN 'READY' THEN 2
        WHEN 'PENDING' THEN 3
        WHEN 'BLOCKED' THEN 4
        WHEN 'COMPLETED' THEN 5
    END;
```

**Result**:
- LocalBrain tasks: 10+ tasks (UI, Design, Backend work)
- Central-MCP tasks: 8 tasks (Git consolidation, Integration)
- **Total**: 18+ tasks in unified registry
- **All trackable** via Central-MCP!

---

## ✅ INTEGRATION CHECKLIST

### **To Achieve Full Integration:**

- [x] Tasks inserted into Central-MCP database
- [x] MCP connection tested and working
- [x] Agent communication protocol verified
- [ ] Use MCP tools to claim and execute tasks
- [ ] Hook calls Central-MCP API on completion
- [ ] Verify task status updates automatically
- [ ] Test complete agent lifecycle
- [ ] Dashboard reflects all changes

**Current Integration**: 60%
**After Using MCP Tools**: 95%

---

## 🚀 IMMEDIATE NEXT STEP

### **Execute T-CM-META-001 First!**

This task TESTS the entire system:
1. Agent connects to Central-MCP
2. Agent receives task list
3. Agent claims a task
4. Agent executes work
5. Agent reports progress
6. Agent completes task
7. Central-MCP validates
8. Task auto-unblocks dependents

**If this works**: ✅ We PROVE Central-MCP coordinates agents!
**If this fails**: ❌ We discover actual integration gaps!

**This ONE test gives us the greatest peace of mind!**

---

## 🎯 THE VISION REALIZED

```
Ground Agent (MacBook Claude Code)
         ↕ WebSocket
Central-MCP (Google Cloud VM)
         ↕ Task Registry
Complete Distributed Intelligence

WHERE:
• Agent discovers tasks automatically
• Central-MCP coordinates execution
• Progress tracked in real-time
• Validation automated
• Git commits trigger updates
• No manual tracking needed

RESULT:
✅ Autonomous multi-agent coordination
✅ Zero manual intervention
✅ Complete workflow integration
✅ Central-MCP fulfilling its purpose!
```

**Let's test T-CM-META-001 to PROVE this works!** 🚀
