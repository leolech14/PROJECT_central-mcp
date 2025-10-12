# 🎯 INTEGRATION TASK MASTER LIST - CENTRAL-MCP ACTIVATION

**Agent:** Agent B (Sonnet 4.5)
**Date:** 2025-10-11 23:20
**Purpose:** Wire 11 systems into living organism
**Status:** READY TO EXECUTE

---

## 📋 PHASE 1: DATABASE FOUNDATION (6 tasks)

### T-INT-001: Create 011_ai_models.sql migration
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** None
**Status:** NOT_STARTED

**Description:** Create database tables for AI model registry
- Table: `ai_models` (model definitions)
- Table: `ai_subscriptions` (API keys, budgets)
- Table: `ai_model_usage` (usage tracking)
- Indexes for performance
- Views for reporting

**Success Criteria:**
- [ ] All tables created with proper schema
- [ ] Foreign key constraints defined
- [ ] Indexes on frequently queried columns
- [ ] Views for common queries

---

### T-INT-002: Create 012_validation_tracking.sql migration
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** None
**Status:** NOT_STARTED

**Description:** Create database tables for validation tracking
- Table: `spec_validations` (validation results)
- Table: `spec_lifecycle_stages` (lifecycle tracking)
- Table: `totality_reports` (completeness reports)
- Table: `validation_layers` (4-layer results)

**Success Criteria:**
- [ ] All tables created
- [ ] Lifecycle stage enum properly defined
- [ ] Totality gap tracking schema complete
- [ ] Indexes for performance

---

### T-INT-003: Create 013_orchestration.sql migration
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** None
**Status:** NOT_STARTED

**Description:** Create database tables for orchestration
- Table: `agent_deployments` (VM agent deployments)
- Table: `curated_work_sets` (curated content)
- Table: `agent_workspaces` (workspace tracking)
- Table: `agent_heartbeats` (health monitoring)
- Table: `task_dependencies` (dependency graph)

**Success Criteria:**
- [ ] All tables created
- [ ] SSH connection info stored securely
- [ ] Heartbeat monitoring schema
- [ ] Work set → Git branch mapping

---

### T-INT-004: Apply all database migrations
**Priority:** P0-CRITICAL
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-001, T-INT-002, T-INT-003
**Status:** NOT_STARTED

**Description:** Apply all 4 migrations to database
```bash
sqlite3 data/registry.db < src/database/migrations/010_git_intelligence.sql
sqlite3 data/registry.db < src/database/migrations/011_ai_models.sql
sqlite3 data/registry.db < src/database/migrations/012_validation_tracking.sql
sqlite3 data/registry.db < src/database/migrations/013_orchestration.sql
```

**Success Criteria:**
- [ ] All migrations applied successfully
- [ ] No SQL errors
- [ ] Verify tables exist: `sqlite3 data/registry.db ".tables"`
- [ ] Verify schema: `sqlite3 data/registry.db ".schema git_commits"`

---

### T-INT-005: Verify database integrity
**Priority:** P1-HIGH
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-004
**Status:** NOT_STARTED

**Description:** Verify all tables created correctly
- Run SELECT queries on each new table
- Verify foreign key constraints
- Check indexes exist
- Test INSERT operations

**Success Criteria:**
- [ ] Can query all new tables
- [ ] Foreign keys enforce referential integrity
- [ ] Indexes improve query performance
- [ ] Can insert test data successfully

---

## 📋 PHASE 2: CORE SYSTEM INITIALIZATION (10 tasks)

### T-INT-006: Add all system imports to index.ts
**Priority:** P0-CRITICAL
**Estimated Time:** 20 minutes
**Dependencies:** None
**Status:** NOT_STARTED

**Description:** Import all 11 revolutionary systems
```typescript
// Git Intelligence
import { GitIntelligenceEngine } from './git/GitIntelligenceEngine.js';
import { AutoDeployer } from './deployment/AutoDeployer.js';

// AI Intelligence
import { ModelRegistry } from './ai/ModelRegistry.js';
import { LLMOrchestrator } from './ai/LLMOrchestrator.js';

// Validation
import { SpecFrontmatterParser } from './validation/SpecFrontmatterParser.js';
import { SpecLifecycleValidator } from './validation/SpecLifecycleValidator.js';
import { TotalityVerificationSystem } from './validation/TotalityVerificationSystem.js';

// Orchestration
import { AgentDeploymentOrchestrator } from './orchestration/AgentDeploymentOrchestrator.js';
import { CuratedContentManager } from './orchestration/CuratedContentManager.js';
import { IntelligentTaskGenerator } from './intelligence/IntelligentTaskGenerator.js';
```

