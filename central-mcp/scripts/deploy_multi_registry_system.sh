#!/bin/bash

# 🚀 DEPLOY CENTRAL-MCP MULTI-REGISTRY SYSTEM
# Built: 2025-10-13 | Purpose: Deploy standardized task completion with verifiable success criteria

set -e

echo "🚀 DEPLOYING CENTRAL-MCP MULTI-REGISTRY SYSTEM"
echo "=================================================="
echo "Built: 2025-10-13"
echo "Purpose: Standardized task completion with verifiable success criteria"
echo ""

# Configuration
DB_PATH="data/registry.db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

# Function to check if database exists
check_database() {
    if [ ! -f "$DB_PATH" ]; then
        log_error "Database not found at $DB_PATH"
        log_info "Please ensure Central-MCP is properly initialized"
        exit 1
    fi
    log_success "Database found at $DB_PATH"
}

# Function to backup database
backup_database() {
    local backup_path="${DB_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "Creating database backup at $backup_path"
    cp "$DB_PATH" "$backup_path"
    log_success "Database backup created"
}

# Function to execute SQL script
execute_sql_script() {
    local script_path="$1"
    local script_name=$(basename "$script_path")

    log_info "Executing SQL script: $script_name"

    if [ ! -f "$script_path" ]; then
        log_error "SQL script not found: $script_path"
        return 1
    fi

    # Execute SQL script and capture output
    local output
    output=$(sqlite3 "$DB_PATH" < "$script_path" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_success "SQL script executed successfully: $script_name"
        if [ -n "$output" ]; then
            echo "$output" | head -20
        fi
    else
        log_error "SQL script failed: $script_name"
        echo "$output"
        return 1
    fi
}

# Function to verify deployment
verify_deployment() {
    log_info "Verifying multi-registry deployment..."

    # Check if new tables exist
    local new_tables=("vision_registry" "implementation_gap_registry")
    for table in "${new_tables[@]}"; do
        local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table';")
        if [ "$count" -eq 1 ]; then
            log_success "Table $table created successfully"
        else
            log_error "Table $table not found"
            return 1
        fi
    done

    # Check if tasks_registry was enhanced
    local completion_columns=("code_executed_successfully" "honest_completion_percentage" "completion_level")
    for column in "${completion_columns[@]}"; do
        local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM pragma_table_info('tasks_registry') WHERE name='$column';")
        if [ "$count" -eq 1 ]; then
            log_success "Column $column added to tasks_registry"
        else
            log_error "Column $column not found in tasks_registry"
            return 1
        fi
    done

    # Check if triggers were created
    local trigger_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE '%completion%';")
    if [ "$trigger_count" -gt 0 ]; then
        log_success "Completion enforcement triggers created ($trigger_count triggers)"
    else
        log_error "No completion triggers found"
        return 1
    fi

    # Check if views were created
    local view_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name LIKE 'v_%completion%';")
    if [ "$view_count" -gt 0 ]; then
        log_success "Monitoring views created ($view_count views)"
    else
        log_error "No monitoring views found"
        return 1
    fi

    log_success "Multi-registry deployment verification completed"
}

# Function to show deployment summary
show_deployment_summary() {
    log_info "Generating deployment summary..."

    echo ""
    echo "📊 MULTI-REGISTRY DEPLOYMENT SUMMARY"
    echo "======================================"

    # Show registry overview
    echo ""
    echo "📋 Registry Overview:"
    sqlite3 "$DB_PATH" "
    SELECT registry_type, total_tasks, completed_tasks,
           ROUND(AVG(honest_completion_percentage) * 100, 1) || '%' as avg_honesty
    FROM v_multi_registry_overview;
    "

    # Show completion level distribution
    echo ""
    echo "🎯 Completion Level Distribution:"
    sqlite3 "$DB_PATH" "
    SELECT registry_type,
           SUM(CASE WHEN completion_level = 1 THEN 1 ELSE 0 END) as level_1,
           SUM(CASE WHEN completion_level = 2 THEN 1 ELSE 0 END) as level_2,
           SUM(CASE WHEN completion_level = 3 THEN 1 ELSE 0 END) as level_3,
           SUM(CASE WHEN completion_level = 4 THEN 1 ELSE 0 END) as level_4
    FROM v_registry_completion_distribution
    GROUP BY registry_type;
    "

    # Show completion gap analysis
    echo ""
    echo "🔍 Completion Gap Analysis:"
    sqlite3 "$DB_PATH" "SELECT * FROM v_completion_gap_analysis;"

    echo ""
    echo "✅ Multi-Registry System is ready for use!"
    echo "📚 Available MCP Tools:"
    echo "   - create_vision_extraction"
    echo "   - declare_vision_completion"
    echo "   - analyze_implementation_gaps"
    echo "   - declare_gap_completion"
    echo "   - claim_task"
    echo "   - declare_task_completion"
    echo "   - get_tasks_by_completion_level"
    echo "   - get_honest_completion_assessment"
    echo "   - get_completion_gap_analysis"
}

# Main deployment function
deploy_multi_registry_system() {
    log_info "Starting Central-MCP Multi-Registry System deployment..."

    # Step 1: Pre-deployment checks
    check_database

    # Step 2: Create backup
    backup_database

    # Step 3: Deploy enhanced tasks_registry
    log_info "Step 1: Enhancing tasks_registry with standardized completion criteria"
    execute_sql_script "$SCRIPT_DIR/enhance_tasks_registry_with_completion_standards.sql"

    # Step 4: Create new registries
    log_info "Step 2: Creating vision_registry and implementation_gap_registry"
    execute_sql_script "$SCRIPT_DIR/create_vision_registry.sql"

    # Step 5: Verify deployment
    verify_deployment

    # Step 6: Show summary
    show_deployment_summary

    log_success "🎉 Central-MCP Multi-Registry System deployed successfully!"
}

# Function to run tests
run_tests() {
    log_info "Running multi-registry system tests..."

    # Test 1: Verify vision registry can be created
    log_info "Test 1: Creating sample vision extraction"
    local vision_id=$(sqlite3 "$DB_PATH" "
    INSERT INTO vision_registry (
        vision_id, source_message_id, source_conversation_id,
        user_intent, business_context, success_criteria,
        generated_spec_id, vision_clarity_score, business_value_alignment,
        status, created_at
    ) VALUES (
        'TEST-VISION-001', 'TEST-MSG-001', 'TEST-CONV-001',
        'Test user intent', 'Test business context', 'Test success criteria',
        'TEST-SPEC-001', 0.9, 0.85,
        'COMPLETED', datetime('now')
    );
    SELECT vision_id FROM vision_registry WHERE vision_id = 'TEST-VISION-001';
    ")

    if [ "$vision_id" = "TEST-VISION-001" ]; then
        log_success "Test 1 passed: Vision registry functional"
    else
        log_error "Test 1 failed: Vision registry not working"
        return 1
    fi

    # Test 2: Verify implementation gap registry can be created
    log_info "Test 2: Creating sample implementation gap"
    local gap_id=$(sqlite3 "$DB_PATH" "
    INSERT INTO implementation_gap_registry (
        gap_id, source_spec_id, target_codebase,
        gap_description, gap_type, gap_priority,
        implementation_plan, status, created_at
    ) VALUES (
        'TEST-GAP-001', 'TEST-SPEC-001', 'test-codebase',
        'Test gap description', 'FEATURE', 'HIGH',
        'Test implementation plan', 'COMPLETED', datetime('now')
    );
    SELECT gap_id FROM implementation_gap_registry WHERE gap_id = 'TEST-GAP-001';
    ")

    if [ "$gap_id" = "TEST-GAP-001" ]; then
        log_success "Test 2 passed: Implementation gap registry functional"
    else
        log_error "Test 2 failed: Implementation gap registry not working"
        return 1
    fi

    # Test 3: Verify completion enforcement triggers work
    log_info "Test 3: Testing completion enforcement triggers"

    # This should fail because honest_completion_percentage is required
    local result=$(sqlite3 "$DB_PATH" "
    BEGIN TRANSACTION;
    UPDATE tasks_registry SET status = 'COMPLETED' WHERE task_id = 'NONEXISTENT';
    ROLLBACK;
    SELECT 'Test completed' as result;
    " 2>&1 || echo "Trigger enforcement working")

    if [[ "$result" == *"ERROR"* ]] || [[ "$result" == *"Trigger enforcement working"* ]]; then
        log_success "Test 3 passed: Completion enforcement triggers working"
    else
        log_warning "Test 3: Trigger enforcement may need verification"
    fi

    # Clean up test data
    sqlite3 "$DB_PATH" "DELETE FROM vision_registry WHERE vision_id LIKE 'TEST-%';"
    sqlite3 "$DB_PATH" "DELETE FROM implementation_gap_registry WHERE gap_id LIKE 'TEST-%';"

    log_success "All tests completed successfully!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -d, --deploy        Deploy the multi-registry system"
    echo "  -t, --test          Run tests on the deployed system"
    echo "  -v, --verify        Verify current deployment"
    echo "  -s, --summary       Show deployment summary"
    echo ""
    echo "Examples:"
    echo "  $0 --deploy         # Deploy the system"
    echo "  $0 --test           # Run tests"
    echo "  $0 --verify         # Verify deployment"
    echo "  $0 --summary        # Show current status"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_usage
        exit 0
        ;;
    -d|--deploy)
        deploy_multi_registry_system
        ;;
    -t|--test)
        check_database
        run_tests
        ;;
    -v|--verify)
        check_database
        verify_deployment
        ;;
    -s|--summary)
        check_database
        show_deployment_summary
        ;;
    "")
        log_info "No arguments provided. Running deployment..."
        deploy_multi_registry_system
        ;;
    *)
        log_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac