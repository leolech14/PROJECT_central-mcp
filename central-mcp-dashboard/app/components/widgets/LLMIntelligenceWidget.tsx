'use client';

import { useEffect, useState } from 'react';

interface LLMStatus {
  success: boolean;
  status: {
    apiKeyConfigured: boolean;
    autoGenerateEnabled: boolean;
    isFullyActivated: boolean;
    isPartiallyActivated: boolean;
    statusLabel: string;
    statusColor: 'success' | 'warning' | 'error';
  };
  config: {
    provider: string;
    model: string;
    modelDisplay: string;
    autoGenerate: boolean;
  };
  metrics: {
    specsGenerated: number;
    totalExecutions: number;
    successfulGenerations: number;
    averageLatencyMs: number;
    lastExecution: string | null;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalRequests: number;
    successfulRequests: number;
    estimatedCostUSD: number;
    averageCostPerSpec: number;
  };
  blockers: Array<{
    id: string;
    severity: string;
    message: string;
    solution: string;
  }>;
  activationGuide: {
    documentPath: string;
    quickSteps: string[];
  };
}

export default function LLMIntelligenceWidget() {
  const [data, setData] = useState<LLMStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/llm-status');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch LLM status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-accent-secondary/10 to-scaffold-1 rounded-lg p-3 border border-accent-secondary/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🧠</span>
          <h3 className="text-sm font-bold text-text-primary">LLM Intelligence</h3>
        </div>
        <div className="text-xs text-text-tertiary">Loading...</div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="bg-gradient-to-br from-accent-secondary/10 to-scaffold-1 rounded-lg p-3 border border-accent-secondary/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🧠</span>
          <h3 className="text-sm font-bold text-text-primary">LLM Intelligence</h3>
        </div>
        <div className="text-xs text-color-error">Failed to load status</div>
      </div>
    );
  }

  const statusColors = {
    success: 'text-color-success',
    warning: 'text-color-warning',
    error: 'text-color-error'
  };

  const statusBgColors = {
    success: 'bg-color-success/10 border-color-success/30',
    warning: 'bg-color-warning/10 border-color-warning/30',
    error: 'bg-color-error/10 border-color-error/30'
  };

  return (
    <div className="bg-gradient-to-br from-accent-secondary/10 to-scaffold-1 rounded-lg p-3 border border-accent-secondary/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <h3 className="text-sm font-bold text-text-primary">LLM Intelligence</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-accent-secondary hover:text-accent-primary transition-colors"
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      {/* Status Badge */}
      <div className={`rounded p-1.5 border mb-2 ${statusBgColors[data.status.statusColor]}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${statusColors[data.status.statusColor]}`}>
            {data.status.statusLabel}
          </span>
          {data.status.isFullyActivated && (
            <span className="text-xs text-text-tertiary">
              {data.metrics.specsGenerated} specs
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="bg-scaffold-0/50 rounded p-1.5 border border-border-subtle">
          <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary mb-0.5">
            Model
          </div>
          <div style={{ fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }} className="font-bold text-text-primary">
            {data.config.modelDisplay}
          </div>
        </div>

        <div className="bg-scaffold-0/50 rounded p-1.5 border border-border-subtle">
          <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary mb-0.5">
            Cost
          </div>
          <div style={{ fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }} className="font-bold text-accent-primary">
            ${data.metrics.estimatedCostUSD.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Blockers (if any) */}
      {data.blockers && data.blockers.length > 0 && (
        <div className="bg-color-error/10 border border-color-error/30 rounded p-1.5 mb-2">
          <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-color-error font-bold mb-1">
            ⚠️ {data.blockers.length} Blocker{data.blockers.length > 1 ? 's' : ''}
          </div>
          {data.blockers.slice(0, 2).map((blocker) => (
            <div key={blocker.id} style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-secondary mb-0.5">
              • {blocker.message}
            </div>
          ))}
        </div>
      )}

      {/* Details Panel */}
      {showDetails && (
        <div className="border-t border-border-subtle pt-2 space-y-2 animate-fadeIn">
          {/* Configuration */}
          <div className="bg-scaffold-0/30 rounded p-1.5">
            <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary font-bold mb-1">
              Configuration
            </div>
            <div className="grid grid-cols-2 gap-1" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
              <div>
                <span className="text-text-tertiary">Provider:</span>
                <span className="text-text-primary ml-1">{data.config.provider}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Auto-Gen:</span>
                <span className={data.config.autoGenerate ? 'text-color-success ml-1' : 'text-color-error ml-1'}>
                  {data.config.autoGenerate ? '✓ ON' : '✗ OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {data.status.isFullyActivated && (
            <div className="bg-scaffold-0/30 rounded p-1.5">
              <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary font-bold mb-1">
                Performance
              </div>
              <div className="space-y-0.5" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Executions:</span>
                  <span className="text-text-primary">{data.metrics.totalExecutions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Successful:</span>
                  <span className="text-color-success">{data.metrics.successfulGenerations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Avg Latency:</span>
                  <span className="text-text-primary">{data.metrics.averageLatencyMs}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Cost/Spec:</span>
                  <span className="text-accent-primary">${data.metrics.averageCostPerSpec.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Token Usage */}
          {data.metrics.totalTokens > 0 && (
            <div className="bg-scaffold-0/30 rounded p-1.5">
              <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary font-bold mb-1">
                Token Usage
              </div>
              <div className="space-y-0.5" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Input:</span>
                  <span className="text-text-primary">{data.metrics.totalInputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Output:</span>
                  <span className="text-text-primary">{data.metrics.totalOutputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Total:</span>
                  <span className="text-accent-primary font-bold">{data.metrics.totalTokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Activation Steps (if not activated) */}
          {!data.status.isFullyActivated && data.activationGuide && (
            <div className="bg-accent-primary/10 border border-accent-primary/30 rounded p-1.5">
              <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-accent-primary font-bold mb-1">
                ⚡ Quick Activation
              </div>
              <ol className="space-y-0.5 text-text-secondary" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
                {data.activationGuide.quickSteps.slice(0, 3).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
              <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-accent-secondary mt-1">
                See: LLM_INTELLIGENCE_ACTIVATION_GUIDE.md
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
