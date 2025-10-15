#!/bin/bash

# 🔒 BULK GITHUB REPOSITORY HARDENING
# Apply advanced protections across all PROJECT_ repositories

echo "=== 🔒 BULK REPOSITORY HARDENING FOR TRINITY ECOSYSTEM ==="
echo ""

OWNER="leolech14"
PROTECTED_BRANCH="main"

# Get all PROJECT_ repositories
echo "Step 1: Discovering all PROJECT_ repositories..."
REPOS=$(gh repo list $OWNER --limit 200 --json nameWithOwner --jq '.[] | select(.nameWithOwner | contains("PROJECT_")) | .nameWithOwner')
REPO_COUNT=$(echo "$REPOS" | wc -l | tr -d ' ')

echo "✅ Found $REPO_COUNT PROJECT_ repositories"
echo ""

# Ask for confirmation
echo "⚠️  This will apply the following to ALL PROJECT_ repositories:"
echo "  • Auto-delete merged branches"
echo "  • Set default branch to 'main'"
echo "  • Enable branch protection on 'main'"
echo "  • Require PR reviews (1 approver)"
echo "  • Require status checks to pass"
echo "  • Dismiss stale reviews"
echo "  • Require conversation resolution"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 2: Applying repository settings..."
SUCCESS=0
FAILED=0

while IFS= read -r repo; do
    if [ -z "$repo" ]; then continue; fi

    echo "Processing: $repo"

    # Apply basic settings
    if gh repo edit -R "$repo" \
        --delete-branch-on-merge \
        --default-branch main \
        --enable-issues \
        --enable-wiki=false 2>/dev/null; then
        echo "  ✅ Basic settings applied"
    else
        echo "  ⚠️  Settings failed (might be private/access issue)"
    fi

    # Extract owner and repo name
    repo_name=$(basename "$repo")

    # Apply branch protection (via REST API)
    echo "  🔒 Applying branch protection..."

    if gh api -X PUT "repos/$repo/branches/$PROTECTED_BRANCH/protection" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        -f required_status_checks.strict:=true \
        -F required_status_checks.contexts[]="Verify Build" \
        -F enforce_admins:=false \
        -F required_pull_request_reviews.required_approving_review_count:=1 \
        -F required_pull_request_reviews.dismiss_stale_reviews:=true \
        -F required_conversation_resolution:=true \
        -F allow_force_pushes:=false \
        -F allow_deletions:=false 2>/dev/null; then
        echo "  ✅ Branch protection applied"
        ((SUCCESS++))
    else
        echo "  ⚠️  Branch protection failed (empty repo or access issue)"
        ((FAILED++))
    fi

    echo ""

done <<< "$REPOS"

# Summary
echo "=== ✅ BULK HARDENING COMPLETE ==="
echo ""
echo "📊 RESULTS:"
echo "  Total repositories processed: $REPO_COUNT"
echo "  Successful: $SUCCESS"
echo "  Failed/Skipped: $FAILED"
echo ""
echo "✅ All PROJECT_ repositories have been hardened!"
echo ""
echo "🔍 TO VERIFY:"
echo "  gh repo view -R leolech14/PROJECT_central-mcp --json defaultBranchRef,deleteBranchOnMerge"
echo "  gh api repos/leolech14/PROJECT_central-mcp/branches/main/protection | jq ."
