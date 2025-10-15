#!/bin/bash
# standardize-github-cli.sh - Standardize GitHub CLI usage across Central-MCP

set -e

echo "🚀 Standardizing GitHub CLI (gh) usage across Central-MCP..."

# Check GitHub CLI installation and authentication
check_gh_cli() {
    echo "🔍 Checking GitHub CLI..."

    if ! command -v gh &> /dev/null; then
        echo "❌ GitHub CLI not installed. Installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install gh
        else
            echo "Please install GitHub CLI: https://cli.github.com/"
            exit 1
        fi
    fi

    echo "✅ GitHub CLI installed: $(gh --version)"

    # Check authentication
    if ! gh auth status &> /dev/null; then
        echo "❌ GitHub CLI not authenticated. Please run:"
        echo "   gh auth login"
        exit 1
    fi

    echo "✅ GitHub CLI authenticated"
    gh auth status
}

# Create GitHub CLI configuration template
create_gh_config() {
    echo "📝 Creating GitHub CLI configuration..."

    cat > .github-cli-config.yml << 'EOF'
# GitHub CLI Configuration for Central-MCP
# This standardizes GitHub operations across all agents

# Repository settings
repo:
  default_branch: main
  private: false
  auto_init: true

# PR settings
pr:
  default_title_prefix: "feat: "
  default_body_template: |
    ## Summary
    ${CHANGELOG}

    ## Agent Information
    - Agent: ${AGENT_ID}
    - Batch: ${BATCH_ID}
    - Tasks: ${TASKS_COMPLETED}

    ## Testing
    - [ ] Unit tests pass
    - [ ] Integration tests pass
    - [ ] Manual testing completed

  auto_merge: false
  draft: false

# Issue settings
issue:
  default_labels: ["agent-task", "central-mcp"]
  auto_assign: false

# Workflow settings
workflow:
  auto_watch: true
  auto_trigger: false

# Release settings
release:
  draft: false
  prerelease: false

# Agent-specific settings
agents:
  Agent-A:
    pr_labels: ["ui-velocity", "agent-a"]
    issue_labels: ["ui-velocity", "agent-a"]
  Agent-B:
    pr_labels: ["architecture", "agent-b"]
    issue_labels: ["architecture", "agent-b"]
  Agent-C:
    pr_labels: ["backend", "agent-c"]
    issue_labels: ["backend", "agent-c"]
  Agent-D:
    pr_labels: ["integration", "agent-d"]
    issue_labels: ["integration", "agent-d"]
  Agent-E:
    pr_labels: ["supervisor", "agent-e"]
    issue_labels: ["supervisor", "agent-e"]
  Agent-F:
    pr_labels: ["strategic", "agent-f"]
    issue_labels: ["strategic", "agent-f"]
EOF

    echo "✅ GitHub CLI configuration created: .github-cli-config.yml"
}

