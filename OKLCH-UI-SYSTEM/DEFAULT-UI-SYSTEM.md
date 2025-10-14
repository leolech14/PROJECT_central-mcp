# 🎨 Central-MCP Official Default UI System

**Version**: 1.0.0
**Created**: 2025-10-11
**Status**: ✅ Official Standard
**Purpose**: Universal UI foundation for ALL projects in PROJECTS_all ecosystem

---

## 🎯 THE VISION

**Every project in PROJECTS_all should look like "different pages of the same app"**

- ✅ Same visual language across all 60 projects
- ✅ Professional sophistication as DEFAULT
- ✅ Instant recognition and consistency
- ✅ Zero UI design decisions needed to start
- ✅ Full customization while maintaining compatibility

---

## 🏗️ DESIGN PHILOSOPHY

### **Core Principles**

1. **Perceptually Uniform** - OKLCH color space for predictable lightness
2. **Accessibility First** - WCAG 2.2 AA compliance built-in (4.5:1 minimum)
3. **Dark Mode Native** - Light and dark modes equally refined
4. **Minimalist Elegance** - Clean, spacious, sophisticated
5. **High Contrast** - Clear hierarchy and readability
6. **Smooth Interactions** - Polished animations and transitions
7. **Responsive by Default** - Mobile-first, scales beautifully

### **Visual Identity**

```
Style: Modern minimalist with subtle depth
Feeling: Professional, trustworthy, efficient
Inspiration: Apple's design language + Stripe's clarity
Sophistication Level: Enterprise-grade SaaS
```

---

## 🎨 DESIGN TOKENS

### **🌈 Color System (OKLCH)**

#### **Base Colors - Light Mode**

```css
:root {
  /* Primary (Brand) - Purple/Indigo */
  --primary: oklch(0.60 0.18 270);           /* Base */
  --primary-light: oklch(0.70 0.18 270);     /* Hover */
  --primary-dark: oklch(0.50 0.18 270);      /* Active */
  --primary-muted: oklch(0.95 0.03 270);     /* Background */

  /* Secondary (Accent) - Cyan/Blue */
  --secondary: oklch(0.65 0.15 210);         /* Base */
  --secondary-light: oklch(0.75 0.15 210);   /* Hover */
  --secondary-dark: oklch(0.55 0.15 210);    /* Active */
  --secondary-muted: oklch(0.95 0.03 210);   /* Background */

  /* Accent (Highlight) - Amber */
  --accent: oklch(0.75 0.15 85);             /* Base */
  --accent-light: oklch(0.85 0.15 85);       /* Hover */
  --accent-dark: oklch(0.65 0.15 85);        /* Active */
  --accent-muted: oklch(0.95 0.03 85);       /* Background */

  /* Neutrals */
  --background: oklch(0.98 0.01 270);        /* Page background */
  --surface: oklch(1.00 0.00 270);           /* Cards, panels */
  --surface-raised: oklch(0.96 0.01 270);    /* Elevated surfaces */

  --text: oklch(0.15 0.02 270);              /* Primary text */
  --text-secondary: oklch(0.45 0.02 270);    /* Secondary text */
  --text-tertiary: oklch(0.65 0.02 270);     /* Muted text */

  --border: oklch(0.88 0.01 270);            /* Default borders */
  --border-strong: oklch(0.78 0.02 270);     /* Emphasized borders */
  --divider: oklch(0.92 0.01 270);           /* Subtle dividers */

  /* Semantic Colors */
  --success: oklch(0.65 0.18 145);           /* Green */
  --success-light: oklch(0.75 0.18 145);
  --success-dark: oklch(0.55 0.18 145);
  --success-muted: oklch(0.95 0.03 145);

  --warning: oklch(0.70 0.18 70);            /* Orange */
  --warning-light: oklch(0.80 0.18 70);
  --warning-dark: oklch(0.60 0.18 70);
  --warning-muted: oklch(0.95 0.03 70);

  --error: oklch(0.60 0.20 25);              /* Red */
  --error-light: oklch(0.70 0.20 25);
  --error-dark: oklch(0.50 0.20 25);
  --error-muted: oklch(0.95 0.03 25);

  --info: oklch(0.65 0.15 230);              /* Blue */
  --info-light: oklch(0.75 0.15 230);
  --info-dark: oklch(0.55 0.15 230);
  --info-muted: oklch(0.95 0.03 230);
}
```

