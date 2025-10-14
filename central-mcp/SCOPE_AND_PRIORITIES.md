# 🎯 SCOPE AND PRIORITIES - Complete Project Breakdown

**Date**: October 10, 2025
**Purpose**: Clear DoD, Success Criteria, and Concern Separation for ALL Projects

---

## 📊 PROJECT 1: CENTRAL-MCP

### 🎯 Core Identity
**Universal MCP coordination hub** running on GCP VM (34.41.115.199) that coordinates agents across ANY framework.

### 📍 Location
`/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/`

### ✅ What's Actually Built (REALITY)
- **GCP VM**: e2-micro (us-central1-a) - ✅ Always Free eligible
- **MCP Server**: `ws://34.41.115.199:3000/mcp` - ✅ Working
- **A2A Server**: `ws://34.41.115.199:3000/a2a` - ✅ Deployed Oct 9-10, 2025
- **VM Tools**: executeBash, readVMFile, writeVMFile, listVMDirectory - ✅ Working
- **Health Endpoint**: `http://34.41.115.199:3000/health` - ✅ Working
- **SQLite Database**: Agent registry + task coordination - ✅ Working
- **Authentication**: JWT + API Keys - ✅ Working
- **Secrets Management**: Doppler - ✅ Working
- **Service Management**: systemd - ✅ Working

### 🎯 Definition of Done (DoD)
Central-MCP is considered **COMPLETE** when:
- [ ] ✅ **Free tier verified** - e2-micro Always Free status confirmed (DONE: $0/month verified)
- [ ] **Core stability** - 7 days continuous uptime without crashes
- [ ] **Health monitoring** - 30s health checks passing consistently for 7 days
- [ ] **Documentation complete** - README, deployment guide, troubleshooting guide exist
- [ ] **Agent coordination** - Successfully coordinates 2+ agents across different frameworks
- [ ] **Zero critical bugs** - No P0/P1 bugs for 1 week
- [ ] **Performance validated** - < 100ms message routing latency (p95)

### 🏆 Success Criteria
Central-MCP is considered **SUCCESSFUL** when:
- [ ] **99% uptime** - For 1 week continuous
- [ ] **< 100ms latency** - Message routing p95
- [ ] **10+ concurrent agents** - Successfully handles load
- [ ] **Cost ≤ $0/month** - Stays within Always Free tier
- [ ] **Zero security incidents** - No unauthorized access or breaches
- [ ] **Multi-framework** - At least 2 different frameworks coordinating (e.g., Google ADK + MCP)

### 📦 Technology Stack
- **Runtime**: Node.js 20+ on GCP VM
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Protocols**: MCP, A2A (WebSocket)
- **Auth**: JWT + API Keys
- **Secrets**: Doppler
- **Deployment**: systemd service

### ✅ What's IN Scope for Central-MCP
**Core Functionality:**
- MCP protocol support (Claude agents)
- A2A protocol support (cross-framework agents)
- VM terminal access (GCP VM)
- Agent registry and coordination
- Task routing and tracking
- Basic health monitoring
- JWT authentication
- SQLite task database

**Minimal Required Features:**
- Health endpoint working
- Message routing functional
- Agent registration working
- Basic documentation exists
- Free tier cost maintained

### ❌ What's OUT of Scope for Central-MCP
**Not part of core system:**
- RunPod GPU integration (separate concern - P2 priority)
- Internal tools consolidation (separate project decision)
- Advanced CI/CD pipelines (overkill for now)
- Cost tracking dashboard (verify costs first, then decide)
- Multi-cloud orchestration beyond basic routing
- Advanced monitoring (New Relic, Datadog, etc.)
- Testing infrastructure (comprehensive test suites)
- Documentation generation automation
- Performance benchmarking suite
- Security hardening beyond JWT/API keys

### 🚨 Central-MCP Concerns (Only Affecting This Project)
**P0 - Critical (Blocking DoD):**
1. ✅ **GCP Free Tier Verification** - DONE: e2-micro IS Always Free
2. **Core Stability Validation** - Need 7 days uptime proof
3. **Health Monitoring Working** - Need 7 days of consistent health checks

**P1 - High (Required for Success Criteria):**
1. **Documentation Completion** - README, deployment, troubleshooting
2. **Agent Coordination Proof** - Need 2+ agents coordinating successfully
3. **Performance Validation** - Need < 100ms latency measurements

