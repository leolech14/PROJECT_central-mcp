# 🤖 Central-MCP Default UI System - Agent Integration Guide

**Version**: 1.0.0
**Updated**: 2025-10-11
**For**: AI Agents working in PROJECTS_all ecosystem

---

## 🎯 PURPOSE

This guide explains how AI agents should **automatically tap into the Official Default UI System** when:
- Writing SPECBASE for new projects
- Implementing UI components
- Creating design systems
- Ensuring ecosystem compatibility

---

## 📍 LOCATION

```
/Users/lech/PROJECTS_all/PROJECT_central-mcp/OKLCH-UI-SYSTEM/
```

**Key Files:**
- `DEFAULT-UI-SYSTEM.md` - Complete UI specification (800 lines)
- `default-theme.json` - JSON theme definition
- `STUDIO-PLAYGROUND.html` - Interactive theme editor
- `OKLCH-LIVE-DEPENDENCY-SYSTEM.html` - Color dependency visualizer

---

## 🤖 WHEN TO USE THIS SYSTEM

### ✅ ALWAYS Use When:

1. **Writing SPECBASE** for any new project
2. **Implementing UI components** (buttons, inputs, cards, etc.)
3. **Creating design tokens** (colors, spacing, typography)
4. **Ensuring WCAG compliance** (4.5:1 contrast minimum)
5. **Building theme systems** (light/dark mode support)
6. **Establishing visual consistency** across projects

### ❌ DON'T Use When:

- Project has explicit custom branding requirements (but still reference for structure)
- Creating intentionally unique/experimental interfaces (still reference for patterns)
- Working on non-UI tasks (backend, data, infrastructure)

---

## 📋 AGENT WORKFLOW

### **Step 1: Read the Specification**

```bash
# Agent reads DEFAULT-UI-SYSTEM.md
cat /Users/lech/PROJECTS_all/PROJECT_central-mcp/OKLCH-UI-SYSTEM/DEFAULT-UI-SYSTEM.md
```

**What you get:**
- Complete design token system (colors, typography, spacing, shadows, etc.)
- Component specifications with code examples
- Accessibility requirements (WCAG 2.2 AA)
- Responsive design patterns
- Implementation checklist

---

### **Step 2: Include in SPECBASE**

When writing project SPECBASE, include this section:

```markdown
## 🎨 UI System

**Standard**: Central-MCP Default UI System v1.0.0
**Location**: `/PROJECT_central-mcp/OKLCH-UI-SYSTEM/DEFAULT-UI-SYSTEM.md`
**Theme**: Default (Purple/Indigo primary, Cyan secondary, Amber accent)
**Compliance**: WCAG 2.2 AA (4.5:1 minimum contrast)

### Design Tokens

All components use the official Central-MCP design token system:

**Colors**: OKLCH color space for perceptual uniformity
- Primary: `oklch(0.60 0.18 270)` (Purple/Indigo)
- Secondary: `oklch(0.65 0.15 210)` (Cyan)
- Accent: `oklch(0.75 0.15 85)` (Amber)

**Typography**: System font stack (-apple-system, SF Pro Text, Segoe UI)
**Spacing**: 4px base unit scale (0.25rem → 8rem)
**Shadows**: Elevation system (xs → 2xl)
**Border Radius**: 4px → 16px range
**Animation**: 150ms (fast), 250ms (base), 350ms (slow)

### Component Library

All UI components follow the official specification:
- Buttons (primary, secondary, ghost variants)
- Input fields (text, email, search)
- Cards (base, hover states, shadows)
- Navigation (tabs, breadcrumbs, menus)
- Badges and pills
- Modals and overlays

### Accessibility

**WCAG 2.2 AA Compliance:**
✅ Text contrast: 4.5:1 minimum
✅ UI elements: 3:1 minimum
✅ Focus indicators: Visible on all interactive elements
✅ Keyboard navigation: Full support
✅ Screen reader: Semantic HTML + ARIA labels

### Visual Consistency

This project will visually integrate with the PROJECTS_all ecosystem,
appearing as "another page of the same app" to users.
```

---

### **Step 3: Implement Design Tokens**

**Option A: CSS Variables (Recommended)**