#### **Base Colors - Dark Mode**

```css
[data-theme="dark"] {
  /* Primary (Brand) - Purple/Indigo */
  --primary: oklch(0.65 0.18 270);           /* Lighter in dark mode */
  --primary-light: oklch(0.75 0.18 270);
  --primary-dark: oklch(0.55 0.18 270);
  --primary-muted: oklch(0.20 0.05 270);

  /* Secondary (Accent) - Cyan/Blue */
  --secondary: oklch(0.70 0.15 210);
  --secondary-light: oklch(0.80 0.15 210);
  --secondary-dark: oklch(0.60 0.15 210);
  --secondary-muted: oklch(0.20 0.03 210);

  /* Accent (Highlight) - Amber */
  --accent: oklch(0.75 0.15 85);
  --accent-light: oklch(0.85 0.15 85);
  --accent-dark: oklch(0.65 0.15 85);
  --accent-muted: oklch(0.20 0.03 85);

  /* Neutrals */
  --background: oklch(0.15 0.01 270);        /* Dark background */
  --surface: oklch(0.18 0.01 270);           /* Cards, panels */
  --surface-raised: oklch(0.22 0.01 270);    /* Elevated surfaces */

  --text: oklch(0.95 0.01 270);              /* Light text */
  --text-secondary: oklch(0.70 0.01 270);
  --text-tertiary: oklch(0.50 0.01 270);

  --border: oklch(0.28 0.01 270);
  --border-strong: oklch(0.38 0.02 270);
  --divider: oklch(0.24 0.01 270);

  /* Semantic Colors (adjusted for dark) */
  --success: oklch(0.70 0.18 145);
  --success-light: oklch(0.80 0.18 145);
  --success-dark: oklch(0.60 0.18 145);
  --success-muted: oklch(0.20 0.05 145);

  --warning: oklch(0.75 0.18 70);
  --warning-light: oklch(0.85 0.18 70);
  --warning-dark: oklch(0.65 0.18 70);
  --warning-muted: oklch(0.20 0.05 70);

  --error: oklch(0.65 0.20 25);
  --error-light: oklch(0.75 0.20 25);
  --error-dark: oklch(0.55 0.20 25);
  --error-muted: oklch(0.20 0.05 25);

  --info: oklch(0.70 0.15 230);
  --info-light: oklch(0.80 0.15 230);
  --info-dark: oklch(0.60 0.15 230);
  --info-muted: oklch(0.20 0.03 230);
}
```

---

### **📏 Typography**

```css
:root {
  /* Font Families */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
               Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", "Fira Code", "Consolas", "Monaco", monospace;

  /* Font Sizes (rem scale) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px - body text */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}
```

---

### **📐 Spacing Scale**

```css
:root {
  /* Spacing (4px base unit) */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px */
}
```

---

### **🎭 Shadows & Elevation**

```css
:root {
  /* Shadows (Light Mode) */
  --shadow-xs: 0 1px 2px 0 oklch(0.15 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 oklch(0.15 0 0 / 0.1),
               0 1px 2px -1px oklch(0.15 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px oklch(0.15 0 0 / 0.1),
               0 2px 4px -2px oklch(0.15 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px oklch(0.15 0 0 / 0.1),
               0 4px 6px -4px oklch(0.15 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px oklch(0.15 0 0 / 0.1),
               0 8px 10px -6px oklch(0.15 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px oklch(0.15 0 0 / 0.25);

  /* Focus Ring */
  --focus-ring: 0 0 0 3px var(--primary-muted),
                0 0 0 4px var(--primary);
}

[data-theme="dark"] {
  /* Shadows (Dark Mode) - stronger */
  --shadow-xs: 0 1px 2px 0 oklch(0.05 0 0 / 0.3);
  --shadow-sm: 0 1px 3px 0 oklch(0.05 0 0 / 0.4),
               0 1px 2px -1px oklch(0.05 0 0 / 0.4);
  --shadow-md: 0 4px 6px -1px oklch(0.05 0 0 / 0.5),
               0 2px 4px -2px oklch(0.05 0 0 / 0.5);
  --shadow-lg: 0 10px 15px -3px oklch(0.05 0 0 / 0.6),
               0 4px 6px -4px oklch(0.05 0 0 / 0.6);
  --shadow-xl: 0 20px 25px -5px oklch(0.05 0 0 / 0.7),
               0 8px 10px -6px oklch(0.05 0 0 / 0.7);
  --shadow-2xl: 0 25px 50px -12px oklch(0.05 0 0 / 0.8);

  --focus-ring: 0 0 0 3px var(--primary-muted),
                0 0 0 4px var(--primary-light);
}
```

