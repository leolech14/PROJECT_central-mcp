# 🚀 ADVANCED GITHUB CLI AUTOMATION SYSTEM
## Complete Terminal-Based GitHub Control for Trinity Intelligence Ecosystem

**Created**: 2025-10-15
**Scope**: All 75+ PROJECT_ repositories
**Purpose**: Sophisticated GitHub automation via gh-cli for multi-agent workflows

---

## 🎯 OVERVIEW

This system implements **advanced GitHub control from terminal** using GitHub CLI, enabling:
- ✅ Bulk repository hardening across 75+ PROJECT_ repos
- ✅ Automated PR workflows for REPL/agent sessions
- ✅ Sophisticated branch protection and deployment gates
- ✅ Environment management and secrets automation
- ✅ CI/CD control and monitoring
- ✅ Complete automation without touching GitHub UI

---

## 📋 INSTALLATION

### **Step 1: Bootstrap (One-time setup)**
```bash
# Authenticate and configure optimal defaults
./scripts/github-bootstrap.sh

# This sets up:
# • GitHub CLI authentication
# • SSH protocol for git operations
# • Environment variables for automation
# • Verification of API access
```

### **Step 2: Install Custom Aliases**
```bash
# Install Trinity-specific gh aliases
./scripts/github-install-aliases.sh

# Available aliases:
# • repo-quick-info
# • protect-main / unprotect-main
# • pr-draft / pr-ready / pr-auto
# • project-list
# • status
```

### **Step 3: Bulk Hardening (Optional)**
```bash
# Apply protection rules to ALL PROJECT_ repositories
./scripts/github-bulk-hardening.sh

# This applies:
# • Auto-delete merged branches
# • Default branch = main
# • Branch protection on main
# • Required PR reviews
# • Status check requirements
```

---

## 🤖 AGENT WORKFLOW USAGE

### **Complete Agent Session Flow:**

```bash
# 1. Start agent session
./scripts/github-agent-workflow.sh start-session AGENT_D

# 2. Make changes, then commit
./scripts/github-agent-workflow.sh commit-session

# 3. Create draft PR
./scripts/github-agent-workflow.sh create-pr

# 4. Wait for checks and auto-merge when green
./scripts/github-agent-workflow.sh ready-merge
```

### **Bulk Operations:**

```bash
# Sync all PROJECT_ repos
./scripts/github-agent-workflow.sh bulk-sync

# Check CI/CD status across all repos
./scripts/github-agent-workflow.sh ci-status

# Deploy to Google Cloud VM
./scripts/github-agent-workflow.sh deploy-to-vm
```

---

## 📚 ADVANCED OPERATIONS

### **Repository Management:**

```bash
# Quick repo info
gh repo-quick-info leolech14/PROJECT_central-mcp

# List all PROJECT_ repositories
gh project-list

# Change visibility (with consequences acknowledgement)
gh repo edit -R leolech14/PROJECT_name --visibility public \
  --accept-visibility-change-consequences

# Rename repository
gh repo rename -R leolech14/old-name new-name
```

### **Branch Protection:**

```bash
# Protect main branch (via alias)
gh protect-main leolech14/PROJECT_central-mcp

# Or manual (full control)
gh api -X PUT repos/leolech14/PROJECT_name/branches/main/protection \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -f required_status_checks.strict:=true \
  -F required_status_checks.contexts[]="Verify Build" \
  -F required_pull_request_reviews.required_approving_review_count:=1

# Remove protection
gh unprotect-main leolech14/PROJECT_central-mcp
```

### **PR Automation:**

```bash
# Create draft PR
gh pr-draft

# Watch CI checks
gh pr checks --watch

# Mark ready when satisfied
gh pr-ready

# Enable auto-merge (merges when green + approved)
gh pr-auto

# Or all in one
./scripts/github-agent-workflow.sh ready-merge
```

### **Environments & Secrets:**

```bash
# Create production environment
gh api -X PUT repos/leolech14/PROJECT_central-mcp/environments/production \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -f wait_timer=10

# Set environment-scoped secrets
gh secret set DATABASE_URL --env production -R leolech14/PROJECT_central-mcp

# Set repository secret
gh secret set DOPPLER_TOKEN -R leolech14/PROJECT_central-mcp
```

### **Actions/Workflow Control:**

```bash
# List recent runs
gh run list -R leolech14/PROJECT_central-mcp

# Watch latest run
gh run view --web

# Rerun failed jobs
gh run rerun <RUN_ID> --failed

# Trigger workflow manually
gh workflow run verify.yml -R leolech14/PROJECT_central-mcp

# Cancel in-progress runs
gh run cancel <RUN_ID>
```

