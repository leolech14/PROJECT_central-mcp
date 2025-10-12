#!/bin/bash
##############################################################################
# 🚀 DEPLOY CENTRAL-MCP TO GCLOUD VM
##############################################################################
#
# CRITICAL: Run this BEFORE deploying any dashboards!
# This deploys the latest Central-MCP code with all auto-proactive loops.
#
# VM: central-mcp-server (us-central1-a)
# Database: /opt/central-mcp/data/registry.db
# Service: systemd (central-mcp)
#
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"
VM_USER="lech"
REMOTE_DIR="/opt/central-mcp"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 DEPLOY CENTRAL-MCP TO VM                             ║${NC}"
echo -e "${BLUE}║  Auto-Proactive Intelligence System                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

##############################################################################
# STEP 1: Build Locally (catch errors early)
##############################################################################
echo -e "${YELLOW}📦 Step 1: Building locally to catch errors...${NC}"

npm run build || {
  echo -e "${RED}❌ Local build failed! Fix TypeScript errors first.${NC}"
  exit 1
}

echo -e "${GREEN}   ✅ Local build successful!${NC}"
echo ""

##############################################################################
# STEP 2: Copy Source Code to VM
##############################################################################
echo -e "${YELLOW}📤 Step 2: Copying source code to VM...${NC}"

# Copy all necessary files
gcloud compute scp --recurse \
  src/ \
  package.json \
  package-lock.json \
  tsconfig.json \
  ${VM_USER}@${VM_NAME}:${REMOTE_DIR}/ \
  --zone=${VM_ZONE}

echo -e "${GREEN}   ✅ Source code copied!${NC}"
echo ""

##############################################################################
# STEP 3: Install Dependencies & Build on VM
##############################################################################
echo -e "${YELLOW}🔧 Step 3: Installing dependencies and building on VM...${NC}"

gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command="
  cd ${REMOTE_DIR}
  sudo npm install
  sudo npm run build
"

echo -e "${GREEN}   ✅ Built successfully on VM!${NC}"
echo ""

##############################################################################
# STEP 4: Restart Central-MCP Service
##############################################################################
echo -e "${YELLOW}🔄 Step 4: Restarting Central-MCP service...${NC}"

gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command="
  sudo systemctl restart central-mcp
  sleep 3
  sudo systemctl status central-mcp --no-pager
"

echo -e "${GREEN}   ✅ Service restarted!${NC}"
echo ""

##############################################################################
# STEP 5: Verify Deployment
##############################################################################
echo -e "${YELLOW}✅ Step 5: Verifying deployment...${NC}"

echo "   Waiting 10 seconds for system to initialize..."
sleep 10

# Check database tables
echo "   Checking database schema..."
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command="
  sqlite3 ${REMOTE_DIR}/data/registry.db '.tables' | grep -q 'auto_proactive_logs' && \
    echo '   ✅ Database schema up to date (auto_proactive_logs exists)' || \
    echo '   ⚠️  Warning: auto_proactive_logs table not found'
"

# Check if loops are running
echo "   Checking auto-proactive loops..."
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command="
  sudo journalctl -u central-mcp --since '1 minute ago' | grep -q 'Loop.*executing' && \
    echo '   ✅ Auto-proactive loops are running' || \
    echo '   ⚠️  Warning: No loop execution detected in logs'
"

echo ""

##############################################################################
# SUCCESS!
##############################################################################
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DEPLOYMENT COMPLETE!                                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 View logs:${NC}"
echo -e "   gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command='sudo journalctl -u central-mcp -f'"
echo ""
echo -e "${BLUE}🔍 Check database:${NC}"
echo -e "   gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command='sqlite3 ${REMOTE_DIR}/data/registry.db \"SELECT COUNT(*) FROM auto_proactive_logs;\"'"
echo ""
echo -e "${BLUE}🎯 Next step:${NC}"
echo -e "   Now you can deploy dashboards! They will connect to the updated Central-MCP."
echo ""
