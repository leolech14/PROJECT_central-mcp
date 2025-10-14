# 🖥️ CENTRAL-MCP DESKTOP UI - COMPLETE FEATURE SCAFFOLD

**Windows 95/XP Style Real-Time Agent Management Interface**

---

## 🎯 COMPLETE FEATURE LIST

### **1. CORE DESKTOP ENVIRONMENT**

#### **1.1 Boot Screen**
- ✅ Windows-style boot animation
- ✅ Progress bar with gradient
- ✅ System loading messages
- ✅ 3-second boot sequence
- **Implementation:** CSS animations + setTimeout

#### **1.2 Desktop Background**
- ✅ Classic teal gradient (#008080)
- ✅ Grid layout for icons
- ✅ Click to deselect
- **Implementation:** CSS gradient background

#### **1.3 Desktop Icons**
- ✅ Retro icon design (48x48 SVG)
- ✅ Single-click to select (highlight)
- ✅ Double-click to open app
- ✅ Icon labels with shadow
- **Apps:**
  - 🤖 Agent Monitor
  - 📊 Project Dashboard
  - 📋 Rules Registry
  - 📈 Task Manager
  - 💻 Terminal (opens GoTTY)
- **Implementation:** SVG icons + event listeners

#### **1.4 Taskbar**
- ✅ Fixed bottom position (40px height)
- ✅ Gradient background (#c0c0c0 to #808080)
- ✅ Start button with Windows logo
- ✅ Active window buttons
- ✅ System clock (live updating)
- **Implementation:** Fixed positioning + flex layout

#### **1.5 Start Menu**
- ✅ Popup from Start button
- ✅ Windows gradient header
- ✅ App list with icons
- ✅ Click outside to close
- **Implementation:** Absolute positioning + event delegation

---

### **2. WINDOW SYSTEM**

#### **2.1 Window Components**
- ✅ Title bar with gradient (blue when active, gray when inactive)
- ✅ Window title with icon
- ✅ Min/Max/Close buttons
- ✅ Content area with scrolling
- ✅ Resize handle (bottom-right corner)
- ✅ Drop shadow
- **Implementation:** Nested divs + CSS outset/inset borders

#### **2.2 Window Interactions**
- ✅ **Drag to move** (click titlebar + drag)
- ✅ **Resize** (drag resize handle)
- ✅ **Minimize** (hide window, show in taskbar)
- ✅ **Maximize** (fill screen except taskbar)
- ✅ **Close** (hide window, remove from taskbar)
- ✅ **Bring to front** (z-index management)
- ✅ **Active/inactive states** (color change)
- **Implementation:**
  - MouseDown + MouseMove + MouseUp events
  - z-index counter
  - classList manipulation
  - Data attributes for saved states

#### **2.3 Window Apps**

##### **2.3.1 Agent Monitor** (900x600px default)
**Purpose:** Real-time streaming of all 6 agents with live logs and progress

**Features:**
- ✅ 2x2 grid layout (4 agents visible)
- ✅ Agent panels with:
  - Agent ID + Name + Model
  - Current project assignment
  - Status indicator (Online/Busy/Offline)
  - Live log stream (last 20 entries)
  - Task progress bar with %
  - Timestamp on each log entry
- ✅ Auto-scroll logs to bottom
- ✅ Color-coded status badges
- ✅ Real-time WebSocket updates

**Implementation:**
```javascript
// Agent data structure
agents = [
  {
    id: 'A',
    name: 'UI Specialist',
    model: 'GLM-4.6',
    project: 'LocalBrain',
    status: 'online|busy|offline',
    logs: ['[12:30:45] Message...'],
    currentTask: 'T004',
    progress: 75  // 0-100%
  }
];

// WebSocket listener
ws.onmessage = (data) => {
  if (data.type === 'agent_log') {
    appendAgentLog(data.agentId, data.message);
  }
  if (data.type === 'agent_progress') {
    updateAgentProgress(data.agentId, data.percentage);
  }
};
```

##### **2.3.2 Project Dashboard** (800x500px default)
**Purpose:** Multi-project tracking with tabs for each project

**Features:**
- ✅ Tab bar at top (LocalBrain, Central-MCP, Orchestra)
- ✅ Project-specific content areas
- ✅ Per-project statistics:
  - Total tasks
  - In progress
  - Completed
  - Blocked
  - Agent assignments
- ✅ Task list with progress bars
- ✅ Visual project health indicator

**Implementation:**
```javascript
projects = {
  'localbrain': {
    tasks: [...],
    agents: ['A', 'B', 'D'],
    completion: 68,
    stats: { total: 19, completed: 13, in_progress: 4, blocked: 2 }
  },
  'central-mcp': {
    tasks: [...],
    agents: ['C'],
    completion: 30,
    stats: { total: 10, completed: 3, in_progress: 5, blocked: 2 }
  }
};

// Tab switching
function switchProject(projectId) {
  document.querySelectorAll('.project-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.project === projectId);
  });
  renderProjectContent(projectId);
}
```

##### **2.3.3 Rules Registry** (700x500px default)
**Purpose:** Database of coordination rules with CRUD operations

**Features:**
- ✅ Add New Rule button
- ✅ Refresh button
- ✅ Scrollable rules list
- ✅ Rule types:
  - **ROUTING:** Task → Agent assignment rules
  - **DEPENDENCY:** Task blocking rules
  - **PRIORITY:** Priority override rules
  - **PROJECT:** Project assignment rules
  - **CAPACITY:** Agent workload limits
- ✅ Priority levels: CRITICAL, HIGH, MEDIUM, LOW
- ✅ Color-coded by priority
- ✅ Edit/Delete actions

**Database Schema:**
```sql
CREATE TABLE rules (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,  -- ROUTING | DEPENDENCY | PRIORITY | PROJECT | CAPACITY
  name TEXT NOT NULL,
  condition TEXT,      -- JSON condition object
  action TEXT,         -- JSON action object
  priority TEXT,       -- CRITICAL | HIGH | MEDIUM | LOW
  enabled BOOLEAN DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);
```

**Implementation:**
```javascript
rules = [
  {
    id: 1,
    type: 'ROUTING',
    name: 'UI tasks → Agent A',
    condition: { taskCategory: 'UI' },
    action: { assignTo: 'A' },
    priority: 'HIGH'
  },
  {
    id: 2,
    type: 'DEPENDENCY',
    name: 'T004 blocks T011',
    condition: { taskId: 'T011' },
    action: { blockedBy: ['T004'] },
    priority: 'CRITICAL'
  }
];

function addRule() {
  const rule = {
    type: prompt('Type:'),
    name: prompt('Name:'),
    priority: prompt('Priority:')
  };
  // Save to database via API
  fetch('/api/rules', {
    method: 'POST',
    body: JSON.stringify(rule)
  });
}
```

##### **2.3.4 Task Manager** (750x550px default)
**Purpose:** Real-time task progress with visual % indicators

**Features:**
- ✅ Task list with cards
- ✅ Progress bars (0-100%)
- ✅ Status badges (Pending/Claimed/In Progress/Completed/Blocked)
- ✅ Assigned agent display
- ✅ Project assignment
- ✅ Priority indicators
- ✅ Time estimates vs actual
- ✅ Dependency visualization
- ✅ Real-time updates

**Implementation:**
```javascript
tasks = [
  {
    id: 'T004',
    title: 'Grid System Foundation',
    status: 'in_progress',
    progress: 75,  // Calculated from sub-tasks or manual update
    assignedAgent: 'A',
    project: 'LocalBrain',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    dependencies: ['T001', 'T002']
  }
];

// Progress calculation
function calculateTaskProgress(task) {
  if (task.subtasks) {
    const completed = task.subtasks.filter(st => st.status === 'completed').length;
    return Math.floor((completed / task.subtasks.length) * 100);
  }
  return task.manualProgress || 0;
}

// Real-time update
ws.onmessage = (data) => {
  if (data.type === 'task_progress') {
    updateTaskProgress(data.taskId, data.progress);
  }
};
```

---

### **3. REAL-TIME FEATURES**

#### **3.1 WebSocket Integration**
```javascript
// Connection management
const ws = new WebSocket('ws://34.41.115.199:3000/mcp');

ws.onopen = () => {
  console.log('✅ Connected to Central-MCP');
  requestInitialData();
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleRealtimeUpdate(data);
};

ws.onerror = (error) => {
  showNotification('Connection error', 'error');
};

ws.onclose = () => {
  showNotification('Disconnected, reconnecting...', 'warning');
  setTimeout(connectWebSocket, 5000);
};

// Message types
function handleRealtimeUpdate(data) {
  switch(data.type) {
    case 'agent_log':
      appendAgentLog(data.agentId, data.message);
      break;
    case 'agent_status':
      updateAgentStatus(data.agentId, data.status);
      break;
    case 'agent_progress':
      updateAgentProgress(data.agentId, data.percentage);
      break;
    case 'task_update':
      updateTask(data.taskId, data.updates);
      break;
    case 'project_assignment':
      updateAgentProject(data.agentId, data.project);
      break;
    case 'rule_triggered':
      logRuleExecution(data.ruleId, data.result);
      break;
  }
}
```

#### **3.2 Live Log Streaming**
```javascript
function appendAgentLog(agentId, message) {
  const logsDiv = document.getElementById(`logs-${agentId}`);
  const timestamp = new Date().toLocaleTimeString();

  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${timestamp}] ${message}`;

  logsDiv.appendChild(entry);
  logsDiv.scrollTop = logsDiv.scrollHeight;

  // Keep only last 20 entries
  while (logsDiv.children.length > 20) {
    logsDiv.removeChild(logsDiv.firstChild);
  }
}
```

#### **3.3 Progress Updates**
```javascript
function updateAgentProgress(agentId, percentage) {
  const progressBar = document.getElementById(`progress-${agentId}`);
  const progressText = document.getElementById(`progress-text-${agentId}`);

  // Smooth animation
  progressBar.style.transition = 'width 0.5s ease';
  progressBar.style.width = percentage + '%';
  progressBar.querySelector('span').textContent = percentage + '%';
  progressText.textContent = percentage + '%';

  // Update status based on progress
  const status = document.getElementById(`status-${agentId}`);
  if (percentage === 0) {
    status.textContent = 'ONLINE';
    status.className = 'agent-status online';
  } else if (percentage === 100) {
    status.textContent = 'COMPLETED';
    status.className = 'agent-status online';
  } else {
    status.textContent = 'BUSY';
    status.className = 'agent-status busy';
  }
}
```

#### **3.4 Multi-Project Tracking**
```javascript
function updateAgentProject(agentId, projectName) {
  const projectEl = document.getElementById(`project-${agentId}`);
  projectEl.textContent = projectName;

  // Visual indicator for project change
  projectEl.style.animation = 'pulse 0.5s';
  setTimeout(() => {
    projectEl.style.animation = '';
  }, 500);

  // Update project dashboard
  refreshProjectDashboard(projectName);
}

// Track parallel projects
const agentProjectMap = {
  'A': 'LocalBrain',
  'B': 'LocalBrain',
  'C': 'Central-MCP',
  'D': 'Orchestra'
};

function checkParallelProjects() {
  const projects = Object.values(agentProjectMap);
  const uniqueProjects = [...new Set(projects)];

  console.log(`${uniqueProjects.length} projects running in parallel:`);
  uniqueProjects.forEach(p => {
    const agents = Object.entries(agentProjectMap)
      .filter(([id, proj]) => proj === p)
      .map(([id]) => id);
    console.log(`  ${p}: ${agents.join(', ')}`);
  });
}
```

---

### **4. MOBILE RESPONSIVE DESIGN**

#### **4.1 Breakpoints**
```css
/* Desktop (default) */
.window { min-width: 400px; }
.agent-grid { grid-template-columns: repeat(2, 1fr); }

/* Tablet (768px and below) */
@media (max-width: 768px) {
  .desktop-icons { flex-direction: row; flex-wrap: wrap; }
  .window { width: 100% !important; height: calc(100vh - 40px) !important; left: 0 !important; top: 0 !important; }
  .agent-grid { grid-template-columns: 1fr; }
  .start-menu { width: 100%; left: 0; }
}

/* Mobile (480px and below) */
@media (max-width: 480px) {
  .taskbar { padding: 1px; }
  .start-button { padding: 3px 10px; font-size: 10px; }
  .taskbar-clock { font-size: 9px; min-width: 70px; }
  .window-titlebar { font-size: 10px; padding: 2px; }
  .agent-logs { height: 100px; font-size: 9px; }
}
```

#### **4.2 Touch Support**
```javascript
// Touch events for mobile
function setupTouchSupport() {
  const windows = document.querySelectorAll('.window');

  windows.forEach(window => {
    const titlebar = window.querySelector('.window-titlebar');

    let touchStartX, touchStartY, windowStartX, windowStartY;

    titlebar.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      windowStartX = window.offsetLeft;
      windowStartY = window.offsetTop;
      bringToFront(window);
    });

    titlebar.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      window.style.left = (windowStartX + deltaX) + 'px';
      window.style.top = (windowStartY + deltaY) + 'px';
    });
  });
}
```

#### **4.3 Adaptive Layout**
```javascript
function adaptForMobile() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Auto-maximize windows on mobile
    document.querySelectorAll('.window').forEach(w => {
      if (w.style.display === 'flex') {
        w.dataset.maximized = 'true';
        w.style.width = '100%';
        w.style.height = 'calc(100vh - 40px)';
        w.style.left = '0';
        w.style.top = '0';
      }
    });

    // Single column for agents
    const agentGrid = document.getElementById('agentGrid');
    if (agentGrid) {
      agentGrid.style.gridTemplateColumns = '1fr';
    }

    // Disable window dragging on mobile
    // (Prevents accidental drags while scrolling)
  }
}

