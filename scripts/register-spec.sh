#!/bin/bash

# ============================================================================
# SPEC REGISTRATION SYSTEM - Official Specifications Ingestion Pipeline
# ============================================================================
# Purpose: Register specifications in Central-MCP Specs Registry
# Usage: ./register-spec.sh [OPTIONS] OR ./register-spec.sh /path/to/spec.md
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
SPECBASE_PATH="$CENTRAL_MCP_ROOT/02_SPECBASES"

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
${GREEN}📋 SPEC REGISTRATION SYSTEM${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [MODE] [OPTIONS]

${YELLOW}MODES:${NC}
  ${GREEN}auto${NC}         Scan and register specs from 02_SPECBASES/ folder
  ${GREEN}file${NC}         Register a single spec file
  ${GREEN}list${NC}         List all registered specs
  ${GREEN}query${NC}        Query specs by criteria
  ${GREEN}update${NC}       Update existing spec registration

${YELLOW}AUTO MODE:${NC}
  $0 auto
  # Scans 02_SPECBASES/ and registers all specs

${YELLOW}FILE MODE:${NC}
  $0 file /path/to/SPEC_MODULES_Feature.md
  # Registers a single spec file

${YELLOW}LIST MODE:${NC}
  $0 list                    # All specs
  $0 list --category MODULES # By category
  $0 list --status ACTIVE    # By status
  $0 list --agent Agent-B    # By agent

${YELLOW}QUERY MODE:${NC}
  $0 query --blocked         # Show blocked specs
  $0 query --completion      # Show completion progress
  $0 query --dependencies CMCP-MODULES-001

${YELLOW}UPDATE MODE:${NC}
  $0 update CMCP-MODULES-001 --status ACTIVE
  $0 update CMCP-MODULES-001 --assign Agent-C
  $0 update CMCP-MODULES-001 --complete-req REQ-001

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# Register all specs from specbase${NC}
  $0 auto

  ${CYAN}# Register a specific file${NC}
  $0 file 02_SPECBASES/0010_AUTO_PROACTIVE_INTELLIGENCE_ARCHITECTURE.md

  ${CYAN}# List active specs by priority${NC}
  $0 list --status ACTIVE --sort priority

  ${CYAN}# Show blocked specs${NC}
  $0 query --blocked

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# Parse YAML Frontmatter
# ============================================================================

parse_frontmatter() {
    local file_path="$1"

    # Extract YAML frontmatter (between --- and ---)
    local yaml_content=$(awk '/^---$/{f=1;next}/^---$/{f=0}f' "$file_path")

    # Parse key fields
    spec_id=$(echo "$yaml_content" | grep "^spec_id:" | sed 's/spec_id: *//' | tr -d '"' | tr -d "'")
    title=$(echo "$yaml_content" | grep "^title:" | sed 's/title: *//' | tr -d '"' | tr -d "'" | sed "s/'/''/g")
    version=$(echo "$yaml_content" | grep "^version:" | sed 's/version: *//' | tr -d '"' | tr -d "'")
    created=$(echo "$yaml_content" | grep "^created:" | sed 's/created: *//' | tr -d '"' | tr -d "'")
    updated=$(echo "$yaml_content" | grep "^updated:" | sed 's/updated: *//' | tr -d '"' | tr -d "'")
    status=$(echo "$yaml_content" | grep "^status:" | sed 's/status: *//' | tr -d '"' | tr -d "'")
    type=$(echo "$yaml_content" | grep "^type:" | sed 's/type: *//' | tr -d '"' | tr -d "'")
    layer=$(echo "$yaml_content" | grep "^layer:" | sed 's/layer: *//' | tr -d '"' | tr -d "'")
    category=$(echo "$yaml_content" | grep "^category:" | sed 's/category: *//' | tr -d '"' | tr -d "'")
    priority=$(echo "$yaml_content" | grep "^priority:" | sed 's/priority: *//' | tr -d '"' | tr -d "'")
    estimated_hours=$(echo "$yaml_content" | grep "^estimated_hours:" | sed 's/estimated_hours: *//' | tr -d '"' | tr -d "'")
    assigned_agent=$(echo "$yaml_content" | grep "^assigned_agent:" | sed 's/assigned_agent: *//' | tr -d '"' | tr -d "'")

    # Extract spec number from filename (e.g., 0010 from 0010_DAY01_...)
    spec_number=$(basename "$file_path" | grep -oE '^[0-9]{4}')

    # Default values if missing
    status="${status:-DRAFT}"
    priority="${priority:-P2}"
    assigned_agent="${assigned_agent:-UNASSIGNED}"
    version="${version:-1.0}"

    # Calculate file stats
    file_size=$(wc -c < "$file_path")
    word_count=$(wc -w < "$file_path" | tr -d ' ')
}

# ============================================================================
# Register Spec in Database
# ============================================================================

register_spec() {
    local file_path="$1"

    log_step "Parsing spec file: $(basename "$file_path")"

    # Parse frontmatter
    parse_frontmatter "$file_path"

    # Validate required fields
    if [ -z "$spec_id" ]; then
        log_error "Missing spec_id in frontmatter"
        return 1
    fi

    if [ -z "$title" ]; then
        log_error "Missing title in frontmatter"
        return 1
    fi

    # Check if already exists
    local exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM specs_registry WHERE spec_id = '$spec_id';" 2>/dev/null || echo "0")
    if [ "$exists" != "0" ]; then
        log_warning "Spec $spec_id already registered (use 'update' to modify)"
        return 0
    fi

    log_step "Registering spec: $spec_id - $title"

    # Build SQL
    local sql="INSERT INTO specs_registry (
        spec_id, spec_number, title, category, type, layer, status, priority,
        version, created_date, updated_date, assigned_agent,
        estimated_hours, file_path, file_size, word_count,
        registered_by
    ) VALUES (
        '$spec_id',
        '${spec_number:-}',
        '$title',
        '${category:-}',
        '${type:-}',
        '${layer:-}',
        '$status',
        '$priority',
        '$version',
        '${created:-}',
        '${updated:-}',
        '$assigned_agent',
        ${estimated_hours:-0},
        '$file_path',
        $file_size,
        $word_count,
        'cli'
    );"

    # Execute registration
    if sqlite3 "$DB_PATH" "$sql" 2>/dev/null; then
        log_success "Registered: $spec_id"

        # Log usage
        local log_sql="INSERT INTO spec_usage (spec_id, usage_type, accessed_by) VALUES ('$spec_id', 'registered', 'cli');"
        sqlite3 "$DB_PATH" "$log_sql" 2>/dev/null

        return 0
    else
        log_error "Failed to register spec"
        return 1
    fi
}

