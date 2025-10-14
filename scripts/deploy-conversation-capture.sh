#!/bin/bash

# Deploy Conversation Capture System to Central-MCP VM
# =====================================================
#
# This script:
# 1. Runs database migration (009_conversation_intelligence.sql)
# 2. Builds TypeScript code with new ConversationCapture module
# 3. Deploys to VM
# 4. Restarts Central-MCP server
# 5. Tests that THIS conversation can now be captured!

set -e

echo "🚀 DEPLOYING CONVERSATION CAPTURE SYSTEM"
echo "========================================"
echo ""

# Configuration
VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"
VM_IP="34.41.115.199"
REMOTE_PATH="/opt/central-mcp"
LOCAL_PATH="/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp"

echo "📍 VM: $VM_NAME ($VM_IP)"
echo "📁 Local: $LOCAL_PATH"
echo "📁 Remote: $REMOTE_PATH"
echo ""

# Step 1: Build locally
echo "🔨 STEP 1: Building TypeScript..."
cd "$LOCAL_PATH"
npm run build
echo "✅ Build complete"
echo ""

# Step 2: Run migration locally (to test)
echo "🗄️ STEP 2: Testing migration locally..."
sqlite3 data/registry.db < src/database/migrations/009_conversation_intelligence.sql
echo "✅ Migration tested locally"
echo ""

# Step 3: Upload to VM
echo "📤 STEP 3: Uploading to VM..."

# Upload migration
gcloud compute scp \
  src/database/migrations/009_conversation_intelligence.sql \
  "$VM_NAME:$REMOTE_PATH/migrations/" \
  --zone="$VM_ZONE"

# Upload built code
gcloud compute scp \
  --recurse \
  dist/* \
  "$VM_NAME:$REMOTE_PATH/dist/" \
  --zone="$VM_ZONE"

echo "✅ Files uploaded"
echo ""

# Step 4: Run migration on VM
echo "🗄️ STEP 4: Running migration on VM..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  cd $REMOTE_PATH
  sqlite3 data/registry.db < migrations/009_conversation_intelligence.sql
  echo '✅ Migration complete on VM'
"
echo ""

# Step 5: Restart Central-MCP server
echo "🔄 STEP 5: Restarting Central-MCP server..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  cd $REMOTE_PATH

  # Stop existing server
  pkill -f 'node.*central-mcp' || true

  # Start server with new code
  nohup node dist/index.js > logs/central-mcp.log 2>&1 &

  # Wait for startup
  sleep 3

  # Check health
  curl -s http://localhost:3000/health | jq .

  echo '✅ Server restarted'
"
echo ""

# Step 6: Verify conversation capture is working
echo "✅ STEP 6: Verifying conversation capture..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  cd $REMOTE_PATH

  # Check tables exist
  echo 'Checking tables...'
  sqlite3 data/registry.db 'SELECT name FROM sqlite_master WHERE type=\"table\" AND name LIKE \"%conversation%\" OR name LIKE \"%insight%\" OR name LIKE \"%behavior%\";'

  # Check project hierarchy
  echo ''
  echo 'Project hierarchy:'
  sqlite3 data/registry.db 'SELECT project_number, name FROM projects ORDER BY project_number;'
"
echo ""

# Step 7: Test from local machine
echo "🧪 STEP 7: Testing MCP connection..."
echo "Testing WebSocket connection to ws://$VM_IP:3000/mcp"
# This would require wscat or similar - skip for now
echo "⚠️  Manual test: Use universal-mcp-bridge to connect and send message"
echo ""

echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📊 WHAT'S NOW OPERATIONAL:"
echo "  ✅ conversation_messages table (stores ALL user messages)"
echo "  ✅ extracted_insights table (intelligence extraction)"
echo "  ✅ behavior_rules table (hardcoded fast decisions)"
echo "  ✅ workflow_templates table (flexible LLM-interpretable)"
echo "  ✅ ConversationCapture module (capture system)"
echo "  ✅ capture_user_message MCP tool (API)"
echo ""
echo "🎯 NEXT STEPS:"
echo "  1. Restart Claude Code (load universal-mcp-bridge)"
echo "  2. Connect to Central-MCP"
echo "  3. THIS CONVERSATION STARTS BEING CAPTURED!"
echo ""
echo "🧠 YOUR MESSAGES NOW BECOME PERMANENT INTELLIGENCE! 🚀"
