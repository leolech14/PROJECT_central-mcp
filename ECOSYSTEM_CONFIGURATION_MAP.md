# 🗺️ ECOSYSTEM CONFIGURATION MAP - THE MASTER INDEX

**Purpose:** Complete map of WHERE everything lives and HOW to find it
**Audience:** Future agents with NO prior context
**Principle:** Discoverability = Every configuration must be findable
**Date:** 2025-10-16

---

## 🎯 THE MASTER QUESTION

```
"I'm a new agent. I need to debug Central-MCP. Where do I start?"

THIS DOCUMENT IS YOUR ANSWER.
```

---

## 📂 CONFIGURATION HIERARCHY - WHERE EVERYTHING LIVES

### TIER 1: Central-MCP Repository (SOURCE OF TRUTH)

```
Location: /Users/lech/PROJECTS_all/PROJECT_central-mcp/

PURPOSE: Single source of truth for all Central-MCP code and configuration
CONTENTS: Code, scripts, configurations, knowledge, specs

├── src/                              🧠 SOURCE CODE
│   ├── git/ → GitIntelligenceEngine (git intelligence)
│   ├── auto-proactive/ → 9 loops (including GitPushMonitor)
│   ├── database/ → Data layer
│   ├── api/ → HTTP endpoints
│   └── [all application code]
│
├── scripts/                          🔧 AUTOMATION & OPERATIONS
│   ├── git-management/               ⭐ GIT AUTOMATION (SINGLE SOURCE!)
│   │   ├── ecosystem-git-auto-sync.sh (GLM-4.6, 537 lines)
│   │   ├── agent-batch-commit-hook.sh (Trigger 1)
│   │   ├── trigger-auto-commit.sh (Trigger 2)
│   │   ├── on-claude-stop.sh (Hook handler)
│   │   ├── on-user-prompt.sh (Hook handler)
│   │   ├── setup-post-commit-hook.sh (Installer)
│   │   └── README.md
│   │
│   ├── vm-operations/                ⭐ VM-SPECIFIC SCRIPTS
│   │   ├── setup-vm-auto-sync.sh (VM cron installer)
│   │   ├── vm-fix-complete.sh (Diagnostic & repair)
│   │   └── [VM deployment scripts]
│   │
│   └── local-operations/             ⭐ LOCAL-SPECIFIC SCRIPTS
│       └── [MacBook-specific automation]
│
├── 03_CONTEXT_FILES/                 📚 KNOWLEDGE BASE
│   └── SPECIALIZED_KNOWLEDGE_PACKS/
│       ├── claude-code-architecture/ (Claude Code reference)
│       ├── vm-operations/ (VM ops guide)
│       ├── ai-integration/
│       └── [7 more packs]
│
├── .env.production                   ⚙️  VM ENVIRONMENT (Template)
├── package.json                      📦 DEPENDENCIES & BUILD
└── README.md                         📖 PROJECT INDEX
```

---

## 🌍 CONFIGURATION BY ENVIRONMENT

### LOCAL (MacBook) Configurations

```
WHAT RUNS HERE: Local development, Claude Code, hourly sync

LAUNCHD AGENTS (Auto-start on boot):
┌────────────────────────────────────────────────────────────────────────┐
│ FILE: ~/Library/LaunchAgents/com.central-mcp.local-git-sync.plist     │
│ CALLS: Central-MCP/scripts/git-management/ecosystem-git-auto-sync.sh  │
│ FREQUENCY: Every 3600 seconds (1 hour)                                │
│ PURPOSE: Sync ALL PROJECTS_all/ repos to GitHub                       │
│ LOGS: ~/.claude/SYSTEM/logs/local-git-sync.log                        │
│ ENVIRONMENT: MacBook only                                             │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ FILE: ~/Library/LaunchAgents/com.claude.workspace-sync.plist          │
│ CALLS: ~/.claude/WORKFLOWS/sync-claude-workspace.sh                   │
│ FREQUENCY: Every 3600 seconds (1 hour)                                │
│ PURPOSE: Sync ~/.claude workspace only                                │
│ LOGS: ~/.claude/SYSTEM/monitoring/sync.log                            │
│ ENVIRONMENT: MacBook only                                             │
└────────────────────────────────────────────────────────────────────────┘

CLAUDE CODE HOOKS (Native integration):
┌────────────────────────────────────────────────────────────────────────┐
│ FILE: ~/.claude/settings.json                                         │
│ HOOKS:                                                                 │
│   "Stop" → Central-MCP/git-management/on-claude-stop.sh                │
│   "UserPromptSubmit" → Central-MCP/git-management/on-user-prompt.sh   │
│ PURPOSE: Auto-commit on task/user validation                          │
│ ENVIRONMENT: MacBook only (Claude Code)                               │
└────────────────────────────────────────────────────────────────────────┘

GIT HOOKS (.git/hooks/ in each repo):
┌────────────────────────────────────────────────────────────────────────┐
│ FILE: PROJECT_central-mcp/.git/hooks/post-commit                      │
│ CALLS: Central-MCP git-management scripts                             │
│ PURPOSE: Update task DB + notify VM                                   │
│ ENVIRONMENT: MacBook (any repo with hook installed)                   │
└────────────────────────────────────────────────────────────────────────┘
```

