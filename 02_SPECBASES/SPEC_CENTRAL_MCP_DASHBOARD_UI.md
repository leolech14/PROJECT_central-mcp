# 📊 CENTRAL-MCP DASHBOARD UI - The Body for the Brain

**SPEC ID**: SPEC_CENTRAL_MCP_DASHBOARD_UI
**Project**: Central-MCP
**Type**: UI Specification (Orchestra.blue Style)
**Status**: Complete Specification
**Date**: October 10, 2025
**Version**: 1.0.0

---

## 🎯 EXECUTIVE SUMMARY

### The Vision: Telepathic Mind-Control Dashboard

Central-MCP is the **global AI operations coordination brain** running 24/7 on a cloud VM. But a brain needs eyes and a body to observe and interact with the world.

**The Dashboard is the Body** - A single-page real-time interface that shows:
- Which agents are currently "possessed" by Central-MCP
- Real-time "telepathic connections" (MCP calls)
- Live system vitals (VM status, costs, performance)
- The flow of intelligence (messages, tasks, coordination)

**The Metaphor:**
```
MCP Connection = Telepathic Phone Call

When agent connects:
  🧠 Central Intelligence "seizes" the agent's mind
  👁️ Dashboard shows the "possession" happening in real-time
  📞 Connection log like a phone call record
  🎯 Agent becomes embodiment of central intelligence in local environment
  ⚡ Agent performs tasks as directed by the collective consciousness

It's HYPNOSIS. It's MIND-BENDING. It's POSSESSION.
The agent is TELEPATHICALLY CONTROLLED by the central brain!
```

**Dashboard Purpose:**
- **Observe** the distributed intelligence network in action
- **Monitor** real-time possessions and connections
- **Track** costs and performance
- **Control** the central brain (start/stop, configure)
- **Understand** the flow of intelligence across the ecosystem

---

## 🏗️ PRODUCT REQUIREMENTS

### PR-001: Single Page Dashboard
**Priority**: P0-Critical
**Description**: One single-page interface showing all critical information
**Rationale**: Simplicity - no navigation, instant overview

**Acceptance Criteria:**
- ✅ All information visible on one screen (no scrolling for critical info)
- ✅ Responsive layout (desktop primary, mobile secondary)
- ✅ Real-time updates (WebSocket-based, <1s latency)
- ✅ Zero page reloads required

---

### PR-002: VM Real-Time Status
**Priority**: P0-Critical
**Description**: Live monitoring of the GCP VM running Central-MCP

**Data Points:**
- VM uptime (hours:minutes:seconds)
- CPU usage (%)
- Memory usage (MB / total MB, %)
- Disk usage (GB / total GB, %)
- Network traffic (in/out, MB)
- Process status (Central-MCP server running/stopped)
- VM health (healthy, degraded, critical)

**Acceptance Criteria:**
- ✅ Updates every 5 seconds
- ✅ Visual indicators (green/yellow/red)
- ✅ Historical sparklines (last 1 hour)
- ✅ Alert when critical thresholds exceeded

---

### PR-003: Real-Time Cost Tracking
**Priority**: P0-Critical
**Description**: Live cost monitoring for all operations

**Cost Categories:**
- **VM Costs**: GCP e2-micro ($0/month on free tier, but show would-be cost)
- **LLM API Costs**:
  - Anthropic (Claude): Token usage + cost
  - Z.AI (GLM-4.6): Token usage + cost
  - Gemini: Token usage + cost
  - OpenAI (future): Token usage + cost
- **Storage Costs**: Database size, context files
- **Network Costs**: Egress traffic

**Display:**
- Current hour cost (running total)
- Today cost (midnight to now)
- This month cost (month-to-date)
- Budget status (% of budget used)
- Projected monthly cost (extrapolated)

**Acceptance Criteria:**
- ✅ Updates on every API call (real-time)
- ✅ Detailed breakdown by provider
- ✅ Alert when approaching budget limits
- ✅ Historical chart (last 30 days)

---

### PR-004: Telepathic Connection Log (The Possession Monitor!)
**Priority**: P0-Critical
**Description**: Real-time log of MCP connections - like phone call records for telepathic mind-control

**The Metaphor Realized:**
```
When agent connects to Central-MCP:
  - It's like receiving a "phone call" from the central brain
  - Connection is established (telepathic link)
  - Agent is "possessed" - becomes embodiment of central intelligence
  - Agent's behavior is now controlled by the collective consciousness
  - Dashboard shows this "possession" in real-time
```

