# Central-MCP UI Design System

## 🎯 Design Philosophy

**Backend Connections Panel Methodology**: Every UI component is deterministically mapped from backend endpoints, creating a zero-friction bridge between data and interface.

**Core Principles:**
- **Deterministic Mapping**: Backend registry → UI components automatically
- **Semantic Clarity**: Component names match backend functionality
- **Zero Configuration**: Developers get working UI immediately
- **Accessibility First**: WCAG 2.2 AA compliance by default
- **Universal Compatibility**: Works across all Central-MCP projects

---

## 🎨 Color System (OKLCH-based)

### Primary Colors (OKLCH)
```css
:root {
  /* Brand Colors - OKLCH for better perceptual uniformity */
  --color-primary-50: 0.98 0.01 240;
  --color-primary-100: 0.95 0.02 240;
  --color-primary-200: 0.90 0.04 240;
  --color-primary-300: 0.82 0.08 240;
  --color-primary-400: 0.70 0.12 240;
  --color-primary-500: 0.58 0.18 240; /* Main brand */
  --color-primary-600: 0.48 0.22 240;
  --color-primary-700: 0.38 0.26 240;
  --color-primary-800: 0.28 0.30 240;
  --color-primary-900: 0.18 0.32 240;
  --color-primary-950: 0.10 0.32 240;

  /* Semantic Colors */
  --color-success: 0.65 0.20 145;
  --color-warning: 0.75 0.18 65;
  --color-error: 0.65 0.25 25;
  --color-info: 0.65 0.15 240;

  /* Neutral Colors (OKLCH grayscale) */
  --color-neutral-0: 1 0 0;
  --color-neutral-50: 0.98 0.01 0;
  --color-neutral-100: 0.95 0.02 0;
  --color-neutral-200: 0.90 0.02 0;
  --color-neutral-300: 0.80 0.04 0;
  --color-neutral-400: 0.65 0.06 0;
  --color-neutral-500: 0.50 0.08 0;
  --color-neutral-600: 0.35 0.10 0;
  --color-neutral-700: 0.25 0.12 0;
  --color-neutral-800: 0.15 0.15 0;
  --color-neutral-900: 0.08 0.20 0;
  --color-neutral-950: 0.03 0.25 0;
}
```

### Dark Theme
```css
[data-theme="dark"] {
  --color-background: 0.12 0.08 240;
  --color-surface: 0.15 0.06 240;
  --color-surface-elevated: 0.18 0.06 240;
  --color-border: 0.22 0.08 240;
  --color-text-primary: 0.95 0.01 0;
  --color-text-secondary: 0.75 0.02 0;
  --color-text-tertiary: 0.55 0.03 0;
}

[data-theme="light"] {
  --color-background: 0.98 0.01 0;
  --color-surface: 0.95 0.01 0;
  --color-surface-elevated: 1 0 0;
  --color-border: 0.85 0.02 0;
  --color-text-primary: 0.12 0.08 240;
  --color-text-secondary: 0.35 0.06 240;
  --color-text-tertiary: 0.55 0.08 240;
}
```

---

## 📐 Typography System

### Font Scale (Clamp for responsive)
```css
:root {
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --font-size-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem);
  --font-size-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem);

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Letter Spacing */
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
}
```

### Font Stack
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, 'Monaco', monospace;
  --font-display: 'Inter Display', system-ui, sans-serif;
}
```

---

## 🧩 Component Library Structure

### Backend-Derived Components

Based on the Backend Connections Registry, each component automatically maps to specific API endpoints:

#### 1. **SystemStatusPanel** (from `/api/system/status`)
```typescript
interface SystemStatusPanelProps {
  refreshInterval?: number; // Default: 5000ms
  showAgentActivity?: boolean;
  showTaskProgress?: boolean;
  showProjectHealth?: boolean;
}

// Automatically maps to:
// - engineStatus.agent_activity
// - tasks.byStatus
// - agents.status
// - recentProjects
```

#### 2. **AgentDirectory** (from `/api/config/agents`)
```typescript
interface AgentDirectoryProps {
  filters?: AgentFilter[];
  sortBy?: 'name' | 'model' | 'status' | 'lastSeen';
  viewMode?: 'grid' | 'list';
  actions?: ('edit' | 'delete' | 'viewHistory')[];
}

// Automatically maps to agent registry data
```

#### 3. **TaskBoard** (from `/api/config/tasks`)
```typescript
interface TaskBoardProps {
  viewMode?: 'kanban' | 'table' | 'timeline';
  groupBy?: 'status' | 'agent' | 'project' | 'priority';
  filters?: TaskFilter[];
  dragDrop?: boolean;
}

// Automatically maps to task registry with real-time updates
```

#### 4. **ModelMarketplace** (from `/api/config/models`)
```typescript
interface ModelMarketplaceProps {
  compareMode?: boolean;
  showCostAnalysis?: boolean;
  filters?: ModelFilter[];
  sortBy?: 'cost' | 'performance' | 'context_size';
}
```

#### 5. **BackendConnectionsPanel** (Meta Component)
```typescript
interface BackendConnectionsPanelProps {
  category?: ConnectionCategory;
  showEndpoints?: boolean;
  showDocumentation?: boolean;
  interactiveMode?: boolean;
}

