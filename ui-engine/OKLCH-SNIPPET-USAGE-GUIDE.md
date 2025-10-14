# 📦 OKLCH 3D Snippet - Usage Guide

## ✅ Copy-Paste Ready Snippet

**File:** `/tmp/OKLCH-3D-SNIPPET.html`

---

## 🚀 Quick Start (3 Steps)

### 1. Copy the Snippet
Open `/tmp/OKLCH-3D-SNIPPET.html` and copy everything.

### 2. Paste into Your HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>

    <!-- PASTE IMPORT MAP HERE (from snippet) -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
        }
    }
    </script>

    <!-- PASTE STYLES HERE (from snippet) -->
    <style>
        /* ... all styles from snippet ... */
    </style>
</head>
<body>
    <!-- Your existing content -->
    <h1>My Page</h1>

    <!-- PASTE HTML + SCRIPT HERE (from snippet) -->
    <canvas id="oklchCanvas"></canvas>
    <div id="oklchControls">...</div>
    <script type="module">...</script>
</body>
</html>
```

### 3. Done!
Open in browser. The 3D OKLCH color space will appear.

---

## 📋 Usage Examples

### Example 1: Full Page Background
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OKLCH 3D Demo</title>

    <!-- Import map -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
        }
    }
    </script>

    <!-- Paste all snippet styles here -->
    <style>
        body { margin: 0; font-family: sans-serif; }
        /* ... rest of snippet styles ... */
    </style>
</head>
<body>
    <!-- Paste snippet HTML + script here -->
    <canvas id="oklchCanvas"></canvas>
    <div id="oklchControls">...</div>
    <script type="module">...</script>
</body>
</html>
```

### Example 2: Embed in Existing Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Portfolio</title>

    <!-- ADD: Import map -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
        }
    }
    </script>

    <!-- Your existing styles -->
    <style>
        .my-header { background: blue; }
    </style>

    <!-- ADD: Snippet styles -->
    <style>
        #oklchCanvas { /* ... */ }
        #oklchControls { /* ... */ }
        /* ... rest of snippet styles ... */
    </style>
</head>
<body>
    <!-- Your existing content -->
    <header class="my-header">My Portfolio</header>

    <main>
        <h1>Welcome</h1>
        <p>Check out the OKLCH color space visualization!</p>
    </main>

    <!-- ADD: Snippet HTML + script -->
    <canvas id="oklchCanvas"></canvas>
    <div id="oklchControls">...</div>
    <script type="module">...</script>

    <footer>© 2025</footer>
</body>
</html>
```

### Example 3: Component in Section
```html
<!DOCTYPE html>
<html>
<head>
    <title>Design Tools</title>

    <!-- Import map -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
        }
    }
    </script>

    <!-- Snippet styles with modifications for section -->
    <style>
        #colorToolSection {
            position: relative;
            width: 100%;
            height: 600px;
            background: #0a0a0a;
            overflow: hidden;
        }

        /* MODIFY: Make canvas relative to section */
        #oklchCanvas {
            position: absolute; /* changed from fixed */
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }

        /* MODIFY: Make controls absolute to section */
        #oklchControls {
            position: absolute; /* changed from fixed */
            top: 20px;
            right: 20px;
            /* ... rest same ... */
        }

        /* ... rest of snippet styles ... */
    </style>
</head>
<body>
    <header>
        <h1>Design Tools Gallery</h1>
    </header>

    <!-- Wrap snippet in section -->
    <section id="colorToolSection">
        <canvas id="oklchCanvas"></canvas>
        <div id="oklchControls">...</div>
        <script type="module">...</script>
    </section>

    <section>
        <h2>Other Tools</h2>
        <!-- More content -->
    </section>
</body>
</html>
```

---

## 🎨 Customization

### Change Position
```css
/* Move controls to left side */
#oklchControls {
    left: 20px;   /* instead of right: 20px */
    right: auto;
}

/* Move controls to bottom */
#oklchControls {
    top: auto;
    bottom: 20px;
}
```

### Change Size
```css
/* Make controls smaller */
#oklchControls {
    min-width: 200px;
    padding: 1rem;
    font-size: 0.85rem;
}

/* Make canvas smaller (in section mode) */
#colorToolSection {
    height: 400px; /* instead of 600px */
}
```

### Change Colors (Dark Mode)
```css
#oklchControls {
    background: oklch(10% 0.01 250 / 0.95); /* darker */
    border-color: oklch(25% 0.02 250); /* darker border */
}
```

### Hide/Show Controls
```javascript
// Add button to toggle controls
<button onclick="document.getElementById('oklchControls').style.display =
    document.getElementById('oklchControls').style.display === 'none' ? 'block' : 'none'">
    Toggle Controls
</button>
```

---

## 🔧 Advanced Integration

### React Component
```jsx
import { useEffect } from 'react';

export function OklchPicker() {
    useEffect(() => {
        // Paste the entire snippet script here
        (async () => {
            // ... snippet code ...
        })();
    }, []);

    return (
        <>
            <canvas id="oklchCanvas"></canvas>
            <div id="oklchControls">
                {/* ... snippet HTML ... */}
            </div>
        </>
    );
}

