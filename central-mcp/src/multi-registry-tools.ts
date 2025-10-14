// 🚀 CENTRAL-MCP MULTI-REGISTRY TOOL FUNCTIONS
// Built: 2025-10-13 | Purpose: Standardized task completion with verifiable success criteria

import { z } from 'zod';

// =====================================================
// UNIVERSAL COMPLETION DECLARATION SCHEMAS
// =====================================================

export const HonestAssessmentSchema = z.object({
  code_executed_successfully: z.boolean(),
  results_measured_and_documented: z.boolean(),
  quality_gates_passed: z.boolean(),
  no_technical_blockers_remaining: z.boolean(),
  honest_completion_percentage: z.number().min(0).max(1),
  context_file_location: z.string().url('Must be valid file path or URL'),
});

export const DeploymentAssessmentSchema = z.object({
  infrastructure_connectivity_verified: z.boolean(),
  services_accessible_to_users: z.boolean(),
  configuration_operational: z.boolean(),
  environment_variables_set: z.boolean(),
  deployment_status: z.enum(['NOT_DEPLOYED', 'DEPLOYING', 'DEPLOYED', 'FAILED']),
  deployment_url: z.string().url().optional(),
});

export const PurposeFulfillmentAssessmentSchema = z.object({
  intended_users_can_access_system: z.boolean(),
  business_processes_functional: z.boolean(),
  value_creation_mechanisms_active: z.boolean(),
  user_feedback_loops_operational: z.boolean(),
  active_user_count: z.number().min(0),
  business_value_generated: z.string(),
});

export const EcosystemIntegrationAssessmentSchema = z.object({
  inter_system_connections_active: z.boolean(),
  data_flows_established: z.boolean(),
  api_integrations_functional: z.boolean(),
  compound_value_generation: z.boolean(),
  ecosystem_impact_score: z.number().min(0).max(1),
});

export const UniversalTaskCompletionDeclarationSchema = z.object({
  registry_type: z.enum(['vision', 'implementation_gap', 'general', 'specialized']),
  task_id: z.string(),
  completion_level: z.number().int().min(1).max(4),

  // HONEST ASSESSMENT (Required)
  honest_assessment: HonestAssessmentSchema,

  // DEPLOYMENT ASSESSMENT (Required for level 2+)
  deployment_assessment: DeploymentAssessmentSchema.optional(),

  // PURPOSE FULFILLMENT (Required for level 3+)
  purpose_fulfillment_assessment: PurposeFulfillmentAssessmentSchema.optional(),

  // ECOSYSTEM INTEGRATION (Required for level 4)
  ecosystem_integration_assessment: EcosystemIntegrationAssessmentSchema.optional(),

  // VERIFIABLE DELIVERABLES
  deliverables: z.record(z.any()),

  // LIMITATIONS & NEXT STEPS
  limitations: z.array(z.string()),
  next_steps_for_true_completion: z.array(z.string()),

  // QUALITY METRICS
  quality_metrics: z.object({
    overall_quality_score: z.number().min(0).max(1),
    domain_specific_scores: z.record(z.number()),
  }),

  // VALIDATION EVIDENCE
  validation_evidence: z.object({
    test_results: z.any().optional(),
    user_feedback: z.any().optional(),
    performance_metrics: z.any().optional(),
    business_impact: z.any().optional(),
  }).optional(),
});

// =====================================================
// VISION REGISTRY SCHEMAS
// =====================================================

export const VisionCompletionDeclarationSchema = UniversalTaskCompletionDeclarationSchema.extend({
  registry_type: z.literal('vision'),
  deliverables: z.object({
    generated_spec_id: z.string(),
    spec_quality_score: z.number().min(0).max(1),
    spec_completeness_score: z.number().min(0).max(1),
    vision_clarity_score: z.number().min(0).max(1),
    business_value_alignment: z.number().min(0).max(1),
    technical_feasibility_score: z.number().min(0).max(1),
  }),
});

