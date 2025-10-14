#!/bin/bash

# 🔧 Add Central-MCP to Claude Desktop Configuration
# ===================================================
# Safely adds central-mcp MCP server to Claude Desktop config

set -e

echo "🔧 CLAUDE DESKTOP CONFIG UPDATER"
echo "================================="
echo ""

CONFIG_FILE="$HOME/.config/claude-desktop/claude_desktop_config.json"
BACKUP_FILE="$HOME/.config/claude-desktop/claude_desktop_config.json.backup-$(date +%Y%m%d-%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Config file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Check if central-mcp is already configured
if grep -q '"central-mcp"' "$CONFIG_FILE"; then
    echo -e "${YELLOW}⚠️  central-mcp already configured!${NC}"
    echo ""
    echo "Current configuration:"
    jq '.mcpServers["central-mcp"]' "$CONFIG_FILE"
    echo ""
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Create backup
echo -e "${BLUE}📋 Creating backup: $BACKUP_FILE${NC}"
cp "$CONFIG_FILE" "$BACKUP_FILE"

# Get absolute path to dist/index.js
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_PATH="$PROJECT_ROOT/dist/index.js"

if [ ! -f "$DIST_PATH" ]; then
    echo -e "${RED}❌ dist/index.js not found: $DIST_PATH${NC}"
    echo -e "${YELLOW}   Run 'npm run build' first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found dist/index.js: $DIST_PATH${NC}"

# Create the configuration entry
cat > /tmp/central-mcp-config.json <<EOF
{
  "central-mcp": {
    "command": "node",
    "args": [
      "$DIST_PATH"
    ],
    "env": {
      "NODE_ENV": "production",
      "DATABASE_PATH": "./data/registry.db"
    }
  }
}
EOF

# Merge with existing config
echo -e "${BLUE}🔧 Updating configuration...${NC}"

# Use jq to merge the configs
jq --slurpfile new /tmp/central-mcp-config.json \
   '.mcpServers += $new[0]' \
   "$CONFIG_FILE" > /tmp/updated-config.json

# Validate JSON
if jq empty /tmp/updated-config.json 2>/dev/null; then
    # Replace original with updated
    mv /tmp/updated-config.json "$CONFIG_FILE"
    echo -e "${GREEN}✅ Configuration updated successfully!${NC}"
else
    echo -e "${RED}❌ JSON validation failed${NC}"
    echo -e "${YELLOW}   Restoring backup...${NC}"
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
fi

# Show the updated config
echo ""
echo -e "${BLUE}📊 Updated central-mcp configuration:${NC}"
jq '.mcpServers["central-mcp"]' "$CONFIG_FILE"

# Cleanup
rm -f /tmp/central-mcp-config.json

echo ""
echo -e "${GREEN}✅ CONFIGURATION COMPLETE!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Restart Claude Desktop to apply changes"
echo "2. Open Claude Desktop"
echo "3. Look for central-mcp tools in the tools menu"
echo "4. Test with: 'Show me available MCP tools'"
echo ""
echo "🔄 To revert changes:"
echo "   cp $BACKUP_FILE $CONFIG_FILE"
echo ""
