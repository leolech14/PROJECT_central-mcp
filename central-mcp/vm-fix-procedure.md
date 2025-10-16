# VM Fix Procedure - Central-MCP Service Crash

**Created:** 2025-10-16
**Purpose:** Step-by-step instructions to restore Central-MCP service functionality
**VM IP:** 34.41.115.199 (or 136.112.123.243)
**Service Path:** /opt/central-mcp

---

## 🚨 IMPORTANT: Read First

1. **Always make backups before making changes**
2. **Test fixes in development environment first**
3. **Follow the steps in order - don't skip**
4. **If a step fails, stop and troubleshoot before continuing**

---

## 📋 Prerequisites

- Access to GCP VM (ssh access)
- Sudo/root privileges on VM
- Git access to repository
- Basic knowledge of systemd services

---

## 🔧 QUICK FIX (Immediate Service Restoration)

### Option 1: Rollback to Working Commit (Recommended for immediate fix)

```bash
# 1. SSH into VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# 2. Navigate to service directory
cd /opt/central-mcp

# 3. Check current git status
git status
git log --oneline -5

# 4. Rollback to working commit
git checkout a38e8ca

# 5. Rebuild the application
npm run build

# 6. Restart service
sudo systemctl restart central-mcp

# 7. Check service status
sudo systemctl status central-mcp

# 8. Verify service is working
curl -s http://localhost:3000/health
```

### Option 2: Quick Environment Fix (If rollback not possible)

```bash
# 1. SSH into VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# 2. Check and fix environment variables
cd /opt/central-mcp

# 3. Ensure .env.production has correct settings
cat > .env.production << 'EOF'
NODE_ENV=production
PHOTON_DB_PATH=./data/central-mcp.db
PHOTON_LOG_LEVEL=info
PHOTON_PORT=3000
PHOTON_SSL_ENABLED=false
A2A_ENABLED=true
VM_TOOLS_ENABLED=true
PHOTON_MONITORING_ENABLED=true
EOF

# 4. Restart service
sudo systemctl restart central-mcp
sudo systemctl status central-mcp
```

---

## 🔨 COMPLETE FIX (Address Root Causes)

### Step 1: Diagnose the Exact Issue

```bash
# 1. Run diagnostic script on VM
gcloud compute ssh central-mcp-server --zone=us-central1-a \
  --command='cd /opt/central-mcp && ./vm-diagnostic.sh'

# 2. Review diagnostic output
# Check the log file for specific errors
cat /tmp/central-mcp-diagnostic-*.log
```

### Step 2: Fix TypeScript Compilation Errors

**If diagnostic shows build failures:**

```bash
# 1. SSH into VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# 2. Navigate to service directory
cd /opt/central-mcp

# 3. Try to build and see specific errors
npm run build

# 4. If build fails, fix the specific errors:
#    a. Fix missing type exports
#    b. Fix syntax errors
#    c. Fix import issues

# 5. Common fixes for known issues:

# Fix 1: Add missing PoolStats interface
cat > src/database/ConnectionPool.ts << 'EOF'
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}
EOF

# Fix 2: Fix syntax errors in PortManagerDashboard.ts
# Edit lines around 1386-1402 to fix syntax issues

# 6. Rebuild after fixes
npm run build
```

### Step 3: Fix Environment Variable Issues

**If diagnostic shows environment problems:**

```bash
# 1. Check environment file
cat /opt/central-mcp/.env.production

# 2. Ensure required variables are set
cat > /opt/central-mcp/.env.production << 'EOF'
# PHOTON Configuration
NODE_ENV=production
PHOTON_DB_PATH=./data/central-mcp.db
PHOTON_LOG_LEVEL=info

# API Configuration
PHOTON_PORT=3000
PHOTON_SSL_ENABLED=false

# A2A Configuration
A2A_ENABLED=true
A2A_PATH=/a2a
A2A_AUTH_ENABLED=true

# VM Tools Configuration
VM_TOOLS_ENABLED=true

# Authentication (JWT)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# Monitoring
PHOTON_MONITORING_ENABLED=true
EOF

# 3. Check systemd service file
cat /etc/systemd/system/central-mcp.service

# 4. Update systemd if needed
sudo cat > /etc/systemd/system/central-mcp.service << 'EOF'
[Unit]
Description=Central-MCP Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/central-mcp
Environment=NODE_ENV=production
EnvironmentFile=/opt/central-mcp/.env.production
ExecStart=/usr/bin/node dist/photon/PhotonServer.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 5. Reload systemd and restart
sudo systemctl daemon-reload
sudo systemctl restart central-mcp
```

### Step 4: Fix Missing Dependencies

**If diagnostic shows dependency issues:**

```bash
# 1. SSH into VM
gcloud compute ssh central-mcp-server --zone=us-central1-a

# 2. Navigate to service directory
cd /opt/central-mcp

# 3. Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Check if critical dependencies exist
ls node_modules/better-sqlite3
ls node_modules/express
ls node_modules/@anthropic-ai/sdk

# 5. Rebuild
npm run build

# 6. Restart service
sudo systemctl restart central-mcp
```

### Step 5: Fix Port Binding Issues

**If diagnostic shows port problems:**

