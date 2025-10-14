# 🔐 DOPPLER SETUP ON GOOGLE CLOUD VM

## Option 1: Interactive Setup (Recommended)

SSH into the server and run these commands:

```bash
# SSH into Central-MCP server
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Go to Central-MCP directory
cd /opt/central-mcp

# Login to Doppler (opens browser)
doppler login

# Setup project (interactive)
doppler setup --project central-mcp --config production

# Verify configuration
doppler secrets

# Install dependencies
doppler run -- npm install

# Build TypeScript
doppler run -- npm run build

# Run database migrations
doppler run -- npm run migrate

# Start server
doppler run -- npm start
```

## Option 2: Service Token (Automated)

If you have a Doppler service token:

```bash
# SSH into server
gcloud compute ssh central-mcp-server --zone=us-central1-a

# Go to Central-MCP directory
cd /opt/central-mcp

# Set Doppler token (get from https://dashboard.doppler.com/)
export DOPPLER_TOKEN="dp.st.YOUR_TOKEN_HERE"

# Install dependencies
doppler run -- npm install

# Build
doppler run -- npm run build

# Run migrations
doppler run -- npm run migrate

# Create systemd service with token
sudo tee /etc/systemd/system/central-mcp.service > /dev/null << EOF
[Unit]
Description=Central-MCP Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/central-mcp
Environment="DOPPLER_TOKEN=$DOPPLER_TOKEN"
ExecStart=/usr/bin/doppler run -- npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable central-mcp
sudo systemctl start central-mcp

# Check status
sudo systemctl status central-mcp

# View logs
sudo journalctl -u central-mcp -f
```

## Option 3: Let Me Do It For You

If you want me to complete the setup, give me permission to:
1. Access your local Doppler credentials
2. Create a service token for the VM

Then I can fully automate the rest!

---

## Current VM Status

```
✅ VM Created: central-mcp-server
✅ Machine Type: e2-micro (FREE TIER!)
✅ External IP: 34.41.115.199
✅ Doppler CLI: v3.75.1 installed
✅ Repository: Cloned successfully
⏳ Doppler Config: Waiting for your setup
⏳ Dependencies: Waiting for Doppler
⏳ Server: Not started yet
```

## What You'll Get After Setup

```
✅ Central-MCP server running 24/7 (FREE!)
✅ SQLite database initialized
✅ Doppler secrets configured
✅ Auto-restart on reboot
✅ Spec generator ready
✅ Thread auto-save ready
✅ Ready for Terminal Station Manager
```

---

Which option would you like to use?
