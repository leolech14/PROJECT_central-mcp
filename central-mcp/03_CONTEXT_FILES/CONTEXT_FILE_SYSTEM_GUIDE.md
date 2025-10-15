# 📁 CONTEXT-FILE SYSTEM GUIDE - Time-Stamped Knowledge Management

**Date**: October 10, 2025
**Purpose**: Document the context-file directory system for each project
**Status**: CANONICAL REFERENCE

---

## 🎯 THE PROBLEM THIS SOLVES

### LLM Context Management Challenges
```
Problem 1: Context Limits (200K tokens)
- Can't hold entire large project in memory
- Must carefully manage what's in context
- Context compaction loses precision

Problem 2: No Control Over Context Content
- LLM decides what to remember/forget
- Can't precisely control context window
- Important details may be lost

Problem 3: Growing Projects
- Project files grow beyond single LLM context
- New concerns emerge daily
- No clear way to track "what's most recent"

Problem 4: Knowledge Persistence
- Context lost between sessions
- Manual re-explanation required
- No time-stamped history
```

### The Solution: Context-File Directory System
```
Each project has dedicated context-file directory
Simply dump new files with timestamps
Check file modification times to find latest concerns
Central-MCP stores all context files in cloud
Never lose knowledge, always know what's recent
```

---

## 📂 DIRECTORY STRUCTURE

### For Central-MCP
```
PROJECT_central-mcp/central-mcp/
├── 01_CODEBASES/          # Functional code
├── 02_SPECBASES/          # Structured specifications
├── 03_CONTEXT_FILES/      # 🆕 Time-stamped context management
│   ├── PROTOCOL_FIRST_SELF_BUILDING_VISION.md (Oct 10, 2025)
│   ├── CLOUD_STORAGE_COST_ANALYSIS.md (Oct 10, 2025)
│   ├── SCOPE_AND_PRIORITIES.md (Oct 10, 2025)
│   ├── PROJECTS_COMPLETE_INVENTORY.md (Oct 10, 2025)
│   └── PROJECT_REALITY_CHECK.md (Oct 10, 2025)
├── 04_AGENT_FRAMEWORK/    # Agent coordination
├── docs/                  # General documentation
├── src/                   # Source code
└── dist/                  # Compiled output
```

### For LocalBrain
```
LocalBrain/
├── 01_CODEBASES/          # Swift, Next.js, widget system
├── 02_SPECBASES/          # LocalBrain specifications
├── 03_ITERATION_CONTEXT/  # Iteration-specific context
├── 04_AGENT_FRAMEWORK/    # 6-agent coordination
│   ├── CENTRAL_TASK_REGISTRY.md (task list)
│   ├── MCP_SYSTEM_ARCHITECTURE.md (architecture)
│   └── mcp-integration/ (client code)
└── 05_EXECUTION_STATUS/   # Real-time status
```

### For Other Projects
```
PROJECT_*/
├── 03_CONTEXT_FILES/      # 🆕 Standard location for all projects
│   ├── YYYYMMDD_HHMMSS_concern-name.md
│   ├── YYYYMMDD_HHMMSS_architecture-decision.md
│   └── YYYYMMDD_HHMMSS_status-report.md
└── [other project directories...]
```

---

## 🕐 TIME-STAMPED FILE NAMING

### Recommended Pattern
```
YYYYMMDD_HHMMSS_CATEGORY_description.md

Examples:
20251010_130200_PROTOCOL_self_building_vision.md
20251010_125700_COST_cloud_storage_analysis.md
20251010_125600_STATUS_project_reality_check.md
20251010_124600_BRIEFING_chatgpt5_analysis.md
```

### Alternative Pattern (Human-Readable)
```
CATEGORY_description.md (file system timestamp)

Examples:
PROTOCOL_FIRST_SELF_BUILDING_VISION.md (Oct 10, 2025 13:02)
CLOUD_STORAGE_COST_ANALYSIS.md (Oct 10, 2025 12:57)
SCOPE_AND_PRIORITIES.md (Oct 10, 2025 12:56)

Pros: More readable filenames
Cons: Rely on filesystem timestamps (can be lost)
```

