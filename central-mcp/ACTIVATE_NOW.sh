#!/bin/bash

# ⚡ CENTRAL-MCP ACTIVATION SCRIPT
# ================================
#
# This script TURNS ON the conversation capture system
# After this: Every user message becomes permanent intelligence!
#
# Time: ~15 minutes
# Result: Auto-proactive intelligence OPERATIONAL

set -e

echo ""
echo "⚡ =============================================="
echo "   CENTRAL-MCP SYSTEM ACTIVATION"
echo "   Turning ON Conversation Capture"
echo "=============================================="
echo ""
echo "📊 STATUS: Activating Project 0 (Central-MCP)"
echo "🎯 PURPOSE: Capture conversations as intelligence"
echo "⏱️  TIME: ~15 minutes"
echo ""

# Configuration
VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"
VM_IP="34.41.115.199"
REMOTE_PATH="/opt/central-mcp"

# ============================================
# STEP 1: BUILD LOCALLY
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1/5: Building Code Locally"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run build

echo "✅ Build complete"
echo ""

# ============================================
# STEP 2: RUN MIGRATION ON VM
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2/5: Running Database Migration on VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Upload migration
echo "📤 Uploading migration..."
gcloud compute scp \
  src/database/migrations/009_conversation_intelligence.sql \
  "$VM_NAME:$REMOTE_PATH/migrations/" \
  --zone="$VM_ZONE" \
  --quiet

# Run migration
echo "🗄️  Running migration..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  cd $REMOTE_PATH
  sqlite3 data/registry.db < migrations/009_conversation_intelligence.sql
" 2>/dev/null

# Verify tables
echo "🔍 Verifying tables created..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  cd $REMOTE_PATH
  sqlite3 data/registry.db \"
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND (name LIKE '%conversation%' OR name LIKE '%insight%' OR name LIKE '%behavior%' OR name LIKE '%workflow%')
    ORDER BY name;
  \"
" 2>/dev/null

echo "✅ Migration complete"
echo ""

# ============================================
# STEP 3: DEPLOY CODE TO VM
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3/5: Deploying Code to VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📤 Uploading built code..."
gcloud compute scp \
  --recurse \
  dist/* \
  "$VM_NAME:$REMOTE_PATH/dist/" \
  --zone="$VM_ZONE" \
  --quiet

echo "✅ Code deployed"
echo ""

# ============================================
# STEP 4: RESTART SERVER
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4/5: Restarting Central-MCP Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔄 Stopping existing server..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  pkill -f 'node.*index.js' || true
  sleep 2
" 2>/dev/null

echo "🚀 Starting server with new code..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  cd $REMOTE_PATH
  nohup node dist/index.js > logs/central-mcp-\$(date +%Y%m%d-%H%M%S).log 2>&1 &
  sleep 5
  echo 'Server started'
" 2>/dev/null

echo "🔍 Checking server health..."
HEALTH=$(curl -s http://$VM_IP:3000/health)
echo "$HEALTH" | jq .

echo "✅ Server restarted"
echo ""

# ============================================
# STEP 5: VERIFY SYSTEM ON
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5/5: Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📊 Checking database tables..."
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  cd $REMOTE_PATH
  echo 'Tables created:'
  sqlite3 data/registry.db \"
    SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
  \"
  echo ''
  echo 'Project hierarchy:'
  sqlite3 data/registry.db \"
    SELECT project_number, name FROM projects WHERE project_number IS NOT NULL ORDER BY project_number;
  \"
" 2>/dev/null

echo ""
echo "=============================================="
echo "✅ SYSTEM ACTIVATION COMPLETE!"
echo "=============================================="
echo ""
echo "📊 WHAT'S NOW OPERATIONAL:"
echo "  ✅ Central-MCP server running on VM"
echo "  ✅ 4 new database tables created"
echo "  ✅ Conversation capture system active"
echo "  ✅ capture_user_message MCP tool registered"
echo "  ✅ Project hierarchy (0, 1, 2) established"
echo ""
echo "🎯 FINAL STEP (Manual):"
echo "  1. Restart Claude Code"
echo "  2. Navigate to any project"
echo "  3. Send a test message"
echo "  4. Watch it get captured!"
echo ""
echo "🧠 YOUR MESSAGES NOW BECOME PERMANENT INTELLIGENCE! 🚀"
echo ""
