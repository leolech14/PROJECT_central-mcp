# 🧬 ATOMIC ENTITIES TAXONOMY - Complete System Map

**Created**: 2025-10-12
**Purpose**: Map ALL atomic entities that require structured ingestion pipelines
**Status**: ✅ COMPLETE TAXONOMY - 20 Entity Types Identified

---

## 🎯 WHAT ARE ATOMIC ENTITIES?

**Definition**: Atomic entities are the fundamental units of information/knowledge/resources that flow through Central-MCP and require:
- ✅ **Structured ingestion** - Organized intake process
- ✅ **Persistent storage** - Database or file system
- ✅ **Metadata tracking** - Who, what, when, where, why
- ✅ **Versioning** - Historical changes
- ✅ **Searchability** - Query and filter capabilities
- ✅ **Agent accessibility** - Programmatic access for AI agents

---

## 📊 COMPLETE ATOMIC ENTITIES MAP

### ✅ **TIER 1: ALREADY BUILT** (Pipelines Operational)

#### 1️⃣ **SPECIALIZED KNOWLEDGE PACKS (SKPs)**
**Status**: ✅ **OPERATIONAL** (Built 2025-10-12)

**What They Are**: Compressed archives of specialized knowledge (documentation, code, examples)

**Current Implementation:**
- Database: `skp_registry`, `skp_versions`, `skp_files`
- CLI Tool: `update-skp.sh`
- Documentation: `SKP_INGESTION_PIPELINE.md`
- Current Volume: 1 SKP (ULTRATHINK_REALTIME_VOICE_MASTERY v1.2.0)

**Ingestion Methods:**
- CLI: `./scripts/update-skp.sh <skp_id> <source_path>`
- Manual: Add files to source folder, run update script
- Future: API endpoint `/api/skp/ingest`

**Agent Access:**
```typescript
// Query SKPs
const skps = await db.query("SELECT * FROM skp_registry");

// Get specific SKP version
const skp = await db.query("SELECT * FROM skp_versions WHERE skp_id = ? AND version = ?", [id, version]);
```

---

#### 2️⃣ **TOOLS**
**Status**: ✅ **OPERATIONAL** (Built 2025-10-12)

**What They Are**: Executable software components (CLIs, MCPs, analyzers, generators, etc.)

**Current Implementation:**
- Database: `tools_registry`, `tool_capabilities`, `tool_usage`
- CLI Tool: `register-tool.sh`
- Documentation: `TOOLS_INGESTION_PIPELINE.md`, `TOOL_TAXONOMY_AND_CLASSIFICATION.md`
- Current Volume: 4 tools pre-registered

**Ingestion Methods:**
- CLI: `./scripts/register-tool.sh` (interactive)
- Manual: Fill form, submit to database
- Future: Auto-discovery, GitHub sync

**Agent Access:**
```typescript
// Query tools by category
const tools = await db.query("SELECT * FROM tools_registry WHERE category = ?", [category]);

// Get tool capabilities
const caps = await db.query("SELECT * FROM tool_capabilities WHERE tool_id = ?", [toolId]);
```

---

### 🎯 **TIER 2: PARTIALLY BUILT** (Need Formal Pipelines)

#### 3️⃣ **PROJECTS**
**Status**: ⚠️ **PARTIAL** (Loop 2 discovers, but no formal ingestion)

**What They Are**: Software projects in the ecosystem (44 discovered in PROJECTS_all/)

**Current Implementation:**
- Database: `projects` table exists
- Auto-Discovery: Loop 2 (ProjectAutoDiscoveryLoop) scans every 60s
- No formal ingestion pipeline

**What's Missing:**
- ❌ Manual project registration
- ❌ Project metadata enrichment
- ❌ Project health tracking
- ❌ Project dependencies mapping
- ❌ Project categorization (beyond basic types)

**Proposed Pipeline:**
```bash
./scripts/register-project.sh \
  --name "PROJECT_central-mcp" \
  --type "commercial-app" \
  --description "..." \
  --tech-stack "TypeScript,React,SQLite" \
  --status "active"
```

