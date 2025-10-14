#!/bin/bash

################################################################################
# DEPLOY CENTRAL-MCP WITH YOUR EXISTING DOPPLER CREDENTIALS
################################################################################
#
# This script uses your existing:
#   - gcloud CLI configuration
#   - Doppler credentials
#   - Google Cloud project
#
# Just run: ./scripts/deploy-with-doppler.sh
#
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

################################################################################
# Pre-Flight Checks
################################################################################

print_header "PRE-FLIGHT CHECKS"

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found"
    exit 1
fi
print_success "gcloud CLI: $(gcloud version --format='value(core)' 2>/dev/null | head -1)"

# Check authentication
CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$CURRENT_ACCOUNT" ]; then
    print_error "Not authenticated. Run: gcloud auth login"
    exit 1
fi
print_success "Authenticated as: $CURRENT_ACCOUNT"

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    print_warning "No project selected"
    print_info "Available projects:"
    gcloud projects list
    echo ""
    read -p "Enter project ID (or press Enter to create new): " PROJECT_ID

    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID="central-mcp-$(date +%Y%m%d)"
        print_info "Creating new project: $PROJECT_ID"
        gcloud projects create "$PROJECT_ID"
    fi

    gcloud config set project "$PROJECT_ID"
else
    PROJECT_ID="$CURRENT_PROJECT"
    print_success "Using project: $PROJECT_ID"

    read -p "Use this project? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Available projects:"
        gcloud projects list
        echo ""
        read -p "Enter project ID: " PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    fi
fi

# Check Doppler
if ! command -v doppler &> /dev/null; then
    print_warning "Doppler CLI not found locally (will be installed on VMs)"
else
    print_success "Doppler CLI: $(doppler --version)"
fi

################################################################################
# Configuration
################################################################################

print_header "DEPLOYMENT CONFIGURATION"

REGION="us-central1"
ZONE="us-central1-a"

CENTRAL_MCP_VM="central-mcp-server"
AGENT_VM="central-mcp-agent-A"

echo ""
print_info "Configuration:"
echo "  • Project: $PROJECT_ID"
echo "  • Region: $REGION"
echo "  • Zone: $ZONE"
echo "  • Central-MCP VM: $CENTRAL_MCP_VM (E2-micro - FREE!)"
echo "  • Agent VM: $AGENT_VM (E2-standard-4 preemptible - \$46/mo)"
echo ""

read -p "Proceed with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

################################################################################
# Enable APIs
################################################################################

print_header "ENABLING GOOGLE CLOUD APIS"

print_info "Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com

print_success "APIs enabled"

################################################################################
# Firewall Rules
################################################################################

print_header "CONFIGURING FIREWALL"

# SSH
if ! gcloud compute firewall-rules describe allow-ssh &> /dev/null 2>&1; then
    print_info "Creating SSH firewall rule..."
    gcloud compute firewall-rules create allow-ssh \
        --allow=tcp:22 \
        --source-ranges=0.0.0.0/0 \
        --description="Allow SSH access"
    print_success "SSH firewall rule created"
else
    print_info "SSH firewall rule exists"
fi

# MCP Server
if ! gcloud compute firewall-rules describe allow-mcp &> /dev/null 2>&1; then
    print_info "Creating MCP firewall rule..."
    gcloud compute firewall-rules create allow-mcp \
        --allow=tcp:3000 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=mcp-server \
        --description="Allow MCP server connections"
    print_success "MCP firewall rule created"
else
    print_info "MCP firewall rule exists"
fi

# Internal
if ! gcloud compute firewall-rules describe allow-internal &> /dev/null 2>&1; then
    print_info "Creating internal firewall rule..."
    gcloud compute firewall-rules create allow-internal \
        --allow=tcp:0-65535,udp:0-65535,icmp \
        --source-ranges=10.128.0.0/9 \
        --description="Allow internal communication"
    print_success "Internal firewall rule created"
else
    print_info "Internal firewall rule exists"
fi

################################################################################
# Deploy Central-MCP Server (E2-MICRO - FREE!)
################################################################################

print_header "DEPLOYING CENTRAL-MCP SERVER (FREE TIER!)"

if gcloud compute instances describe "$CENTRAL_MCP_VM" --zone="$ZONE" &> /dev/null 2>&1; then
    print_warning "VM already exists: $CENTRAL_MCP_VM"
    read -p "Delete and recreate? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud compute instances delete "$CENTRAL_MCP_VM" --zone="$ZONE" --quiet
        print_info "VM deleted"
    else
        print_info "Skipping Central-MCP VM creation"
        SKIP_CENTRAL=1
    fi