**Success Criteria:**
- [ ] All imports added
- [ ] No TypeScript errors
- [ ] Paths correct (.js extensions)

---

### T-INT-007: Initialize LLMOrchestrator with subscriptions
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-006
**Status:** NOT_STARTED

**Description:** Create and configure LLM orchestrator
```typescript
const llmOrchestrator = new LLMOrchestrator(db);

// Register Anthropic (PRIMARY)
if (process.env.ANTHROPIC_API_KEY) {
  llmOrchestrator.registerSubscription({
    provider: 'anthropic',
    accountTier: 'pro',
    apiKey: process.env.ANTHROPIC_API_KEY,
    monthlyBudget: 2000
  });
}

// Register Google (1M context!)
if (process.env.GOOGLE_API_KEY) {
  llmOrchestrator.registerSubscription({
    provider: 'google',
    accountTier: 'free',
    apiKey: process.env.GOOGLE_API_KEY
  });
}

// Register Z.AI (free fallback)
if (process.env.ZAI_API_KEY) {
  llmOrchestrator.registerSubscription({
    provider: 'z.ai',
    accountTier: 'free',
    apiKey: process.env.ZAI_API_KEY
  });
}

// Register OpenAI (ChatGPT-5 Pro)
if (process.env.OPENAI_API_KEY) {
  llmOrchestrator.registerSubscription({
    provider: 'openai',
    accountTier: 'pro',
    apiKey: process.env.OPENAI_API_KEY,
    monthlyBudget: 1000
  });
}
```

**Success Criteria:**
- [ ] LLMOrchestrator initialized
- [ ] All available subscriptions registered
- [ ] Models enabled based on tier
- [ ] Can select optimal model

---

### T-INT-008: Initialize GitIntelligenceEngine
**Priority:** P0-CRITICAL
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-006
**Status:** NOT_STARTED

**Description:** Create Git intelligence instance
```typescript
const gitIntelligence = new GitIntelligenceEngine(process.cwd());
```

**Success Criteria:**
- [ ] GitIntelligenceEngine initialized
- [ ] Can parse conventional commits
- [ ] Can detect Git pushes
- [ ] Can calculate semantic versions

---

### T-INT-009: Initialize AutoDeployer
**Priority:** P0-CRITICAL
**Estimated Time:** 20 minutes
**Dependencies:** T-INT-006, T-INT-008
**Status:** NOT_STARTED

**Description:** Create deployment pipeline
```typescript
const autoDeployer = new AutoDeployer(process.cwd(), db);
```

**Success Criteria:**
- [ ] AutoDeployer initialized
- [ ] Can access Git repo
- [ ] Database connection working
- [ ] Ready to receive deployment events

---

### T-INT-010: Initialize SpecLifecycleValidator
**Priority:** P0-CRITICAL
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-006
**Status:** NOT_STARTED

**Description:** Create spec validator
```typescript
const specValidator = new SpecLifecycleValidator(process.cwd(), db);
```

**Success Criteria:**
- [ ] SpecLifecycleValidator initialized
- [ ] Can parse spec frontmatter
- [ ] Can validate 4 layers
- [ ] Database connection working

---

### T-INT-011: Initialize TotalityVerificationSystem
**Priority:** P0-CRITICAL
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-006
**Status:** NOT_STARTED

**Description:** Create totality verifier
```typescript
const totalityVerifier = new TotalityVerificationSystem(db);
```

**Success Criteria:**
- [ ] TotalityVerificationSystem initialized
- [ ] Can query all tables
- [ ] Can generate completeness reports
- [ ] Can detect gaps

---

### T-INT-012: Initialize AgentDeploymentOrchestrator
**Priority:** P1-HIGH
**Estimated Time:** 20 minutes
**Dependencies:** T-INT-006
**Status:** NOT_STARTED

**Description:** Create agent orchestrator
```typescript
const agentOrchestrator = new AgentDeploymentOrchestrator(db, {
  vmHost: process.env.VM_HOST || '34.41.115.199',
  vmUser: process.env.VM_USER || 'lech',
  vmKeyPath: process.env.VM_KEY_PATH
});
```

