#!/bin/bash

# 🤖 GITHUB AGENT WORKFLOW AUTOMATION
# REPL-friendly branching and PR automation for multi-agent development

COMMAND="$1"
shift

case "$COMMAND" in

  "start-session")
    # Create ephemeral branch for agent session
    AGENT_ID="${1:-AGENT_UNKNOWN}"
    SESSION="agent/$AGENT_ID/$(date +%Y-%m-%d_%H-%M)-$$"

    echo "=== 🤖 STARTING AGENT SESSION ==="
    echo "Agent: $AGENT_ID"
    echo "Branch: $SESSION"
    echo ""

    git switch -c "$SESSION"
    echo "✅ Session branch created"
    echo ""
    echo "NEXT STEPS:"
    echo "  1. Make your changes"
    echo "  2. Run: $0 commit-session"
    echo "  3. Run: $0 create-pr"
    ;;

  "commit-session")
    # Commit current work with timestamp
    CURRENT_BRANCH=$(git branch --show-current)

    if [[ ! "$CURRENT_BRANCH" =~ ^agent/ ]] && [[ ! "$CURRENT_BRANCH" =~ ^repl/ ]]; then
      echo "⚠️  Not on an agent/repl branch - are you sure?"
      echo "Current branch: $CURRENT_BRANCH"
      read -p "Continue anyway? (y/N) " -n 1 -r
      echo ""
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi

    echo "=== 📝 COMMITTING SESSION WORK ==="
    echo "Branch: $CURRENT_BRANCH"
    echo ""

    git add -A
    git status --short

    echo ""
    read -p "Commit message: " -r MESSAGE
    if [ -z "$MESSAGE" ]; then
      MESSAGE="agent: WIP $(date -Iseconds)"
    fi

    git commit -m "$MESSAGE"
    git push -u origin HEAD

    echo ""
    echo "✅ Changes committed and pushed"
    echo "Run: $0 create-pr to open PR"
    ;;

  "create-pr")
    # Create draft PR from current branch
    CURRENT_BRANCH=$(git branch --show-current)

    echo "=== 🔀 CREATING DRAFT PR ==="
    echo "Branch: $CURRENT_BRANCH"
    echo ""

    PR_URL=$(gh pr create --draft --fill --head "$CURRENT_BRANCH" --base main 2>&1 | grep "https://")

    if [ -n "$PR_URL" ]; then
      echo "✅ Draft PR created: $PR_URL"
      echo ""
      echo "NEXT STEPS:"
      echo "  1. Wait for CI checks: gh pr checks --watch"
      echo "  2. Mark ready: gh pr ready"
      echo "  3. Auto-merge: gh pr merge --auto --squash --delete-branch"
    else
      echo "⚠️  PR creation failed or PR already exists"
      gh pr view
    fi
    ;;

  "ready-merge")
    # Watch checks, then enable auto-merge when green
    echo "=== ⏳ WATCHING CI CHECKS ==="
    gh pr checks --watch

    echo ""
    echo "Checks complete - marking PR as ready..."
    gh pr ready

    echo ""
    echo "Enabling auto-merge..."
    gh pr merge --auto --squash --delete-branch

    echo ""
    echo "✅ PR will auto-merge when approved!"
    ;;

  "bulk-sync")
    # Sync all PROJECT_ repositories
    echo "=== 🔄 SYNCING ALL PROJECT_ REPOSITORIES ==="
    echo ""

    gh repo list leolech14 --limit 200 --json nameWithOwner --jq '.[] | select(.nameWithOwner | contains("PROJECT_")) | .nameWithOwner' | \
    while read repo; do
      repo_name=$(basename "$repo")
      local_dir="/Users/lech/PROJECTS_all/$repo_name"

      if [ -d "$local_dir" ]; then
        echo "Syncing $repo_name..."
        cd "$local_dir"
        git pull origin main 2>&1 | grep -E "(Already|Updating|Fast-forward)" || echo "  ⚠️  Pull failed"
        cd - > /dev/null
      else
        echo "  ⚪ $repo_name - no local directory"
      fi
    done

    echo ""
    echo "✅ Sync complete"
    ;;

  "ci-status")
    # Check CI/CD status across all PROJECT_ repos
    echo "=== 📊 CI/CD STATUS FOR ALL PROJECT_ REPOS ==="
    echo ""

    PASSING=0
    FAILING=0
    NO_RUNS=0

    gh repo list leolech14 --limit 200 --json nameWithOwner --jq '.[] | select(.nameWithOwner | contains("PROJECT_")) | .nameWithOwner' | \
    while read repo; do
      printf "%-50s " "$repo:"
      LATEST=$(gh run list -R "$repo" --limit 1 --json conclusion --jq '.[0].conclusion' 2>/dev/null)

      if [ "$LATEST" = "success" ]; then
        echo "✅ PASSING"
        ((PASSING++))
      elif [ "$LATEST" = "failure" ]; then
        echo "❌ FAILING"
        ((FAILING++))
      else
        echo "⚪ NO RUNS"
        ((NO_RUNS++))
      fi
    done

    echo ""
    echo "📊 SUMMARY:"
    echo "  Passing: $PASSING"
    echo "  Failing: $FAILING"
    echo "  No runs: $NO_RUNS"
    ;;

  "deploy-to-vm")
    # Deploy current project to Google Cloud VM
    PROJECT_NAME=$(basename $(pwd))

    echo "=== 🚀 DEPLOYING TO GOOGLE CLOUD VM ==="
    echo "Project: $PROJECT_NAME"
    echo ""

    # Build first
    echo "Building..."
    npm run build || echo "  ⚠️  No build script"

    echo ""
    echo "Deploying to VM..."
    if [ -f "./scripts/deploy-to-vm.sh" ]; then
      ./scripts/deploy-to-vm.sh
    else
      echo "  Using generic deployment..."
      gcloud compute ssh lech@central-mcp-server --zone=us-central1-a --command="
        cd /home/lech/PROJECTS_all/$PROJECT_NAME && \
        git pull origin main && \
        npm install && \
        npm run build && \
        pm2 restart $PROJECT_NAME || pm2 start npm --name $PROJECT_NAME -- start
      "
    fi

    echo ""
    echo "✅ Deployment complete"
    ;;

  "help"|*)
    echo "=== 🤖 GITHUB AGENT WORKFLOW COMMANDS ==="
    echo ""
    echo "AGENT SESSION WORKFLOW:"
    echo "  $0 start-session AGENT_ID    Create ephemeral branch for agent"
    echo "  $0 commit-session            Commit and push current work"
    echo "  $0 create-pr                 Create draft PR"
    echo "  $0 ready-merge               Watch checks → auto-merge when green"
    echo ""
    echo "BULK OPERATIONS:"
    echo "  $0 bulk-sync                 Sync all PROJECT_ repos from GitHub"
    echo "  $0 ci-status                 Check CI/CD status across all repos"
    echo ""
    echo "DEPLOYMENT:"
    echo "  $0 deploy-to-vm              Deploy current project to Google Cloud VM"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 start-session AGENT_D"
    echo "  # ... make changes ..."
    echo "  $0 commit-session"
    echo "  $0 create-pr"
    echo "  $0 ready-merge"
    ;;

esac
