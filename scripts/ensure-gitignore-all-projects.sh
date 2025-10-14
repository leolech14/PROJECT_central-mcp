#!/bin/bash
# ENSURE ALL PROJECTS HAVE PROPER .gitignore
# No deletion, no moving - just git best practices!

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🎯 GITIGNORE SETUP FOR ALL PROJECTS                    ║"
echo "║    Safe - No files deleted or moved!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PROJECTS_DIR="/Users/lech/PROJECTS_all"

# Universal .gitignore patterns
GITIGNORE_CONTENT='# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/
.nuxt/
.cache/
.parcel-cache/

# Testing
coverage/
.nyc_output/
*.lcov

# Environment
.env
.env.local
.env.*.local
.env.production

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# IDEs
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# Python
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
.venv/
venv/
ENV/

# Temporary
*.tmp
*.temp
.turbo/
.vercel/

# Database
*.db
*.db-journal
*.sqlite
*.sqlite3

# Large files (will add to git-lfs if needed)
*.mp4
*.mov
*.avi
*.zip
*.tar.gz
'

# Scan for projects (directories with package.json or .git)
echo "🔍 Scanning for projects in $PROJECTS_DIR..."
echo ""

PROJECTS_FOUND=0
GITIGNORE_ADDED=0
GITIGNORE_UPDATED=0
GITIGNORE_OK=0

for dir in "$PROJECTS_DIR"/*/; do
  if [ -f "$dir/package.json" ] || [ -d "$dir/.git" ]; then
    PROJECTS_FOUND=$((PROJECTS_FOUND + 1))
    PROJECT_NAME=$(basename "$dir")
    
    if [ ! -f "$dir/.gitignore" ]; then
      echo "📝 Creating .gitignore for: $PROJECT_NAME"
      echo "$GITIGNORE_CONTENT" > "$dir/.gitignore"
      GITIGNORE_ADDED=$((GITIGNORE_ADDED + 1))
    else
      # Check if essential patterns are present
      if ! grep -q "node_modules" "$dir/.gitignore" 2>/dev/null; then
        echo "⚠️  Updating .gitignore for: $PROJECT_NAME (missing patterns)"
        echo "" >> "$dir/.gitignore"
        echo "# Added by central-mcp gitignore setup" >> "$dir/.gitignore"
        echo "$GITIGNORE_CONTENT" >> "$dir/.gitignore"
        GITIGNORE_UPDATED=$((GITIGNORE_UPDATED + 1))
      else
        echo "✅ .gitignore OK for: $PROJECT_NAME"
        GITIGNORE_OK=$((GITIGNORE_OK + 1))
      fi
    fi
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Projects found:        $PROJECTS_FOUND"
echo "  .gitignore created:  $GITIGNORE_ADDED"
echo "  .gitignore updated:  $GITIGNORE_UPDATED"
echo "  .gitignore already OK: $GITIGNORE_OK"
echo ""

if [ $GITIGNORE_ADDED -gt 0 ] || [ $GITIGNORE_UPDATED -gt 0 ]; then
  echo "✅ Setup complete!"
  echo ""
  echo "📋 What this means:"
  echo "   • Heavy files (node_modules, build/) will be ignored by git"
  echo "   • Only source code will be pushed to git"
  echo "   • Agents clone clean source, run 'npm install' to rebuild"
  echo "   • No manual cleanup needed!"
  echo ""
fi

echo "🔍 Checking git status..."
echo ""

# Count how many projects have uncommitted changes
UNCOMMITTED=0
NO_REMOTE=0
READY_TO_PUSH=0

for dir in "$PROJECTS_DIR"/*/; do
  if [ -d "$dir/.git" ]; then
    PROJECT_NAME=$(basename "$dir")
    cd "$dir"
    
    # Check for remote
    if ! git remote get-url origin >/dev/null 2>&1; then
      echo "⚠️  $PROJECT_NAME: No git remote configured"
      NO_REMOTE=$((NO_REMOTE + 1))
    else
      # Check for uncommitted changes
      if [ -n "$(git status --porcelain)" ]; then
        echo "📝 $PROJECT_NAME: Has uncommitted changes"
        UNCOMMITTED=$((UNCOMMITTED + 1))
      else
        echo "✅ $PROJECT_NAME: Clean and ready"
        READY_TO_PUSH=$((READY_TO_PUSH + 1))
      fi
    fi
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 GIT SYNC READINESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Projects with git:     $(find "$PROJECTS_DIR" -maxdepth 2 -name .git -type d | wc -l | tr -d ' ')"
echo "  Ready to sync:       $READY_TO_PUSH"
echo "  Need commit:         $UNCOMMITTED"
echo "  Need remote:         $NO_REMOTE"
echo ""

if [ $NO_REMOTE -gt 0 ]; then
  echo "💡 For projects without remotes, add with:"
  echo "   cd PROJECT_DIR"
  echo "   git remote add origin https://github.com/YOUR_USERNAME/REPO.git"
  echo ""
fi

if [ $UNCOMMITTED -gt 0 ]; then
  echo "💡 To commit all changes across projects:"
  echo "   Use conventional commits: feat/fix/docs/refactor/etc"
  echo "   Example: git commit -m 'feat: add new feature'"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 NEXT STEPS FOR GIT SYNC WORKFLOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Commit & push all projects:"
echo "   for dir in $PROJECTS_DIR/*/; do"
echo "     cd \$dir"
echo "     if [ -d .git ]; then"
echo "       git add ."
echo "       git commit -m 'chore: prepare for VM agent sync'"
echo "       git push"
echo "     fi"
echo "   done"
echo ""
echo "2. On VM, agents will:"
echo "   • Clone project from git"
echo "   • Run npm install (rebuild node_modules)"
echo "   • Work on code"
echo "   • Commit with conventional commits"
echo "   • Push changes"
echo ""
echo "3. On local machine:"
echo "   • git pull to get agent changes"
echo "   • Review in dashboard"
echo "   • Iterate!"
echo ""
echo "💡 Heavy files stay local - git only syncs source code!"
echo ""
