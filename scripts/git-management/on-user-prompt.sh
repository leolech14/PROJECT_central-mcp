#!/bin/bash
# 🪝 Claude Code "UserPromptSubmit" Hook Handler
# Called when user submits a prompt
# Detects validation/satisfaction keywords and triggers auto-commit

set -euo pipefail

# Receive Claude Code hook data via stdin
HOOK_DATA=$(cat)

# Extract user message
USER_MESSAGE=$(echo "$HOOK_DATA" | jq -r '.userMessage // empty' 2>/dev/null || echo "")
CWD=$(echo "$HOOK_DATA" | jq -r '.cwd // empty' 2>/dev/null || pwd)

# Log hook activation
LOG_FILE="$HOME/.claude/SYSTEM/logs/claude-hooks.log"
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date)] UserPromptSubmit - Message: ${USER_MESSAGE:0:100}" >> "$LOG_FILE"

# Check for validation/satisfaction keywords
VALIDATION_KEYWORDS=(
    "satisfied"
    "looks good"
    "approve"
    "confirm commit"
    "ready to commit"
    "commit this"
    "validation passed"
    "achievement validated"
)

SHOULD_TRIGGER=false

for keyword in "${VALIDATION_KEYWORDS[@]}"; do
    if echo "$USER_MESSAGE" | grep -qi "$keyword"; then
        SHOULD_TRIGGER=true
        echo "Validation keyword detected: $keyword" >> "$LOG_FILE"
        break
    fi
done

if [ "$SHOULD_TRIGGER" = true ]; then
    cd "$CWD" || exit 0

    # Check if git repo with changes
    if [ -d ".git" ] && [ "$(git status --porcelain | wc -l)" -gt 0 ]; then
        echo "Triggering user validation commit..." >> "$LOG_FILE"

        # Call Central-MCP user validation trigger
        /Users/lech/PROJECTS_all/PROJECT_central-mcp/scripts/git-management/trigger-auto-commit.sh >> "$LOG_FILE" 2>&1

        echo "✅ User validation commit completed" >> "$LOG_FILE"
    else
        echo "No git changes or not a repo" >> "$LOG_FILE"
    fi
fi

# Pass through to allow normal processing
exit 0
