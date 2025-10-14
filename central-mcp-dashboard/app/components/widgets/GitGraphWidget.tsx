'use client';

import { useState, useEffect, useRef } from 'react';

interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  parents: string[];
  branches: string[];
  tags: string[];
}

interface GitBranch {
  name: string;
  commit: string;
  color: string;
}

interface GitGraph {
  commits: GitCommit[];
  branches: GitBranch[];
  lastCommit: GitCommit | null;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  commit: GitCommit;
  branches: GitBranch[];
}

interface GraphEdge {
  from: string;
  to: string;
}

export default function GitGraphWidget() {
  const [graph, setGraph] = useState<GitGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCommit, setHoveredCommit] = useState<GitCommit | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchGitGraph();
    const interval = setInterval(fetchGitGraph, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchGitGraph = async () => {
    try {
      const res = await fetch('/api/git-history?limit=50');
      const data = await res.json();
      setGraph(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch git graph:', err);
      setLoading(false);
    }
  };

  const calculateLayout = (commits: GitCommit[]): { nodes: GraphNode[]; edges: GraphEdge[] } => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Create nodes with vertical layout (time-based)
    commits.forEach((commit, index) => {
      const branchesForCommit = graph?.branches.filter(b => b.commit === commit.hash) || [];

      // Determine column based on parent structure (simple approach)
      let column = 0;
      if (commit.parents.length > 0) {
        const parentNode = nodes.find(n => n.id === commit.parents[0]);
        if (parentNode) {
          column = parentNode.x;
          // If multiple parents (merge), offset slightly
          if (commit.parents.length > 1) {
            column += 50;
          }
        }
      }

      nodes.push({
        id: commit.hash,
        x: column,
        y: index * 60 + 40,
        commit,
        branches: branchesForCommit,
      });

      // Create edges to parents
      commit.parents.forEach(parentHash => {
        edges.push({
          from: commit.hash,
          to: parentHash,
        });
      });
    });

    return { nodes, edges };
  };

  if (loading) {
    return (
      <div className="bg-scaffold-1 border border-border-subtle rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">📊</div>
          <h3 className="text-lg font-bold text-text-primary">Git History</h3>
        </div>
        <div className="text-text-secondary animate-pulse">Loading git graph...</div>
      </div>
    );
  }

  if (!graph || !graph.commits || graph.commits.length === 0) {
    return (
      <div className="bg-scaffold-1 border border-border-subtle rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">📊</div>
          <h3 className="text-lg font-bold text-text-primary">Git History</h3>
        </div>
        <div className="text-text-secondary">No git history available</div>
      </div>
    );
  }

  const { nodes, edges } = calculateLayout(graph.commits);

  return (
    <div className="bg-scaffold-1 border border-border-subtle rounded-xl p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Git History</h3>
            <p className="text-xs text-text-tertiary">
              {graph.commits.length} commits • {graph.branches.length} branches
            </p>
          </div>
        </div>

        {graph.lastCommit && (
          <div className="text-right">
            <div className="text-xs text-text-tertiary">Last Commit</div>
            <div className="text-sm font-mono text-accent-primary">
              {graph.lastCommit.shortHash}
            </div>
          </div>
        )}
      </div>

      {/* Last Commit Info */}
      {graph.lastCommit && (
        <div className="mb-4 p-3 bg-scaffold-2 border border-border-subtle rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-xl">💬</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {graph.lastCommit.message}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                <span>{graph.lastCommit.author}</span>
                <span>•</span>
                <span>{new Date(graph.lastCommit.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branch Legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        {graph.branches.slice(0, 5).map(branch => (
          <div
            key={branch.name}
            className="flex items-center gap-2 px-2 py-1 bg-scaffold-2 border border-border-subtle rounded text-xs"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: branch.color }}
            />
            <span className="text-text-secondary truncate max-w-[100px]">
              {branch.name}
            </span>
          </div>
        ))}
        {graph.branches.length > 5 && (
          <div className="px-2 py-1 text-xs text-text-tertiary">
            +{graph.branches.length - 5} more
          </div>
        )}
      </div>

      {/* Git Graph SVG */}
      <div className="relative bg-scaffold-0 border border-border-subtle rounded-lg overflow-auto max-h-[500px]">
        <svg
          ref={svgRef}
          width="100%"
          height={Math.max(400, nodes.length * 60 + 80)}
          className="min-w-[600px]"
        >
          {/* Draw edges first */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <line
                key={idx}
                x1={fromNode.x + 200}
                y1={fromNode.y}
                x2={toNode.x + 200}
                y2={toNode.y}
                stroke="var(--border-default)"
                strokeWidth="2"
                opacity="0.5"
              />
            );
          })}

          {/* Draw nodes */}
          {nodes.map((node, idx) => {
            const branchColor = node.branches[0]?.color || 'var(--accent-primary)';

            return (
              <g
                key={node.id}
                onMouseEnter={(e) => {
                  setHoveredCommit(node.commit);
                  setTooltipPos({
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => setHoveredCommit(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Commit node */}
                <circle
                  cx={node.x + 200}
                  cy={node.y}
                  r="8"
                  fill={branchColor}
                  stroke="var(--scaffold-0)"
                  strokeWidth="2"
                />

                {/* Commit hash */}
                <text
                  x={node.x + 220}
                  y={node.y + 4}
                  fontSize="11"
                  fill="var(--text-secondary)"
                  fontFamily="monospace"
                >
                  {node.commit.shortHash}
                </text>

                {/* Commit message (truncated) */}
                <text
                  x={node.x + 280}
                  y={node.y + 4}
                  fontSize="10"
                  fill="var(--text-tertiary)"
                >
                  {node.commit.message.substring(0, 40)}
                  {node.commit.message.length > 40 ? '...' : ''}
                </text>

                {/* Branch labels */}
                {node.branches.map((branch, branchIdx) => (
                  <g key={branch.name}>
                    <rect
                      x={node.x + 220 + branchIdx * 80}
                      y={node.y - 20}
                      width="70"
                      height="16"
                      rx="8"
                      fill={branch.color}
                      opacity="0.9"
                    />
                    <text
                      x={node.x + 255 + branchIdx * 80}
                      y={node.y - 10}
                      fontSize="9"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {branch.name.split('/').pop()}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredCommit && (
        <div
          className="fixed z-50 bg-scaffold-2 border-2 border-accent-primary rounded-lg p-3 shadow-xl max-w-md"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
          }}
        >
          <div className="text-xs font-mono text-accent-primary mb-1">
            {hoveredCommit.shortHash}
          </div>
          <div className="text-sm font-medium text-text-primary mb-2">
            {hoveredCommit.message}
          </div>
          <div className="text-xs text-text-secondary space-y-1">
            <div>👤 {hoveredCommit.author}</div>
            <div>📅 {new Date(hoveredCommit.date).toLocaleString()}</div>
            {hoveredCommit.parents.length > 0 && (
              <div>
                🔗 Parents: {hoveredCommit.parents.map(p => p.substring(0, 7)).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