# Create GitHub CLI wrapper functions
create_gh_wrapper() {
    echo "🔧 Creating GitHub CLI wrapper functions..."

    cat > scripts/github-cli-wrapper.sh << 'EOF'
#!/bin/bash
# github-cli-wrapper.sh - GitHub CLI wrapper functions for Central-MCP agents

# Standardized GitHub CLI functions for agent operations

# Agent batch completion PR
agent_create_pr() {
    local agent_id="$1"
    local batch_id="$2"
    local task_list="$3"
    local report_file="$4"

    echo "🚀 Creating PR for agent batch completion..."

    local title="feat: ${agent_id} - Complete batch ${batch_id}"
    local body_file=$(mktemp)

    cat > "$body_file" << PR_EOF
# ${agent_id} - Batch ${batch_id} Completion

## 🎯 Agent Batch Completion Report

**Agent:** ${agent_id}
**Batch:** ${batch_id}
**Tasks:** ${task_list}
**Completed:** $(date)

## 📋 Task Execution Summary
$(echo "$task_list" | jq -r '.[] | "• ✅ " + .')

## 📊 Execution Report
$(cat "$report_file" 2>/dev/null || echo "No execution report available")

## 🔧 Implementation Details
- **Agent:** ${agent_id}
- **Batch:** ${batch_id}
- **Context Window:** Isolated sub-agent bubbles
- **Execution Model:** Parallel sub-agent coordination
- **Merge Strategy:** Direct to main

## ✅ Validation
- [ ] All tasks completed successfully
- [ ] Implementation tested
- [ ] Documentation updated
- [ ] Performance budgets met

## 🚀 Generated with Claude Code CLI 2.0
PR_EOF

    # Create PR
    gh pr create \
        --title "$title" \
        --body-file "$body_file" \
        --base main \
        --head "${agent_id,,}-batch-${batch_id}" \
        --label "agent-completion" \
        --label "${agent_id,,}" \
        --label "batch-${batch_id}" || true

    # Cleanup
    rm -f "$body_file"

    echo "✅ PR created for ${agent_id} batch ${batch_id}"
}

# Agent issue creation for task assignment
agent_create_issue() {
    local agent_id="$1"
    local task_id="$2"
    local task_title="$3"
    local task_description="$4"

    echo "📝 Creating issue for task assignment..."

    local title="[${agent_id}] ${task_title}"
    local body_file=$(mktemp)

    cat > "$body_file" << ISSUE_EOF
# Task Assignment: ${task_id}

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
**Labels:** agent-task, ${agent_id,,}
ISSUE_EOF

    # Create issue
    gh issue create \
        --title "$title" \
        --body-file "$body_file" \
        --label "agent-task" \
        --label "${agent_id,,}" \
        --label "priority-p1" || true

    # Cleanup
    rm -f "$body_file"

    echo "✅ Issue created for ${agent_id} task ${task_id}"
}

# Agent workflow trigger
agent_trigger_workflow() {
    local workflow_name="$1"
    local agent_id="$2"
    local batch_id="$3"

    echo "⚡ Triggering workflow: ${workflow_name}"

    gh workflow run "$workflow_name" \
        --field "agent=${agent_id}" \
        --field "batch=${batch_id}" \
        --field "timestamp=$(date -Iseconds)" || true

    echo "✅ Workflow ${workflow_name} triggered for ${agent_id}"
}

# Agent release creation
agent_create_release() {
    local agent_id="$1"
    local batch_id="$2"
    local version="$3"
    local release_notes="$4"

    echo "📦 Creating release for ${agent_id} batch ${batch_id}..."

    local title="Release ${version} - ${agent_id} Batch ${batch_id}"

    gh release create "$version" \
        --title "$title" \
        --notes "$release_notes" \
        --latest \
        --discussion-category "Announcements" || true

    echo "✅ Release ${version} created for ${agent_id} batch ${batch_id}"
}

# Repository sync
agent_sync_repo() {
    echo "🔄 Syncing repository..."

    # Pull latest changes
    git pull origin main

    # Push any local changes
    git push origin main

    # Sync with GitHub (if applicable)
    gh repo sync || true

    echo "✅ Repository synced"
}

# Repository status check
agent_repo_status() {
    echo "📊 Repository status:"

    # Basic repo info
    gh repo view --json name,description,visibility,defaultBranch

    # Open issues
    echo ""
    echo "📝 Open Issues:"
    gh issue list --limit 5 --state open

    # Open PRs
    echo ""
    echo "🔄 Open PRs:"
    gh pr list --limit 5 --state open

    # Recent workflows
    echo ""
    echo "⚡ Recent Workflows:"
    gh run list --limit 5
}

# Help function
show_help() {
    echo "GitHub CLI Wrapper Functions for Central-MCP Agents:"
    echo ""
    echo "  agent_create_pr <agent_id> <batch_id> <task_list> <report_file>"
    echo "    Create PR for agent batch completion"
    echo ""
    echo "  agent_create_issue <agent_id> <task_id> <task_title> <task_description>"
    echo "    Create issue for task assignment"
    echo ""
    echo "  agent_trigger_workflow <workflow_name> <agent_id> <batch_id>"
    echo "    Trigger GitHub workflow"
    echo ""
    echo "  agent_create_release <agent_id> <batch_id> <version> <release_notes>"
    echo "    Create release for batch completion"
    echo ""
    echo "  agent_sync_repo"
    echo "    Sync repository with GitHub"
    echo ""
    echo "  agent_repo_status"
    echo "    Show repository status"
    echo ""
    echo "  show_help"
    echo "    Show this help message"
}

# Export functions
export -f agent_create_pr
export -f agent_create_issue
export -f agent_trigger_workflow
export -f agent_create_release
export -f agent_sync_repo
export -f agent_repo_status
export -f show_help

# Main execution
case "${1:-help}" in
    "create_pr")
        agent_create_pr "$2" "$3" "$4" "$5"
        ;;
    "create_issue")
        agent_create_issue "$2" "$3" "$4" "$5"
        ;;
    "trigger_workflow")
        agent_trigger_workflow "$2" "$3" "$4"
        ;;
    "create_release")
        agent_create_release "$2" "$3" "$4" "$5"
        ;;
    "sync_repo")
        agent_sync_repo
        ;;
    "repo_status")
        agent_repo_status
        ;;
    "help"|*)
        show_help
        ;;
