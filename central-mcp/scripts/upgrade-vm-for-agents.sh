#!/bin/bash
# UPGRADE GCP VM FOR MULTI-AGENT SUPPORT
# Switch from e2-micro (free) to e2-standard (paid) for agent hosting

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🚀 UPGRADE VM FOR MULTI-AGENT SUPPORT                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

VM_NAME="central-mcp-server"
ZONE="us-central1-a"

# Show current specs
echo "📊 Current VM Specs:"
gcloud compute instances describe $VM_NAME --zone=$ZONE --format="table(machineType,status)"
echo ""

# Cost comparison
echo "💰 COST COMPARISON:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Machine Type          | CPUs | RAM   | Agents | Cost/Month"
echo "──────────────────────|------|-------|--------|────────────"
echo "e2-micro (current)    |  1   |  1GB  |  0-1   | $0 (FREE)"
echo "e2-standard-2         |  2   |  8GB  |  2-4   | ~$49"
echo "e2-standard-4 ⭐      |  4   | 16GB  |  4-8   | ~$97"
echo "e2-standard-8         |  8   | 32GB  |  8-12  | ~$194"
echo ""
echo "🎯 RECOMMENDED: e2-standard-4 (4 CPUs, 16GB RAM, 4-8 agents)"
echo ""
echo "💡 RunPod Comparison: 4 agents = $1,843/month"
echo "   GCP VM Savings: $1,746/month (95% cheaper!)"
echo ""

# Ask for confirmation
echo "Choose machine type:"
echo "  1) e2-standard-2  (2 CPUs,  8GB) - $49/month - Good for 2-4 agents"
echo "  2) e2-standard-4  (4 CPUs, 16GB) - $97/month - Great for 4-8 agents ⭐"
echo "  3) e2-standard-8  (8 CPUs, 32GB) - $194/month - Excellent for 8-12 agents"
echo "  4) Cancel"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    MACHINE_TYPE="e2-standard-2"
    ;;
  2)
    MACHINE_TYPE="e2-standard-4"
    ;;
  3)
    MACHINE_TYPE="e2-standard-8"
    ;;
  *)
    echo "Cancelled"
    exit 0
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANT: VM will be STOPPED and RESTARTED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will:"
echo "  1. Stop the VM (Central-MCP will be down)"
echo "  2. Change machine type to $MACHINE_TYPE"
echo "  3. Restart the VM (Central-MCP will restart)"
echo "  4. Downtime: ~2-3 minutes"
echo ""
read -p "Continue? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
  echo "Cancelled"
  exit 0
fi

echo ""
echo "🛑 Step 1: Stopping VM..."
gcloud compute instances stop $VM_NAME --zone=$ZONE

echo ""
echo "🔧 Step 2: Changing machine type to $MACHINE_TYPE..."
gcloud compute instances set-machine-type $VM_NAME \
  --zone=$ZONE \
  --machine-type=$MACHINE_TYPE

echo ""
echo "▶️  Step 3: Starting VM..."
gcloud compute instances start $VM_NAME --zone=$ZONE

echo ""
echo "⏳ Step 4: Waiting for VM to be ready..."
sleep 10

# Wait for SSH
for i in {1..30}; do
  if gcloud compute ssh $VM_NAME --zone=$ZONE --command="echo ready" 2>/dev/null; then
    echo "✅ VM is ready!"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done

echo ""
echo "🔍 Step 5: Verifying Central-MCP..."
sleep 5
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
sudo systemctl status central-mcp --no-pager -l | head -20
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VM UPGRADED SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 New Specs:"
gcloud compute instances describe $VM_NAME --zone=$ZONE \
  --format="table(machineType,status,networkInterfaces[0].accessConfigs[0].natIP)"
echo ""
echo "🔗 Services:"
echo "   Central-MCP: http://34.41.115.199:3000"
echo "   Dashboard:   http://34.41.115.199:8000"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify dashboard: curl http://34.41.115.199:3000/health"
echo "   2. Deploy multi-agent launcher"
echo "   3. Start agents!"
echo ""
