# 🚀 COMPLETE RUNPOD INTEGRATION - ARCHITECTURE & DEPLOYMENT

**Date**: October 12, 2025
**Status**: READY FOR DEPLOYMENT
**Goal**: Unified control of GCP + RunPod infrastructure

---

## 🏗️ ARCHITECTURE DECISION: **GCP AS CONTROL HUB**

### The Optimal Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACCESS POINT                        │
│  Single Dashboard: http://central-mcp.com                   │
│  Sees: GCP VM + All RunPod pods unified                    │
└────────────────────┬────────────────────────────────────────┘
                     │ (WebSocket + HTTP API)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              CENTRAL-MCP BRAIN (GCP e2-micro)               │
│  Location: 34.41.115.199 (FREE TIER)                       │
│                                                              │
│  Responsibilities:                                          │
│    ✅ Coordination & orchestration                          │
│    ✅ Task registry & assignment                           │
│    ✅ Agent session tracking                               │
│    ✅ RunPod API monitoring                                │
│    ✅ Dashboard UI serving                                 │
│    ✅ WebSocket server                                     │
│    ✅ Database (SQLite)                                    │
│                                                              │
│  Tools:                                                     │
│    • get_runpod_status → Monitor all pods                  │
│    • control_pod → Start/stop pods                         │
│    • generate_image → Route to ComfyUI                     │
│    • 32+ other MCP tools                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ (RunPod API + SSH tunnels)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              RUNPOD PODS (HEAVY COMPUTE)                    │
│  Cost: $0.59-0.89/hour per pod (on-demand)                 │
│                                                              │
│  Pod 1: ComfyUI + 4 Agents                                 │
│    • ComfyUI (SDXL, LoRA, ControlNet)                      │
│    • Agent A (Coordinator) - tmux session                  │
│    • Agent B (Architecture) - tmux session                 │
│    • Agent C (Backend) - tmux session                      │
│    • Agent D (UI) - tmux session                           │
│    • SSH Port: 22 (via RunPod proxy)                       │
│    • ComfyUI Port: 8188                                    │
│    • Monitored via: RunPod API + SSH metrics               │
│                                                              │
│  Pod 2+ (Optional): Dedicated agent pods                   │
│    • Pure compute for agents                               │
│    • On-demand scaling                                     │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**GCP as Control Hub:**
- ✅ **Always On**: Free tier, $0/month
- ✅ **Stable**: Never stops, persistent database
- ✅ **Central View**: Single dashboard for everything
- ✅ **Cost Effective**: Only RunPod pays when working

**RunPod for Heavy Compute:**
- ✅ **Powerful**: GPUs + massive RAM/CPU
- ✅ **On-Demand**: Pay only when agents working
- ✅ **Scalable**: Add/remove pods as needed
- ✅ **Flexible**: Start/stop via API