export const VisionExtractionRequestSchema = z.object({
  source_message_id: z.string(),
  source_conversation_id: z.string(),
  extraction_approach: z.enum(['automated', 'manual', 'hybrid']).default('hybrid'),
  quality_requirements: z.object({
    min_vision_clarity_score: z.number().min(0).max(1).default(0.8),
    min_business_value_alignment: z.number().min(0).max(1).default(0.7),
    require_technical_feasibility: z.boolean().default(true),
  }).optional(),
});

// =====================================================
// IMPLEMENTATION GAP REGISTRY SCHEMAS
// =====================================================

export const ImplementationGapCompletionDeclarationSchema = UniversalTaskCompletionDeclarationSchema.extend({
  registry_type: z.literal('implementation_gap'),
  deliverables: z.object({
    implemented_features: z.array(z.string()),
    code_coverage_achieved: z.number().min(0).max(1),
    automated_test_count: z.number().min(0),
    manual_test_count: z.number().min(0),
    code_quality_score: z.number().min(0).max(1),
    documentation_coverage: z.number().min(0).max(1),
  }),
  gap_resolution_verification: z.object({
    gap_fully_resolved: z.boolean(),
    remaining_gaps: z.array(z.string()),
    quality_metrics_met: z.boolean(),
  }),
});

export const ImplementationGapAnalysisRequestSchema = z.object({
  source_spec_id: z.string(),
  target_codebase: z.string(),
  analysis_depth: z.enum(['surface', 'detailed', 'comprehensive']).default('detailed'),
  gap_types: z.array(z.enum(['FEATURE', 'BUG', 'REFACTOR', 'TEST', 'DOC', 'DEPLOY'])).default(['FEATURE', 'BUG']),
  quality_thresholds: z.object({
    min_code_quality_score: z.number().min(0).max(1).default(0.8),
    min_test_coverage: z.number().min(0).max(1).default(0.7),
    require_documentation: z.boolean().default(true),
  }).optional(),
});

// =====================================================
// GENERAL TASKS REGISTRY SCHEMAS
// =====================================================

export const GeneralTaskCompletionDeclarationSchema = UniversalTaskCompletionDeclarationSchema.extend({
  registry_type: z.literal('general'),
});

// =====================================================
// MCP TOOL FUNCTION IMPLEMENTATIONS
// =====================================================

export class CentralMCPMultiRegistryTools {
  private db: any; // SQLite database connection

  constructor(databaseConnection: any) {
    this.db = databaseConnection;
  }

  // =====================================================
  // VISION REGISTRY TOOLS
  // =====================================================

