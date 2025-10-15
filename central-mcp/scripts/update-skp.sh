#!/bin/bash

# ============================================================================
# SKP Update Tool - Specialized Knowledge Pack Ingestion Pipeline
# ============================================================================
# Purpose: Update existing SKPs with new content from source folders
# Usage: ./update-skp.sh <SKP_ID> <SOURCE_PATH> [OPTIONS]
# Example: ./update-skp.sh ULTRATHINK_REALTIME_VOICE_MASTERY /path/to/new/docs
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CENTRAL_MCP_ROOT="$(dirname "$SCRIPT_DIR")"
SKP_DIR="$CENTRAL_MCP_ROOT/03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS"
TEMP_DIR="/tmp/central-mcp-skp"
DB_PATH="$CENTRAL_MCP_ROOT/data/registry.db"

# Command line arguments
SKP_ID="${1:-}"
SOURCE_PATH="${2:-}"
OPERATION="${3:-update}" # update, add, create
AGENT="${4:-system}"

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

# ============================================================================
# Validation
# ============================================================================

if [ -z "$SKP_ID" ]; then
    log_error "SKP_ID is required"
    echo ""
    echo "Usage: $0 <SKP_ID> <SOURCE_PATH> [OPERATION] [AGENT]"
    echo ""
    echo "Examples:"
    echo "  $0 ULTRATHINK_REALTIME_VOICE_MASTERY /path/to/docs"
    echo "  $0 ULTRATHINK_REALTIME_VOICE_MASTERY /path/to/docs update Agent-B"
    echo ""
    echo "Available SKPs:"
    sqlite3 "$DB_PATH" "SELECT skp_id, display_name, current_version FROM skp_registry;" 2>/dev/null || echo "  (Database not accessible)"
    exit 1
fi

if [ -z "$SOURCE_PATH" ]; then
    log_error "SOURCE_PATH is required"
    exit 1
fi

if [ ! -e "$SOURCE_PATH" ]; then
    log_error "SOURCE_PATH does not exist: $SOURCE_PATH"
    exit 1
fi

# ============================================================================
# Get Current SKP Info
# ============================================================================

log_info "Fetching current SKP info for: $SKP_ID"

SKP_INFO=$(sqlite3 "$DB_PATH" "SELECT file_path, current_version, file_count FROM skp_registry WHERE skp_id = '$SKP_ID';" 2>/dev/null)

if [ -z "$SKP_INFO" ]; then
    log_error "SKP not found in registry: $SKP_ID"
    exit 1
fi

CURRENT_ZIP_PATH="$CENTRAL_MCP_ROOT/$(echo "$SKP_INFO" | cut -d'|' -f1)"
CURRENT_VERSION=$(echo "$SKP_INFO" | cut -d'|' -f2)
CURRENT_FILE_COUNT=$(echo "$SKP_INFO" | cut -d'|' -f3)

log_success "Found SKP: $SKP_ID (version: $CURRENT_VERSION, files: $CURRENT_FILE_COUNT)"

# ============================================================================
# Prepare Temporary Workspace
# ============================================================================

log_info "Setting up temporary workspace..."

rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR/extract"
mkdir -p "$TEMP_DIR/new"
mkdir -p "$TEMP_DIR/merged"

# Extract current SKP
log_info "Extracting current SKP..."
unzip -q "$CURRENT_ZIP_PATH" -d "$TEMP_DIR/extract"

EXTRACTED_FILES=$(find "$TEMP_DIR/extract" -type f | wc -l | tr -d ' ')
log_success "Extracted $EXTRACTED_FILES files"

# ============================================================================
# Copy Source Files
# ============================================================================

log_info "Copying source files from: $SOURCE_PATH"

if [ -f "$SOURCE_PATH" ]; then
    # Single file
    cp "$SOURCE_PATH" "$TEMP_DIR/new/"
    NEW_FILE_COUNT=1
