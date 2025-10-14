/**
 * Semantic Extractor - Transforms Context Analysis into Orchestra Format Structure
 * ===============================================================================
 *
 * Takes ContextAnalysis and extracts semantic meaning for Orchestra format:
 * - Module identity (title, ID, type, category)
 * - Systematic scaffolding (lifecycle, state, seat)
 * - All 12 sections of Orchestra spec
 */

import { ContextAnalysis } from './ContextAnalyzer';

export interface OrchestraSemanticStructure {
  // Frontmatter fields (80+ fields)
  module_identity: ModuleIdentity;
  systematic_scaffolding: SystematicScaffolding;
  availability_access: AvailabilityAccess;
  promotion_gates: PromotionGates;
  observability: Observability;
  security: SecuritySpecs;
  technical_metadata: TechnicalMetadata;
  agentic_integration: AgenticIntegration;

  // Content sections (12 sections)
  sections: {
    purpose: string;
    primary_features: string[];
    architecture: string;
    contracts: string;
    dependencies: string[];
    testing: string;
    security_details: string;
    performance: string;
    observability_details: string;
    operations: string;
    integrations: string;
    promotion_checklist: string;
  };
}

export interface ModuleIdentity {
  title: string;
  module_id: string;
  type: 'module' | 'scaffolding' | 'config' | 'governance' | 'ops';
  category: 'primitive' | 'first_degree' | 'default' | 'advanced' | 'backend' | 'agentic';
}

export interface SystematicScaffolding {
  lifecycle: 'dev' | 'staging' | 'production';
  state: 'minimal' | 'i1' | 'i2' | 'i3' | 'complete';
  seat: 'mvp' | 'stable' | 'mature';
}

export interface AvailabilityAccess {
  phase_availability: 'always' | 'post_onboarding' | 'unlockable' | 'expert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  agent_accessible: boolean;
  user_configurable: boolean;
}

export interface PromotionGates {
  to_intermediate_i1: string[];
  to_intermediate_i2: string[];
  to_intermediate_i3: string[];
  to_complete: string[];
}

export interface Observability {
  metrics: string[];
  alerts: string[];
  dashboards: string[];
}

export interface SecuritySpecs {
  authentication_required: boolean;
  authorization_level: string;
  data_classification: string;
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  audit_logging: boolean;
  rate_limiting: boolean;
  input_validation: string;
}

export interface TechnicalMetadata {
  dependencies: string[];
  integrations: string[];
  api_contracts: string[];
  last_updated: string;
  version: string;
  maintainer: string;
}

export interface AgenticIntegration {
  agent_capabilities: {
    can_read: boolean;
    can_write: boolean;
    can_propose_changes: boolean;
    requires_approval: boolean;
  };
  agent_boundaries: {
    allowed_operations: string[];
    forbidden_operations: string[];
    escalation_triggers: string[];
  };
}

export class SemanticExtractor {
  /**
   * Extract Orchestra semantic structure from context analysis
   */
  async extract(analysis: ContextAnalysis, options: ExtractOptions): Promise<OrchestraSemanticStructure> {
    return {
      module_identity: this.extractModuleIdentity(analysis, options),
      systematic_scaffolding: this.extractScaffolding(options),
      availability_access: this.extractAvailability(options),
      promotion_gates: this.extractPromotionGates(analysis),
      observability: this.extractObservability(analysis, options),
      security: this.extractSecurity(analysis),
      technical_metadata: this.extractMetadata(analysis, options),
      agentic_integration: this.extractAgenticIntegration(analysis, options),
      sections: {
        purpose: this.extractPurposeSection(analysis),
        primary_features: this.extractFeaturesSection(analysis),
        architecture: this.extractArchitectureSection(analysis),
        contracts: this.extractContractsSection(analysis),
        dependencies: this.extractDependenciesSection(analysis),
        testing: this.extractTestingSection(analysis),
        security_details: this.extractSecurityDetailsSection(analysis),
        performance: this.extractPerformanceSection(analysis),
        observability_details: this.extractObservabilityDetailsSection(analysis),
        operations: this.extractOperationsSection(analysis),
        integrations: this.extractIntegrationsSection(analysis),
        promotion_checklist: this.extractPromotionChecklistSection(analysis)
      }
    };
  }

  /**
   * Extract module identity
   */
  private extractModuleIdentity(analysis: ContextAnalysis, options: ExtractOptions): ModuleIdentity {
    // Generate title from purpose
    const title = this.generateTitle(analysis.purpose, options.module_name);

    // Generate module ID
    const module_id = this.generateModuleId(options.project, options.module_name);

    // Determine type based on context
    const type = this.determineModuleType(analysis);

    // Determine category
    const category = this.determineCategory(analysis, options);

    return { title, module_id, type, category };
  }

