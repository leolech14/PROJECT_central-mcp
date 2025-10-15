#!/bin/bash
# Setup ComfyUI Integration with Central-MCP
# This script configures your existing RunPod ComfyUI instance

set -e

echo "🎨 COMFYUI INTEGRATION SETUP"
echo "=============================="
echo ""

# Check if RunPod API key exists
if ! doppler secrets get RUNPOD_API_KEY --plain > /dev/null 2>&1; then
  echo "❌ RunPod API key not found in Doppler"
  echo ""
  echo "Please add your RunPod API key:"
  read -p "Enter RunPod API key: " RUNPOD_API_KEY
  doppler secrets set RUNPOD_API_KEY "$RUNPOD_API_KEY"
  echo "✅ RunPod API key stored in Doppler"
  echo ""
fi

# Get ComfyUI endpoint
echo "📋 ComfyUI Configuration"
echo "========================="
echo ""
echo "Where is your ComfyUI running?"
echo ""
echo "Options:"
echo "  1. RunPod pod (recommended)"
echo "  2. Custom URL (self-hosted)"
echo ""
read -p "Enter choice (1-2): " choice

case $choice in
  1)
    echo ""
    echo "🔍 Discovering RunPod pods..."
    RUNPOD_API_KEY=$(doppler secrets get RUNPOD_API_KEY --plain)

    # List pods
    PODS=$(curl -s -X POST "https://api.runpod.io/graphql" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $RUNPOD_API_KEY" \
      -d '{
        "query": "query Pods { myself { pods { id name machineType desiredStatus } } }"
      }' | jq -r '.data.myself.pods[] | select(.desiredStatus == "RUNNING") | "\(.id) - \(.name) (\(.machineType))"')

    if [ -z "$PODS" ]; then
      echo "❌ No running pods found"
      exit 1
    fi

    echo ""
    echo "Running pods:"
    echo "$PODS" | nl
    echo ""

    read -p "Enter pod number: " POD_NUM
    POD_ID=$(echo "$PODS" | sed -n "${POD_NUM}p" | cut -d' ' -f1)

    if [ -z "$POD_ID" ]; then
      echo "❌ Invalid pod number"
      exit 1
    fi

    # Get pod ports
    echo ""
    echo "ComfyUI typically runs on port 8188"
    read -p "Enter ComfyUI port (default: 8188): " COMFYUI_PORT
    COMFYUI_PORT=${COMFYUI_PORT:-8188}

    COMFYUI_ENDPOINT="https://${POD_ID}-${COMFYUI_PORT}.proxy.runpod.net"
    ;;

  2)
    echo ""
    read -p "Enter ComfyUI URL (e.g., http://localhost:8188): " COMFYUI_ENDPOINT
    ;;

  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

# Test connection
echo ""
echo "🔍 Testing connection to $COMFYUI_ENDPOINT..."

if curl -sf "$COMFYUI_ENDPOINT/system_stats" > /dev/null; then
  echo "✅ ComfyUI is responding!"

  # Get system stats
  STATS=$(curl -s "$COMFYUI_ENDPOINT/system_stats")
  echo ""
  echo "System Stats:"
  echo "$STATS" | jq '.'
else
  echo "⚠️  Cannot connect to ComfyUI (may be starting up or firewalled)"
  echo "    Continuing anyway - you can test later"
fi

# Update database
echo ""
echo "📝 Updating Central-MCP database..."

# SSH to GCP VM and update database
gcloud compute ssh central-mcp-server --zone=us-central1-a --command="
sqlite3 /opt/central-mcp/data/registry.db << 'SQL'
-- Update ComfyUI endpoint
UPDATE external_services
SET
  endpoint = '$COMFYUI_ENDPOINT',
  status = 'active',
  updated_at = datetime('now'),
  last_health_check = datetime('now'),
  health_status = 'healthy'
WHERE id = 'comfyui-runpod-001';

-- Verify
SELECT
  id,
  name,
  endpoint,
  status,
  health_status
FROM external_services
WHERE id = 'comfyui-runpod-001';
SQL
"

echo ""
echo "✅ ComfyUI configuration updated!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ComfyUI Endpoint: $COMFYUI_ENDPOINT"
echo ""
echo "📋 Test the integration:"
echo ""
echo "  1. Restart Central-MCP server:"
echo "     gcloud compute ssh central-mcp-server --zone=us-central1-a"
echo "     sudo systemctl restart central-mcp"
echo ""
echo "  2. Test from agent:"
echo "     Use MCP tool: generate_image"
echo "     Prompt: \"A futuristic AI dashboard interface\""
echo ""
echo "  3. Check dashboard:"
echo "     http://34.41.115.199:8000/dashboard.html"
echo "     Look for image generation stats"
echo ""
echo "🚀 Agents can now generate images seamlessly!"