// In your main App.js, add import map to index.html:
// <script type="importmap">...</script>
```

### Vue Component
```vue
<template>
    <div>
        <canvas id="oklchCanvas"></canvas>
        <div id="oklchControls">
            <!-- ... snippet HTML ... -->
        </div>
    </div>
</template>

<script>
export default {
    mounted() {
        // Paste snippet script here
        (async () => {
            // ... snippet code ...
        })();
    }
}
</script>

<style scoped>
/* Paste snippet styles here */
</style>

<!-- In index.html, add: -->
<!-- <script type="importmap">...</script> -->
```

### Next.js Page
```jsx
// pages/color-picker.js
import Head from 'next/head';
import { useEffect } from 'react';

export default function ColorPicker() {
    useEffect(() => {
        // Paste snippet script here
        (async () => {
            // ... snippet code ...
        })();
    }, []);

    return (
        <>
            <Head>
                <title>OKLCH 3D Picker</title>
                {/* Import map */}
                <script type="importmap" dangerouslySetInnerHTML={{
                    __html: `{
                        "imports": {
                            "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
                            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
                        }
                    }`
                }} />
            </Head>

            <canvas id="oklchCanvas"></canvas>
            <div id="oklchControls">
                {/* ... snippet HTML ... */}
            </div>

            <style jsx>{`
                /* Paste snippet styles here */
            `}</style>
        </>
    );
}
```

---

## 🎯 API / Events

### Get Current Color
```javascript
// Add this to your page after snippet loads
const sliderL = document.getElementById('oklchSliderL');
const sliderC = document.getElementById('oklchSliderC');
const sliderH = document.getElementById('oklchSliderH');

function getCurrentColor() {
    return {
        l: parseFloat(sliderL.value) / 100,
        c: parseFloat(sliderC.value) / 100,
        h: parseFloat(sliderH.value),
        oklch: `oklch(${sliderL.value / 100} ${sliderC.value / 100} ${sliderH.value})`,
        hex: rgbToHex(oklchToRgb(sliderL.value / 100, sliderC.value / 100, sliderH.value))
    };
}

console.log(getCurrentColor());
// { l: 0.6, c: 0.15, h: 240, oklch: "oklch(0.6 0.15 240)", hex: "#..." }
```

### Listen to Color Changes
```javascript
// Add event listeners
sliderL.addEventListener('input', (e) => {
    const color = getCurrentColor();
    console.log('Color changed:', color);
    // Call your custom function
    onColorChange(color);
});

sliderC.addEventListener('input', (e) => {
    const color = getCurrentColor();
    onColorChange(color);
});

sliderH.addEventListener('input', (e) => {
    const color = getCurrentColor();
    onColorChange(color);
});

function onColorChange(color) {
    // Your custom logic
    document.body.style.background = color.oklch;
}
```

### Set Color Programmatically
```javascript
function setColor(l, c, h) {
    document.getElementById('oklchSliderL').value = l * 100;
    document.getElementById('oklchSliderC').value = c * 100;
    document.getElementById('oklchSliderH').value = h;

    // Trigger update
    document.getElementById('oklchSliderL').dispatchEvent(new Event('input'));
}

// Example: Set to blue
setColor(0.5, 0.2, 240);
```

---

## 📊 Browser Support

**Requires:**
- Import maps support
- ES6 modules
- WebGL

**Supported Browsers:**
- ✅ Chrome 89+ (March 2021)
- ✅ Firefox 108+ (December 2022)
- ✅ Safari 16.4+ (March 2023)
- ✅ Edge 89+ (March 2021)

**Fallback for Old Browsers:**
```html
<script nomodule>
    alert('Your browser does not support ES6 modules. Please update to a modern browser.');
</script>
```

---

## 🐛 Troubleshooting

### Issue: "Failed to resolve module specifier 'three'"
**Solution:** Make sure the import map is in `<head>` or before the script.

```html
<!-- ✅ CORRECT: Import map before script -->
<head>
    <script type="importmap">...</script>
</head>
<body>
    <script type="module">...</script>
</body>

<!-- ❌ WRONG: Import map after script -->
<body>
    <script type="module">...</script>
    <script type="importmap">...</script>
</body>
```

### Issue: Canvas is blank/black
**Solution:** Check console for errors. Usually means Three.js failed to load.

### Issue: Controls don't appear
**Solution:** Check if styles are loaded. Inspect element to see if CSS is applied.

### Issue: Performance is slow
**Solution:** Reduce sampling resolution in snippet:

```javascript
// Change this line in snippet:
for (let x = 0; x <= 1; x += 0.05) {  // default

// To this (coarser, faster):
for (let x = 0; x <= 1; x += 0.1) {  // 2x faster
```

---

## 📦 Snippet Contents

**Total Size:** ~8KB (minified)
- Import map: ~200 bytes
- Styles: ~2KB
- HTML: ~800 bytes
- JavaScript: ~5KB

**Dependencies (CDN):**
- Three.js: ~600KB
- Culori: ~100KB
- Delaunator: ~5KB

**Total Download:** ~700KB (cached after first load)

---

## 🎉 That's It!

**The snippet is completely self-contained and copy-paste ready.**

Just paste it into any HTML file and you'll have Evil Martians' OKLCH 3D visualization working immediately! 🚀
