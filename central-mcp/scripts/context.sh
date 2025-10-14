#!/bin/bash

# ============================================================================
# CONTEXT FILES MANAGER - Centralized Context Injection System
# ============================================================================
# Purpose: Manage context files for automatic agent injection
# Usage: ./context.sh [COMMAND] [OPTIONS]
# Vision: UPDATE ONCE → ALL AGENTS GET IT AUTOMATICALLY
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
${GREEN}🎯 CONTEXT FILES MANAGER${NC}
${YELLOW}UPDATE ONCE → ALL AGENTS GET IT AUTOMATICALLY${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS:${NC}
  ${GREEN}list${NC}                 List all contexts
  ${GREEN}search${NC} <query>       Search contexts by name, tag, or type
  ${GREEN}get${NC} <id>             Get context text by ID
  ${GREEN}info${NC} <id>            Show detailed context information
  ${GREEN}active${NC}               Show active contexts ready for injection
  ${GREEN}universal${NC}            Show universal contexts (all agents get)
  ${GREEN}role${NC} <role>          Show contexts for specific role
  ${GREEN}project${NC} <project>    Show contexts for specific project
  ${GREEN}stats${NC} <id>           Show injection statistics
  ${GREEN}update${NC} <id>          Update context (triggers re-injection)
  ${GREEN}copy${NC} <id>            Copy context to clipboard

${YELLOW}LIST OPTIONS:${NC}
  --type <type>      Filter by type (system_message, agent_rules, project_rules, domain_knowledge)
  --scope <scope>    Filter by scope (universal, role_specific, project_specific, agent_specific)
  --active           Show only active contexts

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# List all contexts${NC}
  $0 list

  ${CYAN}# Show universal contexts (ALL agents get these)${NC}
  $0 universal

  ${CYAN}# Show contexts for Agent A${NC}
  $0 role Agent-A

  ${CYAN}# Show contexts for central-mcp project${NC}
  $0 project central-mcp

  ${CYAN}# Get specific context${NC}
  $0 get universal-system-message-v1

  ${CYAN}# Show context details${NC}
  $0 info agent-a-ui-specialist-rules

  ${CYAN}# Show injection statistics${NC}
  $0 stats universal-system-message-v1

  ${CYAN}# See what contexts are currently active${NC}
  $0 active

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List Contexts
# ============================================================================

list_contexts() {
    local context_type="$1"
    local scope="$2"
    local active_only="$3"

    log_info "Available contexts:"
    echo ""

    local sql="SELECT context_id, context_name, context_type, scope, priority, injection_count FROM context_files_registry WHERE 1=1"

    if [ -n "$context_type" ]; then
        sql="$sql AND context_type = '$context_type'"
    fi

    if [ -n "$scope" ]; then
        sql="$sql AND scope = '$scope'"
    fi

    if [ "$active_only" = "true" ]; then
        sql="$sql AND is_active = TRUE"
    fi

    sql="$sql ORDER BY priority DESC, injection_count DESC;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Search Contexts
# ============================================================================

search_contexts() {
    local query="$1"

    log_info "Searching for: $query"
    echo ""

    local sql="SELECT context_id, context_name, context_type, scope, description FROM context_files_registry WHERE (context_name LIKE '%$query%' OR description LIKE '%$query%' OR tags LIKE '%$query%') ORDER BY priority DESC, injection_count DESC;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Get Context Text
# ============================================================================

get_context() {
    local context_id="$1"

    if [ -z "$context_id" ]; then
        log_error "Context ID required"
        return 1
    fi

    local context_text=$(sqlite3 "$DB_PATH" "SELECT context_text FROM context_files_registry WHERE context_id = '$context_id';")

    if [ -z "$context_text" ]; then
        log_error "Context not found: $context_id"
        return 1
    fi

    echo "$context_text"
}

# ============================================================================
# Copy Context to Clipboard
# ============================================================================

copy_context() {
    local context_id="$1"

    if [ -z "$context_id" ]; then
        log_error "Context ID required"
        return 1
    fi

    local context_text=$(sqlite3 "$DB_PATH" "SELECT context_text FROM context_files_registry WHERE context_id = '$context_id';")

    if [ -z "$context_text" ]; then
        log_error "Context not found: $context_id"
        return 1
    fi

    # Copy to clipboard (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "$context_text" | pbcopy
        log_success "Copied to clipboard!"
    elif command -v xclip &> /dev/null; then
        echo "$context_text" | xclip -selection clipboard
        log_success "Copied to clipboard!"
    else
        log_warning "Clipboard not available. Use: $0 get $context_id > file.txt"
    fi
}

# ============================================================================
# Show Context Info
# ============================================================================

show_context_info() {
    local context_id="$1"

    if [ -z "$context_id" ]; then
        log_error "Context ID required"
        return 1
    fi

    log_info "Context Information: $context_id"
    echo ""

    # Get context details
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            context_name,
            context_type,
            scope,
            description,
            purpose,
            priority,
            auto_inject_on_connect,
            injection_frequency,
            target_roles,
            target_projects,
            is_active,
            is_production_ready,
            quality_score,
            effectiveness_rating,
            injection_count,
            agent_count,
            version,
            created_at
        FROM context_files_registry
        WHERE context_id = '$context_id';
    "

    echo ""
    log_info "Preview (first 500 chars):"
    echo ""
    sqlite3 "$DB_PATH" "SELECT substr(context_text, 1, 500) || '...' FROM context_files_registry WHERE context_id = '$context_id';"
}

# ============================================================================
# Show Active Contexts
# ============================================================================

show_active() {
    log_info "Active contexts ready for injection:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM active_contexts;"
}

# ============================================================================
# Show Universal Contexts
# ============================================================================

show_universal() {
    log_info "Universal contexts (ALL agents get these):"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM universal_contexts;"
}

# ============================================================================
# Show Role-Specific Contexts
# ============================================================================

show_role_contexts() {
    local role="$1"

    if [ -z "$role" ]; then
        log_error "Role required (e.g., Agent-A, ui, backend)"
        return 1
    fi

    log_info "Contexts for role: $role"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT context_id, context_name, context_type, priority, injection_count
        FROM context_files_registry
        WHERE is_active = TRUE
        AND (scope = 'universal' OR target_roles LIKE '%$role%')
        ORDER BY priority DESC;
    "
}

# ============================================================================
# Show Project-Specific Contexts
# ============================================================================

show_project_contexts() {
    local project="$1"

    if [ -z "$project" ]; then
        log_error "Project required (e.g., central-mcp, PROJECT_minerals)"
        return 1
    fi

    log_info "Contexts for project: $project"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT context_id, context_name, context_type, priority, injection_count
        FROM context_files_registry
        WHERE is_active = TRUE
        AND (scope = 'universal' OR target_projects LIKE '%$project%')
        ORDER BY priority DESC;
    "
}

# ============================================================================
# Show Context Statistics
# ============================================================================

show_stats() {
    local context_id="$1"

    if [ -z "$context_id" ]; then
        log_error "Context ID required"
        return 1
    fi

    log_info "Injection Statistics: $context_id"
    echo ""

    # Overall stats
    sqlite3 -header -column "$DB_PATH" "
        SELECT * FROM context_injection_stats
        WHERE context_id = '$context_id';
    "

    echo ""
    log_info "Effectiveness Summary:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT * FROM context_effectiveness_summary
        WHERE context_id = '$context_id';
    "

    echo ""
    log_info "Recent Injections (last 10):"
    sqlite3 -header -column "$DB_PATH" "
        SELECT agent_id, project_id, injection_trigger, was_successful, injected_at
        FROM context_injections
        WHERE context_id = '$context_id'
        ORDER BY injected_at DESC
        LIMIT 10;
    "
}

# ============================================================================
# Update Context (triggers version bump and re-injection)
# ============================================================================

update_context() {
    local context_id="$1"

    if [ -z "$context_id" ]; then
        log_error "Context ID required"
        return 1
    fi

    log_warning "Context update will:"
    echo "  1. Create a new version"
    echo "  2. Update the registry"
    echo "  3. Trigger re-injection to active agents (if auto_inject_on_connect = TRUE)"
    echo ""
    log_info "This is a manual process - use database UPDATE statements"
    log_info "Example:"
    echo ""
    echo "sqlite3 $DB_PATH << EOF"
    echo "-- Backup current version"
    echo "INSERT INTO context_versions (context_id, version, context_text, changelog)"
    echo "SELECT context_id, version, context_text, 'Backup before update'"
    echo "FROM context_files_registry WHERE context_id = '$context_id';"
    echo ""
    echo "-- Update context"
    echo "UPDATE context_files_registry"
    echo "SET context_text = 'NEW CONTENT HERE',"
    echo "    version = 'v1.1.0',"
    echo "    changelog = 'What changed'"
    echo "WHERE context_id = '$context_id';"
    echo "EOF"
    echo ""
    log_success "Agents will receive updated context on next connection!"
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    list)
        shift
        context_type=""
        scope=""
        active_only="false"

        while [ $# -gt 0 ]; do
            case "$1" in
                --type) context_type="$2"; shift 2 ;;
                --scope) scope="$2"; shift 2 ;;
                --active) active_only="true"; shift ;;
                *) shift ;;
            esac
        done

        list_contexts "$context_type" "$scope" "$active_only"
        ;;

    search)
        query="$2"
        if [ -z "$query" ]; then
            log_error "Search query required"
            exit 1
        fi
        search_contexts "$query"
        ;;

    get)
        context_id="$2"
        get_context "$context_id"
        ;;

    copy)
        context_id="$2"
        copy_context "$context_id"
        ;;

    info)
        context_id="$2"
        show_context_info "$context_id"
        ;;

    active)
        show_active
        ;;

    universal)
        show_universal
        ;;

    role)
        role="$2"
        show_role_contexts "$role"
        ;;

    project)
        project="$2"
        show_project_contexts "$project"
        ;;

    stats)
        context_id="$2"
        show_stats "$context_id"
        ;;

    update)
        context_id="$2"
        update_context "$context_id"
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
