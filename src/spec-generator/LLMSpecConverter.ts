/**
 * LLM-Powered Spec Converter
 *
 * Uses LLM reasoning to intelligently convert specs from various formats to Orchestra format.
 * The script provides structured guidance while the LLM handles semantic understanding.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface RawSpecContent {
  format: 'central-mcp' | 'localbrain-simple' | 'orchestra' | 'legacy';
  title: string;
  extractedSections: Record<string, string>;
  rawContent: string;
  metadata?: Record<string, any>;
}

export interface OrchestraConversion {
  frontmatter: Record<string, any>;
  sections: {
    purpose: string;
    features: string;
    architecture: string;
    contracts: string;
    subcomponents: string;
    state_progression: string;
    production_implementation: string;
    security: string;
    testing: string;
    success_criteria: string;
    agent_integration: string;
    integrations: string;
  };
  reasoning: string;
}

export class LLMSpecConverter {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Convert raw spec content to Orchestra format using LLM reasoning
   */
  async convertToOrchestra(rawSpec: RawSpecContent): Promise<OrchestraConversion> {
    console.log(`🤖 LLM analyzing ${rawSpec.format} format spec...`);

    const prompt = this.buildConversionPrompt(rawSpec);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.3, // Lower temperature for more structured output
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    return this.parseConversionResponse(responseText);
  }

  /**
   * Build structured conversion prompt based on detected format
   */
  private buildConversionPrompt(rawSpec: RawSpecContent): string {
    const orchestraTemplate = this.getOrchestraTemplate();

    return `You are a technical specification expert converting specs to the Orchestra Universal Specification Standard.

# INPUT SPECIFICATION

**Detected Format:** ${rawSpec.format}
**Title:** ${rawSpec.title}

## Extracted Sections
${this.formatExtractedSections(rawSpec.extractedSections)}

## Full Raw Content
\`\`\`markdown
${rawSpec.rawContent}
\`\`\`

# ORCHESTRA FORMAT TEMPLATE

${orchestraTemplate}

# CONVERSION TASK

Convert the input specification to Orchestra format by:

1. **Analyze the input content** to understand:
   - Core purpose and objectives
   - Key features and capabilities
   - Technical architecture and components
   - Dependencies and integrations
   - Testing and security requirements

2. **Map to Orchestra structure**:
   - Generate complete YAML frontmatter with all required fields
   - Fill all 12 sections with semantically appropriate content
   - Expand minimal content into comprehensive descriptions
   - Reorganize rich content to fit Orchestra structure
   - Infer missing information from context

3. **Ensure quality**:
   - Purpose section: Clear objective + out of scope
   - Features section: Concrete capability commitments
   - Architecture section: Include mermaid diagram
   - Contracts section: TypeScript interfaces for I/O
   - State Progression: Define gates for minimal→i1→i2→i3→complete
   - All sections: Professional, production-ready content

# OUTPUT FORMAT

Return ONLY a JSON object with this exact structure:

\`\`\`json
{
  "frontmatter": {
    "title": "...",
    "module_id": "...",
    "type": "module|feature|service|component",
    "category": "actor|service|manager|engine|bridge|feature",
    "lifecycle": "dev|qa|prod",
    "state": "minimal|i1|i2|i3|complete",
    "seat": "prototype|mvp|scale",
    "phase_availability": "always|post_onboarding|unlockable|expert",
    "priority": "critical|high|medium|low",
    "dependencies": [],
    "integrations": [],
    "last_updated": "YYYY-MM-DD",
    "version": "1.0",
    "maintainer": "Team Name"
  },
  "sections": {
    "purpose": "**What this module solves and its clear boundaries.**\\n\\n[Content with out of scope]",
    "features": "**Capability commitments - what this module delivers.**\\n\\n[Bulleted list]",
    "architecture": "**Internal structure and flows.**\\n\\n\`\`\`mermaid\\ngraph TD\\n  A[Input] --> B[Process]\\n\`\`\`\\n\\n[Components]",
    "contracts": "**Formal I/O contracts.**\\n\\n\`\`\`typescript\\ninterface Input {...}\\n\`\`\`",
    "subcomponents": "**Module decomposition.**\\n\\n### ComponentName\\n[Details]",
    "state_progression": "**Module maturity: Minimal → I1 → I2 → I3 → Complete**\\n\\n[Promotion gates]",
    "production_implementation": "**Build, run, and operate in production.**\\n\\n[Code + steps]",
    "security": "**Security guarantees.**\\n\\n[Controls and requirements]",
    "testing": "**Test approach and scenarios.**\\n\\n[Test cases]",
    "success_criteria": "**Measurable targets and telemetry.**\\n\\n| Metric | Target | Window | Source |",
    "agent_integration": "**How autonomous agents interact with this module.**\\n\\n[Agent capabilities]",
    "integrations": "**Dependencies, data flows, and cross-references.**\\n\\n[Integration details]"
  },
  "reasoning": "Brief explanation of key conversion decisions made"
}
\`\`\`

${this.getFormatSpecificGuidance(rawSpec.format)}

**IMPORTANT:** Return ONLY the JSON object, no markdown formatting, no explanations outside the JSON.`;
  }

  /**
   * Get format-specific conversion guidance
   */
  private getFormatSpecificGuidance(format: string): string {
    switch (format) {
      case 'localbrain-simple':
        return `
# FORMAT-SPECIFIC GUIDANCE (LocalBrain Simple)

This format has minimal content. Your task is to:
- Intelligently expand brief descriptions into comprehensive sections
- Infer architecture from dependencies and integration points
- Generate appropriate contracts based on technical requirements
- Create realistic state progression gates
- Add professional testing scenarios
- Fill security section with standard best practices`;

      case 'central-mcp':
        return `
# FORMAT-SPECIFIC GUIDANCE (Central-MCP Custom)

This format has rich technical content but different structure. Your task is to:
- Map detailed technical specs to Orchestra architecture section
- Convert JavaScript/TypeScript interfaces to Contracts section
- Extract KPIs and metrics for Success Criteria
- Reorganize implementation roadmap into State Progression gates
- Map security framework to Security section
- Extract testing strategy from validation criteria`;

      case 'orchestra':
        return `
# FORMAT-SPECIFIC GUIDANCE (Orchestra Format)

Already in Orchestra format. Your task is to:
- Validate all 12 sections are complete
- Fill any missing sections with appropriate content
- Ensure frontmatter has all required fields
- Verify state progression gates are defined
- Confirm contracts have TypeScript interfaces`;

      case 'legacy':
        return `
# FORMAT-SPECIFIC GUIDANCE (Legacy Format)

Minimal or no structured content. Your task is to:
- Extract title and infer purpose
- Generate comprehensive sections from minimal context
- Create appropriate architecture based on inferred type
- Add professional boilerplate for all sections
- Use conservative assumptions for technical details`;

      default:
        return '';
    }
  }

  /**
   * Orchestra template reference
   */
  private getOrchestraTemplate(): string {
    return `## ORCHESTRA UNIVERSAL SPECIFICATION STANDARD

### Frontmatter (YAML)
- **Module Identity:** title, module_id, type, category
- **Systematic Scaffolding:** lifecycle, state, seat
- **Availability:** phase_availability, priority
- **Technical Metadata:** dependencies, integrations, last_updated, version, maintainer

### 12 Required Sections
1. **Purpose** - What it solves, clear boundaries, out of scope
2. **Primary Features** - Capability commitments
3. **Architecture** - Internal structure, mermaid diagrams
4. **Contracts** - Formal I/O interfaces (TypeScript)
5. **Sub-Components & Behavior** - Module decomposition
6. **State Progression & Promotion Gates** - Maturity levels
7. **Production Implementation** - Build, run, operate
8. **Security & Compliance** - Security guarantees
9. **Testing Strategy** - Test scenarios
10. **Success Criteria, Performance & Observability** - Metrics, SLOs
11. **Agent Integration** - How agents interact
12. **Integrations & References** - Dependencies, data flows`;
  }

  /**
   * Format extracted sections for prompt
   */
  private formatExtractedSections(sections: Record<string, string>): string {
    return Object.entries(sections)
      .map(([name, content]) => `### ${name}\n${content}\n`)
      .join('\n');
  }

  /**
   * Parse LLM response into structured conversion
   */
  private parseConversionResponse(responseText: string): OrchestraConversion {
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = responseText.trim();

    // Remove markdown code block markers if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    try {
      const parsed = JSON.parse(jsonText);

      // Validate structure
      if (!parsed.frontmatter || !parsed.sections) {
        throw new Error('Invalid conversion response: missing frontmatter or sections');
      }

      // Validate all 12 sections exist
      const requiredSections = [
        'purpose', 'features', 'architecture', 'contracts', 'subcomponents',
        'state_progression', 'production_implementation', 'security', 'testing',
        'success_criteria', 'agent_integration', 'integrations'
      ];

      for (const section of requiredSections) {
        if (!parsed.sections[section]) {
          console.warn(`⚠️  Missing section: ${section} - adding placeholder`);
          parsed.sections[section] = `[Section to be completed: ${section}]`;
        }
      }

      return parsed as OrchestraConversion;
    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error);
      console.error('Response text:', responseText);
      throw new Error(`LLM response parsing failed: ${error}`);
    }
  }

  /**
   * Validate conversion quality (deterministic checks)
   */
  validateConversion(conversion: OrchestraConversion): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate frontmatter
    const fm = conversion.frontmatter;
    if (!fm.title) errors.push('Missing title');
    if (!fm.module_id) errors.push('Missing module_id');
    if (!['module', 'feature', 'service', 'component'].includes(fm.type)) {
      errors.push(`Invalid type: ${fm.type}`);
    }
    if (!['dev', 'qa', 'prod'].includes(fm.lifecycle)) {
      errors.push(`Invalid lifecycle: ${fm.lifecycle}`);
    }
    if (!['minimal', 'i1', 'i2', 'i3', 'complete'].includes(fm.state)) {
      errors.push(`Invalid state: ${fm.state}`);
    }

    // Validate sections are not empty
    const sections = conversion.sections;
    Object.entries(sections).forEach(([name, content]) => {
      if (!content || content.trim().length < 10) {
        errors.push(`Section too short or empty: ${name}`);
      }
    });

    // Check for mermaid diagram in architecture
    if (!sections.architecture.includes('```mermaid')) {
      console.warn('⚠️  Architecture section missing mermaid diagram');
    }

    // Check for TypeScript interfaces in contracts
    if (!sections.contracts.includes('```typescript') && !sections.contracts.includes('interface')) {
      console.warn('⚠️  Contracts section missing TypeScript interfaces');
    }

    // Check for promotion gates in state_progression
    if (!sections.state_progression.toLowerCase().includes('minimal') ||
        !sections.state_progression.toLowerCase().includes('complete')) {
      console.warn('⚠️  State progression missing maturity levels');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