elif [ -d "$SOURCE_PATH" ]; then
    # Directory - copy all relevant files
    find "$SOURCE_PATH" -type f \( -name "*.md" -o -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.txt" \) -exec cp {} "$TEMP_DIR/new/" \;
    NEW_FILE_COUNT=$(find "$TEMP_DIR/new" -type f | wc -l | tr -d ' ')
else
    log_error "Invalid source path type"
    exit 1
fi

log_success "Copied $NEW_FILE_COUNT new files"

# ============================================================================
# Merge and Detect Changes
# ============================================================================

log_info "Merging content and detecting changes..."

# Copy all existing files to merged
cp -r "$TEMP_DIR/extract/"* "$TEMP_DIR/merged/" 2>/dev/null || true

# Track changes
FILES_ADDED=()
FILES_UPDATED=()
FILES_UNCHANGED=0

# Process new files
for new_file in "$TEMP_DIR/new/"*; do
    if [ ! -f "$new_file" ]; then
        continue
    fi

    filename=$(basename "$new_file")
    merged_path="$TEMP_DIR/merged/$filename"

    if [ -f "$merged_path" ]; then
        # File exists - check if content changed
        if ! cmp -s "$new_file" "$merged_path"; then
            cp "$new_file" "$merged_path"
            FILES_UPDATED+=("$filename")
            log_warning "Updated: $filename"
        else
            FILES_UNCHANGED=$((FILES_UNCHANGED + 1))
        fi
    else
        # New file
        cp "$new_file" "$merged_path"
        FILES_ADDED+=("$filename")
        log_success "Added: $filename"
    fi
done

TOTAL_UPDATED=${#FILES_UPDATED[@]}
TOTAL_ADDED=${#FILES_ADDED[@]}

log_info "Changes detected:"
log_info "  - Added: $TOTAL_ADDED"
log_info "  - Updated: $TOTAL_UPDATED"
log_info "  - Unchanged: $FILES_UNCHANGED"

if [ $TOTAL_ADDED -eq 0 ] && [ $TOTAL_UPDATED -eq 0 ]; then
    log_warning "No changes detected - SKP is already up to date"
    rm -rf "$TEMP_DIR"
    exit 0
fi

# ============================================================================
# Calculate New Version
# ============================================================================

# Parse semantic version
IFS='.' read -r -a VERSION_PARTS <<< "${CURRENT_VERSION//v/}"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Increment version based on change type
if [ $TOTAL_ADDED -gt 0 ]; then
    # New files = minor version bump
    MINOR=$((MINOR + 1))
    PATCH=0
else
    # Only updates = patch version bump
    PATCH=$((PATCH + 1))
fi

NEW_VERSION="v${MAJOR}.${MINOR}.${PATCH}"
log_info "Version: $CURRENT_VERSION → $NEW_VERSION"

# ============================================================================
# Create New SKP Archive
# ============================================================================

log_info "Creating new SKP archive..."

NEW_ZIP_NAME="${SKP_ID}_${NEW_VERSION}.zip"
NEW_ZIP_PATH="$SKP_DIR/$NEW_ZIP_NAME"

cd "$TEMP_DIR/merged"
zip -q -r "$NEW_ZIP_PATH" .
cd - > /dev/null

NEW_FILE_SIZE=$(stat -f%z "$NEW_ZIP_PATH" 2>/dev/null || stat -c%s "$NEW_ZIP_PATH")
NEW_FILE_COUNT=$(find "$TEMP_DIR/merged" -type f | wc -l | tr -d ' ')

log_success "Created: $NEW_ZIP_NAME ($NEW_FILE_SIZE bytes, $NEW_FILE_COUNT files)"

# ============================================================================
# Update Database
# ============================================================================

log_info "Updating database..."

# Build JSON arrays for files
ADDED_JSON=$(printf '%s\n' "${FILES_ADDED[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
UPDATED_JSON=$(printf '%s\n' "${FILES_UPDATED[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]")

# Calculate total words (approximate)
TOTAL_WORDS=$(find "$TEMP_DIR/merged" -type f -name "*.md" -exec wc -w {} + | tail -1 | awk '{print $1}')

# Generate changelog
CHANGELOG="Added $TOTAL_ADDED files, updated $TOTAL_UPDATED files."
if [ $TOTAL_ADDED -gt 0 ]; then
    CHANGELOG="$CHANGELOG New files: ${FILES_ADDED[*]}."
fi
if [ $TOTAL_UPDATED -gt 0 ]; then
    CHANGELOG="$CHANGELOG Updated files: ${FILES_UPDATED[*]}."
fi

# Update registry
sqlite3 "$DB_PATH" <<SQL
-- Update main registry
UPDATE skp_registry
SET current_version = '$NEW_VERSION',
    file_path = '03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/$NEW_ZIP_NAME',
    file_size = $NEW_FILE_SIZE,
    file_count = $NEW_FILE_COUNT,
    total_words = $TOTAL_WORDS,
    updated_at = CURRENT_TIMESTAMP
WHERE skp_id = '$SKP_ID';

-- Insert version history
INSERT INTO skp_versions (
    skp_id,
    version,
    changelog,
    files_added,
    files_updated,
    created_by,
    file_path,
    file_size
) VALUES (
    '$SKP_ID',
    '$NEW_VERSION',
    '$CHANGELOG',
    '$ADDED_JSON',
    '$UPDATED_JSON',
    '$AGENT',
    '03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS/$NEW_ZIP_NAME',
    $NEW_FILE_SIZE
);

-- Log ingestion
INSERT INTO skp_ingestion_log (
    skp_id,
    operation,
    source_path,
    source_type,
    files_processed,
    success,
    created_by
) VALUES (
    '$SKP_ID',
    'update',
    '$SOURCE_PATH',
    '$([ -f "$SOURCE_PATH" ] && echo "file" || echo "folder")',
    $((TOTAL_ADDED + TOTAL_UPDATED)),
    TRUE,
    '$AGENT'
);
SQL

log_success "Database updated"

# ============================================================================
# Update README
# ============================================================================

log_info "Updating README.md..."

README_PATH="$SKP_DIR/README.md"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Add update note to README
if grep -q "### Version History" "$README_PATH" 2>/dev/null; then
    # Update existing history section
    sed -i.bak "/### Version History/a\\
\\
**$NEW_VERSION** ($TIMESTAMP)\\
- $CHANGELOG
" "$README_PATH"
else
    # Add new history section
    cat >> "$README_PATH" <<EOF

---

### Version History

**$NEW_VERSION** ($TIMESTAMP)
- $CHANGELOG
EOF
fi

log_success "README.md updated"

# ============================================================================
# Cleanup
# ============================================================================

log_info "Cleaning up..."
rm -rf "$TEMP_DIR"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "SKP UPDATE COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 SKP: $SKP_ID"
echo "📌 Version: $CURRENT_VERSION → $NEW_VERSION"
echo "📁 Archive: $NEW_ZIP_NAME"
echo "📊 Files: $NEW_FILE_COUNT ($NEW_FILE_SIZE bytes)"
echo "📝 Words: $TOTAL_WORDS"
echo ""
echo "📈 Changes:"
echo "  ✅ Added: $TOTAL_ADDED"
echo "  ✏️  Updated: $TOTAL_UPDATED"
echo "  📋 Unchanged: $FILES_UNCHANGED"
echo ""
echo "🔗 Location: $NEW_ZIP_PATH"
echo ""
log_info "To verify: unzip -l \"$NEW_ZIP_PATH\""
echo ""
