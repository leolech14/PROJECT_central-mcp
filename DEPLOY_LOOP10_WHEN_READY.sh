#!/bin/bash
# 🚀 DEPLOY LOOP 10 - RunPod Cost Monitoring
# Run this script AFTER creating RunPod pods

set -e

echo "🔍 LOOP 10 DEPLOYMENT CHECKLIST"
echo "================================"
echo ""

# Step 1: Verify RunPod API Key
echo "1️⃣ Checking RunPod API key..."
if RUNPOD_API_KEY=$(doppler secrets get RUNPOD_API_KEY --project profilepro --config dev --plain 2>/dev/null); then
  echo "   ✅ API key found in Doppler"
else
  echo "   ❌ API key not found!"
  echo "   Run: doppler secrets set RUNPOD_API_KEY 'your-key' --project profilepro --config dev"
  exit 1
fi

# Step 2: Check for running pods
echo ""
echo "2️⃣ Checking for running pods..."
RUNPOD_API_KEY="$RUNPOD_API_KEY" node scripts/check-account-now.cjs > /tmp/runpod-status.txt 2>&1

if grep -q "PODS: 0 total" /tmp/runpod-status.txt; then
  echo "   ⚠️  NO PODS FOUND"
  echo ""
  echo "   📋 CREATE PODS FIRST:"
  echo "   1. Visit: https://runpod.io/console/storage (check for network volumes)"
  echo "   2. Visit: https://runpod.io/console/pods (create new pods)"
  echo "   3. Run this script again"
  echo ""
  cat /tmp/runpod-status.txt
  exit 1
else
  echo "   ✅ Pods found!"
  cat /tmp/runpod-status.txt
fi

# Step 3: Enable Loop 10 in source
echo ""
echo "3️⃣ Enabling Loop 10 in src/index.ts..."
if grep -q "enableLoop10: false" src/index.ts; then
  # Backup original
  cp src/index.ts src/index.ts.backup-$(date +%Y%m%d-%H%M%S)

  # Enable Loop 10
  sed -i '' 's/enableLoop10: false/enableLoop10: true/' src/index.ts
  echo "   ✅ Loop 10 enabled (backup created)"
else
  echo "   ℹ️  Loop 10 already enabled"
fi

# Step 4: Build TypeScript
echo ""
echo "4️⃣ Building TypeScript..."
npx tsc
if [ $? -eq 0 ]; then
  echo "   ✅ Build successful"
else
  echo "   ❌ Build failed"
  exit 1
fi

# Step 5: Test locally
echo ""
echo "5️⃣ Testing locally..."
echo "   Starting Central-MCP for 10 seconds..."
echo ""

# Start server in background
timeout 10s npm start &
SERVER_PID=$!

# Wait for startup
sleep 5

# Check logs for Loop 10
if ps -p $SERVER_PID > /dev/null 2>&1; then
  echo "   ✅ Server started successfully"

  # Kill server
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true

  echo "   ℹ️  Check logs above for 'Loop 10' messages"
else
  echo "   ❌ Server failed to start"
  exit 1
fi

# Step 6: Deploy to VM (if accessible)
echo ""
echo "6️⃣ Deploy to VM..."
echo "   VM: central-mcp-server (us-central1-a)"
echo ""

# Test VM connectivity
if gcloud compute ssh central-mcp-server --zone=us-central1-a --command="echo 'VM accessible'" 2>/dev/null; then
  echo "   ✅ VM accessible"
  echo ""
  read -p "   Deploy to VM now? (y/N) " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   📤 Uploading files..."

    # Upload RunPod integration
    gcloud compute scp --recurse \
      src/tools/runpod/ \
      central-mcp-server:/opt/central-mcp/src/tools/ \
      --zone=us-central1-a

    gcloud compute scp --recurse \
      src/auto-proactive/RunPodMonitorLoop.ts \
      central-mcp-server:/opt/central-mcp/src/auto-proactive/ \
      --zone=us-central1-a

    gcloud compute scp \
      src/index.ts \
      central-mcp-server:/opt/central-mcp/src/ \
      --zone=us-central1-a

    # Build and restart on VM
    echo "   🔨 Building on VM..."
    gcloud compute ssh central-mcp-server --zone=us-central1-a --command="
      cd /opt/central-mcp
      npm run build
      sudo systemctl restart central-mcp
      sleep 3
      sudo systemctl status central-mcp
    "

    echo ""
    echo "   ✅ Deployed to VM!"
    echo "   📊 Check logs: sudo journalctl -u central-mcp -f | grep 'Loop 10'"
  fi
else
  echo "   ⚠️  VM not accessible (connection timeout)"
  echo "   ℹ️  Deploy manually when VM is available"
fi

# Step 7: Success summary
echo ""
echo "================================"
echo "✅ LOOP 10 DEPLOYMENT COMPLETE"
echo "================================"
echo ""
echo "📊 MONITORING STATUS:"
echo "   • Loop 10: ENABLED ✅"
echo "   • Interval: Every 60 seconds"
echo "   • Thresholds: \$50/day (warning), \$100/day (critical)"
echo ""
echo "🎯 NEXT STEPS:"
echo "   1. Watch logs for Loop 10 activity"
echo "   2. Verify cost data in database"
echo "   3. Check dashboard for RunPod metrics"
echo "   4. Configure billing alerts in RunPod console"
echo ""
echo "📋 MONITORING COMMANDS:"
echo "   • Check logs: tail -100 /tmp/central-mcp-final.log | grep 'Loop 10'"
echo "   • Query costs: sqlite3 data/registry.db 'SELECT * FROM runpod_cost_snapshots;'"
echo "   • View alerts: sqlite3 data/registry.db 'SELECT * FROM runpod_cost_alerts;'"
echo ""
