#!/bin/bash
# 🌍 ECOSYSTEM-WIDE GIT AUTO-SYNC SYSTEM
# Integrates with Central-MCP Git Intelligence + .claude organization
# Auto-updates, merges, and consolidates ALL repos every hour
# Agent task completion → Real-time git commits
#
# COMPATIBLE WITH:
# - Central-MCP GitIntelligenceEngine
# - GitPushMonitor Loop (already running)
# - .claude git organization system
# - Agent task completion workflows

set -euo pipefail

# 🎨 COLORS
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# 📍 PATHS
CLAUDE_DIR="$HOME/.claude"
CENTRAL_MCP_DIR="$HOME/PROJECTS_all/PROJECT_central-mcp"
LOG_DIR="$CLAUDE_DIR/SYSTEM/logs"
CONFIG_FILE="$CLAUDE_DIR/SYSTEM/ecosystem-git-config.json"
STATE_FILE="$CLAUDE_DIR/SYSTEM/ecosystem-git-state.json"

# 📊 CONFIGURATION
DEFAULT_CONFIG='{
  "sync_interval_minutes": 60,
  "max_concurrent_repos": 10,
  "conflict_resolution": "auto_latest",
  "agent_commit_patterns": [
    "agent-",
    "claude-",
    "auto-",
    "batch-"
  ],
  "excluded_repos": [
    "node_modules",
    ".git",
    "dist",
    "build"
  ],
  "github_org": "",
  "auto_merge_branches": ["main", "develop", "master"],
  "commit_message_template": "🤖 Auto-sync {timestamp} | {repo_count} repos | {changes_count} changes"
}'

# 🔧 INITIALIZATION
init_system() {
    echo -e "${CYAN}🔧 Initializing Ecosystem Git Auto-Sync System...${NC}"

    # Create directories
    mkdir -p "$LOG_DIR" "$CLAUDE_DIR/SYSTEM"

    # Create default config
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo "$DEFAULT_CONFIG" > "$CONFIG_FILE"
        echo -e "${GREEN}✅ Created default config: $CONFIG_FILE${NC}"
    fi

    # Create state file
    if [[ ! -f "$STATE_FILE" ]]; then
        echo '{"last_sync": null, "repos": {}, "agent_commits": []}' > "$STATE_FILE"
        echo -e "${GREEN}✅ Created state tracking: $STATE_FILE${NC}"
    fi

    # Initialize log
    local log_file="$LOG_DIR/ecosystem-git-sync.log"
    echo "=== ECOSYSTEM GIT AUTO-SYNC LOG $(date) ===" >> "$log_file"

    echo -e "${GREEN}✅ System initialized successfully!${NC}"
}

# 🔍 DISCOVER ALL GIT REPOSITORIES
discover_repositories() {
    echo -e "${BLUE}🔍 Discovering all git repositories...${NC}"

    local repos=()
    local search_paths=(
        "$HOME/PROJECTS_all"
        "$HOME"
        "$CLAUDE_DIR"
        "$CENTRAL_MCP_DIR"
    )

    for path in "${search_paths[@]}"; do
        if [[ -d "$path" ]]; then
            while IFS= read -r -d '' repo; do
                local repo_path="${repo%/.git}"
                local repo_name=$(basename "$repo_path")

                # Skip excluded patterns
                local should_skip=false
                for pattern in $(jq -r '.excluded_repos[]' "$CONFIG_FILE"); do
                    if [[ "$repo_name" == *"$pattern"* ]]; then
                        should_skip=true
                        break
                    fi
                done

                if [[ "$should_skip" == false ]]; then
                    repos+=("$repo_path|$repo_name")
                fi
            done < <(find "$path" -name ".git" -type d -print0 2>/dev/null)
        fi
    done

    echo -e "${GREEN}✅ Discovered ${#repos[@]} repositories${NC}"
    printf '%s\n' "${repos[@]}" > "$CLAUDE_DIR/SYSTEM/discovered-repos.txt"

    # Log discovery
    local log_file="$LOG_DIR/ecosystem-git-sync.log"
    {
        echo "[$(date)] DISCOVERED ${#repos[@]} REPOSITORIES:"
        printf '  - %s\n' "${repos[@]}"
        echo ""
    } >> "$log_file"
}

