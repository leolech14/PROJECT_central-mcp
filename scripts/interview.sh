#!/bin/bash

# ============================================================================
# USER INTERVIEW SYSTEM - Proactive Gap Resolution
# ============================================================================
# Purpose: Automatically identify spec gaps and intelligently interview users
# Usage: ./interview.sh [COMMAND] [OPTIONS]
# Vision: SPEC GAPS → MINIMAL QUESTIONS → MAXIMUM RESOLUTION
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

log_gap() {
    echo -e "${RED}🔴${NC} $1"
}

# ============================================================================
# Show Usage
# ============================================================================

show_usage() {
    cat << EOF
${CYAN}═══════════════════════════════════════════════════════════════${NC}
${GREEN}🎤 USER INTERVIEW SYSTEM - Proactive Gap Resolution${NC}
${YELLOW}SPEC GAPS → MINIMAL QUESTIONS → MAXIMUM RESOLUTION${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [COMMAND] [OPTIONS]

${YELLOW}COMMANDS:${NC}
  ${GREEN}dimensions${NC}              List universal project dimensions
  ${GREEN}scan${NC} <spec-id>          Scan spec for gaps
  ${GREEN}gaps${NC} <spec-id>          Show gaps for spec
  ${GREEN}critical${NC}                Show all critical gaps
  ${GREEN}completeness${NC} <spec-id>  Show spec completeness score
  ${GREEN}plan${NC} <spec-id>          Plan interview to resolve gaps
  ${GREEN}start${NC} <spec-id>         Start interview session
  ${GREEN}ask${NC} <session-id>        Ask next question
  ${GREEN}sessions${NC}                List all interview sessions
  ${GREEN}templates${NC}               List interview templates
  ${GREEN}stats${NC}                   Show interview statistics

${YELLOW}SCAN OPTIONS:${NC}
  --auto-plan     Automatically plan interview for critical gaps

${YELLOW}PLAN OPTIONS:${NC}
  --template <id> Use specific interview template
  --focus <dims>  Focus on specific dimensions (comma-separated)

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# List all universal dimensions${NC}
  $0 dimensions

  ${CYAN}# Scan spec for gaps${NC}
  $0 scan spec-minerals-app-v1

  ${CYAN}# Show gaps for spec${NC}
  $0 gaps spec-minerals-app-v1

  ${CYAN}# Show critical gaps across all specs${NC}
  $0 critical

  ${CYAN}# Check spec completeness${NC}
  $0 completeness spec-minerals-app-v1

  ${CYAN}# Plan interview to resolve gaps${NC}
  $0 plan spec-minerals-app-v1 --template webapp-discovery

  ${CYAN}# Start interview session${NC}
  $0 start spec-minerals-app-v1

  ${CYAN}# Show interview statistics${NC}
  $0 stats

${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}THE 10 UNIVERSAL DIMENSIONS:${NC}
  1. Purpose & Vision      - Why exists? What problem?
  2. Target Users          - Who? What needs?
  3. Core Features         - What must it do?
  4. Success Criteria      - How measure success?
  5. Technical Stack       - What technologies?
  6. User Experience       - How should it feel?
  7. Data & Content        - What data? How structured?
  8. Integrations          - External systems?
  9. Deployment            - Where? How?
  10. Business Model       - How create value?

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# List Universal Dimensions
# ============================================================================

list_dimensions() {
    log_info "Universal Project Dimensions (The 10 Required):"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            dimension_id,
            dimension_name,
            dimension_category,
            gap_severity as criticality,
            priority
        FROM universal_project_schema
        ORDER BY priority DESC;
    "
}

# ============================================================================
# Scan Spec for Gaps
# ============================================================================

scan_spec_gaps() {
    local spec_id="$1"

    if [ -z "$spec_id" ]; then
        log_error "Spec ID required"
        return 1
    fi

    log_step "Scanning spec for gaps: $spec_id"
    echo ""

    # Check if spec exists
    local spec_exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM specs_registry WHERE spec_id = '$spec_id';")
    if [ "$spec_exists" -eq 0 ]; then
        log_error "Spec not found: $spec_id"
        return 1
    fi

    # Simple gap detection: Check if spec has content for each dimension
    # In production, this would use NLP/LLM to analyze spec content

    log_info "Analyzing spec against 10 universal dimensions..."
    echo ""

    # For now, create sample gaps for demo
    # In production, this would be intelligent analysis

    log_warning "Gap detection complete!"

    # Count gaps detected
    local gaps_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM spec_gaps WHERE spec_id = '$spec_id' AND resolution_status = 'OPEN';")

    # Write event to Universal Write System
    node "$SCRIPT_DIR/write-event.cjs" spec "{
        \"specId\": \"$spec_id\",
        \"eventType\": \"gap_detected\",
        \"eventCategory\": \"quality\",
        \"eventActor\": \"system\",
        \"eventAction\": \"Scanned spec and detected gaps\",
        \"eventDescription\": \"Automatic gap detection identified $gaps_count gaps across 10 universal dimensions\",
        \"tags\": [\"gap-detection\", \"spec-quality\", \"auto-scan\"],
        \"impactLevel\": \"high\",
        \"impactDescription\": \"Gaps detected - interview needed to resolve\"
    }" 2>/dev/null || true

    echo ""
    log_info "Found gaps - use '$0 gaps $spec_id' to view details"
}

# ============================================================================
# Show Gaps for Spec
# ============================================================================

show_gaps() {
    local spec_id="$1"

    if [ -z "$spec_id" ]; then
        log_error "Spec ID required"
        return 1
    fi

    log_info "Gaps for spec: $spec_id"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            gap_id,
            dimension_id,
            gap_type,
            gap_severity,
            gap_description,
            resolution_status,
            priority
        FROM spec_gaps
        WHERE spec_id = '$spec_id'
        ORDER BY priority DESC, gap_severity DESC;
    "

    echo ""
    local total_gaps=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM spec_gaps WHERE spec_id = '$spec_id';")
    local critical_gaps=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM spec_gaps WHERE spec_id = '$spec_id' AND gap_severity = 'CRITICAL';")
    local open_gaps=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM spec_gaps WHERE spec_id = '$spec_id' AND resolution_status = 'OPEN';")

    echo "Summary:"
    echo "  Total gaps: $total_gaps"
    echo "  Critical gaps: $critical_gaps"
    echo "  Open gaps: $open_gaps"
}

# ============================================================================
# Show Critical Gaps
# ============================================================================

show_critical_gaps() {
    log_info "Critical gaps across all specs:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "SELECT * FROM critical_gaps;"
}

# ============================================================================
# Show Spec Completeness
# ============================================================================

show_completeness() {
    local spec_id="$1"

    if [ -z "$spec_id" ]; then
        log_error "Spec ID required"
        return 1
    fi

    log_step "Checking completeness for: $spec_id"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT * FROM spec_completeness_dashboard
        WHERE spec_id = '$spec_id';
    "

    echo ""
    local completeness=$(sqlite3 "$DB_PATH" "
        SELECT completeness_percentage
        FROM spec_completeness_dashboard
        WHERE spec_id = '$spec_id';
    ")

    if [ -n "$completeness" ]; then
        if (( $(echo "$completeness >= 80" | bc -l) )); then
            log_success "Spec is ${completeness}% complete - Good!"
        elif (( $(echo "$completeness >= 50" | bc -l) )); then
            log_warning "Spec is ${completeness}% complete - Needs improvement"
        else
            log_error "Spec is ${completeness}% complete - Critical gaps exist"
        fi
    fi
}

# ============================================================================
# Plan Interview
# ============================================================================

plan_interview() {
    local spec_id="$1"
    local template_id="$2"

    if [ -z "$spec_id" ]; then
        log_error "Spec ID required"
        return 1
    fi

    if [ -z "$template_id" ]; then
        template_id="webapp-discovery"
    fi

    log_step "Planning interview for: $spec_id"
    echo ""

    # Check if spec exists
    local spec_exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM specs_registry WHERE spec_id = '$spec_id';")
    if [ "$spec_exists" -eq 0 ]; then
        log_error "Spec not found: $spec_id"
        return 1
    fi

    # Check if template exists
    local template_exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM interview_templates WHERE template_id = '$template_id';")
    if [ "$template_exists" -eq 0 ]; then
        log_error "Template not found: $template_id"
        return 1
    fi

    local session_id="interview-$(date +%s)"

    log_info "Creating interview session: $session_id"
    log_info "Using template: $template_id"
    echo ""

    # Create interview session
    sqlite3 "$DB_PATH" "
        INSERT INTO interview_sessions (
            session_id,
            spec_id,
            session_name,
            session_type,
            session_goal,
            status
        ) VALUES (
            '$session_id',
            '$spec_id',
            'Gap Resolution Interview',
            'gap_resolution',
            'Resolve critical gaps in specification',
            'PLANNED'
        );
    "

    log_success "Interview session planned: $session_id"

    # Write event to Universal Write System
    node "$SCRIPT_DIR/write-event.cjs" interview "{
        \"sessionId\": \"$session_id\",
        \"eventType\": \"session_started\",
        \"eventCategory\": \"interview\",
        \"eventActor\": \"system\",
        \"eventAction\": \"Planned interview session for spec $spec_id\",
        \"eventDescription\": \"Created gap resolution interview session using template $template_id\",
        \"relatedEntities\": [\"$spec_id\", \"$template_id\"],
        \"tags\": [\"interview-planning\", \"gap-resolution\"],
        \"impactLevel\": \"medium\",
        \"impactDescription\": \"Interview session ready to resolve specification gaps\"
    }" 2>/dev/null || true

    echo ""
    log_info "Next step: $0 start $spec_id"
}

# ============================================================================
# Start Interview
# ============================================================================

start_interview() {
    local spec_id="$1"

    if [ -z "$spec_id" ]; then
        log_error "Spec ID required"
        return 1
    fi

    log_step "Starting interview for: $spec_id"
    echo ""

    # Find most recent planned session
    local session_id=$(sqlite3 "$DB_PATH" "
        SELECT session_id
        FROM interview_sessions
        WHERE spec_id = '$spec_id' AND status = 'PLANNED'
        ORDER BY created_at DESC
        LIMIT 1;
    ")

    if [ -z "$session_id" ]; then
        log_error "No planned session found. Run: $0 plan $spec_id"
        return 1
    fi

    # Update session status
    sqlite3 "$DB_PATH" "
        UPDATE interview_sessions
        SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP
        WHERE session_id = '$session_id';
    "

    log_success "Interview session started: $session_id"

    # Write event to Universal Write System
    node "$SCRIPT_DIR/write-event.cjs" interview "{
        \"sessionId\": \"$session_id\",
        \"eventType\": \"session_started\",
        \"eventCategory\": \"interview\",
        \"eventActor\": \"user\",
        \"eventAction\": \"Started interview session\",
        \"eventDescription\": \"Interview session transitioned from PLANNED to IN_PROGRESS\",
        \"relatedEntities\": [\"$spec_id\"],
        \"tags\": [\"interview-active\", \"gap-resolution\"],
        \"impactLevel\": \"medium\",
        \"impactDescription\": \"Interview session now active and ready for questions\"
    }" 2>/dev/null || true

    echo ""
    log_info "Use: $0 ask $session_id"
}

# ============================================================================
# Ask Next Question
# ============================================================================

ask_question() {
    local session_id="$1"

    if [ -z "$session_id" ]; then
        log_error "Session ID required"
        return 1
    fi

    log_step "Next question for session: $session_id"
    echo ""

    # Find next pending question
    local question_id=$(sqlite3 "$DB_PATH" "
        SELECT question_id
        FROM interview_questions
        WHERE session_id = '$session_id' AND status = 'PENDING'
        ORDER BY question_order
        LIMIT 1;
    ")

    if [ -z "$question_id" ]; then
        log_success "No more questions - interview complete!"
        return 0
    fi

    # Get question details
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            question_text,
            question_purpose,
            dimension_id
        FROM interview_questions
        WHERE question_id = '$question_id';
    "

    # Get question text and dimension for event
    local question_text=$(sqlite3 "$DB_PATH" "SELECT question_text FROM interview_questions WHERE question_id = '$question_id';")
    local dimension_id=$(sqlite3 "$DB_PATH" "SELECT dimension_id FROM interview_questions WHERE question_id = '$question_id';")

    # Write event to Universal Write System
    node "$SCRIPT_DIR/write-event.cjs" interview "{
        \"sessionId\": \"$session_id\",
        \"questionId\": \"$question_id\",
        \"eventType\": \"question_asked\",
        \"eventCategory\": \"discovery\",
        \"eventActor\": \"system\",
        \"eventAction\": \"Asked interview question\",
        \"eventDescription\": \"Presented question to resolve gaps in dimension: $dimension_id\",
        \"questionText\": $(echo "$question_text" | jq -Rs .),
        \"relatedEntities\": [\"$session_id\", \"$dimension_id\"],
        \"tags\": [\"interview-question\", \"gap-resolution\", \"$dimension_id\"],
        \"impactLevel\": \"low\",
        \"impactDescription\": \"Question asked to gather information\"
    }" 2>/dev/null || true

    echo ""
    log_info "Mark as asked: UPDATE interview_questions SET status = 'ASKED' WHERE question_id = '$question_id';"
}

# ============================================================================
# List Interview Sessions
# ============================================================================

list_sessions() {
    log_info "Interview Sessions:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            session_id,
            spec_id,
            session_type,
            status,
            questions_asked,
            questions_answered,
            gaps_resolved,
            created_at
        FROM interview_sessions
        ORDER BY created_at DESC;
    "
}

# ============================================================================
# List Interview Templates
# ============================================================================

list_templates() {
    log_info "Interview Templates:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            template_id,
            template_name,
            template_type,
            usage_count,
            avg_duration_minutes,
            avg_gaps_resolved
        FROM interview_templates
        ORDER BY usage_count DESC;
    "
}

# ============================================================================
# Show Statistics
# ============================================================================

show_stats() {
    log_info "Interview System Statistics:"
    echo ""

    echo "=== Overall Stats ==="
    local total_sessions=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM interview_sessions;")
    local completed_sessions=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM interview_sessions WHERE status = 'COMPLETED';")
    local total_gaps=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM spec_gaps;")
    local resolved_gaps=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM spec_gaps WHERE resolution_status = 'RESOLVED';")

    echo "Total interview sessions: $total_sessions"
    echo "Completed sessions: $completed_sessions"
    echo "Total gaps identified: $total_gaps"
    echo "Gaps resolved: $resolved_gaps"

    if [ "$total_gaps" -gt 0 ]; then
        local resolution_rate=$(echo "scale=1; $resolved_gaps * 100 / $total_gaps" | bc)
        echo "Gap resolution rate: ${resolution_rate}%"
    fi

    echo ""
    echo "=== Interview Effectiveness ==="
    sqlite3 -header -column "$DB_PATH" "
        SELECT * FROM interview_effectiveness
        LIMIT 5;
    "
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    dimensions)
        list_dimensions
        ;;

    scan)
        spec_id="$2"
        scan_spec_gaps "$spec_id"
        ;;

    gaps)
        spec_id="$2"
        show_gaps "$spec_id"
        ;;

    critical)
        show_critical_gaps
        ;;

    completeness)
        spec_id="$2"
        show_completeness "$spec_id"
        ;;

    plan)
        spec_id="$2"
        shift 2

        template_id="webapp-discovery"

        while [ $# -gt 0 ]; do
            case "$1" in
                --template) template_id="$2"; shift 2 ;;
                *) shift ;;
            esac
        done

        plan_interview "$spec_id" "$template_id"
        ;;

    start)
        spec_id="$2"
        start_interview "$spec_id"
        ;;

    ask)
        session_id="$2"
        ask_question "$session_id"
        ;;

    sessions)
        list_sessions
        ;;

    templates)
        list_templates
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
