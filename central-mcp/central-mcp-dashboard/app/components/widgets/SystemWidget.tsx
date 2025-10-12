'use client';

interface SystemWidgetProps {
  title: string;
  icon: string;
  metrics: {
    label: string;
    value: string | number;
    status?: 'success' | 'warning' | 'error' | 'neutral';
    trend?: 'up' | 'down' | 'stable';
    unit?: string;
  }[];
  health?: number;
}

export default function SystemWidget({ title, icon, metrics, health }: SystemWidgetProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-color-success';
      case 'warning': return 'text-color-warning';
      case 'error': return 'text-color-error';
      default: return 'text-text-primary';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '—';
      default: return '';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-color-success';
      case 'down': return 'text-color-error';
      default: return 'text-text-tertiary opacity-50';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 95) return 'bg-color-success';
    if (health >= 80) return 'bg-color-warning';
    return 'bg-color-error';
  };

  return (
    <div className="bg-scaffold-1 rounded-md border border-border-subtle hover:border-accent-primary/40 transition-all duration-200 group">
      {/* Ultra-Compact Header */}
      <div className="px-2.5 py-2 border-b border-border-subtle bg-scaffold-0/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base opacity-80 group-hover:opacity-100 transition-opacity">{icon}</span>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-text-primary">{title}</h3>
              {health !== undefined && (
                <div className="flex items-center gap-1">
                  {/* Mini health bar */}
                  <div className="w-10 h-1 bg-scaffold-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getHealthColor(health)}`}
                      style={{ width: `${health}%` }}
                    />
                  </div>
                  <span className={`font-medium ${
                    health >= 95 ? 'text-color-success' :
                    health >= 80 ? 'text-color-warning' :
                    'text-color-error'
                  }`} style={{ fontSize: 'clamp(0.5625rem, 1vw, 0.6875rem)' }}>
                    {health.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ultra-Compact Metrics Grid */}
      <div className="p-2">
        <div className="grid grid-cols-3 gap-1">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex flex-col px-1.5 py-1 rounded bg-scaffold-0/40 hover:bg-scaffold-0/60 transition-colors duration-150"
            >
              {/* Label */}
              <div className="text-text-tertiary leading-tight truncate" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} title={metric.label}>
                {metric.label}
              </div>
              {/* Value + Trend */}
              <div className={`font-medium ${getStatusColor(metric.status)} flex items-center gap-0.5`} style={{ fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)' }}>
                <span className="truncate" title={`${metric.value}${metric.unit || ''}`}>
                  {metric.value}{metric.unit && (
                    <span className="opacity-70" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>{metric.unit}</span>
                  )}
                </span>
                {metric.trend && (
                  <span className={`${getTrendColor(metric.trend)} ml-auto`} style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
                    {getTrendIcon(metric.trend)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}