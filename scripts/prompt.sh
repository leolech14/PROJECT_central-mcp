#!/bin/bash

# ============================================================================
# PROMPTS MANAGER - Store and Access AI Prompt Templates
# ============================================================================
# Purpose: Manage prompt templates library for Central-MCP
# Usage: ./prompt.sh [COMMAND] [OPTIONS]
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CENTRAL_MCP_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PATH="$CENTRAL_MCP_ROOT/data/registry.db"

# ============================================================================
# Utility Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_step() {
    echo -e "${PURPLE}▶${NC} $1"
}

# ============================================================================
# Show Usage
# ============================================================================

show_usage() {
    cat << EOF
${CYAN}═══════════════════════════════════════════════════════════════${NC}
${GREEN}🎯 PROMPTS MANAGER${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS:${NC}
  ${GREEN}list${NC}              List all prompts
  ${GREEN}search${NC} <query>    Search prompts by name, tag, or category
  ${GREEN}get${NC} <id>          Get prompt text by ID
  ${GREEN}info${NC} <id>         Show detailed prompt information
  ${GREEN}use${NC} <id>          Get prompt with variable substitution
  ${GREEN}copy${NC} <id>         Copy prompt to clipboard
  ${GREEN}popular${NC}           Show most popular prompts
  ${GREEN}recent${NC}            Show recently added prompts
  ${GREEN}stats${NC} <id>        Show usage statistics for prompt

${YELLOW}LIST OPTIONS:${NC}
  --category <cat>   Filter by category (system, user, task, instruction, conversation, agent)
  --type <type>      Filter by type (system_prompt, user_prompt, few_shot, chain_of_thought, react)
  --production       Show only production-ready prompts

${YELLOW}SEARCH OPTIONS:${NC}
  --tag <tag>        Search by specific tag
  --category <cat>   Limit to specific category

${YELLOW}USE OPTIONS:${NC}
  --var name=value   Set variable value (can be used multiple times)
  --output <file>    Save to file instead of stdout

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# List all prompts${NC}
  $0 list

  ${CYAN}# List system prompts${NC}
  $0 list --category system

  ${CYAN}# Search for code review prompts${NC}
  $0 search "code review"

  ${CYAN}# Get specific prompt${NC}
  $0 get system-code-architect

  ${CYAN}# Use prompt with variables${NC}
  $0 use user-bug-analysis --var bug_description="Login fails" --var error_message="500 error"

  ${CYAN}# Copy prompt to clipboard${NC}
  $0 copy task-spec-generation

  ${CYAN}# Show prompt details${NC}
  $0 info instruction-code-refactoring

  ${CYAN}# Show usage statistics${NC}
  $0 stats system-code-architect

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List Prompts
# ============================================================================

list_prompts() {
    local category="$1"
    local prompt_type="$2"
    local production_only="$3"

    log_info "Available prompts:"
    echo ""

    local sql="SELECT prompt_id, prompt_name, category, prompt_type, usage_count, quality_score FROM prompts_registry WHERE 1=1"

    if [ -n "$category" ]; then
        sql="$sql AND category = '$category'"
    fi

    if [ -n "$prompt_type" ]; then
        sql="$sql AND prompt_type = '$prompt_type'"
    fi

    if [ "$production_only" = "true" ]; then
        sql="$sql AND is_production_ready = TRUE"
    fi

    sql="$sql ORDER BY usage_count DESC, quality_score DESC, prompt_name;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Search Prompts
# ============================================================================

search_prompts() {
    local query="$1"
    local tag="$2"
    local category="$3"

    log_info "Searching for: $query"
    echo ""

    local sql="SELECT prompt_id, prompt_name, category, prompt_type, description FROM prompts_registry WHERE (prompt_name LIKE '%$query%' OR description LIKE '%$query%' OR tags LIKE '%$query%')"

    if [ -n "$tag" ]; then
        sql="$sql AND tags LIKE '%$tag%'"
    fi

    if [ -n "$category" ]; then
        sql="$sql AND category = '$category'"
    fi

    sql="$sql ORDER BY usage_count DESC, quality_score DESC;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Get Prompt Text
# ============================================================================

get_prompt() {
    local prompt_id="$1"
    local output_file="$2"

    if [ -z "$prompt_id" ]; then
        log_error "Prompt ID required"
        return 1
    fi

    local prompt_text=$(sqlite3 "$DB_PATH" "SELECT prompt_text FROM prompts_registry WHERE prompt_id = '$prompt_id';")

    if [ -z "$prompt_text" ]; then
        log_error "Prompt not found: $prompt_id"
        return 1
    fi

    echo "$prompt_text"

    # Log usage
    sqlite3 "$DB_PATH" "INSERT INTO prompt_usage (prompt_id, used_by, success) VALUES ('$prompt_id', 'cli', TRUE);"

    if [ -n "$output_file" ]; then
        echo "$prompt_text" > "$output_file"
        log_success "Saved to: $output_file"
    fi
}

# ============================================================================
# Copy Prompt to Clipboard
# ============================================================================

copy_prompt() {
    local prompt_id="$1"

    if [ -z "$prompt_id" ]; then
        log_error "Prompt ID required"
        return 1
    fi

    local prompt_text=$(sqlite3 "$DB_PATH" "SELECT prompt_text FROM prompts_registry WHERE prompt_id = '$prompt_id';")

    if [ -z "$prompt_text" ]; then
        log_error "Prompt not found: $prompt_id"
        return 1
    fi

    # Copy to clipboard (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "$prompt_text" | pbcopy
        log_success "Copied to clipboard!"
    elif command -v xclip &> /dev/null; then
        echo "$prompt_text" | xclip -selection clipboard
        log_success "Copied to clipboard!"
    else
        log_warning "Clipboard not available. Use: $0 get $prompt_id > file.txt"
    fi

    # Log usage
    sqlite3 "$DB_PATH" "INSERT INTO prompt_usage (prompt_id, used_by, success) VALUES ('$prompt_id', 'cli', TRUE);"
}

# ============================================================================
# Show Prompt Info
# ============================================================================

show_prompt_info() {
    local prompt_id="$1"

    if [ -z "$prompt_id" ]; then
        log_error "Prompt ID required"
        return 1
    fi

    log_info "Prompt Information: $prompt_id"
    echo ""

    # Get prompt details
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            prompt_name,
            category,
            prompt_type,
            description,
            use_case,
            temperature,
            max_tokens,
            is_production_ready,
            quality_score,
            effectiveness_rating,
            usage_count,
            success_rate,
            created_at
        FROM prompts_registry
        WHERE prompt_id = '$prompt_id';
    "

    echo ""
    log_info "Variables:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT variable_name, variable_type, is_required, default_value, description
        FROM prompt_variables
        WHERE prompt_id = '$prompt_id';
    "

    echo ""
    log_info "Recommended Models:"
    sqlite3 "$DB_PATH" "SELECT recommended_models FROM prompts_registry WHERE prompt_id = '$prompt_id';"

    echo ""
    log_info "Prompt Preview (first 500 chars):"
    echo ""
    sqlite3 "$DB_PATH" "SELECT substr(prompt_text, 1, 500) || '...' FROM prompts_registry WHERE prompt_id = '$prompt_id';"

    # Log usage
    sqlite3 "$DB_PATH" "INSERT INTO prompt_usage (prompt_id, used_by, success) VALUES ('$prompt_id', 'cli', TRUE);"
}

# ============================================================================
# Use Prompt with Variable Substitution
# ============================================================================

use_prompt() {
    local prompt_id="$1"
    shift
    local output_file=""
    declare -A variables

    # Parse variables
    while [ $# -gt 0 ]; do
        case "$1" in
            --var)
                local var_assignment="$2"
                local var_name="${var_assignment%%=*}"
                local var_value="${var_assignment#*=}"
                variables["$var_name"]="$var_value"
                shift 2
                ;;
            --output)
                output_file="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    if [ -z "$prompt_id" ]; then
        log_error "Prompt ID required"
        return 1
    fi

    local prompt_text=$(sqlite3 "$DB_PATH" "SELECT prompt_text FROM prompts_registry WHERE prompt_id = '$prompt_id';")

    if [ -z "$prompt_text" ]; then
        log_error "Prompt not found: $prompt_id"
        return 1
    fi

    # Substitute variables
    for var_name in "${!variables[@]}"; do
        local var_value="${variables[$var_name]}"
        prompt_text="${prompt_text//\{$var_name\}/$var_value}"
    done

    echo "$prompt_text"

    if [ -n "$output_file" ]; then
        echo "$prompt_text" > "$output_file"
        log_success "Saved to: $output_file"
    fi

    # Log usage
    local variables_json=$(printf '%s\n' "${!variables[@]}" | jq -R . | jq -s 'map({key:., value:"set"}) | from_entries' 2>/dev/null || echo '{}')
    sqlite3 "$DB_PATH" "INSERT INTO prompt_usage (prompt_id, used_by, variables_used, success) VALUES ('$prompt_id', 'cli', '$variables_json', TRUE);"
}

# ============================================================================
# Popular Prompts
# ============================================================================

show_popular() {
    log_info "Most Popular Prompts:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM popular_prompts LIMIT 10;"
}

# ============================================================================
# Recent Prompts
# ============================================================================

show_recent() {
    log_info "Recently Added Prompts:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM recent_prompts;"
}

# ============================================================================
# Prompt Statistics
# ============================================================================

show_stats() {
    local prompt_id="$1"

    if [ -z "$prompt_id" ]; then
        log_error "Prompt ID required"
        return 1
    fi

    log_info "Usage Statistics: $prompt_id"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT * FROM prompt_effectiveness_stats
        WHERE prompt_id = '$prompt_id';
    "
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    list)
        shift
        category=""
        prompt_type=""
        production_only="false"

        while [ $# -gt 0 ]; do
            case "$1" in
                --category) category="$2"; shift 2 ;;
                --type) prompt_type="$2"; shift 2 ;;
                --production) production_only="true"; shift ;;
                *) shift ;;
            esac
        done

        list_prompts "$category" "$prompt_type" "$production_only"
        ;;

    search)
        query="$2"
        if [ -z "$query" ]; then
            log_error "Search query required"
            exit 1
        fi
        shift 2

        tag=""
        category=""

        while [ $# -gt 0 ]; do
            case "$1" in
                --tag) tag="$2"; shift 2 ;;
                --category) category="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        search_prompts "$query" "$tag" "$category"
        ;;

    get)
        prompt_id="$2"
        output_file="$3"
        get_prompt "$prompt_id" "$output_file"
        ;;

    copy)
        prompt_id="$2"
        copy_prompt "$prompt_id"
        ;;

    info)
        prompt_id="$2"
        show_prompt_info "$prompt_id"
        ;;

    use)
        prompt_id="$2"
        shift 2
        use_prompt "$prompt_id" "$@"
        ;;

    popular)
        show_popular
        ;;

    recent)
        show_recent
        ;;

    stats)
        prompt_id="$2"
        show_stats "$prompt_id"
        ;;

    help|--help|-h)
        show_usage
        ;;

    *)
        log_error "Unknown command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac
