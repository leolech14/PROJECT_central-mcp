#!/bin/bash
# agent-batch-commit-github.sh - Enhanced batch commit with GitHub CLI

set -e

if [ -z "$CLAUDE_AGENT_ID" ] || [ -z "$CLAUDE_BATCH_ID" ]; then
    echo "❌ Missing environment variables"
    echo "Required: CLAUDE_AGENT_ID, CLAUDE_BATCH_ID"
    exit 1
fi

AGENT_ID="$CLAUDE_AGENT_ID"
BATCH_ID="$CLAUDE_BATCH_ID"
TASKS_COMPLETED="${CLAUDE_TASKS_COMPLETED:-[]}"
REPORT_FILE="${CLAUDE_EXECUTION_REPORT:-}"

echo "🤖 Agent Batch Completion Auto-Commit (GitHub CLI)"
echo "Agent: $AGENT_ID"
echo "Batch: $BATCH_ID"

# Create feature branch
AGENT_ID_LOWER=$(echo "$AGENT_ID" | tr '[:upper:]' '[:lower:]')
BRANCH_NAME="batch-${BATCH_ID}-${AGENT_ID_LOWER}"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Stage and commit changes
git add .
if ! git diff --cached --quiet; then
    git commit -m "feat: ${AGENT_ID} - Complete batch ${BATCH_ID}

🎯 Agent: ${AGENT_ID}
📦 Batch: ${BATCH_ID}
✅ Tasks: ${TASKS_COMPLETED}
📊 Report: ${REPORT_FILE}

🚀 Generated with Claude Code CLI 2.0

Co-Authored-By: Claude <noreply@anthropic.com>"

    echo "✅ Committed batch ${BATCH_ID} for ${AGENT_ID}"
else
    echo "⚠️ No changes to commit"
fi

# Push branch and create PR
git push -u origin "$BRANCH_NAME" 2>/dev/null || echo "⚠️ Could not push branch"

gh pr create \
    --repo leolech14/PROJECT_central-mcp \
    --title "feat: ${AGENT_ID} - Complete batch ${BATCH_ID}" \
    --body "Batch ${BATCH_ID} completed by ${AGENT_ID}" \
    --base main \
    --head "$BRANCH_NAME" \
    --label "agent-completion" \
    --label "${AGENT_ID_LOWER}" \
    --label "batch-${BATCH_ID}" 2>/dev/null || echo "⚠️ PR creation skipped"

echo "🎉 Batch completion with GitHub CLI integration complete!"
