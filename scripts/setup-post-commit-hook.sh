#!/bin/bash
# setup-post-commit-hook.sh - Install post-commit hook for batch completion detection

set -e

echo "🔧 Setting up post-commit hook for batch completion detection..."

# Create post-commit hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# Central-MCP Post-Commit Hook - Auto-detect batch completions

# Get latest commit information
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:"%s")
COMMIT_BODY=$(git log -1 --pretty=format:"%b")
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Check if this might be a Central-MCP agent batch completion
is_potential_batch_completion() {
    local msg="$1"
    local body="$2"

    # Check for Central-MCP patterns in commit message
    if [[ "$msg" =~ "Agent-.* - Complete batch" ]]; then
        return 0
    fi

    # Check for Central-MCP patterns in commit body
    if echo "$body" | grep -q "🎯 AGENT BATCH COMPLETION REPORT"; then
        return 0
    fi

    if echo "$body" | grep -q "🤖 Ground Agent:" && echo "$body" | grep -q "📦 Batch ID:"; then
        return 0
    fi

    return 1
}

# Run batch completion detector if this looks like a completion
if is_potential_batch_completion "$COMMIT_MSG" "$COMMIT_BODY"; then
    echo "🔍 Potential batch completion detected - running analysis..."
    ./scripts/agent-batch-completion-detector.sh
fi

# Update session log
SESSION_LOG=".git/claude-sessions.log"
echo "[$TIMESTAMP] Commit: $COMMIT_HASH - $COMMIT_MSG" >> "$SESSION_LOG"

# Show recent commits for context
echo "📊 Recent commits:"
git log --oneline -5 | head -5

# If this is a regular commit, suggest auto-commit
if ! is_potential_batch_completion "$COMMIT_MSG" "$COMMIT_BODY"; then
    echo ""
    echo "💡 Tip: Run './scripts/trigger-auto-commit.sh' for user validation auto-commit"
fi

echo "💡 Session log: $SESSION_LOG"
echo "🚀 Ready for next Claude Code CLI 2.0 task!"
EOF

# Make hook executable
chmod +x .git/hooks/post-commit

echo "✅ Post-commit hook installed successfully"
echo ""
echo "🔍 The hook will now automatically:"
echo "  • Detect potential batch completions"
echo "  • Run the batch completion detector"
echo "  • Update session log"
echo "  • Show commit context"
echo "  • Suggest auto-commit for regular changes"
echo ""
echo "🚀 Hook is now active and will run after each commit!"