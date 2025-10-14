# ⚡ RUNPOD AGENT - QUICK START

**One-page reference for rapid deployment**

---

## 🚀 DEPLOYMENT IN 3 COMMANDS

```bash
# 1. Start Docker Desktop
open -a Docker && sleep 10

# 2. Build & Deploy
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
./scripts/deploy-runpod-agent-complete.sh

# 3. Deploy to RunPod (web UI or follow script prompts)
```

---

## 🔑 REQUIRED SECRETS

```bash
# RunPod API Key (get from https://www.runpod.io/console/user/settings)
doppler secrets set RUNPOD_API_KEY "rp-..." --project central-mcp --config prod

# Anthropic API Key (for agents)
doppler secrets set ANTHROPIC_API_KEY "sk-ant-..." --project central-mcp --config prod
```

---

## 🐳 DOCKER IMAGE

**Built**: `central-mcp-agent:latest`
**Based on**: Node.js 20 + Claude Code CLI
**Size**: ~1.5GB
**Location**: `/docker/Dockerfile.agent`

**Manual Build**:
```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
docker build -f docker/Dockerfile.agent -t central-mcp-agent:latest .
docker tag central-mcp-agent:latest YOUR_USERNAME/central-mcp-agent:latest
docker push YOUR_USERNAME/central-mcp-agent:latest
```

---

## 🎮 RUNPOD POD CONFIGURATION

**Via Web UI**: https://runpod.io/console/pods

```
Image:    lech/central-mcp-agent:latest (or your registry)
GPU:      RTX 4090 ($0.69/hr) or RTX A40 ($0.59/hr)
Disk:     20 GB container + 50 GB volume (optional)
Ports:    3000, 8000 (HTTP) + 22 (SSH)

Environment:
  AGENT_LETTER=A
  AGENT_MODEL=claude-sonnet-4-5
  AGENT_ROLE=ui-velocity
  CENTRAL_MCP_URL=http://34.41.115.199:3000
  ANTHROPIC_API_KEY=<from-doppler>
```

---

## 🔗 AGENT CONNECTION (Inside Pod)

```bash
# 1. SSH into pod
ssh root@<pod-ip> -p <port>

# 2. Start Claude Code (startup script runs automatically)
claude-code

# 3. Connect to Central-MCP
# In Claude interface, say: "Connect to MCP"
```

**Agent will**:
- Auto-detect identity (Agent A/B/C/D)
- Register with Central-MCP
- Receive task assignments
- Start working autonomously

---

## 📊 MONITORING

**Dashboard**: http://34.41.115.199:8000/central-mcp-dashboard.html
- Agents tab → See agent appear in real-time
- Tasks tab → Monitor task progress
- Loops tab → System health

**Health Endpoint**: http://34.41.115.199:3000/health

**Database Query**:
```bash
sqlite3 /opt/central-mcp/data/registry.db "
SELECT agent_letter, status, tasks_claimed, tasks_completed, last_heartbeat
FROM agent_sessions WHERE status='ACTIVE';
"
```

---

## 📝 GIT WORKFLOW

**Conventional Commits (Enforced)**:
```bash
git commit -m "feat(api): add RunPod status endpoint"
git commit -m "fix(dashboard): resolve agent key duplication"
git commit -m "docs: update deployment guide"
```

**Auto Actions on Push**:
1. GitPushMonitor (Loop 9) detects
2. Semantic version bump (major.minor.patch)
3. Changelog generation
4. Dashboard notification

**Version Bumps**:
- `feat:` → minor (0.1.0 → 0.2.0)
- `fix:` → patch (0.1.0 → 0.1.1)
- `BREAKING CHANGE:` → major (0.1.0 → 1.0.0)

---

## 💰 COST OPTIMIZATION

**Always-On**:
- 1 Agent: $14-17/day = $424-496/month
- 4 Agents: $61/day = $1,843/month

**8 Hours/Day** (66% savings):
- 1 Agent: $5-6/day = $166-198/month
- 4 Agents: $20/day = $616/month

**Start/Stop API**:
```bash
# Start
curl -X POST "https://api.runpod.io/v2/POD_ID/start" \
  -H "Authorization: Bearer $RUNPOD_API_KEY"

# Stop
curl -X POST "https://api.runpod.io/v2/POD_ID/stop" \
  -H "Authorization: Bearer $RUNPOD_API_KEY"
```

---

## 🔧 TROUBLESHOOTING

**Docker not running**: `open -a Docker`

**Agent can't reach Central-MCP**:
```bash
# Test from pod
curl http://34.41.115.199:3000/health

# Check VM
gcloud compute instances list
gcloud compute ssh central-mcp-server
sudo systemctl status central-mcp
```

**Pod terminated**: Check balance at https://runpod.io/console/billing

**Commit rejected**:
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
echo "feat(test): sample commit" | npx commitlint
```

---

## 📚 FULL DOCS

**Complete Guide**: `RUNPOD_DEPLOYMENT_READY.md`
**Git Intelligence**: `GIT_INTELLIGENCE_AND_VALIDATION_SYSTEM_COMPLETE.md`
**RunPod Quickstart**: `RUNPOD_QUICKSTART.md`

---

## ✅ DEPLOYMENT CHECKLIST

Pre-flight:
- [ ] Docker Desktop running
- [ ] RunPod API key in Doppler
- [ ] Anthropic API key in Doppler
- [ ] Central-MCP VM running

Deployment:
- [ ] Docker image built
- [ ] Image pushed to registry
- [ ] Pod created on RunPod
- [ ] Agent SSH accessible
- [ ] Agent connected to Central-MCP

Verification:
- [ ] Agent in dashboard
- [ ] Tasks auto-assigned
- [ ] Git commits trigger Loop 9
- [ ] Real-time monitoring works

---

**Status**: 🟢 INFRASTRUCTURE READY
**Time to Deploy**: 5-10 minutes
**Next**: Start Docker Desktop → Run deployment script

🚀
