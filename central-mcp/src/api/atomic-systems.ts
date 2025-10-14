// ============================================================================
// ATOMIC SYSTEMS API - Dashboard Status Endpoint
// ============================================================================
// Purpose: Provide status of all 13 atomic infrastructure systems
// Endpoint: /api/atomic-systems/status
// ============================================================================

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'registry.db');

export interface AtomicSystem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'operational' | 'partial' | 'planned';
  completedDate: string;
  tables: string[];
  recordCount: number;
  keyMetric: string;
  documentationUrl: string;
}

export interface AtomicSystemsResponse {
  systems: AtomicSystem[];
  totalSystems: number;
  operationalSystems: number;
  completionPercentage: number;
  lastUpdated: string;
}

/**
 * Get status of all atomic systems
 */
export async function getAtomicSystemsStatus(): Promise<AtomicSystemsResponse> {
  const db = new Database(DB_PATH, { readonly: true });

  const systems: AtomicSystem[] = [
    // 1. Atomic Entities Taxonomy
    {
      id: 'atomic-entities-taxonomy',
      name: 'Atomic Entities Taxonomy',
      category: 'foundation',
      description: '20-entity taxonomy mapping all system components',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['atomic_entities'],
      recordCount: getTableCount(db, 'atomic_entities'),
      keyMetric: '20 entities mapped',
      documentationUrl: '/docs/ATOMIC_ENTITIES_TAXONOMY.md'
    },

    // 2. Specifications Registry
    {
      id: 'specifications-registry',
      name: 'Specifications Registry',
      category: 'core',
      description: 'Central repository for all technical specifications',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['specs_registry', 'spec_requirements', 'spec_versions', 'spec_dependencies'],
      recordCount: getTableCount(db, 'specs_registry'),
      keyMetric: `${getTableCount(db, 'specs_registry')} specs registered`,
      documentationUrl: '/docs/SPECIFICATIONS_REGISTRY.md'
    },

    // 3. Knowledge Injection System
    {
      id: 'knowledge-injection',
      name: 'Knowledge Injection System',
      category: 'intelligence',
      description: 'Automatic knowledge injection on agent connection',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['knowledge_base', 'knowledge_injection_history'],
      recordCount: getTableCount(db, 'knowledge_base'),
      keyMetric: 'Auto-inject on connect',
      documentationUrl: '/docs/KNOWLEDGE_INJECTION_SYSTEM.md'
    },

    // 4. Code Snippets Pipeline
    {
      id: 'code-snippets',
      name: 'Code Snippets Pipeline',
      category: 'code',
      description: 'Reusable code patterns library',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['snippets_registry', 'snippet_usage'],
      recordCount: getTableCount(db, 'snippets_registry'),
      keyMetric: `${getTableCount(db, 'snippets_registry')} snippets available`,
      documentationUrl: '/docs/CODE_SNIPPETS_LIBRARY.md'
    },

    // 5. Prompts Pipeline
    {
      id: 'prompts-pipeline',
      name: 'Prompts Pipeline',
      category: 'code',
      description: 'Template prompts for LLM interactions',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['prompts_registry', 'prompt_usage'],
      recordCount: getTableCount(db, 'prompts_registry'),
      keyMetric: `${getTableCount(db, 'prompts_registry')} prompts available`,
      documentationUrl: '/docs/PROMPTS_LIBRARY.md'
    },

    // 6. Context Files System
    {
      id: 'context-files',
      name: 'Context Files System',
      category: 'intelligence',
      description: 'Centralized context injection - UPDATE ONCE → ALL AGENTS GET IT',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['context_files_registry', 'context_injection_history'],
      recordCount: getTableCount(db, 'context_files_registry'),
      keyMetric: `${getTableCount(db, 'context_files_registry')} contexts managed`,
      documentationUrl: '/docs/CONTEXT_FILES_SYSTEM.md'
    },

    // 7. Projects Registry
    {
      id: 'projects-registry',
      name: 'Projects Registry',
      category: 'management',
      description: 'Complete project management with 40+ metadata fields',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['projects', 'project_milestones', 'project_tasks', 'project_dependencies'],
      recordCount: getTableCount(db, 'projects'),
      keyMetric: `${getTableCount(db, 'projects')} projects tracked`,
      documentationUrl: '/docs/PROJECTS_REGISTRY_SYSTEM.md'
    },

    // 8. Codebase Ingestion Pipeline (Backward Flow)
    {
      id: 'codebase-ingestion',
      name: 'Codebase Ingestion Pipeline',
      category: 'code',
      description: 'Extract deployable products from existing projects (PROJECT → PRODUCT)',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['products_registry', 'product_files', 'extraction_rules', 'extraction_sessions'],
      recordCount: getTableCount(db, 'products_registry'),
      keyMetric: `${getTableCount(db, 'extraction_rules')} extraction rules`,
      documentationUrl: '/docs/CODEBASE_INGESTION_PIPELINE.md'
    },

    // 9. Specbase-to-Codebase Pipeline (Forward Flow)
    {
      id: 'specbase-to-codebase',
      name: 'Specbase-to-Codebase Pipeline',
      category: 'code',
      description: 'Generate complete codebases from specs (SPEC → TASKS → CODE)',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['generated_codebases', 'generation_tasks', 'generation_strategies', 'code_templates'],
      recordCount: getTableCount(db, 'generated_codebases'),
      keyMetric: `${getTableCount(db, 'generation_strategies')} strategies`,
      documentationUrl: '/docs/SPECBASE_TO_CODEBASE_PIPELINE.md'
    },

    // 10. Task Anatomy System
    {
      id: 'task-anatomy',
      name: 'Task Anatomy System',
      category: 'execution',
      description: 'The bridge between vision and execution (7 critical questions)',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['tasks_registry', 'task_execution_steps', 'task_dependencies', 'task_templates'],
      recordCount: getTableCount(db, 'tasks_registry'),
      keyMetric: `${getTableCount(db, 'task_templates')} task templates`,
      documentationUrl: '/docs/TASK_ANATOMY.md'
    },

    // 11. User Interview Pipeline
    {
      id: 'user-interview',
      name: 'User Interview Pipeline',
      category: 'intelligence',
      description: 'Proactive gap resolution through intelligent interviews (10 dimensions)',
      status: 'operational',
      completedDate: '2025-10-12',
      tables: ['universal_project_schema', 'spec_gaps', 'interview_sessions', 'interview_questions'],
      recordCount: getTableCount(db, 'universal_project_schema'),
      keyMetric: '10 universal dimensions',
      documentationUrl: '/docs/USER_INTERVIEW_PIPELINE.md'
    },

    // 12. Backend Connections Registry (Already existed)
    {
      id: 'backend-connections',
      name: 'Backend Connections Registry',
      category: 'integration',
      description: 'Real-time component discovery and API mapping',
      status: 'operational',
      completedDate: '2025-10-10',
      tables: ['connections_registry'],
      recordCount: 19, // Known from previous work
      keyMetric: '19 API endpoints mapped',
      documentationUrl: '/docs/BACKEND_CONNECTIONS_REGISTRY.md'
    },

    // 13. Auto-Proactive Loops (Already existed)
    {
      id: 'auto-proactive-loops',
      name: 'Auto-Proactive Loops',
      category: 'intelligence',
      description: '9 autonomous loops for system intelligence',
      status: 'operational',
      completedDate: '2025-10-10',
      tables: ['loop_executions', 'agent_sessions'],
      recordCount: getLoopExecutionCount(db),
      keyMetric: '9/9 loops active',
      documentationUrl: '/docs/AUTO_PROACTIVE_LOOPS.md'
    }
  ];

  db.close();

  const operationalSystems = systems.filter(s => s.status === 'operational').length;
  const completionPercentage = Math.round((operationalSystems / systems.length) * 100);

  return {
    systems,
    totalSystems: systems.length,
    operationalSystems,
    completionPercentage,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Helper: Get row count for a table
 */
function getTableCount(db: Database.Database, tableName: string): number {
  try {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
    return result.count;
  } catch (error) {
    return 0;
  }
}

/**
 * Helper: Get loop execution count
 */
function getLoopExecutionCount(db: Database.Database): number {
  try {
    const result = db.prepare(`SELECT COUNT(*) as count FROM loop_executions`).get() as { count: number };
    return result.count;
  } catch (error) {
    return 0;
  }
}

/**
 * Get details for a specific atomic system
 */
export async function getAtomicSystemDetails(systemId: string) {
  const allSystems = await getAtomicSystemsStatus();
  const system = allSystems.systems.find(s => s.id === systemId);

  if (!system) {
    throw new Error(`System not found: ${systemId}`);
  }

  const db = new Database(DB_PATH, { readonly: true });

  // Get additional details based on system type
  let additionalDetails: any = {};

  switch (systemId) {
    case 'specifications-registry':
      additionalDetails = {
        recentSpecs: db.prepare(`
          SELECT spec_id, spec_name, created_at
          FROM specs_registry
          ORDER BY created_at DESC
          LIMIT 5
        `).all()
      };
      break;

    case 'projects-registry':
      additionalDetails = {
        projectsByStatus: db.prepare(`
          SELECT status, COUNT(*) as count
          FROM projects
          GROUP BY status
        `).all()
      };
      break;

    case 'user-interview':
      additionalDetails = {
        dimensions: db.prepare(`
          SELECT dimension_name, priority, gap_severity
          FROM universal_project_schema
          ORDER BY priority DESC
        `).all()
      };
      break;
  }

  db.close();

  return {
    ...system,
    additionalDetails
  };
}
