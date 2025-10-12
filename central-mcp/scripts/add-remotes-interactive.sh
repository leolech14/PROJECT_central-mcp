#!/bin/bash
# ADD GIT REMOTES INTERACTIVELY FOR SELECTED PROJECTS

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🔗 ADD GIT REMOTES FOR SELECTED PROJECTS               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PROJECTS_MISSING_REMOTES=(
  "PROJECT_profilepro"
  "PROJECT_youtube"
  "PROJECT_finops"
)

echo "Projects needing remotes:"
for proj in "${PROJECTS_MISSING_REMOTES[@]}"; do
  echo "  • $proj"
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ENTER GITHUB URLS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

declare -A REMOTES

for proj in "${PROJECTS_MISSING_REMOTES[@]}"; do
  echo "Enter GitHub URL for $proj:"
  echo "  (Format: https://github.com/USERNAME/REPO.git)"
  read -p "  URL: " url

  if [ -z "$url" ]; then
    echo "  ⚠️  Skipping $proj (no URL provided)"
  else
    REMOTES[$proj]=$url
    echo "  ✅ Saved: $url"
  fi
  echo ""
done

if [ ${#REMOTES[@]} -eq 0 ]; then
  echo "No remotes to add. Exiting."
  exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 ADDING REMOTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for proj in "${!REMOTES[@]}"; do
  url="${REMOTES[$proj]}"
  project_path="/Users/lech/PROJECTS_all/$proj"

  echo "📍 $proj:"
  cd "$project_path"

  # Remove existing origin if it exists
  if git remote get-url origin >/dev/null 2>&1; then
    echo "  🔄 Removing existing origin..."
    git remote remove origin
  fi

  # Add new origin
  git remote add origin "$url"
  echo "  ✅ Remote added: $url"

  # Verify
  if git remote get-url origin >/dev/null 2>&1; then
    echo "  ✅ Verified: $(git remote get-url origin)"
  else
    echo "  ❌ Failed to verify remote"
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ REMOTES ADDED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "   1. Commit changes in each project"
echo "   2. Push to remotes"
echo "   3. VM agents will clone from these remotes"
echo ""
