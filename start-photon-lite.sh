#!/bin/bash

# 🚀 PHOTON LITE Quick Start - Zero Dependencies Version
# =======================================================
# Revolutionary AI coordination platform that runs instantly

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

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
echo -e "${BLUE}   🌟 Cloud Agentic Operations Center - LITE VERSION${NC}"
echo -e "${GREEN}   ⚡ Zero Dependencies - Instant Deployment!${NC}"
echo ""

echo -e "${PURPLE}[INFO]${NC} Starting PHOTON LITE Cloud Operations Center..."
echo -e "${PURPLE}[INFO]${NC} No compilation required - Pure Node.js!"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "\033[0;31m[ERROR] Node.js is required. Please install Node.js 18+\033[0m"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}[SUCCESS]${NC} Node.js $NODE_VERSION detected ✓"

# Start PHOTON LITE
echo -e "${PURPLE}[INFO]${NC} Launching PHOTON LITE server..."
echo ""

# Set port if provided
PORT=${PHOTON_PORT:-8080}
export PHOTON_PORT=$PORT

# Start the server
node src/photon/PhotonServer-Lite.js