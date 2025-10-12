# 🚀 RunPod Integration - Quick Start Guide

**Get your RunPod GPU VMs connected to Central-MCP in 30 minutes!**

---

## 📋 PREREQUISITES

### 1. Get RunPod API Key

**Steps:**
1. Go to: https://www.runpod.io/console/user/settings
2. Navigate to **API Keys** section
3. Click **+ Create API Key**
4. Copy your API key (starts with your user ID)

### 2. Get RunPod Pod SSH Access

**Check existing pods:**
1. Go to: https://console.runpod.io/pods
2. Note your pod IDs and SSH connection strings

**Example SSH connection string:**
```
ssh root@<pod-id>-<random>.runpod.io -p <port> -i ~/.ssh/id_ed25519
```

---

## ⚡ QUICK SETUP (3 Steps)

### Step 1: Store RunPod Credentials in Doppler

```bash
# Store RunPod API key
doppler secrets set --project central-mcp --config production \
  RUNPOD_API_KEY="your-runpod-api-key-here"

# Verify stored
doppler secrets get --project central-mcp --config production RUNPOD_API_KEY
```

### Step 2: Generate SSH Key for RunPod

```bash
# Generate dedicated SSH key
ssh-keygen -t ed25519 -f ~/.ssh/runpod_central_mcp -C "central-mcp@runpod"

# Display public key (copy this)
cat ~/.ssh/runpod_central_mcp.pub

# Store private key in Doppler
doppler secrets set --project central-mcp --config production \
  RUNPOD_SSH_PRIVATE_KEY="$(cat ~/.ssh/runpod_central_mcp)"
```

### Step 3: Add SSH Key to Your RunPod Pods

**Option A: Via RunPod Web Interface**
1. Go to your pod: https://console.runpod.io/pods
2. Click **Connect** → **Start Web Terminal**
3. Run:
```bash
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Option B: Via Existing SSH Connection**
```bash
# Connect to your pod
ssh root@your-pod.runpod.io -p PORT

# Add public key
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## 🔧 IMPLEMENTATION (Next Steps)

### Phase 1: Basic RunPod Tools (Week 1)

**Files to implement:**
```
central-mcp/
├── src/
│   ├── cloud-providers/
│   │   └── runpod/
│   │       ├── RunPodClient.ts        # Create this
│   │       ├── RunPodPodRegistry.ts   # Create this
│   │       └── types.ts               # Create this
│   └── tools/
│       └── runpod/
│           ├── executeOnRunPod.ts     # Create this
│           ├── uploadToRunPod.ts      # Create this
│           ├── downloadFromRunPod.ts  # Create this
│           └── index.ts               # Create this
```

**Implementation order:**
1. ✅ Create `RunPodClient.ts` (API wrapper)
2. ✅ Create `executeOnRunPod.ts` (command execution tool)
3. ✅ Create `uploadToRunPod.ts` (file upload tool)
4. ✅ Create `downloadFromRunPod.ts` (file download tool)
5. ✅ Test with existing RunPod pods
6. ✅ Deploy to Central-MCP

### Phase 2: VM Router (Week 2)

**Goal**: Intelligently route tasks to GCP or RunPod based on requirements

**Files to implement:**
```
src/vm-router/
├── VMRegistry.ts          # Track all VMs (GCP + RunPod)
├── VMRouter.ts            # Route tasks intelligently
└── VMHealthMonitor.ts     # Monitor VM health
```

---

## 🎯 TEST YOUR SETUP

### Test 1: List Your RunPod Pods

```bash
# Install RunPod CLI
pip install runpod

# Configure API key
runpodctl config --apiKey YOUR_RUNPOD_API_KEY

# List pods
runpodctl get pod
```

**Expected output:**
```
Pod ID                Status    GPU Type    Region
──────────────────────────────────────────────────
abc123def456          Running   RTX 4090    EU-RO-1
xyz789ghi012          Running   A100 80GB   US-TX-3
```

### Test 2: SSH Connection

```bash
# Test SSH connection with your key
ssh -i ~/.ssh/runpod_central_mcp root@YOUR_POD.runpod.io -p PORT

# If successful, you should see RunPod pod terminal
```

### Test 3: Execute Command via API

```bash
# Test command execution (once RunPodClient is implemented)
curl -X POST https://rest.runpod.io/v1/pods/YOUR_POD_ID/exec \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"command": "nvidia-smi"}'
```

---

## 📊 YOUR CURRENT INFRASTRUCTURE

