# 📊 GIT INTELLIGENCE REPORT SCHEMA SPECIFICATION

**Purpose:** Complete specification for machine-readable and human-readable reports
**Version:** 1.0.0
**Date:** 2025-10-16
**Integration:** Central-MCP dashboard + email + API

---

## 🎯 REPORT TYPES

### 1. HOURLY SECURITY SCAN (JSON + Markdown)

**Frequency:** Every hour on the hour (00:00, 01:00, 02:00...)
**Format:** JSON (machine) + Markdown summary (human)
**Storage:** `~/.claude/SYSTEM/scans/hourly-scan-YYYYMMDD-HH00.json`

#### JSON Schema (Machine-Readable)

```json
{
  "report_type": "hourly_security_scan",
  "version": "1.0.0",
  "timestamp": "2025-10-16T23:00:00Z",
  "hour": "23:00",
  "environment": "MacBook|VM",

  "git_activity": {
    "total_repos": 44,
    "repos_scanned": 44,
    "total_commits": 31,
    "commits_by_type": {
      "agent": 0,
      "user": 5,
      "auto_sync": 26
    },
    "files_changed": 156,
    "lines_added": 2847,
    "lines_deleted": 493
  },

  "security_validation": {
    "status": "pass|warning|fail",
    "security_violations": 0,
    "unauthorized_commits": 0,
    "missing_signatures": 0,
    "suspicious_activity": [],
    "authorized_authors": ["leolech14", "leonardo.lech@gmail.com"],
    "all_commits_verified": true
  },

  "parallel_execution": {
    "agents_active_last_hour": 2,
    "agent_list": ["GLM-4.6 Agent 1", "GLM-4.6 Agent 2"],
    "concurrent_commits": 0,
    "merge_conflicts_detected": 0,
    "merge_commits": 0,
    "branch_conflicts": 0
  },

  "branch_health": {
    "total_branches": 52,
    "active_feature_branches": 3,
    "stale_branches": 12,
    "diverged_branches": 2,
    "unmerged_work": 5,
    "orphaned_branches": 0
  },

  "validation_results": {
    "total_checks": 176,
    "passed": 159,
    "warnings": 17,
    "errors": 2,
    "critical_issues": 0
  },

  "task_correlation": {
    "tasks_completed": 0,
    "commits_with_task_ids": 0,
    "correlation_rate": 1.0,
    "missing_commits": 0,
    "orphaned_commits": 0
  },

  "repositories": [
    {
      "name": "PROJECT_central-mcp",
      "status": "active",
      "uncommitted_changes": 0,
      "unpushed_commits": 1,
      "ahead": 1,
      "behind": 0,
      "last_commit": "2025-10-16T22:48:00Z",
      "health": "healthy"
    }
    // ... all 44 repos
  ],

  "system_health": {
    "overall_status": "healthy|degraded|critical",
    "health_score": 95,
    "issues": [],
    "recommendations": []
  },

  "metadata": {
    "scan_duration_ms": 2847,
    "next_scan": "2025-10-17T00:00:00Z",
    "report_file": "hourly-scan-20251016-2300.json"
  }
}
```

#### Markdown Summary (Human-Readable)

```markdown
# Hourly Security Scan - 23:00

**Time:** 2025-10-16 23:00:00
**Environment:** MacBook

## Quick Summary
- ✅ Security: PASSED (0 violations)
- ⚠️  Warnings: 17 issues
- ❌ Errors: 2 critical

## Git Activity
- Repos: 44 scanned
- Commits: 31 (26 auto-sync, 5 user)
- Files: 156 changed

## Parallel Agents
- Active: 2 agents (GLM-4.6 #1, #2)
- Conflicts: 0
- Merges: 0

## Issues
❌ PROJECT_lechworld: Diverged (45 ahead, 9 behind)
❌ PROJECT_lechworld copy: Diverged (7 ahead, 9 behind)
⚠️  17 repos with stale changes

## System Health: 95% ✅
```

---

