# 🚨 RUNPOD ACCOUNT RECOVERY & AUTOMATIC COST TRACKING

**Date:** 2025-10-12
**Status:** Account pods terminated due to payment - Recovery in progress
**Solution:** Step-by-step recovery + Automatic cost tracking to dashboard

---

## 🔍 SITUATION ANALYSIS

### What Happened:
1. **RunPod credit balance reached $0**
2. **All running pods were stopped**
3. **After grace period, pods were TERMINATED**
4. **All pod configurations and data LOST** (unless stored on network volumes)

### Current Status:
- ✅ Account has funds again
- ❌ Pods need to be recreated
- 🎯 Need automatic cost tracking to prevent future issues

---

## 📋 IMMEDIATE RECOVERY STEPS

### Step 1: Get Your RunPod API Key

**Go to:** https://runpod.io/console/user/settings

1. Click on **"API Keys"** tab
2. Create new API key or copy existing one
3. Save it securely

**Add to Doppler:**
```bash
# Choose appropriate project (ai-tools or create new central-mcp)
doppler secrets set RUNPOD_API_KEY "your-api-key-here" --project ai-tools --config dev
```

**Or set temporarily:**
```bash
export RUNPOD_API_KEY="your-api-key-here"
```

---

### Step 2: Check Account Status

**Run the account check script:**
```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
./scripts/check-runpod-account.sh
```

**This will show you:**
- Current credit balance
- Number of pods (likely 0 if terminated)
- Recent charges
- Recovery recommendations

---

### Step 3: Check for Network Volumes

**Network volumes persist even when pods are deleted!**

**Visit:** https://runpod.io/console/storage

**If you had network volumes:**
- ✅ Your data is still there!
- ✅ ComfyUI models still there!
- ✅ Agent configurations still there!
- 🎯 Just attach to new pod to recover everything

---

### Step 4: Create New Pods

**Visit:** https://runpod.io/console/pods

#### For ComfyUI Image Generation:

**Recommended Configuration:**
- **GPU:** RTX 4090 ($0.59/hr) or A40 ($0.79/hr)
- **Template:** runpod/comfyui:latest
- **vCPU:** 12+
- **RAM:** 48GB+
- **Storage:**
  - Container: 50GB (temporary)
  - Network Volume: 100GB+ (persistent - IMPORTANT!)
- **Ports:**
  - 8188 (ComfyUI interface)
  - 22 (SSH)
  - 7860 (if using A1111)

**Deploy Steps:**
1. Click **"Deploy"** on GPU you want
2. Select **"ComfyUI"** template
3. **IMPORTANT:** Create or attach network volume!
4. Configure ports (8188, 22)
5. Click **"Deploy"**
6. Wait 2-5 minutes for startup

---

#### For Agent Terminals:

**Recommended Configuration:**
- **GPU:** RTX 3090 ($0.39/hr) or RTX 4090 ($0.59/hr)
- **Template:** runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04
- **vCPU:** 24+
- **RAM:** 128GB+
- **Storage:**
  - Container: 100GB
  - Network Volume: 200GB+ (for agent workspaces)
- **Ports:**
  - 22 (SSH)
  - 3000-3010 (agent HTTP servers)
  - 7681-7684 (GoTTY web terminals)

**Deploy Steps:**
1. Deploy GPU pod
2. SSH into pod
3. Install tmux, gotty, Claude CLI
4. Create 4 agent terminal sessions
5. Configure Central-MCP connection

---

### Step 5: Configure ComfyUI Endpoint in Central-MCP

**After ComfyUI pod is running:**

