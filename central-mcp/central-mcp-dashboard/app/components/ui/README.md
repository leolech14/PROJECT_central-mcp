# Central-MCP Dashboard UI Components

Professional UI component library for the Central-MCP Dashboard with OKLCH color system, smooth animations, and sophisticated styling.

## Components

### 1. LoopStatusPanel
Display auto-proactive loops (9 loops) with execution metrics.

```tsx
import { LoopStatusPanel } from '@/app/components/ui';

const loops = [
  {
    id: 'loop-0',
    name: 'System Status',
    status: 'active',
    executionCount: 1250,
    avgDuration: 150,
    lastRun: new Date(),
    intervalSeconds: 5,
    description: 'Foundation health checks'
  },
  // ... more loops
];

<LoopStatusPanel loops={loops} maxCollapsedItems={3} />
```

**Features:**
- Visual status indicators (active/idle/error) with OKLCH colors
- Expandable view for detailed metrics
- Execution count and average duration display
- Smooth animations and hover effects

### 2. AgentActivityPanel
Display agent sessions with unique visual identities.

```tsx
import { AgentActivityPanel } from '@/app/components/ui';

const agents = [
  {
    id: 'agent-001',
    letter: 'A',
    name: 'UI Velocity',
    modelName: 'GLM-4.6',
    status: 'active',
    currentTask: 'Building dashboard components',
    connectedAt: new Date(),
    tasksCompleted: 5,
    projectId: 'central-mcp'
  },
  // ... more agents
];

<AgentActivityPanel agents={agents} maxCollapsedItems={4} />
```

**Features:**
- Agent letter badges (A-F) with unique OKLCH accent colors
- Model name and status display
- Current task tracking
- Connection time and activity metrics
- Expandable details view

### 3. TaskAnalytics
Display task metrics with animated pie chart.

```tsx
import { TaskAnalytics } from '@/app/components/ui';

const stats = {
  pending: 15,
  inProgress: 8,
  completed: 42,
  blocked: 3,
  total: 68,
  completionRate: 61.8,
  velocity: 5.2,
  avgCompletionTime: 4.5
};

<TaskAnalytics stats={stats} />
```

**Features:**
- Animated pie chart with task distribution
- Completion rate and velocity metrics
- Color-coded status bars
- Expandable detailed metrics view
- OKLCH colors for each status

### 4. ProjectsOverview
Display project summary with health metrics.

```tsx
import { ProjectsOverview } from '@/app/components/ui';

const projects = [
  {
    id: 'project-001',
    name: 'Central-MCP',
    type: 'INFRASTRUCTURE',
    health: 95,
    blockers: 0,
    tasksTotal: 25,
    tasksCompleted: 20,
    lastActivity: new Date(),
    description: 'Auto-Proactive Intelligence System'
  },
  // ... more projects
];

<ProjectsOverview projects={projects} maxCollapsedItems={5} />
```

**Project Types:**
- `COMMERCIAL_APP` - Blue
- `INFRASTRUCTURE` - Purple
- `KNOWLEDGE_SYSTEM` - Yellow
- `EXPERIMENTAL` - Pink
- `TOOL` - Green
- `OTHER` - Gray

**Features:**
- Health percentage with visual ring
- Projects by type breakdown
- Blockers overview
- Filterable list view
- Progress tracking

### 5. PrometheusMetrics
Display Prometheus metrics with real-time graphs.

```tsx
import { PrometheusMetrics } from '@/app/components/ui';

<PrometheusMetrics
  endpoint="/api/data/prometheus"
  refreshInterval={5000}
  maxDataPoints={20}
/>
```

**Features:**
- Auto-refresh from API endpoint
- Time-series visualization
- Multiple metric types (gauge, counter, histogram)
- Trend indicators
- OKLCH gradient backgrounds
- Loading and error states

## OKLCH Color System

All components use the OKLCH color system for consistent, perceptually uniform colors:

### Scaffold Layers
- `bg-scaffold-1` - Lightest background
- `bg-scaffold-2` - Medium background
- `bg-scaffold-3` - Darkest background

### Text Colors
- `text-text-primary` - Main text
- `text-text-secondary` - Secondary text
- `text-text-tertiary` - Tertiary text

### Status Colors
- **Active/Success:** `oklch(0.65 0.18 145)` - Green
- **Warning/Idle:** `oklch(0.75 0.15 90)` - Yellow
- **Error/Blocked:** `oklch(0.65 0.22 25)` - Red
- **Info:** `oklch(0.70 0.15 240)` - Blue

### Agent Colors
Each agent (A-F) has a unique OKLCH accent color:
- **Agent A:** Red-Orange `oklch(0.75 0.20 25)`
- **Agent B:** Green `oklch(0.65 0.18 145)`
- **Agent C:** Blue `oklch(0.65 0.20 240)`
- **Agent D:** Purple `oklch(0.65 0.20 280)`
- **Agent E:** Yellow `oklch(0.75 0.20 60)`
- **Agent F:** Pink `oklch(0.65 0.20 330)`

## Animations

Custom animations available via CSS classes:

- `.animate-fadeIn` - Fade in with slide up
- `.animate-slideInRight` - Slide in from right
- `.animate-slideInLeft` - Slide in from left
- `.animate-scaleIn` - Scale in animation

All animations are 300ms with ease-out timing.

## Responsive Design

All components are mobile-first responsive:

- **Mobile:** Single column layout
- **Tablet (md):** 2 column layout where applicable
- **Desktop (lg):** 3+ column layouts
- **Wide (xl):** Maximum column layouts

## Accessibility

All components follow WCAG 2.2 AA standards:

- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ ARIA labels and semantic HTML
- ✅ 4.5:1 text contrast minimum
- ✅ Focus indicators with 3:1 contrast
- ✅ Screen reader optimization

## Example Dashboard Page

```tsx
'use client';

import {
  LoopStatusPanel,
  AgentActivityPanel,
  TaskAnalytics,
  ProjectsOverview,
  PrometheusMetrics
} from '@/app/components/ui';

export default function DashboardPage() {
  // Fetch your data...
  const loops = [...];
  const agents = [...];
  const taskStats = {...};
  const projects = [...];

  return (
    <div className="min-h-screen bg-scaffold-1 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        Central-MCP Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoopStatusPanel loops={loops} />
        <AgentActivityPanel agents={agents} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskAnalytics stats={taskStats} />
        <ProjectsOverview projects={projects} />
      </div>

      <PrometheusMetrics />
    </div>
  );
}
```

## TypeScript Support

All components are fully typed with TypeScript:

```tsx
import type {
  LoopStatus,
  Agent,
  TaskStats,
  Project,
  ProjectType,
  PrometheusMetric
} from '@/app/components/ui';
```

## Performance

All components are optimized for performance:

- ✅ React.memo for expensive computations
- ✅ Debounced animations
- ✅ Lazy state updates
- ✅ Minimal re-renders
- ✅ Efficient SVG rendering

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Part of the Central-MCP Dashboard project.