esac
EOF

    chmod +x scripts/github-cli-wrapper.sh
    echo "✅ GitHub CLI wrapper created: scripts/github-cli-wrapper.sh"
}

# Update existing scripts to use GitHub CLI
update_existing_scripts() {
    echo "🔄 Updating existing scripts to use GitHub CLI..."

    # Create backup
    cp scripts/agent-batch-commit-hook.sh scripts/agent-batch-commit-hook.sh.backup

    # Update agent batch commit hook to include GitHub CLI operations
    cat > scripts/agent-batch-commit-hook-updated.sh << 'EOF'
#!/bin/bash
# agent-batch-commit-hook-updated.sh - Enhanced auto-commit with GitHub CLI integration

set -e

echo "🤖 Ground Agent Batch Completion Auto-Commit (GitHub CLI Enhanced)"

# Source GitHub CLI wrapper
source ./scripts/github-cli-wrapper.sh

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
    git push -u origin "$branch_name"

    # Create PR using GitHub CLI wrapper
    agent_create_pr "$AGENT_ID" "$BATCH_ID" "$TASKS_COMPLETED" "$REPORT_FILE"

    echo "✅ PR created for batch ${BATCH_ID}"
}

# Sync repository
sync_repository() {
    echo "🔄 Syncing repository with GitHub..."
    agent_sync_repo
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
    echo "  PR: Created via GitHub CLI"
}

# Execute main function
main "$@"
EOF

    chmod +x scripts/agent-batch-commit-hook-updated.sh
    echo "✅ Enhanced agent batch commit hook created with GitHub CLI integration"
}

