# 🎨 OKLCH System - Architecture Dependency Map

**Visual representation of how all components, galleries, and systems relate**

---

## 🏗️ ARCHITECTURAL LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 4: COMPLETE SYSTEMS                    │
│  ┌────────────────────────┐  ┌───────────────────────────────┐ │
│  │ Hyper-Dimensional      │  │ Live Dependency System        │ │
│  │ System                 │  │ (Real-time Cascading)         │ │
│  │ (Semantic × Classical) │  │                               │ │
│  └────────────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 3: RULE ENGINE & DSL                   │
│  ┌────────────────────────┐  ┌───────────────────────────────┐ │
│  │ Color System           │  │ Rule Engine Complete          │ │
│  │ Architect              │  │ (DSL Parser & Evaluator)      │ │
│  │ (Documentation)        │  │                               │ │
│  └────────────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: INTERACTIVE GALLERIES               │
│  ┌───────────────┐ ┌──────────────────┐ ┌───────────────────┐ │
│  │ Components    │ │ Counter-Weight   │ │ Design System     │ │
│  │ Gallery       │ │ Gallery          │ │ Gallery           │ │
│  │               │ │ (Auto-Balance)   │ │ (3-Panel System)  │ │
│  └───────────────┘ └──────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: CORE COMPONENTS                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Hue      │  │ Chroma   │  │ Lightness│  │ 3D           │  │
│  │ Wheel    │  │ Selector │  │ Selector │  │ Visualization│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 COMPONENT DEPENDENCY GRAPH

```
OKLCH-HUE-WHEEL-COMPONENT.html ─────┐
                                     ├──> OKLCH-COMPONENTS-GALLERY.html
OKLCH-CHROMA-SELECTOR-COMPONENT.html ┤
                                     │
OKLCH-LIGHTNESS-SELECTOR-COMPONENT.html ┤
                                     │
OKLCH-3D-SNIPPET.html ──────────────┘


OKLCH-COMPONENTS-GALLERY.html ──────┐
                                     │
                                     ├──> OKLCH-COUNTERWEIGHT-GALLERY.html
                                     │    (Miniature versions + Balancing)
                                     │
                                     └──> OKLCH-DESIGN-SYSTEM-GALLERY.html
                                          (Full selectors + 3D viz)


OKLCH-COUNTERWEIGHT-GALLERY.html ───┐
                                     │
                                     ├──> OKLCH-COLOR-SYSTEM-ARCHITECT.html
                                     │    (Documents concepts)
                                     │
                                     └──> OKLCH-RULE-ENGINE-COMPLETE.html
                                          (Implements DSL)


OKLCH-RULE-ENGINE-COMPLETE.html ────┐
                                     │
                                     ├──> OKLCH-HYPERDIMENSIONAL-SYSTEM.html
                                     │    (Uses rules + weight matrix)
                                     │
                                     └──> OKLCH-LIVE-DEPENDENCY-SYSTEM.html
                                          (Uses rules + cascading)
```

---

## 🔄 CONCEPTUAL EVOLUTION

```
Step 1: Individual Components (Foundation)
┌──────────────────────────────────────────────────────┐
│ • Hue Wheel (circular picker)                        │
│ • Chroma Selector (2D rectangular)                   │
│ • Lightness Selector (vertical gradient)            │
│ • 3D Visualization (Three.js gamut)                 │
└──────────────────────────────────────────────────────┘
              ↓
Step 2: Component Galleries (Integration)
┌──────────────────────────────────────────────────────┐
│ • Components Gallery (showcase all 4)                │
│ • Counter-Weight Gallery (auto-balance + miniatures) │
│ • Design System Gallery (3-panel professional)       │
└──────────────────────────────────────────────────────┘
              ↓
Step 3: Rule-Based Architecture (Automation)
┌──────────────────────────────────────────────────────┐
│ • Color System Architect (rule documentation)        │
│ • Rule Engine Complete (DSL parser + evaluator)      │
└──────────────────────────────────────────────────────┘
              ↓
Step 4: Complete Systems (Professional Solutions)
┌──────────────────────────────────────────────────────┐
│ • Hyper-Dimensional System (matrix generation)       │
│ • Live Dependency System (real-time cascading)       │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 FEATURE INHERITANCE MAP

### **OKLCH-HYPERDIMENSIONAL-SYSTEM.html** inherits from:

```
Counter-Weight Balancing ──────> From OKLCH-COUNTERWEIGHT-GALLERY.html
  ├─ Weight adjustments
  ├─ WCAG enforcement
  └─ Threshold detection

Rule-Based Generation ────────> From OKLCH-RULE-ENGINE-COMPLETE.html
  ├─ DSL parsing
  ├─ Arithmetic operations
  └─ Mode-specific rules

Component Integration ────────> From OKLCH-COMPONENTS-GALLERY.html
  ├─ Color selectors
  ├─ Live preview
  └─ Export functionality

NEW INNOVATION:
  └─ Semantic × Classical Matrix (4×5 = 20 configs)
