#!/bin/bash

##############################################################################
# Deploy Backend to Google Cloud VM
# ==================================
#
# Deploys Rules Registry + WebSocket Event Broadcasting to production VM.
#
# Usage: ./scripts/deploy-backend.sh
##############################################################################

set -e  # Exit on error

VM_NAME="central-mcp-server"
ZONE="us-central1-a"
REMOTE_DIR="/opt/central-mcp"
LOCAL_DIR="/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp"

echo ""
echo "🚀 DEPLOYING BACKEND TO GOOGLE CLOUD VM"
echo "========================================"
echo ""
echo "VM: $VM_NAME"
echo "Zone: $ZONE"
echo "Target: $REMOTE_DIR"
echo ""

# Confirm deployment
read -p "Deploy to production VM? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "📦 Step 1: Creating backup on VM..."
echo "------------------------------------"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo cp -r $REMOTE_DIR ${REMOTE_DIR}-backup-\$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
  echo '✅ Backup created'
"

echo ""
echo "📁 Step 2: Creating directories on VM..."
echo "----------------------------------------"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo mkdir -p $REMOTE_DIR/src/events
  sudo mkdir -p $REMOTE_DIR/src/tools/rules
  echo '✅ Directories created'
"

echo ""
echo "📤 Step 3: Uploading new files..."
echo "-----------------------------------"

# Upload new files
gcloud compute scp $LOCAL_DIR/src/registry/RulesRegistry.ts $VM_NAME:$REMOTE_DIR/src/registry/ --zone=$ZONE
gcloud compute scp $LOCAL_DIR/src/events/EventBroadcaster.ts $VM_NAME:$REMOTE_DIR/src/events/ --zone=$ZONE
gcloud compute scp $LOCAL_DIR/src/tools/rules/rulesTools.ts $VM_NAME:$REMOTE_DIR/src/tools/rules/ --zone=$ZONE

echo "✅ New files uploaded"

echo ""
echo "📤 Step 4: Uploading modified files..."
echo "---------------------------------------"

# Upload modified files
gcloud compute scp $LOCAL_DIR/src/registry/TaskRegistry.ts $VM_NAME:$REMOTE_DIR/src/registry/ --zone=$ZONE
gcloud compute scp $LOCAL_DIR/src/tools/index.ts $VM_NAME:$REMOTE_DIR/src/tools/ --zone=$ZONE
gcloud compute scp $LOCAL_DIR/src/tools/claimTask.ts $VM_NAME:$REMOTE_DIR/src/tools/ --zone=$ZONE
gcloud compute scp $LOCAL_DIR/src/tools/updateProgress.ts $VM_NAME:$REMOTE_DIR/src/tools/ --zone=$ZONE
gcloud compute scp $LOCAL_DIR/src/tools/completeTask.ts $VM_NAME:$REMOTE_DIR/src/tools/ --zone=$ZONE

echo "✅ Modified files uploaded"

echo ""
echo "🔧 Step 5: Rebuilding TypeScript..."
echo "------------------------------------"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  cd $REMOTE_DIR
  sudo npm run build 2>&1 | tail -20
"

echo ""
echo "🔄 Step 6: Restarting Central-MCP service..."
echo "---------------------------------------------"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo systemctl stop central-mcp
  sleep 2
  sudo systemctl start central-mcp
  sleep 3
  sudo systemctl status central-mcp --no-pager | head -20
"

echo ""
echo "📊 Step 7: Verifying deployment..."
echo "-----------------------------------"

# Check if service is running
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  echo ''
  echo 'Service Status:'
  sudo systemctl is-active central-mcp

  echo ''
  echo 'Recent Logs:'
  sudo journalctl -u central-mcp -n 30 --no-pager | tail -20

  echo ''
  echo 'Database Check:'
  sqlite3 $REMOTE_DIR/data/registry.db 'SELECT COUNT(*) as rule_count FROM rules;' 2>/dev/null || echo 'Database check skipped'
"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "Next steps:"
echo "1. Test MCP tools: get_rules, create_rule, update_rule, delete_rule"
echo "2. Test Desktop UI: http://34.41.115.199:8000/desktop.html"
echo "3. Verify WebSocket: ws://34.41.115.199:3000/mcp"
echo "4. Monitor logs: gcloud compute ssh $VM_NAME --zone=$ZONE --command='sudo journalctl -u central-mcp -f'"
echo ""
echo "🎉 Real-time coordination system is LIVE!"
echo ""