### VM (GCP) Configurations

```
WHAT RUNS HERE: Central-MCP service, GitPushMonitor, auto-sync

CRON JOBS (Auto-run every 5 minutes):
┌────────────────────────────────────────────────────────────────────────┐
│ CRON: */5 * * * * /home/lech/auto-sync-central-mcp.sh                 │
│ PURPOSE: Pull from GitHub, sync to /opt/central-mcp/, restart service │
│ SOURCE: Created by scripts/setup-vm-auto-sync.sh                      │
│ LOGS: /home/lech/auto-sync.log                                        │
│ ENVIRONMENT: VM only (GCP us-central1-a)                              │
└────────────────────────────────────────────────────────────────────────┘

SYSTEMD SERVICE (24/7 service):
┌────────────────────────────────────────────────────────────────────────┐
│ FILE: /etc/systemd/system/central-mcp.service                         │
│ EXECUTES: npm start (from /opt/central-mcp/)                          │
│ PURPOSE: Run Central-MCP service continuously                         │
│ RESTART: Always (on crash)                                            │
│ LOGS: journalctl -u central-mcp                                       │
│ ENVIRONMENT: VM only                                                  │
└────────────────────────────────────────────────────────────────────────┘

ENVIRONMENT FILE:
┌────────────────────────────────────────────────────────────────────────┐
│ FILE: /opt/central-mcp/.env.production                                │
│ CONTAINS: PHOTON_PORT, DATABASE_PATH, NODE_ENV, etc.                  │
│ TEMPLATE: Central-MCP/.env.production (in git)                        │
│ DEPLOYMENT: Copied from template during VM setup                      │
│ ENVIRONMENT: VM only                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 SYNC ARCHITECTURE - COMPLETE FLOW

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    HOURLY SYNC FLOW (Bidirectional)                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  MACBOOK (Local Development):                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ Every hour (launchd):                                               │ ║
║  │ 1. ecosystem-git-auto-sync.sh discovers all repos                   │ ║
║  │ 2. Commits changes in each repo                                     │ ║
║  │ 3. Pushes to GitHub                                                 │ ║
║  │ 4. Logs agent commits detected                                      │ ║
║  └─────────────────────────────────────────────────────────────────────┘ ║
║                    ↓ (push)                                               ║
║                                                                           ║
║  GITHUB (Central Repository):                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ Receives commits from:                                              │ ║
║  │ • MacBook (local development)                                       │ ║
║  │ • VM (if VM makes changes)                                          │ ║
║  │ Source of truth for code                                            │ ║
║  └─────────────────────────────────────────────────────────────────────┘ ║
║                    ↓ (pull every 5 min)                                   ║
║                                                                           ║
║  VM (GCP Production):                                                    ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ Every 5 minutes (cron):                                             │ ║
║  │ 1. git fetch origin main                                            │ ║
║  │ 2. If updates: git pull                                             │ ║
║  │ 3. rsync to /opt/central-mcp/                                       │ ║
║  │ 4. If package.json changed: npm install                             │ ║
║  │ 5. systemctl restart central-mcp                                    │ ║
║  │                                                                      │ ║
║  │ Every 60 seconds (GitPushMonitor):                                  │ ║
║  │ 1. Detect git pushes                                                │ ║
║  │ 2. Analyze conventional commits                                     │ ║
║  │ 3. Generate changelogs                                              │ ║
║  │ 4. Trigger deployments                                              │ ║
║  └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 DISCOVERABILITY - HOW TO FIND THINGS

### For a New Agent: "Where is X configured?"

```
QUESTION: "Where is git automation configured?"
ANSWER: Central-MCP/scripts/git-management/
        └── README.md explains everything

QUESTION: "How does hourly sync work on MacBook?"
ANSWER: ~/Library/LaunchAgents/com.central-mcp.local-git-sync.plist
        └── Points to Central-MCP/scripts/git-management/ecosystem-git-auto-sync.sh
        └── See: Central-MCP/scripts/git-management/README.md

QUESTION: "How does VM auto-sync work?"
ANSWER: VM cron: */5 * * * * /home/lech/auto-sync-central-mcp.sh
        └── Created by: Central-MCP/scripts/setup-vm-auto-sync.sh
        └── See: Central-MCP/ECOSYSTEM_CONFIGURATION_MAP.md (this file!)

