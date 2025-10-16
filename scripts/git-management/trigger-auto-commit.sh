#!/bin/bash
# trigger-auto-commit.sh - Trigger auto-commit for regular user interactions

set -e

echo "🚀 Claude Code CLI 2.0 Auto-Commit Trigger"
echo "===================================="

# Configuration
MIN_FILES_CHANGED=1
VALIDATION_PROMPTS=(
    "Have you completed your work?"
    "Are you satisfied with the results?"
    "Do you want to auto-commit these changes?"
)

# Check if there are changes to commit
check_for_changes() {
    local staged_files=$(git diff --cached --name-only | wc -l)
    local unstaged_files=$(git diff --name-only | wc -l)
    local total_files=$((staged_files + unstaged_files))

    echo "📊 Current Changes Status:"
    echo "  Staged files: $staged_files"
    echo "  Unstaged files: $unstaged_files"
    echo "  Total files: $total_files"
    echo ""

    if [ "$total_files" -eq 0 ]; then
        echo "ℹ️ No changes found to commit."
        echo "Make some changes first, then run this script again."
        return 1
    fi

    return 0
}

# Show changes to be committed
show_changes() {
    echo "📁 Files that will be committed:"
    echo ""

    # Show staged files
    if [ "$(git diff --cached --name-only | wc -l)" -gt 0 ]; then
        echo "🟢 Staged files:"
        git diff --cached --name-only | head -20
        echo ""
    fi

    # Show unstaged files
    if [ "$(git diff --name-only | wc -l)" -gt 0 ]; then
        echo "🟡 Unstaged files (will be staged automatically):"
        git diff --name-only | head -20
        echo ""
    fi

    # Show diff summary
    echo "📊 Change Summary:"
    git diff --stat 2>/dev/null || echo "No changes to show"
    echo ""
}

# Generate intelligent commit message
generate_commit_message() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local total_files=$(git diff --name-only HEAD | wc -l)
    local file_types=$(git diff --name-only HEAD | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -5 | awk '{print $2 " (" $1 ")"}' | tr '\n' ', ' | sed 's/, $//')

    # Detect if this is related to a specific agent or batch
    local agent_context=""
    local batch_context=""

    # Check for agent-related changes
    if git diff --name-only HEAD | grep -q "agent\|batch\|github-cli"; then
        agent_context=" (Agent-related)"
    fi

    # Check for GitHub CLI changes
    if git diff --name-only HEAD | grep -q "github-cli\|gh-utilities\|agent-batch-commit"; then
        batch_context=" (GitHub CLI Integration)"
    fi

    cat << EOF
🤖 Auto-commit [Claude Code CLI 2.0] - $timestamp

📊 Change Summary:
• Files changed: $total_files
• File types: $file_types
• Context: $agent_context$batch_context

📁 Files Modified:
$(git diff --name-only HEAD | head -10 | sed 's/^/  • /')

🎯 Validation Status:
✅ User has reviewed and approved changes
✅ Auto-commit triggered by user request
✅ Commit message generated automatically

🚀 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
}

# User validation prompts
prompt_user_validation() {
    echo "🔍 VALIDATION PROMPTS"
    echo "=================="
    echo ""

    local all_validated=true

    for prompt in "${VALIDATION_PROMPTS[@]}"; do
        read -p "❓ $prompt [Y/n]: " response
        case "$response" in
            "Y"|"y"|"yes"|"")
                echo "✅ $prompt - Yes"
                ;;
            *)
                echo "❌ $prompt - No"
                all_validated=false
                ;;
        esac
    done

    echo ""

    if [ "$all_validated" = true ]; then
        echo "✅ All validation prompts passed"
        return 0
    else
        echo "❌ Validation failed - auto-commit cancelled"
        return 1
    fi
}

# Stage all changes
stage_changes() {
    echo "📁 Staging all changes..."
    git add -A
    echo "✅ Changes staged"
}

# Perform auto-commit
perform_auto_commit() {
    echo "🔄 Performing auto-commit..."

    local commit_message=$(generate_commit_message)

    # Create commit
    git commit -m "$commit_message"

    local commit_hash=$(git rev-parse HEAD)
    echo "✅ Auto-commit created: $commit_hash"

    return 0
}

# Push to remote repository
push_changes() {
    echo "🔄 Pushing to remote repository..."

    if git remote get-url origin >/dev/null 2>&1; then
        git push origin main
        echo "✅ Changes pushed to origin/main"
    else
        echo "ℹ️ No remote repository configured - changes are local only"
    fi
}

# Show post-commit information
show_post_commit_info() {
    echo ""
    echo "🎉 Auto-commit completed successfully!"
    echo "===================================="
    echo ""
    echo "📊 Commit Details:"
    git log -1 --pretty=format:"  • Hash: %h%n  • Author: %an%n  • Time: %ad%n  • Message: %s"
    echo ""
    echo "🔗 Repository: $(git remote get-url origin 2>/dev/null || echo 'Local repository')"
    echo "📁 Working Directory: $(pwd)"
    echo ""
    echo "💡 Tips:"
    echo "  • Use 'git log --oneline' to see recent commits"
    echo "  • Use 'git status' to check repository status"
    echo "  • Use 'git diff HEAD~1' to see last changes"
    echo ""
    echo "🚀 Ready for your next Claude Code CLI 2.0 task!"
}

# Main execution flow
main() {
    echo "🚀 Starting Claude Code CLI 2.0 Auto-Commit Process..."

    # 1. Check for changes
    if ! check_for_changes; then
        exit 1
    fi

    # 2. Show changes
    show_changes

    # 3. Stage changes
    stage_changes

    # 4. User validation
    if ! prompt_user_validation; then
        echo "❌ Auto-commit cancelled by user"
        exit 1
    fi

    # 5. Perform auto-commit
    if ! perform_auto_commit; then
        echo "❌ Auto-commit failed"
        exit 1
    fi

    # 6. Push changes
    push_changes

    # 7. Show post-commit information
    show_post_commit_info

    echo ""
    echo "🎉 Auto-commit process completed successfully!"
}

# Command line options
case "${1:-auto}" in
    "check")
        check_for_changes
        ;;
    "show")
        show_changes
        ;;
    "auto"|*)
        main "$@"
        ;;
esac