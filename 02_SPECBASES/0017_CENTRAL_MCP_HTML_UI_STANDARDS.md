# SPECBASE 0017: Central-MCP HTML/UI Standards

**Type:** Technical Standard
**Created:** 2025-10-11
**Agent:** Agent D (Sonnet-4.5) - Integration Specialist
**Source:** Agent A's OKLCH UI Studio V2
**Status:** ACTIVE - All HTML/UI must follow these standards

---

## 🎯 PURPOSE

Establish universal HTML/UI creation standards for Central-MCP that:
1. Enable **human-in-the-loop** UI design through visual configurators
2. Create **reusable theme templates** that work across all 60 projects
3. Feed **Loop 7 Context Learning** with human design preferences
4. Ensure **accessibility, performance, and consistency**

---

## 🎨 OKLCH COLOR SYSTEM (MANDATORY)

### Standard Color Palette Structure

```css
:root {
    /* Primary colors - OKLCH format */
    --primary: oklch(0.60 0.18 270);        /* Main brand color */
    --secondary: oklch(0.65 0.15 210);      /* Secondary accent */
    --accent: oklch(0.75 0.15 85);          /* Highlight color */

    /* Surface colors */
    --background: oklch(0.98 0.01 270);     /* Page background */
    --surface: oklch(1.00 0.00 270);        /* Card/panel surfaces */

    /* Text colors */
    --text: oklch(0.15 0.02 270);           /* Primary text */
    --text-secondary: oklch(0.45 0.02 270); /* Secondary text */

    /* UI elements */
    --border: oklch(0.88 0.01 270);         /* Borders/dividers */

    /* Semantic colors */
    --success: oklch(0.65 0.18 145);        /* Success states */
    --warning: oklch(0.70 0.18 70);         /* Warning states */
    --error: oklch(0.60 0.20 25);           /* Error states */
}
```

### Why OKLCH?

- **Perceptually uniform**: Equal numeric changes = equal visual changes
- **Future-proof**: Modern CSS standard with wide gamut support
- **Accessible**: Easier to maintain WCAG contrast ratios
- **Themeable**: Simple to generate variations programmatically

### Dynamic Color Variations

```css
/* Hover states */
.button:hover {
    background: oklch(from var(--primary) calc(l + 0.1) c h);
}

/* With opacity */
.overlay {
    background: oklch(from var(--primary) l c h / 0.2);
}

/* Shadow with theme color */
.card {
    box-shadow: 0 4px 12px oklch(from var(--primary) l c h / 0.3);
}
```

---

## ♿ ACCESSIBILITY REQUIREMENTS (MANDATORY)

### 1. Skip Links

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: oklch(0.65 0.18 270);
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    font-weight: 600;
    z-index: 10000;
    border-radius: 0 0 4px 0;
}

.skip-link:focus {
    top: 0;
}
```

### 2. Semantic HTML

```html
<!-- ✅ CORRECT -->
<main id="main-content">
    <article class="dashboard">
        <header>
            <h1>Dashboard Title</h1>
        </header>
        <section aria-label="Statistics">
            <!-- Content -->
        </section>
    </article>
</main>

<!-- ❌ WRONG -->
<div id="main-content">
    <div class="dashboard">
        <div class="header">
            <div class="title">Dashboard Title</div>
        </div>
    </div>
</div>
```

### 3. ARIA Labels

```html
<button aria-label="Close settings panel">×</button>
<section aria-label="Recent user messages">...</section>
<nav aria-label="Main navigation">...</nav>
```

### 4. Keyboard Navigation

- All interactive elements must be focusable
- Visible focus indicators required
- Logical tab order
- Keyboard shortcuts with visual hints

---

## 📐 LAYOUT & RESPONSIVE DESIGN

### Modern Grid/Flexbox

```css
/* Responsive grid */
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

/* Flexbox for alignment */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
```

### Mobile-First Breakpoints

```css
/* Base: Mobile */
.container {
    padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
    .container {
        padding: 24px;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        max-width: 1400px;
        margin: 0 auto;
    }
}
```

### Touch-Friendly

```css
body {
    touch-action: manipulation; /* Prevent double-tap zoom */
}

.button {
    min-height: 44px; /* Minimum touch target size */
    min-width: 44px;
}
```

---

## 🎭 ANIMATIONS & TRANSITIONS

### Standard Timing

```css
:root {
    --transition-fast: 150ms;
    --transition-normal: 200ms;
    --transition-slow: 300ms;
}

.element {
    transition: all var(--transition-normal) ease-out;
}
```

### Respect Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 🧩 COMPONENT PATTERNS

### Card Component

```html
<div class="card">
    <div class="card-header">
        <h2>Card Title</h2>
    </div>
    <div class="card-body">
        Content here
    </div>