**Agent Access Needed:**
```typescript
// Register new project
await registerProject({
  name: "PROJECT_xyz",
  type: "knowledge-system",
  health_status: "healthy"
});

// Update project metadata
await updateProject(projectId, { status: "active", completion: 85 });
```

---

#### 4️⃣ **AGENTS**
**Status**: ⚠️ **PARTIAL** (Loop 1 discovers, but no formal ingestion)

**What They Are**: AI agents operating in the ecosystem (Agent A-F, plus specialized agents)

**Current Implementation:**
- Database: `agent_sessions` table exists
- Auto-Discovery: Loop 1 (AgentAutoDiscoveryLoop) tracks every 60s
- No formal registration pipeline

**What's Missing:**
- ❌ Agent capability registration
- ❌ Agent skill matrix
- ❌ Agent performance tracking
- ❌ Agent collaboration history
- ❌ Agent certification/validation

**Proposed Pipeline:**
```bash
./scripts/register-agent.sh \
  --letter "G" \
  --name "Agent G - Security Specialist" \
  --model "claude-sonnet-4-5" \
  --capabilities "security-audit,vulnerability-scanning" \
  --specialization "cybersecurity"
```

**Agent Access Needed:**
```typescript
// Find agents by capability
await findAgents({ capability: "backend-development" });

// Update agent status
await updateAgentStatus(agentLetter, { status: "busy", current_task: "T-123" });
```

---

#### 5️⃣ **TASKS**
**Status**: ⚠️ **PARTIAL** (Task registry exists in LocalBrain, not centralized)

**What They Are**: Work items for agents (features, bugs, improvements)

**Current Implementation:**
- Database: `tasks` table in LocalBrain MCP
- Manual: CENTRAL_TASK_REGISTRY.md files
- No centralized ingestion

**What's Missing:**
- ❌ Centralized task ingestion
- ❌ Cross-project task tracking
- ❌ Task templates
- ❌ Task estimation tracking
- ❌ Task dependencies visualization

**Proposed Pipeline:**
```bash
./scripts/create-task.sh \
  --project "central-mcp" \
  --title "Implement Loop 3" \
  --description "..." \
  --agent "Agent-B" \
  --priority "P0" \
  --category "backend"
```

**Agent Access Needed:**
```typescript
// Create task programmatically
await createTask({
  project_id: "central-mcp",
  title: "Fix authentication bug",
  assigned_to: "Agent-C"
});

// Query available tasks for agent
await getAvailableTasks({ agent: "Agent-D", status: "available" });
```

---

### 🚀 **TIER 3: NOT BUILT** (Critical Infrastructure Needed)

#### 6️⃣ **SPECIFICATIONS (SPECS)**
**Status**: ❌ **NOT BUILT** (Loop 7 generates, but no pipeline)

**What They Are**: Technical specifications, requirements documents, architecture docs

**Current Location:**
- `02_SPECBASES/` folder with numbered .md files
- Loop 7 generates some specs
- No structured ingestion

**Why Critical:**
- Specs are the SOURCE OF TRUTH for features
- Agents need to query specs to understand requirements
- Version history of specs is critical
- Specs reference each other (dependencies)

**Proposed Pipeline:**
```bash
./scripts/ingest-spec.sh \
  --file "NEW_FEATURE_SPEC.md" \
  --project "central-mcp" \
  --category "backend" \
  --status "draft" \
  --author "Agent-B"
```

**Agent Access Needed:**
```typescript
// Find specs for current task
await findSpecs({ project: "central-mcp", status: "approved" });

// Create spec from user message
await generateSpec({ userMessage: "...", project: "..." });

// Link spec to tasks
await linkSpecToTasks(specId, [taskId1, taskId2]);
```

**Database Schema Needed:**
```sql
CREATE TABLE specifications (
    spec_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    project_id TEXT,
    category TEXT,  -- backend, frontend, infrastructure, design
    status TEXT,    -- draft, review, approved, implemented
    content TEXT,   -- Full markdown content
    file_path TEXT,
    version TEXT,
    author TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE spec_dependencies (
    dependency_id INTEGER PRIMARY KEY,
    spec_id TEXT,
    depends_on_spec_id TEXT,
    dependency_type TEXT  -- requires, extends, conflicts-with
);
```

---

