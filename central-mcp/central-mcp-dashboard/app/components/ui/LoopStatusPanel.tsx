'use client';

import { useState } from 'react';

/**
 * Loop Status Interface
 * Represents a single auto-proactive loop's state
 */
export interface LoopStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  executionCount: number;
  avgDuration: number; // in milliseconds
  lastRun?: Date;
  intervalSeconds: number;
  description?: string;
}

interface LoopStatusPanelProps {
  loops: LoopStatus[];
  className?: string;
  maxCollapsedItems?: number;
}

/**
 * LoopStatusPanel Component
 *
 * Displays auto-proactive loops (9 loops) with sophisticated visual indicators:
 * - Loop name, status (active/idle/error), execution count, avg duration
 * - Visual status indicators with OKLCH colors
 * - Expandable view for detailed metrics
 * - Smooth transitions and hover effects
 * - Mobile-first responsive design
 */
export function LoopStatusPanel({
  loops,
  className = '',
  maxCollapsedItems = 3
}: LoopStatusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleLoops = isExpanded ? loops : loops.slice(0, maxCollapsedItems);
  const hiddenCount = loops.length - maxCollapsedItems;

  // Calculate summary statistics
  const activeCount = loops.filter(l => l.status === 'active').length;
  const errorCount = loops.filter(l => l.status === 'error').length;
  const totalExecutions = loops.reduce((sum, l) => sum + l.executionCount, 0);

  return (
    <div className={`bg-scaffold-2 rounded-2xl border border-border-subtle overflow-hidden transition-all duration-300 hover:border-border-default ${className}`}>
      {/* Header */}
      <div className="bg-scaffold-1 px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Auto-Proactive Loops</h2>
            <p className="text-sm text-text-secondary mt-1">
              {activeCount}/{loops.length} active • {totalExecutions.toLocaleString()} total executions
            </p>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.65_0.18_145/0.1)]">
                <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.18_145)] animate-pulse" />
                <span className="text-sm font-medium text-[oklch(0.65_0.18_145)]">{activeCount} Active</span>
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.65_0.22_25/0.1)]">
                <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.22_25)]" />
                <span className="text-sm font-medium text-[oklch(0.65_0.22_25)]">{errorCount} Error</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loop List */}
      <div className="divide-y divide-border-subtle">
        {visibleLoops.map((loop, index) => (
          <LoopItem
            key={loop.id}
            loop={loop}
            isExpanded={isExpanded}
            index={index}
          />
        ))}
      </div>

      {/* Expand/Collapse Button */}
      {loops.length > maxCollapsedItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-3 bg-scaffold-1 hover:bg-scaffold-2 border-t border-border-subtle transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary group-hover:text-text-primary">
            <span>
              {isExpanded ? 'Show Less' : `Show ${hiddenCount} More Loop${hiddenCount !== 1 ? 's' : ''}`}
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}

/**
 * Individual Loop Item Component
 */
interface LoopItemProps {
  loop: LoopStatus;
  isExpanded: boolean;
  index: number;
}

function LoopItem({ loop, isExpanded, index }: LoopItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Status color mapping with OKLCH
  const statusConfig = {
    active: {
      color: 'oklch(0.65 0.18 145)', // Green
      bgColor: 'oklch(0.65 0.18 145 / 0.1)',
      label: 'Active',
      pulse: true
    },
    idle: {
      color: 'oklch(0.45 0.005 270)', // Gray
      bgColor: 'oklch(0.45 0.005 270 / 0.1)',
      label: 'Idle',
      pulse: false
    },
    error: {
      color: 'oklch(0.65 0.22 25)', // Red
      bgColor: 'oklch(0.65 0.22 25 / 0.1)',
      label: 'Error',
      pulse: false
    }
  };

  const config = statusConfig[loop.status];

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Format last run time
  const formatLastRun = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className="px-6 py-4 hover:bg-scaffold-1 transition-all duration-300 cursor-pointer group"
      onClick={() => setShowDetails(!showDetails)}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: isExpanded ? 'fadeIn 0.3s ease-out' : 'none'
      }}
    >
      <div className="flex items-start gap-4">
        {/* Status Indicator */}
        <div className="flex-shrink-0 mt-1">
          <div
            className={`w-3 h-3 rounded-full ${config.pulse ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: config.color }}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary mb-1 truncate">
                {loop.name}
              </h3>
              {loop.description && !showDetails && (
                <p className="text-xs text-text-tertiary truncate">
                  {loop.description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            <div
              className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: config.bgColor,
                color: config.color
              }}
            >
              {config.label}
            </div>
          </div>

          {/* Metrics Row */}
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loop.executionCount.toLocaleString()} runs</span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDuration(loop.avgDuration)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Every {loop.intervalSeconds}s</span>
            </div>
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div
              className="mt-3 pt-3 border-t border-border-subtle space-y-2 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {loop.description && (
                <div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {loop.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-scaffold-3 rounded-lg px-3 py-2">
                  <div className="text-xs text-text-tertiary mb-1">Last Run</div>
                  <div className="text-sm font-medium text-text-primary">
                    {formatLastRun(loop.lastRun)}
                  </div>
                </div>

                <div className="bg-scaffold-3 rounded-lg px-3 py-2">
                  <div className="text-xs text-text-tertiary mb-1">Avg Duration</div>
                  <div className="text-sm font-medium text-text-primary">
                    {formatDuration(loop.avgDuration)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expand Arrow */}
        <div className="flex-shrink-0 mt-1">
          <svg
            className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${showDetails ? 'rotate-180' : ''} group-hover:text-text-secondary`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
