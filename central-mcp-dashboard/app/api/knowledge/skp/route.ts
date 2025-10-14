import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

// API endpoint to fetch knowledge data from SKP directory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    // Path to SKP directory
    const skpPath = join(process.cwd(), '../03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS');

    // Check if SKP directory exists
    try {
      await fs.access(skpPath);
    } catch {
      // Return mock data if directory doesn't exist
      return NextResponse.json({
        categories: generateMockCategories(),
        items: generateMockItems(),
        message: 'SKP directory not found - showing demo data'
      });
    }

    // Read SKP directory contents
    const skpContents = await fs.readdir(skpPath, { withFileTypes: true });

    // Process directories and files
    const categories = [];
    const items = [];

    for (const entry of skpContents) {
      if (entry.isDirectory()) {
        // Process directory as a category
        const categoryPath = join(skpPath, entry.name);
        const categoryFiles = await fs.readdir(categoryPath);

        categories.push({
          id: entry.name,
          name: formatCategoryName(entry.name),
          count: categoryFiles.length,
          type: entry.name.toLowerCase().replace(/\s+/g, '-'),
          icon: getCategoryIcon(entry.name)
        });

        // Process files in category
        for (const file of categoryFiles) {
          const filePath = join(categoryPath, file);
          const stats = await fs.stat(filePath);

          items.push({
            id: `${entry.name}-${file}`,
            title: formatItemName(file),
            description: `Knowledge pack from ${entry.name}`,
            type: getItemType(file),
            category: formatCategoryName(entry.name),
            size: formatFileSize(stats.size),
            updated: stats.mtime.toISOString().split('T')[0],
            path: filePath
          });
        }
      } else if (entry.name.endsWith('.zip') || entry.name.endsWith('.md')) {
        // Process top-level files
        const filePath = join(skpPath, entry.name);
        const stats = await fs.stat(filePath);

        items.push({
          id: `root-${entry.name}`,
          title: formatItemName(entry.name),
          description: `Standalone knowledge pack`,
          type: getItemType(entry.name),
          category: 'Documentation',
          size: formatFileSize(stats.size),
          updated: stats.mtime.toISOString().split('T')[0],
          path: filePath
        });
      }
    }

    // Filter results if requested
    let filteredItems = items;
    if (category && category !== 'all') {
      filteredItems = items.filter(item =>
        item.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (type && type !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === type);
    }

    return NextResponse.json({
      categories: categories.length > 0 ? categories : generateMockCategories(),
      items: filteredItems.length > 0 ? filteredItems : generateMockItems(),
      total: items.length,
      filtered: filteredItems.length
    });

  } catch (error) {
    console.error('Error fetching SKP data:', error);

    // Return mock data on error
    return NextResponse.json({
      categories: generateMockCategories(),
      items: generateMockItems(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error fetching SKP data - showing demo data'
    });
  }
}

// Helper functions
function formatCategoryName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatItemName(name: string): string {
  return name
    .replace(/\.(zip|md|html|json)$/i, '')
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getCategoryIcon(name: string): string {
  const icons: Record<string, string> = {
    'UI': '🎨',
    'UX': '🎨',
    'FRONTEND': '⚛️',
    'BACKEND': '⚙️',
    'API': '🔌',
    'AI': '🤖',
    'ML': '🧠',
    'DATA': '📊',
    'DATABASE': '🗄️',
    'SECURITY': '🔒',
    'DEVOPS': '🚀',
    'INFRASTRUCTURE': '☁️',
    'DOCUMENTATION': '📖',
    'TESTING': '🧪',
    'ULTRATHINK': '🧠',
    'VOICE': '🎤',
    'REALTIME': '⚡'
  };

  const upper = name.toUpperCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (upper.includes(key)) {
      return icon;
    }
  }

  return '📁';
}

function getItemType(filename: string): 'interactive' | 'components' | 'documentation' {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'html') return 'interactive';
  if (filename.includes('component')) return 'components';
  return 'documentation';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Mock data generators
function generateMockCategories() {
  return [
    { id: 'ui-systems', name: 'UI Systems', count: 15, type: 'ui', icon: '🎨' },
    { id: 'backend-apis', name: 'Backend APIs', count: 23, type: 'backend', icon: '⚙️' },
    { id: 'ai-integration', name: 'AI Integration', count: 8, type: 'ai', icon: '🤖' },
    { id: 'data-models', name: 'Data Models', count: 12, type: 'data', icon: '📊' },
    { id: 'security', name: 'Security', count: 6, type: 'security', icon: '🔒' },
    { id: 'devops', name: 'DevOps', count: 10, type: 'devops', icon: '🚀' }
  ];
}

function generateMockItems() {
  return [
    {
      id: '1',
      title: 'OKLCH Color System',
      description: 'Complete guide to modern color management with OKLCH perceptual color space',
      type: 'interactive',
      category: 'UI Systems',
      size: '2.3 MB',
      updated: '2025-10-12'
    },
    {
      id: '2',
      title: 'React Component Library',
      description: 'Reusable UI components with accessibility built-in',
      type: 'components',
      category: 'UI Systems',
      size: '1.8 MB',
      updated: '2025-10-11'
    },
    {
      id: '3',
      title: 'API Authentication Patterns',
      description: 'JWT, OAuth2, and API key best practices',
      type: 'documentation',
      category: 'Backend APIs',
      size: '856 KB',
      updated: '2025-10-10'
    },
    {
      id: '4',
      title: 'Auto-Proactive Engine',
      description: 'Self-optimizing loops for autonomous project management',
      type: 'interactive',
      category: 'AI Integration',
      size: '3.1 MB',
      updated: '2025-10-13'
    },
    {
      id: '5',
      title: 'Database Schema Design',
      description: 'Optimized SQLite schemas for multi-registry systems',
      type: 'documentation',
      category: 'Data Models',
      size: '1.2 MB',
      updated: '2025-10-09'
    },
    {
      id: '6',
      title: 'Security Audit Checklist',
      description: 'Comprehensive security validation for MCP systems',
      type: 'documentation',
      category: 'Security',
      size: '645 KB',
      updated: '2025-10-08'
    }
  ];
}