#!/bin/bash
# VM TERMINAL INFRASTRUCTURE SETUP
# Creates tmux sessions that can be accessed by:
# 1. Humans (SSH + tmux attach)
# 2. LLMs (Central-MCP brain)
# 3. UI (gotty web streaming)

set -e

echo "🏗️  SETTING UP VM TERMINAL INFRASTRUCTURE..."

# Ensure we're in the right directory
cd ~

# Create central-mcp directory if it doesn't exist
if [ ! -d "central-mcp" ]; then
  echo "📁 Creating central-mcp directory..."
  mkdir -p central-mcp
fi

cd central-mcp

# Kill existing tmux sessions (cleanup)
echo "🧹 Cleaning up existing sessions..."
tmux kill-session -t agent-a 2>/dev/null || true
tmux kill-session -t agent-b 2>/dev/null || true
tmux kill-session -t agent-c 2>/dev/null || true
tmux kill-session -t agent-d 2>/dev/null || true
tmux kill-session -t system 2>/dev/null || true

# Create tmux sessions
echo "🖥️  Creating tmux terminal sessions..."

# Session 1: Agent A (Coordinator)
tmux new-session -d -s agent-a -n main
tmux send-keys -t agent-a:main "clear" C-m
tmux send-keys -t agent-a:main "echo '🎯 AGENT A - PRIMARY COORDINATOR'" C-m
tmux send-keys -t agent-a:main "echo 'Model: Claude Sonnet 4.5'" C-m
tmux send-keys -t agent-a:main "echo 'Role: Coordinates other agents, handles P0-CRITICAL tasks'" C-m
tmux send-keys -t agent-a:main "echo ''" C-m
tmux send-keys -t agent-a:main "echo 'To start working:'" C-m
tmux send-keys -t agent-a:main "echo '  1. Run: claude-code'" C-m
tmux send-keys -t agent-a:main "echo '  2. Use tool: connectToMCP'" C-m
tmux send-keys -t agent-a:main "echo '  3. Start claiming tasks!'" C-m
tmux send-keys -t agent-a:main "echo ''" C-m
tmux send-keys -t agent-a:main "export AGENT_LETTER=A" C-m
tmux send-keys -t agent-a:main "export AGENT_MODEL=claude-sonnet-4-5" C-m
tmux send-keys -t agent-a:main "export AGENT_ROLE=coordinator" C-m

# Session 2: Agent B (Architecture)
tmux new-session -d -s agent-b -n main
tmux send-keys -t agent-b:main "clear" C-m
tmux send-keys -t agent-b:main "echo '🏗️  AGENT B - ARCHITECTURE SPECIALIST'" C-m
tmux send-keys -t agent-b:main "echo 'Model: Claude Sonnet 4.5'" C-m
tmux send-keys -t agent-b:main "echo 'Role: Architecture design, specs, integration'" C-m
tmux send-keys -t agent-b:main "echo ''" C-m
tmux send-keys -t agent-b:main "echo 'To start working:'" C-m
tmux send-keys -t agent-b:main "echo '  1. Run: claude-code'" C-m
tmux send-keys -t agent-b:main "echo '  2. Use tool: connectToMCP'" C-m
tmux send-keys -t agent-b:main "echo '  3. Start claiming tasks!'" C-m
tmux send-keys -t agent-b:main "echo ''" C-m
tmux send-keys -t agent-b:main "export AGENT_LETTER=B" C-m
tmux send-keys -t agent-b:main "export AGENT_MODEL=claude-sonnet-4-5" C-m
tmux send-keys -t agent-b:main "export AGENT_ROLE=architecture" C-m

# Session 3: Agent C (Backend)
tmux new-session -d -s agent-c -n main
tmux send-keys -t agent-c:main "clear" C-m
tmux send-keys -t agent-c:main "echo '⚙️  AGENT C - BACKEND SPECIALIST'" C-m
tmux send-keys -t agent-c:main "echo 'Model: GLM 4.6 (or Claude)'" C-m
tmux send-keys -t agent-c:main "echo 'Role: Backend APIs, database, performance'" C-m
tmux send-keys -t agent-c:main "echo ''" C-m
tmux send-keys -t agent-c:main "echo 'To start working:'" C-m
tmux send-keys -t agent-c:main "echo '  1. Run: claude-code'" C-m
tmux send-keys -t agent-c:main "echo '  2. Use tool: connectToMCP'" C-m
tmux send-keys -t agent-c:main "echo '  3. Start claiming tasks!'" C-m
tmux send-keys -t agent-c:main "echo ''" C-m
tmux send-keys -t agent-c:main "export AGENT_LETTER=C" C-m
tmux send-keys -t agent-c:main "export AGENT_MODEL=glm-4-6" C-m
tmux send-keys -t agent-c:main "export AGENT_ROLE=backend" C-m

# Session 4: Agent D (UI)
tmux new-session -d -s agent-d -n main
tmux send-keys -t agent-d:main "clear" C-m
tmux send-keys -t agent-d:main "echo '🎨 AGENT D - UI SPECIALIST'" C-m
tmux send-keys -t agent-d:main "echo 'Model: GLM 4.6 (or Claude)'" C-m
tmux send-keys -t agent-d:main "echo 'Role: Frontend components, dashboards, UI design'" C-m
tmux send-keys -t agent-d:main "echo ''" C-m
tmux send-keys -t agent-d:main "echo 'To start working:'" C-m
tmux send-keys -t agent-d:main "echo '  1. Run: claude-code'" C-m
tmux send-keys -t agent-d:main "echo '  2. Use tool: connectToMCP'" C-m
tmux send-keys -t agent-d:main "echo '  3. Start claiming tasks!'" C-m
tmux send-keys -t agent-d:main "echo ''" C-m
tmux send-keys -t agent-d:main "export AGENT_LETTER=D" C-m
tmux send-keys -t agent-d:main "export AGENT_MODEL=glm-4-6" C-m
tmux send-keys -t agent-d:main "export AGENT_ROLE=ui" C-m

# Session 5: System Monitor
tmux new-session -d -s system -n main
tmux send-keys -t system:main "clear" C-m
tmux send-keys -t system:main "echo '📊 CENTRAL-MCP SYSTEM MONITOR'" C-m
tmux send-keys -t system:main "echo 'Real-time system logs and metrics'" C-m
tmux send-keys -t system:main "echo ''" C-m
tmux send-keys -t system:main "tail -f /tmp/central-mcp-final.log 2>/dev/null || echo 'No logs yet'" C-m

echo "✅ Created 5 tmux sessions:"
tmux list-sessions

echo ""
echo "🎯 Terminal Access:"
echo "  - Agent A: tmux attach -t agent-a"
echo "  - Agent B: tmux attach -t agent-b"
echo "  - Agent C: tmux attach -t agent-c"
echo "  - Agent D: tmux attach -t agent-d"
echo "  - System:  tmux attach -t system"
echo ""
echo "✅ VM TERMINAL INFRASTRUCTURE READY!"
