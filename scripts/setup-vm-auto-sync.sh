#!/bin/bash

# 🔄 SETUP AUTOMATIC VM SYNCHRONIZATION
# Pull-based automatic updates: VM pulls from GitHub every 5 minutes

echo "=== 🔄 SETTING UP AUTOMATIC VM SYNCHRONIZATION ===="
echo ""

VM_NAME="central-mcp-server"
VM_ZONE="us-central1-a"

echo "Connecting to VM to set up auto-sync..."
echo ""

gcloud compute ssh lech@$VM_NAME --zone=$VM_ZONE --command='
echo "📝 Creating auto-sync script on VM..."

cat > /home/lech/auto-sync-central-mcp.sh << '\''SCRIPT'\''
#!/bin/bash
# Automatic Central-MCP Synchronization
# Pulls latest code and restarts service if changes detected

LOG_FILE="/home/lech/auto-sync.log"
echo "$(date): Starting auto-sync..." >> "$LOG_FILE"

# Pull latest code
cd /home/lech/PROJECTS_all/PROJECT_central-mcp

# Check if there are updates
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): Updates detected! Pulling..." >> "$LOG_FILE"

    # Pull changes
    git pull origin main >> "$LOG_FILE" 2>&1

    if [ $? -eq 0 ]; then
        echo "$(date): Pull successful, updating service..." >> "$LOG_FILE"

        # Sync to service location (exclude sensitive files)
        sudo rsync -av --delete \
            --exclude=".git" \
            --exclude="node_modules" \
            --exclude="data/registry.db*" \
            --exclude=".env" \
            /home/lech/PROJECTS_all/PROJECT_central-mcp/ \
            /opt/central-mcp/ >> "$LOG_FILE" 2>&1

        # Install dependencies if package.json changed
        if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
            echo "$(date): package.json changed, running npm install..." >> "$LOG_FILE"
            cd /opt/central-mcp
            sudo npm install >> "$LOG_FILE" 2>&1
        fi

        # Restart service
        echo "$(date): Restarting Central-MCP service..." >> "$LOG_FILE"
        sudo systemctl restart central-mcp

        sleep 3

        # Verify service is running
        if sudo systemctl is-active --quiet central-mcp; then
            echo "$(date): ✅ Service restarted successfully" >> "$LOG_FILE"
        else
            echo "$(date): ❌ Service restart failed!" >> "$LOG_FILE"
        fi
    else
        echo "$(date): ❌ Pull failed!" >> "$LOG_FILE"
    fi
else
    echo "$(date): No updates available" >> "$LOG_FILE"
fi

echo "$(date): Auto-sync complete" >> "$LOG_FILE"
SCRIPT

chmod +x /home/lech/auto-sync-central-mcp.sh
echo "✅ Auto-sync script created"

echo ""
echo "📅 Setting up cron job (every 5 minutes)..."

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null | grep -v "auto-sync-central-mcp"; echo "*/5 * * * * /home/lech/auto-sync-central-mcp.sh") | crontab -

echo "✅ Cron job installed"

echo ""
echo "🧪 Running first sync now..."
/home/lech/auto-sync-central-mcp.sh

echo ""
echo "📊 Checking sync log..."
tail -20 /home/lech/auto-sync.log

echo ""
echo "=== ✅ AUTO-SYNC SETUP COMPLETE ==="
echo ""
echo "📋 CONFIGURATION:"
echo "  • Sync frequency: Every 5 minutes"
echo "  • Source: GitHub (PROJECT_central-mcp)"
echo "  • Target: /opt/central-mcp (running service)"
echo "  • Log file: /home/lech/auto-sync.log"
echo ""
echo "🔧 MANUAL COMMANDS:"
echo "  • Manual sync: /home/lech/auto-sync-central-mcp.sh"
echo "  • View log: tail -f /home/lech/auto-sync.log"
echo "  • Check cron: crontab -l"
echo ""
echo "🎯 RESULT: Changes now propagate automatically!"
echo "  MacBook → git push → GitHub"
echo "  GitHub → auto-sync (5min) → VM service"
echo "  Complete ecosystem synchronization!"
'

echo ""
echo "=== ✅ AUTOMATIC PROPAGATION CONFIGURED ==="
echo ""
echo "🎯 FROM NOW ON:"
echo "  1. Make changes locally"
echo "  2. git commit && git push"
echo "  3. Wait 5 minutes"
echo "  4. ✅ VM automatically updates and restarts!"
echo ""
echo "NO MORE MANUAL DEPLOYMENTS! 🚀"
