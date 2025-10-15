#!/bin/bash

# 🔍 MCP Configuration Verification Script
# =========================================
# Comprehensive check of Central-MCP server configuration

set -e

echo "🔍 MCP CONFIGURATION VERIFICATION"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check 1: Claude Desktop Config
echo "📋 Check 1: Claude Desktop Configuration"
echo "----------------------------------------"
CONFIG_FILE="$HOME/.config/claude-desktop/claude_desktop_config.json"

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✅ Config file exists${NC}"

    # Check if central-mcp is configured
    if grep -q '"central-mcp"' "$CONFIG_FILE"; then
        echo -e "${GREEN}✅ central-mcp server configured${NC}"
    else
        echo -e "${RED}❌ central-mcp server NOT configured${NC}"
        echo -e "${YELLOW}   Add to mcpServers section${NC}"
    fi

    # Check if localbrain-task-registry is configured
    if grep -q '"localbrain-task-registry"' "$CONFIG_FILE"; then
        echo -e "${GREEN}✅ localbrain-task-registry configured${NC}"
    else
        echo -e "${YELLOW}⚠️  localbrain-task-registry not configured${NC}"
    fi

    # Count total MCP servers
    SERVER_COUNT=$(jq '.mcpServers | keys | length' "$CONFIG_FILE" 2>/dev/null || echo "0")
    echo -e "${BLUE}📊 Total MCP servers: $SERVER_COUNT${NC}"
else
    echo -e "${RED}❌ Config file not found: $CONFIG_FILE${NC}"
fi

echo ""

# Check 2: Database Status
echo "💾 Check 2: Database Status"
echo "----------------------------"
DB_FILE="./data/registry.db"

if [ -f "$DB_FILE" ]; then
    DB_SIZE=$(ls -lh "$DB_FILE" | awk '{print $5}')
    echo -e "${GREEN}✅ Database exists: $DB_SIZE${NC}"

    # Check tables
    TABLE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
    echo -e "${BLUE}📊 Tables: $TABLE_COUNT${NC}"

    # Check if tasks table exists
    if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks';" 2>/dev/null | grep -q "tasks"; then
        TASK_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM tasks;" 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Tasks table exists ($TASK_COUNT tasks)${NC}"
    else
        echo -e "${YELLOW}⚠️  Tasks table not found${NC}"
    fi

    # Check if projects table exists
    if sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='projects';" 2>/dev/null | grep -q "projects"; then
        PROJECT_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM projects;" 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Projects table exists ($PROJECT_COUNT projects)${NC}"
    else
        echo -e "${YELLOW}⚠️  Projects table not found${NC}"
    fi
else
    echo -e "${RED}❌ Database not found: $DB_FILE${NC}"
fi

echo ""

# Check 3: Build Status
echo "🏗️  Check 3: Build Status"
echo "-------------------------"

if [ -f "dist/index.js" ]; then
    DIST_SIZE=$(ls -lh dist/index.js 2>/dev/null | awk '{print $5}')
    DIST_DATE=$(ls -l dist/index.js 2>/dev/null | awk '{print $6, $7, $8}')
    echo -e "${GREEN}✅ dist/index.js exists ($DIST_SIZE)${NC}"
    echo -e "${BLUE}📅 Last built: $DIST_DATE${NC}"

    # Check if source is newer than dist
    if [ "src/index.ts" -nt "dist/index.js" ]; then
        echo -e "${YELLOW}⚠️  Source newer than build - rebuild needed${NC}"
    else
        echo -e "${GREEN}✅ Build is up to date${NC}"
    fi
else
    echo -e "${RED}❌ dist/index.js not found - build required${NC}"
fi

# Try to compile TypeScript
echo -e "${BLUE}🔨 Testing TypeScript compilation...${NC}"
if npm run build > /tmp/ts-build.log 2>&1; then
    echo -e "${GREEN}✅ TypeScript compiles successfully${NC}"
