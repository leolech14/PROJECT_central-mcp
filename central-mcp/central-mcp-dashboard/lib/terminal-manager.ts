import { spawn } from 'node-pty';
import { WebSocket } from 'ws';

export interface TerminalSession {
  id: string;
  pty: any;
  clients: Set<WebSocket>;
  createdAt: Date;
  type: 'shell' | 'claude-code';
  projectPath?: string;
}

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>();

  createSession(options: {
    id: string;
    type: 'shell' | 'claude-code';
    projectPath?: string;
    cwd?: string;
  }): TerminalSession {
    const { id, type, projectPath, cwd = process.env.HOME } = options;

    // Spawn terminal process
    const pty = spawn(process.env.SHELL || 'bash', [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: projectPath || cwd,
      env: process.env as any,
    });

    const session: TerminalSession = {
      id,
      pty,
      clients: new Set(),
      createdAt: new Date(),
      type,
      projectPath,
    };

    this.sessions.set(id, session);

    // If it's a claude-code session, auto-start it
    if (type === 'claude-code') {
      setTimeout(() => {
        pty.write('claude-code\r');
      }, 500);
    }

    return session;
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  deleteSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.pty.kill();
      session.clients.forEach(client => client.close());
      this.sessions.delete(id);
    }
  }

  attachClient(sessionId: string, ws: WebSocket): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.clients.add(ws);

    // Send data from PTY to WebSocket
    session.pty.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    // Handle PTY exit
    session.pty.onExit(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit' }));
      }
      this.deleteSession(sessionId);
    });

    // Send input from WebSocket to PTY
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'input') {
          session.pty.write(data.data);
        } else if (data.type === 'resize') {
          session.pty.resize(data.cols, data.rows);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    ws.on('close', () => {
      session.clients.delete(ws);
      // If no more clients, optionally keep session alive or kill it
      if (session.clients.size === 0) {
        // Keep alive for 5 minutes
        setTimeout(() => {
          if (session.clients.size === 0) {
            this.deleteSession(sessionId);
          }
        }, 5 * 60 * 1000);
      }
    });
  }

  listSessions(): Array<{
    id: string;
    type: string;
    projectPath?: string;
    clients: number;
    createdAt: Date;
  }> {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      type: session.type,
      projectPath: session.projectPath,
      clients: session.clients.size,
      createdAt: session.createdAt,
    }));
  }
}

// Singleton instance
export const terminalManager = new TerminalManager();
