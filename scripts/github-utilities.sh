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
