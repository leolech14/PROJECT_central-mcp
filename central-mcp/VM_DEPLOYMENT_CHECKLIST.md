# ✅ VM DEPLOYMENT CHECKLIST - NEVER FORGET!

**CRITICAL:** This checklist MUST be followed every time you make changes to Central-MCP.

---

## 🚨 THE GOLDEN RULE:

```
┌─────────────────────────────────────────────────────────────┐
│  ALWAYS DEPLOY CENTRAL-MCP BEFORE DEPLOYING DASHBOARDS!     │
│                                                               │
│  Local changes ≠ VM changes                                  │
│  Dashboard expects NEW schema, VM has OLD schema = BROKEN    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST:

- [ ] **Local changes tested?** (`npm run dev` works locally)
- [ ] **TypeScript compiles?** (`npm run build` succeeds)
- [ ] **Database schema changed?** (check migrations/)
- [ ] **New dependencies added?** (package.json updated)
- [ ] **Environment variables changed?** (.env updated)

---

## 🚀 DEPLOYMENT STEPS:

### 1. Deploy Central-MCP Backend (FIRST!)

```bash
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
./scripts/deploy-central-mcp-to-vm.sh
```

**This script:**
- ✅ Builds locally (catches errors)
- ✅ Copies source to VM
- ✅ Installs dependencies on VM
- ✅ Builds on VM
- ✅ Restarts systemd service
- ✅ Verifies deployment

**Wait for success message before continuing!**

### 2. Verify Central-MCP is Running

```bash
# Check service status
gcloud compute ssh central-mcp-server --zone=us-central1-a \
  --command='sudo systemctl status central-mcp'

# Check logs
gcloud compute ssh central-mcp-server --zone=us-central1-a \
  --command='sudo journalctl -u central-mcp -f'

# Verify database schema
gcloud compute ssh central-mcp-server --zone=us-central1-a \
  --command='sqlite3 /opt/central-mcp/data/registry.db ".tables"'

# Check auto-proactive loops
gcloud compute ssh central-mcp-server --zone=us-central1-a \
  --command='sqlite3 /opt/central-mcp/data/registry.db "SELECT COUNT(*) FROM auto_proactive_logs;"'
```

**Expected results:**
- ✅ Service: `active (running)`
- ✅ Logs: No errors, loops executing
- ✅ Database: `auto_proactive_logs` table exists
- ✅ Loops: >0 records (system is working)

### 3. Deploy Dashboards (AFTER Central-MCP!)

```bash
# Deploy Next.js dashboard
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
./scripts/deploy-dashboard-to-vm.sh
```

**Now dashboards will connect to the updated backend!**

---

## 🛑 COMMON MISTAKES TO AVOID:

### ❌ WRONG: Deploy dashboard without updating Central-MCP
```bash
# This will FAIL with "no such table" errors
./scripts/deploy-dashboard-to-vm.sh  # Dashboard expects NEW schema
# VM has OLD Central-MCP with OLD schema = BROKEN
```

### ✅ RIGHT: Deploy Central-MCP first, then dashboard
```bash
# Step 1: Update backend
./scripts/deploy-central-mcp-to-vm.sh  # Updates schema

# Step 2: Verify it works
gcloud compute ssh central-mcp-server --zone=us-central1-a \
  --command='sudo journalctl -u central-mcp -f'

# Step 3: Deploy dashboard
./scripts/deploy-dashboard-to-vm.sh  # Now it works!
```

---

## 📊 VERIFICATION COMMANDS:

### Quick Health Check:
```bash
# All-in-one verification
gcloud compute ssh central-mcp-server --zone=us-central1-a --command='
  echo "=== SERVICE STATUS ===" && \
  sudo systemctl status central-mcp --no-pager && \
  echo -e "\n=== DATABASE TABLES ===" && \
  sqlite3 /opt/central-mcp/data/registry.db ".tables" && \
  echo -e "\n=== AUTO-PROACTIVE LOGS ===" && \
  sqlite3 /opt/central-mcp/data/registry.db "SELECT COUNT(*) as total_executions FROM auto_proactive_logs;" && \
  echo -e "\n=== RECENT LOGS ===" && \
  sudo journalctl -u central-mcp --since "1 minute ago" --no-pager | tail -10
'
```

### Dashboard API Test:
```bash
# Test Next.js dashboard API
curl -s http://136.112.123.243:3002/api/central-mcp | jq '.status, .loops.active, .projects.total'

# Should return:
# "operational"
# 9  (or number of active loops)
# 44 (or number of projects)
```

---

## 🔄 WHEN TO DEPLOY:

Deploy Central-MCP to VM whenever you:
- ✅ Add new features (auto-proactive loops, etc.)
- ✅ Change database schema
- ✅ Update API endpoints
- ✅ Fix critical bugs
- ✅ Change environment variables
- ✅ Update dependencies

**RULE OF THUMB:** If local and VM are out of sync, deploy!

---

## 📝 NPM SCRIPT SHORTCUT:

Add to `package.json`:
```json
{
  "scripts": {
    "deploy:vm": "./scripts/deploy-central-mcp-to-vm.sh",
    "verify:vm": "gcloud compute ssh central-mcp-server --zone=us-central1-a --command='sudo systemctl status central-mcp'"
  }
}
```

Then simply run:
```bash
npm run deploy:vm
npm run verify:vm
```

---

## 🎯 QUICK REFERENCE:

| Task | Command |
|------|---------|
| Deploy Central-MCP | `./scripts/deploy-central-mcp-to-vm.sh` |
| Deploy Dashboard | `./scripts/deploy-dashboard-to-vm.sh` |
| View logs | `gcloud compute ssh central-mcp-server --zone=us-central1-a --command='sudo journalctl -u central-mcp -f'` |
| Check database | `gcloud compute ssh central-mcp-server --zone=us-central1-a --command='sqlite3 /opt/central-mcp/data/registry.db ".tables"'` |
| Test API | `curl http://136.112.123.243:3002/api/central-mcp` |

---

## ✅ POST-DEPLOYMENT CHECKLIST:

After deployment, verify:
- [ ] Central-MCP service is `active (running)`
- [ ] No errors in logs (`journalctl -u central-mcp -f`)
- [ ] Database has `auto_proactive_logs` table
- [ ] Auto-proactive loops are executing (>0 log entries)
- [ ] API endpoints return 200 (not 500)
- [ ] Dashboard loads without "Connection Error"
- [ ] Dashboard shows real data (not fallback data)

---

**REMEMBER: Central-MCP backend FIRST, dashboards SECOND!** 🎯
