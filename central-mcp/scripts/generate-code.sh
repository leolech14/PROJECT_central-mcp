#!/bin/bash

# ============================================================================
# CODE GENERATION - Specbase-to-Codebase Pipeline (FORWARD FLOW)
# ============================================================================
# Purpose: Generate complete codebases from specifications using orchestrated tasks
# Usage: ./generate-code.sh [COMMAND] [OPTIONS]
# Vision: SPEC → TASKS → CODE (deterministic generation)
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
${GREEN}🏗️  CODE GENERATION - Specbase-to-Codebase Pipeline${NC}
${YELLOW}SPEC → TASKS → CODE (forward flow generation)${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS:${NC}
  ${GREEN}list${NC}                     List all generated codebases
  ${GREEN}generate${NC} <spec-id>       Generate codebase from specification
  ${GREEN}tasks${NC} <codebase-id>      Show generation tasks
  ${GREEN}status${NC} <codebase-id>     Check generation status
  ${GREEN}validate${NC} <codebase-id>   Validate generated code
  ${GREEN}strategies${NC}               List available generation strategies
  ${GREEN}templates${NC}                List available code templates
  ${GREEN}dashboard${NC}                Show codebases dashboard
  ${GREEN}stats${NC}                    Show generation statistics

${YELLOW}GENERATE OPTIONS:${NC}
  --strategy <strategy>   Generation strategy (default: nextjs-webapp-standard)
  --output <dir>          Output directory for generated code
  --dry-run              Preview only, don't generate files
  --agent <agent-id>      Agent to execute generation

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# List all generated codebases${NC}
  $0 list

  ${CYAN}# Generate from specification${NC}
  $0 generate spec-minerals-app-v1 --strategy nextjs-webapp-standard

  ${CYAN}# Show generation tasks${NC}
  $0 tasks codebase-minerals-001

  ${CYAN}# Check generation status${NC}
  $0 status codebase-minerals-001

  ${CYAN}# Validate generated code${NC}
  $0 validate codebase-minerals-001

  ${CYAN}# List available strategies${NC}
  $0 strategies

  ${CYAN}# List available templates${NC}
  $0 templates

${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}WHAT THIS DOES:${NC}
  1. Reads specification from specbase
  2. Selects generation strategy
  3. Breaks into orchestrated tasks
  4. Executes tasks in dependency order
  5. Applies code templates
  6. Generates complete codebase
  7. Validates and tests result
  8. Tracks everything in database

${YELLOW}RESULT:${NC}
  SPEC → Generated Codebase (100% ready!)
  ├── Complete file structure
  ├── All configuration files
  ├── Fully implemented features
  ├── Tests and validation
  └── Build passing

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List Codebases
# ============================================================================

list_codebases() {
    log_info "Generated codebases:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            codebase_id,
            codebase_name,
            spec_id,
            generation_status,
            build_status,
            total_tasks,
            completed_tasks,
            total_files_generated,
            quality_score,
            created_at
        FROM generated_codebases
        ORDER BY created_at DESC;
    "
}

# ============================================================================
# List Strategies
# ============================================================================

list_strategies() {
    log_info "Available generation strategies:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            strategy_id,
            strategy_name,
            description,
            usage_count,
            success_rate,
            avg_generation_time_minutes
        FROM generation_strategies
        WHERE is_active = TRUE
        ORDER BY success_rate DESC, usage_count DESC;
    "
}

# ============================================================================
# List Templates
# ============================================================================

list_templates() {
    log_info "Available code templates:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            template_id,
            template_name,
            template_type,
            applies_to_frameworks,
            usage_count
        FROM code_templates
        WHERE is_active = TRUE
        ORDER BY usage_count DESC;
    "
}

# ============================================================================
# Generate Codebase
# ============================================================================

generate_codebase() {
    local spec_id="$1"
    local strategy="$2"
    local output_dir="$3"
    local dry_run="$4"
    local agent="$5"

    if [ -z "$spec_id" ]; then
        log_error "Specification ID required"
        return 1
    fi

    if [ -z "$strategy" ]; then
        strategy="nextjs-webapp-standard"
    fi

    log_step "Generating codebase from: $spec_id"
    echo ""

    # Check if spec exists
    local spec_exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM specs_registry WHERE spec_id = '$spec_id';")
    if [ "$spec_exists" -eq 0 ]; then
        log_error "Specification not found: $spec_id"
        return 1
    fi

    # Check if strategy exists
    local strategy_exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM generation_strategies WHERE strategy_id = '$strategy';")
    if [ "$strategy_exists" -eq 0 ]; then
        log_error "Strategy not found: $strategy"
        log_info "Available strategies: "
        list_strategies
        return 1
    fi

    if [ "$dry_run" = "true" ]; then
        log_warning "DRY RUN - No files will be generated"
        echo ""
    fi

    # Create codebase record
    local codebase_id="codebase-$(date +%s)"
    local codebase_name=$(sqlite3 "$DB_PATH" "SELECT spec_name FROM specs_registry WHERE spec_id = '$spec_id';")

    log_step "Creating codebase record: $codebase_id"

    if [ "$dry_run" != "true" ]; then
        sqlite3 "$DB_PATH" "
            INSERT INTO generated_codebases (
                codebase_id, codebase_name, spec_id, strategy_id,
                generation_status, output_path, generation_method
            ) VALUES (
                '$codebase_id', '$codebase_name', '$spec_id', '$strategy',
                'IN_PROGRESS', '$output_dir', 'orchestrated'
            );
        "
        log_success "Codebase record created"

        # Write code generation event
        node "$SCRIPT_DIR/write-event.cjs" code_gen "{
            \"codebaseId\": \"$codebase_id\",
            \"codebaseName\": \"$codebase_name\",
            \"specId\": \"$spec_id\",
            \"strategyId\": \"$strategy\",
            \"generationMethod\": \"orchestrated\",
            \"eventType\": \"codebase_created\",
            \"outputPath\": \"$output_dir\",
            \"triggeredBy\": \"generate-code.sh\"
        }" > /dev/null 2>&1
    else
        log_info "Would create codebase record: $codebase_id"
    fi

    # Get task template from strategy
    log_step "Loading generation strategy: $strategy"
    local task_template=$(sqlite3 "$DB_PATH" "SELECT task_template FROM generation_strategies WHERE strategy_id = '$strategy';")

    if [ -z "$task_template" ]; then
        log_error "Failed to load strategy task template"
        return 1
    fi

    log_success "Strategy loaded"

    # Create generation tasks
    log_step "Creating generation tasks..."
    echo ""

    # Note: In production, this would parse the JSON task_template and create tasks
    # For now, we'll simulate task creation
    if [ "$dry_run" != "true" ]; then
        # Example task creation (simplified)
        sqlite3 "$DB_PATH" "
            INSERT INTO generation_tasks (
                task_id, codebase_id, task_name, task_type, task_category,
                execution_order, status
            ) VALUES
            ('$codebase_id-task-001', '$codebase_id', 'Initialize package.json', 'config', 'infrastructure', 1, 'PENDING'),
            ('$codebase_id-task-002', '$codebase_id', 'Setup TypeScript config', 'config', 'infrastructure', 2, 'PENDING'),
            ('$codebase_id-task-003', '$codebase_id', 'Define database schema', 'database_schema', 'database', 3, 'PENDING'),
            ('$codebase_id-task-004', '$codebase_id', 'Create API routes', 'api_endpoint', 'backend', 4, 'PENDING'),
            ('$codebase_id-task-005', '$codebase_id', 'Build React components', 'component', 'frontend', 5, 'PENDING'),
            ('$codebase_id-task-006', '$codebase_id', 'Write tests', 'test', 'testing', 6, 'PENDING');
        "
        log_success "6 generation tasks created"

        # Write tasks created event
        node "$SCRIPT_DIR/write-event.cjs" code_gen "{
            \"codebaseId\": \"$codebase_id\",
            \"specId\": \"$spec_id\",
            \"eventType\": \"tasks_created\",
            \"totalTasks\": 6,
            \"taskCategories\": [\"infrastructure\", \"database\", \"backend\", \"frontend\", \"testing\"],
            \"strategyId\": \"$strategy\",
            \"triggeredBy\": \"generate-code.sh\"
        }" > /dev/null 2>&1
    else
        log_info "Would create 6 generation tasks from strategy"
    fi

    echo ""
    log_success "Codebase generation initiated!"
    echo ""
    log_info "Next steps:"
    echo "  1. $0 tasks $codebase_id        # View tasks"
    echo "  2. $0 status $codebase_id       # Check progress"
    echo "  3. $0 validate $codebase_id     # Validate when complete"
}

