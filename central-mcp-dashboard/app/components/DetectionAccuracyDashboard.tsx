/**
 * Detection Accuracy Dashboard Component
 * ====================================
 *
 * Real-time monitoring dashboard for enhanced model detection system.
 * Displays accuracy metrics, system health, self-correction statistics,
 * and performance analytics with interactive visualizations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DetectionStats {
  totalDetections: number;
  avgConfidence: number;
  accuracyRate: number;
  topModels: Array<{ model: string; count: number }>;
  selfCorrectionStats: {
    totalCorrections: number;
    accuracyImprovement: number;
    topCorrectedModels: Array<{ model: string; corrections: number }>;
    recentPatterns: Array<{ pattern: string; frequency: number }>;
  };
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

interface DetectionEvent {
  id: string;
  timestamp: string;
  detectedModel: string;
  agentLetter: string;
  confidence: number;
  verified: boolean;
  detectionMethod: string;
  selfCorrectionApplied: boolean;
  executionTime: number;
}

interface ModelPerformance {
  model: string;
  totalDetections: number;
  correctDetections: number;
  accuracy: number;
  avgConfidence: number;
  lastDetection: string;
  capabilities: {
    reasoning: string;
    coding: string;
    multimodal: boolean;
  };
  agentMapping: {
    letter: string;
    role: string;
  };
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4'
};

const AGENT_COLORS = {
  A: '#3b82f6', // Blue
  B: '#8b5cf6', // Purple
  C: '#10b981', // Green
  D: '#f59e0b', // Yellow
  E: '#ef4444', // Red
  F: '#06b6d4'  // Cyan
};

export default function DetectionAccuracyDashboard() {
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data from the API
  const fetchDetectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current stats
      const statsResponse = await fetch('/api/detection/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent events
      const eventsResponse = await fetch(`/api/detection/events?range=${timeRange}`);
      if (!eventsResponse.ok) throw new Error('Failed to fetch events');
      const eventsData = await eventsResponse.json();
      setEvents(eventsData);

      // Fetch model performance
      const performanceResponse = await fetch('/api/detection/performance');
      if (!performanceResponse.ok) throw new Error('Failed to fetch performance data');
      const performanceData = await performanceResponse.json();
      setModelPerformance(performanceData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchDetectionData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  // Initial data fetch
  useEffect(() => {
    fetchDetectionData();
  }, [timeRange]);

  // Calculate accuracy trend
  const getAccuracyTrend = () => {
    const recentEvents = events.slice(-20);
    const accuracyByTime = recentEvents.map((event, index) => ({
      time: index,
      accuracy: event.verified ? 100 : 0,
      confidence: event.confidence * 100
    }));

    return accuracyByTime;
  };

  // Get system health color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return COLORS.success;
      case 'degraded': return COLORS.warning;
      case 'critical': return COLORS.error;
      default: return COLORS.info;
    }
  };

  // Get detection method distribution
  const getDetectionMethodDistribution = () => {
    const methodCounts = events.reduce((acc, event) => {
      const method = event.detectionMethod.replace('enhanced-', '');
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, count]) => ({
      name: method,
      value: count,
      percentage: (count / events.length) * 100
    }));
  };

  // Get agent distribution
  const getAgentDistribution = () => {
    const agentCounts = events.reduce((acc, event) => {
      acc[event.agentLetter] = (acc[event.agentLetter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(agentCounts).map(([agent, count]) => ({
      name: `Agent ${agent}`,
      value: count,
      fill: AGENT_COLORS[agent as keyof typeof AGENT_COLORS] || COLORS.info
    }));
  };

  // Get performance metrics
  const getPerformanceMetrics = () => {
    if (!stats) return [];

    return [
      {
        name: 'Avg Confidence',
        value: stats.avgConfidence * 100,
        unit: '%',
        status: stats.avgConfidence > 0.8 ? 'good' : stats.avgConfidence > 0.6 ? 'warning' : 'critical'
      },
      {
        name: 'Accuracy Rate',
        value: stats.accuracyRate * 100,
        unit: '%',
        status: stats.accuracyRate > 0.9 ? 'good' : stats.accuracyRate > 0.7 ? 'warning' : 'critical'
      },
      {
        name: 'Self-Correction Rate',
        value: (stats.selfCorrectionStats.totalCorrections / Math.max(stats.totalDetections, 1)) * 100,
        unit: '%',
        status: 'info'
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load detection data: {error}</AlertDescription>
        <Button onClick={fetchDetectionData} className="mt-4">
          Retry
        </Button>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Detection statistics are not available at this time.</AlertDescription>
      </Alert>
    );
  }

  const accuracyTrend = getAccuracyTrend();
  const methodDistribution = getDetectionMethodDistribution();
  const agentDistribution = getAgentDistribution();
  const performanceMetrics = getPerformanceMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detection Accuracy Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of enhanced model detection system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            style={{ backgroundColor: getHealthColor(stats.systemHealth), color: 'white' }}
          >
            System: {stats.systemHealth.toUpperCase()}
          </Badge>
          <Badge variant="outline">
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Toggle Auto-refresh
          </Button>
          <Button
            size="sm"
            onClick={fetchDetectionData}
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDetections}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</div>
            <Progress value={stats.avgConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.accuracyRate * 100).toFixed(1)}%</div>
            <Progress value={stats.accuracyRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Self-Corrections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.selfCorrectionStats.totalCorrections}</div>
            <p className="text-xs text-muted-foreground">
              {(stats.selfCorrectionStats.accuracyImprovement * 100).toFixed(1)}% avg improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy Analysis</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="corrections">Self-Corrections</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Trend</CardTitle>
                <CardDescription>Detection accuracy over recent events</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      name="Accuracy %"
                    />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke={COLORS.info}
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Confidence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Methods</CardTitle>
                <CardDescription>Distribution of detection methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={methodDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {methodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.primary} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Distribution</CardTitle>
                <CardDescription>Detections by agent letter</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={agentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name }) => name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {agentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{metric.name}</p>
                      <p className="text-2xl font-bold">
                        {metric.value.toFixed(1)}{metric.unit}
                      </p>
                    </div>
                    <Badge
                      variant={
                        metric.status === 'good' ? 'default' :
                        metric.status === 'warning' ? 'secondary' : 'destructive'
                      }
                    >
                      {metric.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accuracy Analysis Tab */}
        <TabsContent value="accuracy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>Accuracy by model</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={modelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" fill={COLORS.success} name="Accuracy %" />
                    <Bar dataKey="avgConfidence" fill={COLORS.info} name="Avg Confidence %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Models</CardTitle>
                <CardDescription>Most frequently detected models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topModels.map((model, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{model.model}</span>
                      <Badge variant="outline">{model.count} detections</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Performance Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modelPerformance.map((model, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{model.model}</span>
                    <Badge variant="outline">Agent {model.agentMapping.letter}</Badge>
                  </CardTitle>
                  <CardDescription>{model.agentMapping.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-lg font-bold">{(model.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-lg font-bold">{(model.avgConfidence * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Detections</p>
                      <p className="text-lg font-bold">{model.totalDetections}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Correct Detections</p>
                      <p className="text-lg font-bold">{model.correctDetections}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Capabilities</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{model.capabilities.reasoning}</Badge>
                      <Badge variant="secondary">{model.capabilities.coding}</Badge>
                      {model.capabilities.multimodal && (
                        <Badge variant="secondary">Multimodal</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Self-Corrections Tab */}
        <TabsContent value="corrections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Correction Statistics</CardTitle>
                <CardDescription>Self-correction performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Corrections Applied</span>
                  <span className="font-bold">{stats.selfCorrectionStats.totalCorrections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average Improvement</span>
                  <span className="font-bold">
                    {(stats.selfCorrectionStats.accuracyImprovement * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Correction Rate</span>
                  <span className="font-bold">
                    {((stats.selfCorrectionStats.totalCorrections / Math.max(stats.totalDetections, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Corrected Models</CardTitle>
                <CardDescription>Models most frequently corrected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.selfCorrectionStats.topCorrectedModels.map((model, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{model.model}</span>
                      <Badge variant="outline">{model.corrections} corrections</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Detection Events</CardTitle>
              <CardDescription>Latest model detection events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.slice(-20).reverse().map((event, index) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Agent {event.agentLetter}</Badge>
                        <Badge variant="outline">{event.detectedModel}</Badge>
                        {event.selfCorrectionApplied && (
                          <Badge variant="secondary">Self-Corrected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Method: {event.detectionMethod} | Confidence: {(event.confidence * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`w-3 h-3 rounded-full ${
                        event.verified ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}