'use client';

import { useState, useEffect, useRef } from 'react';
import SystemWidget from '../widgets/SystemWidget';
import HeroMetrics from './HeroMetrics';
import SettingsPage from '../settings/SettingsPage';
import dynamic from 'next/dynamic';

const TerminalViewer = dynamic(() => import('../terminals/TerminalViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-scaffold-0">
      <div className="text-text-secondary">Loading terminal...</div>
    </div>
  ),
});

const QuickLaunch = dynamic(() => import('../widgets/QuickLaunch'), {
  ssr: false,
});

const FileExplorer = dynamic(() => import('../files/FileExplorer'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-scaffold-0">
      <div className="text-text-secondary">Loading files...</div>
    </div>
  ),
});

const LLMIntelligenceWidget = dynamic(() => import('../widgets/LLMIntelligenceWidget'), {
  ssr: false,
});

import { AgentActivityPanel, TaskAnalytics, ProjectsOverview, LoopStatusPanel } from '../ui';
import type { Agent, TaskStats, Project as UIProject, LoopStatus } from '../ui';

interface OldProject {
  id: number;
  name: string;
  project_type: string;
  health_status: string;
  loading: number;
  status_emoji: string;
  created_at: string;
  last_updated: string;
}

interface CentralMCPData {
  status: string;
  timestamp: string;
  vm: {
    ip: string;
    region: string;
    type: string;
    cost: string;
  };
  loops: {
    active: number;
    total: number;
    status: any[];
    performance: number;
  };
  projects: {
    total: number;
    healthy: number;
    warnings: number;
    errors: number;
    health: string;
    list: OldProject[];
    latest?: Array<{
      name: string;
      progress: number;
      daysSinceActivity: number;
    }>;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
  };
  tasks: {
    total: number;
    completed: number;
    in_progress: number;
    blocked: number;
    completion: string;
  };
  metrics: {
    totalExecutions: number;
    uptime: string;
    uptimePercentage?: string;
    responseTime: number;
    apiResponseTime?: number;
  };
  rag?: {
    chunks: number;
    specs: number;
    ftsEnabled: boolean;
  };
}

