'use client';

import { useState, useEffect } from 'react';
import {
  LoopStatusPanel,
  AgentActivityPanel,
  TaskAnalytics,
  ProjectsOverview,
  PrometheusMetrics
} from './index';
import type {
  LoopStatus,
  Agent,
  TaskStats,
  Project
} from './index';

/**
 * Demo Page Component
 *
 * Demonstrates all Central-MCP Dashboard UI components with sample data.
 * Use this as a reference for implementing the components in your dashboard.
 */
export default function DemoPage() {
  const [time, setTime] = useState(new Date());

  // Update time every second for live demo
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sample Loop Data
  const loops: LoopStatus[] = [
    {
      id: 'loop-0',
      name: 'System Status',
      status: 'active',
      executionCount: 1250,
      avgDuration: 150,
      lastRun: new Date(Date.now() - 2000),
      intervalSeconds: 5,
      description: 'Foundation health checks - monitors system vitals'
    },
    {
      id: 'loop-1',
      name: 'Agent Auto-Discovery',
      status: 'active',
      executionCount: 85,
      avgDuration: 320,
      lastRun: new Date(Date.now() - 45000),
      intervalSeconds: 60,
      description: 'WHO/WHAT/WHERE awareness - tracks active agents'
    },
    {
      id: 'loop-2',
      name: 'Project Auto-Discovery',
      status: 'active',
      executionCount: 45,
      avgDuration: 580,
      lastRun: new Date(Date.now() - 30000),
      intervalSeconds: 60,
      description: 'Discovers and registers projects across ecosystem'
    },
    {
      id: 'loop-3',
      name: 'Context Learning',
      status: 'idle',
      executionCount: 0,
      avgDuration: 0,
      intervalSeconds: 1200,
      description: 'Reserved for future context learning implementation'
    },
    {
      id: 'loop-4',
      name: 'Progress Auto-Monitoring',
      status: 'active',
      executionCount: 420,
      avgDuration: 95,
      lastRun: new Date(Date.now() - 15000),
      intervalSeconds: 30,
      description: 'Monitors active sessions and task progress'
    },
    {
      id: 'loop-5',
      name: 'Status Auto-Analysis',
      status: 'active',
      executionCount: 28,
      avgDuration: 1240,
      lastRun: new Date(Date.now() - 120000),
      intervalSeconds: 300,
      description: 'Analyzes project status and identifies blockers'
    },
    {
      id: 'loop-6',
      name: 'Opportunity Auto-Scanning',
      status: 'active',
      executionCount: 12,
      avgDuration: 2100,
      lastRun: new Date(Date.now() - 450000),
      intervalSeconds: 900,
      description: 'Scans for optimization opportunities'
    },
    {
      id: 'loop-7',
      name: 'Spec Auto-Generation',
      status: 'error',
      executionCount: 8,
      avgDuration: 3500,
      lastRun: new Date(Date.now() - 300000),
      intervalSeconds: 600,
      description: 'Auto-generates technical specifications (needs LLM integration)'
    },
    {
      id: 'loop-9',
      name: 'Git Push Monitor',
      status: 'active',
      executionCount: 95,
      avgDuration: 180,
      lastRun: new Date(Date.now() - 45000),
      intervalSeconds: 60,
      description: 'Git intelligence and auto-versioning'
    }
  ];

  // Sample Agent Data
  const agents: Agent[] = [
    {
      id: 'agent-001',
      letter: 'A',
      name: 'UI Velocity',
      modelName: 'GLM-4.6',
      status: 'active',
      currentTask: 'Building dashboard UI components',
      connectedAt: new Date(Date.now() - 7200000),
      lastActivity: new Date(Date.now() - 30000),
      tasksCompleted: 5,
      projectId: 'central-mcp'
    },
    {
      id: 'agent-002',
      letter: 'B',
      name: 'Design System',
      modelName: 'Sonnet-4.5 (1M context)',
      status: 'active',
      currentTask: 'Integrating Anthropic API',
      connectedAt: new Date(Date.now() - 14400000),
      lastActivity: new Date(Date.now() - 120000),
      tasksCompleted: 12,
      projectId: 'central-mcp'
    },
    {
      id: 'agent-003',
      letter: 'C',
      name: 'Backend Specialist',
      modelName: 'GLM-4.6',
      status: 'idle',
      currentTask: 'Loop 2 Status Analysis',
      connectedAt: new Date(Date.now() - 3600000),
      lastActivity: new Date(Date.now() - 600000),
      tasksCompleted: 3,
      projectId: 'central-mcp'
    },
    {
      id: 'agent-004',
      letter: 'D',
      name: 'Integration',
      modelName: 'Sonnet-4.5',
      status: 'active',
      currentTask: 'Loop 4 Task Assignment',
      connectedAt: new Date(Date.now() - 10800000),
      lastActivity: new Date(Date.now() - 45000),
      tasksCompleted: 8,
      projectId: 'central-mcp'
    },
    {
      id: 'agent-005',
      letter: 'E',
      name: 'Supervisor',
      modelName: 'GPT-4',
      status: 'disconnected',
      connectedAt: new Date(Date.now() - 86400000),
      lastActivity: new Date(Date.now() - 43200000),
      tasksCompleted: 15,
      projectId: 'central-mcp'
    }
  ];

  // Sample Task Statistics
  const taskStats: TaskStats = {
    pending: 15,
    inProgress: 8,
    completed: 42,
    blocked: 3,
    total: 68,
    completionRate: 61.8,
    velocity: 5.2,
    avgCompletionTime: 4.5
  };

  // Sample Project Data
  const projects: Project[] = [
    {
      id: 'project-001',
      name: 'Central-MCP',
      type: 'INFRASTRUCTURE',
      health: 100,
      blockers: 0,
      tasksTotal: 25,
      tasksCompleted: 23,
      lastActivity: new Date(Date.now() - 1800000),
      description: 'Auto-Proactive Intelligence System - 9/9 loops active'
    },
    {
      id: 'project-002',
      name: 'LocalBrain',
      type: 'COMMERCIAL_APP',
      health: 85,
      blockers: 2,
      tasksTotal: 45,
      tasksCompleted: 32,
      lastActivity: new Date(Date.now() - 3600000),
      description: 'Intelligent project management and coordination'
    },
    {
      id: 'project-003',
      name: 'ProfilePro',
      type: 'COMMERCIAL_APP',
      health: 92,
      blockers: 1,
      tasksTotal: 38,
      tasksCompleted: 35,
      lastActivity: new Date(Date.now() - 7200000),
      description: 'Professional portfolio and resume builder'
    },
    {
      id: 'project-004',
      name: 'Trinity Intelligence',
      type: 'KNOWLEDGE_SYSTEM',
      health: 78,
      blockers: 3,
      tasksTotal: 52,
      tasksCompleted: 28,
      lastActivity: new Date(Date.now() - 10800000),
      description: 'Human + AI + AI consciousness collaboration framework'
    },
    {
      id: 'project-005',
      name: 'OKLCH UI System',
      type: 'TOOL',
      health: 95,
      blockers: 0,
      tasksTotal: 18,
      tasksCompleted: 17,
      lastActivity: new Date(Date.now() - 900000),
      description: 'Universal UI component library with OKLCH colors'
    },
    {
      id: 'project-006',
      name: 'Project Minerals',
      type: 'EXPERIMENTAL',
      health: 65,
      blockers: 5,
      tasksTotal: 30,
      tasksCompleted: 12,
      lastActivity: new Date(Date.now() - 86400000),
      description: 'Experimental mineral analysis platform'
    }
  ];

  return (
    <div className="min-h-screen bg-scaffold-1 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Central-MCP Dashboard
        </h1>
        <p className="text-lg text-text-secondary">
          Sophisticated UI Components Demo • {time.toLocaleTimeString()}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="space-y-6">
        {/* Row 1: Loops & Agents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoopStatusPanel loops={loops} maxCollapsedItems={3} />
          <AgentActivityPanel agents={agents} maxCollapsedItems={4} />
        </div>

        {/* Row 2: Tasks & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskAnalytics stats={taskStats} />
          <ProjectsOverview projects={projects} maxCollapsedItems={5} />
        </div>

        {/* Row 3: Prometheus Metrics */}
        <PrometheusMetrics
          endpoint="/api/data/prometheus"
          refreshInterval={5000}
          maxDataPoints={20}
        />
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-border-subtle">
        <div className="text-center text-sm text-text-tertiary">
          <p className="mb-2">
            Built with OKLCH color system • Smooth animations • Mobile-first responsive design
          </p>
          <p>
            Components: LoopStatusPanel • AgentActivityPanel • TaskAnalytics • ProjectsOverview • PrometheusMetrics
          </p>
        </div>
      </div>
    </div>
  );
}
