'use client';

import { useState } from 'react';

/**
 * Project Type Enum
 */
export type ProjectType =
  | 'COMMERCIAL_APP'
  | 'INFRASTRUCTURE'
  | 'KNOWLEDGE_SYSTEM'
  | 'EXPERIMENTAL'
  | 'TOOL'
  | 'OTHER';

/**
 * Project Interface
 */
export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  health: number; // 0-100
  blockers: number;
  tasksTotal: number;
  tasksCompleted: number;
  lastActivity?: Date;
  description?: string;
}

interface ProjectsOverviewProps {
  projects: Project[];
  className?: string;
  maxCollapsedItems?: number;
}

/**
 * ProjectsOverview Component
 *
 * Displays project summary with sophisticated visualization:
 * - Total projects count and health metrics
 * - Projects by type breakdown with OKLCH colors
 * - Health percentage and blockers overview
 * - Expandable list view with detailed project cards
 * - Smooth transitions and hover effects
 * - Mobile-first responsive design
 */
export function ProjectsOverview({
  projects,
  className = '',
  maxCollapsedItems = 5
}: ProjectsOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<ProjectType | 'ALL'>('ALL');

  // Calculate statistics
  const totalProjects = projects.length;
  const avgHealth = totalProjects > 0
    ? projects.reduce((sum, p) => sum + p.health, 0) / totalProjects
    : 0;
  const totalBlockers = projects.reduce((sum, p) => sum + p.blockers, 0);

  // Group projects by type
  const projectsByType = projects.reduce((acc, project) => {
    acc[project.type] = (acc[project.type] || 0) + 1;
    return acc;
  }, {} as Record<ProjectType, number>);

  // Filter projects
  const filteredProjects = selectedType === 'ALL'
    ? projects
    : projects.filter(p => p.type === selectedType);

  const visibleProjects = isExpanded
    ? filteredProjects
    : filteredProjects.slice(0, maxCollapsedItems);

  const hiddenCount = filteredProjects.length - maxCollapsedItems;

  // Project type colors with OKLCH
  const typeColors: Record<ProjectType, { color: string; bg: string; label: string }> = {
    COMMERCIAL_APP: {
      color: 'oklch(0.70 0.15 240)',
      bg: 'oklch(0.70 0.15 240 / 0.1)',
      label: 'Commercial App'
    },
    INFRASTRUCTURE: {
      color: 'oklch(0.65 0.20 280)',
      bg: 'oklch(0.65 0.20 280 / 0.1)',
      label: 'Infrastructure'
    },
    KNOWLEDGE_SYSTEM: {
      color: 'oklch(0.75 0.15 60)',
      bg: 'oklch(0.75 0.15 60 / 0.1)',
      label: 'Knowledge System'
    },
    EXPERIMENTAL: {
      color: 'oklch(0.70 0.15 330)',
      bg: 'oklch(0.70 0.15 330 / 0.1)',
      label: 'Experimental'
    },
    TOOL: {
      color: 'oklch(0.65 0.18 145)',
      bg: 'oklch(0.65 0.18 145 / 0.1)',
      label: 'Tool'
    },
    OTHER: {
      color: 'oklch(0.45 0.005 270)',
      bg: 'oklch(0.45 0.005 270 / 0.1)',
      label: 'Other'
    }
  };

  return (
    <div className={`bg-scaffold-2 rounded-2xl border border-border-subtle overflow-hidden transition-all duration-300 hover:border-border-default ${className}`}>
      {/* Header */}
      <div className="bg-scaffold-1 px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Projects Overview</h2>
            <p className="text-sm text-text-secondary mt-1">
              {totalProjects} total • {avgHealth.toFixed(0)}% avg health
              {totalBlockers > 0 && ` • ${totalBlockers} blocker${totalBlockers !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Health Ring */}
          <HealthRing health={avgHealth} size="small" />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              selectedType === 'ALL'
                ? 'bg-text-primary text-scaffold-1'
                : 'bg-scaffold-3 text-text-secondary hover:bg-scaffold-1'
            }`}
          >
            All ({totalProjects})
          </button>
          {Object.entries(projectsByType).map(([type, count]) => {
            const config = typeColors[type as ProjectType] || typeColors.OTHER;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type as ProjectType)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300`}
                style={{
                  backgroundColor: selectedType === type ? config.color : config.bg,
                  color: selectedType === type ? 'white' : config.color
                }}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects List or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-scaffold-3 mb-4">
            <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">No projects found</p>
          <p className="text-xs text-text-tertiary mt-1">
            {selectedType === 'ALL' ? 'No projects available' : `No ${typeColors[selectedType as ProjectType]?.label.toLowerCase()} projects`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {visibleProjects.map((project, index) => (
            <ProjectItem
              key={project.id}
              project={project}
              typeConfig={typeColors[project.type]}
              index={index}
              isExpanded={isExpanded}
            />
          ))}
        </div>
      )}

      {/* Expand/Collapse Button */}
      {filteredProjects.length > maxCollapsedItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-3 bg-scaffold-1 hover:bg-scaffold-2 border-t border-border-subtle transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary group-hover:text-text-primary">
            <span>
              {isExpanded ? 'Show Less' : `Show ${hiddenCount} More Project${hiddenCount !== 1 ? 's' : ''}`}
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
 * Individual Project Item Component
 */
interface ProjectItemProps {
  project: Project;
  typeConfig: { color: string; bg: string; label: string };
  index: number;
  isExpanded: boolean;
}

function ProjectItem({ project, typeConfig, index, isExpanded }: ProjectItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const completionRate = project.tasksTotal > 0
    ? (project.tasksCompleted / project.tasksTotal) * 100
    : 0;

  const healthColor =
    project.health >= 80 ? 'oklch(0.65 0.18 145)' : // Green
    project.health >= 60 ? 'oklch(0.75 0.15 90)' :  // Yellow
    'oklch(0.65 0.22 25)'; // Red

  const formatLastActivity = (date?: Date) => {
    if (!date) return 'No activity';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
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
        {/* Health Indicator */}
        <div className="flex-shrink-0 mt-1">
          <div className="relative w-10 h-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="oklch(0.20 0.005 270)"
                strokeWidth="4"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={healthColor}
                strokeWidth="4"
                strokeDasharray={`${project.health} 100`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: healthColor }}>
              {Math.round(project.health)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary mb-1 truncate">
                {project.name}
              </h3>
              {project.description && !showDetails && (
                <p className="text-xs text-text-tertiary truncate">
                  {project.description}
                </p>
              )}
            </div>

            {/* Type Badge */}
            <div
              className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: typeConfig.bg,
                color: typeConfig.color
              }}
            >
              {typeConfig.label}
            </div>
          </div>

          {/* Metrics Row */}
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            {project.tasksTotal > 0 && (
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{project.tasksCompleted}/{project.tasksTotal} tasks</span>
              </div>
            )}

            {project.blockers > 0 && (
              <div className="flex items-center gap-1.5 text-[oklch(0.65_0.22_25)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{project.blockers} blocker{project.blockers !== 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatLastActivity(project.lastActivity)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {project.tasksTotal > 0 && (
            <div className="mt-2 h-1.5 bg-scaffold-3 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${completionRate}%`,
                  backgroundColor: healthColor
                }}
              />
            </div>
          )}

          {/* Expanded Details */}
          {showDetails && (
            <div
              className="mt-3 pt-3 border-t border-border-subtle space-y-3 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {project.description && (
                <p className="text-xs text-text-secondary leading-relaxed">
                  {project.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-scaffold-3 rounded-lg px-3 py-2">
                  <div className="text-xs text-text-tertiary mb-1">Health Score</div>
                  <div className="text-lg font-bold" style={{ color: healthColor }}>
                    {project.health}%
                  </div>
                </div>

                <div className="bg-scaffold-3 rounded-lg px-3 py-2">
                  <div className="text-xs text-text-tertiary mb-1">Completion</div>
                  <div className="text-lg font-bold text-text-primary">
                    {completionRate.toFixed(0)}%
                  </div>
                </div>

                {project.lastActivity && (
                  <div className="bg-scaffold-3 rounded-lg px-3 py-2 col-span-2">
                    <div className="text-xs text-text-tertiary mb-1">Last Activity</div>
                    <div className="text-sm text-text-primary">
                      {project.lastActivity.toLocaleString()}
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

/**
 * Health Ring Component
 */
interface HealthRingProps {
  health: number;
  size?: 'small' | 'medium' | 'large';
}

function HealthRing({ health, size = 'medium' }: HealthRingProps) {
  const sizeClasses = {
    small: { container: 'w-12 h-12', text: 'text-xs' },
    medium: { container: 'w-16 h-16', text: 'text-sm' },
    large: { container: 'w-20 h-20', text: 'text-base' }
  };

  const healthColor =
    health >= 80 ? 'oklch(0.65 0.18 145)' : // Green
    health >= 60 ? 'oklch(0.75 0.15 90)' :  // Yellow
    'oklch(0.65 0.22 25)'; // Red

  const { container, text } = sizeClasses[size];

  return (
    <div className={`relative ${container}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="40%"
          fill="none"
          stroke="oklch(0.20 0.005 270)"
          strokeWidth="8"
        />
        <circle
          cx="50%"
          cy="50%"
          r="40%"
          fill="none"
          stroke={healthColor}
          strokeWidth="8"
          strokeDasharray={`${health * 2.51} 251`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${text}`} style={{ color: healthColor }}>
          {Math.round(health)}%
        </span>
      </div>
    </div>
  );
}