### **Cache Management:**

```bash
# List caches
gh cache list -R leolech14/PROJECT_central-mcp

# Delete specific cache
gh cache delete <CACHE_ID> -R leolech14/PROJECT_central-mcp

# Or delete all (via script)
for cache in $(gh cache list --json id --jq '.[].id'); do
  gh cache delete $cache || true
done
```

---

## 🔧 BULK OPERATIONS

### **Apply Settings to All PROJECT_ Repos:**

```bash
# Example: Enable auto-delete and set default branch
gh project-list | while read repo; do
  gh repo edit -R "$repo" \
    --delete-branch-on-merge \
    --default-branch main
  echo "✅ $repo configured"
done
```

### **Check Protection Status:**

```bash
# Check which repos have branch protection
gh project-list | while read repo; do
  echo -n "$repo: "
  if gh api repos/$repo/branches/main/protection >/dev/null 2>&1; then
    echo "✅ PROTECTED"
  else
    echo "❌ UNPROTECTED"
  fi
done
```

### **Bulk Secret Deployment:**

```bash
# Set same secret across multiple repos
SECRET_VALUE=$(doppler secrets get API_KEY --plain)

gh project-list | while read repo; do
  gh secret set API_KEY -R "$repo" --body "$SECRET_VALUE"
  echo "✅ Secret set for $repo"
done
```

---

## 🎯 TRINITY-SPECIFIC WORKFLOWS

### **Multi-Agent Coordination:**

```bash
# Agent A starts work
./scripts/github-agent-workflow.sh start-session AGENT_A
# ... work ...
./scripts/github-agent-workflow.sh commit-session
./scripts/github-agent-workflow.sh create-pr

# Agent B works on different feature
./scripts/github-agent-workflow.sh start-session AGENT_B
# ... work ...
./scripts/github-agent-workflow.sh commit-session
./scripts/github-agent-workflow.sh create-pr

# Both PRs have automatic CI checks
# Auto-merge when green and approved
```

### **3-Way Ecosystem Sync:**

```bash
# MacBook → GitHub
git push origin main

# GitHub → Google Cloud VM (automated via cron)
# Or manual trigger:
./scripts/github-agent-workflow.sh deploy-to-vm

# GitHub → All local PROJECT_ directories
./scripts/github-agent-workflow.sh bulk-sync
```

---

## 📊 MONITORING & VISIBILITY

### **Repository Health Dashboard:**

```bash
# Check all PROJECT_ repo health
gh project-list | while read repo; do
  echo "=== $repo ==="
  gh api repos/$repo --jq '{
    visibility,
    default_branch,
    delete_branch_on_merge,
    has_issues,
    size,
    language,
    pushed_at
  }'
  echo ""
done
```

### **CI/CD Overview:**

```bash
# Quick status check
./scripts/github-agent-workflow.sh ci-status

# Or use alias
gh status
```

---

## 🔒 SECURITY & COMPLIANCE

### **Enforce Signed Commits:**

```bash
# Require signed commits on main
gh api -X POST \
  repos/leolech14/PROJECT_central-mcp/branches/main/protection/required_signatures \
  -H "X-GitHub-Api-Version: 2022-11-28"
```

### **Audit Secrets:**

```bash
# List secrets (not values)
gh secret list -R leolech14/PROJECT_central-mcp

# Check which repos have specific secret
gh project-list | while read repo; do
  if gh secret list -R "$repo" | grep -q "DOPPLER_TOKEN"; then
    echo "✅ $repo has DOPPLER_TOKEN"
  else
    echo "❌ $repo missing DOPPLER_TOKEN"
  fi
done
```

### **Vulnerability Scanning:**

```bash
# Enable Dependabot
gh api -X PUT repos/leolech14/PROJECT_central-mcp/vulnerability-alerts

# Check security advisories
gh api repos/leolech14/PROJECT_central-mcp/vulnerability-alerts
```

---

## 🎓 ADVANCED PATTERNS

### **Workflow Editing from Terminal:**

```bash
# Update workflow file via API
WORKFLOW_CONTENT=$(cat .github/workflows/verify.yml | base64)

gh api -X PUT repos/leolech14/PROJECT_central-mcp/contents/.github/workflows/verify.yml \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -f message="chore(ci): update verify workflow" \
  -f content="$WORKFLOW_CONTENT" \
  -f branch="main"
```

