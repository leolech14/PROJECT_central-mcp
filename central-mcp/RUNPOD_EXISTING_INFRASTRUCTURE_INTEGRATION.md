# 🚀 INTEGRATE EXISTING RUNPOD PODS WITH CENTRAL-MCP

**Date**: October 12, 2025
**Status**: READY TO INTEGRATE
**Infrastructure**: Existing RunPod pods + ComfyUI → Central-MCP coordination

---

## 🎯 INTEGRATION OVERVIEW

### What We're Integrating:

```
┌────────────────────────────────────────────────────────────┐
│              CENTRAL-MCP BRAIN (GCP - FREE)                │
│  • Auto-Proactive Loops                                    │
│  • Task Assignment                                         │
│  • Agent Coordination                                      │
└──────────────────┬─────────────────────────────────────────┘
                   │ (WebSocket + HTTP API)
                   ↓
┌────────────────────────────────────────────────────────────┐
│         YOUR EXISTING RUNPOD INFRASTRUCTURE                │
│                                                             │
│  🎨 ComfyUI Pod (Already Running):                        │
│     • Image generation workflows                          │
│     • API endpoint for visual tasks                       │
│     • Can share resources with agent processes            │
│                                                             │
│  🤖 Additional Pods (Your existing):                      │
│     • Deploy Claude Code CLI agents here                  │
│     • Share GPU resources efficiently                     │
│     • Connect to Central-MCP for coordination             │
└────────────────────────────────────────────────────────────┘
```

**Key Integration Points:**
1. **RunPod API** → Central-MCP monitors pod status
2. **ComfyUI API** → Central-MCP assigns visual generation tasks
3. **Claude Code CLI** → Deployed in existing pods
4. **WebSocket** → Real-time coordination

---

## 📋 STEP 1: ADD RUNPOD CREDENTIALS TO DOPPLER

### Get Your RunPod API Key:

```bash
# 1. Go to RunPod Dashboard
# https://www.runpod.io/console/user/settings

# 2. Navigate to: Settings → API Keys
# 3. Copy your API key

# 4. Store in Doppler
doppler secrets set RUNPOD_API_KEY "your-runpod-api-key-here"

# Verify
doppler secrets get RUNPOD_API_KEY --plain
```

---

## 🔍 STEP 2: DISCOVER EXISTING PODS

### Create Pod Discovery Script:

Save as `scripts/discover-runpod-pods.sh`:

```bash
#!/bin/bash
# Discover all existing RunPod pods
set -e

RUNPOD_API_KEY=$(doppler secrets get RUNPOD_API_KEY --plain)

echo "🔍 Discovering RunPod Pods..."
echo "=============================="
echo ""

# Get all pods
curl -s -X POST "https://api.runpod.io/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "query Pods { myself { pods { id name runtime { gpuCount uptimeInSeconds } costPerHr machineType desiredStatus } } }"
  }' | jq -r '.data.myself.pods[] | "Pod: \(.name)\n  ID: \(.id)\n  GPU: \(.machineType)\n  Cost: $\(.costPerHr)/hour\n  Status: \(.desiredStatus)\n  Uptime: \(.runtime.uptimeInSeconds // 0)s\n"'

echo ""
echo "✅ Pod discovery complete"
echo ""
echo "💡 Next: Identify which pods to use for agents"
```

**Make executable and run:**
```bash
chmod +x scripts/discover-runpod-pods.sh
./scripts/discover-runpod-pods.sh
```

**Expected Output:**
```
Pod: comfyui-production
  ID: abcdef123456
  GPU: NVIDIA RTX 4090
  Cost: $0.89/hour
  Status: RUNNING
  Uptime: 86400s

Pod: dev-environment
  ID: xyz789012345
  GPU: NVIDIA RTX 3090
  Cost: $0.59/hour
  Status: RUNNING
  Uptime: 43200s
```

---

## 🎨 STEP 3: INTEGRATE COMFYUI WITH CENTRAL-MCP

### Why Integrate ComfyUI?

**ComfyUI can handle visual tasks from agents:**
- Generate UI mockups from specs
- Create diagrams and flowcharts
- Design system components
- Visual documentation

### Step 3.1: Get ComfyUI API Endpoint

