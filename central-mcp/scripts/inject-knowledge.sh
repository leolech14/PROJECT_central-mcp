#!/bin/bash

# ============================================================================
# KNOWLEDGE INJECTION SYSTEM - Automatic Context Provision
# ============================================================================
# Purpose: Inject knowledge needed to operate in Central-MCP ecosystem
# Usage: ./inject-knowledge.sh [OPTIONS]
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
OUTPUT_DIR="$CENTRAL_MCP_ROOT/.injected_knowledge"

# Create output directory
mkdir -p "$OUTPUT_DIR"

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
${GREEN}🧠 KNOWLEDGE INJECTION SYSTEM${NC}
${CYAN}═══════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
  $0 [MODE] [OPTIONS]

${YELLOW}MODES:${NC}
  ${GREEN}auto${NC}         Automatic injection based on agent role and context
  ${GREEN}template${NC}     Inject using a pre-configured template
  ${GREEN}custom${NC}       Custom knowledge injection (specify items)
  ${GREEN}onboard${NC}      Full onboarding knowledge package
  ${GREEN}status${NC}       Show agent knowledge state
  ${GREEN}history${NC}      Show injection history

${YELLOW}AUTO MODE OPTIONS:${NC}
  --agent <id>              Agent ID (Agent-A, Agent-B, etc.)
  --role <role>             Agent role (ui, backend, integration, design)
  --project <id>            Project context
  --task <type>             Task type (development, debugging, deployment)

${YELLOW}TEMPLATE MODE OPTIONS:${NC}
  --template <id>           Template ID (agent_onboarding_full, ui_development_focus, etc.)
  --agent <id>              Agent ID

${YELLOW}CUSTOM MODE OPTIONS:${NC}
  --agent <id>              Agent ID (required)
  --skp <ids>               SKP IDs (comma-separated)
  --spec <ids>              Spec IDs (comma-separated)
  --tool <ids>              Tool IDs (comma-separated)

${YELLOW}OUTPUT OPTIONS:${NC}
  --format <fmt>            Output format: markdown, json, yaml, text (default: markdown)
  --output <path>           Output file path (default: auto-generated)
  --delivery <method>       Delivery method: file, stdout, clipboard

${YELLOW}EXAMPLES:${NC}
  ${CYAN}# Auto-inject for Agent-B on Central-MCP project${NC}
  $0 auto --agent Agent-B --role design --project central-mcp

  ${CYAN}# Full onboarding package${NC}
  $0 onboard --agent Agent-A

  ${CYAN}# Inject using template${NC}
  $0 template --template ui_development_focus --agent Agent-A

  ${CYAN}# Custom injection${NC}
  $0 custom --agent Agent-C --skp ULTRATHINK_REALTIME_VOICE_MASTERY --spec CMCP-AUTO-PROACTIVE-010

  ${CYAN}# Check agent knowledge status${NC}
  $0 status --agent Agent-B

  ${CYAN}# View injection history${NC}
  $0 history --agent Agent-B --limit 10

${CYAN}═══════════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================================================
# Extract SKP Knowledge
# ============================================================================

extract_skp_knowledge() {
    local skp_id="$1"
    local output=""

    # Get SKP info
    local skp_info=$(sqlite3 "$DB_PATH" "SELECT display_name, current_version, file_path FROM skp_registry WHERE skp_id = '$skp_id';")

    if [ -z "$skp_info" ]; then
        return
    fi

    local display_name=$(echo "$skp_info" | cut -d'|' -f1)
    local version=$(echo "$skp_info" | cut -d'|' -f2)
    local file_path=$(echo "$skp_info" | cut -d'|' -f3)

    output+="## 📦 SKP: $display_name ($version)\n\n"

    # Extract key files from SKP
    if [ -f "$CENTRAL_MCP_ROOT/$file_path" ]; then
        # List contents
        output+="**Contents:**\n"
        output+=$(unzip -l "$CENTRAL_MCP_ROOT/$file_path" | awk 'NR>3 {if (NR>3 && last) print "- " last; last=$NF}' | head -20)
        output+="\n\n"

        # Extract README if exists
        local readme=$(unzip -p "$CENTRAL_MCP_ROOT/$file_path" "README.md" 2>/dev/null || echo "")
        if [ -n "$readme" ]; then
            output+="**Overview:**\n\`\`\`\n$readme\n\`\`\`\n\n"
        fi
    fi

    echo -e "$output"
}

# ============================================================================
# Extract Spec Knowledge
# ============================================================================

