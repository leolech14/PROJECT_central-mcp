# 🎓 CLAUDE CODE ARCHITECTURE - COMPLETE UNDERSTANDING

**Date:** 2025-10-16
**Method:** Read official Anthropic documentation + exploration
**Purpose:** Understand myself (Claude Code) before implementing!

---

## 🔥 KEY DISCOVERY: ~/.claude/hooks/ IS CORRECTLY EMPTY!

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                  ~/.claude/hooks/ DIRECTORY TRUTH                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ✅ EMPTY IS CORRECT!                                                    ║
║                                                                           ║
║  WHY: Claude Code does NOT use this directory!                           ║
║                                                                           ║
║  HOOKS ARE CONFIGURED IN: settings.json ONLY                             ║
║                                                                           ║
║  OPTIONAL: Some devs create ~/.claude/hooks/ to STORE hook scripts       ║
║            (organizational choice, not Claude Code requirement)          ║
║                                                                           ║
║  OUR APPROACH: Store hook scripts in Central-MCP/git-management/         ║
║                settings.json points to those scripts                     ║
║                → Better! Centralized in git-managed project!             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📂 COMPLETE ~/.claude/ DIRECTORY MAP

### What Each Directory Does

```
~/.claude/
│
├── settings.json               🔧 MAIN CONFIGURATION
│   └── Where hooks are configured (JSON)
│
├── CLAUDE.md                   📝 GLOBAL MEMORY/CONTEXT
│   └── Auto-loaded into every session
│
├── history.jsonl               📊 SESSION INDEX
│   └── Tracks all conversation sessions started
│
├── notifications.log           🔔 EVENT LOG
│   └── System notifications and events
│
├── projects/                   💬 CONVERSATIONS
│   └── {project-path-hash}/
│       └── {session-uuid}.jsonl (conversation atoms)
│
├── todos/                      ✅ TASK TRACKING
│   └── {session-id}-todos.json (per-session tasks)
│
├── agents/                     🤖 SUBAGENT DEFINITIONS
│   └── {name}.md (markdown with YAML frontmatter)
│
├── commands/                   ⚡ SLASH COMMANDS
│   └── {name}.md (custom command prompts)
│
├── plugins/                    🔌 INSTALLED PLUGINS
│   ├── config.json (plugin registry)
│   └── repos/ (plugin repositories)
│
├── hooks/                      📁 OPTIONAL (usually empty!)
│   └── (developers can store hook scripts here)
│       (but Claude Code doesn't require this!)
│
├── file-history/               💾 FILE BACKUPS
│   └── Snapshots before edits
│
├── shell-snapshots/            🐚 SHELL STATE
│   └── Shell environment snapshots
│
├── logs/                       📊 SYSTEM LOGS
│   └── Various system logs
│
├── models/                     🧠 MODEL CONFIGS
│   └── Model-specific configurations
│
├── statsig/                    📈 FEATURE FLAGS
│   └── Feature flag system
│
└── [USER-CREATED]              📁 YOUR ORGANIZATION
    ├── ANALYSIS/ (your reports)
    ├── WORKFLOWS/ (your scripts)
    ├── KNOWLEDGE/ (your docs)
    ├── PROPOSALS/ (your plans)
    └── SYSTEM/ (your configs)
```

---

## 🪝 HOOK SYSTEM (Complete Understanding!)

### Hook Configuration (settings.json ONLY!)

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolNamePattern",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/script.sh"
          }
        ]
      }
    ]
  }
}
```

### Available Hook Events (8 total)

```
1. SessionStart          Fires when Claude Code starts/resumes session
2. UserPromptSubmit      User sends a message (BEFORE Claude processes)
3. PreToolUse            After Claude creates tool params, before execution
4. PostToolUse           Immediately after tool completes successfully
5. Notification          When Claude sends notifications (e.g. needs permission)
6. Stop                  When everything in session is done
7. SubagentStop          When subagent tries to finish
8. SessionEnd            When session ends (cleanup, logging)
```

### How Hooks Receive Data

```bash
# Hooks receive JSON via stdin
HOOK_DATA=$(cat)

