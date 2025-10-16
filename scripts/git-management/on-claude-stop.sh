#!/bin/bash
# 🪝 Claude Code "Stop" Hook Handler
# Called when Claude Code completes a task
# Integrates with Central-MCP git management

set -euo pipefail

# Receive Claude Code hook data via stdin
HOOK_DATA=$(cat)

# Extract session info
CWD=$(echo "$HOOK_DATA" | jq -r '.cwd // empty' 2>/dev/null || pwd)
SESSION_ID=$(echo "$HOOK_DATA" | jq -r '.sessionId // empty' 2>/dev/null || echo "unknown")

# Log hook activation
LOG_FILE="$HOME/.claude/SYSTEM/logs/claude-hooks.log"
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date)] Stop hook fired - Session: $SESSION_ID, CWD: $CWD" >> "$LOG_FILE"

cd "$CWD" || exit 0

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo "Not a git repo, skipping" >> "$LOG_FILE"
    exit 0
fi

# Check for task completion markers
# Look for:
# - TODO file changes
# - Task completion messages
# - Batch completion indicators

HAS_CHANGES=$(git status --porcelain | wc -l | tr -d ' ')

if [ "$HAS_CHANGES" -gt 0 ]; then
    echo "Changes detected ($HAS_CHANGES files)" >> "$LOG_FILE"

    # Check if this looks like agent batch completion
    # (multiple files, task-related changes)
    TASK_FILES=$(git status --porcelain | grep -c "task\|TODO\|batch" || echo "0")

    if [ "$TASK_FILES" -ge 2 ]; then
        echo "Task batch completion detected!" >> "$LOG_FILE"

        # Set environment variables for agent hook
        export CLAUDE_AGENT_ID="${CLAUDE_AGENT_ID:-Agent-Auto}"
        export CLAUDE_BATCH_ID="${CLAUDE_BATCH_ID:-BATCH-$(date +%Y%m%d-%H%M)}"
        export CLAUDE_TASKS_COMPLETED="${CLAUDE_TASKS_COMPLETED:-[]}"
        export CLAUDE_EXECUTION_REPORT="${CWD}/execution-report.md"

        # Call Central-MCP agent batch commit
        /Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/agent-batch-commit-hook.sh >> "$LOG_FILE" 2>&1

        echo "✅ Agent batch commit triggered" >> "$LOG_FILE"
    else
        echo "Normal completion, no auto-commit" >> "$LOG_FILE"
    fi
else
    echo "No changes, skipping" >> "$LOG_FILE"
fi

exit 0