  async createVisionExtraction(request: z.infer<typeof VisionExtractionRequestSchema>): Promise<string> {
    const { source_message_id, source_conversation_id, extraction_approach, quality_requirements } = request;

    // Generate unique vision ID
    const vision_id = `VISION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert vision extraction record
    const stmt = this.db.prepare(`
      INSERT INTO vision_registry (
        vision_id, source_message_id, source_conversation_id,
        status, processing_stage, assigned_agent,
        extraction_confidence, created_at
      ) VALUES (?, ?, ?, 'EXTRACTING', 'INTENT_ANALYSIS', ?, 0.0, datetime('now'))
    `);

    stmt.run(vision_id, source_message_id, source_conversation_id, 'current_agent');

    return vision_id;
  }

  async declareVisionCompletion(declaration: z.infer<typeof VisionCompletionDeclarationSchema>): Promise<void> {
    const { task_id, completion_level, honest_assessment, deliverables, limitations, next_steps_for_true_completion } = declaration;

    // Validate completion level requirements
    this.validateCompletionLevel(completion_level, declaration);

    // Update vision registry with completion data
    const stmt = this.db.prepare(`
      UPDATE vision_registry SET
        status = 'COMPLETED',
        completion_level = ?,
        code_executed_successfully = ?,
        results_measured_and_documented = ?,
        quality_gates_passed = ?,
        no_technical_blockers_remaining = ?,
        honest_completion_percentage = ?,
        context_file_location = ?,
        spec_quality_score = ?,
        spec_completeness_score = ?,
        vision_clarity_score = ?,
        business_value_alignment = ?,
        technical_feasibility_score = ?,
        completed_at = datetime('now')
      WHERE vision_id = ?
    `);

    stmt.run(
      completion_level,
      honest_assessment.code_executed_successfully,
      honest_assessment.results_measured_and_documented,
      honest_assessment.quality_gates_passed,
      honest_assessment.no_technical_blockers_remaining,
      honest_assessment.honest_completion_percentage,
      honest_assessment.context_file_location,
      deliverables.spec_quality_score,
      deliverables.spec_completeness_score,
      deliverables.vision_clarity_score,
      deliverables.business_value_alignment,
      deliverables.technical_feasibility_score,
      task_id
    );

    // Log completion event
    this.logCompletionEvent('vision', task_id, completion_level, honest_assessment.honest_completion_percentage);
  }

  // =====================================================
  // IMPLEMENTATION GAP REGISTRY TOOLS
  // =====================================================

  async analyzeImplementationGaps(request: z.infer<typeof ImplementationGapAnalysisRequestSchema>): Promise<string[]> {
    const { source_spec_id, target_codebase, analysis_depth, gap_types, quality_thresholds } = request;

    // This would contain logic to analyze gaps between spec and implementation
    // For now, return sample gap IDs
    const gap_ids = [
      `GAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      `GAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    ];

    return gap_ids;
  }

  async declareGapCompletion(declaration: z.infer<typeof ImplementationGapCompletionDeclarationSchema>): Promise<void> {
    const { task_id, completion_level, honest_assessment, deliverables, gap_resolution_verification, limitations, next_steps_for_true_completion } = declaration;

    // Validate completion level requirements
    this.validateCompletionLevel(completion_level, declaration);

    // Update implementation gap registry
    const stmt = this.db.prepare(`
      UPDATE implementation_gap_registry SET
        status = 'COMPLETED',
        completion_level = ?,
        code_executed_successfully = ?,
        results_measured_and_documented = ?,
        quality_gates_passed = ?,
        no_technical_blockers_remaining = ?,
        honest_completion_percentage = ?,
        context_file_location = ?,
        code_coverage_achieved = ?,
        automated_test_count = ?,
        code_quality_score = ?,
        documentation_coverage = ?,
        completed_at = datetime('now')
      WHERE gap_id = ?
    `);

    stmt.run(
      completion_level,
      honest_assessment.code_executed_successfully,
      honest_assessment.results_measured_and_documented,
      honest_assessment.quality_gates_passed,
      honest_assessment.no_technical_blockers_remaining,
      honest_assessment.honest_completion_percentage,
      honest_assessment.context_file_location,
      deliverables.code_coverage_achieved,
      deliverables.automated_test_count,
      deliverables.code_quality_score,
      deliverables.documentation_coverage,
      task_id
    );

    // Log completion event
    this.logCompletionEvent('implementation_gap', task_id, completion_level, honest_assessment.honest_completion_percentage);
  }

  // =====================================================
  // GENERAL TASKS REGISTRY TOOLS
  // =====================================================

  async claimTask(task_id: string, agent_id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE tasks_registry SET
        assigned_agent = ?,
        claimed_by = ?,
        claimed_at = datetime('now'),
        status = 'IN_PROGRESS'
      WHERE task_id = ? AND status = 'READY'
    `);

    const result = stmt.run(agent_id, agent_id, task_id);