### What We're Using (Human-Readable + Trust Filesystem)
- Descriptive names: `PROTOCOL_FIRST_SELF_BUILDING_VISION.md`
- Trust filesystem timestamps for sorting
- Easy to understand what file contains
- `ls -lt` or `ls -lht` shows chronological order

---

## 📊 FINDING LATEST CONCERNS

### Quick Commands
```bash
# Show all context files by modification time (newest first)
cd PROJECT_*/03_CONTEXT_FILES
ls -lht

# Show just filenames with human-readable dates
ls -lht | awk '{print $6, $7, $8, $9}'

# Show only last 5 modified files
ls -lt | head -6

# Find all files modified today
find . -maxdepth 1 -type f -mtime -1

# Find all files modified this week
find . -maxdepth 1 -type f -mtime -7
```

### Central-MCP Context Files (Chronological)
```bash
$ cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/03_CONTEXT_FILES
$ ls -lht

Oct 10 13:02  PROTOCOL_FIRST_SELF_BUILDING_VISION.md (newest!)
Oct 10 12:57  CLOUD_STORAGE_COST_ANALYSIS.md
Oct 10 12:56  SCOPE_AND_PRIORITIES.md
Oct 10 12:55  PROJECTS_COMPLETE_INVENTORY.md
Oct 10 12:54  PROJECT_REALITY_CHECK.md
```

**Latest Concerns = Top of the list!**

---

## 🎯 HOW TO USE THIS SYSTEM

### For New Concerns/Decisions
```bash
# 1. Create new context file in 03_CONTEXT_FILES/
cd PROJECT_central-mcp/central-mcp/03_CONTEXT_FILES

# 2. Write the content
cat > NEW_FEATURE_ANALYSIS.md <<EOF
# Feature Analysis - [Name]
**Date**: $(date +%Y-%m-%d)
**Purpose**: [What this document is about]

[Content...]
EOF

# 3. File timestamp = creation time
# No need to manually add timestamp to filename!

# 4. Later: Check what's newest
ls -lht
```

### For Reading Latest Context
```bash
# 1. Go to context files directory
cd PROJECT_*/03_CONTEXT_FILES

# 2. List by modification time
ls -lht

# 3. Read newest file (top of list)
cat $(ls -t | head -1)

# 4. Or read last 3 modified files
for f in $(ls -t | head -3); do
  echo "=== $f ==="
  cat "$f"
  echo ""
done
```

### For Agents Loading Context
```typescript
// Central-MCP loads context for agent
async function getLatestContext(projectName: string, limit: number = 5) {
  const contextDir = `gs://central-mcp-context-files/${projectName}/03_CONTEXT_FILES`;

  // List files sorted by modification time (newest first)
  const files = await gcs.listFiles(contextDir, {
    sortBy: 'updated',
    order: 'desc',
    limit: limit
  });

  // Load only newest N files (surgical context loading)
  const contexts = await Promise.all(
    files.map(file => gcs.readFile(file.path))
  );

  return contexts;
}

// Agent uses this
const recentContext = await getLatestContext('PROJECT_central-mcp', 5);
// Agent gets ONLY 5 newest context files, not entire project!
```

---

## 📦 CLOUD STORAGE INTEGRATION

### Syncing to GCS
```bash
# One-time setup
gsutil mb -c COLDLINE -l us-central1 gs://central-mcp-context-files

# Initial upload (entire PROJECTS_all)
gsutil -m rsync -r /Users/lech/PROJECTS_all gs://central-mcp-context-files/

# Daily sync (only changed files)
gsutil -m rsync -r /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/03_CONTEXT_FILES \
  gs://central-mcp-context-files/PROJECT_central-mcp/03_CONTEXT_FILES/

# Cost: $0.63/month for entire 157GB ecosystem
```

### Reading from GCS (Agents)
```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket('central-mcp-context-files');

// Get latest context file
async function getLatestContextFile(projectName: string) {
  const [files] = await bucket.getFiles({
    prefix: `${projectName}/03_CONTEXT_FILES/`,
    autoPaginate: false,
    maxResults: 1,
    orderBy: 'updated desc' // Newest first
  });

  if (files.length === 0) return null;

  const [content] = await files[0].download();
  return content.toString();
}

