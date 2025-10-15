---
spec_id: CMCP-A2A-001
title: "Agent2Agent (A2A) Protocol Integration - Google Release Oct 2025"
version: 1.0
created: 2025-10-10
updated: 2025-10-10
status: ACTIVE
type: INTEGRATION
layer: PROTOCOL
priority: P0-Critical
estimated_hours: 40
assigned_agent: UNASSIGNED
dependencies: [CMCP-AUTH-001]
tags: [a2a, google-adk, gemini-enterprise, cross-framework, protocol]
authors: []
reviewers: []
---

# 🤝 Agent2Agent (A2A) Protocol Integration

## 🚨 BREAKING NEWS: Google Released This TODAY (Oct 9-10, 2025)

**Google just announced**:
- ✅ **Gemini Enterprise** - AI agent orchestration platform ($30/user/month)
- ✅ **Agent2Agent (A2A) Protocol** - Open standard for cross-framework agent communication
- ✅ **Google ADK** - Agent Development Kit (open-source, <100 lines of code)
- ✅ **Gemini CLI** - Free terminal tool with built-in MCP client support

**This changes EVERYTHING for Central-MCP!**

---

## 1. What This Means for Central-MCP

### **Before A2A**:
- Central-MCP: MCP protocol only (Claude agents, LocalBrain, Orchestra.blue)
- Limited to Anthropic ecosystem
- Single-protocol coordination

### **After A2A Integration**:
- Central-MCP: **Universal cross-framework agent hub**
- Supports: Google ADK, LangGraph, Crew.ai, MCP, custom frameworks
- Breaks vendor lock-in
- Industry-standard multi-agent orchestration

---

## 2. Agent2Agent (A2A) Protocol

### 2.1 What It Is

**Official Definition** (from Google):
> "An open Agent2Agent (A2A) protocol that enables agents across different ecosystems to communicate with each other, irrespective of the framework (ADK, LangGraph, Crew.ai, or others) or vendor they are built on."

**Key Properties**:
- **Open Standard**: Industry-backed, not vendor-specific
- **Cross-Framework**: Works with ANY agent framework
- **Message-Based**: Agent-to-agent message routing
- **Discovery**: Agent capability discovery across ecosystems

### 2.2 A2A Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Central-MCP (Universal A2A Hub)               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ A2A Registry │  │ A2A Message  │  │ MCP Bridge   │ │
│  │              │  │ Router       │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ↑                  ↑                 ↑          │
│    Agent Discovery    Message Routing   Protocol       │
│                                          Translation    │
└─────────────────────────────────────────────────────────┘
         ↓                 ↓                  ↓
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ Google  │      │LangGraph│      │ Claude  │
    │   ADK   │      │ Agents  │      │   MCP   │
    │ Agents  │      │         │      │ Agents  │
    └─────────┘      └─────────┘      └─────────┘
```

### 2.3 A2A Message Format

```typescript
interface A2AMessage {
  id: string;
  timestamp: number;
  protocol_version: string;  // "1.0"

  sender: {
    agent_id: string;
    framework: 'adk' | 'langraph' | 'crew.ai' | 'mcp' | 'custom';
    endpoint: string;
    capabilities: string[];
  };

  recipient: {
    agent_id: string;
    framework?: string;
    endpoint?: string;
  };

  content: {
    type: 'task_delegation' | 'task_result' | 'query' | 'response' | 'event_notification';
    payload: any;
    metadata?: Record<string, any>;
  };