```

### **OKLCH-LIVE-DEPENDENCY-SYSTEM.html** inherits from:

```
Counter-Weight Balancing ──────> From OKLCH-COUNTERWEIGHT-GALLERY.html
  ├─ Auto-adjustments
  ├─ WCAG enforcement
  └─ Threshold triggers

Rule-Based DSL ───────────────> From OKLCH-RULE-ENGINE-COMPLETE.html
  ├─ Relationship definitions
  ├─ Constraint enforcement
  └─ Mode switching

Component Display ────────────> From OKLCH-DESIGN-SYSTEM-GALLERY.html
  ├─ 3-panel layout
  ├─ Live preview
  └─ Status indicators

NEW INNOVATIONS:
  ├─ Directional Cascading (same/opposite direction)
  ├─ Scope Tags (GLOBAL vs COMPONENT)
  ├─ Dependency Visualization (right panel)
  └─ Component Mapping (usage display)
```

---

## 🧩 MODULE DEPENDENCIES

### **Components Layer** (No Dependencies)
```
OKLCH-HUE-WHEEL-COMPONENT.html
├─ Dependencies: None (standalone)
├─ Exports: Custom event 'huechange'
└─ Used by: All galleries

OKLCH-CHROMA-SELECTOR-COMPONENT.html
├─ Dependencies: None (standalone)
├─ Exports: Custom event 'chromachange'
└─ Used by: All galleries

OKLCH-LIGHTNESS-SELECTOR-COMPONENT.html
├─ Dependencies: None (standalone)
├─ Exports: Custom event 'lightnesschange'
└─ Used by: All galleries

OKLCH-3D-SNIPPET.html
├─ Dependencies: Three.js r180, Delaunator, Culori 3.3.0
├─ Import: Via import maps (CDN)
└─ Used by: Design System Gallery, documentation
```

### **Galleries Layer** (Depends on Components)
```
OKLCH-COMPONENTS-GALLERY.html
├─ Uses: All 4 components (full size)
├─ Adds: Integration examples, copy buttons
└─ Purpose: Documentation and showcase

OKLCH-COUNTERWEIGHT-GALLERY.html
├─ Uses: All 4 components (miniature 1/3 size)
├─ Adds: Weight system, WCAG enforcement
└─ Introduces: Counter-weight concept

OKLCH-DESIGN-SYSTEM-GALLERY.html
├─ Uses: All 4 components (full size)
├─ Adds: 3-panel layout, theme presets
└─ Purpose: Production-ready system
```

### **Rule Engine Layer** (Depends on Galleries)
```
OKLCH-COLOR-SYSTEM-ARCHITECT.html
├─ Uses: Concepts from Counter-Weight Gallery
├─ Documents: Rule syntax and families
└─ Purpose: Visual documentation

OKLCH-RULE-ENGINE-COMPLETE.html
├─ Implements: DSL parser and evaluator
├─ Uses: Balancing logic from galleries
└─ Enables: Programmatic color generation
```

### **Systems Layer** (Depends on Everything)
```
OKLCH-HYPERDIMENSIONAL-SYSTEM.html
├─ Uses: Rule Engine (DSL evaluation)
├─ Uses: Counter-Weight (balancing)
├─ Uses: Components (selection)
├─ Adds: Semantic × Classical matrix
└─ Purpose: Instant professional themes

OKLCH-LIVE-DEPENDENCY-SYSTEM.html
├─ Uses: Rule Engine (relationships)
├─ Uses: Counter-Weight (balancing)
├─ Uses: Components (controls)
├─ Uses: Design System (3-panel layout)
├─ Adds: Directional cascading, scope tags
└─ Purpose: Real-time dependency visualization
```

---

## 📚 DOCUMENTATION DEPENDENCIES

```
OKLCH-SYSTEM-INDEX.md
├─ References: All files (master catalog)
├─ Purpose: Entry point and navigation
└─ Dependencies: None

OKLCH-COMPLETE-SYSTEM-GUIDE.md
├─ Documents: All components and galleries
├─ Includes: Rule syntax, formulas
└─ Dependencies: Understanding all layers

OKLCH-HYPERDIMENSIONAL-GUIDE.md
├─ Documents: Hyper-Dimensional System
├─ Explains: Matrix, weights, dimensions
└─ Dependencies: Understanding Layer 3 & 4

OKLCH-LIVE-DEPENDENCY-GUIDE.md
├─ Documents: Live Dependency System
├─ Explains: Cascading, scope, dependencies
└─ Dependencies: Understanding all innovations
```

---

## 🔧 TECHNOLOGY STACK DEPENDENCIES

```
Core Technologies:
├─ OKLCH Color Space (perceptually uniform)
├─ CSS Variables (design tokens)
├─ Custom Events (component communication)
└─ ES6 Modules (via import maps)

External Libraries:
├─ Three.js r180 (3D visualization)
├─ Delaunator (triangulation)
└─ Culori 3.3.0 (color conversions)