// Usage
const latestContext = await getLatestContextFile('PROJECT_central-mcp');
// Agent gets ONLY newest file, not entire project!
```

---

## 🎯 BENEFITS OF THIS SYSTEM

### 1. No Manual Timestamp Management
- Filesystem tracks modification times automatically
- No need to add timestamps to filenames
- Sort by `ls -lt` always shows chronological order

### 2. Always Know What's Recent
- Latest concerns = newest files in directory
- `ls -lht | head -5` = last 5 concerns
- No guessing what's current

### 3. Surgical Context Loading
- Agents load ONLY newest N files
- No need for full project in memory
- Fast, efficient context retrieval

### 4. Knowledge Never Lost
- All context files stored in cloud (GCS)
- Persistent across sessions
- Historical context preserved forever

### 5. Simple Workflow
```
New concern → Create file in 03_CONTEXT_FILES/ → Done!
Need context → ls -lht → Read newest files → Done!
```

---

## 📊 CONTEXT FILE CATEGORIES

### By Content Type

#### PROTOCOL_* - Protocol & Architecture
- Protocol-first methodology
- Self-building architecture
- System design principles

#### COST_* - Cost Analysis
- Cloud storage costs
- VM costs
- Service pricing

#### STATUS_* - Project Status
- Current state reports
- Reality checks
- Inventories

#### BRIEFING_* - Analysis Requests
- ChatGPT-5 briefings
- Strategic analysis documents
- Decision support

#### SCOPE_* - Scope & Planning
- Project scope definitions
- Priorities and DoD
- Success criteria

#### CONCERN_* - Specific Concerns
- Technical concerns
- Architectural concerns
- Strategic concerns

---

## 🚀 INTEGRATION WITH PROTOCOL-FIRST SYSTEM

### How Context Files Enable Self-Building

```
Phase 1: New Concern Emerges
  ↓
Create context file: CONCERN_runpod_integration.md
  ↓
File timestamp = Oct 10, 2025 14:30
  ↓
Stored in 03_CONTEXT_FILES/

Phase 2: Agent Needs Context
  ↓
Central-MCP: "Get latest concerns for PROJECT_central-mcp"
  ↓
Loads: getLatestContext('PROJECT_central-mcp', 5)
  ↓
Agent receives:
  1. CONCERN_runpod_integration.md (Oct 10 14:30) ← Newest!
  2. PROTOCOL_FIRST_SELF_BUILDING_VISION.md (Oct 10 13:02)
  3. CLOUD_STORAGE_COST_ANALYSIS.md (Oct 10 12:57)
  4. SCOPE_AND_PRIORITIES.md (Oct 10 12:56)
  5. PROJECTS_COMPLETE_INVENTORY.md (Oct 10 12:55)

Phase 3: Agent Executes with Current Context
  ↓
Agent knows:
  - RunPod integration is newest concern
  - Protocol-first architecture to follow
  - Cost constraints ($0.63/month storage)
  - Current scope and priorities
  - Complete project inventory
  ↓
Agent executes with PRECISE, CURRENT context
NO need for full project in memory!
```

### The Magic: Time-Stamped Knowledge Base

**Traditional Approach:**
- Human: "Here's what's important..." (manual context management)
- LLM: "Got it!" (may forget, no persistence)
- Next session: "Wait, what were we doing?" (knowledge loss)

**Protocol-First Approach:**
- Concern emerges → Context file created (automatic timestamp)
- Agent needs context → Load newest N files (automatic selection)
- Knowledge persists forever → Cloud storage (automatic sync)
- NO manual context management needed!

---

## ✅ QUICK REFERENCE

### Creating New Context File
```bash
cd PROJECT_*/03_CONTEXT_FILES
cat > YOUR_CONCERN_NAME.md <<EOF
# [Title]
**Date**: $(date +%Y-%m-%d)
**Purpose**: [What this is about]

[Content...]
EOF
```

### Finding Latest Concerns
```bash
cd PROJECT_*/03_CONTEXT_FILES
ls -lht | head -10  # Show 10 newest files
```

### Syncing to Cloud
```bash
gsutil -m rsync -r PROJECT_*/03_CONTEXT_FILES \
  gs://central-mcp-context-files/PROJECT_*/03_CONTEXT_FILES/
