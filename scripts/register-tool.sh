#!/bin/bash

# ============================================================================
# TOOL REGISTRATION SYSTEM - Official Tool Ingestion Pipeline
# ============================================================================
# Purpose: Register new tools in Central-MCP Tools Registry
# Usage: ./register-tool.sh [OPTIONS]
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
TAXONOMY_PATH="$CENTRAL_MCP_ROOT/docs/TOOL_TAXONOMY_AND_CLASSIFICATION.md"

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
${GREEN}🛠️  TOOL REGISTRATION SYSTEM${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [MODE] [OPTIONS]

${YELLOW}MODES:${NC}
  ${GREEN}manual${NC}       Interactive registration (default)
  ${GREEN}auto${NC}         Auto-discover and register tools
  ${GREEN}validate${NC}     Validate existing tool registration
  ${GREEN}list${NC}         List all registered tools
  ${GREEN}remove${NC}       Remove a tool from registry

${YELLOW}MANUAL MODE OPTIONS:${NC}
  --id <id>              Tool ID (required, kebab-case)
  --name <name>          Tool name (required)
  --category <cat>       Category (required): central-mcp, universal, ecosystem
  --status <status>      Status (optional): active, beta, planned (default: active)
  --icon <emoji>         Icon emoji (optional, default: 🛠️)
  --description <desc>   Description (required)
  --location <path>      File path or URL (optional)
  --deployed-url <url>   Live URL (optional)
  --documentation <path> Path to docs (optional)
  --version <version>    Version (optional, default: v1.0.0)
  --author <author>      Creator name (optional)
  --capabilities <list>  Comma-separated capabilities (optional)

${YELLOW}AUTO-DISCOVERY OPTIONS:${NC}
  --scan-path <path>     Path to scan (default: PROJECTS_all/)
  --scan-type <type>     What to scan: mcp, python, npm, all (default: all)

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# Interactive mode${NC}
  $0

  ${CYAN}# Manual registration${NC}
  $0 manual \\
    --id my-tool \\
    --name "My Awesome Tool" \\
    --category ecosystem \\
    --description "Does amazing things" \\
    --location "/path/to/my-tool.py"

  ${CYAN}# Auto-discovery${NC}
  $0 auto --scan-path /Users/lech/PROJECTS_all

  ${CYAN}# List tools${NC}
  $0 list

  ${CYAN}# Validate tool${NC}
  $0 validate --id my-tool

${YELLOW}CATEGORIES:${NC}
  ${GREEN}central-mcp${NC}  - Tools specific to Central-MCP
  ${GREEN}universal${NC}    - Universal tools (work anywhere)
  ${GREEN}ecosystem${NC}    - Ecosystem-specific tools

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# Validate Tool ID
# ============================================================================

validate_tool_id() {
    local tool_id="$1"

    # Check if empty
    if [ -z "$tool_id" ]; then
        log_error "Tool ID cannot be empty"
        return 1
    fi

    # Check if kebab-case (lowercase with hyphens)
    if ! echo "$tool_id" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*$'; then
        log_error "Tool ID must be kebab-case (e.g., 'my-tool')"
        return 1
    fi

    # Check if already exists
    local exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tools_registry WHERE tool_id = '$tool_id';" 2>/dev/null || echo "0")
    if [ "$exists" != "0" ]; then
        log_error "Tool ID '$tool_id' already exists in registry"
        return 1
    fi

    return 0
}

# ============================================================================
# Validate Category
# ============================================================================

validate_category() {
    local category="$1"

    case "$category" in
        central-mcp|universal|ecosystem)
            return 0
            ;;
        *)
            log_error "Invalid category: $category"
            log_error "Must be one of: central-mcp, universal, ecosystem"
            return 1
            ;;
    esac
}

# ============================================================================
# Interactive Registration
# ============================================================================