extract_spec_knowledge() {
    local spec_id="$1"
    local output=""

    # Get spec info
    local spec_info=$(sqlite3 "$DB_PATH" "SELECT title, category, status, priority, file_path FROM specs_registry WHERE spec_id = '$spec_id';")

    if [ -z "$spec_info" ]; then
        return
    fi

    local title=$(echo "$spec_info" | cut -d'|' -f1)
    local category=$(echo "$spec_info" | cut -d'|' -f2)
    local status=$(echo "$spec_info" | cut -d'|' -f3)
    local priority=$(echo "$spec_info" | cut -d'|' -f4)
    local file_path=$(echo "$spec_info" | cut -d'|' -f5)

    output+="## 📋 SPEC: $title [$priority]\n\n"
    output+="**Category:** $category | **Status:** $status\n\n"

    # Extract spec content if file exists
    if [ -f "$CENTRAL_MCP_ROOT/$file_path" ]; then
        output+="**Content:**\n\`\`\`\n"
        output+=$(head -100 "$CENTRAL_MCP_ROOT/$file_path")
        output+="\n\`\`\`\n\n"
    fi

    echo -e "$output"
}

# ============================================================================
# Extract Tool Knowledge
# ============================================================================

extract_tool_knowledge() {
    local tool_id="$1"
    local output=""

    # Get tool info
    local tool_info=$(sqlite3 "$DB_PATH" "SELECT tool_name, category, description, location, deployed_url FROM tools_registry WHERE tool_id = '$tool_id';")

    if [ -z "$tool_info" ]; then
        return
    fi

    local tool_name=$(echo "$tool_info" | cut -d'|' -f1)
    local category=$(echo "$tool_info" | cut -d'|' -f2)
    local description=$(echo "$tool_info" | cut -d'|' -f3)
    local location=$(echo "$tool_info" | cut -d'|' -f4)
    local deployed_url=$(echo "$tool_info" | cut -d'|' -f5)

    output+="## 🛠️ TOOL: $tool_name\n\n"
    output+="**Category:** $category\n\n"
    output+="**Description:** $description\n\n"

    if [ -n "$location" ]; then
        output+="**Location:** \`$location\`\n\n"
    fi

    if [ -n "$deployed_url" ]; then
        output+="**Deployed URL:** $deployed_url\n\n"
    fi

    # Get capabilities
    local capabilities=$(sqlite3 "$DB_PATH" "SELECT capability FROM tool_capabilities WHERE tool_id = '$tool_id';")
    if [ -n "$capabilities" ]; then
        output+="**Capabilities:**\n"
        echo "$capabilities" | while read -r cap; do
            output+="- $cap\n"
        done
        output+="\n"
    fi

    echo -e "$output"
}

# ============================================================================
# Auto Injection Mode
# ============================================================================

auto_inject() {
    local agent_id="$1"
    local role="$2"
    local project="$3"

    log_step "Auto-injecting knowledge for $agent_id (role: $role, project: $project)"

    # Determine template based on role
    local template=""
    case "$role" in
        ui) template="ui_development_focus" ;;
        backend) template="backend_development_focus" ;;
        *) template="agent_onboarding_full" ;;
    esac

    # Use template injection
    inject_from_template "$agent_id" "$template"
}

# ============================================================================
# Template Injection Mode
# ============================================================================

inject_from_template() {
    local agent_id="$1"
    local template_id="$2"

    log_step "Injecting knowledge using template: $template_id"

    # Get template
    local template=$(sqlite3 "$DB_PATH" "SELECT template_name, skp_ids, spec_categories, tool_categories FROM injection_templates WHERE template_id = '$template_id';")

    if [ -z "$template" ]; then
        log_error "Template not found: $template_id"
        return 1
    fi

    local template_name=$(echo "$template" | cut -d'|' -f1)
    local skp_ids=$(echo "$template" | cut -d'|' -f2)
    local spec_categories=$(echo "$template" | cut -d'|' -f3)
    local tool_categories=$(echo "$template" | cut -d'|' -f4)

    log_info "Template: $template_name"

    # Start building knowledge package
    local knowledge_file="$OUTPUT_DIR/${agent_id}_knowledge_$(date +%Y%m%d_%H%M%S).md"

    {
        echo "# 🧠 Central-MCP Knowledge Package"
        echo ""
        echo "**Agent:** $agent_id"
        echo "**Template:** $template_name"
        echo "**Generated:** $(date)"
        echo ""
        echo "---"
        echo ""

        # Inject SKPs
        if [ "$skp_ids" != "[]" ] && [ -n "$skp_ids" ]; then
            echo "# 📚 Specialized Knowledge Packs (SKPs)"
            echo ""
            # Parse JSON array and extract SKPs (simplified - assumes format)
            local skp_list=$(echo "$skp_ids" | tr -d '[]"' | tr ',' '\n')
            for skp_id in $skp_list; do
                [ -n "$skp_id" ] && extract_skp_knowledge "$skp_id"
            done
        fi

        # Inject Specs by category
        if [ "$spec_categories" != "[]" ] && [ -n "$spec_categories" ]; then
            echo "# 📋 Specifications"
            echo ""
            local cat_list=$(echo "$spec_categories" | tr -d '[]"' | tr ',' '\n')
            for category in $cat_list; do
                [ -z "$category" ] && continue
                local specs=$(sqlite3 "$DB_PATH" "SELECT spec_id FROM specs_registry WHERE category = '$category' AND status = 'ACTIVE' LIMIT 5;")
                for spec_id in $specs; do
                    [ -n "$spec_id" ] && extract_spec_knowledge "$spec_id"
                done
            done
        fi

        # Inject Tools by category
        if [ "$tool_categories" != "[]" ] && [ -n "$tool_categories" ]; then
            echo "# 🛠️ Available Tools"
            echo ""
            local cat_list=$(echo "$tool_categories" | tr -d '[]"' | tr ',' '\n')
            for category in $cat_list; do
                [ -z "$category" ] && continue
                local tools=$(sqlite3 "$DB_PATH" "SELECT tool_id FROM tools_registry WHERE category = '$category' AND status = 'active' LIMIT 5;")
                for tool_id in $tools; do
                    [ -n "$tool_id" ] && extract_tool_knowledge "$tool_id"
                done
            done
        fi

        echo "---"
        echo ""
        echo "**End of Knowledge Package**"
    } > "$knowledge_file"

    # Count words and estimate tokens
    local word_count=$(wc -w < "$knowledge_file")
    local token_estimate=$((word_count * 4 / 3))

    # Log injection
    local knowledge_types='["skp","spec","tool"]'
    local knowledge_items='["'${skp_ids}'","'${spec_categories}'","'${tool_categories}'"]'

    sqlite3 "$DB_PATH" "INSERT INTO knowledge_injections (
        agent_id, injection_trigger, trigger_details, knowledge_types, knowledge_items,
        total_tokens, total_words, output_format, delivery_method, output_path
    ) VALUES (
        '$agent_id', 'template', '$template_id', '$knowledge_types', '$knowledge_items',
        $token_estimate, $word_count, 'markdown', 'file', '$knowledge_file'
    );"

    log_success "Knowledge injected!"
    log_info "Output file: $knowledge_file"
    log_info "Words: $word_count | Estimated tokens: $token_estimate"
    echo ""
    log_info "To view: cat $knowledge_file"
}

