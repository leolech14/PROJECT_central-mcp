#!/bin/bash

# 📋 INSTALL GITHUB CLI ALIASES
# Import all Trinity Intelligence custom aliases

echo "=== 📋 INSTALLING GITHUB CLI ALIASES ==="
echo ""

ALIAS_FILE="$(dirname "$0")/github-aliases.yml"

if [ ! -f "$ALIAS_FILE" ]; then
    echo "❌ Alias file not found: $ALIAS_FILE"
    exit 1
fi

echo "Importing aliases from: $ALIAS_FILE"
echo ""

# GitHub CLI doesn't have 'alias import' yet, so we parse YAML and install each
# Extract alias names and commands from YAML

echo "Installing aliases manually..."

# Define all aliases programmatically
declare -A ALIASES

# Quick repo info
gh alias set repo-quick-info --clobber 'api repos/$1 --jq '"'"'{name, visibility, defaultBranch: .default_branch, stars: .stargazers_count, size: .size, language, pushed: .pushed_at}'"'"''

# Protection
gh alias set protect-main --clobber 'api -X PUT repos/$1/branches/main/protection -H "X-GitHub-Api-Version: 2022-11-28" -f required_status_checks.strict:=true -F required_status_checks.contexts[]="Verify Build" -F required_pull_request_reviews.required_approving_review_count:=1'

gh alias set unprotect-main --clobber 'api -X DELETE repos/$1/branches/main/protection -H "X-GitHub-Api-Version: 2022-11-28"'

# PR shortcuts
gh alias set pr-draft --clobber 'pr create --draft --fill'
gh alias set pr-ready --clobber 'pr ready'
gh alias set pr-auto --clobber 'pr merge --auto --squash --delete-branch'

# Workflow
gh alias set wf-list --clobber 'workflow list'
gh alias set run-latest --clobber 'run list --limit 1 --json databaseId --jq '"'"'.[0].databaseId'"'"''

# PROJECT_ operations
gh alias set project-list --clobber 'repo list leolech14 --limit 200 --json nameWithOwner --jq '"'"'.[] | select(.nameWithOwner | contains("PROJECT_")) | .nameWithOwner'"'"''

# Status
gh alias set status --clobber '!echo "📊 GitHub Status:" && echo "User: $(gh api user --jq .login)" && echo "Repos: $(gh repo list --limit 200 | wc -l)" && echo "PROJECT_: $(gh repo list --limit 200 --json nameWithOwner --jq '"'"'.[] | select(.nameWithOwner | contains("PROJECT_"))'"'"' | wc -l)"'

echo ""
echo "=== ✅ ALIASES INSTALLED ==="
echo ""
echo "📋 AVAILABLE ALIASES:"
gh alias list
echo ""
echo "🚀 USAGE EXAMPLES:"
echo "  gh repo-quick-info leolech14/PROJECT_central-mcp"
echo "  gh protect-main leolech14/PROJECT_central-mcp"
echo "  gh project-list"
echo "  gh pr-draft"
echo "  gh status"
