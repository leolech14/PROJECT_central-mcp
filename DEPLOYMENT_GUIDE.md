# 🚀 DEPLOYMENT GUIDE - Rules Registry + WebSocket Events

**Date:** 2025-10-10
**Target:** Google Cloud VM (34.41.115.199)
**Status:** Ready for deployment

---

## 📦 WHAT NEEDS TO BE DEPLOYED

### **Backend Components:**
1. ✅ Rules Registry Database (`RulesRegistry.ts`)
2. ✅ Event Broadcasting System (`EventBroadcaster.ts`)
3. ✅ Rules MCP Tools (`rulesTools.ts`)
4. ✅ Event Integration (5 tools updated)

### **Frontend Components:**
1. ✅ Windows 95/XP Desktop UI (`desktop.html`)
2. ✅ Feature Scaffold Document (`DESKTOP_UI_SCAFFOLD.md`)

---

## 🔧 DEPLOYMENT STEPS

### **Step 1: Upload Files to VM**

From your local machine:

```bash
# SSH into VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Navigate to project directory
cd /opt/central-mcp

# Create backup
sudo cp -r . /opt/central-mcp-backup-$(date +%Y%m%d-%H%M%S)
```

Then upload the new/modified files:

```bash
# From local machine (different terminal)
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# Upload new files
gcloud compute scp src/registry/RulesRegistry.ts central-mcp-server:/opt/central-mcp/src/registry/ --zone=us-central1-a
gcloud compute scp src/events/EventBroadcaster.ts central-mcp-server:/opt/central-mcp/src/events/ --zone=us-central1-a
gcloud compute scp src/tools/rules/rulesTools.ts central-mcp-server:/opt/central-mcp/src/tools/rules/ --zone=us-central1-a

# Upload modified files
gcloud compute scp src/registry/TaskRegistry.ts central-mcp-server:/opt/central-mcp/src/registry/ --zone=us-central1-a
gcloud compute scp src/tools/index.ts central-mcp-server:/opt/central-mcp/src/tools/ --zone=us-central1-a
gcloud compute scp src/tools/claimTask.ts central-mcp-server:/opt/central-mcp/src/tools/ --zone=us-central1-a
gcloud compute scp src/tools/updateProgress.ts central-mcp-server:/opt/central-mcp/src/tools/ --zone=us-central1-a
gcloud compute scp src/tools/completeTask.ts central-mcp-server:/opt/central-mcp/src/tools/ --zone=us-central1-a

# Upload desktop UI (already uploaded, but update if needed)
gcloud compute scp desktop.html central-mcp-server:/opt/central-mcp/public/ --zone=us-central1-a
```

---

### **Step 2: Create Events Directory**

```bash
# On VM
sudo mkdir -p /opt/central-mcp/src/events
sudo mkdir -p /opt/central-mcp/src/tools/rules
```

---

### **Step 3: Rebuild TypeScript**

```bash
# On VM
cd /opt/central-mcp

# Install dependencies (if needed)
sudo npm install

# Build TypeScript
sudo npm run build

# Check for errors
echo "✅ Build completed!"
```

---

### **Step 4: Restart Central-MCP Service**

```bash
# Stop current service
sudo systemctl stop central-mcp

# Check status
sudo systemctl status central-mcp

# Start service
sudo systemctl start central-mcp

# Verify it's running
sudo systemctl status central-mcp

# Check logs
sudo journalctl -u central-mcp -f -n 50
```

**Expected Log Output:**
```
📡 EventBroadcaster initialized
📋 Inserted 12 default coordination rules
✅ Rules Registry schema initialized
🎯 TaskRegistry initialized with RulesRegistry
✅ 32 MCP tools registered successfully:
   - Task management: 6
   - Intelligence: 4
   - Discovery: 5
   - Health: 1
   - Keep-in-Touch: 2
   - Cost Management: 2
   - Rules Management: 4 ⭐ COORDINATION RULES ACTIVE
🌐 WebSocket MCP server listening on 0.0.0.0:3000/mcp
🎯 MCP Server running and ready for agent connections
```

---

### **Step 5: Verify Database Schema**

