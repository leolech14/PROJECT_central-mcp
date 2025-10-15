-- ============================================================================
-- CENTRAL-MCP TASKS - Remaining Git Consolidation + Integration Work
-- ============================================================================
-- Purpose: Insert actual tasks into Central-MCP database for coordination
-- Date: 2025-10-15
-- Project: PROJECT_central-mcp
-- ============================================================================

-- CRITICAL TASK 1: Delete Legacy Repositories
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-GIT-001',
    'Delete 4 Legacy GitHub Repositories',
    'B',
    'READY',
    'HIGH',
    'CLEANUP',
    'Day 1 (30 minutes)',
    '[]',
    '["finops deleted", "essential-minerals deleted", "map deleted", "central-mcp deleted"]',
    '["All 4 repos return 404 on gh repo view", "GitHub repo count reduced by 4", "No duplicate repositories remain"]',
    'GitHub (leolech14 account)',
    0.5,
    'central-mcp'
);

-- CRITICAL TASK 2: Fix VM Repository Synchronization
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-GIT-002',
    'Fix VM Synchronization with PROJECT_ Names',
    'D',
    'READY',
    'CRITICAL',
    'INTEGRATION',
    'Day 1 (30 minutes)',
    '[]',
    '["VM repos renamed to PROJECT_ format", "Git remotes updated", "Sync script working", "All 75 repos present on VM"]',
    '["ls on VM shows PROJECT_localbrain not LocalBrain", "git pull works from VM", "Sync script completes without errors", "VM repo count matches GitHub (75)"]',
    'Google Cloud VM (central-mcp-server)',
    0.5,
    'central-mcp'
);

-- TASK 3: Complete BATCH 6 Repository Creation
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-GIT-003',
    'Create 26 Missing GitHub Repositories (BATCH 6)',
    'B',
    'READY',
    'MEDIUM',
    'CONSOLIDATION',
    'Day 1-2 (2 hours)',
    '[]',
    '["26 new GitHub repositories created", "All have PROJECT_ prefix", "All initialized with local content", "Verification proof captured"]',
    '["26/26 repos exist on GitHub", "gh repo view succeeds for each", "All repos have initial commit", "Evidence files saved in evidence/ directory"]',
    'Local MacBook + GitHub',
    2.0,
    'central-mcp'
);

-- CRITICAL TASK 4: Connect Git Hooks to Central-MCP API
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-INT-001',
    'Integrate Git Hooks with Central-MCP Task API',
    'D',
    'READY',
    'CRITICAL',
    'INTEGRATION',
    'Day 1 (15 minutes)',
    '[]',
    '["Post-commit hook calls Central-MCP API", "Task status updates automatically", "Webhook integration working", "End-to-end test passing"]',
    '["Hook successfully POSTs to http://136.112.123.243:3000/api/tasks/complete", "Database tasks table updates on local commit", "No manual task status updates needed", "Test commit triggers Central-MCP update"]',
    '/Users/lech/PROJECTS_all/PROJECT_central-mcp/.git/hooks',
    0.25,
    'central-mcp'
);

-- TASK 5: Fix Deploy Workflow
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-CI-001',
    'Fix and Verify Deploy Workflow',
    'D',
    'READY',
    'HIGH',
    'CI_CD',
    'Day 1 (1 hour)',
    '[]',
    '["Deploy workflow passing", "VM deployment successful", "Service restarts verified", "Deployment script working"]',
    '["gh run shows deploy conclusion: success", "VM service active after deploy", "Dashboard accessible after deploy", "Zero downtime deployment"]',
    '.github/workflows/deploy.yml',
    1.0,
    'central-mcp'
);

-- TASK 6: Verify Data Integrity of Merged Repositories
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-VER-001',
    'Verify Data Integrity of 3 Merged Repositories',
    'B',
    'READY',
    'MEDIUM',
    'VERIFICATION',
    'Day 1 (30 minutes)',
    '["T-CM-GIT-001"]',
    '["PROJECT_finops size verified", "PROJECT_minerals size verified", "PROJECT_maps size verified", "File counts match expected", "Commit history preserved"]',
    '["PROJECT_finops size > 25MB", "PROJECT_minerals size > 1GB", "PROJECT_maps size > 60KB", "All commits from source repos present", "No data loss detected"]',
    'GitHub repositories',
    0.5,
    'central-mcp'
);

-- TASK 7: Connect Context Ingestion Pipeline
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-INT-002',
    'Activate Automatic Context Ingestion Pipeline',
    'C',
    'READY',
    'MEDIUM',
    'INTEGRATION',
    'Day 2 (30 minutes)',
    '["T-CM-INT-001"]',
    '["Ingestion API endpoint working", "Git commits trigger ingestion", "Context updates in database", "Knowledge base auto-updates"]',
    '["POST to /api/knowledge/ingest succeeds", "context_files table updates after commit", "Loop 9 detects and processes changes", "Dashboard shows updated context"]',
    'src/database/migrations/017_codebase_ingestion_pipeline.sql',
    0.5,
    'central-mcp'
);

-- META TASK: Use Central-MCP to Coordinate Above Tasks
INSERT INTO tasks (
    id, name, agent, status, priority, phase, timeline,
    dependencies, deliverables, acceptance_criteria, location,
    estimated_hours, project_id
) VALUES (
    'T-CM-META-001',
    'Test Central-MCP Autonomous Agent Coordination',
    'B',
    'READY',
    'CRITICAL',
    'VALIDATION',
    'Day 1 (1 hour)',
    '[]',
    '["Agent connects to Central-MCP", "Agent receives tasks", "Agent executes task", "Agent reports completion", "Central-MCP validates and updates", "Full lifecycle proven working"]',
    '["MCP bridge connection successful", "get_available_tasks returns tasks", "claim_task works", "complete_task updates database", "Dashboard reflects changes", "End-to-end test passes"]',
    'Complete Central-MCP ecosystem',
    1.0,
    'central-mcp'
);

-- ============================================================================
-- DEPENDENCY SETUP
-- ============================================================================

-- T-CM-VER-001 depends on T-CM-GIT-001 (verify after delete)
-- T-CM-INT-002 depends on T-CM-INT-001 (context ingestion needs hook integration)

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Tasks: 8
-- Critical Priority: 3 (T-CM-GIT-002, T-CM-INT-001, T-CM-META-001)
-- High Priority: 2 (T-CM-GIT-001, T-CM-CI-001)
-- Medium Priority: 3 (T-CM-GIT-003, T-CM-VER-001, T-CM-INT-002)
-- Estimated Total Time: 6.25 hours
-- Expected Completion: Day 1-2
-- ============================================================================