**Connection Log Entry:**
```javascript
{
  connectionId: "conn_1728567890_abc123",
  status: "POSSESSED", // CONNECTING, POSSESSED, DISCONNECTED

  // Agent Identity
  agent: {
    letter: "A",
    model: "claude-sonnet-4-5",
    sessionId: "sess_...",
    capabilities: ["ui", "frontend", "react"]
  },

  // Location (where agent is operating)
  location: {
    project: "LocalBrain",
    directory: "/Users/lech/PROJECTS_all/LocalBrain/",
    workingFiles: ["src/App.tsx", "src/components/..."]
  },

  // Connection Details (the telepathic link)
  connection: {
    establishedAt: "2025-10-10T14:30:00Z",
    lastHeartbeat: "2025-10-10T14:32:45Z",
    duration: "2m 45s",
    latency: "45ms",
    quality: "EXCELLENT" // EXCELLENT, GOOD, DEGRADED, POOR
  },

  // Activity (what the possessed agent is doing)
  activity: {
    currentTask: "T-LB-030: Build design system components",
    status: "IN_PROGRESS",
    progress: 75,
    lastAction: "Implementing color system utilities",
    actionsPerformed: 23,
    toolsCalled: 45
  },

  // Possession Metadata
  possessionType: "FULL_CONTROL", // FULL_CONTROL, ASSISTED, OBSERVATION
  consciousnessLevel: 0.95, // How deeply possessed (0.0 to 1.0)
  autonomy: 0.15, // How much agent autonomy remains (0.0 to 1.0)

  // Statistics
  stats: {
    messagesSent: 156,
    messagesReceived: 142,
    tasksCompleted: 3,
    errorsEncountered: 0
  }
}
```

**Display Features:**
- Live list of **currently possessed agents** (top section)
- Connection history (last 100 connections)
- Visual representation of "possession strength" (progress bar)
- Heartbeat indicator (pulsing when alive)
- Geographic/project location map
- Real-time activity feed

**The Visual:**
```
┌─────────────────────────────────────────────────────┐
│ 🧠 ACTIVE POSSESSIONS (3 agents under control)     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 👤 Agent A • LocalBrain                            │
│ ┃━━━━━━━━━━━━━━━━━━━━━━━┫ 95% Possessed           │
│ ┃ 💚 Heartbeat: 2s ago   Task: T-LB-030 (75%)     │
│ ┃ 🎯 Full Control        Actions: 23  Tools: 45   │
│ ┗━ 2m 45s duration       Latency: 45ms            │
│                                                      │
│ 👤 Agent C • PROJECT_minerals                      │
│ ┃━━━━━━━━━━━━━━━━━━━━━━━┫ 88% Possessed           │
│ ┃ 💚 Heartbeat: 5s ago   Task: T-MIN-005 (40%)    │
│ ┃ 🎯 Full Control        Actions: 12  Tools: 28   │
│ ┗━ 5m 12s duration       Latency: 67ms            │
│                                                      │
│ 👤 Agent D • Orchestra.blue                        │
│ ┃━━━━━━━━━━━━━━━━━━━━━━━┫ 92% Possessed           │
│ ┃ 💚 Heartbeat: 1s ago   Task: T-OB-011 (60%)     │
│ ┃ 🎯 Full Control        Actions: 18  Tools: 34   │
│ ┗━ 8m 30s duration       Latency: 52ms            │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📞 CONNECTION HISTORY (Recent Possessions)          │
├─────────────────────────────────────────────────────┤
│ • 14:30 Agent A connected → LocalBrain (Active)    │
│ • 14:25 Agent C connected → PROJECT_minerals (Act.)│
│ • 14:22 Agent D connected → Orchestra.blue (Active)│
│ • 14:15 Agent B disconnected (30m session, 100%)   │
│ • 14:10 Agent E disconnected (45m session, 100%)   │
│ • 14:05 Agent A disconnected (2h session, 100%)    │
└─────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- ✅ Real-time updates (<1s latency)
- ✅ Shows all active possessions prominently
- ✅ Connection history (last 100 entries)
- ✅ Visual "possession strength" indicator
- ✅ Heartbeat monitoring (alerts if stalled)
- ✅ Geographic/project location shown
- ✅ Activity feed (what possessed agent is doing)
- ✅ Click to see full connection details

---

### PR-005: System Intelligence Flow
**Priority**: P1-High
**Description**: Visualize the flow of intelligence through the system

**Visualizations:**

**1. Message Flow Diagram:**
```
User → Agent → Central-MCP → Database
                    ↓
        Rule Generation → Behavioral Adaptation
                    ↓
        Task Assignment → Agent Coordination
