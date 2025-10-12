'use client';

import { useState } from 'react';

interface QuickLaunchProps {
  onLaunch: (projectPath: string, agent: string) => void;
}

export default function QuickLaunch({ onLaunch }: QuickLaunchProps) {
  const [isOpen, setIsOpen] = useState(false);

  const projects = [
    {
      name: 'Central-MCP',
      path: '~/agent-workspace/central-mcp',
      agent: 'A',
      color: 'bg-scaffold-3',
      description: 'Core orchestration system'
    },
    {
      name: 'LocalBrain',
      path: '~/agent-workspace/LocalBrain',
      agent: 'B',
      color: 'bg-scaffold-3',
      description: 'Knowledge management'
    },
    {
      name: 'ProfilePro',
      path: '~/agent-workspace/profilepro',
      agent: 'C',
      color: 'bg-scaffold-3',
      description: 'Profile analytics'
    },
    {
      name: 'YTPipe',
      path: '~/agent-workspace/ytpipe',
      agent: 'D',
      color: 'bg-scaffold-3',
      description: 'Video processing'
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Launch Menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-4 bg-scaffold-1 border border-border-subtle rounded-xl shadow-2xl p-3 w-80">
          <div className="mb-3 px-2">
            <h3 className="text-sm font-semibold text-text-primary">🚀 Launch Agent</h3>
            <p className="text-xs text-text-tertiary">Start Claude Code in any project</p>
          </div>
          <div className="space-y-2">
            {projects.map(project => (
              <button
                key={project.name}
                onClick={() => {
                  onLaunch(project.path, project.agent);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-scaffold-2 transition-all group"
              >
                <div className={`w-10 h-10 ${project.color} border border-border-subtle rounded-lg flex items-center justify-center text-text-primary font-bold text-lg`}>
                  {project.agent}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-text-primary group-hover:text-text-secondary transition-colors">
                    {project.name}
                  </div>
                  <div className="text-xs text-text-tertiary">{project.description}</div>
                </div>
                <div className="text-lg text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg border border-border-subtle flex items-center justify-center
          transition-all duration-300 transform hover:scale-105
          ${isOpen
            ? 'bg-scaffold-2 hover:bg-scaffold-3 rotate-45'
            : 'bg-scaffold-1 hover:bg-scaffold-2'
          }
        `}
      >
        <span className="text-2xl">
          {isOpen ? '×' : '💻'}
        </span>
      </button>
    </div>
  );
}
