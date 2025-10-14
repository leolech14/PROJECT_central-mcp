-- ============================================================================
-- CONTEXT FILES REGISTRY - Centralized Context Injection System
-- ============================================================================
-- Purpose: Store and auto-inject AI context files for agent connections
-- Created: 2025-10-12
-- Part of: Central-MCP Atomic Entities Infrastructure
-- Vision: UPDATE ONCE → ALL AGENTS GET THE LATEST AUTOMATICALLY
-- ============================================================================

-- Main context files registry
CREATE TABLE IF NOT EXISTS context_files_registry (
    context_id TEXT PRIMARY KEY,                -- e.g. "system-message-v1", "agent-a-ui-rules"
    context_name TEXT NOT NULL,                 -- Display name
    context_type TEXT NOT NULL,                 -- system_message, agent_rules, project_rules, domain_knowledge
    scope TEXT NOT NULL,                        -- universal, role_specific, project_specific, agent_specific

    -- Content
    context_text TEXT NOT NULL,                 -- The actual context content
    context_hash TEXT,                          -- SHA-256 hash for change detection
    word_count INTEGER DEFAULT 0,
    char_count INTEGER DEFAULT 0,
    estimated_tokens INTEGER DEFAULT 0,

    -- Targeting
    target_roles TEXT,                          -- JSON array: ["Agent-A", "Agent-B"] or ["ui", "backend"]
    target_projects TEXT,                       -- JSON array: ["central-mcp", "PROJECT_minerals"]
    target_models TEXT,                         -- JSON array: ["gpt-4", "claude-3-opus"]
    exclusions TEXT,                            -- JSON array of agents/projects to exclude

    -- Metadata
    description TEXT NOT NULL,                  -- What this context provides
    purpose TEXT,                               -- Why agents need this
    tags TEXT,                                  -- JSON array of tags
    priority INTEGER DEFAULT 50,                -- Higher priority = injected first (0-100)

    -- Injection Configuration
    auto_inject_on_connect BOOLEAN DEFAULT TRUE,    -- Inject automatically when agent connects
    injection_frequency TEXT DEFAULT 'once',        -- once, always, daily, on_demand
    inject_with_knowledge BOOLEAN DEFAULT TRUE,     -- Include in knowledge injection
    inject_position TEXT DEFAULT 'start',           -- start, end, before_task, after_task

    -- Dependencies
    requires_context_ids TEXT,                  -- JSON array of context_ids that must be injected first
    conflicts_with TEXT,                        -- JSON array of context_ids that should not be injected together

    -- Quality and Status
    is_active BOOLEAN DEFAULT TRUE,             -- Whether to inject this context
    is_production_ready BOOLEAN DEFAULT FALSE,
    quality_score REAL DEFAULT 0.0,             -- 0-1 quality score
    effectiveness_rating REAL DEFAULT 0.0,      -- Based on agent feedback

    -- Source
    source_file TEXT,                           -- Original file path
    source_url TEXT,                            -- Original URL
    author TEXT,                                -- Who created it
    maintainer TEXT,                            -- Who maintains it

    -- Usage Stats
    injection_count INTEGER DEFAULT 0,          -- How many times injected
    agent_count INTEGER DEFAULT 0,              -- How many unique agents received this
    last_injected_at TIMESTAMP,
    avg_feedback_rating REAL DEFAULT 0.0,       -- Average rating from agents (0-1)

    -- Versioning
    version TEXT DEFAULT 'v1.0.0',              -- Semantic version
    parent_context_id TEXT,                     -- If derived from another context
    changelog TEXT,                             -- What changed in this version

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by TEXT DEFAULT 'system'
);

-- Context injection history (every time context is injected)
CREATE TABLE IF NOT EXISTS context_injections (
    injection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    context_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_model TEXT,
    project_id TEXT,
    session_id TEXT,

    -- Injection Details
    injection_trigger TEXT NOT NULL,            -- connect, task_start, manual, scheduled
    injection_method TEXT NOT NULL,             -- auto, manual, api, cli
    injection_position TEXT,                    -- start, end, before_task, after_task

    -- Context Metadata
    context_version TEXT,                       -- Version at time of injection
    context_hash TEXT,                          -- Hash at time of injection
    estimated_tokens INTEGER DEFAULT 0,

    -- Combined With
    injected_with_skps TEXT,                    -- JSON array of SKP IDs injected together
    injected_with_specs TEXT,                   -- JSON array of spec IDs
    injected_with_tools TEXT,                   -- JSON array of tool IDs
    injected_with_prompts TEXT,                 -- JSON array of prompt IDs

    -- Results
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    -- Feedback
    agent_feedback_rating REAL,                 -- 0-1 rating from agent
    agent_feedback_notes TEXT,
    effectiveness_observed BOOLEAN,             -- Did agent use this context effectively?

    injected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (context_id) REFERENCES context_files_registry(context_id)
);