### 2. DAILY ECOSYSTEM REPORT (Email + JSON)

**Frequency:** Daily at 06:30 AM
**Format:** Markdown email + JSON archive
**Storage:** `~/.claude/SYSTEM/reports/daily-report-YYYYMMDD.md`
**Email:** leonardo.lech@gmail.com

#### JSON Schema (Machine-Readable Archive)

```json
{
  "report_type": "daily_ecosystem_report",
  "version": "1.0.0",
  "date": "2025-10-16",
  "period": {
    "start": "2025-10-15T00:00:00Z",
    "end": "2025-10-16T00:00:00Z",
    "hours": 24
  },

  "executive_summary": {
    "total_commits": 87,
    "active_repos": 28,
    "tasks_completed": 5,
    "files_changed": 423,
    "health_score": 92,
    "status": "healthy"
  },

  "git_activity_24h": {
    "commits_by_hour": {
      "00": 0, "01": 0, "02": 3, "03": 12, "04": 8,
      // ... all 24 hours
      "23": 5
    },
    "commits_by_type": {
      "agent": 45,
      "user": 32,
      "auto_sync": 10
    },
    "top_active_repos": [
      {"name": "PROJECT_central-mcp", "commits": 15},
      {"name": "PROJECT_localbrain", "commits": 10},
      {"name": "PROJECT_obsidian", "commits": 8}
    ],
    "files_by_type": {
      "ts": 234,
      "md": 89,
      "json": 45,
      "sh": 23
    }
  },

  "security_summary_24h": {
    "total_scans": 24,
    "violations": 0,
    "warnings": 156,
    "unauthorized_attempts": 0,
    "security_score": 100,
    "critical_issues": []
  },

  "parallel_agent_analysis": {
    "unique_agents": ["Claude Sonnet 4.5", "GLM-4.6 Agent 1", "GLM-4.6 Agent 2"],
    "total_agent_commits": 45,
    "concurrent_executions": 12,
    "merge_operations": 3,
    "conflicts_resolved": 0,
    "conflicts_pending": 0
  },

  "task_completion_24h": {
    "tasks_completed": 5,
    "average_completion_time_hours": 3.2,
    "completion_rate": 0.83,
    "tasks_with_commits": 5,
    "tasks_without_commits": 0,
    "correlation_score": 1.0
  },

  "branch_workflow_24h": {
    "branches_created": 2,
    "branches_merged": 1,
    "branches_deleted": 1,
    "feature_branches_active": 3,
    "hotfix_branches": 0,
    "workflow_compliance": 0.95
  },

  "issues_warnings": {
    "critical": [
      {
        "repo": "PROJECT_lechworld",
        "issue": "Branch diverged",
        "severity": "critical",
        "action_required": "Manual merge"
      }
    ],
    "warnings": [
      {
        "repo": "PROJECT_localbrain",
        "issue": "Uncommitted changes 28 hours",
        "severity": "medium",
        "action_required": "Review and commit"
      }
    ],
    "resolved": []
  },

  "todays_plan": {
    "scheduled_tasks": [
      {
        "task_id": "T-CM-001",
        "name": "Fix VM TypeScript errors",
        "assigned_agent": "GLM-4.6 Agent 1",
        "priority": "P0-CRITICAL",
        "estimated_hours": 4
      }
    ],
    "focus_areas": [
      "TypeScript error elimination",
      "VM service restoration",
      "Knowledge pack expansion"
    ],
    "blocked_tasks": 0
  },

  "system_health": {
    "overall_score": 92,
    "status": "healthy",
    "vm_status": "degraded",
    "local_status": "healthy",
    "automation_status": "operational",
    "monitoring_status": "active"
  },

  "trends": {
    "commit_velocity_7d": [12, 15, 18, 23, 31, 28, 87],
    "health_score_7d": [88, 90, 92, 89, 91, 93, 92],
    "task_completion_7d": [3, 4, 2, 5, 6, 4, 5]
  },

  "metadata": {
    "report_generated": "2025-10-16T06:30:00Z",
    "generation_time_ms": 3842,
    "next_report": "2025-10-17T06:30:00Z",
    "emailed_to": "leonardo.lech@gmail.com"
  }
}
```