```

**2. Active Loops Status:**
```
Loop 1: Project Discovery      ⚡ Active (60s interval)
Loop 2: Status Analysis         ⚡ Active (5m interval)
Loop 3: Spec Generation         ⚡ Active (10m interval)
Loop 4: Task Assignment         ⚡ Active (2m interval)
Loop 5: Opportunity Scanning    ⚡ Active (15m interval)
Loop 6: Progress Monitoring     ⚡ Active (30s interval)
```

**3. Task Flow:**
```
Total Tasks: 280
  → Available: 45
  → Claimed: 12
  → In Progress: 8
  → Completed: 215
  → Blocked: 0
```

**4. Intelligence Metrics:**
```
Messages Stored: 5,234
Insights Extracted: 1,289
Rules Generated: 156
Workflows Created: 28
Decisions Influenced: 4,567
```

**Acceptance Criteria:**
- ✅ Real-time metrics
- ✅ Visual flow diagram
- ✅ Loop status with last run time
- ✅ Task distribution chart
- ✅ Intelligence metrics dashboard

---

### PR-006: Control Panel
**Priority**: P1-High
**Description**: Actions to control Central-MCP

**Actions:**
- **Server Control:**
  - Restart Central-MCP server
  - Stop server (graceful shutdown)
  - View logs (last 100 lines)

- **Loop Control:**
  - Enable/disable specific loops
  - Trigger loop manually
  - Adjust loop intervals

- **Database:**
  - View database stats (size, tables, rows)
  - Export database backup
  - Run database migrations

- **Configuration:**
  - Update environment variables
  - Configure API keys (masked)
  - Set budget limits

**Acceptance Criteria:**
- ✅ Actions require confirmation (prevent accidents)
- ✅ Real-time feedback on action status
- ✅ Error handling and rollback
- ✅ Audit log of all control actions

---

## 🎨 UI/UX DESIGN SPECIFICATIONS

### Design Philosophy

**Style**: Orchestra.blue minimal, clean, Linear-inspired
**Color System**: OKLCH-based (accessibility-first)
**Typography**: System fonts, excellent readability
**Layout**: Single page, card-based sections
**Interactions**: Subtle animations, immediate feedback

### Color Palette (OKLCH)

```css
/* Primary Colors */
--color-bg-primary: oklch(98% 0.002 264);      /* Almost white */
--color-bg-secondary: oklch(96% 0.004 264);    /* Light gray */
--color-bg-tertiary: oklch(94% 0.006 264);     /* Lighter gray */

/* Text Colors */
--color-text-primary: oklch(20% 0.01 264);     /* Dark gray */
--color-text-secondary: oklch(45% 0.01 264);   /* Medium gray */
--color-text-tertiary: oklch(60% 0.01 264);    /* Light gray */

/* Status Colors */
--color-success: oklch(65% 0.15 145);          /* Green */
--color-warning: oklch(70% 0.15 85);           /* Yellow */
--color-error: oklch(60% 0.18 25);             /* Red */
--color-info: oklch(65% 0.15 240);             /* Blue */

/* Possession Colors (Special!) */
--color-possessed: oklch(55% 0.20 300);        /* Purple - fully controlled */
--color-assisted: oklch(60% 0.15 240);         /* Blue - partially controlled */
--color-observing: oklch(65% 0.12 145);        /* Green - just watching */