---

### **📏 Border Radius**

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;  /* Pills/circles */
}
```

---

### **⏱️ Animation Timings**

```css
:root {
  /* Duration */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;

  /* Easing Functions */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

### **📱 Responsive Breakpoints**

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet portrait */
  --breakpoint-lg: 1024px;  /* Tablet landscape */
  --breakpoint-xl: 1280px;  /* Desktop */
  --breakpoint-2xl: 1536px; /* Large desktop */
}
```

---

## 🧩 COMPONENT SPECIFICATIONS

### **🔘 Buttons**

```css
.btn {
  /* Base */
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  line-height: var(--leading-tight);

  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;

  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);

  /* Prevent layout shift on hover */
  transform: translateZ(0);
}

.btn-primary {
  background: var(--primary);
  color: oklch(1 0 0); /* Always white text */
  border-color: var(--primary);
}

.btn-primary:hover {
  background: var(--primary-light);
  border-color: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  background: var(--primary-dark);
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Sizes */
.btn-sm {
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
}

.btn-lg {
  font-size: var(--text-lg);
  padding: var(--space-4) var(--space-8);
}

/* Variants */
.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}

.btn-ghost {
  background: transparent;
  color: var(--text);
  border-color: transparent;
}

.btn-ghost:hover {
  background: var(--primary-muted);
  color: var(--primary);
}
```

---

### **📝 Input Fields**

```css
.input {
  /* Base */
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);

  width: 100%;
  padding: var(--space-3) var(--space-4);

  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);

  transition: all var(--duration-base) var(--ease-out);
}

.input:hover {
  border-color: var(--border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus-ring);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--text-tertiary);
}