```bash
# Get your pod ID and endpoint
POD_ID="your-pod-id-here"
COMFYUI_ENDPOINT="https://${POD_ID}-8188.proxy.runpod.net"

# Test connection
curl -sf "$COMFYUI_ENDPOINT/system_stats"

# Update Central-MCP database (local)
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
sqlite3 src/database/registry.db << SQL
UPDATE external_services
SET endpoint = '$COMFYUI_ENDPOINT', status = 'active'
WHERE id = 'comfyui-runpod-001';
SQL

# Update Central-MCP database (VM) - if VM is accessible
gcloud compute ssh central-mcp-server --zone=us-central1-a --command="
sqlite3 /opt/central-mcp/data/registry.db << 'SQL'
UPDATE external_services
SET endpoint = '$COMFYUI_ENDPOINT', status = 'active'
WHERE id = 'comfyui-runpod-001';
SQL
"
```

---

## 💰 AUTOMATIC COST TRACKING TO DASHBOARD

### Architecture:

```
RunPod API (GraphQL)
  ↓ (every 60 seconds)
Loop 10: RunPod Monitor
  ↓
Central-MCP Database
  ↓
Dashboard API Endpoint
  ↓
Dashboard UI (Real-time)
```

---

### Implementation:

#### 1. RunPod Monitor Loop (Loop 10)

**File:** `src/auto-proactive/RunPodMonitorLoop.ts`

```typescript
import { BaseLoop } from './BaseLoop.js';
import { getRunPodStatus } from '../tools/runpod/runpodIntegration.js';
import logger from '../utils/logger.js';

export class RunPodMonitorLoop extends BaseLoop {
  constructor() {
    super(
      10,                      // Loop number
      'RunPod Monitor',        // Name
      60,                      // Interval: 60 seconds
      ['TIME'],                // Triggers: Time-based
      'NORMAL'                 // Priority
    );
  }

  protected async executeInternal(): Promise<void> {
    try {
      logger.info('[Loop 10] 🖥️  Checking RunPod infrastructure...');

      const status = await getRunPodStatus();

      if (status.success) {
        const { summary } = status;

        logger.info('[Loop 10] ✅ RunPod status retrieved:');
        logger.info(`   → Total pods: ${summary.total_pods}`);
        logger.info(`   → Running: ${summary.running_pods}`);
        logger.info(`   → Cost: $${summary.cost_per_hour}/hr ($${summary.cost_per_day.toFixed(2)}/day)`);

        // Alert if high costs
        if (summary.cost_per_day > 50) {
          logger.warn(`[Loop 10] ⚠️  HIGH DAILY COST: $${summary.cost_per_day.toFixed(2)}/day`);
        }

        // Alert if low balance (would need to query account balance)
        // TODO: Add account balance check

      } else {
        logger.error(`[Loop 10] ❌ Failed to get RunPod status: ${status.error}`);
      }

    } catch (error) {
      logger.error('[Loop 10] ❌ RunPod monitor error:', error);
    }
  }
}
```

---

#### 2. Dashboard Cost Display Component

**File:** `central-mcp-dashboard/src/components/RunPodCosts.tsx`

