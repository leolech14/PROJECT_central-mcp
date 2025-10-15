# Quick Start: Central-MCP Dashboard UI Components

## 🚀 Get Started in 5 Minutes

### Step 1: View the Demo (30 seconds)

Create a new page to see all components in action:

```tsx
// app/demo/page.tsx
import DemoPage from '@/app/components/ui/DemoPage';

export default DemoPage;
```

Visit: `http://localhost:3000/demo`

### Step 2: Basic Usage (2 minutes)

```tsx
'use client';

import { LoopStatusPanel } from '@/app/components/ui';

export default function MyDashboard() {
  const loops = [
    {
      id: 'loop-1',
      name: 'System Status',
      status: 'active',
      executionCount: 100,
      avgDuration: 150,
      intervalSeconds: 5
    }
  ];

  return (
    <div className="p-6">
      <LoopStatusPanel loops={loops} />
    </div>
  );
}
```

### Step 3: Add All Components (2 minutes)

```tsx
'use client';

import {
  LoopStatusPanel,
  AgentActivityPanel,
  TaskAnalytics,
  ProjectsOverview,
  PrometheusMetrics
} from '@/app/components/ui';

export default function FullDashboard() {
  // Your data...
  const loops = [...];
  const agents = [...];
  const taskStats = {...};
  const projects = [...];

  return (
    <div className="min-h-screen bg-scaffold-1 p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      {/* Grid Layout */}
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

## 📦 Component Cheat Sheet

### LoopStatusPanel
```tsx
<LoopStatusPanel
  loops={[{
    id: string,
    name: string,
    status: 'active' | 'idle' | 'error',
    executionCount: number,
    avgDuration: number, // milliseconds
    intervalSeconds: number,
    lastRun?: Date,
    description?: string
  }]}
  maxCollapsedItems={3}
/>
```

### AgentActivityPanel
```tsx
<AgentActivityPanel
  agents={[{
    id: string,
    letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
    name: string,
    modelName: string,
    status: 'active' | 'idle' | 'disconnected',
    connectedAt: Date,
    currentTask?: string,
    tasksCompleted?: number,
    projectId?: string
  }]}
  maxCollapsedItems={4}
/>
```

### TaskAnalytics
```tsx
<TaskAnalytics
  stats={{
    pending: number,
    inProgress: number,
    completed: number,
    blocked: number,
    total: number,
    completionRate: number, // 0-100
    velocity: number, // tasks per day
    avgCompletionTime?: number // hours
  }}
/>
```

### ProjectsOverview
```tsx
<ProjectsOverview
  projects={[{
    id: string,
    name: string,
    type: 'COMMERCIAL_APP' | 'INFRASTRUCTURE' | 'KNOWLEDGE_SYSTEM' | 'EXPERIMENTAL' | 'TOOL' | 'OTHER',
    health: number, // 0-100
    blockers: number,
    tasksTotal: number,
    tasksCompleted: number,
    lastActivity?: Date,
    description?: string
  }]}
  maxCollapsedItems={5}
/>
```

### PrometheusMetrics
```tsx
<PrometheusMetrics
  endpoint="/api/data/prometheus" // optional
  refreshInterval={5000} // optional, milliseconds
  maxDataPoints={20} // optional
/>
```

## 🎨 OKLCH Color Reference

### Quick Colors (Copy-Paste Ready)

**Status Colors:**
```css
/* Success/Active - Green */
oklch(0.65 0.18 145)

/* Warning/Idle - Yellow */
oklch(0.75 0.15 90)

/* Error/Blocked - Red */
oklch(0.65 0.22 25)

/* Info - Blue */
oklch(0.70 0.15 240)
```

**Scaffold Layers:**
```css
bg-scaffold-1  /* Lightest */
bg-scaffold-2  /* Medium */
bg-scaffold-3  /* Darkest */
```

**Text Colors:**
```css
text-text-primary    /* Main text */
text-text-secondary  /* Secondary text */
text-text-tertiary   /* Tertiary text */
```

## 🔌 API Integration Example

### Fetch Loop Data
```tsx
'use client';

import { useEffect, useState } from 'react';
import { LoopStatusPanel } from '@/app/components/ui';
import type { LoopStatus } from '@/app/components/ui';

