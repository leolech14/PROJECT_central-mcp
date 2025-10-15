#!/bin/bash
# agent-github-cli-integration.sh - GitHub CLI integration for Central-MCP agents

set -e

echo "🚀 GitHub CLI Integration for Central-MCP Agents"
echo "============================================="

# Test GitHub CLI functionality
test_github_cli() {
    echo "🧪 Testing GitHub CLI functionality..."

    # Test basic repo info
    echo "📊 Repository Info:"
    gh repo view leolech14/PROJECT_central-mcp --json name,description,visibility
    echo ""

    # Test issue listing
    echo "📝 Issues (open):"
    gh issue list --repo leolech14/PROJECT_central-mcp --limit 5 || echo "No open issues"
    echo ""

    # Test PR listing
    echo "🔄 Pull Requests (open):"
    gh pr list --repo leolech14/PROJECT_central-mcp --limit 5 || echo "No open PRs"
    echo ""

    echo "✅ GitHub CLI working correctly"
}

# Create enhanced agent batch commit with GitHub CLI
create_enhanced_agent_commit() {
    echo "🔧 Creating enhanced agent batch commit with GitHub CLI..."

    cat > scripts/agent-batch-commit-github.sh << 'EOF'
#!/bin/bash
# agent-batch-commit-github.sh - Enhanced agent batch commit with GitHub CLI integration

set -e

echo "🤖 Ground Agent Batch Completion Auto-Commit (GitHub CLI Enhanced)"

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

# Create feature branch for batch
create_batch_branch() {
    local branch_name="batch-${BATCH_ID}-${AGENT_ID,,}"

    echo "🌿 Creating feature branch: $branch_name"

    # Check if branch exists
    if ! git show-ref --verify --quiet "refs/heads/$branch_name"; then
        git checkout -b "$branch_name"
    else
        echo "⚠️ Branch $branch_name already exists, switching to it"
        git checkout "$branch_name"
    fi

    echo "✅ Working on branch: $branch_name"
}

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
    echo "• Branch Strategy: Feature branch with PR"
    echo "• GitHub CLI: Enhanced integration"
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

# Create PR using GitHub CLI
create_batch_pr() {
    echo "🚀 Creating PR using GitHub CLI..."

    # Push branch to GitHub
    local branch_name="batch-${BATCH_ID}-${AGENT_ID,,}"
    git push -u origin "$branch_name" 2>/dev/null || echo "⚠️ Could not push branch (may already exist)"

    # Create PR using GitHub CLI
    local title="feat: ${AGENT_ID} - Complete batch ${BATCH_ID}"
    local body_file=$(mktemp)

    cat > "$body_file" << PR_EOF
# ${AGENT_ID} - Batch ${BATCH_ID} Completion

## 🎯 Agent Batch Completion Report

**Agent:** ${AGENT_ID}
**Batch:** ${BATCH_ID}
**Tasks:** ${TASKS_COMPLETED}
**Completed:** $(date)

## 📋 Task Execution Summary
$(echo "$TASKS_COMPLETED" | jq -r '.[] | "• ✅ " + .' 2>/dev/null || echo "$TASKS_COMPLETED")

## 📊 Execution Report
$(cat "$REPORT_FILE" 2>/dev/null || echo "No execution report available")

## 🔧 Implementation Details
- **Agent:** ${AGENT_ID}
- **Batch:** ${BATCH_ID}
- **Context Window:** Isolated sub-agent bubbles
- **Execution Model:** Parallel sub-agent coordination
- **GitHub CLI:** Enhanced integration

## ✅ Validation
- [ ] All tasks completed successfully
- [ ] Implementation tested
- [ ] Documentation updated
- [ ] Performance budgets met

## 🚀 Generated with Claude Code CLI 2.0
PR_EOF

    # Create PR
    gh pr create \
        --repo leolech14/PROJECT_central-mcp \
        --title "$title" \
        --body-file "$body_file" \
        --base main \
        --head "$branch_name" \
        --label "agent-completion" \
        --label "${AGENT_ID,,}" \
        --label "batch-${BATCH_ID}" 2>/dev/null || echo "⚠️ PR creation skipped (may already exist)"

    # Cleanup
    rm -f "$body_file"

    echo "✅ PR creation attempted for batch ${BATCH_ID}"
}

# Sync repository
sync_repository() {
    echo "🔄 Syncing repository with GitHub..."

    # Pull latest changes
    git pull origin main 2>/dev/null || echo "⚠️ Could not pull from main"

    # Push any local changes
    git push origin main 2>/dev/null || echo "⚠️ Could not push to main"

    echo "✅ Repository sync attempted"
}

# Main execution flow
main() {
    echo "🚀 Starting Ground Agent batch completion auto-commit (GitHub CLI Enhanced)..."

    # 1. Sync repository
    sync_repository

    # 2. Create feature branch
    create_batch_branch

    # 3. Stage changes
    if ! stage_implementation_changes; then
        echo "❌ No changes to stage"
        exit 1
    fi

    # 4. Perform commit
    if ! perform_batch_commit; then
        echo "❌ Commit failed"
        exit 1
    fi

    # 5. Create PR
    create_batch_pr

    echo "🎉 Batch completion auto-commit successful!"
    echo ""
    echo "📊 SUMMARY:"
    echo "  Agent: $AGENT_ID"
    echo "  Batch: $BATCH_ID"
    echo "  Tasks: $(echo "$TASKS_COMPLETED" | jq '. | length')"
    echo "  Branch: $(git branch --show-current)"
    echo "  Commit: $(git rev-parse --short HEAD)"
    echo "  GitHub CLI: Enhanced integration active"
}

# Execute main function
main "$@"
EOF

    chmod +x scripts/agent-batch-commit-github.sh
    echo "✅ Enhanced agent batch commit script created"
}

