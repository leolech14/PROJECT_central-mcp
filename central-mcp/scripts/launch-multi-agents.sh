#!/bin/bash
# MULTI-AGENT TMUX LAUNCHER
# Start multiple Claude Code agents in tmux windows with terminal streaming

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🤖 MULTI-AGENT LAUNCHER - GCP VM                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
SESSION_NAME="central-mcp-agents"
CENTRAL_MCP_URL="http://localhost:3000"

# Agent configurations
declare -A AGENTS
AGENTS[A]="ui-velocity:claude-sonnet-4-5"
AGENTS[B]="design-architecture:claude-sonnet-4-5"
AGENTS[C]="backend:glm-4.6"
AGENTS[D]="integration:claude-sonnet-4-5"

# Check if tmux session exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
  echo "⚠️  Session '$SESSION_NAME' already exists"
  echo ""
  read -p "Kill existing session and restart? (yes/no): " confirm
  if [[ "$confirm" == "yes" ]]; then
    tmux kill-session -t $SESSION_NAME
    echo "✅ Killed existing session"
  else
    echo "Cancelled"
    exit 0
  fi
fi

echo ""
echo "🚀 Starting Multi-Agent System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create tmux session with first window
echo "📋 Creating tmux session: $SESSION_NAME"
tmux new-session -d -s $SESSION_NAME -n "Control"

# Control window - system monitoring
tmux send-keys -t $SESSION_NAME:Control "clear" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '╔════════════════════════════════════════════════════════════╗'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '║    🎛️  CENTRAL-MCP CONTROL PANEL                         ║'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '╚════════════════════════════════════════════════════════════╝'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo ''" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '📊 System Monitoring:'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '   - Agent A: ui-velocity (Sonnet-4.5)'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '   - Agent B: design-architecture (Sonnet-4.5)'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '   - Agent C: backend (GLM-4.6)'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '   - Agent D: integration (Sonnet-4.5)'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo ''" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '🔗 Services:'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '   Central-MCP: $CENTRAL_MCP_URL'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '   Dashboard: http://34.41.115.199:8000'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo ''" C-m
tmux send-keys -t $SESSION_NAME:Control "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION_NAME:Control "echo ''" C-m
tmux send-keys -t $SESSION_NAME:Control "watch -n 5 'curl -s http://localhost:3000/health | jq . 2>/dev/null || echo \"Waiting for Central-MCP...\"'" C-m

# Create window for each agent
for agent_letter in A B C D; do
  agent_config="${AGENTS[$agent_letter]}"
  IFS=':' read -r role model <<< "$agent_config"
  
  echo "🤖 Creating Agent $agent_letter ($role - $model)..."
  
  # Create new window
  tmux new-window -t $SESSION_NAME -n "Agent-$agent_letter"
  
  # Set up agent environment
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "clear" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "export AGENT_LETTER='$agent_letter'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "export AGENT_MODEL='$model'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "export AGENT_ROLE='$role'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "export CENTRAL_MCP_URL='$CENTRAL_MCP_URL'" C-m
  
  # Display agent banner
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '╔════════════════════════════════════════════════════════════╗'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '║    🤖 AGENT $agent_letter - $role'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '╚════════════════════════════════════════════════════════════╝'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo ''" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '🧠 Model: $model'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '🎯 Role: $role'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '🔗 Central-MCP: $CENTRAL_MCP_URL'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo ''" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '📋 TO START:'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '   1. Start Claude Code: claude-code'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '   2. Say: \"Connect to MCP\"'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '   3. Agent will auto-register and start working!'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo ''" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '💡 TIP: Press Ctrl+B then [ to scroll history'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
  tmux send-keys -t $SESSION_NAME:Agent-$agent_letter "echo ''" C-m
  
  # Note: Don't auto-start claude-code yet - let user start manually
done

# Create logs window
echo "📝 Creating Logs window..."
tmux new-window -t $SESSION_NAME -n "Logs"
tmux send-keys -t $SESSION_NAME:Logs "clear" C-m
tmux send-keys -t $SESSION_NAME:Logs "echo '╔════════════════════════════════════════════════════════════╗'" C-m
tmux send-keys -t $SESSION_NAME:Logs "echo '║    📊 CENTRAL-MCP LOGS                                    ║'" C-m
tmux send-keys -t $SESSION_NAME:Logs "echo '╚════════════════════════════════════════════════════════════╝'" C-m
tmux send-keys -t $SESSION_NAME:Logs "echo ''" C-m
tmux send-keys -t $SESSION_NAME:Logs "sudo journalctl -u central-mcp -f" C-m

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MULTI-AGENT SYSTEM STARTED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Tmux Session: $SESSION_NAME"
echo ""
echo "Windows Created:"
echo "  0: Control    - System health monitoring"
echo "  1: Agent-A    - UI Velocity (Sonnet-4.5)"
echo "  2: Agent-B    - Design/Architecture (Sonnet-4.5)"
echo "  3: Agent-C    - Backend (GLM-4.6)"
echo "  4: Agent-D    - Integration (Sonnet-4.5)"
echo "  5: Logs       - Central-MCP logs"
echo ""
echo "🎮 Tmux Controls:"
echo "  Ctrl+B then 0-5   - Switch to window number"
echo "  Ctrl+B then [     - Scroll mode (q to exit)"
echo "  Ctrl+B then d     - Detach (agents keep running)"
echo "  Ctrl+B then :     - Command mode"
echo ""
echo "🚀 To Start Agents:"
echo "   1. Attach to session: tmux attach -t $SESSION_NAME"
echo "   2. Switch to agent window (Ctrl+B then 1-4)"
echo "   3. Type: claude-code"
echo "   4. Say: \"Connect to MCP\""
echo "   5. Agent will auto-register!"
echo ""
echo "📊 Dashboard: http://34.41.115.199:8000/central-mcp-dashboard.html"
echo ""

# Offer to attach
read -p "Attach to session now? (yes/no): " attach
if [[ "$attach" == "yes" ]]; then
  tmux attach -t $SESSION_NAME
else
  echo ""
  echo "💡 To attach later: tmux attach -t $SESSION_NAME"
  echo ""
fi