**Success Criteria:**
- [ ] AgentDeploymentOrchestrator initialized
- [ ] SSH config loaded
- [ ] Can connect to VM (test)
- [ ] Database connection working

---

### T-INT-013: Initialize CuratedContentManager
**Priority:** P1-HIGH
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-006
**Status:** NOT_STARTED

**Description:** Create content curator
```typescript
const curatedManager = new CuratedContentManager(process.cwd(), db);
```

**Success Criteria:**
- [ ] CuratedContentManager initialized
- [ ] Can access Git repo
- [ ] Can create curated branches
- [ ] Database connection working

---

### T-INT-014: Initialize IntelligentTaskGenerator
**Priority:** P0-CRITICAL
**Estimated Time:** 20 minutes
**Dependencies:** T-INT-006, T-INT-007
**Status:** NOT_STARTED

**Description:** Create task generator with LLM
```typescript
const taskGenerator = new IntelligentTaskGenerator(db, llmOrchestrator);
```

**Success Criteria:**
- [ ] IntelligentTaskGenerator initialized
- [ ] LLM orchestrator connected
- [ ] Can generate tasks from specs
- [ ] Can build dependency graphs

---

### T-INT-015: Test all system initializations
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-007 through T-INT-014
**Status:** NOT_STARTED

**Description:** Verify all systems initialized correctly
- Run index.ts
- Check logs for successful initialization
- Verify no errors
- Test basic operations on each system

**Success Criteria:**
- [ ] All systems initialize without errors
- [ ] Logs show all systems ready
- [ ] Database connections working
- [ ] LLM orchestrator can select models

---

## 📋 PHASE 3: AUTO-PROACTIVE ENGINE INTEGRATION (5 tasks)

### T-INT-016: Pass all systems to AutoProactiveEngine
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-015
**Status:** NOT_STARTED

**Description:** Update AutoProactiveEngine initialization
```typescript
const autoProactive = new AutoProactiveEngine(db, {
  // ... existing config ...
}, {
  // NEW: Pass all systems
  gitIntelligence,
  autoDeployer,
  llmOrchestrator,
  specValidator,
  totalityVerifier,
  agentOrchestrator,
  curatedManager,
  taskGenerator
});
```

**Success Criteria:**
- [ ] All systems passed to engine
- [ ] Engine can access all systems
- [ ] Loops can use systems
- [ ] No TypeScript errors

---

### T-INT-017: Register GitPushMonitor as Loop 9
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-016
**Status:** NOT_STARTED

**Description:** Add GitPushMonitor to auto-proactive loops
```typescript
// In AutoProactiveEngine.start()
if (this.config.enableLoop9) {
  const loop9 = new GitPushMonitor(
    this.db,
    this.eventBus,
    this.systems.gitIntelligence,
    this.systems.autoDeployer
  );
  await loop9.start();
  this.loops.set('loop9', loop9);
  logger.info('✅ Loop 9: Git Push Monitor - ACTIVE');
}
```

**Success Criteria:**
- [ ] GitPushMonitor registered
- [ ] Loop 9 starts successfully
- [ ] Can detect Git pushes
- [ ] Can trigger deployments

---

### T-INT-018: Update Loop 0 to use TotalityVerificationSystem
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-016
**Status:** NOT_STARTED

**Description:** Integrate totality checks into system status
```typescript
// In SystemStatusLoop.execute()
const totalityReport = await this.systems.totalityVerifier.generateTotalityReport();

if (totalityReport.gaps.length > 0) {
  logger.warn(`⚠️  TOTALITY GAPS: ${totalityReport.gaps.length}`);
  // Store gaps in database
}
```

**Success Criteria:**
- [ ] Loop 0 calls totality verifier
- [ ] Gaps detected and logged
- [ ] Reports stored in database
- [ ] Alerts on threshold breach

---

### T-INT-019: Update Loop 7 to use LLM + SpecValidator
**Priority:** P0-CRITICAL
**Estimated Time:** 45 minutes
**Dependencies:** T-INT-016
**Status:** NOT_STARTED

