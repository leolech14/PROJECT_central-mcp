# 🚨 RUNPOD RECOVERY - IMMEDIATE ACTIONS NEEDED

**Status:** Account pods terminated due to payment
**Created:** 2025-10-12
**Priority:** URGENT

---

## ✅ WHAT WE'VE BUILT (READY TO DEPLOY)

### 1. Complete RunPod Integration System
- ✅ **RunPod API Integration** (`src/tools/runpod/runpodIntegration.ts`)
  - Query all pods (status, costs, metrics)
  - Control pods (start/stop/restart)
  - Track GPU/CPU/RAM usage
  - Calculate real-time costs

- ✅ **Loop 10: RunPod Monitor** (`src/auto-proactive/RunPodMonitorLoop.ts`)
  - Monitors every 60 seconds
  - Automatic cost tracking
  - Alert when daily cost > $50 (warning) or $100 (critical)
  - Historical cost snapshots
  - Low balance detection (future)

- ✅ **Dashboard API Endpoints** (`src/api/runpod.ts`)
  - `/api/runpod/status` - Current status
  - `/api/runpod/history` - Cost history
  - `/api/runpod/alerts` - Cost alerts
  - `/api/runpod/control/:podId/:action` - Pod control

- ✅ **Recovery Scripts**
  - `scripts/check-runpod-account.sh` - Account status check
  - `scripts/recover-runpod-pods.sh` - Recovery guide
  - `scripts/deploy-runpod-integration.sh` - Deploy to VM

- ✅ **Comprehensive Documentation**
  - `RUNPOD_RECOVERY_AND_COST_TRACKING.md` - Full recovery guide
  - Step-by-step pod recreation
  - Cost optimization strategies
  - Auto-stop configuration

---

## 🎯 WHAT YOU NEED TO DO NOW

### STEP 1: Get Your RunPod API Key (2 minutes)

1. **Go to:** https://runpod.io/console/user/settings
2. Click **"API Keys"** tab
3. Copy your API key (or create new one)

**Add to Doppler:**
```bash
doppler secrets set RUNPOD_API_KEY "your-api-key-here" --project ai-tools --config dev
```

**Or set temporarily:**
```bash
export RUNPOD_API_KEY="your-api-key-here"
```

---

### STEP 2: Check Account Status (1 minute)

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
chmod +x scripts/check-runpod-account.sh
./scripts/check-runpod-account.sh
```

**This will show:**
- ✅ Current credit balance
- ✅ Number of pods (likely 0)
- ✅ Recent charges
- ✅ Recovery recommendations

---

### STEP 3: Check for Network Volumes (CRITICAL!)

**Visit:** https://runpod.io/console/storage

**If you see network volumes:**
- 🎉 **YOUR DATA IS STILL THERE!**
- All ComfyUI models preserved
- All agent configurations preserved
- **Just attach to new pod to recover everything!**

**If no network volumes:**
- ⚠️  All data was lost
- Need to download models again
- Need to reconfigure agents

---

### STEP 4: Create New Pods

#### Option A: ComfyUI Pod (Image Generation)

**Visit:** https://runpod.io/console/pods

**Configuration:**
- **GPU:** RTX 4090 ($0.59/hr) or A40 ($0.79/hr)
- **Template:** runpod/comfyui:latest
- **vCPU:** 12+
- **RAM:** 48GB+
- **Storage:**
  - **Container:** 50GB
  - **Network Volume:** 100GB+ (CRITICAL - preserves data!)
- **Ports:** 8188, 22

**Deploy → Wait 2-5 min → Copy Pod ID**

---

#### Option B: Agent Terminal Pod (4 Agents)

**Configuration:**
- **GPU:** RTX 4090 ($0.59/hr)
- **Template:** runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04
- **vCPU:** 24+
- **RAM:** 128GB+
- **Storage:**
  - **Container:** 100GB
  - **Network Volume:** 200GB+ (agent workspaces)
- **Ports:** 22, 3000-3010, 7681-7684

**Deploy → Wait 2-5 min → Copy Pod ID**

---

### STEP 5: Configure ComfyUI Endpoint (if created)

```bash
# Replace YOUR_POD_ID with actual pod ID from RunPod
POD_ID="YOUR_POD_ID"
COMFYUI_ENDPOINT="https://${POD_ID}-8188.proxy.runpod.net"

# Test connection
curl -sf "$COMFYUI_ENDPOINT/system_stats"

