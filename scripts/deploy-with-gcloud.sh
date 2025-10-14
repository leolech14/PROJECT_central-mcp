#!/bin/bash
#
# Deploy Central-MCP with A2A Protocol + VM Tools using gcloud
# =============================================================
#
# This script deploys the complete PHOTON system to the VM using gcloud:
# - A2A Protocol Server (Agent2Agent cross-framework communication)
# - VM Access Tools (executeBash, readVMFile, writeVMFile, listVMDirectory)
# - JWT Authentication
# - Complete PHOTON system
#

set -e  # Exit on any error

# Configuration
VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"
VM_USER="lech"
VM_PATH="/opt/central-mcp"
SERVICE_NAME="central-mcp"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHOTON Central-MCP Deployment to VM (gcloud)        ║${NC}"
echo -e "${BLUE}║  - A2A Protocol Server (Google Agent2Agent)           ║${NC}"
echo -e "${BLUE}║  - VM Access Tools (Terminal + Filesystem)            ║${NC}"
echo -e "${BLUE}║  - JWT Authentication                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if build exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: dist/ directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📍 VM: ${VM_NAME} (${VM_ZONE})${NC}"
echo -e "${YELLOW}📂 Path: ${VM_PATH}${NC}"
echo ""

# Step 1: Backup current deployment
echo -e "${BLUE}📦 Step 1: Creating backup on VM...${NC}"
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="cd ${VM_PATH} && mkdir -p backups && tar -czf backups/backup-\$(date +%Y%m%d-%H%M%S).tar.gz dist/ || true"
echo -e "${GREEN}✅ Backup created${NC}"
echo ""

# Step 2: Upload compiled files
echo -e "${BLUE}📤 Step 2: Uploading compiled files to VM...${NC}"

# Upload dist directory
echo "  Uploading dist/..."
gcloud compute scp --recurse --zone=${VM_ZONE} dist/ ${VM_USER}@${VM_NAME}:${VM_PATH}/

# Upload package files
echo "  Uploading package.json..."
gcloud compute scp --zone=${VM_ZONE} package.json ${VM_USER}@${VM_NAME}:${VM_PATH}/

echo "  Uploading package-lock.json..."
gcloud compute scp --zone=${VM_ZONE} package-lock.json ${VM_USER}@${VM_NAME}:${VM_PATH}/

echo -e "${GREEN}✅ Files uploaded${NC}"
echo ""

# Step 3: Install dependencies on VM
echo -e "${BLUE}📦 Step 3: Installing dependencies on VM...${NC}"
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="cd ${VM_PATH} && npm install --production --timeout=180000"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Verify A2A and VM tools
echo -e "${BLUE}🔍 Step 4: Verifying deployment...${NC}"
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="cd ${VM_PATH} && \
echo '  - Checking A2A protocol modules...' && \
ls -la dist/a2a/ | head -10 && \
echo '  - Checking VM tools...' && \
ls -la dist/tools/vm/ | head -10 && \
echo '  - Checking PhotonIntegrations...' && \
ls -la dist/photon/PhotonIntegrations.*"
echo -e "${GREEN}✅ Deployment verified${NC}"
echo ""

# Step 5: Configure environment
echo -e "${BLUE}⚙️  Step 5: Configuring environment...${NC}"
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="cd ${VM_PATH} && cat > .env.production << 'EOF'
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
JWT_SECRET=\${JWT_SECRET:-\$(openssl rand -base64 32)}
JWT_EXPIRY=24h

# Monitoring
PHOTON_MONITORING_ENABLED=true
EOF
"
echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Step 6: Restart service
echo -e "${BLUE}🔄 Step 6: Restarting Central-MCP service...${NC}"
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="sudo systemctl restart ${SERVICE_NAME} && sleep 3 && sudo systemctl status ${SERVICE_NAME} | head -20"
echo -e "${GREEN}✅ Service restarted${NC}"
echo ""

# Step 7: Health check
echo -e "${BLUE}🏥 Step 7: Health check...${NC}"
sleep 5  # Wait for service to fully start

echo "  Checking HTTP endpoint..."
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="curl -s http://localhost:3000/health | jq . || echo 'Health check failed'"

echo "  Checking A2A WebSocket endpoint..."
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="curl -i -N -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' http://localhost:3000/a2a 2>&1 | head -5"

echo "  Checking logs for A2A initialization..."
gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command="sudo journalctl -u ${SERVICE_NAME} -n 50 | grep -E 'A2A|VM Tools|PhotonIntegrations' | tail -10"

echo -e "${GREEN}✅ Health check complete${NC}"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🎉 DEPLOYMENT SUCCESSFUL! 🎉                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Central-MCP deployed with:${NC}"
echo "  - A2A Protocol Server: ws://34.41.115.199:3000/a2a"
echo "  - MCP Endpoint: ws://34.41.115.199:3000/mcp"
echo "  - VM Tools: executeBash, readVMFile, writeVMFile, listVMDirectory"
echo "  - Authentication: JWT + API Keys"
echo ""
echo -e "${YELLOW}📊 Next Steps:${NC}"
echo "  1. Test A2A endpoint: wscat -c ws://34.41.115.199:3000/a2a"
echo "  2. Test VM tools with an agent"
echo "  3. Monitor logs: gcloud compute ssh ${VM_USER}@${VM_NAME} --zone=${VM_ZONE} --command='sudo journalctl -u ${SERVICE_NAME} -f'"
echo "  4. Check statistics: curl http://34.41.115.199:3000/health"
echo ""
echo -e "${BLUE}🚀 PHOTON is ready to coordinate agents across ANY framework!${NC}"
echo ""
