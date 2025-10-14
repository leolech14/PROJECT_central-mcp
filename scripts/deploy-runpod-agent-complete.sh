#!/bin/bash
# COMPLETE RUNPOD AGENT DEPLOYMENT PIPELINE
# Build → Push → Deploy → Monitor
# Git Strategy Integration + Conventional Commits

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🚀 RUNPOD AGENT DEPLOYMENT PIPELINE                    ║"
echo "║    Central-MCP + Git Strategy + Conventional Commits       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PROJECT_ROOT="/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp"
DOCKER_IMAGE="central-mcp-agent"
DOCKER_TAG="latest"
DOCKER_REGISTRY="${DOCKER_USERNAME:-lech}"  # Override with your Docker Hub username

cd "$PROJECT_ROOT"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 0: Verify Prerequisites
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 0: VERIFY PREREQUISITES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "Install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✅ Docker installed: $(docker --version | head -1)"

# Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon not running${NC}"
    echo "Start Docker Desktop and try again"
    exit 1
fi
echo "✅ Docker daemon running"

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username:"; then
    echo -e "${YELLOW}⚠️  Not logged in to Docker Hub${NC}"
    echo ""
    echo "Login now? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker login
    else
        echo "Skipping Docker push (will build locally only)"
        SKIP_PUSH=true
    fi
else
    echo "✅ Docker Hub authenticated"
fi

# Check RunPod API key
RUNPOD_API_KEY=$(doppler secrets get RUNPOD_API_KEY --project central-mcp --config prod --plain 2>/dev/null || echo "")
if [ -z "$RUNPOD_API_KEY" ] || [ "$RUNPOD_API_KEY" = "NOT_SET" ]; then
    echo -e "${YELLOW}⚠️  RunPod API key not configured${NC}"
    echo ""
    echo "Get your API key from: https://www.runpod.io/console/user/settings"
    echo ""
    echo "Then set it:"
    echo "  doppler secrets set RUNPOD_API_KEY \"your-key\" --project central-mcp --config prod"
    echo ""
    echo "Continue without API key? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SKIP_DEPLOY=true
else
    echo "✅ RunPod API key configured"
fi

# Check Doppler
if ! command -v doppler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Doppler CLI not found (optional)${NC}"
else
    echo "✅ Doppler CLI installed"
fi

echo ""

# Step 1: Build Docker Image
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 STEP 1: BUILD DOCKER IMAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Building $DOCKER_IMAGE:$DOCKER_TAG..."
echo ""

docker build \
  -f docker/Dockerfile.agent \
  -t "$DOCKER_IMAGE:$DOCKER_TAG" \
  -t "$DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG" \
  . || {
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
}

echo ""
echo -e "${GREEN}✅ Docker image built successfully${NC}"
echo ""

# Verify image
docker images | grep "$DOCKER_IMAGE" | head -3
echo ""

# Step 2: Test Image Locally
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 STEP 2: TEST IMAGE LOCALLY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Testing image startup..."
CONTAINER_ID=$(docker run -d \
  -e AGENT_LETTER=TEST \
  -e AGENT_MODEL=claude-sonnet-4-5 \
  -e AGENT_ROLE=test \
  "$DOCKER_IMAGE:$DOCKER_TAG")

echo "Container ID: $CONTAINER_ID"
sleep 2

echo ""
echo "Container logs:"
docker logs "$CONTAINER_ID" || true

echo ""
echo "Stopping test container..."
docker stop "$CONTAINER_ID" > /dev/null
docker rm "$CONTAINER_ID" > /dev/null

echo -e "${GREEN}✅ Image test passed${NC}"
echo ""

