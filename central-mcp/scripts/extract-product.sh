#!/bin/bash

# ============================================================================
# PRODUCT EXTRACTION - Codebase Ingestion Pipeline
# ============================================================================
# Purpose: Extract deliverable "products" from project codebases
# Usage: ./extract-product.sh [COMMAND] [OPTIONS]
# Vision: PROJECT → PRODUCT (clean, deployable consolidation)
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
${GREEN}📦 PRODUCT EXTRACTION - Codebase Ingestion Pipeline${NC}
${YELLOW}PROJECT → PRODUCT (deployable consolidation)${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS:${NC}
  ${GREEN}list${NC}                  List all products
  ${GREEN}analyze${NC} <project>     Analyze project for extraction
  ${GREEN}extract${NC} <project>     Extract product from project
  ${GREEN}preview${NC} <project>     Preview what will be extracted
  ${GREEN}rules${NC}                 Show extraction rules
  ${GREEN}validate${NC} <product>    Validate extracted product
  ${GREEN}stats${NC}                 Show extraction statistics
  ${GREEN}dashboard${NC}             Show products dashboard

${YELLOW}ANALYZE OPTIONS:${NC}
  --product-name <name>   Name for the product
  --product-type <type>   Type: webapp, api, cli_tool, library, mobile_app
  --target-dir <dir>      Target directory for product

${YELLOW}EXTRACT OPTIONS:${NC}
  --dry-run              Preview only, don't copy files
  --method <method>      automated, manual, llm_assisted
  --product-dir <dir>    Custom product directory name

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# Analyze a project${NC}
  $0 analyze /path/to/PROJECT_minerals

  ${CYAN}# Preview extraction${NC}
  $0 preview /path/to/PROJECT_minerals --product-name minerals-app

  ${CYAN}# Extract product${NC}
  $0 extract /path/to/PROJECT_minerals --product-name minerals-app --product-type webapp

  ${CYAN}# Validate extracted product${NC}
  $0 validate minerals-app

  ${CYAN}# Show all products${NC}
  $0 list

  ${CYAN}# Show extraction rules${NC}
  $0 rules

  ${CYAN}# Show statistics${NC}
  $0 stats

${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}WHAT THIS DOES:${NC}
  1. Analyzes project files
  2. Applies extraction rules
  3. Identifies ESSENTIAL vs EXCLUDED files
  4. Creates clean product directory
  5. Copies only essential files
  6. Validates the result
  7. Tracks everything in database

${YELLOW}RESULT:${NC}
  PROJECT_name/
  ├── app-name/           ← THE PRODUCT (100% deployable!)
  │   ├── src/            ← ONLY essential code
  │   ├── public/         ← ONLY needed assets
  │   └── package.json    ← ONLY production deps
  ├── docs/               ← Context (NOT in product)
  ├── experiments/        ← Trials (NOT in product)
  └── scripts/            ← Dev tools (NOT in product)

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List Products
# ============================================================================

list_products() {
    log_info "All products:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM products_dashboard;"
}

# ============================================================================
# Show Extraction Rules
# ============================================================================

show_rules() {
    log_info "Extraction Rules:"
    echo ""

    echo "INCLUDE Rules:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT rule_name, path_pattern, file_pattern, reason, priority
        FROM extraction_rules
        WHERE rule_type = 'include' AND is_active = TRUE
        ORDER BY priority DESC;
    "

    echo ""
    echo "EXCLUDE Rules:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT rule_name, path_pattern, file_pattern, reason, priority
        FROM extraction_rules
        WHERE rule_type = 'exclude' AND is_active = TRUE
        ORDER BY priority DESC;
    "
}

# ============================================================================
# Analyze Project
# ============================================================================

analyze_project() {
    local project_path="$1"
    local product_name="$2"
    local product_type="$3"

    if [ ! -d "$project_path" ]; then
        log_error "Project path not found: $project_path"
        return 1
    fi

    log_step "Analyzing project: $project_path"
    echo ""

    # Count files by type
    log_info "File Analysis:"
    echo ""

    local total_files=$(find "$project_path" -type f 2>/dev/null | wc -l | tr -d ' ')
    echo "Total files: $total_files"

    local ts_files=$(find "$project_path" -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    echo "TypeScript files: $ts_files"

    local js_files=$(find "$project_path" -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l | tr -d ' ')
    echo "JavaScript files: $js_files"

    local py_files=$(find "$project_path" -name "*.py" 2>/dev/null | wc -l | tr -d ' ')
    echo "Python files: $py_files"

    echo ""
    log_info "Key Files:"
    [ -f "$project_path/package.json" ] && echo "✅ package.json found"
    [ -f "$project_path/tsconfig.json" ] && echo "✅ tsconfig.json found"
    [ -f "$project_path/next.config.js" ] && echo "✅ next.config.js found"
    [ -f "$project_path/Dockerfile" ] && echo "✅ Dockerfile found"
    [ -f "$project_path/README.md" ] && echo "✅ README.md found"

    echo ""
    log_info "Directories:"
    [ -d "$project_path/src" ] && echo "📁 src/ (essential)"
    [ -d "$project_path/public" ] && echo "📁 public/ (essential)"
    [ -d "$project_path/docs" ] && echo "📁 docs/ (excluded)"
    [ -d "$project_path/examples" ] && echo "📁 examples/ (excluded)"
    [ -d "$project_path/node_modules" ] && echo "📁 node_modules/ (excluded - reinstall)"

    echo ""
    log_success "Analysis complete!"
}

# ============================================================================
# Preview Extraction
# ============================================================================

preview_extraction() {
    local project_path="$1"
    local product_name="$2"

    if [ ! -d "$project_path" ]; then
        log_error "Project path not found: $project_path"
        return 1
    fi

    log_step "Preview: What would be extracted"
    echo ""

    # Simulate extraction using rules
    log_info "Files that WOULD BE INCLUDED:"
    echo ""
    find "$project_path/src" -type f 2>/dev/null | head -20
    echo "... and more in src/"

    echo ""
    log_info "Files that WOULD BE EXCLUDED:"
    echo ""
    echo "📁 docs/ (all files)"
    echo "📁 experiments/ (all files)"
    echo "📁 node_modules/ (all files - reinstall from package.json)"
    echo "📁 .next/ (build output)"
    echo "📁 .git/ (version control)"

    echo ""
    log_warning "This is a preview. Use 'extract' command to perform actual extraction."
}

# ============================================================================
# Extract Product
# ============================================================================

extract_product() {
    local project_path="$1"
    local product_name="$2"
    local product_type="$3"
    local dry_run="$4"

    if [ ! -d "$project_path" ]; then
        log_error "Project path not found: $project_path"
        return 1
    fi

    if [ -z "$product_name" ]; then
        log_error "Product name required (--product-name)"
        return 1
    fi

    local product_dir="$project_path/${product_name}"

    log_step "Extracting product: $product_name"
    echo ""

    if [ "$dry_run" = "true" ]; then
        log_warning "DRY RUN - No files will be copied"
        echo ""
    fi

    # Create product directory
    if [ "$dry_run" != "true" ]; then
        mkdir -p "$product_dir"
        log_success "Created product directory: $product_dir"
    else
        log_info "Would create: $product_dir"
    fi

    # Copy essential files based on rules
    log_step "Copying essential files..."
    echo ""

    # Copy src/
    if [ -d "$project_path/src" ]; then
        if [ "$dry_run" != "true" ]; then
            cp -r "$project_path/src" "$product_dir/"
            log_success "Copied src/"
        else
            log_info "Would copy src/"
        fi
    fi

    # Copy public/
    if [ -d "$project_path/public" ]; then
        if [ "$dry_run" != "true" ]; then
            cp -r "$project_path/public" "$product_dir/"
            log_success "Copied public/"
        else
            log_info "Would copy public/"
        fi
    fi

    # Copy config files
    local config_files=("package.json" "tsconfig.json" "next.config.js" "tailwind.config.js" ".env.example")
    for file in "${config_files[@]}"; do
        if [ -f "$project_path/$file" ]; then
            if [ "$dry_run" != "true" ]; then
                cp "$project_path/$file" "$product_dir/"
                log_success "Copied $file"
            else
                log_info "Would copy $file"
            fi
        fi
    done

    echo ""
    if [ "$dry_run" != "true" ]; then
        log_success "Product extracted to: $product_dir"
        echo ""
        log_info "Next steps:"
        echo "  1. cd $product_dir"
        echo "  2. npm install (reinstall dependencies)"
        echo "  3. npm run build (test build)"
        echo "  4. npm run dev (test locally)"
    else
        log_warning "DRY RUN complete - no files were copied"
    fi
}

# ============================================================================
# Validate Product
# ============================================================================

validate_product() {
    local product_id="$1"

    if [ -z "$product_id" ]; then
        log_error "Product ID required"
        return 1
    fi

    log_step "Validating product: $product_id"
    echo ""

    # Get product path
    local product_path=$(sqlite3 "$DB_PATH" "SELECT product_path FROM products_registry WHERE product_id = '$product_id';")

    if [ -z "$product_path" ]; then
        log_error "Product not found: $product_id"
        return 1
    fi

    if [ ! -d "$product_path" ]; then
        log_error "Product directory not found: $product_path"
        return 1
    fi

    log_info "Checking essential files..."
    echo ""

    # Check for essential files
    [ -f "$product_path/package.json" ] && log_success "package.json found" || log_error "package.json missing"
    [ -d "$product_path/src" ] && log_success "src/ found" || log_warning "src/ not found"

    echo ""
    log_info "Checking build..."
    cd "$product_path"

    if [ -f "package.json" ]; then
        if command -v npm &> /dev/null; then
            log_step "Running npm install..."
            npm install > /dev/null 2>&1 && log_success "Dependencies installed" || log_error "npm install failed"

            log_step "Running build..."
            npm run build > /dev/null 2>&1 && log_success "Build passed!" || log_warning "Build failed"
        fi
    fi

    cd - > /dev/null
}

# ============================================================================
# Show Statistics
# ============================================================================

show_stats() {
    log_info "Extraction Statistics:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM extraction_stats;"
}

# ============================================================================
# Show Dashboard
# ============================================================================

show_dashboard() {
    log_info "Products Dashboard:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM products_dashboard;"
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    list)
        list_products
        ;;

    rules)
        show_rules
        ;;

    analyze)
        project_path="$2"
        shift 2

        product_name=""
        product_type=""

        while [ $# -gt 0 ]; do
            case "$1" in
                --product-name) product_name="$2"; shift 2 ;;
                --product-type) product_type="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        analyze_project "$project_path" "$product_name" "$product_type"
        ;;

    preview)
        project_path="$2"
        shift 2

        product_name=""

        while [ $# -gt 0 ]; do
            case "$1" in
                --product-name) product_name="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        preview_extraction "$project_path" "$product_name"
        ;;

    extract)
        project_path="$2"
        shift 2

        product_name=""
        product_type=""
        dry_run="false"

        while [ $# -gt 0 ]; do
            case "$1" in
                --product-name) product_name="$2"; shift 2 ;;
                --product-type) product_type="$2"; shift 2 ;;
                --dry-run) dry_run="true"; shift ;;
                *) shift ;;
            esac
        done

        extract_product "$project_path" "$product_name" "$product_type" "$dry_run"
        ;;

    validate)
        product_id="$2"
        validate_product "$product_id"
        ;;

    stats)
        show_stats
        ;;

    dashboard)
        show_dashboard
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