#### 7️⃣ **CODE SNIPPETS**
**Status**: ❌ **NOT BUILT**

**What They Are**: Reusable code patterns, templates, boilerplate

**Why Critical:**
- Avoid re-writing common patterns
- Ensure consistency across projects
- Speed up development
- Share best practices

**Examples:**
- Authentication middleware
- Database connection patterns
- API error handlers
- React hooks
- CSS utility classes

**Proposed Pipeline:**
```bash
./scripts/ingest-snippet.sh \
  --title "JWT Authentication Middleware" \
  --language "typescript" \
  --category "auth" \
  --tags "jwt,express,middleware" \
  --file "jwt-auth.ts"
```

**Agent Access Needed:**
```typescript
// Search snippets
await searchSnippets({ language: "typescript", tag: "auth" });

// Get snippet by ID
await getSnippet(snippetId);

// Track snippet usage
await trackSnippetUsage(snippetId, { project: "...", agent: "..." });
```

**Database Schema Needed:**
```sql
CREATE TABLE code_snippets (
    snippet_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    language TEXT,
    category TEXT,
    code TEXT NOT NULL,
    tags TEXT,  -- comma-separated
    file_path TEXT,
    usage_count INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMP
);

CREATE TABLE snippet_usage (
    usage_id INTEGER PRIMARY KEY,
    snippet_id TEXT,
    used_in_project TEXT,
    used_by_agent TEXT,
    used_at TIMESTAMP
);
```

---

#### 8️⃣ **API ENDPOINTS**
**Status**: ⚠️ **PARTIAL** (Backend registry discovers, no ingestion)

**What They Are**: REST/GraphQL endpoints across all projects

**Current Implementation:**
- `registry_discovery_engine.py` finds 19 endpoints
- No formal ingestion pipeline
- No cross-project API catalog

**What's Missing:**
- ❌ Manual API registration
- ❌ API versioning
- ❌ API deprecation tracking
- ❌ API usage analytics
- ❌ API documentation ingestion

**Proposed Pipeline:**
```bash
./scripts/register-api.sh \
  --endpoint "/api/tools/register" \
  --method "POST" \
  --project "central-mcp" \
  --description "Register new tool" \
  --auth-required "true"
```

**Agent Access Needed:**
```typescript
// Find APIs by project
await findAPIs({ project: "central-mcp" });

// Register new API endpoint
await registerAPI({
  endpoint: "/api/knowledge/search",
  method: "GET",
  parameters: { q: "string" }
});
```

---

#### 9️⃣ **UI COMPONENTS**
**Status**: ⚠️ **PARTIAL** (Backend registry discovers, no ingestion)

**What They Are**: React/Vue/Angular components across projects

**Current Implementation:**
- `registry_discovery_engine.py` finds components
- No component library
- No component versioning

**What's Missing:**
- ❌ Component metadata (props, events, slots)
- ❌ Component previews
- ❌ Component dependencies
- ❌ Component usage tracking
- ❌ Design system integration

**Proposed Pipeline:**
```bash
./scripts/register-component.sh \
  --name "Button" \
  --framework "react" \
  --category "ui-basic" \
  --file "components/Button.tsx" \
  --props "variant,size,onClick"
```

**Agent Access Needed:**
```typescript
// Search components
await searchComponents({ framework: "react", category: "forms" });

// Get component metadata
await getComponent(componentId);

// Track component usage
await trackComponentUsage(componentId, { project: "..." });
```

---

#### 🔟 **CONTEXT FILES**
**Status**: ❌ **NOT BUILT**

**What They Are**: Conversation context, chat history, agent memories

**Why Critical:**
- Preserve conversation history
- Enable context injection for voice/chat
- Allow agents to reference past conversations
- Support context-aware recommendations

**Proposed Pipeline:**
```bash
./scripts/ingest-context.sh \
  --type "conversation" \
  --source "trinity-terminal-chat" \
  --format "json" \
  --file "conversation_2025-10-12.json"
```

**Agent Access Needed:**
```typescript
// Store conversation context
await storeContext({
  type: "conversation",
  content: "...",
  metadata: { project: "...", timestamp: "..." }
});

// Retrieve context for injection
await retrieveContext({ type: "conversation", limit: 10 });
```