-- Context versions (track changes over time)
CREATE TABLE IF NOT EXISTS context_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    context_id TEXT NOT NULL,
    version TEXT NOT NULL,                      -- v1.0.0, v1.1.0, v2.0.0
    context_text TEXT NOT NULL,                 -- Context at this version
    context_hash TEXT,
    changelog TEXT,                             -- What changed
    breaking_changes BOOLEAN DEFAULT FALSE,
    migration_notes TEXT,                       -- How to migrate from previous version

    -- Impact Analysis
    estimated_impact TEXT,                      -- low, medium, high
    affects_agents TEXT,                        -- JSON array of affected agent_ids
    requires_retraining BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (context_id) REFERENCES context_files_registry(context_id)
);

-- Context effectiveness tracking
CREATE TABLE IF NOT EXISTS context_effectiveness (
    effectiveness_id INTEGER PRIMARY KEY AUTOINCREMENT,
    context_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    project_id TEXT,

    -- Metrics
    tasks_completed_with_context INTEGER DEFAULT 0,
    tasks_completed_well INTEGER DEFAULT 0,      -- Tasks completed successfully
    avg_task_quality REAL DEFAULT 0.0,           -- Quality score (0-1)
    context_usage_detected BOOLEAN DEFAULT FALSE, -- Did agent actually use this context?

    -- Observations
    observed_behaviors TEXT,                     -- JSON array of observed behaviors
    improvements_noted TEXT,                     -- What improved after injection
    issues_noted TEXT,                           -- Problems caused by this context

    -- Feedback
    agent_rating REAL,                          -- 0-1 rating from agent
    agent_comments TEXT,

    first_observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (context_id) REFERENCES context_files_registry(context_id)
);

