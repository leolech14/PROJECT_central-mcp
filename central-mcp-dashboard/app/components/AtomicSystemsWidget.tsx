'use client';

import { useState, useEffect } from 'react';

interface AtomicSystem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'operational' | 'partial' | 'planned';
  completedDate: string;
  tables: string[];
  recordCount: number;
  keyMetric: string;
  documentationUrl: string;
}

interface AtomicSystemsData {
  systems: AtomicSystem[];
  totalSystems: number;
  operationalSystems: number;
  completionPercentage: number;
  lastUpdated: string;
}

const categoryColors = {
  foundation: 'bg-purple-500',
  core: 'bg-blue-500',
  intelligence: 'bg-cyan-500',
  code: 'bg-green-500',
  execution: 'bg-yellow-500',
  management: 'bg-orange-500',
  integration: 'bg-pink-500'
};

const categoryIcons = {
  foundation: '🏗️',
  core: '⚡',
  intelligence: '🧠',
  code: '💻',
  execution: '🎯',
  management: '📊',
  integration: '🔗'
};

export default function AtomicSystemsWidget() {
  const [data, setData] = useState<AtomicSystemsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/atomic-systems');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching atomic systems:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-500">Failed to load atomic systems data</p>
      </div>
    );
  }

  const filteredSystems = selectedCategory
    ? data.systems.filter(s => s.category === selectedCategory)
    : data.systems;

  const categories = Array.from(new Set(data.systems.map(s => s.category)));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏗️</span>
            <span>Atomic Infrastructure Systems</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-green-600">
              {data.operationalSystems}/{data.totalSystems}
            </span>
            <span className="text-sm text-gray-500">operational</span>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Complete atomic entities infrastructure powering Central-MCP
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            System Completion
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {data.completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${data.completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All Systems
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {categoryIcons[category as keyof typeof categoryIcons]} {category}
          </button>
        ))}
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSystems.map(system => (
          <div
            key={system.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* System Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {categoryIcons[system.category as keyof typeof categoryIcons]}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  system.status === 'operational' ? 'bg-green-500' :
                  system.status === 'partial' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}></div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                categoryColors[system.category as keyof typeof categoryColors]
              } text-white`}>
                {system.category}
              </span>
            </div>

            {/* System Name */}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {system.name}
            </h3>

            {/* Description */}
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {system.description}
            </p>

            {/* Metrics */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${
                  system.status === 'operational' ? 'text-green-600' :
                  system.status === 'partial' ? 'text-yellow-600' :
                  'text-gray-500'
                }`}>
                  {system.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tables:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {system.tables.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Records:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {system.recordCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Key Metric */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded px-2 py-1 mb-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {system.keyMetric}
              </p>
            </div>

            {/* Completed Date */}
            <div className="text-xs text-gray-500 text-center">
              ✅ {system.completedDate}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date(data.lastUpdated).toLocaleString()}</span>
          <span>🚀 Central-MCP Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