```bash
# On VM
sqlite3 /opt/central-mcp/data/registry.db

# Check tables
.tables
# Should show: rules  task_history  tasks

# Check rules table
.schema rules
# Should show: CREATE TABLE rules (id, type, name, ...)

# Check default rules loaded
SELECT COUNT(*) FROM rules;
# Should show: 12

# List all rules
SELECT id, type, name, priority, enabled FROM rules;

# Exit sqlite
.quit
```

---

### **Step 6: Test WebSocket Connection**

```bash
# From local machine
wscat -c ws://34.41.115.199:3000/mcp

# You should see welcome message:
{
  "type": "welcome",
  "message": "Connected to Central Intelligence MCP Server",
  "version": "2.0.0",
  "tools": 32
}

# Test sending a request (won't work yet, but verifies connection)
{"jsonrpc":"2.0","method":"test","id":1}

# Exit with Ctrl+C
```

---

### **Step 7: Test MCP Tools**

From agent console or MCP client:

```typescript
// Test get_rules
await client.callTool('get_rules', {});

// Expected response:
{
  "success": true,
  "rules": [...],
  "count": 12,
  "filters": { "type": "all", "enabled_only": false }
}

// Test create_rule
await client.callTool('create_rule', {
  type: 'ROUTING',
  name: 'Test Rule',
  priority: 'MEDIUM'
});

// Expected response:
{
  "success": true,
  "rule": { "id": 13, "type": "ROUTING", "name": "Test Rule", ... },
  "message": "Rule created successfully with ID 13"
}
```

---

### **Step 8: Test Desktop UI**

1. **Open Desktop UI in Browser:**
   ```
   http://34.41.115.199:8000/desktop.html
   ```

2. **Verify WebSocket Connection:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Should see: `✅ Connected to Central-MCP`

3. **Test Agent Monitor:**
   - Click "Agent Monitor" icon
   - Should see 4 agent panels (A, B, C, D)
   - Each panel should show: status, logs, progress bar

4. **Test Rules Registry:**
   - Click "Rules Registry" icon
   - Should see 12 default rules listed
   - Try creating a new rule (should broadcast `rule_created` event)
   - Try editing a rule (should broadcast `rule_updated` event)
   - Try deleting the test rule (should broadcast `rule_deleted` event)

5. **Test Real-Time Events:**
   - Open Agent Monitor window
   - Claim a task via MCP: `claimTask('T005', 'A')`
   - Should immediately see in Agent Monitor:
     - Agent A status changes to "BUSY"
     - New log entry appears: "Claimed task T005: ..."
     - Progress bar initializes

---

## 🧪 TESTING CHECKLIST

### **Backend Tests:**
- [ ] Central-MCP service starts without errors
- [ ] Database schema initialized with rules table
- [ ] 12 default rules loaded
- [ ] 32 MCP tools registered (including 4 rules tools)
- [ ] WebSocket server listening on port 3000
- [ ] EventBroadcaster initialized

### **MCP Tools Tests:**
- [ ] `get_rules` returns 12 default rules
- [ ] `get_rules` with type filter works (e.g., `type: 'ROUTING'`)
- [ ] `create_rule` creates new rule and broadcasts event
- [ ] `update_rule` updates rule and broadcasts event
- [ ] `delete_rule` deletes rule and broadcasts event

### **Event Broadcasting Tests:**
- [ ] `claim_task` broadcasts task_claimed, agent_log, agent_status events
- [ ] `update_task_progress` broadcasts agent_progress, agent_log events
- [ ] `complete_task` broadcasts task_completed, agent_status, agent_log events
- [ ] Rules CRUD operations broadcast rule_created, rule_updated, rule_deleted events

### **Desktop UI Tests:**
- [ ] Desktop UI loads at http://34.41.115.199:8000/desktop.html
- [ ] WebSocket connects to ws://34.41.115.199:3000/mcp
- [ ] Agent Monitor shows 4 agent panels
- [ ] Rules Registry shows 12 default rules
- [ ] Rules CRUD operations work and update in real-time
- [ ] Agent events update UI in real-time

