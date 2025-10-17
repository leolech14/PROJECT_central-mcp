#!/bin/bash
# 🔒 GIT INTELLIGENCE VALIDATION SYSTEM
# Validates git operations against expected task completions
# Ensures commits, branches, and merges follow deterministic workflow
# Real-time monitoring of system development integrity

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
VALIDATION_LOG="$HOME/.claude/SYSTEM/logs/git-validation.log"
STATE_FILE="$HOME/.claude/SYSTEM/state/git-validation-state.json"

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

mkdir -p "$(dirname "$VALIDATION_LOG")"
mkdir -p "$(dirname "$STATE_FILE")"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        GIT INTELLIGENCE VALIDATION SYSTEM                             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Environment:${NC} $ENV"
echo -e "${CYAN}Validation Time:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Load previous state (if exists)
if [ -f "$STATE_FILE" ]; then
    LAST_VALIDATION=$(jq -r '.last_validation // "never"' "$STATE_FILE" 2>/dev/null || echo "never")
    LAST_COMMIT_COUNT=$(jq -r '.total_commits // 0' "$STATE_FILE" 2>/dev/null || echo "0")
    echo -e "${CYAN}Last Validation:${NC} $LAST_VALIDATION"
    echo -e "${CYAN}Previous Commit Count:${NC} $LAST_COMMIT_COUNT"
    echo ""
fi

# Validation counters
total_repos=0
total_commits=0
total_validated=0
total_warnings=0
total_errors=0
total_agent_commits=0
total_user_commits=0
total_auto_commits=0

# Arrays for detailed tracking
declare -a validation_errors
declare -a validation_warnings
declare -a suspicious_commits

echo -e "${BLUE}🔍 VALIDATING ECOSYSTEM GIT OPERATIONS...${NC}"
echo ""

# Discover and validate each PROJECT_* repo
while IFS= read -r repo_dir; do
    if [ ! -d "$repo_dir/.git" ]; then
        continue
    fi

    repo_name=$(basename "$repo_dir")
    ((total_repos++))

    cd "$repo_dir" || continue

    echo -e "${CYAN}Validating:${NC} $repo_name"

    # ============================================================================
    # VALIDATION 1: Recent Commits Analysis (Last Hour)
    # ============================================================================
    recent_commits=$(git log --since="1 hour ago" --format="%H|%an|%ae|%s" 2>/dev/null || echo "")

    if [ -n "$recent_commits" ]; then
        while IFS='|' read -r hash author email subject; do
            ((total_commits++))

            # Validate commit signature
            is_agent=false
            is_user=false
            is_auto=false

            if [[ "$subject" =~ "🤖"|"Agent-"|"Co-Authored-By: Claude" ]]; then
                is_agent=true
                ((total_agent_commits++))
            fi

            if [[ "$subject" =~ "Auto-sync:" ]]; then
                is_auto=true
                ((total_auto_commits++))
            fi

            if [[ ! "$is_agent" && ! "$is_auto" ]]; then
                is_user=true
                ((total_user_commits++))
            fi

            # Validate task ID presence (if agent commit)
            if $is_agent; then
                if [[ ! "$subject" =~ T-[A-Z]+-[A-Z0-9]+-[0-9]+ ]] && [[ ! "$subject" =~ "Auto-sync" ]]; then
                    validation_warnings+=("$repo_name: Agent commit without task ID: ${hash:0:8}")
                    ((total_warnings++))
                    echo -e "  ${YELLOW}⚠️  Agent commit without task ID${NC}"
                fi
            fi

            # Validate commit author (security check)
            expected_authors=("leolech14" "lech" "leonardo.lech@gmail.com" "noreply@anthropic.com")
            author_valid=false

            for expected in "${expected_authors[@]}"; do
                if [[ "$email" == *"$expected"* ]] || [[ "$author" == *"$expected"* ]]; then
                    author_valid=true
                    break
                fi
            done

            if ! $author_valid; then
                validation_errors+=("$repo_name: Unauthorized author: $author <$email>")
                ((total_errors++))
                echo -e "  ${RED}❌ SECURITY: Unauthorized author!${NC}"
            fi

        done <<< "$recent_commits"
    fi

    # ============================================================================
    # VALIDATION 2: Branch Workflow Validation
    # ============================================================================
    current_branch=$(git branch --show-current 2>/dev/null || echo "detached")

    # Check for unusual branches
    if [[ "$current_branch" != "main" ]] && [[ "$current_branch" != "master" ]] && [[ "$current_branch" != "develop" ]]; then
        # Check if it's a feature branch
        if [[ ! "$current_branch" =~ ^(feature|fix|hotfix)/ ]]; then
            validation_warnings+=("$repo_name: Unusual branch: $current_branch")
            ((total_warnings++))
            echo -e "  ${YELLOW}⚠️  Unusual branch name${NC}"
        fi
    fi

    # ============================================================================
    # VALIDATION 3: Divergence Detection
    # ============================================================================
    if git remote | grep -q origin 2>/dev/null; then
        if git rev-parse @{u} &>/dev/null; then
            ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
            behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")

            if [ "$ahead" -gt 0 ] && [ "$behind" -gt 0 ]; then
                validation_errors+=("$repo_name: DIVERGED - $ahead ahead, $behind behind")
                ((total_errors++))
                echo -e "  ${RED}❌ Branch diverged!${NC}"
            fi
        fi
    fi

    # ============================================================================
    # VALIDATION 4: Uncommitted Changes Pattern Analysis
    # ============================================================================
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        # Check HOW LONG uncommitted
        last_commit_time=$(git log -1 --format="%ct" 2>/dev/null || echo "0")
        current_time=$(date +%s)
        hours_since_commit=$(( (current_time - last_commit_time) / 3600 ))

        if [ "$hours_since_commit" -gt 24 ]; then
            validation_warnings+=("$repo_name: Uncommitted changes for $hours_since_commit hours")
            ((total_warnings++))
            echo -e "  ${YELLOW}⚠️  Stale changes ($hours_since_commit hours)${NC}"
        fi
    fi

    ((total_validated++))