**Database Schema Needed:**
```sql
CREATE TABLE context_storage (
    context_id TEXT PRIMARY KEY,
    context_type TEXT,  -- conversation, documentation, code-example
    project_id TEXT,
    content TEXT,
    format TEXT,  -- json, markdown, text
    file_path TEXT,
    created_by TEXT,
    created_at TIMESTAMP
);

CREATE TABLE context_tags (
    tag_id INTEGER PRIMARY KEY,
    context_id TEXT,
    tag TEXT,
    relevance_score REAL
);
```

---

#### 1️⃣1️⃣ **DOCUMENTATION**
**Status**: ⚠️ **PARTIAL** (Files exist, no structured ingestion)

**What They Are**: READMEs, guides, tutorials, API docs

**Current Location:**
- Scattered across `/docs/` folders
- No centralized documentation registry
- No versioning system

**What's Missing:**
- ❌ Documentation discovery
- ❌ Documentation search
- ❌ Documentation freshness tracking
- ❌ Documentation gaps identification
- ❌ Multi-project documentation index

**Proposed Pipeline:**
```bash
./scripts/ingest-docs.sh \
  --file "README.md" \
  --project "central-mcp" \
  --category "getting-started" \
  --auto-extract-sections
```

**Agent Access Needed:**
```typescript
// Search documentation
await searchDocs({ query: "authentication", project: "central-mcp" });

// Get documentation by section
await getDocs({ section: "api-reference" });

// Check documentation freshness
await checkDocsHealth({ project: "central-mcp" });
```

---

#### 1️⃣2️⃣ **CONFIGURATIONS**
**Status**: ❌ **NOT BUILT**

**What They Are**: Config templates, .env examples, settings files

**Why Critical:**
- Standardize project setup
- Share configurations across projects
- Version control config changes
- Enable config validation

**Proposed Pipeline:**
```bash
./scripts/register-config.sh \
  --name "Next.js Production Config" \
  --type "nextjs" \
  --file "next.config.js.template" \
  --variables "API_URL,DATABASE_URL"
```

**Agent Access Needed:**
```typescript
// Find config templates
await findConfigs({ type: "nextjs", environment: "production" });

// Generate config from template
await generateConfig(configId, { API_URL: "...", DATABASE_URL: "..." });
```

---

#### 1️⃣3️⃣ **WORKFLOWS**
**Status**: ❌ **NOT BUILT**

**What They Are**: GitHub Actions, CI/CD pipelines, automation workflows

**Why Critical:**
- Reuse deployment workflows
- Share automation patterns
- Track workflow success rates
- Optimize CI/CD performance

**Proposed Pipeline:**
```bash
./scripts/register-workflow.sh \
  --name "Deploy to GCP" \
  --type "github-actions" \
  --file ".github/workflows/deploy.yml" \
  --triggers "push:main"
```

**Agent Access Needed:**
```typescript
// Find workflows by type
await findWorkflows({ type: "deployment" });

// Track workflow execution
await trackWorkflowRun(workflowId, { success: true, duration: 120 });
```

---

#### 1️⃣4️⃣ **DATA SOURCES**
**Status**: ❌ **NOT BUILT**

**What They Are**: Database connections, API credentials, file systems

**Why Critical:**
- Catalog available data sources
- Track data source health
- Manage access credentials
- Enable data source discovery

**Proposed Pipeline:**
```bash
./scripts/register-datasource.sh \
  --name "Central MCP Registry" \
  --type "sqlite" \
  --connection "data/registry.db" \
  --schema-file "schema.sql"
```

**Agent Access Needed:**
```typescript
// Find data sources
await findDataSources({ type: "database", project: "central-mcp" });

// Query data source metadata
await getDataSourceSchema(dataSourceId);
```

---

#### 1️⃣5️⃣ **PROMPTS**
**Status**: ❌ **NOT BUILT**

**What They Are**: AI prompts, templates, system messages

**Why Critical:**
- Reuse effective prompts
- Version prompt improvements
- A/B test prompts
- Share prompt engineering patterns

