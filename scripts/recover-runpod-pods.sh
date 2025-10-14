#!/bin/bash
# RUNPOD ACCOUNT RECOVERY & STATUS CHECK
# Check account status, billing, and attempt pod recovery

set -e

echo "🔍 RUNPOD ACCOUNT RECOVERY CHECK"
echo "=================================="
echo ""

# Get RunPod API key
RUNPOD_API_KEY=$(doppler secrets get RUNPOD_API_KEY --project central-mcp --config dev --plain 2>/dev/null || echo "")

if [ -z "$RUNPOD_API_KEY" ]; then
  echo "❌ RUNPOD_API_KEY not found in Doppler"
  echo ""
  echo "Add it with:"
  echo "  doppler secrets set RUNPOD_API_KEY \"your-key\" --project central-mcp --config dev"
  exit 1
fi

echo "✅ RunPod API key found"
echo ""

# Check account status
echo "💰 Step 1: Checking account balance..."
ACCOUNT_INFO=$(curl -s -X POST "https://api.runpod.io/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "query { myself { id email creditBalance totalSpent } }"
  }')

echo "$ACCOUNT_INFO" | jq '.data.myself // .errors' || echo "Failed to parse response"
echo ""

# Check all pods (including terminated)
echo "🔍 Step 2: Checking all pods (including terminated)..."
ALL_PODS=$(curl -s -X POST "https://api.runpod.io/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "query { myself { pods { id name desiredStatus costPerHr machineType runtime { uptimeInSeconds } } } }"
  }')

echo "$ALL_PODS" | jq '.data.myself.pods // .errors' || echo "Failed to parse response"
echo ""

# Check spending history
echo "💳 Step 3: Checking recent charges..."
CHARGES=$(curl -s -X POST "https://api.runpod.io/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "query { myself { charges(limit: 10) { amount timestamp description } } }"
  }')

echo "$CHARGES" | jq '.data.myself.charges // .errors' || echo "Failed to parse response"
echo ""

# Save results to file
echo "$ACCOUNT_INFO" > /tmp/runpod-account.json
echo "$ALL_PODS" > /tmp/runpod-pods.json
echo "$CHARGES" > /tmp/runpod-charges.json

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RECOVERY STATUS SAVED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Files saved to:"
echo "  - /tmp/runpod-account.json (account details)"
echo "  - /tmp/runpod-pods.json (all pods)"
echo "  - /tmp/runpod-charges.json (recent charges)"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Check account balance above"
echo "2. If pods are stopped (not terminated), they can be restarted"
echo "3. If pods are terminated, you'll need to create new ones"
echo "4. Add funds if balance is low"
echo ""
echo "To restart a stopped pod:"
echo "  curl -X POST \"https://api.runpod.io/v2/POD_ID/start\" \\"
echo "    -H \"Authorization: Bearer \$RUNPOD_API_KEY\""
echo ""
echo "To create new pod:"
echo "  Visit: https://runpod.io/console/pods"
echo ""