### **Mobile Tests:**
- [ ] Desktop UI loads on mobile browser
- [ ] Touch events work (drag, click)
- [ ] Responsive layout at 768px (tablet)
- [ ] Responsive layout at 480px (mobile)

---

## 🐛 TROUBLESHOOTING

### **Issue: Central-MCP service fails to start**

```bash
# Check logs for errors
sudo journalctl -u central-mcp -n 100

# Common issues:
# 1. TypeScript compilation errors
npm run build  # Check for errors

# 2. Missing dependencies
npm install

# 3. Port 3000 already in use
sudo lsof -i :3000
sudo kill -9 <PID>
```

### **Issue: Rules table not created**

```bash
# Manually check database
sqlite3 /opt/central-mcp/data/registry.db

# Create table manually if needed
-- Copy CREATE TABLE statement from RulesRegistry.ts

# Re-initialize
sudo systemctl restart central-mcp
```

### **Issue: WebSocket connection fails**

```bash
# Check if WebSocket server is listening
sudo netstat -tlnp | grep 3000

# Check firewall rules
sudo iptables -L -n | grep 3000

# Verify Central-MCP is running
sudo systemctl status central-mcp
```

### **Issue: Events not broadcasting**

```bash
# Check EventBroadcaster logs
sudo journalctl -u central-mcp -f | grep "📡"

# Verify WebSocket transport is set
# Should see: "📡 EventBroadcaster connected to WebSocket transport"

# If not, check index.ts for transport initialization
```

### **Issue: Desktop UI not loading**

```bash
# Check if HTTP server is running
ps aux | grep "python3 -m http.server"

# Restart HTTP server if needed
cd /opt/central-mcp/public
nohup python3 -m http.server 8000 > /tmp/dashboard.log 2>&1 &

# Verify firewall allows port 8000
sudo iptables -L -n | grep 8000
```

---

## 📊 MONITORING

### **Real-Time Logs:**

```bash
# Central-MCP service logs
sudo journalctl -u central-mcp -f

# Filter for event broadcasts
sudo journalctl -u central-mcp -f | grep "📡"

# Filter for rules operations
sudo journalctl -u central-mcp -f | grep "📋"

# Filter for MCP tools
sudo journalctl -u central-mcp -f | grep "🔧"
```

### **WebSocket Connections:**

```bash
# Check WebSocket connections
sudo netstat -an | grep :3000

# Count active connections
sudo netstat -an | grep :3000 | grep ESTABLISHED | wc -l
```

### **Database Queries:**

```bash
# Check rules count
echo "SELECT COUNT(*) FROM rules;" | sqlite3 /opt/central-mcp/data/registry.db

# Check enabled rules
echo "SELECT id, type, name FROM rules WHERE enabled = 1;" | sqlite3 /opt/central-mcp/data/registry.db

# Check recent rule changes
echo "SELECT id, type, name, updated_at FROM rules ORDER BY updated_at DESC LIMIT 5;" | sqlite3 /opt/central-mcp/data/registry.db
```

---

## 🎯 SUCCESS CRITERIA

✅ **Deployment is successful when:**

1. Central-MCP service starts without errors
2. Rules table exists with 12 default rules
3. 32 MCP tools registered (4 rules tools included)
4. WebSocket server accepts connections on port 3000
5. Desktop UI loads and connects to WebSocket
6. Rules CRUD operations work via UI
7. Real-time events broadcast to all connected clients
8. Agent actions (claim, progress, complete) trigger real-time UI updates

---

## 📞 QUICK COMMANDS REFERENCE

```bash
# Deploy files
./scripts/deploy-backend.sh  # (create this script)

# Restart service
sudo systemctl restart central-mcp

# Watch logs
sudo journalctl -u central-mcp -f

# Check database
sqlite3 /opt/central-mcp/data/registry.db "SELECT * FROM rules;"

# Test WebSocket
wscat -c ws://34.41.115.199:3000/mcp

# Open Desktop UI
open http://34.41.115.199:8000/desktop.html
```

---

**Next:** Deploy and watch the real-time coordination system come to life! 🚀✨
