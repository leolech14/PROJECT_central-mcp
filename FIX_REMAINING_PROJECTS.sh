#!/bin/bash
# FIX REMAINING 3 PROJECTS FOR GIT SYNC

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIXING LocalBrain, central-mcp, ytpipe FOR PUSH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# FIX 1: LocalBrain - node_modules already in gitignore but committed
echo "🔧 Fixing LocalBrain..."
cd /Users/lech/PROJECTS_all/LocalBrain
git rm -r --cached localbrain-electron/node_modules 2>/dev/null || true
git commit --amend --no-edit
git push -u origin main --force
echo "✅ LocalBrain fixed!"
echo ""

# FIX 2: PROJECT_youtube - add node_modules to gitignore
echo "🔧 Fixing PROJECT_youtube..."
cd /Users/lech/PROJECTS_all/PROJECT_youtube
echo "" >> .gitignore
echo "# Large binary files" >> .gitignore
echo "**/node_modules/**/*.node" >> .gitignore
git checkout --orphan fresh-main
git add -A
git commit -m "chore: VM agent sync - clean commit without large files"
git branch -D main
git branch -m main
git push -u origin main --force
echo "✅ PROJECT_youtube fixed!"
echo ""

# FIX 3: PROJECT_central-mcp - remove API keys
echo "🔧 Fixing PROJECT_central-mcp (removing API keys)..."
cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# Remove files with API keys
git rm --cached central-mcp/GLM-4-6-THREAD.TSX 2>/dev/null || true
git rm --cached central-mcp/ULTRATHINK_SESSION_RUNPOD_COMPLETE.md 2>/dev/null || true

# Add to .gitignore
echo "" >> central-mcp/.gitignore
echo "# Files with secrets" >> central-mcp/.gitignore
echo "GLM-4-6-THREAD.TSX" >> central-mcp/.gitignore
echo "ULTRATHINK_SESSION_RUNPOD_COMPLETE.md" >> central-mcp/.gitignore

git add central-mcp/.gitignore
git commit --amend --no-edit
git push -u origin main --force
echo "✅ PROJECT_central-mcp fixed!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL 5 PROJECTS READY FOR VM AGENT CLONING!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GitHub URLs:"
echo "  • https://github.com/leolech14/profilepro"
echo "  • https://github.com/leolech14/LocalBrain"
echo "  • https://github.com/leolech14/central-mcp"
echo "  • https://github.com/leolech14/ytpipe"
echo "  • https://github.com/leolech14/finops"
echo ""