```bash
# 1. Check what's using port 3000
sudo netstat -tlnp | grep :3000

# 2. Kill any processes using port 3000
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# 3. Check if port 3000 is available
sudo netstat -tlnp | grep :3000

# 4. Ensure service binds to correct port
# Edit .env.production to set PHOTON_PORT=3000

# 5. Restart service
sudo systemctl restart central-mcp

# 6. Verify port binding
sudo netstat -tlnp | grep :3000
```

---

## ✅ VERIFICATION PROCEDURE

### After Any Fix, Run These Verification Steps:

```bash
# 1. Check service status
sudo systemctl status central-mcp
# Should show: "active (running)"

# 2. Check service logs for errors
sudo journalctl -u central-mcp -f
# Should show no critical errors

# 3. Check port binding
sudo netstat -tlnp | grep :3000
# Should show node process listening on port 3000

# 4. Test health endpoint
curl -s http://localhost:3000/health | jq .
# Should return healthy status

# 5. Test main API endpoints
curl -s http://localhost:3000/api/v1/status
curl -s http://localhost:3000/api/v1/metrics/dashboard

# 6. Check external access
curl -s http://34.41.115.199:3000/health
# Should be accessible from external

# 7. Check dashboard
curl -I http://34.41.115.199:8000/central-mcp-dashboard.html
# Should return 200 OK
```

### Complete Health Check Script:

```bash
#!/bin/bash
# Complete health check after fix

echo "🔍 Running complete health check..."

# Service status
if systemctl is-active --quiet central-mcp; then
    echo "✅ Service is running"
else
    echo "❌ Service is not running"
    exit 1
fi

# Port check
if netstat -tlnp | grep -q :3000; then
    echo "✅ Service listening on port 3000"
else
    echo "❌ Service not listening on port 3000"
    exit 1
fi

# Health endpoint
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Health endpoint responding"
else
    echo "❌ Health endpoint not responding"
    exit 1
fi

# External access
if curl -s http://34.41.115.199:3000/health > /dev/null; then
    echo "✅ External access working"
else
    echo "❌ External access not working"
    exit 1
fi

echo "🎉 All health checks passed!"
```

---

## 🔄 ROLLBACK PROCEDURE

### If Fix Makes Things Worse:

```bash
# 1. Quick rollback to last working state
sudo systemctl stop central-mcp
cd /opt/central-mcp

# 2. Reset to working commit
git checkout a38e8ca
git reset --hard a38e8ca

# 3. Rebuild
npm run build

# 4. Restart
sudo systemctl start central-mcp
sudo systemctl status central-mcp

# 5. Verify
curl -s http://localhost:3000/health
```

### Complete System Reset (Last Resort):

```bash
# 1. Stop service
sudo systemctl stop central-mcp

# 2. Clean everything
cd /opt/central-mcp
rm -rf dist node_modules package-lock.json
git clean -fd
git reset --hard HEAD

# 3. Checkout working commit
git checkout a38e8ca

# 4. Fresh install
npm install
npm run build

# 5. Start service
sudo systemctl start central-mcp
sudo systemctl status central-mcp
```

---

## 📞 TROUBLESHOOTING GUIDE

### Common Issues and Solutions:

#### Issue: Service won't start
```bash
# Check logs
sudo journalctl -u central-mcp -n 50

# Common fixes:
# - Check if PhotonServer.js exists
# - Verify environment variables
# - Check dependencies
```

#### Issue: Build fails
```bash
# Check build errors
npm run build

# Common fixes:
# - Fix TypeScript errors
# - Install missing dependencies
# - Check node_modules permissions
```

#### Issue: Port already in use
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or change port in .env.production
```

#### Issue: Permission errors
```bash
# Fix permissions
sudo chown -R root:root /opt/central-mcp
sudo chmod +x /opt/central-mcp/dist/photon/PhotonServer.js
```

---

## 📋 CHECKLIST BEFORE DEPLOYING FIXES

- [ ] Backup current state (`git tag backup-$(date +%Y%m%d-%H%M%S)`)
- [ ] Test fix in development environment
- [ ] Review diagnostic output
- [ ] Choose appropriate fix strategy
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window if needed
- [ ] Notify stakeholders of potential downtime

---

## 📈 POST-FIX MONITORING

### After Fix is Applied:

```bash
# 1. Monitor service for 30 minutes
watch -n 30 'sudo systemctl status central-mcp'

# 2. Monitor logs
sudo journalctl -u central-mcp -f

# 3. Monitor performance
curl -s http://34.41.115.199:3000/api/v1/metrics | jq .

# 4. Monitor external access
while true; do
    if curl -s http://34.41.115.199:3000/health > /dev/null; then
        echo "$(date): Service is healthy"
    else
        echo "$(date): Service is DOWN"
    fi
    sleep 60
done
```

---

## 🎯 SUCCESS CRITERIA

Fix is considered successful when:

1. ✅ Service status shows "active (running)"
2. ✅ Service binds to port 3000
3. ✅ Health endpoint responds with healthy status
4. ✅ No errors in service logs for 10+ minutes
5. ✅ External access works from different networks
6. ✅ Dashboard loads correctly
7. ✅ API endpoints respond correctly

---

## 📞 CONTACTS

If issues persist:

1. **Primary:** Check diagnostic logs
2. **Secondary:** Review git history for breaking changes
3. **Emergency:** Rollback to working commit (a38e8ca)
4. **Last Resort:** Complete system reset

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Next Review:** After fix application