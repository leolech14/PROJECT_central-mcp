# OKLCH 3D COLOR SPACE VISUALIZATION - COMPLETE RESOURCES

## 🎯 PRIMARY RESOURCES

### **1. OKLCH.COM - Official Color Picker**
- **Live Tool**: https://oklch.com/
- **3D Model Viewer**: https://oklch.com/?3d=
- **GitHub Repository**: https://github.com/evilmartians/oklch-picker
- **Technologies**: TypeScript (71.1%), CSS (19.4%), Pug (7.5%), JavaScript (1.5%)
- **Build Tool**: Vite + pnpm
- **Rendering**: WebGL (for 3D visualization)

**Key Features:**
- Interactive 3D cylindrical color space (H as 360°, not cube)
- Drag to rotate • Scroll to zoom • Right-click to move
- Real-time color conversion (OKLCH ↔ RGB/HEX/HSL)
- P3 and Rec2020 color space support
- Perceptually uniform color system

**3D Visualization Characteristics:**
- Cylindrical shape (not cube)
- "Mountainous" appearance due to varying chroma limits at different L/H combinations
- H (hue) wraps around 360°
- L (lightness) is vertical axis
- C (chroma) is radial distance from center

---

### **2. LCH Color Picker (Related)**
- **Live Tool**: https://lch.oklch.com/
- **Same codebase as OKLCH.com**, different entry point

---

## 🔧 IMPLEMENTATION REFERENCES

### **GitHub Projects with 3D Color Space Code**

#### **1. gillesferrand/colourspace** (Python)
- **URL**: https://github.com/gillesferrand/colourspace
- **Language**: Python (NumPy + Matplotlib)
- **Purpose**: Tools for exploring the LCH color space
- **Key Features**:
  - Computes sRGB gamut boundaries: `Cmax(L,H)`
  - Visualizes human gamut (MacAdam limits)
  - Generates cross-sectional slices (L-H, C-H, L-C planes)
  - Creates perceptually-optimized colormaps
- **Jupyter Notebooks**: 5 interactive demos included

#### **2. evilmartians/oklch-picker** (TypeScript/JavaScript)
- **URL**: https://github.com/evilmartians/oklch-picker
- **Stars**: 1.5k+ | **Forks**: 90 | **Contributors**: 24
- **Build**: `pnpm install && pnpm start`
- **Deploy**: Firebase
- **3D Implementation**: Issue #28 (completed March 2023)
  - WebGL-based rendering
  - Cylindrical coordinate system
  - Mouse/keyboard rotation (incomplete)

#### **3. eero-lehtinen/oklch-color-picker** (Rust + JavaScript)
- **URL**: https://github.com/eero-lehtinen/oklch-color-picker
- **Language**: Rust (compiled to WASM) + JavaScript
- **Purpose**: Standalone desktop color picker application
- **Platform**: Cross-platform (via Rust)

---

## 📚 EDUCATIONAL RESOURCES

### **Evil Martians Blog Articles**

#### **1. "OK, OKLCH: a color picker made to help think perceptively"**
- **URL**: https://evilmartians.com/chronicles/oklch-a-color-picker-made-to-help-think-perceptively
- **Topics**:
  - Why OKLCH is superior to HSL for designers
  - No hue shift on chroma changes (unlike LCH)
  - Predictable contrast after color transformation
  - Education-first design philosophy

#### **2. "Exploring the OKLCH ecosystem and its tools"**
- **URL**: https://evilmartians.com/chronicles/exploring-the-oklch-ecosystem-and-its-tools
- **Topics**: Comprehensive overview of OKLCH tools and integrations

#### **3. "Faster WebGL/Three.js 3D graphics with OffscreenCanvas and Web Workers"**
- **URL**: https://evilmartians.com/chronicles/faster-webgl-three-js-3d-graphics-with-offscreencanvas-and-web-workers
- **Relevance**: Techniques they likely used for 3D performance optimization

---