interactive_registration() {
    log_info "Starting interactive tool registration..."
    echo ""

    # Tool ID
    while true; do
        read -p "$(echo -e ${CYAN}Tool ID ${NC}(kebab-case): )" tool_id
        if validate_tool_id "$tool_id"; then
            break
        fi
    done

    # Tool Name
    read -p "$(echo -e ${CYAN}Tool Name: ${NC})" tool_name
    if [ -z "$tool_name" ]; then
        log_error "Tool name is required"
        exit 1
    fi

    # Category
    echo ""
    log_info "Available categories:"
    echo "  1) central-mcp  - Central-MCP specific tools"
    echo "  2) universal    - Universal tools (work anywhere)"
    echo "  3) ecosystem    - Ecosystem-specific tools"
    read -p "$(echo -e ${CYAN}Select category ${NC}[1-3]: )" category_choice

    case "$category_choice" in
        1) category="central-mcp" ;;
        2) category="universal" ;;
        3) category="ecosystem" ;;
        *) log_error "Invalid choice"; exit 1 ;;
    esac

    # Description
    echo ""
    read -p "$(echo -e ${CYAN}Description ${NC}(what it does): )" description
    if [ -z "$description" ]; then
        log_error "Description is required"
        exit 1
    fi

    # Location
    read -p "$(echo -e ${CYAN}Location ${NC}(path/URL, optional): )" location

    # Deployed URL
    read -p "$(echo -e ${CYAN}Deployed URL ${NC}(optional): )" deployed_url

    # Documentation
    read -p "$(echo -e ${CYAN}Documentation path ${NC}(optional): )" documentation_path

    # Version
    read -p "$(echo -e ${CYAN}Version ${NC}[v1.0.0]: )" version
    version="${version:-v1.0.0}"

    # Icon
    read -p "$(echo -e ${CYAN}Icon emoji ${NC}[🛠️]: )" icon
    icon="${icon:-🛠️}"

    # Author
    read -p "$(echo -e ${CYAN}Author ${NC}(optional): )" author

    # Capabilities
    echo ""
    log_info "Enter capabilities (one per line, empty line to finish):"
    capabilities=()
    while true; do
        read -p "  - " cap
        if [ -z "$cap" ]; then
            break
        fi
        capabilities+=("$cap")
    done

    # Confirm
    echo ""
    log_info "=== Tool Registration Summary ==="
    echo "ID:          $tool_id"
    echo "Name:        $tool_name"
    echo "Category:    $category"
    echo "Description: $description"
    echo "Version:     $version"
    echo "Icon:        $icon"
    [ -n "$location" ] && echo "Location:    $location"
    [ -n "$deployed_url" ] && echo "Deployed URL: $deployed_url"
    [ -n "$documentation_path" ] && echo "Documentation: $documentation_path"
    [ -n "$author" ] && echo "Author:      $author"
    if [ ${#capabilities[@]} -gt 0 ]; then
        echo "Capabilities:"
        for cap in "${capabilities[@]}"; do
            echo "  - $cap"
        done
    fi
    echo ""

    read -p "$(echo -e ${YELLOW}Proceed with registration? ${NC}[y/N]: )" confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_warning "Registration cancelled"
        exit 0
    fi

    # Register
    register_tool "$tool_id" "$tool_name" "$category" "$description" "$location" \
                  "$deployed_url" "$documentation_path" "$version" "$icon" "$author" "${capabilities[@]}"
}

# ============================================================================
# Register Tool in Database
# ============================================================================

register_tool() {
    local tool_id="$1"
    local tool_name="$2"
    local category="$3"
    local description="$4"
    local location="${5:-}"
    local deployed_url="${6:-}"
    local documentation_path="${7:-}"
    local version="${8:-v1.0.0}"
    local icon="${9:-🛠️}"
    local author="${10:-}"
    shift 10
    local capabilities=("$@")

    log_step "Registering tool in database..."

    # Build SQL for main registration
    local sql="INSERT INTO tools_registry (
        tool_id, tool_name, category, status, icon, description,
        location, deployed_url, documentation_path, version, author,
        registered_by
    ) VALUES (
        '$tool_id',
        '$(echo "$tool_name" | sed "s/'/''/g")',
        '$category',
        'active',
        '$icon',
        '$(echo "$description" | sed "s/'/''/g")',
        '$(echo "$location" | sed "s/'/''/g")',
        '$(echo "$deployed_url" | sed "s/'/''/g")',
        '$(echo "$documentation_path" | sed "s/'/''/g")',
        '$version',
        '$(echo "$author" | sed "s/'/''/g")',
        'manual'
    );"

    # Execute registration
    if sqlite3 "$DB_PATH" "$sql" 2>/dev/null; then
        log_success "Tool registered successfully!"
    else
        log_error "Failed to register tool in database"
        return 1
    fi

    # Register capabilities
    if [ ${#capabilities[@]} -gt 0 ]; then
        log_step "Registering capabilities..."
        for cap in "${capabilities[@]}"; do
            local cap_sql="INSERT INTO tool_capabilities (tool_id, capability, capability_type) VALUES ('$tool_id', '$(echo "$cap" | sed "s/'/''/g")', 'core');"
            sqlite3 "$DB_PATH" "$cap_sql" 2>/dev/null
        done
        log_success "Registered ${#capabilities[@]} capabilities"
    fi

    # Log discovery
    local log_sql="INSERT INTO tool_discovery_log (discovery_type, tools_found, tools_added, discovered_by) VALUES ('manual-registration', 1, 1, 'cli');"
    sqlite3 "$DB_PATH" "$log_sql" 2>/dev/null

    echo ""
    log_success "✨ Tool '$tool_id' successfully registered!"
    echo ""
    log_info "View in dashboard: http://centralmcp.net/tools"
    log_info "Query database: sqlite3 $DB_PATH \"SELECT * FROM tools_registry WHERE tool_id='$tool_id';\""
}

# ============================================================================
# List Tools
# ============================================================================

list_tools() {
    log_info "Registered tools:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT tool_id, tool_name, category, status, version FROM active_tools_summary;" 2>/dev/null || {
        log_error "Failed to query database"
        return 1
    }
}

# ============================================================================
# Main
# ============================================================================

MODE="${1:-manual}"

case "$MODE" in
    manual)
        if [ $# -eq 1 ]; then
            # Interactive mode
            interactive_registration
        else
            # Parse arguments
            # TODO: Implement argument parsing
            log_error "Argument parsing not yet implemented. Use interactive mode."
            exit 1
        fi
        ;;

    list)
        list_tools
        ;;

    help|--help|-h)
        show_usage
        ;;

    *)
        log_error "Unknown mode: $MODE"
        echo ""
        show_usage
        exit 1
        ;;
esac
