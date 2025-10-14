#!/bin/bash
# CLEANUP PROJECTS_all FOR GIT SYNC
# Remove heavy build artifacts, keep only source code

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🧹 CLEANUP PROJECTS_all FOR GIT SYNC                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PROJECTS_DIR="/Users/lech/PROJECTS_all"

# Patterns to remove (heavy artifacts)
CLEANUP_PATTERNS=(
  "node_modules"
  ".next"
  "dist"
  "build"
  "coverage"
  ".turbo"
  ".vercel"
  ".cache"
  "*.log"
  ".DS_Store"
  "__pycache__"
  "*.pyc"
  ".pytest_cache"
  ".venv"
  "venv"
)

# Calculate current size
echo "📊 Calculating current size..."
BEFORE_SIZE=$(du -sh "$PROJECTS_DIR" 2>/dev/null | awk '{print $1}')
echo "Current size: $BEFORE_SIZE"
echo ""

# Dry run first
echo "🔍 DRY RUN: Finding files to remove..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL_TO_REMOVE=0
for pattern in "${CLEANUP_PATTERNS[@]}"; do
  COUNT=$(find "$PROJECTS_DIR" -name "$pattern" -type d 2>/dev/null | wc -l | tr -d ' ')
  if [ $COUNT -gt 0 ]; then
    echo "Found $COUNT directories matching: $pattern"
    TOTAL_TO_REMOVE=$((TOTAL_TO_REMOVE + COUNT))
  fi
done

echo ""
echo "Total directories to remove: $TOTAL_TO_REMOVE"
echo ""

if [ $TOTAL_TO_REMOVE -eq 0 ]; then
  echo "✨ Already clean! No cleanup needed."
  exit 0
fi

# Show estimated savings
echo "💾 Estimating space savings..."
ESTIMATED_SAVINGS=0
for pattern in "${CLEANUP_PATTERNS[@]}"; do
  SIZE=$(find "$PROJECTS_DIR" -name "$pattern" -type d -exec du -sh {} + 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
  ESTIMATED_SAVINGS=$((ESTIMATED_SAVINGS + SIZE))
done

echo "Estimated space to recover: ~$ESTIMATED_SAVINGS (rough estimate)"
echo ""

# Confirm
read -p "Proceed with cleanup? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "Cancelled"
  exit 0
fi

echo ""
echo "🧹 CLEANING UP..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Remove each pattern
for pattern in "${CLEANUP_PATTERNS[@]}"; do
  echo "Removing: $pattern"
  find "$PROJECTS_DIR" -name "$pattern" -type d -exec rm -rf {} + 2>/dev/null || true
done

echo ""
echo "✅ Cleanup complete!"
echo ""

# Calculate new size
echo "📊 Calculating new size..."
AFTER_SIZE=$(du -sh "$PROJECTS_DIR" 2>/dev/null | awk '{print $1}')
echo "New size: $AFTER_SIZE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ CLEANUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before: $BEFORE_SIZE"
echo "After:  $AFTER_SIZE"
echo ""
echo "📋 Next Steps:"
echo "   1. Ensure projects have git remotes configured"
echo "   2. Push all projects to git"
echo "   3. Agents will clone from git on VM"
echo "   4. Git becomes sync mechanism!"
echo ""
