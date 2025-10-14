import { NextRequest } from 'next/server';
import { terminalManager } from '@/lib/terminal-manager';

export async function GET(request: NextRequest) {
  const sessions = terminalManager.listSessions();
  return Response.json(sessions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type = 'shell', projectPath } = body;

  const id = `term-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const session = terminalManager.createSession({
    id,
    type,
    projectPath,
  });

  return Response.json({
    id: session.id,
    type: session.type,
    projectPath: session.projectPath,
    wsUrl: `/api/terminal/${id}/ws`,
  });
}
