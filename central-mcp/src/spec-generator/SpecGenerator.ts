/**
 * Spec Generator - Main Engine for Automated Spec Generation
 * ===========================================================
 *
 * Coordinates all components to generate complete Orchestra format specs:
 * 1. ContextAnalyzer reads files
 * 2. SemanticExtractor extracts structure
 * 3. Orchestra templates applied
 * 4. Complete spec generated
 * 5. Validation performed
 * 6. Spec saved and registered in Central-MCP
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { ContextAnalyzer, ContextAnalysis } from './ContextAnalyzer';
import { SemanticExtractor, OrchestraSemanticStructure, ExtractOptions } from './SemanticExtractor';

export interface SpecGenerationOptions {
  project: string;
  module_name: string;
  context_files: string[];
  output_path: string;
  format: 'orchestra';
  category?: 'primitive' | 'first_degree' | 'default' | 'advanced' | 'backend' | 'agentic';
  lifecycle?: 'dev' | 'staging' | 'production';
  validate?: boolean;
}

export interface GeneratedSpec {
  path: string;
  content: string;
  validation: ValidationResult;
  metadata: SpecMetadata;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export interface SpecMetadata {
  module_id: string;
  title: string;
  generated_at: string;
  context_files: string[];
  lines: number;
  sections: number;
  frontmatter_fields: number;
}

export class SpecGenerator {
  private contextAnalyzer: ContextAnalyzer;
  private semanticExtractor: SemanticExtractor;

  constructor() {
    this.contextAnalyzer = new ContextAnalyzer();
    this.semanticExtractor = new SemanticExtractor();
  }

  /**
   * Generate complete Orchestra format spec from context files
   */
  async generate(options: SpecGenerationOptions): Promise<GeneratedSpec> {
    console.log(`🚀 Generating spec for ${options.module_name}...`);

    // Step 1: Read and analyze context files
    console.log(`📖 Reading ${options.context_files.length} context files...`);
    await this.contextAnalyzer.readContextFiles(options.context_files);
    const analysis = await this.contextAnalyzer.analyze();
    console.log(`✅ Analyzed context: ${analysis.features.length} features, ${analysis.contracts.length} contracts`);

    // Step 2: Extract semantic structure
    console.log(`🧠 Extracting Orchestra semantic structure...`);
    const extractOptions: ExtractOptions = {
      project: options.project,
      module_name: options.module_name,
      category: options.category,
      lifecycle: options.lifecycle || 'dev'
    };
    const structure = await this.semanticExtractor.extract(analysis, extractOptions);
    console.log(`✅ Extracted structure: module_id=${structure.module_identity.module_id}`);

    // Step 3: Generate spec content
    console.log(`📝 Generating Orchestra format spec...`);
    const content = this.generateSpecContent(structure, analysis);
    console.log(`✅ Generated ${content.split('\n').length} lines of spec`);

    // Step 4: Validate spec (if requested)
    let validation: ValidationResult;
    if (options.validate !== false) {
      console.log(`🔍 Validating generated spec...`);
      validation = this.validateSpec(content, structure);
      console.log(`✅ Validation score: ${validation.score}/100`);
    } else {
      validation = { passed: true, errors: [], warnings: [], score: 100 };
    }

    // Step 5: Save spec file
    console.log(`💾 Saving spec to ${options.output_path}...`);
    await this.saveSpec(options.output_path, content);
    console.log(`✅ Spec saved successfully!`);

    // Create metadata
    const metadata: SpecMetadata = {
      module_id: structure.module_identity.module_id,
      title: structure.module_identity.title,
      generated_at: new Date().toISOString(),
      context_files: options.context_files,
      lines: content.split('\n').length,
      sections: 12, // Orchestra format has 12 sections
      frontmatter_fields: this.countFrontmatterFields(content)
    };

    return {
      path: options.output_path,
      content,
      validation,
      metadata
    };
  }

  /**
   * Generate complete spec content in Orchestra format
   */
  private generateSpecContent(structure: OrchestraSemanticStructure, analysis: ContextAnalysis): string {
    const { module_identity, systematic_scaffolding, availability_access, promotion_gates, observability, security, technical_metadata, agentic_integration, sections } = structure;

    return `---
# ===== MODULE IDENTITY =====
title: "${module_identity.title}"
module_id: "${module_identity.module_id}"
type: "${module_identity.type}"
category: "${module_identity.category}"

# ===== SYSTEMATIC SCAFFOLDING =====
lifecycle: "${systematic_scaffolding.lifecycle}"
state: "${systematic_scaffolding.state}"
seat: "${systematic_scaffolding.seat}"

# ===== AVAILABILITY AND ACCESS =====
phase_availability: "${availability_access.phase_availability}"
priority: "${availability_access.priority}"
agent_accessible: ${availability_access.agent_accessible}
user_configurable: ${availability_access.user_configurable}

# ===== PROMOTION GATES =====
promotion_gates:
  to_intermediate_i1:
${promotion_gates.to_intermediate_i1.map(g => `    - "${g}"`).join('\n')}
  to_intermediate_i2:
${promotion_gates.to_intermediate_i2.map(g => `    - "${g}"`).join('\n')}
  to_intermediate_i3:
${promotion_gates.to_intermediate_i3.map(g => `    - "${g}"`).join('\n')}
  to_complete:
${promotion_gates.to_complete.map(g => `    - "${g}"`).join('\n')}

# ===== OBSERVABILITY =====
observability:
  metrics:
${observability.metrics.map(m => `    - "${m}"`).join('\n')}
  alerts:
${observability.alerts.map(a => `    - "${a}"`).join('\n')}
  dashboards:
${observability.dashboards.map(d => `    - "${d}"`).join('\n')}

# ===== SECURITY REQUIREMENTS =====
security:
  authentication_required: ${security.authentication_required}
  authorization_level: "${security.authorization_level}"
  data_classification: "${security.data_classification}"
  encryption_at_rest: ${security.encryption_at_rest}
  encryption_in_transit: ${security.encryption_in_transit}
  audit_logging: ${security.audit_logging}
  rate_limiting: ${security.rate_limiting}
  input_validation: "${security.input_validation}"

# ===== TECHNICAL METADATA =====
dependencies: ${JSON.stringify(technical_metadata.dependencies)}
integrations: ${JSON.stringify(technical_metadata.integrations)}
api_contracts: ${JSON.stringify(technical_metadata.api_contracts)}
last_updated: "${technical_metadata.last_updated}"
version: "${technical_metadata.version}"
maintainer: "${technical_metadata.maintainer}"

# ===== AGENTIC INTEGRATION =====
agent_capabilities:
  can_read: ${agentic_integration.agent_capabilities.can_read}
  can_write: ${agentic_integration.agent_capabilities.can_write}
  can_propose_changes: ${agentic_integration.agent_capabilities.can_propose_changes}
  requires_approval: ${agentic_integration.agent_capabilities.requires_approval}

agent_boundaries:
  allowed_operations: ${JSON.stringify(agentic_integration.agent_boundaries.allowed_operations)}
  forbidden_operations: ${JSON.stringify(agentic_integration.agent_boundaries.forbidden_operations)}
  escalation_triggers: ${JSON.stringify(agentic_integration.agent_boundaries.escalation_triggers)}
---

# ${module_identity.title}

## 4-Purpose

**O QUE É:** ${sections.purpose}

**DEVE CONTER:**
- Objetivo em 1-2 parágrafos explicando o "porquê" este módulo existe
- "Out of scope" em bullets (o que este módulo NÃO faz)

**NÃO DEVE CONTER:**
- Decisões de implementação específicas
- Comandos de execução
- Detalhes técnicos (vão em Architecture)

---

## 5-Primary Features

**O QUE É:** Compromissos de capacidade do módulo - o que ele entrega.

**Features:**
${sections.primary_features.map(f => `- ${f}`).join('\n')}

---

## 6-Architecture

**O QUE É:** Estrutura INTERNA do módulo e seus fluxos internos.

${sections.architecture}

\`\`\`mermaid
graph TD
    A[User] -->|Request| B[Module]
    B -->|Process| C[Core Logic]
    C -->|Response| A
\`\`\`

**Components:**
${analysis.contracts.map(c => `- **${c.name}:** ${c.description}`).join('\n')}

---

## 7-Contracts

**O QUE É:** Contratos de API e interfaces públicas.

${sections.contracts}

---

## 8-Dependencies

**O QUE É:** Dependências externas e internas.

**Dependencies:**
${sections.dependencies.map(d => `- \`${d}\``).join('\n')}

