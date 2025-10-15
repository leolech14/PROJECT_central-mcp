# 🌟 PHOTON + RUNPOD INTEGRATION STRATEGY

**Date:** 2025-10-12
**Status:** PHOTON EXISTS - Not yet integrated with RunPod
**Opportunity:** Massive synergy potential!

---

## 🔍 WHAT IS PHOTON?

**PHOTON = Cloud Agentic Operations Center**

```
PHOTON Server (Port 8080)
├── PhotonCore - Core logic layer
├── PhotonAPI - HTTP REST API server
└── PhotonIntegrations
    ├── VM Tools (SSH, file access)
    └── A2A Protocol (Agent-to-Agent communication)
```

**Purpose:** HTTP API alternative to MCP protocol
**Status:** Built, has startup scripts, NOT deployed to VM yet
**Features:**
- VM access tools (bash, files, directories)
- Agent-to-Agent protocol server
- REST API endpoints
- Separate from MCP server (different paradigm)

---

## 🤔 CURRENT ARCHITECTURE

### What We Have:

**1. MCP Server (Port 3000 - stdio)**
```typescript
// src/index.ts
- Task registry tools
- Intelligence tools
- Visual tools (ComfyUI)
- RunPod tools ← JUST ADDED!
- Communicates via MCP protocol (stdio)
```

**2. PHOTON Server (Port 8080 - HTTP)**
```typescript
// Separate server, not running yet
- VM tools
- A2A protocol
- HTTP REST API
- NOT integrated with RunPod yet
```

**3. Dashboard (Port 3001)**
```typescript
// Next.js dashboard
- Calls MCP backend at port 3000
- Could also call PHOTON at port 8080
```

---

## 💡 INTEGRATION OPPORTUNITIES

### Option A: RunPod → MCP Only (Current Approach)
**Status:** ✅ ALREADY IMPLEMENTED

```
RunPod API
    ↓
Loop 10 (MCP)
    ↓
MCP Tools (get_runpod_status)
    ↓
Dashboard API (via MCP backend)
```

**Pros:**
- ✅ Already done
- ✅ Works with agent MCP connections
- ✅ Integrated with auto-proactive loops

**Cons:**
- ❌ Only accessible via MCP protocol
- ❌ No HTTP REST API access
- ❌ Can't call from external services

---

### Option B: RunPod → PHOTON + MCP (Dual Integration)
**Status:** 🎯 RECOMMENDED!

```
                RunPod API
                     ↓
            ┌────────┴────────┐
            ↓                 ↓
    Loop 10 (MCP)      PHOTON HTTP API
            ↓                 ↓
    MCP Tools         REST Endpoints
            ↓                 ↓
    Agents         External Services
```

**Pros:**
- ✅ MCP agents can use RunPod tools
- ✅ External HTTP clients can query status
- ✅ Dashboard can call either MCP or HTTP
- ✅ Best of both worlds!

**Cons:**
- ⚠️ Requires adding RunPod routes to PhotonAPI
- ⚠️ Two servers to maintain

---

### Option C: RunPod → PHOTON Only (Full Migration)
**Status:** ❌ NOT RECOMMENDED

```
RunPod API
    ↓
PHOTON HTTP API
    ↓
REST Endpoints only
```

**Pros:**
- Simple HTTP architecture
- Easy external access

**Cons:**
- ❌ Loses auto-proactive loops
- ❌ Agents can't use MCP tools
- ❌ No Loop 10 cost monitoring
- ❌ Breaks existing integration

---

## 🎯 RECOMMENDED APPROACH: DUAL INTEGRATION

### Architecture:

```
┌─────────────────────────────────────────────────┐
│  RUNPOD API (GraphQL)                           │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  MCP SERVER  │   │ PHOTON API   │
│  Port 3000   │   │ Port 8080    │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ↓                  ↓
  Loop 10            HTTP Routes
  MCP Tools          /api/runpod/*
       │                  │
       ↓                  ↓
   Agents          External Clients
```

**Why Both?**
1. **Loop 10** needs to run in MCP server (auto-proactive engine)
2. **HTTP endpoints** enable external access (webhooks, integrations)
3. **Dashboard** can call whichever is faster
4. **Agents** get MCP tools natively
5. **Future integrations** get HTTP REST API

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Add RunPod Routes to PHOTON ✅
**Files to modify:**
1. `src/photon/PhotonAPI.ts` - Add RunPod routes
2. `src/photon/PhotonIntegrations.ts` - Initialize RunPod
3. Import existing `runpodIntegration.ts`

**New endpoints:**
```typescript
GET  /api/runpod/status     - Pod status
GET  /api/runpod/history    - Cost history
GET  /api/runpod/alerts     - Cost alerts
POST /api/runpod/control    - Pod control
```

---

### Phase 2: Deploy PHOTON to VM
**Steps:**
1. Upload Photon files to VM
2. Configure environment (.env)
3. Start Photon on port 8080
4. Test HTTP endpoints
5. Configure nginx reverse proxy

**URLs:**
```
http://34.41.115.199:8080         → PHOTON API
http://34.41.115.199:3000         → MCP Server
http://34.41.115.199:3001         → Dashboard
```

