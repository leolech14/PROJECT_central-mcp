# 🚀 DEPLOYMENT VERIFICATION PROTOCOL

**Created:** 2025-10-11 23:45
**Purpose:** Official protocol for verifying, choosing, and deploying Central-MCP changes
**Status:** v1.0 - OFFICIAL PROTOCOL

---

## 📊 CURRENT STATE ANALYSIS

### Local Development Environment
```
Git Commit:  f68e8ce (Event-Driven Architecture)
Dist Build:  Oct 11 23:06 (OLD CODE)
Running:     node dist/index.js (PID 89933)
Database:    src/database/registry.db (0 bytes - EMPTY!)
```

### VM Production Environment
```
Host:        34.41.115.199 (GCP us-central1-a)
User:        lech_walesa2000
Path:        /home/lech_walesa2000/central-mcp
Status:      UNKNOWN (SSH key required)
```

### Integration Work Status
```
✅ Code:      11 systems coded (6,858 lines) in src/
✅ Migrations: 4 new migrations created (010-013)
❌ Built:     NOT compiled to dist/
❌ Database:  Migrations NOT applied (empty database)
❌ Running:   OLD code from Oct 11 23:06
❌ VM:        State unknown
```

---

## 🎯 DEPLOYMENT STRATEGY: LOCAL-FIRST DEVELOPMENT

### Philosophy: Local → Test → VM

**LOCAL = Development & Testing**
- All development happens locally
- TypeScript source in src/
- Local database for testing
- Fast iteration cycles
- Full control and debugging

**VM = Production**
- Stable, tested code only
- Built JavaScript in dist/
- Production database
- 24/7 uptime
- Auto-proactive loops running

### Current Reality
- ❌ Local system running OLD code
- ❌ Local database empty (no migrations applied)
- ❌ VM state unknown
- ⚠️  Integration work exists but not deployed ANYWHERE

---

## ✅ OFFICIAL VERIFICATION CHECKLIST

### Step 1: Verify Local State

```bash
# 1. Check current git commit
git log -1 --oneline

# 2. Check uncommitted changes
git status --short | grep "^M" | wc -l

# 3. Check dist/ build timestamp
ls -lh dist/index.js

# 4. Check database state
ls -lh src/database/registry.db
echo "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" | sqlite3 src/database/registry.db

# 5. Check running processes
ps aux | grep "node dist/index.js"

# 6. Check which migrations exist
ls -1 src/database/migrations/ | grep "^0[0-9][0-9]_"
```

**Expected Output:**
- Git commit hash
- Number of modified files
- Dist build timestamp vs src/ changes
- Database file size and table count
- Running process PID
- List of available migrations

### Step 2: Verify VM State (When SSH Available)

```bash
# 1. Check VM git commit
ssh lech_walesa2000@34.41.115.199 "cd central-mcp && git log -1 --oneline"

# 2. Check VM running processes
ssh lech_walesa2000@34.41.115.199 "pm2 list"

# 3. Check VM database state
ssh lech_walesa2000@34.41.115.199 "cd central-mcp && echo 'SELECT COUNT(*) FROM sqlite_master WHERE type=\"table\";' | sqlite3 src/database/registry.db"

# 4. Check VM dist/ timestamp
ssh lech_walesa2000@34.41.115.199 "cd central-mcp && ls -lh dist/index.js"

# 5. Check VM disk space
ssh lech_walesa2000@34.41.115.199 "df -h /home"
```

### Step 3: Compare Local vs VM

```bash
# Create comparison report
cat > DEPLOYMENT_COMPARISON.md << 'EOF'
# Local vs VM Comparison

## Git State
- Local:  [commit hash]
- VM:     [commit hash]
- Delta:  [commits behind/ahead]

## Database State
- Local:  [table count] tables
- VM:     [table count] tables
- Delta:  [missing migrations]

## Build State
- Local:  [dist/ timestamp]
- VM:     [dist/ timestamp]
- Delta:  [outdated? yes/no]

## Process State
- Local:  [running? PID]
- VM:     [running? PID]
EOF
```

---

## 🎯 DEPLOYMENT DECISION MATRIX

### When to Deploy to LOCAL

**✅ Deploy to LOCAL when:**
- Testing new features
- Running database migrations for first time
- Debugging integration issues
- Iterating on loop logic
- Need immediate feedback

**Steps:**
1. Build TypeScript → JavaScript
2. Apply database migrations
3. Restart local process
4. Verify with health checks
5. Test thoroughly

### When to Deploy to VM

**✅ Deploy to VM when:**
- Code tested and working locally
- Database migrations successful locally
- All tests passing
- Ready for 24/7 auto-proactive loops
- Production-quality code

**Steps:**
1. Commit and push to git
2. SSH to VM and pull changes
3. Build on VM
4. Apply database migrations
5. Restart with pm2
6. Verify health checks
7. Monitor logs for 10 minutes