done < <(find "$ROOT" -maxdepth 1 -type d -name "PROJECT_*" 2>/dev/null | sort)

echo ""
echo -e "${GREEN}✅ Validated $total_validated repositories${NC}"
echo ""

# ============================================================================
# SUMMARY REPORT
# ============================================================================
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  VALIDATION SUMMARY REPORT                            ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════════════╣${NC}"
printf "${BLUE}║${NC}  Repositories Validated:  ${GREEN}%-42d${NC} ${BLUE}║${NC}\n" "$total_validated"
printf "${BLUE}║${NC}  Commits (Last Hour):     ${CYAN}%-42d${NC} ${BLUE}║${NC}\n" "$total_commits"
printf "${BLUE}║${NC}    - Agent Commits:       ${CYAN}%-42d${NC} ${BLUE}║${NC}\n" "$total_agent_commits"
printf "${BLUE}║${NC}    - User Commits:        ${CYAN}%-42d${NC} ${BLUE}║${NC}\n" "$total_user_commits"
printf "${BLUE}║${NC}    - Auto-sync Commits:   ${CYAN}%-42d${NC} ${BLUE}║${NC}\n" "$total_auto_commits"
printf "${BLUE}║${NC}  Validation Warnings:     ${YELLOW}%-42d${NC} ${BLUE}║${NC}\n" "$total_warnings"
printf "${BLUE}║${NC}  Validation Errors:       ${RED}%-42d${NC} ${BLUE}║${NC}\n" "$total_errors"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# DETAILED ISSUES
# ============================================================================
if [ ${#validation_warnings[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  VALIDATION WARNINGS (${#validation_warnings[@]}):${NC}"
    for warning in "${validation_warnings[@]}"; do
        echo -e "  ${YELLOW}•${NC} $warning"
    done
fi

if [ ${#validation_errors[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ VALIDATION ERRORS (${#validation_errors[@]}):${NC}"
    for error in "${validation_errors[@]}"; do
        echo -e "  ${RED}•${NC} $error"
    done
fi

# ============================================================================
# LOGICAL CONSISTENCY CHECK
# ============================================================================
echo ""
echo -e "${BLUE}🔍 LOGICAL CONSISTENCY CHECK:${NC}"

# Check: If task registry has completed tasks, do we have corresponding commits?
# (This requires access to task registry database)
if [ -f "$ROOT/PROJECT_central-mcp/data/registry.db" ]; then
    completed_tasks=$(sqlite3 "$ROOT/PROJECT_central-mcp/data/registry.db" \
        "SELECT COUNT(*) FROM tasks WHERE status='COMPLETED' AND completed_at > datetime('now', '-1 hour')" \
        2>/dev/null || echo "0")

    if [ "$completed_tasks" -gt 0 ]; then
        echo -e "  ${CYAN}Tasks completed (last hour):${NC} $completed_tasks"

        if [ "$total_agent_commits" -lt "$completed_tasks" ]; then
            validation_warnings+=("LOGIC: $completed_tasks tasks completed but only $total_agent_commits agent commits")
            ((total_warnings++))
            echo -e "  ${YELLOW}⚠️  Missing commits for task completions${NC}"
        else
            echo -e "  ${GREEN}✅ Agent commits match task completions${NC}"
        fi
    else
        echo -e "  ${CYAN}No tasks completed in last hour${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  Task registry not accessible (validation limited)${NC}"
fi

# Check: Auto-sync should have committed if there were changes
# (Compare with previous state)
if [ -f "$STATE_FILE" ] && [ "$LAST_COMMIT_COUNT" -gt 0 ]; then
    commit_delta=$((total_commits - LAST_COMMIT_COUNT))

    echo -e "  ${CYAN}New commits since last validation:${NC} $commit_delta"

    if [ "$commit_delta" -eq 0 ] && [ "$total_with_changes" -gt 0 ]; then
        echo -e "  ${YELLOW}⚠️  Changes detected but no new commits${NC}"
    fi
fi

# ============================================================================
# SAVE STATE FOR NEXT VALIDATION
# ============================================================================
cat > "$STATE_FILE" << EOF
{
  "last_validation": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENV",
  "total_repos": $total_repos,
  "total_commits": $total_commits,
  "agent_commits": $total_agent_commits,
  "user_commits": $total_user_commits,
  "auto_commits": $total_auto_commits,
  "warnings": $total_warnings,
  "errors": $total_errors,
  "timestamp": $(date +%s)
}
EOF

# Log validation results
{
    echo "[$(date)] VALIDATION COMPLETE:"
    echo "  Environment: $ENV"
    echo "  Repos: $total_validated"
    echo "  Commits: $total_commits"
    echo "  Warnings: $total_warnings"
    echo "  Errors: $total_errors"
    echo ""
} >> "$VALIDATION_LOG"

# ============================================================================
# FINAL VERDICT
# ============================================================================
echo ""
if [ "$total_errors" -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            ✅ VALIDATION PASSED - ECOSYSTEM HEALTHY ✅                ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ❌ VALIDATION FAILED - ERRORS DETECTED ❌                    ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
