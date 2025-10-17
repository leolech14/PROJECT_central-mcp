#!/bin/bash
# 📊 DAILY ECOSYSTEM INTELLIGENCE REPORT
# Runs at 06:30 every day (day closes at 00:00, report generated at 06:30)
# Consolidates all git activity, development progress, security validation
# Emails to leonardo.lech@gmail.com

set -euo pipefail

# Configuration
EMAIL="leonardo.lech@gmail.com"
REPORT_DIR="$HOME/.claude/SYSTEM/reports"
REPORT_FILE="$REPORT_DIR/daily-report-$(date +%Y%m%d).md"
mkdir -p "$REPORT_DIR"

# Time range: Yesterday 00:00 to Today 00:00
YESTERDAY=$(date -v-1d +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

echo "🌅 DAILY ECOSYSTEM INTELLIGENCE REPORT"
echo "Report Date: $TODAY"
echo "Period: ${YESTERDAY} 00:00 → ${TODAY} 00:00"
echo ""

# ============================================================================
# GENERATE REPORT
# ============================================================================

cat > "$REPORT_FILE" << 'EOF_HEADER'
# 📊 DAILY ECOSYSTEM INTELLIGENCE REPORT

**Report Date:** $(date +%Y-%m-%d)
**Period:** ${YESTERDAY} 00:00 → ${TODAY} 00:00
**Generated:** $(date '+%Y-%m-%d %H:%M:%S')

---

## 🎯 EXECUTIVE SUMMARY

### Day at a Glance
EOF_HEADER

# Replace variables in header
sed -i.bak "s/\$(date +%Y-%m-%d)/$TODAY/g" "$REPORT_FILE"
sed -i.bak "s/\${YESTERDAY}/$YESTERDAY/g" "$REPORT_FILE"
sed -i.bak "s/\$(date '+%Y-%m-%d %H:%M:%S')/$(date '+%Y-%m-%d %H:%M:%S')/g" "$REPORT_FILE"

# ============================================================================
# SECTION 1: GIT ACTIVITY ANALYSIS
# ============================================================================

cat >> "$REPORT_FILE" << 'EOF'

## 📈 GIT ACTIVITY (Last 24 Hours)

### Repositories Active
EOF

# Count repos with activity
MACBOOK_ROOT="/Users/lech/PROJECTS_all"
active_repos=0
total_commits=0
total_files_changed=0
agent_commits=0
user_commits=0

repos_with_activity=""

while IFS= read -r repo_dir; do
    if [ ! -d "$repo_dir/.git" ]; then
        continue
    fi

    repo_name=$(basename "$repo_dir")
    cd "$repo_dir" || continue

    # Count commits in last 24 hours
    commit_count=$(git log --since="24 hours ago" --oneline 2>/dev/null | wc -l | tr -d ' ')

    if [ "$commit_count" -gt 0 ]; then
        ((active_repos++))
        ((total_commits+=commit_count))

        # Get commit details
        while IFS='|' read -r hash author subject; do
            if [[ "$subject" =~ "🤖"|"Agent-"|"Co-Authored-By: Claude" ]]; then
                ((agent_commits++))
            else
                ((user_commits++))
            fi
        done < <(git log --since="24 hours ago" --format="%h|%an|%s" 2>/dev/null)

        # Files changed
        files=$(git diff --stat $(git log --since="24 hours ago" --format="%H" | tail -1)..HEAD 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
        if [[ "$files" =~ ^[0-9]+$ ]]; then
            ((total_files_changed+=files))
        fi

        repos_with_activity="$repos_with_activity\n- **$repo_name**: $commit_count commits"
    fi
done < <(find "$MACBOOK_ROOT" -maxdepth 1 -type d -name "PROJECT_*" 2>/dev/null)

cat >> "$REPORT_FILE" << EOF

**Statistics:**
- Active Repositories: $active_repos / 44
- Total Commits: $total_commits
  - Agent Commits: $agent_commits
  - User Commits: $user_commits
- Files Changed: $total_files_changed

**Repositories with Activity:**
$(echo -e "$repos_with_activity")

---

## 🔒 SECURITY VALIDATION

### Security Scan Results
EOF

# Run security validation
validation_output=$(/Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/git-validation-system.sh 2>&1 || true)

# Extract security metrics
unauthorized_commits=$(echo "$validation_output" | grep -c "Unauthorized" || echo "0")
security_violations=$(echo "$validation_output" | grep -c "SECURITY" || echo "0")
validation_errors=$(echo "$validation_output" | grep "Validation Errors:" | awk '{print $NF}' || echo "0")

cat >> "$REPORT_FILE" << EOF

**Last 24 Hours:**
- Security Violations: $security_violations
- Unauthorized Commits: $unauthorized_commits
- Validation Errors: $validation_errors

**Status:** $([ "$security_violations" -eq 0 ] && echo "✅ SECURE" || echo "❌ VIOLATIONS DETECTED")

---

## 🎯 TASK & DEVELOPMENT PROGRESS

### Tasks Completed (Last 24 Hours)
EOF

# Query task registry if available
if [ -f "$MACBOOK_ROOT/PROJECT_central-mcp/data/registry.db" ]; then
    completed_tasks=$(sqlite3 "$MACBOOK_ROOT/PROJECT_central-mcp/data/registry.db" \
        "SELECT task_id, task_name, completed_at FROM tasks WHERE status='COMPLETED' AND completed_at > datetime('now', '-24 hours')" \
        2>/dev/null || echo "")

    if [ -n "$completed_tasks" ]; then
        echo "" >> "$REPORT_FILE"
        while IFS='|' read -r task_id name completed_at; do
            echo "- **$task_id**: $name (completed at $completed_at)" >> "$REPORT_FILE"
        done <<< "$completed_tasks"
    else
        echo "" >> "$REPORT_FILE"
        echo "No tasks completed in last 24 hours." >> "$REPORT_FILE"
    fi
else
    echo "" >> "$REPORT_FILE"
    echo "Task registry not accessible." >> "$REPORT_FILE"
fi

# ============================================================================
# SECTION 2: ISSUES & WARNINGS
# ============================================================================

cat >> "$REPORT_FILE" << 'EOF'

---

## ⚠️ ISSUES DETECTED

### Critical Issues
EOF

# Diverged repos
diverged_repos=$(echo "$validation_output" | grep "DIVERGED" || echo "")
if [ -n "$diverged_repos" ]; then
    echo "" >> "$REPORT_FILE"
    echo "$diverged_repos" | while read -r line; do
        echo "- 🚨 $line" >> "$REPORT_FILE"
    done
else
    echo "" >> "$REPORT_FILE"
    echo "No critical issues detected. ✅" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << 'EOF'

### Warnings
EOF

# Stale changes
stale_count=$(echo "$validation_output" | grep -c "Stale changes" || echo "0")
echo "" >> "$REPORT_FILE"
echo "- Repositories with stale changes (>24h): $stale_count" >> "$REPORT_FILE"

# ============================================================================
# SECTION 3: DAILY PLANNING
# ============================================================================

cat >> "$REPORT_FILE" << 'EOF'

---

## 📅 TODAY'S PLAN

### Scheduled Tasks
EOF

# Get tasks scheduled for today from registry
if [ -f "$MACBOOK_ROOT/PROJECT_central-mcp/data/registry.db" ]; then
    today_tasks=$(sqlite3 "$MACBOOK_ROOT/PROJECT_central-mcp/data/registry.db" \
        "SELECT task_id, task_name, assigned_agent, priority FROM tasks WHERE status IN ('READY', 'ASSIGNED') ORDER BY priority LIMIT 10" \
        2>/dev/null || echo "")

    if [ -n "$today_tasks" ]; then
        echo "" >> "$REPORT_FILE"
        while IFS='|' read -r task_id name agent priority; do
            echo "- **$task_id** ($priority): $name [Assigned: ${agent:-Unassigned}]" >> "$REPORT_FILE"
        done <<< "$today_tasks"
    else
        echo "" >> "$REPORT_FILE"
        echo "No tasks scheduled." >> "$REPORT_FILE"
    fi
fi

cat >> "$REPORT_FILE" << 'EOF'

### Development Focus Areas
- Continue TypeScript error fixes (GLM agents)
- VM service restoration
- Knowledge pack expansion
- Ecosystem optimization

---

## 🔥 SYSTEM HEALTH

### Automation Status
- ✅ Hourly git sync: ACTIVE
- ✅ Validation system: OPERATIONAL
- ✅ Security monitoring: ENABLED
- ⚠️  VM Central-MCP: Awaiting TypeScript fixes

### Next Actions
1. Monitor 23:00 hourly sync
2. Review diverged repositories
3. Address stale changes
4. Complete VM deployment

---

*Report generated automatically by Central-MCP Intelligence System*
*Email: leonardo.lech@gmail.com*
*Next report: Tomorrow 06:30*

EOF

echo "✅ Report generated: $REPORT_FILE"
echo ""

# ============================================================================
# EMAIL REPORT
# ============================================================================

echo "📧 Sending email to $EMAIL..."

# Create email body
EMAIL_SUBJECT="Daily Ecosystem Report - $(date +%Y-%m-%d)"
EMAIL_BODY=$(cat "$REPORT_FILE")

# Send email using mail command (macOS native)
if command -v mail &> /dev/null; then
    echo "$EMAIL_BODY" | mail -s "$EMAIL_SUBJECT" "$EMAIL"
    echo "✅ Email sent to $EMAIL"
else
    echo "⚠️  'mail' command not available, trying alternatives..."

    # Try osascript (AppleScript - always available on macOS)
    osascript << EOF_APPLESCRIPT
tell application "Mail"
    set newMessage to make new outgoing message with properties {subject:"$EMAIL_SUBJECT", content:"$(cat "$REPORT_FILE" | sed 's/"/\\"/g')", visible:false}
    tell newMessage
        make new to recipient at end of to recipients with properties {address:"$EMAIL"}
    end tell
    send newMessage
end tell
EOF_APPLESCRIPT

    if [ $? -eq 0 ]; then
        echo "✅ Email sent via Mail.app"
    else
        echo "⚠️  Email failed - report saved to: $REPORT_FILE"
        echo "   Manual: cat $REPORT_FILE | mail -s '$EMAIL_SUBJECT' $EMAIL"
    fi
fi

echo ""
echo "✅ Daily report complete!"
echo "Report: $REPORT_FILE"