  routing?: {
    reply_to?: string;
    correlation_id?: string;
    ttl?: number;
    priority?: number;
  };
}
```

---

## 3. Implementation Plan

### 3.1 Phase 1: A2A Protocol Layer (Week 1)

**Build Core A2A Infrastructure**:

1. **A2A Message Router** (`src/a2a/MessageRouter.ts`):
   ```typescript
   export class A2AMessageRouter {
     async route(message: A2AMessage): Promise<void> {
       // Find recipient agent
       const agent = await this.registry.getAgent(message.recipient.agent_id);

       // Route based on framework
       if (agent.framework === 'mcp') {
         await this.bridge.routeToMCP(message);
       } else {
         await this.routeToA2A(agent.endpoint, message);
       }
     }
   }
   ```

2. **A2A Agent Registry** (`src/a2a/AgentRegistry.ts`):
   ```typescript
   export class A2AAgentRegistry {
     private agents: Map<string, A2AAgent> = new Map();

     async register(agent: A2AAgent): Promise<void> {
       this.agents.set(agent.id, agent);
       await this.broadcast({ type: 'agent_joined', agent });
     }

     async discover(capability: string): Promise<A2AAgent[]> {
       return Array.from(this.agents.values())
         .filter(a => a.capabilities.includes(capability));
     }
   }
   ```

3. **A2A ↔ MCP Bridge** (`src/a2a/MCPBridge.ts`):
   ```typescript
   export class A2AMCPBridge {
     async routeToMCP(a2aMessage: A2AMessage): Promise<void> {
       // Translate A2A message to MCP tool call
       const mcpCall = this.translateA2AToMCP(a2aMessage);
       await this.mcpServer.callTool(mcpCall);
     }

     async routeFromMCP(mcpMessage: any): Promise<A2AMessage> {
       // Translate MCP event to A2A message
       return this.translateMCPToA2A(mcpMessage);
     }
   }
   ```

4. **A2A WebSocket Transport** (`src/a2a/WebSocketTransport.ts`):
   ```typescript
   export class A2AWebSocketTransport {
     async connect(endpoint: string): Promise<void> {
       this.ws = new WebSocket(endpoint);
       this.ws.on('message', (data) => {
         const message = JSON.parse(data) as A2AMessage;
         this.router.route(message);
       });
     }

     async send(message: A2AMessage): Promise<void> {
       this.ws.send(JSON.stringify(message));
     }
   }
   ```

**Acceptance Criteria**:
- [ ] A2A message parsing and serialization works
- [ ] Agent registry stores and discovers agents
- [ ] Message router routes to correct agent
- [ ] MCP bridge translates A2A ↔ MCP correctly
- [ ] WebSocket transport handles A2A messages

### 3.2 Phase 2: Google ADK Integration (Week 2)

**Install and Integrate Google ADK**:

1. **Install ADK SDK**:
   ```bash
   npm install @google/adk
   ```

2. **Create ADK Agent Example** (`examples/adk/task-processor.ts`):
   ```typescript
   import { Agent } from '@google/adk';

   const agent = new Agent({
     id: 'task-processor-001',
     name: 'Task Processor',
     framework: 'adk',

     a2a: {
       enabled: true,
       registry: 'ws://34.41.115.199:3000/a2a',
       capabilities: ['task:process', 'data:analyze']
     },

     llm: {
       model: 'gemini-2.5-pro',
       apiKey: process.env.GEMINI_API_KEY
     }
   });

   agent.on('a2a:message', async (message) => {
     if (message.content.type === 'task_delegation') {
       const result = await processTask(message.content.payload);
       await agent.send({
         recipient: { agent_id: message.sender.agent_id },
         content: { type: 'task_result', payload: result }
       });
     }
   });

   await agent.connect();
   ```

3. **Test ADK → Central-MCP Connection**:
   - ADK agent registers with Central-MCP A2A registry
   - ADK agent receives task delegation via A2A
   - ADK agent sends result back via A2A
   - Central-MCP routes result to MCP agent

**Acceptance Criteria**:
- [ ] Google ADK installed and configured
- [ ] ADK agent connects to Central-MCP
- [ ] ADK agent receives A2A messages
- [ ] ADK agent sends A2A messages
- [ ] End-to-end ADK ↔ MCP communication works

### 3.3 Phase 3: Cross-Framework Swarms (Week 3)

**Enable Multi-Framework Agent Coordination**:

1. **LangGraph Integration**:
   - Install LangGraph SDK
   - Create LangGraph agent example
   - Connect to Central-MCP A2A registry
   - Test LangGraph ↔ ADK communication

2. **Crew.ai Integration**:
   - Install Crew.ai SDK
   - Create Crew.ai agent example
   - Connect to Central-MCP A2A registry
   - Test Crew.ai ↔ ADK ↔ MCP swarm

3. **Orchestration Dashboard**:
   - Build unified dashboard showing all agents (ADK, LangGraph, Crew.ai, MCP)
   - Real-time agent discovery visualization
   - Message routing flow diagram
   - Performance metrics per framework

**Acceptance Criteria**:
- [ ] LangGraph agents connect to Central-MCP
- [ ] Crew.ai agents connect to Central-MCP
- [ ] Multi-framework swarm coordinates successfully
- [ ] Dashboard shows all agents and routing
- [ ] Performance <200ms for cross-framework coordination

---

## 4. Deployment

### 4.1 VM Configuration

**Central-MCP VM** (US-based):
- **IP**: 34.41.115.199
- **Location**: us-central1-a (Iowa, USA)
- **Endpoints**:
  - MCP: `ws://34.41.115.199:3000/mcp` (existing)
  - A2A: `ws://34.41.115.199:3000/a2a` (new)

