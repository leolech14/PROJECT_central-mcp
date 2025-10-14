#!/bin/bash
# Setup GoTTY for real-time terminal streaming

set -e

echo "🚀 Setting up GoTTY Terminal Streaming..."

# Download and install GoTTY
echo "📥 Downloading GoTTY..."
wget -q https://github.com/yudai/gotty/releases/download/v2.0.0-alpha.3/gotty_2.0.0-alpha.3_linux_amd64.tar.gz
tar xzf gotty_2.0.0-alpha.3_linux_amd64.tar.gz
sudo mv gotty /usr/local/bin/
rm gotty_2.0.0-alpha.3_linux_amd64.tar.gz

echo "✅ GoTTY installed!"

# Create GoTTY config
cat > ~/.gotty << 'EOF'
{
  "address": "0.0.0.0",
  "port": "8080",
  "permit_write": true,
  "enable_reconnect": true,
  "reconnect_time": 10,
  "max_connection": 10,
  "title_format": "Central-MCP Agent Terminal",
  "preferences": {
    "font_family": "SF Mono, Monaco, Courier New",
    "font_size": 14,
    "cursor_blink": true,
    "theme": "hacker"
  }
}
EOF

echo "✅ GoTTY config created!"

# Create systemd service for GoTTY
sudo tee /etc/systemd/system/gotty-agents.service > /dev/null << 'EOF'
[Unit]
Description=GoTTY Terminal Streaming for Agents
After=network.target central-mcp.service

[Service]
Type=simple
User=lech
WorkingDirectory=/home/lech
Environment="TERM=xterm-256color"
ExecStart=/usr/local/bin/gotty -c /home/lech/.gotty tmux attach -t agents
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ GoTTY systemd service created!"

# Create firewall rule for port 8080
echo "🔓 Opening firewall for port 8080..."
gcloud compute firewall-rules create allow-gotty \
  --allow tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow GoTTY terminal streaming" \
  --quiet 2>/dev/null || echo "Firewall rule already exists"

echo ""
echo "🎉 GoTTY Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Create tmux session: tmux new-session -s agents"
echo "2. Start GoTTY: sudo systemctl start gotty-agents"
echo "3. Visit: http://$(curl -s ifconfig.me):8080"
echo ""
echo "To see agent terminals in browser! 🚀"
