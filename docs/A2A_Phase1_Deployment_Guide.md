# A2A Phase 1 Deployment Guide

## 🚀 Quick Start - Deploy A2A to Central-MCP VM

**Status**: Phase 1 Complete - Ready for Deployment
**VM**: 34.41.115.199 (us-central1-a, Iowa, USA)

---

## Prerequisites

✅ Already completed:
- A2A protocol layer implemented
- TypeScript compiled successfully
- All files in `dist/a2a/` directory
- JWT authentication system ready
- SQLite database support

---

## Deployment Steps

### 1. Upload A2A Files to VM

```bash
# From local machine, upload compiled A2A files
scp -r dist/a2a/* root@34.41.115.199:/opt/central-mcp/dist/a2a/
scp -r src/a2a/* root@34.41.115.199:/opt/central-mcp/src/a2a/
```

### 2. Verify Database Schema

The A2A Agent Registry will auto-create its table on first run:

```sql
-- This happens automatically, but you can verify:
SELECT name FROM sqlite_master
WHERE type='table' AND name='a2a_agents';
```

### 3. Add A2A to PhotonServer

**Option A**: Modify existing PhotonServer.ts

```typescript
import { A2AServer } from './a2a/A2AServer.js';

// Inside PhotonServer class:
private a2aServer?: A2AServer;

// In initialize() method:
this.a2aServer = new A2AServer(this.httpServer, this.db, {
  path: '/a2a',
  enableAuth: true  // Use JWT/API key auth
});

// Connect A2A to MCP
this.a2aServer.setMCPServer(this.mcpServer);

// In shutdown() method:
if (this.a2aServer) {
  this.a2aServer.shutdown();
}
```

**Option B**: Use standalone A2A server (from examples)

```bash
# Copy example to production
cp examples/a2a-integration.ts src/a2a-standalone.ts

# Run standalone
node dist/a2a-standalone.js
```

### 4. Configure Environment Variables

Add to Doppler or `.env`:

```bash
# A2A Configuration
A2A_ENABLED=true
A2A_PATH=/a2a
A2A_AUTH_ENABLED=true

# JWT (already configured)
JWT_SECRET=<from-doppler>
JWT_EXPIRY=24h

# Heartbeat settings (optional)
A2A_HEARTBEAT_TIMEOUT=60000    # 60 seconds
A2A_HEARTBEAT_CHECK=30000      # 30 seconds
```

### 5. Restart Service

```bash
# On VM
systemctl restart central-mcp

# Or if using PM2
pm2 restart central-mcp

# Verify logs
journalctl -u central-mcp -f
# Look for: "🚀 A2A Server initialized on /a2a"
```

### 6. Test A2A Endpoint

```bash
# Health check (should see WebSocket upgrade)
curl -i http://34.41.115.199:3000/a2a

# Expected response:
# HTTP/1.1 426 Upgrade Required
# (This is correct - WebSocket endpoints don't respond to HTTP GET)

# Test with WebSocket client
wscat -c ws://34.41.115.199:3000/a2a
```

**Expected welcome message**:
```json
{
  "type": "welcome",
  "protocol_version": "1.0",
  "server": "Central-MCP A2A Hub",
  "timestamp": 1728562800000,
  "capabilities": ["messaging", "discovery", "routing", "bridge"]
}
```

---

## Verification Checklist

### Basic Functionality
- [ ] A2A endpoint accessible at `ws://34.41.115.199:3000/a2a`
- [ ] Welcome message sent to new connections
- [ ] Authentication working (if enabled)
- [ ] Database table `a2a_agents` created
- [ ] Logs show "A2A Server initialized"

### Agent Registration
- [ ] Agent can send handshake
- [ ] Agent appears in registry
- [ ] Agent status updates on heartbeat
- [ ] Offline agents detected after timeout

### Message Routing
- [ ] Messages route between agents
- [ ] MCP bridge translates correctly
- [ ] Message history tracked
- [ ] Statistics available

### WebSocket Transport
- [ ] Can connect to remote A2A endpoints
- [ ] Automatic reconnection works
- [ ] Broadcast to multiple clients works

---

## Monitoring

### Check A2A Statistics

```bash
# Add to PhotonAPI or create dedicated endpoint:
GET /api/v1/a2a/stats

Response:
{
  "connectedClients": 5,
  "registry": {
    "totalAgents": 12,
    "onlineAgents": 8,
    "frameworkCounts": {
      "adk": 3,
      "langraph": 2,
      "mcp": 7,
      "crew.ai": 0,
      "custom": 0
    }
  },
  "router": {
    "totalMessages": 450,
    "messagesByType": {...},
    "messagesByFramework": {...}
  }
}
```

### Monitor Logs

```bash
# Watch for A2A activity
journalctl -u central-mcp -f | grep "A2A\|a2a"

# Key log patterns:
# ✅ "A2A Server initialized on /a2a"
# 🔌 "A2A client connected: <id>"
# 🤝 "Handshake completed with <agent>"
# 📨 "Routed A2A message to <framework> agent"
# 💓 "Heartbeat from <agent>"
```

