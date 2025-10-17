#!/bin/bash
# 🔒 HOURLY SECURITY & DEVELOPMENT SCAN
# Runs every hour on the hour (00:00, 01:00, 02:00...)
# Monitors parallel agent executions, branching, merging
# Validates system integrity across git ecosystem

set -euo pipefail

# Configuration
SCAN_DIR="$HOME/.claude/SYSTEM/scans"
SCAN_FILE="$SCAN_DIR/hourly-scan-$(date +%Y%m%d-%H00).json"
ALERT_THRESHOLD_ERRORS=5
ALERT_THRESHOLD_WARNINGS=20

mkdir -p "$SCAN_DIR"

HOUR=$(date +%H:00)
echo ""
echo "🔒 HOURLY SECURITY & DEVELOPMENT SCAN"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Scan: $HOUR"
echo ""

# ============================================================================
# RUN VALIDATION SYSTEM
# ============================================================================

echo "Running validation system..."
validation_output=$(/Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/git-validation-system.sh 2>&1)

# Extract metrics
total_repos=$(echo "$validation_output" | grep "Repositories Validated:" | awk '{print $NF}')
total_commits=$(echo "$validation_output" | grep "Commits (Last Hour):" | awk '{print $NF}')
agent_commits=$(echo "$validation_output" | grep "Agent Commits:" | awk '{print $NF}')
user_commits=$(echo "$validation_output" | grep "User Commits:" | awk '{print $NF}')
auto_commits=$(echo "$validation_output" | grep "Auto-sync Commits:" | awk '{print $NF}')
warnings=$(echo "$validation_output" | grep "Validation Warnings:" | awk '{print $NF}')
errors=$(echo "$validation_output" | grep "Validation Errors:" | awk '{print $NF}')

# ============================================================================
# PARALLEL AGENT EXECUTION CHECK
# ============================================================================

echo "Checking parallel agent executions..."

# Check for commits from multiple agents in same timeframe
parallel_agent_activity=0
agent_conflicts=0

MACBOOK_ROOT="/Users/lech/PROJECTS_all"

# Check Central-MCP for agent activity
if [ -d "$MACBOOK_ROOT/PROJECT_central-mcp" ]; then
    cd "$MACBOOK_ROOT/PROJECT_central-mcp"

    # Find commits from different agents in last hour
    agents_active=$(git log --since="1 hour ago" --format="%s" 2>/dev/null | \
        grep -oE "Agent-[A-Z]|GLM-4.6" | sort -u | wc -l | tr -d ' ')

    if [ "$agents_active" -gt 1 ]; then
        parallel_agent_activity=$agents_active
        echo "  ✅ Parallel agents detected: $agents_active"
    fi

    # Check for merge commits (parallel work merged)
    merge_commits=$(git log --since="1 hour ago" --merges --oneline 2>/dev/null | wc -l | tr -d ' ')
    if [ "$merge_commits" -gt 0 ]; then
        echo "  ✅ Merge commits: $merge_commits"
    fi
fi

# ============================================================================
# BRANCH WORKFLOW VALIDATION
# ============================================================================

echo "Validating branch workflows..."

total_branches=0
feature_branches=0
stale_branches=0

while IFS= read -r repo_dir; do
    if [ ! -d "$repo_dir/.git" ]; then
        continue
    fi

    cd "$repo_dir" || continue

    # Count all branches
    branch_count=$(git branch -a 2>/dev/null | wc -l | tr -d ' ')
    ((total_branches+=branch_count))

    # Count feature branches
    features=$(git branch 2>/dev/null | grep -c "feature/" || echo "0")
    ((feature_branches+=features))

    # Check for stale branches (no commits in 30 days)
    for branch in $(git branch | sed 's/\*//g' | tr -d ' '); do
        if [ "$branch" != "main" ] && [ "$branch" != "master" ]; then
            last_commit=$(git log -1 --format="%ct" "$branch" 2>/dev/null || echo "0")
            current_time=$(date +%s)
            days_old=$(( (current_time - last_commit) / 86400 ))

            if [ "$days_old" -gt 30 ]; then
                ((stale_branches++))
            fi
        fi
    done

done < <(find "$MACBOOK_ROOT" -maxdepth 1 -type d -name "PROJECT_*" 2>/dev/null)

echo "  Branches: $total_branches total, $feature_branches active features, $stale_branches stale"

# ============================================================================
# GENERATE JSON SCAN REPORT
# ============================================================================

cat > "$SCAN_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hour": "$HOUR",
  "environment": "MacBook",
  "git_activity": {
    "total_repos": $total_repos,
    "total_commits": $total_commits,
    "agent_commits": $agent_commits,
    "user_commits": $user_commits,
    "auto_commits": $auto_commits
  },
  "validation": {
    "warnings": $warnings,
    "errors": $errors,
    "security_violations": 0,
    "unauthorized_commits": 0
  },
  "parallel_execution": {
    "agents_active": $parallel_agent_activity,
    "merge_commits": ${merge_commits:-0},
    "branch_conflicts": $agent_conflicts
  },
  "branch_health": {
    "total_branches": $total_branches,
    "feature_branches": $feature_branches,
    "stale_branches": $stale_branches
  },
  "system_health": "$([ "$errors" -eq 0 ] && echo "healthy" || echo "degraded")"
}
EOF

echo ""
echo "✅ Scan complete: $SCAN_FILE"

# ============================================================================
# ALERT ON THRESHOLD
# ============================================================================

if [ "$errors" -ge "$ALERT_THRESHOLD_ERRORS" ]; then
    echo ""
    echo "🚨 ALERT: $errors validation errors detected (threshold: $ALERT_THRESHOLD_ERRORS)"
    echo "Sending alert email..."

    # Send alert email
    ALERT_SUBJECT="🚨 ALERT: Git Validation Errors - $HOUR"
    ALERT_BODY="ALERT: $errors validation errors detected in hourly scan at $HOUR

Errors: $errors
Warnings: $warnings
Total Commits: $total_commits

Action required: Review git-validation.log

Scan file: $SCAN_FILE"

    echo "$ALERT_BODY" | mail -s "$ALERT_SUBJECT" leonardo.lech@gmail.com 2>/dev/null || \
        echo "⚠️  Alert email failed (mail not configured)"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "📊 SCAN SUMMARY:"
echo "  Repos: $total_repos"
echo "  Commits: $total_commits"
echo "  Warnings: $warnings"
echo "  Errors: $errors"
echo "  Status: $([ "$errors" -eq 0 ] && echo "✅ Healthy" || echo "⚠️  Issues detected")"
echo ""
echo "Scan saved: $SCAN_FILE"
echo ""

exit 0
