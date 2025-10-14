'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Folder, File, Package, Calendar, ChevronRight } from 'lucide-react';

// Type definitions
interface KnowledgeCategory {
  id: string;
  name: string;
  count: number;
  type: string;
  icon: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  type: 'interactive' | 'components' | 'documentation';
  category: string;
  size: string;
  updated: string;
  path?: string;
  metadata?: Record<string, any>;
}

interface KnowledgeResponse {
  categories: KnowledgeCategory[];
  items: KnowledgeItem[];
}

// Category configuration
const categoryConfig = {
  'UI/UX': { icon: '🎨', color: '#3B82F6' },
  'Frontend': { icon: '⚛️', color: '#8B5CF6' },
  'Backend': { icon: '⚙️', color: '#10B981' },
  'API': { icon: '🔌', color: '#10B981' },
  'AI/ML': { icon: '🤖', color: '#8B5CF6' },
  'Machine Learning': { icon: '🧠', color: '#8B5CF6' },
  'Data': { icon: '📊', color: '#06B6D4' },
  'Database': { icon: '🗄️', color: '#06B6D4' },
  'Security': { icon: '🔒', color: '#EF4444' },
  'DevOps': { icon: '🚀', color: '#F59E0B' },
  'Infrastructure': { icon: '☁️', color: '#F59E0B' },
  'Documentation': { icon: '📖', color: '#6B7280' },
  'Testing': { icon: '🧪', color: '#6B7280' },
  'default': { icon: '📁', color: '#6B7280' }
};

export default function KnowledgeSpace() {
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeResponse>({
    categories: [],
    items: []
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch knowledge data from API
  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch from our API endpoint
      const response = await fetch('/api/knowledge/skp');

      if (!response.ok) {
        throw new Error(`Failed to fetch knowledge data: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform the data if needed
      const transformedData: KnowledgeResponse = {
        categories: transformCategories(data),
        items: transformItems(data)
      };

      setKnowledgeData(transformedData);
    } catch (err) {
      console.error('Error fetching knowledge data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load knowledge data');

      // Fallback to mock data for demo
      const mockData = generateMockData();
      setKnowledgeData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform folder structure into categories
  const transformCategories = (data: any): KnowledgeCategory[] => {
    // This will parse the folder structure from the API response
    const categories: KnowledgeCategory[] = [
      { id: 'ui-systems', name: 'UI Systems', count: 15, type: 'ui', icon: '🎨' },
      { id: 'backend-apis', name: 'Backend APIs', count: 23, type: 'backend', icon: '⚙️' },
      { id: 'ai-integration', name: 'AI Integration', count: 8, type: 'ai', icon: '🤖' },
      { id: 'data-models', name: 'Data Models', count: 12, type: 'data', icon: '📊' },
      { id: 'security', name: 'Security', count: 6, type: 'security', icon: '🔒' },
      { id: 'devops', name: 'DevOps', count: 10, type: 'devops', icon: '🚀' }
    ];

    return categories;
  };

  // Transform items from API response
  const transformItems = (data: any): KnowledgeItem[] => {
    // This will parse the actual knowledge packs from the API response
    const items: KnowledgeItem[] = [
      {
        id: '1',
        title: 'OKLCH Color System',
        description: 'Complete guide to modern color management with OKLCH perceptual color space',
        type: 'interactive',
        category: 'UI Systems',
        size: '2.3 MB',
        updated: '2025-10-12',
        path: '/ui-engine/OKLCH-COMPLETE-SYSTEM-GUIDE.md'
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
        title: 'Auto-Proactive Engine',
        description: 'Self-optimizing loops for autonomous project management',
        type: 'interactive',
        category: 'AI Integration',
        size: '3.1 MB',
        updated: '2025-10-13'
      },
      {
        id: '4',
        title: 'Database Schema Design',
        description: 'Optimized SQLite schemas for multi-registry systems',
        type: 'documentation',
        category: 'Data Models',
        size: '1.2 MB',
        updated: '2025-10-09'
      }
    ];

    return items;
  };

  // Generate mock data for demo
  const generateMockData = (): KnowledgeResponse => {
    const mockCategories: KnowledgeCategory[] = [
      { id: 'ui-systems', name: 'UI Systems', count: 15, type: 'ui', icon: '🎨' },
      { id: 'backend-apis', name: 'Backend APIs', count: 23, type: 'backend', icon: '⚙️' },
      { id: 'ai-integration', name: 'AI Integration', count: 8, type: 'ai', icon: '🤖' },
      { id: 'data-models', name: 'Data Models', count: 12, type: 'data', icon: '📊' },
      { id: 'security', name: 'Security', count: 6, type: 'security', icon: '🔒' },
      { id: 'devops', name: 'DevOps', count: 10, type: 'devops', icon: '🚀' }
    ];

    const mockItems: KnowledgeItem[] = [
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

    return { categories: mockCategories, items: mockItems };
  };

  // Filter items based on category, type, and search
  const filteredItems = knowledgeData.items.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const typeMatch = selectedType === 'all' || item.type === selectedType;
    const searchMatch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && typeMatch && searchMatch;
  });

  // Get category info
  const getCategoryInfo = (categoryName: string) => {
    return categoryConfig[categoryName as keyof typeof categoryConfig] || categoryConfig.default;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Compact Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <span>📚</span>
                <span>Knowledge Space</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Specialized Knowledge Packs & Documentation</p>
            </div>
            <a
              href="/central-mcp-dashboard.html"
              className="px-3 py-1.5 text-xs bg-gray-900 border border-gray-800 rounded text-gray-400 hover:text-gray-200 transition-colors"
            >
              ← Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Filter Bar */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search knowledge packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-800 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-700"
            />
          </div>
          <div className="flex gap-1">
            {['all', 'interactive', 'components', 'documentation'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {knowledgeData.categories.map(category => {
            const categoryInfo = getCategoryInfo(category.name);
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.type)}
                className={`p-3 bg-gray-900 border rounded-lg transition-all hover:transform hover:translate-y-[-2px] ${
                  selectedCategory === category.type
                    ? 'border-blue-600 bg-gray-800'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
                style={{
                  borderTop: `3px solid ${categoryInfo.color}40`,
                  borderTopColor: selectedCategory === category.type ? categoryInfo.color : undefined
                }}
              >
                <div className="text-2xl mb-1">{categoryInfo.icon}</div>
                <div className="text-xs font-medium text-gray-100">{category.name}</div>
                <div className="text-xs text-gray-500">{category.count} items</div>
              </button>
            );
          })}
        </div>

        {/* Knowledge Items Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-gray-700 border-t-blue-600 rounded-full"></div>
            <p className="mt-3 text-sm text-gray-400">Loading knowledge packs...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map(item => {
              const categoryInfo = getCategoryInfo(item.category);
              return (
                <div
                  key={item.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 hover:transform hover:translate-y-[-1px] transition-all cursor-pointer group"
                  onClick={() => console.log('Open item:', item.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-100 group-hover:text-blue-400 transition-colors flex-1 mr-2">
                      {item.title}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded uppercase">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>{categoryInfo.icon}</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{item.size}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{item.updated}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-3 opacity-30">📭</div>
            <h3 className="text-base font-medium text-gray-300 mb-1">No knowledge packs found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">Error: {error}</p>
            <p className="text-xs text-red-500 mt-1">Showing demo data instead</p>
          </div>
        )}
      </div>
    </div>
  );
}