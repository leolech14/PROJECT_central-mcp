# 📚 Central Intelligence - Complete API Reference
## All 18 MCP Tools Documented

**Version**: 2.0.0
**Protocol**: MCP (Model Context Protocol) JSON-RPC 2.0
**Transport**: stdio (local) / WebSocket (cloud)
**Total Tools**: 18

---

## 🔍 Discovery Tools (5)

### **1. discover_environment** ⭐ MAIN ENTRY POINT

**Purpose**: Complete automatic environment discovery (plug-n-play activation)

**Input**:
```typescript
{
  cwd: string;              // Current working directory
  modelId: string;          // Agent model ID (e.g., 'claude-sonnet-4-5')
  trackingId?: string;      // Optional: Agent tracking ID
  apiKeyHash?: string;      // Optional: For signature matching
  machineId?: string;       // Optional: Machine identifier
}
```

**Output**:
```typescript
{
  agent: Agent;                    // Recognized or created agent
  agentIdentity: AgentIdentity;    // Recognition details
  project: Project;                // Detected or registered project
  context: ExtractedContext;       // All files indexed
  proposals: JobProposal[];        // Ranked job matches
  discoveryTime: number;           // Performance (ms)
}
```

**Example**:
```bash
# Via CLI
$ brain connect

# Via MCP
{
  "method": "tools/call",
  "params": {
    "name": "discover_environment",
    "arguments": {
      "cwd": "/Users/lech/PROJECTS_all/LocalBrain",
      "modelId": "glm-4.6"
    }
  }
}
```

---

### **2. upload_context**

**Purpose**: Upload context files to cloud storage

**Input**:
```typescript
{
  projectId: string;
  files: string[];          // File paths to upload
  forceRefresh?: boolean;   // Force re-upload
}
```

**Output**:
```typescript
{
  uploaded: number;         // Files uploaded
  skipped: number;          // Already uploaded
  failed: number;           // Upload failures
  totalSize: number;        // Bytes uploaded
}
```

---

### **3. search_context**

**Purpose**: Search context files

**Input**:
```typescript
{
  projectId: string;
  query: string;            // Search query
  type?: 'SPEC' | 'DOC' | 'CODE' | 'ALL';
  limit?: number;           // Max results (default 20)
}
```

**Output**:
```typescript
{
  results: ContextFile[];   // Matching files
  totalMatches: number;
  searchTime: number;       // ms
}
```

---

### **4. retrieve_context**

**Purpose**: Retrieve specific context file

**Input**:
```typescript
{
  projectId: string;
  fileId: string;           // File UUID
}
```

**Output**:
```typescript
{
  file: ContextFile;
  content?: string;         // File content if requested
}
```

---

### **5. get_context_stats**

**Purpose**: Get context statistics for project

**Input**:
```typescript
{
  projectId: string;
}
```

**Output**:
```typescript
{
  totalFiles: number;
  totalSize: number;
  byType: Record<ContextFileType, number>;
  lastIndexed: string;
}
```

---

## 📋 Task Management Tools (6)

### **6. get_available_tasks**

**Purpose**: Query tasks ready for specific agent

**Input**:
```typescript
{
  agent: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  includeDetails?: boolean;
}
```

**Output**:
```typescript
{
  availableTasks: Task[];
  totalAvailable: number;
}
```

---

### **7. claim_task**

**Purpose**: Atomically claim a task

**Input**:
```typescript
{
  taskId: string;
  agent: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}
```

**Output**:
```typescript
{
  success: boolean;
  error?: string;
  claimedAt?: string;
}
```

---

### **8. update_progress**

**Purpose**: Update task progress

**Input**:
```typescript
{
  taskId: string;
  status: 'IN_PROGRESS' | 'CLAIMED';
  completionPercent: number;    // 0-100
  filesCreated?: string[];
  notes?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  gitVerification?: {
    filesFound: number;
    commitsFound: number;
    score: number;
  };
}
```

