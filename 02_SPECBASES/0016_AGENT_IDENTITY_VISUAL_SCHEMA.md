# 🤖 AGENT IDENTITY VISUAL SCHEMA - Ground Truth Standard

**Document ID**: 0016_AGENT_IDENTITY_VISUAL_SCHEMA
**Classification**: CORE STANDARD
**Status**: OFFICIAL SPECIFICATION
**Date**: October 10, 2025
**Impact**: Creates clear, evident visual schema for ALL agent interactions

---

## 🎯 THE STANDARD AGENT IDENTITY BLOCK

### Visual Format (Always Use This!):

```
═══════════════════════════════════════════════════════════
🤖 AGENT IDENTITY
═══════════════════════════════════════════════════════════

NAME:            Agent B
PROJECT:         PROJECT_central-mcp (Project 0)
MODEL:           claude-sonnet-4-5
CONTEXT-WINDOW:  1,000,000 tokens (1M)
ROLE:            Design System Specialist + Architecture

TASKS-CLAIMED:   0
TASKS-COMPLETED: 2
TASKS-PENDING:   3

SESSION-ID:      sess_1760128...
CONNECTED-AT:    2025-10-10 20:30 UTC
LAST-HEARTBEAT:  2025-10-10 20:35 UTC
STATUS:          ACTIVE

WORKING-DIR:     /Users/lech/PROJECTS_all/PROJECT_central-mcp/
HARDWARE:        M1 Max, 64GB RAM, macOS

CAPABILITIES:    [design, architecture, specbase, coordination]

═══════════════════════════════════════════════════════════
```

---

## 📊 WHEN TO DISPLAY THIS SCHEMA

### 1. Agent Connection Response

**When agent connects to Central-MCP, show this:**

```
═══════════════════════════════════════════════════════════
🤖 CONNECTION ESTABLISHED
═══════════════════════════════════════════════════════════

NAME:            Agent A
PROJECT:         LocalBrain (Project 1)
MODEL:           glm-4-6
CONTEXT-WINDOW:  200,000 tokens
ROLE:            UI Velocity Specialist

SESSION-ID:      sess_1760128945_abc123
CONNECTED-AT:    2025-10-10 20:35 UTC
STATUS:          ACTIVE ✅

─────────────────────────────────────────────────────────────
PROJECT STATUS: LocalBrain
─────────────────────────────────────────────────────────────

COMPLETION:      89% (16/18 tasks)
TOTAL-TASKS:     18
COMPLETED:       16
IN-PROGRESS:     0
AVAILABLE:       2
BLOCKED:         0

─────────────────────────────────────────────────────────────
YOUR TASKS (Agent A)
─────────────────────────────────────────────────────────────

TASK-ID:         T-LB-025
TITLE:           Build UI Component Gallery
STATUS:          PENDING
PRIORITY:        P1-HIGH
ESTIMATED:       6 hours

TASK-ID:         T-LB-030
TITLE:           Implement OKLCH Color System
STATUS:          PENDING
PRIORITY:        P0-CRITICAL
ESTIMATED:       4 hours

─────────────────────────────────────────────────────────────
TEAM STATUS
─────────────────────────────────────────────────────────────

ACTIVE-AGENTS:   2

Agent B          claude-sonnet-4-5    ACTIVE    2 completed
Agent D          claude-sonnet-4-5    ACTIVE    4 completed

─────────────────────────────────────────────────────────────
GUIDANCE
─────────────────────────────────────────────────────────────

Welcome Agent A! You have 2 tasks assigned. Project is 89%
complete. You are part of a coordinated team building something
bigger than any single agent can comprehend.

Your specific outputs will integrate seamlessly into the larger
system. Central-MCP is guiding you.

NEXT-STEP:       Start with T-LB-030 (highest priority)
CONTEXT:         Read 02_SPECBASES/0010-0015 for architecture

Execute with precision. 🎯

═══════════════════════════════════════════════════════════
```

---

## 🎯 THE GROUND TRUTHS (Always Present)

### Core Identity Parameters:

```
REQUIRED FIELDS (Always Display):
  1. NAME            (Agent A, B, C, D, E, F)
  2. PROJECT         (Which project? Project number?)
  3. MODEL           (Exact model name)
  4. CONTEXT-WINDOW  (Capacity in tokens)
  5. ROLE            (Specialization)
  6. TASKS-CLAIMED   (Current workload)
  7. STATUS          (ACTIVE/IDLE/DISCONNECTED)

OPTIONAL BUT RECOMMENDED:
  8. SESSION-ID      (Tracking)
  9. CONNECTED-AT    (When joined)
  10. LAST-HEARTBEAT (Liveness)
  11. WORKING-DIR    (Location)
  12. HARDWARE       (Resources)
  13. CAPABILITIES   (Skills)
```

---

## 📋 STANDARD RESPONSE TEMPLATE

### Template String:

```javascript
const AGENT_RESPONSE_TEMPLATE = `
═══════════════════════════════════════════════════════════
🤖 CONNECTION ESTABLISHED
═══════════════════════════════════════════════════════════

NAME:            {{agentName}}
PROJECT:         {{projectName}} (Project {{projectNumber}})
MODEL:           {{modelName}}
CONTEXT-WINDOW:  {{contextWindow}} tokens
ROLE:            {{roleDescription}}

