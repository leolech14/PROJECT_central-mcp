# 🚀 RUNPOD MULTI-AGENT DEPLOYMENT - COMPLETE GUIDE

**Date**: October 12, 2025
**Status**: READY FOR DEPLOYMENT
**Cost**: $0.59/hour RunPod + $0 GCP = **HYBRID ARCHITECTURE**

---

## 🎯 ARCHITECTURE OVERVIEW

### Hybrid Cloud Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│               CENTRAL-MCP BRAIN (GCP - FREE)                │
│  • Auto-Proactive Loops (9 loops)                           │
│  • Task Registry & Assignment                               │
│  • WebSocket Coordination                                   │
│  • Dashboard UI                                             │
│  Cost: $0/month (e2-micro free tier)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ (WebSocket coordination)
                      ↓
┌─────────────────────────────────────────────────────────────┐
│            RUNPOD GPU PODS (HEAVY COMPUTE)                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Agent A     │  │  Agent B     │  │  Agent C     │     │
│  │  Claude CLI  │  │  Claude CLI  │  │  Claude CLI  │     │
│  │  Sonnet 4.5  │  │  Sonnet 4.5  │  │  GLM 4.6     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                           │
│  │  Agent D     │   Each pod: 24GB VRAM, 16-48 CPU cores  │
│  │  Claude CLI  │             64-256 GB RAM                │
│  │  GLM 4.6     │             1-4 TB SSD storage           │
│  └──────────────┘                                           │
│                                                              │
│  Cost: $0.59/hour per GPU pod                              │
│  4 pods = $2.36/hour = $56/day = $1,708/month (24/7)       │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ **Massive compute**: RunPod GPUs crush agent workloads
- ✅ **Free coordination**: GCP e2-micro handles orchestration
- ✅ **On-demand scaling**: Start/stop pods as needed
- ✅ **Cost optimization**: Pay only when agents working
- ✅ **Zero resource contention**: Each agent has dedicated GPU pod

---

## 💰 COST OPTIMIZATION STRATEGIES

### Strategy 1: On-Demand (RECOMMENDED)
```
Working Hours: 8 hours/day, 5 days/week
4 pods × $0.59/hour × 8 hours × 22 days = $416/month

Use case: Development sprints, focused work periods
Savings: 75% compared to 24/7
```

### Strategy 2: Business Hours Only
```
Working Hours: 12 hours/day, 7 days/week
4 pods × $0.59/hour × 12 hours × 30 days = $852/month

Use case: Active project phases
Savings: 50% compared to 24/7
```

### Strategy 3: 24/7 Continuous (Production)
```
Always-on: 24 hours/day, 30 days/month
4 pods × $0.59/hour × 24 hours × 30 days = $1,708/month

Use case: Autonomous operation, always-ready agents
Savings: None, but maximum productivity
```

### Strategy 4: Mixed Approach (SMART)
```
1 pod (Agent A) always-on:  $424/month  (coordinator)
3 pods on-demand (8h/day):  $312/month  (workers)
Total:                      $736/month

Use case: One agent always monitoring, others on-demand
Savings: 57% compared to 24/7 all pods
```

---

## 🔧 RUNPOD POD SPECIFICATIONS

### Recommended GPU Pod Specs:

**For Claude Code CLI Agents:**
```
GPU: Not actually needed for CLI (but comes with pod)
CPU: 16-24 cores (plenty for multiple agents)
RAM: 64 GB (comfortable for 4+ agents per pod)
Storage: 100 GB container disk + 200 GB volume
Network: 1 Gbps (fast API calls)

Pod Type: CPU-optimized (if available) or entry-level GPU
Recommended: RTX 3090 (cheapest) or A4000
Cost: $0.59/hour (RTX 3090)
```

**Alternative: Use 1 Powerful Pod for All 4 Agents:**
```
GPU: RTX 4090 or A6000
CPU: 48+ cores
RAM: 128+ GB
Storage: 300 GB

Run all 4 agents in same pod = $0.59-0.89/hour
Saves money but less isolation
```

---

## 📦 DEPLOYMENT PLAN