**P2 - Medium (Nice to Have, Not Blocking):**
1. **RunPod GPU Integration** - Separate spec exists, not implemented
2. **Cost Tracking** - Manual checking sufficient for now
3. **Basic Monitoring Dashboard** - Health endpoint sufficient for now

**P3 - Low (Future Enhancements):**
1. **Advanced CI/CD** - Manual deployment working fine
2. **Testing Infrastructure** - Manual testing sufficient for now
3. **Advanced Monitoring** - Overkill for current scale

### 📋 Central-MCP Next Actions
**This Week:**
1. Monitor uptime for 7 days (started Oct 9, 2025)
2. Verify health checks passing consistently
3. Complete basic documentation (README, deployment guide)
4. Test coordination with 2+ agents
5. Measure message routing latency

**Next Week:**
1. Validate all DoD criteria met
2. Validate all Success Criteria met
3. If all pass → **DECLARE CENTRAL-MCP COMPLETE**
4. Move to maintenance mode

---

## 📊 PROJECT 2: LOCALBRAIN + ORCHESTRA BLUE

### 🎯 Core Identity
**Revolutionary AI-powered development environment** implementing spec-first development with UI prototyping refinement.

**"Orchestra Blue"** = UI/UX brand name for LocalBrain's interface

### 📍 Location
`/Users/lech/PROJECTS_all/LocalBrain/`

### ✅ What's Actually Built
**Core Applications:**
- **Swift App**: macOS production interface (`01_CODEBASES/LocalBrain/`)
- **Next.js Prototype**: UI laboratory with hot reload (`01_CODEBASES/localbrain-electron/`)
- **Widget System**: Extensible architecture (`01_CODEBASES/orchestra-widget-system/`)
- **Design System**: OKLCH color system + accessibility (`01_CODEBASES/design/`)
- **MCP Task Registry**: 6-agent coordination server (`01_CODEBASES/mcp-servers/localbrain-task-registry/`)
  - **NOTE**: This is SEPARATE from Central-MCP's registry!

**Agent System:**
- **6 hyper-specialized agents**:
  - Agent A: UI Velocity (GLM-4.6, 200K context)
  - Agent B: Design System (Sonnet-4.5, 200K context)
  - Agent C: Backend Services (GLM-4.6, 200K context)
  - Agent D: Integration (Sonnet-4.5, 200K context)
  - Agent E: Coherence/Librarian (Gemini-2.5-Pro, 1M context)
  - Agent F: Strategic Supervisor (ChatGPT-5)

### 🎯 Definition of Done (DoD)
LocalBrain is considered **COMPLETE** when:
- [ ] **Agent Communication Panel** - P1-Critical - Interface for agent coordination
- [ ] **Security & Permissions** - P1-Critical - Authentication framework implemented
- [ ] **Search Functionality** - P2-High - Users can find information
- [ ] **Module Navigation** - P2-High - Fixed navigation difficulties
- [ ] **6-Agent Coordination** - All agents coordinating successfully
- [ ] **Swift ↔ Next.js Alignment** - Production app matches prototype
- [ ] **Spec-First Workflow** - Complete spec base drives all development

### 🏆 Success Criteria
LocalBrain is considered **SUCCESSFUL** when:
- [ ] **All P1-Critical gaps resolved** - Agent panel + Security working
- [ ] **6-agent coordination smooth** - No coordination issues
- [ ] **Spec-first validated** - Workflow proven effective
- [ ] **UI prototyping → production seamless** - Next.js patterns work in Swift
- [ ] **> 30% compliance** - Currently at 30%, need significant improvement

### 📦 Technology Stack
- **macOS App**: Swift + SwiftUI
- **Prototype**: Next.js 15 + React
- **Agent Coordination**: MCP Task Registry (separate from Central-MCP)
- **Design System**: OKLCH colors + WCAG 2.2 AA accessibility
- **AI Models**: GLM-4.6, Sonnet-4.5, Gemini-2.5-Pro, ChatGPT-5

### 🔗 Relationship to Central-MCP
**Potential Integration (Not Currently Implemented):**
- LocalBrain's MCP Task Registry **could** connect TO Central-MCP as a client
- LocalBrain agents **could** register with Central-MCP for cross-framework coordination
- Central-MCP **could** route messages to LocalBrain agents

**Current Reality:**
- They are SEPARATE projects with SEPARATE codebases
- LocalBrain has its OWN agent coordination system
- No integration exists yet