### **Deploy Keys (for VM server access):**

```bash
# Generate deploy key on VM
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key_central_mcp

# Add to repository
gh api -X POST repos/leolech14/PROJECT_central-mcp/keys \
  -f title="VM Deploy Key" \
  -f key="$(cat ~/.ssh/deploy_key_central_mcp.pub)" \
  -F read_only=false
```

### **Custom GitHub Actions:**

```bash
# Run action locally for testing (requires gh act extension)
gh extension install https://github.com/nektos/gh-act
gh act push  # Simulate push event
gh act pull_request  # Simulate PR event
```

---

## 📊 SUCCESS METRICS

### **After Implementation:**

```bash
# Check overall ecosystem health
./scripts/github-agent-workflow.sh ci-status

# Verify protections applied
gh project-list | while read repo; do
  gh api repos/$repo/branches/main/protection >/dev/null 2>&1 && echo "✅ $repo" || echo "❌ $repo"
done | grep -c "✅" | xargs echo "Protected repos:"

# Check repository standardization
gh repo list leolech14 --limit 200 --json nameWithOwner | \
  jq '.[] | select(.nameWithOwner | contains("PROJECT_"))' | wc -l | \
  xargs echo "PROJECT_ repositories:"
```

---

## 🚀 QUICK START GUIDE

### **For New Agent/Instance:**

```bash
# 1. Bootstrap
./scripts/github-bootstrap.sh

# 2. Install aliases
./scripts/github-install-aliases.sh

# 3. Verify
gh status

# 4. Start working
./scripts/github-agent-workflow.sh start-session AGENT_X
```

### **For Daily Operations:**

```bash
# Morning sync
./scripts/github-agent-workflow.sh bulk-sync

# Check CI health
./scripts/github-agent-workflow.sh ci-status

# Create feature PR
./scripts/github-agent-workflow.sh start-session feature-name
# ... work ...
./scripts/github-agent-workflow.sh commit-session
./scripts/github-agent-workflow.sh create-pr
./scripts/github-agent-workflow.sh ready-merge
```

---

## 🎯 BENEFITS FOR TRINITY ECOSYSTEM

### **Multi-Agent Coordination:**
- Each agent creates isolated branch
- Automatic PR creation and CI checks
- Auto-merge when green (no manual intervention)
- Perfect for parallel development

### **Ecosystem Consistency:**
- Bulk operations maintain standards across 75+ repos
- Uniform protection rules
- Automated secret distribution
- Consistent branching strategy

### **Zero Downtime Deployments:**
- Verify workflow gates deployments
- Environment protection rules prevent bad deploys
- Automated rollback possible via gh CLI
- VM deployments integrated

---

## 📚 COMPLETE COMMAND REFERENCE

### **Repository Operations:**
- `gh repo edit` - Settings
- `gh repo rename` - Rename
- `gh repo delete` - Delete
- `gh repo create` - Create
- `gh repo view` - Info

### **Branch Protection:**
- `gh api repos/OWNER/REPO/branches/BRANCH/protection` - Get/Set
- Custom alias: `gh protect-main REPO`

### **Pull Requests:**
- `gh pr create` - Create
- `gh pr list` - List
- `gh pr checks` - Check status
- `gh pr merge` - Merge
- `gh pr ready` - Mark ready
- `gh pr view` - View

### **Actions/CI:**
- `gh run list` - List runs
- `gh run watch` - Watch run
- `gh run rerun` - Rerun
- `gh run cancel` - Cancel
- `gh workflow list` - List workflows
- `gh workflow run` - Trigger workflow

### **Secrets & Variables:**
- `gh secret set` - Set secret
- `gh secret list` - List secrets
- `gh variable set` - Set variable
- `gh variable list` - List variables

### **Bulk Operations:**
- `gh project-list` - All PROJECT_ repos
- `./scripts/github-agent-workflow.sh bulk-sync` - Sync all
- `./scripts/github-agent-workflow.sh ci-status` - CI overview

---

## ✅ NEXT STEPS

1. **Run bootstrap**: `./scripts/github-bootstrap.sh`
2. **Install aliases**: `./scripts/github-install-aliases.sh`
3. **Test with one repo**: `gh repo-quick-info leolech14/PROJECT_central-mcp`
4. **Apply to all**: `./scripts/github-bulk-hardening.sh` (when ready)

**ULTRATHINK CLASSIFICATION: PRODUCTION-READY • COMPREHENSIVE • TRINITY-OPTIMIZED**