### Phase 1: RunPod Setup (15 minutes)
### Phase 2: Deploy Base Image (20 minutes)
### Phase 3: Agent Configuration (15 minutes)
### Phase 4: Central-MCP Integration (10 minutes)
### Phase 5: Testing & Verification (20 minutes)

**Total Time**: ~80 minutes

---

## 🚀 PHASE 1: RUNPOD SETUP

### Step 1.1: Create RunPod Account & Add Funds

```bash
# Go to: https://www.runpod.io/
# Sign up / Log in
# Add credit: $50-100 to start

# Get API key:
# Settings → API Keys → Create API Key
# Save as: RUNPOD_API_KEY
```

### Step 1.2: Store API Key in Doppler

```bash
# Store RunPod API key securely
doppler secrets set --project central-mcp --config prod \
  RUNPOD_API_KEY="your-api-key-here"

# Verify
doppler secrets get --project central-mcp --config prod RUNPOD_API_KEY
```

### Step 1.3: Install RunPod CLI (Optional)

```bash
# Install runpodctl
curl -s https://api.github.com/repos/runpod/runpodctl/releases/latest \
  | grep "browser_download_url.*runpodctl-darwin-amd64" \
  | cut -d : -f 2,3 \
  | tr -d \" \
  | wget -qi -

chmod +x runpodctl-darwin-amd64
sudo mv runpodctl-darwin-amd64 /usr/local/bin/runpodctl

# Configure
runpodctl config --apiKey YOUR_API_KEY
```

---

## 🐳 PHASE 2: CREATE AGENT BASE IMAGE

### Step 2.1: Create Dockerfile for Agent Environment

Create `central-mcp/docker/Dockerfile.agent`:

```dockerfile
# Base image with Node.js
FROM node:20-bullseye

# Set environment
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    tmux \
    vim \
    htop \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create working directory
WORKDIR /workspace

# Create agent user
RUN useradd -m -s /bin/bash agent && \
    chown -R agent:agent /workspace

# Switch to agent user
USER agent

# Set up tmux configuration
RUN echo "set -g mouse on" > ~/.tmux.conf && \
    echo "set -g history-limit 10000" >> ~/.tmux.conf

# Create startup script
RUN echo '#!/bin/bash' > /workspace/start-agent.sh && \
    echo 'export AGENT_LETTER=${AGENT_LETTER:-A}' >> /workspace/start-agent.sh && \
    echo 'export AGENT_MODEL=${AGENT_MODEL:-claude-sonnet-4-5}' >> /workspace/start-agent.sh && \
    echo 'export AGENT_ROLE=${AGENT_ROLE:-coordinator}' >> /workspace/start-agent.sh && \
    echo 'export CENTRAL_MCP_URL=${CENTRAL_MCP_URL:-http://34.41.115.199:3000}' >> /workspace/start-agent.sh && \
    echo 'echo "🤖 Agent $AGENT_LETTER starting..."' >> /workspace/start-agent.sh && \
    echo 'echo "Model: $AGENT_MODEL"' >> /workspace/start-agent.sh && \
    echo 'echo "Role: $AGENT_ROLE"' >> /workspace/start-agent.sh && \
    echo 'echo "Central-MCP: $CENTRAL_MCP_URL"' >> /workspace/start-agent.sh && \
    echo 'echo ""' >> /workspace/start-agent.sh && \
    echo 'echo "To start Claude Code:"' >> /workspace/start-agent.sh && \
    echo 'echo "  claude-code"' >> /workspace/start-agent.sh && \
    echo 'echo ""' >> /workspace/start-agent.sh && \
    echo 'echo "Then connect to Central-MCP:"' >> /workspace/start-agent.sh && \
    echo 'echo "  Use tool: connectToMCP"' >> /workspace/start-agent.sh && \
    echo 'exec /bin/bash' >> /workspace/start-agent.sh && \
    chmod +x /workspace/start-agent.sh

# Default command
CMD ["/workspace/start-agent.sh"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node --version || exit 1
```

### Step 2.2: Build and Push Image to Docker Hub

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# Build image
docker build -f docker/Dockerfile.agent -t central-mcp-agent:latest .

