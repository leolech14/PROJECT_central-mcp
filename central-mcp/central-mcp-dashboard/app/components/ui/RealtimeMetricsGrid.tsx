'use client';

interface RealtimeMetricsGridProps {
  systemStatus: {
    health: number;
    uptime: number;
    memory: { used: number; total: number };
    cpu: number;
    disk: number;
  };
  projects: {
    total: number;
    healthPercent: number;
    blockers: number;
  };
  agents: Array<{ status: string }>;
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  };
}

export function RealtimeMetricsGrid({ systemStatus, projects, agents, tasks }: RealtimeMetricsGridProps) {
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* System Health */}
      <MetricCard
        title="System Health"
        value={`${Math.round(systemStatus.health)}%`}
        subtitle={formatUptime(systemStatus.uptime)}
        color="success"
        pulse={systemStatus.health >= 95}
      />

      {/* CPU Usage */}
      <MetricCard
        title="CPU Usage"
        value={`${systemStatus.cpu.toFixed(1)}%`}
        subtitle="Processing"
        color="cpu"
        progress={systemStatus.cpu}
      />

      {/* Memory */}
      <MetricCard
        title="Memory"
        value={`${systemStatus.memory.used}MB`}
        subtitle={`of ${systemStatus.memory.total}MB`}
        color="memory"
        progress={(systemStatus.memory.used / systemStatus.memory.total) * 100}
      />

      {/* Projects */}
      <MetricCard
        title="Projects"
        value={projects.total.toString()}
        subtitle={`${projects.healthPercent}% healthy`}
        color="info"
        badge={projects.blockers > 0 ? `${projects.blockers} blockers` : undefined}
      />

      {/* Active Agents */}
      <MetricCard
        title="Active Agents"
        value={activeAgents.toString()}
        subtitle={`of ${agents.length} total`}
        color="network"
        pulse={activeAgents > 0}
      />

      {/* Tasks */}
      <MetricCard
        title="Tasks"
        value={tasks.inProgress.toString()}
        subtitle={`${tasks.completionRate.toFixed(0)}% complete`}
        color="success"
        progress={tasks.completionRate}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'success' | 'cpu' | 'memory' | 'disk' | 'network' | 'info';
  progress?: number;
  pulse?: boolean;
  badge?: string;
}

function MetricCard({ title, value, subtitle, color, progress, pulse, badge }: MetricCardProps) {
  const colorClasses = {
    success: 'text-color-success',
    cpu: 'text-metric-cpu',
    memory: 'text-metric-memory',
    disk: 'text-metric-disk',
    network: 'text-metric-network',
    info: 'text-color-info'
  };

  return (
    <div className="bg-scaffold-1 rounded-xl p-4 border border-border-subtle hover:border-border-default transition-all relative overflow-hidden">
      {/* Pulse animation background */}
      {pulse && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-color-success/10 to-transparent animate-pulse" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs bg-color-warning/20 text-color-warning rounded">
              {badge}
            </span>
          )}
        </div>

        <div className={`text-3xl font-bold mb-1 ${colorClasses[color]}`}>
          {value}
        </div>

        <div className="text-xs text-text-tertiary">
          {subtitle}
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mt-3 h-1.5 bg-scaffold-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${colorClasses[color]} bg-current transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