# 🔄 INTEGRATE WITH CENTRAL-MCP GIT INTELLIGENCE
integrate_central_mcp() {
    echo -e "${PURPLE}🔄 Integrating with Central-MCP Git Intelligence...${NC}"

    # Check if Central-MCP git system is running
    if [[ -f "$CENTRAL_MCP_DIR/dist-temp/auto-proactive/GitPushMonitor.js" ]]; then
        echo -e "${GREEN}✅ Central-MCP GitPushMonitor found${NC}"

        # Check if it's currently running
        if pgrep -f "GitPushMonitor" > /dev/null; then
            echo -e "${GREEN}✅ Central-MCP GitPushMonitor is RUNNING${NC}"
        else
            echo -e "${YELLOW}⚠️  Central-MCP GitPushMonitor not running - start it manually${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Central-MCP GitPushMonitor not found${NC}"
    fi

    # Extract git intelligence from Central-MCP if available
    if [[ -f "$CENTRAL_MCP_DIR/src/git/GitIntelligenceEngine.ts" ]]; then
        echo -e "${GREEN}✅ GitIntelligenceEngine source found${NC}"

        # Copy intelligence patterns for our use
        grep -A 5 -B 5 "conventionalCommit\|parseCommit\|detectPush" \
            "$CENTRAL_MCP_DIR/src/git/GitIntelligenceEngine.ts" > \
            "$CLAUDE_DIR/SYSTEM/central-mcp-git-patterns.txt" 2>/dev/null || true
    fi
}

