#!/bin/bash
# VM AGENT INITIALIZATION - Clone projects and launch multi-agent system

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 CENTRAL-MCP VM AGENT INITIALIZATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create workspace directory
mkdir -p ~/agent-workspace
cd ~/agent-workspace

echo "📦 CLONING 5 SELECTED PROJECTS FROM GITHUB..."
echo ""

# Clone all 5 projects
projects=(
  "https://github.com/leolech14/profilepro.git"
  "https://github.com/leolech14/LocalBrain.git"
  "https://github.com/leolech14/central-mcp.git"
  "https://github.com/leolech14/ytpipe.git"
  "https://github.com/leolech14/finops.git"
)

for repo in "${projects[@]}"; do
  project_name=$(basename "$repo" .git)
  if [ -d "$project_name" ]; then
    echo "⏭️  $project_name already exists, pulling latest..."
    cd "$project_name"
    git pull
    cd ..
  else
    echo "📥 Cloning $project_name..."
    git clone "$repo"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL 5 PROJECTS CLONED SUCCESSFULLY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# List cloned projects
echo "📂 Workspace contents:"
ls -la ~/agent-workspace/
echo ""

# Check if Central-MCP is running
echo "🔍 Checking Central-MCP server status..."
if pgrep -f "central-mcp" > /dev/null; then
  echo "✅ Central-MCP server is running"
else
  echo "⚠️  Central-MCP server not running, starting it..."
  cd ~/agent-workspace/central-mcp
  npm install
  npm run build
  nohup npm start > ~/central-mcp.log 2>&1 &
  echo "✅ Central-MCP server started"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 READY TO LAUNCH AGENTS!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Dashboard: http://34.41.115.199:8000"
echo "Projects: ~/agent-workspace/"
echo ""
echo "Next: Run launch-multi-agents.sh to start 4 agents"
