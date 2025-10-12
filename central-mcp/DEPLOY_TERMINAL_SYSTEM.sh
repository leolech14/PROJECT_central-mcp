#!/bin/bash
# COMPLETE TERMINAL SYSTEM DEPLOYMENT
# Deploys terminal infrastructure for:
# 1. UI viewing (gotty web terminals)
# 2. Agent access (tmux sessions)
# 3. Central-MCP brain operation (same tmux sessions)

set -e

echo "🚀 DEPLOYING COMPLETE TERMINAL SYSTEM TO VM..."

# Copy files to VM
echo "📦 Copying scripts to VM..."
gcloud compute scp --zone=us-central1-a \
  ./scripts/setup-vm-terminals.sh \
  ./scripts/start-gotty-terminals.sh \
  central-mcp-server:~/

# Make scripts executable
echo "🔧 Making scripts executable..."
gcloud compute ssh central-mcp-server --zone=us-central1-a -- \
  "chmod +x ~/setup-vm-terminals.sh ~/start-gotty-terminals.sh"

# Run setup
echo "🏗️  Setting up terminal infrastructure..."
gcloud compute ssh central-mcp-server --zone=us-central1-a -- \
  "~/setup-vm-terminals.sh"

# Start gotty sessions
echo "🌐 Starting web terminal sessions (gotty)..."
gcloud compute ssh central-mcp-server --zone=us-central1-a -- \
  "~/start-gotty-terminals.sh"

# Verify terminals are running
echo "✅ Verifying terminal sessions..."
gcloud compute ssh central-mcp-server --zone=us-central1-a -- \
  "tmux list-sessions && pgrep -a gotty"

echo ""
echo "✅ TERMINAL SYSTEM DEPLOYED!"
echo ""
echo "📊 Access Points:"
echo "  - Dashboard: http://localhost:3003/terminals"
echo "  - Agent A:   http://34.41.115.199:9001 (Coordinator)"
echo "  - Agent B:   http://34.41.115.199:9002 (Architecture)"
echo "  - Agent C:   http://34.41.115.199:9003 (Backend)"
echo "  - Agent D:   http://34.41.115.199:9004 (UI)"
echo "  - System:    http://34.41.115.199:9000 (Logs)"
echo ""
echo "🔌 SSH Access:"
echo "  gcloud compute ssh central-mcp-server --zone=us-central1-a"
echo "  tmux attach -t agent-a  # Attach to Agent A terminal"
echo ""
echo "🧠 Central-MCP can now operate in these terminals!"