QUESTION: "What environment variables does VM need?"
ANSWER: Template: Central-MCP/.env.production
        On VM: /opt/central-mcp/.env.production
        └── See: Central-MCP/03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/vm-operations/

QUESTION: "Where is the knowledge base?"
ANSWER: Central-MCP/03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/
        └── Each subdirectory is a knowledge pack
        └── README.md in each pack explains it

QUESTION: "How do I fix the VM if it crashes?"
ANSWER: Central-MCP/scripts/vm-fix-complete.sh
        └── See: Central-MCP/03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/vm-operations/
```

---

## 🏗️ CONFIGURATION OWNERSHIP MATRIX

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CONFIGURATION            │  LIVES IN GIT  │  EXECUTES ON  │  MANAGED BY ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Git Automation Scripts   │  Central-MCP   │  Both         │  Central    ║
║  ecosystem-git-auto-sync  │  ✅            │  MacBook      │  Central    ║
║  auto-sync-central-mcp.sh │  ✅            │  VM           │  Central    ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  LaunchDaemon Plists      │  ~/.claude     │  MacBook      │  Local      ║
║  com.central-mcp.*        │  ❌ (local)    │  MacBook      │  LaunchD    ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  Cron Jobs                │  Central-MCP   │  VM           │  VM Cron    ║
║  VM auto-sync             │  ✅ (script)   │  VM           │  Cron       ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  Systemd Service          │  Central-MCP   │  VM           │  Systemd    ║
║  central-mcp.service      │  ✅ (template) │  VM           │  Systemd    ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  Environment Variables    │  Central-MCP   │  Depends      │  Per-env    ║
║  .env.production          │  ✅ (template) │  VM           │  Manual     ║
║  .env.development         │  ✅ (template) │  MacBook      │  Manual     ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  Git Hooks                │  Central-MCP   │  Both         │  Git        ║
║  post-commit              │  ✅ (template) │  Any repo     │  Git        ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  Claude Code Config       │  ~/.claude     │  MacBook      │  Claude     ║
║  settings.json            │  ❌ (local)    │  MacBook      │  Claude     ║
║  CLAUDE.md                │  ~/.claude     │  MacBook      │  Claude     ║
╚═══════════════════════════════════════════════════════════════════════════╝

KEY INSIGHT:
✅ Scripts IN Git (version-controlled, shareable)
✅ Plists/Cron LOCAL to environment (not in git)
✅ Templates IN Git, Instances LOCAL
✅ Everything discoverable through this map!
```

---

## 🎯 SMART ORGANIZATION PRINCIPLES

### Principle 1: Environment-Specific Execution

```
CODE LIVES IN GIT (Central-MCP repo):
✅ ecosystem-git-auto-sync.sh
   - Version controlled
   - Same code on MacBook and VM
   - BUT: Called by different schedulers

EXECUTION CONFIGURED LOCALLY:
MacBook: ~/Library/LaunchAgents/com.central-mcp.local-git-sync.plist
         └── Calls Central-MCP script

VM: /etc/cron.d/central-mcp-sync (or crontab)
    └── Calls same Central-MCP script

BENEFIT: Update script once, both environments get it!
```

### Principle 2: Templates in Git, Instances Local

```
TEMPLATE (in git):
Central-MCP/.env.production
  ├── Defines all required variables
  ├── Example values
  ├── Documentation
  └── Version controlled

INSTANCE (not in git):
VM: /opt/central-mcp/.env.production
MacBook: /Users/lech/PROJECTS_all/PROJECT_central-mcp/.env
  ├── Actual secrets
  ├── Real API keys
  ├── Environment-specific values
  └── .gitignored (never committed!)

BENEFIT: Secure + documented + discoverable!
```

### Principle 3: Single Source, Multiple Callers

```
SCRIPT: Central-MCP/scripts/git-management/ecosystem-git-auto-sync.sh

CALLED BY:
- MacBook launchd (hourly)
- Could be called by VM cron (hourly)
- Can be called manually: bash [script] sync
- Future: Could be called by other systems

SINGLE SOURCE = Single place to update!
```

---

## 📖 DISCOVERY PATHS FOR COMMON SCENARIOS

### Scenario 1: "VM is down, how do I fix it?"

```
PATH TO ANSWER:
1. Read: Central-MCP/ECOSYSTEM_CONFIGURATION_MAP.md (this file!)
2. Find: VM Operations section
3. Navigate to: 03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/vm-operations/
4. Read: TROUBLESHOOTING_GUIDE.md
5. Execute: scripts/vm-fix-complete.sh

EVERYTHING CONNECTED!
```

### Scenario 2: "How does git automation work?"

```
PATH TO ANSWER:
1. Read: Central-MCP/ECOSYSTEM_CONFIGURATION_MAP.md
2. Find: Git Management section
3. Navigate to: scripts/git-management/
4. Read: README.md
5. Understand: Complete git automation architecture

SINGLE HOP TO ANSWER!
```