### **Smashing Magazine**
- **Article**: "Falling For Oklch: A Love Story Of Color Spaces, Gamuts, And CSS"
- **URL**: https://www.smashingmagazine.com/2023/08/oklch-color-spaces-gamuts-css/
- **Topics**: In-depth OKLCH explanation for web designers

---

## 🎨 OKLCH THEORY & MATH

### **Color Space Conversion (from Observable by Shan Carter)**
**URL**: https://observablehq.com/@shan/oklab-color-wheel

**OKLAB → RGB Conversion:**
```javascript
oklab = (L, a, b) => {
  // Step 1: OKLAB to LMS (cone response)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  // Step 2: Cube LMS values
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // Step 3: LMS to linear RGB
  return d3.rgb(
    255 * gamma(+4.0767245293 * l - 3.3072168827 * m + 0.2307590544 * s),
    255 * gamma(-1.2681437731 * l + 2.6093323231 * m - 0.3411344290 * s),
    255 * gamma(-0.0041119885 * l - 0.7034763098 * m + 1.7068625689 * s)
  );
}

// Gamma correction (sRGB)
gamma = x => (x >= 0.0031308
  ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  : 12.92 * x)

gamma_inv = x => x >= 0.04045
  ? Math.pow((x + 0.055) / (1 + 0.055), 2.4)
  : x / 12.92
```

**OKLCH → OKLAB Conversion:**
```javascript
// OKLCH uses cylindrical coordinates
L = L  // Same lightness
a = C * cos(H * PI / 180)  // Chroma * cos(hue)
b = C * sin(H * PI / 180)  // Chroma * sin(hue)
```

---

## 🛠️ JAVASCRIPT COLOR LIBRARIES WITH OKLCH SUPPORT

### **1. Chroma.js**
- **URL**: https://gka.github.io/chroma.js/
- **OKLCH Support**: Yes (via `.oklch()` method)
- **Features**: Color conversions, scales, palettes
- **Example**:
  ```javascript
  chroma.oklch(0.5, 0.1, 180).hex()  // OKLCH → HEX
  chroma('#ff0000').oklch()          // HEX → OKLCH
  ```

### **2. ColorAide (Python, but has JS equivalent)**
- **URL**: https://facelessuser.github.io/coloraide/
- **OKLCH Support**: Comprehensive
- **Features**: Gamut mapping, interpolation, color spaces

---

## 🎯 BUILDING A 3D OKLCH VIEWER - IMPLEMENTATION GUIDE

### **Required Technologies**

1. **Three.js** (WebGL 3D library)
   - URL: https://threejs.org/
   - Examples: https://threejs.org/examples/
   - Docs: https://threejs.org/docs/

2. **Color Conversion Library**
   - Chroma.js OR custom OKLAB/OKLCH math

3. **HTML5 Canvas** (for WebGL context)

### **Architecture**

```
Cylindrical Coordinate System:
├── Y-axis: Lightness (L) [0-100]
├── Radial: Chroma (C) [0-0.37]
└── Angular: Hue (H) [0-360°]

3D Mesh Generation:
1. Iterate through L, C, H space
2. Convert OKLCH → RGB for each point
3. Check if RGB in sRGB gamut (0-255 range)
4. Generate vertices only for valid colors
5. Result: "Mountainous" cylindrical shape
```

### **Key Challenges**

1. **Gamut Boundaries**: Not all OKLCH combinations are valid sRGB colors
   - High C (chroma) values often exceed sRGB gamut
   - Need to compute `Cmax(L, H)` for each L/H combination

2. **Performance**: Millions of color points to render
   - Use vertex shaders for color computation
   - Implement Level-of-Detail (LOD) system
   - Consider OffscreenCanvas + Web Workers (per Evil Martians article)

3. **Interaction**: Smooth rotation, zoom, pan
   - Three.js OrbitControls
   - Touch support for mobile

---

## 📦 READY-TO-USE COMPONENTS

### **Observable Notebooks** (Interactive, embeddable)
- **Shan Carter's OKLAB Color Wheel**: https://observablehq.com/@shan/oklab-color-wheel
- **Embed code**: Observable provides `<iframe>` embed snippets

### **Figma Plugin**
- OKLCH color picker works in Figma with P3 color profile

