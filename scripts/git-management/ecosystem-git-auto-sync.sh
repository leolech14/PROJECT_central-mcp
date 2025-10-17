#!/bin/bash
# 🌍 SMART ECOSYSTEM GIT AUTO-SYNC
# Auto-discovers PROJECT_* directories by naming convention
# Lightweight, efficient, no file descriptor explosion
# Integrates with Central-MCP Git Intelligence

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌍 SMART ECOSYSTEM GIT AUTO-SYNC${NC}"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Configuration
MACBOOK_ROOT="/Users/lech/PROJECTS_all"
VM_ROOT="/home/lech/PROJECTS_all"
LOG_DIR="$HOME/.claude/SYSTEM/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/ecosystem-git-sync.log"

# Detect environment
if [ -d "$MACBOOK_ROOT" ]; then
    ROOT="$MACBOOK_ROOT"
    ENV="MacBook"
elif [ -d "$VM_ROOT" ]; then
    ROOT="$VM_ROOT"
    ENV="VM"
else
    echo "❌ PROJECTS_all not found!" | tee -a "$LOG_FILE"
    exit 1
fi

echo -e "${GREEN}Environment: $ENV${NC}"
echo -e "${BLUE}Root: $ROOT${NC}"
echo ""

# Smart discovery: ONLY PROJECT_* directories with .git
echo -e "${BLUE}🔍 Discovering PROJECT_* repositories...${NC}"
repos=()
repo_count=0

# Find PROJECT_* directories at root level only (maxdepth 1)
while IFS= read -r project_dir; do
    if [ -d "$project_dir/.git" ]; then
        repos+=("$project_dir")
        ((repo_count++))
    fi
done < <(find "$ROOT" -maxdepth 1 -type d -name "PROJECT_*" 2>/dev/null)

echo -e "${GREEN}✅ Discovered $repo_count PROJECT_* repositories${NC}"
echo "[$(date)] Discovered $repo_count repos in $ENV" >> "$LOG_FILE"
echo ""

# Process repos efficiently (one at a time, close FDs)
synced=0
committed=0
pushed=0
clean=0
failed=0

echo -e "${BLUE}🔄 Processing repositories...${NC}"

for repo in "${repos[@]}"; do
    repo_name=$(basename "$repo")

    # Change to repo directory
    cd "$repo" || {
        echo "⚠️  Failed to cd to $repo_name" | tee -a "$LOG_FILE"
        ((failed++))
        continue
    }

    # Check for uncommitted changes
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        echo -e "  ${YELLOW}📝 $repo_name has changes${NC}"

        # Intelligent staging: Handle submodules and complex repos
        staging_success=false

        # Try standard staging first
        if git add -A 2>/dev/null; then
            staging_success=true
        else
            # Fallback 1: Try staging changed files only (avoid submodule issues)
            if git add -u 2>/dev/null && git add $(git ls-files -o --exclude-standard) 2>/dev/null; then
                staging_success=true
            else
                # Fallback 2: Stage only untracked files (safe approach)
                if git add $(git ls-files -o --exclude-standard) 2>/dev/null; then
                    staging_success=true
                else
                    # Fallback 3: Individual file staging (slow but reliable)
                    for file in $(git status --porcelain 2>/dev/null | cut -c4-); do
                        if [ -f "$file" ]; then
                            git add "$file" 2>/dev/null || true
                        fi
                    done
                    # Check if we have staged anything
                    if [[ -n $(git status --porcelain 2>/dev/null | grep "^A") ]]; then
                        staging_success=true
                    fi
                fi
            fi
        fi

        if [ "$staging_success" = false ]; then
            echo "⚠️  Failed to stage in $repo_name (complex repo/submodule issue)" | tee -a "$LOG_FILE"
            ((failed++))
            continue
        fi

        # Commit with timestamp
        if git commit -m "🔄 Auto-sync: $(date '+%Y-%m-%d %H:%M')

Environment: $ENV
Auto-synced via Central-MCP git-management

🤖 Ecosystem Orchestrator
Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | tee -a "$LOG_FILE" >/dev/null; then
            echo -e "  ${GREEN}✅ Committed${NC}"
            ((committed++))

            # Try to push if remote exists
            if git remote | grep -q origin 2>/dev/null; then
                if git push 2>&1 | tee -a "$LOG_FILE" >/dev/null; then
                    echo -e "  ${GREEN}✅ Pushed${NC}"
                    ((pushed++))
                else
                    echo -e "  ${YELLOW}⚠️  Push failed (non-blocking)${NC}"
                fi
            fi
        else
            echo "⚠️  Commit failed in $repo_name" | tee -a "$LOG_FILE"
            ((failed++))
        fi

        ((synced++))
    else
        ((clean++))
    fi
done

# Summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     SYNC SUMMARY                                      ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Total Repos:       $repo_count                                             ║${NC}"
echo -e "${BLUE}║  With Changes:      $synced                                             ║${NC}"
echo -e "${BLUE}║  Committed:         $committed                                             ║${NC}"
echo -e "${BLUE}║  Pushed:            $pushed                                             ║${NC}"
echo -e "${BLUE}║  Clean:             $clean                                             ║${NC}"
echo -e "${BLUE}║  Failed:            $failed                                             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════╝${NC}"

# Log summary
{
    echo "[$(date)] SYNC COMPLETE:"
    echo "  Environment: $ENV"
    echo "  Repos: $repo_count"
    echo "  Synced: $synced"
    echo "  Committed: $committed"
    echo "  Pushed: $pushed"
    echo "  Clean: $clean"
    echo "  Failed: $failed"
    echo ""
} >> "$LOG_FILE"

echo ""
echo -e "${GREEN}✅ Ecosystem git sync complete!${NC}"
echo "Log: $LOG_FILE"

# Exit with error if any failures
if [ $failed -gt 0 ]; then
    exit 1
fi

exit 0