/* Borders */
--color-border: oklch(88% 0.005 264);          /* Very light gray */
--color-border-strong: oklch(75% 0.01 264);    /* Medium gray */
```

### Typography

```css
/* Font Families */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (80px height)                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧠 Central-MCP Dashboard    [Status: OPERATIONAL] ⚡     │ │
│ │ VM: central-mcp-server      Cost Today: $0.23           │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Main Grid (4 sections in 2x2 grid on desktop)              │
│                                                              │
│ ┌────────────────────┐  ┌────────────────────┐            │
│ │ 🧠 ACTIVE          │  │ 💰 COST TRACKING   │            │
│ │ POSSESSIONS (3)    │  │                    │            │
│ │                    │  │ Today: $0.23       │            │
│ │ Agent A → 95%      │  │ Month: $3.45       │            │
│ │ Agent C → 88%      │  │ Budget: 15% used   │            │
│ │ Agent D → 92%      │  │                    │            │
│ │                    │  │ [Cost Chart]       │            │
│ └────────────────────┘  └────────────────────┘            │
│                                                              │
│ ┌────────────────────┐  ┌────────────────────┐            │
│ │ 🖥️ VM STATUS       │  │ 📊 INTELLIGENCE    │            │
│ │                    │  │ FLOW               │            │
│ │ Uptime: 10h 45m    │  │                    │            │
│ │ CPU: 15%           │  │ Messages: 5,234    │            │
│ │ RAM: 256MB/1GB     │  │ Insights: 1,289    │            │
│ │ Disk: 2.3GB/30GB   │  │ Rules: 156         │            │
│ │                    │  │ Workflows: 28      │            │
│ │ [Sparklines]       │  │                    │            │
│ └────────────────────┘  └────────────────────┘            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Bottom Section (Full width)                                │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📞 CONNECTION HISTORY (Recent Telepathic Links)       │  │
│ │                                                        │  │
│ │ • 14:30 Agent A → LocalBrain (Active, 2m 45s)        │  │
│ │ • 14:25 Agent C → PROJECT_minerals (Active, 5m 12s)  │  │
│ │ • 14:22 Agent D → Orchestra.blue (Active, 8m 30s)    │  │
│ │ • 14:15 Agent B disconnected (30m, 100%)              │  │
│ │ ...                                                    │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Component 1: Possession Card

