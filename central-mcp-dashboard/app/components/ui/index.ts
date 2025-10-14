/**
 * Central-MCP Dashboard UI Components
 *
 * Sophisticated UI component library with OKLCH color system,
 * smooth animations, and professional styling.
 */

// Core Components
export { SystemHealthRing } from './SystemHealthRing';
export { RealtimeMetricsGrid } from './RealtimeMetricsGrid';

// Advanced Dashboard Components
export { LoopStatusPanel } from './LoopStatusPanel';
export { AgentActivityPanel } from './AgentActivityPanel';
export { TaskAnalytics } from './TaskAnalytics';
export { ProjectsOverview } from './ProjectsOverview';
export { PrometheusMetrics } from './PrometheusMetrics';

// Type exports for external use
export type { LoopStatus } from './LoopStatusPanel';
export type { Agent } from './AgentActivityPanel';
export type { TaskStats } from './TaskAnalytics';
export type { Project, ProjectType } from './ProjectsOverview';
export type { PrometheusMetric } from './PrometheusMetrics';