/* States */
.input-error {
  border-color: var(--error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px var(--error-muted), 0 0 0 4px var(--error);
}

.input-success {
  border-color: var(--success);
}
```

---

### **🃏 Cards**

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);

  box-shadow: var(--shadow-sm);
  transition: all var(--duration-base) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--divider);
}

.card-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text);
  margin: 0;
}

.card-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.card-body {
  margin-bottom: var(--space-4);
}

.card-footer {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--divider);
}
```

---

### **🗂️ Navigation**

```css
.nav {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.nav-item {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);

  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);

  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.nav-item:hover {
  background: var(--primary-muted);
  color: var(--primary);
}

.nav-item-active {
  background: var(--primary);
  color: oklch(1 0 0);
}

.nav-item-active:hover {
  background: var(--primary-light);
}
```

---

### **🔔 Badges & Pills**

```css
.badge {
  display: inline-flex;
  align-items: center;

  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);

  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-none);

  background: var(--primary-muted);
  color: var(--primary-dark);
}

.badge-success {
  background: var(--success-muted);
  color: var(--success-dark);
}

.badge-warning {
  background: var(--warning-muted);
  color: var(--warning-dark);
}

.badge-error {
  background: var(--error-muted);
  color: var(--error-dark);
}
```

---

## 🎬 INTERACTION PATTERNS

### **Hover States**
```css
/* All interactive elements should have hover feedback */
- Slight color shift (lighter/darker)
- Subtle lift (translateY(-1px) or (-2px))
- Shadow increase
- Duration: var(--duration-fast)
```

### **Active/Pressed States**
```css
/* All clickable elements should have pressed feedback */
- Color darkens
- Element depresses (translateY(0))
- Shadow decreases
- Duration: instant (no transition)
```

### **Focus States**
```css
/* All focusable elements MUST have visible focus ring */
- Custom focus ring (var(--focus-ring))
- Never remove outline without replacement
- 3:1 contrast minimum with background
```

### **Loading States**
```css
/* Shimmer animation for loading content */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--border) 0%,
    var(--surface-raised) 50%,
    var(--border) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

---

## 📱 RESPONSIVE DESIGN

### **Mobile First Approach**

```css
/* Base styles (mobile) */
.container {
  padding: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: var(--space-8);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### **Breakpoint Guidelines**

- **Mobile (< 640px)**: Stack vertically, full width, touch-friendly (44px minimum)
- **Tablet (640-1024px)**: 2-column grids, balanced layouts
- **Desktop (> 1024px)**: Multi-column, sidebars, max-width containers

---

## ♿ ACCESSIBILITY REQUIREMENTS

### **Contrast Ratios (WCAG 2.2 AA)**

```
✅ Normal text: 4.5:1 minimum
✅ Large text (18px+): 3:1 minimum
✅ UI components: 3:1 minimum
✅ Focus indicators: 3:1 minimum
```

### **Keyboard Navigation**

```
✅ All interactive elements keyboard accessible
✅ Tab order logical and intuitive
✅ Skip links for main content
✅ Focus trap in modals
✅ Escape to close overlays
```

### **Screen Reader Support**

```
✅ Semantic HTML (nav, main, article, etc.)
✅ ARIA labels where needed
✅ Alt text for images
✅ aria-live for dynamic content
✅ aria-expanded for disclosure widgets
```

---

## 🎨 THEME CUSTOMIZATION

### **How to Create Custom Themes**

**Step 1**: Keep design tokens structure
```css
:root {
  /* Override base colors only */
  --primary: oklch(0.55 0.20 160); /* Custom teal */
  /* All other tokens cascade automatically */
}
```

**Step 2**: Test both light and dark modes
```css
[data-theme="dark"] {
  --primary: oklch(0.65 0.20 160); /* Lighter in dark */
}
```

**Step 3**: Validate accessibility
- Use OKLCH-UI-SYSTEM/systems/OKLCH-LIVE-DEPENDENCY-SYSTEM.html
- Ensure 4.5:1 contrast for text
- Test in Studio Playground

---

## 🔧 AGENT INTEGRATION

### **When Writing SPECBASE**

Agents should include this specification:

```markdown
## UI System

**Standard**: Central-MCP Default UI System v1.0.0
**Location**: `/PROJECTS_all/PROJECT_central-mcp/OKLCH-UI-SYSTEM/DEFAULT-UI-SYSTEM.md`

**Theme**: [default | custom]
**Customizations**: [if any]

All components follow the official design token system with OKLCH colors,
ensuring WCAG 2.2 AA compliance and compatibility with all PROJECTS_all apps.
```

---

## 📦 IMPLEMENTATION CHECKLIST

When implementing in a project:

```
✅ Import design tokens (CSS variables)
✅ Set up light/dark mode toggle
✅ Implement component styles
✅ Test responsive breakpoints
✅ Validate WCAG compliance
✅ Add focus states to all interactive elements
✅ Test keyboard navigation
✅ Verify visual consistency with ecosystem
```

---

## 🎯 SUCCESS CRITERIA

A project successfully implements the Default UI System when:

1. ✅ **Visual Compatibility**: Looks like "another page" of the ecosystem
2. ✅ **Accessibility**: Passes WCAG 2.2 AA automated + manual tests
3. ✅ **Dark Mode**: Both modes equally polished
4. ✅ **Responsive**: Works beautifully on all screen sizes
5. ✅ **Performance**: Smooth 60fps animations
6. ✅ **Consistency**: All components follow token system

---

## 🌟 THE RESULT

**Every project in PROJECTS_all will have:**

- ✅ Professional, sophisticated UI out-of-the-box
- ✅ Perfect visual harmony across all 60 projects
- ✅ Guaranteed accessibility compliance
- ✅ Zero UI design decisions needed to start
- ✅ Full customization while staying compatible
- ✅ Users feel they're in "the same app"

---

**🎨 Welcome to the Central-MCP UI Ecosystem!**

**Version**: 1.0.0
**Status**: ✅ Official Standard
**Location**: `/PROJECTS_all/PROJECT_central-mcp/OKLCH-UI-SYSTEM/DEFAULT-UI-SYSTEM.md`
