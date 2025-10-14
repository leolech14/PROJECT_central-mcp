#!/bin/bash

# ============================================================================
# CODE SNIPPETS MANAGER - Store and Access Reusable Code
# ============================================================================
# Purpose: Manage code snippets library for Central-MCP
# Usage: ./snippet.sh [COMMAND] [OPTIONS]
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
${GREEN}📝 CODE SNIPPETS MANAGER${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS:${NC}
  ${GREEN}list${NC}              List all snippets
  ${GREEN}search${NC} <query>    Search snippets by name, tag, or language
  ${GREEN}get${NC} <id>          Get snippet code by ID
  ${GREEN}add${NC}               Add new snippet (interactive)
  ${GREEN}copy${NC} <id>         Copy snippet to clipboard
  ${GREEN}info${NC} <id>         Show detailed snippet information
  ${GREEN}popular${NC}           Show most popular snippets
  ${GREEN}recent${NC}            Show recently added snippets

${YELLOW}LIST OPTIONS:${NC}
  --category <cat>   Filter by category (hook, api, utility, config, query)
  --language <lang>  Filter by language (typescript, javascript, python, sql, bash)
  --framework <fw>   Filter by framework (react, nextjs, express, fastapi)
  --production       Show only production-ready snippets

${YELLOW}SEARCH OPTIONS:${NC}
  --tag <tag>        Search by specific tag
  --language <lang>  Limit to specific language

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# List all snippets${NC}
  $0 list

  ${CYAN}# List React hooks${NC}
  $0 list --category hook --framework react

  ${CYAN}# Search for error handling${NC}
  $0 search "error"

  ${CYAN}# Get specific snippet${NC}
  $0 get react-use-localstorage

  ${CYAN}# Copy snippet to clipboard${NC}
  $0 copy nodejs-error-handler

  ${CYAN}# Show snippet details${NC}
  $0 info python-fastapi-cors

  ${CYAN}# Show popular snippets${NC}
  $0 popular

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List Snippets
# ============================================================================

list_snippets() {
    local category="$1"
    local language="$2"
    local framework="$3"
    local production_only="$4"

    log_info "Available snippets:"
    echo ""

    local sql="SELECT snippet_id, snippet_name, category, language, framework, usage_count FROM snippets_registry WHERE 1=1"

    if [ -n "$category" ]; then
        sql="$sql AND category = '$category'"
    fi

    if [ -n "$language" ]; then
        sql="$sql AND language = '$language'"
    fi

    if [ -n "$framework" ]; then
        sql="$sql AND framework = '$framework'"
    fi

    if [ "$production_only" = "true" ]; then
        sql="$sql AND is_production_ready = TRUE"
    fi

    sql="$sql ORDER BY usage_count DESC, snippet_name;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Search Snippets
# ============================================================================

search_snippets() {
    local query="$1"
    local tag="$2"
    local language="$3"

    log_info "Searching for: $query"
    echo ""

    local sql="SELECT snippet_id, snippet_name, category, language, description FROM snippets_registry WHERE (snippet_name LIKE '%$query%' OR description LIKE '%$query%' OR tags LIKE '%$query%')"

    if [ -n "$tag" ]; then
        sql="$sql AND tags LIKE '%$tag%'"
    fi

    if [ -n "$language" ]; then
        sql="$sql AND language = '$language'"
    fi

    sql="$sql ORDER BY usage_count DESC;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Get Snippet Code
# ============================================================================

get_snippet() {
    local snippet_id="$1"
    local output_file="$2"

    if [ -z "$snippet_id" ]; then
        log_error "Snippet ID required"
        return 1
    fi

    local code=$(sqlite3 "$DB_PATH" "SELECT code FROM snippets_registry WHERE snippet_id = '$snippet_id';")

    if [ -z "$code" ]; then
        log_error "Snippet not found: $snippet_id"
        return 1
    fi

    echo "$code"

    # Log usage
    sqlite3 "$DB_PATH" "INSERT INTO snippet_usage (snippet_id, usage_type, used_by) VALUES ('$snippet_id', 'viewed', 'cli');"

    if [ -n "$output_file" ]; then
        echo "$code" > "$output_file"
        log_success "Saved to: $output_file"
    fi
}

# ============================================================================
# Copy Snippet to Clipboard
# ============================================================================

copy_snippet() {
    local snippet_id="$1"

    if [ -z "$snippet_id" ]; then
        log_error "Snippet ID required"
        return 1
    fi

    local code=$(sqlite3 "$DB_PATH" "SELECT code FROM snippets_registry WHERE snippet_id = '$snippet_id';")

    if [ -z "$code" ]; then
        log_error "Snippet not found: $snippet_id"
        return 1
    fi

    # Copy to clipboard (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "$code" | pbcopy
        log_success "Copied to clipboard!"
    elif command -v xclip &> /dev/null; then
        echo "$code" | xclip -selection clipboard
        log_success "Copied to clipboard!"
    else
        log_warning "Clipboard not available. Use: $0 get $snippet_id > file.ext"
    fi

    # Log usage
    sqlite3 "$DB_PATH" "INSERT INTO snippet_usage (snippet_id, usage_type, used_by) VALUES ('$snippet_id', 'copied', 'cli');"
}

# ============================================================================
# Show Snippet Info
# ============================================================================

show_snippet_info() {
    local snippet_id="$1"

    if [ -z "$snippet_id" ]; then
        log_error "Snippet ID required"
        return 1
    fi

    log_info "Snippet Information: $snippet_id"
    echo ""

    # Get snippet details
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            snippet_name,
            category,
            language,
            framework,
            description,
            use_case,
            complexity,
            is_production_ready,
            quality_score,
            usage_count,
            copy_count,
            created_at
        FROM snippets_registry
        WHERE snippet_id = '$snippet_id';
    "

    echo ""
    log_info "Code Preview:"
    echo ""
    sqlite3 "$DB_PATH" "SELECT code FROM snippets_registry WHERE snippet_id = '$snippet_id';" | head -20
    echo "..."

    # Log usage
    sqlite3 "$DB_PATH" "INSERT INTO snippet_usage (snippet_id, usage_type, used_by) VALUES ('$snippet_id', 'info_viewed', 'cli');"
}

# ============================================================================
# Popular Snippets
# ============================================================================

show_popular() {
    log_info "Most Popular Snippets:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM popular_snippets LIMIT 10;"
}

# ============================================================================
# Recent Snippets
# ============================================================================

show_recent() {
    log_info "Recently Added Snippets:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM recent_snippets;"
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    list)
        shift
        category=""
        language=""
        framework=""
        production_only="false"

        while [ $# -gt 0 ]; do
            case "$1" in
                --category) category="$2"; shift 2 ;;
                --language) language="$2"; shift 2 ;;
                --framework) framework="$2"; shift 2 ;;
                --production) production_only="true"; shift ;;
                *) shift ;;
            esac
        done

        list_snippets "$category" "$language" "$framework" "$production_only"
        ;;

    search)
        query="$2"
        if [ -z "$query" ]; then
            log_error "Search query required"
            exit 1
        fi
        shift 2

        tag=""
        language=""

        while [ $# -gt 0 ]; do
            case "$1" in
                --tag) tag="$2"; shift 2 ;;
                --language) language="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        search_snippets "$query" "$tag" "$language"
        ;;

    get)
        snippet_id="$2"
        output_file="$3"
        get_snippet "$snippet_id" "$output_file"
        ;;

    copy)
        snippet_id="$2"
        copy_snippet "$snippet_id"
        ;;

    info)
        snippet_id="$2"
        show_snippet_info "$snippet_id"
        ;;

    popular)
        show_popular
        ;;

    recent)
        show_recent
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