```bash
# From RunPod dashboard, get ComfyUI pod details:
# - Pod ID
# - HTTP endpoint (usually: https://pod-id-port.proxy.runpod.net)

# Test ComfyUI API
curl -s https://YOUR-POD-ID-8188.proxy.runpod.net/system_stats | jq .
```

### Step 3.2: Add ComfyUI Endpoint to Central-MCP Database

```bash
# SSH to GCP VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Add ComfyUI as a service
sqlite3 /opt/central-mcp/data/registry.db << 'EOF'
-- Create services table if not exists
CREATE TABLE IF NOT EXISTS external_services (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL,
  name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  api_key TEXT,
  status TEXT DEFAULT 'active',
  capabilities JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add ComfyUI service
INSERT INTO external_services (id, service_type, name, endpoint, capabilities)
VALUES (
  'comfyui-001',
  'image_generation',
  'ComfyUI Production',
  'https://YOUR-POD-ID-8188.proxy.runpod.net',
  '["image_generation","workflow_execution","batch_processing","sd_models","controlnet"]'
);

SELECT * FROM external_services;
EOF
```

### Step 3.3: Create ComfyUI MCP Tool

Create `src/tools/visual/generateImage.ts`:

```typescript
/**
 * Generate images using ComfyUI on RunPod
 * Integrated with Central-MCP task system
 */

interface ComfyUIWorkflow {
  prompt: string;
  workflow?: string; // Optional custom workflow JSON
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

export async function generateImage(params: ComfyUIWorkflow) {
  // Get ComfyUI endpoint from database
  const db = await getDatabase();
  const service = db.prepare(
    'SELECT endpoint FROM external_services WHERE service_type = ? AND status = ?'
  ).get('image_generation', 'active');

  if (!service) {
    throw new Error('ComfyUI service not configured');
  }

  const comfyEndpoint = service.endpoint;

  // Default workflow for text-to-image
  const workflow = params.workflow || {
    "3": {
      "inputs": {
        "seed": params.seed || Math.floor(Math.random() * 1000000),
        "steps": params.steps || 20,
        "cfg": 8,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": params.width || 1024,
        "height": params.height || 1024,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": params.prompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": "low quality, blurry, distorted",
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "central_mcp",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  };

  // Queue prompt in ComfyUI
  const response = await fetch(`${comfyEndpoint}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow })
  });

  if (!response.ok) {
    throw new Error(`ComfyUI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const promptId = result.prompt_id;

  // Poll for completion (simplified - should use WebSocket in production)
  let completed = false;
  let imageUrl = null;
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds timeout

  while (!completed && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const historyResponse = await fetch(`${comfyEndpoint}/history/${promptId}`);
    const history = await historyResponse.json();

    if (history[promptId]?.status?.completed) {
      completed = true;
      const outputs = history[promptId].outputs;
      // Extract image URL from outputs
      const saveImageNode = Object.values(outputs).find((node: any) => node.images);
      if (saveImageNode?.images?.[0]) {
        const filename = saveImageNode.images[0].filename;
        imageUrl = `${comfyEndpoint}/view?filename=${filename}`;
      }
    }

    attempts++;
  }

  if (!imageUrl) {
    throw new Error('Image generation timeout or failed');
  }

  return {
    success: true,
    prompt_id: promptId,
    image_url: imageUrl,
    prompt: params.prompt,
    generated_at: new Date(),
    comfyui_endpoint: comfyEndpoint
  };
}

export const generateImageTool = {
  name: 'generate_image',
  description: 'Generate images using ComfyUI on RunPod for visual tasks',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text description of image to generate'
      },
      width: {
        type: 'number',
        description: 'Image width (default: 1024)',
        default: 1024
      },
      height: {
        type: 'number',
        description: 'Image height (default: 1024)',
        default: 1024
      },
      steps: {
        type: 'number',
        description: 'Generation steps (default: 20)',
        default: 20
      }
    },
    required: ['prompt']
  }
};
```

### Step 3.4: Register ComfyUI Tool

Add to `src/tools/index.ts`:

```typescript
// Visual generation tools
export { generateImage, generateImageTool } from './visual/generateImage';

// In tool registration:
mcpServer.tool(
  generateImageTool.name,
  generateImageTool.description,
  generateImageTool.inputSchema,
  async (params) => {
    const result = await generateImage(params);
    return result;
  }
);
```

---

## 🤖 STEP 4: DEPLOY AGENTS TO EXISTING PODS

### Option A: Deploy to ComfyUI Pod (Share Resources)

**ComfyUI pods usually have:**
- 24+ GB VRAM (plenty for GPU tasks)
- 48+ CPU cores (can easily run 4 Claude Code instances)
- 128+ GB RAM (comfortable for agents + ComfyUI)

**Install Claude Code CLI in ComfyUI pod:**

```bash
# Get ComfyUI pod SSH details from RunPod dashboard
ssh root@ssh.runpod.io -p YOUR_PORT

# Inside ComfyUI pod:
# Install Node.js if not present
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Install tmux for multi-agent sessions
apt-get install -y tmux

# Create agent sessions
tmux new-session -d -s agent-a
tmux new-session -d -s agent-b
tmux new-session -d -s agent-c
tmux new-session -d -s agent-d

# List sessions
tmux list-sessions
```

### Option B: Use Separate Pods for Agents

**If you have other idle pods, use those instead:**

```bash
# For each pod:
ssh root@ssh.runpod.io -p POD_PORT

# Install agent environment (same as above)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs tmux
npm install -g @anthropic-ai/claude-code
```

---

## 🔗 STEP 5: CONNECT AGENTS TO CENTRAL-MCP

### Create Agent Startup Scripts on RunPod Pods:

```bash
# On RunPod pod - create startup script for each agent
cat > /workspace/start-agent-a.sh << 'EOF'
#!/bin/bash
export AGENT_LETTER=A
export AGENT_MODEL=claude-sonnet-4-5
export AGENT_ROLE=coordinator
export CENTRAL_MCP_URL=http://34.41.115.199:3000
export ANTHROPIC_API_KEY=$(doppler secrets get ANTHROPIC_API_KEY --plain)

echo "🤖 Starting Agent A (Coordinator)"
echo "Model: $AGENT_MODEL"
echo "Central-MCP: $CENTRAL_MCP_URL"
echo ""
echo "Start Claude Code with: claude-code"
echo 'Then say: "Connect to MCP"'

/bin/bash
EOF

chmod +x /workspace/start-agent-a.sh

# Repeat for agents B, C, D
```

### Start Agents in Tmux Sessions:

```bash
# Agent A
tmux send-keys -t agent-a "/workspace/start-agent-a.sh" C-m
tmux send-keys -t agent-a "claude-code" C-m

# Agent B
tmux send-keys -t agent-b "/workspace/start-agent-b.sh" C-m
tmux send-keys -t agent-b "claude-code" C-m

# Agent C
tmux send-keys -t agent-c "/workspace/start-agent-c.sh" C-m
tmux send-keys -t agent-c "claude-code" C-m

# Agent D
tmux send-keys -t agent-d "/workspace/start-agent-d.sh" C-m
tmux send-keys -t agent-d "claude-code" C-m

# Attach to any session to interact:
tmux attach -t agent-a
```

---

## 📊 STEP 6: CREATE RUNPOD MONITORING DASHBOARD

### Add RunPod Status to Central-MCP:

Create `src/tools/runpod/getRunPodStatus.ts`:

```typescript
/**
 * Monitor RunPod infrastructure status
 */

export async function getRunPodStatus() {
  const apiKey = process.env.RUNPOD_API_KEY;

  const response = await fetch('https://api.runpod.io/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query: `
        query Pods {
          myself {
            pods {
              id
              name
              machineType
              costPerHr
              desiredStatus
              runtime {
                gpuCount
                uptimeInSeconds
              }
            }
          }
        }
      `
    })
  });

  const data = await response.json();
  const pods = data.data.myself.pods;

  return {
    success: true,
    total_pods: pods.length,
    running_pods: pods.filter((p: any) => p.desiredStatus === 'RUNNING').length,
    total_cost_per_hour: pods.reduce((sum: number, p: any) =>
      sum + (p.desiredStatus === 'RUNNING' ? parseFloat(p.costPerHr) : 0), 0
    ),
    pods: pods.map((p: any) => ({
      id: p.id,
      name: p.name,
      gpu: p.machineType,
      cost_per_hour: p.costPerHr,
      status: p.desiredStatus,
      uptime_hours: Math.floor(p.runtime?.uptimeInSeconds / 3600) || 0
    }))
  };
}
```

### Add to Dashboard:

Update `central-mcp-dashboard/app/components/monitoring/RealTimeRegistry.tsx`:

```typescript
// Add RunPod status section
const [runpodStatus, setRunpodStatus] = useState(null);

useEffect(() => {
  const fetchRunPodStatus = async () => {
    const response = await fetch('http://34.41.115.199:3000/api/runpod/status');
    const data = await response.json();
    setRunpodStatus(data);
  };

  fetchRunPodStatus();
  const interval = setInterval(fetchRunPodStatus, 30000);
  return () => clearInterval(interval);
}, []);

// In render:
<div className="glassmorphic-panel p-6">
  <h3 className="text-xl font-bold mb-4">🚀 RunPod Infrastructure</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <div className="text-3xl font-bold text-accent-primary">
        {runpodStatus?.running_pods || 0}
      </div>
      <div className="text-sm text-text-secondary">Active Pods</div>
    </div>
    <div>
      <div className="text-3xl font-bold text-accent-secondary">
        ${runpodStatus?.total_cost_per_hour?.toFixed(2) || '0.00'}/hr
      </div>
      <div className="text-sm text-text-secondary">Current Cost</div>
    </div>
  </div>

  <div className="mt-4 space-y-2">
    {runpodStatus?.pods?.map(pod => (
      <div key={pod.id} className="flex justify-between items-center p-3 bg-scaffold-2 rounded">
        <div>
          <div className="font-medium">{pod.name}</div>
          <div className="text-xs text-text-tertiary">{pod.gpu}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">${pod.cost_per_hour}/hr</div>
          <div className="text-xs text-text-tertiary">
            {pod.uptime_hours}h uptime
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## ✅ INTEGRATION CHECKLIST

### Phase 1: Setup
- [ ] Add RunPod API key to Doppler
- [ ] Discover existing pods
- [ ] Identify ComfyUI pod details
- [ ] Test ComfyUI API access

### Phase 2: ComfyUI Integration
- [ ] Add ComfyUI to external_services table
- [ ] Create generateImage MCP tool
- [ ] Register tool in Central-MCP
- [ ] Test image generation

### Phase 3: Agent Deployment
- [ ] Install Claude Code CLI in pods
- [ ] Create tmux sessions
- [ ] Create agent startup scripts
- [ ] Start agents in tmux sessions

### Phase 4: Connection
- [ ] Connect agents to Central-MCP
- [ ] Verify agent registration in database
- [ ] Test task assignment
- [ ] Test ComfyUI visual tasks

### Phase 5: Monitoring
- [ ] Add RunPod status API endpoint
- [ ] Update dashboard with RunPod stats
- [ ] Test cost tracking
- [ ] Verify real-time updates

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Add RunPod API key
doppler secrets set RUNPOD_API_KEY "your-key-here"

# 2. Discover pods
chmod +x scripts/discover-runpod-pods.sh
./scripts/discover-runpod-pods.sh

# 3. SSH to ComfyUI pod (or any pod)
ssh root@ssh.runpod.io -p YOUR_PORT

# 4. Install agent environment
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs tmux
npm install -g @anthropic-ai/claude-code

# 5. Create agent sessions
for agent in a b c d; do
  tmux new-session -d -s agent-$agent
done

# 6. Start agents (manually in each tmux session)
tmux attach -t agent-a
# Inside: claude-code
# Then: "Connect to MCP"
```

---

## 💰 COST OPTIMIZATION

**Using Existing Pods = $0 Additional Cost!**

If your ComfyUI pod already runs 24/7:
- Cost: $0.89/hour (already paying)
- Add 4 agents: $0 additional (shared resources)
- Total: **No increase in RunPod costs!**

**Resource Utilization:**
- ComfyUI idle time: Use for agent tasks
- CPU cores: 48+ cores, only ~10% used by ComfyUI
- RAM: 128 GB, only ~32 GB used by ComfyUI
- Available: 38+ cores, 96 GB RAM for agents

---

**Generated**: October 12, 2025
**System**: Central-MCP + Existing RunPod Integration
**Status**: ✅ **READY TO INTEGRATE**
