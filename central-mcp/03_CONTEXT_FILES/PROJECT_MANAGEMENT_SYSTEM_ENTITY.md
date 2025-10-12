# 🎯 PROJECT MANAGEMENT SYSTEM - The Missing Entity

**Date**: October 10, 2025
**Identified By**: Lech
**Status**: NEW ENTITY DEFINITION

---

## 🔍 THE GAP IDENTIFIED

### What We Have
```
✅ Central-MCP - Agent coordination (MCP + A2A servers)
✅ SPECBASE - Specification storage system
✅ Task Registry - Task tracking and assignment
✅ Keep-In-Touch - Session monitoring
✅ Opportunity Scanner - Development opportunity discovery
✅ Auto-Generator - Specs, tasks, roles creation
```

### What We're Missing
```
❌ PROJECT MANAGEMENT SYSTEM - Multi-project orchestration layer
```

**Lech's insight:**
> "I THINK WE STILL DONT HAVE AN ENTITY WITH THIS CONCERN"

**You're right!** We have coordination for agents, specs, and tasks, but no overarching **PROJECT MANAGEMENT SYSTEM** that ties everything together across all 70+ projects.

---

## 🎯 ENTITY DEFINITION: PROJECT MANAGEMENT SYSTEM

### What It Is
**PROJECT MANAGEMENT SYSTEM** = Multi-project orchestration layer that:
- Manages 70+ projects simultaneously
- Tracks each project's "soul" (specs + context)
- Coordinates agents across projects
- Monitors project health and progress
- Enables cross-project intelligence sharing

### What It Does

#### 1. Multi-Project Registry
```
Maintains registry of all PROJECT_* directories:
  - PROJECT_central-mcp
  - PROJECT_localbrain
  - PROJECT_minerals
  - PROJECT_profilepro
  - ... (70+ total)

For each project:
  - Local path (where code lives)
  - Cloud path (where soul lives)
  - Status (ACTIVE, STALLED, COMPLETE, ARCHIVED)
  - Last activity timestamp
  - Health metrics
  - Active agents
```

#### 2. Project Soul Management
```
Each project has a "soul" (lightweight intelligence):
  - Specifications (02_SPECBASES/*.md)
  - Context files (03_CONTEXT_FILES/*.md)
  - Task registry (SQLite records)
  - Session history (keep-in-touch logs)

Total per project: ~200 KB
Total all projects: ~14 MB
Storage cost: ~$0.01/year
```

#### 3. Cross-Project Coordination
```
Enables:
  - Agent in PROJECT_A learns from PROJECT_B specs
  - Patterns discovered in one project → Applied to others
  - Shared agent capabilities across projects
  - Resource allocation (agent time distribution)
  - Cross-project dependencies (rare but possible)
```

#### 4. Project Health Monitoring
```
Tracks for each project:
  - Active (agents currently working)
  - Stalled (no activity 7+ days)
  - Complete (all tasks done)
  - Needs attention (blockers, missing roles)

Alerts when:
  - Project has no active agents but has available tasks
  - Project has blockers preventing progress
  - Project missing critical capabilities (no agents with required skills)
```

#### 5. Automatic Project Discovery
```
Continuously scans:
  - /Users/lech/PROJECTS_all/PROJECT_*/
  - Auto-registers new projects
  - Auto-syncs specs and context to cloud
  - Auto-generates scaffold if needed
  - Auto-notifies when new project appears
```

#### 6. Project Lifecycle Management
```
New Project:
  - Auto-register in system
  - Create cloud storage path
  - Generate initial specs (if missing)
  - Set status: ACTIVE

First Agent Connects:
  - Auto-initialize project soul
  - Load specs and context
  - Establish keep-in-touch
  - Scan for opportunities

Project Completion:
  - All tasks complete
  - Archive specs to cloud
  - Set status: COMPLETE
  - Remove from active monitoring

Project Archived:
  - No activity for 90+ days
  - Move to archive storage
  - Set status: ARCHIVED
  - Still accessible on-demand
```

---

## 🏗️ ARCHITECTURE

### System Hierarchy
```
┌─────────────────────────────────────────────────┐
│     PROJECT MANAGEMENT SYSTEM (NEW!)            │
│  Multi-project orchestration & intelligence     │
│  - Manages 70+ projects                         │
│  - Cross-project coordination                   │
│  - Project health monitoring                    │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼──────┐ ┌──▼───────┐ ┌▼─────────────┐
│ Central-MCP  │ │ SPECBASE │ │ Task Registry│
│ Coordination │ │ Storage  │ │ Tracking     │
└──────────────┘ └──────────┘ └──────────────┘
        │           │           │
        └───────────┼───────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼──────┐ ┌──▼───────┐ ┌▼─────────────┐
│ Keep-in-     │ │Opportunity│ │Auto-         │
│ Touch        │ │Scanner    │ │Generator     │
└──────────────┘ └──────────┘ └──────────────┘
```