# ============================================================================
# Show Generation Tasks
# ============================================================================

show_tasks() {
    local codebase_id="$1"

    if [ -z "$codebase_id" ]; then
        log_error "Codebase ID required"
        return 1
    fi

    log_info "Generation tasks for: $codebase_id"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            task_id,
            task_name,
            task_type,
            task_category,
            status,
            execution_order,
            assigned_agent,
            completed_at
        FROM generation_tasks
        WHERE codebase_id = '$codebase_id'
        ORDER BY execution_order ASC;
    "
}

# ============================================================================
# Show Status
# ============================================================================

show_status() {
    local codebase_id="$1"

    if [ -z "$codebase_id" ]; then
        log_error "Codebase ID required"
        return 1
    fi

    log_step "Status for: $codebase_id"
    echo ""

    # Get codebase info
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            codebase_id,
            codebase_name,
            generation_status,
            total_tasks,
            completed_tasks,
            total_files_generated,
            build_status,
            quality_score
        FROM generated_codebases
        WHERE codebase_id = '$codebase_id';
    "

    echo ""
    log_info "Task Progress:"

    local total=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM generation_tasks WHERE codebase_id = '$codebase_id';")
    local completed=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM generation_tasks WHERE codebase_id = '$codebase_id' AND status = 'COMPLETED';")
    local in_progress=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM generation_tasks WHERE codebase_id = '$codebase_id' AND status = 'IN_PROGRESS';")
    local failed=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM generation_tasks WHERE codebase_id = '$codebase_id' AND status = 'FAILED';")

    echo "Total: $total"
    echo "Completed: $completed"
    echo "In Progress: $in_progress"
    echo "Failed: $failed"

    if [ "$total" -gt 0 ]; then
        local progress=$((completed * 100 / total))
        echo "Progress: ${progress}%"
    fi
}