### When to Deploy to BOTH

**✅ Deploy to BOTH when:**
- Major architecture changes (like 11 systems integration)
- Database schema updates
- Critical bug fixes
- Performance improvements
- Configuration changes

---

## 🔄 OFFICIAL DEPLOYMENT WORKFLOW

### Phase 1: LOCAL BUILD & TEST

```bash
# 1. Stop local process
pkill -f "node dist/index.js"

# 2. Build TypeScript
npx tsc

# 3. Apply database migrations
for migration in src/database/migrations/0{10,11,12,13}_*.sql; do
  echo "Applying $migration..."
  sqlite3 src/database/registry.db < "$migration"
done

# 4. Verify migrations applied
echo "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" | sqlite3 src/database/registry.db | wc -l

# 5. Start local process in background
nohup node dist/index.js > central-mcp.log 2>&1 &

# 6. Wait for startup
sleep 5

# 7. Check health
curl -s http://localhost:3000/health | jq .

# 8. Monitor logs
tail -f central-mcp.log
```

**Success Criteria:**
- ✅ Build completes without errors
- ✅ Database has 23+ tables
- ✅ Process starts and stays running
- ✅ Health check returns 200 OK
- ✅ Logs show loops starting

### Phase 2: LOCAL INTEGRATION TEST

```bash
# Test each system integration
# (Use INTEGRATION_TASK_MASTER_LIST.md tasks T-INT-015 through T-INT-033)

# Quick smoke tests:
# 1. Test model registry
curl -s http://localhost:3000/api/ai/models | jq .

# 2. Test git intelligence
git log -1 --format="%H %s" > test-commit.txt
# (System should detect and parse commit)

# 3. Test spec validation
# (Create test spec and verify validation)

# 4. Test totality verification
curl -s http://localhost:3000/api/totality/status | jq .
```

**Success Criteria:**
- ✅ All API endpoints respond
- ✅ Database queries succeed
- ✅ Loops execute without errors
- ✅ Systems integrate correctly

### Phase 3: COMMIT & PUSH

```bash
# 1. Stage changes
git add -A

# 2. Commit with descriptive message
git commit -m "🚀 INTEGRATION COMPLETE: All 11 systems wired and operational

✅ LLMOrchestrator initialized with 4 models
✅ GitIntelligenceEngine tracking commits
✅ AutoDeployer ready with 4-phase pipeline
✅ SpecLifecycleValidator with 4-layer system
✅ TotalityVerificationSystem operational
✅ AgentDeploymentOrchestrator for VM agents
✅ All systems integrated into AutoProactiveEngine
✅ Database migrations applied (010-013)
✅ Loop 9 (GitPushMonitor) registered
✅ End-to-end tests passing

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. Push to remote
git push origin main
```

### Phase 4: VM DEPLOYMENT (When SSH Available)

```bash
# 1. SSH to VM
ssh lech_walesa2000@34.41.115.199

# 2. Navigate to central-mcp
cd central-mcp

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies (if package.json changed)
npm install

# 5. Build TypeScript
npx tsc

# 6. Apply database migrations
for migration in src/database/migrations/0{10,11,12,13}_*.sql; do
  echo "Applying $migration..."
  sqlite3 src/database/registry.db < "$migration"
done

# 7. Verify migrations
echo "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" | sqlite3 src/database/registry.db

# 8. Restart with pm2
pm2 restart central-mcp

# 9. Check status
pm2 status
pm2 logs central-mcp --lines 50

# 10. Health check
curl -s http://localhost:3000/health | jq .

# 11. Monitor for 10 minutes
pm2 logs central-mcp --lines 0
```

**Success Criteria:**
- ✅ Git pull succeeds
- ✅ Build completes
- ✅ Migrations apply successfully
- ✅ pm2 restart successful
- ✅ Health check passes
- ✅ Logs show normal operation
- ✅ No errors for 10 minutes

---

## 🚨 ROLLBACK PROCEDURE

### Local Rollback

```bash
# 1. Stop current process
pkill -f "node dist/index.js"

# 2. Checkout previous commit
git log --oneline | head -5  # Find previous good commit
git checkout [previous-commit-hash]

# 3. Rebuild
npx tsc

# 4. Restart
nohup node dist/index.js > central-mcp.log 2>&1 &

# 5. Verify
curl http://localhost:3000/health
```

### VM Rollback