### Layer Responsibilities

#### PROJECT MANAGEMENT SYSTEM (Top Layer - NEW)
- **Scope**: All 70+ projects
- **Concern**: Multi-project orchestration
- **Storage**: Project registry database
- **Intelligence**: Cross-project patterns, resource allocation

#### Central-MCP (Middle Layer - Existing)
- **Scope**: Per-project agent coordination
- **Concern**: Agent-task matching, session tracking
- **Storage**: Task registry + session logs
- **Intelligence**: Opportunity scanning, auto-generation

#### SPECBASE + Task Registry (Bottom Layer - Existing)
- **Scope**: Specifications and tasks
- **Concern**: Knowledge storage and work tracking
- **Storage**: Specs (GCS) + Tasks (SQLite)
- **Intelligence**: Protocol-first structure (UNIVERSAL_SCHEMA)

---

## 📊 DATABASE SCHEMA

### Projects Table (NEW)
```sql
CREATE TABLE projects (
  -- Identity
  project_id TEXT PRIMARY KEY,          -- UUID
  project_name TEXT UNIQUE NOT NULL,    -- PROJECT_minerals

  -- Locations
  local_path TEXT NOT NULL,             -- /Users/lech/PROJECTS_all/PROJECT_*/
  cloud_path TEXT NOT NULL,             -- gs://central-mcp-project-souls/PROJECT_*/

  -- Metadata
  description TEXT,                     -- What is this project?
  category TEXT,                        -- Type: Product, Tool, Knowledge, etc.

  -- Sync status
  specs_synced_at TIMESTAMP,           -- Last specs upload
  context_synced_at TIMESTAMP,         -- Last context upload
  specs_count INTEGER DEFAULT 0,       -- How many specs
  context_files_count INTEGER DEFAULT 0,

  -- Project state
  status TEXT NOT NULL,                -- ACTIVE, STALLED, COMPLETE, ARCHIVED
  health_score INTEGER,                -- 0-100

  -- Timestamps
  created_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- Metrics
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  blocked_tasks INTEGER DEFAULT 0,
  active_agents INTEGER DEFAULT 0,

  -- Cost tracking
  cloud_storage_bytes INTEGER DEFAULT 0,
  estimated_monthly_cost REAL DEFAULT 0
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_last_activity ON projects(last_activity_at);
CREATE INDEX idx_projects_health ON projects(health_score);
```

### Project Specs Table (NEW)
```sql
CREATE TABLE project_specs (
  spec_id TEXT PRIMARY KEY,             -- CMCP-MODULES-002
  project_id TEXT NOT NULL,
  filename TEXT NOT NULL,               -- SPEC_MODULES_*.md

  -- Spec metadata (from YAML frontmatter)
  title TEXT,
  category TEXT,                        -- MODULES, SCAFFOLD, etc.
  layer TEXT,                           -- UI, API, INFRASTRUCTURE
  priority TEXT,                        -- P0, P1, P2, P3
  status TEXT,                          -- DRAFT, ACTIVE, DEPRECATED
  estimated_hours INTEGER,

  -- Sync info
  synced_at TIMESTAMP,
  cloud_url TEXT,
  file_size_bytes INTEGER,

  -- Dependencies
  dependencies JSON,                    -- [spec_ids]

  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE INDEX idx_specs_project ON project_specs(project_id);
CREATE INDEX idx_specs_priority ON project_specs(priority);
CREATE INDEX idx_specs_status ON project_specs(status);
```

### Project Context Files Table (NEW)
```sql
CREATE TABLE project_context_files (
  context_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  filename TEXT NOT NULL,               -- PROTOCOL_FIRST_*.md

  -- File metadata
  category TEXT,                        -- PROTOCOL, COST, STATUS, etc.
  modified_at TIMESTAMP NOT NULL,       -- From filesystem
  synced_at TIMESTAMP,                  -- When uploaded to cloud

  -- Storage
  cloud_url TEXT,
  file_size_bytes INTEGER,

  -- Content preview (for search)
  summary TEXT,                         -- First 500 chars

  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE INDEX idx_context_project ON project_context_files(project_id);
CREATE INDEX idx_context_modified ON project_context_files(modified_at);
```