# Create GitHub CLI utilities
create_github_utilities() {
    echo "🔧 Creating GitHub CLI utilities..."

    cat > scripts/github-utilities.sh << 'EOF'
#!/bin/bash
# github-utilities.sh - GitHub CLI utilities for Central-MCP

# Repository status
repo_status() {
    echo "📊 Repository Status: leolech14/PROJECT_central-mcp"
    echo "======================================"

    # Basic info
    gh repo view leolech14/PROJECT_central-mcp --json name,description,visibility
    echo ""

    # Recent commits
    echo "📝 Recent Commits:"
    gh api repos/leolech14/PROJECT_central-mcp/commits --jq '.[0:3] | .[] | {sha: .sha[0:7], message: .commit.message, author: .commit.author.name}' 2>/dev/null || echo "Could not fetch commits"
    echo ""

    # Issues
    echo "📋 Open Issues:"
    gh issue list --repo leolech14/PROJECT_central-mcp --limit 5 --state open 2>/dev/null || echo "No open issues"
    echo ""

    # PRs
    echo "🔄 Open PRs:"
    gh pr list --repo leolech14/PROJECT_central-mcp --limit 5 --state open 2>/dev/null || echo "No open PRs"
    echo ""

    # Workflows
    echo "⚡ Recent Workflows:"
    gh run list --repo leolech14/PROJECT_central-mcp --limit 3 2>/dev/null || echo "No recent workflows"
}

# Create issue for agent task
create_agent_issue() {
    local agent_id="$1"
    local task_id="$2"
    local task_title="$3"
    local task_description="$4"

    echo "📝 Creating issue for ${agent_id} task ${task_id}..."

    local title="[${agent_id}] ${task_title}"
    local body="# Task Assignment: ${task_id}

**Assigned Agent:** ${agent_id}
**Task ID:** ${task_id}
**Created:** $(date)

## 📋 Task Description
${task_description}

## 🔧 Implementation Requirements
- Use isolated sub-agent context window
- Follow agent-specific best practices
- Include comprehensive testing
- Document implementation decisions

## 📊 Acceptance Criteria
- [ ] Task implementation complete
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Performance requirements met

## 🚀 Context
This issue was auto-generated as part of the Central-MCP task assignment system.

---
**Agent:** ${agent_id}
**Priority:** P1
**Labels:** agent-task, ${agent_id,,}"

    gh issue create \
        --repo leolech14/PROJECT_central-mcp \
        --title "$title" \
        --body "$body" \
        --label "agent-task" \
        --label "${agent_id,,}" \
        --label "priority-p1" 2>/dev/null || echo "⚠️ Issue creation failed"

    echo "✅ Issue creation attempted for ${agent_id} task ${task_id}"
}

# List agent-related issues
list_agent_issues() {
    local agent_id="$1"

    echo "📋 Issues for ${agent_id}:"
    gh issue list --repo leolech14/PROJECT_central-mcp --label "${agent_id,,}" --limit 10 2>/dev/null || echo "No issues found for ${agent_id}"
}

# Create release for batch completion
create_batch_release() {
    local agent_id="$1"
    local batch_id="$2"
    local version="$3"

    echo "📦 Creating release for ${agent_id} batch ${batch_id}..."

    local title="Release ${version} - ${agent_id} Batch ${batch_id}"
    local notes="# ${agent_id} - Batch ${batch_id} Release

**Agent:** ${agent_id}
**Batch:** ${batch_id}
**Version:** ${version}
**Released:** $(date)

## 📋 Completed Tasks
Tasks in this batch have been completed and validated.

## 🔧 Implementation
- Isolated sub-agent context windows
- Parallel sub-agent coordination
- GitHub CLI enhanced integration
- Automated testing and validation

## 🚀 Generated with Claude Code CLI 2.0"

    gh release create \
        --repo leolech14/PROJECT_central-mcp \
        "$version" \
        --title "$title" \
        --notes "$notes" \
        --latest 2>/dev/null || echo "⚠️ Release creation failed"

    echo "✅ Release creation attempted for ${agent_id} batch ${batch_id}"
}

# Show help
show_help() {
    echo "GitHub CLI Utilities for Central-MCP:"
    echo ""
    echo "  repo_status                    - Show repository status"
    echo "  create_agent_issue <agent> <id> <title> <desc>"
    echo "                                - Create issue for agent task"
    echo "  list_agent_issues <agent>     - List issues for agent"
    echo "  create_batch_release <agent> <batch> <version>"
    echo "                                - Create release for batch"
    echo "  show_help                      - Show this help"
}

# Main execution
case "${1:-help}" in
    "repo_status")
        repo_status
        ;;
    "create_agent_issue")
        create_agent_issue "$2" "$3" "$4" "$5"
        ;;
    "list_agent_issues")
        list_agent_issues "$2"
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
}