---

### **9. complete_task**

**Purpose**: Complete task with Git verification

**Input**:
```typescript
{
  taskId: string;
  agent: string;
  filesCreated?: string[];
  velocity?: number;        // Performance percentage
}
```

**Output**:
```typescript
{
  success: boolean;
  unblocked?: string[];     // Auto-unblocked task IDs
  gitScore?: number;        // 0-100 verification score
}
```

---

### **10. get_dashboard**

**Purpose**: Sprint overview dashboard

**Input**:
```typescript
{
  project?: string;         // Optional project filter
}
```

**Output**: Sprint metrics with ASCII art visualization

---

### **11. get_agent_status**

**Purpose**: Individual agent deep dive

**Input**:
```typescript
{
  agent: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}
```

**Output**: Agent workload and Git activity

---

## 🤖 Intelligence Tools (4)

### **12. agent_connect**

**Purpose**: Create agent session

**Input**:
```typescript
{
  agent: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  model: string;
  project: string;
  machineId?: string;
}
```

**Output**:
```typescript
{
  sessionId: string;
  status: 'CONNECTED';
  availableTasks: number;
}
```

---

### **13. agent_heartbeat**

**Purpose**: Update presence (auto-called every 30s)

**Input**:
```typescript
{
  sessionId: string;
  currentActivity?: 'ACTIVE' | 'IDLE';
}
```

**Output**:
```typescript
{
  status: 'HEARTBEAT_RECEIVED';
  timestamp: string;
}
```

---

### **14. agent_disconnect**

**Purpose**: Close session

**Input**:
```typescript
{
  sessionId: string;
}
```

**Output**:
```typescript
{
  status: 'DISCONNECTED';
  sessionDuration: number;  // minutes
  tasksClaimed: number;
  tasksCompleted: number;
}
```

---

### **15. get_swarm_dashboard**

**Purpose**: Real-time view of all agents

**Input**: `{}`

**Output**: All agents + recent activity

---

## 🏥 Health Tools (1)

### **16. get_system_health**

**Purpose**: Check health and trigger auto-recovery

**Input**:
```typescript
{
  autoHeal?: boolean;       // Default: true
}
```

**Output**:
```typescript
{
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  checks: HealthCheck[];
  issues: HealthIssue[];
  autoRecoveryAttempted: boolean;
}
```

---

## ⏱️ Keep-in-Touch Tools (2)

### **17. agent_checkin** ⭐

**Purpose**: Regular check-in (required every 30 min)

**Input**:
```typescript
{
  sessionId: string;
  agentId: string;
  currentActivity: string;
  progress?: number;        // 0-100
  blockers?: string[];
}
```

**Output**:
```typescript
{
  status: 'CHECK_IN_RECEIVED';
  nextCheckInDue: string;
  missedCheckIns: number;
}
```

---

### **18. request_completion_permission** ⭐

**Purpose**: Request permission to complete (BLOCKS completion!)

**Input**:
```typescript
{
  taskId: string;
  agentId: string;
  sessionId?: string;
}
```

**Output**:
```typescript
{
  permissionStatus: 'GRANTED' | 'PENDING' | 'ACTION_REQUIRED';
  retryAfter?: number;      // Seconds to wait
  message: string;
}
```

---

## 📊 Usage Patterns

### **Pattern 1: Agent Activation**
```
1. discover_environment
2. agent_connect
3. Start auto-heartbeat (every 30s)
```

### **Pattern 2: Task Execution**
```
1. get_available_tasks
2. claim_task
3. update_progress (periodic)
4. agent_checkin (every 30 min)
5. request_completion_permission
6. complete_task
```

### **Pattern 3: Monitoring**
```
1. get_swarm_dashboard (team view)
2. get_agent_status (individual)
3. get_system_health (health check)
```

---

**All 18 tools operational and tested!** ✅
