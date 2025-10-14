import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export const runtime = 'nodejs';

const DB_PATH = process.env.DATABASE_PATH || '/opt/central-mcp/data/registry.db';

/**
 * GET /api/llm-status
 *
 * Returns LLM intelligence activation status and metrics
 */
export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Check if Anthropic API key is configured (from environment)
    const apiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;

    // Get Loop 7 execution stats (Spec Generation)
    const loop7Stats = db.prepare(`
      SELECT
        COUNT(*) as total_executions,
        COUNT(CASE WHEN json_extract(result, '$.specsGenerated') > 0 THEN 1 END) as successful_generations,
        SUM(CAST(json_extract(result, '$.specsGenerated') as INTEGER)) as total_specs_generated,
        AVG(execution_time_ms) as avg_latency_ms,
        MAX(timestamp) as last_execution
      FROM auto_proactive_logs
      WHERE loop_name = 'SPEC_AUTO_GENERATION'
    `).get() as any;

    // Get LLM model usage stats (if ai_model_usage table exists)
    let modelUsage: any = null;
    try {
      modelUsage = db.prepare(`
        SELECT
          SUM(prompt_tokens) as total_input_tokens,
          SUM(completion_tokens) as total_output_tokens,
          SUM(total_tokens) as total_tokens,
          AVG(latency_ms) as avg_latency_ms,
          COUNT(*) as total_requests,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests
        FROM ai_model_usage
        WHERE model_id LIKE '%anthropic%'
      `).get() as any;
    } catch (e) {
      // Table doesn't exist yet (pre-LLM activation)
    }

    // Calculate estimated cost (Claude Sonnet 4.5 pricing)
    let estimatedCost = 0;
    if (modelUsage && modelUsage.total_input_tokens) {
      const inputCost = (modelUsage.total_input_tokens / 1000000) * 3.00;  // $3 per 1M input tokens
      const outputCost = (modelUsage.total_output_tokens / 1000000) * 15.00; // $15 per 1M output tokens
      estimatedCost = inputCost + outputCost;
    }

    // Determine activation status
    const isFullyActivated = apiKeyConfigured && (loop7Stats?.successful_generations > 0);
    const isPartiallyActivated = apiKeyConfigured && (loop7Stats?.total_executions > 0);

    // Get autoGenerate setting from most recent Loop 7 log
    let autoGenerateEnabled = false;
    try {
      const recentLog = db.prepare(`
        SELECT result FROM auto_proactive_logs
        WHERE loop_name = 'SPEC_AUTO_GENERATION'
        ORDER BY timestamp DESC
        LIMIT 1
      `).get() as any;

      if (recentLog) {
        const result = JSON.parse(recentLog.result);
        // Check if it's in detection mode or generation mode
        autoGenerateEnabled = result.status !== 'detected_pending_llm';
      }
    } catch (e) {
      // Can't determine from logs
    }

    db.close();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),

      // Activation Status
      status: {
        apiKeyConfigured,
        autoGenerateEnabled,
        isFullyActivated,
        isPartiallyActivated,
        statusLabel: isFullyActivated
          ? '✅ ACTIVE'
          : isPartiallyActivated
            ? '⚠️ PARTIALLY ACTIVE'
            : '❌ DORMANT',
        statusColor: isFullyActivated
          ? 'success'
          : isPartiallyActivated
            ? 'warning'
            : 'error'
      },

      // Configuration
      config: {
        provider: process.env.LLM_PROVIDER || 'anthropic',
        model: process.env.LLM_MODEL || 'claude-sonnet-4-5-20250929',
        modelDisplay: 'Claude Sonnet 4.5',
        autoGenerate: autoGenerateEnabled
      },

      // Metrics
      metrics: {
        specsGenerated: loop7Stats?.total_specs_generated || 0,
        totalExecutions: loop7Stats?.total_executions || 0,
        successfulGenerations: loop7Stats?.successful_generations || 0,
        averageLatencyMs: Math.round(loop7Stats?.avg_latency_ms || 0),
        lastExecution: loop7Stats?.last_execution || null,

        // Token usage (if available)
        totalInputTokens: modelUsage?.total_input_tokens || 0,
        totalOutputTokens: modelUsage?.total_output_tokens || 0,
        totalTokens: modelUsage?.total_tokens || 0,
        totalRequests: modelUsage?.total_requests || 0,
        successfulRequests: modelUsage?.successful_requests || 0,

        // Cost estimation
        estimatedCostUSD: parseFloat(estimatedCost.toFixed(4)),
        averageCostPerSpec: modelUsage?.total_requests > 0
          ? parseFloat((estimatedCost / modelUsage.total_requests).toFixed(4))
          : 0
      },

      // Blockers (if not activated)
      blockers: !isFullyActivated ? [
        ...(!apiKeyConfigured ? [{
          id: 'missing_api_key',
          severity: 'critical',
          message: 'ANTHROPIC_API_KEY environment variable not configured',
          solution: 'Add API key to .env file or environment variables'
        }] : []),
        ...(!autoGenerateEnabled ? [{
          id: 'auto_generate_disabled',
          severity: 'high',
          message: 'Loop 7 autoGenerate flag is disabled',
          solution: 'Update src/index.ts to enable autoGenerate: true'
        }] : [])
      ] : [],

      // Activation Guide
      activationGuide: {
        documentPath: '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp/LLM_INTELLIGENCE_ACTIVATION_GUIDE.md',
        quickSteps: [
          '1. Get Anthropic API key from https://console.anthropic.com/',
          '2. Add ANTHROPIC_API_KEY to .env file',
          '3. Set LLM_AUTO_GENERATE=true in .env',
          '4. Restart Central-MCP server',
          '5. Verify activation in dashboard'
        ]
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('LLM Status API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch LLM status',
      message: error.message
    }, { status: 500 });
  }
}