### 🚨 LocalBrain Concerns (Only Affecting This Project)
**P1 - Critical (Blocking DoD):**
1. **Agent Communication Panel** - No interface for coordination
2. **Security & Permissions Framework** - No authentication system

**P2 - High (Required for Success):**
1. **Search Functionality** - Users cannot find information
2. **Module Navigation Logic** - Navigation difficulties

**P3 - Medium (Enhancement):**
1. **6-Agent Coordination Optimization** - Currently working but can improve
2. **Spec-First Workflow Refinement** - Workflow exists but needs validation

### 📋 LocalBrain Next Actions
**This Week:**
1. Implement Agent Communication Panel (P1-Critical)
2. Implement Security & Permissions (P1-Critical)

**Next Week:**
1. Implement Search Functionality (P2-High)
2. Fix Module Navigation Logic (P2-High)
3. Validate 6-agent coordination working smoothly

---

## 📊 PROJECT 3: ORCHESTRA (??)

### ⚠️ NEED CLARIFICATION FROM LECH

### 📍 Possible Location
`/Users/lech/PROJECTS_all/PROJECT_orchestra/` (?)

### ❓ Questions to Answer
1. **Is Orchestra.blue the same as LocalBrain's UI brand?**
   - From LocalBrain/CLAUDE.md: "Orchestra Blue" = UI/UX brand name for LocalBrain
   - This suggests Orchestra.blue IS LocalBrain, not a separate project

2. **Or is PROJECT_orchestra a separate financial project?**
   - CHATGPT5_ANALYSIS_BRIEFING.md mentions `0300_ORCHESTRA_FINANCIAL.md`
   - This suggests Orchestra might be a separate financial application

3. **What's the relationship between the two?**
   - Need to clarify if they're the same or different

4. **What's the current status of PROJECT_orchestra?**
   - Is it active?
   - What's built?
   - What's the DoD?

### 🚨 Cannot Define DoD/Success Criteria Until Clarified

---

## 📊 PROJECT 4: ORCHESTRATOR (??)

### ⚠️ NEED CLARIFICATION FROM LECH

### 📍 Possible Location
`/Users/lech/PROJECTS_all/PROJECT_orchestrator/` (?)

### ❓ Questions to Answer
1. **What is PROJECT_orchestrator?**
   - Different from Orchestra?
   - Sounds like a coordination tool

2. **Is it related to agent coordination?**
   - Central-MCP does agent coordination
   - Is this a duplicate or different?

3. **Is it active or deprecated?**
   - Need current status

4. **How does it relate to Central-MCP?**
   - Competing functionality?
   - Complementary?

### 🚨 Cannot Define DoD/Success Criteria Until Clarified

---

## 🗺️ PROJECT RELATIONSHIPS MAP

### Current Understanding
```
┌──────────────────────────────────────────────┐
│           CENTRAL-MCP (GCP VM)               │
│   Universal agent coordination hub           │
│   - MCP + A2A protocols                      │
│   - VM terminal access                       │
│   - Framework-agnostic routing               │
│   - SQLite task registry                     │
│   STATUS: ✅ Deployed, needs 7-day validation│
└────────────┬─────────────────────────────────┘
             │
             │ (potential future integration)
             │
             ▼
┌──────────────────────────────────────────────┐
│      LOCALBRAIN + Orchestra Blue             │
│   AI dev environment + UI brand              │
│   - macOS Swift app                          │
│   - Next.js prototype                        │
│   - 6-agent coordination (internal)          │
│   - OWN MCP Task Registry (separate!)        │
│   STATUS: 🟡 30% compliance, P1 gaps         │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│         PROJECT_orchestra (?)                │
│   Financial app? Or same as Orchestra Blue?  │
│   STATUS: ❓ NEED CLARIFICATION               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│         PROJECT_orchestrator (?)             │
│   Coordination tool? Agent orchestration?    │
│   STATUS: ❓ NEED CLARIFICATION               │
└──────────────────────────────────────────────┘
```

---

## 📊 CONCERNS SEPARATED BY PROJECT

### ✅ Central-MCP Concerns ONLY
**Things that affect ONLY Central-MCP core functionality:**

**P0 - Critical:**
- ✅ GCP Free Tier Verification (DONE: $0/month confirmed)
- Core stability validation (7 days uptime needed)
- Health monitoring consistency (7 days checks needed)

