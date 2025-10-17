# 📚 .injected_knowledge/ Directory - System Overview

**Purpose:** Agent onboarding knowledge packages for Central-MCP ecosystem
**Last Updated:** 2025-10-16

---

## 🎯 WHAT IS THIS DIRECTORY?

This directory contains **Knowledge Packages** that are automatically delivered to AI agents during onboarding. Each package contains **Specialized Knowledge Packs (SKPs)** relevant to the agent's role.

---

## 📦 TWO-TIER KNOWLEDGE SYSTEM

### **TIER 1: Knowledge Packages** (Container Files)

**Format:** `Agent-[LETTER]_knowledge_YYYYMMDD_HHMMSS.md`

**Example:** `Agent-B_knowledge_20251012_201258.md`

**Structure:**
```markdown
# 🧠 Central-MCP Knowledge Package

**Agent:** Agent-B (Design Specialist)
**Template:** Full Agent Onboarding
**Generated:** Sun Oct 12 20:12:59 -03 2025

---

# 📚 Specialized Knowledge Packs (SKPs)

## 📦 SKP: Topic Name (v1.0.0)
[SKP content here...]

## 🔧 Tools

## 📋 Specifications

## 📝 Templates
```

**Purpose:**
- Agent onboarding packages
- Role-based knowledge delivery
- Multi-SKP containers
- Timestamp-based versioning

---

### **TIER 2: SKPs** (Content Modules)

**Format (inside Knowledge Package):** `## 📦 SKP: Topic Name (v1.0.0)`

**Format (as ZIP file):** `TOPIC_NAME_v1.0.0.zip`

**Storage:**
- Inside Knowledge Packages (markdown sections)
- As ZIP files in `03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/`

**Versioning:** Semantic versioning (v1.0.0 → v1.1.0 → v1.2.0)

**Purpose:**
- Topic-specific knowledge modules
- Version-tracked content
- Reusable across multiple agents
- Independently updatable

---

## 📋 NAMING CONVENTIONS

### Knowledge Packages
```
Pattern: Agent-[LETTER]_knowledge_YYYYMMDD_HHMMSS.md

Components:
- Agent-[LETTER]: Agent identifier (A, B, C, D, E, F, CLI, etc.)
- knowledge: Fixed keyword
- YYYYMMDD: Date (20251016 = October 16, 2025)
- HHMMSS: Time (202000 = 20:20:00)

Examples:
✅ Agent-B_knowledge_20251012_201258.md
✅ Agent-CLI_knowledge_20251016_202000.md
❌ CLAUDE_CODE_CONFIG_20251016.md (missing agent prefix)
❌ Agent-B_20251012.md (missing "knowledge" keyword)
```

### SKPs (Section Headers)
```
Pattern: ## 📦 SKP: Topic Name (v1.0.0)

Components:
- ## 📦 SKP:: Fixed section marker
- Topic Name: Human-readable name
- (v1.0.0): Semantic version

Examples:
✅ ## 📦 SKP: ULTRATHINK Realtime Voice Mastery (v1.2.0)
✅ ## 📦 SKP: Claude Code CLI Multi-Model Configuration (v1.0.0)
❌ # SKP: Topic (missing emoji and version)
```

### SKP ZIP Files
```
Pattern: TOPIC_NAME_vX.Y.Z.zip

Components:
- TOPIC_NAME: SCREAMING_SNAKE_CASE
- _v: Version prefix
- X.Y.Z: Semantic version

Examples:
✅ ULTRATHINK_REALTIME_VOICE_MASTERY_v1.2.0.zip
✅ CLAUDE_CODE_CLI_CONFIGURATION_v1.0.0.zip
❌ realtime-voice-v1.zip (wrong case, incomplete version)
```

---

## 🗂️ CURRENT INVENTORY

### Agent-B_knowledge_20251012_201258.md (9.3KB)
- **Agent:** Agent-B (Design Specialist)
- **Date:** October 12, 2025
- **SKPs:**
  - ULTRATHINK Realtime Voice Mastery (v1.2.0)
- **Topics:** WebRTC, OpenAI Realtime API, Voice interfaces
- **Tools:** 4 tools (SKP pipeline, Backend registry, etc.)
- **Specs:** 11 specifications

