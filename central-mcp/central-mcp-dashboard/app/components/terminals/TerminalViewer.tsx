'use client';

import { useEffect, useRef, useState } from 'react';

interface TerminalSession {
  id: string;
  name: string;
  port: number;
  description: string;
  agentLetter?: string;
}

const terminalSessions: TerminalSession[] = [
  { id: 'agent-a', name: 'Agent A (Coordinator)', port: 9001, description: 'Claude Sonnet 4.5 - Primary Coordinator', agentLetter: 'A' },
  { id: 'agent-b', name: 'Agent B (Architecture)', port: 9002, description: 'Claude Sonnet 4.5 - Architecture & Design', agentLetter: 'B' },
  { id: 'agent-c', name: 'Agent C (Backend)', port: 9003, description: 'GLM 4.6 - Backend Specialist', agentLetter: 'C' },
  { id: 'agent-d', name: 'Agent D (UI)', port: 9004, description: 'GLM 4.6 - UI Specialist', agentLetter: 'D' },
  { id: 'system', name: 'System Monitor', port: 9000, description: 'Central-MCP System Logs' }
];

export default function TerminalViewer() {
  const [activeTerminal, setActiveTerminal] = useState<string>('agent-a');
  const [terminalStatus, setTerminalStatus] = useState<Record<string, 'connected' | 'disconnected' | 'connecting'>>({});

  useEffect(() => {
    // Check terminal connection status
    const checkStatus = async () => {
      const status: Record<string, 'connected' | 'disconnected' | 'connecting'> = {};

      for (const terminal of terminalSessions) {
        try {
          const response = await fetch(`http://34.41.115.199:${terminal.port}/`, { method: 'HEAD' });
          status[terminal.id] = response.ok ? 'connected' : 'disconnected';
        } catch {
          status[terminal.id] = 'disconnected';
        }
      }

      setTerminalStatus(status);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'bg-color-success';
      case 'connecting': return 'bg-color-warning';
      case 'disconnected': return 'bg-color-error';
      default: return 'bg-scaffold-2';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'connected': return 'Active';
      case 'connecting': return 'Connecting';
      case 'disconnected': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-full bg-scaffold-0 rounded-lg border border-border-subtle">
      {/* Terminal Tabs */}
      <div className="flex items-center gap-2 p-2 bg-scaffold-1 border-b border-border-subtle overflow-x-auto">
        {terminalSessions.map(terminal => (
          <button
            key={terminal.id}
            onClick={() => setActiveTerminal(terminal.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
              ${activeTerminal === terminal.id
                ? 'bg-accent-primary text-white'
                : 'bg-scaffold-0 text-text-secondary hover:bg-scaffold-2 hover:text-text-primary'
              }
            `}
          >
            {/* Status Indicator */}
            <div className={`w-2 h-2 rounded-full ${getStatusColor(terminalStatus[terminal.id])}`} />

            {/* Terminal Name */}
            <span>{terminal.name}</span>

            {/* Agent Letter Badge */}
            {terminal.agentLetter && (
              <span className="px-1.5 py-0.5 bg-scaffold-2 rounded text-xs font-mono">
                {terminal.agentLetter}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Terminal Display Area */}
      <div className="flex-1 p-4">
        {terminalSessions.map(terminal => (
          <div
            key={terminal.id}
            className={`h-full ${activeTerminal === terminal.id ? 'block' : 'hidden'}`}
          >
            {/* Terminal Header */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{terminal.name}</h3>
                <p className="text-sm text-text-tertiary">{terminal.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">Port {terminal.port}</span>
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${terminalStatus[terminal.id] === 'connected'
                    ? 'bg-color-success/20 text-color-success'
                    : 'bg-color-error/20 text-color-error'
                  }
                `}>
                  {getStatusText(terminalStatus[terminal.id])}
                </span>
              </div>
            </div>

            {/* Terminal Frame */}
            {terminalStatus[terminal.id] === 'connected' ? (
              <iframe
                src={`http://34.41.115.199:${terminal.port}/`}
                className="w-full h-[calc(100%-4rem)] bg-black rounded-lg border border-border-subtle"
                title={terminal.name}
              />
            ) : terminalStatus[terminal.id] === 'connecting' ? (
              <div className="w-full h-[calc(100%-4rem)] bg-scaffold-1 rounded-lg border border-border-subtle flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
                  <p className="text-text-secondary">Connecting to terminal...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-[calc(100%-4rem)] bg-scaffold-1 rounded-lg border border-border-subtle flex items-center justify-center">
                <div className="text-center max-w-md p-6">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h4 className="text-lg font-semibold text-text-primary mb-2">Terminal Offline</h4>
                  <p className="text-sm text-text-secondary mb-4">
                    This terminal session is not currently running on the VM.
                  </p>
                  <div className="text-xs text-text-tertiary bg-scaffold-2 p-3 rounded font-mono text-left">
                    <div className="mb-2 text-text-secondary font-sans font-medium">To start this terminal:</div>
                    # SSH to VM<br />
                    gcloud compute ssh central-mcp-server --zone=us-central1-a<br />
                    <br />
                    # Start terminal session<br />
                    ./start-terminal-{terminal.id}.sh
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-scaffold-1 border-t border-border-subtle">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <div className="flex items-center gap-4">
            <span>VM: 34.41.115.199</span>
            <span>•</span>
            <span>Sessions: {terminalSessions.length}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Active: <span className="font-mono text-accent-primary">{Object.values(terminalStatus).filter(s => s === 'connected').length}/{terminalSessions.length}</span>
            </span>
          </div>
          <div className="text-text-secondary">
            Press <kbd className="px-1.5 py-0.5 bg-scaffold-2 rounded font-mono text-xs">Ctrl+6</kbd> to access terminals
          </div>
        </div>
      </div>
    </div>
  );
}
