#!/bin/bash
#
# VM Diagnostic Script for Central-MCP Crash Investigation
# =======================================================
# This script diagnoses the exact cause of the Central-MCP service crash
#
# Usage: ./vm-diagnostic.sh
# Output: Detailed diagnostic report identifying root cause

set -e

# Configuration
SERVICE_NAME="central-mcp"
VM_PATH="/opt/central-mcp"
LOG_FILE="/tmp/central-mcp-diagnostic-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     CENTRAL-MCP VM CRASH DIAGNOSTIC TOOL                ║${NC}"
echo -e "${BLUE}║     Investigating service crash on VM                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Log file: ${LOG_FILE}${NC}"
echo ""

# Function to log output
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Function to check and report
check() {
    local description="$1"
    local command="$2"
    local expected="$3"

    echo -e "${BLUE}🔍 Checking: ${description}${NC}"
    echo -e "   Command: ${command}"

    if eval "$command" >> "$LOG_FILE" 2>&1; then
        echo -e "   ${GREEN}✅ SUCCESS${NC}"
        if [ -n "$expected" ]; then
            echo -e "   Expected: ${expected}"
        fi
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo -e "   ${YELLOW}   Check log file for details${NC}"
    fi
    echo ""
}

# Function to run diagnostic test
diagnostic_test() {
    local test_name="$1"
    local test_command="$2"

    echo -e "${YELLOW}🧪 Running Test: ${test_name}${NC}"
    echo -e "   Command: ${test_command}"

    if eval "$test_command" >> "$LOG_FILE" 2>&1; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        return 0
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Start diagnostic
log "=== Central-MCP VM Diagnostic Report ==="
log "Date: $(date)"
log "VM IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unknown')"
log ""

# 1. Service Status Check
echo -e "${BLUE}📊 STEP 1: Service Status Analysis${NC}"
echo ""

check "Systemd service status" "systemctl is-active $SERVICE_NAME" "active"
check "Service enabled status" "systemctl is-enabled $SERVICE_NAME" "enabled"
check "Service detailed status" "systemctl status $SERVICE_NAME --no-pager"

# 2. Process Analysis
echo -e "${BLUE}🔍 STEP 2: Process Analysis${NC}"
echo ""

check "Node.js processes running" "pgrep -f node > /dev/null" "Node.js processes found"
check "Central-MCP specific process" "pgrep -f 'PhotonServer\|central-mcp' > /dev/null" "Central-MCP process found"

# Show process details
echo -e "${YELLOW}📋 Process Details:${NC}"
if pgrep -f node > /dev/null; then
    ps aux | grep -E "(node|PhotonServer|central-mcp)" | grep -v grep | tee -a "$LOG_FILE"
else
    echo "   ${RED}No Node.js processes found${NC}"
fi
echo ""

# 3. Port Analysis
echo -e "${BLUE}🌐 STEP 3: Port Binding Analysis${NC}"
echo ""

check "Port 3000 listening" "netstat -tlnp | grep :3000 > /dev/null" "Port 3000 bound"
check "Port 8080 listening" "netstat -tlnp | grep :8080 > /dev/null" "Port 8080 bound"

# Show port details
echo -e "${YELLOW}📋 Port Usage:${NC}"
netstat -tlnp 2>/dev/null | grep -E ":(3000|8080|3002)" | tee -a "$LOG_FILE" || echo "   No relevant ports found"
echo ""

# 4. File System Analysis
echo -e "${BLUE}📁 STEP 4: File System Analysis${NC}"
echo ""

check "Service directory exists" "test -d $VM_PATH" "Directory found"
check "Package.json exists" "test -f $VM_PATH/package.json" "Package.json found"
check "Distribution directory exists" "test -d $VM_PATH/dist" "dist/ directory found"
check "PhotonServer.js exists" "test -f $VM_PATH/dist/photon/PhotonServer.js" "PhotonServer.js found"

# Show file details
echo -e "${YELLOW}📋 Directory Structure:${NC}"
if [ -d "$VM_PATH" ]; then
    ls -la "$VM_PATH/" | head -20 | tee -a "$LOG_FILE"
    echo ""
    echo -e "${YELLOW}📋 dist/ Contents:${NC}"
    ls -la "$VM_PATH/dist/" | head -10 | tee -a "$LOG_FILE" 2>/dev/null || echo "   No dist directory"
    echo ""
    echo -e "${YELLOW}📋 photon/ Contents:${NC}"
    ls -la "$VM_PATH/dist/photon/" | head -10 | tee -a "$LOG_FILE" 2>/dev/null || echo "   No photon directory"
fi
echo ""

# 5. Environment Variable Analysis
echo -e "${BLUE}⚙️  STEP 5: Environment Variables${NC}"
echo ""

check ".env.production exists" "test -f $VM_PATH/.env.production" "Environment file found"
check "PHOTON_PORT configured" "grep -q 'PHOTON_PORT=' $VM_PATH/.env.production" "PHOTON_PORT set"

# Show environment details
echo -e "${YELLOW}📋 Environment Variables:${NC}"
if [ -f "$VM_PATH/.env.production" ]; then
    grep -E "^(PHOTON_|NODE_)" "$VM_PATH/.env.production" | tee -a "$LOG_FILE"
else
    echo "   ${RED}No .env.production file found${NC}"
fi
echo ""

# 6. Dependency Analysis
echo -e "${BLUE}📦 STEP 6: Dependency Analysis${NC}"
echo ""

check "node_modules exists" "test -d $VM_PATH/node_modules" "Dependencies installed"
check "Photon dependencies installed" "test -d $VM_PATH/node_modules/photon" "Photon modules found" 2>/dev/null || true

# Show dependency details
echo -e "${YELLOW}📋 Package Information:${NC}"
if [ -f "$VM_PATH/package.json" ]; then
    echo "   Main file: $(grep -o '"main": "[^"]*"' "$VM_PATH/package.json" | cut -d'"' -f4)"
    echo "   Package name: $(grep -o '"name": "[^"]*"' "$VM_PATH/package.json" | cut -d'"' -f4)"
fi

if [ -d "$VM_PATH/node_modules" ]; then
    echo "   Dependencies count: $(ls -1 "$VM_PATH/node_modules" | wc -l)"
fi
echo ""

# 7. Build Analysis
echo -e "${BLUE}🔨 STEP 7: Build Analysis${NC}"
echo ""

check "Build can run" "cd $VM_PATH && npm run build > /dev/null 2>&1" "Build succeeds"

# Try to build and show errors
echo -e "${YELLOW}🧪 Attempting Build:${NC}"
cd "$VM_PATH"
if npm run build >> "$LOG_FILE" 2>&1; then
    echo -e "   ${GREEN}✅ Build successful${NC}"
else
    echo -e "   ${RED}❌ Build failed${NC}"
    echo -e "   ${YELLOW}   Check log file for build errors${NC}"
fi
echo ""

# 8. Manual Start Test
echo -e "${BLUE}🚀 STEP 8: Manual Start Test${NC}"
echo ""

echo -e "${YELLOW}🧪 Attempting Manual Start:${NC}"
cd "$VM_PATH"

# Try manual start with error capture
timeout 10s node dist/photon/PhotonServer.js >> "$LOG_FILE" 2>&1 &
MANUAL_PID=$!
sleep 5

if kill -0 $MANUAL_PID 2>/dev/null; then
    echo -e "   ${GREEN}✅ Manual start successful (PID: $MANUAL_PID)${NC}"
    kill $MANUAL_PID 2>/dev/null || true
    wait $MANUAL_PID 2>/dev/null || true
else
    echo -e "   ${RED}❌ Manual start failed${NC}"
    echo -e "   ${YELLOW}   Check log file for startup errors${NC}"
fi
echo ""

# 9. Log Analysis
echo -e "${BLUE}📋 STEP 9: Log Analysis${NC}"
echo ""

check "Journalctl has recent entries" "journalctl -u $SERVICE_NAME --since '1 hour ago' | grep -q .'" "Recent logs found"

# Show recent errors
echo -e "${YELLOW}📋 Recent Service Logs (last 20 lines):${NC}"
journalctl -u $SERVICE_NAME --no-pager -n 20 2>/dev/null | tail -20 | tee -a "$LOG_FILE" || echo "   No logs available"
echo ""

# 10. Health Check
echo -e "${BLUE}🏥 STEP 10: Health Check${NC}"
echo ""

diagnostic_test "HTTP Health Check on port 3000" "curl -s http://localhost:3000/health > /dev/null"
diagnostic_test "HTTP Health Check on port 8080" "curl -s http://localhost:8080/health > /dev/null"

# Try both ports
echo -e "${YELLOW}🧪 Testing Health Endpoints:${NC}"
for port in 3000 8080; do
    if curl -s "http://localhost:$port/health" 2>/dev/null | grep -q "health\|status"; then
        echo -e "   ${GREEN}✅ Health endpoint responding on port $port${NC}"
        curl -s "http://localhost:$port/health" 2>/dev/null | tee -a "$LOG_FILE"
    else
        echo -e "   ${RED}❌ No response on port $port${NC}"
    fi
done
echo ""

# 11. Git Repository Analysis
echo -e "${BLUE}🔍 STEP 11: Git Repository Analysis${NC}"
echo ""

check "Git repository exists" "cd $VM_PATH && git rev-parse --git-dir > /dev/null 2>&1" "Git repository found"

if [ -d "$VM_PATH/.git" ]; then
    echo -e "${YELLOW}📋 Git Information:${NC}"
    cd "$VM_PATH"
    echo "   Current commit: $(git rev-parse HEAD 2>/dev/null || echo 'Unknown')"
    echo "   Current branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
    echo "   Last commit: $(git log -1 --oneline 2>/dev/null || echo 'No commits')"
    echo "   Status: $(git status --porcelain 2>/dev/null | wc -l) files changed"
fi
echo ""

# 12. System Resource Analysis
echo -e "${BLUE}💾 STEP 12: System Resources${NC}"
echo ""

check "Available disk space" "df -h $VM_PATH | grep -v '^Filesystem' | awk '{print \$4}' | grep -q '[0-9]'"

echo -e "${YELLOW}📋 System Resources:${NC}"
echo "   Disk usage: $(df -h $VM_PATH | tail -1)"
echo "   Memory usage: $(free -h | grep Mem)"
echo "   Load average: $(uptime)"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DIAGNOSTIC SUMMARY                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Analyze results and provide diagnosis
echo -e "${GREEN}🎯 Most Likely Root Cause:${NC}"

# Check for specific failure patterns
if journalctl -u $SERVICE_NAME --since '1 hour ago' 2>/dev/null | grep -qi "error\|failed\|exception"; then
    echo -e "   ${RED}❌ Service logs show errors - check journalctl -u $SERVICE_NAME${NC}"
fi

if [ ! -f "$VM_PATH/dist/photon/PhotonServer.js" ]; then
    echo -e "   ${RED}❌ Missing compiled PhotonServer.js - build failed${NC}"
fi

if ! cd "$VM_PATH" && npm run build > /dev/null 2>&1; then
    echo -e "   ${RED}❌ Build fails - TypeScript compilation errors${NC}"
fi

if [ ! -f "$VM_PATH/.env.production" ]; then
    echo -e "   ${RED}❌ Missing .env.production file${NC}"
fi

if ! netstat -tlnp 2>/dev/null | grep -E ":(3000|8080)" > /dev/null; then
    echo -e "   ${RED}❌ Service not listening on expected ports${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Complete diagnostic log saved to: ${LOG_FILE}${NC}"
echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo "   1. Review the diagnostic log for specific errors"
echo "   2. Check the recommended fixes in VM_FIX_PROCEDURE.md"
echo "   3. Apply the fix that matches your root cause"
echo "   4. Verify service restarts successfully"
echo ""

# Exit with error code if issues found
if journalctl -u $SERVICE_NAME --since '1 hour ago' 2>/dev/null | grep -qi "error\|failed"; then
    exit 1
fi

exit 0