### Agent-CLI_knowledge_20251016_202000.md (10KB)
- **Agent:** Agent-CLI (Claude Code Configuration Specialist)
- **Date:** October 16, 2025
- **SKPs:**
  - Claude Code CLI Multi-Model Configuration (v1.0.0)
- **Topics:** Multi-model setup, Z.ai integration, 1M context
- **Critical:** Fake env vars debunked, sonnet[1m] documentation

---

## 🔄 RELATIONSHIP TO OTHER SYSTEMS

### Knowledge Injection System
- **Location:** `docs/KNOWLEDGE_INJECTION_SYSTEM.md`
- **Purpose:** Automatically delivers these packages to agents
- **Trigger:** Agent connection, task start, manual request
- **Database:** Tracks injection history in `knowledge_injections` table

### SKP Ingestion Pipeline
- **Location:** `scripts/update-skp.sh`
- **Purpose:** Updates SKPs with version tracking
- **Storage:** `03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/`
- **Database:** Tracks versions in `skp_registry`, `skp_versions` tables

### Knowledge Space Dashboard
- **Location:** `central-mcp-dashboard/app/knowledge/`
- **Purpose:** Browse and search knowledge packages
- **API:** `/api/knowledge/space`

---

## 📝 HOW TO ADD NEW KNOWLEDGE

### Option 1: Create Knowledge Package (Agent Onboarding)

```bash
# Naming pattern
Agent-[LETTER]_knowledge_YYYYMMDD_HHMMSS.md

# Template structure
# 🧠 Central-MCP Knowledge Package

**Agent:** Agent-X (Role Description)
**Template:** Full Agent Onboarding
**Generated:** [Timestamp]

---

# 📚 Specialized Knowledge Packs (SKPs)

## 📦 SKP: Your Topic Name (v1.0.0)

[Content here...]
```

### Option 2: Update Existing SKP

```bash
# Use SKP ingestion pipeline
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp
./scripts/update-skp.sh SKP_ID SOURCE_PATH

# Example
./scripts/update-skp.sh ULTRATHINK_REALTIME_VOICE_MASTERY /path/to/updated/files
```

---

## ⚠️ CRITICAL RULES

1. **NEVER** delete old knowledge packages - they're timestamped for a reason
2. **ALWAYS** use proper naming convention for new packages
3. **ALWAYS** version SKPs semantically (v1.0.0 → v1.1.0 → v2.0.0)
4. **ALWAYS** include agent identifier in filename
5. **ALWAYS** timestamp packages (YYYYMMDD_HHMMSS)
6. **NEVER** create standalone files without agent prefix
7. **ALWAYS** use "📦 SKP:" marker for knowledge pack sections

---

## 🔍 SEARCH & DISCOVERY

### Find Knowledge Packages by Agent
```bash
ls -lh Agent-B_knowledge_*.md
```

### Find Knowledge Packages by Date
```bash
ls -lh Agent-*_knowledge_20251016_*.md
```

### Search SKP Content
```bash
grep -r "SKP:" *.md
```

### View Knowledge Package
```bash
cat Agent-CLI_knowledge_20251016_202000.md
```

---

## 📊 METRICS

- **Total Packages:** 2
- **Total Agents:** 2 (Agent-B, Agent-CLI)
- **Total SKPs:** 2
- **Date Range:** Oct 12 - Oct 16, 2025
- **Total Size:** 19.3KB

---

## 🎓 BEST PRACTICES

1. **One Package Per Agent Session:** Each onboarding creates new timestamped package
2. **Multiple SKPs Per Package:** Package can contain many SKPs
3. **Version SKPs Independently:** Each SKP has its own version
4. **Preserve History:** Old packages show evolution of agent knowledge
5. **Document Critical Discoveries:** Like "fake env vars don't exist"
6. **Cross-Reference:** Link related SKPs and tools

---

**For complete system documentation, see:**
- `docs/KNOWLEDGE_INJECTION_SYSTEM.md`
- `docs/SKP_INGESTION_PIPELINE.md`
- `KNOWLEDGE_SPACE_README_PARSING_SYSTEM.md`
