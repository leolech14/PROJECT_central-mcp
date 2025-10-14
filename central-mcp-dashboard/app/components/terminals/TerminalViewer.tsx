'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalSession {
  id: string;
  name: string;
  type: 'shell' | 'claude-code';
  projectPath?: string;
  agentLetter?: string;
  description: string;
}

interface TerminalViewerProps {
  pendingLaunch?: { projectPath: string; agent: string } | null;
  onLaunchComplete?: () => void;
}

export default function TerminalViewer({ pendingLaunch = null, onLaunchComplete }: TerminalViewerProps) {
  const [terminals, setTerminals] = useState<TerminalSession[]>([]);
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);
  const terminalRefs = useRef<Map<string, { xterm: XTerm; ws: WebSocket; fitAddon: FitAddon }>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize a terminal
  const initializeTerminal = (sessionId: string, container: HTMLDivElement) => {
    if (terminalRefs.current.has(sessionId)) return;

    // Calculate responsive terminal font size based on viewport width
    const responsiveFontSize = Math.max(10, Math.min(16, window.innerWidth / 120));

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: responsiveFontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#d4d4d4',
        cursor: '#808080',
        selectionBackground: 'rgba(255, 255, 255, 0.2)',
        black: '#000000',
        red: '#cc6666',
        green: '#b5bd68',
        yellow: '#f0c674',
        blue: '#81a2be',
        magenta: '#b294bb',
        cyan: '#8abeb7',
        white: '#c5c8c6',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    xterm.open(container);
    fitAddon.fit();

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/terminal/${sessionId}/ws`);

    ws.onopen = () => {
      xterm.writeln('\x1b[90m✓ Terminal connected\x1b[0m\r\n');
      ws.send(JSON.stringify({
        type: 'resize',
        cols: xterm.cols,
        rows: xterm.rows,
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'output') {
        xterm.write(message.data);
      } else if (message.type === 'exit') {
        xterm.writeln('\r\n\x1b[90m✗ Terminal session ended\x1b[0m');
      }
    };

    ws.onerror = () => {
      xterm.writeln('\r\n\x1b[90m✗ Connection error\x1b[0m');
    };

    ws.onclose = () => {
      xterm.writeln('\r\n\x1b[90m⚠ Connection closed\x1b[0m');
    };

    xterm.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: xterm.cols,
          rows: xterm.rows,
        }));
      }
    };
    window.addEventListener('resize', handleResize);

    terminalRefs.current.set(sessionId, { xterm, ws, fitAddon });
  };

  // Create new terminal session
  const createTerminal = async (type: 'shell' | 'claude-code', projectPath?: string, agentLetter?: string) => {
    const response = await fetch('/api/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, projectPath }),
    });
    const data = await response.json();

    const terminal: TerminalSession = {
      id: data.id,
      name: type === 'claude-code' ? `🤖 Agent ${agentLetter || '?'}` : '💻 Shell',
      type,
      projectPath,
      agentLetter,
      description: projectPath?.split('/').pop() || 'New terminal session',
    };

    setTerminals(prev => [...prev, terminal]);
    setActiveTerminal(data.id);
  };

  // Close terminal
  const closeTerminal = async (sessionId: string) => {
    const refs = terminalRefs.current.get(sessionId);
    if (refs) {
      refs.ws.close();
      refs.xterm.dispose();
      terminalRefs.current.delete(sessionId);
    }

    await fetch(`/api/terminal/${sessionId}`, { method: 'DELETE' });
    setTerminals(prev => prev.filter(t => t.id !== sessionId));

    if (activeTerminal === sessionId) {
      setActiveTerminal(terminals.length > 1 ? terminals[0].id : null);
    }
  };

  // Handle pending launch from QuickLaunch
  useEffect(() => {
    if (pendingLaunch) {
      createTerminal('claude-code', pendingLaunch.projectPath, pendingLaunch.agent);
      onLaunchComplete?.();
    }
  }, [pendingLaunch]);

  // Launch agent quick actions
  const projects = [
    { name: 'central-mcp', path: '~/agent-workspace/central-mcp', agent: 'A' },
    { name: 'LocalBrain', path: '~/agent-workspace/LocalBrain', agent: 'B' },
    { name: 'profilepro', path: '~/agent-workspace/profilepro', agent: 'C' },
    { name: 'ytpipe', path: '~/agent-workspace/ytpipe', agent: 'D' },
  ];

  return (
    <div className="flex flex-col h-full bg-scaffold-0 rounded-lg border border-border-subtle">
      {/* Header with Launch Buttons */}
      <div className="flex items-center justify-between p-3 bg-scaffold-1 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Terminal Sessions</h3>
          <span className="text-xs text-text-tertiary">({terminals.length} active)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => createTerminal('shell')}
            className="px-3 py-1.5 bg-scaffold-2 hover:bg-scaffold-3 border border-border-subtle text-text-primary text-sm rounded transition-colors"
          >
            + Shell
          </button>
          <div className="relative group">
            <button className="px-3 py-1.5 bg-scaffold-2 hover:bg-scaffold-3 border border-border-subtle text-text-primary text-sm rounded transition-colors">
              💻 Launch Agent
            </button>
            <div className="absolute top-full right-0 mt-1 bg-scaffold-2 border border-border-subtle rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[15rem]">
              {projects.map(project => (
                <button
                  key={project.name}
                  onClick={() => createTerminal('claude-code', project.path, project.agent)}
                  className="w-full px-4 py-2.5 text-left hover:bg-scaffold-3 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-text-primary">{project.name}</div>
                    <div className="text-xs text-text-tertiary">{project.path}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-scaffold-3 border border-border-subtle text-text-secondary text-xs font-mono rounded">
                    Agent {project.agent}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Tabs */}
      {terminals.length > 0 && (
        <div className="flex items-center gap-1 p-2 bg-scaffold-1 border-b border-border-subtle overflow-x-auto">
          {terminals.map(terminal => (
            <div
              key={terminal.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all
                ${activeTerminal === terminal.id
                  ? 'bg-scaffold-3 border border-border-subtle text-text-primary'
                  : 'bg-scaffold-0 text-text-secondary hover:bg-scaffold-2'
                }
              `}
            >
              <button
                onClick={() => setActiveTerminal(terminal.id)}
                className="flex items-center gap-2"
              >
                <span>{terminal.name}</span>
                {terminal.agentLetter && (
                  <span className="px-1.5 py-0.5 bg-scaffold-2 border border-border-subtle rounded text-xs font-mono text-text-tertiary">
                    {terminal.agentLetter}
                  </span>
                )}
              </button>
              <button
                onClick={() => closeTerminal(terminal.id)}
                className="ml-1 text-text-tertiary hover:text-text-secondary transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Terminal Display */}
      <div className="flex-1 relative bg-[#1a1a1a]">
        {terminals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-tertiary">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💻</div>
              <p className="text-lg mb-2">No terminals open</p>
              <p className="text-sm text-text-secondary">
                Click "+ Shell" or "🤖 Launch Agent" to start a terminal session
              </p>
            </div>
          </div>
        ) : (
          terminals.map(terminal => (
            <div
              key={terminal.id}
              ref={el => {
                if (el && !containerRefs.current.has(terminal.id)) {
                  containerRefs.current.set(terminal.id, el);
                  initializeTerminal(terminal.id, el);
                }
              }}
              className={`absolute inset-0 p-2 ${activeTerminal === terminal.id ? 'block' : 'hidden'}`}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-scaffold-1 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
        <span>💡 Use Ctrl+C to interrupt • Ctrl+D to exit</span>
        <span>Local WebSocket terminals (no SSH needed)</span>
      </div>
    </div>
  );
}