**Proposed Pipeline:**
```bash
./scripts/register-prompt.sh \
  --name "Code Review Prompt" \
  --category "code-quality" \
  --template "Review this code for: {criteria}" \
  --variables "criteria"
```

**Agent Access Needed:**
```typescript
// Search prompts
await searchPrompts({ category: "code-review" });

// Use prompt template
await usePrompt(promptId, { criteria: "security,performance" });

// Track prompt effectiveness
await trackPromptUsage(promptId, { success: true, feedback: "helpful" });
```

---

#### 1️⃣6️⃣ **SCRIPTS**
**Status**: ⚠️ **PARTIAL** (Files exist, no registry)

**What They Are**: Automation scripts (bash, python, node)

**Current Location:**
- `/scripts/` folders across projects
- No centralized script catalog

**What's Missing:**
- ❌ Script discovery
- ❌ Script dependencies
- ❌ Script usage tracking
- ❌ Script health checks

**Proposed Pipeline:**
```bash
./scripts/register-script.sh \
  --name "Update SKP" \
  --file "update-skp.sh" \
  --language "bash" \
  --dependencies "sqlite3,zip" \
  --purpose "ingestion"
```

**Agent Access Needed:**
```typescript
// Find scripts by purpose
await findScripts({ purpose: "deployment" });

// Execute script with parameters
await executeScript(scriptId, { param1: "value1" });
```

---

#### 1️⃣7️⃣ **DEPENDENCIES**
**Status**: ❌ **NOT BUILT**

**What They Are**: npm packages, pip packages, system libraries

**Why Critical:**
- Track dependency versions
- Identify security vulnerabilities
- Manage dependency conflicts
- Enable dependency graph visualization

**Proposed Pipeline:**
```bash
./scripts/scan-dependencies.sh --project "central-mcp"
# Auto-ingests from package.json, requirements.txt, etc.
```

**Agent Access Needed:**
```typescript
// Get project dependencies
await getProjectDependencies(projectId);

// Check for dependency updates
await checkDependencyUpdates(projectId);

// Find dependency conflicts
await findDependencyConflicts([projectId1, projectId2]);
```

---

#### 1️⃣8️⃣ **LOGS**
**Status**: ⚠️ **PARTIAL** (Files exist, no ingestion)

**What They Are**: System logs, execution logs, error logs

**Current Location:**
- `/tmp/` logs
- Console output
- No structured logging

**What's Missing:**
- ❌ Log aggregation
- ❌ Log search
- ❌ Log analysis
- ❌ Log alerting

**Proposed Pipeline:**
```bash
./scripts/ingest-logs.sh \
  --source "/tmp/central-mcp.log" \
  --project "central-mcp" \
  --level "info"
```

**Agent Access Needed:**
```typescript
// Query logs
await queryLogs({ project: "central-mcp", level: "error", since: "1h" });

// Analyze log patterns
await analyzeLogPatterns({ project: "central-mcp", window: "24h" });
```

---

#### 1️⃣9️⃣ **METRICS**
**Status**: ⚠️ **PARTIAL** (Some metrics tracked, no pipeline)

**What They Are**: Performance data, analytics, usage statistics

**Current Implementation:**
- Auto-Proactive Loops track some metrics
- No centralized metrics ingestion

**What's Missing:**
- ❌ Custom metrics ingestion
- ❌ Metrics aggregation
- ❌ Metrics visualization
- ❌ Metrics alerting

**Proposed Pipeline:**
```bash
./scripts/ingest-metric.sh \
  --name "api_response_time" \
  --value 250 \
  --unit "ms" \
  --tags "project:central-mcp,endpoint:/api/health"
```

**Agent Access Needed:**
```typescript
// Track custom metric
await trackMetric({
  name: "agent_task_completion_time",
  value: 3600,
  tags: { agent: "Agent-B", task: "T-123" }
});

// Query metrics
await queryMetrics({ name: "api_response_time", window: "1h" });
```

---

#### 2️⃣0️⃣ **ISSUES/TICKETS**
**Status**: ❌ **NOT BUILT**

**What They Are**: GitHub issues, bug reports, feature requests

**Why Critical:**
- Track bugs across projects
- Prioritize feature requests
- Link issues to tasks
- Monitor issue resolution time

