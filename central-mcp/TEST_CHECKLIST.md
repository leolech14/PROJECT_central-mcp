# ✅ TEST CHECKLIST - Fresh Claude Agent

## 🎯 WHAT TO EXPECT

**When fresh Claude agent starts in new terminal:**

### Step 1: Agent Loads Context (Automatic)

```
✅ Reads ~/.claude/CLAUDE.md (global)
   → Sees "CENTRAL-MCP QUICK CONNECTION" at top
   → Gets connection command
   → Knows VM URL: http://34.41.115.199:3000

✅ Reads PROJECT_central-mcp/CLAUDE.md (project-specific)
   → Gets complete project overview
   → Sees 6/6 loops active
   → Knows their role (Agent B if Sonnet)
   → Sees their tasks
```

### Step 2: Agent Can Self-Orient

**Agent should be able to answer:**
- ✅ "What project am I in?" → PROJECT_central-mcp
- ✅ "What's my role?" → Design System Specialist (Agent B)
- ✅ "What should I do?" → Check tasks T-CM-003, T-CM-021, T-OB-001
- ✅ "Where's Central-MCP?" → http://34.41.115.199:3000
- ✅ "What's the project status?" → 45% complete, 6/6 loops active

### Step 3: Agent Can Connect (If Needed)

**If agent wants to connect:**
```
Uses: agent_connect or connect_to_mcp tool
Central-MCP responds with visual schema
Agent gets complete orientation
```

---

## 🧪 TEST SCENARIOS

### TEST 1: Basic Orientation

**Ask agent:** "What project are you in and what should you do?"

**Expected:**
```
"I'm in PROJECT_central-mcp (Project 0), the auto-proactive
intelligence system. I'm Agent B, Design System Specialist.
My tasks are:
- T-CM-003: Complete Loop 3 (Spec Generation)
- T-CM-021: Integrate Anthropic API
- T-OB-001: Orchestra.blue User Interview

The system is 45% complete with 6/6 auto-proactive loops active."
```

### TEST 2: System Understanding

**Ask agent:** "Explain the Central-MCP system"

**Expected:**
```
Agent describes:
- Auto-proactive engine (6 loops)
- Conversation intelligence
- Task coordination
- Project 0, 1, 2 hierarchy
- Current operational status
```

### TEST 3: Ready to Work

**Ask agent:** "What should we build first?"

**Expected:**
```
"Based on my assigned tasks, T-CM-021 (Integrate Anthropic API)
is P0-CRITICAL and would enable Loop 3 full spec generation.
This unlocks the 95% time savings. Should I start on this?"
```

---

## ✅ SUCCESS CRITERIA

**Agent demonstrates:**
- ✅ Knows who they are (Agent B, Design Specialist)
- ✅ Knows where they are (PROJECT_central-mcp, Project 0)
- ✅ Knows what to do (specific tasks)
- ✅ Knows system status (45%, 6/6 loops)
- ✅ Knows how to connect (if needed)
- ✅ NO CONFUSION!

**If all ✅: CONTEXT IS SEAMLESS!** 🎆

---

## 🎯 QUICK VERIFICATION

**Ask agent to run:**
```
curl -s http://34.41.115.199:3000/health
```

**Should get:**
```json
{
  "status": "healthy",
  "uptime": 1613,
  "features": {"a2a": true, "vmTools": true}
}
```

**If yes: SYSTEM IS LIVE AND READY!** ✅

---

**READY FOR TEST!** 🚀