</div>
```

```css
.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    transition: all var(--transition-normal);
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

### Button Variants

```css
/* Primary button */
.button-primary {
    background: var(--primary);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal);
}

.button-primary:hover {
    background: oklch(from var(--primary) calc(l + 0.1) c h);
}

.button-primary:focus {
    outline: 3px solid oklch(from var(--primary) l c h / 0.3);
    outline-offset: 2px;
}
```

---

## 📊 DATA VISUALIZATION

### Status Indicators

```css
.status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
}

.status-active {
    background: var(--success);
    color: white;
}

.status-pending {
    background: var(--warning);
    color: white;
}

.status-error {
    background: var(--error);
    color: white;
}
```

### Metric Cards

```html
<div class="metric-card">
    <div class="metric-value">42</div>
    <div class="metric-label">Active Users</div>
</div>
```

---

## 🔧 PERFORMANCE REQUIREMENTS

### Critical CSS Inlining

- Inline critical above-the-fold styles
- Defer non-critical stylesheets
- Minimize render-blocking resources

### Lazy Loading

```html
<img src="placeholder.jpg" data-src="actual-image.jpg" loading="lazy" alt="Description">
```

### Optimized Fonts

```css
@font-face {
    font-family: 'CustomFont';
    src: url('font.woff2') format('woff2');
    font-display: swap; /* Prevent FOIT */
}
```

---

## 🎨 THEME TEMPLATE STRUCTURE

### Exportable Theme JSON

```json
{
    "name": "Central-MCP Default",
    "version": "1.0.0",
    "colors": {
        "primary": "oklch(0.60 0.18 270)",
        "secondary": "oklch(0.65 0.15 210)",
        "accent": "oklch(0.75 0.15 85)",
        "background": "oklch(0.98 0.01 270)",
        "surface": "oklch(1.00 0.00 270)",
        "text": "oklch(0.15 0.02 270)",
        "text-secondary": "oklch(0.45 0.02 270)",
        "border": "oklch(0.88 0.01 270)",
        "success": "oklch(0.65 0.18 145)",
        "warning": "oklch(0.70 0.18 70)",
        "error": "oklch(0.60 0.20 25)"
    },
    "typography": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
        "fontSize": {
            "base": "16px",
            "scale": 1.25
        }
    },
    "spacing": {
        "unit": 4,
        "scale": [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
    },
    "borderRadius": {
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "full": "9999px"
    }
}
```

---

## 🔄 INTEGRATION WITH LOOP 7

### Theme Capture API Endpoint

```javascript
// POST /api/intelligence/capture-theme
{
    "themeName": "User-Created Theme",
    "projectId": "CENTRAL_MCP",
    "agentId": "A",
    "themeData": { /* theme JSON */ },
    "context": {
        "createdBy": "human",
        "usageNotes": "Preferred for dashboards"
    }
}
```

### Loop 7 Learning from Themes

1. Human creates/tweaks theme in UI Studio
2. Theme saved to Central-MCP database
3. Loop 7 analyzes theme choices every 20 minutes
4. Learns color preferences, layout patterns, spacing choices
5. Suggests similar themes for new projects
6. **Exponential intelligence**: Better themes → Better suggestions → Better themes!

---

## ✅ VALIDATION CHECKLIST

Before shipping any HTML/UI:

- [ ] Uses OKLCH color system with CSS variables
- [ ] Includes skip link for accessibility
- [ ] Semantic HTML5 elements used correctly
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (3:1 contrast)
- [ ] WCAG 2.2 AA contrast ratios met (4.5:1 text, 3:1 UI)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Touch targets minimum 44x44px
- [ ] ARIA labels on complex interactions
- [ ] Respects prefers-reduced-motion
- [ ] Theme exportable as JSON
- [ ] Performance: LCP < 2.5s, CLS < 0.1

---

## 🚀 FUTURE ENHANCEMENTS

1. **AI-Generated Themes**: Loop 7 generates complete themes from user descriptions
2. **Cross-Project Templates**: One theme applies to all 60 projects automatically
3. **Real-Time Preview**: Live theme switching in UI Studio
4. **Accessibility Scanner**: Automated WCAG compliance checking
5. **Design Token System**: Universal design language across all interfaces

---

## 📚 REFERENCES

- **Source**: `/OKLCH-UI-SYSTEM/ULTIMATE-UI-STUDIO-V2.html`
- **Agent A**: UI Velocity Specialist (GLM-4.6)
- **Agent D**: Integration Specialist (Sonnet-4.5)
- **Loop 7**: Context Learning Intelligence Engine

---

**MANDATORY COMPLIANCE**: All future HTML/UI development MUST follow these standards.
**ENFORCEMENT**: Automated validation in CI/CD pipeline (T-CM-020).
**UPDATES**: This document is LIVING and evolves with system intelligence.
