'use client';

interface HeroMetricsProps {
  vmUptime: string;
  vmUptimePercentage: string;
  centralMCPUptime: number;
  totalProjects: number;
  activeLoops: number;
  totalLoops: number;
  issuesCount: number;
  projectsWithIssues: string[];
  latestProjects: Array<{
    name: string;
    progress: number;
    daysSinceActivity: number;
  }>;
}

export default function HeroMetrics({
  vmUptime,
  vmUptimePercentage,
  centralMCPUptime,
  totalProjects,
  activeLoops,
  totalLoops,
  issuesCount,
  projectsWithIssues,
  latestProjects
}: HeroMetricsProps) {
  return (
    <div className="mb-3 space-y-2 animate-fadeIn">
      {/* CRITICAL METRICS - Hero Section */}
      <div className="bg-gradient-to-br from-accent-primary/10 to-scaffold-1 rounded-lg p-3 border border-accent-primary/30">
        <h2 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
          <span className="text-base">🎯</span>
          <span>System Health</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* VM Uptime */}
          <div className="bg-scaffold-0/50 rounded p-2 border border-border-subtle">
            <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary mb-1 uppercase tracking-wide">VM Uptime</div>
            <div className="flex items-baseline gap-1 mb-0.5">
              <div className="text-xl font-bold text-color-success">{vmUptime}</div>
              <div className="text-sm font-semibold text-color-success">{vmUptimePercentage}%</div>
            </div>
            <div className="flex items-center gap-1" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-color-success animate-pulse" />
              <span className="text-text-secondary">Operational</span>
            </div>
          </div>

          {/* Central-MCP Uptime */}
          <div className="bg-scaffold-0/50 rounded p-2 border border-border-subtle">
            <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary mb-1 uppercase tracking-wide">Central-MCP</div>
            <div className="text-xl font-bold text-color-success mb-0.5">{centralMCPUptime}%</div>
            <div className="flex items-center gap-1" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
              <div className="w-full h-1.5 bg-scaffold-2 rounded-full overflow-hidden">
                <div className="h-full bg-color-success" style={{ width: `${centralMCPUptime}%` }} />
              </div>
            </div>
          </div>

          {/* Active Loops */}
          <div className="bg-scaffold-0/50 rounded p-2 border border-border-subtle">
            <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary mb-1 uppercase tracking-wide">Active Loops</div>
            <div className="text-xl font-bold text-accent-primary mb-0.5">
              {activeLoops}<span className="text-base text-text-tertiary">/{totalLoops}</span>
            </div>
            <div className="flex items-center gap-1 text-color-success" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
              <span>✓</span>
              <span>{Math.round((activeLoops / totalLoops) * 100)}% operational</span>
            </div>
          </div>

          {/* Issues to Address */}
          <div className="bg-scaffold-0/50 rounded p-2 border border-border-subtle">
            <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary mb-1 uppercase tracking-wide">Issues</div>
            <div className={`text-xl font-bold mb-0.5 ${issuesCount > 0 ? 'text-color-warning' : 'text-color-success'}`}>
              {issuesCount}
            </div>
            <div className="flex items-center gap-1 text-text-secondary" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
              {issuesCount > 0 ? (
                <span className="text-color-warning">⚠ Requires attention</span>
              ) : (
                <span className="text-color-success">✓ All clear</span>
              )}
            </div>
          </div>
        </div>

        {/* Issues Details (if any) */}
        {issuesCount > 0 && (
          <div className="mt-2 p-2 bg-color-warning/10 border border-color-warning/30 rounded">
            <div className="text-xs font-bold text-color-warning mb-1">
              ⚠ Projects with Issues ({projectsWithIssues.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {projectsWithIssues.slice(0, 10).map((project, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-scaffold-0 rounded text-text-secondary border border-border-subtle"
                  style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}
                >
                  {project}
                </span>
              ))}
              {projectsWithIssues.length > 10 && (
                <span className="px-1.5 py-0.5 text-text-tertiary" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
                  +{projectsWithIssues.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LATEST PROJECTS - Progress Tracking */}
      <div className="bg-scaffold-1 rounded-lg p-3 border border-border-subtle">
        <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
          <span className="text-base">📊</span>
          <span>Latest Projects</span>
          <span className="text-xs font-normal text-text-tertiary ml-auto">
            {latestProjects.length}/{totalProjects}
          </span>
        </h3>

        <div className="space-y-1.5">
          {latestProjects.map((project, idx) => (
            <div
              key={idx}
              className="bg-scaffold-0 rounded p-2 border border-border-subtle hover:border-accent-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📦'}</span>
                  <div>
                    <div className="font-bold text-text-primary text-xs">{project.name}</div>
                    <div className="text-text-tertiary" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
                      {project.daysSinceActivity}d ago
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-bold ${
                    project.progress >= 80 ? 'text-color-success' :
                    project.progress >= 50 ? 'text-color-warning' :
                    'text-color-error'
                  }`}>
                    {project.progress}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-scaffold-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    project.progress >= 80 ? 'bg-color-success' :
                    project.progress >= 50 ? 'bg-color-warning' :
                    'bg-color-error'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
