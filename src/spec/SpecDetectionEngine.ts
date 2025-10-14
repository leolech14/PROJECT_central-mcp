/**
 * Spec Detection Engine
 * ======================
 *
 * Proactively detects when user provides specifications.
 * Analyzes natural language to identify spec input.
 *
 * REVOLUTIONARY: Makes CI proactive, not reactive!
 */

export interface SpecDetection {
  detected: boolean;
  confidence: number; // 0-100
  suggestedSpecType: SpecType;
  extractedRequirements: Requirement[];
  suggestedTasks?: number; // Estimated task count
  estimatedHours?: number;
}

export type SpecType =
  | 'FEATURE'
  | 'COMPONENT'
  | 'SYSTEM'
  | 'API'
  | 'INTEGRATION'
  | 'INFRASTRUCTURE';

export interface Requirement {
  text: string;
  type: 'FUNCTIONAL' | 'PERFORMANCE' | 'QUALITY';
  testable: boolean;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class SpecDetectionEngine {
  /**
   * Detect if message contains specification
   */
  detectSpecInput(userMessage: string): SpecDetection {
    const message = userMessage.toLowerCase();

    // Indicators of spec input
    const specIndicators = [
      'should', 'must', 'needs to', 'requirements',
      'build', 'create', 'implement', 'develop',
      'feature', 'system', 'component', 'api',
      'specification', 'spec', 'design'
    ];

    // Count indicators
    const indicatorCount = specIndicators.filter(ind => message.includes(ind)).length;

    // Check for requirement patterns
    const reqPatterns = [
      /should (.+?)(?:\.|$)/gi,
      /must (.+?)(?:\.|$)/gi,
      /needs? to (.+?)(?:\.|$)/gi,
      /requirement[s]?:(.+?)(?:\n|$)/gi
    ];

    const requirements = this.extractRequirements(userMessage, reqPatterns);

    // Calculate confidence
    const confidence = Math.min(100, (indicatorCount * 10) + (requirements.length * 15));

    // Determine if this is a spec
    const detected = confidence >= 40 || requirements.length >= 2;

    if (!detected) {
      return {
        detected: false,
        confidence: 0,
        suggestedSpecType: 'FEATURE',
        extractedRequirements: []
      };
    }

    // Infer spec type
    const specType = this.inferSpecType(userMessage);

    // Estimate scope
    const estimatedTasks = Math.max(3, Math.ceil(requirements.length / 2));
    const estimatedHours = estimatedTasks * 4; // Average 4h per task

    return {
      detected: true,
      confidence,
      suggestedSpecType: specType,
      extractedRequirements: requirements,
      suggestedTasks: estimatedTasks,
      estimatedHours
    };
  }

  /**
   * Extract requirements from text
   */
  private extractRequirements(text: string, patterns: RegExp[]): Requirement[] {
    const requirements: Requirement[] = [];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);

      for (const match of matches) {
        const reqText = match[1].trim();

        if (reqText.length > 10) { // Meaningful requirement
          requirements.push({
            text: reqText,
            type: this.inferReqType(reqText),
            testable: this.isTestable(reqText),
            priority: this.inferPriority(reqText)
          });
        }
      }
    }

    return requirements;
  }

  /**
   * Infer spec type from content
   */
  private inferSpecType(text: string): SpecType {
    const lower = text.toLowerCase();

    if (lower.includes('api') || lower.includes('endpoint')) return 'API';
    if (lower.includes('component') || lower.includes('ui')) return 'COMPONENT';
    if (lower.includes('system') || lower.includes('architecture')) return 'SYSTEM';
    if (lower.includes('integration') || lower.includes('bridge')) return 'INTEGRATION';
    if (lower.includes('infrastructure') || lower.includes('deployment')) return 'INFRASTRUCTURE';

    return 'FEATURE'; // Default
  }

  /**
   * Infer requirement type
   */
  private inferReqType(text: string): 'FUNCTIONAL' | 'PERFORMANCE' | 'QUALITY' {
    const lower = text.toLowerCase();

    if (lower.includes('fast') || lower.includes('time') || lower.includes('performance')) {
      return 'PERFORMANCE';
    }

    if (lower.includes('quality') || lower.includes('test') || lower.includes('coverage')) {
      return 'QUALITY';
    }

    return 'FUNCTIONAL';
  }

  /**
   * Check if requirement is testable
   */
  private isTestable(text: string): boolean {
    const testable = [
      'returns', 'displays', 'shows', 'saves', 'creates',
      'validates', 'processes', 'handles', 'supports'
    ];

    return testable.some(word => text.toLowerCase().includes(word));
  }

  /**
   * Infer priority
   */
  private inferPriority(text: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const lower = text.toLowerCase();

    if (lower.includes('critical') || lower.includes('must')) return 'HIGH';
    if (lower.includes('should') || lower.includes('important')) return 'MEDIUM';

    return 'LOW';
  }
}
