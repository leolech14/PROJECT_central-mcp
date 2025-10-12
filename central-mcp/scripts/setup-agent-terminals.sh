#!/bin/bash
# Setup TMUX multi-agent terminal session

set -e

echo "🚀 Setting up TMUX Multi-Agent Terminal Session..."

# Source environment
source ~/.claude-env 2>/dev/null || true

# Kill existing session if it exists
tmux kill-session -t agents 2>/dev/null || true

# Create new tmux session with 6 windows
echo "📺 Creating tmux session 'agents' with 6 windows..."

# Create session with first window
tmux new-session -d -s agents -n "Agent-A-UI"

# Add more windows
tmux new-window -t agents:1 -n "Agent-B-Design"
tmux new-window -t agents:2 -n "Agent-C-Backend"
tmux new-window -t agents:3 -n "Agent-D-Integration"
tmux new-window -t agents:4 -n "Central-MCP"
tmux new-window -t agents:5 -n "Dashboard"

# Configure each window
echo "⚙️  Configuring agent windows..."

# Agent A (UI Specialist) - GLM-4-Flash
tmux send-keys -t agents:0 'source ~/.claude-env' C-m
tmux send-keys -t agents:0 'export AGENT_ID="Agent-A"' C-m
tmux send-keys -t agents:0 'export AGENT_ROLE="UI Specialist"' C-m
tmux send-keys -t agents:0 'export MODEL="glm-4-flash"' C-m
tmux send-keys -t agents:0 'clear && echo "🎨 Agent A - UI Specialist (GLM-4-Flash 200K)"' C-m
tmux send-keys -t agents:0 'echo "Ready to work on UI tasks..."' C-m
tmux send-keys -t agents:0 'echo ""' C-m
tmux send-keys -t agents:0 'echo "Start with: claude \"Hello from Agent A\""' C-m

# Agent B (Design System) - Sonnet-4.5
tmux send-keys -t agents:1 'source ~/.claude-env' C-m
tmux send-keys -t agents:1 'export AGENT_ID="Agent-B"' C-m
tmux send-keys -t agents:1 'export AGENT_ROLE="Design System Specialist"' C-m
tmux send-keys -t agents:1 'export MODEL="claude-sonnet-4-20250514"' C-m
tmux send-keys -t agents:1 'clear && echo "🎨 Agent B - Design System (Sonnet-4.5 200K)"' C-m
tmux send-keys -t agents:1 'echo "Ready to work on design tasks..."' C-m

# Agent C (Backend) - GLM-4-Flash
tmux send-keys -t agents:2 'source ~/.claude-env' C-m
tmux send-keys -t agents:2 'export AGENT_ID="Agent-C"' C-m
tmux send-keys -t agents:2 'export AGENT_ROLE="Backend Specialist"' C-m
tmux send-keys -t agents:2 'export MODEL="glm-4-flash"' C-m
tmux send-keys -t agents:2 'clear && echo "⚙️  Agent C - Backend Specialist (GLM-4-Flash 200K)"' C-m
tmux send-keys -t agents:2 'echo "Ready to work on backend tasks..."' C-m

# Agent D (Integration) - Sonnet-4.5
tmux send-keys -t agents:3 'source ~/.claude-env' C-m
tmux send-keys -t agents:3 'export AGENT_ID="Agent-D"' C-m
tmux send-keys -t agents:3 'export AGENT_ROLE="Integration Specialist"' C-m
tmux send-keys -t agents:3 'export MODEL="claude-sonnet-4-20250514"' C-m
tmux send-keys -t agents:3 'clear && echo "🔗 Agent D - Integration Specialist (Sonnet-4.5 200K)"' C-m
tmux send-keys -t agents:3 'echo "Ready to work on integration tasks..."' C-m

# Central-MCP Monitor
tmux send-keys -t agents:4 'cd /opt/central-mcp' C-m
tmux send-keys -t agents:4 'clear && echo "🧠 Central-MCP Intelligence Engine"' C-m
tmux send-keys -t agents:4 'echo "WebSocket: ws://34.41.115.199:3000/mcp"' C-m
tmux send-keys -t agents:4 'echo ""' C-m
tmux send-keys -t agents:4 'echo "Real-time logs:"' C-m
tmux send-keys -t agents:4 'sudo journalctl -u central-mcp -f' C-m

# Dashboard Window
tmux send-keys -t agents:5 'clear && echo "📊 Central-MCP Dashboard"' C-m
tmux send-keys -t agents:5 'echo ""' C-m
tmux send-keys -t agents:5 'echo "Real-time task updates available at:"' C-m
tmux send-keys -t agents:5 'echo "http://34.41.115.199:3000/dashboard.html"' C-m
tmux send-keys -t agents:5 'echo ""' C-m
tmux send-keys -t agents:5 'echo "Current system status:"' C-m
tmux send-keys -t agents:5 'watch -n 2 "curl -s http://localhost:3000/health | jq ."' C-m

# Set default window
tmux select-window -t agents:4

echo ""
echo "✅ TMUX session 'agents' created with 6 windows!"
echo ""
echo "📺 Window Layout:"
echo "   0: Agent A - UI Specialist (GLM-4-Flash)"
echo "   1: Agent B - Design System (Sonnet-4.5)"
echo "   2: Agent C - Backend (GLM-4-Flash)"
echo "   3: Agent D - Integration (Sonnet-4.5)"
echo "   4: Central-MCP Monitor (real-time logs)"
echo "   5: Dashboard (system status)"
echo ""
echo "🎯 To attach: tmux attach -t agents"
echo "🔀 Switch windows: Ctrl+B then 0-5"
echo "📤 Detach: Ctrl+B then D"
echo ""
echo "🌐 For web access, run: ./setup-gotty-streaming.sh"
echo ""