# ============================================================================
# Auto-Scan and Register All Specs
# ============================================================================

auto_scan_specs() {
    log_info "Scanning $SPECBASE_PATH for specs..."
    echo ""

    local total=0
    local registered=0
    local skipped=0
    local errors=0

    # Find all .md files in SPECBASE
    while IFS= read -r file; do
        total=$((total + 1))

        if register_spec "$file"; then
            if [ $? -eq 0 ]; then
                registered=$((registered + 1))
            else
                skipped=$((skipped + 1))
            fi
        else
            errors=$((errors + 1))
        fi
    done < <(find "$SPECBASE_PATH" -maxdepth 1 -name "*.md" -type f | sort)

    echo ""
    log_info "=== Auto-Scan Complete ==="
    echo "Total files: $total"
    echo "Registered: $registered"
    echo "Skipped: $skipped"
    echo "Errors: $errors"
}

# ============================================================================
# List Specs
# ============================================================================

list_specs() {
    local filter_category="$1"
    local filter_status="$2"
    local filter_agent="$3"

    log_info "Registered specifications:"
    echo ""

    local sql="SELECT spec_id, spec_number, title, category, status, priority, assigned_agent FROM specs_registry WHERE 1=1"

    if [ -n "$filter_category" ]; then
        sql="$sql AND category = '$filter_category'"
    fi

    if [ -n "$filter_status" ]; then
        sql="$sql AND status = '$filter_status'"
    fi

    if [ -n "$filter_agent" ]; then
        sql="$sql AND assigned_agent = '$filter_agent'"
    fi

    sql="$sql ORDER BY
        CASE priority
            WHEN 'P0' THEN 1
            WHEN 'P1' THEN 2
            WHEN 'P2' THEN 3
            WHEN 'P3' THEN 4
            ELSE 5
        END,
        spec_number;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Query Blocked Specs
# ============================================================================

query_blocked() {
    log_info "Specs with unresolved blocking dependencies:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM blocked_specs;"
}

# ============================================================================
# Query Completion Progress
# ============================================================================

query_completion() {
    log_info "Spec completion progress:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT spec_id, title, category, overall_progress, requirements_progress, acceptance_progress FROM spec_completion_progress ORDER BY overall_progress DESC;"
}

# ============================================================================
# Main
# ============================================================================

MODE="${1:-help}"

case "$MODE" in
    auto)
        auto_scan_specs
        ;;

    file)
        if [ -z "$2" ]; then
            log_error "File path required"
            show_usage
            exit 1
        fi
        register_spec "$2"
        ;;

    list)
        shift
        filter_category=""
        filter_status=""
        filter_agent=""

        while [ $# -gt 0 ]; do
            case "$1" in
                --category) filter_category="$2"; shift 2 ;;
                --status) filter_status="$2"; shift 2 ;;
                --agent) filter_agent="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        list_specs "$filter_category" "$filter_status" "$filter_agent"
        ;;

    query)
        case "$2" in
            --blocked) query_blocked ;;
            --completion) query_completion ;;
            *) log_error "Unknown query type: $2"; show_usage; exit 1 ;;
        esac
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