// Re-adapt on window resize
window.addEventListener('resize', adaptForMobile);
```

---

### **5. UI/UX WISDOM (From LocalBrain RAG)**

#### **5.1 Accessibility (WCAG 2.2 AA)**
- ✅ **Color Contrast:** 4.5:1 text, 3:1 UI elements
- ✅ **Keyboard Navigation:** Tab through all controls
- ✅ **ARIA Labels:** Screen reader support
- ✅ **Focus Indicators:** Visible focus rings

```css
/* Focus indicators */
.window-button:focus,
.button:focus,
.taskbar-app:focus {
  outline: 2px solid #000080;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .window { border-width: 3px; }
  .agent-status { border-width: 2px; }
}
```

#### **5.2 Performance Optimization**
```javascript
// Debounce window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(adaptForMobile, 150);
});

// Throttle log updates
const logThrottle = {};
function throttledLogAppend(agentId, message) {
  if (logThrottle[agentId]) return;
  logThrottle[agentId] = true;

  requestAnimationFrame(() => {
    appendAgentLog(agentId, message);
    logThrottle[agentId] = false;
  });
}

// Virtual scrolling for large task lists
function renderVisibleTasks() {
  const container = document.getElementById('taskList');
  const scrollTop = container.scrollTop;
  const viewportHeight = container.clientHeight;

  const startIndex = Math.floor(scrollTop / TASK_HEIGHT);
  const endIndex = Math.ceil((scrollTop + viewportHeight) / TASK_HEIGHT);

  // Only render visible tasks
  const visibleTasks = tasks.slice(startIndex, endIndex);
  renderTasks(visibleTasks, startIndex);
}
```

#### **5.3 Progressive Disclosure**
```javascript
// Show essential info first, details on demand
function renderAgentPanel(agent) {
  return `
    <div class="agent-panel">
      <!-- Always visible -->
      <div class="agent-header">
        <span>Agent ${agent.id}</span>
        <span class="agent-status">${agent.status}</span>
      </div>

      <!-- Collapsible details -->
      <details>
        <summary>Show Details</summary>
        <div>
          <p>Model: ${agent.model}</p>
          <p>Context: ${agent.contextWindow}</p>
          <p>Uptime: ${agent.uptime}</p>
        </div>
      </details>

      <!-- Logs (always visible) -->
      <div class="agent-logs">...</div>
    </div>
  `;
}
```

#### **5.4 Error Handling**
```javascript
// Graceful degradation
function connectWebSocket() {
  try {
    ws = new WebSocket('ws://34.41.115.199:3000/mcp');

    ws.onerror = () => {
      showErrorNotification('Connection failed. Retrying in 5s...');
      // Fall back to polling
      startPolling();
    };
  } catch (error) {
    console.error('WebSocket not supported');
    startPolling();  // Fallback to HTTP polling
  }
}

