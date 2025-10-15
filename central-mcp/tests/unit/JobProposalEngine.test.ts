/**
 * JobProposalEngine Tests
 * ========================
 *
 * Unit tests for intelligent job proposal generation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { JobProposalEngine } from '../../src/discovery/JobProposalEngine.js';
import type { Agent } from '../../src/discovery/AgentRecognizer.js';
import type { Project } from '../../src/discovery/ProjectDetector.js';
import type { ExtractedContext, ContextFile } from '../../src/discovery/ContextExtractor.js';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

describe('JobProposalEngine', () => {
  let db: Database.Database;
  let engine: JobProposalEngine;
  const testDbPath = path.join(process.cwd(), 'data', 'test-job-proposals.db');

  beforeEach(() => {
    db = new Database(testDbPath);

    // Create necessary tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        agent TEXT,
        status TEXT DEFAULT 'AVAILABLE',
        priority TEXT DEFAULT 'P1',
        dependencies TEXT,
        estimated_hours INTEGER,
        project_id TEXT DEFAULT 'test-project'
      );

      -- Insert test tasks
      INSERT INTO tasks (id, name, description, agent, status, priority, dependencies, estimated_hours) VALUES
        ('T001', 'Build UI Component', 'React component development', 'ANY', 'AVAILABLE', 'P0', '[]', 4),
        ('T002', 'Implement Backend API', 'REST API endpoints', 'ANY', 'AVAILABLE', 'P1', '[]', 6),
        ('T003', 'Design System Integration', 'OKLCH color tokens', 'ANY', 'AVAILABLE', 'P1', '[]', 3),
        ('T004', 'Swift IPC Bridge', 'Integration between Swift and Electron', 'ANY', 'AVAILABLE', 'P0', '[]', 5),
        ('T005', 'Database Migration', 'Blocked task', 'ANY', 'BLOCKED', 'P2', '["T002"]', 4);
    `);

    engine = new JobProposalEngine(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('generateProposals', () => {
    it('should generate proposals for agent', async () => {
      const agent: Agent = {
        id: 'agent-1',
        trackingId: 'track-1',
        name: 'Agent-UI',
        modelId: 'claude-sonnet-4-5',
        modelSignature: 'sig-1',
        capabilities: {
          ui: true,
          backend: false,
          design: false,
          integration: false,
          contextSize: 1000000,
          multimodal: true,
          languages: ['TypeScript']
        },
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        totalSessions: 0,
        totalTasks: 0,
        metadata: {}
      };

      const project: Project = {
        id: 'test-project',
        name: 'TestProject',
        path: '/test',
        gitRemote: null,
        type: 'TOOL',
        vision: null,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        discoveredBy: 'manual',
        metadata: {
          hasClaudeMd: false,
          hasPackageJson: false,
          hasSpecBase: false,
          hasCodebase: false,
          hasTaskRegistry: false,
          technologies: [],
          estimatedSize: 'small'
        }
      };

      const context: ExtractedContext = {
        projectId: 'test-project',
        extractedAt: new Date().toISOString(),
        files: [],
        categories: {
          specs: [],
          docs: [],
          code: [],
          architecture: [],
          status: [],
          config: [],
          assets: []
        },
        statistics: {
          totalFiles: 0,
          totalSize: 0,
          byType: {} as any,
          technologies: []
        },
        keyFiles: {}
      };

      const proposals = await engine.generateProposals(agent, project, context);

      expect(proposals).toBeDefined();
      expect(proposals.length).toBeGreaterThan(0);

      // Should prioritize UI task for UI-capable agent
      const topProposal = proposals[0];
      expect(topProposal.taskId).toBeDefined();
      expect(topProposal.matchScore).toBeGreaterThan(0);
      expect(topProposal.matchScore).toBeLessThanOrEqual(100);
    });

    it('should rank proposals by match score', async () => {
      const agent: Agent = {
        id: 'agent-1',
        trackingId: 'track-1',
        name: 'Agent-Integration',
        modelId: 'claude-sonnet-4-5',
        modelSignature: 'sig-1',
        capabilities: {
          ui: false,
          backend: true,
          design: false,
          integration: true, // Integration specialist
          contextSize: 1000000,
          multimodal: true,
          languages: ['TypeScript']
        },
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        totalSessions: 0,
        totalTasks: 0,
        metadata: {}
      };

      const project: Project = {
        id: 'test-project',
        name: 'TestProject',
        path: '/test',
        gitRemote: null,
        type: 'TOOL',
        vision: null,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        discoveredBy: 'manual',
        metadata: {
          hasClaudeMd: false,
          hasPackageJson: false,
          hasSpecBase: false,
          hasCodebase: false,
          hasTaskRegistry: false,
          technologies: [],
          estimatedSize: 'small'
        }
      };

      const context: ExtractedContext = {
        projectId: 'test-project',
        extractedAt: new Date().toISOString(),
        files: [],
        categories: {
          specs: [],
          docs: [],
          code: [],
          architecture: [],
          status: [],
          config: [],
          assets: []
        },
        statistics: {
          totalFiles: 0,
          totalSize: 0,
          byType: {} as any,
          technologies: []
        },
        keyFiles: {}
      };

      const proposals = await engine.generateProposals(agent, project, context);

      // First proposal should have highest score
      expect(proposals[0].matchScore).toBeGreaterThanOrEqual(proposals[1]?.matchScore || 0);

      // Integration task should score higher for integration agent
      const integrationTask = proposals.find(p => p.taskName.includes('IPC'));
      expect(integrationTask).toBeDefined();
      expect(integrationTask!.matchScore).toBeGreaterThan(50);
    });

    it('should mark top proposal as recommended', async () => {
      const agent: Agent = {
        id: 'agent-1',
        name: 'Test Agent',
        capabilities: {
          ui: true,
          backend: true,
          design: true,
          integration: true,
          contextSize: 1000000,
          multimodal: true,
          languages: []
        }
      } as any;

      const project: Project = { id: 'test-project' } as any;
      const context: ExtractedContext = {
        projectId: 'test-project',
        categories: {
          specs: [],
          docs: [],
          code: [],
          architecture: [],
          status: [],
          config: [],
          assets: []
        }
      } as any;

      const proposals = await engine.generateProposals(agent, project, context);

      expect(proposals[0].recommended).toBe(true);
      expect(proposals.slice(1).every(p => !p.recommended)).toBe(true);
    });

    it('should filter out blocked tasks', async () => {
      const agent: Agent = { id: 'agent-1', capabilities: {} } as any;
      const project: Project = { id: 'test-project' } as any;
      const context: ExtractedContext = {
        projectId: 'test-project',
        categories: {
          specs: [],
          docs: [],
          code: [],
          architecture: [],
          status: [],
          config: [],
          assets: []
        }
      } as any;

      const proposals = await engine.generateProposals(agent, project, context);

      // T005 is BLOCKED, should not be in proposals
      expect(proposals.find(p => p.taskId === 'T005')).toBeUndefined();

      // Only AVAILABLE tasks
      expect(proposals.every(p => p.taskId !== 'T005')).toBe(true);
    });
  });

  describe('Task Scoring', () => {
    it('should give higher urgency to P0 tasks', async () => {
      const agent: Agent = {
        id: 'agent-1',
        capabilities: {
          ui: true,
          backend: true,
          design: true,
          integration: true,
          contextSize: 1000000,
          multimodal: true,
          languages: []
        }
      } as any;

      const project: Project = { id: 'test-project' } as any;
      const context: ExtractedContext = {
        projectId: 'test-project',
        categories: {
          specs: [],
          docs: [],
          code: [],
          architecture: [],
          status: [],
          config: [],
          assets: []
        }
      } as any;

      const proposals = await engine.generateProposals(agent, project, context);

      // P0 tasks should generally score higher
      const p0Tasks = proposals.filter(p => p.priority === 'P0');
      const p1Tasks = proposals.filter(p => p.priority === 'P1');

      if (p0Tasks.length > 0 && p1Tasks.length > 0) {
        // At least one P0 should be in top half
        const topHalf = proposals.slice(0, Math.ceil(proposals.length / 2));
        expect(topHalf.some(p => p.priority === 'P0')).toBe(true);
      }
    });
  });
});