else
    ERROR_COUNT=$(grep -c "error TS" /tmp/ts-build.log || echo "0")
    echo -e "${RED}❌ TypeScript has $ERROR_COUNT errors${NC}"
    echo -e "${YELLOW}   See /tmp/ts-build.log for details${NC}"
fi

echo ""

# Check 4: Source Files
echo "📁 Check 4: Critical Source Files"
echo "----------------------------------"

FILES=(
    "src/index.ts"
    "src/tools/index.ts"
    "src/tools/ui/uiConfigPro.ts"
    "src/photon/PhotonServer-Lite.ts"
    "public/ui-configpro-dashboard.html"
    "public/ui-studio.html"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ $file ($SIZE lines)${NC}"
    else
        echo -e "${RED}❌ $file not found${NC}"
    fi
done

echo ""

# Check 5: Running Processes
echo "🏃 Check 5: Running MCP Servers"
echo "--------------------------------"

if pgrep -f "central-mcp.*dist/index.js" > /dev/null; then
    echo -e "${GREEN}✅ central-mcp MCP server is RUNNING${NC}"
    pgrep -fa "central-mcp.*dist/index.js"
else
    echo -e "${YELLOW}⚠️  central-mcp MCP server not running${NC}"
fi

if pgrep -f "localbrain-task-registry.*dist/index.js" > /dev/null; then
    echo -e "${GREEN}✅ localbrain-task-registry is RUNNING${NC}"
    pgrep -fa "localbrain-task-registry.*dist/index.js"
else
    echo -e "${YELLOW}⚠️  localbrain-task-registry not running${NC}"
fi

# Count all MCP-related processes
MCP_PROCS=$(pgrep -fc "mcp" || echo "0")
echo -e "${BLUE}📊 Total MCP-related processes: $MCP_PROCS${NC}"

echo ""

# Check 6: Static Files for UI Config Pro
echo "🎨 Check 6: UI Config Pro Static Files"
echo "---------------------------------------"

if [ -f "public/ui-studio.html" ]; then
    STUDIO_SIZE=$(ls -lh public/ui-studio.html | awk '{print $5}')
    echo -e "${GREEN}✅ ULTIMATE-UI-STUDIO-V2: $STUDIO_SIZE${NC}"
else
    echo -e "${RED}❌ UI Studio file missing${NC}"
fi

if [ -f "public/ui-configpro-dashboard.html" ]; then
    DASH_SIZE=$(ls -lh public/ui-configpro-dashboard.html | awk '{print $5}')
    echo -e "${GREEN}✅ UI Config Pro Dashboard: $DASH_SIZE${NC}"
else
    echo -e "${RED}❌ Dashboard file missing${NC}"
fi

if [ -f "public/central-mcp-dashboard.html" ]; then
    CENTRAL_SIZE=$(ls -lh public/central-mcp-dashboard.html | awk '{print $5}')
    echo -e "${GREEN}✅ Central-MCP Dashboard: $CENTRAL_SIZE${NC}"
else
    echo -e "${RED}❌ Central dashboard file missing${NC}"
fi

echo ""

# Summary
echo "📊 VERIFICATION SUMMARY"
echo "======================="
echo ""

ISSUES=0

# Check critical issues
if ! grep -q '"central-mcp"' "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: central-mcp not in Claude Desktop config${NC}"
    ((ISSUES++))
fi

if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}❌ CRITICAL: Database missing${NC}"
    ((ISSUES++))
fi

if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ CRITICAL: Build output missing${NC}"
    ((ISSUES++))
fi

if ! npm run build > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  WARNING: TypeScript compilation has errors${NC}"
    ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "🎉 Your MCP configuration appears to be correct!"
else
    echo -e "${RED}❌ FOUND $ISSUES ISSUES${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review MCP_CONFIGURATION_AUDIT.md"
    echo "2. Fix TypeScript errors: npm run build"
    echo "3. Add central-mcp to Claude Desktop config"
    echo "4. Restart Claude Desktop"
fi

echo ""
echo "📚 For detailed analysis, see:"
echo "   MCP_CONFIGURATION_AUDIT.md"
echo ""
