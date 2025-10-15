---
spec_id: CMCP-TASK-004
title: "Multi-Project Task Registry System"
version: 1.0
created: 2025-10-10
updated: 2025-10-10
status: DRAFT
type: FEATURE
layer: CORE
priority: P1-Critical
estimated_hours: 12
assigned_agent: UNASSIGNED
dependencies: [CMCP-AUTH-001]
tags: [tasks, multi-project, registry, coordination]
authors: []
reviewers: []
---

# 🗂️ Multi-Project Task Registry System

## 1. Purpose & Overview

**What**: Unified task registry managing tasks across LocalBrain, Central-MCP, and Orchestra.blue with Doppler-style CLI.

**Why**:
- Current system only handles single-project tasks
- Need to coordinate 3 projects (LocalBrain, Central-MCP, Orchestra.blue)
- Agents need global visibility across all projects
- Must support cross-project dependencies

**Who**:
- All 6 agents (A, B, C, D, E, F) working across multiple projects
- Human supervisors managing multi-project coordination
- CI/CD systems querying cross-project status

**When**: Phase 1 - Foundation for multi-project coordination

**Success Criteria**:
- [ ] Single database manages tasks for all 3 projects
- [ ] Doppler-style CLI: `mcp-registry --project LocalBrain --agent A getAvailableTasks`
- [ ] Cross-project dependency tracking works
- [ ] Global task visibility dashboard operational
- [ ] Zero task conflicts or race conditions

---

## 2. Functional Requirements

### 2.1 Core Functionality
- **REQ-001**: Project-scoped task isolation → Test: LocalBrain tasks don't appear in Central-MCP queries
- **REQ-002**: Cross-project dependency tracking → Test: Task in Central-MCP can depend on task in LocalBrain
- **REQ-003**: Global task queries → Test: Query all tasks across all projects
- **REQ-004**: Project-specific task lists → Test: Filter tasks by project
- **REQ-005**: Doppler-style CLI → Test: `mcp-registry --project X command` works

### 2.2 User Interactions
- **INT-001**: Agent queries tasks for specific project → System returns project-scoped tasks
- **INT-002**: Agent claims cross-project task → System validates dependencies across projects
- **INT-003**: Human queries global status → System aggregates across all projects
- **INT-004**: CLI command with project flag → System routes to correct project context

### 2.3 System Behavior
- **BEH-001**: Task created in LocalBrain → Stored with projectId='localbrain' → Only visible to LocalBrain queries
- **BEH-002**: Cross-project dependency added → System validates both tasks exist → Creates link
- **BEH-003**: Task completed in dependency chain → System auto-unblocks dependent tasks in other projects
- **BEH-004**: Global dashboard request → System aggregates all projects → Returns unified view

### 2.4 Edge Cases
- **EDGE-001**: Circular dependency across projects → Detect and reject
- **EDGE-002**: Project deleted with active tasks → Archive tasks, notify agents
- **EDGE-003**: Agent assigned to non-existent project → Return error with available projects
- **EDGE-004**: Concurrent task claims across projects → First succeeds, others fail gracefully

---

## 3. Performance Requirements

### 3.1 Response Time
- **Metric**: Project-scoped task query
- **Target**: <50ms (p95)
- **Test**: Query 1000 tasks across 3 projects

### 3.2 Throughput
- **Metric**: Task operations/second
- **Target**: 1000 ops/sec
- **Test**: Load test with concurrent multi-project operations

### 3.3 Resource Usage
- **CPU**: <20% average
- **Memory**: <500 MB (all projects)
- **Disk**: <1 GB (10,000+ tasks)

### 3.4 Scalability
- **Projects**: 10+ projects
- **Tasks**: 10,000+ tasks per project
- **Agents**: 100+ agents across all projects
- **Degradation**: <10% at peak

---

## 4. Quality Requirements

### 4.1 Code Quality
- **Coverage**: ≥85%
- **Complexity**: Cyclomatic ≤10
- **Documentation**: All multi-project APIs documented
- **Type Safety**: 100% strict TypeScript

### 4.2 Standards
- **API**: RESTful + MCP protocol
- **CLI**: POSIX-compliant flags
- **Database**: ACID compliance for cross-project operations
- **Versioning**: SemVer for API changes

### 4.3 Maintainability
- **Review**: Required for multi-project logic
- **Linting**: Zero errors
- **Formatting**: Prettier enforced
- **Dependencies**: Minimal, no single-project assumptions

---

## 5. Testing Specifications

### 5.1 Unit Tests
- **File**: `tests/unit/MultiProjectTaskRegistry.test.ts`
- **Coverage**: ≥90%
- **Test Count**: 30+
- **Focus**:
  - Project isolation (5 tests)
  - Cross-project dependencies (5 tests)
  - Global queries (5 tests)
  - CLI routing (5 tests)
  - Edge cases (10 tests)

