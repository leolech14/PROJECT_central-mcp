# 🎯 CENTRAL-MCP GIT MANAGEMENT - SINGLE SOURCE OF TRUTH

**Location:** `/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/`
**Purpose:** Unified git automation for entire ecosystem
**Date:** 2025-10-16

---

## 🔥 THIS IS THE ONLY GIT MANAGEMENT DIRECTORY!

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    SINGLE SOURCE OF TRUTH FOR GIT                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ALL git automation lives HERE in Central-MCP!                           ║
║  No scripts in ~/.claude, no duplicates, single directory!               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📂 CONSOLIDATED FILES

### The 2 Auto-Commit Triggers

```
1. agent-batch-commit-hook.sh          ✅ TRIGGER 1
   Purpose: Auto-commit after agent task batch completion
   When: Deterministic validation passes
   Env vars: CLAUDE_AGENT_ID, CLAUDE_BATCH_ID, CLAUDE_TASKS_COMPLETED

2. trigger-auto-commit.sh              ✅ TRIGGER 2
   Purpose: Auto-commit after user validates achievements
   When: User confirms 3 validation prompts
   Interactive: Yes (asks user Y/n questions)
```

### Ecosystem-Wide Sync

```
3. ecosystem-git-auto-sync.sh          ✅ GLM-4.6 ORCHESTRATOR
   Purpose: Hourly sync of ALL repos in ecosystem
   Features:
     - Auto-discovers all git repos
     - Commits changes across all projects
     - Detects agent commits
     - Integrates with GitIntelligenceEngine
     - Batch processing
   Interval: Run hourly (via cron or launchd)
```

### Hook Management

```
4. setup-post-commit-hook.sh           ✅ HOOK INSTALLER
   Purpose: Install post-commit hook in any repo
   Installs: .git/hooks/post-commit (calls Central-MCP)
```

---

## 🎯 HOW TO USE

### Trigger 1: Agent Batch Completion

```bash
# Set environment variables
export CLAUDE_AGENT_ID="Agent-B"
export CLAUDE_BATCH_ID="BATCH-001"
export CLAUDE_TASKS_COMPLETED='["T-001","T-002","T-003"]'
export CLAUDE_EXECUTION_REPORT="./report.md"

# Run trigger
/Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/agent-batch-commit-hook.sh

# Result: Commits with agent batch details
```

### Trigger 2: User Validation

```bash
# After completing work
cd /path/to/project

# Run trigger (interactive)
/Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/trigger-auto-commit.sh

# Answer validation prompts:
# ❓ Have you completed your work? [Y/n] → Y
# ❓ Are you satisfied with the results? [Y/n] → Y
# ❓ Do you want to auto-commit these changes? [Y/n] → Y

# Result: Auto-commits with intelligent message
```

### Ecosystem-Wide Sync

```bash
# Run hourly sync manually
/Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/ecosystem-git-auto-sync.sh sync

# Or configure cron/launchd to run hourly
```

### Install Hook in Any Project

```bash
cd /path/to/project
/Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/setup-post-commit-hook.sh

# Result: Post-commit hook installed
```

---

## 🏗️ INTEGRATION ARCHITECTURE

```
EVERY PROJECT'S .git/hooks/post-commit:
#!/bin/bash
# Calls Central-MCP for processing
/Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/process-commit.sh "$@"

CENTRAL-MCP git-management/:
├── agent-batch-commit-hook.sh       (trigger on task validation)
├── trigger-auto-commit.sh           (trigger on user validation)
├── ecosystem-git-auto-sync.sh       (hourly ecosystem sync)
├── setup-post-commit-hook.sh        (hook installer)
└── process-commit.sh                (called by hooks)

CENTRAL-MCP src/git/:
└── GitIntelligenceEngine.ts         (intelligence core)

CENTRAL-MCP src/auto-proactive/:
└── GitPushMonitor.ts                (Loop 9 - 60s intelligence)

VM:
└── Cron: */5 * * * * auto-sync-central-mcp.sh (pulls from GitHub)
```

---

## 🔒 RULES

```
1. ALL git automation scripts → THIS DIRECTORY
2. NO git scripts in ~/.claude (except workspace-specific backup)
3. NO duplicates anywhere
4. Hooks in projects call scripts HERE
5. Central-MCP is SINGLE SOURCE OF TRUTH
```

---

## 📊 STATUS

```
✅ Consolidated: All git scripts in single directory
✅ Trigger 1: agent-batch-commit-hook.sh (task validation)
✅ Trigger 2: trigger-auto-commit.sh (user validation)
✅ Ecosystem: ecosystem-git-auto-sync.sh (hourly sync)
✅ Installer: setup-post-commit-hook.sh (hook setup)
```

---

*Git Management consolidated to Central-MCP: 2025-10-16*
*Location: PROJECT_central-mcp/scripts/git-management/*
*Status: SINGLE SOURCE OF TRUTH established*