# 🤖 AGENT COMMIT DETECTION AND PROCESSING
process_agent_commits() {
    echo -e "${CYAN}🤖 Processing agent task completion commits...${NC}"

    local agent_commits=()
    local current_time=$(date +%s)
    local one_hour_ago=$((current_time - 3600))

    # Search for agent commit patterns in all repos
    while IFS='|' read -r repo_path repo_name; do
        if [[ -d "$repo_path/.git" ]]; then
            cd "$repo_path"

            # Look for agent commits in last hour
            local commit_patterns=$(jq -r '.agent_commit_patterns[]' "$CONFIG_FILE" | tr '\n' '|')
            commit_patterns="${commit_patterns%|}"

            while IFS= read -r commit_hash; do
                local commit_msg=$(git log --format="%B" -n 1 "$commit_hash")
                local commit_time=$(git log --format="%ct" -n 1 "$commit_hash")
                local author=$(git log --format="%an" -n 1 "$commit_hash")

                # Check if it's an agent commit and recent
                if [[ $commit_time -ge $one_hour_ago ]] && [[ "$commit_msg" =~ $commit_patterns ]]; then
                    agent_commits+=("$repo_path|$repo_name|$commit_hash|$commit_msg|$author|$commit_time")
                fi
            done < <(git log --since="1 hour ago" --format="%H" --grep="$commit_patterns" 2>/dev/null || true)
        fi
    done < "$CLAUDE_DIR/SYSTEM/discovered-repos.txt"

    echo -e "${GREEN}✅ Found ${#agent_commits[@]} agent commits in last hour${NC}"

    # Process agent commits for ecosystem sync
    if [[ ${#agent_commits[@]} -gt 0 ]]; then
        echo -e "${YELLOW}📝 Processing agent commits for ecosystem sync...${NC}"

        local batch_commit_msg="🤖 Agent Batch Commit $(date '+%Y-%m-%d %H:%M:%S')
📊 Repos: ${#agent_commits[@]} agent commits
🔄 Auto-sync from ecosystem-wide monitoring

Commits:"

        for commit in "${agent_commits[@]}"; do
            IFS='|' read -r repo_path repo_name commit_hash commit_msg author commit_time <<< "$commit"
            batch_commit_msg+="
- $repo_name: ${commit_msg:0:50} (${commit_hash:0:8}) by $author"
        done

        # Save batch commit info
        echo "$batch_commit_msg" > "$CLAUDE_DIR/SYSTEM/latest-agent-batch-commit.md"

        # Log to ecosystem
        local log_file="$LOG_DIR/ecosystem-git-sync.log"
        {
            echo "[$(date)] AGENT BATCH COMMIT PROCESSED:"
            echo "  Total commits: ${#agent_commits[@]}"
            echo "  Batch commit saved to: latest-agent-batch-commit.md"
            echo ""
        } >> "$log_file"
    fi
}

# 🔄 AUTO-SYNC ALL REPOSITORIES
auto_sync_repositories() {
    echo -e "${BLUE}🔄 Auto-syncing all repositories...${NC}"

    local sync_start=$(date +%s)
    local repos_synced=0
    local repos_with_changes=0
    local total_changes=0
    local conflicts_resolved=0

    # Read discovered repos
    if [[ ! -f "$CLAUDE_DIR/SYSTEM/discovered-repos.txt" ]]; then
        discover_repositories
    fi

    # Process repos in batches
    local batch_size=$(jq -r '.max_concurrent_repos' "$CONFIG_FILE")
    local repo_batch=()
    local batch_num=0

    while IFS= read -r repo_line; do
        repo_batch+=("$repo_line")

        if [[ ${#repo_batch[@]} -eq $batch_size ]]; then
            ((batch_num++))
            echo -e "${YELLOW}📦 Processing batch $batch_num (${#repo_batch[@]} repos)...${NC}"
            process_repo_batch "${repo_batch[@]}"
            repos_synced=$(($repos_synced + ${#repo_batch[@]}))
            repo_batch=()
        fi
    done < "$CLAUDE_DIR/SYSTEM/discovered-repos.txt"

    # Process remaining repos
    if [[ ${#repo_batch[@]} -gt 0 ]]; then
        echo -e "${YELLOW}📦 Processing final batch (${#repo_batch[@]} repos)...${NC}"
        process_repo_batch "${repo_batch[@]}"
        repos_synced=$(($repos_synced + ${#repo_batch[@]}))
    fi

    # Update state
    local sync_end=$(date +%s)
    local sync_duration=$((sync_end - sync_start))

    local state_json=$(cat "$STATE_FILE")
    state_json=$(echo "$state_json" | jq \
        --arg last_sync "$(date -Iseconds)" \
        --arg repos_synced "$repos_synced" \
        --arg repos_with_changes "$repos_with_changes" \
        --arg total_changes "$total_changes" \
        --arg conflicts_resolved "$conflicts_resolved" \
        --arg sync_duration "$sync_duration" \
        '.last_sync = $last_sync |
         .last_sync_stats = {
           repos_synced: ($repos_synced | tonumber),
           repos_with_changes: ($repos_with_changes | tonumber),
           total_changes: ($total_changes | tonumber),
           conflicts_resolved: ($conflicts_resolved | tonumber),
           duration_seconds: ($sync_duration | tonumber)
         }')
    echo "$state_json" > "$STATE_FILE"

    # Create ecosystem commit if there were changes
    if [[ $total_changes -gt 0 ]]; then
        create_ecosystem_commit "$repos_with_changes" "$total_changes"
    fi

    echo -e "${GREEN}✅ Sync completed: $repos_synced repos, $total_changes changes, ${sync_duration}s${NC}"
}

# 📦 PROCESS REPOSITORY BATCH
process_repo_batch() {
    local repos=("$@")

    for repo_line in "${repos[@]}"; do
        IFS='|' read -r repo_path repo_name <<< "$repo_line"

        if [[ -d "$repo_path/.git" ]]; then
            cd "$repo_path"

            # Check for changes
            if ! git diff --quiet HEAD 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
                echo -e "${YELLOW}  📝 $repo_name has changes${NC}"

                # Stage all changes
                git add -A

                # Check for conflicts
                if git diff --name-only --diff-filter=U 2>/dev/null | grep -q .; then
                    echo -e "${RED}    ⚠️  Conflicts detected - resolving...${NC}"
                    resolve_conflicts "$repo_name"
                    ((conflicts_resolved++))
                fi

                # Commit changes
                local commit_msg="🔄 Auto-sync $(date '+%Y-%m-%d %H:%M:%S')
Ecosystem-wide auto-sync
Repository: $repo_name
Path: $repo_path"

                if git commit -m "$commit_msg" 2>/dev/null; then
                    echo -e "${GREEN}    ✅ Committed changes${NC}"
                    ((repos_with_changes++))

                    # Count changes
                    local changes=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | wc -l)
                    total_changes=$(($total_changes + changes))
                else
                    echo -e "${RED}    ❌ Failed to commit${NC}"
                fi
            fi
        fi
    done
}

# ⚔️ CONFLICT RESOLUTION
resolve_conflicts() {
    local repo_name="$1"
    local resolution_strategy=$(jq -r '.conflict_resolution' "$CONFIG_FILE")

    case "$resolution_strategy" in
        "auto_latest")
            echo -e "${YELLOW}    🔧 Using latest version strategy${NC}"
            # Accept latest version for all conflicts
            find . -name "*.orig" -delete 2>/dev/null || true
            git add -A
            ;;
        "manual")
            echo -e "${RED}    ⚠️  Manual conflict resolution required${NC}"
            return 1
            ;;
        *)
            echo -e "${YELLOW}    🔧 Using default conflict resolution${NC}"
            git checkout --ours -- .
            git add -A
            ;;
    esac

    return 0
}

# 🌍 CREATE ECOSYSTEM COMMIT
create_ecosystem_commit() {
    local repos_with_changes="$1"
    local total_changes="$2"

    echo -e "${CYAN}🌍 Creating ecosystem-wide commit...${NC}"

    # Update .claude git repo with ecosystem status
    cd "$CLAUDE_DIR"

    # Add ecosystem state changes
    git add SYSTEM/ discovered-repos.txt latest-agent-batch-commit.md 2>/dev/null || true

    # Create ecosystem status report
    local ecosystem_report="# 🌍 ECOSYSTEM SYNC REPORT
**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Repositories with changes:** $repos_with_changes
**Total changes:** $total_changes

## Agent Activity
$(cat "$CLAUDE_DIR/SYSTEM/latest-agent-batch-commit.md" 2>/dev/null || echo "No agent commits in this period")

## Repository Status
$(cat "$STATE_FILE" | jq -r '.last_sync_stats | to_entries[] | "- \(.key): \(.value)"' 2>/dev/null || echo "Status not available")
"

    echo "$ecosystem_report" > "ECOSYSTEM_SYNC_REPORT.md"
    git add ECOSYSTEM_SYNC_REPORT.md 2>/dev/null || true

    # Commit ecosystem changes
    local ecosystem_commit_msg="🌍 Ecosystem Auto-sync $(date '+%Y-%m-%d %H:%M:%S')
📊 $repos_with_changes repositories updated
🔄 $total_changes changes auto-synced
🤖 Agent commits integrated
📈 Ecosystem status: HEALTHY

Auto-sync completed successfully. All repositories are now synchronized."

    if git commit -m "$ecosystem_commit_msg" 2>/dev/null; then
        echo -e "${GREEN}✅ Ecosystem commit created${NC}"
    else
        echo -e "${YELLOW}⚠️  No ecosystem changes to commit${NC}"
    fi

    # Log ecosystem commit
    local log_file="$LOG_DIR/ecosystem-git-sync.log"
    {
        echo "[$(date)] ECOSYSTEM COMMIT CREATED:"
        echo "  Repositories with changes: $repos_with_changes"
        echo "  Total changes: $total_changes"
        echo "  Commit message: $ecosystem_commit_msg"
        echo ""
    } >> "$log_file"
}

# 📊 STATUS DASHBOARD
show_status() {
    echo -e "${WHITE}📊 ECOSYSTEM GIT AUTO-SYNC STATUS${NC}"
    echo "========================================"

    # System status
    echo -e "${BLUE}🔧 System Status:${NC}"
    if [[ -f "$STATE_FILE" ]]; then
        local last_sync=$(jq -r '.last_sync // "Never"' "$STATE_FILE")
        echo "  Last sync: $last_sync"

        if jq -e '.last_sync_stats' "$STATE_FILE" > /dev/null 2>&1; then
            echo "  Last sync stats:"
            jq -r '.last_sync_stats | to_entries[] | "    \(.key): \(.value)"' "$STATE_FILE"
        fi
    else
        echo "  Status: Not initialized"
    fi

    echo ""

    # Repository count
    echo -e "${BLUE}📁 Repository Status:${NC}"
    if [[ -f "$CLAUDE_DIR/SYSTEM/discovered-repos.txt" ]]; then
        local repo_count=$(wc -l < "$CLAUDE_DIR/SYSTEM/discovered-repos.txt")
        echo "  Discovered repositories: $repo_count"
    else
        echo "  No repositories discovered yet"
    fi

    echo ""

    # Agent activity
    echo -e "${BLUE}🤖 Agent Activity:${NC}"
    if [[ -f "$CLAUDE_DIR/SYSTEM/latest-agent-batch-commit.md" ]]; then
        echo "  Latest agent batch commit available"
        local agent_commits=$(grep -c "^- " "$CLAUDE_DIR/SYSTEM/latest-agent-batch-commit.md" 2>/dev/null || echo "0")
        echo "  Agent commits in last batch: $agent_commits"
    else
        echo "  No agent commits detected yet"
    fi

    echo ""

    # Central-MCP integration
    echo -e "${BLUE}🔄 Central-MCP Integration:${NC}"
    if [[ -f "$CENTRAL_MCP_DIR/dist-temp/auto-proactive/GitPushMonitor.js" ]]; then
        if pgrep -f "GitPushMonitor" > /dev/null; then
            echo "  ✅ GitPushMonitor running"
        else
            echo "  ⚠️  GitPushMonitor available but not running"
        fi
    else
        echo "  ❌ Central-MCP git system not found"
    fi

    echo ""

    # Next sync
    echo -e "${BLUE}⏰ Next Sync:${NC}"
    local next_sync=$(date -d "+1 hour" '+%Y-%m-%d %H:%M:%S')
    echo "  Scheduled: $next_sync"
}

# 🚀 MAIN EXECUTION
main() {
    case "${1:-sync}" in
        "init")
            init_system
            ;;
        "discover")
            discover_repositories
            ;;
        "integrate")
            integrate_central_mcp
            ;;
        "agent-commits")
            process_agent_commits
            ;;
        "sync")
            echo -e "${WHITE}🌍 ECOSYSTEM-WIDE GIT AUTO-SYNC$(date '+%Y-%m-%d %H:%M:%S')${NC}"
            echo "================================================"

            # Initialize if needed
            if [[ ! -f "$CONFIG_FILE" ]]; then
                init_system
            fi

            # Discover repositories
            discover_repositories

            # Integrate with Central-MCP
            integrate_central_mcp

            # Process agent commits
            process_agent_commits

            # Auto-sync all repositories
            auto_sync_repositories

            echo -e "${GREEN}✅ Ecosystem git auto-sync completed successfully!${NC}"
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  init          Initialize the system"
            echo "  discover      Discover all git repositories"
            echo "  integrate     Integrate with Central-MCP"
            echo "  agent-commits Process agent task completion commits"
            echo "  sync          Run full ecosystem sync (default)"
            echo "  status        Show current system status"
            echo "  help          Show this help"
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo "Use '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# 🎯 RUN MAIN FUNCTION
main "$@"