### Project Health Table (NEW)
```sql
CREATE TABLE project_health (
  project_id TEXT PRIMARY KEY,

  -- Health metrics
  health_score INTEGER NOT NULL,       -- 0-100 (calculated)
  last_agent_activity TIMESTAMP,

  -- Task status
  total_tasks INTEGER,
  available_tasks INTEGER,
  in_progress_tasks INTEGER,
  blocked_tasks INTEGER,
  completed_tasks INTEGER,

  -- Agent status
  active_agents INTEGER,
  required_capabilities JSON,          -- ["UI", "Backend", ...]
  missing_capabilities JSON,           -- ["DevOps", "ML", ...]

  -- Concerns
  concerns JSON,                       -- [{type, severity, description}]
  last_health_check TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### Cross-Project Intelligence Table (NEW)
```sql
CREATE TABLE cross_project_patterns (
  pattern_id TEXT PRIMARY KEY,
  pattern_name TEXT NOT NULL,          -- "API Authentication Pattern"
  pattern_type TEXT,                   -- ARCHITECTURE, CODE, WORKFLOW

  -- Pattern definition
  description TEXT,
  implementation_guide TEXT,

  -- Source projects (where pattern discovered)
  discovered_in_projects JSON,         -- [project_ids]

  -- Usage tracking
  applied_to_projects JSON,            -- [project_ids]
  success_rate REAL,                   -- 0-1 (how well it works)

  -- Metadata
  created_at TIMESTAMP,
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);
```

---

## 🔄 KEY OPERATIONS

### 1. Register All Projects
```typescript
async function registerAllProjects() {
  const projectsDir = '/Users/lech/PROJECTS_all';
  const entries = await fs.readdir(projectsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('PROJECT_')) {
      await registerProject({
        project_name: entry.name,
        local_path: path.join(projectsDir, entry.name),
        cloud_path: `gs://central-mcp-project-souls/${entry.name}/`,
        status: 'ACTIVE'
      });
    }
  }

  console.log(`Registered ${entries.length} projects`);
}
```

### 2. Sync Project Soul
```typescript
async function syncProjectSoul(projectName: string) {
  const project = await db.getProject(projectName);

  // Sync specs (lightweight!)
  const specsPath = path.join(project.local_path, '02_SPECBASES');
  await gsutil.rsync(
    specsPath,
    `${project.cloud_path}02_SPECBASES/`,
    { include: '*.md', delete: false }
  );

  // Sync context files (lightweight!)
  const contextPath = path.join(project.local_path, '03_CONTEXT_FILES');
  await gsutil.rsync(
    contextPath,
    `${project.cloud_path}03_CONTEXT_FILES/`,
    { include: '*.md', delete: false }
  );

  // Update sync timestamps
  await db.updateProject(projectName, {
    specs_synced_at: new Date(),
    context_synced_at: new Date()
  });

  // Typical upload: 200 KB per project
}
```

### 3. Calculate Project Health
```typescript
async function calculateProjectHealth(projectId: string) {
  const project = await db.getProject(projectId);
  const tasks = await db.getTasksForProject(projectId);
  const sessions = await db.getSessionsForProject(projectId);

  let health = 100;

  // Deduct for blocked tasks
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
  health -= blockedTasks.length * 10;

  // Deduct for stalled (no activity)
  const daysSinceActivity = daysSince(project.last_activity_at);
  if (daysSinceActivity > 7) health -= 30;
  if (daysSinceActivity > 30) health -= 50;

  // Deduct for missing capabilities
  const requiredCaps = getRequiredCapabilities(tasks);
  const availableCaps = getAvailableCapabilities(sessions);
  const missingCaps = requiredCaps.filter(c => !availableCaps.includes(c));
  health -= missingCaps.length * 15;

  // Bonus for active progress
  const recentCompletions = tasks.filter(t =>
    t.completed_at && daysSince(t.completed_at) < 7
  );
  health += recentCompletions.length * 5;

  // Clamp to 0-100
  health = Math.max(0, Math.min(100, health));

  await db.updateProjectHealth(projectId, {
    health_score: health,
    concerns: identifyConcerns(project, tasks, sessions)
  });

  return health;
}
```

### 4. Cross-Project Intelligence
```typescript
async function discoverCrossProjectPatterns() {
  const projects = await db.getAllActiveProjects();

  for (const project of projects) {
    const specs = await loadProjectSpecs(project);

    for (const spec of specs) {
      // Check if similar specs exist in other projects
      const similarSpecs = await findSimilarSpecs(spec, projects);

      if (similarSpecs.length >= 3) {
        // Pattern detected across multiple projects!
        await createPattern({
          pattern_name: inferPatternName(spec),
          pattern_type: spec.category,
          description: extractPattern(spec, similarSpecs),
          discovered_in_projects: similarSpecs.map(s => s.project_id)
        });
      }
    }
  }
}