**Proposed Pipeline:**
```bash
./scripts/sync-github-issues.sh --project "central-mcp"
# Auto-syncs GitHub issues into database
```

**Agent Access Needed:**
```typescript
// Find open bugs
await findIssues({ type: "bug", status: "open", project: "central-mcp" });

// Create issue from agent
await createIssue({
  title: "Authentication fails on Safari",
  type: "bug",
  priority: "P1"
});

// Link issue to task
await linkIssueToTask(issueId, taskId);
```

---

## 🏗️ PRIORITY MATRIX

### 🔴 **CRITICAL (Build Immediately)**
1. **Specifications** - Source of truth for development
2. **Code Snippets** - Reusability and consistency
3. **Context Files** - Context injection for AI
4. **Prompts** - AI prompt management

### 🟡 **HIGH (Build Soon)**
5. **Projects** - Formalize project ingestion
6. **Agents** - Complete agent management
7. **Tasks** - Centralize task coordination
8. **API Endpoints** - Complete API catalog
9. **UI Components** - Component library

### 🟢 **MEDIUM (Build Later)**
10. **Documentation** - Centralized docs
11. **Configurations** - Config templates
12. **Scripts** - Script catalog
13. **Dependencies** - Dependency tracking

### 🔵 **LOW (Future)**
14. **Workflows** - CI/CD patterns
15. **Data Sources** - Data source catalog
16. **Logs** - Log aggregation
17. **Metrics** - Metrics platform
18. **Issues/Tickets** - Issue tracking

---

## 🎯 INGESTION PIPELINE STANDARD

Every atomic entity should have:

### **1. Database Schema**
```sql
CREATE TABLE {entity}_registry (
    {entity}_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);
```

### **2. CLI Tool**
```bash
./scripts/register-{entity}.sh [OPTIONS]
# Interactive or argument-based registration
```

### **3. API Endpoint**
```typescript
// POST /api/{entity}/register
// GET /api/{entity}
// GET /api/{entity}/:id
// PUT /api/{entity}/:id
// DELETE /api/{entity}/:id
```

### **4. Agent Access Methods**
```typescript
// Query
await find{Entities}({ ...filters });

// Create
await create{Entity}({ ...data });

// Update
await update{Entity}(id, { ...changes });

// Track usage
await track{Entity}Usage(id, { ...context });
```

### **5. Dashboard Integration**
- Visualization page
- Search/filter UI
- Detail modals
- Usage analytics

---

## 📊 IMPLEMENTATION ROADMAP

### **Phase 1: Critical Atoms (Weeks 1-2)**
- [ ] Specifications ingestion pipeline
- [ ] Code snippets ingestion pipeline
- [ ] Context files ingestion pipeline
- [ ] Prompts ingestion pipeline

### **Phase 2: High Priority (Weeks 3-4)**
- [ ] Formalize projects pipeline
- [ ] Complete agents pipeline
- [ ] Centralize tasks pipeline
- [ ] Complete API endpoints pipeline
- [ ] Build UI components pipeline

### **Phase 3: Medium Priority (Weeks 5-6)**
- [ ] Documentation pipeline
- [ ] Configurations pipeline
- [ ] Scripts pipeline
- [ ] Dependencies pipeline

### **Phase 4: Polish & Integration (Week 7)**
- [ ] Unified search across all atoms
- [ ] Cross-atom relationship mapping
- [ ] Agent orchestration improvements
- [ ] Dashboard enhancements

---

## 🎓 KEY INSIGHTS

**Why This Matters:**
1. **Agent Autonomy** - Agents need structured access to ALL information
2. **Knowledge Preservation** - Prevent information loss across projects
3. **Reusability** - Share patterns, snippets, configs, prompts
4. **Discoverability** - Find resources easily
5. **Versioning** - Track evolution of all entities
6. **Analytics** - Understand usage patterns
7. **Quality** - Enforce standards through pipelines

**Central-MCP becomes the NERVOUS SYSTEM of the entire ecosystem, with structured pipelines for EVERY type of atomic information!**

---

**This taxonomy provides the COMPLETE framework for building Central-MCP into a truly intelligent, self-aware platform!** 🎯