```css
/* Import from specification */
:root {
  /* Primary Colors */
  --primary: oklch(0.60 0.18 270);
  --primary-light: oklch(0.70 0.18 270);
  --primary-dark: oklch(0.50 0.18 270);
  --primary-muted: oklch(0.95 0.03 270);

  /* Secondary Colors */
  --secondary: oklch(0.65 0.15 210);
  --secondary-light: oklch(0.75 0.15 210);
  --secondary-dark: oklch(0.55 0.15 210);
  --secondary-muted: oklch(0.95 0.03 210);

  /* Accent Colors */
  --accent: oklch(0.75 0.15 85);
  --accent-light: oklch(0.85 0.15 85);
  --accent-dark: oklch(0.65 0.15 85);
  --accent-muted: oklch(0.95 0.03 85);

  /* Neutrals */
  --background: oklch(0.98 0.01 270);
  --surface: oklch(1.00 0.00 270);
  --text: oklch(0.15 0.02 270);
  --text-secondary: oklch(0.45 0.02 270);
  --border: oklch(0.88 0.01 270);

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  --text-base: 1rem;
  --font-medium: 500;

  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;

  /* Shadows */
  --shadow-md: 0 4px 6px -1px oklch(0.15 0 0 / 0.1);

  /* Border Radius */
  --radius-lg: 0.5rem;

  /* Animation */
  --duration-base: 250ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}

/* Dark Mode */
[data-theme="dark"] {
  --primary: oklch(0.65 0.18 270);
  --background: oklch(0.15 0.01 270);
  --surface: oklch(0.18 0.01 270);
  --text: oklch(0.95 0.01 270);
  --text-secondary: oklch(0.70 0.01 270);
  --border: oklch(0.28 0.01 270);
}
```

**Option B: Load JSON Theme**

```javascript
// Load theme definition
import defaultTheme from '@central-mcp/oklch-ui-system/default-theme.json';

// Apply to Tailwind
module.exports = {
  theme: {
    extend: {
      colors: defaultTheme.colors.light
    }
  }
};
```

---

### **Step 4: Implement Components**

**Button Example (following specification):**

```css
.btn {
  /* Base from spec */
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-medium);

  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;

  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
}

.btn-primary {
  background: var(--primary);
  color: oklch(1 0 0); /* White text */
}

.btn-primary:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-muted), 0 0 0 4px var(--primary);
}
```

**Input Example:**

```css
.input {
  font-family: var(--font-sans);
  font-size: var(--text-base);

  width: 100%;
  padding: var(--space-3) var(--space-4);

  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);

  transition: all var(--duration-base) var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-muted), 0 0 0 4px var(--primary);
}
```

---

### **Step 5: Validate Accessibility**

**Agent Checklist:**

```markdown
✅ All text meets 4.5:1 contrast minimum
✅ Interactive elements meet 3:1 contrast
✅ Focus indicators visible (3:1 contrast with background)
✅ All interactive elements keyboard accessible
✅ Semantic HTML used (nav, main, article, button, etc.)
✅ ARIA labels added where needed
✅ Alt text on all images
✅ Form labels properly associated
```

**Validation Tools:**

```javascript
// Agent can reference OKLCH-LIVE-DEPENDENCY-SYSTEM.html
// for contrast calculations and dependency visualization

// Contrast formula (from spec):
function getContrast(color1, color2) {
  const lum1 = color1.l ** 2.2;
  const lum2 = color2.l ** 2.2;
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Must be >= 4.5 for text
// Must be >= 3.0 for UI elements
```

---

## 🎨 CUSTOMIZATION GUIDELINES

### **When Project Needs Custom Brand Colors**

**✅ DO:**
1. Keep the structure (design tokens, component patterns)
2. Replace primary/secondary/accent hues only
3. Maintain WCAG compliance
4. Test in Studio Playground before implementing

**Example:**

```css
:root {
  /* Custom brand: Teal instead of Purple */
  --primary: oklch(0.60 0.18 180); /* Teal */
  --secondary: oklch(0.65 0.15 240); /* Keep analogous relationship */
  --accent: oklch(0.75 0.15 150); /* Complementary offset */

  /* Keep all other tokens unchanged */
  --background: oklch(0.98 0.01 270);
  /* ... rest from spec */
}
```

**❌ DON'T:**
- Change spacing scale (breaks ecosystem consistency)
- Change typography system (breaks visual cohesion)
- Ignore WCAG requirements (accessibility non-negotiable)
- Deviate from component patterns (breaks familiarity)

---

### **Testing Custom Themes**

**Step 1:** Open Studio Playground
```bash
open /Users/lech/PROJECTS_all/PROJECT_central-mcp/OKLCH-UI-SYSTEM/STUDIO-PLAYGROUND.html
```

**Step 2:** Adjust colors with sliders

**Step 3:** Export validated theme
- Click "📥 Export Theme"
- Choose format (CSS, JSON, Tailwind)
- Copy to project

---

## 📊 INTEGRATION EXAMPLES

### **React + TypeScript Project**

```typescript
// SPECBASE excerpt
export const designSystem = {
  standard: 'Central-MCP Default UI System v1.0.0',
  tokens: {
    colors: {
      primary: 'oklch(0.60 0.18 270)',
      // ... from spec
    },
    typography: {
      fontFamily: {
        sans: '-apple-system, BlinkMacSystemFont, ...',
      },
      fontSize: {
        base: '1rem',
        // ... from spec
      }
    }
  }
};
```