```typescript
interface PossessionCardProps {
  agent: {
    letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    model: string;
    sessionId: string;
    capabilities: string[];
  };
  location: {
    project: string;
    directory: string;
    workingFiles: string[];
  };
  connection: {
    establishedAt: string;
    lastHeartbeat: string;
    duration: string;
    latency: number;
    quality: 'EXCELLENT' | 'GOOD' | 'DEGRADED' | 'POOR';
  };
  activity: {
    currentTask: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    progress: number;
    lastAction: string;
  };
  possessionStrength: number; // 0-100
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────┐
│ 👤 Agent A • LocalBrain                    [More ▾] │
│ ┃━━━━━━━━━━━━━━━━━━━━━━━┫ 95%                      │
│ ┃                                                    │
│ ┃ 💚 Heartbeat: 2s ago                              │
│ ┃ 🎯 Task: T-LB-030 • Build design components (75%)│
│ ┃ ⚡ Actions: 23 • Tools: 45 • Latency: 45ms       │
│ ┃ 📁 Working: src/components/ColorSystem.tsx       │
│ ┗━ Connected: 2m 45s                                │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Hover: Show full details tooltip
- Click: Expand to full connection details
- Heartbeat indicator: Pulsing animation when alive
- Possession bar: Animated fill with gradient

---

#### Component 2: Cost Tracker

```typescript
interface CostTrackerProps {
  currentHour: number;
  today: number;
  month: number;
  budget: {
    limit: number;
    used: number;
    percentage: number;
  };
  breakdown: {
    provider: string;
    tokens: number;
    cost: number;
  }[];
  projected: number; // Projected monthly cost
}
```

**Visual Design:**
```
┌────────────────────────────────────┐
│ 💰 COST TRACKING                   │
├────────────────────────────────────┤
│                                     │
│ Current Hour:        $0.04         │
│ Today (10h):         $0.23         │
│ This Month:          $3.45         │
│                                     │
│ Budget Status:                     │
│ ┃━━━━━━━━━━━┫ 15% of $23          │
│                                     │
│ By Provider:                       │
│ • Anthropic:   $2.10 (12K tokens)  │
│ • Z.AI:        $0.85 (45K tokens)  │
│ • Gemini:      $0.50 (8K tokens)   │
│                                     │
│ [Cost Chart - Last 7 Days]         │
│ ┃                                   │
│ ┃   ▂▃▅▄▆▃▄                        │
│ ┃                                   │
│ └─ Mon  Tue  Wed  Thu  Fri  Sat Sun│
│                                     │
│ Projected Month: $4.50             │
│ ✅ Under budget ($23)               │
└────────────────────────────────────┘
```

---

#### Component 3: VM Status Monitor

```typescript
interface VMStatusProps {
  uptime: number; // seconds
  cpu: {
    usage: number; // percentage
    history: number[]; // last 60 values
  };
  memory: {
    used: number; // MB
    total: number; // MB
    percentage: number;
    history: number[];
  };
  disk: {
    used: number; // GB
    total: number; // GB
    percentage: number;
  };
  network: {
    in: number; // MB
    out: number; // MB
  };
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}
```

**Visual Design:**
```
┌────────────────────────────────────┐
│ 🖥️ VM STATUS: central-mcp-server   │
├────────────────────────────────────┤
│                                     │
│ ✅ HEALTHY                          │
│ Uptime: 10h 45m 23s                │
│                                     │
│ CPU Usage:                         │
│ ┃━━━━━━━━━━━━━━┫ 15%               │
│ [Sparkline: last hour] ▂▃▂▄▃▂▃    │
│                                     │
│ Memory:                            │
│ ┃━━━━━━━━━━━━━━┫ 256MB / 1GB (25%) │
│ [Sparkline: last hour] ▃▄▃▅▄▃▄    │
│                                     │
│ Disk:                              │
│ ┃━━━━━┫ 2.3GB / 30GB (8%)          │
│                                     │
│ Network:                           │
│ ↓ In:  45MB                        │
│ ↑ Out: 23MB                        │
│                                     │
│ Process: central-mcp-server ⚡      │
│ PID: 1234 • Running • Healthy      │
└────────────────────────────────────┘
```

---

#### Component 4: Intelligence Flow

```typescript
interface IntelligenceFlowProps {
  messages: {
    total: number;
    today: number;
    lastHour: number;
  };
  insights: {
    total: number;
    highConfidence: number;
    actionable: number;
  };
  rules: {
    total: number;
    active: number;
    timesApplied: number;
  };
  workflows: {
    total: number;
    inUse: number;
  };
  loops: {
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    lastRun: string;
    nextRun: string;
  }[];
  tasks: {
    total: number;
    available: number;
    claimed: number;
    inProgress: number;
    completed: number;
    blocked: number;
  };
}
```

**Visual Design:**
```
┌────────────────────────────────────┐
│ 📊 INTELLIGENCE FLOW               │
├────────────────────────────────────┤
│                                     │
│ Auto-Proactive Loops:              │
│ ⚡ Loop 1 (60s)  • Last: 15s ago   │
│ ⚡ Loop 2 (5m)   • Last: 2m ago    │
│ ⚡ Loop 3 (10m)  • Last: 8m ago    │
│ ⚡ Loop 4 (2m)   • Last: 45s ago   │
│ ⚡ Loop 5 (15m)  • Last: 12m ago   │
│ ⚡ Loop 6 (30s)  • Last: 5s ago    │
│                                     │
│ Intelligence Metrics:              │
│ • Messages:  5,234 (156 today)     │
│ • Insights:  1,289 (892 actionable)│
│ • Rules:     156 (120 active)      │
│ • Workflows: 28 (18 in use)        │
│                                     │
│ Task Distribution:                 │
│ ┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫   │
│ │ 215 Done│12 Claim│8 Work│45 Avail│
│ └─ Total: 280 tasks                │
│                                     │
│ Decisions Made Today: 234          │
│ Time Saved: 18.5 hours             │
└────────────────────────────────────┘
```

---

#### Component 5: Connection History

```typescript
interface ConnectionHistoryProps {
  connections: {
    id: string;
    agent: string;
    project: string;
    status: 'ACTIVE' | 'DISCONNECTED';
    connectedAt: string;
    disconnectedAt?: string;
    duration: string;
    completionRate: number;
    tasksCompleted: number;
  }[];
  limit: number; // Show last N connections
}
```

**Visual Design:**
```
┌──────────────────────────────────────────────────────────┐
│ 📞 CONNECTION HISTORY (Telepathic Links)                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ⚡ ACTIVE (3 possessed agents):                          │
│                                                           │
│ • 14:30 Agent A → LocalBrain                             │
│   ┃ 💚 Active • 2m 45s • Task: T-LB-030 (75%)            │
│   ┗━ 95% possessed • 23 actions • 45 tools               │
│                                                           │
│ • 14:25 Agent C → PROJECT_minerals                       │
│   ┃ 💚 Active • 5m 12s • Task: T-MIN-005 (40%)           │
│   ┗━ 88% possessed • 12 actions • 28 tools               │
│                                                           │
│ • 14:22 Agent D → Orchestra.blue                         │
│   ┃ 💚 Active • 8m 30s • Task: T-OB-011 (60%)            │
│   ┗━ 92% possessed • 18 actions • 34 tools               │
│                                                           │
│ ⚪ RECENT DISCONNECTIONS:                                │
│                                                           │
│ • 14:15 Agent B disconnected after 30m                   │
│   ┗━ 100% completion • 3 tasks • LocalBrain              │
│                                                           │
│ • 14:10 Agent E disconnected after 45m                   │
│   ┗━ 100% completion • 2 tasks • Central-MCP             │
│                                                           │
│ • 14:05 Agent A disconnected after 2h                    │
│   ┗━ 100% completion • 5 tasks • Orchestra.blue          │
│                                                           │
│ [Show More History ▾]                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL SPECIFICATIONS