// The master component that renders all other components
// based on the backend connections registry
```

---

## 🎭 Animation System

### Motion Principles
- **Purposeful**: Every animation serves a functional purpose
- **Accessible**: Respects `prefers-reduced-motion`
- **Performant**: Uses `transform` and `opacity` for 60fps
- **Consistent**: Follows easing curves and duration patterns

### Animation Tokens
```css
:root {
  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-slower: 600ms;

  /* Easing Functions */
  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);

  /* Transitions */
  --transition-colors: color var(--duration-normal) var(--ease-out-cubic);
  --transition-opacity: opacity var(--duration-fast) var(--ease-out-quad);
  --transition-transform: transform var(--duration-normal) var(--ease-out-cubic);
}
```

---

## 📱 Layout System

### Grid System
```css
:root {
  /* Container */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;

  /* Spacing Scale (8pt grid) */
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */
}
```

### Component Layout Patterns
```css
/* Dashboard Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
  padding: var(--space-6);
}

/* Card Layout */
.card {
  background: oklch(var(--color-surface));
  border: 1px solid oklch(var(--color-border));
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px oklch(var(--color-neutral-900) / 0.1);
}

/* Sidebar Layout */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}
```

---

## ♿ Accessibility Standards

### WCAG 2.2 AA Compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: 3:1 contrast minimum, 2px outline
- **Touch Targets**: Minimum 44x44px
- **Keyboard Navigation**: Full Tab/Shift+Tab navigation
- **Screen Reader**: Proper ARIA labels and semantic HTML

### Focus Management
```css
/* Focus Styles */
.focus-visible:focus {
  outline: 2px solid oklch(var(--color-primary-500));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip Link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: oklch(var(--color-primary-600));
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

---

## 🔧 Implementation Architecture

### Component Auto-Generation

The system automatically generates React components from the Backend Connections Registry:

```typescript
// Example: Auto-generated SystemStatusPanel
export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({
  refreshInterval = 5000,
  showAgentActivity = true,
  showTaskProgress = true,
  showProjectHealth = true
}) => {
  // Automatically fetches from /api/system/status
  // Renders deterministic UI based on backend schema
  // Updates every refreshInterval milliseconds
};
```

### Usage Pattern
```typescript
// 1. Import auto-generated component
import { SystemStatusPanel } from '@central-mcp/ui-system';

// 2. Use with minimal configuration
<SystemStatusPanel
  refreshInterval={10000}
  showAgentActivity={true}
/>

// 3. Component automatically:
//    - Connects to correct API endpoint
//    - Handles loading/error states
//    - Provides real-time updates
//    - Maintains accessibility standards
```

---

## 📦 Package Structure

```
@central-mcp/ui-system/
├── components/
│   ├── auto-generated/     # From backend registry
│   ├── base/              # Base UI primitives
│   └── composed/          # Complex combinations
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   └── animations.css
├── themes/
│   ├── light.css
│   ├── dark.css
│   └── auto.css
├── utils/
│   ├── accessibility.ts
│   ├── responsive.ts
│   └── color-utils.ts
└── types/
    ├── backend-connections.ts
    ├── component-props.ts
    └── theme-types.ts
```

---

## 🚀 Getting Started

### Installation
```bash
npm install @central-mcp/ui-system
```

### Basic Usage
```tsx
import { CentralMCPProvider, BackendConnectionsPanel } from '@central-mcp/ui-system';

function App() {
  return (
    <CentralMCPProvider theme="auto">
      <BackendConnectionsPanel
        category="monitoring"
        interactiveMode={true}
      />
    </CentralMCPProvider>
  );
}
```

### Advanced Usage
```tsx
import {
  SystemStatusPanel,
  AgentDirectory,
  TaskBoard,
  ModelMarketplace
} from '@central-mcp/ui-system';

function Dashboard() {
  return (
    <div className="dashboard-grid">
      <SystemStatusPanel refreshInterval={5000} />
      <AgentDirectory viewMode="grid" />
      <TaskBoard viewMode="kanban" />
      <ModelMarketplace compareMode={true} />
    </div>
  );
}
```

---

## 🎯 Backend Connections Panel Methodology

### Core Concept
Every UI component is **deterministically mapped** from backend API endpoints. No manual UI creation required.

### Process
1. **Backend Registry**: `/api/registry/connections` defines all endpoints
2. **Component Generation**: System auto-generates React components
3. **Zero Configuration**: Developers use components immediately
4. **Real-Time Sync**: UI automatically updates with backend changes

### Example Mapping
```
GET /api/system/status → <SystemStatusPanel />
GET /api/config/agents → <AgentDirectory />
GET /api/config/tasks → <TaskBoard />
GET /api/config/models → <ModelMarketplace />
```

### Benefits
- **Zero Friction**: Backend changes automatically reflected in UI
- **Type Safety**: Full TypeScript support with backend types
- **Consistency**: All components follow same patterns
- **Productivity**: 10x faster development with zero UI boilerplate

This is the **Central-MCP Emergent Principle** in action: **MINIMUM USER INPUT → FULL-STACK APPLICATIONS**