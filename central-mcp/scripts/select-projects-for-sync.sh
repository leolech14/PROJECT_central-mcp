#!/bin/bash
# SELECT PROJECTS FOR GIT SYNC
# Import a few projects at a time, not all at once!

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    📋 SELECT PROJECTS FOR VM AGENT SYNC                   ║"
echo "║    Import gradually - test workflow with a few first!     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PROJECTS_DIR="/Users/lech/PROJECTS_all"
PROJECT_LIST_FILE="/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/SELECTED_PROJECTS.txt"

# Scan for projects
echo "🔍 Scanning for projects..."
echo ""

projects=()
while IFS= read -r dir; do
  if [ -d "$dir" ]; then
    PROJECT_NAME=$(basename "$dir")
    # Skip special directories
    if [[ ! "$PROJECT_NAME" =~ ^(node_modules|\.git|\.next|dist|build)$ ]]; then
      if [ -f "$dir/package.json" ] || [ -f "$dir/pyproject.toml" ] || [ -f "$dir/Cargo.toml" ]; then
        projects+=("$PROJECT_NAME")
      fi
    fi
  fi
done < <(find "$PROJECTS_DIR" -maxdepth 1 -type d)

echo "Found ${#projects[@]} projects:"
echo ""

# Display projects with numbers
for i in "${!projects[@]}"; do
  PROJECT_NAME="${projects[$i]}"
  HAS_GIT=""
  HAS_REMOTE=""
  
  if [ -d "$PROJECTS_DIR/$PROJECT_NAME/.git" ]; then
    HAS_GIT="✅ git"
    if git -C "$PROJECTS_DIR/$PROJECT_NAME" remote get-url origin >/dev/null 2>&1; then
      REMOTE=$(git -C "$PROJECTS_DIR/$PROJECT_NAME" remote get-url origin)
      HAS_REMOTE="🔗 $(basename $REMOTE .git)"
    else
      HAS_REMOTE="⚠️  no remote"
    fi
  else
    HAS_GIT="❌ no git"
    HAS_REMOTE=""
  fi
  
  printf "%3d) %-30s %s %s\n" $((i+1)) "$PROJECT_NAME" "$HAS_GIT" "$HAS_REMOTE"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SELECT PROJECTS TO SYNC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Enter project numbers (comma-separated, e.g., 1,3,5,7)"
echo "Or ranges (e.g., 1-4,7,9-11)"
echo "Or 'all' for everything (not recommended for first sync!)"
echo ""
read -p "Select projects: " selection

# Parse selection
selected_projects=()

if [ "$selection" = "all" ]; then
  selected_projects=("${projects[@]}")
else
  # Parse comma-separated values and ranges
  IFS=',' read -ra SELECTIONS <<< "$selection"
  for sel in "${SELECTIONS[@]}"; do
    if [[ $sel =~ ^([0-9]+)-([0-9]+)$ ]]; then
      # Range
      start=${BASH_REMATCH[1]}
      end=${BASH_REMATCH[2]}
      for ((i=start; i<=end; i++)); do
        if [ $i -gt 0 ] && [ $i -le ${#projects[@]} ]; then
          selected_projects+=("${projects[$((i-1))]}")
        fi
      done
    elif [[ $sel =~ ^[0-9]+$ ]]; then
      # Single number
      if [ $sel -gt 0 ] && [ $sel -le ${#projects[@]} ]; then
        selected_projects+=("${projects[$((sel-1))]}")
      fi
    fi
  done
fi

if [ ${#selected_projects[@]} -eq 0 ]; then
  echo "No projects selected. Exiting."
  exit 0
fi

echo ""
echo "✅ Selected ${#selected_projects[@]} projects:"
for proj in "${selected_projects[@]}"; do
  echo "   • $proj"
done
echo ""

# Save selection
mkdir -p "$(dirname "$PROJECT_LIST_FILE")"
printf "%s\n" "${selected_projects[@]}" > "$PROJECT_LIST_FILE"

echo "💾 Saved selection to: $PROJECT_LIST_FILE"
echo ""

# Check git status for each
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 CHECKING GIT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

NEEDS_SETUP=()
NEEDS_COMMIT=()
READY=()

for proj in "${selected_projects[@]}"; do
  PROJECT_PATH="$PROJECTS_DIR/$proj"
  
  if [ ! -d "$PROJECT_PATH/.git" ]; then
    echo "⚠️  $proj: No git repository"
    NEEDS_SETUP+=("$proj")
  elif ! git -C "$PROJECT_PATH" remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  $proj: No remote configured"
    NEEDS_SETUP+=("$proj")
  elif [ -n "$(git -C "$PROJECT_PATH" status --porcelain)" ]; then
    echo "📝 $proj: Has uncommitted changes"
    NEEDS_COMMIT+=("$proj")
  else
    echo "✅ $proj: Ready to sync"
    READY+=("$proj")
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SYNC READINESS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready to sync:       ${#READY[@]}"
echo "Need git/remote:     ${#NEEDS_SETUP[@]}"
echo "Need commit:         ${#NEEDS_COMMIT[@]}"
echo ""

# Offer to setup gitignore
if [ ${#selected_projects[@]} -gt 0 ]; then
  echo "📋 Next Steps:"
  echo ""
  echo "1. Setup .gitignore for selected projects:"
  for proj in "${selected_projects[@]}"; do
    echo "   cd $PROJECTS_DIR/$proj"
    if [ ! -f "$PROJECTS_DIR/$proj/.gitignore" ]; then
      echo "   # Create .gitignore (prevents node_modules, build/, etc from being committed)"
    fi
  done
  echo ""
  
  if [ ${#NEEDS_SETUP[@]} -gt 0 ]; then
    echo "2. Setup git for projects that need it:"
    for proj in "${NEEDS_SETUP[@]}"; do
      echo "   cd $PROJECTS_DIR/$proj"
      if [ ! -d "$PROJECTS_DIR/$proj/.git" ]; then
        echo "   git init"
      fi
      echo "   git remote add origin https://github.com/YOUR_USERNAME/$proj.git"
    done
    echo ""
  fi
  
  if [ ${#NEEDS_COMMIT[@]} -gt 0 ]; then
    echo "3. Commit changes:"
    for proj in "${NEEDS_COMMIT[@]}"; do
      echo "   cd $PROJECTS_DIR/$proj"
      echo "   git add ."
      echo "   git commit -m 'chore: prepare for VM agent sync'"
      echo "   git push"
    done
    echo ""
  fi
  
  echo "4. On VM, run agent-clone script to clone selected projects"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PROJECT SELECTION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Selected projects saved to: $PROJECT_LIST_FILE"
echo "   Agents will use this list to know which projects to clone"
echo ""
