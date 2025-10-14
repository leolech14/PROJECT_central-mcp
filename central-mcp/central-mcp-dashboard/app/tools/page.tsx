'use client';

import { useState } from 'react';

interface Tool {
  id: string;
  name: string;
  category: 'central-mcp' | 'universal' | 'ecosystem';
  description: string;
  status: 'active' | 'beta' | 'planned';
  icon: string;
  capabilities: string[];
  usage: string;
  location?: string;
  deployedUrl?: string;
  documentation?: string;
}

const TOOLS: Tool[] = [
  // ========================================
  // CENTRAL-MCP SPECIFIC TOOLS
  // ========================================
  {
    id: 'skp-pipeline',
    name: 'SKP Ingestion Pipeline',
    category: 'central-mcp',
    status: 'active',
    icon: '📦',
    description: 'Specialized Knowledge Pack (SKP) ingestion, versioning, and management system',
    capabilities: [
      'Semantic versioning (v1.0.0 → v1.1.0)',
      'Automatic change detection',
      'Database-tracked history',
      'CLI tool: ./scripts/update-skp.sh'
    ],
    usage: './scripts/update-skp.sh ULTRATHINK_REALTIME_VOICE_MASTERY /path/to/content',
    location: '/central-mcp/scripts/update-skp.sh',
    documentation: '/docs/SKP_INGESTION_PIPELINE.md'
  },
  {
    id: 'registry-discovery',
    name: 'Backend Connections Registry',
    category: 'central-mcp',
    status: 'active',
    icon: '🔗',
    description: 'Real-time backend API and React component discovery engine',
    capabilities: [
      'Auto-discovers 19+ API endpoints',
      'Maps React components to APIs',
      'Generates living documentation',
      'Detects orphaned components'
    ],
    usage: 'python registry_discovery_engine.py',
    location: '/central-mcp/registry_discovery_engine.py',
    documentation: '/BACKEND_CONNECTIONS_REGISTRY_ARCHITECTURE.md'
  },
  {
    id: 'auto-proactive-loops',
    name: 'Auto-Proactive Intelligence (9 Loops)',
    category: 'central-mcp',
    status: 'active',
    icon: '🔄',
    description: 'Self-optimizing system with 9 autonomous intelligence loops',
    capabilities: [
      'Loop 0-1: Foundation & awareness',
      'Loop 2-5: Observation & tracking',
      'Loop 6-7, 9: Detection & planning',
      'Loop 8: Task auto-assignment'
    ],
    usage: 'Runs automatically in background',
    location: '/central-mcp/src/loops/',
    documentation: '/02_SPECBASES/0010_AUTO_PROACTIVE_INTELLIGENCE_ARCHITECTURE.md'
  },
  {
    id: 'agent-coordination',
    name: 'Multi-Agent Coordination System',
    category: 'central-mcp',
    status: 'active',
    icon: '🤖',
    description: 'Coordinates 6 agents (A-F) across 44 projects with task registry',
    capabilities: [
      'Agent identity tracking',
      'Task claiming & assignment',
      'Progress monitoring',
      'Blocker detection'
    ],
    usage: 'connect_to_mcp tool in Claude Code',
    location: '/central-mcp/src/tools/',
    documentation: '/CLAUDE.md'
  },

  // ========================================
  // UNIVERSAL TOOLS (EXTERNAL)
  // ========================================
  {
    id: 'mr-fix-my-project',
    name: 'MR.FIX-MY-PROJECT(PLEASE!)',
    category: 'universal',
    status: 'active',
    icon: '🔧',
    description: 'Universal project intelligence analyzer with adaptive strategy (13,100 LOC megalith)',
    capabilities: [
      '172 documented functions',
      'Self-healing code manager',
      'Maximum extraction analysis',
      'HTML report generation',
      'Mermaid diagram visualizer (5 diagrams)',
      'Component dependency mapper'
    ],
    usage: 'python mr-fix-my-project-please.py /path/to/project',
    location: '/LocalBrain/mr-fix-my-project-please.py',
    documentation: 'Built-in megalith index (lines 1-90)'
  },
  {
    id: 'sniper-tagger',
    name: 'Multi-Indexer Sniper Tagger Query Gun',
    category: 'universal',
    status: 'active',
    icon: '🎯',
    description: 'Surgical code querying and editing with semantic tags',
    capabilities: [
      'Semantic HTML queries (@html:form, @component:modal)',
      'Surgical line-range editing',
      'Impact analysis before changes',
      'Component extraction',
      'Cloud-hosted MCP server'
    ],
    usage: 'SniperGunClient.query("@html:button")',
    location: '/LocalBrain/04_AGENT_FRAMEWORK/mcp-integration/SniperGunClient.ts',
    deployedUrl: 'https://sniper-gun-mcp-635198490463.us-central1.run.app',
    documentation: '/LocalBrain/MULTI_INDEXER_SNIPER_ANALYSIS.md'
  },
  {
    id: 'megalith-indexer',
    name: 'MEGALITH Dependency Visualizer',
    category: 'universal',
    status: 'active',
    icon: '🗺️',
    description: 'Visual dependency mapping for massive codebases',
    capabilities: [
      'Interactive HTML visualization',
      'Real-time dependency graphs',
      'Critical path analysis',
      'Component clustering'
    ],
    usage: 'Integrated into MR.FIX-MY-PROJECT',
    location: '/LocalBrain/04_AGENT_FRAMEWORK/MEGALITH_DEPENDENCY_VISUALIZER.html'
  },

  // ========================================
  // ECOSYSTEM TOOLS
  // ========================================
  {
    id: 'pixel-perfect-ascii',
    name: 'Pixel Perfect ASCII System',
    category: 'ecosystem',
    status: 'active',
    icon: '✨',
    description: 'Perfect ASCII art generation and validation',
    capabilities: [
      'Character-perfect alignment',
      'Box drawing validation',
      'Zone marker system',
      'Self-healing ASCII'
    ],
    usage: 'Python pixel_perfect_ascii_system.py',
    location: '/LocalBrain/04_AGENT_FRAMEWORK/pixel_perfect_ascii_system.py',
    documentation: '/LocalBrain/04_AGENT_FRAMEWORK/PIXEL_PERFECT_SOLUTION.md'
  },
  {
    id: 'ultra think-mermaid',
    name: 'ULTRATHINK Mermaid Maximizer',
    category: 'ecosystem',
    status: 'active',
    icon: '📊',
    description: '5-diagram focused dependency visualization',
    capabilities: [
      'Main core diagram',
      'Critical paths',
      'Component clusters',
      'Service layers',
      'Risk analysis'
    ],
    usage: 'Integrated into MR.FIX-MY-PROJECT',
    location: '/LocalBrain/mr-fix-my-project-please.py (lines 3441+)'
  },
  {
    id: 'doppler-integration',
    name: 'Doppler Credential Manager',
    category: 'ecosystem',
    status: 'active',
    icon: '🔐',
    description: 'Secure API key and credential management',
    capabilities: [
      'Zero credentials in code',
      'Environment injection',
      'Multi-project configs',
      'CLI integration'
    ],
    usage: 'doppler run -- command',
    location: 'External service',
    deployedUrl: 'https://doppler.com'
  },

  // ========================================
  // PLANNED/BETA TOOLS
  // ========================================
  {
    id: 'skp-api',
    name: 'SKP Backend API',
    category: 'central-mcp',
    status: 'planned',
    icon: '🚀',
    description: 'RESTful API for programmatic SKP management',
    capabilities: [
      'POST /api/skp/ingest',
      'GET /api/skp/:skp_id',
      'GET /api/skp/:skp_id/versions',
      'GET /api/skp/search?q=query'
    ],
    usage: 'Coming in Phase 2',
    location: '/central-mcp/src/api/skp-ingestion.ts (planned)'
  },
  {
    id: 'canvas-query-sniper',
    name: 'Canvas Atomic Query Sniper',
    category: 'ecosystem',
    status: 'beta',
    icon: '🎨',
    description: 'Obsidian Canvas file querying and manipulation',
    capabilities: [
      'Canvas node extraction',
      'Atomic note linking',
      'Semantic canvas queries',
      'Canvas visualization'
    ],
    usage: 'python CANVAS_ATOMIC_QUERY_SNIPER.py',
    location: '/PROJECT_orchestra/obsidian-orchestra/CANVAS_ATOMIC_QUERY_SNIPER.py'
  },
  {
    id: 'advanced-semantic-sniper',
    name: 'Advanced Semantic Sniper',
    category: 'ecosystem',
    status: 'beta',
    icon: '🔍',
    description: 'Deep semantic code understanding and extraction',
    capabilities: [
      'Semantic code queries',
      'Context-aware extraction',
      'Pattern recognition',
      'Code intelligence'
    ],
    usage: 'python ADVANCED_SEMANTIC_SNIPER.py',
    location: '/PROJECT_orchestra/obsidian-orchestra/ADVANCED_SEMANTIC_SNIPER.py'
  }
];