---

### **Next.js + Tailwind Project**

```javascript
// tailwind.config.js (in SPECBASE)
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'oklch(0.60 0.18 270)',
        secondary: 'oklch(0.65 0.15 210)',
        accent: 'oklch(0.75 0.15 85)',
        // ... from default-theme.json
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', ...],
      },
      spacing: {
        // 4px base unit from spec
      }
    }
  }
};
```

---

### **Vue + Vite Project**

```css
/* SPECBASE: global.css */
@import '@central-mcp/oklch-ui-system/default-theme.css';

/* All components automatically inherit tokens */
```

---

## 🔧 AGENT AUTOMATION

### **Automatically Include in SPECBASE**

**Trigger:** When agent writes new SPECBASE

**Action:**
1. Read `/OKLCH-UI-SYSTEM/DEFAULT-UI-SYSTEM.md`
2. Extract relevant sections for project type
3. Include "## 🎨 UI System" section in SPECBASE
4. Reference design tokens, components, accessibility requirements
5. Note any customizations (if brand colors differ)

**Example Prompt for Agent:**

```
When writing SPECBASE for [PROJECT_NAME], automatically include:

1. UI System section referencing Central-MCP Default UI System v1.0.0
2. Design token specifications (colors, typography, spacing)
3. Component patterns (buttons, inputs, cards)
4. Accessibility requirements (WCAG 2.2 AA)
5. Note: "Project visually integrates with PROJECTS_all ecosystem"

Read specification from:
/Users/lech/PROJECTS_all/PROJECT_central-mcp/OKLCH-UI-SYSTEM/DEFAULT-UI-SYSTEM.md
```

---

## 🎯 SUCCESS CRITERIA

**Agent has successfully integrated Default UI System when:**

1. ✅ **SPECBASE includes** "UI System" section with reference
2. ✅ **Design tokens match** specification (or documented customization)
3. ✅ **Components follow** official patterns (buttons, inputs, cards)
4. ✅ **Accessibility validated** (4.5:1 text, 3:1 UI, focus indicators)
5. ✅ **Dark mode supported** (if applicable to project)
6. ✅ **Visual consistency** maintained with ecosystem

---

## 📞 REFERENCE QUICK LINKS

**For Agents:**

```bash
# Complete specification
cat /OKLCH-UI-SYSTEM/DEFAULT-UI-SYSTEM.md

# JSON theme definition
cat /OKLCH-UI-SYSTEM/default-theme.json

# Interactive studio (for testing)
open /OKLCH-UI-SYSTEM/STUDIO-PLAYGROUND.html

# Color dependencies
open /OKLCH-UI-SYSTEM/systems/OKLCH-LIVE-DEPENDENCY-SYSTEM.html

# Component examples
open /OKLCH-UI-SYSTEM/galleries/OKLCH-COMPONENTS-GALLERY.html
```

---

## 🌟 THE VISION

**Every project in PROJECTS_all will:**
- Look professionally designed (no "developer UI")
- Feel part of unified ecosystem (visual harmony)
- Meet accessibility standards (WCAG 2.2 AA)
- Work beautifully in light and dark modes
- Require zero UI design decisions to start

**Users experience:**
- "These all look like pages of the same app!"
- Instant familiarity across projects
- Professional quality everywhere
- Consistent, trustworthy experience

---

## 🤖 AGENT DECISION TREE

```
┌─ Writing SPECBASE?
│
├─ YES → Include "UI System" section
│        ├─ Reference Default UI System v1.0.0
│        ├─ Copy design tokens
│        ├─ Document customizations (if any)
│        └─ Include accessibility requirements
│
├─ Implementing UI?
│        ├─ Read component specifications
│        ├─ Use design tokens
│        ├─ Follow interaction patterns
│        └─ Validate WCAG compliance
│
├─ Custom branding needed?
│        ├─ Keep structure + patterns
│        ├─ Replace color hues only
│        ├─ Test in Studio Playground
│        └─ Export validated theme
│
└─ Backend/data task?
         └─ Skip (not UI-related)
```

---

## 🎉 SUMMARY

**Default UI System ensures:**
- ✅ Professional quality by default
- ✅ Visual consistency across 60 projects
- ✅ Guaranteed accessibility (WCAG 2.2 AA)
- ✅ Zero UI design needed to start
- ✅ Full customization when needed
- ✅ "Different pages of same app" experience

**Agent responsibility:**
- Read specification when writing SPECBASE
- Include UI System section automatically
- Implement components following patterns
- Validate accessibility compliance
- Maintain ecosystem visual harmony

---

**🎨 Central-MCP Default UI System - Making every project professionally designed by default!**

**Version**: 1.0.0
**Location**: `/OKLCH-UI-SYSTEM/`
**Status**: ✅ Official Standard for All PROJECTS_all