async function applyPatternToProject(patternId: string, projectId: string) {
  const pattern = await db.getPattern(patternId);
  const project = await db.getProject(projectId);

  // Generate spec based on pattern
  const newSpec = await generateSpecFromPattern(pattern, project);

  // Upload to cloud
  await uploadSpec(newSpec, project);

  // Track pattern usage
  await db.updatePattern(patternId, {
    applied_to_projects: [...pattern.applied_to_projects, projectId],
    usage_count: pattern.usage_count + 1,
    last_used_at: new Date()
  });
}
```

### 5. Multi-Project Dashboard
```typescript
async function getMultiProjectDashboard() {
  const projects = await db.getAllProjects();

  const dashboard = {
    total_projects: projects.length,
    active_projects: projects.filter(p => p.status === 'ACTIVE').length,
    stalled_projects: projects.filter(p => p.status === 'STALLED').length,
    complete_projects: projects.filter(p => p.status === 'COMPLETE').length,

    total_tasks: sum(projects.map(p => p.total_tasks)),
    completed_tasks: sum(projects.map(p => p.completed_tasks)),

    active_agents: sum(projects.map(p => p.active_agents)),

    projects_needing_attention: projects.filter(p =>
      p.health_score < 50 || p.blocked_tasks > 0
    ),

    recent_activity: projects
      .sort((a, b) => b.last_activity_at - a.last_activity_at)
      .slice(0, 10),

    cloud_storage_total: sum(projects.map(p => p.cloud_storage_bytes)),
    estimated_monthly_cost: sum(projects.map(p => p.estimated_monthly_cost))
  };

  return dashboard;
}
```

---

## 🎯 INTEGRATION WITH EXISTING SYSTEMS

### How PROJECT MANAGEMENT SYSTEM Fits

#### With Central-MCP
```
PROJECT MANAGEMENT SYSTEM:
  "Agent connected to PROJECT_minerals"
  ↓
Queries: Which project is this?
Loads: PROJECT_minerals soul from cloud
Provides: Specs + context to Central-MCP
  ↓
Central-MCP:
  Coordinates agent with loaded project soul
  Tracks session in PROJECT_minerals registry
```

#### With SPECBASE
```
PROJECT MANAGEMENT SYSTEM:
  Maintains list of all specs across all projects
  ↓
SPECBASE:
  Stores individual spec files
  Follows UNIVERSAL_SCHEMA
  ↓
PROJECT MANAGEMENT SYSTEM:
  Monitors spec changes across projects
  Discovers cross-project patterns
```

#### With Task Registry
```
PROJECT MANAGEMENT SYSTEM:
  Tracks tasks per project
  Calculates project health from tasks
  ↓
Task Registry:
  Stores individual tasks
  Tracks task status
  ↓
PROJECT MANAGEMENT SYSTEM:
  Aggregates task metrics
  Identifies projects needing attention
```

---

## ✅ SUCCESS CRITERIA

### PROJECT MANAGEMENT SYSTEM Complete When:
- [ ] All 70+ projects registered
- [ ] Specs + context synced for each project (~14 MB total)
- [ ] Project health calculated for all projects
- [ ] Multi-project dashboard working
- [ ] Cross-project pattern discovery working
- [ ] Agent can connect to any project automatically
- [ ] Cost stays ~$0.01/year

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Basic Registry (P0 - NEXT)
- [ ] Create projects table
- [ ] Register all PROJECT_* directories
- [ ] Sync specs + context to cloud
- [ ] Basic project lookup working

### Phase 2: Health Monitoring (P1)
- [ ] Calculate project health scores
- [ ] Identify stalled projects
- [ ] Identify projects needing attention
- [ ] Alert system for critical issues

### Phase 3: Multi-Project Dashboard (P1)
- [ ] Aggregate metrics across projects
- [ ] Recent activity feed
- [ ] Projects needing attention list
- [ ] Cost tracking per project

### Phase 4: Cross-Project Intelligence (P2)
- [ ] Pattern discovery across projects
- [ ] Pattern application to new projects
- [ ] Success rate tracking
- [ ] Shared capability database

### Phase 5: Full Orchestration (VISION)
- [ ] Automatic project lifecycle management
- [ ] Resource allocation across projects
- [ ] Agent swarm optimization
- [ ] Self-healing project coordination

---

**STATUS**: Entity defined, ready to implement
**PRIORITY**: P0 - Missing critical orchestration layer
**IMPACT**: Enables true multi-project intelligence system

🎯 **The glue that binds 70+ projects into one distributed intelligence.**
