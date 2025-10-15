#!/bin/bash
# agent-batch-completion-detector.sh - Detect official Central-MCP agent batch completions

set -e

echo "🔍 Central-MCP Agent Batch Completion Detector"
echo "=========================================="

# Configuration
CENTRAL_MCP_MARKER="🎯 CENTRAL-MCP AGENT BATCH COMPLETION"
COMPLETION_PATTERNS=(
    "🎯 AGENT BATCH COMPLETION REPORT"
    "feat: Agent-.* - Complete batch .* implementation"
    "🤖 Ground Agent: .*"
    "📦 Batch ID: .*"
    "✅ Tasks Completed: .*"
)
GITHUB_CLI_STANDARDIZED=true
AUTO_COMMIT_THRESHOLD=3  # Minimum files changed
VALIDATION_REQUIRED=true

# Detect if this is an official Central-MCP agent batch completion
is_official_central_mcp_completion() {
    local commit_msg="$1"
    local files_changed="$2"

    echo "🔍 Analyzing commit: ${commit_msg:0:100}..."
    echo "📁 Files changed: $files_changed"

    # Check for Central-MCP markers
    local has_marker=false
    local has_completion_pattern=false

    # Check commit message for Central-MCP patterns
    for pattern in "${COMPLETION_PATTERNS[@]}"; do
        if [[ "$commit_msg" =~ $pattern ]]; then
            has_completion_pattern=true
            echo "✅ Found completion pattern: $pattern"
            break
        fi
    done

    # Check for required files in commit
    local has_agent_script=false
    local has_batch_report=false
    local has_validation=false

    # Look for agent-related files
    if echo "$files_changed" | grep -q "agent.*batch.*commit\|github.*utilities\|batch.*report"; then
        has_agent_script=true
        echo "✅ Found agent-related files"
    fi

    # Check minimum file threshold
    if [ "$files_changed" -ge "$AUTO_COMMIT_THRESHOLD" ]; then
        echo "✅ File threshold met: $files_changed >= $AUTO_COMMIT_THRESHOLD"
    fi

    # Determine if this is an official completion
    local is_official=false
    if [ "$has_completion_pattern" = true ] && [ "$has_agent_script" = true ] && [ "$files_changed" -ge "$AUTO_COMMIT_THRESHOLD" ]; then
        is_official=true
        echo "🎯 OFFICIAL Central-MCP agent batch completion DETECTED!"
    fi

    return $is_official
}

# Get latest commit information
get_latest_commit_info() {
    local latest_commit=$(git rev-parse HEAD)
    local commit_msg=$(git log -1 --pretty=format:"%s")
    local commit_body=$(git log -1 --pretty=format:"%b")
    local files_changed=$(git diff --name-only HEAD~1 HEAD | wc -l)
    local author=$(git log -1 --pretty=format:"%an")
    local timestamp=$(git log -1 --pretty=format:"%ad")

    echo "📊 Latest Commit Analysis:"
    echo "  Hash: $latest_commit"
    echo "  Author: $author"
    echo "  Time: $timestamp"
    echo "  Message: $commit_msg"
    echo "  Files: $files_changed"
    echo ""

    # Show files changed
    echo "📁 Files Changed:"
    git diff --name-only HEAD~1 HEAD | head -10
    echo ""

    # Check commit body for agent information
    if echo "$commit_body" | grep -q "🤖 Ground Agent:"; then
        echo "✅ Agent information found in commit body"
    fi

    if echo "$commit_body" | grep -q "📦 Batch ID:"; then
        echo "✅ Batch ID found in commit body"
    fi

    return 0
}

