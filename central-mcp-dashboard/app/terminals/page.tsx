'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for TerminalViewer
const DynamicTerminalViewer = dynamic(
  () => import('../components/terminals/TerminalViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-scaffold-0">
        <div className="text-text-secondary">Loading terminal...</div>
      </div>
    ),
  }
);

export default function TerminalsPage() {
  return (
    <div className="min-h-screen bg-scaffold-0 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">VM Terminal Sessions</h1>
        <p className="text-text-secondary">
          Live terminal access to Central-MCP Intelligence on VM (136.112.123.243)
        </p>
      </div>

      {/* Terminal Viewer */}
      <div className="h-[calc(100vh-12rem)]">
        <DynamicTerminalViewer />
      </div>
    </div>
  );
}