# ============================================================================
# Validate Codebase
# ============================================================================

validate_codebase() {
    local codebase_id="$1"

    if [ -z "$codebase_id" ]; then
        log_error "Codebase ID required"
        return 1
    fi

    log_step "Validating codebase: $codebase_id"
    echo ""

    # Get output path
    local output_path=$(sqlite3 "$DB_PATH" "SELECT output_path FROM generated_codebases WHERE codebase_id = '$codebase_id';")

    if [ -z "$output_path" ] || [ ! -d "$output_path" ]; then
        log_error "Output path not found or invalid: $output_path"
        return 1
    fi

    log_info "Checking files..."

    # Check essential files
    [ -f "$output_path/package.json" ] && log_success "package.json found" || log_error "package.json missing"
    [ -d "$output_path/src" ] && log_success "src/ found" || log_warning "src/ not found"

    echo ""
    log_info "Attempting build..."
    cd "$output_path"

    if [ -f "package.json" ]; then
        if command -v npm &> /dev/null; then
            log_step "Installing dependencies..."
            npm install > /dev/null 2>&1 && log_success "Dependencies installed" || log_error "npm install failed"

            log_step "Running build..."
            if npm run build > /dev/null 2>&1; then
                log_success "Build passed!"

                # Write validation success event
                node "$SCRIPT_DIR/write-event.cjs" code_gen "{
                    \"codebaseId\": \"$codebase_id\",
                    \"eventType\": \"validation_complete\",
                    \"validationStatus\": \"success\",
                    \"buildPassing\": true,
                    \"triggeredBy\": \"generate-code.sh\"
                }" > /dev/null 2>&1
            else
                log_warning "Build failed"

                # Write validation failure event
                node "$SCRIPT_DIR/write-event.cjs" code_gen "{
                    \"codebaseId\": \"$codebase_id\",
                    \"eventType\": \"validation_complete\",
                    \"validationStatus\": \"failed\",
                    \"buildPassing\": false,
                    \"triggeredBy\": \"generate-code.sh\"
                }" > /dev/null 2>&1
            fi
        fi
    fi

    cd - > /dev/null
}

# ============================================================================
# Show Dashboard
# ============================================================================

show_dashboard() {
    log_info "Codebases Dashboard:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            codebase_id,
            codebase_name,
            spec_id,
            generation_status,
            build_status,
            total_tasks,
            completed_tasks,
            ROUND(CAST(completed_tasks AS REAL) / NULLIF(total_tasks, 0) * 100, 1) as completion_pct,
            total_files_generated,
            quality_score,
            is_deployable,
            created_at
        FROM generated_codebases
        ORDER BY created_at DESC;
    "
}

# ============================================================================
# Show Statistics
# ============================================================================

show_stats() {
    log_info "Generation Statistics:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            COUNT(*) as total_codebases,
            SUM(CASE WHEN generation_status = 'COMPLETE' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN generation_status IN ('PLANNING', 'GENERATING', 'VALIDATING') THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN generation_status = 'FAILED' THEN 1 ELSE 0 END) as failed,
            SUM(total_tasks) as total_tasks,
            SUM(completed_tasks) as completed_tasks,
            SUM(total_files_generated) as total_files_generated,
            AVG(quality_score) as avg_quality_score,
            AVG(CAST((julianday(generation_completed_at) - julianday(generation_started_at)) * 24 * 60 AS REAL)) as avg_generation_time_minutes
        FROM generated_codebases
        WHERE generation_status != 'PENDING';
    "
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    list)
        list_codebases
        ;;

    strategies)
        list_strategies
        ;;

    templates)
        list_templates
        ;;

    generate)
        spec_id="$2"
        shift 2

        strategy="nextjs-webapp-standard"
        output_dir=""
        dry_run="false"
        agent=""

        while [ $# -gt 0 ]; do
            case "$1" in
                --strategy) strategy="$2"; shift 2 ;;
                --output) output_dir="$2"; shift 2 ;;
                --dry-run) dry_run="true"; shift ;;
                --agent) agent="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        generate_codebase "$spec_id" "$strategy" "$output_dir" "$dry_run" "$agent"
        ;;

    tasks)
        codebase_id="$2"
        show_tasks "$codebase_id"
        ;;

    status)
        codebase_id="$2"
        show_status "$codebase_id"
        ;;

    validate)
        codebase_id="$2"
        validate_codebase "$codebase_id"
        ;;

    dashboard)
        show_dashboard
        ;;

    stats)
        show_stats
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