```

### Loading for Agent (TypeScript)
```typescript
const context = await getLatestContext('PROJECT_name', 5);
// Gets 5 newest context files only
```

---

## 🎯 EACH PROJECT STRUCTURE

### Standard Layout (All Projects)
```
PROJECT_*/
├── 01_CODEBASES/          # Source code
├── 02_SPECBASES/          # Structured specifications
├── 03_CONTEXT_FILES/      # 🆕 Time-stamped context (THIS!)
├── 04_AGENT_FRAMEWORK/    # Agent coordination
├── 05_EXECUTION_STATUS/   # Real-time status
├── docs/                  # General documentation
├── scripts/               # Automation scripts
└── README.md              # Project overview
```

### Current Projects with Context Files

#### Central-MCP
```
03_CONTEXT_FILES/
├── PROTOCOL_FIRST_SELF_BUILDING_VISION.md (Oct 10 13:02)
├── CLOUD_STORAGE_COST_ANALYSIS.md (Oct 10 12:57)
├── SCOPE_AND_PRIORITIES.md (Oct 10 12:56)
├── PROJECTS_COMPLETE_INVENTORY.md (Oct 10 12:55)
└── PROJECT_REALITY_CHECK.md (Oct 10 12:54)
```

#### LocalBrain
```
04_AGENT_FRAMEWORK/ (equivalent to context files)
├── CENTRAL_TASK_REGISTRY.md (task list)
├── MCP_SYSTEM_ARCHITECTURE.md (architecture)
└── UNIVERSAL_MCP_ARCHITECTURE.md (future vision)
```

---

## 📊 STORAGE COST BREAKDOWN

### Context Files Only (Estimated)
```
Average context file: 20 KB
Context files per project: ~10 files
Total projects: 70

Total context files: 70 × 10 × 20 KB = 14 MB

Cost: $0.000056/month (essentially free!)
```

### All Project Files (157 GB)
```
Total: 157 GB
Cost: $0.63/month (GCS Coldline)
Annual: $7.56/year

Context files = tiny fraction of total cost!
```

---

## 🚀 NEXT STEPS

### 1. Create 03_CONTEXT_FILES/ in Each Project
```bash
cd /Users/lech/PROJECTS_all
for dir in PROJECT_*/; do
  mkdir -p "$dir/03_CONTEXT_FILES"
  echo "# Context Files for ${dir%/}" > "$dir/03_CONTEXT_FILES/README.md"
done
```

### 2. Move Existing Context Files
```bash
# Move relevant root-level files to 03_CONTEXT_FILES/
cd PROJECT_central-mcp/central-mcp
mv SCOPE_AND_PRIORITIES.md 03_CONTEXT_FILES/ # Already done!
mv PROJECT_REALITY_CHECK.md 03_CONTEXT_FILES/ # Need to move
mv PROJECTS_COMPLETE_INVENTORY.md 03_CONTEXT_FILES/ # Need to move
# etc.
```

### 3. Sync to Cloud
```bash
# Upload all context files
gsutil -m rsync -r /Users/lech/PROJECTS_all \
  gs://central-mcp-context-files/
```

### 4. Update Central-MCP to Read from GCS
```typescript
// Add context loading to Central-MCP
import { getLatestContext } from './context-loader';

// When agent needs context
const context = await getLatestContext('PROJECT_central-mcp', 5);
```

---

## ✅ SUCCESS CRITERIA

### Context File System is Working When:
- [ ] Every project has 03_CONTEXT_FILES/ directory
- [ ] New concerns automatically go to context files
- [ ] `ls -lht` shows chronological order clearly
- [ ] Agents can load latest N files from GCS
- [ ] No manual timestamp management needed
- [ ] Knowledge persists across all sessions
- [ ] Cloud sync happens automatically (daily)

---

**STATUS**: System documented, ready to implement
**COST**: ~$0.000056/month for context files alone
**BENEFIT**: Never lose knowledge, always know what's recent
**INTEGRATION**: Enables protocol-first self-building architecture

🎯 **Simple. Time-stamped. Persistent. Scalable.**