### Database Queries

```bash
# Check registered agents
sqlite3 /opt/central-mcp/data/central-mcp.db \
  "SELECT id, name, framework, status FROM a2a_agents;"

# Check agent capabilities
sqlite3 /opt/central-mcp/data/central-mcp.db \
  "SELECT name, capabilities FROM a2a_agents WHERE status='online';"

# Check heartbeat status
sqlite3 /opt/central-mcp/data/central-mcp.db \
  "SELECT name, datetime(last_heartbeat/1000, 'unixepoch') as last_beat
   FROM a2a_agents
   ORDER BY last_heartbeat DESC;"
```

---

## Troubleshooting

### Issue: WebSocket connection refused
```bash
# Check if port is open
netstat -tuln | grep 3000

# Check firewall
ufw status

# Allow port if needed
ufw allow 3000/tcp
```

### Issue: Authentication failing
```bash
# Check JWT secret is set
doppler secrets get --project central-mcp --config prod JWT_SECRET

# Verify API keys in database
sqlite3 /opt/central-mcp/data/central-mcp.db \
  "SELECT id, agent_id, role FROM api_keys WHERE revoked_at IS NULL;"
```

### Issue: Agents not appearing in registry
```bash
# Check handshake messages in logs
journalctl -u central-mcp -f | grep "handshake"

# Verify database table exists
sqlite3 /opt/central-mcp/data/central-mcp.db \
  "SELECT count(*) FROM a2a_agents;"

# Check for errors
journalctl -u central-mcp -f | grep "ERROR\|error"
```

### Issue: Messages not routing
```bash
# Check message router stats
# (Add this to API endpoint or logs)

# Verify MCP bridge is connected
# Look for: "MCP server connected to A2A bridge"

# Check WebSocket transport
# Look for: "A2A WebSocket Transport initialized"
```

---

## Security Considerations

### Enable Authentication (Recommended)
```typescript
const a2aServer = new A2AServer(httpServer, db, {
  path: '/a2a',
  enableAuth: true  // ✅ Require JWT or API key
});
```

### Generate API Keys for Agents
```bash
# Use Central-MCP API
curl -X POST http://34.41.115.199:3000/api/v1/auth/generate-key \
  -H "Authorization: Bearer <admin-jwt>" \
  -d '{"agentId": "adk-agent-001", "role": "agent"}'
```

### Monitor for Suspicious Activity
```bash
# Watch for failed auth attempts
journalctl -u central-mcp -f | grep "Unauthorized A2A"

# Check for stale agents
sqlite3 /opt/central-mcp/data/central-mcp.db \
  "SELECT name, status, datetime(last_heartbeat/1000, 'unixepoch')
   FROM a2a_agents
   WHERE status='offline';"
```

---

## Performance Tuning

### Adjust Heartbeat Settings
```typescript
// In AgentRegistry.ts - modify constants:
const HEARTBEAT_TIMEOUT = 60000;  // Increase if network is slow
const CHECK_INTERVAL = 30000;     // How often to check
```

### Message History Cleanup
```typescript
// Run periodically (add to cron or scheduler):
router.cleanupHistory(3600000);  // Remove messages older than 1 hour
```

### Connection Pool Size
```typescript
// In WebSocketTransport.ts - no hard limit currently
// Monitor with getStats() and scale VM if needed
```

---

## Next Steps - Phase 2

Once Phase 1 is deployed and verified:

1. **Install Google ADK SDK**
   ```bash
   npm install @google/adk
   ```

2. **Deploy ADK Agent Example**
   ```bash
   # Copy example to production location
   cp PROJECT_adk/examples/adk/task-processor-agent.ts /opt/adk-agents/

   # Run ADK agent
   node /opt/adk-agents/task-processor-agent.js
   ```

3. **Test Cross-Framework Communication**
   - MCP agent → A2A Hub → ADK agent
   - ADK agent → A2A Hub → MCP agent

4. **Measure Performance**
   - Message routing latency (target: <100ms)
   - Agent discovery time (target: <100ms)
   - Cross-framework coordination (target: <200ms)

---

## Support & Documentation

**Main Spec**: `02_SPECBASES/SPEC_Agent2Agent_Integration.md`
**Implementation Summary**: `02_SPECBASES/IMPLEMENTATION_A2A_Phase1_Complete.md`
**Integration Example**: `examples/a2a-integration.ts`
**ADK Agent Example**: `PROJECT_adk/examples/adk/task-processor-agent.ts`

**Questions?** Check logs first:
```bash
journalctl -u central-mcp -f
```

---

**Deployment Prepared**: October 10, 2025
**Phase 1 Status**: ✅ COMPLETE - Ready to Deploy
**Next Phase**: Phase 2 - Google ADK Integration (Week 2)
