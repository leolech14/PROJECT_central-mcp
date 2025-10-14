import AtomicSystemsWidget from '../components/AtomicSystemsWidget';

export const metadata = {
  title: 'Atomic Infrastructure Systems | Central-MCP',
  description: 'Complete atomic entities infrastructure status and monitoring'
};

export default function AtomicSystemsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Atomic Infrastructure Systems
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            13 complete atomic systems powering Central-MCP's commercial app generation platform
          </p>
        </div>

        {/* Main Widget */}
        <AtomicSystemsWidget />

        {/* System Architecture Diagram */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            System Architecture
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 font-mono text-sm">
            <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────┐
│  USER MESSAGE (Vision/Truth)                                 │
│  "I want to track my mineral collection..."                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  SPEC GENERATION (Specifications Registry)                   │
│  → Extract vision from message                               │
│  → Create spec with partial information                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  GAP DETECTION (User Interview Pipeline)                     │
│  → Scan against 10 universal dimensions                      │
│  → Identify gaps automatically                               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  INTELLIGENT INTERVIEW (User Interview Pipeline)             │
│  → Ask minimal strategic questions                           │
│  → Resolve maximum gaps                                      │
│  → Complete spec to 95%                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  TASK BREAKDOWN (Task Anatomy System)                        │
│  → Break into granular tasks                                 │
│  → Each task answers 7 questions                             │
│  → Vision connection preserved                               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  CODE GENERATION (Specbase-to-Codebase Pipeline)            │
│  → Use templates & snippets                                  │
│  → Generate complete codebase                                │
│  → Follow predetermined workflows                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT EXTRACTION (Codebase Ingestion Pipeline)           │
│  → Extract deployable product                                │
│  → Clean and consolidate                                     │
│  → Production-ready artifact                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  VALIDATION & DEPLOYMENT                                     │
│  → Validate against success criteria                         │
│  → Deploy to production                                      │
│  → PURPOSE FULFILLED ✅                                     │
└─────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>

        {/* The Vision */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">The Central-MCP Vision</h2>
          <p className="text-xl mb-4">
            "Minimum specification → Full commercial application with legal income stream"
          </p>
          <p className="text-lg opacity-90">
            From 5 sentences → Complete production-ready application through automated workflows and intelligent orchestration.
          </p>
        </div>
      </div>
    </div>
  );
}