### 5.2 Integration Tests
- **Scenario 1**: Cross-project task flow
  - Given: Task T001 in LocalBrain, Task T002 in Central-MCP depends on T001
  - When: T001 completes
  - Then: T002 auto-unblocked in Central-MCP

- **Scenario 2**: Multi-project dashboard
  - Given: Tasks in all 3 projects
  - When: Query global dashboard
  - Then: All tasks aggregated, grouped by project

### 5.3 E2E Tests
- **Flow 1**: Complete multi-project workflow
  - Steps:
    1. Create task in LocalBrain
    2. Create dependent task in Central-MCP
    3. Create dependent task in Orchestra.blue
    4. Complete LocalBrain task
    5. Verify Central-MCP task unblocked
    6. Complete Central-MCP task
    7. Verify Orchestra.blue task unblocked
  - Expected: Dependency chain resolves correctly
  - Pass: All tasks complete in order

### 5.4 Performance Tests
- **Benchmark**: Global task query across 3 projects with 1000 tasks each
- **Target**: <100ms
- **Tool**: Apache Bench, k6

---

## 6. Implementation Details

### 6.1 Technology Stack
- **Language**: TypeScript 5+
- **Framework**: Node.js
- **Libraries**:
  - commander (CLI framework)
  - better-sqlite3 or pg (database)
  - chalk (CLI colors)
- **Tools**: Jest, ts-node

### 6.2 File Structure
```
src/
├── registry/
│   ├── MultiProjectTaskRegistry.ts    # Main registry
│   ├── ProjectManager.ts               # Project CRUD
│   ├── CrossProjectDependency.ts       # Dependency tracking
│   └── GlobalDashboard.ts              # Aggregated view
├── cli/
│   ├── mcp-registry.ts                 # CLI entry point
│   ├── commands/
│   │   ├── task.ts                     # Task commands
│   │   ├── project.ts                  # Project commands
│   │   └── dashboard.ts                # Dashboard commands
│   └── utils/
│       └── projectContext.ts           # Project selection logic
└── database/
    └── migrations/
        └── 010_multi_project_schema.sql
```

### 6.3 Key Algorithms
- **Algorithm 1**: Cross-Project Dependency Resolution
  - Input: TaskId, ProjectId
  - Process:
    1. Load task from project-scoped table
    2. Load all dependencies (local + cross-project)
    3. Check each dependency completion status
    4. Return blocked/unblocked status
  - Output: DependencyStatus
  - Complexity: O(D) where D = dependencies

- **Algorithm 2**: Global Task Aggregation
  - Input: Filter criteria (optional)
  - Process:
    1. Query all project tables in parallel
    2. Merge results with projectId tagging
    3. Apply filters (status, agent, priority)
    4. Sort by priority, created date
  - Output: AggregatedTaskList
  - Complexity: O(N log N) where N = total tasks

### 6.4 Data Models
```typescript
interface Project {
  id: string;               // e.g., 'localbrain', 'central-mcp', 'orchestra-blue'
  name: string;
  description: string;
  status: 'active' | 'archived';
  createdAt: Date;
  taskCount: number;
}

interface MultiProjectTask extends Task {
  projectId: string;        // Project scope
  crossProjectDependencies?: {
    projectId: string;
    taskId: string;
  }[];
}

interface CrossProjectDependency {
  id: string;
  sourceProjectId: string;
  sourceTaskId: string;
  targetProjectId: string;
  targetTaskId: string;
  type: 'blocks' | 'requires';
  createdAt: Date;
}

interface GlobalTaskQuery {
  projects?: string[];      // Filter by projects
  status?: TaskStatus[];
  agentId?: string;
  priority?: Priority[];
  limit?: number;
  offset?: number;
}
```

---

## 7. Dependencies & Integration

### 7.1 Internal Dependencies
- **Spec**: CMCP-AUTH-001 (JWT Authentication)
- **Must Complete**: Auth before multi-project (need to verify agent permissions per project)

### 7.2 External Dependencies
- **Package**: commander@11.0.0 - CLI framework
- **Package**: chalk@5.0.0 - Terminal colors
- **Database**: SQLite or PostgreSQL with JSON support

### 7.3 Integration Points
- **LocalBrain**: Use MCP client to connect to registry
- **Central-MCP**: Direct integration (same codebase)
- **Orchestra.blue**: Use MCP client (Next.js prototype)

### 7.4 Breaking Changes
- **Change 1**: Task schema adds `projectId` field → Migration: Set existing tasks to projectId='central-mcp'
- **Change 2**: CLI replaces single-project commands → Migration: Update all scripts to use `--project` flag

---

## 8. Acceptance Criteria

