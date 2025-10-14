#!/bin/bash

# 🚀 PHOTON Cloud Operations Center Quick Start
# ================================================
# Revolutionary AI coordination platform bootstrap script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logo
echo -e "${CYAN}"
echo "    ____  __    _______  __   __  _______  __    _  __   __"
echo "   (  _ \(  )  (  ____ )(  \ /  )(  ___  )(  )  ( ) \ \ / /"
echo "   | (_ (__)   | (    )|  ) (  | | (   ) || (    | |  \ / / "
echo "   |  |_) )   | (____)| (___) | | |   | || |    | |   ) /  "
echo "   |   _/     |     __)  _   /  | |   | || |    | |  / /   "
echo "   |  |       | (\ (    / \ \   | |   | || |    | | / /    "
echo "   |  |       | ) \ \__\  / /  | (___) || (____)| |/ /     "
echo "   (_)       |/   \__/  \/   (_______)(_______)__(/      "
echo ""
echo -e "${BLUE}   🌟 Cloud Agentic Operations Center - Revolutionary AI Coordination${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if Node.js is installed
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ to continue."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to 18+"
    exit 1
fi

print_success "Node.js $NODE_VERSION detected ✓"

# Check if npm is installed
print_step "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm to continue."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION detected ✓"

# Check if we're in the right directory
print_step "Checking directory structure..."
if [ ! -f "package-photon.json" ]; then
    print_error "package-photon.json not found. Please run this script from the central-mcp directory."
    exit 1
fi

print_success "Directory structure validated ✓"

# Copy package-photon.json to package.json if needed
if [ ! -f "package.json" ] || [ "package-photon.json" -nt "package.json" ]; then
    print_step "Setting up package.json..."
    cp package-photon.json package.json
    print_success "package.json updated ✓"
fi

# Install dependencies
print_step "Installing dependencies..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    npm install
    print_success "Dependencies installed ✓"
else
    print_status "Dependencies already installed ✓"
fi

# Set up environment configuration
print_step "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.photon.example" ]; then
        cp .env.photon.example .env
        print_status "Created .env from template ✓"
        print_warning "Please edit .env file with your API keys and configuration"
    else
        print_warning "No .env file found and no template available"
    fi
else
    print_status "Environment file exists ✓"
fi

# Create data directory
print_step "Creating data directory..."
mkdir -p data
print_success "Data directory created ✓"

# Build TypeScript
print_step "Building TypeScript..."
if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
    npm run build
    print_success "TypeScript build completed ✓"
else
    print_status "TypeScript build already up to date ✓"
fi

# Check for port availability
PHOTON_PORT=${PHOTON_PORT:-8080}
print_step "Checking port $PHOTON_PORT availability..."
if lsof -Pi :$PHOTON_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port $PHOTON_PORT is already in use"
    echo "Choose a different port by setting PHOTON_PORT environment variable:"
    echo "  PHOTON_PORT=8081 ./start-photon.sh"
    echo ""
    read -p "Do you want to use port 8081 instead? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        export PHOTON_PORT=8081
        print_status "Using port 8081 ✓"
    else
        print_error "Please stop the service using port $PHOTON_PORT or choose a different port"
        exit 1
    fi
else
    print_success "Port $PHOTON_PORT is available ✓"
fi

# Display configuration summary
echo ""
print_status "Configuration Summary:"
echo "  Environment: ${NODE_ENV:-development}"
echo "  Port: $PHOTON_PORT"
echo "  Database: ./data/photon.db"
echo "  Authentication: ${PHOTON_AUTH_ENABLED:-false}"
echo "  SSL: ${PHOTON_SSL_ENABLED:-false}"
echo ""

# Start PHOTON server
print_step "🚀 Starting PHOTON Cloud Operations Center..."
echo ""

# Set environment variables
export NODE_ENV=${NODE_ENV:-development}
export PHOTON_PORT=${PHOTON_PORT:-8080}
export PHOTON_LOG_LEVEL=${PHOTON_LOG_LEVEL:-debug}

# Start the server
if command -v nodemon &> /dev/null && [ "$NODE_ENV" = "development" ]; then
    print_status "Starting in development mode with nodemon..."
    npm run photon:dev
else
    print_status "Starting in production mode..."
    npm run photon:start
fi

# This script shouldn't reach here, but just in case
echo ""
print_error "PHOTON server stopped unexpectedly"
exit 1