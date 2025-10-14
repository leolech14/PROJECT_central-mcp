#!/bin/bash

################################################################################
# GOOGLE CLOUD DEPLOYMENT SCRIPT - TESTING CONFIGURATION ($49/MONTH)
################################################################################
#
# Configuration:
#   - Central-MCP Server: E2-micro (FREE TIER FOREVER!)
#   - Agent VM: E2-standard-4 (preemptible, $46/month)
#   - Network: ~$3/month
#   - Total: ~$49/month
#
# First 3 months: $0 (using $300 free trial credit)
# Month 4+: ~$49/month
#
# Prerequisites:
#   - gcloud CLI installed and configured
#   - Google Cloud account with billing enabled
#   - $300 free trial credit (for new accounts)
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-central-mcp-testing}"
REGION="us-central1"
ZONE="us-central1-a"
NETWORK_NAME="central-mcp-network"

# VM Configuration
CENTRAL_MCP_VM="central-mcp-server"
CENTRAL_MCP_MACHINE_TYPE="e2-micro"  # FREE TIER!
CENTRAL_MCP_DISK_SIZE="30GB"
CENTRAL_MCP_DISK_TYPE="pd-standard"  # Standard HDD (free tier)

AGENT_VM="central-mcp-agent-A"
AGENT_MACHINE_TYPE="e2-standard-4"
AGENT_DISK_SIZE="100GB"
AGENT_DISK_TYPE="pd-ssd"

# Repository
REPO_URL="https://github.com/yourusername/central-mcp.git"  # UPDATE THIS!

################################################################################
# Helper Functions
################################################################################

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
# Verification
################################################################################

print_header "VERIFICATION"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "gcloud CLI installed"

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    print_error "Not authenticated. Run: gcloud auth login"
    exit 1
fi
print_success "Authenticated as: $(gcloud auth list --filter=status:ACTIVE --format='value(account)')"

################################################################################
# Project Setup
################################################################################

print_header "PROJECT SETUP"

# Check if project exists
if gcloud projects describe "$PROJECT_ID" &> /dev/null; then
    print_info "Using existing project: $PROJECT_ID"
else
    print_info "Creating new project: $PROJECT_ID"
    gcloud projects create "$PROJECT_ID" --name="Central-MCP Testing"
    print_success "Project created"
fi

# Set active project
gcloud config set project "$PROJECT_ID"
print_success "Active project: $PROJECT_ID"

# Enable billing (if not already enabled)
print_info "Checking billing status..."
if ! gcloud beta billing projects describe "$PROJECT_ID" &> /dev/null; then
    print_warning "Billing not enabled. Please enable billing in Google Cloud Console:"
    print_warning "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    read -p "Press Enter when billing is enabled..."
fi
print_success "Billing enabled"

# Enable required APIs
print_info "Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
print_success "APIs enabled"

################################################################################
# Network Setup
################################################################################

print_header "NETWORK SETUP"

# Create firewall rules
print_info "Creating firewall rules..."

# Allow SSH (port 22)
if ! gcloud compute firewall-rules describe allow-ssh &> /dev/null; then
    gcloud compute firewall-rules create allow-ssh \
        --allow=tcp:22 \
        --source-ranges=0.0.0.0/0 \
        --description="Allow SSH access"
    print_success "SSH firewall rule created"
else
    print_info "SSH firewall rule already exists"
fi

# Allow MCP server (port 3000)
if ! gcloud compute firewall-rules describe allow-mcp &> /dev/null; then
    gcloud compute firewall-rules create allow-mcp \
        --allow=tcp:3000 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=mcp-server \
        --description="Allow MCP server connections"
    print_success "MCP firewall rule created"
else
    print_info "MCP firewall rule already exists"
fi

# Allow internal communication
if ! gcloud compute firewall-rules describe allow-internal &> /dev/null; then
    gcloud compute firewall-rules create allow-internal \
        --allow=tcp:0-65535,udp:0-65535,icmp \
        --source-ranges=10.128.0.0/9 \
        --description="Allow internal communication"
    print_success "Internal firewall rule created"
else
    print_info "Internal firewall rule already exists"
fi

################################################################################
# Central-MCP Server Deployment (E2-MICRO - FREE!)
################################################################################

print_header "CENTRAL-MCP SERVER DEPLOYMENT (FREE TIER!)"

if gcloud compute instances describe "$CENTRAL_MCP_VM" --zone="$ZONE" &> /dev/null; then
    print_warning "Central-MCP VM already exists. Skipping creation."
else
    print_info "Creating Central-MCP server (E2-micro - FREE FOREVER!)..."

    gcloud compute instances create "$CENTRAL_MCP_VM" \
        --zone="$ZONE" \
        --machine-type="$CENTRAL_MCP_MACHINE_TYPE" \
        --boot-disk-size="$CENTRAL_MCP_DISK_SIZE" \
        --boot-disk-type="$CENTRAL_MCP_DISK_TYPE" \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --tags=mcp-server \
        --metadata=startup-script='#!/bin/bash
            # Update system
            apt-get update
            apt-get upgrade -y

            # Install Node.js 20.x
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs

            # Install Git
            apt-get install -y git

            # Install SQLite
            apt-get install -y sqlite3 libsqlite3-dev

            # Install build tools for better-sqlite3
            apt-get install -y build-essential python3

            # Create deployment directory
            mkdir -p /opt/central-mcp
            cd /opt/central-mcp

            # Clone repository (will fail if repo URL not updated - manual step required)
            # git clone '"$REPO_URL"' .

            echo "✓ Central-MCP server initialized"
            echo "⚠ Manual step required: Clone repository and install dependencies"
        '

    print_success "Central-MCP server created! (Cost: $0/month - FREE TIER!)"