### 8.1 Functional
- [ ] Tasks scoped by project (isolation verified)
- [ ] Cross-project dependencies work (chain tested)
- [ ] Global dashboard aggregates all projects
- [ ] CLI works: `mcp-registry --project LocalBrain getAvailableTasks`
- [ ] Project CRUD operations (create, list, archive)

### 8.2 Performance
- [ ] Project-scoped query <50ms (p95)
- [ ] Global query <100ms (p95)
- [ ] Memory <500 MB with 10,000+ tasks
- [ ] No performance degradation with 10+ projects

### 8.3 Quality
- [ ] Coverage ≥85%
- [ ] All cross-project tests passing
- [ ] CLI help text complete and accurate
- [ ] Code review approved

### 8.4 Integration
- [ ] LocalBrain client connects successfully
- [ ] Central-MCP tools work with project context
- [ ] Orchestra.blue queries work

---

## 9. Deployment Plan

### 9.1 Strategy
- **Type**: Rolling deployment with migration
- **Phase 1**: Add multi-project support, single-project still works
- **Phase 2**: Migrate existing tasks to project scopes
- **Phase 3**: Deploy CLI tool globally
- **Rollback**: Revert to single-project schema

### 9.2 Configuration
- **Dev**: `DEFAULT_PROJECT=central-mcp, MULTI_PROJECT_ENABLED=true`
- **Staging**: `DEFAULT_PROJECT=central-mcp, MULTI_PROJECT_ENABLED=true, PROJECTS=[localbrain,central-mcp,orchestra-blue]`
- **Prod**: `DEFAULT_PROJECT=central-mcp, MULTI_PROJECT_ENABLED=true, PROJECTS=[localbrain,central-mcp,orchestra-blue]`

### 9.3 Migration
1. Run migration: Add `projectId` column
2. Backfill existing tasks with `projectId='central-mcp'`
3. Create project records (LocalBrain, Central-MCP, Orchestra.blue)
4. Deploy new code with multi-project support
5. Update all clients to use project-scoped queries
6. Validate cross-project dependencies work

### 9.4 Rollback
- **Trigger**: Cross-project queries failing >10%
- **Steps**:
  1. Disable multi-project mode (`MULTI_PROJECT_ENABLED=false`)
  2. Revert to single-project queries
  3. Restart service
- **Validate**: All existing tasks queryable

---

## 10. Maintenance & Monitoring

### 10.1 Health Checks
- **Endpoint**: /health/multi-project
- **Frequency**: 30s
- **Success**: 200 OK, all projects queryable

### 10.2 Metrics
- Tasks per project (count)
- Cross-project dependency count
- Global query latency (ms)
- Project-scoped query latency (ms)
- Failed dependency resolutions (count)

### 10.3 Alerts
- **Critical**: Any project unreachable
- **Warning**: Cross-project dependency resolution >10 failures/min
- **Info**: New project created

### 10.4 Schedule
- **Daily**: Verify cross-project dependencies
- **Weekly**: Audit project task counts
- **Monthly**: Archive completed projects

---

## 11. Documentation

### 11.1 User Docs
- **Guide**: docs/MULTI_PROJECT_GUIDE.md
- **CLI**: `mcp-registry --help` (built-in)
- **Examples**:
  ```bash
  # Get tasks for LocalBrain
  mcp-registry --project LocalBrain getAvailableTasks

  # Global dashboard
  mcp-registry dashboard --all

  # Create cross-project dependency
  mcp-registry dependency add --source LocalBrain:T001 --target Central-MCP:T002
  ```

### 11.2 Developer Docs
- **Architecture**: Multi-project data flow diagram
- **Comments**: All multi-project logic documented
- **README**: CLI usage examples

### 11.3 Operations
- **Runbook**: How to add new project
- **Troubleshooting**: Cross-project dependency issues
- **FAQ**: How to migrate single-project to multi-project?

### 11.4 Changelog
- **v1.0**: Multi-project support with Doppler-style CLI

---

## 12. Evolution & Future

### 12.1 Limitations
- **Limitation 1**: All projects share same database
- **Workaround**: Implement federated query for distributed databases

### 12.2 Enhancements
- **Enhancement 1**: Project templates (create project from template)
- **Timeline**: Phase 2
- **Enhancement 2**: Project-level permissions (admin per project)
- **Timeline**: Phase 3

### 12.3 Deprecation
- **What**: Single-project CLI commands (without `--project` flag)
- **When**: 60 days after multi-project deployment
- **Migration**: All scripts must use `--project` flag or `DEFAULT_PROJECT` env

### 12.4 Vision
- **3 months**: 10+ projects managed
- **6 months**: Distributed multi-database support
- **1 year**: 100+ projects, enterprise project management

---

**SPEC STATUS: READY FOR IMPLEMENTATION**
**DEPENDENCIES: CMCP-AUTH-001 (JWT Authentication)**
**NEXT: Implement project isolation, then cross-project dependencies**
