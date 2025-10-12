#!/bin/bash
# START GOTTY WEB TERMINAL STREAMING
# Streams tmux sessions to web browser for UI monitoring
# Allows dashboard to display terminal activity in real-time

set -e

echo "🌐 STARTING GOTTY WEB TERMINAL STREAMING..."

# Kill existing gotty processes
echo "🧹 Cleaning up existing gotty processes..."
pkill gotty 2>/dev/null || true
sleep 2

# Create gotty config directory
mkdir -p ~/.gotty

# Start gotty for each tmux session
echo "🚀 Starting gotty sessions..."

# Agent A (Port 9001)
nohup gotty \
  --port 9001 \
  --permit-write \
  --reconnect \
  --title-format "Agent A - Coordinator" \
  tmux attach -t agent-a \
  > ~/gotty-agent-a.log 2>&1 &
echo "  ✅ Agent A: http://34.41.115.199:9001"

sleep 1

# Agent B (Port 9002)
nohup gotty \
  --port 9002 \
  --permit-write \
  --reconnect \
  --title-format "Agent B - Architecture" \
  tmux attach -t agent-b \
  > ~/gotty-agent-b.log 2>&1 &
echo "  ✅ Agent B: http://34.41.115.199:9002"

sleep 1

# Agent C (Port 9003)
nohup gotty \
  --port 9003 \
  --permit-write \
  --reconnect \
  --title-format "Agent C - Backend" \
  tmux attach -t agent-c \
  > ~/gotty-agent-c.log 2>&1 &
echo "  ✅ Agent C: http://34.41.115.199:9003"

sleep 1

# Agent D (Port 9004)
nohup gotty \
  --port 9004 \
  --permit-write \
  --reconnect \
  --title-format "Agent D - UI" \
  tmux attach -t agent-d \
  > ~/gotty-agent-d.log 2>&1 &
echo "  ✅ Agent D: http://34.41.115.199:9004"

sleep 1

# System Monitor (Port 9000)
nohup gotty \
  --port 9000 \
  --title-format "System Monitor" \
  tmux attach -t system \
  > ~/gotty-system.log 2>&1 &
echo "  ✅ System: http://34.41.115.199:9000"

sleep 2

# Verify gotty processes
echo ""
echo "🔍 Verifying gotty processes..."
pgrep -a gotty

echo ""
echo "✅ GOTTY WEB TERMINALS RUNNING!"
echo ""
echo "🌐 Web Access:"
echo "  - Dashboard: http://localhost:3003/terminals"
echo "  - Direct URLs:"
echo "    • Agent A: http://34.41.115.199:9001"
echo "    • Agent B: http://34.41.115.199:9002"
echo "    • Agent C: http://34.41.115.199:9003"
echo "    • Agent D: http://34.41.115.199:9004"
echo "    • System:  http://34.41.115.199:9000"
echo ""
echo "🔌 SSH Access (for agents to work):"
echo "  gcloud compute ssh central-mcp-server --zone=us-central1-a"
echo "  tmux attach -t agent-a  # Work in Agent A terminal"
echo ""
echo "🧠 Central-MCP Brain can now see and operate in these terminals!"
echo "✨ SEAMLESS USER ↔ AGENT ↔ CENTRAL-MCP COOPERATION ENABLED!"
