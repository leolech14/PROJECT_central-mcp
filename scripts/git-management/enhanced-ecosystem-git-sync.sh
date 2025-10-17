#!/bin/bash
# 🌍 ENHANCED ECOSYSTEM GIT AUTO-SYNC
# Handles cross-repository file consolidation and intelligent file moves
# Maintains proper git history across ecosystem operations

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌍 ENHANCED ECOSYSTEM GIT AUTO-SYNC${NC}"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Configuration
MACBOOK_ROOT="/Users/lech/PROJECTS_all"
VM_ROOT="/home/lech/PROJECTS_all"
LOG_DIR="$HOME/.claude/SYSTEM/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/enhanced-ecosystem-git-sync.log"

# Detect environment
if [ -d "$MACBOOK_ROOT" ]; then
    ROOT="$MACBOOK_ROOT"
    ENV="MacBook"
elif [ -d "$VM_ROOT" ]; then
    ROOT="$VM_ROOT"
    ENV="VM"
else
    echo -e "${RED}❌ PROJECTS_all not found!${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

echo -e "${GREEN}Environment: $ENV${NC}"
echo -e "${BLUE}Root: $ROOT${NC}"
echo ""

# Cross-Repository Intelligence
echo -e "${BLUE}🔍 Cross-Repository Analysis...${NC}"

# Function to detect file consolidation operations
detect_consolidation_operations() {
    local consolidation_detected=false

    # Check for file patterns that indicate consolidation
    for project_dir in "$ROOT"/PROJECT_*; do
        if [ -d "$project_dir/.git" ]; then
            project_name=$(basename "$project_dir")

            # Look for consolidation patterns in git status
            cd "$project_dir" || continue

            # Check for deleted files (might indicate file moves)
            if [[ -n $(git status --porcelain 2>/dev/null | grep "^D ") ]]; then
                echo -e "${YELLOW}📁 $project_name: Deleted files detected${NC}"
                consolidation_detected=true

                # Log details
                git status --porcelain 2>/dev/null | grep "^D " | while read -r line; do
                    echo "[$(date)] CONSOLIDATION: $project_name - $line" >> "$LOG_FILE"
                done
            fi

            # Check for untracked files that might be moved files
            if [[ -n $(git status --porcelain 2>/dev/null | grep "^?? ") ]]; then
                echo -e "${YELLOW}📁 $project_name: New files detected${NC}"

                # Look for patterns suggesting file moves from ~/.claude
                git status --porcelain 2>/dev/null | grep "^?? " | while read -r line; do
                    file=$(echo "$line" | cut -c4-)
                    if [[ "$file" == *"INVESTIGATION"* ]] || [[ "$file" == *"ANALYSIS"* ]] || [[ "$file" == *"SESSION"* ]]; then
                        echo -e "${GREEN}✅ Detected consolidation file: $file${NC}"
                        echo "[$(date)] CONSOLIDATION_FILE: $project_name - $file" >> "$LOG_FILE"
                        consolidation_detected=true
                    fi
                done
            fi
        fi
    done

    return 0
}

# Function to handle cross-repository file moves
handle_consolidation_commits() {
    echo -e "${BLUE}🔄 Handling consolidation operations...${NC}"

    for project_dir in "$ROOT"/PROJECT_*; do
        if [ -d "$project_dir/.git" ]; then
            project_name=$(basename "$project_dir")
            cd "$project_dir" || continue

            # Check if there are changes to commit
            if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
                echo -e "  ${YELLOW}📝 $project_name has changes${NC}"

                # Smart commit message generation based on changes
                deleted_count=$(git status --porcelain 2>/dev/null | grep "^D " | wc -l)
                added_count=$(git status --porcelain 2>/dev/null | grep "^A\|^??" | wc -l)

                # Generate intelligent commit message
                if [[ $deleted_count -gt 0 ]] && [[ $added_count -gt 0 ]]; then
                    # Mixed changes - likely consolidation
                    commit_msg="🔄 File consolidation operation
$(date '+%Y-%m-%d %H:%M')
Environment: $ENV
Changes: +$added_count -$deleted_count
Auto-detected file consolidation in $project_name

🤖 Enhanced Ecosystem Auto-Sync
Co-Authored-By: Claude <noreply@anthropic.com>"
                elif [[ $added_count -gt 0 ]]; then
                    # Only additions
                    commit_msg="➕ New files added to $project_name
$(date '+%Y-%m-%d %H:%M')
Environment: $ENV
Files: $added_count new files

🤖 Enhanced Ecosystem Auto-Sync
Co-Authored-By: Claude <noreply@anthropic.com>"
                else
                    # Default
                    commit_msg="🔄 Auto-sync: $(date '+%Y-%m-%d %H:%M')
Environment: $ENV
Project: $project_name

🤖 Enhanced Ecosystem Auto-Sync
Co-Authored-By: Claude <noreply@anthropic.com>"
                fi

                # Stage and commit
                if git add -A 2>/dev/null && git commit -m "$commit_msg" 2>&1 | tee -a "$LOG_FILE" >/dev/null; then
                    echo -e "  ${GREEN}✅ Committed${NC}"

                    # Try to push if remote exists
                    if git remote | grep -q origin 2>/dev/null; then
                        if git push 2>/dev/null; then
                            echo -e "  ${GREEN}✅ Pushed${NC}"
                        else
                            echo -e "  ${YELLOW}⚠️  Push failed (non-blocking)${NC}"
                        fi
                    fi
                else
                    echo -e "  ${RED}❌ Commit failed${NC}" | tee -a "$LOG_FILE"
                fi
            fi
        fi
    done
}

# Function to ensure new projects are properly initialized
initialize_new_projects() {
    echo -e "${BLUE}🔧 Checking for uninitiated projects...${NC}"

    for project_dir in "$ROOT"/PROJECT_*; do
        project_name=$(basename "$project_dir")

        if [ ! -d "$project_dir/.git" ]; then
            echo -e "${YELLOW}⚠️  $project_name: Not a git repository${NC}"
            echo "[$(date)] INIT_NEEDED: $project_name is not a git repository" >> "$LOG_FILE"

            # Auto-initialize if it looks like a real project
            if [ -f "$project_dir/docs" ] || [ -f "$project_dir/README.md" ] || [ -f "$project_dir/package.json" ]; then
                echo -e "${GREEN}🔧 Auto-initializing $project_name${NC}"
                cd "$project_dir"
                git init
                git add .
                git commit -m "🎉 Initial commit - Auto-initialized by Enhanced Ecosystem Sync
$(date '+%Y-%m-%d %H:%M')
Environment: $ENV
Project: $project_name

🤖 Enhanced Ecosystem Auto-Sync
Co-Authored-By: Claude <noreply@anthropic.com>"
                echo "[$(date)] AUTO_INIT: $project_name initialized" >> "$LOG_FILE"
            fi
        fi
    done
}

# Execute enhanced sync
echo -e "${BLUE}🚀 Starting enhanced ecosystem sync...${NC}"

# 1. Initialize new projects
initialize_new_projects

# 2. Detect consolidation operations
detect_consolidation_operations

# 3. Handle consolidation commits
handle_consolidation_commits

echo ""
echo -e "${GREEN}✅ Enhanced ecosystem sync complete!${NC}"
echo "Log: $LOG_FILE"

# Summary
{
    echo "[$(date)] ENHANCED SYNC COMPLETE:"
    echo "  Environment: $ENV"
    echo "  Consolidation operations detected and handled"
    echo "  New projects auto-initialized where needed"
    echo "  Cross-repository intelligence applied"
    echo ""
} >> "$LOG_FILE"

exit 0