  /**
   * Generate title from purpose
   */
  private generateTitle(purpose: string, moduleName?: string): string {
    if (moduleName) {
      return `${moduleName} - ${purpose.substring(0, 60)}`;
    }

    // Extract first sentence of purpose
    const firstSentence = purpose.split('.')[0];
    return firstSentence.substring(0, 80);
  }

  /**
   * Generate module ID
   */
  private generateModuleId(project: string, moduleName: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const normalized = moduleName.toLowerCase().replace(/\s+/g, '_');
    return `${project}_${normalized}_${timestamp}`;
  }

  /**
   * Determine module type
   */
  private determineModuleType(analysis: ContextAnalysis): ModuleIdentity['type'] {
    // Simple heuristic - can be improved with ML
    if (analysis.contracts.length > 5) return 'module';
    if (analysis.security.authentication_required) return 'governance';
    if (analysis.dependencies.length > 10) return 'scaffolding';

    return 'module'; // Default
  }

  /**
   * Determine category
   */
  private determineCategory(analysis: ContextAnalysis, options: ExtractOptions): ModuleIdentity['category'] {
    if (options.category) return options.category;

    // Heuristic based on features
    if (analysis.features.some(f => f.includes('AI') || f.includes('agent'))) return 'agentic';
    if (analysis.features.some(f => f.includes('API') || f.includes('backend'))) return 'backend';
    if (analysis.features.length < 3) return 'primitive';

    return 'default';
  }

  /**
   * Extract systematic scaffolding
   */
  private extractScaffolding(options: ExtractOptions): SystematicScaffolding {
    return {
      lifecycle: options.lifecycle || 'dev',
      state: options.state || 'minimal',
      seat: options.seat || 'mvp'
    };
  }

  /**
   * Extract availability and access
   */
  private extractAvailability(options: ExtractOptions): AvailabilityAccess {
    return {
      phase_availability: options.phase_availability || 'always',
      priority: options.priority || 'medium',
      agent_accessible: options.agent_accessible !== false,
      user_configurable: options.user_configurable !== false
    };
  }

  /**
   * Extract promotion gates
   */
  private extractPromotionGates(analysis: ContextAnalysis): PromotionGates {
    return {
      to_intermediate_i1: [
        'Core functionality implemented and tested',
        'Basic security requirements met',
        'Documentation complete'
      ],
      to_intermediate_i2: [
        'Reliability and UX improvements complete',
        'Performance benchmarks met',
        `All ${analysis.features.length} features implemented`
      ],
      to_intermediate_i3: [
        'Integration breadth achieved',
        'Advanced capabilities operational',
        'Comprehensive testing completed'
      ],
      to_complete: [
        'Production deployment validated',
        'All features fully operational',
        'Performance SLA met (>99.9% uptime)'
      ]
    };
  }

  /**
   * Extract observability
   */
  private extractObservability(analysis: ContextAnalysis, options: ExtractOptions): Observability {
    const moduleName = options.module_name?.toLowerCase().replace(/\s+/g, '_') || 'module';

    return {
      metrics: [
        `${moduleName}.operation.success_rate`,
        `${moduleName}.performance.response_time_ms`,
        `${moduleName}.errors.count`,
        `${moduleName}.usage.requests_per_second`
      ],
      alerts: [
        `${moduleName}.error_rate_high`,
        `${moduleName}.performance_degraded`,
        `${moduleName}.availability_low`
      ],
      dashboards: [
        `${moduleName}_health`,
        `${moduleName}_performance`,
        `${moduleName}_usage`
      ]
    };
  }

  /**
   * Extract security specs
   */
  private extractSecurity(analysis: ContextAnalysis): SecuritySpecs {
    return {
      authentication_required: analysis.security.authentication_required,
      authorization_level: analysis.security.authorization_level,
      data_classification: analysis.security.data_classification,
      encryption_at_rest: analysis.security.encryption_at_rest,
      encryption_in_transit: analysis.security.encryption_in_transit,
      audit_logging: analysis.security.audit_logging,
      rate_limiting: false,
      input_validation: 'basic'
    };
  }

  /**
   * Extract technical metadata
   */
  private extractMetadata(analysis: ContextAnalysis, options: ExtractOptions): TechnicalMetadata {
    return {
      dependencies: analysis.dependencies.map(d => d.name),
      integrations: [], // Will be populated by integration section
      api_contracts: analysis.contracts.map(c => c.name),
      last_updated: new Date().toISOString().split('T')[0],
      version: options.version || '1.0.0',
      maintainer: options.maintainer || 'Orchestra.blue Team'
    };
  }

