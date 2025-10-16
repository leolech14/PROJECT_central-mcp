# 🎯 Claude Code Architecture Knowledge Pack

## 🎯 Purpose

Complete understanding of Claude Code CLI architecture, file structure, hook system, subagents, plugins, and native integration patterns. This knowledge pack provides definitive reference for implementing git automation, task management, and ecosystem-wide orchestration using Claude Code native capabilities.

## 📦 Knowledge Pack Contents

### **Core Architecture**
- **Claude Code Directory Structure** - Complete ~/.claude/ directory map
- **Hook System** - 8 hook events, configuration, and best practices
- **Subagent System** - Specialized AI agents with separate context
- **Plugin Architecture** - MCP servers, slash commands, and extensions
- **Memory System** - CLAUDE.md hierarchy and context management

### **Git Integration Patterns**
- **Native Hook Integration** - Auto-commit triggers via Claude Code hooks
- **Central-MCP Integration** - Single source of truth for git management
- **Task Completion Triggers** - Agent batch validation → commit
- **User Validation Triggers** - Interactive prompts → commit
- **Ecosystem-Wide Sync** - Multi-repository orchestration

### **File Structure Reference**
- **~/.claude/ Directory Map** - All managed directories explained
- **projects/ Format** - Conversation storage (.jsonl atoms)
- **agents/ Format** - Subagent markdown + YAML frontmatter
- **settings.json** - Complete configuration schema

## 🚀 Quick Start

### **Understanding Claude Code**
1. **Read**: CLAUDE_CODE_COMPLETE_ARCHITECTURE.md
2. **Understand**: Hook events and configuration
3. **Explore**: 27 subagents in agents/ directory
4. **Configure**: settings.json for your workflow

### **Git Integration**
1. **Location**: Central-MCP/scripts/git-management/ (single source!)
2. **Triggers**: Stop hook + UserPromptSubmit hook
3. **Scripts**: All git automation consolidated
4. **Architecture**: Claude Code → Central-MCP → VM intelligence

### **Native Integration Patterns**
1. **Hooks in settings.json** point to Central-MCP scripts
2. **Subagents** handle specialized tasks (27 available)
3. **CLAUDE.md** auto-loads context (35 KB global instructions)
4. **Plugins** extend capabilities (MCP + commands + hooks)

## 📊 Best Practices

### **Hook Configuration**
- ✅ Configure in settings.json ONLY (not hooks/ directory)
- ✅ Use absolute paths to scripts
- ✅ Store hook scripts in version-controlled projects
- ✅ Centralize in Central-MCP for ecosystem access
- ✅ Log all hook executions for debugging

### **Git Automation**
- ✅ Single source of truth (Central-MCP/git-management/)
- ✅ Native Claude Code hook integration
- ✅ Task validation before commit (deterministic)
- ✅ User validation with prompts (interactive)
- ✅ Post-commit hooks update databases and VMs

### **Subagent Usage**
- ✅ Use specialized agents for complex tasks
- ✅ Separate context windows prevent pollution
- ✅ Configure tools access per agent
- ✅ Project vs user-level agent definitions

### **Memory Management**
- ✅ Global instructions in ~/.claude/CLAUDE.md
- ✅ Project-specific in ./.claude/CLAUDE.md
- ✅ Hierarchical loading (enterprise > user > project)
- ✅ Keep concise and action-oriented

## 🧠 Integration Architecture

### **Git Automation Flow**
```
Claude Code Hook Event (Stop or UserPromptSubmit)
    ↓
Hook calls Central-MCP/git-management/[handler]
    ↓
Handler validates and triggers appropriate script
    ↓
Script performs git operations
    ↓
Post-commit hook updates databases
    ↓
VM syncs via cron (5 minutes)
    ↓
GitPushMonitor analyzes (60 seconds)
```

### **Central-MCP Integration**
- GitIntelligenceEngine (900 lines) - Git intelligence
- GitPushMonitor (Loop 9, 550 lines) - Push detection
- Task registry database - Completion tracking
- VM API - Remote coordination
- Auto-sync - Deployment automation

## 📚 Documentation Files

1. **CLAUDE_CODE_COMPLETE_ARCHITECTURE.md** - Full system architecture
2. **HOOK_SYSTEM_REFERENCE.md** - Complete hook documentation
3. **SUBAGENT_GUIDE.md** - Subagent creation and usage
4. **GIT_INTEGRATION_PATTERNS.md** - Git automation patterns
5. **SETTINGS_JSON_SCHEMA.md** - Configuration reference

## 🎯 Use Cases

### **Automatic Git Commits**
- Agent completes tasks → Stop hook → Auto-commit
- User validates work → UserPromptSubmit hook → Auto-commit
- Ecosystem sync → Hourly sync all repositories

### **Task Automation**
- Subagents handle specialized tasks
- Hooks trigger actions at key moments
- Central-MCP orchestrates coordination

### **Knowledge Management**
- CLAUDE.md provides global context
- Knowledge packs accessible via API
- Documentation auto-discovered

## 🔗 Related Knowledge Packs

- **deployment/** - Deployment automation and CI/CD
- **backend-services/** - API development patterns
- **system-registries/** - Database and registry systems

## 📊 Version

- **Pack Version**: 1.0.0
- **Last Updated**: 2025-10-16
- **Status**: Complete - Production Ready
- **Author**: Claude Sonnet 4.5 (Self-Learning)

---

*Knowledge pack created through self-exploration and official documentation*
*Purpose: Enable all agents to understand Claude Code native capabilities*
*Integration: Seamless with Central-MCP git management system*