### 4.2 Environment Variables

```bash
# A2A Configuration
A2A_ENABLED=true
A2A_REGISTRY_PORT=3000
A2A_PROTOCOL_VERSION=1.0

# Google ADK
GEMINI_API_KEY=<from-doppler>

# Authentication (required)
JWT_SECRET=<from-doppler>
```

### 4.3 Deployment Steps

1. Deploy A2A protocol layer to VM
2. Configure A2A WebSocket endpoint
3. Test A2A registry and routing
4. Deploy ADK integration
5. Test cross-framework communication
6. Launch production

---

## 5. Success Metrics

### 5.1 Technical KPIs
- **Message Routing Latency**: <50ms (p95)
- **Agent Discovery Time**: <100ms
- **Cross-Framework Coordination**: <200ms
- **Concurrent Agents**: 1000+
- **Uptime**: 99.9%

### 5.2 Business KPIs
- **Framework Support**: 4+ frameworks (ADK, LangGraph, Crew.ai, MCP)
- **Agent Count**: 100+ agents registered
- **Cross-Framework Tasks**: 1000+ tasks/day
- **Customer Adoption**: 10+ organizations

---

## 6. Competitive Advantage

### 6.1 Market Position

**Before**:
- Central-MCP: MCP protocol only
- Limited: Anthropic ecosystem

**After**:
- Central-MCP: Universal agent hub
- Support: Google, Anthropic, LangChain, Crew.ai, custom
- Position: **#1 cross-framework agent coordination platform**

### 6.2 First Mover Advantage

- ✅ **Google just released A2A** (Oct 9-10, 2025)
- ✅ **We integrate immediately** (same week!)
- ✅ **First platform supporting A2A**
- ✅ **Industry standard adoption** (Google-backed)

---

## 7. References

### 7.1 Official Resources
- [Gemini Enterprise](https://cloud.google.com/gemini-enterprise)
- [Google ADK](https://google.github.io/adk-docs/)
- [Gemini CLI](https://blog.google/technology/developers/introducing-gemini-cli-open-source-ai-agent/)
- [A2A Protocol Announcement](https://cloud.google.com/blog/products/ai-machine-learning/build-and-manage-multi-system-agents-with-vertex-ai)

### 7.2 Related Specs
- `02_SPECBASES/0100_CENTRAL_MCP_FOUNDATION.md` - Core architecture
- `02_SPECBASES/SPEC_JWT_Authentication.md` - Authentication (required for A2A)
- `02_SPECBASES/SPEC_Multi_Project_Task_Registry.md` - Multi-project coordination

### 7.3 PROJECT-ADK
- Location: `/Users/lech/PROJECTS_all/PROJECT_adk/`
- Comprehensive A2A implementation specs
- ADK agent examples and templates

---

## 8. Next Steps

### 8.1 Immediate (Today)
- [ ] Research A2A protocol details (when Google publishes spec)
- [ ] Design A2A layer architecture
- [ ] Create POC A2A message router
- [ ] Test A2A message format

### 8.2 This Week
- [ ] Implement A2A protocol layer
- [ ] Install Google ADK
- [ ] Build ADK integration
- [ ] Test end-to-end A2A flow

### 8.3 This Month
- [ ] Add LangGraph support
- [ ] Add Crew.ai support
- [ ] Launch orchestration dashboard
- [ ] Production deployment

---

**SPEC STATUS**: 🔥 ACTIVE - Google just released this!
**PRIORITY**: P0-Critical - First mover advantage
**TIMELINE**: 3 weeks to production
**IMPACT**: Transforms Central-MCP into universal agent hub

---

**Built on**: Google's Agent2Agent (A2A) Protocol (Released Oct 9-10, 2025)
**Powered by**: Central-MCP + Google ADK + Gemini Enterprise
**Enables**: Cross-framework agent swarms! 🚀
