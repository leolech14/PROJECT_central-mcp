#!/bin/bash

################################################################################
# CENTRAL-MCP SERVER SETUP SCRIPT
################################################################################
#
# Run this script ON THE GOOGLE CLOUD VM after deployment
# Uses Doppler for credential management
#
# Prerequisites:
#   - Already SSH'd into Central-MCP server
#   - Doppler CLI will be installed by this script
#
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

################################################################################
# Install Doppler CLI
################################################################################

print_header "INSTALLING DOPPLER CLI"

if command -v doppler &> /dev/null; then
    print_success "Doppler already installed: $(doppler --version)"
else
    print_info "Installing Doppler CLI..."
    curl -Ls https://cli.doppler.com/install.sh | sudo bash
    print_success "Doppler CLI installed"
fi

################################################################################
# Clone Repository
################################################################################

print_header "CLONING CENTRAL-MCP REPOSITORY"

cd /opt/central-mcp

if [ -d ".git" ]; then
    print_info "Repository already cloned. Pulling latest changes..."
    git pull
else
    print_info "Enter your GitHub repository URL:"
    read -p "Repository URL: " REPO_URL

    git clone "$REPO_URL" .
    print_success "Repository cloned"
fi

################################################################################
# Configure Doppler
################################################################################

print_header "CONFIGURING DOPPLER"

print_info "You need to authenticate Doppler with your token"
print_info "Get your token from: https://dashboard.doppler.com/workplace/tokens"
echo ""

# Check if already configured
if doppler configure get token &> /dev/null; then
    print_success "Doppler already configured"
else
    doppler login
fi

# Setup project
print_info "Setting up Doppler project..."
doppler setup --project central-mcp --config production

print_success "Doppler configured"

################################################################################
# Install Dependencies
################################################################################

print_header "INSTALLING DEPENDENCIES"

print_info "Installing Node.js dependencies with Doppler credentials..."
doppler run -- npm install

print_success "Dependencies installed"

################################################################################
# Initialize Database
################################################################################

print_header "INITIALIZING DATABASE"

if [ -f "data/registry.db" ]; then
    print_info "Database already exists. Backing up..."
    cp data/registry.db "data/registry.db.backup.$(date +%Y%m%d_%H%M%S)"
fi

print_info "Pushing database schema..."
doppler run -- npm run db:push

print_success "Database initialized"

################################################################################
# Create systemd Service
################################################################################

print_header "CREATING SYSTEMD SERVICE"

print_info "Creating systemd service for Central-MCP..."

# Get current Doppler token
DOPPLER_TOKEN=$(doppler configure get token --plain)

sudo tee /etc/systemd/system/central-mcp.service > /dev/null << EOF
[Unit]
Description=Central-MCP Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/central-mcp
Environment="DOPPLER_TOKEN=$DOPPLER_TOKEN"
ExecStart=/usr/bin/doppler run -- npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable central-mcp

print_success "Systemd service created"

################################################################################
# Start Server
################################################################################

print_header "STARTING CENTRAL-MCP SERVER"

print_info "Starting service..."
sudo systemctl start central-mcp

# Wait for startup
sleep 5

# Check status
if sudo systemctl is-active --quiet central-mcp; then
    print_success "Central-MCP server is running!"
else
    print_info "Server status:"
    sudo systemctl status central-mcp
fi

################################################################################
# Health Check
################################################################################

print_header "HEALTH CHECK"

print_info "Checking server health..."
sleep 2

if curl -s http://localhost:3000/health > /dev/null; then
    print_success "Health check passed!"
    echo ""
    curl http://localhost:3000/health | jq .
else
    print_info "Server may still be starting. Check logs:"
    echo "  sudo journalctl -u central-mcp -f"
fi

################################################################################
# Summary
################################################################################

print_header "SETUP COMPLETE"

echo ""
print_success "✅ Central-MCP server is ready!"
echo ""
print_info "Useful commands:"
echo "  • Check status: sudo systemctl status central-mcp"
echo "  • View logs: sudo journalctl -u central-mcp -f"
echo "  • Restart: sudo systemctl restart central-mcp"
echo "  • Stop: sudo systemctl stop central-mcp"
echo ""
print_info "Access from other machines:"
echo "  • Get external IP: curl ifconfig.me"
echo "  • Health endpoint: http://\$(curl -s ifconfig.me):3000/health"
echo ""
print_info "Doppler management:"
echo "  • Update secrets: doppler secrets set KEY=value"
echo "  • View secrets: doppler secrets"
echo ""