### Scenario 3: "What's configured on the VM?"

```
PATH TO ANSWER:
1. Read: Central-MCP/ECOSYSTEM_CONFIGURATION_MAP.md
2. Find: "Configuration by Environment" → VM section
3. See: Cron jobs, systemd service, environment files
4. Navigate to: scripts/vm-operations/ for VM-specific tools

ALL VM CONFIGS DOCUMENTED!
```

### Scenario 4: "Where is [knowledge topic]?"

```
PATH TO ANSWER:
1. Navigate to: Central-MCP/03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/
2. List directories (each is a knowledge domain)
3. Open: [domain]/README.md
4. Find: Specific knowledge pack

AUTO-DISCOVERABLE!
```

---

## 🎓 META-DOCUMENTATION (Documentation of Documentation!)

### This File's Purpose

```
FILE: Central-MCP/ECOSYSTEM_CONFIGURATION_MAP.md

PURPOSE:
✅ Master index of all configurations
✅ Discovery entry point for new agents
✅ Environment-specific guidance
✅ Complete architecture reference

UPDATES WHEN:
- New automation added
- New environment configured
- New knowledge pack created
- Architecture changes

REFERENCED BY:
- Central-MCP/README.md (project root)
- Knowledge pack READMEs
- Troubleshooting guides
- Agent onboarding docs
```

### Documentation Hierarchy

```
LEVEL 1 (Entry Point):
Central-MCP/README.md
  └── Points to: ECOSYSTEM_CONFIGURATION_MAP.md (this file!)

LEVEL 2 (Master Map):
ECOSYSTEM_CONFIGURATION_MAP.md
  └── Points to: Specific modules/knowledge packs

LEVEL 3 (Module Documentation):
scripts/git-management/README.md
scripts/vm-operations/README.md
03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/[domain]/README.md

LEVEL 4 (Detailed Guides):
Knowledge pack specific files
Troubleshooting guides
Implementation details

NAVIGATION: Top-down, always discoverable!
```

---

## ✅ VERIFICATION FOR NEW AGENTS

### Test Discoverability:

```
QUESTION: Can a new agent find git automation?
TEST: Start at Central-MCP/README.md
      → Follow link to ECOSYSTEM_CONFIGURATION_MAP.md
      → Find "Git Management" section
      → Navigate to scripts/git-management/
RESULT: ✅ Discoverable in 3 clicks

QUESTION: Can a new agent find VM configs?
TEST: Start at ECOSYSTEM_CONFIGURATION_MAP.md
      → Find "VM Configurations" section
      → See cron, systemd, env files
RESULT: ✅ Discoverable immediately

QUESTION: Can a new agent fix a crash?
TEST: Search for "crash" or "troubleshooting"
      → Find vm-operations knowledge pack
      → Navigate to TROUBLESHOOTING_GUIDE.md
RESULT: ✅ Discoverable with search
```

---

## 🎯 FUTURE AGENT ONBOARDING

### When a New Agent Asks: "How does Central-MCP work?"

```
STEP 1: Read Central-MCP/README.md
        ├── Project overview
        ├── Quick start
        └── Link to ECOSYSTEM_CONFIGURATION_MAP.md

STEP 2: Read ECOSYSTEM_CONFIGURATION_MAP.md (THIS FILE!)
        ├── Complete configuration map
        ├── Where everything lives
        └── How to find anything

STEP 3: Navigate to specific areas:
        ├── Git management → scripts/git-management/
        ├── VM operations → 03_CONTEXT_FILES/.../vm-operations/
        ├── Knowledge domains → 03_CONTEXT_FILES/.../[domain]/
        └── Source code → src/[module]/

STEP 4: Dive into details:
        └── Module-specific READMEs and guides

RESULT: Complete understanding in <30 minutes!
```

---

## 🔥 THE BIGGER PICTURE

```
Central-MCP Repository = SYSTEM OF RECORD

Contains:
✅ All source code (src/)
✅ All automation scripts (scripts/)
✅ All knowledge (03_CONTEXT_FILES/)
✅ All configuration templates
✅ All documentation
✅ Complete ecosystem map (this file!)

Executes:
✅ On MacBook (via launchd calling scripts)
✅ On VM (via cron/systemd using same scripts)
✅ Everywhere (git-tracked, shareable)

Discoverable:
✅ By new agents (follow README → Map → Specific)
✅ By developers (standard file organization)
✅ By automation (scripts call scripts)
✅ By documentation (hierarchical, linked)

EVERYTHING FITS TOGETHER!
```

---

*Configuration map created: 2025-10-16*
*Purpose: Master index for all ecosystem configurations*
*Principle: Everything must be discoverable*
*Audience: Future agents, developers, automation*
