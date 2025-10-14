#!/bin/bash

# ============================================================================
# SKP VIEWER - Open and View Specialized Knowledge Packs
# ============================================================================
# Purpose: View, extract, and browse SKP contents
# Usage: ./view-skp.sh [MODE] [SKP_ID]
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
SKP_STORAGE="$CENTRAL_MCP_ROOT/skp_storage"
TEMP_VIEW_DIR="/tmp/skp_view"

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
${GREEN}📦 SKP VIEWER - Open Specialized Knowledge Packs${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [MODE] [SKP_ID]

${YELLOW}MODES:${NC}
  ${GREEN}list${NC}              List all registered SKPs
  ${GREEN}info${NC} <SKP_ID>     Show detailed info about an SKP
  ${GREEN}contents${NC} <SKP_ID> List files inside an SKP
  ${GREEN}extract${NC} <SKP_ID>  Extract SKP to temp directory
  ${GREEN}view${NC} <SKP_ID>     View SKP contents in less/browser
  ${GREEN}open${NC} <SKP_ID>     Open SKP in file browser
  ${GREEN}cat${NC} <SKP_ID> <FILE> View specific file from SKP
  ${GREEN}search${NC} <SKP_ID> <QUERY> Search within SKP files

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# List all SKPs${NC}
  $0 list

  ${CYAN}# Show SKP info${NC}
  $0 info ULTRATHINK_REALTIME_VOICE_MASTERY

  ${CYAN}# List files in SKP${NC}
  $0 contents ULTRATHINK_REALTIME_VOICE_MASTERY

  ${CYAN}# Extract SKP to temp directory${NC}
  $0 extract ULTRATHINK_REALTIME_VOICE_MASTERY

  ${CYAN}# View specific file${NC}
  $0 cat ULTRATHINK_REALTIME_VOICE_MASTERY OPENAI_REALTIME_API.md

  ${CYAN}# Search within SKP${NC}
  $0 search ULTRATHINK_REALTIME_VOICE_MASTERY "WebRTC"

  ${CYAN}# Open in Finder (macOS)${NC}
  $0 open ULTRATHINK_REALTIME_VOICE_MASTERY

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List All SKPs
# ============================================================================

list_skps() {
    log_info "Registered Specialized Knowledge Packs:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            skp_id,
            display_name,
            category,
            current_version,
            file_count,
            ROUND(CAST(total_words AS FLOAT) / 1000, 1) || 'k' as words,
            created_at
        FROM skp_registry
        ORDER BY created_at DESC;
    "
}

# ============================================================================
# Show SKP Info
# ============================================================================

show_skp_info() {
    local skp_id="$1"

    if [ -z "$skp_id" ]; then
        log_error "SKP ID required"
        return 1
    fi

    log_info "SKP Information: $skp_id"
    echo ""

    # Get SKP details
    local info=$(sqlite3 "$DB_PATH" "SELECT display_name, category, current_version, file_path, file_count, total_words FROM skp_registry WHERE skp_id = '$skp_id';")

    if [ -z "$info" ]; then
        log_error "SKP not found: $skp_id"
        return 1
    fi

    local display_name=$(echo "$info" | cut -d'|' -f1)
    local category=$(echo "$info" | cut -d'|' -f2)
    local version=$(echo "$info" | cut -d'|' -f3)
    local file_path=$(echo "$info" | cut -d'|' -f4)
    local file_count=$(echo "$info" | cut -d'|' -f5)
    local words=$(echo "$info" | cut -d'|' -f6)

    echo "Display Name: $display_name"
    echo "Category:     $category"
    echo "Version:      $version"
    echo "File Path:    $file_path"
    echo "File Count:   $file_count files"
    echo "Total Words:  $words words"
    echo ""

    # Show version history
    log_info "Version History:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT version, changelog, created_at
        FROM skp_versions
        WHERE skp_id = '$skp_id'
        ORDER BY created_at DESC;
    "
}

# ============================================================================
# List SKP Contents
# ============================================================================

list_contents() {
    local skp_id="$1"

    if [ -z "$skp_id" ]; then
        log_error "SKP ID required"
        return 1
    fi

    # Get file path
    local file_path=$(sqlite3 "$DB_PATH" "SELECT file_path FROM skp_registry WHERE skp_id = '$skp_id';")

    if [ -z "$file_path" ]; then
        log_error "SKP not found: $skp_id"
        return 1
    fi

    log_info "Contents of $skp_id:"
    echo ""

    # List zip contents
    if [ -f "$file_path" ]; then
        unzip -l "$file_path" | awk 'NR>3 {if (NR>3 && last) print last; last=$0}'
    else
        log_error "SKP file not found: $file_path"
        return 1
    fi
}

# ============================================================================
# Extract SKP
# ============================================================================

extract_skp() {
    local skp_id="$1"

    if [ -z "$skp_id" ]; then
        log_error "SKP ID required"
        return 1
    fi

    # Get file path
    local file_path=$(sqlite3 "$DB_PATH" "SELECT file_path FROM skp_registry WHERE skp_id = '$skp_id';")

    if [ -z "$file_path" ]; then
        log_error "SKP not found: $skp_id"
        return 1
    fi

    # Create temp directory
    local extract_dir="$TEMP_VIEW_DIR/$skp_id"
    mkdir -p "$extract_dir"

    log_step "Extracting SKP to: $extract_dir"

    # Extract
    if [ -f "$file_path" ]; then
        unzip -q -o "$file_path" -d "$extract_dir"
        log_success "Extracted to: $extract_dir"
        echo ""
        log_info "Files extracted:"
        ls -lh "$extract_dir"
    else
        log_error "SKP file not found: $file_path"
        return 1
    fi
}

# ============================================================================
# View SKP (Extract and Open)
# ============================================================================

view_skp() {
    local skp_id="$1"

    if [ -z "$skp_id" ]; then
        log_error "SKP ID required"
        return 1
    fi

    # Extract first
    extract_skp "$skp_id"

    local extract_dir="$TEMP_VIEW_DIR/$skp_id"

    # Show menu
    echo ""
    log_info "SKP extracted. What would you like to do?"
    echo "1) List files"
    echo "2) View all .md files (concatenated)"
    echo "3) Open in file browser"
    echo "4) Search within files"
    read -p "Choose [1-4]: " choice

    case "$choice" in
        1)
            ls -lh "$extract_dir"
            ;;
        2)
            log_step "Viewing all markdown files..."
            find "$extract_dir" -name "*.md" -exec cat {} \; | less
            ;;
        3)
            log_step "Opening in file browser..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open "$extract_dir"
            else
                xdg-open "$extract_dir" 2>/dev/null || nautilus "$extract_dir" 2>/dev/null || echo "Please manually open: $extract_dir"
            fi
            ;;
        4)
            read -p "Search query: " query
            log_step "Searching for: $query"
            grep -r "$query" "$extract_dir" || log_warning "No matches found"
            ;;
        *)
            log_error "Invalid choice"
            ;;
    esac
}