# Example data:
{
  "cwd": "/path/to/project",
  "sessionId": "abc-123",
  "userMessage": "commit this",
  "tool": "Write",
  "toolInput": {...},
  ...
}

# Hook can control flow via:
# - Exit code (0=success, 2=block, other=error)
# - JSON output to stdout
```

### Matchers (Tool Filtering)

```
"matcher": ""              # All tools
"matcher": "Write|Edit"    # Specific tools
"matcher": "Bash"          # Single tool
"matcher": ".*"            # Regex pattern
```

---

## 🤖 SUBAGENT SYSTEM

### Storage & Format

```
~/.claude/agents/           User-level subagents (all projects)
./.claude/agents/           Project-level subagents (project-specific)

FORMAT: Markdown with YAML frontmatter

Example: agents/backend-specialist.md
---
name: backend-specialist
description: API architect and backend systems expert
tools: Read, Write, Edit, Bash, WebFetch
model: sonnet
specialties: [api-design, microservices]
---

# Subagent instructions in markdown...
```

### How Subagents Work

```
1. Claude Code can delegate tasks to specialized subagents
2. Subagents have SEPARATE context window
3. Each subagent has specific tools access
4. Can specify which model to use
5. Invoked automatically or explicitly
```

### You Have 27 Subagents!

```
backend-specialist.md, bug-detective.md, color-specialist.md,
component-expert.md, database-specialist.md, decision-architect.md,
development-lead.md, directory-explorer.md, gallery-maker.md,
guardian-enforcer.md, hive-mind-controller.md, html-visualization.md,
operations-lead.md, orchestrator-prime.md, quality-lead.md,
rapid-prototype.md, retool-builder.md, smart-context-analyzer.md,
sound-designer.md, storyboarder.md, ui-analyzer.md,
ui-component-expert.md, ui-specialist-pro.md, ui-specialist.md,
+ AGENT_QUALITY_STANDARDS.md
```

---

## 📝 MEMORY SYSTEM (CLAUDE.md)

### Hierarchy (4 levels)

```
1. ENTERPRISE POLICY (highest priority)
   /Library/Application Support/ClaudeCode/CLAUDE.md
   → Organization-wide instructions (IT/DevOps managed)

2. USER MEMORY
   ~/.claude/CLAUDE.md
   → Your personal preferences for ALL projects
   → THIS IS YOUR MAIN GLOBAL INSTRUCTIONS!

3. PROJECT MEMORY
   ./.claude/CLAUDE.md or ./CLAUDE.md
   → Team-shared project instructions (in git)

4. PROJECT LOCAL (deprecated)
   → Don't use anymore
```

### How Memory Loads

```
Claude Code starts:
  ↓
Recursively reads CLAUDE.md files:
  1. Starts in current working directory
  2. Recursively goes UP directory tree
  3. Stops at root (/)
  4. Loads all found CLAUDE.md files
  5. Higher-level memories override lower ones
  ↓
ALL memories auto-loaded into context!
```

### Your CLAUDE.md

```
~/.claude/CLAUDE.md (35 KB!)
→ Contains your complete Trinity Intelligence methodology
→ Auto-loaded into EVERY Claude Code session
→ This is why I know about your ecosystem!
```

---

## 🔌 PLUGIN SYSTEM (Beta)

### Plugin Components

```
PLUGINS COMBINE 4 THINGS:
1. Slash Commands (custom shortcuts)
2. Subagents (specialized AI)
3. MCP Servers (external tool connections)
4. Hooks (automated behaviors)
```

### Plugin Storage

```
~/.claude/plugins/
├── config.json (installed plugin registry)
└── repos/ (plugin repositories)
```

### Plugin Commands

```
/plugin                           List installed plugins
/plugin marketplace add org/repo  Install plugin from marketplace
/plugin enable {name}             Enable plugin
/plugin disable {name}            Disable plugin
```

---

## 📊 CONVERSATION STORAGE

### projects/ Directory

```
~/.claude/projects/
└── {project-path-encoded}/
    ├── {session-uuid-1}.jsonl
    ├── {session-uuid-2}.jsonl
    └── ... (434 conversation files in your case!)