```bash
# 1. SSH to VM
ssh lech_walesa2000@34.41.115.199

# 2. Navigate to central-mcp
cd central-mcp

# 3. Stop pm2
pm2 stop central-mcp

# 4. Checkout previous commit
git log --oneline | head -5
git checkout [previous-commit-hash]

# 5. Rebuild
npx tsc

# 6. Restart
pm2 restart central-mcp

# 7. Verify
curl http://localhost:3000/health
pm2 logs central-mcp --lines 50
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Before Any Deployment

- [ ] Code compiles without TypeScript errors
- [ ] All imports resolve correctly
- [ ] Database migrations tested locally
- [ ] No hardcoded credentials or secrets
- [ ] Environment variables documented
- [ ] Changes documented in code comments
- [ ] Git commit message descriptive
- [ ] TODO list updated with progress

### Before VM Deployment

- [ ] Local deployment successful
- [ ] Local integration tests passing
- [ ] Health checks returning 200 OK
- [ ] Loops running without errors
- [ ] Database queries succeed
- [ ] API endpoints responding correctly
- [ ] Logs show normal operation
- [ ] Performance acceptable
- [ ] No memory leaks detected
- [ ] Git committed and pushed

---

## 🎯 CURRENT INTEGRATION WORK: DEPLOYMENT PLAN

### Immediate Actions Required

**1. Apply Database Migrations to LOCAL**
```bash
# Database is currently EMPTY (0 bytes)
# Need to apply migrations 010-013

cd /Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp

# Create proper database file
touch src/database/registry.db

# Apply migrations
for migration in src/database/migrations/0{10,11,12,13}_*.sql; do
  echo "Applying $migration..."
  sqlite3 src/database/registry.db < "$migration"
done

# Verify
echo "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" | sqlite3 src/database/registry.db
```

**2. Build TypeScript to JavaScript**
```bash
# Current dist/ has OLD code from Oct 11 23:06
# Need to rebuild with NEW integration code

npx tsc

# Verify build
ls -lh dist/index.js
grep "LLMOrchestrator" dist/index.js
```

**3. Restart Local Process**
```bash
# Current process running OLD code
pkill -f "node dist/index.js"
nohup node dist/index.js > central-mcp.log 2>&1 &
tail -f central-mcp.log
```

**4. Run Integration Tests**
```bash
# Follow INTEGRATION_TASK_MASTER_LIST.md
# Tasks T-INT-015 through T-INT-033
```

**5. Deploy to VM (After Local Success)**
```bash
# Once local tests pass, deploy to VM
# Follow Phase 4: VM DEPLOYMENT above
```

---

## 📊 DEPLOYMENT TRACKING

### Track Each Deployment

```bash
# Create deployment log entry
cat >> DEPLOYMENT_LOG.md << EOF
## $(date '+%Y-%m-%d %H:%M:%S')

**Environment:** [LOCAL/VM/BOTH]
**Commit:** $(git log -1 --oneline)
**Changes:**
- [List key changes]

**Migrations Applied:**
- [List migrations]

**Status:** [SUCCESS/FAILED/ROLLED-BACK]
**Downtime:** [Duration]
**Issues:** [Any issues encountered]
**Verification:** [Health check results]

---
EOF
```

---

## ✅ SUCCESS METRICS

### Deployment Success Criteria

**Technical:**
- ✅ Zero build errors
- ✅ Zero runtime errors in first 10 minutes
- ✅ All health checks passing
- ✅ Database queries successful
- ✅ All loops executing
- ✅ API endpoints responding

**Operational:**
- ✅ Deployment time < 5 minutes
- ✅ Downtime < 30 seconds (VM only)
- ✅ Rollback plan tested and ready
- ✅ Documentation updated
- ✅ Team notified of changes

**Quality:**
- ✅ Code reviewed
- ✅ Tests passing
- ✅ Performance acceptable
- ✅ No regressions
- ✅ Monitoring in place

---

## 🎯 NEXT STEPS: IMMEDIATE DEPLOYMENT

### Current Priority: Deploy Integration Work to LOCAL

**Status:** 29/33 tasks remaining in INTEGRATION_TASK_MASTER_LIST.md
**Blocker:** Database empty, dist/ outdated, old code running
**Solution:** Follow Phase 1: LOCAL BUILD & TEST above

**Execute Now:**
1. Apply database migrations 010-013 to local database
2. Build TypeScript to dist/
3. Restart local process
4. Verify 11 systems initialized
5. Run integration tests T-INT-015 through T-INT-033
6. Deploy to VM when tests pass

---

## 📚 REFERENCE DOCUMENTS

- `INTEGRATION_TASK_MASTER_LIST.md` - 33 tasks for integration
- `INTEGRATION_PROGRESS_PHASE1_COMPLETE.md` - Current progress (needs update!)
- `SYSTEM_AUDIT_COMPLETE.md` - What exists vs what's integrated
- `MODEL_CORRECTIONS_COMPLETE.md` - AI model stack corrections

---

**🤖 Generated with Claude Code + Agent B (Sonnet 4.5)**
**Version:** 1.0
**Status:** OFFICIAL PROTOCOL - USE FOR ALL DEPLOYMENTS
