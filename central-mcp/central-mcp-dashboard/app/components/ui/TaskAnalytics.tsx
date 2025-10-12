'use client';

import { useState, useEffect } from 'react';

/**
 * Task Statistics Interface
 */
export interface TaskStats {
  pending: number;
  inProgress: number;
  completed: number;
  blocked: number;
  total: number;
  completionRate: number; // 0-100
  velocity: number; // tasks per day
  avgCompletionTime?: number; // in hours
}

interface TaskAnalyticsProps {
  stats: TaskStats;
  className?: string;
}

/**
 * TaskAnalytics Component
 *
 * Displays task metrics with sophisticated visualization:
 * - Animated pie chart showing task distribution
 * - Completion rate and velocity metrics
 * - Expandable view with detailed task breakdown
 * - OKLCH colors for each status (pending/in-progress/completed/blocked)
 * - Smooth transitions and hover effects
 * - Mobile-first responsive design
 */
export function TaskAnalytics({ stats, className = '' }: TaskAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    blocked: 0,
    completionRate: 0
  });

  // Animate values on mount and when stats change
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedValues({
        pending: Math.round(stats.pending * progress),
        inProgress: Math.round(stats.inProgress * progress),
        completed: Math.round(stats.completed * progress),
        blocked: Math.round(stats.blocked * progress),
        completionRate: stats.completionRate * progress
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedValues({
          pending: stats.pending,
          inProgress: stats.inProgress,
          completed: stats.completed,
          blocked: stats.blocked,
          completionRate: stats.completionRate
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats]);

  // Status colors with OKLCH
  const statusColors = {
    pending: { color: 'oklch(0.75 0.15 90)', label: 'Pending' }, // Yellow
    inProgress: { color: 'oklch(0.70 0.15 240)', label: 'In Progress' }, // Blue
    completed: { color: 'oklch(0.65 0.18 145)', label: 'Completed' }, // Green
    blocked: { color: 'oklch(0.65 0.22 25)', label: 'Blocked' } // Red
  };

  const taskData = [
    { type: 'pending', count: animatedValues.pending, ...statusColors.pending },
    { type: 'inProgress', count: animatedValues.inProgress, ...statusColors.inProgress },
    { type: 'completed', count: animatedValues.completed, ...statusColors.completed },
    { type: 'blocked', count: animatedValues.blocked, ...statusColors.blocked }
  ];

  return (
    <div className={`bg-scaffold-2 rounded-2xl border border-border-subtle overflow-hidden transition-all duration-300 hover:border-border-default ${className}`}>
      {/* Header */}
      <div className="bg-scaffold-1 px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Task Analytics</h2>
            <p className="text-sm text-text-secondary mt-1">
              {stats.total} total tasks • {stats.velocity.toFixed(1)} tasks/day velocity
            </p>
          </div>

          {/* Completion Rate Badge */}
          <div className="flex items-center gap-2">
            <div
              className="px-3 py-1.5 rounded-lg font-medium text-sm"
              style={{
                backgroundColor: `oklch(0.65 0.18 145 / 0.1)`,
                color: 'oklch(0.65 0.18 145)'
              }}
            >
              {animatedValues.completionRate.toFixed(0)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <PieChart data={taskData} total={stats.total} />
          </div>

          {/* Task Breakdown */}
          <div className="space-y-3">
            {taskData.map((item, index) => (
              <TaskStatusBar
                key={item.type}
                label={item.label}
                count={item.count}
                total={stats.total}
                color={item.color}
                delay={index * 100}
              />
            ))}
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-border-subtle space-y-4 animate-fadeIn">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="Completion Rate"
                value={`${stats.completionRate.toFixed(1)}%`}
                icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                color="oklch(0.65 0.18 145)"
              />
              <MetricCard
                label="Velocity"
                value={`${stats.velocity.toFixed(1)}/day`}
                icon="M13 10V3L4 14h7v7l9-11h-7z"
                color="oklch(0.70 0.15 240)"
              />
              {stats.avgCompletionTime && (
                <MetricCard
                  label="Avg Completion"
                  value={`${stats.avgCompletionTime.toFixed(1)}h`}
                  icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  color="oklch(0.75 0.15 90)"
                />
              )}
            </div>

            {/* Status Percentages */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {taskData.map(item => (
                <div key={item.type} className="bg-scaffold-3 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="text-xs text-text-tertiary">{item.label}</div>
                  </div>
                  <div className="text-lg font-bold text-text-primary">
                    {stats.total > 0 ? ((item.count / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 px-4 py-2 bg-scaffold-1 hover:bg-scaffold-3 rounded-lg transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary group-hover:text-text-primary">
            <span>{isExpanded ? 'Show Less' : 'Show Detailed Metrics'}</span>
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
      </div>
    </div>
  );
}

/**
 * Pie Chart Component with SVG animation
 */
interface PieChartProps {
  data: Array<{ count: number; color: string; label: string }>;
  total: number;
}

function PieChart({ data, total }: PieChartProps) {
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const strokeWidth = 40;

  // Calculate pie segments
  let currentAngle = -90; // Start at top
  const segments = data.map(item => {
    const percentage = total > 0 ? (item.count / total) : 0;
    const angle = percentage * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle
    };
    currentAngle += angle;
    return segment;
  });

  // Create SVG path for each segment
  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + (r * Math.cos(rad)),
      y: cy + (r * Math.sin(rad))
    };
  };

  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-48 h-48">
        <div className="text-center">
          <div className="text-4xl font-bold text-text-tertiary mb-2">0</div>
          <div className="text-sm text-text-tertiary">No tasks</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-48 h-48">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="oklch(0.20 0.005 270)"
          strokeWidth={strokeWidth}
        />

        {/* Pie segments */}
        {segments.map((segment, index) => (
          segment.percentage > 0 && (
            <path
              key={segment.label}
              d={createArc(segment.startAngle, segment.endAngle)}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{
                strokeDasharray: `${segment.percentage * 2 * Math.PI * radius} ${2 * Math.PI * radius}`,
                animation: `drawPie 1s ease-out ${index * 0.1}s forwards`
              }}
            />
          )
        ))}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-text-primary">{total}</div>
          <div className="text-sm text-text-secondary">Tasks</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Task Status Bar Component
 */
interface TaskStatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  delay?: number;
}

function TaskStatusBar({ label, count, total, color, delay = 0 }: TaskStatusBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-text-primary">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{count}</span>
      </div>

      <div className="h-2 bg-scaffold-3 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            transitionDelay: `${delay}ms`
          }}
        />
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className="bg-scaffold-3 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color} / 0.15` }}
        >
          <svg className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs text-text-tertiary mb-0.5">{label}</div>
          <div className="text-lg font-bold text-text-primary">{value}</div>
        </div>
      </div>
    </div>
  );
}
