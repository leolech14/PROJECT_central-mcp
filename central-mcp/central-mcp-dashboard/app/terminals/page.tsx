import TerminalViewer from '../components/terminals/TerminalViewer';

export default function TerminalsPage() {
  return (
    <div className="min-h-screen bg-scaffold-base p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">VM Terminal Sessions</h1>
        <p className="text-text-secondary">
          Live terminal access to AI agents running on Central-MCP VM (34.41.115.199)
        </p>
      </div>

      {/* Terminal Viewer */}
      <div className="h-[calc(100vh-12rem)]">
        <TerminalViewer />
      </div>
    </div>
  );
}