---

### Phase 3: Dashboard Integration
**Update dashboard to call both:**
```typescript
// Option A: Call MCP backend
const status = await fetch('/api/runpod/status');

// Option B: Call PHOTON directly
const status = await fetch('http://34.41.115.199:8080/api/runpod/status');
```

---

## 💻 CODE TO ADD

### 1. PhotonAPI RunPod Routes

**File:** `src/photon/PhotonAPI.ts`

```typescript
// Import RunPod integration
import { getRunPodStatus, controlPod } from '../tools/runpod/runpodIntegration.js';

// In setupRoutes():
private setupRoutes(): void {
  // ... existing routes ...

  // RunPod routes
  this.app.get('/api/runpod/status', async (req, res) => {
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

  this.app.post('/api/runpod/control/:podId/:action', async (req, res) => {
    try {
      const { podId, action } = req.params;
      const result = await controlPod(podId, action as any);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
```

---

### 2. Photon Deployment Script

**File:** `scripts/deploy-photon-to-vm.sh`

```bash
#!/bin/bash
# Deploy PHOTON to Central-MCP VM

VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"

echo "🚀 Deploying PHOTON to VM..."

# 1. Upload Photon files
gcloud compute scp --recurse \
  src/photon/ \
  $VM_NAME:/opt/central-mcp/src/ \
  --zone=$VM_ZONE

# 2. Upload startup script
gcloud compute scp \
  start-photon.sh \
  $VM_NAME:/opt/central-mcp/ \
  --zone=$VM_ZONE

# 3. Create systemd service
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo tee /etc/systemd/system/photon.service > /dev/null <<'EOF'
[Unit]
Description=PHOTON Cloud Operations Center
After=network.target

[Service]
Type=simple
User=lech
WorkingDirectory=/opt/central-mcp
Environment=NODE_ENV=production
Environment=PHOTON_PORT=8080
ExecStart=/usr/bin/node dist/photon/PhotonServer.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable photon
sudo systemctl start photon
"

echo "✅ PHOTON deployed and running on port 8080"
```

---

## 🎯 BENEFITS OF DUAL INTEGRATION

### For MCP Agents:
- ✅ Use RunPod tools directly
- ✅ Get cost monitoring via Loop 10
- ✅ Native MCP protocol

### For External Services:
- ✅ HTTP REST API access
- ✅ Webhook callbacks
- ✅ Third-party integrations

### For Dashboard:
- ✅ Can call either endpoint
- ✅ Fallback if one is down
- ✅ Load balancing options

### For Future:
- ✅ Slack/Discord webhooks
- ✅ Mobile apps
- ✅ Third-party monitoring
- ✅ Zapier/Make.com integrations

---

## 📊 DEPLOYMENT STATUS

### Already Complete:
- ✅ RunPod integration in MCP server
- ✅ Loop 10 cost monitoring
- ✅ MCP tools (get_runpod_status, control_pod)
- ✅ PHOTON server code exists
- ✅ Startup scripts ready

### To Do:
- [ ] Add RunPod routes to PhotonAPI
- [ ] Deploy PHOTON to VM
- [ ] Test HTTP endpoints
- [ ] Update dashboard to use HTTP
- [ ] Configure nginx reverse proxy
- [ ] Document HTTP API

---

## 🤔 SHOULD WE DO THIS?

### Arguments FOR Dual Integration:
1. **MCP already works** - Loop 10 running
2. **HTTP adds value** - External access
3. **No breaking changes** - Additive only
4. **Future-proof** - More integration options
5. **Low effort** - PHOTON already built

### Arguments AGAINST:
1. **Two servers** - More maintenance
2. **Not urgent** - MCP works fine
3. **Deployment complexity** - Another service to manage

---

## 💡 RECOMMENDATION

**START WITH MCP ONLY (CURRENT STATE)**

**Reasons:**
1. Loop 10 already integrated with auto-proactive engine
2. Agents using MCP tools natively
3. Dashboard can call MCP backend
4. PHOTON can be added LATER when needed
5. Don't over-engineer before requirements proven

**When to add PHOTON HTTP:**
- When external services need access
- When webhooks are required
- When third-party integrations needed
- When mobile app is built
- When performance bottleneck in MCP

---

## 🚀 NEXT STEPS

### Immediate:
1. **Keep RunPod in MCP** (current implementation)
2. **Enable Loop 10** when RunPod API key added
3. **Test MCP tools** with agents
4. **Monitor costs** via Loop 10

### Future (When Needed):
1. Add RunPod routes to PhotonAPI (2-3 hours)
2. Deploy PHOTON to VM (1 hour)
3. Update dashboard to call HTTP (1 hour)
4. Document HTTP API (1 hour)

**Total effort:** ~5-6 hours when needed

---

## ✅ CONCLUSION

**PHOTON Status:** Built but not deployed
**RunPod Integration:** Complete in MCP, not in PHOTON yet
**Recommendation:** Start with MCP-only, add PHOTON later
**Current Focus:** Get RunPod API key → Enable Loop 10 → Test

**PHOTON is ready when you need HTTP API access!**