  /**
   * Extract agentic integration
   */
  private extractAgenticIntegration(analysis: ContextAnalysis, options: ExtractOptions): AgenticIntegration {
    return {
      agent_capabilities: {
        can_read: true,
        can_write: options.agent_can_write || false,
        can_propose_changes: true,
        requires_approval: options.agent_requires_approval !== false
      },
      agent_boundaries: {
        allowed_operations: ['read', 'query', 'analyze'],
        forbidden_operations: ['delete', 'unauthorized_access', 'security_bypass'],
        escalation_triggers: ['security_violation', 'performance_degradation', 'data_corruption']
      }
    };
  }

  /**
   * Extract purpose section content
   */
  private extractPurposeSection(analysis: ContextAnalysis): string {
    return analysis.purpose || 'Purpose to be defined based on module functionality.';
  }

  /**
   * Extract features section content
   */
  private extractFeaturesSection(analysis: ContextAnalysis): string[] {
    return analysis.features.map(f => `**${this.toTitleCase(f)}:** ${f}`);
  }

  /**
   * Extract architecture section content
   */
  private extractArchitectureSection(analysis: ContextAnalysis): string {
    return analysis.architecture || 'Architecture diagram and component description to be defined.';
  }

  /**
   * Extract contracts section content
   */
  private extractContractsSection(analysis: ContextAnalysis): string {
    if (analysis.contracts.length === 0) {
      return 'API contracts to be defined.';
    }

    return analysis.contracts.map(c =>
      `### ${c.name}\n\`\`\`typescript\n${c.definition}\n\`\`\``
    ).join('\n\n');
  }

  /**
   * Extract dependencies section content
   */
  private extractDependenciesSection(analysis: ContextAnalysis): string[] {
    return analysis.dependencies.map(d =>
      d.version ? `${d.name}@${d.version}` : d.name
    );
  }

  /**
   * Extract testing section content
   */
  private extractTestingSection(analysis: ContextAnalysis): string {
    return `
**Unit Tests:**
- Test core functionality
- Test error handling
- Test edge cases

**Integration Tests:**
- Test API contracts
- Test dependencies
- Test data flow

**E2E Tests:**
- Test complete user workflows
- Test performance under load
- Test security requirements
`.trim();
  }

  /**
   * Extract security details section
   */
  private extractSecurityDetailsSection(analysis: ContextAnalysis): string {
    return `
**Authentication:** ${analysis.security.authentication_required ? 'Required' : 'Not required'}
**Encryption:** ${analysis.security.encryption_in_transit ? 'In transit' : 'None'}
**Audit Logging:** ${analysis.security.audit_logging ? 'Enabled' : 'Disabled'}
**Data Classification:** ${analysis.security.data_classification}
`.trim();
  }

  /**
   * Extract performance section
   */
  private extractPerformanceSection(analysis: ContextAnalysis): string {
    return `
**Response Time:** <${analysis.performance.max_response_time_ms}ms (p95)
**Memory Usage:** <${analysis.performance.max_memory_mb}MB
**Concurrent Requests:** ${analysis.performance.concurrent_requests}
**Availability:** ${analysis.performance.availability_percent}%
`.trim();
  }

  /**
   * Extract observability details section
   */
  private extractObservabilityDetailsSection(analysis: ContextAnalysis): string {
    return 'Metrics, alerts, and dashboards defined in frontmatter observability section.';
  }

  /**
   * Extract operations section
   */
  private extractOperationsSection(analysis: ContextAnalysis): string {
    return `
**Deployment:**
- Standard deployment process
- Zero-downtime deployment
- Rollback capability

**Monitoring:**
- Health checks enabled
- Performance monitoring
- Error tracking

**Maintenance:**
- Regular updates
- Security patches
- Performance optimization
`.trim();
  }

  /**
   * Extract integrations section
   */
  private extractIntegrationsSection(analysis: ContextAnalysis): string {
    if (analysis.dependencies.length === 0) {
      return 'No external integrations required.';
    }

    return `
**External Dependencies:**
${analysis.dependencies.map(d => `- ${d.name}${d.version ? `@${d.version}` : ''}`).join('\n')}
`.trim();
  }

  /**
   * Extract promotion checklist section
   */
  private extractPromotionChecklistSection(analysis: ContextAnalysis): string {
    return `
- [ ] All features implemented
- [ ] All tests passing
- [ ] Security requirements met
- [ ] Performance SLA achieved
- [ ] Documentation complete
- [ ] Production deployment validated
`.trim();
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}

export interface ExtractOptions {
  project: string;
  module_name: string;
  category?: ModuleIdentity['category'];
  lifecycle?: SystematicScaffolding['lifecycle'];
  state?: SystematicScaffolding['state'];
  seat?: SystematicScaffolding['seat'];
  phase_availability?: AvailabilityAccess['phase_availability'];
  priority?: AvailabilityAccess['priority'];
  agent_accessible?: boolean;
  user_configurable?: boolean;
  agent_can_write?: boolean;
  agent_requires_approval?: boolean;
  version?: string;
  maintainer?: string;
}
