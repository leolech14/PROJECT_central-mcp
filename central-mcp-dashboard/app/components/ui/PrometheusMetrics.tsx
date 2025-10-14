'use client';

import { useState, useEffect } from 'react';

/**
 * Prometheus Metric Interface
 */
export interface PrometheusMetric {
  name: string;
  type: 'gauge' | 'counter' | 'histogram';
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

/**
 * Time Series Data Point
 */
interface DataPoint {
  timestamp: number;
  value: number;
}

interface PrometheusMetricsProps {
  endpoint?: string;
  refreshInterval?: number; // in milliseconds
  className?: string;
  maxDataPoints?: number;
}

/**
 * PrometheusMetrics Component
 *
 * Displays Prometheus metrics with sophisticated real-time visualization:
 * - Fetches metrics from /api/data/prometheus endpoint
 * - Time-series graphs with smooth animations
 * - Multiple metric types (gauge, counter, histogram)
 * - OKLCH gradient backgrounds
 * - Auto-refresh with configurable interval
 * - Loading states and error handling
 * - Mobile-first responsive design
 */
export function PrometheusMetrics({
  endpoint = '/api/data/prometheus',
  refreshInterval = 5000,
  className = '',
  maxDataPoints = 20
}: PrometheusMetricsProps) {
  const [metrics, setMetrics] = useState<PrometheusMetric[]>([]);
  const [timeSeries, setTimeSeries] = useState<Record<string, DataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Fetch metrics from API
  const fetchMetrics = async () => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newMetrics: PrometheusMetric[] = Array.isArray(data) ? data : [];

      setMetrics(newMetrics);
      setError(null);

      // Update time series data
      setTimeSeries(prev => {
        const updated = { ...prev };
        newMetrics.forEach(metric => {
          if (!updated[metric.name]) {
            updated[metric.name] = [];
          }

          updated[metric.name].push({
            timestamp: metric.timestamp,
            value: metric.value
          });

          // Keep only maxDataPoints
          if (updated[metric.name].length > maxDataPoints) {
            updated[metric.name] = updated[metric.name].slice(-maxDataPoints);
          }
        });
        return updated;
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      setLoading(false);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [endpoint, refreshInterval]);

  // Group metrics by type
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) {
      acc[metric.type] = [];
    }
    acc[metric.type].push(metric);
    return acc;
  }, {} as Record<string, PrometheusMetric[]>);

  return (
    <div className={`bg-scaffold-2 rounded-2xl border border-border-subtle overflow-hidden transition-all duration-300 hover:border-border-default ${className}`}>
      {/* Header */}
      <div className="bg-scaffold-1 px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Prometheus Metrics</h2>
            <p className="text-sm text-text-secondary mt-1">
              {metrics.length} metric{metrics.length !== 1 ? 's' : ''} • Updated every {refreshInterval / 1000}s
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-scaffold-3">
                <div className="w-2 h-2 rounded-full bg-[oklch(0.75_0.15_90)] animate-pulse" />
                <span className="text-xs font-medium text-text-secondary">Loading...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.65_0.22_25/0.1)]">
                <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.22_25)]" />
                <span className="text-xs font-medium text-[oklch(0.65_0.22_25)]">Error</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.65_0.18_145/0.1)]">
                <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.18_145)] animate-pulse" />
                <span className="text-xs font-medium text-[oklch(0.65_0.18_145)]">Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <ErrorState message={error} onRetry={fetchMetrics} />
        ) : loading && metrics.length === 0 ? (
          <LoadingState />
        ) : metrics.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Metric Type Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedMetric(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedMetric === null
                    ? 'bg-text-primary text-scaffold-1'
                    : 'bg-scaffold-3 text-text-secondary hover:bg-scaffold-1'
                }`}
              >
                All ({metrics.length})
              </button>
              {Object.entries(metricsByType).map(([type, typeMetrics]) => (
                <button
                  key={type}
                  onClick={() => setSelectedMetric(type)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
                    selectedMetric === type
                      ? 'bg-text-primary text-scaffold-1'
                      : 'bg-scaffold-3 text-text-secondary hover:bg-scaffold-1'
                  }`}
                >
                  {type} ({typeMetrics.length})
                </button>
              ))}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(selectedMetric
                ? metricsByType[selectedMetric] || []
                : metrics
              ).map((metric, index) => (
                <MetricCard
                  key={`${metric.name}-${index}`}
                  metric={metric}
                  timeSeries={timeSeries[metric.name] || []}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Metric Card Component
 */
interface MetricCardProps {
  metric: PrometheusMetric;
  timeSeries: DataPoint[];
  index: number;
}

function MetricCard({ metric, timeSeries, index }: MetricCardProps) {
  const [showGraph, setShowGraph] = useState(false);

  // Metric type colors
  const typeColors = {
    gauge: { color: 'oklch(0.70 0.15 240)', bg: 'oklch(0.70 0.15 240 / 0.1)', gradient: 'from-[oklch(0.70_0.15_240/0.2)] to-transparent' },
    counter: { color: 'oklch(0.65 0.18 145)', bg: 'oklch(0.65 0.18 145 / 0.1)', gradient: 'from-[oklch(0.65_0.18_145/0.2)] to-transparent' },
    histogram: { color: 'oklch(0.75 0.15 60)', bg: 'oklch(0.75 0.15 60 / 0.1)', gradient: 'from-[oklch(0.75_0.15_60/0.2)] to-transparent' }
  };

  const config = typeColors[metric.type] || typeColors.gauge;

  // Format metric value
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    if (value < 1 && value > 0) return value.toFixed(4);
    return value.toFixed(2);
  };

  // Calculate trend
  const trend = timeSeries.length > 1
    ? timeSeries[timeSeries.length - 1].value - timeSeries[timeSeries.length - 2].value
    : 0;

  return (
    <div
      className="bg-scaffold-1 rounded-xl border border-border-subtle overflow-hidden hover:border-border-default transition-all duration-300 cursor-pointer group"
      onClick={() => setShowGraph(!showGraph)}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50 transition-opacity duration-300 group-hover:opacity-70`} />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div
              className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 capitalize"
              style={{
                backgroundColor: config.bg,
                color: config.color
              }}
            >
              {metric.type}
            </div>
            <h3 className="text-sm font-semibold text-text-primary truncate" title={metric.name}>
              {metric.name}
            </h3>
          </div>

          {/* Trend Indicator */}
          {trend !== 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              trend > 0 ? 'bg-[oklch(0.65_0.18_145/0.1)]' : 'bg-[oklch(0.65_0.22_25/0.1)]'
            }`}>
              <svg
                className={`w-3 h-3 ${trend > 0 ? 'text-[oklch(0.65_0.18_145)]' : 'text-[oklch(0.65_0.22_25)] rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className={`text-xs font-medium ${
                trend > 0 ? 'text-[oklch(0.65_0.18_145)]' : 'text-[oklch(0.65_0.22_25)]'
              }`}>
                {formatValue(Math.abs(trend))}
              </span>
            </div>
          )}
        </div>

        {/* Value Display */}
        <div className="mb-3">
          <div className="text-3xl font-bold text-text-primary mb-1" style={{ color: config.color }}>
            {formatValue(metric.value)}
          </div>
          {metric.labels && Object.keys(metric.labels).length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {Object.entries(metric.labels).slice(0, 2).map(([key, value]) => (
                <span key={key} className="text-xs text-text-tertiary">
                  {key}={value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mini Graph or Expanded Graph */}
        {timeSeries.length > 1 && (
          showGraph ? (
            <div className="mt-4 animate-fadeIn">
              <MiniGraph data={timeSeries} color={config.color} height={100} />
            </div>
          ) : (
            <div className="h-12">
              <MiniGraph data={timeSeries} color={config.color} height={48} />
            </div>
          )
        )}

        {/* Expand Indicator */}
        <div className="flex items-center justify-center mt-2">
          <svg
            className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${showGraph ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini Graph Component
 */
interface MiniGraphProps {
  data: DataPoint[];
  color: string;
  height?: number;
}

function MiniGraph({ data, color, height = 60 }: MiniGraphProps) {
  if (data.length < 2) return null;

  const width = 300;
  const padding = 4;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Create SVG path
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Area fill */}
        <path
          d={areaPath}
          fill={`${color}`}
          fillOpacity="0.2"
          className="transition-all duration-300"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
          const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              className="transition-all duration-300 hover:r-5"
            />
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="py-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-scaffold-3 mb-4 animate-pulse">
        <svg className="w-8 h-8 text-text-tertiary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="text-sm text-text-secondary">Loading metrics...</p>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-scaffold-3 mb-4">
        <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-sm text-text-secondary">No metrics available</p>
      <p className="text-xs text-text-tertiary mt-1">Metrics will appear here when available</p>
    </div>
  );
}

/**
 * Error State Component
 */
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="py-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[oklch(0.65_0.22_25/0.1)] mb-4">
        <svg className="w-8 h-8 text-[oklch(0.65_0.22_25)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-sm text-text-secondary mb-2">Failed to load metrics</p>
      <p className="text-xs text-text-tertiary mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-text-primary text-scaffold-1 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    </div>
  );
}