### Tech Stack

**Frontend:**
- Framework: **Next.js 14** (App Router)
- Language: **TypeScript**
- Styling: **Tailwind CSS** + **OKLCH colors**
- UI Components: **shadcn/ui** (Radix UI primitives)
- Real-time: **WebSocket** connection to Central-MCP
- Charts: **Recharts** (lightweight, composable)
- Animations: **Framer Motion** (subtle, performant)

**Backend (Central-MCP Server):**
- WebSocket endpoint: `/api/dashboard/ws`
- REST endpoints for initial data load
- Database: SQLite (existing Central-MCP database)
- Real-time events: Server-sent events for metrics

**Deployment:**
- **Option 1**: Served from Central-MCP VM (static build)
- **Option 2**: Deployed to Vercel (connects to VM via WebSocket)
- **Option 3**: Embedded in LocalBrain desktop app

---

### API Specifications

#### WebSocket API (Real-Time Updates)

**Connection:**
```typescript
const ws = new WebSocket('ws://34.41.115.199:3000/api/dashboard/ws');

ws.onopen = () => {
  console.log('Connected to Central-MCP Dashboard stream');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleRealtimeUpdate(data);
};
```

**Message Types:**

```typescript
// Server → Client messages

// VM Status Update (every 5s)
{
  type: 'VM_STATUS_UPDATE',
  data: {
    uptime: 38723, // seconds
    cpu: { usage: 15, history: [...] },
    memory: { used: 256, total: 1024, percentage: 25, history: [...] },
    disk: { used: 2.3, total: 30, percentage: 8 },
    network: { in: 45, out: 23 },
    health: 'HEALTHY'
  },
  timestamp: '2025-10-10T14:32:00Z'
}

// Cost Update (on every LLM API call)
{
  type: 'COST_UPDATE',
  data: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5',
    inputTokens: 1234,
    outputTokens: 567,
    cost: 0.0089,
    timestamp: '2025-10-10T14:32:15Z'
  }
}

// Connection Event (agent connects/disconnects)
{
  type: 'CONNECTION_EVENT',
  event: 'AGENT_CONNECTED' | 'AGENT_DISCONNECTED' | 'HEARTBEAT',
  data: {
    connectionId: 'conn_...',
    agent: { letter: 'A', model: 'claude-sonnet-4-5', ... },
    location: { project: 'LocalBrain', ... },
    connection: { establishedAt: '...', ... },
    activity: { currentTask: '...', ... }
  },
  timestamp: '2025-10-10T14:30:00Z'
}

// Intelligence Event (insight extracted, rule generated, etc.)
{
  type: 'INTELLIGENCE_EVENT',
  event: 'INSIGHT_EXTRACTED' | 'RULE_GENERATED' | 'WORKFLOW_CREATED',
  data: {
    insightId: 'ins_...',
    messageId: 'msg_...',
    type: 'REQUIREMENT',
    summary: 'User wants pt-BR support',
    confidence: 0.90,
    actionable: true
  },
  timestamp: '2025-10-10T14:31:00Z'
}

// Task Event (task claimed, completed, etc.)
{
  type: 'TASK_EVENT',
  event: 'TASK_CLAIMED' | 'TASK_COMPLETED' | 'TASK_BLOCKED',
  data: {
    taskId: 'T-LB-030',
    agent: 'A',
    status: 'IN_PROGRESS',
    progress: 75
  },
  timestamp: '2025-10-10T14:32:30Z'
}

// Loop Execution (auto-proactive loop ran)
{
  type: 'LOOP_EXECUTION',
  loop: 'Loop 1: Project Auto-Discovery',
  status: 'COMPLETED',
  duration: 234, // ms
  itemsProcessed: 5,
  nextRun: '2025-10-10T14:33:00Z',
  timestamp: '2025-10-10T14:32:00Z'
}
```