export default function LiveLoops() {
  const [loops, setLoops] = useState<LoopStatus[]>([]);

  useEffect(() => {
    const fetchLoops = async () => {
      const response = await fetch('/api/loops');
      const data = await response.json();
      setLoops(data);
    };

    fetchLoops();
    const interval = setInterval(fetchLoops, 5000);
    return () => clearInterval(interval);
  }, []);

  return <LoopStatusPanel loops={loops} />;
}
```

## 🎯 Common Patterns

### Loading State
```tsx
{isLoading ? (
  <div className="animate-pulse">
    <div className="h-64 bg-scaffold-2 rounded-2xl" />
  </div>
) : (
  <LoopStatusPanel loops={loops} />
)}
```

### Error State
```tsx
{error ? (
  <div className="p-6 bg-[oklch(0.65_0.22_25/0.1)] rounded-2xl">
    <p className="text-[oklch(0.65_0.22_25)]">{error}</p>
  </div>
) : (
  <AgentActivityPanel agents={agents} />
)}
```

### Empty State
```tsx
{projects.length === 0 ? (
  <div className="p-12 text-center">
    <p className="text-text-secondary">No projects found</p>
  </div>
) : (
  <ProjectsOverview projects={projects} />
)}
```

## 🏗️ Layout Examples

### Sidebar Layout
```tsx
<div className="flex gap-6">
  {/* Sidebar */}
  <div className="w-80 space-y-6">
    <AgentActivityPanel agents={agents} />
    <TaskAnalytics stats={taskStats} />
  </div>

  {/* Main Content */}
  <div className="flex-1 space-y-6">
    <LoopStatusPanel loops={loops} />
    <ProjectsOverview projects={projects} />
  </div>
</div>
```

### Tab Layout
```tsx
const [activeTab, setActiveTab] = useState('loops');

<div>
  <div className="flex gap-2 mb-6">
    <button onClick={() => setActiveTab('loops')}>Loops</button>
    <button onClick={() => setActiveTab('agents')}>Agents</button>
  </div>

  {activeTab === 'loops' && <LoopStatusPanel loops={loops} />}
  {activeTab === 'agents' && <AgentActivityPanel agents={agents} />}
</div>
```

### Grid Dashboard
```tsx
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-12 lg:col-span-8">
    <LoopStatusPanel loops={loops} />
  </div>
  <div className="col-span-12 lg:col-span-4">
    <AgentActivityPanel agents={agents} />
  </div>
  <div className="col-span-12">
    <PrometheusMetrics />
  </div>
</div>
```

## 🔧 Customization

### Custom Colors
```tsx
// Override OKLCH colors in your globals.css
:root {
  --color-success: oklch(0.60 0.20 150); // Custom green
}
```

### Custom Animations
```tsx
// Add to globals.css
@keyframes customFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.custom-animation {
  animation: customFade 0.5s ease-in;
}
```

### Extend Components
```tsx
// Wrap component with custom features
export function CustomLoopPanel({ loops }: { loops: LoopStatus[] }) {
  const filteredLoops = loops.filter(l => l.status === 'active');

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <span className="badge">Active: {filteredLoops.length}</span>
      </div>
      <LoopStatusPanel loops={loops} />
    </div>
  );
}
```

## 📱 Mobile Optimization

All components are mobile-optimized by default, but you can enhance:

```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">
  <PrometheusMetrics />
</div>

// Vertical stack on mobile, horizontal on desktop
<div className="flex flex-col lg:flex-row gap-6">
  <LoopStatusPanel loops={loops} />
  <AgentActivityPanel agents={agents} />
</div>
```

## 🎓 Learning Path

1. **Day 1:** Start with DemoPage to see everything
2. **Day 2:** Build a simple dashboard with 2-3 components
3. **Day 3:** Connect to your API endpoints
4. **Day 4:** Customize colors and styling
5. **Day 5:** Add advanced features (WebSocket, filtering, etc.)

## 🆘 Troubleshooting

### Issue: Components not showing colors
**Solution:** Ensure `globals.css` is imported in your root layout:
```tsx
// app/layout.tsx
import './globals.css';
```

### Issue: TypeScript errors on import
**Solution:** Use type imports:
```tsx
import type { LoopStatus } from '@/app/components/ui';
```

### Issue: Animations not working
**Solution:** Check that Tailwind CSS is configured and animations are defined in `globals.css`

## 📚 Full Documentation

- **Complete Guide:** `/app/components/ui/README.md`
- **All Components:** `/COMPONENTS_CREATED.md`
- **Demo Code:** `/app/components/ui/DemoPage.tsx`

## ✨ Pro Tips

1. **Use maxCollapsedItems** to control initial panel size
2. **Combine with React Query** for automatic refetching
3. **Add WebSocket** for real-time updates
4. **Use className prop** to customize component styling
5. **Check DemoPage.tsx** for complete usage examples

---

**You're ready to build! Start with the demo and customize from there.** 🚀