---

## 🎨 OTHER OKLCH TOOLS

### **1. oklch.fyi**
- **URL**: https://oklch.fyi/
- **Features**: Generator and converter, create unique and uniform color palettes

### **2. palette-picker-beta.vercel.app**
- **URL**: https://palette-picker-beta.vercel.app/
- **Features**: okLCH color palette generator

### **3. colorpicker.dev**
- **URL**: https://colorpicker.dev/
- **Features**: Open source, supports OKLCH, HWB, HSL, HSV, RGB

---

## 🔑 KEY TAKEAWAYS FOR IMPLEMENTATION

### **Why OKLCH 3D Space Looks "Mountainous"**

The sRGB gamut in OKLCH space is NOT a perfect cylinder because:
- At low L (dark colors): Low chroma possible (narrow)
- At mid L (50%): Maximum chroma possible (widest part)
- At high L (light colors): Low chroma possible (narrow)
- Different hues have different max chroma at same L

Result: **A cylinder with varying radius = mountains and valleys**

### **Critical OKLCH Properties**

1. **Perceptually uniform**: ΔE distance = perceived color difference
2. **No hue shift**: Changing C doesn't shift H (unlike LCH)
3. **Predictable contrast**: After any color transformation
4. **Wide gamut support**: P3, Rec2020, not just sRGB
5. **CSS native**: `color: oklch(50% 0.1 180)`

---

## 📋 NEXT STEPS TO IMPLEMENT 3D VIEWER

### **Phase 1: Basic Cylindrical Visualization**
```javascript
// Pseudocode
for (L = 0; L <= 100; L += step) {
  for (H = 0; H < 360; H += step) {
    for (C = 0; C <= 0.4; C += step) {
      const rgb = oklchToRgb(L, C, H);
      if (isInGamut(rgb)) {
        addVertex(L, C, H, rgb);
      }
    }
  }
}
```

### **Phase 2: Gamut Boundary Calculation**
- Compute `Cmax(L, H)` for each L/H pair
- Only render points up to gamut boundary
- Creates the natural "mountainous" shape

### **Phase 3: Interactive Controls**
- Three.js OrbitControls
- L/C/H slice visualization (like oklch.com)
- Color picker integration

### **Phase 4: Performance Optimization**
- Vertex shaders for color computation
- LOD system for distant vertices
- Web Workers for gamut calculation

---

## 🌐 OFFICIAL LINKS SUMMARY

**Main Sites:**
- https://oklch.com/ (2D picker)
- https://oklch.com/?3d= (3D viewer)
- https://lch.oklch.com/ (LCH variant)

**GitHub Repos:**
- https://github.com/evilmartians/oklch-picker (main)
- https://github.com/gillesferrand/colourspace (Python viz)
- https://github.com/eero-lehtinen/oklch-color-picker (Rust app)

**Learn:**
- https://evilmartians.com/chronicles/oklch-a-color-picker-made-to-help-think-perceptively
- https://www.smashingmagazine.com/2023/08/oklch-color-spaces-gamuts-css/
- https://observablehq.com/@shan/oklab-color-wheel

**Tools:**
- https://chroma.js.org/ (JS color library)
- https://threejs.org/ (WebGL 3D)

---

## 💡 IMPLEMENTATION RECOMMENDATION

**Option 1: Embed oklch.com 3D viewer directly**
```html
<iframe
  src="https://oklch.com/?3d="
  width="800"
  height="600"
  frameborder="0">
</iframe>
```

**Option 2: Clone and modify evilmartians/oklch-picker**
```bash
git clone https://github.com/evilmartians/oklch-picker.git
cd oklch-picker
pnpm install
pnpm start
# Modify view/ and lib/ directories as needed
```

**Option 3: Build custom viewer with Three.js**
- Use Three.js for 3D rendering
- Use Chroma.js for color conversion
- Compute gamut boundaries with binary search
- Implement OrbitControls for interaction

---

**STATUS**: ✅ All resources located and documented
**NEXT**: Choose implementation approach and integrate into design system demo