# Tag for Docker Hub (replace YOUR_USERNAME)
docker tag central-mcp-agent:latest YOUR_USERNAME/central-mcp-agent:latest

# Login to Docker Hub
docker login

# Push image
docker push YOUR_USERNAME/central-mcp-agent:latest
```

**Alternative: Use RunPod's Public Templates**
- Use Node.js template from RunPod marketplace
- Install Claude Code CLI on first boot via startup script

---

## 🎮 PHASE 3: DEPLOY AGENTS TO RUNPOD

### Step 3.1: Create Pod Template (via Web UI)

**Go to RunPod Dashboard → Templates → New Template:**

```yaml
Name: Central-MCP Agent
Container Image: YOUR_USERNAME/central-mcp-agent:latest
Container Disk: 20 GB
Volume Disk: 50 GB
Expose Ports:
  - 22 (SSH)
  - 3000 (optional API)
Environment Variables:
  AGENT_LETTER: A
  AGENT_MODEL: claude-sonnet-4-5
  AGENT_ROLE: coordinator
  CENTRAL_MCP_URL: http://34.41.115.199:3000
  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
  ZAI_API_KEY: ${ZAI_API_KEY}
```

### Step 3.2: Deploy 4 Pods (One for Each Agent)

**Option A: Via Web UI (Easy)**

1. Go to RunPod → Pods → Deploy
2. Select GPU: RTX 3090 (cheapest at $0.59/hour)
3. Select Template: Central-MCP Agent
4. Set Environment Variables:
   ```
   Pod 1 (Agent A):
     AGENT_LETTER=A
     AGENT_MODEL=claude-sonnet-4-5
     AGENT_ROLE=coordinator

   Pod 2 (Agent B):
     AGENT_LETTER=B
     AGENT_MODEL=claude-sonnet-4-5
     AGENT_ROLE=architecture

   Pod 3 (Agent C):
     AGENT_LETTER=C
     AGENT_MODEL=glm-4-6
     AGENT_ROLE=backend

   Pod 4 (Agent D):
     AGENT_LETTER=D
     AGENT_MODEL=glm-4-6
     AGENT_ROLE=ui
   ```
5. Deploy each pod

**Option B: Via API (Automated)**

Create `scripts/deploy-runpod-agents.sh`:

```bash
#!/bin/bash
# Deploy 4 Central-MCP agents to RunPod
set -e

RUNPOD_API_KEY=$(doppler secrets get --project central-mcp --config prod RUNPOD_API_KEY --plain)
DOCKER_IMAGE="YOUR_USERNAME/central-mcp-agent:latest"
GPU_TYPE="NVIDIA RTX 3090"

echo "🚀 Deploying 4 Central-MCP agents to RunPod"
echo ""