#### Email Format (Human-Readable)

```markdown
Subject: 📊 Daily Ecosystem Report - 2025-10-16

# 📊 DAILY ECOSYSTEM INTELLIGENCE REPORT

**Report Date:** 2025-10-16
**Period:** 2025-10-15 00:00 → 2025-10-16 00:00

---

## 🎯 EXECUTIVE SUMMARY

**Day at a Glance:**
- ✅ System Health: 92% (Healthy)
- 📊 Total Commits: 87 (28 repos active)
- ✅ Security: 100% (0 violations)
- ⚠️  Warnings: 156 across all scans
- ✅ Tasks Completed: 5 (correlation: 100%)

---

## 📈 GIT ACTIVITY (Last 24 Hours)

**Commit Distribution:**
- 🤖 Agent Commits: 45 (52%)
- 👤 User Commits: 32 (37%)
- 🔄 Auto-sync: 10 (11%)

**Most Active Repositories:**
1. PROJECT_central-mcp (15 commits)
2. PROJECT_localbrain (10 commits)
3. PROJECT_obsidian (8 commits)

**Activity Timeline:**
```
00-06: ▁▁▂▅▃▂ (23 commits)
06-12: ▂▃▅▇▆▄ (31 commits)
12-18: ▄▅▃▂▁▂ (18 commits)
18-00: ▃▅▆▄▃▂ (15 commits)
```

---

## 🔒 SECURITY VALIDATION

**24-Hour Security Summary:**
- ✅ Security Scans: 24 (one per hour)
- ✅ Violations: 0
- ✅ Unauthorized: 0
- ✅ All authors verified
- ⚠️  Warnings: 156 (mostly stale changes)

**Parallel Agent Safety:**
- 3 agents active (Claude, GLM-4.6 x2)
- 0 conflicts between agents
- All merges clean
- Branch workflow: 95% compliant

---

## 🎯 TASK & DEVELOPMENT PROGRESS

**Tasks Completed (Last 24 Hours):**
- T-CM-001: GitIntelligenceEngine fixes (Agent 1)
- T-CM-002: Database layer improvements (Agent 1)
- T-CM-003: Validation system deployment (Claude)
- T-CM-004: Report architecture (Claude)
- T-CM-005: Knowledge pack creation (Claude)

**Commit-Task Correlation:** 100% ✅
(All completed tasks have corresponding commits)

---

## ⚠️ ISSUES DETECTED

**Critical (2):**
- 🚨 PROJECT_lechworld: Branch diverged (manual merge required)
- 🚨 PROJECT_lechworld copy: Branch diverged

**Warnings (17):**
- ⚠️  PROJECT_localbrain: Stale changes (28 hours)
- ⚠️  PROJECT_2brainz: Stale changes (99 hours)
- ⚠️  15 more repos with stale changes

---

## 📅 TODAY'S PLAN

**Scheduled Tasks:**
1. **T-CM-006** (P0): Complete TypeScript fixes (GLM agents)
2. **T-CM-007** (P0): Deploy to VM
3. **T-CM-008** (P1): Fix diverged branches
4. **T-CM-009** (P2): Address stale changes

**Focus Areas:**
- VM service restoration
- TypeScript zero-error target
- Ecosystem cleanup

---

## 🔥 SYSTEM HEALTH

**Automation Status:**
- ✅ Hourly git sync: ACTIVE
- ✅ Security monitoring: OPERATIONAL
- ✅ Validation system: ENABLED
- ✅ Daily reports: SCHEDULED
- ⚠️  VM Central-MCP: Awaiting fixes

**Health Score: 92% (Healthy)**

---

*Report generated automatically by Central-MCP Intelligence System*
*Next report: 2025-10-17 06:30 AM*
*Questions? Reply to this email.*
```

---

### 3. GIT STATUS SNAPSHOT (JSON)

