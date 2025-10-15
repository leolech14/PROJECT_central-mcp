#!/bin/bash
# agent-batch-commit-hook.sh - Auto-commit for Ground Agent batch completion

set -e

echo "🤖 Ground Agent Batch Completion Auto-Commit"

# Check if we're in a Claude Code CLI agent session
if [ -z "$CLAUDE_AGENT_ID" ]; then
    echo "❌ Not an agent session - set CLAUDE_AGENT_ID"
    exit 1
fi

# Check if we have a batch ID
if [ -z "$CLAUDE_BATCH_ID" ]; then
    echo "❌ No batch ID - set CLAUDE_BATCH_ID"
    exit 1
fi

# Check if we have task completion status
if [ -z "$CLAUDE_TASKS_COMPLETED" ]; then
    echo "❌ No task completion status - set CLAUDE_TASKS_COMPLETED"
    exit 1
fi

# Environment variables expected:
# CLAUDE_AGENT_ID - Ground agent identifier
# CLAUDE_BATCH_ID - Batch identifier
# CLAUDE_TASKS_COMPLETED - JSON array of completed task IDs
# CLAUDE_EXECUTION_REPORT - Path to execution report file

AGENT_ID="$CLAUDE_AGENT_ID"
BATCH_ID="$CLAUDE_BATCH_ID"
TASKS_COMPLETED="$CLAUDE_TASKS_COMPLETED"
REPORT_FILE="$CLAUDE_EXECUTION_REPORT"

echo "📋 Agent: $AGENT_ID"
echo "📦 Batch: $BATCH_ID"
echo "✅ Tasks: $TASKS_COMPLETED"

# Generate intelligent commit message for batch completion
generate_batch_commit_message() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local task_count=$(echo "$TASKS_COMPLETED" | jq '. | length')

    cat << EOF
feat: ${AGENT_ID} - Complete batch ${BATCH_ID} implementation

🎯 AGENT BATCH COMPLETION REPORT
===============================

🤖 Ground Agent: $AGENT_ID
📦 Batch ID: $BATCH_ID
⏰ Completed: $timestamp
✅ Tasks Completed: $task_count

📋 TASK EXECUTION SUMMARY:
$(echo "$TASKS_COMPLETED" | jq -r '.[] | "  • ✅ " + .')

EOF

    # Add execution report if available
    if [ -f "$REPORT_FILE" ]; then
        echo ""
        echo "📊 EXECUTION REPORT:"
        echo "===================="
        cat "$REPORT_FILE"
        echo ""
    fi

    # Add implementation details
    echo ""
    echo "🔧 IMPLEMENTATION DETAILS:"
    echo "========================"
    echo "• Agent: $AGENT_ID"
    echo "• Batch: $BATCH_ID"
    echo "• Context Window: Isolated sub-agent bubbles"
    echo "• Execution Model: Parallel sub-agent coordination"
    echo "• Merge Strategy: Direct to main (no intermediate branch)"
    echo ""
    echo "🚀 Generated with [Claude Code](https://claude.com/claude-code)"
    echo ""
    echo "Co-Authored-By: Claude <noreply@anthropic.com>"
}

# Stage all relevant changes
stage_implementation_changes() {
    echo "📁 Staging implementation changes..."

    # Stage all changes
    git add .

    # Show what will be committed
    echo "📋 Files staged for commit:"
    git status --porcelain | head -20

    # Check if there are changes to commit
    if git diff --cached --quiet; then
        echo "⚠️ No changes to commit - implementation may be empty"
        return 1
    fi

    return 0
}

# Perform the batch completion commit
perform_batch_commit() {
    echo "🔄 Performing batch completion commit..."

    # Generate commit message
    local commit_message=$(generate_batch_commit_message)

    # Create commit
    git commit -m "$commit_message"

    local commit_hash=$(git rev-parse HEAD)
    echo "✅ Batch completion commit created: $commit_hash"

    return 0
}

# Main execution flow
main() {
    echo "🚀 Starting Ground Agent batch completion auto-commit..."

    # 1. Stage changes
    if ! stage_implementation_changes; then
        echo "❌ No changes to stage"
        exit 1
    fi

    # 2. Perform commit
    if ! perform_batch_commit; then
        echo "❌ Commit failed"
        exit 1
    fi

    echo "🎉 Batch completion auto-commit successful!"
    echo ""
    echo "📊 SUMMARY:"
    echo "  Agent: $AGENT_ID"
    echo "  Batch: $BATCH_ID"
    echo "  Tasks: $(echo "$TASKS_COMPLETED" | jq '. | length')"
    echo "  Branch: $(git branch --show-current)"
    echo "  Commit: $(git rev-parse --short HEAD)"
}

# Execute main function
main "$@"