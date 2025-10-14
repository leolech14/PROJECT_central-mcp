# 📊 COMPLETE PROJECTS INVENTORY - Crystal Clear Separation

**Date**: October 10, 2025
**Purpose**: Define EXACTLY what each project is and their relationships

---

## 🎯 PROJECT 1: CENTRAL-MCP (This Project)

### Location
`/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/`

### What It Is
**Universal MCP coordination hub** running on GCP VM that coordinates agents across ANY framework (Google ADK, LangGraph, Crew.ai, MCP, custom).

### Core Purpose
Be the **central coordination point** for ALL agents, regardless of framework, providing:
- Agent2Agent (A2A) protocol support
- VM terminal access for agents
- Task coordination across frameworks
- Cross-framework message routing

### What's Working NOW
- ✅ **GCP VM**: 34.41.115.199 (e2-micro, us-central1-a)
- ✅ **MCP Server**: `ws://34.41.115.199:3000/mcp`
- ✅ **A2A Server**: `ws://34.41.115.199:3000/a2a` (just deployed)
- ✅ **VM Tools**: executeBash, readVMFile, writeVMFile, listVMDirectory
- ✅ **Health Endpoint**: `http://34.41.115.199:3000/health`
- ✅ **SQLite Database**: Agent registry + task coordination

### Technology Stack
- **Runtime**: Node.js 20+ on GCP VM
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Protocols**: MCP, A2A (WebSocket)
- **Auth**: JWT + API Keys
- **Secrets**: Doppler

### Cost Status
**⚠️ NEED TO VERIFY GCP FREE TIER:**
- Machine: e2-micro (2 vCPU, 1GB RAM)
- Region: us-central1-a
- Status: RUNNING since Oct 9, 2025
- Estimated: ~$6-8/month (if not free tier)
- **Action Required**: Verify if truly "Always Free" eligible

### DoD (Definition of Done)
- [ ] Free tier status verified and confirmed
- [ ] Core MCP + A2A functionality stable (7 days uptime)
- [ ] Health monitoring working (30s polls)
- [ ] Basic documentation complete
- [ ] Successfully coordinates 2+ agents
- [ ] No critical bugs for 1 week

### Success Criteria
- [ ] 99% uptime for 1 week
- [ ] < 100ms message routing latency (p95)
- [ ] Successfully handles 10+ concurrent agent connections
- [ ] Costs ≤ $10/month (prefer $0 if free tier)
- [ ] Zero security incidents

### What's NOT Part of Central-MCP
- ❌ RunPod GPU integration (just a concern, not built)
- ❌ Internal tools consolidation (separate future project)
- ❌ Advanced CI/CD (overkill for now)
- ❌ Multi-cloud orchestration beyond basic routing
- ❌ Cost tracking dashboard (verify costs first)

---

## 🎯 PROJECT 2: LOCALBRAIN + ORCHESTRA BLUE

### Location
`/Users/lech/PROJECTS_all/LocalBrain/`

### What It Is
**Revolutionary AI-powered development environment** implementing spec-first development with UI prototyping refinement.

**"Orchestra Blue"** = UI/UX brand name for LocalBrain's interface

### Core Components
1. **Swift App**: macOS production interface
   - Location: `LocalBrain/01_CODEBASES/LocalBrain/`
   - Purpose: Native macOS application

2. **Next.js Prototype**: UI laboratory with hot reload
   - Location: `LocalBrain/01_CODEBASES/localbrain-electron/`
   - Purpose: Rapid UI prototyping

3. **Widget System**: Extensible architecture
   - Location: `LocalBrain/01_CODEBASES/orchestra-widget-system/`

4. **Design System**: OKLCH color system + accessibility
   - Location: `LocalBrain/01_CODEBASES/design/`

5. **MCP Task Registry**: 6-agent coordination server
   - Location: `LocalBrain/01_CODEBASES/mcp-servers/localbrain-task-registry/`
   - **NOTE**: This is SEPARATE from Central-MCP's registry!

### Agent System
**6 hyper-specialized agents:**
- Agent A: UI Velocity (GLM-4.6)
- Agent B: Design System (Sonnet-4.5)
- Agent C: Backend Services (GLM-4.6)
- Agent D: Integration (Sonnet-4.5)
- Agent E: Coherence/Librarian (Gemini-2.5-Pro, 1M context)
- Agent F: Strategic Supervisor (ChatGPT-5)

### Current Status
**30% Compliance** with critical gaps:
- ❌ Agent Communication Panel (P1-Critical)
- ❌ Security & Permissions (P1-Critical)
- 🟡 Search Functionality (P2-High)
- 🟡 Module Navigation Logic (P2-High)

### Relationship to Central-MCP
**LocalBrain's MCP Task Registry** could potentially:
- Connect TO Central-MCP as a client
- Use Central-MCP for cross-framework agent coordination
- Register agents with Central-MCP

**BUT**: They are SEPARATE projects with separate codebases!

### DoD (Definition of Done)
- [ ] Agent Communication Panel implemented
- [ ] Security & Permissions framework working
- [ ] Search functionality operational
- [ ] Module navigation fixed
- [ ] All 6 agents coordinating successfully
- [ ] Swift app + Next.js prototype aligned

### Success Criteria
- [ ] All critical gaps (P1) resolved
- [ ] 6-agent coordination working smoothly
- [ ] Spec-first workflow validated
- [ ] UI prototyping → production flow seamless

---