### GCP VM (Central-MCP Hub)
```
Name:           central-mcp-server
IP:             34.41.115.199
Type:           e2-micro (2 vCPU, 1GB RAM)
Cost:           ~$6-8/month (24/7)
Purpose:        Agent coordination, A2A protocol, task registry
Endpoints:      ws://34.41.115.199:3000/a2a
```

### RunPod GPU VMs (AI Media Generation)
```
Provider:       RunPod
Purpose:        AI media generation (Stable Diffusion, Video Gen, etc.)
Access:         SSH + REST API
Cost:           Pay-per-hour (varies by GPU type)

GPU Options:
- RTX 4090:     $0.69/hr
- A100 80GB:    $1.89/hr
- H100:         $4.99/hr
```

**Total Infrastructure:**
```
┌─────────────────────────────────────────────┐
│  GCP (Central-MCP Hub)                      │
│  - 1x e2-micro VM                           │
│  - A2A Protocol Server                      │
│  - Task Coordination                        │
│  Cost: $6-8/month fixed                     │
└─────────────────────────────────────────────┘
              │
              │ Coordinates
              ▼
┌─────────────────────────────────────────────┐
│  RunPod (GPU Workers)                       │
│  - Nx GPU pods (on-demand)                  │
│  - AI Media Generation                      │
│  Cost: $X/hour when running                 │
└─────────────────────────────────────────────┘
```

---

## 🎨 USE CASES ENABLED

### 1. Image Generation Pipeline
```
Agent Request → Central-MCP → RunPod GPU Pod → Stable Diffusion → Return Image
```

### 2. Video Generation Pipeline
```
Script Generation (GCP) → Audio Gen (RunPod) → Video Gen (RunPod) → Composite (RunPod)
```

### 3. Multi-Agent AI Media Production
```
Agent A: Content planning     (GCP)
Agent B: Image generation     (RunPod GPU)
Agent C: Video generation     (RunPod GPU)
Agent D: Post-processing      (RunPod GPU)
Agent E: Delivery & storage   (GCP)

All coordinated by Central-MCP!
```

---

## 💡 COST OPTIMIZATION TIPS

### 1. Auto-Start/Stop Pods
```typescript
// Only start pods when needed
await runpodClient.startPod(podId);
await executeTask(podId, task);
await runpodClient.stopPod(podId);  // Stop after 5 min idle
```

### 2. Use Spot Instances
- RunPod offers spot pricing (50-70% cheaper)
- Good for non-urgent tasks
- Central-MCP can retry if spot instance terminated

### 3. Batch Tasks
```typescript
// Queue multiple tasks, process in batch
const tasks = await taskQueue.getBatch(10);
await runpodClient.startPod(podId);
for (const task of tasks) {
  await executeTask(podId, task);
}
await runpodClient.stopPod(podId);
```

### 4. Monitor Spending
```bash
# View RunPod costs
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.runpod.io/v1/billing/usage

# View GCP costs
gcloud billing accounts list
```

---

## 🔥 NEXT ACTIONS

### Immediate (Today)
- [ ] Get RunPod API key from console.runpod.io
- [ ] Store API key in Doppler
- [ ] Generate SSH key for RunPod
- [ ] Test SSH connection to existing RunPod pods

### This Week
- [ ] Implement RunPodClient.ts
- [ ] Implement basic RunPod tools (execute, upload, download)
- [ ] Test tools with existing pods
- [ ] Document pod configurations

### Next Week
- [ ] Build VM Router (intelligent task routing)
- [ ] Integrate RunPod tools with A2A protocol
- [ ] Deploy to Central-MCP production
- [ ] Create example agents using RunPod

---

## 📖 DOCUMENTATION

**Specification**: `/02_SPECBASES/SPEC_RunPod_Integration.md`
**Examples**: Coming soon in `/examples/runpod/`
**API Docs**: https://docs.runpod.io

---

## 🆘 TROUBLESHOOTING

### Issue: SSH connection refused
```bash
# Check if pod is running
runpodctl get pod YOUR_POD_ID

# Check SSH port (usually 22 or custom)
runpodctl get pod YOUR_POD_ID | grep SSH
```

### Issue: API key not working
```bash
# Verify API key format
echo $RUNPOD_API_KEY | cut -c1-10
# Should start with your user ID

# Test API key
curl -H "Authorization: Bearer $RUNPOD_API_KEY" \
  https://rest.runpod.io/v1/pods
```

### Issue: Pod not responding
```bash
# Check pod status
runpodctl get pod YOUR_POD_ID

# Restart pod
runpodctl stop pod YOUR_POD_ID
runpodctl start pod YOUR_POD_ID
```

---

**Ready to connect RunPod to Central-MCP?** 🚀

Start with storing your API key in Doppler, then we'll build the integration!
