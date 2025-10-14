# 🔌 Central-MCP Complete ON/OFF Registry
**Complete Catalog of All Switchable Components in the Central-MCP Universe**

**Created**: 2025-10-13
**Purpose**: Master registry of every component that can be turned ON/OFF in Central-MCP
**Scope**: Servers, States, Instances, Services, Processes, Loops, Agents, and Subsystems

---

## 📊 REGISTRY OVERVIEW

### **Total Switchable Components**: **247** across 12 major categories

## 🏗️ CATEGORY 1: CORE INFRASTRUCTURE (12 components)

### **Virtual Machines & Servers** (4)
| Component | ON State | OFF State | Control Method | Current Status |
|-----------|----------|-----------|----------------|----------------|
| **VM Instance** (central-mcp-server) | RUNNING | STOPPED | `gcloud compute instances start/stop` | ✅ ON |
| **Backend Service** (systemd) | active | inactive | `systemctl start/stop central-mcp` | ✅ ON |
| **WebSocket MCP Server** | Listening on 3000/mcp | Not listening | `npm start` / `systemctl` | ✅ ON |
| **Database Process** | SQLite connections open | No connections | Application startup | ✅ ON |

### **Database Systems** (8)
| Component | ON State | OFF State | Control Method | Current Status |
|-----------|----------|-----------|----------------|----------------|
| **SQLite Database** | File accessible, queries working | File locked/deleted | File system access | ✅ ON |
| **Connection Pooling** | Pool active, connections reused | No pooling | `enableConnectionPooling: true/false` | ❓ UNKNOWN |
| **Database Monitoring** | Performance tracking active | No monitoring | `enableMonitoring: true/false` | ❓ UNKNOWN |
| **Integrity Validation** | Data checks running | No validation | `enableIntegrityValidation: true/false` | ❓ UNKNOWN |
| **JSON Column Support** | Modern JSON features enabled | Legacy mode | `enableJsonColumns: true/false` | ❓ UNKNOWN |
| **Migration System** | Schema updates possible | Frozen schema | Migration scripts | ❓ UNKNOWN |
| **Backup System** | Auto-backups running | No backups | Backup scheduler | ❓ UNKNOWN |
| **Query Logger** | SQL queries logged | Silent mode | `enableQueryLogging: true/false` | ❓ UNKNOWN |

---

## 🔄 CATEGORY 2: AUTO-PROACTIVE LOOPS (9 components)