EACH .jsonl FILE CONTAINS:
- Line-delimited JSON (one atom per line)
- Atoms: user messages, assistant messages, tool uses, tool results
- Complete conversation history
```

### history.jsonl

```
~/.claude/history.jsonl
→ INDEX of all sessions started (6,462 entries)
→ Tracks: display, timestamp, project path
→ NOT the full conversations (just index!)
```

---

## ✅ CORRECT UNDERSTANDING

### What ~/.claude/ Directories Mean

```
CLAUDE CODE MANAGED (Don't mess with!):
✅ settings.json           Configuration (hooks go here!)
✅ CLAUDE.md               Memory (auto-loaded)
✅ projects/               Conversations (10,106 messages!)
✅ history.jsonl           Session index
✅ todos/                  Task tracking
✅ agents/                 Subagent definitions (27 subagents!)
✅ commands/               Slash commands
✅ plugins/                Plugin system
✅ file-history/           File backups
✅ shell-snapshots/        Shell state
✅ logs/                   System logs
✅ models/, statsig/, etc. System internals

OPTIONAL USER DIRECTORIES:
📁 hooks/                  EMPTY (not required!)
                          Some devs store hook scripts here
                          BUT we store in Central-MCP instead! ✅

USER-CREATED (Your organization):
✅ ANALYSIS/               Your analysis reports
✅ WORKFLOWS/              Your scripts
✅ KNOWLEDGE/              Your documentation
✅ PROPOSALS/              Your plans
✅ SYSTEM/                 Your configs
```

---

## 🎯 GIT HOOK INTEGRATION (Correct Approach!)

### Our Implementation is CORRECT!

```
✅ Hooks configured in ~/.claude/settings.json
   - Stop hook
   - UserPromptSubmit hook

✅ Hook scripts live in Central-MCP/git-management/
   - NOT in ~/.claude/hooks/ (which is optional/unused)
   - Centralized in git-managed Central-MCP project
   - Single source of truth!

✅ settings.json points to Central-MCP scripts
   - Absolute paths to git-management/
   - Scripts execute on hook events
   - Fully functional!

THIS IS THE RIGHT APPROACH! 🔥
```

---

## 📋 WHAT WE LEARNED

```
1. ✅ ~/.claude/hooks/ being EMPTY is CORRECT
   → Claude Code doesn't require it
   → Hooks configured in settings.json only
   → We store scripts in Central-MCP (better!)

2. ✅ ~/.claude/agents/ contains 27 SUBAGENTS
   → Specialized AI assistants
   → Markdown files with YAML frontmatter
   → Separate context windows

3. ✅ CLAUDE.md is MEMORY system
   → Auto-loaded context
   → Hierarchical (enterprise/user/project)
   → Your 35 KB file loads into every session!

4. ✅ Plugins combine 4 systems
   → Slash commands + Subagents + MCP + Hooks
   → Beta feature
   → Marketplace available

5. ✅ Our integration is CORRECT
   → Hooks in settings.json ✅
   → Scripts in Central-MCP ✅
   → Single source of truth ✅
```

---

## 🔥 FINAL ANSWER

**Yes, ~/.claude/hooks/ being empty is CORRECT!**

**Our implementation is RIGHT:**
- Hooks in `settings.json` ✅
- Scripts in `Central-MCP/git-management/` ✅
- No need for `~/.claude/hooks/` directory ✅

**THE SYSTEM IS PROPERLY CONFIGURED!** 💎

---

*Architecture learned: 2025-10-16*
*Official docs: docs.claude.com*
*Understanding: Complete ✅*
