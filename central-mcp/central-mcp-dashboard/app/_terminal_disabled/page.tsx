'use client';

import { useState } from 'react';
import { Terminal } from '@/components/Terminal';

export default function TerminalPage() {
  const [terminals, setTerminals] = useState<Array<{
    id: string;
    type: 'shell' | 'claude-code';
    projectPath?: string;
  }>>([]);

  const addTerminal = (type: 'shell' | 'claude-code', projectPath?: string) => {
    const id = `term-${Date.now()}`;
    setTerminals(prev => [...prev, { id, type, projectPath }]);
  };

  const removeTerminal = (id: string) => {
    setTerminals(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Terminal Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={() => addTerminal('shell')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + New Shell
          </button>
          <button
            onClick={() => addTerminal('claude-code', '~/agent-workspace/central-mcp')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            🤖 Launch Claude Code
          </button>
        </div>
      </div>

      {/* Terminals Grid */}
      <div className="flex-1 overflow-auto p-4">
        {terminals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-2">No terminals open</p>
              <p className="text-sm">Click "New Shell" or "Launch Claude Code" to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {terminals.map(terminal => (
              <div key={terminal.id} className="relative h-[37.5rem] bg-[#1e1e1e] rounded-lg overflow-hidden shadow-xl">
                <button
                  onClick={() => removeTerminal(terminal.id)}
                  className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  Close
                </button>
                <Terminal
                  type={terminal.type}
                  projectPath={terminal.projectPath}
                  onSessionCreated={(sessionId) => console.log('Session created:', sessionId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>💡 Tip: Use Ctrl+C to interrupt, Ctrl+D to exit</span>
          <span className="text-gray-600">|</span>
          <span>Active terminals: {terminals.length}</span>
        </div>
      </div>
    </div>
  );
}
