#!/usr/bin/env python3
"""
Surgical color palette fix for ULTIMATE-UI-STUDIO-V2.html
Replaces ugly initial colors with beautiful professional defaults
"""

import re

FILE_PATH = '/Users/lech/PROJECTS_all/PROJECT_central-mcp/OKLCH-UI-SYSTEM/ULTIMATE-UI-STUDIO-V2.html'

def main():
    print("🎨 Applying beautiful color palette fix...")

    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # BACKUP
    print("📦 Creating backup...")
    with open(FILE_PATH + '.backup', 'w', encoding='utf-8') as f:
        f.write(content)

    # FIX 1: CSS Variables in :root (lines ~25-37)
    print("🎨 Fixing CSS :root variables...")

    css_old = r'''        :root \{
            /\* Active color groups \*/
            --primary: oklch\([^)]+\);
            --secondary: oklch\([^)]+\);
            --accent: oklch\([^)]+\);
            --background: oklch\([^)]+\);
            --surface: oklch\([^)]+\);
            --text: oklch\([^)]+\);'''

    css_new = '''        :root {
            /* Active color groups - BEAUTIFUL LIGHT MODE DEFAULTS */
            --primary: oklch(0.55 0.15 240);       /* Elegant blue */
            --secondary: oklch(0.60 0.12 280);     /* Soft purple */
            --accent: oklch(0.65 0.18 160);        /* Fresh teal */
            --background: oklch(0.98 0.01 270);    /* Soft light */
            --surface: oklch(0.95 0.01 270);       /* Subtle card color */
            --text: oklch(0.20 0.01 270);          /* Readable dark */'''

    content = re.sub(css_old, css_new, content, flags=re.MULTILINE)

    # FIX 2: JavaScript colorPalette initialization
    print("🎨 Fixing JavaScript colorPalette...")

    js_old = r'''        // COLOR STORAGE FOR BOTH MODES \(Counter-Weight System\)
        let colorPalette = \{
            light: \{
                primary: \{ l: [^,]+, c: [^,]+, h: [^}]+ \},
                secondary: \{ l: [^,]+, c: [^,]+, h: [^}]+ \},
                accent: \{ l: [^,]+, c: [^,]+, h: [^}]+ \},
                background: \{ l: [^,]+, c: [^,]+, h: [^}]+ \},
                surface: \{ l: [^,]+, c: [^,]+, h: [^}]+ \},
                text: \{ l: [^,]+, c: [^,]+, h: [^}]+ \}
            \},'''

    js_new = '''        // COLOR STORAGE FOR BOTH MODES (Counter-Weight System)
        let colorPalette = {
            light: {
                primary: { l: 0.55, c: 0.15, h: 240 },    // Elegant blue
                secondary: { l: 0.60, c: 0.12, h: 280 },  // Soft purple
                accent: { l: 0.65, c: 0.18, h: 160 },     // Fresh teal
                background: { l: 0.98, c: 0.01, h: 270 }, // Soft light
                surface: { l: 0.95, c: 0.01, h: 270 },    // Subtle card
                text: { l: 0.20, c: 0.01, h: 270 }        // Readable dark
            },'''

    content = re.sub(js_old, js_new, content, flags=re.MULTILINE | re.DOTALL)

    # FIX 3: Add scaffold-light class initialization
    print("🎨 Adding scaffold-light initialization...")

    init_marker = "        // Initial selection\n        selectColorGroup('primary');"

    if init_marker in content:
        init_new = init_marker + '''

        // Initialize with LIGHT MODE scaffold theme
        const studioElement = document.querySelector('.studio');
        if (studioElement && currentMode === 'light') {
            studioElement.classList.add('scaffold-light');
        }'''

        content = content.replace(init_marker, init_new)
    else:
        print("⚠️  Warning: Could not find initialization marker")

    # SAVE
    print("💾 Saving fixed file...")
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ Fix applied successfully!")
    print(f"📦 Backup saved to: {FILE_PATH}.backup")
    print("")
    print("🎨 NEW BEAUTIFUL COLORS:")
    print("   Primary:    oklch(0.55 0.15 240) - Elegant blue")
    print("   Secondary:  oklch(0.60 0.12 280) - Soft purple")
    print("   Accent:     oklch(0.65 0.18 160) - Fresh teal")
    print("   Background: oklch(0.98 0.01 270) - Soft light")
    print("   Surface:    oklch(0.95 0.01 270) - Subtle card")
    print("   Text:       oklch(0.20 0.01 270) - Readable dark")
    print("")
    print("🚀 Refresh browser to see STUNNING new interface!")

if __name__ == '__main__':
    main()
