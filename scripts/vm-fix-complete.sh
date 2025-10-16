#!/bin/bash
# 🔧 VM CENTRAL-MCP FIX - COMPLETE DIAGNOSTIC & REPAIR
# Execute on VM as user lech
# Purpose: Fix service crash, collect evidence, verify success
# Date: 2025-10-16

set -e  # Exit on error (we want to stop if something fails)

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║          VM CENTRAL-MCP DIAGNOSTIC & REPAIR PROCEDURE             ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 0) GUARDRAILS - Create evidence folder, no regrets
# ============================================================================
echo "📁 STEP 0: Creating evidence folder..."
mkdir -p ~/vm_diag
date | tee -a ~/vm_diag/00_context.txt
hostnamectl | tee -a ~/vm_diag/00_context.txt
echo "✅ Evidence folder: ~/vm_diag/"
echo ""

# ============================================================================
# 1) COLLECT TRUTH - Stop churn, understand current state
# ============================================================================
echo "🔍 STEP 1: Collecting diagnostic information..."
echo ""

# A. Service status + recent logs
echo "1A. Service status..."
sudo systemctl status central-mcp --no-pager -l | tee -a ~/vm_diag/01_status.txt
echo ""

echo "1B. Service logs (last 200 lines)..."
sudo journalctl -u central-mcp -n 200 --no-pager | tee -a ~/vm_diag/02_journal.txt
echo ""

# B. Unit file & environment
echo "1C. Systemd unit file..."
sudo cat /etc/systemd/system/central-mcp.service 2>/dev/null | tee -a ~/vm_diag/03_unit.txt || echo "No service file found!" | tee -a ~/vm_diag/03_unit.txt
echo ""

echo "1D. Analyzing unit file..."
egrep -n 'ExecStart|WorkingDirectory|User|Environment(File)?' ~/vm_diag/03_unit.txt | tee -a ~/vm_diag/03_unit_analysis.txt
echo ""

# C. Code location & revision
echo "1E. Code directory listing..."
ls -la /opt/central-mcp | tee -a ~/vm_diag/04_opt_ls.txt
echo ""

echo "1F. Git status..."
cd /opt/central-mcp && (git rev-parse --short HEAD; git status -s) | tee -a ~/vm_diag/05_git.txt
cd ~
echo ""

# D. Runtime pre-requisites
echo "1G. Node.js version..."
node --version 2>&1 | tee -a ~/vm_diag/06_node.txt || which node | tee -a ~/vm_diag/06_node.txt
which npm | tee -a ~/vm_diag/06_node.txt
echo ""

echo "1H. Disk space..."
df -h /opt | tee -a ~/vm_diag/07_disk.txt
echo ""

echo "1I. Memory..."
free -h | tee -a ~/vm_diag/08_mem.txt
echo ""

# E. Build & env presence
echo "1J. Package.json analysis..."
test -f /opt/central-mcp/package.json && jq -r '.main,.scripts.start,.engines.node? // empty' /opt/central-mcp/package.json 2>/dev/null | tee -a ~/vm_diag/09_pkg_json.txt || echo "package.json not found!" | tee -a ~/vm_diag/09_pkg_json.txt
echo ""

echo "1K. Build output check..."
ls -la /opt/central-mcp/dist 2>/dev/null | tee -a ~/vm_diag/10_build_ls.txt || echo "No dist/ directory" | tee -a ~/vm_diag/10_build_ls.txt
ls -la /opt/central-mcp/dist/photon 2>/dev/null | tee -a ~/vm_diag/10_build_ls.txt || echo "No dist/photon/ directory" | tee -a ~/vm_diag/10_build_ls.txt
echo ""

echo "1L. Environment files..."
ls -la /opt/central-mcp/.env* 2>/dev/null | tee -a ~/vm_diag/11_env_ls.txt || echo "No .env files" | tee -a ~/vm_diag/11_env_ls.txt
echo ""

echo "✅ STEP 1 COMPLETE: All diagnostic data collected in ~/vm_diag/"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 2) FIX THE ROOT CAUSE - Safe & idempotent
# ============================================================================
echo "🔧 STEP 2: Applying fixes..."
echo ""

# 2.1 Ensure minimal env + directories
echo "2.1. Creating .env file if missing..."
cd /opt/central-mcp