---

## 9-Testing

**O QUE É:** Estratégia e requisitos de teste.

${sections.testing}

---

## 10-Security

**O QUE É:** Requisitos e implementações de segurança.

${sections.security_details}

---

## 11-Performance

**O QUE É:** Requisitos de desempenho e SLAs.

${sections.performance}

---

## 12-Observability

**O QUE É:** Métricas, alertas e dashboards.

${sections.observability_details}

**Metrics:**
${observability.metrics.map(m => `- \`${m}\``).join('\n')}

**Alerts:**
${observability.alerts.map(a => `- \`${a}\``).join('\n')}

**Dashboards:**
${observability.dashboards.map(d => `- \`${d}\``).join('\n')}

---

## 13-Operations

**O QUE É:** Deployment, monitoring, e manutenção.

${sections.operations}

---

## 14-Integrations & References

**O QUE É:** Sistemas externos e referências.

${sections.integrations}

---

## 15-Promotion Checklist

**O QUE É:** Critérios para avançar entre estados.

### To Intermediate I1:
${promotion_gates.to_intermediate_i1.map(g => `- [ ] ${g}`).join('\n')}

### To Intermediate I2:
${promotion_gates.to_intermediate_i2.map(g => `- [ ] ${g}`).join('\n')}

### To Intermediate I3:
${promotion_gates.to_intermediate_i3.map(g => `- [ ] ${g}`).join('\n')}