**Frequency:** On demand + hourly
**Format:** JSON only (for API/dashboard)
**Endpoint:** `GET /api/git/status`

```json
{
  "snapshot_type": "git_status",
  "timestamp": "2025-10-16T23:00:00Z",
  "environment": "MacBook",

  "repositories": [
    {
      "name": "PROJECT_central-mcp",
      "path": "/Users/lech/PROJECTS_all/PROJECT_central-mcp",
      "branch": {
        "current": "main",
        "upstream": "origin/main",
        "ahead": 1,
        "behind": 0,
        "diverged": false
      },
      "status": {
        "clean": false,
        "uncommitted_files": 3,
        "untracked_files": 1,
        "modified_files": 2,
        "deleted_files": 0
      },
      "commits": {
        "last_commit_hash": "4a53e9ea",
        "last_commit_time": "2025-10-16T22:48:00Z",
        "last_commit_author": "leolech14",
        "last_commit_message": "Daily + hourly intelligence reports",
        "hours_since_commit": 0.2
      },
      "remote": {
        "has_remote": true,
        "remote_url": "https://github.com/leolech14/PROJECT_central-mcp.git",
        "can_push": true,
        "can_pull": true
      },
      "health": {
        "status": "healthy|warning|critical",
        "score": 95,
        "issues": []
      }
    }
    // ... all 44 repos
  ],

  "aggregate": {
    "total_repos": 44,
    "healthy": 20,
    "warning": 22,
    "critical": 2,
    "with_changes": 24,
    "clean": 20,
    "ahead": 5,
    "behind": 2,
    "diverged": 2
  }
}
```

---

### 4. VALIDATION REPORT (JSON + Summary)

**Frequency:** After each hourly scan
**Format:** JSON detailed + text summary
**Storage:** `~/.claude/SYSTEM/validation/validation-YYYYMMDD-HH00.json`

```json
{
  "validation_type": "ecosystem_validation",
  "timestamp": "2025-10-16T23:00:00Z",
  "hour": "23:00",

  "security_layer": {
    "checks_performed": 44,
    "passed": 44,
    "failed": 0,
    "violations": [],
    "authorized_authors": ["leolech14", "leonardo.lech@gmail.com"],
    "commit_signatures_valid": 31,
    "commit_signatures_invalid": 0
  },

  "task_commit_correlation": {
    "checks_performed": 44,
    "passed": 44,
    "failed": 0,
    "tasks_completed": 0,
    "commits_for_tasks": 0,
    "orphaned_commits": 0,
    "missing_commits": 0,
    "correlation_score": 1.0
  },

  "branch_workflow": {
    "checks_performed": 44,
    "passed": 42,
    "warnings": 2,
    "failed": 0,
    "unusual_branches": ["PROJECT_999-x-ray-tool: secure-branch"],
    "compliance_score": 0.95
  },

  "sync_validation": {
    "checks_performed": 44,
    "passed": 40,
    "warnings": 4,
    "failed": 2,
    "diverged_repos": ["PROJECT_lechworld", "PROJECT_lechworld copy"],
    "stale_changes": 17,
    "sync_score": 0.91
  },

  "totality_audit": {
    "insights_with_specs": 0.95,
    "specs_with_tasks": 0.98,
    "tasks_with_commits": 1.0,
    "commits_with_validation": 0.87,
    "overall_completeness": 0.95
  },

  "verdict": {
    "passed": true,
    "overall_score": 95,
    "status": "healthy",
    "critical_issues": 0,
    "warnings": 17,
    "errors": 2,
    "recommendations": [
      "Merge diverged branches",
      "Commit stale changes",
      "Review unusual branches"
    ]
  }
}
```

---

### 5. AGENT ACTIVITY LOG (JSON)

**Frequency:** Continuous (appended on commits)
**Format:** JSONL (JSON Lines)
**Storage:** `~/.claude/SYSTEM/logs/agent-activity.jsonl`

