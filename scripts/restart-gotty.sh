#!/bin/bash
# RESTART GOTTY SESSIONS (Persistent)
set -e

echo "🔄 Restarting gotty sessions..."

# Kill existing
pkill gotty 2>/dev/null || true
sleep 2

# Start with screen for persistence
screen -dmS gotty-agent-a bash -c "gotty --port 9001 --permit-write --reconnect tmux attach -t agent-a"
screen -dmS gotty-agent-b bash -c "gotty --port 9002 --permit-write --reconnect tmux attach -t agent-b"
screen -dmS gotty-agent-c bash -c "gotty --port 9003 --permit-write --reconnect tmux attach -t agent-c"
screen -dmS gotty-agent-d bash -c "gotty --port 9004 --permit-write --reconnect tmux attach -t agent-d"
screen -dmS gotty-system bash -c "gotty --port 9000 tmux attach -t system"

sleep 3

echo "✅ Gotty sessions started in screen"
pgrep -a gotty
screen -ls