-- Context templates (reusable context structures)
CREATE TABLE IF NOT EXISTS context_templates (
    template_id TEXT PRIMARY KEY,               -- e.g. "agent-onboarding-template"
    template_name TEXT NOT NULL,
    description TEXT,
    template_structure TEXT NOT NULL,           -- Template with {variables}

    -- Variables
    variables TEXT,                             -- JSON array of {name, type, required, default}
    example_output TEXT,                        -- Example of rendered template

    -- Usage
    usage_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_context_scope ON context_files_registry(scope);
CREATE INDEX IF NOT EXISTS idx_context_type ON context_files_registry(context_type);
CREATE INDEX IF NOT EXISTS idx_context_active ON context_files_registry(is_active, auto_inject_on_connect);
CREATE INDEX IF NOT EXISTS idx_context_priority ON context_files_registry(priority DESC);
CREATE INDEX IF NOT EXISTS idx_context_injections_context ON context_injections(context_id);
CREATE INDEX IF NOT EXISTS idx_context_injections_agent ON context_injections(agent_id);
CREATE INDEX IF NOT EXISTS idx_context_injections_project ON context_injections(project_id);
CREATE INDEX IF NOT EXISTS idx_context_effectiveness_context ON context_effectiveness(context_id);
CREATE INDEX IF NOT EXISTS idx_context_effectiveness_agent ON context_effectiveness(agent_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Active contexts ready for injection
CREATE VIEW IF NOT EXISTS active_contexts AS
SELECT
    context_id,
    context_name,
    context_type,
    scope,
    target_roles,
    target_projects,
    priority,
    auto_inject_on_connect,
    injection_frequency,
    version,
    injection_count,
    agent_count,
    avg_feedback_rating,
    effectiveness_rating
FROM context_files_registry
WHERE is_active = TRUE AND is_production_ready = TRUE
ORDER BY priority DESC, injection_count DESC;

-- Universal contexts (injected to ALL agents)
CREATE VIEW IF NOT EXISTS universal_contexts AS
SELECT
    context_id,
    context_name,
    context_type,
    description,
    priority,
    version,
    injection_count,
    effectiveness_rating
FROM context_files_registry
WHERE scope = 'universal' AND is_active = TRUE
ORDER BY priority DESC;

-- Context injection statistics
CREATE VIEW IF NOT EXISTS context_injection_stats AS
SELECT
    c.context_id,
    c.context_name,
    c.context_type,
    c.scope,
    COUNT(DISTINCT i.injection_id) as total_injections,
    COUNT(DISTINCT i.agent_id) as unique_agents,
    COUNT(DISTINCT i.project_id) as unique_projects,
    AVG(CASE WHEN i.was_successful THEN 1.0 ELSE 0.0 END) as success_rate,
    AVG(i.agent_feedback_rating) as avg_feedback,
    MAX(i.injected_at) as last_injected
FROM context_files_registry c
LEFT JOIN context_injections i ON c.context_id = i.context_id
GROUP BY c.context_id
ORDER BY total_injections DESC;

-- Context effectiveness summary
CREATE VIEW IF NOT EXISTS context_effectiveness_summary AS
SELECT
    c.context_id,
    c.context_name,
    COUNT(DISTINCT e.agent_id) as agents_using,
    SUM(e.tasks_completed_with_context) as total_tasks,
    SUM(e.tasks_completed_well) as successful_tasks,
    AVG(e.avg_task_quality) as avg_quality,
    AVG(e.agent_rating) as avg_agent_rating,
    SUM(CASE WHEN e.context_usage_detected THEN 1 ELSE 0 END) as times_actually_used
FROM context_files_registry c
LEFT JOIN context_effectiveness e ON c.context_id = e.context_id
GROUP BY c.context_id
ORDER BY avg_quality DESC, successful_tasks DESC;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp
CREATE TRIGGER IF NOT EXISTS update_context_timestamp
AFTER UPDATE ON context_files_registry
FOR EACH ROW
BEGIN
    UPDATE context_files_registry SET updated_at = CURRENT_TIMESTAMP WHERE context_id = NEW.context_id;
END;

-- Increment injection count
CREATE TRIGGER IF NOT EXISTS increment_context_injection_count
AFTER INSERT ON context_injections
FOR EACH ROW
BEGIN
    UPDATE context_files_registry
    SET injection_count = injection_count + 1,
        last_injected_at = NEW.injected_at,
        avg_feedback_rating = (
            SELECT AVG(agent_feedback_rating)
            FROM context_injections
            WHERE context_id = NEW.context_id AND agent_feedback_rating IS NOT NULL
        )
    WHERE context_id = NEW.context_id;

    -- Update unique agent count
    UPDATE context_files_registry
    SET agent_count = (
        SELECT COUNT(DISTINCT agent_id)
        FROM context_injections
        WHERE context_id = NEW.context_id
    )
    WHERE context_id = NEW.context_id;
END;

-- ============================================================================
-- Initial context population (essential system contexts)
-- ============================================================================

-- Universal System Message (ALL agents get this)
INSERT OR IGNORE INTO context_files_registry (
    context_id, context_name, context_type, scope,
    context_text, description, purpose, tags, priority,
    auto_inject_on_connect, injection_frequency, is_active, is_production_ready,
    quality_score, effectiveness_rating, registered_by
) VALUES (
    'universal-system-message-v1',
    'Universal System Message',
    'system_message',
    'universal',
    '# Central-MCP System Message

You are an AI agent operating in the **Central-MCP ecosystem** - a multi-agent coordination system with auto-proactive intelligence.

## Core Principles

1. **Coordination First** - You work with other agents (Agent-A through Agent-F)
2. **Database-Driven** - All entities tracked in SQLite registry
3. **Auto-Proactive** - System has 9 loops discovering projects, monitoring progress, generating specs
4. **Atomic Entities** - Everything is an entity: Projects, Specs, SKPs, Tools, Snippets, Prompts, Contexts
5. **Knowledge Injection** - Context provided automatically based on your role and task

## Available Systems

- **SKPs**: Specialized Knowledge Packs with technical documentation
- **Specs**: Technical specifications and requirements
- **Tools**: CLI tools and utilities
- **Snippets**: Reusable code patterns
- **Prompts**: AI prompt templates
- **Contexts**: This system - context files for agents

## Your Responsibilities

- Query the registry to understand project state
- Use available tools and snippets
- Provide feedback on context effectiveness
- Coordinate with other agents when needed
- Document decisions and progress

## Getting Help

Use the knowledge injection system to access specialized knowledge:
```bash
./scripts/inject-knowledge.sh onboard {agent_id}
```

**Remember**: You are part of an intelligent, coordinated system. Work WITH the system, not around it.',
    'Universal system message injected to ALL agents on connection',
    'Provide basic orientation about Central-MCP ecosystem to every agent',
    '["universal", "system", "onboarding", "core-principles"]',
    100,
    TRUE,
    'once',
    TRUE,
    TRUE,
    0.95,
    0.90,
    'system'
);

-- Agent A (UI) - Role-Specific Context
INSERT OR IGNORE INTO context_files_registry (
    context_id, context_name, context_type, scope,
    context_text, description, purpose, tags, priority,
    target_roles, auto_inject_on_connect, injection_frequency,
    is_active, is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'agent-a-ui-specialist-rules',
    'Agent A - UI Specialist Rules',
    'agent_rules',
    'role_specific',
    '# Agent A - UI Specialist Context

## Your Role
You are the **UI Velocity Specialist** responsible for frontend development and user interfaces.

## Core Responsibilities
- Build React/Next.js components
- Implement Tailwind CSS styling
- Ensure responsive design
- Focus on accessibility (WCAG 2.2 AA)
- Use Universal-UI System patterns

## Development Standards
- **Keyboard Navigation**: Full Tab/Shift+Tab support
- **Focus Indicators**: Clear 3:1 contrast minimum
- **Error Handling**: Non-blocking, clear messages
- **Performance**: Lazy loading, code splitting
- **Testing**: Unit tests for components

## Available Tools
- Backend Connections Registry: `/api/registry/connections`
- Code Snippets: React hooks and components
- Prompts: UI-focused templates

## Quality Requirements
- Responsive across all devices
- Accessible to all users
- Performance optimized
- Production-ready code only

**Work WITH Agent C (Backend) for API integration.**',
    'UI-specific rules and context for Agent A',
    'Guide Agent A with frontend best practices and responsibilities',
    '["agent-a", "ui", "frontend", "react", "role-specific"]',
    90,
    '["Agent-A", "ui", "frontend"]',
    TRUE,
    'always',
    TRUE,
    TRUE,
    0.92,
    0.88,
    'system'
);

-- Agent C (Backend) - Role-Specific Context
INSERT OR IGNORE INTO context_files_registry (
    context_id, context_name, context_type, scope,
    context_text, description, purpose, tags, priority,
    target_roles, auto_inject_on_connect, injection_frequency,
    is_active, is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'agent-c-backend-specialist-rules',
    'Agent C - Backend Specialist Rules',
    'agent_rules',
    'role_specific',
    '# Agent C - Backend Specialist Context

## Your Role
You are the **Backend Specialist** responsible for APIs, databases, and server-side logic.

## Core Responsibilities
- Build REST/GraphQL APIs
- Design database schemas
- Implement authentication/authorization
- Optimize query performance
- Handle error cases gracefully

## Development Standards
- **Security**: No hardcoded secrets, use Doppler
- **Performance**: < 200ms response times
- **Error Handling**: Comprehensive logging
- **Testing**: Unit + integration tests
- **Documentation**: API docs with examples

## Available Tools
- Code Snippets: API middleware, error handlers
- Database migrations system
- Doppler for credential management

## Database Design
- SQLite for small projects
- PostgreSQL for production
- Proper indexes and foreign keys
- Migration-based schema changes

## Security Requirements
- Input validation on all endpoints
- Rate limiting
- CORS configuration
- Authentication required for sensitive endpoints

**Work WITH Agent A (UI) for frontend integration.**',
    'Backend-specific rules and context for Agent C',
    'Guide Agent C with backend best practices and responsibilities',
    '["agent-c", "backend", "api", "database", "role-specific"]',
    90,
    '["Agent-C", "backend", "api"]',
    TRUE,
    'always',
    TRUE,
    TRUE,
    0.93,
    0.89,
    'system'
);

-- Project: Central-MCP - Project-Specific Context
INSERT OR IGNORE INTO context_files_registry (
    context_id, context_name, context_type, scope,
    context_text, description, purpose, tags, priority,
    target_projects, auto_inject_on_connect, injection_frequency,
    is_active, is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'project-central-mcp-context',
    'Central-MCP Project Context',
    'project_rules',
    'project_specific',
    '# Central-MCP Project Context

## Project Overview
**Domain**: centralmcp.net
**Vision**: Minimum specification → Full commercial application
**Status**: 9/9 loops active, 44 projects registered

## Architecture
- **VM**: 136.112.123.243:3002 (GCP free tier)
- **Database**: SQLite with 34+ tables
- **Dashboard**: Next.js 15 App Router
- **Backend**: Node.js with 9 auto-proactive loops

## Auto-Proactive Engine (9 Loops)
1. Loop 0 (5s): System Status
2. Loop 1 (60s): Agent Auto-Discovery
3. Loop 2 (60s): Project Auto-Discovery
4. Loop 3: Context Learning (reserved)
5. Loop 4 (30s): Progress Monitoring
6. Loop 5 (300s): Status Analysis
7. Loop 6 (900s): Opportunity Scanning
8. Loop 7 (600s): Spec Generation
9. Loop 9 (60s): Git Intelligence

## Deployment Workflow
**CRITICAL**: Always deploy backend BEFORE dashboard!
```bash
./scripts/deploy-central-mcp-to-vm.sh  # FIRST!
./scripts/deploy-dashboard-to-vm.sh    # SECOND!
```

## Registry Systems
- SKPs: Specialized Knowledge Packs
- Specs: Technical specifications
- Tools: CLI utilities
- Snippets: Code patterns
- Prompts: AI templates
- Contexts: This system
- Agents: Multi-agent coordination
- Projects: 44 discovered projects

## Development Practices
- Database-driven everything
- Version control all changes
- Test before deploying
- Monitor system health
- Document all decisions',
    'Project-specific context for Central-MCP development',
    'Provide project-specific knowledge to agents working on Central-MCP',
    '["central-mcp", "project", "architecture", "deployment"]',
    80,
    '["central-mcp", "PROJECT_central-mcp"]',
    TRUE,
    'daily',
    TRUE,
    TRUE,
    0.94,
    0.91,
    'system'
);

-- Domain Knowledge: Multi-Agent Coordination
INSERT OR IGNORE INTO context_files_registry (
    context_id, context_name, context_type, scope,
    context_text, description, purpose, tags, priority,
    auto_inject_on_connect, injection_frequency, inject_with_knowledge,
    is_active, is_production_ready, quality_score, effectiveness_rating, registered_by
) VALUES (
    'domain-multi-agent-coordination',
    'Multi-Agent Coordination Best Practices',
    'domain_knowledge',
    'universal',
    '# Multi-Agent Coordination Best Practices

## Agent Roster
- **Agent A**: UI Velocity (GLM-4.6)
- **Agent B**: Design/Architecture (Sonnet-4.5, 1M context)
- **Agent C**: Backend (GLM-4.6)
- **Agent D**: Integration (Sonnet-4.5)
- **Agent E**: Supervisor
- **Agent F**: Strategic

## Coordination Principles

### 1. Database as Single Source of Truth
All state, tasks, and progress tracked in SQLite registry.

### 2. Clear Handoffs
When passing work:
- Update task status in database
- Document what was done
- Document what''s next
- Tag the next agent

### 3. No Duplicate Work
Always check database before starting:
```sql
SELECT * FROM tasks WHERE status = ''IN_PROGRESS'';
```

### 4. Communication via Database
Don''t rely on memory - write everything to registry.

### 5. Role Respect
- UI → Agent A
- Backend → Agent C
- Integration → Agent D
- Design → Agent B

## When to Coordinate
- **Cross-domain work**: UI + Backend → Coordinate with both agents
- **Blockers**: Document in database, notify relevant agent
- **Spec changes**: Update specs table, notify affected agents
- **Deployment**: Backend first, then frontend

## Tools for Coordination
- Task registry: Claim, update, complete tasks
- Agent sessions: Track who''s working on what
- Progress monitoring: Real-time status
- Knowledge injection: Share context automatically',
    'Best practices for multi-agent coordination',
    'Help agents work together effectively',
    '["coordination", "multi-agent", "collaboration", "domain-knowledge"]',
    70,
    TRUE,
    'once',
    TRUE,
    TRUE,
    TRUE,
    0.89,
    0.86,
    'system'
);