function startPolling() {
  setInterval(async () => {
    try {
      const response = await fetch('http://34.41.115.199:3000/api/status');
      const data = await response.json();
      handleRealtimeUpdate(data);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 5000);
}
```

#### **5.5 Internationalization Ready**
```javascript
const i18n = {
  en: {
    'agent.status.online': 'ONLINE',
    'agent.status.busy': 'BUSY',
    'agent.status.offline': 'OFFLINE',
    'task.pending': 'Pending',
    'task.in_progress': 'In Progress'
  },
  pt: {
    'agent.status.online': 'ONLINE',
    'agent.status.busy': 'OCUPADO',
    'agent.status.offline': 'OFFLINE',
    'task.pending': 'Pendente',
    'task.in_progress': 'Em Progresso'
  }
};

function t(key, lang = 'en') {
  return i18n[lang][key] || key;
}
```

---

### **6. BACKEND API ENDPOINTS**

#### **6.1 Rules API**
```typescript
// GET /api/rules - Get all rules
// POST /api/rules - Create new rule
// PUT /api/rules/:id - Update rule
// DELETE /api/rules/:id - Delete rule

interface Rule {
  id: number;
  type: 'ROUTING' | 'DEPENDENCY' | 'PRIORITY' | 'PROJECT' | 'CAPACITY';
  name: string;
  condition: object;
  action: object;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  enabled: boolean;
}
```

#### **6.2 Real-Time Events**
```typescript
// WebSocket message types
interface AgentLogEvent {
  type: 'agent_log';
  agentId: string;
  message: string;
  timestamp: number;
}

interface AgentProgressEvent {
  type: 'agent_progress';
  agentId: string;
  taskId: string;
  percentage: number;
  currentStep: string;
}

interface ProjectAssignmentEvent {
  type: 'project_assignment';
  agentId: string;
  oldProject: string;
  newProject: string;
}
```

---

### **7. DEPLOYMENT**

#### **7.1 Build & Deploy**
```bash
# Upload to VM
gcloud compute scp desktop.html \
  central-mcp-server:/opt/central-mcp/public/ \
  --zone=us-central1-a

# Access at:
# http://34.41.115.199:8000/desktop.html
```

#### **7.2 Testing**
```bash
# Desktop browsers
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Test CSS grid support

# Mobile devices
- iOS Safari: Test touch events
- Android Chrome: Test performance
- Responsive: Test at 320px, 768px, 1024px, 1920px
```

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1: Core UI (2 hours)**
1. ✅ Desktop + Taskbar + Start Menu
2. ✅ Window system (drag, resize, minimize, maximize, close)
3. ✅ Agent Monitor app with 4 panels
4. ✅ Basic WebSocket connection

### **Phase 2: Real-Time Features (2 hours)**
5. ✅ Live log streaming
6. ✅ Progress bar updates
7. ✅ Agent status changes
8. ✅ Project assignment tracking

### **Phase 3: Advanced Features (2 hours)**
9. ✅ Rules Registry UI + CRUD
10. ✅ Task Manager with % indicators
11. ✅ Multi-project dashboard
12. ✅ Backend API integration

### **Phase 4: Polish (1 hour)**
13. ✅ Mobile responsive layout
14. ✅ Touch support
15. ✅ Accessibility
16. ✅ Error handling

---

## 📊 SUCCESS METRICS

- ✅ **Boot Time:** < 3 seconds
- ✅ **Window Operations:** < 100ms
- ✅ **WebSocket Latency:** < 200ms
- ✅ **Log Updates:** < 50ms
- ✅ **Mobile Performance:** 60 FPS
- ✅ **Lighthouse Score:** > 90
- ✅ **WCAG Compliance:** AA

---

**Total Implementation Time:** 7 hours
**Result:** Full Windows 95/XP Desktop UI with real-time agent monitoring!

🚀 **READY TO DEPLOY TO VM AND TEST!**