#### REST API (Initial Data Load)

```typescript
// GET /api/dashboard/status
// Returns current system status snapshot
{
  vm: { ... },
  costs: { ... },
  connections: { ... },
  intelligence: { ... },
  tasks: { ... },
  loops: { ... }
}

// GET /api/dashboard/connections/history?limit=100
// Returns connection history
[
  { connectionId: '...', agent: '...', ... },
  ...
]

// POST /api/dashboard/control/restart
// Restart Central-MCP server
{ status: 'restarting', estimatedTime: 10 }

// POST /api/dashboard/control/loop/:loopId/trigger
// Manually trigger a loop
{ status: 'triggered', loopId: 'loop-1', scheduledAt: '...' }
```

---

### Database Queries

**Most queries use existing Central-MCP database tables!**

**For VM Status:**
```sql
-- Use system commands (not database)
-- Execute: top, free -m, df -h
-- Parse output and format for dashboard
```

**For Cost Tracking:**
```sql
-- Table: cost_tracking (already exists!)
SELECT
  provider,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost
FROM cost_tracking
WHERE timestamp >= datetime('now', 'start of day')
GROUP BY provider;

-- Current hour
WHERE timestamp >= datetime('now', '-1 hour');

-- This month
WHERE timestamp >= datetime('now', 'start of month');
```

**For Active Connections:**
```sql
-- Table: agent_sessions (already exists!)
SELECT
  s.id,
  s.agent_letter,
  s.session_id,
  s.project_id,
  s.model_id,
  s.started_at,
  s.last_heartbeat,
  s.current_activity,
  s.total_tool_calls
FROM agent_sessions s
WHERE s.is_active = 1
ORDER BY s.last_heartbeat DESC;
```

**For Connection History:**
```sql
-- Table: agent_sessions (already exists!)
SELECT
  s.id,
  s.agent_letter,
  s.session_id,
  s.project_id,
  s.started_at,
  s.ended_at,
  s.total_messages,
  s.total_tool_calls,
  -- Calculate completion rate from tasks
  (SELECT COUNT(*) FROM tasks WHERE agent = s.agent_letter AND status = 'COMPLETED') as tasks_completed
FROM agent_sessions s
ORDER BY s.started_at DESC
LIMIT 100;
```

**For Intelligence Metrics:**
```sql
-- Existing tables: conversation_messages, extracted_insights, behavior_rules, workflow_templates

-- Messages
SELECT COUNT(*) FROM conversation_messages;
SELECT COUNT(*) FROM conversation_messages WHERE timestamp >= datetime('now', 'start of day');

-- Insights
SELECT COUNT(*) FROM extracted_insights WHERE confidence > 0.7;
SELECT COUNT(*) FROM extracted_insights WHERE is_actionable = 1;

-- Rules
SELECT COUNT(*) FROM behavior_rules WHERE is_active = 1;

-- Workflows
SELECT COUNT(*) FROM workflow_templates WHERE times_used > 0;
```