```typescript
import React, { useState, useEffect } from 'react';

interface RunPodCosts {
  total_pods: number;
  running_pods: number;
  idle_pods: number;
  cost_per_hour: number;
  cost_per_day: number;
  cost_per_month: number;
  credit_balance?: number;
  pods: Array<{
    id: string;
    name: string;
    gpu: string;
    gpu_count: number;
    status: string;
    cost_per_hour: number;
    uptime_hours: number;
  }>;
}

export function RunPodCosts() {
  const [costs, setCosts] = useState<RunPodCosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const response = await fetch('/api/runpod/status');
        const data = await response.json();

        if (data.success) {
          setCosts(data.summary);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to fetch RunPod costs');
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
    const interval = setInterval(fetchCosts, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading RunPod costs...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!costs) return null;

  const dailyCostPercent = (costs.cost_per_day / 100) * 100; // Assuming $100/day is 100%
  const isHighCost = costs.cost_per_day > 50;

  return (
    <div className="runpod-costs">
      <h3>💰 RunPod Infrastructure Costs</h3>

      {/* Cost Summary */}
      <div className="cost-summary">
        <div className={`cost-card ${isHighCost ? 'high-cost' : ''}`}>
          <div className="cost-label">Per Hour</div>
          <div className="cost-amount">${costs.cost_per_hour.toFixed(2)}</div>
        </div>

        <div className={`cost-card ${isHighCost ? 'high-cost' : ''}`}>
          <div className="cost-label">Per Day</div>
          <div className="cost-amount">${costs.cost_per_day.toFixed(2)}</div>
        </div>

        <div className={`cost-card ${isHighCost ? 'high-cost' : ''}`}>
          <div className="cost-label">Per Month</div>
          <div className="cost-amount">${costs.cost_per_month.toFixed(2)}</div>
        </div>

        {costs.credit_balance !== undefined && (
          <div className="cost-card credit-balance">
            <div className="cost-label">Credit Balance</div>
            <div className="cost-amount">${costs.credit_balance.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Alert if high costs */}
      {isHighCost && (
        <div className="cost-alert">
          ⚠️ High daily cost detected! Consider stopping unused pods.
        </div>
      )}

      {/* Pod breakdown */}
      <div className="pod-breakdown">
        <h4>Active Pods ({costs.running_pods}/{costs.total_pods})</h4>
        <table>
          <thead>
            <tr>
              <th>Pod</th>
              <th>GPU</th>
              <th>Status</th>
              <th>Uptime</th>
              <th>Cost/hr</th>
              <th>Daily Cost</th>
            </tr>
          </thead>
          <tbody>
            {costs.pods.map(pod => (
              <tr key={pod.id} className={pod.status === 'RUNNING' ? 'running' : 'idle'}>
                <td>{pod.name}</td>
                <td>{pod.gpu_count}x {pod.gpu}</td>
                <td>
                  <span className={`status-badge ${pod.status.toLowerCase()}`}>
                    {pod.status}
                  </span>
                </td>
                <td>{pod.uptime_hours}h</td>
                <td>${pod.cost_per_hour.toFixed(2)}</td>
                <td>${(pod.cost_per_hour * 24).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost trend visualization */}
      <div className="cost-trend">
        <div className="trend-bar" style={{ width: `${Math.min(dailyCostPercent, 100)}%` }}>
          <span>${costs.cost_per_day.toFixed(2)}/day</span>
        </div>
      </div>

      <style jsx>{`
        .runpod-costs {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .cost-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .cost-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }

        .cost-card.high-cost {
          border-color: rgba(255, 100, 100, 0.5);
          background: rgba(255, 100, 100, 0.1);
        }

        .cost-card.credit-balance {
          border-color: rgba(100, 255, 100, 0.5);
          background: rgba(100, 255, 100, 0.1);
        }

        .cost-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 5px;
        }

        .cost-amount {
          font-size: 24px;
          font-weight: bold;
          color: #ffffff;
        }

        .cost-alert {
          background: rgba(255, 100, 100, 0.2);
          border: 1px solid rgba(255, 100, 100, 0.5);
          border-radius: 6px;
          padding: 10px;
          margin: 10px 0;
          color: #ffcccc;
        }

        .pod-breakdown {
          margin-top: 20px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        th {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        tr.running {
          background: rgba(100, 255, 100, 0.05);
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: bold;
        }

        .status-badge.running {
          background: rgba(100, 255, 100, 0.2);
          color: #00ff00;
        }

        .status-badge.stopped {
          background: rgba(255, 255, 100, 0.2);
          color: #ffff00;
        }

        .cost-trend {
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          height: 30px;
          overflow: hidden;
        }

        .trend-bar {
          height: 100%;
          background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 10px;
          font-weight: bold;
          transition: width 0.5s ease;
        }
      `}</style>
    </div>
  );
}
```

---

#### 3. Dashboard API Endpoint

**File:** `central-mcp-dashboard/pages/api/runpod/status.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Call Central-MCP backend
    const response = await fetch('http://34.41.115.199:3000/api/runpod/status');
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RunPod status'
    });
  }
}
```

---

#### 4. Central-MCP Backend API Endpoint

**File:** `src/api/runpod.ts`

```typescript
import express from 'express';
import { getRunPodStatus } from '../tools/runpod/runpodIntegration.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const status = await getRunPodStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

**Register in:** `src/index.ts`

```typescript
import runpodRouter from './api/runpod.js';

// ... existing code ...

app.use('/api/runpod', runpodRouter);
```

---

## 🎯 DEPLOYMENT CHECKLIST

### Phase 1: Recovery
- [ ] Get RunPod API key from https://runpod.io/console/user/settings
- [ ] Add to Doppler: `doppler secrets set RUNPOD_API_KEY "key" --project ai-tools --config dev`
- [ ] Run account check: `./scripts/check-runpod-account.sh`
- [ ] Check for network volumes: https://runpod.io/console/storage
- [ ] Create new ComfyUI pod (RTX 4090, attach network volume)
- [ ] Create new agent terminal pod (RTX 4090, 128GB RAM)
- [ ] Update ComfyUI endpoint in Central-MCP database

### Phase 2: Cost Tracking
- [ ] Deploy RunPod integration to Central-MCP VM
- [ ] Create Loop 10 (RunPod Monitor) in auto-proactive engine
- [ ] Add RunPod API endpoint to Central-MCP backend
- [ ] Create RunPodCosts component in dashboard
- [ ] Deploy updated dashboard to VM
- [ ] Test automatic cost tracking

### Phase 3: Monitoring & Alerts
- [ ] Set up credit balance alerts in RunPod console
- [ ] Configure auto-recharge (minimum $10)
- [ ] Add cost threshold alerts in Central-MCP (email/Slack)
- [ ] Monitor daily costs on dashboard
- [ ] Set up weekly cost reports

---

## 💡 COST OPTIMIZATION TIPS

### 1. Use Spot Instances
- 50-70% cheaper than on-demand
- May be terminated with 30-second notice
- Good for non-critical workloads

### 2. Stop Pods When Not in Use
```bash
# Stop pod (preserves data if on network volume)
curl -X POST "https://api.runpod.io/v2/POD_ID/stop" \
  -H "Authorization: Bearer $RUNPOD_API_KEY"

# Start when needed
curl -X POST "https://api.runpod.io/v2/POD_ID/start" \
  -H "Authorization: Bearer $RUNPOD_API_KEY"
```

### 3. Use Network Volumes
- Data persists even when pod is deleted
- Attach to multiple pods (read-only)
- Only pay for storage (~$0.10/GB/month)

### 4. Right-Size Your Pods
- Don't over-provision GPU
- RTX 3090 sufficient for most workloads ($0.39/hr vs $0.59/hr for 4090)
- Use CPU pods for non-GPU tasks ($0.10-0.20/hr)

### 5. Set Up Auto-Stop
- Configure idle timeout in RunPod
- Automatically stop pod after X minutes of inactivity
- Prevents accidental overnight charges

---

## 📞 SUPPORT

### RunPod Support:
- Email: support@runpod.io
- Discord: https://discord.gg/runpod
- Docs: https://docs.runpod.io

### Emergency Actions:
1. **Stop all pods immediately:** https://runpod.io/console/pods
2. **Check billing:** https://runpod.io/console/billing
3. **Add funds:** https://runpod.io/console/billing/add-credits

---

## ✅ SUCCESS CRITERIA

- [ ] Account status verified
- [ ] New pods deployed with network volumes
- [ ] ComfyUI operational and connected to Central-MCP
- [ ] Agent terminals installed and running
- [ ] Dashboard showing real-time costs
- [ ] Cost alerts configured
- [ ] Auto-stop enabled on pods
- [ ] Weekly cost reports set up

---

**Status:** In Progress
**Next Step:** Run `./scripts/check-runpod-account.sh` to verify account status

