'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalProps {
  sessionId?: string;
  type?: 'shell' | 'claude-code';
  projectPath?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export function Terminal({ sessionId: initialSessionId, type = 'shell', projectPath, onSessionCreated }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          cols: xterm.cols,
          rows: xterm.rows,
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    // Create or connect to session
    const setupSession = async () => {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        // Create new session
        const response = await fetch('/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, projectPath }),
        });
        const data = await response.json();
        currentSessionId = data.id;
        setSessionId(currentSessionId);
        if (currentSessionId && onSessionCreated) {
          onSessionCreated(currentSessionId);
        }
      }

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/terminal/${currentSessionId}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        xterm.writeln('\x1b[1;32m✓ Terminal connected\x1b[0m');

        // Send initial size
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
          setStatus('disconnected');
          xterm.writeln('\r\n\x1b[1;31m✗ Terminal session ended\x1b[0m');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('disconnected');
        xterm.writeln('\r\n\x1b[1;31m✗ Connection error\x1b[0m');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        xterm.writeln('\r\n\x1b[1;33m⚠ Connection closed\x1b[0m');
      };

      // Handle input from user
      xterm.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });
    };

    setupSession();

    return () => {
      window.removeEventListener('resize', handleResize);
      wsRef.current?.close();
      xtermRef.current?.dispose();
    };
  }, [sessionId, type, projectPath]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-500' :
            status === 'connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          <span className="text-sm text-gray-400">
            {type === 'claude-code' ? '🤖 Claude Code' : '💻 Shell'}
            {projectPath && ` • ${projectPath.split('/').pop()}`}
          </span>
        </div>
        <span className="text-xs text-gray-500">{sessionId}</span>
      </div>
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
}