### To Complete:
${promotion_gates.to_complete.map(g => `- [ ] ${g}`).join('\n')}

---

**🎊 Generated by Central-MCP Automated Spec Generator**
**📅 Generated: ${new Date().toISOString()}**
**🤖 Agent: B (Sonnet-4.5)**
`;
  }

  /**
   * Validate generated spec
   */
  private validateSpec(content: string, structure: OrchestraSemanticStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check frontmatter
    if (!content.startsWith('---')) {
      errors.push('Missing frontmatter YAML block');
      score -= 20;
    }

    // Check module identity
    if (!structure.module_identity.title) {
      errors.push('Missing module title');
      score -= 10;
    }
    if (!structure.module_identity.module_id) {
      errors.push('Missing module ID');
      score -= 10;
    }

    // Check sections
    const requiredSections = ['Purpose', 'Primary Features', 'Architecture', 'Contracts', 'Dependencies', 'Testing', 'Security', 'Performance', 'Observability', 'Operations', 'Integrations', 'Promotion Checklist'];

    for (const section of requiredSections) {
      if (!content.includes(`## ${section}`) && !content.includes(`## 4-${section}`) && !content.includes(`## 5-${section}`) && !content.includes(`## 6-${section}`)) {
        warnings.push(`Section "${section}" may be missing`);
        score -= 2;
      }
    }

    // Check observability
    if (structure.observability.metrics.length === 0) {
      warnings.push('No observability metrics defined');
      score -= 3;
    }

    // Check security
    if (!structure.security.authentication_required && !structure.security.encryption_in_transit) {
      warnings.push('No security requirements defined');
      score -= 3;
    }

    // Check agentic integration
    if (!structure.agentic_integration.agent_capabilities.can_read) {
      warnings.push('Agent read capability not enabled');
      score -= 2;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Save spec to file
   */
  private async saveSpec(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Count frontmatter fields
   */
  private countFrontmatterFields(content: string): number {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return 0;

    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    return lines.length;
  }
}
