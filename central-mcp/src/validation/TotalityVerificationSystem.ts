/**
 * TOTALITY VERIFICATION SYSTEM
 * =============================
 *
 * THE PRINCIPLE OF TOTALITY:
 * "The list IS the total, not a sample."
 *
 * This system ensures COMPLETENESS - that nothing falls through the cracks:
 *
 * 1. ALL user messages → captured in conversation_messages
 * 2. ALL messages → processed into extracted_insights
 * 3. ALL insights → converted to specs or tasks
 * 4. ALL specs → implemented in code
 * 5. ALL implementations → validated
 * 6. ALL validations → deployed
 *
 * VERIFICATION LAYERS:
 * - Message Completeness: Did we capture EVERY user message?
 * - Insight Completeness: Did we extract insights from EVERY message?
 * - Spec Completeness: Did we create specs from EVERY actionable insight?
 * - Task Completeness: Did we create tasks from EVERY spec?
 * - Implementation Completeness: Did we implement EVERY task?
 * - Validation Completeness: Did we validate EVERY implementation?
 *
 * This is the AUDIT SYSTEM that ensures the TOTALITY PRINCIPLE!
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { AutoProactiveEventBus, LoopEvent } from '../auto-proactive/EventBus.js';

export interface TotalityReport {
  timestamp: Date;
  overall_completeness: number;      // 0-100%
  layers: CompletenessLayer[];
  gaps: Gap[];
  recommendations: string[];
}

export interface CompletenessLayer {
  layer_name: string;
  input_count: number;               // Total inputs to this layer
  processed_count: number;           // Successfully processed
  pending_count: number;             // Waiting to be processed
  failed_count: number;              // Failed to process
  completeness_percent: number;      // processed / input * 100
  processing_time_avg_ms: number;    // Average processing time
}

export interface Gap {
  gap_type: 'UNPROCESSED_MESSAGE' | 'UNEXTRACTED_INSIGHT' | 'UNSPECCED_INSIGHT' |
            'UNTASKED_SPEC' | 'UNIMPLEMENTED_TASK' | 'UNVALIDATED_IMPLEMENTATION';
  entity_id: string;
  entity_type: string;
  created_at: Date;
  age_hours: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

/**
 * Totality Verification System
 *
 * Ensures COMPLETE processing of all intelligence through the pipeline.
 */
export class TotalityVerificationSystem {
  private db: Database.Database;
  private eventBus: AutoProactiveEventBus;

  constructor(db: Database.Database) {
    this.db = db;
    this.eventBus = AutoProactiveEventBus.getInstance();
  }

  /**
   * Generate complete totality report
   */
  async generateTotalityReport(): Promise<TotalityReport> {
    logger.info(`🔍 Generating Totality Report...`);

    const layers: CompletenessLayer[] = [];

    // Layer 1: Message Capture Completeness
    layers.push(await this.verifyMessageCapture());

    // Layer 2: Insight Extraction Completeness
    layers.push(await this.verifyInsightExtraction());

    // Layer 3: Spec Generation Completeness
    layers.push(await this.verifySpecGeneration());

    // Layer 4: Task Creation Completeness
    layers.push(await this.verifyTaskCreation());

    // Layer 5: Implementation Completeness
    layers.push(await this.verifyImplementation());

    // Layer 6: Validation Completeness
    layers.push(await this.verifyValidation());

    // Calculate overall completeness
    const overall_completeness = Math.round(
      layers.reduce((sum, l) => sum + l.completeness_percent, 0) / layers.length
    );

    // Identify gaps
    const gaps = await this.identifyGaps();

    // Generate recommendations
    const recommendations = this.generateRecommendations(layers, gaps);

    const report: TotalityReport = {
      timestamp: new Date(),
      overall_completeness,
      layers,
      gaps,
      recommendations
    };

    logger.info(`✅ Totality Report Generated: ${overall_completeness}% complete`);
    logger.info(`   Gaps found: ${gaps.length}`);

    return report;
  }

