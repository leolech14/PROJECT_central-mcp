⏺ 🧠 CENTRAL-MCP COMPREHENSIVE DEVELOPMENT GUIDE

  Generated: 2025-10-13 | Status: Complete System Knowledge Transfer

  ---
  📋 TABLE OF CONTENTS

  1. #1-system-overview--vision
  2. #2-architecture-deep-dive
  3. #3-project-structure-navigation
  4. #4-development-workflow
  5. #5-auto-proactive-loops-system
  6. #6-universal-write-system
  7. #7-database-architecture
  8. #8-build--compilation
  9. #9-testing--verification
  10. #10-deployment-to-vm
  11. #11-common-development-tasks
  12. #12-critical-patterns--gotchas
  13. #13-debugging-guide
  14. #14-future-extensions

  ---
  1. SYSTEM OVERVIEW & VISION

  What is Central-MCP?

  Central-MCP is a Commercial Application Generation Platform that transforms minimal user input (5-10
  sentences) into complete, revenue-generating commercial applications through automated workflows and
  intelligent orchestration.

  The Complete Pipeline:
  User Idea (5-10 sentences)
      ↓
  Centro MCP Core LLM (structured protocols + best practices)
      ↓
  Auto-Proactive Intelligence (9 loops analyzing and planning)
      ↓
  Predetermined Development Steps (all workflows mapped)
      ↓
  Full-Stack Application (frontend + backend + database + deployment)
      ↓
  Legal & Compliant (terms, privacy, compliance)
      ↓
  Revenue-Generating Product (payment integration, monetization)

  Core Emergent Principle

  MINIMUM USER INPUT → FULL-STACK APPLICATIONS

  Central-MCP uses intelligent abstraction layers:
  - 🎯 Spec-First Approach → Technical specifications from user messages
  - 🔧 Backend Connections Registry → Auto-generated APIs & components
  - 🎨 Universal-UI System → Complete frontend interfaces
  - 🤖 Auto-Proactive Intelligence → Self-optimizing 9-loop system
  - 🚀 Zero-Config Deployment → Instant production deployment

  Official Domain: centralmcp.net (PRODUCTION READY)

  ---
  2. ARCHITECTURE DEEP DIVE

  The 9 Auto-Proactive Loops (Inside-Out Building Pattern)

  Central-MCP's intelligence comes from 9 autonomous loops that continuously observe, analyze, plan,
  and execute:

  LAYER 0: FOUNDATION & AWARENESS
  Loop-0 (5s)  → System Status Health Checks
  Loop-1 (60s) → Agent Auto-Discovery (WHO/WHAT/WHERE awareness)

  LAYER 1: OBSERVATION & TRACKING
  Loop-2 (60s)   → Project Auto-Discovery (44 projects discovered)
  Loop-3 (1200s) → Context Learning (RESERVED - pending LLM integration)
  Loop-4 (30s)   → Progress Auto-Monitoring (session tracking)
  Loop-5 (300s)  → Status Auto-Analysis (health + blocker detection)

  LAYER 2: DETECTION & PLANNING
  Loop-6 (900s) → Opportunity Auto-Scanning (what's needed)
  Loop-7 (600s) → Spec Auto-Generation (what to build)
  Loop-9 (60s)  → Git Push Monitor (git intelligence + auto-versioning)

  LAYER 3: EXECUTION
  Loop-8 (120s) → Task Auto-Assignment (who does what)

  Expected Event Volume: ~1,500+ events/hour

  Universal Write System

  All loops, pipelines, and database changes write to a unified event capture system:

  6 Domain-Specific Event Tables:
  1. system_status_events - System-wide health and loop executions
  2. spec_events - Specification lifecycle (created, updated, validated)
  3. task_events - Task lifecycle (started, completed, blocked)
  4. code_generation_events - Code pipeline events
  5. interview_events - User interview tracking
  6. agent_activity_events - Agent behavior and learning

  Real-Time Aggregation:
  - Events automatically aggregate into current_system_status table
  - Database triggers auto-capture critical state changes
  - Provides single source of truth for system health

  Infrastructure

  Production VM: 136.112.123.243 (GCP us-central1-a)
  Dashboard: http://centralmcp.net (requires auth)
  Database: SQLite (34 tables, 44 projects, 15,885+ loop executions)
  Backend Port: 3002 (PM2: nextjs-dashboard)
  Cost: $0/month (e2-micro free tier)
  Authentication: Session-based, SHA-256 hashed passwords
  Default Login: admin / centralmcp2025 (⚠️ CHANGE THIS!)

  ---
  3. PROJECT STRUCTURE NAVIGATION

  Root Directory Layout

  central-mcp/
  ├── src/                          # TypeScript source code
  │   ├── auto-proactive/           # 🔥 9 autonomous loops (CRITICAL)
  │   ├── api/                      # API implementations
  │   │   ├── universal-write.ts    # 🔥 Event writing system (CRITICAL)
  │   │   └── MonitoringAPI.ts      # System monitoring
  │   ├── database/                 # Database management
  │   │   ├── migrations/           # 🔥 SQL migrations (022 latest)
  │   │   └── DatabaseManager.ts    # DB connection pool
  │   ├── discovery/                # Project detection
  │   ├── monitoring/               # Performance metrics
  │   ├── photon/                   # Photon API server
  │   └── tools/                    # MCP tools
  │
  ├── scripts/                      # 🔥 Automation scripts (CRITICAL)
  │   ├── write-event.cjs           # CLI wrapper for event writing
  │   ├── generate-code.sh          # Code generation pipeline
  │   ├── deploy-central-mcp-to-vm.sh     # Backend deployment
  │   └── deploy-dashboard-to-vm.sh       # Dashboard deployment
  │
  ├── central-mcp-dashboard/        # Next.js 15 dashboard
  │   ├── app/                      # App router pages
  │   ├── components/               # React components
  │   └── lib/                      # Utilities
  │
  ├── data/                         # Runtime data
  │   └── registry.db               # 🔥 SQLite database (CRITICAL)
  │
  ├── docs/                         # Documentation
  │   ├── UNIVERSAL_WRITE_INTEGRATION_COMPLETE.md
  │   └── UNIVERSAL_WRITE_SYSTEM_VERIFICATION_COMPLETE.md
  │
  ├── 02_SPECBASES/                 # Architecture specs
  │   ├── 0010_AUTO_PROACTIVE_INTELLIGENCE.md
  │   └── 0011_SPECBASE_CONSTRUCTION.md
  │
  ├── package.json                  # Dependencies + scripts
  ├── tsconfig.json                 # TypeScript config
  └── CLAUDE.md                     # Agent orientation

  Critical Files to Know

  Auto-Proactive Loops (9 files):
  src/auto-proactive/
  ├── SystemStatusLoop.ts           // Loop-0: Foundation health (every 5s)
  ├── AgentAutoDiscoveryLoop.ts     // Loop-1: Agent tracking (every 60s)
  ├── ProjectDiscoveryLoop.ts       // Loop-2: Project scanning (every 60s)
  ├── ProgressMonitoringLoop.ts     // Loop-4: Session monitoring (every 30s)
  ├── StatusAnalysisLoop.ts         // Loop-5: Health analysis (every 300s)
  ├── OpportunityScanningLoop.ts    // Loop-6: Opportunity detection (every 900s)
  ├── SpecGenerationLoop.ts         // Loop-7: Spec creation (every 600s)
  ├── TaskAssignmentLoop.ts         // Loop-8: Task routing (every 120s)
  └── GitPushMonitor.ts             // Loop-9: Git intelligence (every 60s)

  Universal Write System:
  src/api/universal-write.ts        // Main event writing API
  src/database/migrations/
  ├── 021_universal_write_system.sql    // Event tables
  └── 022_auto_event_triggers.sql       // Auto-event triggers

  Deployment Scripts:
  scripts/deploy-central-mcp-to-vm.sh   # Backend deployment (ALWAYS FIRST!)
  scripts/deploy-dashboard-to-vm.sh     # Dashboard deployment (AFTER backend)

  ---
  4. DEVELOPMENT WORKFLOW

  Step 1: Understand Before Editing

  ALWAYS READ FIRST:
  # Understand the system
  Read: CLAUDE.md (agent orientation)
  Read: docs/UNIVERSAL_WRITE_INTEGRATION_COMPLETE.md
  Read: 02_SPECBASES/0010_AUTO_PROACTIVE_INTELLIGENCE.md

  # Understand a loop before editing
  Read: src/auto-proactive/[LoopName].ts
  Read: src/auto-proactive/BaseLoop.ts (parent class)

  Key Questions to Answer:
  1. What does this loop DO? (purpose)
  2. How often does it RUN? (intervalSeconds)
  3. What does it OBSERVE? (data sources)
  4. What events does it WRITE? (Universal Write System)
  5. What TRIGGERS it? (time, events, manual)

  Step 2: Local Development Setup

  # Navigate to project
  cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

  # Install dependencies (if not already)
  npm install

  # Check TypeScript compilation
  npx tsc --noEmit

  # Run specific loop tests (if available)
  npm test

  # Check database schema
  echo ".tables" | sqlite3 data/registry.db

  Step 3: Making Changes

  Pattern for Adding Event Writing to a Loop:

  // 1. Import at top of file
  import { writeSystemEvent } from '../api/universal-write.js';

  // 2. Replace legacy logging with Universal Write
  // OLD (legacy):
  this.logLoopExecution('LOOP_NAME', result);

  // NEW (Universal Write):
  writeSystemEvent({
    eventType: 'loop_execution',
    eventCategory: 'system',
    eventActor: 'Loop-N',
    eventAction: `Brief description: ${summary}`,
    eventDescription: `Loop #${this.executionCount}`,
    systemHealth: 'healthy',  // or 'warning', 'critical'
    activeLoops: 9,
    avgResponseTimeMs: duration,
    successRate: 1.0,
    tags: ['loop-n', 'auto-proactive', 'keyword'],
    metadata: {
      executionCount: this.executionCount,
      customData: value,
      // ... any additional context
    }
  });

  Common Property Gotchas:
  - ❌ this.loopCount (doesn't exist in BaseLoop)
  - ✅ this.executionCount (correct property)
  - ❌ activeProjects (not in SystemEvent interface)
  - ✅ activeTasks, activeAgents (valid properties)

  Step 4: Compilation & Testing

  # Check TypeScript errors (focus on your changes)
  npx tsc --noEmit 2>&1 | grep -i "auto-proactive"

  # Build (will show all errors, ignore pre-existing ones)
  npm run build

  # Test event writing via CLI
  node scripts/write-event.cjs system '{
    "eventType": "loop_execution",
    "eventCategory": "system",
    "eventActor": "Test-Loop",
    "eventAction": "Testing integration",
    "systemHealth": "healthy",
    "activeLoops": 9,
    "tags": ["test"],
    "metadata": {"test": true}
  }'

  # Verify event in database
  echo "SELECT event_actor, event_action FROM system_status_events ORDER BY event_timestamp DESC LIMIT 
  5;" | sqlite3 data/registry.db

  Step 5: Deployment

  CRITICAL: ALWAYS DEPLOY BACKEND BEFORE DASHBOARD!

  # Step 1: Deploy Central-MCP backend (REQUIRED FIRST!)
  ./scripts/deploy-central-mcp-to-vm.sh

  # Step 2: Verify backend deployment
  gcloud compute ssh central-mcp-server --zone=us-central1-a \
    --command='sudo journalctl -u central-mcp -f'

  # Step 3: Deploy dashboard (ONLY AFTER BACKEND VERIFIED)
  ./scripts/deploy-dashboard-to-vm.sh

  # Step 4: Verify dashboard
  curl http://136.112.123.243:3002/api/health

  ---
  5. AUTO-PROACTIVE LOOPS SYSTEM

  BaseLoop Architecture

  All loops extend BaseLoop class:

  import { BaseLoop } from './BaseLoop.js';

  export class MyLoop extends BaseLoop {
    constructor(db: Database.Database, config: MyLoopConfig) {
      super({
        name: 'MyLoop',
        description: 'What this loop does',
        intervalSeconds: config.intervalSeconds,
        triggers: ['time', 'event', 'manual'],  // When it runs
        category: 'observation'  // or 'analysis', 'generation', 'execution'
      });
      this.db = db;
      this.config = config;
    }

    // REQUIRED: Implement execution logic
    protected async executeLoop(): Promise<void> {
      const startTime = Date.now();

      try {
        // 1. Observe/Analyze/Generate/Execute
        const result = await this.doWork();

        // 2. Write event to Universal Write System
        writeSystemEvent({
          eventType: 'loop_execution',
          eventCategory: 'system',
          eventActor: 'Loop-Name',
          eventAction: `Summary of what happened`,
          systemHealth: 'healthy',
          activeLoops: 9,
          avgResponseTimeMs: Date.now() - startTime,
          successRate: 1.0,
          tags: ['loop-tag', 'auto-proactive'],
          metadata: { executionCount: this.executionCount, ...result }
        });

      } catch (err: any) {
        logger.error(`Loop error:`, err);
        // Write error event
        writeSystemEvent({
          eventType: 'loop_error',
          eventCategory: 'system',
          eventActor: 'Loop-Name',
          eventAction: `Error: ${err.message}`,
          systemHealth: 'critical',
          tags: ['error', 'loop-tag'],
          metadata: { error: err.message, stack: err.stack }
        });
      }
    }

    private async doWork(): Promise<any> {
      // Loop-specific logic here
    }
  }

  Key Properties Available:
  - this.executionCount - Number of times loop has run
  - this.isRunning - Whether loop is active
  - this.intervalHandle - Timer reference
  - this.config - Loop configuration

  Key Methods:
  - start() - Start the loop
  - stop() - Stop the loop
  - executeLoop() - Run one cycle (abstract, must implement)
  - getStats() - Return loop statistics

  Loop Lifecycle

  1. Constructor called → Config stored
  2. start() called → Runs immediately, then sets interval
  3. executeLoop() called every interval → Does work, writes events
  4. stop() called → Clears interval, sets isRunning=false

  Event Volume by Loop

  Loop-0: 720 events/hour (5s interval) - Most frequent
  Loop-1: 60 events/hour (60s interval)
  Loop-2: 60 events/hour (60s interval)
  Loop-4: 120 events/hour (30s interval)
  Loop-5: 12 events/hour (300s interval)
  Loop-6: 4 events/hour (900s interval) - Least frequent
  Loop-7: 6 events/hour (600s interval)
  Loop-8: 30 events/hour (120s interval)
  Loop-9: 60 events/hour (60s interval)

  ---
  6. UNIVERSAL WRITE SYSTEM

  The Philosophy

  WRITE EVERYTHING, ORGANIZE EVERYTHING

  Every action, decision, change, progress update must be captured. Not as a giant unstructured log,
  but as domain-specific structured events.

  6 Event Domains

  // 1. SYSTEM EVENTS (Loop executions, health checks)
  writeSystemEvent({
    eventType: 'loop_execution' | 'loop_error' | 'health_check',
    eventCategory: 'system',
    eventActor: 'Loop-N' | 'System' | 'Agent-X',
    eventAction: 'What happened',
    systemHealth: 'healthy' | 'warning' | 'critical',
    activeLoops: 9,
    activeTasks: 0,
    activeAgents: 0,
    avgResponseTimeMs: 123,
    successRate: 1.0,
    tags: ['loop-n', 'health', 'monitoring'],
    metadata: { /* custom data */ }
  });

  // 2. SPEC EVENTS (Specification lifecycle)
  writeSpecEvent({
    specId: 'spec-001',
    specName: 'User Authentication',
    specType: 'feature',
    completenessScore: 0.85,
    validationStatus: 'valid',
    eventType: 'created' | 'updated' | 'validated' | 'gap_detected',
    eventCategory: 'lifecycle' | 'quality' | 'progress',
    eventActor: 'Agent-B',
    eventAction: 'Created authentication spec',
    triggeredBy: 'Loop-7',
    relatedEntities: { tasks: ['T001'], codebases: ['CB001'] }
  });

  // 3. TASK EVENTS (Task lifecycle)
  writeTaskEvent({
    taskId: 'T001',
    taskName: 'Implement login API',
    taskType: 'implementation',
    priority: 'high',
    status: 'in-progress',
    eventType: 'started' | 'completed' | 'blocked' | 'unblocked',
    eventCategory: 'lifecycle',
    eventActor: 'Agent-C',
    eventAction: 'Started implementation',
    assignedAgent: 'Agent-C',
    triggeredBy: 'Loop-8',
    stateBefore: { status: 'pending' },
    stateAfter: { status: 'in-progress' }
  });

  // 4. CODE GENERATION EVENTS
  writeCodeGenerationEvent({
    codebaseId: 'CB001',
    codebaseName: 'auth-service',
    specId: 'spec-001',
    strategyId: 'orchestrated',
    generationMethod: 'orchestrated',
    eventType: 'codebase_created' | 'validation_complete',
    outputPath: '/path/to/codebase',
    buildPassing: true,
    triggeredBy: 'generate-code.sh'
  });

  // 5. INTERVIEW EVENTS
  writeInterviewEvent({
    interviewId: 'INT001',
    specId: 'spec-001',
    questionNumber: 1,
    questionText: 'What authentication methods?',
    responseText: 'Email + OAuth',
    eventType: 'question_asked' | 'question_answered' | 'interview_completed',
    completenessScore: 0.5,
    triggeredBy: 'User'
  });

  // 6. AGENT ACTIVITY EVENTS
  writeAgentActivityEvent({
    agentId: 'agent-b',
    agentModel: 'claude-sonnet-4-5',
    activityType: 'code_written' | 'decision_made' | 'learning',
    eventType: 'agent_learned' | 'agent_improved',
    eventCategory: 'learning',
    eventActor: 'Agent-B',
    eventAction: 'Learned new pattern',
    learningContext: 'Discovered better approach to auth',
    metadata: { pattern: 'JWT with refresh tokens' }
  });

  Database Triggers (Auto-Event Capture)

  Migration 022 created 2 triggers:

  -- Trigger 1: Auto-capture task status changes
  CREATE TRIGGER auto_task_event_on_update
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN NEW.status != OLD.status
  BEGIN
      INSERT INTO task_events (...)
      VALUES (
          'evt-task-' || timestamp || random,
          NEW.id,
          CASE NEW.status
              WHEN 'completed' THEN 'completed'
              WHEN 'in-progress' THEN 'started'
              WHEN 'blocked' THEN 'blocked'
              WHEN 'pending' THEN 'unblocked'
          END,
          'lifecycle',
          datetime('now'),
          COALESCE(NEW.agent, 'system'),
          'Status changed: ' || OLD.status || ' → ' || NEW.status,
          json_object('status', OLD.status),
          json_object('status', NEW.status),
          'database_trigger'
      );
  END;

  -- Trigger 2: Auto-capture spec completeness changes
  CREATE TRIGGER auto_spec_event_on_completeness_change
  AFTER UPDATE ON specs_registry
  FOR EACH ROW
  WHEN (NEW.completeness_score != OLD.completeness_score) OR
       (NEW.validation_status != OLD.validation_status)
  BEGIN
      INSERT INTO spec_events (...)
      VALUES (...);
  END;

  Status Aggregation Triggers (auto-update current_system_status):
  CREATE TRIGGER update_status_on_task_event
  AFTER INSERT ON task_events
  BEGIN
      UPDATE current_system_status
      SET
          tasks_completed = (SELECT COUNT(*) FROM tasks WHERE status='completed'),
          tasks_in_progress = (SELECT COUNT(*) FROM tasks WHERE status='in-progress'),
          tasks_blocked = (SELECT COUNT(*) FROM tasks WHERE status='blocked'),
          last_updated = datetime('now')
      WHERE status_id = 'current';
  END;

  CLI Wrapper for Bash Scripts

  # Use write-event.cjs for bash scripts
  node scripts/write-event.cjs system '{
    "eventType": "deployment",
    "eventCategory": "system",
    "eventActor": "deploy-script",
    "eventAction": "Deployed to production",
    "systemHealth": "healthy",
    "activeLoops": 9,
    "tags": ["deployment", "production"],
    "metadata": {"version": "1.2.3"}
  }'

  Returns: Event ID (e.g., evt-system-1760319879417-5dbfc46f)

  ---
  7. DATABASE ARCHITECTURE

  Schema Overview

  34 Tables Total, organized by domain:

  Core Registry Tables:
  projects                    -- 44 discovered projects
  tasks                       -- Development tasks
  specs_registry              -- Technical specifications
  codebases_registry          -- Generated codebases
  agent_sessions              -- Active agent connections

  Event Tables (Universal Write System):
  system_status_events        -- System health, loop executions
  spec_events                 -- Spec lifecycle events
  task_events                 -- Task lifecycle events
  code_generation_events      -- Code pipeline events
  interview_events            -- User interview tracking
  agent_activity_events       -- Agent learning events

  Aggregation Tables:
  current_system_status       -- Real-time system health (SINGLE ROW)
  status_snapshots            -- Historical snapshots

  Legacy Tables (still used):
  auto_proactive_logs         -- Old logging system (being phased out)
  prompt_ratings              -- LLM response quality
  conversations               -- Chat history

  Key Table: current_system_status

  Single-row table with real-time aggregated metrics:

  CREATE TABLE current_system_status (
      status_id TEXT PRIMARY KEY DEFAULT 'current',

      -- Overall Health
      system_health TEXT DEFAULT 'healthy',
      health_score REAL DEFAULT 1.0,
      last_health_check TIMESTAMP,

      -- Component Counts
      specs_total INTEGER DEFAULT 0,
      specs_complete INTEGER DEFAULT 0,
      tasks_total INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      tasks_in_progress INTEGER DEFAULT 0,
      tasks_blocked INTEGER DEFAULT 0,

      -- Agent Activity
      agents_active INTEGER DEFAULT 0,
      total_agent_hours REAL DEFAULT 0.0,

      -- Quality Metrics
      avg_spec_completeness REAL DEFAULT 0.0,
      avg_task_quality REAL DEFAULT 0.0,

      -- Performance
      avg_response_time_ms REAL DEFAULT 0.0,
      success_rate REAL DEFAULT 1.0,
      error_rate REAL DEFAULT 0.0,

      -- Activity (last 24h)
      events_last_24h INTEGER DEFAULT 0,
      tasks_completed_last_24h INTEGER DEFAULT 0,

      -- Timestamps
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  Always query this for dashboard/monitoring:
  SELECT * FROM current_system_status WHERE status_id='current';

  Database Migrations

  Location: src/database/migrations/

  Current Version: Migration 022 (Auto-Event Triggers)

  How to Apply a Migration:
  sqlite3 data/registry.db < src/database/migrations/022_auto_event_triggers.sql

  Creating New Migration:
  1. Create file: 023_your_migration_name.sql
  2. Add header with purpose, created date, dependencies
  3. Write idempotent SQL (use IF NOT EXISTS)
  4. Add verification SELECT at end
  5. Test locally before deploying
  6. Document in migration file

  Migration Pattern:
  -- ============================================================================
  -- Migration 023: Your Migration Name
  -- ============================================================================
  -- Purpose: What this migration does
  -- Created: 2025-10-13
  -- Dependencies: Migration 022
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS your_table (
      id TEXT PRIMARY KEY,
      -- ...
  );

  -- Verification
  SELECT 'Migration 023 applied: ' || COUNT(*) FROM your_table;

  ---
  8. BUILD & COMPILATION

  Module System Challenges

  Central-MCP has a dual module system:
  - TypeScript code uses ES Modules (import/export)
  - Some scripts use CommonJS (require/module.exports)

  Key Files:
  - package.json: "type": "module" (ES modules default)
  - .ts files → ES modules
  - .cjs files → CommonJS (explicit)
  - .js files → ES modules (due to package.json setting)

  TypeScript Compilation

  # Check for errors without compiling
  npx tsc --noEmit

  # Build (compiles to dist/)
  npm run build

  # Watch mode (auto-recompile on changes)
  npm run dev

  Pre-existing Errors to Ignore:
  src/api/MonitoringAPI.ts - Database namespace issues
  src/monitoring/PrometheusExporter.ts - Missing prom-client types
  src/photon/* - Various type issues
  src/tools/visual/* - ComfyUI type issues

  These don't affect auto-proactive loops or Universal Write System!

  Focusing on Your Changes

  # Only show errors in auto-proactive files
  npx tsc --noEmit 2>&1 | grep -i "auto-proactive"

  # Only show errors in specific file
  npx tsc --noEmit 2>&1 | grep "YourFile.ts"

  Common Compilation Errors

  Error: Property 'loopCount' does not exist
  Fix: Use this.executionCount (correct property in BaseLoop)

  Error: Property 'activeProjects' does not exist
  Fix: Remove activeProjects, use activeTasks or activeAgents

  Error: Cannot find module './something.js'
  Fix: Ensure import has .js extension (required for ES modules)

  Error: FOREIGN KEY constraint failed
  Fix: Ensure referenced entity exists before writing event (e.g., spec must exist before spec_event)

  ---
  9. TESTING & VERIFICATION

  Testing Event Writing

  CLI Test:
  # Test system event
  node scripts/write-event.cjs system '{
    "eventType": "loop_execution",
    "eventCategory": "system",
    "eventActor": "Test",
    "eventAction": "Testing",
    "systemHealth": "healthy",
    "activeLoops": 9,
    "tags": ["test"],
    "metadata": {}
  }'

  # Verify in database
  echo "SELECT event_actor, event_action, event_timestamp FROM system_status_events ORDER BY 
  event_timestamp DESC LIMIT 5;" | sqlite3 data/registry.db

  TypeScript Test (after compilation):
  import { writeSystemEvent } from './src/api/universal-write.js';

  writeSystemEvent({
    eventType: 'loop_execution',
    eventCategory: 'system',
    eventActor: 'Test-Integration',
    eventAction: 'Testing Universal Write integration',
    systemHealth: 'healthy',
    activeLoops: 9,
    tags: ['integration-test'],
    metadata: { test: true }
  });

  Testing Database Triggers

  # Test task event trigger
  echo "UPDATE tasks SET status='IN_PROGRESS' WHERE id='T002';" | sqlite3 data/registry.db

  # Verify trigger created event
  echo "SELECT event_type, event_action, triggered_by FROM task_events WHERE task_id='T002' ORDER BY 
  event_timestamp DESC LIMIT 1;" | sqlite3 data/registry.db

  # Should return: "started|Status changed: ... → IN_PROGRESS|database_trigger"

  Testing Status Aggregation

  # Check current status before
  echo "SELECT tasks_total, tasks_completed, last_updated FROM current_system_status WHERE 
  status_id='current';" | sqlite3 data/registry.db

  # Make a change (e.g., complete a task)
  echo "UPDATE tasks SET status='COMPLETE' WHERE id='T003';" | sqlite3 data/registry.db

  # Check current status after
  echo "SELECT tasks_total, tasks_completed, last_updated FROM current_system_status WHERE 
  status_id='current';" | sqlite3 data/registry.db

  # last_updated should have changed!

  Verification Checklist

  Before deployment:
  - TypeScript compiles without new errors
  - Event writing test passes
  - Database triggers fire correctly
  - Status aggregation updates
  - No broken foreign key constraints
  - Documentation updated

  ---
  10. DEPLOYMENT TO VM

  CRITICAL DEPLOYMENT ORDER

  ⚠️ ALWAYS DEPLOY BACKEND BEFORE DASHBOARD! ⚠️

  ┌─────────────────────────────────────────────────┐
  │  THE GOLDEN RULE:                                │
  │  1. Deploy Central-MCP backend FIRST             │
  │  2. Verify it's running                          │
  │  3. THEN deploy dashboards                       │
  └─────────────────────────────────────────────────┘

  Step-by-Step Deployment

  Step 1: Deploy Backend
  ./scripts/deploy-central-mcp-to-vm.sh

  # This script:
  # 1. Builds TypeScript locally
  # 2. Copies files to VM via gcloud compute scp
  # 3. Installs dependencies on VM
  # 4. Restarts systemd service
  # 5. Verifies service health

  Step 2: Verify Backend Deployment
  # Check service logs
  gcloud compute ssh central-mcp-server --zone=us-central1-a \
    --command='sudo journalctl -u central-mcp -f'

  # Should show:
  # "✅ All 9 Auto-Proactive Loops started successfully"
  # "🚀 Central-MCP running on port 3001"

  # Test health endpoint
  gcloud compute ssh central-mcp-server --zone=us-central1-a \
    --command='curl -s http://localhost:3001/health | jq'

  # Should return:
  # {
  #   "status": "healthy",
  #   "loops": 9,
  #   "database": "connected"
  # }

  Step 3: Deploy Dashboard (ONLY AFTER BACKEND VERIFIED)
  ./scripts/deploy-dashboard-to-vm.sh

  # This script:
  # 1. Builds Next.js dashboard locally
  # 2. Copies .next/ folder to VM
  # 3. Restarts PM2 process
  # 4. Verifies dashboard health

  Step 4: Verify Dashboard
  # Test dashboard endpoint
  curl http://136.112.123.243:3002/api/health

  # Access dashboard in browser
  open http://centralmcp.net
  # Login: admin / centralmcp2025

  VM SSH Access

  # Connect to VM
  gcloud compute ssh central-mcp-server --zone=us-central1-a

  # Once connected:
  # Check backend service
  sudo systemctl status central-mcp

  # Check dashboard PM2 process
  pm2 list
  pm2 logs nextjs-dashboard

  # Check database
  sqlite3 /opt/central-mcp/data/registry.db

  # Exit VM
  exit

  Rollback Procedure

  If deployment fails:

  # SSH to VM
  gcloud compute ssh central-mcp-server --zone=us-central1-a

  # Rollback backend
  cd /opt/central-mcp
  git log --oneline -5  # Find previous commit
  git checkout <previous-commit-hash>
  npm install
  sudo systemctl restart central-mcp

  # Rollback dashboard
  pm2 stop nextjs-dashboard
  cd central-mcp-dashboard
  git checkout <previous-commit-hash>
  npm run build
  pm2 start nextjs-dashboard

  ---
  11. COMMON DEVELOPMENT TASKS

  Task 1: Adding a New Auto-Proactive Loop

  Example: Adding Loop-10 for Performance Monitoring

  // 1. Create file: src/auto-proactive/PerformanceMonitoringLoop.ts
  import { BaseLoop } from './BaseLoop.js';
  import { writeSystemEvent } from '../api/universal-write.js';
  import Database from 'better-sqlite3';
  import { logger } from '../utils/logger.js';

  export interface PerformanceMonitoringConfig {
    intervalSeconds: number;    // How often to run
    monitorCPU: boolean;
    monitorMemory: boolean;
  }

  export class PerformanceMonitoringLoop extends BaseLoop {
    private db: Database.Database;
    private config: PerformanceMonitoringConfig;

    constructor(db: Database.Database, config: PerformanceMonitoringConfig) {
      super({
        name: 'PerformanceMonitoringLoop',
        description: 'Monitors system performance metrics',
        intervalSeconds: config.intervalSeconds,
        triggers: ['time'],
        category: 'observation'
      });
      this.db = db;
      this.config = config;
    }

    protected async executeLoop(): Promise<void> {
      const startTime = Date.now();

      try {
        // 1. Collect metrics
        const cpuUsage = this.config.monitorCPU ? this.getCPUUsage() : 0;
        const memUsage = this.config.monitorMemory ? this.getMemoryUsage() : 0;

        // 2. Determine health
        const systemHealth =
          cpuUsage > 90 || memUsage > 90 ? 'critical' :
          cpuUsage > 70 || memUsage > 70 ? 'warning' :
          'healthy';

        // 3. Write event
        writeSystemEvent({
          eventType: 'loop_execution',
          eventCategory: 'system',
          eventActor: 'Loop-10',
          eventAction: `Performance: CPU ${cpuUsage}%, Memory ${memUsage}%`,
          eventDescription: `Loop #${this.executionCount}`,
          systemHealth,
          activeLoops: 10,  // Update count!
          avgResponseTimeMs: Date.now() - startTime,
          successRate: 1.0,
          tags: ['loop-10', 'performance', 'monitoring'],
          metadata: {
            executionCount: this.executionCount,
            cpuUsage,
            memUsage
          }
        });

        logger.info(`✅ Loop-10 Complete: CPU ${cpuUsage}%, Memory ${memUsage}%`);

      } catch (err: any) {
        logger.error(`❌ Loop-10 Error:`, err);

        writeSystemEvent({
          eventType: 'loop_error',
          eventCategory: 'system',
          eventActor: 'Loop-10',
          eventAction: `Error: ${err.message}`,
          systemHealth: 'critical',
          activeLoops: 10,
          tags: ['error', 'loop-10'],
          metadata: { error: err.message }
        });
      }
    }

    private getCPUUsage(): number {
      // Implementation
      return Math.random() * 100;
    }

    private getMemoryUsage(): number {
      // Implementation
      return Math.random() * 100;
    }
  }

  // 2. Export from src/auto-proactive/index.ts
  export { PerformanceMonitoringLoop } from './PerformanceMonitoringLoop.js';

  // 3. Start loop in main server file
  import { PerformanceMonitoringLoop } from './auto-proactive/index.js';

  const loop10 = new PerformanceMonitoringLoop(db, {
    intervalSeconds: 120,
    monitorCPU: true,
    monitorMemory: true
  });
  loop10.start();

  // 4. Update activeLoops count in ALL other loops
  // Change: activeLoops: 9 → activeLoops: 10

  Task 2: Adding New Event Type

  Example: Adding Deployment Events

  -- 1. Create migration: src/database/migrations/023_deployment_events.sql
  CREATE TABLE IF NOT EXISTS deployment_events (
      event_id TEXT PRIMARY KEY,
      deployment_id TEXT NOT NULL,
      environment TEXT NOT NULL,      -- 'development', 'staging', 'production'
      version TEXT NOT NULL,

      -- Event Classification
      event_type TEXT NOT NULL,       -- 'deployment_started', 'deployment_completed', 
  'deployment_failed'
      event_category TEXT NOT NULL,   -- 'lifecycle', 'rollback', 'monitoring'

      -- Event Details
      event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      event_actor TEXT NOT NULL,
      event_action TEXT NOT NULL,

      -- Deployment Context
      commit_hash TEXT,
      branch_name TEXT,
      deployment_duration_seconds INTEGER,

      -- Metadata
      triggered_by TEXT,
      metadata TEXT,                  -- JSON
      tags TEXT                       -- JSON array
  );

  CREATE INDEX idx_deployment_events_type ON deployment_events(event_type);
  CREATE INDEX idx_deployment_events_env ON deployment_events(environment);

  // 2. Add to src/api/universal-write.ts
  export function writeDeploymentEvent(params: {
    deploymentId: string;
    environment: 'development' | 'staging' | 'production';
    version: string;
    eventType: 'deployment_started' | 'deployment_completed' | 'deployment_failed';
    eventCategory: string;
    eventActor: string;
    eventAction: string;
    commitHash?: string;
    branchName?: string;
    deploymentDurationSeconds?: number;
    triggeredBy?: string;
    metadata?: any;
    tags?: string[];
  }): string {
    const db = getDatabase();
    const eventId = `evt-deploy-${Date.now()}-${randomBytes(4).toString('hex')}`;

    db.prepare(`
      INSERT INTO deployment_events (
        event_id, deployment_id, environment, version,
        event_type, event_category, event_timestamp, event_actor, event_action,
        commit_hash, branch_name, deployment_duration_seconds,
        triggered_by, metadata, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      params.deploymentId,
      params.environment,
      params.version,
      params.eventType,
      params.eventCategory,
      new Date().toISOString(),
      params.eventActor,
      params.eventAction,
      params.commitHash || null,
      params.branchName || null,
      params.deploymentDurationSeconds || null,
      params.triggeredBy || null,
      params.metadata ? JSON.stringify(params.metadata) : null,
      params.tags ? JSON.stringify(params.tags) : null
    );

    return eventId;
  }

  // 3. Use in deployment script
  writeDeploymentEvent({
    deploymentId: 'deploy-001',
    environment: 'production',
    version: '1.2.3',
    eventType: 'deployment_started',
    eventCategory: 'lifecycle',
    eventActor: 'deploy-script',
    eventAction: 'Starting production deployment',
    commitHash: 'abc123',
    branchName: 'main',
    triggeredBy: 'CI/CD',
    tags: ['automated', 'production']
  });

  Task 3: Querying Events for Analysis

  -- Get all loop executions in last hour
  SELECT
    event_actor,
    COUNT(*) as executions,
    AVG(avg_response_time_ms) as avg_duration,
    MIN(system_health) as worst_health
  FROM system_status_events
  WHERE event_type = 'loop_execution'
    AND event_timestamp > datetime('now', '-1 hour')
  GROUP BY event_actor
  ORDER BY executions DESC;

  -- Find all errors in last 24 hours
  SELECT
    event_actor,
    event_action,
    event_timestamp,
    metadata
  FROM system_status_events
  WHERE event_type = 'loop_error'
    AND event_timestamp > datetime('now', '-24 hours')
  ORDER BY event_timestamp DESC;

  -- Track task completion rate
  SELECT
    DATE(event_timestamp) as date,
    COUNT(*) as tasks_completed
  FROM task_events
  WHERE event_type = 'completed'
  GROUP BY DATE(event_timestamp)
  ORDER BY date DESC
  LIMIT 7;

  -- Spec quality over time
  SELECT
    spec_id,
    spec_name,
    completeness_score,
    event_timestamp
  FROM spec_events
  WHERE event_type = 'updated'
  ORDER BY event_timestamp DESC
  LIMIT 20;

  ---
  12. CRITICAL PATTERNS & GOTCHAS

  ❌ GOTCHA 1: Module System Confusion

  Problem:
  // This fails in ES modules!
  const db = require('./database');
  module.exports = MyClass;

  Solution:
  // Use ES module syntax
  import db from './database.js';  // Note: .js extension required!
  export default MyClass;

  For CommonJS (e.g., CLI scripts):
  // Use .cjs extension
  // File: write-event.cjs
  const db = require('./database');
  module.exports = { writeEvent };

  ❌ GOTCHA 2: BaseLoop Property Names

  Problem:
  // This doesn't exist!
  metadata: { loopCount: this.loopCount }  // ❌

  Solution:
  // Use executionCount
  metadata: { executionCount: this.executionCount }  // ✅

  ❌ GOTCHA 3: Invalid SystemEvent Properties

  Problem:
  writeSystemEvent({
    activeProjects: 44,  // ❌ Not in SystemEvent interface
    projectsScanned: 10  // ❌ Should go in metadata
  });

  Solution:
  writeSystemEvent({
    activeTasks: 10,     // ✅ Valid property
    activeAgents: 5,     // ✅ Valid property
    metadata: {          // ✅ Custom data goes here
      projectsScanned: 44,
      projectsRegistered: 10
    }
  });

  ❌ GOTCHA 4: Foreign Key Constraints

  Problem:
  // Spec doesn't exist yet!
  writeSpecEvent({
    specId: 'spec-999',  // ❌ Not in specs_registry
    ...
  });
  // Error: FOREIGN KEY constraint failed

  Solution:
  // 1. Ensure spec exists first
  db.prepare(`
    INSERT OR IGNORE INTO specs_registry (spec_id, spec_name, ...)
    VALUES (?, ?, ...)
  `).run('spec-999', 'My Spec', ...);

  // 2. Then write event
  writeSpecEvent({
    specId: 'spec-999',  // ✅ Now exists
    ...
  });

  ❌ GOTCHA 5: Deployment Order

  Problem:
  # This breaks the system!
  ./scripts/deploy-dashboard-to-vm.sh  # ❌ Dashboard deployed first
  ./scripts/deploy-central-mcp-to-vm.sh  # ❌ Backend deployed second

  Solution:
  # ALWAYS backend first!
  ./scripts/deploy-central-mcp-to-vm.sh  # ✅ Backend first
  # Verify it's running
  ./scripts/deploy-dashboard-to-vm.sh   # ✅ Dashboard second

  ❌ GOTCHA 6: SQLite Transaction Safety

  Problem:
  // Multiple writes without transaction
  db.prepare('INSERT INTO table1 ...').run(...);
  // If this fails, table1 has bad data!
  db.prepare('INSERT INTO table2 ...').run(...);

  Solution:
  // Use transactions for multi-table writes
  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO table1 ...').run(...);
    db.prepare('INSERT INTO table2 ...').run(...);
  });

  transaction();  // Atomic: both succeed or both fail

  ✅ PATTERN 1: Read-Before-Edit

  Always read code before modifying:
  // 1. Read the file
  const code = await read('src/auto-proactive/MyLoop.ts');

  // 2. Understand structure
  // - What does it do?
  // - What properties are available?
  // - What imports does it use?

  // 3. Make surgical changes
  // - Minimal scope
  // - Preserve existing functionality
  // - Add new functionality cleanly

  // 4. Verify compilation
  // npx tsc --noEmit

  ✅ PATTERN 2: Event-Driven Architecture

  Everything writes events:
  // Loop executes → writes event
  executeLoop() {
    const result = doWork();
    writeSystemEvent({ ... });
  }

  // Database changes → trigger fires → writes event
  CREATE TRIGGER auto_capture
  AFTER UPDATE ON tasks
  BEGIN
    INSERT INTO task_events (...);
  END;

  // Script runs → writes event
  ./deploy.sh
    → node write-event.cjs deployment {...}

  ✅ PATTERN 3: Idempotent Operations

  Make operations safe to retry:
  -- Bad: Fails on second run
  CREATE TABLE my_table (...);

  -- Good: Safe to run multiple times
  CREATE TABLE IF NOT EXISTS my_table (...);

  -- Bad: Errors if row exists
  INSERT INTO settings VALUES ('key', 'value');

  -- Good: Updates if exists
  INSERT OR REPLACE INTO settings VALUES ('key', 'value');

  ---
  13. DEBUGGING GUIDE

  Debugging Auto-Proactive Loops

  Problem: Loop not executing

  Diagnosis:
  // 1. Check if loop is running
  const stats = loop.getStats();
  console.log('Is running:', stats.isRunning);
  console.log('Execution count:', stats.executionCount);

  // 2. Check loop was started
  // Look for: "✅ Loop-N: [Name] ACTIVE" in logs

  // 3. Check interval is reasonable
  console.log('Interval:', stats.intervalSeconds);  // Not too long?

  // 4. Check for errors in executeLoop
  // Add try/catch with detailed logging

  Problem: Loop executes but no events

  Diagnosis:
  // 1. Verify writeSystemEvent is called
  protected async executeLoop(): Promise<void> {
    console.log('🔍 Loop executing...');

    writeSystemEvent({ ... });

    console.log('✅ Event written');
  }

  // 2. Check database for events
  echo "SELECT COUNT(*) FROM system_status_events WHERE event_actor='Loop-N';" | sqlite3
  data/registry.db

  // 3. Check for database errors
  // Look for FOREIGN KEY, NOT NULL constraint errors

  Debugging Database Issues

  Problem: Foreign key constraint failed

  Diagnosis:
  # 1. Check what tables have foreign keys
  echo ".schema your_table" | sqlite3 data/registry.db

  # 2. Verify referenced entity exists
  echo "SELECT * FROM referenced_table WHERE id='referenced-id';" | sqlite3 data/registry.db

  # 3. Temporarily disable foreign keys for testing
  echo "PRAGMA foreign_keys=OFF;" | sqlite3 data/registry.db

  Problem: NOT NULL constraint failed

  Diagnosis:
  -- 1. Check table schema
  .schema your_table

  -- 2. Identify which column is NOT NULL
  -- 3. Ensure your INSERT/UPDATE provides that value
  -- 4. Or make column nullable in migration
  ALTER TABLE your_table ADD COLUMN new_col TEXT;  -- Nullable by default

  Debugging Compilation Errors

  Problem: Cannot find module

  Solution:
  // ❌ Missing .js extension
  import { something } from './module';

  // ✅ Add .js extension
  import { something } from './module.js';

  Problem: Property doesn't exist

  Solution:
  // 1. Check actual property names
  console.log(Object.keys(this));

  // 2. Read parent class (BaseLoop.ts)
  // 3. Use correct property name

  // ❌ Wrong
  metadata: { loopCount: this.loopCount }

  // ✅ Correct
  metadata: { executionCount: this.executionCount }

  Debugging VM Deployment

  Problem: Deployment fails

  Diagnosis:
  # 1. Check script output for errors
  ./scripts/deploy-central-mcp-to-vm.sh 2>&1 | tee deploy.log

  # 2. SSH to VM and check service
  gcloud compute ssh central-mcp-server --zone=us-central1-a
  sudo journalctl -u central-mcp -n 100 --no-pager

  # 3. Check file permissions
  ls -la /opt/central-mcp/

  # 4. Check dependencies installed
  cd /opt/central-mcp && npm list better-sqlite3

  Problem: Service starts but crashes

  Diagnosis:
  # 1. Check full error log
  sudo journalctl -u central-mcp -f

  # 2. Common issues:
  # - Missing dependencies: npm install
  # - Database permissions: chmod 666 data/registry.db
  # - Port conflicts: lsof -i :3001
  # - Module errors: Check import paths

  Debugging Event Flow

  Problem: Events not appearing in dashboard

  Diagnosis:
  -- 1. Check events exist in database
  SELECT COUNT(*) FROM system_status_events;

  -- 2. Check recent events
  SELECT event_actor, event_action, event_timestamp
  FROM system_status_events
  ORDER BY event_timestamp DESC
  LIMIT 10;

  -- 3. Check current_system_status is updating
  SELECT last_updated FROM current_system_status WHERE status_id='current';

  -- 4. Manually update to test
  UPDATE current_system_status
  SET last_updated = datetime('now')
  WHERE status_id='current';

  ---
  14. FUTURE EXTENSIONS

  Phase 2: Advanced Event Features

  HTTP API for Events:
  // app/api/events/route.ts
  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('type');
    const since = searchParams.get('since');

    // Query events with filters
    const events = db.prepare(`
      SELECT * FROM system_status_events
      WHERE event_type = ?
        AND event_timestamp > ?
      ORDER BY event_timestamp DESC
      LIMIT 100
    `).all(eventType, since);

    return Response.json({ events });
  }

  Real-Time Event Streaming:
  // Server-Sent Events
  export async function GET(request: Request) {
    const stream = new ReadableStream({
      start(controller) {
        // Subscribe to database changes
        const watcher = watchDatabaseChanges((event) => {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        });

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          watcher.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });
  }

  Phase 3: Machine Learning Integration

  Event Pattern Detection:
  // Analyze event patterns to predict issues
  export class PatternDetector {
    detectAnomalies(events: SystemEvent[]): Anomaly[] {
      // 1. Analyze event frequency
      const frequency = this.analyzeFrequency(events);

      // 2. Detect unusual patterns
      const anomalies = [];
      if (frequency.loopN < frequency.avg * 0.5) {
        anomalies.push({
          type: 'low_frequency',
          actor: 'Loop-N',
          severity: 'warning'
        });
      }

      return anomalies;
    }

    predictNextFailure(events: SystemEvent[]): Prediction {
      // ML model to predict when next error will occur
      // Based on historical error patterns
    }
  }

  Phase 4: Cross-System Intelligence

  Event Correlation:
  // Correlate events across multiple systems
  export class EventCorrelator {
    correlate(events: Event[]): CorrelationGraph {
      // Build graph of related events
      // Example: Spec created → Task assigned → Code generated → Build passed
      const graph = new Map();

      for (const event of events) {
        const related = this.findRelatedEvents(event);
        graph.set(event.event_id, related);
      }

      return graph;
    }
  }

  ---
  🎯 QUICK REFERENCE COMMANDS

  # ===== NAVIGATION =====
  cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

  # ===== COMPILATION =====
  npx tsc --noEmit                                    # Check errors
  npx tsc --noEmit 2>&1 | grep "auto-proactive"      # Focus on loops
  npm run build                                       # Full build

  # ===== DATABASE =====
  echo ".tables" | sqlite3 data/registry.db                              # List tables
  echo "SELECT * FROM current_system_status;" | sqlite3 data/registry.db # System status
  sqlite3 data/registry.db < src/database/migrations/022_*.sql           # Apply migration

  # ===== EVENT TESTING =====
  node scripts/write-event.cjs system '{"eventType":"test",...}'          # Write event
  echo "SELECT * FROM system_status_events LIMIT 5;" | sqlite3 data/registry.db  # Check events

  # ===== DEPLOYMENT =====
  ./scripts/deploy-central-mcp-to-vm.sh              # Backend (FIRST!)
  ./scripts/deploy-dashboard-to-vm.sh                # Dashboard (SECOND!)

  # ===== VM ACCESS =====
  gcloud compute ssh central-mcp-server --zone=us-central1-a
  sudo journalctl -u central-mcp -f                  # Backend logs
  pm2 logs nextjs-dashboard                          # Dashboard logs

  # ===== VERIFICATION =====
  curl http://136.112.123.243:3001/health            # Backend health
  curl http://136.112.123.243:3002/api/health        # Dashboard health

  ---
  ✅ FINAL CHECKLIST FOR ANY CENTRAL-MCP WORK

  Before making changes:
  - Read CLAUDE.md orientation
  - Read relevant auto-proactive loop file
  - Understand Universal Write System
  - Review recent documentation

  While making changes:
  - Import writeSystemEvent from '../api/universal-write.js'
  - Use this.executionCount (not this.loopCount)
  - Put custom data in metadata object
  - Use correct property names (activeTasks, activeAgents, NOT activeProjects)
  - Test compilation: npx tsc --noEmit

  After making changes:
  - Verify TypeScript compiles
  - Test event writing locally
  - Check database for events
  - Verify status aggregation updates
  - Update documentation
  - Deploy backend BEFORE dashboard

  ---
  🎉 YOU NOW HAVE COMPLETE KNOWLEDGE TO UNDERSTAND, EXPLORE, EDIT, BUILD, AND DEPLOY CENTRAL-MCP!

  Key Takeaways:
  1. 9 Auto-Proactive Loops = The intelligence engine
  2. Universal Write System = Everything writes structured events
  3. Database Triggers = Auto-capture critical changes
  4. Status Aggregation = Real-time system health
  5. Backend First = Always deploy backend before dashboard
  6. Read Before Edit = Understand before modifying
  7. ES Modules = Use .js extensions in imports
  8. Verification = Always test locally before deploying

  When in doubt: Read the code, check the database, follow the patterns.