# Deploy Agent A
echo "Deploying Agent A (Coordinator)..."
curl -X POST "https://api.runpod.io/v2/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "mutation { podFindAndDeployOnDemand(input: { cloudType: SECURE, gpuTypeId: \"NVIDIA RTX 3090\", name: \"central-mcp-agent-a\", imageName: \"'$DOCKER_IMAGE'\", dockerArgs: \"\", containerDiskInGb: 20, volumeInGb: 50, env: [{key: \"AGENT_LETTER\", value: \"A\"}, {key: \"AGENT_MODEL\", value: \"claude-sonnet-4-5\"}, {key: \"AGENT_ROLE\", value: \"coordinator\"}] }) { id, imageName, desiredStatus } }"
  }'
echo ""

# Deploy Agent B
echo "Deploying Agent B (Architecture)..."
curl -X POST "https://api.runpod.io/v2/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "mutation { podFindAndDeployOnDemand(input: { cloudType: SECURE, gpuTypeId: \"NVIDIA RTX 3090\", name: \"central-mcp-agent-b\", imageName: \"'$DOCKER_IMAGE'\", dockerArgs: \"\", containerDiskInGb: 20, volumeInGb: 50, env: [{key: \"AGENT_LETTER\", value: \"B\"}, {key: \"AGENT_MODEL\", value: \"claude-sonnet-4-5\"}, {key: \"AGENT_ROLE\", value: \"architecture\"}] }) { id, imageName, desiredStatus } }"
  }'
echo ""

# Deploy Agent C
echo "Deploying Agent C (Backend)..."
curl -X POST "https://api.runpod.io/v2/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "mutation { podFindAndDeployOnDemand(input: { cloudType: SECURE, gpuTypeId: \"NVIDIA RTX 3090\", name: \"central-mcp-agent-c\", imageName: \"'$DOCKER_IMAGE'\", dockerArgs: \"\", containerDiskInGb: 20, volumeInGb: 50, env: [{key: \"AGENT_LETTER\", value: \"C\"}, {key: \"AGENT_MODEL\", value: \"glm-4-6\"}, {key: \"AGENT_ROLE\", value: \"backend\"}] }) { id, imageName, desiredStatus } }"
  }'
echo ""

# Deploy Agent D
echo "Deploying Agent D (UI)..."
curl -X POST "https://api.runpod.io/v2/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "mutation { podFindAndDeployOnDemand(input: { cloudType: SECURE, gpuTypeId: \"NVIDIA RTX 3090\", name: \"central-mcp-agent-d\", imageName: \"'$DOCKER_IMAGE'\", dockerArgs: \"\", containerDiskInGb: 20, volumeInGb: 50, env: [{key: \"AGENT_LETTER\", value: \"D\"}, {key: \"AGENT_MODEL\", value: \"glm-4-6\"}, {key: \"AGENT_ROLE\", value: \"ui\"}] }) { id, imageName, desiredStatus } }"
  }'
echo ""

echo "✅ All 4 agents deployed!"
echo "Check RunPod dashboard for pod IDs and SSH details"
```

---

## 🔗 PHASE 4: CONNECT AGENTS TO CENTRAL-MCP

### Step 4.1: Get Pod SSH Connection Details

**From RunPod Dashboard:**
- Each pod gets: `ssh://pod-id@ssh.runpod.io:port`
- Save these for each agent

### Step 4.2: SSH into Each Pod and Start Agent

```bash
# Agent A (Coordinator)
ssh root@ssh.runpod.io -p PORT_A

# Inside pod:
cd /workspace
export AGENT_LETTER=A
export AGENT_MODEL=claude-sonnet-4-5
export AGENT_ROLE=coordinator
export CENTRAL_MCP_URL=http://34.41.115.199:3000

# Set API keys (from Doppler)
export ANTHROPIC_API_KEY="your-key"

# Start Claude Code
claude-code

# In Claude Code, connect to Central-MCP:
# Say: "Connect to MCP"
# Tool will automatically use connectToMCP
```

**Repeat for Agents B, C, D with their respective environment variables**

### Step 4.3: Verify Central-MCP Connection

```bash
# On GCP VM - check agent connections
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Query agent sessions
sqlite3 /opt/central-mcp/data/registry.db \
  "SELECT agent_letter, agent_model, status, connected_at FROM agent_sessions WHERE status='ACTIVE';"

# Expected output:
# A|claude-sonnet-4-5|ACTIVE|2025-10-12 10:30:00
# B|claude-sonnet-4-5|ACTIVE|2025-10-12 10:31:00
# C|glm-4-6|ACTIVE|2025-10-12 10:32:00
# D|glm-4-6|ACTIVE|2025-10-12 10:33:00
```

---

## 🎯 PHASE 5: AUTOMATED START/STOP SCRIPTS

### Start All Agents:

Create `scripts/start-runpod-agents.sh`:

```bash
#!/bin/bash
# Start all RunPod agents
set -e

RUNPOD_API_KEY=$(doppler secrets get --project central-mcp --config prod RUNPOD_API_KEY --plain)

echo "🚀 Starting all RunPod agents..."

# Get pod IDs (you'll fill these in after first deployment)
POD_A="pod-id-agent-a"
POD_B="pod-id-agent-b"
POD_C="pod-id-agent-c"
POD_D="pod-id-agent-d"

for POD_ID in $POD_A $POD_B $POD_C $POD_D; do
  echo "Starting pod $POD_ID..."
  curl -X POST "https://api.runpod.io/v2/$POD_ID/start" \
    -H "Authorization: Bearer $RUNPOD_API_KEY"
  echo ""
done

echo "✅ All agents starting! Wait 2-3 minutes for boot."
```

### Stop All Agents (Save Money):

Create `scripts/stop-runpod-agents.sh`:

```bash
#!/bin/bash
# Stop all RunPod agents to save money
set -e

RUNPOD_API_KEY=$(doppler secrets get --project central-mcp --config prod RUNPOD_API_KEY --plain)

echo "⏸️  Stopping all RunPod agents..."

POD_A="pod-id-agent-a"
POD_B="pod-id-agent-b"
POD_C="pod-id-agent-c"
POD_D="pod-id-agent-d"

for POD_ID in $POD_A $POD_B $POD_C $POD_D; do
  echo "Stopping pod $POD_ID..."
  curl -X POST "https://api.runpod.io/v2/$POD_ID/stop" \
    -H "Authorization: Bearer $RUNPOD_API_KEY"
  echo ""
done

echo "✅ All agents stopped! No charges until restart."
```

---

## 📊 COST TRACKING

### Daily Cost Calculator:

```bash
# Create cost tracking script
cat > scripts/runpod-cost-check.sh << 'EOF'
#!/bin/bash
# Check RunPod costs

RUNPOD_API_KEY=$(doppler secrets get --project central-mcp --config prod RUNPOD_API_KEY --plain)

echo "💰 RunPod Cost Report"
echo "===================="
echo ""

# Get billing info
curl -s "https://api.runpod.io/v2/billing/balance" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  | jq '{balance: .balance, last_charge: .lastCharge, total_spent: .totalSpent}'

echo ""
echo "Hourly Rate: $0.59/hour per pod"
echo "4 pods = $2.36/hour"
echo ""
echo "Current billing period costs:"
echo "  24 hours:  $56.64"
echo "  7 days:    $396.48"
echo "  30 days:   $1,708.80"
EOF

chmod +x scripts/runpod-cost-check.sh
```

---

## ✅ SUCCESS CHECKLIST

### Deployment Complete When:
- [ ] Docker image built and pushed
- [ ] 4 RunPod pods deployed
- [ ] Each pod accessible via SSH
- [ ] Claude Code CLI running in each pod
- [ ] All 4 agents connected to Central-MCP
- [ ] Agent sessions visible in Central-MCP database
- [ ] Tasks assigned and claimed successfully
- [ ] Start/stop scripts working

---

## 🎉 FINAL ARCHITECTURE

```
GCP VM (FREE):
  ✅ Central-MCP brain (coordination)
  ✅ Dashboard UI (monitoring)
  ✅ Task registry (assignment)
  ✅ WebSocket server (communication)
  Cost: $0/month

RunPod Pods ($0.59/hour each):
  ✅ Agent A (Coordinator) - Claude Sonnet 4.5
  ✅ Agent B (Architecture) - Claude Sonnet 4.5
  ✅ Agent C (Backend) - GLM 4.6
  ✅ Agent D (UI) - GLM 4.6
  Cost: $2.36/hour (4 pods) = $56/day when running

Total Infrastructure:
  On-demand (8h/day, 22 days): ~$420/month
  Business hours (12h/day): ~$850/month
  24/7 continuous: ~$1,700/month
```

**PERFECT HYBRID SOLUTION!** 🚀

- **Free coordination** (GCP e2-micro)
- **Massive compute** (RunPod GPUs)
- **On-demand scaling** (start/stop as needed)
- **Zero resource contention** (dedicated pods)

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Build agent image
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
docker build -f docker/Dockerfile.agent -t central-mcp-agent:latest .
docker push YOUR_USERNAME/central-mcp-agent:latest

# 2. Deploy agents (via web UI or API)
./scripts/deploy-runpod-agents.sh

# 3. Start working
./scripts/start-runpod-agents.sh

# 4. Stop when done
./scripts/stop-runpod-agents.sh

# 5. Check costs
./scripts/runpod-cost-check.sh
```

---

**Generated**: October 12, 2025
**System**: Central-MCP + RunPod Hybrid Architecture
**Status**: ✅ **READY FOR DEPLOYMENT**
