'use client';

import { useState, useEffect } from 'react';

interface KnowledgeStats {
  rag?: { total_chunks: number; total_specs: number };
  database?: { total_tables: number; total_rows: number };
  context?: { totalCollections: number; totalFiles: number; totalSizeMB: string };
  knowledgePacks?: { totalPacks: number; totalSizeMB: string };
  specifications?: { totalSpecs: number; totalSizeMB: string };
  loops?: { total_executions: number; unique_loops: number };
  conversations?: { total_conversations: number; total_messages: number };
}

interface KnowledgeLocation {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  stats?: any;
}

export default function KnowledgeSpace() {
  const [stats, setStats] = useState<KnowledgeStats>({});
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM projects LIMIT 10');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const locations: KnowledgeLocation[] = [
    {
      id: 'rag',
      name: 'RAG/Vector Store',
      icon: '🧠',
      description: 'Browse vector embeddings, search chunks, view specifications',
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
    },
    {
      id: 'database',
      name: 'Database Explorer',
      icon: '🗄️',
      description: 'Query 80+ tables, browse data, execute SQL',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    },
    {
      id: 'context',
      name: 'Context Storage',
      icon: '📦',
      description: 'Browse UUID contexts, decompress files, view contents',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    },
    {
      id: 'knowledge-packs',
      name: 'Knowledge Packs',
      icon: '📚',
      description: 'Specialized knowledge archives and implementation guides',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    },
    {
      id: 'specifications',
      name: 'Specifications Library',
      icon: '📋',
      description: 'Browse 02_SPECBASES, search specs, view documentation',
      color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    },
    {
      id: 'loops',
      name: 'Loop Execution History',
      icon: '🔄',
      description: 'Auto-proactive loop logs, execution timeline, performance',
      color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    },
    {
      id: 'conversations',
      name: 'Conversation Archives',
      icon: '💬',
      description: 'Browse conversations, search messages, view outputs',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    },
    {
      id: 'git',
      name: 'Git Intelligence',
      icon: '🌿',
      description: 'Commits, branches, pushes with intelligent analysis',
      color: 'from-lime-500/20 to-green-500/20 border-lime-500/30',
    },
  ];

  // Fetch stats for all locations
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ragRes, dbRes, contextRes, packsRes, specsRes, loopsRes, convsRes] = await Promise.all([
          fetch('/api/knowledge/rag?type=stats'),
          fetch('/api/knowledge/database?action=stats'),
          fetch('/api/knowledge/context?action=stats'),
          fetch('/api/knowledge/knowledge-packs?action=stats'),
          fetch('/api/knowledge/specifications?action=stats'),
          fetch('/api/knowledge/loops?action=stats'),
          fetch('/api/knowledge/conversations?action=stats'),
        ]);

        const statsData: KnowledgeStats = {
          rag: ragRes.ok ? await ragRes.json() : undefined,
          database: dbRes.ok ? await dbRes.json() : undefined,
          context: contextRes.ok ? await contextRes.json() : undefined,
          knowledgePacks: packsRes.ok ? await packsRes.json() : undefined,
          specifications: specsRes.ok ? await specsRes.json() : undefined,
          loops: loopsRes.ok ? await loopsRes.json() : undefined,
          conversations: convsRes.ok ? await convsRes.json() : undefined,
        };

        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const loadLocationData = async (locationId: string) => {
    setSelectedLocation(locationId);
    setLoadingLocation(true);
    setLocationData(null);

    try {
      let url = '';
      switch (locationId) {
        case 'rag':
          url = '/api/knowledge/rag?type=chunks&limit=20';
          break;
        case 'database':
          url = '/api/knowledge/database?action=tables';
          break;
        case 'context':
          url = '/api/knowledge/context?action=list';
          break;
        case 'knowledge-packs':
          url = '/api/knowledge/knowledge-packs?action=list';
          break;
        case 'specifications':
          url = '/api/knowledge/specifications?action=list';
          break;
        case 'loops':
          url = '/api/knowledge/loops?action=timeline&limit=50';
          break;
        case 'conversations':
          url = '/api/knowledge/conversations?action=list&limit=20';
          break;
        default:
          return;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLocationData(data);
      }
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const getLocationStats = (locationId: string) => {
    switch (locationId) {
      case 'rag':
        return stats.rag ? `${stats.rag.rag?.total_chunks || 0} chunks, ${stats.rag.rag?.total_specs || 0} specs` : 'Loading...';
      case 'database':
        return stats.database ? `${stats.database.stats?.length || 0} tables` : 'Loading...';
      case 'context':
        return stats.context ? `${stats.context.totalCollections || 0} collections, ${stats.context.totalFiles || 0} files` : 'Loading...';
      case 'knowledge-packs':
        return stats.knowledgePacks ? `${stats.knowledgePacks.totalPacks || 0} packs, ${stats.knowledgePacks.totalSizeMB || 0} MB` : 'Loading...';
      case 'specifications':
        return stats.specifications ? `${stats.specifications.totalSpecs || 0} specs, ${stats.specifications.totalSizeMB || 0} MB` : 'Loading...';
      case 'loops':
        return stats.loops ? `${stats.loops.total_executions || 0} executions, ${stats.loops.unique_loops || 0} loops` : 'Loading...';
      case 'conversations':
        return stats.conversations ? `${stats.conversations.total_conversations || 0} conversations, ${stats.conversations.total_messages || 0} messages` : 'Loading...';
      case 'git':
        return 'Git commits & branches';
      default:
        return '';
    }
  };

  const renderLocationContent = () => {
    if (!locationData) return null;

    switch (selectedLocation) {
      case 'database':
        return renderDatabaseTables();
      case 'specifications':
        return renderSpecifications();
      case 'loops':
        return renderLoopExecutions();
      case 'rag':
        return renderRAGChunks();
      case 'conversations':
        return renderConversations();
      case 'context':
        return renderContextFiles();
      case 'knowledge-packs':
        return renderKnowledgePacks();
      default:
        return (
          <div className="bg-scaffold-0 border border-border-subtle rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {JSON.stringify(locationData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const executeSqlQuery = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    try {
      const res = await fetch('/api/knowledge/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setSqlResult(data);
      } else {
        const error = await res.json();
        setSqlResult({ error: error.error || 'Query failed' });
      }
    } catch (error) {
      setSqlResult({ error: 'Network error' });
    } finally {
      setSqlLoading(false);
    }
  };

  const renderDatabaseTables = () => {
    if (!locationData?.stats) return null;
    return (
      <div className="space-y-4">
        {/* SQL Query Interface */}
        <div className="bg-scaffold-0 border border-border-subtle rounded-lg p-4">
          <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
            <span>🔍</span>
            SQL Query Interface
          </h3>
          <div className="space-y-3">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full bg-scaffold-1 border border-border-subtle rounded px-3 py-2 text-text-primary font-mono text-sm resize-none"
              rows={3}
              placeholder="SELECT * FROM table_name LIMIT 10"
            />
            <button
              onClick={executeSqlQuery}
              disabled={sqlLoading}
              className="bg-accent-primary hover:bg-accent-primary/80 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {sqlLoading ? 'Executing...' : 'Execute Query'}
            </button>

            {sqlResult && (
              <div className="mt-4">
                {sqlResult.error ? (
                  <div className="bg-red-500/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                    {sqlResult.error}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-text-tertiary text-xs">
                      {sqlResult.rows?.length || 0} rows returned
                    </div>
                    <div className="bg-scaffold-1 border border-border-subtle rounded p-3 max-h-64 overflow-auto">
                      <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
                        {JSON.stringify(sqlResult.rows, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table Grid */}
        <div>
          <h3 className="text-text-primary font-semibold mb-3">Database Tables ({locationData.stats.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {locationData.stats.slice(0, 30).map((table: any, idx: number) => (
              <div
                key={idx}
                className="bg-scaffold-0 border border-border-subtle rounded-lg p-4 hover:border-accent-primary transition-colors cursor-pointer"
                onClick={() => setSqlQuery(`SELECT * FROM ${table.name} LIMIT 10`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-primary font-semibold text-sm">{table.name}</span>
                  <span className="text-text-tertiary text-xs">{table.row_count} rows</span>
                </div>
                <div className="text-text-secondary text-xs">
                  {table.column_count} columns
                </div>
              </div>
            ))}
          </div>
          {locationData.stats.length > 30 && (
            <div className="text-center text-text-tertiary text-sm mt-3">
              ... and {locationData.stats.length - 30} more tables
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSpecifications = () => {
    if (!locationData?.specs) return null;
    return (
      <div className="space-y-3">
        {locationData.specs.map((spec: any) => (
          <div key={spec.id} className="bg-scaffold-0 border border-border-subtle rounded-lg p-4 hover:border-pink-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {spec.number && (
                  <span className="bg-pink-500/20 text-pink-400 text-xs font-mono px-2 py-1 rounded">
                    {String(spec.number).padStart(4, '0')}
                  </span>
                )}
                <h3 className="text-text-primary font-semibold">{spec.title}</h3>
              </div>
              <span className="text-text-tertiary text-xs">{(spec.size / 1024).toFixed(1)}KB</span>
            </div>
            <p className="text-text-secondary text-sm line-clamp-2">{spec.preview}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderLoopExecutions = () => {
    if (!locationData?.executions) return null;
    return (
      <div className="space-y-2">
        {locationData.executions.slice(0, 20).map((exec: any) => (
          <div key={exec.id} className="bg-scaffold-0 border border-border-subtle rounded-lg p-3 hover:border-violet-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-violet-500/20 text-violet-400 text-xs font-mono px-2 py-1 rounded">
                  {exec.loop_name}
                </span>
                <span className="text-text-secondary text-sm">{exec.action}</span>
                {exec.project_name && (
                  <span className="text-text-tertiary text-xs">→ {exec.project_name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {exec.execution_time_ms && (
                  <span className="text-text-tertiary text-xs">{exec.execution_time_ms}ms</span>
                )}
                <span className="text-text-tertiary text-xs">
                  {new Date(exec.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRAGChunks = () => {
    if (!locationData?.chunks) return null;
    return (
      <div className="space-y-3">
        {locationData.chunks.slice(0, 10).map((chunk: any, idx: number) => (
          <div key={idx} className="bg-scaffold-0 border border-border-subtle rounded-lg p-4 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-primary font-semibold text-sm">Chunk #{chunk.chunk_id}</span>
              <span className="text-text-tertiary text-xs">Spec: {chunk.spec_id}</span>
            </div>
            <p className="text-text-secondary text-sm line-clamp-3">{chunk.content}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderConversations = () => {
    if (!locationData?.conversations) return null;
    return (
      <div className="space-y-3">
        {locationData.conversations.map((conv: any) => (
          <div key={conv.id} className="bg-scaffold-0 border border-border-subtle rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-primary font-semibold text-sm">Agent: {conv.agent_id}</span>
              <span className="text-text-tertiary text-xs">{conv.message_count} messages</span>
            </div>
            <div className="text-text-secondary text-xs">
              Started: {new Date(conv.started_at).toLocaleString()}
            </div>
            {conv.project_id && (
              <div className="text-text-tertiary text-xs mt-1">Project: {conv.project_id}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContextFiles = () => {
    if (!locationData?.collections) return null;
    return (
      <div className="space-y-3">
        {locationData.collections.map((coll: any) => (
          <div key={coll.id} className="bg-scaffold-0 border border-border-subtle rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-primary font-semibold">{coll.name}</h3>
              <span className="text-text-tertiary text-xs">{coll.files.length} files</span>
            </div>
            <div className="space-y-1">
              {coll.files.map((file: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-scaffold-1 rounded">
                  <span className="text-text-secondary font-mono text-xs">{file}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderKnowledgePacks = () => {
    if (!locationData?.packs) return null;
    return (
      <div className="space-y-3">
        {locationData.packs.map((pack: any) => (
          <div key={pack.name} className="bg-scaffold-0 border border-border-subtle rounded-lg p-4 hover:border-amber-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {pack.type === 'archive' ? '📦' : pack.type === 'document' ? '📄' : '📁'}
                </span>
                <span className="text-text-primary font-semibold">{pack.name}</span>
              </div>
              <span className="text-text-tertiary text-xs">{(pack.size / 1024).toFixed(1)}KB</span>
            </div>
            <div className="text-text-secondary text-xs">
              Modified: {new Date(pack.modified).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-scaffold-0 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            🏛️ Knowledge Space
          </h1>
          <p className="text-text-secondary">
            All knowledge, data, and information as physical objects in virtual locations
          </p>
        </div>

        {/* Knowledge Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => loadLocationData(location.id)}
              className={`
                relative overflow-hidden
                bg-gradient-to-br ${location.color}
                border rounded-xl p-6
                text-left transition-all duration-200
                hover:scale-105 hover:shadow-lg
                ${selectedLocation === location.id ? 'ring-2 ring-accent-primary' : ''}
              `}
            >
              <div className="text-4xl mb-3">{location.icon}</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {location.name}
              </h3>
              <p className="text-sm text-text-secondary mb-3">
                {location.description}
              </p>
              <div className="text-xs text-text-tertiary font-mono">
                {loading ? 'Loading...' : getLocationStats(location.id)}
              </div>
            </button>
          ))}
        </div>

        {/* Location Data Display */}
        {selectedLocation && (
          <div className="bg-scaffold-1 border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                {locations.find(l => l.id === selectedLocation)?.icon}
                {locations.find(l => l.id === selectedLocation)?.name}
              </h2>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-text-tertiary hover:text-text-primary"
              >
                ✕ Close
              </button>
            </div>

            {loadingLocation ? (
              <div className="text-center py-12 text-text-secondary">
                Loading data...
              </div>
            ) : (
              <div className="space-y-4">
                {renderLocationContent()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