# ============================================================================
# Onboarding Mode
# ============================================================================

onboard_agent() {
    local agent_id="$1"

    log_step "Full onboarding for $agent_id"

    inject_from_template "$agent_id" "agent_onboarding_full"

    # Update agent knowledge state
    sqlite3 "$DB_PATH" "INSERT OR REPLACE INTO agent_knowledge_state (
        agent_id, is_onboarded, confidence_level, last_full_injection_at
    ) VALUES (
        '$agent_id', TRUE, 0.8, CURRENT_TIMESTAMP
    );"

    log_success "Agent $agent_id onboarded!"
}

# ============================================================================
# Status Mode
# ============================================================================

show_status() {
    local agent_id="$1"

    log_info "Knowledge status for $agent_id:"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            agent_id,
            is_onboarded,
            confidence_level,
            last_full_injection_at,
            updated_at
        FROM agent_knowledge_state
        WHERE agent_id = '$agent_id';
    "

    echo ""
    log_info "Recent injections:"
    sqlite3 -header -column "$DB_PATH" "
        SELECT
            injection_trigger,
            total_words,
            delivery_method,
            injected_at
        FROM knowledge_injections
        WHERE agent_id = '$agent_id'
        ORDER BY injected_at DESC
        LIMIT 5;
    "
}

# ============================================================================
# History Mode
# ============================================================================

show_history() {
    local agent_id="$1"
    local limit="${2:-10}"

    log_info "Injection history for $agent_id (last $limit):"
    echo ""

    sqlite3 -header -column "$DB_PATH" "
        SELECT
            injection_id,
            injection_trigger,
            knowledge_types,
            total_words,
            injected_at
        FROM knowledge_injections
        WHERE agent_id = '$agent_id'
        ORDER BY injected_at DESC
        LIMIT $limit;
    "
}

# ============================================================================
# Main
# ============================================================================

MODE="${1:-help}"

case "$MODE" in
    auto)
        agent_id="${2}"
        role="${3:-general}"
        project="${4:-}"
        if [ -z "$agent_id" ]; then
            log_error "Agent ID required"
            exit 1
        fi
        auto_inject "$agent_id" "$role" "$project"
        ;;

    template)
        template_id="${2}"
        agent_id="${3}"
        if [ -z "$template_id" ] || [ -z "$agent_id" ]; then
            log_error "Template ID and Agent ID required"
            exit 1
        fi
        inject_from_template "$agent_id" "$template_id"
        ;;

    onboard)
        agent_id="${2}"
        if [ -z "$agent_id" ]; then
            log_error "Agent ID required"
            exit 1
        fi
        onboard_agent "$agent_id"
        ;;

    status)
        agent_id="${2}"
        if [ -z "$agent_id" ]; then
            log_error "Agent ID required"
            exit 1
        fi
        show_status "$agent_id"
        ;;

    history)
        agent_id="${2}"
        limit="${3:-10}"
        if [ -z "$agent_id" ]; then
            log_error "Agent ID required"
            exit 1
        fi
        show_history "$agent_id" "$limit"
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
