# 🖥️ VM Operations Knowledge Pack

## 🎯 Purpose

Complete reference for operating, maintaining, and troubleshooting the Central-MCP VM (GCP us-central1-a). This knowledge pack consolidates all learnings from VM setup, crash investigations, TypeScript fixes, and enterprise-grade operational procedures.

## 📦 Knowledge Pack Contents

### **Core Operations**
- **VM_ARCHITECTURE.md** - Complete VM setup, network, services
- **SERVICE_MANAGEMENT.md** - Systemd service operations
- **DEPLOYMENT_PROCEDURES.md** - Safe deployment workflows
- **ENVIRONMENT_CONFIGURATION.md** - .env.production and variables

### **Monitoring & Health**
- **HEALTH_MONITORING.md** - 24/7 health checks and auto-recovery
- **TROUBLESHOOTING_GUIDE.md** - Common issues and solutions
- **LOG_ANALYSIS.md** - How to read journalctl and service logs

### **Recovery & Prevention**
- **RECOVERY_PROCEDURES.md** - What to do when service crashes
- **PREVENTION_CHECKLIST.md** - Pre-deployment validation gates
- **LESSONS_LEARNED.md** - This PHOTON migration crash investigation

## 🚀 Quick Start

### **First Time on VM**
1. **Read**: VM_ARCHITECTURE.md (understand the setup)
2. **Check**: SERVICE_MANAGEMENT.md (how to control service)
3. **Verify**: Run diagnostic: `bash scripts/vm-diagnostic.sh`

### **Service is Down**
1. **Read**: TROUBLESHOOTING_GUIDE.md
2. **Diagnose**: `sudo journalctl -u central-mcp -n 100`
3. **Recover**: Follow RECOVERY_PROCEDURES.md
4. **Execute**: `bash scripts/vm-fix-complete.sh`

### **Before Deploying**
1. **Read**: DEPLOYMENT_PROCEDURES.md
2. **Validate**: Run pre-deployment validation gates
3. **Deploy**: Follow safe deployment workflow
4. **Verify**: Check health endpoints

## 📊 What We Learned

### **PHOTON Migration Crash (Oct 2025)**

**Root Cause (95% confidence):**
- TypeScript compilation errors (GLM-4.6 investigation)
- Systemd entry point mismatch (Claude investigation)
- Missing .env.production (both found)
- Dual implementation bubbles (parallel development)

**Error Reduction:**
- Before: 1,646 TypeScript errors
- After consolidation: 376 errors
- Target: 0 errors (GLM agents fixing now)

**Permanent Fixes Applied:**
✅ PoolStats and PerformanceMetrics exported
✅ Template literal hell eliminated (1,059 lines!)
✅ Dashboard HTML externalized to templates/
✅ Dual bubbles consolidated (parent = truth)
✅ Enterprise systemd configuration
✅ Health monitoring with auto-recovery
✅ Pre-deployment validation gates

## 🧠 Integration Architecture

### **MacBook → GitHub → VM Sync Flow**

```
LOCAL (Every hour):
  launchd: com.central-mcp.local-git-sync
    ↓
  Calls: Central-MCP/scripts/git-management/ecosystem-git-auto-sync.sh
    ↓
  Commits changes in all PROJECTS_all/ repos
    ↓
  Pushes to GitHub

GITHUB:
  Receives commits from MacBook

VM (Every 5 minutes):
  Cron: */5 * * * * /home/lech/auto-sync-central-mcp.sh
    ↓
  Pulls from GitHub
    ↓
  Syncs to /opt/central-mcp/
    ↓
  Restarts systemd service

VM (Every 60 seconds):
  GitPushMonitor Loop 9
    ↓
  Detects pushes, analyzes commits
    ↓
  Triggers deployments
```

## 🎯 Key Concepts

### **Environment-Specific Execution**
- Scripts live in git (version-controlled)
- Plists/cron local to environment (not in git)
- Same script called by different schedulers
- Update once, all environments benefit

### **Configuration Templates**
- Templates in git (.env.production)
- Instances local with secrets (.env on VM)
- Safe, documented, discoverable

### **Single Source, Multiple Callers**
- Central-MCP/scripts/git-management/ (one location)
- Called by MacBook launchd
- Called by VM cron
- Called by Claude Code hooks
- Called manually when needed

## 📚 Related Knowledge Packs

- **claude-code-architecture/** - Claude Code hooks, subagents, native integration
- **deployment/** - General deployment automation
- **backend-services/** - API and service architecture

## 📊 Version

- **Pack Version**: 1.0.0
- **Last Updated**: 2025-10-16
- **Status**: In Progress (GLM agents fixing TypeScript)
- **Contributors**: Claude Sonnet 4.5, GLM-4.6 Agents 1 & 2

---

*Knowledge pack documenting VM operations excellence*
*Purpose: Ensure VM never crashes again + complete operational knowledge*
*Integration: Part of Central-MCP knowledge base ecosystem*