## 🎯 PROJECT 3: ORCHESTRA (Financial?)

### Location
`/Users/lech/PROJECTS_all/PROJECT_orchestra/`

### What It Is
**⚠️ NEED CLARIFICATION**

From the specs, there's a reference to:
- `0300_ORCHESTRA_FINANCIAL.md` in Central-MCP specbase
- This suggests Orchestra is a **financial application**?

### Questions to Answer
- [ ] Is Orchestra.blue the same as LocalBrain's UI?
- [ ] Or is PROJECT_orchestra a separate financial project?
- [ ] What's the relationship between the two?
- [ ] What's the current status?

### Possible Interpretation
**Orchestra.blue** = Brand/UI name for LocalBrain
**PROJECT_orchestra** = Separate financial application project?

**Need Lech to clarify this!**

---

## 🎯 PROJECT 4: ORCHESTRATOR

### Location
`/Users/lech/PROJECTS_all/PROJECT_orchestrator/`

### What It Is
**⚠️ NEED CLARIFICATION**

Different from Orchestra? Orchestrator sounds like a coordination tool.

### Questions to Answer
- [ ] What does PROJECT_orchestrator do?
- [ ] Is it related to agent coordination?
- [ ] Is it active or deprecated?
- [ ] How does it relate to Central-MCP?

---

## 📊 PROJECT RELATIONSHIPS

### Clear Separations

```
┌─────────────────────────────────────────────┐
│          CENTRAL-MCP                        │
│  (Universal agent coordination hub)         │
│  - Runs on GCP VM                           │
│  - A2A + MCP protocols                      │
│  - Framework-agnostic                       │
└────────────┬────────────────────────────────┘
             │ (could connect as client)
             ▼
┌─────────────────────────────────────────────┐
│          LOCALBRAIN + Orchestra Blue        │
│  (AI dev environment + UI brand)            │
│  - macOS Swift app                          │
│  - 6-agent coordination (internal)          │
│  - Has OWN MCP Task Registry                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          PROJECT_orchestra                  │
│  (Financial app? Need clarification)        │
│  - ???                                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          PROJECT_orchestrator               │
│  (Coordination tool? Need clarification)    │
│  - ???                                      │
└─────────────────────────────────────────────┘
```

### Key Insight
**Central-MCP and LocalBrain are SEPARATE projects!**
- Different codebases
- Different purposes
- Different agent systems
- Can integrate but are independent

---

## 🚨 CONCERNS BY PROJECT

### Central-MCP Concerns
**Things that affect ONLY Central-MCP:**
1. ✅ **GCP Free Tier Verification** (P0 - CRITICAL)
2. ✅ **Core Stability** (P0 - uptime, reliability)
3. ✅ **Basic Monitoring** (P1 - health checks)
4. ✅ **Documentation** (P1 - what exists)
5. 🔄 **RunPod GPU Integration** (P2 - future concern)
6. 🔄 **Cost Tracking** (P2 - after verifying costs)
7. 🔄 **Advanced Monitoring** (P3 - nice to have)

### LocalBrain Concerns
**Things that affect ONLY LocalBrain:**
1. ✅ **Agent Communication Panel** (P1-Critical)
2. ✅ **Security & Permissions** (P1-Critical)
3. ✅ **Search Functionality** (P2-High)
4. ✅ **Module Navigation** (P2-High)
5. 🔄 **6-agent coordination** (ongoing)
6. 🔄 **Spec-first workflow** (ongoing)

### Shared/Cross-Project Concerns
**Things that affect MULTIPLE projects:**
1. 🔄 **SPECBASE Schema** (affects all projects using specs)
2. 🔄 **Internal Tools Consolidation** (Central-MCP could be registry)
3. 🔄 **Cross-project agent coordination** (LocalBrain agents → Central-MCP)

---

## ✅ IMMEDIATE ACTIONS

### For Central-MCP (This Session)
1. ⚡ **VERIFY GCP FREE TIER** (P0-Critical)
   ```bash
   # Check free tier eligibility
   # Verify actual costs
   # Document findings
   ```

2. 📝 **Document Current State** (P0)
   - What's actually working
   - What's the minimal DoD
   - What's the success criteria

3. 🎯 **Define Scope** (P0)
   - What IS Central-MCP
   - What is NOT Central-MCP
   - Cut unnecessary concerns

### For LocalBrain (Separate Session)
- Continue work on P1-Critical items
- Agent Communication Panel
- Security & Permissions

### For Orchestra/Orchestrator (Need Clarification)
- [ ] **Get clarification from Lech**
- [ ] What are these projects?
- [ ] Are they active?
- [ ] How do they relate to Central-MCP?

---

## 🎯 NEXT DECISION

**FOR LECH TO CLARIFY:**

1. **Orchestra vs Orchestra.blue**:
   - Is Orchestra.blue just LocalBrain's UI brand?
   - Or is PROJECT_orchestra a separate financial app?

2. **Orchestrator**:
   - What is PROJECT_orchestrator?
   - Is it related to Central-MCP?
   - Is it active or deprecated?

3. **Central-MCP Scope**:
   - Should we keep it simple (just MCP + A2A)?
   - Or add RunPod, tools consolidation, etc.?

4. **GCP Free Tier**:
   - Can we confirm it's truly free tier forever?
   - If not, what's acceptable monthly cost?

---

**STATUS**: 🟡 CLARIFICATION NEEDED
**NEXT**: Verify GCP free tier + Get Lech's input on Orchestra/Orchestrator