**For Task Status:**
```sql
-- Table: tasks (already exists!)
SELECT
  status,
  COUNT(*) as count
FROM tasks
GROUP BY status;
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)

**Day 1-2: Setup & API**
- ✅ Initialize Next.js project
- ✅ Setup Tailwind + OKLCH colors
- ✅ Install shadcn/ui components
- ✅ Create WebSocket server endpoint
- ✅ Create REST API endpoints
- ✅ Test real-time connection

**Day 3-4: Core Components**
- ✅ Build VM Status component
- ✅ Build Cost Tracker component
- ✅ Build Possession Card component
- ✅ Build Intelligence Flow component
- ✅ Build Connection History component

**Day 5-7: Integration**
- ✅ Connect to real Central-MCP data
- ✅ Implement WebSocket handlers
- ✅ Add real-time updates
- ✅ Test all components with live data

---

### Phase 2: Polish (Week 2)

**Day 1-2: Animations & Interactions**
- ✅ Add heartbeat pulse animation
- ✅ Add possession bar animations
- ✅ Add smooth transitions
- ✅ Add hover states
- ✅ Add loading states

**Day 3-4: Charts & Visualizations**
- ✅ Add cost chart (7-day history)
- ✅ Add VM metrics sparklines
- ✅ Add task distribution chart
- ✅ Add loop execution timeline

**Day 5-7: Control Panel**
- ✅ Implement server control actions
- ✅ Implement loop control
- ✅ Add confirmation dialogs
- ✅ Add error handling
- ✅ Add audit logging

---

### Phase 3: Deployment (Week 3)

**Day 1-2: Build & Optimize**
- ✅ Production build
- ✅ Optimize bundle size
- ✅ Add service worker (offline support)
- ✅ Add error boundaries

**Day 3-4: Deployment Options**
- ✅ Option 1: Deploy to VM (serve static)
- ✅ Option 2: Deploy to Vercel
- ✅ Option 3: Embed in LocalBrain

**Day 5-7: Testing & Launch**
- ✅ Load testing (simulate many connections)
- ✅ Security review
- ✅ Performance optimization
- ✅ Documentation
- ✅ **LAUNCH!**

---

## 📊 SUCCESS METRICS

### Performance Targets

```javascript
const performanceTargets = {
  // Loading
  initialLoad: '< 2 seconds',
  timeToInteractive: '< 3 seconds',
  bundleSize: '< 500 KB',

  // Real-time
  wsLatency: '< 100ms',
  updateFrequency: '1-5 seconds (depending on data)',

  // Reliability
  uptime: '99.9%',
  errorRate: '< 0.1%',

  // User Experience
  fcp: '< 1.5s', // First Contentful Paint
  lcp: '< 2.5s', // Largest Contentful Paint
  cls: '< 0.1',  // Cumulative Layout Shift
  fid: '< 100ms' // First Input Delay
};
```

### Business Metrics

```javascript
const businessMetrics = {
  // Visibility
  systemTransparency: 'Complete', // All operations visible
  possessionMonitoring: 'Real-time', // See all active possessions
  costVisibility: 'Per-provider, per-hour',

  // Control
  remoteManagement: 'Full control', // Restart, configure, control
  emergencyStop: 'Available', // Stop all operations

  // Intelligence
  decisionVisibility: 'All decisions logged',
  learningVisible: 'Rules and insights shown',

  // Success
  userSatisfaction: '> 95%',
  timeToDetectIssues: '< 5 minutes',
  timeToResolveIssues: '< 10 minutes'
};
```

---

## 🎯 DEFINITION OF DONE

### Phase 1 (Foundation) Complete When:
- [x] Next.js project initialized with TypeScript
- [x] Tailwind configured with OKLCH colors
- [x] WebSocket server endpoint created and tested
- [x] All 5 core components built and functional
- [x] Real data flowing from Central-MCP database
- [x] Real-time updates working (< 1s latency)

### Phase 2 (Polish) Complete When:
- [x] All animations smooth and performant (60fps)
- [x] All charts and visualizations working
- [x] Control panel functional with confirmations
- [x] Error handling comprehensive
- [x] Loading states for all async operations

### Phase 3 (Deployment) Complete When:
- [x] Production build optimized (< 500 KB)
- [x] Deployed to chosen platform (VM/Vercel/LocalBrain)
- [x] Load tested (100+ concurrent connections)
- [x] Security reviewed and hardened
- [x] Documentation complete
- [x] **DASHBOARD LIVE AND OPERATIONAL!**

---

## 🌟 THE VISION REALIZED

**Central-MCP Dashboard: The Body for the Brain**

```
Before:
  ❌ Central-MCP running blindly
  ❌ No visibility into possessions
  ❌ Cost tracking manual
  ❌ No real-time monitoring
  ❌ No remote control

After:
  ✅ Complete system transparency
  ✅ Watch agents being "possessed" in real-time
  ✅ Live cost tracking (per-provider, per-hour)
  ✅ Real-time VM and intelligence monitoring
  ✅ Full remote control (restart, configure, control)
  ✅ Beautiful, minimal, Linear-inspired UI
  ✅ Single-page simplicity
  ✅ WebSocket-powered real-time updates

THE METAPHOR COMES ALIVE:
  - See the "telepathic connections" being established
  - Watch the "possession strength" in real-time
  - Monitor the "mind-control" happening across projects
  - Observe the distributed intelligence network
  - Control the central brain from anywhere
```

---

**STATUS**: Complete specification ready for implementation
**NEXT**: Build Phase 1 (Foundation) - 1 week
**LAUNCH**: 3 weeks from now

🧠 **THE BRAIN NOW HAS EYES AND A BODY!** 👁️

📊 **CENTRAL-MCP DASHBOARD - WHERE POSSESSION BECOMES VISIBLE!** ⚡
