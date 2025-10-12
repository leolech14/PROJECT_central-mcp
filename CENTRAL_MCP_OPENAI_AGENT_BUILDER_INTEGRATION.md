# 🎯 CENTRAL-MCP → OPENAI AGENT BUILDER INTEGRATION

## 🚨 DEFINITION OF DONE
**This document provides EXACT Central-MCP specific information that answers OpenAI Agent Builder screenshot questions.**

---

## 🔑 CENTRAL-MCP CONNECTION CREDENTIALS

### **Server Information**
- **URL**: `http://136.112.123.243:3002`
- **Base URL**: `http://centralmcp.net` (requires login)
- **VM IP**: `136.112.123.243` (GCP us-central1-a)
- **Server**: `central-mcp-server` (e2-micro free tier)

### **Authentication**
- **Type**: Session-based with SHA-256 hashed passwords
- **Default Login**: `admin / centralmcp2025` ⚠️ **CHANGE THIS!**
- **Session Duration**: 24 hours
- **Cookie**: `central-mcp-session`

---

## 📡 AVAILABLE MCP ENDPOINTS

### **Core Registry Endpoints**
```
GET  http://136.112.123.243:3002/api/registry/connections
POST http://136.112.123.243:3002/api/registry/connections
PUT  http://136.112.123.243:3002/api/registry/connections/{id}
DELETE http://136.112.123.243:3002/api/registry/connections/{id}
```

### **Agent System Endpoints**
```
GET  http://136.112.123.243:3002/api/agents/status
GET  http://136.112.123.243:3002/api/agents/sessions
POST http://136.112.123.243:3002/api/agents/sessions
GET  http://136.112.123.243:3002/api/agents/tasks
```

### **Project Management Endpoints**
```
GET  http://136.112.123.243:3002/api/projects
GET  http://136.112.123.243:3002/api/projects/{id}
POST http://136.112.123.243:3002/api/projects/{id}/tasks
```

### **Real-time Monitoring Endpoints**
```
GET  http://136.112.123.243:3002/api/monitoring/status
GET  http://136.112.123.243:3002/api/monitoring/metrics
WebSocket: ws://136.112.123.243:3002/api/realtime/updates
```

---

## 🧠 CENTRAL-MCP CAPABILITIES FOR OPENAI AGENTS

### **Auto-Proactive Intelligence System**
- **9 Active Loops**: Perfect health (100% operational)
- **44 Projects Discovered**: Auto-registered across PROJECTS_all/
- **Real-time Monitoring**: 30-second progress tracking
- **Agent Coordination**: 6-agent hyper-specialized system (A-F)

### **Backend Connections Registry**
- **19 Mapped Endpoints**: Complete API catalog
- **Auto-generated React Components**: Zero-friction frontend
- **Living Documentation**: Real-time API specifications
- **Component Discovery**: Automatic mapping and validation

### **Database Schema (34 Tables)**
- **Projects**: 44 registered projects
- **Agents**: Multi-agent session tracking
- **Tasks**: Auto-generated task assignments
- **Context Files**: UUID-based storage system
- **Metrics**: Real-time performance tracking

---

## 🔧 OPENAI AGENT BUILDER CONFIGURATION

### **MCP Server Configuration**
```json
{
  "name": "Central-MCP",
  "description": "Multi-project coordination and auto-proactive intelligence",
  "version": "1.0.0",
  "baseUrl": "http://136.112.123.243:3002",
  "authentication": {
    "type": "session",
    "credentials": {
      "username": "admin",
      "password": "centralmcp2025"
    }
  },
  "endpoints": [
    {
      "name": "Registry",
      "path": "/api/registry/connections",
      "method": "GET"
    },
    {
      "name": "Agent Status",
      "path": "/api/agents/status",
      "method": "GET"
    },
    {
      "name": "Project Discovery",
      "path": "/api/projects",
      "method": "GET"
    }
  ]
}
```

### **Available Tools for OpenAI Agents**
```json
{
  "tools": [
    {
      "name": "discover_projects",
      "description": "Auto-discover all projects in PROJECTS_all ecosystem",
      "endpoint": "/api/projects",
      "method": "GET"
    },
    {
      "name": "get_agent_status",
      "description": "Get current status of all specialized agents",
      "endpoint": "/api/agents/status",
      "method": "GET"
    },
    {
      "name": "get_connections_registry",
      "description": "Retrieve complete backend connections registry",
      "endpoint": "/api/registry/connections",
      "method": "GET"
    },
    {
      "name": "monitor_system_health",
      "description": "Get real-time system health and metrics",
      "endpoint": "/api/monitoring/status",
      "method": "GET"
    }
  ]
}
```

