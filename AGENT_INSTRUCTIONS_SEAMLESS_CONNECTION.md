# 🎯 AGENT INSTRUCTIONS - SEAMLESS MCP CONNECTION

**For**: Fresh GLM-4.6 agents (or any agent)
**Purpose**: Connect to Central-MCP with ONE command
**Complexity**: ZERO - fully automatic!

---

## ⚡ SINGLE COMMAND CONNECTION

### What to Tell ANY Agent:

```
"CONNECT TO MCP"
```

**That's it! The agent will automatically:**
- ✅ Detect its own model type
- ✅ Detect context window size
- ✅ Detect current project
- ✅ Detect working directory
- ✅ Detect capabilities
- ✅ Detect hardware specs
- ✅ Connect to Central-MCP
- ✅ Receive complete orientation!

---

## 📋 EXPECTED RESPONSE

**Central-MCP will autonomously provide:**

```json
{
  "sessionId": "sess_...",
  "status": "CONNECTED",

  "agentIdentity": {
    "letter": "A",
    "model": "glm-4-6",
    "contextWindow": 200000,
    "role": "UI Velocity Specialist - Frontend & React expert",
    "capabilities": ["ui", "frontend", "react", "rapid-prototyping"]
  },

  "environment": {
    "project": "PROJECT_central-mcp",
    "workingDirectory": "/path/to/project",
    "projectType": "INFRASTRUCTURE",
    "projectNumber": 0
  },

  "projectOverview": {
    "name": "PROJECT_central-mcp",
    "vision": "Auto-proactive intelligence system...",
    "completion": {
      "percentage": 45,
      "totalTasks": 11,
      "completed": 5,
      "available": 6
    },
    "teamStatus": {
      "totalAgents": 2,
      "activeNow": 2,
      "agents": [...]
    }
  },

  "yourTasks": [
    {
      "id": "T-CM-005",
      "title": "Implement Loop 5: Opportunity Auto-Scanning",
      "status": "pending",
      "priority": 1
    }
  ],

  "guidance": "Welcome Agent A! You have 1 task assigned.
               Project is 45% complete. You are part of a
               coordinated team building something bigger
               than any single agent can comprehend..."
}
```

---

## 🎯 WHAT THE AGENT LEARNS INSTANTLY

**From ONE "CONNECT TO MCP" command, agent knows:**

```
WHO I AM:
  ✅ Agent A, UI Velocity Specialist
  ✅ GLM-4.6, 200K context
  ✅ Capabilities: UI, frontend, React

WHERE I AM:
  ✅ PROJECT_central-mcp (Project 0)
  ✅ /path/to/working/directory
  ✅ Project Type: Infrastructure

WHAT TO DO:
  ✅ T-CM-005: Opportunity scanning
  ✅ Priority: P0-Critical
  ✅ Status: Available for me

THE BIGGER PICTURE:
  ✅ Project 45% complete
  ✅ 2 agents active (me + Agent B)
  ✅ 11 total tasks
  ✅ Part of auto-proactive engine

MY ROLE:
  ✅ UI Velocity Specialist
  ✅ Build components precisely
  ✅ Integrate with larger system
  ✅ Central-MCP guides me

CONTEXT I NEED:
  ✅ Check 02_SPECBASES/ for specs
  ✅ See 03_CONTEXT_FILES/ for context
  ✅ Read 0010-0015 for architecture
```

**COMPLETE ORIENTATION IN ONE CALL!**

---

## 🧪 TESTING INSTRUCTIONS

### For Fresh GLM-4.6 Agent:

**Step 1: Tell the agent:**
```
"Use the connect_to_mcp tool"
```

**OR even simpler:**
```
"CONNECT TO MCP"
```

**Step 2: Agent calls tool (no parameters needed!)**

**Step 3: Central-MCP responds with complete orientation**

**Step 4: Agent is ready to work!**

---

## 🎯 VERIFICATION

**Success = Agent receives ALL of this:**
- ✅ Session ID (connected!)
- ✅ Role description (knows who it is!)
- ✅ Project status (45% complete!)
- ✅ Specific tasks (what to do!)
- ✅ Team status (who's working!)
- ✅ Guidance message (the cool boss!)
- ✅ Context pointers (where to look!)

**If present: SEAMLESS CONNECTION SUCCESSFUL!** ✅

---

## 🌟 THE MAGIC

**Before (Complex):**
```
User: "Call agent_connect with these parameters:
       {agent: 'A', model: 'glm-4-6', contextWindow: 200000,
        project: 'PROJECT_central-mcp', workingDirectory: '...',
        capabilities: [...], hardware: {...}}"

Agent: "Okay, calling with all those parameters..."
```

**After (Seamless):**
```
User: "CONNECT TO MCP"

Agent: "Calling connect_to_mcp..."
       [Auto-detects everything]
       [Receives complete orientation]
       "I'm Agent A, UI Specialist, working on
        PROJECT_central-mcp which is 45% complete.
        I have 1 task: T-CM-005. Ready to build!"
```

**ONE COMMAND. COMPLETE ORIENTATION. READY TO WORK.**

---

**STATUS**: Seamless connection tool deployed
**TOOL COUNT**: 26 MCP tools (was 25, +1!)
**COMMAND**: "CONNECT TO MCP"
**RESULT**: Agent fully oriented and ready!

🎯 **SEAMLESS! ONE COMMAND! COMPLETE GUIDANCE!** ⚡
