import { NextRequest } from 'next/server';
import { terminalManager } from '@/lib/terminal-manager';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  terminalManager.deleteSession(id);
  return Response.json({ success: true });
}