fi

if [ -z "$SKIP_CENTRAL" ]; then
    print_info "Creating E2-micro VM (FREE FOREVER!)..."

    gcloud compute instances create "$CENTRAL_MCP_VM" \
        --zone="$ZONE" \
        --machine-type=e2-micro \
        --boot-disk-size=30GB \
        --boot-disk-type=pd-standard \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --tags=mcp-server \
        --metadata=startup-script='#!/bin/bash
            apt-get update
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs git sqlite3 libsqlite3-dev build-essential python3
            mkdir -p /opt/central-mcp
        '

    print_success "Central-MCP server created! (Cost: \$0/month - FREE!)"
fi

################################################################################
# Deploy Agent VM (PREEMPTIBLE)
################################################################################

print_header "DEPLOYING AGENT VM (PREEMPTIBLE)"

if gcloud compute instances describe "$AGENT_VM" --zone="$ZONE" &> /dev/null 2>&1; then
    print_warning "VM already exists: $AGENT_VM"
    read -p "Delete and recreate? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud compute instances delete "$AGENT_VM" --zone="$ZONE" --quiet
        print_info "VM deleted"
    else
        print_info "Skipping Agent VM creation"
        SKIP_AGENT=1
    fi
fi

if [ -z "$SKIP_AGENT" ]; then
    print_info "Creating E2-standard-4 preemptible VM (\$46/month)..."

    gcloud compute instances create "$AGENT_VM" \
        --zone="$ZONE" \
        --machine-type=e2-standard-4 \
        --boot-disk-size=100GB \
        --boot-disk-type=pd-ssd \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --preemptible \
        --metadata=startup-script='#!/bin/bash
            apt-get update
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs git build-essential curl wget vim
            mkdir -p /home/$(whoami)/workspace
        '

    print_success "Agent VM created! (Cost: \$46/month preemptible)"
fi

################################################################################
# Get Access Information
################################################################################

print_header "DEPLOYMENT COMPLETE!"

CENTRAL_IP=$(gcloud compute instances describe "$CENTRAL_MCP_VM" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)' 2>/dev/null)
AGENT_IP=$(gcloud compute instances describe "$AGENT_VM" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)' 2>/dev/null)

echo ""
print_success "✅ VMs are running!"
echo ""

print_info "Access Information:"
echo ""
echo "Central-MCP Server:"
echo "  IP: $CENTRAL_IP"
echo "  SSH: gcloud compute ssh $CENTRAL_MCP_VM --zone=$ZONE"
echo ""
echo "Agent VM:"
echo "  IP: $AGENT_IP"
echo "  SSH: gcloud compute ssh $AGENT_VM --zone=$ZONE"
echo ""

print_info "Cost Breakdown:"
echo "  • Central-MCP (E2-micro): \$0/month (FREE TIER!)"
echo "  • Agent VM (E2-standard-4 preemptible): \$46/month"
echo "  • Network: ~\$3/month"
echo "  • Total: ~\$49/month"
echo ""
echo "  First 3 months: \$0 (using \$300 free trial credit)"
echo ""

################################################################################
# Setup Instructions
################################################################################

print_header "NEXT STEPS"

echo ""
print_info "1. Copy setup script to Central-MCP server:"
echo "   gcloud compute scp scripts/setup-central-mcp-server.sh $CENTRAL_MCP_VM:/tmp/ --zone=$ZONE"
echo ""
print_info "2. SSH into Central-MCP server:"
echo "   gcloud compute ssh $CENTRAL_MCP_VM --zone=$ZONE"
echo ""
print_info "3. Run setup script on the VM:"
echo "   sudo mv /tmp/setup-central-mcp-server.sh /opt/central-mcp/"
echo "   cd /opt/central-mcp"
echo "   sudo bash setup-central-mcp-server.sh"
echo ""
print_info "4. The setup script will:"
echo "   • Install Doppler CLI"
echo "   • Clone your repository"
echo "   • Configure Doppler credentials"
echo "   • Install dependencies"
echo "   • Initialize database"
echo "   • Create systemd service"
echo "   • Start Central-MCP server"
echo ""

print_success "Deployment script complete!"
echo ""