**Description:** Add AI-powered spec generation and validation
```typescript
// In SpecGenerationLoop.execute()

// 1. Use LLM to generate spec
const specContent = await this.systems.llmOrchestrator.complete({
  purpose: 'spec-generation',
  contextSize: insights.length,
  systemPrompt: '...',
  userPrompt: formatInsights(insights)
});

// 2. Save spec file
fs.writeFileSync(specPath, specContent);

// 3. Validate immediately
const validation = await this.systems.specValidator.validateComplete(specPath);

// 4. Store lifecycle stage
db.prepare(`UPDATE specs SET lifecycle_stage = ? WHERE id = ?`)
  .run(validation.lifecycleStage, specId);
```

**Success Criteria:**
- [ ] Loop 7 uses LLM for generation
- [ ] Specs validated after creation
- [ ] Lifecycle stages tracked
- [ ] Production-ready specs identified

---

### T-INT-020: Update Loop 8 to use IntelligentTaskGenerator
**Priority:** P0-CRITICAL
**Estimated Time:** 45 minutes
**Dependencies:** T-INT-016
**Status:** NOT_STARTED

**Description:** Use AI-powered task generation
```typescript
// In TaskAssignmentLoop.execute()

// Find specs ready for tasks
const specs = db.prepare(`
  SELECT * FROM specs
  WHERE lifecycle_stage = 'spec_complete'
  AND tasks_generated = 0
`).all();

for (const spec of specs) {
  // Generate intelligent tasks
  const tasks = await this.systems.taskGenerator.generateTasksFromSpec(
    spec.file_path,
    spec.project_id
  );

  // Insert tasks with dependencies
  for (const task of tasks) {
    insertTask(task);
  }

  // Mark spec as processed
  db.prepare(`UPDATE specs SET tasks_generated = 1 WHERE id = ?`)
    .run(spec.id);
}
```

**Success Criteria:**
- [ ] Loop 8 uses IntelligentTaskGenerator
- [ ] Tasks have proper dependencies
- [ ] Agents optimally assigned
- [ ] Test tasks auto-generated

---

## 📋 PHASE 4: MCP TOOLS (8 tasks)

### T-INT-021: Create deploy_vm_agent MCP tool
**Priority:** P1-HIGH
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-012
**Status:** NOT_STARTED

**Description:** Tool to deploy agents to VM
```typescript
{
  name: "deploy_vm_agent",
  description: "Deploy an agent to VM with curated content",
  inputSchema: {
    type: "object",
    properties: {
      agentId: { type: "string" },
      workSetId: { type: "string" },
      capabilities: { type: "array", items: { type: "string" } }
    }
  }
}
```

**Success Criteria:**
- [ ] Tool registered in MCP server
- [ ] Can deploy agents to VM
- [ ] Returns deployment ID
- [ ] Tracks in database

---

### T-INT-022: Create create_curated_work_set MCP tool
**Priority:** P1-HIGH
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-013
**Status:** NOT_STARTED

**Description:** Tool to create curated content for VM agents

**Success Criteria:**
- [ ] Tool registered
- [ ] Can create work sets
- [ ] Git branch created
- [ ] Files curated correctly

---

### T-INT-023: Create validate_spec MCP tool
**Priority:** P1-HIGH
**Estimated Time:** 20 minutes
**Dependencies:** T-INT-010
**Status:** NOT_STARTED

**Description:** Tool to run 4-layer validation on specs

**Success Criteria:**
- [ ] Tool registered
- [ ] Runs all 4 layers
- [ ] Returns validation results
- [ ] Stores in database

---

### T-INT-024: Create check_totality MCP tool
**Priority:** P1-HIGH
**Estimated Time:** 20 minutes
**Dependencies:** T-INT-011
**Status:** NOT_STARTED

**Description:** Tool to generate totality reports

**Success Criteria:**
- [ ] Tool registered
- [ ] Generates complete report
- [ ] Shows gaps
- [ ] Provides recommendations

---

### T-INT-025: Create trigger_deployment MCP tool
**Priority:** P1-HIGH
**Estimated Time:** 20 minutes
**Dependencies:** T-INT-009
**Status:** NOT_STARTED

**Description:** Tool to manually trigger deployments

**Success Criteria:**
- [ ] Tool registered
- [ ] Can trigger pipeline
- [ ] Returns deployment ID
- [ ] Tracks progress

---

### T-INT-026: Create check_git_pushes MCP tool
**Priority:** P2-MEDIUM
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-008
**Status:** NOT_STARTED

**Description:** Tool to view recent Git pushes

**Success Criteria:**
- [ ] Tool registered
- [ ] Lists recent pushes
- [ ] Shows versions
- [ ] Shows changelogs

