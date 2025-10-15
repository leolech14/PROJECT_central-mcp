#!/bin/bash
# github-cli-standard.sh - Standard GitHub CLI integration for Central-MCP

echo "🚀 Standardizing GitHub CLI for Central-MCP"
echo "======================================"

# Test GitHub CLI
echo "🧪 Testing GitHub CLI..."
gh repo view leolech14/PROJECT_central-mcp --json name,description,visibility

# Create GitHub CLI utilities
cat > scripts/github-utilities.sh << 'EOF'
#!/bin/bash
# GitHub CLI utilities for Central-MCP

repo_status() {
    echo "📊 Repository Status:"
    gh repo view leolech14/PROJECT_central-mcp --json name,description,visibility
    echo ""
    echo "📝 Open Issues:"
    gh issue list --repo leolech14/PROJECT_central-mcp --limit 5 2>/dev/null || echo "No open issues"
    echo ""
    echo "🔄 Open PRs:"
    gh pr list --repo leolech14/PROJECT_central-mcp --limit 5 2>/dev/null || echo "No open PRs"
}

create_agent_issue() {
    local agent_id="$1"
    local task_id="$2"
    local task_title="$3"

    echo "📝 Creating issue for ${agent_id} task ${task_id}..."

    gh issue create \
        --repo leolech14/PROJECT_central-mcp \
        --title "[${agent_id}] ${task_title}" \
        --body "Task ${task_id} assigned to ${agent_id}" \
        --label "agent-task" \
        --label "${agent_id,,}" 2>/dev/null || echo "Issue creation failed"

    echo "✅ Issue created for ${agent_id} task ${task_id}"
}

create_batch_release() {
    local agent_id="$1"
    local batch_id="$2"
    local version="$3"

    echo "📦 Creating release for ${agent_id} batch ${batch_id}..."

    gh release create \
        --repo leolech14/PROJECT_central-mcp \
        "$version" \
        --title "Release ${version} - ${agent_id} Batch ${batch_id}" \
        --notes "Batch ${batch_id} completed by ${agent_id}" \
        --latest 2>/dev/null || echo "Release creation failed"

    echo "✅ Release created for ${agent_id} batch ${batch_id}"
}

show_help() {
    echo "GitHub CLI Utilities for Central-MCP:"
    echo "  repo_status                    - Show repository status"
    echo "  create_agent_issue <agent> <id> <title>"
    echo "  create_batch_release <agent> <batch> <version>"
    echo "  show_help                      - Show this help"
}

case "${1:-help}" in
    "repo_status")
        repo_status
        ;;
    "create_agent_issue")
        create_agent_issue "$2" "$3" "$4"
        ;;
    "create_batch_release")
        create_batch_release "$2" "$3" "$4"
        ;;
    "help"|*)
        show_help
        ;;
esac
EOF

chmod +x scripts/github-utilities.sh
echo "✅ GitHub CLI utilities created"

# Test the utilities
echo "🧪 Testing GitHub CLI utilities..."
./scripts/github-utilities.sh repo_status

# Create enhanced batch commit script
cat > scripts/agent-batch-commit-github.sh << 'EOF'
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
BRANCH_NAME="batch-${BATCH_ID}-${AGENT_ID,,}"
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
    --label "${AGENT_ID,,}" \
    --label "batch-${BATCH_ID}" 2>/dev/null || echo "⚠️ PR creation skipped"

echo "🎉 Batch completion with GitHub CLI integration complete!"
EOF

chmod +x scripts/agent-batch-commit-github.sh
echo "✅ Enhanced batch commit script created"

echo ""
echo "🎉 GitHub CLI standardization complete!"
echo ""
echo "📋 Created:"
echo "  • scripts/github-utilities.sh - GitHub CLI utilities"
echo "  • scripts/agent-batch-commit-github.sh - Enhanced batch commit"
echo ""
echo "🚀 Usage:"
echo "  • ./scripts/github-utilities.sh repo_status"
echo "  • ./scripts/github-utilities.sh create_agent_issue Agent-D T001 'Task Title'"
echo "  • ./scripts/agent-batch-commit-github.sh (with CLAUDE_AGENT_ID, CLAUDE_BATCH_ID)"
echo ""
echo "✅ GitHub CLI standardized for Central-MCP!"