# Validate batch completion requirements
validate_batch_completion() {
    local commit_msg="$1"
    local commit_body="$2"

    echo "🔍 Validating batch completion requirements..."

    # Extract agent information
    local agent_id=$(echo "$commit_body" | grep "🤖 Ground Agent:" | cut -d: -f2 | xargs)
    local batch_id=$(echo "$commit_body" | grep "📦 Batch ID:" | cut -d: -f2 | xargs)
    local tasks_completed=$(echo "$commit_body" | grep "✅ Tasks Completed:" | cut -d: -f2 | xargs)

    echo "  Agent ID: $agent_id"
    echo "  Batch ID: $batch_id"
    echo "  Tasks Completed: $tasks_completed"

    # Validation checks
    local validation_passed=true

    if [ -z "$agent_id" ]; then
        echo "❌ Missing agent ID"
        validation_passed=false
    fi

    if [ -z "$batch_id" ]; then
        echo "❌ Missing batch ID"
        validation_passed=false
    fi

    if [ -z "$tasks_completed" ]; then
        echo "❌ Missing tasks completed list"
        validation_passed=false
    fi

    # Check if agent ID follows pattern (Agent-A, Agent-B, etc.)
    if [[ "$agent_id" =~ ^Agent-[A-F]$ ]]; then
        echo "✅ Agent ID pattern valid"
    else
        echo "❌ Invalid agent ID pattern (expected Agent-A through Agent-F)"
        validation_passed=false
    fi

    # Check if batch ID follows pattern (B-CM-001, B-GH-001, etc.)
    if [[ "$batch_id" =~ ^[A-Z]-[A-Z0-9-]+$ ]]; then
        echo "✅ Batch ID pattern valid"
    else
        echo "❌ Invalid batch ID pattern"
        validation_passed=false
    fi

    if [ "$validation_passed" = true ]; then
        echo "✅ Batch completion validation PASSED"
        return 0
    else
        echo "❌ Batch completion validation FAILED"
        return 1
    fi
}

# Prompt user for validation
prompt_user_validation() {
    local commit_msg="$1"
    local commit_body="$2"

    echo ""
    echo "🎯 CENTRAL-MCP AGENT BATCH COMPLETION DETECTED!"
    echo "=================================================="
    echo ""
    echo "Commit Message: $commit_msg"
    echo ""
    echo "Agent Information:"
    echo "$commit_body" | grep -E "(🤖 Ground Agent:|📦 Batch ID:|✅ Tasks Completed:)"
    echo ""
    echo "🔍 VALIDATION REQUIRED"
    echo "==================="
    echo "This appears to be an official Central-MCP agent batch completion."
    echo ""
    echo "Please validate:"
    echo "  [1] All tasks completed successfully"
    echo "  [2] Implementation meets requirements"
    echo "  [3] Tests passing"
    echo "  [4] Documentation updated"
    echo ""
    echo "Auto-commit options:"
    echo "  [A] Auto-commit to main branch"
    echo "  [S] Skip auto-commit (manual review needed)"
    echo "  [C] Cancel (abort validation)"
    echo ""

    # Get user input
    read -p "Enter your choice [A/S/C]: " user_choice

    case "$user_choice" in
        "A"|"a")
            echo "✅ Auto-committing batch completion..."
            return 0
            ;;
        "S"|"s")
            echo "⏸️ Skipping auto-commit - manual review required"
            return 1
            ;;
        "C"|"c")
            echo "❌ Validation cancelled"
            return 2
            ;;
        *)
            echo "❌ Invalid choice. Auto-commit skipped."
            return 1
            ;;
    esac
}