    if (result.changes === 0) {
      throw new Error(`Task ${task_id} not found or not ready for claiming`);
    }
  }

  async declareTaskCompletion(declaration: z.infer<typeof GeneralTaskCompletionDeclarationSchema>): Promise<void> {
    const { task_id, completion_level, honest_assessment, deployment_assessment, purpose_fulfillment_assessment, ecosystem_integration_assessment, deliverables, limitations, next_steps_for_true_completion } = declaration;

    // Validate completion level requirements
    this.validateCompletionLevel(completion_level, declaration);

    // Build update statement based on completion level
    let updateFields = `
      status = 'COMPLETED',
      completion_level = ?,
      code_executed_successfully = ?,
      results_measured_and_documented = ?,
      quality_gates_passed = ?,
      no_technical_blockers_remaining = ?,
      honest_completion_percentage = ?,
      context_file_location = ?,
      completed_at = datetime('now')
    `;

    let params = [
      completion_level,
      honest_assessment.code_executed_successfully,
      honest_assessment.results_measured_and_documented,
      honest_assessment.quality_gates_passed,
      honest_assessment.no_technical_blockers_remaining,
      honest_assessment.honest_completion_percentage,
      honest_assessment.context_file_location,
      task_id
    ];

    // Add deployment assessment for level 2+
    if (completion_level >= 2 && deployment_assessment) {
      updateFields += `,
        infrastructure_connectivity_verified = ?,
        services_accessible_to_users = ?,
        configuration_operational = ?,
        environment_variables_set = ?,
        deployment_status = ?,
        deployment_url = ?
      `;
      params.splice(-1, 0, ...[
        deployment_assessment.infrastructure_connectivity_verified,
        deployment_assessment.services_accessible_to_users,
        deployment_assessment.configuration_operational,
        deployment_assessment.environment_variables_set,
        deployment_assessment.deployment_status,
        deployment_assessment.deployment_url
      ]);
    }

    // Add purpose fulfillment assessment for level 3+
    if (completion_level >= 3 && purpose_fulfillment_assessment) {
      updateFields += `,
        intended_users_can_access_system = ?,
        business_processes_functional = ?,
        value_creation_mechanisms_active = ?,
        user_feedback_loops_operational = ?,
        active_user_count = ?,
        business_value_generated = ?
      `;
      params.splice(-1, 0, ...[
        purpose_fulfillment_assessment.intended_users_can_access_system,
        purpose_fulfillment_assessment.business_processes_functional,
        purpose_fulfillment_assessment.value_creation_mechanisms_active,
        purpose_fulfillment_assessment.user_feedback_loops_operational,
        purpose_fulfillment_assessment.active_user_count,
        purpose_fulfillment_assessment.business_value_generated
      ]);
    }

    // Add ecosystem integration assessment for level 4
    if (completion_level >= 4 && ecosystem_integration_assessment) {
      updateFields += `,
        inter_system_connections_active = ?,
        data_flows_established = ?,
        api_integrations_functional = ?,
        compound_value_generation = ?,
        ecosystem_impact_score = ?
      `;
      params.splice(-1, 0, ...[
        ecosystem_integration_assessment.inter_system_connections_active,
        ecosystem_integration_assessment.data_flows_established,
        ecosystem_integration_assessment.api_integrations_functional,
        ecosystem_integration_assessment.compound_value_generation,
        ecosystem_integration_assessment.ecosystem_impact_score
      ]);
    }

    const stmt = this.db.prepare(`UPDATE tasks_registry SET ${updateFields} WHERE task_id = ?`);
    stmt.run(...params);

    // Log completion event
    this.logCompletionEvent('general_tasks', task_id, completion_level, honest_assessment.honest_completion_percentage);
  }

  // =====================================================
  // UNIVERSAL QUERY FUNCTIONS
  // =====================================================

  async getTasksByCompletionLevel(level: number): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT 'general_tasks' as registry_type, task_id, task_name, status, completion_level,
             honest_completion_percentage, overall_quality_score, assigned_agent
      FROM tasks_registry
      WHERE completion_level = ? AND status = 'COMPLETED'

      UNION ALL

      SELECT 'vision' as registry_type, vision_id as task_id, user_intent as task_name, status, completion_level,
             honest_completion_percentage, spec_quality_score as overall_quality_score, assigned_agent
      FROM vision_registry
      WHERE completion_level = ? AND status = 'COMPLETED'

      UNION ALL

      SELECT 'implementation_gap' as registry_type, gap_id as task_id, gap_description as task_name, status, completion_level,
             honest_completion_percentage, code_quality_score as overall_quality_score, assigned_agent
      FROM implementation_gap_registry
      WHERE completion_level = ? AND status = 'COMPLETED'

      ORDER BY registry_type, overall_quality_score DESC
    `);

    return stmt.all(level, level, level);
  }

  async getHonestCompletionAssessment(task_id: string): Promise<any> {
    const stmt = this.db.prepare(`
      SELECT 'general_tasks' as registry_type, task_id, task_name, status, completion_level,
             honest_completion_percentage, code_executed_successfully, results_measured_and_documented,
             quality_gates_passed, context_file_location, limitations
      FROM tasks_registry
      WHERE task_id = ?

      UNION ALL

      SELECT 'vision' as registry_type, vision_id as task_id, user_intent as task_name, status, completion_level,
             honest_completion_percentage, code_executed_successfully, results_measured_and_documented,
             quality_gates_passed, context_file_location, NULL as limitations
      FROM vision_registry
      WHERE vision_id = ?

      UNION ALL

      SELECT 'implementation_gap' as registry_type, gap_id as task_id, gap_description as task_name, status, completion_level,
             honest_completion_percentage, code_executed_successfully, results_measured_and_documented,
             quality_gates_passed, context_file_location, NULL as limitations
      FROM implementation_gap_registry
      WHERE gap_id = ?
    `);

    return stmt.get(task_id, task_id, task_id);
  }

  async getCompletionGapAnalysis(registry_type: string): Promise<any> {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN completion_level >= 1 THEN 1 ELSE 0 END) as contextual_complete,
        SUM(CASE WHEN completion_level >= 2 THEN 1 ELSE 0 END) as deployment_complete,
        SUM(CASE WHEN completion_level >= 3 THEN 1 ELSE 0 END) as purpose_fulfilled,
        SUM(CASE WHEN completion_level >= 4 THEN 1 ELSE 0 END) as ecosystem_integrated,
        AVG(honest_completion_percentage) as avg_honest_completion,
        AVG(overall_quality_score) as avg_quality_score
      FROM tasks_registry
      WHERE status = 'COMPLETED'
    `);

    return stmt.get();
  }

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  private validateCompletionLevel(level: number, declaration: any): void {
    const { honest_assessment, deployment_assessment, purpose_fulfillment_assessment, ecosystem_integration_assessment } = declaration;

    // Level 1 requirements (always required)
    if (!honest_assessment.code_executed_successfully) {
      throw new Error('Level 1+ completion requires code_executed_successfully = TRUE');
    }
    if (!honest_assessment.results_measured_and_documented) {
      throw new Error('Level 1+ completion requires results_measured_and_documented = TRUE');
    }
    if (!honest_assessment.quality_gates_passed) {
      throw new Error('Level 1+ completion requires quality_gates_passed = TRUE');
    }
    if (!honest_assessment.context_file_location) {
      throw new Error('Level 1+ completion requires context_file_location');
    }

    // Level 2+ requirements
    if (level >= 2) {
      if (!deployment_assessment) {
        throw new Error('Level 2+ completion requires deployment_assessment');
      }
      if (!deployment_assessment.infrastructure_connectivity_verified) {
        throw new Error('Level 2+ completion requires infrastructure_connectivity_verified = TRUE');
      }
    }

    // Level 3+ requirements
    if (level >= 3) {
      if (!purpose_fulfillment_assessment) {
        throw new Error('Level 3+ completion requires purpose_fulfillment_assessment');
      }
      if (!purpose_fulfillment_assessment.intended_users_can_access_system) {
        throw new Error('Level 3+ completion requires intended_users_can_access_system = TRUE');
      }
    }

    // Level 4 requirements
    if (level >= 4) {
      if (!ecosystem_integration_assessment) {
        throw new Error('Level 4 completion requires ecosystem_integration_assessment');
      }
      if (!ecosystem_integration_assessment.inter_system_connections_active) {
        throw new Error('Level 4 completion requires inter_system_connections_active = TRUE');
      }
    }
  }

  private logCompletionEvent(registry_type: string, task_id: string, completion_level: number, honest_percentage: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO system_status_events (event_type, message, timestamp)
      VALUES ('COMPLETION_DECLARATION', ?, datetime('now'))
    `);

    stmt.run(`${registry_type.toUpperCase()} task ${task_id} completed at level ${completion_level} with ${Math.round(honest_percentage * 100)}% honest assessment`);
  }
}

// =====================================================
// MCP TOOL EXPORTS
// =====================================================

export const mcpTools = {
  'create_vision_extraction': {
    description: 'Create a new vision extraction task from user message',
    inputSchema: VisionExtractionRequestSchema,
    handler: async (request: any, tools: CentralMCPMultiRegistryTools) => {
      return await tools.createVisionExtraction(request);
    }
  },

  'declare_vision_completion': {
    description: 'Declare vision extraction completion with honest assessment',
    inputSchema: VisionCompletionDeclarationSchema,
    handler: async (declaration: any, tools: CentralMCPMultiRegistryTools) => {
      await tools.declareVisionCompletion(declaration);
      return { success: true, message: 'Vision completion declared successfully' };
    }
  },

  'analyze_implementation_gaps': {
    description: 'Analyze implementation gaps between specifications and code',
    inputSchema: ImplementationGapAnalysisRequestSchema,
    handler: async (request: any, tools: CentralMCPMultiRegistryTools) => {
      return await tools.analyzeImplementationGaps(request);
    }
  },

  'declare_gap_completion': {
    description: 'Declare implementation gap completion with honest assessment',
    inputSchema: ImplementationGapCompletionDeclarationSchema,
    handler: async (declaration: any, tools: CentralMCPMultiRegistryTools) => {
      await tools.declareGapCompletion(declaration);
      return { success: true, message: 'Implementation gap completion declared successfully' };
    }
  },

  'claim_task': {
    description: 'Claim a general task for execution',
    inputSchema: z.object({
      task_id: z.string(),
      agent_id: z.string(),
    }),
    handler: async (request: any, tools: CentralMCPMultiRegistryTools) => {
      await tools.claimTask(request.task_id, request.agent_id);
      return { success: true, message: 'Task claimed successfully' };
    }
  },

  'declare_task_completion': {
    description: 'Declare general task completion with standardized assessment',
    inputSchema: GeneralTaskCompletionDeclarationSchema,
    handler: async (declaration: any, tools: CentralMCPMultiRegistryTools) => {
      await tools.declareTaskCompletion(declaration);
      return { success: true, message: 'Task completion declared successfully' };
    }
  },

  'get_tasks_by_completion_level': {
    description: 'Get tasks filtered by completion level across all registries',
    inputSchema: z.object({
      level: z.number().int().min(1).max(4),
    }),
    handler: async (request: any, tools: CentralMCPMultiRegistryTools) => {
      return await tools.getTasksByCompletionLevel(request.level);
    }
  },

  'get_honest_completion_assessment': {
    description: 'Get honest completion assessment for a specific task',
    inputSchema: z.object({
      task_id: z.string(),
    }),
    handler: async (request: any, tools: CentralMCPMultiRegistryTools) => {
      return await tools.getHonestCompletionAssessment(request.task_id);
    }
  },

  'get_completion_gap_analysis': {
    description: 'Get completion gap analysis for a registry type',
    inputSchema: z.object({
      registry_type: z.string().optional(),
    }),
    handler: async (request: any, tools: CentralMCPMultiRegistryTools) => {
      return await tools.getCompletionGapAnalysis(request.registry_type || 'all');
    }
  }
};

export default CentralMCPMultiRegistryTools;