const categoryColors = {
  'central-mcp': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'universal': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'ecosystem': 'bg-green-500/20 text-green-400 border-green-500/30'
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  beta: 'bg-yellow-500/20 text-yellow-400',
  planned: 'bg-gray-500/20 text-gray-400'
};

export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const filteredTools = selectedCategory === 'all'
    ? TOOLS
    : TOOLS.filter(t => t.category === selectedCategory);

  const categoryStats = {
    'central-mcp': TOOLS.filter(t => t.category === 'central-mcp').length,
    'universal': TOOLS.filter(t => t.category === 'universal').length,
    'ecosystem': TOOLS.filter(t => t.category === 'ecosystem').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🛠️ Available Tools</h1>
        <p className="text-gray-400">
          Complete toolkit of MCP servers, analyzers, and utilities across Central-MCP and ecosystem
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{TOOLS.length}</div>
          <div className="text-sm text-gray-400">Total Tools</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {TOOLS.filter(t => t.status === 'active').length}
          </div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {TOOLS.filter(t => t.status === 'beta').length}
          </div>
          <div className="text-sm text-gray-400">Beta</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-400">
            {TOOLS.filter(t => t.status === 'planned').length}
          </div>
          <div className="text-sm text-gray-400">Planned</div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({TOOLS.length})
        </button>
        <button
          onClick={() => setSelectedCategory('central-mcp')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedCategory === 'central-mcp'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Central-MCP ({categoryStats['central-mcp']})
        </button>
        <button
          onClick={() => setSelectedCategory('universal')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedCategory === 'universal'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Universal Tools ({categoryStats['universal']})
        </button>
        <button
          onClick={() => setSelectedCategory('ecosystem')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedCategory === 'ecosystem'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Ecosystem ({categoryStats['ecosystem']})
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTools.map(tool => (
          <div
            key={tool.id}
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition cursor-pointer border border-gray-700"
            onClick={() => setSelectedTool(tool)}
          >
            {/* Tool Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{tool.icon}</div>
                <div>
                  <h3 className="font-bold text-lg">{tool.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[tool.category]}`}>
                      {tool.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[tool.status]}`}>
                      {tool.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4">{tool.description}</p>

            {/* Capabilities */}
            <div className="space-y-2">
              <div className="text-xs text-gray-400 font-semibold">Key Capabilities:</div>
              <ul className="space-y-1">
                {tool.capabilities.slice(0, 3).map((cap, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
                {tool.capabilities.length > 3 && (
                  <li className="text-xs text-blue-400">
                    +{tool.capabilities.length - 3} more capabilities
                  </li>
                )}
              </ul>
            </div>

            {/* Usage */}
            <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Usage:</div>
              <code className="text-xs text-green-400 font-mono">{tool.usage}</code>
            </div>

            {/* Quick Links */}
            <div className="mt-4 flex gap-2">
              {tool.deployedUrl && (
                <a
                  href={tool.deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  🌐 Live
                </a>
              )}
              {tool.documentation && (
                <span className="text-xs text-purple-400">📚 Docs</span>
              )}
              {tool.location && (
                <span className="text-xs text-gray-500">📁 {tool.location.split('/').pop()}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tool Detail Modal */}
      {selectedTool && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedTool(null)}
        >
          <div
            className="bg-gray-800 rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{selectedTool.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedTool.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-3 py-1 rounded-full border ${categoryColors[selectedTool.category]}`}>
                      {selectedTool.category}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColors[selectedTool.status]}`}>
                      {selectedTool.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTool(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-300">{selectedTool.description}</p>
            </div>

            {/* Capabilities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Capabilities</h3>
              <ul className="space-y-2">
                {selectedTool.capabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Usage */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Usage</h3>
              <div className="p-4 bg-gray-900 rounded border border-gray-700">
                <code className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {selectedTool.usage}
                </code>
              </div>
            </div>

            {/* Location */}
            {selectedTool.location && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                <div className="p-4 bg-gray-900 rounded border border-gray-700">
                  <code className="text-sm text-purple-400 font-mono">
                    {selectedTool.location}
                  </code>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex gap-3">
              {selectedTool.deployedUrl && (
                <a
                  href={selectedTool.deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                >
                  🌐 Open Live URL
                </a>
              )}
              {selectedTool.documentation && (
                <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition">
                  📚 View Documentation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