Import Maps:
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/",
    "delaunator": "https://cdn.jsdelivr.net/npm/delaunator@5.0.1/+esm",
    "culori": "https://cdn.jsdelivr.net/npm/culori@3.3.0/bundled/culori.mjs"
  }
}
```

---

## 🎯 USAGE FLOW DIAGRAM

```
User Journey 1: Learn System
    ↓
OKLCH-SYSTEM-INDEX.md (master index)
    ↓
OKLCH-COMPONENTS-GALLERY.html (see individual components)
    ↓
OKLCH-DESIGN-SYSTEM-GALLERY.html (see complete system)
    ↓
OKLCH-HYPERDIMENSIONAL-SYSTEM.html (generate first theme)


User Journey 2: Generate Theme
    ↓
OKLCH-HYPERDIMENSIONAL-SYSTEM.html (direct access)
    ↓
Pick Semantic Purpose (General/Dashboard/Marketing/Editorial)
    ↓
Pick Classical Palette (Mono/Analogous/Complementary/Triadic/Tetradic)
    ↓
Generate System (30 seconds)
    ↓
Export CSS/JSON (integrate to project)


User Journey 3: Understand Dependencies
    ↓
OKLCH-LIVE-DEPENDENCY-SYSTEM.html (direct access)
    ↓
Slide Primary Hue (watch Secondary/Accent follow)
    ↓
Slide Background Lightness (watch Text invert)
    ↓
Cross L=0.5 threshold (watch mode flip)
    ↓
Read Dependency Map (understand relationships)


Developer Journey: Integrate System
    ↓
OKLCH-COMPLETE-SYSTEM-GUIDE.md (technical docs)
    ↓
OKLCH-RULE-ENGINE-COMPLETE.html (understand DSL)
    ↓
Copy Components (standalone files)
    ↓
Implement Rules (custom relationships)
    ↓
Apply to Project (CSS variables / React / Vue)
```

---

## 🔗 CROSS-FILE REFERENCES

### **Shared Concepts:**

**Counter-Weight Balancing** (defined in OKLCH-COUNTERWEIGHT-GALLERY.html)
- Used by: Hyper-Dimensional System
- Used by: Live Dependency System
- Documented in: Complete System Guide

**Rule-Based DSL** (defined in OKLCH-RULE-ENGINE-COMPLETE.html)
- Used by: Color System Architect (documentation)
- Used by: Hyper-Dimensional System (generation)
- Used by: Live Dependency System (cascading)
- Documented in: Complete System Guide

**WCAG Enforcement** (first in OKLCH-COUNTERWEIGHT-GALLERY.html)
- Used by: All galleries
- Used by: Both complete systems
- Formula: Ensure 4.5:1 contrast ratio

**Threshold Detection** (first in OKLCH-COUNTERWEIGHT-GALLERY.html)
- Used by: Hyper-Dimensional System (mode switching)
- Used by: Live Dependency System (mode flip trigger)
- Threshold: Background.L = 0.5

**Semantic Groupings** (defined in OKLCH-HYPERDIMENSIONAL-SYSTEM.html)
- Categories: General UI, Dashboard, Marketing, Editorial
- Used by: Live Dependency System (color roles)
- Documented in: Hyper-Dimensional Guide

**Classical Palettes** (defined in OKLCH-HYPERDIMENSIONAL-SYSTEM.html)
- Types: Mono, Analogous, Complementary, Triadic, Tetradic
- Used by: All color generation systems
- Documented in: Hyper-Dimensional Guide

**Directional Cascading** (defined in OKLCH-LIVE-DEPENDENCY-SYSTEM.html)
- Same Direction: Harmonious colors (Primary → Secondary)
- Opposite Direction: Contrast enforcement (Background ↔ Text)
- Documented in: Live Dependency Guide

---

## 🎉 INNOVATION TIMELINE

```
Innovation 1: Standalone Components (Layer 1)
├─ Breakthrough: Zero dependencies, custom events
└─ Files: All *-COMPONENT.html

Innovation 2: Counter-Weight Balancing (Layer 2)
├─ Breakthrough: Auto-adjusting harmonization
└─ File: OKLCH-COUNTERWEIGHT-GALLERY.html

Innovation 3: Rule-Based DSL (Layer 3)
├─ Breakthrough: Define once, compute everything
└─ File: OKLCH-RULE-ENGINE-COMPLETE.html

Innovation 4: Hyper-Dimensional Matrix (Layer 4)
├─ Breakthrough: 30 seconds vs 4-8 hours
└─ File: OKLCH-HYPERDIMENSIONAL-SYSTEM.html

Innovation 5: Live Dependency System (Layer 4) 🆕
├─ Breakthrough: Real-time directional cascading
└─ File: OKLCH-LIVE-DEPENDENCY-SYSTEM.html
```

---

**🎨 Complete architectural map for understanding system relationships**
**Last Updated**: 2025-10-11
**Status**: ✅ Production Ready