**User Access Pattern:**
1. **Primary**: Access GCP dashboard (http://central-mcp.com)
2. **See Everything**: GCP + RunPod status unified
3. **Optional Direct SSH**: Can SSH to RunPod when needed
4. **Seamless**: No need to switch between interfaces

---

## 📊 WHAT DATA WE COLLECT FROM RUNPOD

### Real-Time Metrics (via RunPod API):
```typescript
{
  pod_id: string,
  name: string,
  status: 'RUNNING' | 'STOPPED' | 'IDLE',
  gpu_type: 'RTX 4090' | 'RTX 3090' | 'A6000',
  gpu_count: number,
  cost_per_hour: number,
  uptime_seconds: number,
  ports: [
    { public: 12345, private: 22, type: 'ssh' },
    { public: 12346, private: 8188, type: 'http' }
  ]
}
```

### System Metrics (via SSH):
```bash
# GPU utilization
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total

# CPU/RAM
htop --print-mode

# Disk usage
df -h

# Network
ifstat 1 1
```

### Agent Activity (via Central-MCP Database):
```typescript
{
  pod_id: string,
  agent_letter: 'A' | 'B' | 'C' | 'D',
  status: 'active' | 'working' | 'idle',
  current_task: string,
  last_heartbeat: Date,
  session_duration: number
}
```

### ComfyUI Status (via ComfyUI API):
```typescript
{
  pod_id: string,
  comfyui_endpoint: string,
  queue_length: number,
  running_workflows: number,
  models_loaded: string[],
  system_stats: {
    vram_used: number,
    vram_total: number
  }
}
```

---

## 🎯 DEPLOYMENT PLAN

### Phase 1: Install RunPod Integration Tools (15 minutes)

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# 1. Add RunPod API key (if not already done)
doppler secrets set RUNPOD_API_KEY "your-runpod-api-key"

# 2. Upload RunPod integration to VM
gcloud compute scp \
  src/tools/runpod/runpodIntegration.ts \
  central-mcp-server:/opt/central-mcp/src/tools/runpod/ \
  --zone=us-central1-a

# 3. Register tools in index.ts (see below)
```

### Phase 2: Update Central-MCP to Include RunPod Tools

**Add to `src/tools/index.ts`:**
```typescript
import {
  getRunPodStatus,
  getRunPodStatusTool,
  controlPod,
  controlPodTool
} from './runpod/runpodIntegration.js';

// In registerTools function, add:
const runpodTools = [
  {
    ...getRunPodStatusTool,
    handler: async () => getRunPodStatus()
  },
  {
    ...controlPodTool,
    handler: async (args: any) => controlPod(args.pod_id, args.action)
  }
];

// Update allTools:
const allTools = [...taskTools, ...intelligenceTools, ..., ...runpodTools];

// Update logger:
logger.info(`   - RunPod Management: ${runpodTools.length} 🚀 RUNPOD INTEGRATION ACTIVE`);
```

### Phase 3: Deploy RunPod Monitoring Loop

**Create `src/auto-proactive/RunPodMonitorLoop.ts`:**
```typescript
/**
 * Loop 10: RunPod Monitor
 * Interval: 60 seconds
 * Purpose: Monitor RunPod infrastructure and agent activity
 */

import { getRunPodStatus, savePodsToDB, savePodMetrics } from '../tools/runpod/runpodIntegration.js';
import { logger } from '../utils/logger.js';

export class RunPodMonitorLoop {
  private interval: number = 60000; // 60 seconds
  private timer?: NodeJS.Timeout;

  async start() {
    logger.info('🚀 Loop 10: RunPod Monitor starting...');

    // Run immediately
    await this.execute();

    // Schedule periodic execution
    this.timer = setInterval(() => this.execute(), this.interval);

    logger.info(`✅ Loop 10: Running every ${this.interval / 1000}s`);
  }

  async execute() {
    try {
      console.log('🚀 [Loop 10] Monitoring RunPod infrastructure...');

      const status = await getRunPodStatus();

      if (status.success) {
        console.log(`   ✅ ${status.summary.running_pods}/${status.summary.total_pods} pods running`);
        console.log(`   💰 Cost: $${status.summary.cost_per_hour.toFixed(2)}/hour`);
        console.log(`   🤖 ${status.summary.active_agents} agents active`);

        // Alert if costs are high
        if (status.summary.cost_per_hour > 5.00) {
          console.log(`   ⚠️  HIGH COST ALERT: $${status.summary.cost_per_hour}/hour`);
        }

        // Alert if pods are idle
        status.pods.forEach(pod => {
          if (pod.status === 'RUNNING' && pod.uptime_hours > 1) {
            // Check if agents are active on this pod
            const podAgents = status.agent_sessions.filter(a => a.pod_id === pod.id);
            if (podAgents.length === 0) {
              console.log(`   ⚠️  Pod ${pod.name} running but no active agents`);
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ [Loop 10] RunPod monitoring failed:', error);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      logger.info('🛑 Loop 10: RunPod Monitor stopped');
    }
  }
}
```

### Phase 4: Install Terminal System on RunPod

**SSH to your ComfyUI pod:**
```bash
# Get pod SSH details from RunPod dashboard
ssh root@ssh.runpod.io -p YOUR_PORT

# Install dependencies
apt-get update
apt-get install -y tmux gotty

# Create terminal sessions
tmux new-session -d -s agent-a
tmux new-session -d -s agent-b
tmux new-session -d -s agent-c
tmux new-session -d -s agent-d

# Start gotty for web access (optional)
nohup gotty --address 0.0.0.0 --port 9001 --permit-write tmux attach -t agent-a &
nohup gotty --address 0.0.0.0 --port 9002 --permit-write tmux attach -t agent-b &
nohup gotty --address 0.0.0.0 --port 9003 --permit-write tmux attach -t agent-c &
nohup gotty --address 0.0.0.0 --port 9004 --permit-write tmux attach -t agent-d &

# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify
tmux list-sessions
claude-code --version
```

### Phase 5: Update Dashboard to Show RunPod Data

**Add to Dashboard (`central-mcp-dashboard/app/components/monitoring/RealTimeRegistry.tsx`):**

```typescript
// Add state for RunPod data
const [runpodData, setRunpodData] = useState<any>(null);

// Fetch RunPod status
useEffect(() => {
  const fetchRunPodStatus = async () => {
    try {
      const response = await fetch('http://34.41.115.199:3000/api/runpod/status');
      const data = await response.json();
      setRunpodData(data);
    } catch (error) {
      console.error('Failed to fetch RunPod status:', error);
    }
  };

  fetchRunPodStatus();
  const interval = setInterval(fetchRunPodStatus, 30000); // Every 30s
  return () => clearInterval(interval);
}, []);

// Add RunPod section to dashboard
<div className="glassmorphic-panel p-6">
  <h3 className="text-xl font-bold mb-4">🚀 RunPod Infrastructure</h3>

  <div className="grid grid-cols-3 gap-4 mb-4">
    <div className="text-center">
      <div className="text-3xl font-bold text-accent-primary">
        {runpodData?.summary.running_pods || 0}
      </div>
      <div className="text-sm text-text-secondary">Active Pods</div>
    </div>
    <div className="text-center">
      <div className="text-3xl font-bold text-accent-secondary">
        ${runpodData?.summary.cost_per_hour?.toFixed(2) || '0.00'}/hr
      </div>
      <div className="text-sm text-text-secondary">Current Cost</div>
    </div>
    <div className="text-center">
      <div className="text-3xl font-bold text-accent-tertiary">
        {runpodData?.summary.active_agents || 0}
      </div>
      <div className="text-sm text-text-secondary">Agents</div>
    </div>
  </div>

  <div className="space-y-2">
    {runpodData?.pods?.map((pod: any) => (
      <div key={pod.id} className="flex justify-between items-center p-3 bg-scaffold-2 rounded">
        <div>
          <div className="font-medium">{pod.name}</div>
          <div className="text-xs text-text-tertiary">{pod.gpu} × {pod.gpu_count}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">${pod.cost_per_hour}/hr</div>
          <div className="text-xs text-text-tertiary">
            {pod.status === 'RUNNING' ? `${pod.uptime_hours}h uptime` : 'STOPPED'}
          </div>
        </div>
      </div>
    ))}
  </div>

  <button className="w-full mt-4 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 rounded">
    View RunPod Details →
  </button>
</div>
```

---

## 🎮 USER ACCESS PATTERNS

### Pattern 1: Primary - Via GCP Dashboard (RECOMMENDED)

```bash
# 1. Open unified dashboard
http://central-mcp.com (or http://34.41.115.199:3003)

# 2. See everything in one place:
  • GCP VM status
  • RunPod pods status
  • All agents (GCP + RunPod)
  • Combined metrics
  • Cost tracking

# 3. Click "VM Terminals" (Ctrl+6)
  • See agent terminals (wherever they run)

# 4. Click individual pod for details
  • GPU metrics
  • Agent sessions
  • SSH command
```

### Pattern 2: Direct SSH to RunPod (When Needed)

```bash
# When you need direct access to RunPod:

# 1. Get SSH command from dashboard
# Shows: ssh root@ssh.runpod.io -p 12345

# 2. SSH directly
ssh root@ssh.runpod.io -p 12345

# 3. Attach to agent terminal
tmux attach -t agent-a

# 4. Work directly
claude-code
# Say: "Connect to MCP"
```

### Pattern 3: Hybrid (Best of Both)

```bash
# Monitor via dashboard (always open)
http://central-mcp.com

# SSH to RunPod when needed
ssh root@ssh.runpod.io -p PORT

# Everything syncs automatically!
  • Dashboard updates when you SSH
  • Tasks update when agents work
  • Metrics collected continuously
```

---

## 💰 COST TRACKING

### Automatic Cost Calculation:

```
RunPod Monitor Loop (every 60s):
  ✅ Tracks running pods
  ✅ Calculates: hourly, daily, monthly costs
  ✅ Alerts if cost > threshold
  ✅ Shows idle pods costing money
  ✅ Suggests stop commands

Example Output:
  🚀 3/4 pods running
  💰 Cost: $1.77/hour ($42.48/day, $1,274/month)
  ⚠️  Pod "dev-test" idle for 2h ($1.18 wasted)
  💡 Suggestion: Stop pod "dev-test" to save $28/day
```

---

## 🎯 DEPLOYMENT COMMANDS

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# 1. Create RunPod integration directory on VM
gcloud compute ssh central-mcp-server --zone=us-central1-a --command="
  sudo mkdir -p /opt/central-mcp/src/tools/runpod &&
  sudo mkdir -p /opt/central-mcp/src/auto-proactive &&
  sudo chown -R lech:lech /opt/central-mcp/src/tools/runpod /opt/central-mcp/src/auto-proactive
"

# 2. Upload RunPod integration
gcloud compute scp \
  src/tools/runpod/runpodIntegration.ts \
  central-mcp-server:/opt/central-mcp/src/tools/runpod/ \
  --zone=us-central1-a

# 3. Update index.ts (manual edit on VM or upload new version)

# 4. Build and restart
gcloud compute ssh central-mcp-server --zone=us-central1-a --command="
  cd /opt/central-mcp &&
  npm run build &&
  sudo systemctl restart central-mcp
"

# 5. Verify
curl http://34.41.115.199:3000/health | jq .

# 6. Test RunPod integration
# Via agent: "Get RunPod status"
```

---

## ✅ SUCCESS CRITERIA

### Integration Complete When:
- [ ] RunPod API key in Doppler
- [ ] `get_runpod_status` tool working
- [ ] `control_pod` tool working
- [ ] RunPod Monitor Loop running (Loop 10)
- [ ] Dashboard shows RunPod data
- [ ] Terminal system on RunPod pod
- [ ] Agents can connect from RunPod
- [ ] SSH access documented

### Data Flow Verified:
- [ ] RunPod → Central-MCP (API data)
- [ ] RunPod → Dashboard (metrics display)
- [ ] Agents → Central-MCP (wherever they run)
- [ ] Dashboard → User (unified view)

---

## 🎉 FINAL ARCHITECTURE

```
USER EXPERIENCE:
  1. Open http://central-mcp.com
  2. See everything (GCP + RunPod unified)
  3. Monitor all agents in one place
  4. SSH to RunPod when needed
  5. Everything syncs automatically

INFRASTRUCTURE:
  • GCP VM: Control hub ($0/month)
  • RunPod: Heavy compute ($0.59-0.89/hour on-demand)
  • Dashboard: Unified view (GCP + RunPod)
  • Agents: Run anywhere, coordinated by Central-MCP

COST:
  • GCP: $0/month (free tier)
  • Domain: $1/month
  • RunPod: Variable (pay only when working)
  • Total: $1/month + RunPod on-demand

DATA COLLECTED:
  • Pod status (running/stopped)
  • GPU/CPU/RAM metrics
  • Agent sessions
  • Cost tracking
  • ComfyUI status
  • Terminal access info
```

---

**Generated**: October 12, 2025
**Architecture**: GCP Control Hub + RunPod Compute
**Status**: ✅ **READY FOR DEPLOYMENT**
