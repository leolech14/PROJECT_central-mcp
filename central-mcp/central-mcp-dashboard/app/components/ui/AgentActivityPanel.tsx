'use client';

import { useState } from 'react';

/**
 * Agent Interface
 * Represents an agent session in the system
 */
export interface Agent {
  id: string;
  letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  name: string;
  modelName: string;
  status: 'active' | 'idle' | 'disconnected';
  currentTask?: string;
  connectedAt: Date;
  lastActivity?: Date;
  tasksCompleted?: number;
  projectId?: string;
}

interface AgentActivityPanelProps {
  agents: Agent[];
  className?: string;
  maxCollapsedItems?: number;
}

/**
 * AgentActivityPanel Component
 *
 * Displays agent sessions with sophisticated visual design:
 * - Agent letter badges (A-F) with unique OKLCH accent colors
 * - Model name, status, current task
 * - Connection time and activity tracking
 * - Expandable view for full agent list
 * - Smooth transitions and hover effects
 * - Mobile-first responsive design
 */
export function AgentActivityPanel({
  agents,
  className = '',
  maxCollapsedItems = 4
}: AgentActivityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleAgents = isExpanded ? agents : agents.slice(0, maxCollapsedItems);
  const hiddenCount = agents.length - maxCollapsedItems;

  // Calculate summary statistics
  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalTasksCompleted = agents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0);

  return (
    <div className={`bg-scaffold-2 rounded-2xl border border-border-subtle overflow-hidden transition-all duration-300 hover:border-border-default ${className}`}>
      {/* Header */}
      <div className="bg-scaffold-1 px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Agent Activity</h2>
            <p className="text-sm text-text-secondary mt-1">
              {activeCount}/{agents.length} active • {totalTasksCompleted} tasks completed
            </p>
          </div>

          {/* Active Agent Badges */}
          <div className="flex items-center gap-1">
            {agents.filter(a => a.status === 'active').slice(0, 4).map(agent => (
              <AgentBadge key={agent.id} letter={agent.letter} size="small" status={agent.status} />
            ))}
            {activeCount > 4 && (
              <div className="w-8 h-8 rounded-lg bg-scaffold-3 flex items-center justify-center text-xs font-medium text-text-secondary">
                +{activeCount - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="divide-y divide-border-subtle">
        {visibleAgents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-scaffold-3 mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary">No agents connected</p>
            <p className="text-xs text-text-tertiary mt-1">Agents will appear here when they connect</p>
          </div>
        ) : (
          visibleAgents.map((agent, index) => (
            <AgentItem
              key={agent.id}
              agent={agent}
              isExpanded={isExpanded}
              index={index}
            />
          ))
        )}
      </div>

      {/* Expand/Collapse Button */}
      {agents.length > maxCollapsedItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-3 bg-scaffold-1 hover:bg-scaffold-2 border-t border-border-subtle transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary group-hover:text-text-primary">
            <span>
              {isExpanded ? 'Show Less' : `Show ${hiddenCount} More Agent${hiddenCount !== 1 ? 's' : ''}`}
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
 * Agent Letter Badge Component
 * Each agent gets a unique OKLCH accent color
 */
interface AgentBadgeProps {
  letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  size?: 'small' | 'medium' | 'large';
  status?: 'active' | 'idle' | 'disconnected';
}

function AgentBadge({ letter, size = 'medium', status }: AgentBadgeProps) {
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base'
  };

  // Unique OKLCH colors for each agent letter
  const agentColors = {
    A: { bg: 'oklch(0.75 0.15 25 / 0.15)', text: 'oklch(0.75 0.20 25)', border: 'oklch(0.75 0.15 25 / 0.3)' }, // Red-Orange
    B: { bg: 'oklch(0.70 0.15 145 / 0.15)', text: 'oklch(0.65 0.18 145)', border: 'oklch(0.70 0.15 145 / 0.3)' }, // Green
    C: { bg: 'oklch(0.70 0.15 240 / 0.15)', text: 'oklch(0.65 0.20 240)', border: 'oklch(0.70 0.15 240 / 0.3)' }, // Blue
    D: { bg: 'oklch(0.70 0.15 280 / 0.15)', text: 'oklch(0.65 0.20 280)', border: 'oklch(0.70 0.15 280 / 0.3)' }, // Purple
    E: { bg: 'oklch(0.75 0.15 60 / 0.15)', text: 'oklch(0.75 0.20 60)', border: 'oklch(0.75 0.15 60 / 0.3)' }, // Yellow
    F: { bg: 'oklch(0.70 0.15 330 / 0.15)', text: 'oklch(0.65 0.20 330)', border: 'oklch(0.70 0.15 330 / 0.3)' } // Pink
  };

  const colors = agentColors[letter];

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg font-bold flex items-center justify-center border-2 transition-all duration-300 hover:scale-110 ${status === 'active' ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
    >
      {letter}
    </div>
  );
}

/**
 * Individual Agent Item Component
 */
interface AgentItemProps {
  agent: Agent;
  isExpanded: boolean;
  index: number;
}

function AgentItem({ agent, isExpanded, index }: AgentItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Status configuration
  const statusConfig = {
    active: {
      color: 'oklch(0.65 0.18 145)',
      bgColor: 'oklch(0.65 0.18 145 / 0.1)',
      label: 'Active',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    idle: {
      color: 'oklch(0.75 0.15 90)',
      bgColor: 'oklch(0.75 0.15 90 / 0.1)',
      label: 'Idle',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    disconnected: {
      color: 'oklch(0.45 0.005 270)',
      bgColor: 'oklch(0.45 0.005 270 / 0.1)',
      label: 'Disconnected',
      icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
    }
  };

  const config = statusConfig[agent.status];

  // Format connection time
  const formatConnectionTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return 'Just now';
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
        {/* Agent Badge */}
        <div className="flex-shrink-0">
          <AgentBadge letter={agent.letter} size="medium" status={agent.status} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Agent {agent.letter}: {agent.name}
              </h3>
              <p className="text-xs text-text-tertiary truncate">
                {agent.modelName}
              </p>
            </div>

            {/* Status Badge */}
            <div
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: config.bgColor,
                color: config.color
              }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
              </svg>
              {config.label}
            </div>
          </div>

          {/* Current Task */}
          {agent.currentTask && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-scaffold-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-tertiary mb-0.5">Current Task</div>
                  <div className="text-sm text-text-primary truncate">{agent.currentTask}</div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Row */}
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Connected {formatConnectionTime(agent.connectedAt)}</span>
            </div>

            {agent.tasksCompleted !== undefined && agent.tasksCompleted > 0 && (
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{agent.tasksCompleted} completed</span>
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div
              className="mt-3 pt-3 border-t border-border-subtle space-y-2 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-scaffold-3 rounded-lg px-3 py-2">
                  <div className="text-xs text-text-tertiary mb-1">Agent ID</div>
                  <div className="text-sm font-mono text-text-primary truncate" title={agent.id}>
                    {agent.id.slice(0, 8)}...
                  </div>
                </div>

                {agent.projectId && (
                  <div className="bg-scaffold-3 rounded-lg px-3 py-2">
                    <div className="text-xs text-text-tertiary mb-1">Project</div>
                    <div className="text-sm text-text-primary truncate" title={agent.projectId}>
                      {agent.projectId}
                    </div>
                  </div>
                )}

                {agent.lastActivity && (
                  <div className="bg-scaffold-3 rounded-lg px-3 py-2 col-span-2">
                    <div className="text-xs text-text-tertiary mb-1">Last Activity</div>
                    <div className="text-sm text-text-primary">
                      {agent.lastActivity.toLocaleString()}
                    </div>
                  </div>
                )}
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