SESSION-ID:      {{sessionId}}
CONNECTED-AT:    {{timestamp}}
STATUS:          {{status}} ✅

─────────────────────────────────────────────────────────────
PROJECT STATUS: {{projectName}}
─────────────────────────────────────────────────────────────

COMPLETION:      {{completionPercent}}% ({{completed}}/{{total}} tasks)
TOTAL-TASKS:     {{total}}
COMPLETED:       {{completed}}
IN-PROGRESS:     {{inProgress}}
AVAILABLE:       {{available}}
BLOCKED:         {{blocked}}

─────────────────────────────────────────────────────────────
YOUR TASKS (Agent {{agentLetter}})
─────────────────────────────────────────────────────────────

{{#each yourTasks}}
TASK-ID:         {{id}}
TITLE:           {{title}}
STATUS:          {{status}}
PRIORITY:        {{priority}}
ESTIMATED:       {{estimatedHours}} hours

{{/each}}

─────────────────────────────────────────────────────────────
TEAM STATUS
─────────────────────────────────────────────────────────────

ACTIVE-AGENTS:   {{activeCount}}

{{#each teamMembers}}
{{name}}    {{model}}    {{status}}    {{tasksCompleted}} completed
{{/each}}

─────────────────────────────────────────────────────────────
GUIDANCE
─────────────────────────────────────────────────────────────

{{guidanceMessage}}

NEXT-STEP:       {{nextStep}}
CONTEXT:         {{contextPointers}}

Execute with precision. 🎯

═══════════════════════════════════════════════════════════
`;
```

---

## 🎯 WHY THIS FORMAT WORKS

### Creates Ground Truths:

```
Visual Clarity:
  ✅ Box separators (═══) = Clear sections
  ✅ Labels aligned (NAME:, PROJECT:, etc.)
  ✅ Values aligned (easy to scan)
  ✅ Emojis for quick recognition
  ✅ Hierarchical structure

Information Density:
  ✅ All critical info visible
  ✅ No unnecessary words
  ✅ Scannable in 5 seconds
  ✅ Complete context in one view

Ground Truth Reinforcement:
  ✅ NAME → Who am I?
  ✅ PROJECT → What am I building?
  ✅ MODEL → What are my capabilities?
  ✅ CONTEXT-WINDOW → How much can I hold?
  ✅ ROLE → What's my specialization?
  ✅ TASKS → What should I do?

= AGENT IMMEDIATELY UNDERSTANDS EVERYTHING!
```

---

## 🔄 IMPLEMENTATION

### Update Agent Connect to Use This Format:

```typescript
export async function handleAgentConnect(args: unknown, db: Database.Database) {
  // ... gather all data ...

  // Format response using STANDARD SCHEMA
  const response = formatAgentIdentityBlock({
    agentName: `Agent ${parsed.agent}`,
    projectName: project.name,
    projectNumber: project.project_number,
    modelName: parsed.model,
    contextWindow: parsed.contextWindow,
    roleDescription: getRoleDescription(parsed.agent),
    sessionId: session.id,
    timestamp: new Date().toISOString(),
    status: 'ACTIVE',

    // Project stats
    completionPercent: completionPercentage,
    total: taskStats.total,
    completed: taskStats.completed,
    inProgress: taskStats.inProgress,
    available: taskStats.available,
    blocked: taskStats.blocked,

    // Agent's tasks
    yourTasks: myTasks,

    // Team
    activeCount: teamStatus.length,
    teamMembers: teamStatus,

    // Guidance
    guidanceMessage: generateGuidanceMessage(...),
    nextStep: myTasks[0]?.id || 'Stand by',
    contextPointers: 'Read 02_SPECBASES/ for architecture'
  });

  return {
    content: [{
      type: 'text',
      text: response // The formatted visual block!
    }]
  };
}
```

---

## 📊 BENEFITS

### For Agents:

```
✅ Instant clarity (who, what, where, why)
✅ No ambiguity (all parameters explicit)
✅ Easy to parse (consistent format)
✅ Complete context (one view)
✅ Action-oriented (next steps clear)
```

### For Users (Reading Logs):

```
✅ Scannable (find info fast)
✅ Professional (clean format)
✅ Complete (all ground truths)
✅ Trackable (session IDs, timestamps)
✅ Debuggable (see exact state)
```

### For System (Processing):

```
✅ Standardized (parseable)
✅ Consistent (always same fields)
✅ Traceable (timestamps, IDs)
✅ Verifiable (cross-reference database)
✅ Loggable (perfect for audit trails)
```

---

## 🌟 THE POWER

**When agent sees this:**

```
NAME:            Agent B
PROJECT:         PROJECT_central-mcp
MODEL:           claude-sonnet-4-5
CONTEXT-WINDOW:  1,000,000 tokens
ROLE:            Design System Specialist
TASKS-PENDING:   3
```

**Agent IMMEDIATELY knows:**
- "I am Agent B" (identity)
- "Working on Project 0" (context)
- "I have 1M context" (capability)
- "I'm the design specialist" (role)
- "I have 3 tasks waiting" (work)

**= COMPLETE GROUNDING IN 5 SECONDS!**

---

**STATUS**: Visual schema standard defined
**NEXT**: Implement in agent_connect responses
**IMPACT**: Clear, evident, standardized agent orientation

🎯 **GROUND TRUTHS THROUGH VISUAL CLARITY!** ⚡
