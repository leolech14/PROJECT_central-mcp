'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-scaffold-0 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-red-500/10 border border-red-500/50 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-[oklch(0.65_0.22_25)] mb-4">
          🚨 Dashboard Error
        </h1>
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 font-mono text-sm">
          <p className="text-red-400 font-bold mb-2">{error.name}</p>
          <p className="text-gray-300">{error.message}</p>
          {error.stack && (
            <pre className="text-xs text-gray-500 mt-4 overflow-auto max-h-64">
              {error.stack}
            </pre>
          )}
        </div>
        <button
          onClick={reset}
          className="px-6 py-3 bg-accent-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