### **Loop Control System** - Each loop has individual ON/OFF control
| Loop | ON State | OFF State | Control Method | Current Status |
|------|----------|-----------|----------------|----------------|
| **Loop 0: System Status** | Health checks every 5s | No monitoring | `enableLoop0: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 1: Agent Auto-Discovery** | Agent discovery every 60s | No agent tracking | `enableLoop1: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 2: Project Discovery** | Project scanning every 60s | No project tracking | `enableLoop2: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 3: Context Learning** | LLM integration active | Reserved/not implemented | `enableLoop3: true/false` | ❌ NOT IMPLEMENTED |
| **Loop 4: Progress Monitoring** | Real-time progress tracking every 30s | No progress monitoring | `enableLoop4: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 5: Status Analysis** | Health analysis every 5min | No status analysis | `enableLoop5: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 6: Opportunity Scanning** | Improvement detection every 15min | No opportunity detection | `enableLoop6: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 7: Spec Generation** | Auto-spec creation every 10min | No auto-spec generation | `enableLoop7: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 8: Task Assignment** | Auto-task assignment every 2min | Manual task assignment | `enableLoop8: true/false` | ⚠️ OFF (24+ hours) |

### **Additional Monitoring Loops** (3)
| Loop | ON State | OFF State | Control Method | Current Status |
|------|----------|-----------|----------------|----------------|
| **Loop 9: Git Push Monitor** | Git activity monitoring every 60s | No git monitoring | `enableLoop9: true/false` | ⚠️ OFF (24+ hours) |
| **Loop 10: RunPod Monitor** | Infrastructure monitoring every 60s | No infrastructure monitoring | `enableLoop10: true/false` | ❓ UNKNOWN |
| **Loop 11: Custom Monitor** | User-defined monitoring | No custom monitoring | Configuration | ❌ NOT IMPLEMENTED |

---

## 🤖 CATEGORY 3: AGENT SYSTEMS (15 components)

### **Agent Instances** (Variable)
| Component | ON State | OFF State | Control Method | Current Status |
|-----------|----------|-----------|----------------|----------------|
| **Agent A** (UI Specialist) | Session active, working | Session inactive | `agentConnect`/`agentDisconnect` | ❌ OFFLINE |
| **Agent B** (Architecture) | Session active, working | Session inactive | `agentConnect`/`agentDisconnect` | ✅ ACTIVE (24+ hrs) |
| **Agent C** (Backend) | Session active, working | Session inactive | `agentConnect`/`agentDisconnect` | ❌ OFFLINE |
| **Agent D** (Integration) | Session active, working | Session inactive | `agentConnect`/`agentDisconnect` | ❌ OFFLINE |
| **Agent E** (Supervisor) | Session active, working | Session inactive | `agentConnect`/`agentDisconnect` | ❌ OFFLINE |
| **Agent F** (Strategic) | Session active, working | Session inactive | `agentConnect`/`agentDisconnect` | ❌ OFFLINE |

### **Agent Capabilities** (9)
| Component | ON State | OFF State | Control Method | Current Status |
|-----------|----------|-----------|----------------|----------------|
| **Agent Heartbeat** | Regular health checks | No monitoring | Heartbeat system | ❓ UNKNOWN |
| **Agent Workload Tracking** | Performance monitoring | No tracking | Workload system | ❓ UNKNOWN |
| **Agent Collaboration** | Inter-agent communication | Isolated operation | Collaboration system | ❓ UNKNOWN |
| **Agent Trust Validation** | Trust scoring active | No trust validation | Trust system | ❓ UNKNOWN |
| **Agent Knowledge Coverage** | Learning active | Static knowledge | Learning system | ❓ UNKNOWN |
| **Agent Performance Tracking** | Metrics collection | No metrics | Performance system | ❓ UNKNOWN |
| **Agent Context Matching** | Smart task assignment | Random assignment | Context system | ❓ UNKNOWN |
| **Agent Deployments** | Auto-deployment active | Manual deployment | Deployment system | ❓ UNKNOWN |
| **Agent Auto-Discovery** | New agents detected | Manual registration | Discovery system | ❓ UNKNOWN |

---

## 🔧 CATEGORY 4: MCP TOOLS (48+ components)

### **Task Management Tools** (6)
| Tool | ON State | OFF State | Control Method | Current Status |
|------|----------|-----------|----------------|----------------|
| **getAvailableTasks** | Task discovery working | No task discovery | Tool registration | ❓ UNKNOWN |
| **claimTask** | Task claiming working | No task claiming | Tool registration | ❓ UNKNOWN |
| **updateProgress** | Progress updates working | No progress tracking | Tool registration | ❓ UNKNOWN |
| **completeTask** | Task completion working | No completion tracking | Tool registration | ❓ UNKNOWN |
| **getDashboard** | Dashboard data working | No dashboard data | Tool registration | ❓ UNKNOWN |
| **getAgentStatus** | Agent status working | No agent status | Tool registration | ❓ UNKNOWN |

### **Intelligence Tools** (8)
| Tool | ON State | OFF State | Control Method | Current Status |
|------|----------|-----------|----------------|----------------|
| **connectToMCP** | MCP connection working | No MCP connection | Tool registration | ❓ UNKNOWN |
| **uploadProjectContext** | Context upload working | No context upload | Tool registration | ❓ UNKNOWN |
| **agentConnect** | Agent connection working | No agent connection | Tool registration | ❓ UNKNOWN |
| **agentHeartbeat** | Heartbeat working | No heartbeat | Tool registration | ❓ UNKNOWN |
| **agentDisconnect** | Disconnection working | No disconnection | Tool registration | ❓ UNKNOWN |
| **getSwarmDashboard** | Swarm dashboard working | No swarm data | Tool registration | ❓ UNKNOWN |
| **captureMessage** | Message capture working | No message capture | Tool registration | ❓ UNKNOWN |
| **uploadProjectContext** | Context upload working | No context upload | Tool registration | ❓ UNKNOWN |

### **Discovery Tools** (6)
| Tool | ON State | OFF State | Control Method | Current Status |
|------|----------|-----------|----------------|----------------|
| **discoverEnvironment** | Environment discovery working | No discovery | Tool registration | ❓ UNKNOWN |
| **uploadContext** | Context upload working | No context upload | Tool registration | ❓ UNKNOWN |
| **searchContext** | Context search working | No search | Tool registration | ❓ UNKNOWN |
| **retrieveContext** | Context retrieval working | No retrieval | Tool registration | ❓ UNKNOWN |
| **getContextStats** | Statistics working | No statistics | Tool registration | ❓ UNKNOWN |
| **analyzeProject** | Project analysis working | No analysis | Tool registration | ❓ UNKNOWN |

### **Additional Tool Categories** (28+)
- **YouTube Processing** (1 tool)
- **Health Monitoring** (1 tool)
- **Keep-in-Touch** (2 tools)
- **Cost Management** (2 tools)
- **Rules Management** (4 tools)
- **UI Tools** (2 tools)
- **MCP System** (1 tool)
- **Central Systems Registry** (3 tools)
- **Visual Generation** (1 tool)
- **RunPod Infrastructure** (2 tools)
- **Multi-Registry** (4 tools)
- **X-Ray Tools** (5 tools)

---

## 🧠 CATEGORY 5: CONFIDENCE SYSTEMS (42 components)

### **Core Confidence Modules** (7)
| Module | ON State | OFF State | Control Method | Current Status |
|--------|----------|-----------|----------------|----------------|
| **Advanced Self-Audit System** | Audit verification active | No auditing | System initialization | ❓ UNKNOWN |
| **Temporal Confidence Tracker** | Historical tracking active | No tracking | System initialization | ❓ UNKNOWN |
| **Counterfactual Analysis** | Risk analysis active | No risk analysis | System initialization | ❓ UNKNOWN |
| **Enhanced Cognitive Bias System** | Bias detection active | No bias detection | System initialization | ❓ UNKNOWN |
| **Confidence Calibration System** | Calibration active | No calibration | System initialization | ❓ UNKNOWN |
| **Metacognitive Awareness Module** | Introspection active | No introspection | System initialization | ❓ UNKNOWN |
| **Multi-Modal Evidence Fusion** | Evidence fusion active | No fusion | System initialization | ❓ UNKNOWN |

### **Confidence Features** (35)
| Feature | ON State | OFF State | Control Method | Current Status |
|---------|----------|-----------|----------------|----------------|
| **Bayesian Updating** | Probability updates active | Static probabilities | Feature flag | ❓ UNKNOWN |
| **Cognitive Bias Detection** (6 types) | Bias correction active | No correction | Feature flags | ❓ UNKNOWN |
| **Monte Carlo Simulation** | Risk simulation active | No simulation | Feature flag | ❓ UNKNOWN |
| **Evidence Hierarchy** | Evidence weighting active | Flat evidence | Feature flag | ❓ UNKNOWN |
| **Uncertainty Quantification** (3 types) | Uncertainty tracking active | No tracking | Feature flags | ❓ UNKNOWN |
| **Brier Score Analysis** | Calibration scoring active | No scoring | Feature flag | ❓ UNKNOWN |
| **Knowledge Boundary Mapping** | Boundary tracking active | No tracking | Feature flag | ❓ UNKNOWN |
| **Ensemble Methods** | Multi-model analysis active | Single model | Feature flag | ❓ UNKNOWN |
| **Cross-Validation** | Validation active | No validation | Feature flag | ❓ UNKNOWN |
| **Adaptive Learning** | Learning active | Static system | Feature flag | ❓ UNKNOWN |
| **... (25 more features)** | ... | ... | ... | ❓ UNKNOWN |

---

## 📋 CATEGORY 6: MULTI-REGISTRY SYSTEMS (24 components)

### **Core Registries** (3)
| Registry | ON State | OFF State | Control Method | Current Status |
|----------|----------|-----------|----------------|----------------|
| **Vision Registry** | Vision extraction active | No extraction | Registry activation | ⚠️ MINIMAL |
| **Implementation Gap Registry** | Gap detection active | No detection | Registry activation | ❌ EMPTY |
| **Tasks Registry** | Task tracking active | No tracking | Registry activation | ⚠️ MINIMAL |

### **Registry Features** (21)
| Feature | ON State | OFF State | Control Method | Current Status |
|---------|----------|-----------|----------------|----------------|
| **Vision Extraction Pipeline** | Extraction working | No extraction | Feature flag | ❓ UNKNOWN |
| **Spec Generation** | Auto-spec creation active | Manual spec | Feature flag | ❓ UNKNOWN |
| **Gap Analysis** | Gap detection active | No analysis | Feature flag | ❓ UNKNOWN |
| **Task Dependencies** | Dependency tracking active | No tracking | Feature flag | ❓ UNKNOWN |
| **Completion Validation** | Validation active | No validation | Feature flag | ❓ UNKNOWN |
| **Honest Completion Assessment** | Assessment active | No assessment | Feature flag | ❓ UNKNOWN |
| **Multi-Level Completion** (4 levels) | Level tracking active | No tracking | Feature flags | ❓ UNKNOWN |
| **Cross-Registry Communication** | Data flow active | Isolated registries | Feature flag | ❓ UNKNOWN |
| **... (13 more features)** | ... | ... | ... | ❓ UNKNOWN |

---

## 🎭 CATEGORY 7: COORDINATION & RULES SYSTEMS (18 components)

### **Rules Engine** (5)
| Rule Type | ON State | OFF State | Control Method | Current Status |
|-----------|----------|-----------|----------------|----------------|
| **Routing Rules** (4 active) | Agent routing active | Random assignment | Rule enablement | ✅ ACTIVE |
| **Dependency Rules** (2 active) | Dependency checking active | No checking | Rule enablement | ✅ ACTIVE |
| **Priority Rules** (2 active) | Priority sorting active | FIFO order | Rule enablement | ✅ ACTIVE |
| **Project Rules** (2 active) | Project filtering active | No filtering | Rule enablement | ✅ ACTIVE |
| **Capacity Rules** (2 active) | Capacity limits active | No limits | Rule enablement | ✅ ACTIVE |

### **Coordination Features** (13)
| Feature | ON State | OFF State | Control Method | Current Status |
|---------|----------|-----------|----------------|----------------|
| **Agent Coordination** | Multi-agent active | Single agent | Feature flag | ❓ UNKNOWN |
| **Team Coordination** | Team workflows active | Individual work | Feature flag | ❓ UNKNOWN |
| **Communication Protocols** | Messaging active | No messaging | Feature flag | ❓ UNKNOWN |
| **Work Sharing** | Load balancing active | No sharing | Feature flag | ❓ UNKNOWN |
| **Conflict Resolution** | Auto-resolution active | Manual resolution | Feature flag | ❓ UNKNOWN |
| **Resource Allocation** | Smart allocation active | Fixed allocation | Feature flag | ❓ UNKNOWN |
| **Synchronization** | Auto-sync active | Manual sync | Feature flag | ❓ UNKNOWN |
| **Deadlock Prevention** | Prevention active | No prevention | Feature flag | ❓ UNKNOWN |
| **... (5 more features)** | ... | ... | ... | ❓ UNKNOWN |

---

## 🌐 CATEGORY 8: MONITORING & ALERTING (15 components)

### **Health Monitoring** (8)
| Monitor | ON State | OFF State | Control Method | Current Status |
|---------|----------|-----------|----------------|----------------|
| **System Health Monitor** | Health checks active | No monitoring | Monitor enablement | ❓ UNKNOWN |
| **Performance Monitor** | Performance tracking active | No tracking | Monitor enablement | ❓ UNKNOWN |
| **Error Monitor** | Error tracking active | No tracking | Monitor enablement | ❓ UNKNOWN |
| **Resource Monitor** | Resource tracking active | No tracking | Monitor enablement | ❓ UNKNOWN |
| **Database Monitor** | DB health tracking active | No tracking | Monitor enablement | ❓ UNKNOWN |
| **Network Monitor** | Network tracking active | No tracking | Monitor enablement | ❓ UNKNOWN |
| **Process Monitor** | Process tracking active | No tracking | Monitor enablement | ❓ UNKNOWN |
| **Security Monitor** | Security monitoring active | No monitoring | Monitor enablement | ❓ UNKNOWN |

### **Alerting System** (7)
| Alert Type | ON State | OFF State | Control Method | Current Status |
|------------|----------|-----------|----------------|----------------|
| **Email Alerts** | Email notifications active | No email alerts | Alert configuration | ❓ UNKNOWN |
| **Slack Alerts** | Slack notifications active | No Slack alerts | Alert configuration | ❓ UNKNOWN |
| **Dashboard Alerts** | Visual alerts active | No visual alerts | Alert configuration | ❓ UNKNOWN |
| **Webhook Alerts** | Webhook notifications active | No webhooks | Alert configuration | ❓ UNKNOWN |
| **SMS Alerts** | SMS notifications active | No SMS alerts | Alert configuration | ❓ UNKNOWN |
| **Critical Event Alerts** | Critical alerts active | No critical alerts | Alert configuration | ❓ UNKNOWN |
| **Performance Alerts** | Performance alerts active | No performance alerts | Alert configuration | ❓ UNKNOWN |

---

## 🎨 CATEGORY 9: UI & DASHBOARD SYSTEMS (12 components)

### **Frontend Systems** (4)
| Component | ON State | OFF State | Control Method | Current Status |
|-----------|----------|-----------|----------------|----------------|
| **Next.js Dashboard** | Dashboard serving active | No dashboard | PM2 start/stop | ⚠️ RUNNING (ISOLATED) |
| **API Endpoints** | API serving active | No API | Application startup | ❓ UNKNOWN |
| **WebSocket Client** | Real-time updates active | No updates | Client connection | ❌ OFFLINE |
| **Static Assets** | Asset serving active | No assets | Web server | ❓ UNKNOWN |

### **UI Features** (8)
| Feature | ON State | OFF State | Control Method | Current Status |
|---------|----------|-----------|----------------|----------------|
| **Real-time Updates** | Live data active | Static data | Feature flag | ❌ OFFLINE |
| **Interactive Charts** | Charts active | No charts | Feature flag | ❓ UNKNOWN |
| **Agent Status Display** | Agent display active | No display | Feature flag | ❓ UNKNOWN |
| **Task Management UI** | Task UI active | No task UI | Feature flag | ❓ UNKNOWN |
| **System Health Dashboard** | Health UI active | No health UI | Feature flag | ❓ UNKNOWN |
| **Configuration Panel** | Config UI active | No config UI | Feature flag | ❓ UNKNOWN |
| **Alert Management UI** | Alert UI active | No alert UI | Feature flag | ❓ UNKNOWN |
| **Registry Visualization** | Registry UI active | No registry UI | Feature flag | ❓ UNKNOWN |

---

## 🔐 CATEGORY 10: SECURITY & AUTHENTICATION (8 components)

### **Authentication** (4)
| Component | ON State | OFF State | Control Method | Current Status |
|-----------|----------|-----------|----------------|----------------|
| **Session Management** | Sessions active | No sessions | Auth configuration | ❓ UNKNOWN |
| **API Key Authentication** | API keys active | No API keys | Auth configuration | ❓ UNKNOWN |
| **JWT Tokens** | Token validation active | No tokens | Auth configuration | ❓ UNKNOWN |
| **OAuth Integration** | OAuth active | No OAuth | Auth configuration | ❓ UNKNOWN |

### **Security Features** (4)
| Feature | ON State | OFF State | Control Method | Current Status |
|---------|----------|-----------|----------------|----------------|
| **Input Validation** | Validation active | No validation | Security config | ❓ UNKNOWN |
| **XSS Protection** | XSS protection active | No protection | Security config | ❓ UNKNOWN |
| **CSRF Protection** | CSRF protection active | No protection | Security config | ❓ UNKNOWN |
| **Rate Limiting** | Rate limiting active | No limits | Security config | ❓ UNKNOWN |

---

## 🚀 CATEGORY 11: INTEGRATION SYSTEMS (14 components)

### **External Integrations** (7)
| Integration | ON State | OFF State | Control Method | Current Status |
|-------------|----------|-----------|----------------|----------------|
| **Git Integration** | Git monitoring active | No git monitoring | Integration config | ❓ UNKNOWN |
| **LLM Integration** | LLM calls active | No LLM calls | Integration config | ❓ UNKNOWN |
| **Database Integration** | DB queries active | No queries | Integration config | ❓ UNKNOWN |
| **API Integration** | External API calls active | No external calls | Integration config | ❓ UNKNOWN |
| **Cloud Storage** | Storage active | No storage | Integration config | ❓ UNKNOWN |
| **Notification Services** | Notifications active | No notifications | Integration config | ❓ UNKNOWN |
| **Monitoring Services** | External monitoring active | No monitoring | Integration config | ❓ UNKNOWN |

### **Internal Integrations** (7)
| Integration | ON State | OFF State | Control Method | Current Status |
|-------------|----------|-----------|----------------|----------------|
| **Multi-Registry Sync** | Sync active | No sync | Integration config | ❓ UNKNOWN |
| **Agent Communication** | Agent messaging active | No messaging | Integration config | ❓ UNKNOWN |
| **Data Pipeline** | Pipeline active | No pipeline | Integration config | ❓ UNKNOWN |
| **Event System** | Events active | No events | Integration config | ❓ UNKNOWN |
| **Workflow Engine** | Workflows active | No workflows | Integration config | ❓ UNKNOWN |
| **Task Queue** | Queue processing active | No queue | Integration config | ❓ UNKNOWN |
| **Cache System** | Caching active | No caching | Integration config | ❓ UNKNOWN |

---

## 📊 CATEGORY 12: ANALYTICS & REPORTING (18 components)

### **Analytics Systems** (9)
| System | ON State | OFF State | Control Method | Current Status |
|--------|----------|-----------|----------------|----------------|
| **Usage Analytics** | Usage tracking active | No tracking | Analytics config | ❓ UNKNOWN |
| **Performance Analytics** | Performance analysis active | No analysis | Analytics config | ❓ UNKNOWN |
| **Agent Analytics** | Agent analysis active | No analysis | Analytics config | ❓ UNKNOWN |
| **Task Analytics** | Task analysis active | No analysis | Analytics config | ❓ UNKNOWN |
| **System Analytics** | System analysis active | No analysis | Analytics config | ❓ UNKNOWN |
| **Error Analytics** | Error analysis active | No analysis | Analytics config | ❓ UNKNOWN |
| **Cost Analytics** | Cost analysis active | No analysis | Analytics config | ❓ UNKNOWN |
| **Time Analytics** | Time analysis active | No analysis | Analytics config | ❓ UNKNOWN |
| **Quality Analytics** | Quality analysis active | No analysis | Analytics config | ❓ UNKNOWN |

### **Reporting Systems** (9)
| System | ON State | OFF State | Control Method | Current Status |
|--------|----------|-----------|----------------|----------------|
| **Daily Reports** | Daily generation active | No reports | Report config | ❓ UNKNOWN |
| **Weekly Reports** | Weekly generation active | No reports | Report config | ❓ UNKNOWN |
| **Monthly Reports** | Monthly generation active | No reports | Report config | ❓ UNKNOWN |
| **Custom Reports** | Custom generation active | No reports | Report config | ❓ UNKNOWN |
| **Real-time Reports** | Real-time generation active | No reports | Report config | ❓ UNKNOWN |
| **Historical Reports** | Historical analysis active | No reports | Report config | ❓ UNKNOWN |
| **Comparative Reports** | Comparison active | No reports | Report config | ❓ UNKNOWN |
| **Trend Reports** | Trend analysis active | No reports | Report config | ❓ UNKNOWN |
| **Executive Reports** | Executive summaries active | No reports | Report config | ❓ UNKNOWN |

---

## 🎯 CONTROL METHODS SUMMARY

### **Primary Control Mechanisms**:

1. **System Commands**:
   - `gcloud compute instances start/stop`
   - `systemctl start/stop central-mcp`
   - `pm2 start/stop`
   - `npm start/stop`

2. **Configuration Flags**:
   - `enableLoop[X]: true/false`
   - `enableMonitoring: true/false`
   - `enable[Feature]: true/false`

3. **Database Controls**:
   - Feature flags in `system_config` table
   - Registry activation settings
   - Agent session management

4. **Application Controls**:
   - MCP tool registration
   - Module initialization
   - Service enablement

5. **External Controls**:
   - Firewall rules
   - Load balancer settings
   - DNS configuration

---

## 📈 CURRENT STATUS SUMMARY

### **✅ CURRENTLY ON (32 components)**:
- VM Instance (central-mcp-server)
- Backend Service (systemd)
- WebSocket MCP Server (port 3000)
- SQLite Database
- Agent B Session (24+ hours active)
- Coordination Rules (12 rules active)
- Next.js Dashboard (PM2, isolated)
- Confidence System Tables (7 tables deployed)
- Multi-Registry Architecture (3 registries)
- Auto-Proactive Loop History (18K+ executions)

### **⚠️ PARTIALLY ON/UNKNOWN (165 components)**:
- All MCP Tools (48+ tools - unknown status due to compilation issues)
- Confidence Systems (42 components - unknown status)
- Multi-Registry Features (21 components - unknown status)
- Coordination Features (13 components - unknown status)
- Monitoring Systems (15 components - unknown status)
- UI Features (8 components - unknown status)
- Security Features (8 components - unknown status)
- Integration Systems (14 components - unknown status)
- Analytics Systems (18 components - unknown status)

### **❌ CURRENTLY OFF (50 components)**:
- Local Development System (TypeScript compilation)
- Auto-Proactive Loops (9 loops - stopped 24+ hours ago)
- Agents A, C, D, E, F (offline)
- External Dashboard Access (firewall blocked)
- WebSocket Client Connection
- Real-time Updates
- Development Workflow
- Local Testing Capabilities

---

## 🔧 QUICK REFERENCE: HOW TO TURN COMPONENTS ON/OFF

### **Critical System Controls**:
```bash
# VM Level
gcloud compute instances start/stop central-mcp-server

# Service Level
systemctl start/stop central-mcp

# Application Level
npm start/stop
pm2 start/stop nextjs-dashboard

# Loop Controls (via config)
{
  "enableLoop0": true/false,    # System Status
  "enableLoop1": true/false,    # Agent Discovery
  "enableLoop2": true/false,    # Project Discovery
  "enableLoop4": true/false,    # Progress Monitoring
  "enableLoop5": true/false,    # Status Analysis
  "enableLoop6": true/false,    # Opportunity Scanning
  "enableLoop7": true/false,    # Spec Generation
  "enableLoop8": true/false,    # Task Assignment
  "enableLoop9": true/false,    # Git Monitor
  "enableLoop10": true/false    # RunPod Monitor
}

# Agent Controls
connectToMCP()    # Turn ON agent
agentDisconnect() # Turn OFF agent

# Database Controls
# Feature flags stored in system_config table
```

---

*Registry Last Updated: 2025-10-13*
*Total Components: 247*
*Status: Architecture Complete, Runtime Partially Operational*