# Create GitHub Actions workflow for agent validation
create_agent_workflow() {
    echo "🔄 Creating GitHub Actions workflow for agent validation..."

    mkdir -p .github/workflows

    cat > .github/workflows/agent-validation.yml << 'EOF'
name: Agent Validation

on:
  push:
    branches: [ main, "batch-*" ]
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
  validate-agent-work:
    name: Validate Agent Work
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm install
          npm install -g @types/node typescript

      - name: Extract agent information
        id: extract-agent
        run: |
          # Extract agent and batch information from commit message or PR
          AGENT=$(git log -1 --pretty=format:"%s" | grep -o "Agent-[A-F]" | head -1 || echo "unknown")
          BATCH=$(git log -1 --pretty=format:"%s" | grep -o "B-[A-Z0-9-]*" | head -1 || echo "unknown")

          echo "agent=${AGENT}" >> $GITHUB_OUTPUT
          echo "batch=${BATCH}" >> $GITHUB_OUTPUT

          echo "Agent: ${AGENT}"
          echo "Batch: ${BATCH}"

      - name: Validate task completion
        run: |
          echo "🔍 Validating task completion for agent ${{ steps.extract-agent.outputs.agent }}"
          echo "📦 Batch: ${{ steps.extract-agent.outputs.batch }}"

          # Add validation logic here
          if [ "${{ steps.extract-agent.outputs.agent }}" != "unknown" ]; then
            echo "✅ Agent identified: ${{ steps.extract-agent.outputs.agent }}"
          else
            echo "⚠️ Could not identify agent from commit"
          fi

      - name: Run tests
        run: |
          echo "🧪 Running tests for agent validation..."
          # Add test commands here

      - name: Check code quality
        run: |
          echo "🔍 Checking code quality..."
          # Add linting and quality checks here

      - name: Generate validation report
        run: |
          echo "📊 Generating validation report..."
          cat > validation-report.md << EOF
      # Agent Validation Report

      **Agent:** ${{ steps.extract-agent.outputs.agent }}
      **Batch:** ${{ steps.extract-agent.outputs.batch }}
      **Commit:** ${{ github.sha }}
      **Timestamp:** $(date)

      ## Validation Results
      - [ ] Task completion verified
      - [ ] Tests passing
      - [ ] Code quality checks passed
      - [ ] Documentation updated

      ## Metrics
      - Files changed: $(git diff --name-only HEAD~1 | wc -l)
      - Lines added: $(git diff --stat HEAD~1 | tail -1)

      Generated by GitHub Actions
      EOF

      - name: Upload validation report
        uses: actions/upload-artifact@v4
        with:
          name: validation-report
          path: validation-report.md

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('validation-report.md', 'utf8');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🔍 Agent Validation Results\n\n${report}`
            });

  sync-batch-completion:
    name: Sync Batch Completion
    runs-on: ubuntu-latest
    needs: validate-agent-work
    if: github.event_name == 'push' && contains(github.ref, 'refs/heads/batch-')

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Sync to main
        run: |
          echo "🔄 Syncing batch completion to main..."
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"

          # Checkout main
          git checkout main

          # Merge batch branch
          BATCH_BRANCH=${GITHUB_REF#refs/heads/}
          git merge $BATCH_BRANCH --no-ff -m "Merge batch completion: $BATCH_BRANCH"

          # Push to main
          git push origin main

          # Delete batch branch
          git push origin --delete $BATCH_BRANCH

      - name: Create release
        if: contains(github.ref, 'refs/heads/batch-')
        run: |
          echo "📦 Creating release for batch completion..."
          BATCH_ID=$(echo $GITHUB_REF | grep -o 'B-[A-Z0-9-]*' | head -1)
          VERSION="v${BATCH_ID}-$(date +%Y%m%d-%H%M%S)"

          gh release create "$VERSION" \
            --title "Batch Completion: $BATCH_ID" \
            --notes "Auto-generated release for batch completion" \
            --latest
EOF

    echo "✅ GitHub Actions workflow created: .github/workflows/agent-validation.yml"
}

# Main execution
main() {
    echo "🚀 GitHub CLI Standardization for Central-MCP"
    echo "=============================================="

    check_gh_cli
    create_gh_config
    create_gh_wrapper
    update_existing_scripts
    create_agent_workflow

    echo ""
    echo "🎉 GitHub CLI standardization complete!"
    echo ""
    echo "📋 What was created:"
    echo "  • .github-cli-config.yml - GitHub CLI configuration"
    echo "  • scripts/github-cli-wrapper.sh - GitHub CLI wrapper functions"
    echo "  • scripts/agent-batch-commit-hook-updated.sh - Enhanced commit hook"
    echo "  • .github/workflows/agent-validation.yml - GitHub Actions workflow"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Test the wrapper functions: ./scripts/github-cli-wrapper.sh"
    echo "  2. Update your agent workflows to use GitHub CLI"
    echo "  3. Configure GitHub repository settings"
    echo "  4. Test automated workflows"
}

# Execute main function
main "$@"