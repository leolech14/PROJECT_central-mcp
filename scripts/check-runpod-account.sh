#!/bin/bash
# RUNPOD ACCOUNT STATUS & COST TRACKING
# Quick check of account balance, pods, and spending

set -e

echo "🔍 RUNPOD ACCOUNT STATUS CHECK"
echo "================================"
echo ""

# Prompt for API key if not in environment
if [ -z "$RUNPOD_API_KEY" ]; then
  echo "RUNPOD_API_KEY not found in environment"
  echo ""
  read -sp "Enter your RunPod API key: " RUNPOD_API_KEY
  echo ""
  echo ""
fi

# Step 1: Account Balance & Info
echo "💰 Account Balance & Info:"
echo "-----------------------------------"
ACCOUNT=$(curl -s -X POST "https://api.runpod.io/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{"query": "query { myself { id email creditBalance totalSpent } }"}')

echo "$ACCOUNT" | jq -r '
  if .data.myself then
    "Email: " + .data.myself.email + "\n" +
    "Credit Balance: $" + (.data.myself.creditBalance | tostring) + "\n" +
    "Total Spent: $" + (.data.myself.totalSpent | tostring)
  else
    "ERROR: " + (.errors[0].message // "Unknown error")
  end
' 2>/dev/null || echo "Error parsing account data"

echo ""

# Step 2: All Pods Status
echo "🖥️  All Pods (Current & Recent):"
echo "-----------------------------------"
PODS=$(curl -s -X POST "https://api.runpod.io/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{"query": "query { myself { pods { id name desiredStatus costPerHr machineType runtime { uptimeInSeconds gpuCount } } } }"}')

echo "$PODS" | jq -r '
  if .data.myself.pods then
    if (.data.myself.pods | length) == 0 then
      "❌ NO PODS FOUND - All pods may have been terminated"
    else
      .data.myself.pods[] |
      "Pod: " + .name + "\n" +
      "  ID: " + .id + "\n" +
      "  Status: " + .desiredStatus + "\n" +
      "  Type: " + .machineType + "\n" +
      "  Cost: $" + (.costPerHr | tostring) + "/hr" + "\n" +
      (if .runtime then "  GPUs: " + (.runtime.gpuCount | tostring) + "\n  Uptime: " + ((.runtime.uptimeInSeconds / 3600) | floor | tostring) + " hours" else "  (Not running)" end) + "\n"
    end
  else
    "ERROR: " + (.errors[0].message // "Unknown error")
  end
' 2>/dev/null || echo "Error parsing pods data"

echo ""

# Step 3: Recent Charges
echo "💳 Recent Charges (Last 10):"
echo "-----------------------------------"
CHARGES=$(curl -s -X POST "https://api.runpod.io/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{"query": "query { myself { charges(limit: 10) { amount timestamp description } } }"}')

echo "$CHARGES" | jq -r '
  if .data.myself.charges then
    if (.data.myself.charges | length) == 0 then
      "No recent charges"
    else
      .data.myself.charges[] |
      (.timestamp | tonumber / 1000 | strftime("%Y-%m-%d %H:%M")) + " | $" + (.amount | tostring) + " | " + .description
    end
  else
    "ERROR: " + (.errors[0].message // "Unknown error")
  end
' 2>/dev/null || echo "Error parsing charges data"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ANALYSIS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save raw data
mkdir -p /tmp/runpod
echo "$ACCOUNT" > /tmp/runpod/account.json
echo "$PODS" > /tmp/runpod/pods.json
echo "$CHARGES" > /tmp/runpod/charges.json

# Analyze
CREDIT_BALANCE=$(echo "$ACCOUNT" | jq -r '.data.myself.creditBalance // 0')
POD_COUNT=$(echo "$PODS" | jq -r '.data.myself.pods | length // 0')
RUNNING_PODS=$(echo "$PODS" | jq -r '[.data.myself.pods[] | select(.desiredStatus == "RUNNING")] | length // 0')

echo "Current Credit: \$$CREDIT_BALANCE"
echo "Total Pods: $POD_COUNT"
echo "Running Pods: $RUNNING_PODS"
echo ""

if [ "$POD_COUNT" -eq 0 ]; then
  echo "⚠️  PODS WERE TERMINATED"
  echo ""
  echo "When credit balance reaches $0, RunPod automatically:"
  echo "  1. Stops all running pods"
  echo "  2. After grace period, DELETES the pods"
  echo "  3. All data and configurations are LOST"
  echo ""
  echo "📋 Recovery Options:"
  echo ""
  echo "1. CREATE NEW PODS:"
  echo "   → Visit: https://runpod.io/console/pods"
  echo "   → Select GPU type (RTX 4090, A40, etc.)"
  echo "   → Choose template (ComfyUI, Ubuntu, etc.)"
  echo "   → Deploy"
  echo ""
  echo "2. IF YOU HAD NETWORK VOLUMES:"
  echo "   → Network volumes may still exist!"
  echo "   → Check: https://runpod.io/console/storage"
  echo "   → Attach to new pod to recover data"
  echo ""
  echo "3. ADD FUNDS TO PREVENT FUTURE TERMINATION:"
  echo "   → Visit: https://runpod.io/console/billing"
  echo "   → Add credits (minimum \$10 recommended)"
  echo "   → Set up auto-recharge alerts"
  echo ""
elif [ "$RUNNING_PODS" -eq 0 ] && [ "$POD_COUNT" -gt 0 ]; then
  echo "✅ PODS STILL EXIST BUT ARE STOPPED"
  echo ""
  echo "Your pods were paused but not deleted!"
  echo ""
  echo "To restart:"
  while IFS= read -r POD_ID; do
    echo "  curl -X POST \"https://api.runpod.io/v2/$POD_ID/start\" \\"
    echo "    -H \"Authorization: Bearer \$RUNPOD_API_KEY\""
    echo ""
  done < <(echo "$PODS" | jq -r '.data.myself.pods[].id // empty')
else
  echo "✅ SYSTEM OPERATIONAL"
  echo ""
  echo "You have $RUNNING_PODS pod(s) running"
  echo "Current hourly cost: \$$(echo "$PODS" | jq -r '[.data.myself.pods[] | select(.desiredStatus == "RUNNING") | .costPerHr] | add // 0')/hr"
fi

echo ""
echo "💾 Data saved to: /tmp/runpod/"
echo ""