```jsonl
{"timestamp":"2025-10-16T22:24:15Z","agent":"Claude Sonnet 4.5","repo":"PROJECT_central-mcp","action":"commit","commit_hash":"4a53e9ea","message":"Daily intelligence reports","files_changed":2}
{"timestamp":"2025-10-16T22:29:34Z","agent":"Auto-sync","repo":"PROJECT_minerals","action":"commit","commit_hash":"abc123","message":"Auto-sync: 2025-10-16 22:29","files_changed":1}
{"timestamp":"2025-10-16T22:35:00Z","agent":"GLM-4.6 Agent 1","repo":"central-mcp/src","action":"typescript_fix","files_modified":15,"errors_fixed":82}
```

---

## 🎨 FRONTEND CONFIGURATION INTERFACE

### Dashboard UI Specification

#### Page 1: Git Automation Settings

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    GIT AUTOMATION CONFIGURATION                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

SYNC SCHEDULE:
  [x] Enable hourly sync
      Schedule: [On the hour ▼] (00:00, 01:00, 02:00...)
      Repos: [PROJECT_* only ▼]
      Auto-commit: [x] Enabled
      Auto-push: [x] Enabled

  [x] Enable validation
      Run after: [x] Each sync
      Alert threshold: [5] errors
      Email alerts: [x] Enabled

DISCOVERY SETTINGS:
  Root directory: [/Users/lech/PROJECTS_all]
  Naming pattern: [PROJECT_*]
  Max depth: [1]
  Exclude patterns: [node_modules, .git, dist]

COMMIT CONFIGURATION:
  Author name: [leolech14]
  Author email: [leonardo.lech@gmail.com]
  Co-author: [x] Claude <noreply@anthropic.com>
  Message template: [🔄 Auto-sync: {timestamp}...]
  [Edit template...]

[Save Configuration]  [Reset to Defaults]  [Test Now]
```

#### Page 2: Validation Rules

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    VALIDATION RULE CONFIGURATION                          ║
╚═══════════════════════════════════════════════════════════════════════════╝

SECURITY LAYER:
  Authorized authors:
    • leolech14 [Remove]
    • leonardo.lech@gmail.com [Remove]
    [+ Add author]

  Required signatures (agent commits):
    [x] "🤖" emoji
    [x] "Agent-" prefix
    [x] Co-Authored-By: Claude
    [x] Task ID (T-XXX-XXX-XXX)

TASK CORRELATION:
  [x] Validate completed tasks have commits
  [x] Check commit timing vs task completion
  [x] Verify agent assignment matches
  Tolerance: [±30] minutes

BRANCH WORKFLOW:
  Allowed branch patterns:
    • main, master, develop [x]
    • feature/* [x]
    • fix/* [x]
    • hotfix/* [x]
    [+ Add pattern]

  [x] Warn on unusual branches
  [x] Detect direct commits to main
  [x] Monitor orphaned branches

SYNC VALIDATION:
  Stale change threshold: [24] hours
  [x] Alert on diverged branches
  [x] Monitor unpushed commits
  Max divergence: [10] commits

[Save Rules]  [Run Validation Now]
```

#### Page 3: Report Configuration

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                       REPORT CONFIGURATION                                ║
╚═══════════════════════════════════════════════════════════════════════════╝

DAILY REPORT:
  Schedule: Every day at [06]:[30]
  Email to: [leonardo.lech@gmail.com]
  [x] Include git activity
  [x] Include security summary
  [x] Include task completions
  [x] Include today's plan
  [x] Include health metrics

  Template: [Standard ▼]
  [Edit template...]

HOURLY SCAN:
  Schedule: [On the hour ▼]
  [x] Save JSON reports
  [x] Log activity
  Alert email if:
    Errors >= [5]
    Warnings >= [20]
    Security violations >= [1]

REPORT STORAGE:
  Reports: [~/.claude/SYSTEM/reports/]
  Scans: [~/.claude/SYSTEM/scans/]
  Logs: [~/.claude/SYSTEM/logs/]
  Retention: [30] days