# Auto-commit batch completion
auto_commit_batch_completion() {
    local commit_msg="$1"
    local commit_body="$2"

    echo "🚀 Auto-committing batch completion..."

    # Extract agent information for commit metadata
    local agent_id=$(echo "$commit_body" | grep "🤖 Ground Agent:" | cut -d: -f2 | xargs)
    local batch_id=$(echo "$commit_body" | grep "📦 Batch ID:" | cut -d: -f2 | xargs)

    # Create enhanced commit message
    local enhanced_msg=$(cat << EOF
${commit_msg}

🎯 AUTO-COMMIT: Official Central-MCP Agent Batch Completion

✅ Validated requirements:
- All tasks completed successfully
- Implementation meets requirements
- Tests passing
- Documentation updated

🤖 Agent: $agent_id
📦 Batch: $batch_id
⏰ Auto-committed: $(date)

🚀 Generated with Claude Code CLI 2.0 Auto-Commit System
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
    )

    # Amend the commit with enhanced message
    git commit --amend -m "$enhanced_msg"

    # Push to main branch
    echo "🔄 Pushing to main branch..."
    git push origin main

    # Create GitHub issue for tracking
    echo "📝 Creating GitHub issue for batch completion tracking..."
    gh issue create \
        --repo leolech14/PROJECT_central-mcp \
        --title "✅ COMPLETED: ${agent_id} Batch ${batch_id}" \
        --body "## Batch Completion Confirmed

**Agent:** ${agent_id}
**Batch:** ${batch_id}
**Commit:** $(git rev-parse HEAD)
**Time:** $(date)

### Validation Results
✅ All tasks completed successfully
✅ Implementation meets requirements
✅ Tests passing
✅ Documentation updated

### Auto-Commit Details
- Triggered by: Agent Batch Completion Detector
- Validated by: User confirmation
- Committed to: main branch
- Issue created: for tracking

This batch completion was automatically validated and committed by the Central-MCP system." \
        --label "batch-completed" \
        --label "${agent_id,,}" \
        --label "auto-commit" \
        --label "${batch_id,,}"

    echo "🎉 Auto-commit completed successfully!"
    echo "  • Enhanced commit message added"
    echo "  • Pushed to main branch"
    echo "  • GitHub issue created for tracking"
    echo "  • Batch ${batch_id} marked as completed"
}

# Main detection and validation flow
main() {
    echo "🔍 Scanning for official Central-MCP agent batch completions..."

    # Get latest commit information
    local latest_commit=$(git rev-parse HEAD)
    local commit_msg=$(git log -1 --pretty=format:"%s")
    local commit_body=$(git log -1 --pretty=format:"%b")
    local files_changed=$(git diff --name-only HEAD~1 HEAD | wc -l)

    echo "📊 Latest commit: $latest_commit"
    echo "📝 Message: $commit_msg"
    echo "📁 Files: $files_changed"
    echo ""

    # Detect if this is an official completion
    if is_official_central_mcp_completion "$commit_msg" "$files_changed"; then
        echo ""
        echo "🎯 OFFICIAL CENTRAL-MCP BATCH COMPLETION DETECTED!"
        echo "=============================================="

        # Show detailed commit info
        get_latest_commit_info

        # Validate batch completion
        if validate_batch_completion "$commit_msg" "$commit_body"; then
            echo ""
            echo "✅ Batch completion validation PASSED"
            echo ""

            # Prompt user for validation
            local user_choice
            prompt_user_validation "$commit_msg" "$commit_body"
            user_choice=$?

            case $user_choice in
                0)
                    # User chose to auto-commit
                    auto_commit_batch_completion "$commit_msg" "$commit_body"
                    ;;
                1)
                    # User chose to skip
                    echo "⏸️ Auto-commit skipped - manual review required"
                    ;;
                2)
                    # User chose to cancel
                    echo "❌ Validation cancelled"
                    ;;
            esac
        else
            echo ""
            echo "❌ Batch completion validation FAILED"
            echo "Please review the commit and correct any issues."
        fi
    else
        echo ""
        echo "ℹ️ No official Central-MCP batch completion detected."
        echo "This appears to be a regular commit or user interaction."
        echo ""
        echo "💡 To trigger auto-commit for regular interactions:"
        echo "  1. Complete your work"
        echo "  2. Run: ./scripts/trigger-auto-commit.sh"
        echo "  3. Follow the validation prompts"
    fi

    echo ""
    echo "🔍 Detection completed."
}

# Check if script is called with specific commit hash
if [ $# -eq 1 ]; then
    # Check specific commit
    TARGET_COMMIT="$1"
    echo "🔍 Analyzing specific commit: $TARGET_COMMIT"

    git show --pretty=format:"%s%n%b" "$TARGET_COMMIT" > /tmp/commit_analysis.txt
    local specific_commit_msg=$(head -1 /tmp/commit_analysis.txt)
    local specific_commit_body=$(tail -n +2 /tmp/commit_analysis.txt)
    local specific_files_changed=$(git show --name-only --pretty=format:"" "$TARGET_COMMIT" | wc -l)

    rm -f /tmp/commit_analysis.txt

    is_official_central_mcp_completion "$specific_commit_msg" "$specific_files_changed"
else
    # Analyze latest commit
    main "$@"
fi