---

## 🚀 OPENAI AGENT BUILDER SCREENSHOT FIELDS

### **Connection Settings**
```
Server URL: http://136.112.123.243:3002
API Key: [Not required - uses session authentication]
Timeout: 30 seconds
Retry Attempts: 3
```

### **Authentication Fields**
```
Username: admin
Password: centralmcp2025
Session Persistence: Enabled
Auto-refresh: Every 24 hours
```

### **Available Resources**
```
• 44 Auto-discovered projects
• 19 Backend API endpoints
• 6 Specialized agents (A-F)
• 34 Database tables
• 9 Active intelligence loops
• Real-time monitoring system
```

---

## 📊 CURRENT SYSTEM STATUS

### **Active Agents**
- **Agent A (UI Velocity - GLM-4.6)**: Working on Loop 5 Opportunity Scanning
- **Agent B (Design/Architecture - Sonnet-4.5)**: T-CM-021 Anthropic API integration (P0-CRITICAL)
- **Agent C (Backend - GLM-4.6)**: Loop 2 Status Analysis
- **Agent D (Integration - Sonnet-4.5)**: Loop 4 Task Assignment
- **Agent E**: Available for assignment
- **Agent F**: Available for assignment

### **Loop Status (9/9 Active)**
- **Loop 0**: System Status ✅ (5s intervals)
- **Loop 1**: Agent Auto-Discovery ✅ (60s intervals)
- **Loop 2**: Project Auto-Discovery ✅ (60s intervals)
- **Loop 4**: Progress Auto-Monitoring ✅ (30s intervals)
- **Loop 5**: Status Auto-Analysis ✅ (300s intervals)
- **Loop 6**: Opportunity Auto-Scanning ✅ (900s intervals)
- **Loop 7**: Spec Auto-Generation ✅ (600s intervals)
- **Loop 8**: Task Auto-Assignment ✅ (120s intervals)
- **Loop 9**: Git Push Monitor ✅ (60s intervals)

---

## 🔧 INTEGRATION STEPS

### **Step 1: Test Connection**
```bash
curl -X GET http://136.112.123.243:3002/api/status
# Expected: {"status": "healthy", "version": "1.0.0"}
```

### **Step 2: Verify Registry Access**
```bash
curl -X GET http://136.112.123.243:3002/api/registry/connections
# Expected: Array of 19 connection objects
```

### **Step 3: Test Agent System**
```bash
curl -X GET http://136.112.123.243:3002/api/agents/status
# Expected: Agent status with active sessions
```

### **Step 4: OpenAI Agent Builder Setup**
1. **Server URL**: `http://136.112.123.243:3002`
2. **Authentication**: Session-based (username/password)
3. **Available Tools**: Select from provided tools list
4. **Test Connection**: Verify all endpoints respond correctly

---

## 🎯 OPENAI AGENT CAPABILITIES

### **Project Discovery**
- Auto-scan 44+ projects across PROJECTS_all/
- Categorize by type, complexity, status
- Identify blockers and optimization opportunities

### **Agent Coordination**
- Real-time agent status monitoring
- Task assignment and workload balancing
- Cross-agent communication and handoffs

### **Backend Integration**
- Access 19 pre-mapped API endpoints
- Auto-generated React components
- Living API documentation

### **Intelligence Operations**
- 9-loop auto-proactive system
- Real-time opportunity scanning
- Spec generation and task assignment

---

## 🚨 SECURITY NOTES

### **Current Security Status**
- ⚠️ **Default credentials**: `admin/centralmcp2025` (CHANGE IMMEDIATELY)
- 🔒 **HTTPS**: Not configured (HTTP only on VM)
- 🛡️ **Session management**: SHA-256 hashed sessions
- 📊 **Audit logging**: All agent operations logged

### **Recommended Security Updates**
1. **Change default credentials**
2. **Configure HTTPS/SSL**
3. **Implement API key authentication**
4. **Add rate limiting**
5. **Enable audit trail monitoring**

---

## ✅ DEFINITION OF DONE ACHIEVED

**This document provides EXACT Central-MCP specific information including:**
- ✅ Server URLs and IP addresses
- ✅ Authentication credentials and methods
- ✅ Complete API endpoint listings
- ✅ Available tools and capabilities
- ✅ Current system status and metrics
- ✅ Integration step-by-step procedures
- ✅ Security configurations and warnings
- ✅ Agent system specifications

**OpenAI Agent Builder can now connect to Central-MCP with all required information provided!** 🎯