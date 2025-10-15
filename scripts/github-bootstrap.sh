#!/bin/bash

# 🚀 ADVANCED GITHUB CLI BOOTSTRAP
# One-time setup for sophisticated GitHub automation

echo "=== 🚀 GITHUB CLI BOOTSTRAP FOR TRINITY ECOSYSTEM ==="
echo ""

# 1) Authentication and defaults
echo "Step 1: Configuring GitHub CLI..."
echo ""

# Check if already authenticated
if gh auth status >/dev/null 2>&1; then
    echo "✅ Already authenticated to GitHub"
    gh auth status
else
    echo "⚠️  Not authenticated - please run: gh auth login"
    echo "   Then re-run this script"
    exit 1
fi

echo ""
echo "Step 2: Setting optimal defaults..."

# Prefer SSH for git operations (better for automation)
gh config set git_protocol ssh
echo "✅ Git protocol set to SSH"

# Set editor (if not set)
if [ -z "$EDITOR" ]; then
    export EDITOR="nano"  # Or vim, code, etc.
    echo "✅ Editor set to $EDITOR"
fi

# Show complete auth status
echo ""
echo "Step 3: Verifying authentication..."
gh auth status -t
echo ""

# 2) Configure environment variables for automation
echo "Step 4: Setting environment variables for automation..."

# Add to shell profile
SHELL_PROFILE="$HOME/.bashrc"
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
fi

# Add GitHub automation environment variables
cat >> "$SHELL_PROFILE" << 'EOF'

# GitHub CLI Automation Configuration (Added by Trinity Intelligence)
export GH_HOST=github.com
export GH_REPO=leolech14  # Default owner for operations

# Pagination for large operations
export GH_PAGER=

# Force terminal output (useful for automation)
export GH_FORCE_TTY=1

EOF

echo "✅ Environment variables added to $SHELL_PROFILE"
echo ""

# 3) Test API access
echo "Step 5: Testing GitHub API access..."
echo "Fetching repository count..."
REPO_COUNT=$(gh repo list leolech14 --limit 200 --json nameWithOwner | jq 'length')
echo "✅ API access verified - found $REPO_COUNT repositories"
echo ""

# 4) Verify SSH keys (for git operations)
echo "Step 6: Checking SSH keys..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH keys configured and working"
else
    echo "⚠️  SSH authentication not set up"
    echo "   Generate key: ssh-keygen -t ed25519 -C 'your_email@example.com'"
    echo "   Add to GitHub: Settings → SSH and GPG keys"
    echo ""
    echo "   For now, using HTTPS (less optimal for automation)"
    gh config set git_protocol https
fi
echo ""

# 5) Success summary
echo "=== ✅ GITHUB CLI BOOTSTRAP COMPLETE ==="
echo ""
echo "📊 CONFIGURATION:"
echo "  • Git protocol: $(gh config get git_protocol)"
echo "  • Authenticated as: $(gh api user --jq .login)"
echo "  • Total repositories: $REPO_COUNT"
echo "  • Shell profile: $SHELL_PROFILE"
echo ""
echo "🚀 NEXT STEPS:"
echo "  1. Source your shell profile: source $SHELL_PROFILE"
echo "  2. Run bulk operations: ./scripts/github-bulk-hardening.sh"
echo "  3. Set up aliases: ./scripts/github-install-aliases.sh"
echo ""
echo "✅ Ready for advanced GitHub automation!"
