'use client';

import { useState, useEffect } from 'react';

interface Config {
  loops: Record<string, { enabled: boolean; interval: number; name: string }>;
  database: any;
  projects: any;
  agents: any;
  tasks: any;
  rag: any;
  api: any;
  monitoring: any;
  git: any;
  systems: any;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('loops');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/central-mcp/config');
      const data = await response.json();
      setConfig(data.config);
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/central-mcp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSaveMessage('✅ Configuration saved successfully!');
        setHasChanges(false);
      } else {
        setSaveMessage(`❌ Error: ${data.message}`);
      }
    } catch (err: any) {
      setSaveMessage(`❌ Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const resetConfig = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/central-mcp/config', { method: 'PUT' });
      const data = await response.json();

      if (data.status === 'success') {
        setConfig(data.config);
        setSaveMessage('✅ Configuration reset to defaults!');
        setHasChanges(false);
      }
    } catch (err: any) {
      setSaveMessage(`❌ Reset failed: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const updateConfig = (path: string[], value: any) => {
    if (!config) return;

    const newConfig = JSON.parse(JSON.stringify(config));
    let current: any = newConfig;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setConfig(newConfig);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-scaffold-0 flex items-center justify-center">
        <div className="text-accent-primary text-lg animate-pulse">⚙️ Loading settings...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-scaffold-0 p-8">
        <div className="max-w-2xl mx-auto bg-color-error/10 border border-color-error rounded-lg p-6">
          <div className="text-color-error font-bold">❌ Failed to load configuration</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'loops', label: '🔄 Auto-Proactive Loops', icon: '🔄' },
    { id: 'database', label: '💾 Database', icon: '💾' },
    { id: 'projects', label: '📦 Projects', icon: '📦' },
    { id: 'agents', label: '🤖 Agents', icon: '🤖' },
    { id: 'tasks', label: '✓ Tasks', icon: '✓' },
    { id: 'rag', label: '🧠 RAG System', icon: '🧠' },
    { id: 'api', label: '🔌 API', icon: '🔌' },
    { id: 'monitoring', label: '📊 Monitoring', icon: '📊' },
    { id: 'git', label: '🔀 Git', icon: '🔀' },
    { id: 'systems', label: '⚡ Revolutionary Systems', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">⚙️ Central-MCP Settings</h1>
            <p className="text-text-secondary">Configure all auto-proactive systems and behaviors</p>
          </div>

          <div className="flex items-center gap-4">
            {hasChanges && (
              <div className="text-sm text-color-warning animate-pulse">● Unsaved changes</div>
            )}

            {saveMessage && (
              <div className={`text-sm px-4 py-2 rounded-lg ${
                saveMessage.includes('✅') ? 'bg-color-success/20 text-color-success' : 'bg-color-error/20 text-color-error'
              }`}>
                {saveMessage}
              </div>
            )}

            <button
              onClick={resetConfig}
              disabled={saving}
              className="px-4 py-2 bg-scaffold-1 border border-border-subtle rounded-lg hover:bg-scaffold-2 transition-colors disabled:opacity-50"
            >
              🔄 Reset to Defaults
            </button>

            <button
              onClick={saveConfig}
              disabled={saving || !hasChanges}
              className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-scaffold-1 rounded-lg border border-border-subtle overflow-hidden mb-6">
          <div className="flex items-center gap-2 p-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent-primary/20 text-accent-primary font-medium'
                    : 'text-text-secondary hover:bg-scaffold-2'
                }`}
              >
                <span className="text-lg mr-2">{tab.icon}</span>
                <span className="text-sm">{tab.label.replace(/^.* /, '')}</span>
              </button>
            ))}
          </div>
        </div>

      {/* Content */}
      <div className="bg-scaffold-1 rounded-lg border border-border-subtle p-6">
          {/* LOOPS TAB */}
          {activeTab === 'loops' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">🔄 Auto-Proactive Loops</h2>
                <p className="text-text-secondary">Configure the 10 loops that make Central-MCP alive</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {Object.entries(config.loops).map(([key, loop]) => (
                  <div key={key} className="bg-scaffold-0 rounded-lg p-4 border border-border-subtle">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loop.enabled}
                            onChange={(e) => updateConfig(['loops', key, 'enabled'], e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                        </label>
                        <div>
                          <div className="font-bold text-text-primary">{loop.name}</div>
                          <div className="text-xs text-text-tertiary">
                            {key === 'loop0' && 'Foundation health checks'}
                            {key === 'loop1' && 'Agent identity & capability tracking'}
                            {key === 'loop2' && 'Project discovery & registration'}
                            {key === 'loop3' && 'LLM context learning (Reserved)'}
                            {key === 'loop4' && 'Real-time progress monitoring'}
                            {key === 'loop5' && 'Health analysis & blocker detection'}
                            {key === 'loop6' && 'Opportunity identification'}
                            {key === 'loop7' && 'Specification generation'}
                            {key === 'loop8' && 'Intelligent task assignment'}
                            {key === 'loop9' && 'Git intelligence & auto-versioning'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm text-text-tertiary">Interval:</label>
                        <input
                          type="number"
                          value={loop.interval}
                          onChange={(e) => updateConfig(['loops', key, 'interval'], parseInt(e.target.value))}
                          className="w-24 px-3 py-1 bg-scaffold-2 border border-border-subtle rounded text-text-primary text-sm"
                          min="5"
                          step="5"
                        />
                        <span className="text-sm text-text-tertiary">seconds</span>
                      </div>
                    </div>

                    {!loop.enabled && (
                      <div className="text-xs text-color-warning bg-color-warning/10 px-3 py-2 rounded">
                        ⚠️ Loop disabled - system functionality may be reduced
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DATABASE TAB */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">💾 Database Settings</h2>
                <p className="text-text-secondary">Configure database connection and management</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Database Path</label>
                  <input
                    type="text"
                    value={config.database.path}
                    onChange={(e) => updateConfig(['database', 'path'], e.target.value)}
                    className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Connection Pool Size</label>
                    <input
                      type="number"
                      value={config.database.connectionPoolSize}
                      onChange={(e) => updateConfig(['database', 'connectionPoolSize'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Query Timeout (ms)</label>
                    <input
                      type="number"
                      value={config.database.queryTimeout}
                      onChange={(e) => updateConfig(['database', 'queryTimeout'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.database.backupEnabled}
                    onChange={(e) => updateConfig(['database', 'backupEnabled'], e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-text-primary">Enable automatic backups</label>
                </div>

                {config.database.backupEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Backup Interval (seconds)</label>
                    <input
                      type="number"
                      value={config.database.backupInterval}
                      onChange={(e) => updateConfig(['database', 'backupInterval'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && config.projects && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">📦 Projects Settings</h2>
                <p className="text-text-secondary">Configure project discovery and auto-registration</p>
              </div>

              <div className="space-y-6">
                {/* Scan Paths */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Scan Paths
                    <span className="text-text-tertiary ml-2">(directories to scan for projects)</span>
                  </label>
                  <div className="space-y-2">
                    {(config.projects.scanPaths || []).map((path: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={path}
                          onChange={(e) => {
                            const newPaths = [...config.projects.scanPaths];
                            newPaths[idx] = e.target.value;
                            updateConfig(['projects', 'scanPaths'], newPaths);
                          }}
                          className="flex-1 px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary font-mono text-sm"
                          placeholder="/path/to/projects/"
                        />
                        <button
                          onClick={() => {
                            const newPaths = config.projects.scanPaths.filter((_: any, i: number) => i !== idx);
                            updateConfig(['projects', 'scanPaths'], newPaths);
                          }}
                          className="px-3 py-2 bg-color-error/20 text-color-error border border-color-error/30 rounded hover:bg-color-error/30 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newPaths = [...config.projects.scanPaths, '/path/to/new/'];
                        updateConfig(['projects', 'scanPaths'], newPaths);
                      }}
                      className="px-4 py-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/20 transition-colors text-sm"
                    >
                      ＋ Add Path
                    </button>
                  </div>
                </div>

                {/* Exclude Patterns */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Exclude Patterns
                    <span className="text-text-tertiary ml-2">(directories/files to ignore)</span>
                  </label>
                  <div className="space-y-2">
                    {(config.projects.excludePatterns || []).map((pattern: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pattern}
                          onChange={(e) => {
                            const newPatterns = [...config.projects.excludePatterns];
                            newPatterns[idx] = e.target.value;
                            updateConfig(['projects', 'excludePatterns'], newPatterns);
                          }}
                          className="flex-1 px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary font-mono text-sm"
                          placeholder="node_modules"
                        />
                        <button
                          onClick={() => {
                            const newPatterns = config.projects.excludePatterns.filter((_: any, i: number) => i !== idx);
                            updateConfig(['projects', 'excludePatterns'], newPatterns);
                          }}
                          className="px-3 py-2 bg-color-error/20 text-color-error border border-color-error/30 rounded hover:bg-color-error/30 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newPatterns = [...config.projects.excludePatterns, 'pattern'];
                        updateConfig(['projects', 'excludePatterns'], newPatterns);
                      }}
                      className="px-4 py-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/20 transition-colors text-sm"
                    >
                      ＋ Add Pattern
                    </button>
                  </div>
                </div>

                {/* Scan Interval & Auto Register */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Scan Interval
                      <span className="text-text-tertiary ml-2">(seconds)</span>
                    </label>
                    <input
                      type="number"
                      value={config.projects.scanInterval}
                      onChange={(e) => updateConfig(['projects', 'scanInterval'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                      min="30"
                      step="30"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      How often to scan for new projects (minimum 30s)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Auto-Registration
                    </label>
                    <div className="flex items-center gap-3 h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.projects.autoRegister}
                          onChange={(e) => updateConfig(['projects', 'autoRegister'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                      </label>
                      <span className="text-sm text-text-primary">
                        {config.projects.autoRegister ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      Automatically register discovered projects
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                      <div className="font-bold text-text-primary mb-1">Project Discovery Tips</div>
                      <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                        <li>Scan paths are recursively searched for package.json, pyproject.toml, go.mod, etc.</li>
                        <li>Exclude patterns support wildcards: *.log, temp*, **/cache/</li>
                        <li>Lower scan intervals increase system load but provide faster discovery</li>
                        <li>Auto-registration creates project entries immediately upon discovery</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AGENTS TAB */}
          {activeTab === 'agents' && config.agents && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">🤖 Agents Settings</h2>
                <p className="text-text-secondary">Configure agent coordination and assignment</p>
              </div>

              <div className="space-y-6">
                {/* Session Timeout */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Session Timeout
                    <span className="text-text-tertiary ml-2">(seconds)</span>
                  </label>
                  <input
                    type="number"
                    value={config.agents.sessionTimeout || 3600}
                    onChange={(e) => updateConfig(['agents', 'sessionTimeout'], parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    min="300"
                    step="300"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Time before an inactive agent session expires (minimum 5 minutes)
                  </p>
                </div>

                {/* Max Concurrent Agents */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Concurrent Agents
                  </label>
                  <input
                    type="number"
                    value={config.agents.maxConcurrentAgents}
                    onChange={(e) => updateConfig(['agents', 'maxConcurrentAgents'], parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    min="1"
                    max="50"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Maximum number of agents that can work simultaneously
                  </p>
                </div>

                {/* Agent Features */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary">Auto-Assignment</div>
                      <div className="text-xs text-text-tertiary">Automatically assign tasks to capable agents</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.agents.autoAssignment}
                        onChange={(e) => updateConfig(['agents', 'autoAssignment'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary">Skill Matching</div>
                      <div className="text-xs text-text-tertiary">Match tasks to agent capabilities</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.agents.skillMatching}
                        onChange={(e) => updateConfig(['agents', 'skillMatching'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary">Load Balancing</div>
                      <div className="text-xs text-text-tertiary">Distribute tasks evenly across agents</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.agents.loadBalancing}
                        onChange={(e) => updateConfig(['agents', 'loadBalancing'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && config.tasks && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">✓ Tasks Settings</h2>
                <p className="text-text-secondary">Configure task assignment and dependency management</p>
              </div>

              <div className="space-y-6">
                {/* Task Features */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary">Auto-Assignment</div>
                      <div className="text-xs text-text-tertiary">Automatically assign tasks based on agent availability</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.tasks.autoAssignment || false}
                        onChange={(e) => updateConfig(['tasks', 'autoAssignment'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary">Dependency Resolution</div>
                      <div className="text-xs text-text-tertiary">Automatically unblock tasks when dependencies complete</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.tasks.dependencyResolution}
                        onChange={(e) => updateConfig(['tasks', 'dependencyResolution'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Priority Levels */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Priority Levels
                    <span className="text-text-tertiary ml-2">(task priority classification)</span>
                  </label>
                  <div className="space-y-2">
                    {(config.tasks.priorityLevels || []).map((level: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-8 text-center text-text-tertiary font-mono text-sm">{idx}</div>
                        <input
                          type="text"
                          value={level}
                          onChange={(e) => {
                            const newLevels = [...config.tasks.priorityLevels];
                            newLevels[idx] = e.target.value;
                            updateConfig(['tasks', 'priorityLevels'], newLevels);
                          }}
                          className="flex-1 px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary font-mono text-sm"
                          placeholder="P0-CRITICAL"
                        />
                        <button
                          onClick={() => {
                            const newLevels = config.tasks.priorityLevels.filter((_: any, i: number) => i !== idx);
                            updateConfig(['tasks', 'priorityLevels'], newLevels);
                          }}
                          className="px-3 py-2 bg-color-error/20 text-color-error border border-color-error/30 rounded hover:bg-color-error/30 transition-colors"
                          disabled={config.tasks.priorityLevels.length <= 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newLevels = [...config.tasks.priorityLevels, 'P' + config.tasks.priorityLevels.length + '-NEW'];
                        updateConfig(['tasks', 'priorityLevels'], newLevels);
                      }}
                      className="px-4 py-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/20 transition-colors text-sm"
                    >
                      ＋ Add Priority Level
                    </button>
                  </div>
                </div>

                {/* Max Blocked Duration */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Blocked Duration
                    <span className="text-text-tertiary ml-2">(seconds)</span>
                  </label>
                  <input
                    type="number"
                    value={config.tasks.maxBlockedDuration}
                    onChange={(e) => updateConfig(['tasks', 'maxBlockedDuration'], parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    min="3600"
                    step="86400"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Maximum time a task can remain blocked before escalation (default: 7 days)
                  </p>
                  <div className="mt-2 text-xs text-text-secondary">
                    Current: {Math.floor(config.tasks.maxBlockedDuration / 86400)} days
                    ({Math.floor((config.tasks.maxBlockedDuration % 86400) / 3600)} hours)
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                      <div className="font-bold text-text-primary mb-1">Task Management Tips</div>
                      <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                        <li>Auto-assignment routes tasks to capable agents based on skills and workload</li>
                        <li>Dependency resolution automatically unblocks tasks when prerequisites complete</li>
                        <li>Priority levels determine task ordering (lower index = higher priority)</li>
                        <li>Blocked duration triggers alerts for tasks stuck longer than threshold</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RAG SYSTEM TAB */}
          {activeTab === 'rag' && config.rag && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">🧠 RAG System Settings</h2>
                <p className="text-text-secondary">Configure Retrieval-Augmented Generation and knowledge indexing</p>
              </div>

              <div className="space-y-6">
                {/* Chunk Settings */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Chunk Size
                      <span className="text-text-tertiary ml-2">(tokens)</span>
                    </label>
                    <input
                      type="number"
                      value={config.rag.chunkSize || 512}
                      onChange={(e) => updateConfig(['rag', 'chunkSize'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                      min="128"
                      max="2048"
                      step="128"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      Size of each text chunk for embedding (128-2048 tokens)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Chunk Overlap
                      <span className="text-text-tertiary ml-2">(tokens)</span>
                    </label>
                    <input
                      type="number"
                      value={config.rag.chunkOverlap}
                      onChange={(e) => updateConfig(['rag', 'chunkOverlap'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                      min="0"
                      max="512"
                      step="10"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      Token overlap between consecutive chunks (0-512 tokens)
                    </p>
                  </div>
                </div>

                {/* Index Settings */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Index Rebuild Interval
                      <span className="text-text-tertiary ml-2">(seconds)</span>
                    </label>
                    <input
                      type="number"
                      value={config.rag.indexRebuildInterval}
                      onChange={(e) => updateConfig(['rag', 'indexRebuildInterval'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                      min="300"
                      step="300"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      How often to rebuild the search index (minimum 5 minutes)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Max Chunks Per Spec
                    </label>
                    <input
                      type="number"
                      value={config.rag.maxChunksPerSpec}
                      onChange={(e) => updateConfig(['rag', 'maxChunksPerSpec'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                      min="100"
                      max="10000"
                      step="100"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      Maximum chunks to generate per specification document
                    </p>
                  </div>
                </div>

                {/* FTS Toggle */}
                <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                  <div>
                    <div className="font-medium text-text-primary">Full-Text Search (FTS)</div>
                    <div className="text-xs text-text-tertiary">Enable SQLite FTS for faster keyword searches</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.rag.ftsEnabled}
                      onChange={(e) => updateConfig(['rag', 'ftsEnabled'], e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                  </label>
                </div>

                {/* Info Box */}
                <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                      <div className="font-bold text-text-primary mb-1">RAG System Tips</div>
                      <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                        <li>Larger chunk sizes preserve context but reduce granularity</li>
                        <li>Chunk overlap prevents information loss at boundaries</li>
                        <li>FTS enables fast keyword search but increases database size</li>
                        <li>Lower rebuild intervals keep index fresh but increase CPU usage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API TAB */}
          {activeTab === 'api' && config.api && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">🔌 API Settings</h2>
                <p className="text-text-secondary">Configure API performance and security</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Polling Interval
                      <span className="text-text-tertiary ml-2">(milliseconds)</span>
                    </label>
                    <input
                      type="number"
                      value={config.api.pollingInterval || 5000}
                      onChange={(e) => updateConfig(['api', 'pollingInterval'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                      min="1000"
                      step="1000"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      Client-side polling frequency (minimum 1 second)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Cache Max Age
                      <span className="text-text-tertiary ml-2">(seconds)</span>
                    </label>
                    <input
                      type="number"
                      value={config.api.cacheMaxAge}
                      onChange={(e) => updateConfig(['api', 'cacheMaxAge'], parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                      min="0"
                      step="5"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      HTTP cache duration (0 to disable caching)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Rate Limit
                    <span className="text-text-tertiary ml-2">(requests per minute)</span>
                  </label>
                  <input
                    type="number"
                    value={config.api.rateLimitPerMinute}
                    onChange={(e) => updateConfig(['api', 'rateLimitPerMinute'], parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    min="10"
                    max="1000"
                    step="10"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Maximum API requests allowed per minute per client
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                  <div>
                    <div className="font-medium text-text-primary">Enable CORS</div>
                    <div className="text-xs text-text-tertiary">Allow cross-origin requests from external domains</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.api.enableCORS}
                      onChange={(e) => updateConfig(['api', 'enableCORS'], e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* MONITORING TAB */}
          {activeTab === 'monitoring' && config.monitoring && config.monitoring.alertThresholds && config.monitoring.notificationChannels && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">📊 Monitoring Settings</h2>
                <p className="text-text-secondary">Configure health checks and alert thresholds</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Health Check Interval
                    <span className="text-text-tertiary ml-2">(seconds)</span>
                  </label>
                  <input
                    type="number"
                    value={config.monitoring.healthCheckInterval || 30}
                    onChange={(e) => updateConfig(['monitoring', 'healthCheckInterval'], parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                    min="10"
                    step="10"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    How often to check system health (minimum 10 seconds)
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-4">Alert Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        CPU Usage (%)
                      </label>
                      <input
                        type="number"
                        value={config.monitoring.alertThresholds.cpuUsage}
                        onChange={(e) => updateConfig(['monitoring', 'alertThresholds', 'cpuUsage'], parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                        min="50"
                        max="100"
                        step="5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Memory Usage (%)
                      </label>
                      <input
                        type="number"
                        value={config.monitoring.alertThresholds.memoryUsage}
                        onChange={(e) => updateConfig(['monitoring', 'alertThresholds', 'memoryUsage'], parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                        min="50"
                        max="100"
                        step="5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Disk Usage (%)
                      </label>
                      <input
                        type="number"
                        value={config.monitoring.alertThresholds.diskUsage}
                        onChange={(e) => updateConfig(['monitoring', 'alertThresholds', 'diskUsage'], parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                        min="50"
                        max="100"
                        step="5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Loop Failure Rate (%)
                      </label>
                      <input
                        type="number"
                        value={config.monitoring.alertThresholds.loopFailureRate}
                        onChange={(e) => updateConfig(['monitoring', 'alertThresholds', 'loopFailureRate'], parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary"
                        min="1"
                        max="50"
                        step="1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-4">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                      <div>
                        <div className="font-medium text-text-primary">Email Notifications</div>
                        <div className="text-xs text-text-tertiary">Send alerts via email</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.monitoring.notificationChannels.email}
                          onChange={(e) => updateConfig(['monitoring', 'notificationChannels', 'email'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                      <div>
                        <div className="font-medium text-text-primary">Slack Notifications</div>
                        <div className="text-xs text-text-tertiary">Send alerts to Slack channel</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.monitoring.notificationChannels.slack}
                          onChange={(e) => updateConfig(['monitoring', 'notificationChannels', 'slack'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                      <div>
                        <div className="font-medium text-text-primary">Discord Notifications</div>
                        <div className="text-xs text-text-tertiary">Send alerts to Discord server</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.monitoring.notificationChannels.discord}
                          onChange={(e) => updateConfig(['monitoring', 'notificationChannels', 'discord'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GIT TAB */}
          {activeTab === 'git' && config.git && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">🔀 Git Settings</h2>
                <p className="text-text-secondary">Configure Git intelligence and automation</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary">Auto-Versioning</div>
                      <div className="text-xs text-text-tertiary">Automatically version releases on commits</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.git.autoVersioning || false}
                        onChange={(e) => updateConfig(['git', 'autoVersioning'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary">Push Monitoring</div>
                      <div className="text-xs text-text-tertiary">Monitor git pushes and generate changelogs</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.git.pushMonitoring}
                        onChange={(e) => updateConfig(['git', 'pushMonitoring'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Commit Message Template
                  </label>
                  <textarea
                    value={config.git.commitMessageTemplate}
                    onChange={(e) => updateConfig(['git', 'commitMessageTemplate'], e.target.value)}
                    className="w-full px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary font-mono text-sm"
                    rows={3}
                    placeholder="{{type}}: {{message}}\n\n{{body}}"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Template variables: {'{'}{'{'} type {'}'}{'}'}, {'{'}{'{'} message {'}'}{'}'}, {'{'}{'{'} body {'}'}{'}'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Branch Protection
                    <span className="text-text-tertiary ml-2">(protected branches)</span>
                  </label>
                  <div className="space-y-2">
                    {(config.git.branchProtection || []).map((branch: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={branch}
                          onChange={(e) => {
                            const newBranches = [...config.git.branchProtection];
                            newBranches[idx] = e.target.value;
                            updateConfig(['git', 'branchProtection'], newBranches);
                          }}
                          className="flex-1 px-4 py-2 bg-scaffold-0 border border-border-subtle rounded text-text-primary font-mono text-sm"
                          placeholder="main"
                        />
                        <button
                          onClick={() => {
                            const newBranches = config.git.branchProtection.filter((_: any, i: number) => i !== idx);
                            updateConfig(['git', 'branchProtection'], newBranches);
                          }}
                          className="px-3 py-2 bg-color-error/20 text-color-error border border-color-error/30 rounded hover:bg-color-error/30 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newBranches = [...config.git.branchProtection, 'branch-name'];
                        updateConfig(['git', 'branchProtection'], newBranches);
                      }}
                      className="px-4 py-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/20 transition-colors text-sm"
                    >
                      ＋ Add Protected Branch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REVOLUTIONARY SYSTEMS TAB */}
          {activeTab === 'systems' && config.systems && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">⚡ Revolutionary Systems</h2>
                <p className="text-text-secondary">Enable or disable advanced Central-MCP systems</p>
              </div>

              <div className="space-y-4">
                {Object.entries(config.systems || {}).map(([key, system]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-scaffold-0 rounded-lg border border-border-subtle">
                    <div>
                      <div className="font-medium text-text-primary capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {key === 'modelRegistry' && 'AI model management and selection'}
                        {key === 'llmOrchestrator' && 'Multi-model LLM orchestration'}
                        {key === 'gitIntelligence' && 'Git activity analysis and versioning'}
                        {key === 'autoDeployer' && 'Automated deployment pipelines'}
                        {key === 'specValidator' && 'Specification validation and quality checks'}
                        {key === 'totalityVerification' && 'Complete system verification'}
                        {key === 'agentOrchestrator' && 'Multi-agent task coordination'}
                        {key === 'contentManager' && 'Content lifecycle management'}
                        {key === 'taskGenerator' && 'Intelligent task generation'}
                        {key === 'specParser' && 'Specification parsing and normalization'}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={system.enabled}
                        onChange={(e) => updateConfig(['systems', key, 'enabled'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-scaffold-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="bg-color-warning/10 border border-color-warning/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <div className="font-bold text-text-primary mb-1">System Dependencies</div>
                    <p className="text-sm text-text-secondary">
                      Disabling critical systems may affect auto-proactive loop functionality.
                      Ensure you understand system interdependencies before making changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