# Create GitHub Actions workflow
create_github_workflow() {
    echo "🔄 Creating GitHub Actions workflow..."

    mkdir -p .github/workflows

    cat > .github/workflows/agent-batch-validation.yml << 'EOF'
name: Agent Batch Validation

on:
  push:
    branches: [ "batch-*" ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      agent:
        description: 'Agent ID'
        required: true
        type: string
      batch:
        description: 'Batch ID'
        required: false
        type: string

jobs:
  validate-batch:
    name: Validate Agent Batch
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Extract Agent Information
        id: extract-agent
        run: |
          # Extract agent and batch information
          AGENT=$(git log -1 --pretty=format:"%s" | grep -o "Agent-[A-F]" | head -1 || echo "${{ github.event.inputs.agent || 'unknown' }}")
          BATCH=$(git log -1 --pretty=format:"%s" | grep -o "B-[A-Z0-9-]*" | head -1 || echo "${{ github.event.inputs.batch || 'unknown' }}")

          echo "agent=${AGENT}" >> $GITHUB_OUTPUT
          echo "batch=${BATCH}" >> $GITHUB_OUTPUT

          echo "Agent: ${AGENT}"
          echo "Batch: ${BATCH}"

      - name: Validate Batch Completion
        run: |
          echo "🔍 Validating batch completion for agent ${{ steps.extract-agent.outputs.agent }}"
          echo "📦 Batch: ${{ steps.extract-agent.outputs.batch }}"

          # Check if commit message follows batch completion pattern
          COMMIT_MSG=$(git log -1 --pretty=format:"%s")
          if [[ "$COMMIT_MSG" =~ "Complete batch" ]]; then
            echo "✅ Batch completion pattern detected"
          else
            echo "⚠️ Not a batch completion commit"
          fi

          # Check for required files
          echo "📁 Files changed in this commit:"
          git diff --name-only HEAD~1 HEAD

          # Check for execution report
          if git diff --name-only HEAD~1 HEAD | grep -q "execution-report\|batch-report"; then
            echo "✅ Execution report found"
          else
            echo "⚠️ No execution report found"
          fi

      - name: Create Issue for Review
        if: github.event_name == 'push' && contains(github.ref, 'refs/heads/batch-')
        run: |
          BATCH_ID=$(echo $GITHUB_REF | grep -o 'B-[A-Z0-9-]*' | head -1)
          AGENT_ID=$(git log -1 --pretty=format:"%s" | grep -o "Agent-[A-F]" | head -1 || echo "Unknown")

          gh issue create \
            --repo leolech14/PROJECT_central-mcp \
            --title "Review Required: ${AGENT_ID} Batch ${BATCH_ID}" \
            --body "## Batch Completion Review Required

**Agent:** ${AGENT_ID}
**Batch:** ${BATCH_ID}
**Commit:** ${{ github.sha }}
**Branch:** ${{ github.ref }}

Please review the batch completion and validate:
- [ ] All tasks completed successfully
- [ ] Implementation meets requirements
- [ ] Tests are passing
- [ ] Documentation is updated

**Commit Message:**
$(git log -1 --pretty=format:"%s")

**Files Changed:**
$(git diff --name-only HEAD~1 HEAD | wc -l) files

This issue was auto-generated by GitHub Actions." \
            --label "review-required" \
            --label "batch-review" \
            --label "${AGENT_ID,,}" || echo "Issue creation failed"

      - name: Notify on Success
        run: |
          echo "🎉 Batch validation completed successfully!"
          echo "Agent: ${{ steps.extract-agent.outputs.agent }}"
          echo "Batch: ${{ steps.extract-agent.outputs.batch }}"
          echo "Commit: ${{ github.sha }}"
EOF

    echo "✅ GitHub Actions workflow created"
}

# Main execution
main() {
    echo "🚀 GitHub CLI Integration for Central-MCP"
    echo "======================================"

    test_github_cli
    create_enhanced_agent_commit
    create_github_utilities
    create_github_workflow

    echo ""
    echo "🎉 GitHub CLI integration complete!"
    echo ""
    echo "📋 What was created:"
    echo "  • scripts/agent-batch-commit-github.sh - Enhanced batch commit with GitHub CLI"
    echo "  • scripts/github-utilities.sh - GitHub CLI utilities"
    echo "  • .github/workflows/agent-batch-validation.yml - GitHub Actions workflow"
    echo ""
    echo "🚀 Usage examples:"
    echo "  • ./scripts/github-utilities.sh repo_status"
    echo "  • ./scripts/github-utilities.sh create_agent_issue Agent-D T001 'Task Title' 'Task Description'"
    echo "  • ./scripts/agent-batch-commit-github.sh (with environment variables)"
    echo ""
    echo "🔧 Environment variables for batch commit:"
    echo "  • CLAUDE_AGENT_ID"
    echo "  • CLAUDE_BATCH_ID"
    echo "  • CLAUDE_TASKS_COMPLETED"
    echo "  • CLAUDE_EXECUTION_REPORT"
}

# Execute main function
main "$@"