[Save Configuration]  [View Sample Report]  [Send Test Email]
```

#### Page 4: Live Monitoring Dashboard

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    LIVE GIT ECOSYSTEM MONITOR                             ║
╚═══════════════════════════════════════════════════════════════════════════╝

SYSTEM STATUS:                          NEXT EVENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━
Automation:     ✅ ACTIVE               23:00 - Git sync (12 min)
Security:       ✅ OPERATIONAL          23:00 - Security scan
Validation:     ✅ ENABLED              06:30 - Daily report
VM Status:      ⚠️  DEGRADED

REPOSITORIES (44):                      LAST HOUR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━
Clean:          20 (45%)                Commits:   31
With changes:   24 (55%)                Auto-sync: 26
Diverged:       2  (5%)                 Warnings:  17
Stale (>24h):   17 (39%)                Errors:    2

[View Details]  [Run Sync Now]  [Run Validation]  [Refresh]

RECENT ACTIVITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
22:48  PROJECT_central-mcp      ✅ Committed + Pushed
22:29  PROJECT_airbnsearch      ✅ Committed + Pushed
22:29  PROJECT_minerals         ⚠️  Committed (push failed)
22:24  PROJECT_mapship          ✅ Committed + Pushed
[View all...]

VALIDATION ALERTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PROJECT_lechworld DIVERGED (45↑ 9↓) - Action required
⚠️  17 repos with stale changes - Auto-commit at next sync

[Dismiss]  [Take Action]  [View Report]
```

---

## 🔧 CONFIGURATION API SCHEMA

### Endpoints for Frontend

```typescript
// GET configuration
GET /api/git/config
Response: {
  sync: { enabled: boolean, schedule: string, repos: string[], ... },
  validation: { rules: ValidationRules[], thresholds: {...}, ... },
  reports: { daily: {...}, hourly: {...}, email: string, ... },
  discovery: { root: string, pattern: string, maxDepth: number }
}

// UPDATE configuration
POST /api/git/config
Body: {
  section: "sync|validation|reports|discovery",
  updates: { key: value, ... }
}

// TEST configuration
POST /api/git/test
Body: {
  test_type: "sync|validation|email|discovery"
}
Response: {
  success: boolean,
  results: {...},
  errors: []
}

// GET live status
GET /api/git/status/live
Response: {
  timestamp, repositories[], aggregate{}, next_sync, health
}

// TRIGGER actions
POST /api/git/actions/{action}
Actions: sync_now, validate_now, generate_report, send_email
```

---

## 📁 FILE STRUCTURE

```
Central-MCP/scripts/git-management/
├── ecosystem-git-auto-sync.sh       (execution)
├── git-status-tracker.sh            (status)
├── git-validation-system.sh         (validation)
├── hourly-security-scan.sh          (hourly scan)
├── daily-ecosystem-report.sh        (daily report)
├── REPORT_SCHEMA_SPECIFICATION.md   (this file)
└── README.md                        (index)

~/.claude/SYSTEM/
├── scans/
│   └── hourly-scan-YYYYMMDD-HH00.json
├── reports/
│   └── daily-report-YYYYMMDD.md
├── logs/
│   ├── local-git-sync.log
│   ├── hourly-security-scan.log
│   └── daily-report.log
└── state/
    └── git-validation-state.json
```

---

## 🎯 INTEGRATION WITH CENTRAL-MCP DASHBOARD

### Dashboard Components Needed

```typescript
// Components:
<GitAutomationConfig />     // Page 1
<ValidationRulesConfig />   // Page 2
<ReportConfig />            // Page 3
<LiveGitMonitor />          // Page 4

// Data flow:
Frontend → API → Config files → Scripts → Execution
Frontend ← API ← State files ← Scripts ← Results
```

---

**Complete report architecture ready for frontend integration!** 📊🎨

*Schema version: 1.0.0*
*Machine + Human readable formats defined*
*Frontend GUI specification included*
*Ready for Central-MCP dashboard implementation*