**P1 - High:**
- Documentation completion (README, guides)
- Agent coordination proof (2+ agents)
- Performance validation (< 100ms latency)

**P2 - Medium:**
- Basic monitoring dashboard (optional)
- Cost tracking (manual sufficient)

**P3 - Low:**
- Advanced CI/CD (overkill)
- Testing infrastructure (manual sufficient)
- Advanced monitoring (overkill)

### ✅ LocalBrain Concerns ONLY
**Things that affect ONLY LocalBrain functionality:**

**P1 - Critical:**
- Agent Communication Panel implementation
- Security & Permissions framework

**P2 - High:**
- Search functionality implementation
- Module navigation logic fixes

**P3 - Medium:**
- 6-agent coordination optimization
- Spec-first workflow validation

### 🔄 Cross-Project Concerns
**Things that affect MULTIPLE projects:**

**P2 - Medium:**
- **SPECBASE Schema Enforcement** (affects all projects using specs)
  - Central-MCP specs should follow UNIVERSAL_SCHEMA
  - LocalBrain specs should follow UNIVERSAL_SCHEMA
  - Any other projects with specs should follow schema

- **Internal Tools Consolidation** (separate project decision)
  - Central-MCP **could** be the registry for tools
  - LocalBrain tools **could** register with Central-MCP
  - This is a strategic decision, not a technical requirement

- **Cross-Project Agent Coordination** (future integration)
  - LocalBrain agents **could** connect to Central-MCP
  - This enables cross-framework coordination
  - Not blocking either project's DoD

### ❌ Concerns That Are NOT Part of Any Project
**Things mentioned in discussion but NOT implemented:**

**NOT PLANNED:**
- RunPod GPU Integration (separate concern, P2 priority for future)
- Advanced CI/CD pipelines (overkill for current scale)
- Multi-cloud orchestration (beyond basic routing)
- Cost tracking dashboards (manual sufficient)
- Advanced monitoring (New Relic, Datadog - overkill)
- Security hardening beyond JWT/API keys
- Testing infrastructure beyond manual testing
- Performance benchmarking suites
- Documentation generation automation

---

## 🎯 PRIORITY MATRIX

### P0 - Critical (Do NOW, Blocking Everything)
1. ✅ Central-MCP: GCP Free Tier Verification (DONE)

### P1 - High (Do This Week, Blocking DoD)
1. Central-MCP: Core stability validation (7 days uptime)
2. Central-MCP: Health monitoring consistency (7 days checks)
3. Central-MCP: Documentation completion
4. Central-MCP: Agent coordination proof
5. Central-MCP: Performance validation
6. LocalBrain: Agent Communication Panel
7. LocalBrain: Security & Permissions

### P2 - Medium (Do Next Week, Required for Success)
1. LocalBrain: Search functionality
2. LocalBrain: Module navigation fixes
3. SPECBASE schema enforcement (cross-project)

### P3 - Low (Future Enhancements)
1. Internal tools consolidation (strategic decision needed)
2. Cross-project agent coordination (after DoD met)
3. LocalBrain: 6-agent coordination optimization

### P4 - Not Priority (Deferred or Out of Scope)
- RunPod GPU integration (has spec, not implemented)
- Advanced CI/CD (overkill)
- Advanced monitoring (overkill)
- Testing infrastructure (manual sufficient)
- Cost tracking dashboard (manual sufficient)

---

## ✅ IMMEDIATE ACTIONS (THIS WEEK)

### For Central-MCP
1. ✅ **GCP Free Tier Verified** - DONE: $0/month confirmed
2. **Monitor Uptime** - Track 7 days continuous (started Oct 9, 2025)
3. **Monitor Health Checks** - Verify 30s checks passing consistently
4. **Complete Documentation** - README, deployment guide, troubleshooting
5. **Test Agent Coordination** - Coordinate 2+ agents (Google ADK + MCP)
6. **Measure Latency** - Validate < 100ms message routing (p95)

### For LocalBrain
*Separate work session - not blocking Central-MCP*
1. Implement Agent Communication Panel (P1-Critical)
2. Implement Security & Permissions (P1-Critical)

### Cross-Project
1. **Clarify Orchestra/Orchestrator** - Get Lech's input on project status
2. **SPECBASE Migration** - Ensure all specs follow UNIVERSAL_SCHEMA

---

## 🚨 CLARIFICATION NEEDED FROM LECH

