'use client';

interface HeroMetricsProps {
  vmUptime: string;
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
  centralMCPUptime,
  totalProjects,
  activeLoops,
  totalLoops,
  issuesCount,
  projectsWithIssues,
  latestProjects
}: HeroMetricsProps) {
  return (
    <div className="mb-8 space-y-6 animate-fadeIn">
      {/* CRITICAL METRICS - Hero Section */}
      <div className="bg-gradient-to-br from-accent-primary/10 to-scaffold-1 rounded-xl p-6 border-2 border-accent-primary/30">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <span>System Health Overview</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* VM Uptime */}
          <div className="bg-scaffold-0/50 rounded-lg p-4 border border-border-subtle">
            <div className="text-xs text-text-tertiary mb-2 uppercase tracking-wide">VM Uptime</div>
            <div className="text-4xl font-bold text-color-success mb-1">{vmUptime}</div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <div className="w-2 h-2 rounded-full bg-color-success animate-pulse" />
              <span>Operational</span>
            </div>
          </div>

          {/* Central-MCP Uptime */}
          <div className="bg-scaffold-0/50 rounded-lg p-4 border border-border-subtle">
            <div className="text-xs text-text-tertiary mb-2 uppercase tracking-wide">Central-MCP</div>
            <div className="text-4xl font-bold text-color-success mb-1">{centralMCPUptime}%</div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <div className="w-full h-2 bg-scaffold-2 rounded-full overflow-hidden">
                <div className="h-full bg-color-success" style={{ width: `${centralMCPUptime}%` }} />
              </div>
            </div>
          </div>

          {/* Active Loops */}
          <div className="bg-scaffold-0/50 rounded-lg p-4 border border-border-subtle">
            <div className="text-xs text-text-tertiary mb-2 uppercase tracking-wide">Active Loops</div>
            <div className="text-4xl font-bold text-accent-primary mb-1">
              {activeLoops}<span className="text-2xl text-text-tertiary">/{totalLoops}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-color-success">
              <span>✓</span>
              <span>{Math.round((activeLoops / totalLoops) * 100)}% operational</span>
            </div>
          </div>

          {/* Issues to Address */}
          <div className="bg-scaffold-0/50 rounded-lg p-4 border border-border-subtle">
            <div className="text-xs text-text-tertiary mb-2 uppercase tracking-wide">Issues</div>
            <div className={`text-4xl font-bold mb-1 ${issuesCount > 0 ? 'text-color-warning' : 'text-color-success'}`}>
              {issuesCount}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
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
          <div className="mt-6 p-4 bg-color-warning/10 border border-color-warning/30 rounded-lg">
            <div className="text-sm font-bold text-color-warning mb-2">
              ⚠ Projects with Issues ({projectsWithIssues.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {projectsWithIssues.slice(0, 10).map((project, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-scaffold-0 rounded text-xs text-text-secondary border border-border-subtle"
                >
                  {project}
                </span>
              ))}
              {projectsWithIssues.length > 10 && (
                <span className="px-2 py-1 text-xs text-text-tertiary">
                  +{projectsWithIssues.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LATEST PROJECTS - Progress Tracking */}
      <div className="bg-scaffold-1 rounded-lg p-6 border border-border-subtle">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span>Latest Developed Projects</span>
          <span className="text-sm font-normal text-text-tertiary ml-auto">
            Showing {latestProjects.length} of {totalProjects} total
          </span>
        </h3>

        <div className="space-y-4">
          {latestProjects.map((project, idx) => (
            <div
              key={idx}
              className="bg-scaffold-0 rounded-lg p-4 border border-border-subtle hover:border-accent-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📦'}</span>
                  <div>
                    <div className="font-bold text-text-primary">{project.name}</div>
                    <div className="text-xs text-text-tertiary">
                      Updated {project.daysSinceActivity} day{project.daysSinceActivity !== 1 ? 's' : ''} ago
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    project.progress >= 80 ? 'text-color-success' :
                    project.progress >= 50 ? 'text-color-warning' :
                    'text-color-error'
                  }`}>
                    {project.progress}%
                  </div>
                  <div className="text-xs text-text-tertiary">Progress</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-scaffold-2 rounded-full overflow-hidden">
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