# ============================================================================
# Open SKP in File Browser
# ============================================================================

open_skp() {
    local skp_id="$1"

    if [ -z "$skp_id" ]; then
        log_error "SKP ID required"
        return 1
    fi

    # Extract first
    extract_skp "$skp_id"

    local extract_dir="$TEMP_VIEW_DIR/$skp_id"

    log_step "Opening in file browser..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$extract_dir"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$extract_dir" 2>/dev/null || nautilus "$extract_dir" 2>/dev/null || log_warning "Please manually open: $extract_dir"
    else
        log_warning "Please manually open: $extract_dir"
    fi
}

# ============================================================================
# View Specific File from SKP
# ============================================================================

cat_file() {
    local skp_id="$1"
    local filename="$2"

    if [ -z "$skp_id" ] || [ -z "$filename" ]; then
        log_error "SKP ID and filename required"
        return 1
    fi

    # Get file path
    local file_path=$(sqlite3 "$DB_PATH" "SELECT file_path FROM skp_registry WHERE skp_id = '$skp_id';")

    if [ -z "$file_path" ]; then
        log_error "SKP not found: $skp_id"
        return 1
    fi

    # Extract specific file to stdout
    if [ -f "$file_path" ]; then
        unzip -p "$file_path" "$filename" 2>/dev/null || log_error "File not found in SKP: $filename"
    else
        log_error "SKP file not found: $file_path"
        return 1
    fi
}

# ============================================================================
# Search Within SKP
# ============================================================================

search_skp() {
    local skp_id="$1"
    local query="$2"

    if [ -z "$skp_id" ] || [ -z "$query" ]; then
        log_error "SKP ID and search query required"
        return 1
    fi

    # Extract first
    extract_skp "$skp_id"

    local extract_dir="$TEMP_VIEW_DIR/$skp_id"

    log_step "Searching for: $query"
    echo ""

    # Search with context
    grep -rn --color=always "$query" "$extract_dir" || log_warning "No matches found"
}

# ============================================================================
# Main
# ============================================================================

MODE="${1:-list}"

case "$MODE" in
    list)
        list_skps
        ;;

    info)
        show_skp_info "$2"
        ;;

    contents)
        list_contents "$2"
        ;;

    extract)
        extract_skp "$2"
        ;;

    view)
        view_skp "$2"
        ;;

    open)
        open_skp "$2"
        ;;

    cat)
        cat_file "$2" "$3"
        ;;

    search)
        search_skp "$2" "$3"
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
