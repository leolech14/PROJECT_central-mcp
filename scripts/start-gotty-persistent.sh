#!/bin/bash
# START GOTTY WITH PROPER ADDRESS BINDING
set -e

echo "🌐 Starting gotty with 0.0.0.0 binding..."

# Kill existing
pkill gotty 2>/dev/null || true
sleep 2

# Start gotty with explicit address binding (0.0.0.0 for external access)
nohup gotty --address 0.0.0.0 --port 9001 --permit-write --reconnect --title-format "Agent A" tmux attach -t agent-a >> ~/gotty-agent-a.log 2>&1 &
sleep 1

nohup gotty --address 0.0.0.0 --port 9002 --permit-write --reconnect --title-format "Agent B" tmux attach -t agent-b >> ~/gotty-agent-b.log 2>&1 &
sleep 1

nohup gotty --address 0.0.0.0 --port 9003 --permit-write --reconnect --title-format "Agent C" tmux attach -t agent-c >> ~/gotty-agent-c.log 2>&1 &
sleep 1

nohup gotty --address 0.0.0.0 --port 9004 --permit-write --reconnect --title-format "Agent D" tmux attach -t agent-d >> ~/gotty-agent-d.log 2>&1 &
sleep 1

nohup gotty --address 0.0.0.0 --port 9000 --title-format "System" tmux attach -t system >> ~/gotty-system.log 2>&1 &
sleep 2

echo "✅ Gotty started on all ports"
pgrep -a gotty
echo ""
echo "🌐 Terminal URLs:"
echo "  http://34.41.115.199:9001 - Agent A"
echo "  http://34.41.115.199:9002 - Agent B"
echo "  http://34.41.115.199:9003 - Agent C"
echo "  http://34.41.115.199:9004 - Agent D"
echo "  http://34.41.115.199:9000 - System"
