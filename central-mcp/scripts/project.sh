#!/bin/bash

# ============================================================================
# PROJECTS MANAGER - Complete Project Management System
# ============================================================================
# Purpose: Manage project registry for Central-MCP
# Usage: ./project.sh [COMMAND] [OPTIONS]
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
${GREEN}📂 PROJECTS MANAGER${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS:${NC}
  ${GREEN}list${NC}                 List all projects
  ${GREEN}active${NC}               Show active projects dashboard
  ${GREEN}search${NC} <query>       Search projects by name or description
  ${GREEN}info${NC} <id>            Show detailed project information
  ${GREEN}health${NC}               Show project health summary
  ${GREEN}status${NC} <id>          Show project status and progress
  ${GREEN}update${NC} <id>          Update project metadata
  ${GREEN}tasks${NC} <id>           List tasks for project
  ${GREEN}milestones${NC} <id>      List milestones for project
  ${GREEN}deps${NC}                 Show project dependencies graph
  ${GREEN}stats${NC}                Show overall statistics

${YELLOW}LIST OPTIONS:${NC}
  --status <status>   Filter by status (ACTIVE, INACTIVE, BLOCKED, ARCHIVED)
  --health <health>   Filter by health (HEALTHY, WARNING, CRITICAL)
  --type <type>       Filter by type (COMMERCIAL_APP, INFRASTRUCTURE, etc.)
  --agent <agent>     Filter by lead agent

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# List all projects${NC}
  $0 list

  ${CYAN}# Show active projects dashboard${NC}
  $0 active

  ${CYAN}# Show project health${NC}
  $0 health

  ${CYAN}# Get project info${NC}
  $0 info central-mcp

  ${CYAN}# Show project status${NC}
  $0 status central-mcp

  ${CYAN}# List tasks for project${NC}
  $0 tasks central-mcp

  ${CYAN}# Show dependencies${NC}
  $0 deps

  ${CYAN}# Search for projects${NC}
  $0 search "commerce"

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List Projects
# ============================================================================

list_projects() {
    local status="$1"
    local health="$2"
    local type="$3"
    local agent="$4"

    log_info "All projects:"
    echo ""

    local sql="SELECT id, name, type, status, health, completion_percentage, lead_agent FROM projects WHERE 1=1"

    if [ -n "$status" ]; then
        sql="$sql AND status = '$status'"
    fi

    if [ -n "$health" ]; then
        sql="$sql AND health = '$health'"
    fi

    if [ -n "$type" ]; then
        sql="$sql AND type = '$type'"
    fi

    if [ -n "$agent" ]; then
        sql="$sql AND lead_agent = '$agent'"
    fi

    sql="$sql ORDER BY completion_percentage DESC, name;"

    sqlite3 -header -column "$DB_PATH" "$sql"
}

# ============================================================================
# Active Projects Dashboard
# ============================================================================

show_active() {
    log_info "Active Projects Dashboard:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM active_projects_dashboard;"
}

# ============================================================================
# Search Projects
# ============================================================================

search_projects() {
    local query="$1"

    if [ -z "$query" ]; then
        log_error "Search query required"
        return 1
    fi

    log_info "Searching for: $query"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT id, name, type, status, description
        FROM projects
        WHERE name LIKE '%$query%'
        OR description LIKE '%$query%'
        OR vision LIKE '%$query%'
        ORDER BY status, name;
    "
}

# ============================================================================
# Show Project Info
# ============================================================================

show_project_info() {
    local project_id="$1"

    if [ -z "$project_id" ]; then
        log_error "Project ID required"
        return 1
    fi

    log_info "Project Information: $project_id"
    echo ""

    # Basic info
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            name,
            type,
            status,
            health,
            description,
            completion_percentage,
            lead_agent,
            team_agents,
            current_milestone,
            deployment_status,
            deployment_url
        FROM projects
        WHERE id = '$project_id';
    "

    echo ""
    log_info "Tech Stack:"
    sqlite3 "$DB_PATH" "SELECT tech_stack FROM projects WHERE id = '$project_id';"

    echo ""
    log_info "Progress:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT total_tasks, completed_tasks, blocked_tasks,
               ROUND(CAST(completed_tasks AS REAL) / NULLIF(total_tasks, 0) * 100, 1) as task_completion_rate
        FROM projects
        WHERE id = '$project_id';
    "
}

# ============================================================================
# Show Project Health
# ============================================================================

show_health() {
    log_info "Project Health Summary:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM project_health_summary;"
}

# ============================================================================
# Show Project Status
# ============================================================================

show_status() {
    local project_id="$1"

    if [ -z "$project_id" ]; then
        log_error "Project ID required"
        return 1
    fi

    log_info "Project Status: $project_id"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            status,
            health,
            completion_percentage,
            total_tasks,
            completed_tasks,
            blocked_tasks,
            current_milestone,
            last_activity
        FROM projects
        WHERE id = '$project_id';
    "
}

# ============================================================================
# List Project Tasks
# ============================================================================

list_tasks() {
    local project_id="$1"

    if [ -z "$project_id" ]; then
        log_error "Project ID required"
        return 1
    fi

    log_info "Tasks for project: $project_id"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT task_id, task_name, category, priority, status, assigned_agent, completion_percentage
        FROM project_tasks
        WHERE project_id = '$project_id'
        ORDER BY priority DESC, status, task_name;
    "
}

# ============================================================================
# List Project Milestones
# ============================================================================

list_milestones() {
    local project_id="$1"

    if [ -z "$project_id" ]; then
        log_error "Project ID required"
        return 1
    fi

    log_info "Milestones for project: $project_id"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT milestone_name, status, completion_percentage, target_date, completed_date
        FROM project_milestones
        WHERE project_id = '$project_id'
        ORDER BY target_date, status;
    "
}

# ============================================================================
# Show Dependencies Graph
# ============================================================================

show_dependencies() {
    log_info "Project Dependencies Graph:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM project_dependencies_graph;"
}

# ============================================================================
# Show Overall Statistics
# ============================================================================

show_stats() {
    log_info "Overall Project Statistics:"
    echo ""

    # Total projects
    echo "Total Projects:"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM projects;"
    echo ""

    # By status
    echo "Projects by Status:"
    sqlite3 -header -column "$DB_PATH" "SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY count DESC;"
    echo ""

    # By health
    echo "Projects by Health:"
    sqlite3 -header -column "$DB_PATH" "SELECT health, COUNT(*) as count FROM projects WHERE status = 'ACTIVE' GROUP BY health ORDER BY count DESC;"
    echo ""

    # By type
    echo "Projects by Type:"
    sqlite3 -header -column "$DB_PATH" "SELECT type, COUNT(*) as count FROM projects GROUP BY type ORDER BY count DESC;"
    echo ""

    # Average completion
    echo "Average Completion:"
    sqlite3 "$DB_PATH" "SELECT ROUND(AVG(completion_percentage), 1) || '%' as avg_completion FROM projects WHERE status = 'ACTIVE';"
    echo ""

    # Total tasks
    echo "Total Tasks:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            SUM(total_tasks) as total_tasks,
            SUM(completed_tasks) as completed_tasks,
            SUM(blocked_tasks) as blocked_tasks,
            ROUND(CAST(SUM(completed_tasks) AS REAL) / NULLIF(SUM(total_tasks), 0) * 100, 1) || '%' as completion_rate
        FROM projects
        WHERE status = 'ACTIVE';
    "
}

# ============================================================================
# Update Project
# ============================================================================

update_project() {
    local project_id="$1"

    if [ -z "$project_id" ]; then
        log_error "Project ID required"
        return 1
    fi

    log_warning "Project update instructions:"
    echo ""
    log_info "Use SQL to update project metadata:"
    echo ""
    echo "sqlite3 $DB_PATH << EOF"
    echo "UPDATE projects"
    echo "SET status = 'ACTIVE',"
    echo "    health = 'HEALTHY',"
    echo "    completion_percentage = 80,"
    echo "    description = 'Updated description',"
    echo "    lead_agent = 'Agent-A',"
    echo "    current_milestone = 'New milestone'"
    echo "WHERE id = '$project_id';"
    echo "EOF"
    echo ""
    log_info "Or use interactive shell:"
    echo "sqlite3 $DB_PATH"
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    list)
        shift
        status=""
        health=""
        type=""
        agent=""

        while [ $# -gt 0 ]; do
            case "$1" in
                --status) status="$2"; shift 2 ;;
                --health) health="$2"; shift 2 ;;
                --type) type="$2"; shift 2 ;;
                --agent) agent="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        list_projects "$status" "$health" "$type" "$agent"
        ;;

    active)
        show_active
        ;;

    search)
        query="$2"
        search_projects "$query"
        ;;

    info)
        project_id="$2"
        show_project_info "$project_id"
        ;;

    health)
        show_health
        ;;

    status)
        project_id="$2"
        show_status "$project_id"
        ;;

    tasks)
        project_id="$2"
        list_tasks "$project_id"
        ;;

    milestones)
        project_id="$2"
        list_milestones "$project_id"
        ;;

    deps)
        show_dependencies
        ;;

    stats)
        show_stats
        ;;

    update)
        project_id="$2"
        update_project "$project_id"
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