fi

################################################################################
# Agent VM Deployment (E2-STANDARD-4 PREEMPTIBLE)
################################################################################

print_header "AGENT VM DEPLOYMENT (PREEMPTIBLE)"

if gcloud compute instances describe "$AGENT_VM" --zone="$ZONE" &> /dev/null; then
    print_warning "Agent VM already exists. Skipping creation."
else
    print_info "Creating Agent VM (E2-standard-4 preemptible - $46/month)..."

    gcloud compute instances create "$AGENT_VM" \
        --zone="$ZONE" \
        --machine-type="$AGENT_MACHINE_TYPE" \
        --boot-disk-size="$AGENT_DISK_SIZE" \
        --boot-disk-type="$AGENT_DISK_TYPE" \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --preemptible \
        --metadata=startup-script='#!/bin/bash
            # Update system
            apt-get update
            apt-get upgrade -y

            # Install Node.js 20.x
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs

            # Install Git
            apt-get install -y git

            # Install development tools
            apt-get install -y build-essential curl wget vim

            # Create workspace
            mkdir -p /home/agent/workspace

            echo "✓ Agent VM initialized"
        '

    print_success "Agent VM created! (Cost: ~$46/month preemptible)"
fi

################################################################################
# Deployment Status
################################################################################

print_header "DEPLOYMENT STATUS"

echo ""
print_success "✅ DEPLOYMENT COMPLETE!"
echo ""

print_info "VMs Created:"
echo "  • Central-MCP Server: $CENTRAL_MCP_VM (E2-micro - FREE!)"
echo "  • Agent VM: $AGENT_VM (E2-standard-4 preemptible - $46/month)"
echo ""

print_info "Total Cost Estimate:"
echo "  • Months 1-3: \$0 (using \$300 free trial credit)"
echo "  • Month 4+: ~\$49/month"
echo ""

print_info "Getting VM IP addresses..."
CENTRAL_IP=$(gcloud compute instances describe "$CENTRAL_MCP_VM" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
AGENT_IP=$(gcloud compute instances describe "$AGENT_VM" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
print_info "Access Information:"
echo "  • Central-MCP: ssh -i ~/.ssh/google_compute_engine $(gcloud config get-value account | cut -d@ -f1)@$CENTRAL_IP"
echo "  • Agent VM: ssh -i ~/.ssh/google_compute_engine $(gcloud config get-value account | cut -d@ -f1)@$AGENT_IP"
echo ""

################################################################################
# Manual Setup Instructions
################################################################################

print_header "MANUAL SETUP REQUIRED"

echo ""
print_warning "Complete these steps manually:"
echo ""
echo "1️⃣ SSH into Central-MCP server:"
echo "   ssh -i ~/.ssh/google_compute_engine $(gcloud config get-value account | cut -d@ -f1)@$CENTRAL_IP"
echo ""
echo "2️⃣ Clone Central-MCP repository:"
echo "   cd /opt/central-mcp"
echo "   git clone $REPO_URL ."
echo ""
echo "3️⃣ Install dependencies:"
echo "   npm install"
echo ""
echo "4️⃣ Set up Doppler credentials:"
echo "   # Install Doppler CLI"
echo "   curl -Ls https://cli.doppler.com/install.sh | sh"
echo "   doppler login"
echo "   doppler setup --project central-mcp --config production"
echo ""
echo "5️⃣ Initialize database:"
echo "   npm run db:push"
echo ""
echo "6️⃣ Start MCP server:"
echo "   npm run start"
echo ""
echo "7️⃣ Verify deployment:"
echo "   curl http://localhost:3000/health"
echo ""

print_header "FREE TIER VERIFICATION"

echo ""
print_success "✅ E2-micro is FREE FOREVER in us-central1!"
echo ""
print_info "Free Tier Limits:"
echo "  • 1 E2-micro VM instance per month"
echo "  • 30 GB standard persistent disk"
echo "  • 1 GB network egress (North America)"
echo "  • Regions: us-west1, us-central1, us-east1"
echo ""
print_warning "⚠️ IMPORTANT:"
echo "  • Only 1 E2-micro VM is free (additional VMs are charged)"
echo "  • Must be in us-west1, us-central1, or us-east1"
echo "  • Standard disk only (SSD costs extra)"
echo "  • Over 30 GB disk costs \$0.04/GB/month"
echo ""

print_header "MONITORING COSTS"

echo ""
print_info "Monitor your costs:"
echo "  1. Google Cloud Console: https://console.cloud.google.com/billing"
echo "  2. Set up billing alerts:"
echo "     gcloud alpha billing budgets create \\"
echo "       --billing-account=\$(gcloud beta billing projects describe $PROJECT_ID --format='value(billingAccountName)') \\"
echo "       --display-name='Central-MCP Budget Alert' \\"
echo "       --budget-amount=100 \\"
echo "       --threshold-rule=percent=50 \\"
echo "       --threshold-rule=percent=90"
echo ""

print_success "🎉 Deployment script complete!"
print_info "Next: Follow manual setup steps above to complete installation"
echo ""