  /**
   * Layer 1: Verify message capture completeness
   *
   * Ensures ALL user messages are captured in conversation_messages table.
   */
  private async verifyMessageCapture(): Promise<CompletenessLayer> {
    try {
      // Get total user messages
      const total = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM conversation_messages
        WHERE message_type = 'USER_INPUT'
      `).get() as { count: number };

      // Get messages with metadata extracted
      const processed = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM conversation_messages
        WHERE message_type = 'USER_INPUT'
        AND metadata IS NOT NULL
        AND json_valid(metadata)
      `).get() as { count: number };

      const pending = total.count - processed.count;

      return {
        layer_name: 'Message Capture',
        input_count: total.count,
        processed_count: processed.count,
        pending_count: pending,
        failed_count: 0,
        completeness_percent: total.count > 0
          ? Math.round((processed.count / total.count) * 100)
          : 100,
        processing_time_avg_ms: 0
      };
    } catch (err: any) {
      logger.error(`❌ Message capture verification failed: ${err.message}`);
      return this.emptyLayer('Message Capture');
    }
  }

  /**
   * Layer 2: Verify insight extraction completeness
   *
   * Ensures ALL messages → extracted_insights.
   */
  private async verifyInsightExtraction(): Promise<CompletenessLayer> {
    try {
      // Get total user messages
      const total = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM conversation_messages
        WHERE message_type = 'USER_INPUT'
      `).get() as { count: number };

      // Get messages with extracted insights
      const processed = this.db.prepare(`
        SELECT COUNT(DISTINCT message_id) as count
        FROM extracted_insights
      `).get() as { count: number };

      const pending = total.count - processed.count;

      return {
        layer_name: 'Insight Extraction',
        input_count: total.count,
        processed_count: processed.count,
        pending_count: pending,
        failed_count: 0,
        completeness_percent: total.count > 0
          ? Math.round((processed.count / total.count) * 100)
          : 100,
        processing_time_avg_ms: 0
      };
    } catch (err: any) {
      logger.error(`❌ Insight extraction verification failed: ${err.message}`);
      return this.emptyLayer('Insight Extraction');
    }
  }

  /**
   * Layer 3: Verify spec generation completeness
   *
   * Ensures ALL actionable insights → specs.
   */
  private async verifySpecGeneration(): Promise<CompletenessLayer> {
    try {
      // Get total actionable insights
      const total = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM extracted_insights
        WHERE is_actionable = 1
      `).get() as { count: number };

      // Get insights with specs generated
      // (Tracked via auto_proactive_logs)
      const processed = this.db.prepare(`
        SELECT COUNT(DISTINCT json_extract(result, '$.messageId')) as count
        FROM auto_proactive_logs
        WHERE loop_name = 'SPEC_AUTO_GENERATION'
        AND action IN ('spec_generated', 'detected_pending_llm')
      `).get() as { count: number };

      const pending = total.count - processed.count;

      return {
        layer_name: 'Spec Generation',
        input_count: total.count,
        processed_count: processed.count,
        pending_count: pending,
        failed_count: 0,
        completeness_percent: total.count > 0
          ? Math.round((processed.count / total.count) * 100)
          : 100,
        processing_time_avg_ms: 0
      };
    } catch (err: any) {
      logger.error(`❌ Spec generation verification failed: ${err.message}`);
      return this.emptyLayer('Spec Generation');
    }
  }

  /**
   * Layer 4: Verify task creation completeness
   *
   * Ensures ALL specs → tasks.
   */
  private async verifyTaskCreation(): Promise<CompletenessLayer> {
    try {
      // Count spec files (would need to scan filesystem)
      // For now, use auto_proactive_logs
      const totalSpecs = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM auto_proactive_logs
        WHERE loop_name = 'SPEC_AUTO_GENERATION'
        AND action = 'spec_generated'
      `).get() as { count: number };

      // Count tasks (assumes tasks reference spec IDs)
      const tasksCreated = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE category = 'auto-generated'
      `).get() as { count: number };

      const pending = Math.max(0, totalSpecs.count - tasksCreated.count);

      return {
        layer_name: 'Task Creation',
        input_count: totalSpecs.count,
        processed_count: tasksCreated.count,
        pending_count: pending,
        failed_count: 0,
        completeness_percent: totalSpecs.count > 0
          ? Math.round((tasksCreated.count / totalSpecs.count) * 100)
          : 100,
        processing_time_avg_ms: 0
      };
    } catch (err: any) {
      logger.error(`❌ Task creation verification failed: ${err.message}`);
      return this.emptyLayer('Task Creation');
    }
  }

  /**
   * Layer 5: Verify implementation completeness
   *
   * Ensures ALL tasks → implemented.
   */
  private async verifyImplementation(): Promise<CompletenessLayer> {
    try {
      // Get total tasks
      const total = this.db.prepare(`
        SELECT COUNT(*) as count FROM tasks
      `).get() as { count: number };

      // Get completed tasks
      const completed = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE status = 'completed'
      `).get() as { count: number };

      // Get in-progress tasks
      const inProgress = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE status = 'in-progress'
      `).get() as { count: number };

      const pending = total.count - completed.count - inProgress.count;

      return {
        layer_name: 'Implementation',
        input_count: total.count,
        processed_count: completed.count,
        pending_count: pending,
        failed_count: 0,
        completeness_percent: total.count > 0
          ? Math.round((completed.count / total.count) * 100)
          : 0,
        processing_time_avg_ms: 0
      };
    } catch (err: any) {
      logger.error(`❌ Implementation verification failed: ${err.message}`);
      return this.emptyLayer('Implementation');
    }
  }

  /**
   * Layer 6: Verify validation completeness
   *
   * Ensures ALL implementations → validated.
   */
  private async verifyValidation(): Promise<CompletenessLayer> {
    try {
      // Get completed tasks
      const completed = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE status = 'completed'
      `).get() as { count: number };

      // Get validated tasks (would check spec_validation_results table)
      // For now, mock it
      const validated = 0; // TODO: Implement validation tracking

      const pending = completed.count - validated;

      return {
        layer_name: 'Validation',
        input_count: completed.count,
        processed_count: validated,
        pending_count: pending,
        failed_count: 0,
        completeness_percent: completed.count > 0
          ? Math.round((validated / completed.count) * 100)
          : 0,
        processing_time_avg_ms: 0
      };
    } catch (err: any) {
      logger.error(`❌ Validation verification failed: ${err.message}`);
      return this.emptyLayer('Validation');
    }
  }

  /**
   * Identify gaps (entities that haven't been processed)
   */
  private async identifyGaps(): Promise<Gap[]> {
    const gaps: Gap[] = [];

    try {
      // Gap 1: Messages without insights
      const unextractedMessages = this.db.prepare(`
        SELECT
          m.id,
          m.timestamp,
          m.content
        FROM conversation_messages m
        LEFT JOIN extracted_insights i ON i.message_id = m.id
        WHERE m.message_type = 'USER_INPUT'
        AND i.id IS NULL
        ORDER BY m.timestamp DESC
        LIMIT 50
      `).all() as any[];

      for (const msg of unextractedMessages) {
        const ageHours = (Date.now() - new Date(msg.timestamp).getTime()) / (1000 * 60 * 60);

        gaps.push({
          gap_type: 'UNEXTRACTED_INSIGHT',
          entity_id: msg.id,
          entity_type: 'conversation_message',
          created_at: new Date(msg.timestamp),
          age_hours: Math.round(ageHours),
          severity: ageHours > 24 ? 'HIGH' : ageHours > 6 ? 'MEDIUM' : 'LOW',
          recommendation: `Extract insights from message: "${msg.content.substring(0, 50)}..."`
        });
      }

      // Gap 2: Actionable insights without specs
      const unspeccedInsights = this.db.prepare(`
        SELECT
          i.id,
          i.extracted_at,
          i.insight_summary
        FROM extracted_insights i
        WHERE i.is_actionable = 1
        AND i.id NOT IN (
          SELECT json_extract(result, '$.messageId')
          FROM auto_proactive_logs
          WHERE loop_name = 'SPEC_AUTO_GENERATION'
        )
        ORDER BY i.extracted_at DESC
        LIMIT 50
      `).all() as any[];

      for (const insight of unspeccedInsights) {
        const ageHours = (Date.now() - new Date(insight.extracted_at).getTime()) / (1000 * 60 * 60);

        gaps.push({
          gap_type: 'UNSPECCED_INSIGHT',
          entity_id: insight.id,
          entity_type: 'extracted_insight',
          created_at: new Date(insight.extracted_at),
          age_hours: Math.round(ageHours),
          severity: ageHours > 48 ? 'CRITICAL' : ageHours > 12 ? 'HIGH' : 'MEDIUM',
          recommendation: `Generate spec from insight: "${insight.insight_summary.substring(0, 50)}..."`
        });
      }

      // Gap 3: Pending tasks (not implemented)
      const pendingTasks = this.db.prepare(`
        SELECT
          id,
          title,
          created_at,
          priority
        FROM tasks
        WHERE status = 'pending'
        ORDER BY priority, created_at
        LIMIT 50
      `).all() as any[];

      for (const task of pendingTasks) {
        const ageHours = (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60);

        gaps.push({
          gap_type: 'UNIMPLEMENTED_TASK',
          entity_id: task.id,
          entity_type: 'task',
          created_at: new Date(task.created_at),
          age_hours: Math.round(ageHours),
          severity: task.priority <= 2 ? 'CRITICAL' : task.priority === 3 ? 'HIGH' : 'MEDIUM',
          recommendation: `Assign task to agent: "${task.title}"`
        });
      }

    } catch (err: any) {
      logger.error(`❌ Gap identification failed: ${err.message}`);
    }

    return gaps;
  }

  /**
   * Generate recommendations based on gaps
   */
  private generateRecommendations(layers: CompletenessLayer[], gaps: Gap[]): string[] {
    const recommendations: string[] = [];

    // Check for low completeness layers
    for (const layer of layers) {
      if (layer.completeness_percent < 50) {
        recommendations.push(
          `⚠️  ${layer.layer_name} is only ${layer.completeness_percent}% complete (${layer.pending_count} pending)`
        );
      }
    }

    // Check for critical gaps
    const criticalGaps = gaps.filter(g => g.severity === 'CRITICAL');
    if (criticalGaps.length > 0) {
      recommendations.push(
        `🚨 ${criticalGaps.length} CRITICAL gaps found - immediate attention required`
      );
    }

    // Check for old gaps
    const oldGaps = gaps.filter(g => g.age_hours > 48);
    if (oldGaps.length > 0) {
      recommendations.push(
        `⏰ ${oldGaps.length} gaps are >48 hours old - review processing pipeline`
      );
    }

    // Specific recommendations
    const insightLayer = layers.find(l => l.layer_name === 'Insight Extraction');
    if (insightLayer && insightLayer.completeness_percent < 80) {
      recommendations.push(
        `💡 Run insight extraction on unprocessed messages`
      );
    }

    const specLayer = layers.find(l => l.layer_name === 'Spec Generation');
    if (specLayer && specLayer.completeness_percent < 80) {
      recommendations.push(
        `📋 Enable auto-spec generation (set autoGenerate: true in Loop 7 config)`
      );
    }

    const taskLayer = layers.find(l => l.layer_name === 'Task Creation');
    if (taskLayer && taskLayer.completeness_percent < 90) {
      recommendations.push(
        `✅ Generate tasks from completed specs`
      );
    }

    return recommendations;
  }

  /**
   * Emit totality verification event
   */
  emitTotalityReport(report: TotalityReport): void {
    this.eventBus.emitLoopEvent(
      LoopEvent.SYSTEM_HEALTH_CHANGED,
      {
        health: report.overall_completeness >= 80 ? 'healthy' : 'degraded',
        completeness: report.overall_completeness,
        gaps: report.gaps.length,
        critical_gaps: report.gaps.filter(g => g.severity === 'CRITICAL').length
      },
      {
        priority: report.overall_completeness < 60 ? 'high' : 'normal',
        source: 'TotalityVerificationSystem'
      }
    );
  }

  /**
   * Empty layer (error fallback)
   */
  private emptyLayer(name: string): CompletenessLayer {
    return {
      layer_name: name,
      input_count: 0,
      processed_count: 0,
      pending_count: 0,
      failed_count: 0,
      completeness_percent: 0,
      processing_time_avg_ms: 0
    };
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report: TotalityReport): string {
    const lines: string[] = [];

    lines.push(`# Totality Verification Report`);
    lines.push(`**Generated:** ${report.timestamp.toISOString()}`);
    lines.push(`**Overall Completeness:** ${report.overall_completeness}%`);
    lines.push('');

    // Layers
    lines.push(`## Completeness by Layer`);
    lines.push('');

    for (const layer of report.layers) {
      const icon = layer.completeness_percent >= 80 ? '✅' :
                   layer.completeness_percent >= 50 ? '⚠️' : '❌';

      lines.push(`### ${icon} ${layer.layer_name}: ${layer.completeness_percent}%`);
      lines.push(`- **Input:** ${layer.input_count}`);
      lines.push(`- **Processed:** ${layer.processed_count}`);
      lines.push(`- **Pending:** ${layer.pending_count}`);
      lines.push('');
    }

    // Gaps
    lines.push(`## Gaps Found: ${report.gaps.length}`);
    lines.push('');

    const criticalGaps = report.gaps.filter(g => g.severity === 'CRITICAL');
    const highGaps = report.gaps.filter(g => g.severity === 'HIGH');
    const mediumGaps = report.gaps.filter(g => g.severity === 'MEDIUM');
    const lowGaps = report.gaps.filter(g => g.severity === 'LOW');

    if (criticalGaps.length > 0) {
      lines.push(`### 🚨 CRITICAL (${criticalGaps.length})`);
      for (const gap of criticalGaps.slice(0, 5)) {
        lines.push(`- ${gap.recommendation} (${gap.age_hours}h old)`);
      }
      lines.push('');
    }

    if (highGaps.length > 0) {
      lines.push(`### ⚠️  HIGH (${highGaps.length})`);
      for (const gap of highGaps.slice(0, 5)) {
        lines.push(`- ${gap.recommendation} (${gap.age_hours}h old)`);
      }
      lines.push('');
    }

    // Recommendations
    lines.push(`## Recommendations`);
    lines.push('');

    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }

    return lines.join('\n');
  }
}