### Critical Questions
1. **Orchestra vs Orchestra.blue:**
   - Is Orchestra.blue just LocalBrain's UI brand name?
   - Or is PROJECT_orchestra a separate financial application?
   - What's the relationship?

2. **Orchestrator:**
   - What is PROJECT_orchestrator?
   - Is it related to Central-MCP agent coordination?
   - Is it active or deprecated?

3. **Central-MCP Scope:**
   - Should we keep it simple (just MCP + A2A + VM tools)?
   - Or add RunPod integration (has spec, not implemented)?
   - Or add internal tools consolidation?
   - What's the final scope vision?

4. **Internal Tools Consolidation:**
   - Is this a separate project?
   - Or part of Central-MCP?
   - What's the priority?

---

## 🎯 WHEN IS CENTRAL-MCP "DONE"?

### Clear Completion Criteria
Central-MCP is considered **COMPLETE AND PRODUCTION-READY** when:

**ALL of these criteria are met:**
- ✅ Free tier verified ($0/month) - DONE
- [ ] 7 days continuous uptime without crashes
- [ ] Health checks passing consistently for 7 days
- [ ] Documentation complete (README, deployment, troubleshooting)
- [ ] Successfully coordinates 2+ agents across frameworks
- [ ] Zero P0/P1 bugs for 1 week
- [ ] < 100ms message routing latency (p95) validated

**Then:**
- **Declare COMPLETE** ✅
- Move to maintenance mode
- Monitor for issues
- Future enhancements (RunPod, tools consolidation) are SEPARATE projects

---

## 🎯 WHEN IS LOCALBRAIN "DONE"?

### Clear Completion Criteria
LocalBrain is considered **COMPLETE AND PRODUCTION-READY** when:

**ALL of these criteria are met:**
- [ ] Agent Communication Panel implemented (P1-Critical)
- [ ] Security & Permissions implemented (P1-Critical)
- [ ] Search functionality working (P2-High)
- [ ] Module navigation fixed (P2-High)
- [ ] All 6 agents coordinating smoothly
- [ ] Swift app matches Next.js prototype
- [ ] Spec-first workflow validated

**Then:**
- **Declare COMPLETE** ✅
- Move to maintenance mode
- Future enhancements are SEPARATE projects

---

## 📋 DECISION TREE FOR NEXT STEPS

```
1. Is Central-MCP core working?
   └─ YES → ✅ Monitor for 7 days → Validate DoD → COMPLETE

2. Is it free tier?
   └─ YES → ✅ VERIFIED ($0/month)

3. Are LocalBrain and Orchestra.blue the same thing?
   └─ NEED CLARIFICATION from Lech

4. What is PROJECT_orchestrator?
   └─ NEED CLARIFICATION from Lech

5. Should Central-MCP add more features?
   └─ RunPod integration? → Has spec, P2 priority, not blocking DoD
   └─ Tools consolidation? → Strategic decision needed
   └─ Keep it simple? → YES for now, validate DoD first

6. Which concerns are REAL priorities?
   └─ P0/P1 concerns → Do NOW
   └─ P2 concerns → Do after DoD met
   └─ P3 concerns → Future enhancements
   └─ P4 concerns → Deferred or out of scope
```

---

## 🎯 FINAL STATUS

### Central-MCP
**Status**: 🟡 **DEPLOYED, NEEDS VALIDATION**
- Core functionality: ✅ Working
- Free tier: ✅ Verified ($0/month)
- DoD criteria: 🔄 In progress (monitoring for 7 days)
- Success criteria: ⏳ Pending validation

**Next Action**: Monitor for 7 days, complete documentation, validate DoD

### LocalBrain
**Status**: 🟡 **30% COMPLIANCE, P1 GAPS**
- Core functionality: ✅ Working
- Critical gaps: ❌ Agent panel, security framework
- DoD criteria: 🔄 In progress (P1 items needed)
- Success criteria: ⏳ Pending P1 completion

**Next Action**: Implement Agent Communication Panel + Security Framework

### Orchestra
**Status**: ❓ **NEED CLARIFICATION**
**Next Action**: Get Lech's input on project identity

### Orchestrator
**Status**: ❓ **NEED CLARIFICATION**
**Next Action**: Get Lech's input on project identity

---

**PRIORITY**: Validate Central-MCP DoD this week, clarify Orchestra/Orchestrator, then proceed with LocalBrain P1 items.