# Update local database
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
sqlite3 src/database/registry.db << SQL
UPDATE external_services
SET endpoint = '$COMFYUI_ENDPOINT', status = 'active'
WHERE id = 'comfyui-runpod-001';
SQL
```

---

### STEP 6: Deploy Cost Tracking to Central-MCP (Optional - after pods running)

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# Build locally
npx tsc

# Deploy RunPod integration (when VM is accessible)
chmod +x scripts/deploy-runpod-integration.sh
./scripts/deploy-runpod-integration.sh
```

---

## 📊 WHAT THE COST TRACKING WILL DO

Once deployed, you'll see on dashboard:

```
💰 RunPod Infrastructure Costs
─────────────────────────────────────
Per Hour      Per Day       Per Month
$0.59         $14.16        $424.80

⚠️  High daily cost detected! Consider stopping unused pods.

🖥️  Active Pods (1/1)
─────────────────────────────────────
Pod Name        GPU          Status    Cost/hr
comfyui-main    1x RTX 4090  RUNNING   $0.59
```

**Automatic Alerts:**
- ⚠️  Warning when daily cost > $50
- 🚨 Critical when daily cost > $100
- 💤 Idle pod detection
- 📊 Cost history charts

---

## 💡 COST OPTIMIZATION TIPS

### Immediate:
1. **Stop pods when not in use** (preserves data on network volume)
2. **Use RTX 3090 instead of 4090** ($0.39/hr vs $0.59/hr - saves $4.80/day)
3. **Set auto-stop after 30 min idle** (in RunPod pod settings)

### Long-term:
1. **Use spot instances** (50-70% cheaper, may terminate with notice)
2. **Share GPU pod for both ComfyUI + agents** (saves $14/day)
3. **Set up auto-recharge alerts** (prevent future terminations)

---

## 🚨 PREVENTING FUTURE TERMINATIONS

### In RunPod Console:

1. **Go to:** https://runpod.io/console/billing
2. **Add Credits:** Minimum $10, recommended $50
3. **Set up alerts:**
   - Email when balance < $10
   - Email when balance < $5
   - Email when balance < $1
4. **Enable auto-recharge** (optional):
   - Auto-add $25 when balance < $5

### In Central-MCP:

Once deployed, Central-MCP will:
- Monitor costs every 60 seconds
- Alert when daily cost > $50
- Track cost history
- Detect idle pods
- (Future) Auto-stop idle pods after threshold

---

## 📋 RECOVERY CHECKLIST

- [ ] Get RunPod API key
- [ ] Add to Doppler
- [ ] Run account status check
- [ ] Check for network volumes
- [ ] Create new ComfyUI pod (attach network volume if exists)
- [ ] Create new agent pod (attach network volume if exists)
- [ ] Update ComfyUI endpoint in Central-MCP
- [ ] Test image generation
- [ ] Deploy cost tracking to Central-MCP VM
- [ ] Verify dashboard shows costs
- [ ] Set up RunPod billing alerts
- [ ] Configure auto-stop on pods
- [ ] Add $50 credits to account

---

## 📞 IF YOU NEED HELP

### RunPod Support:
- **Discord:** https://discord.gg/runpod (fastest response)
- **Email:** support@runpod.io
- **Docs:** https://docs.runpod.io

### Common Issues:

**"No pods found"**
- Pods were terminated after balance hit $0
- Need to create new pods
- Check for network volumes first!

**"Can't connect to ComfyUI"**
- Wait 5 minutes after pod creation
- Check pod logs in RunPod console
- Verify port 8188 is exposed

**"Models missing in ComfyUI"**
- If you had network volume, attach it
- If not, need to download models again
- Use ComfyUI Manager to auto-download

---

## ✅ SUCCESS CRITERIA

**You'll know recovery is complete when:**

1. ✅ Account shows positive credit balance
2. ✅ At least 1 pod is running
3. ✅ ComfyUI accessible at `https://POD_ID-8188.proxy.runpod.net`
4. ✅ Can generate test image successfully
5. ✅ Central-MCP dashboard shows RunPod costs
6. ✅ Cost alerts configured
7. ✅ Auto-stop enabled on pods
8. ✅ Billing alerts set in RunPod console

---

**CURRENT STATUS:** Waiting for Step 1 (API key)

**NEXT ACTION:** Get RunPod API key → Run account check

**TIME ESTIMATE:** 15-30 minutes to full recovery

