#!/bin/bash
# 🗺️ ECOSYSTEM GIT STATUS TRACKER
# Real-time git status across all PROJECT_* repositories
# Auto-discovers by naming convention, tracks changes ecosystem-wide

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
MACBOOK_ROOT="/Users/lech/PROJECTS_all"
VM_ROOT="/home/lech/PROJECTS_all"

# Detect environment
if [ -d "$MACBOOK_ROOT" ]; then
    ROOT="$MACBOOK_ROOT"
    ENV="MacBook"
elif [ -d "$VM_ROOT" ]; then
    ROOT="$VM_ROOT"
    ENV="VM"
else
    echo "❌ PROJECTS_all not found!"
    exit 1
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ECOSYSTEM GIT STATUS TRACKER                                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Environment:${NC} $ENV"
echo -e "${CYAN}Root:${NC} $ROOT"
echo -e "${CYAN}Time:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Discover PROJECT_* repos
echo -e "${BLUE}🔍 Discovering PROJECT_* repositories...${NC}"
repos=()
while IFS= read -r project_dir; do
    if [ -d "$project_dir/.git" ]; then
        repos+=("$project_dir")
    fi
done < <(find "$ROOT" -maxdepth 1 -type d -name "PROJECT_*" 2>/dev/null | sort)

total_repos=${#repos[@]}
echo -e "${GREEN}✅ Found $total_repos PROJECT_* repositories${NC}"
echo ""

# Statistics
total_with_changes=0
total_ahead=0
total_behind=0
total_diverged=0
total_unpushed_commits=0
total_needs_pull=0

# Detailed status for each repo
echo -e "${BLUE}📊 DETAILED STATUS BY REPOSITORY:${NC}"
echo ""

for repo in "${repos[@]}"; do
    repo_name=$(basename "$repo")
    cd "$repo" || continue

    # Git status check
    status=""
    has_changes=false
    ahead=0
    behind=0
    current_branch=$(git branch --show-current 2>/dev/null || echo "detached")

    # Check for uncommitted changes
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        has_changes=true
        ((total_with_changes++))
        changed_files=$(git status --porcelain | wc -l | tr -d ' ')
        status="${YELLOW}📝 $changed_files changes${NC}"
    fi

    # Check ahead/behind if has remote
    if git remote | grep -q origin 2>/dev/null; then
        if git rev-parse @{u} &>/dev/null; then
            ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
            behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")

            if [ "$ahead" -gt 0 ]; then
                ((total_ahead++))
                ((total_unpushed_commits+=ahead))
                status="$status ${CYAN}↑$ahead${NC}"
            fi

            if [ "$behind" -gt 0 ]; then
                ((total_behind++))
                ((total_needs_pull++))
                status="$status ${MAGENTA}↓$behind${NC}"
            fi

            if [ "$ahead" -gt 0 ] && [ "$behind" -gt 0 ]; then
                ((total_diverged++))
                status="$status ${RED}⚠️  DIVERGED${NC}"
            fi
        else
            status="$status ${YELLOW}⚠️  no upstream${NC}"
        fi
    else
        status="$status ${YELLOW}no remote${NC}"
    fi

    # Last commit info
    last_commit=$(git log -1 --format="%ar" 2>/dev/null || echo "never")

    # Display status
    if $has_changes || [ "$ahead" -gt 0 ] || [ "$behind" -gt 0 ]; then
        echo -e "${YELLOW}$repo_name${NC} [$current_branch] | $status | ${CYAN}Last: $last_commit${NC}"
    else
        echo -e "${GREEN}$repo_name${NC} [$current_branch] | ${GREEN}✅ clean${NC} | Last: $last_commit"
    fi
done

# Summary statistics
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     ECOSYSTEM SUMMARY                                 ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════════════╣${NC}"
printf "${BLUE}║${NC}  Total Repositories:      ${GREEN}%-42d${NC} ${BLUE}║${NC}\n" "$total_repos"
printf "${BLUE}║${NC}  With Uncommitted Changes: ${YELLOW}%-42d${NC} ${BLUE}║${NC}\n" "$total_with_changes"
printf "${BLUE}║${NC}  Ahead of Remote:         ${CYAN}%-42d${NC} ${BLUE}║${NC}\n" "$total_ahead"
printf "${BLUE}║${NC}  Behind Remote:           ${MAGENTA}%-42d${NC} ${BLUE}║${NC}\n" "$total_behind"
printf "${BLUE}║${NC}  Diverged:                ${RED}%-42d${NC} ${BLUE}║${NC}\n" "$total_diverged"
printf "${BLUE}║${NC}  Unpushed Commits:        ${CYAN}%-42d${NC} ${BLUE}║${NC}\n" "$total_unpushed_commits"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════╝${NC}"

# Recommendations
echo ""
if [ $total_with_changes -gt 0 ]; then
    echo -e "${YELLOW}⚡ ACTION NEEDED:${NC} $total_with_changes repos have uncommitted changes"
    echo -e "   Run: ${CYAN}ecosystem-git-auto-sync.sh${NC} to commit all"
fi

if [ $total_behind -gt 0 ]; then
    echo -e "${MAGENTA}⚡ ACTION NEEDED:${NC} $total_behind repos need pulling"
    echo -e "   Review and pull manually or run sync to attempt auto-merge"
fi

if [ $total_diverged -gt 0 ]; then
    echo -e "${RED}⚠️  ATTENTION:${NC} $total_diverged repos have diverged branches!"
    echo -e "   Manual intervention required"
fi

if [ $total_with_changes -eq 0 ] && [ $total_ahead -eq 0 ] && [ $total_behind -eq 0 ]; then
    echo -e "${GREEN}🎉 ECOSYSTEM CLEAN!${NC} All repos in sync"
fi

echo ""
echo -e "${CYAN}📊 Full log:${NC} $HOME/.claude/SYSTEM/logs/git-status-$(date +%Y%m%d).log"
echo ""