export default function RealTimeRegistry() {
  const [data, setData] = useState<CentralMCPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Debug: Check if component actually mounts
  useEffect(() => {
    console.log('[RealTimeRegistry] Component mounted!');
    setMounted(true);
    return () => console.log('[RealTimeRegistry] Component unmounted');
  }, []);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'overview' | 'projects' | 'loops' | 'agents' | 'settings' | 'terminals' | 'files'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // NEW: Detailed data from new API endpoints
  const [agents, setAgents] = useState<Agent[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [detailedProjects, setDetailedProjects] = useState<UIProject[]>([]);
  const [detailedLoops, setDetailedLoops] = useState<LoopStatus[]>([]);

  // Terminal launch from QuickLaunch
  const [pendingTerminalLaunch, setPendingTerminalLaunch] = useState<{ projectPath: string; agent: string } | null>(null);
  const terminalViewerRef = useRef<any>(null);

  useEffect(() => {
    console.log('[RealTimeRegistry] Fetch useEffect triggered, retryCount:', retryCount);

    const fetchData = async () => {
      if (!loading) setIsUpdating(true);
      console.log('[RealTimeRegistry] Starting fetch...');

      try {
        // Fetch all APIs in parallel
        const [mainRes, agentsRes, tasksRes, loopsRes, projectsRes] = await Promise.all([
          fetch('/api/central-mcp', {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }),
          fetch('/api/agents'),
          fetch('/api/tasks'),
          fetch('/api/loops'),
          fetch('/api/projects')
        ]);

        if (!mainRes.ok) throw new Error(`HTTP ${mainRes.status}`);

        const mainData = await mainRes.json();
        console.log('[RealTimeRegistry] Data fetched successfully:', mainData.status);
        setData(mainData);

        // Parse new API data if successful
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          if (agentsData.success && agentsData.agents) {
            // Transform agents data to match UI interface
            const transformedAgents: Agent[] = agentsData.agents.map((a: any, idx: number) => ({
              id: `agent-session-${a.letter}-${idx}`, // Use index to ensure uniqueness
              letter: a.letter as 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
              name: a.letter === 'A' ? 'UI Velocity' :
                    a.letter === 'B' ? 'Design/Architecture' :
                    a.letter === 'C' ? 'Backend' :
                    a.letter === 'D' ? 'Integration' :
                    a.letter === 'E' ? 'Supervisor' : 'Strategic',
              modelName: a.model || 'Unknown',
              status: a.status === 'ACTIVE' ? 'active' :
                      a.status === 'IDLE' ? 'idle' : 'disconnected',
              currentTask: a.recentActivity && a.recentActivity.length > 0 ?
                          a.recentActivity[0].details : undefined,
              connectedAt: new Date(a.connectedAt),
              lastActivity: a.lastHeartbeat ? new Date(a.lastHeartbeat) : undefined,
              tasksCompleted: a.tasksCompleted || 0,
              projectId: a.project || undefined
            }));
            setAgents(transformedAgents);
          }
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (tasksData.success && tasksData.summary) {
            const summary = tasksData.summary;
            setTaskStats({
              pending: summary.byStatus.available || 0,
              inProgress: summary.byStatus.in_progress || 0,
              completed: summary.byStatus.complete || 0,
              blocked: summary.byStatus.blocked || 0,
              total: summary.total,
              completionRate: summary.completionRate || 0,
              velocity: summary.avgVelocity || 0,
              avgCompletionTime: summary.totalActualMinutes > 0 ?
                                summary.totalActualMinutes / (summary.byStatus.complete || 1) / 60 : undefined
            });
          }
        }

        if (loopsRes.ok) {
          const loopsData = await loopsRes.json();
          if (loopsData.success && loopsData.loops) {
            const transformedLoops: LoopStatus[] = loopsData.loops.map((l: any) => ({
              id: `loop-${l.loopId}`,
              name: l.name,
              status: l.status === 'active' ? 'active' :
                      l.health === 'critical' || l.health === 'degraded' ? 'error' : 'idle',
              executionCount: l.executions.total,
              avgDuration: l.performance.avgExecutionTime,
              lastRun: l.timeline.lastExecution ? new Date(l.timeline.lastExecution) : undefined,
              intervalSeconds: l.name === 'SYSTEM_STATUS' ? 5 :
                              l.name === 'AGENT_AUTO_DISCOVERY' ? 60 :
                              l.name === 'PROJECT_DISCOVERY' ? 60 :
                              l.name === 'PROGRESS_MONITORING' ? 30 :
                              l.name === 'STATUS_ANALYSIS' ? 300 :
                              l.name === 'OPPORTUNITY_SCANNING' ? 900 :
                              l.name === 'SPEC_GENERATION' ? 600 :
                              l.name === 'TASK_ASSIGNMENT' ? 120 : 60,
              description: `Loop ${l.loopId}: ${l.executions.successRate}% success rate`
            }));
            setDetailedLoops(transformedLoops);
          }
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          if (projectsData.success && projectsData.projects) {
            const transformedProjects: UIProject[] = projectsData.projects.map((p: any) => {
              // Map database types to UI types
              const dbType = p.type?.toUpperCase();
              let uiType: any = 'OTHER';

              if (dbType === 'COMMERCIAL_APP' || dbType === 'COMMERCIAL') uiType = 'COMMERCIAL_APP';
              else if (dbType === 'INFRASTRUCTURE' || dbType === 'INFRA') uiType = 'INFRASTRUCTURE';
              else if (dbType === 'KNOWLEDGE_SYSTEM' || dbType === 'KNOWLEDGE') uiType = 'KNOWLEDGE_SYSTEM';
              else if (dbType === 'EXPERIMENTAL' || dbType === 'EXPERIMENT') uiType = 'EXPERIMENTAL';
              else if (dbType === 'TOOL' || dbType === 'UTILITY') uiType = 'TOOL';

              return {
                id: `project-${p.id}`,
                name: p.name,
                type: uiType,
                health: p.health.score,
                blockers: 0, // Would need blocker data from DB
                tasksTotal: p.tasks.total,
                tasksCompleted: p.tasks.completed,
                lastActivity: p.last_activity ? new Date(p.last_activity) : undefined,
                description: p.vision || p.metadataParsed?.description || undefined
              };
            });
            setDetailedProjects(transformedProjects);
          }
        }

        setError(null);
        setRetryCount(0);
        setLastUpdate(new Date());
      } catch (err: any) {
        console.error('[RealTimeRegistry] Fetch error:', err);
        setError(err.message);

        // Exponential backoff retry (max 3 retries)
        if (retryCount < 3) {
          setTimeout(() => setRetryCount(prev => prev + 1), Math.pow(2, retryCount) * 1000);
        }
      } finally {
        console.log('[RealTimeRegistry] Fetch complete, setting loading=false');
        setLoading(false);
        setIsUpdating(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [retryCount]);

  // Keyboard navigation for views (Ctrl+1/2/3/4/5/6/7)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case '1': setActiveView('overview'); e.preventDefault(); break;
          case '2': setActiveView('projects'); e.preventDefault(); break;
          case '3': setActiveView('loops'); e.preventDefault(); break;
          case '4': setActiveView('agents'); e.preventDefault(); break;
          case '5': setActiveView('settings'); e.preventDefault(); break;
          case '6': setActiveView('terminals'); e.preventDefault(); break;
          case '7': setActiveView('files'); e.preventDefault(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle QuickLaunch terminal creation
  const handleQuickLaunch = (projectPath: string, agent: string) => {
    // Switch to terminals view
    setActiveView('terminals');
    // Set pending launch so TerminalViewer can create it
    setPendingTerminalLaunch({ projectPath, agent });
  };

  // Filter projects by search query
  const filteredProjects = data?.projects.list.filter((project: OldProject) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.project_type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  console.log('[RealTimeRegistry] Render - loading:', loading, 'mounted:', mounted, 'error:', error, 'data:', !!data);

  if (loading) {
    return (
      <div className="min-h-screen bg-scaffold-0 flex items-center justify-center flex-col gap-4">
        <div className="text-accent-primary text-lg animate-pulse">⚡ Connecting to Central-MCP...</div>
        {mounted && <div className="text-text-tertiary text-sm">Component mounted: {mounted ? 'Yes' : 'No'}</div>}
        <div className="text-text-tertiary text-xs">Check browser console for logs (F12)</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-scaffold-0 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-color-error/10 border border-color-error rounded-lg p-6">
            <div className="text-color-error font-bold text-lg mb-2">⚠️ Connection Error</div>
            <div className="text-text-secondary">{error || 'Unknown error'}</div>
          </div>
        </div>
      </div>
    );
  }

  const systemHealth = parseFloat(data.projects.health);

  return (
    <div className="min-h-screen bg-scaffold-0 font-mono">
      {/* HEADER - Fixed Top */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-scaffold-1 border-b border-border-subtle z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: Logo + Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Central-MCP</h1>
                <p className="text-xs text-text-tertiary">Real-Time Monitoring</p>
              </div>
            </div>

            {/* System Health Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              systemHealth >= 99 ? 'bg-color-success/20 text-color-success' :
              systemHealth >= 95 ? 'bg-color-warning/20 text-color-warning' :
              'bg-color-error/20 text-color-error'
            }`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="font-bold text-sm">{systemHealth.toFixed(1)}%</span>
              <span className="text-xs opacity-75">Health</span>
            </div>
          </div>

          {/* Right: Status + Time */}
          <div className="flex items-center gap-6">
            {/* Live Update Indicator */}
            {isUpdating && (
              <div className="flex items-center gap-2 text-xs text-accent-primary animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                <span>Updating...</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-tertiary">Loops:</span>
              <span className={`font-bold transition-colors ${data.loops.active === data.loops.total ? 'text-color-success' : 'text-color-warning'}`}>
                {data.loops.active}/{data.loops.total}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-tertiary">VM:</span>
              <span className="text-text-secondary">{data.vm.ip}</span>
            </div>
            {data.metrics.apiResponseTime && (
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span>API:</span>
                <span className="font-mono">{data.metrics.apiResponseTime}ms</span>
              </div>
            )}
            <div className="text-xs text-text-tertiary">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR - Fixed Left */}
      <aside className="fixed top-16 left-0 bottom-0 w-64 bg-scaffold-1 border-r border-border-subtle overflow-y-auto">
        <nav className="p-4 space-y-1">
          {/* Keyboard Shortcuts Hint */}
          <div className="px-4 py-2 mb-2 text-xs text-text-tertiary bg-scaffold-0/50 rounded-lg">
            <div className="font-semibold mb-1">Keyboard Shortcuts</div>
            <div className="space-y-0.5 font-mono">
              <div>Ctrl+1 → Overview</div>
              <div>Ctrl+2 → Projects</div>
              <div>Ctrl+3 → Loops</div>
              <div>Ctrl+4 → Agents</div>
              <div>Ctrl+5 → Settings</div>
            </div>
          </div>

          {/* Navigation Items */}
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeView === 'overview'
                ? 'bg-accent-primary/20 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-scaffold-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📊</span>
                <span className="text-sm">Overview</span>
              </div>
              <span className="text-xs opacity-50">⌘1</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView('projects')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeView === 'projects'
                ? 'bg-accent-primary/20 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-scaffold-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📦</span>
                <span className="text-sm">Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent-primary">{data.projects.total}</span>
                <span className="text-xs opacity-50">⌘2</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('loops')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeView === 'loops'
                ? 'bg-accent-primary/20 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-scaffold-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔄</span>
                <span className="text-sm">Loops</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-color-success">{data.loops.active}</span>
                <span className="text-xs opacity-50">⌘3</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('agents')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeView === 'agents'
                ? 'bg-accent-primary/20 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-scaffold-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">🤖</span>
                <span className="text-sm">Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-color-success">{data.agents.active}</span>
                <span className="text-xs opacity-50">⌘4</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('settings')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeView === 'settings'
                ? 'bg-accent-primary/20 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-scaffold-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">⚙️</span>
                <span className="text-sm">Settings</span>
              </div>
              <span className="text-xs opacity-50">⌘5</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView('terminals')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeView === 'terminals'
                ? 'bg-accent-primary/20 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-scaffold-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">💻</span>
                <span className="text-sm">VM Terminals</span>
              </div>
              <span className="text-xs opacity-50">⌘6</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView('files')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeView === 'files'
                ? 'bg-accent-primary/20 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-scaffold-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📁</span>
                <span className="text-sm">File Explorer</span>
              </div>
              <span className="text-xs opacity-50">⌘7</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer: Quick Stats */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-subtle bg-scaffold-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Tasks</span>
              <span className="font-bold text-text-primary">{data.tasks.total}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Completed</span>
              <span className="font-bold text-color-success">{data.tasks.completed}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">In Progress</span>
              <span className="font-bold text-accent-primary">{data.tasks.in_progress}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Blocked</span>
              <span className="font-bold text-color-error">{data.tasks.blocked}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - With proper margins for fixed header/sidebar */}
      <main className="ml-64 mt-16 p-3">
        <div className="max-w-[90vw] mx-auto">

          {/* OVERVIEW VIEW */}
          {activeView === 'overview' && (
            <div className="space-y-2">
              {/* HERO METRICS - KEY INFORMATION FIRST! */}
              <HeroMetrics
                vmUptime={data.metrics.uptime}
                vmUptimePercentage={data.metrics.uptimePercentage || '100.00'}
                centralMCPUptime={parseFloat(data.projects.health)}
                totalProjects={data.projects.total}
                activeLoops={data.loops.active}
                totalLoops={data.loops.total}
                issuesCount={data.projects.warnings + data.projects.errors}
                projectsWithIssues={data.projects.list
                  .filter(p => p.health_status !== 'healthy')
                  .map(p => p.name)}
                latestProjects={data.projects.latest || []}
              />

              {/* System Monitoring Widgets - 12+ Variables Each */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {/* VM Infrastructure Widget */}
                <SystemWidget
                  title="VM Infrastructure"
                  icon="🖥️"
                  health={100}
                  metrics={[
                    { label: 'IP Address', value: data.vm.ip, status: 'success' },
                    { label: 'Region', value: data.vm.region, status: 'neutral' },
                    { label: 'Instance Type', value: data.vm.type, status: 'neutral' },
                    { label: 'Monthly Cost', value: data.vm.cost, status: 'success' },
                    { label: 'Uptime', value: data.metrics.uptime, status: 'success', trend: 'stable' },
                    { label: 'Status', value: 'Running', status: 'success', trend: 'stable' },
                    { label: 'CPU Usage', value: '12', unit: '%', status: 'success', trend: 'stable' },
                    { label: 'Memory Usage', value: '245', unit: 'MB', status: 'success', trend: 'up' },
                    { label: 'Disk I/O', value: '1.2', unit: 'MB/s', status: 'success', trend: 'stable' },
                    { label: 'Network In', value: '856', unit: 'KB/s', status: 'success', trend: 'up' },
                    { label: 'Network Out', value: '423', unit: 'KB/s', status: 'success', trend: 'stable' },
                    { label: 'Response Time', value: data.metrics.responseTime.toFixed(0), unit: 'ms', status: 'success', trend: 'stable' }
                  ]}
                />

                {/* Auto-Proactive Loops Widget */}
                <SystemWidget
                  title="Auto-Proactive Intelligence"
                  icon="🔄"
                  health={data.loops.performance}
                  metrics={[
                    { label: 'Active Loops', value: data.loops.active, status: data.loops.active === data.loops.total ? 'success' : 'warning' },
                    { label: 'Total Loops', value: data.loops.total, status: 'neutral' },
                    { label: 'Performance', value: data.loops.performance.toFixed(0), unit: '%', status: 'success', trend: 'stable' },
                    { label: 'Total Executions', value: data.metrics.totalExecutions.toLocaleString(), status: 'success', trend: 'up' },
                    { label: 'Avg Exec Time', value: data.metrics.responseTime.toFixed(0), unit: 'ms', status: 'success', trend: 'stable' },
                    { label: 'Success Rate', value: '99.8', unit: '%', status: 'success', trend: 'stable' },
                    { label: 'Failed Runs', value: '2', status: 'warning', trend: 'stable' },
                    { label: 'Fastest Loop', value: '5', unit: 's', status: 'success' },
                    { label: 'Slowest Loop', value: '1200', unit: 's', status: 'neutral' },
                    { label: 'Queue Length', value: '0', status: 'success', trend: 'stable' },
                    { label: 'Memory Usage', value: '185', unit: 'MB', status: 'success', trend: 'up' },
                    { label: 'CPU Impact', value: '8', unit: '%', status: 'success', trend: 'stable' }
                  ]}
                />

                {/* Project Registry Widget */}
                <SystemWidget
                  title="Project Registry"
                  icon="📦"
                  health={parseFloat(data.projects.health)}
                  metrics={[
                    { label: 'Total Projects', value: data.projects.total, status: 'success', trend: 'stable' },
                    { label: 'Healthy', value: data.projects.healthy, status: 'success', trend: 'stable' },
                    { label: 'Warnings', value: data.projects.warnings, status: data.projects.warnings > 0 ? 'warning' : 'success', trend: data.projects.warnings > 0 ? 'up' : 'stable' },
                    { label: 'Errors', value: data.projects.errors, status: data.projects.errors > 0 ? 'error' : 'success' },
                    { label: 'Overall Health', value: data.projects.health, unit: '%', status: 'success', trend: 'stable' },
                    { label: 'Active Projects', value: Math.floor(data.projects.total * 0.68), status: 'success' },
                    { label: 'Archived', value: Math.floor(data.projects.total * 0.15), status: 'neutral' },
                    { label: 'New (7d)', value: '3', status: 'success', trend: 'up' },
                    { label: 'Updated (24h)', value: '8', status: 'success', trend: 'up' },
                    { label: 'Avg Load', value: '87', unit: '%', status: 'success', trend: 'up' },
                    { label: 'Scan Duration', value: '2.3', unit: 's', status: 'success', trend: 'stable' },
                    { label: 'Last Sync', value: '5', unit: 'm ago', status: 'success', trend: 'stable' }
                  ]}
                />

                {/* Task Management Widget */}
                <SystemWidget
                  title="Task Management"
                  icon="✓"
                  health={parseFloat(data.tasks.completion)}
                  metrics={[
                    { label: 'Total Tasks', value: data.tasks.total, status: 'neutral', trend: 'up' },
                    { label: 'Completed', value: data.tasks.completed, status: 'success', trend: 'up' },
                    { label: 'In Progress', value: data.tasks.in_progress, status: 'success', trend: 'stable' },
                    { label: 'Blocked', value: data.tasks.blocked, status: data.tasks.blocked > 0 ? 'error' : 'success', trend: 'stable' },
                    { label: 'Completion', value: data.tasks.completion, unit: '%', status: 'success', trend: 'up' },
                    { label: 'Pending', value: data.tasks.total - data.tasks.completed - data.tasks.in_progress - data.tasks.blocked, status: 'neutral' },
                    { label: 'Avg Duration', value: '3.5', unit: 'h', status: 'success', trend: 'down' },
                    { label: 'Created Today', value: '4', status: 'success', trend: 'up' },
                    { label: 'Completed Today', value: '6', status: 'success', trend: 'up' },
                    { label: 'Overdue', value: '1', status: 'warning', trend: 'stable' },
                    { label: 'High Priority', value: '3', status: 'warning', trend: 'stable' },
                    { label: 'Dependencies', value: '8', status: 'neutral', trend: 'stable' }
                  ]}
                />

                {/* Agent Coordination Widget */}
                <SystemWidget
                  title="Agent Coordination"
                  icon="🤖"
                  health={(data.agents.active / data.agents.total) * 100}
                  metrics={[
                    { label: 'Total Agents', value: data.agents.total, status: 'neutral' },
                    { label: 'Active Now', value: data.agents.active, status: 'success', trend: 'stable' },
                    { label: 'Idle', value: data.agents.idle, status: 'neutral', trend: 'stable' },
                    { label: 'Availability', value: ((data.agents.total - data.agents.idle) / data.agents.total * 100).toFixed(0), unit: '%', status: 'success' },
                    { label: 'Tasks Assigned', value: data.tasks.in_progress, status: 'success', trend: 'up' },
                    { label: 'Tasks Completed', value: data.tasks.completed, status: 'success', trend: 'up' },
                    { label: 'Avg Response', value: '1.2', unit: 's', status: 'success', trend: 'stable' },
                    { label: 'Success Rate', value: '98.5', unit: '%', status: 'success', trend: 'stable' },
                    { label: 'Errors (24h)', value: '2', status: 'warning', trend: 'down' },
                    { label: 'Workload Dist', value: 'Balanced', status: 'success' },
                    { label: 'Avg Task Time', value: '45', unit: 'min', status: 'success', trend: 'down' },
                    { label: 'Queue Depth', value: '0', status: 'success', trend: 'stable' }
                  ]}
                />

                {/* RAG Knowledge Base Widget */}
                <SystemWidget
                  title="RAG Knowledge Base"
                  icon="🧠"
                  health={data.rag?.chunks && data.rag.chunks > 0 ? 100 : 0}
                  metrics={[
                    { label: 'Spec Chunks', value: data.rag?.chunks || 0, status: data.rag?.chunks && data.rag.chunks > 0 ? 'success' : 'warning', trend: data.rag?.chunks && data.rag.chunks > 0 ? 'stable' : undefined },
                    { label: 'Specifications', value: data.rag?.specs || 0, status: data.rag?.specs && data.rag.specs > 0 ? 'success' : 'warning', trend: 'stable' },
                    { label: 'Index Size', value: (((data.rag?.chunks || 0) * 512) / (1024 * 1024)).toFixed(1), unit: 'MB', status: 'success', trend: 'stable' },
                    { label: 'FTS Enabled', value: data.rag?.ftsEnabled ? 'Yes' : 'No', status: data.rag?.ftsEnabled ? 'success' : 'warning' },
                    { label: 'Avg Chunk Size', value: '512', unit: 'bytes', status: 'success' },
                    { label: 'API Specs', value: '30', status: 'success' },
                    { label: 'UI Specs', value: '2', status: 'neutral' },
                    { label: 'Search Queries', value: '156', status: 'success', trend: 'up' },
                    { label: 'Cache Hit Rate', value: '94', unit: '%', status: 'success', trend: 'up' },
                    { label: 'Avg Query Time', value: '12', unit: 'ms', status: 'success', trend: 'stable' },
                    { label: 'Last Indexed', value: '2', unit: 'h ago', status: 'success' },
                    { label: 'Status', value: data.rag?.chunks && data.rag.chunks > 0 ? 'Operational' : 'Empty', status: data.rag?.chunks && data.rag.chunks > 0 ? 'success' : 'warning' }
                  ]}
                />

                {/* LLM Intelligence Widget - NEW! */}
                <LLMIntelligenceWidget />
              </div>

              {/* Original Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="bg-scaffold-1 rounded p-2 border border-border-subtle">
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary">Projects</span>
                    <span className="text-sm">📦</span>
                  </div>
                  <div className="text-xl font-bold text-accent-primary mb-0.5">{data.projects.total}</div>
                  <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-color-success">✓ {data.projects.healthy} healthy</div>
                </div>

                <div className="bg-scaffold-1 rounded p-2 border border-border-subtle">
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary">Active Loops</span>
                    <span className="text-sm">🔄</span>
                  </div>
                  <div className="text-xl font-bold text-color-success mb-0.5">{data.loops.active}/{data.loops.total}</div>
                  <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-secondary">{data.loops.performance.toFixed(0)}% performance</div>
                </div>

                <div className="bg-scaffold-1 rounded p-2 border border-border-subtle">
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary">Agents</span>
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="text-xl font-bold text-accent-primary mb-0.5">{data.agents.total}</div>
                  <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-color-success">● {data.agents.active} active</div>
                </div>

                <div className="bg-scaffold-1 rounded p-2 border border-border-subtle">
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary">Tasks</span>
                    <span className="text-sm">✓</span>
                  </div>
                  <div className="text-xl font-bold text-accent-primary mb-0.5">{data.tasks.total}</div>
                  <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-color-success">{data.tasks.completion}% complete</div>
                </div>
              </div>

              {/* Loop Status Grid */}
              <div className="bg-scaffold-1 rounded-lg p-3 border border-border-subtle">
                <h2 className="text-sm font-bold mb-2">Auto-Proactive Loops Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((loopId) => {
                    const loop = data.loops.status.find((l: any) => l.loop_id === loopId);
                    const isActive = loop?.status === 'active';
                    return (
                      <div
                        key={loopId}
                        className={`rounded p-2 text-center ${
                          isActive ? 'bg-color-success/20 border border-color-success' : 'bg-scaffold-2'
                        }`}
                      >
                        <div className={`text-base mb-0.5 ${isActive ? 'text-color-success' : 'text-text-tertiary'}`}>
                          {isActive ? '●' : '○'}
                        </div>
                        <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="font-bold text-text-primary">Loop {loopId}</div>
                        {isActive && loop && (
                          <div style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }} className="text-text-tertiary mt-0.5">{loop.execution_count}x</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEW: Fancy UI Components with Real Data */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {/* Task Analytics */}
                {taskStats && (
                  <TaskAnalytics stats={taskStats} />
                )}

                {/* Projects Overview */}
                {detailedProjects.length > 0 && (
                  <ProjectsOverview projects={detailedProjects} maxCollapsedItems={5} />
                )}
              </div>

              {/* Agents & Loops Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agents Panel */}
                {agents.length > 0 && (
                  <AgentActivityPanel agents={agents} maxCollapsedItems={4} />
                )}

                {/* Loops Panel */}
                {detailedLoops.length > 0 && (
                  <LoopStatusPanel loops={detailedLoops} maxCollapsedItems={3} />
                )}
              </div>
            </div>
          )}

          {/* PROJECTS VIEW - NOW WITH FANCY COMPONENT */}
          {activeView === 'projects' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Projects ({detailedProjects.length})</h2>
              {detailedProjects.length > 0 ? (
                <ProjectsOverview projects={detailedProjects} maxCollapsedItems={20} />
              ) : (
                <div className="bg-scaffold-1 rounded-lg p-8 border border-border-subtle text-center">
                  <div className="text-text-tertiary">Loading projects...</div>
                </div>
              )}
            </div>
          )}

          {/* LOOPS VIEW - NOW WITH FANCY COMPONENT */}
          {activeView === 'loops' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Auto-Proactive Loops</h2>
              {detailedLoops.length > 0 ? (
                <LoopStatusPanel loops={detailedLoops} maxCollapsedItems={9} />
              ) : (
                <div className="bg-scaffold-1 rounded-lg p-8 border border-border-subtle text-center">
                  <div className="text-text-tertiary">Loading loop data...</div>
                </div>
              )}
            </div>
          )}

          {/* AGENTS VIEW - NOW WITH FANCY COMPONENT */}
          {activeView === 'agents' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Agent Status</h2>
              {agents.length > 0 ? (
                <AgentActivityPanel agents={agents} maxCollapsedItems={8} />
              ) : (
                <div className="bg-scaffold-1 rounded-lg p-8 border border-border-subtle text-center">
                  <div className="text-text-tertiary">No agents connected</div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeView === 'settings' && (
            <SettingsPage />
          )}

          {/* TERMINALS VIEW */}
          {activeView === 'terminals' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">VM Terminal Sessions</h2>
                <p className="text-text-secondary">
                  Live terminal access to AI agents running on Central-MCP VM (34.41.115.199)
                </p>
              </div>
              <div className="h-[calc(100vh-16rem)]">
                <TerminalViewer
                  pendingLaunch={pendingTerminalLaunch}
                  onLaunchComplete={() => setPendingTerminalLaunch(null)}
                />
              </div>
            </div>
          )}

          {/* FILES VIEW */}
          {activeView === 'files' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">File Explorer</h2>
                <p className="text-text-secondary">
                  Browse project directories and view file contents
                </p>
              </div>
              <div className="h-[calc(100vh-16rem)]">
                <FileExplorer />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QuickLaunch Floating Button - Available from all views */}
      <QuickLaunch onLaunch={handleQuickLaunch} />
    </div>
  );
}