---

### T-INT-027: Create get_deployment_status MCP tool
**Priority:** P2-MEDIUM
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-009
**Status:** NOT_STARTED

**Description:** Tool to check deployment pipeline status

**Success Criteria:**
- [ ] Tool registered
- [ ] Shows current phase
- [ ] Shows logs
- [ ] Shows health status

---

### T-INT-028: Create get_model_usage MCP tool
**Priority:** P2-MEDIUM
**Estimated Time:** 15 minutes
**Dependencies:** T-INT-007
**Status:** NOT_STARTED

**Description:** Tool to view AI model usage stats

**Success Criteria:**
- [ ] Tool registered
- [ ] Shows usage by model
- [ ] Shows costs
- [ ] Shows budget status

---

## 📋 PHASE 5: TESTING (5 tasks)

### T-INT-029: Test Git intelligence flow
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-017
**Status:** NOT_STARTED

**Description:** Test complete Git → Deploy flow
1. Create test commit with conventional format
2. Push to Git
3. Verify GitPushMonitor detects it
4. Verify version calculated
5. Verify deployment triggered

**Success Criteria:**
- [ ] Push detected within 60s
- [ ] Conventional commit parsed correctly
- [ ] Version bumped appropriately
- [ ] Deployment starts automatically

---

### T-INT-030: Test spec validation flow
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-019
**Status:** NOT_STARTED

**Description:** Test spec generation → validation
1. Create test insights
2. Generate spec via Loop 7
3. Verify spec validated
4. Check lifecycle stage

**Success Criteria:**
- [ ] Spec generated with LLM
- [ ] 4-layer validation runs
- [ ] Lifecycle stage stored
- [ ] Gaps identified

---

### T-INT-031: Test task generation flow
**Priority:** P0-CRITICAL
**Estimated Time:** 30 minutes
**Dependencies:** T-INT-020
**Status:** NOT_STARTED

**Description:** Test intelligent task generation
1. Create test spec with validation criteria
2. Run task generator
3. Verify tasks created with dependencies
4. Verify agents assigned

**Success Criteria:**
- [ ] Tasks generated from spec
- [ ] Dependencies correct
- [ ] Agents assigned optimally
- [ ] Test tasks included

---

### T-INT-032: Test totality verification
**Priority:** P1-HIGH
**Estimated Time:** 20 minutes
**Dependencies:** T-INT-018
**Status:** NOT_STARTED

**Description:** Test completeness checking
1. Create test data with gaps
2. Run totality verifier
3. Verify gaps detected
4. Verify recommendations generated

**Success Criteria:**
- [ ] All layers checked
- [ ] Gaps detected correctly
- [ ] Recommendations actionable
- [ ] Reports stored

---

### T-INT-033: END-TO-END INTEGRATION TEST
**Priority:** P0-CRITICAL
**Estimated Time:** 60 minutes
**Dependencies:** T-INT-029, T-INT-030, T-INT-031, T-INT-032
**Status:** NOT_STARTED

**Description:** Test complete flow: Message → Production
1. User message: "Build a todo app"
2. Verify spec generated with LLM
3. Verify spec validated
4. Verify tasks created with dependencies
5. Verify agent deployment (if possible)
6. Verify Git push detected
7. Verify deployment triggered
8. Verify totality check passes

**Success Criteria:**
- [ ] Complete flow works end-to-end
- [ ] All systems integrate correctly
- [ ] No errors in logs
- [ ] Production-ready result

---

## 📊 SUMMARY

**Total Tasks:** 33
**Estimated Time:** 12 hours

**Phase Breakdown:**
- Phase 1 (Database): 6 tasks, 2.5 hours
- Phase 2 (Initialization): 10 tasks, 3.5 hours
- Phase 3 (Engine Integration): 5 tasks, 3 hours
- Phase 4 (MCP Tools): 8 tasks, 2.5 hours
- Phase 5 (Testing): 5 tasks, 2.5 hours

**Critical Path:** T-INT-001 → T-INT-004 → T-INT-007 → T-INT-016 → T-INT-019 → T-INT-033

---

🎯 **THIS IS THE COMPLETE ROADMAP TO ACTIVATION!**

Every task is:
- ✅ Clearly defined
- ✅ Time estimated
- ✅ Dependencies mapped
- ✅ Success criteria listed

**READY TO EXECUTE!** 🚀