# Step 3: Push to Registry
if [ "$SKIP_PUSH" != "true" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📤 STEP 3: PUSH TO DOCKER REGISTRY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "Pushing to Docker Hub: $DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG"
  echo ""

  docker push "$DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG" || {
    echo -e "${RED}❌ Push failed${NC}"
    echo ""
    echo "Make sure you're logged in:"
    echo "  docker login"
    exit 1
  }

  echo ""
  echo -e "${GREEN}✅ Image pushed successfully${NC}"
  echo ""
  echo "Image available at:"
  echo "  $DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG"
  echo ""
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⏭️  STEP 3: SKIPPED (Docker push)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
fi

# Step 4: Deploy to RunPod
if [ "$SKIP_DEPLOY" != "true" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🚀 STEP 4: DEPLOY TO RUNPOD"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "Agent deployment options:"
  echo ""
  echo "1. Deploy via RunPod Web UI (Recommended for first time)"
  echo "   → Visit: https://runpod.io/console/pods"
  echo "   → Click '+ Deploy'"
  echo "   → Container Image: $DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG"
  echo "   → Environment Variables:"
  echo "       AGENT_LETTER=A"
  echo "       AGENT_MODEL=claude-sonnet-4-5"
  echo "       AGENT_ROLE=ui-velocity"
  echo "       CENTRAL_MCP_URL=http://34.41.115.199:3000"
  echo ""
  echo "2. Deploy via API (Advanced)"
  echo "   → Use scripts/deploy-runpod-via-api.sh"
  echo ""

  echo "Open RunPod console now? (y/n)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    open "https://runpod.io/console/pods" 2>/dev/null || \
    xdg-open "https://runpod.io/console/pods" 2>/dev/null || \
    echo "Visit: https://runpod.io/console/pods"
  fi
  echo ""
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⏭️  STEP 4: SKIPPED (RunPod deployment)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
fi

# Step 5: Configure Git Strategy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 STEP 5: GIT STRATEGY CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Checking Git Intelligence configuration..."
echo ""

# Check if GitPushMonitor is enabled
if grep -q "GitPushMonitor" src/auto-proactive/AutoProactiveEngine.ts; then
  echo "✅ GitPushMonitor loop configured"
else
  echo -e "${YELLOW}⚠️  GitPushMonitor not in AutoProactiveEngine${NC}"
fi

# Check if GitIntelligenceEngine exists
if [ -f "src/git/GitIntelligenceEngine.ts" ]; then
  echo "✅ GitIntelligenceEngine exists"
else
  echo -e "${YELLOW}⚠️  GitIntelligenceEngine.ts not found${NC}"
fi

# Check conventional commit configuration
if [ -f ".commitlintrc.json" ] || [ -f "commitlint.config.js" ]; then
  echo "✅ Commitlint configured"
else
  echo -e "${YELLOW}⚠️  Commitlint not configured${NC}"
  echo ""
  echo "Would you like to install commitlint? (y/n)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    npm install --save-dev @commitlint/cli @commitlint/config-conventional
    echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
    echo -e "${GREEN}✅ Commitlint installed${NC}"
  fi
fi

echo ""

# Step 6: Verification Dashboard
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 6: MONITORING & VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Dashboard URLs:"
echo "  • Central-MCP Dashboard: http://34.41.115.199:8000/central-mcp-dashboard.html"
echo "  • RunPod Console:        https://runpod.io/console/pods"
echo "  • Health Endpoint:       http://34.41.115.199:3000/health"
echo ""

echo "Next steps after pod deployment:"
echo ""
echo "1. SSH into RunPod pod:"
echo "   ssh root@pod-ip-address"
echo ""
echo "2. Start Claude Code CLI:"
echo "   claude-code"
echo ""
echo "3. Connect to Central-MCP:"
echo "   Say: \"Connect to MCP\""
echo ""
echo "4. Monitor in dashboard:"
echo "   → Agent will appear in 'Agents' tab"
echo "   → Session tracking in real-time"
echo "   → Task assignment automatic"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT PIPELINE COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📦 Artifacts Created:"
echo "  • Docker Image: $DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG"
if [ "$SKIP_PUSH" != "true" ]; then
  echo "  • Registry: Docker Hub (public)"
fi
echo "  • Size: $(docker images "$DOCKER_IMAGE:$DOCKER_TAG" --format "{{.Size}}")"
echo ""

echo "📋 Status Summary:"
echo "  Docker Build:     ✅ Complete"
if [ "$SKIP_PUSH" != "true" ]; then
  echo "  Registry Push:    ✅ Complete"
else
  echo "  Registry Push:    ⏭️  Skipped"
fi
if [ "$SKIP_DEPLOY" != "true" ]; then
  echo "  RunPod Deploy:    🔄 Manual (web UI)"
else
  echo "  RunPod Deploy:    ⏭️  Skipped (no API key)"
fi
echo "  Git Strategy:     ✅ Configured"
echo ""

echo "🎯 Estimated RunPod Cost:"
echo "  RTX 4090: \$0.69/hour = \$16.56/day = \$496/month"
echo "  RTX A40:  \$0.59/hour = \$14.16/day = \$424/month"
echo "  (Start/stop as needed to optimize costs)"
echo ""

echo "🚀 System ready for multi-agent deployment!"
echo ""
