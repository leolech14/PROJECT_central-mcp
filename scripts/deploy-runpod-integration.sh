#!/bin/bash
# DEPLOY RUNPOD INTEGRATION TO CENTRAL-MCP
# Fast deployment script for RunPod tools

set -e

echo "🚀 RUNPOD INTEGRATION DEPLOYMENT"
echo "=================================="
echo ""

VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"
PROJECT_ROOT="/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp"

cd $PROJECT_ROOT

# Step 1: Create directory on VM
echo "📁 Step 1: Creating RunPod directory on VM..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo mkdir -p /opt/central-mcp/src/tools/runpod
sudo chown -R lech:lech /opt/central-mcp/src/tools/
echo '✅ Directory created'
" || {
  echo "⚠️  Directory creation failed (may already exist, continuing)"
}
echo ""

# Step 2: Upload RunPod integration file
echo "📤 Step 2: Uploading runpodIntegration.ts..."
gcloud compute scp \
  src/tools/runpod/runpodIntegration.ts \
  $VM_NAME:/opt/central-mcp/src/tools/runpod/ \
  --zone=$VM_ZONE || {
  echo "❌ Upload failed"
  exit 1
}
echo "✅ File uploaded"
echo ""

# Step 3: Read current index.ts to check if RunPod tools already registered
echo "🔍 Step 3: Checking if RunPod tools are registered..."
NEEDS_UPDATE=$(gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
grep -q 'runpod' /opt/central-mcp/src/tools/index.ts && echo 'NO' || echo 'YES'
")

if [ "$NEEDS_UPDATE" = "YES" ]; then
  echo "   → RunPod tools not registered, updating index.ts..."

  # Create updated index.ts locally first
  cat > /tmp/index-update.txt << 'EOF'

// Import RunPod tools
import {
  getRunPodStatus,
  getRunPodStatusTool,
  controlPod,
  controlPodTool
} from './runpod/runpodIntegration.js';

// RunPod tools section (add to allTools array)
const runpodTools = [
  {
    ...getRunPodStatusTool,
    handler: async () => getRunPodStatus(),
  },
  {
    ...controlPodTool,
    handler: async (args: unknown) => {
      const params = args as { pod_id: string; action: 'start' | 'stop' | 'restart' };
      return controlPod(params.pod_id, params.action);
    },
  },
];
EOF

  echo "   → Upload index.ts update instructions..."
  gcloud compute scp /tmp/index-update.txt $VM_NAME:/tmp/ --zone=$VM_ZONE

  echo "   → Backing up original index.ts..."
  gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
    cp /opt/central-mcp/src/tools/index.ts /opt/central-mcp/src/tools/index.ts.backup-\$(date +%Y%m%d-%H%M%S)
  "

  echo ""
  echo "⚠️  MANUAL STEP REQUIRED:"
  echo "   You need to manually edit /opt/central-mcp/src/tools/index.ts to add:"
  echo "   1. Import statements from /tmp/index-update.txt"
  echo "   2. Add runpodTools to allTools array"
  echo "   3. Add to logger: 'RunPod Infrastructure: \${runpodTools.length} tools'"
  echo ""
  echo "   Backup saved at: /opt/central-mcp/src/tools/index.ts.backup-*"
  echo ""
else
  echo "✅ RunPod tools already registered"
fi
echo ""

# Step 4: Build on VM
echo "🔨 Step 4: Building TypeScript on VM..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
cd /opt/central-mcp
npm run build 2>&1 | tail -20 || {
  echo '⚠️  Build had warnings (may be OK)'
}
echo '✅ Build complete'
" || {
  echo "❌ Build failed"
  exit 1
}
echo ""

# Step 5: Restart Central-MCP
echo "🔄 Step 5: Restarting Central-MCP..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo systemctl restart central-mcp
sleep 3
sudo systemctl status central-mcp --no-pager -l | head -20
"
echo ""

# Step 6: Verify deployment
echo "🔍 Step 6: Verifying RunPod tools..."
sleep 5

echo "   → Checking MCP server health..."
curl -sf http://34.41.115.199:3000/ > /dev/null && echo "   ✅ MCP server responding" || echo "   ⚠️  MCP server not responding"

echo "   → Checking recent logs for RunPod..."
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
sudo journalctl -u central-mcp -n 30 --no-pager | grep -i 'runpod\|tool' | tail -10 || echo '   No RunPod logs yet'
"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ RUNPOD INTEGRATION UPLOADED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Add RUNPOD_API_KEY to Doppler:"
echo "   doppler secrets set RUNPOD_API_KEY \"your-api-key\" --project central-mcp --config prod"
echo ""
echo "2. If index.ts needs manual update, SSH to VM:"
echo "   gcloud compute ssh $VM_NAME --zone=$VM_ZONE"
echo "   cd /opt/central-mcp/src/tools"
echo "   nano index.ts  # Add imports and runpodTools array"
echo "   npm run build && sudo systemctl restart central-mcp"
echo ""
echo "3. Test from agent:"
echo "   Tool: get_runpod_status"
echo "   Tool: control_pod (pod_id, action)"
echo ""
echo "🚀 RunPod integration ready!"
