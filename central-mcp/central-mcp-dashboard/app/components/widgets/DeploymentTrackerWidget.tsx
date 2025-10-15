'use client';

import { useState, useEffect } from 'react';

interface DeploymentChange {
  timestamp: string;
  type: 'dashboard' | 'backend' | 'config' | 'scripts';
  files: string[];
  description: string;
  gitHash?: string;
}

interface DeploymentHistory {
  lastUpdate: string;
  lastGitHash: string;
  changes: DeploymentChange[];
  summary: {
    totalDeployments: number;
    lastDashboardUpdate: string;
    lastBackendUpdate: string;
    lastConfigUpdate: string;
  };
}

export default function DeploymentTrackerWidget() {
  const [history, setHistory] = useState<DeploymentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/deployment-history');
      const data = await res.json();
      setHistory(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch deployment history:', err);
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dashboard': return '🎨';
      case 'backend': return '⚙️';
      case 'config': return '🔧';
      case 'scripts': return '📜';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dashboard': return 'text-blue-400';
      case 'backend': return 'text-green-400';
      case 'config': return 'text-amber-400';
      case 'scripts': return 'text-purple-400';
      default: return 'text-text-secondary';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-scaffold-1 border border-border-subtle rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🚀</div>
          <h3 className="text-lg font-bold text-text-primary">CentralMCP.net Updates</h3>
        </div>
        <div className="text-text-secondary animate-pulse">Loading deployment history...</div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="bg-scaffold-1 border border-border-subtle rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🚀</div>
          <h3 className="text-lg font-bold text-text-primary">CentralMCP.net Updates</h3>
        </div>
        <div className="text-text-secondary">No deployment history available</div>
      </div>
    );
  }

  return (
    <div className="bg-scaffold-1 border border-border-subtle rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🚀</div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">CentralMCP.net Updates</h3>
            <p className="text-xs text-text-tertiary">
              Last update: {formatTimeAgo(history.lastUpdate)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-text-tertiary">Current Version</div>
          <div className="text-sm font-mono text-accent-primary">
            {history.lastGitHash}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-scaffold-2 border border-border-subtle rounded-lg p-3">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-xs text-text-tertiary">Total</div>
          <div className="text-lg font-bold text-text-primary">
            {history.summary.totalDeployments}
          </div>
        </div>

        <div className="bg-scaffold-2 border border-border-subtle rounded-lg p-3">
          <div className="text-2xl mb-1">🎨</div>
          <div className="text-xs text-text-tertiary">Dashboard</div>
          <div className="text-xs font-mono text-text-primary truncate">
            {formatTimeAgo(history.summary.lastDashboardUpdate)}
          </div>
        </div>

        <div className="bg-scaffold-2 border border-border-subtle rounded-lg p-3">
          <div className="text-2xl mb-1">⚙️</div>
          <div className="text-xs text-text-tertiary">Backend</div>
          <div className="text-xs font-mono text-text-primary truncate">
            {formatTimeAgo(history.summary.lastBackendUpdate)}
          </div>
        </div>

        <div className="bg-scaffold-2 border border-border-subtle rounded-lg p-3">
          <div className="text-2xl mb-1">🔧</div>
          <div className="text-xs text-text-tertiary">Config</div>
          <div className="text-xs font-mono text-text-primary truncate">
            {formatTimeAgo(history.summary.lastConfigUpdate)}
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-text-primary">Recent Changes</div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-accent-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Show all'}
          </button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {(expanded ? history.changes : history.changes.slice(0, 5)).map((change, idx) => (
            <div
              key={idx}
              className="bg-scaffold-2 border border-border-subtle rounded-lg p-3 hover:border-accent-primary transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{getTypeIcon(change.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${getTypeColor(change.type)}`}>
                      {change.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {formatTimeAgo(change.timestamp)}
                    </span>
                    {change.gitHash && (
                      <span className="text-xs font-mono text-accent-primary">
                        {change.gitHash}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-text-primary mb-2">
                    {change.description}
                  </div>

                  {change.files.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {change.files.slice(0, 3).map((file, fileIdx) => (
                        <div
                          key={fileIdx}
                          className="px-2 py-1 bg-scaffold-1 border border-border-subtle rounded text-xs font-mono text-text-tertiary truncate max-w-[150px]"
                          title={file}
                        >
                          {file.split('/').pop()}
                        </div>
                      ))}
                      {change.files.length > 3 && (
                        <div className="px-2 py-1 text-xs text-text-tertiary">
                          +{change.files.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {history.changes.length === 0 && (
            <div className="text-center py-8 text-text-tertiary">
              No deployment history yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