if [ ! -f .env ] && [ -f .env.example ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env | tee -a ~/vm_diag/12_env_created.txt
    echo "✅ .env created"
else
    echo "✅ .env already exists or no .env.example available"
fi

# Add required minimums (idempotent - won't overwrite)
grep -q '^PORT=' .env || echo 'PORT=3000' | sudo tee -a .env
grep -q '^NODE_ENV=' .env || echo 'NODE_ENV=production' | sudo tee -a .env
grep -q '^DATABASE_PATH=' .env || echo 'DATABASE_PATH=./data/registry.db' | sudo tee -a .env

echo "✅ Environment variables ensured"
echo ""

# Create data directory
echo "2.2. Creating data directory..."
mkdir -p data
sudo chown -R lech:lech data
echo "✅ Data directory ready"
echo ""

# 2.2 Install deps & build
echo "2.3. Installing dependencies..."
cd /opt/central-mcp

if [ -f package-lock.json ]; then
    echo "Running npm ci (clean install)..."
    sudo npm ci 2>&1 | tee -a ~/vm_diag/13_npm.txt
else
    echo "Running npm install..."
    sudo npm install 2>&1 | tee -a ~/vm_diag/13_npm.txt
fi
echo "✅ Dependencies installed"
echo ""

echo "2.4. Building application..."
sudo npm run build 2>&1 | tee -a ~/vm_diag/14_build.txt

# Verify entry point exists
if [ -f dist/photon/PhotonServer.js ]; then
    echo "✅ Build successful - entry point exists: dist/photon/PhotonServer.js" | tee -a ~/vm_diag/14_build.txt
else
    echo "⚠️  Entry point not found - checking for alternative locations..." | tee -a ~/vm_diag/14_build.txt
    find dist -name "*.js" -type f | head -10 | tee -a ~/vm_diag/14_build.txt
fi
echo ""

# 2.3 Update systemd service file
echo "2.5. Updating systemd service file..."

# Backup current service file
sudo cp /etc/systemd/system/central-mcp.service /etc/systemd/system/central-mcp.service.bak.$(date +%s) 2>/dev/null || echo "No existing service file to backup"

# Create robust service file that uses npm start
sudo tee /etc/systemd/system/central-mcp.service >/dev/null <<'EOF'
[Unit]
Description=Central-MCP PHOTON Operations Center
After=network.target

[Service]
Type=simple
User=lech
WorkingDirectory=/opt/central-mcp
EnvironmentFile=/opt/central-mcp/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StartLimitBurst=5
StartLimitIntervalSec=60
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service file updated"
cat /etc/systemd/system/central-mcp.service | tee -a ~/vm_diag/15_new_unit.txt
echo ""

# Reload systemd
echo "2.6. Reloading systemd..."
sudo systemctl daemon-reload
echo "✅ Systemd reloaded"
echo ""

# ============================================================================
# 3) RESTART & VALIDATE
# ============================================================================
echo "🔄 STEP 3: Restarting service..."
echo ""

sudo systemctl restart central-mcp

echo "Waiting 5 seconds for service to stabilize..."
sleep 5

# Check status
echo "3.1. Service status after restart..."
sudo systemctl status central-mcp --no-pager -l | tee -a ~/vm_diag/16_post_restart_status.txt
echo ""

# ============================================================================
# 3.1) IF STILL CRASHES - Foreground run
# ============================================================================
if ! sudo systemctl is-active --quiet central-mcp; then
    echo "⚠️  Service still not running - attempting manual foreground start..."
    echo ""
    echo "3.2. Manual foreground run (to see exact error)..."

    sudo systemctl stop central-mcp
    cd /opt/central-mcp

    echo "Starting Node.js manually (will show exact error):"
    echo "Command: node dist/photon/PhotonServer.js"
    echo ""

    timeout 10 node dist/photon/PhotonServer.js 2>&1 | tee -a ~/vm_diag/17_fg_run.txt || true

    echo ""
    echo "⚠️  Manual run completed (check ~/vm_diag/17_fg_run.txt for errors)"
    echo ""
fi

# ============================================================================
# 4) POST-FIX VALIDATION
# ============================================================================
echo "✅ STEP 4: Validating service health..."
echo ""

# A. Health endpoint
echo "4.1. Testing health endpoint..."
curl -sf http://localhost:3000/health 2>&1 | tee -a ~/vm_diag/18_health.txt && echo "✅ Health endpoint OK" || echo "❌ Health endpoint not responding"
echo ""

# B. Knowledge API
echo "4.2. Testing knowledge API..."
curl -sf http://localhost:3000/api/knowledge/space 2>&1 | head -200 | tee -a ~/vm_diag/19_knowledge_space.txt && echo "✅ Knowledge API OK" || echo "❌ Knowledge API not responding"

# Check if our new pack appears
grep -i "claude-code-architecture" ~/vm_diag/19_knowledge_space.txt && echo "✅ New knowledge pack detected!" || echo "⚠️  New pack not found (may need sync)"
echo ""

# C. Ports listening
echo "4.3. Checking listening ports..."
sudo ss -ltnp | egrep ':3000|:8000' | tee -a ~/vm_diag/20_ports.txt
echo ""

# D. Enable at boot
echo "4.4. Enabling service at boot..."
sudo systemctl enable central-mcp
echo "✅ Service will start on boot"
echo ""

# ============================================================================
# 5) SUMMARY
# ============================================================================
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                     DIAGNOSTIC SUMMARY                                ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

if sudo systemctl is-active --quiet central-mcp; then
    echo "✅ SUCCESS: Central-MCP service is RUNNING!"
    echo ""
    echo "Service Status:"
    sudo systemctl status central-mcp --no-pager | head -10
    echo ""
    echo "Health Check:"
    curl -sf http://localhost:3000/health 2>/dev/null && echo "✅ API responding" || echo "⚠️  API not ready yet"
    echo ""
else
    echo "❌ FAILED: Service still not running"
    echo ""
    echo "Next steps:"
    echo "1. Review ~/vm_diag/17_fg_run.txt for exact error"
    echo "2. Check ~/vm_diag/02_journal.txt for service logs"
    echo "3. Paste first 50 lines of both files for diagnosis"
    echo ""
fi

echo "📊 Evidence collected in: ~/vm_diag/"
echo "Files created:"
ls -1 ~/vm_diag/
echo ""

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                     PROCEDURE COMPLETE                                ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
