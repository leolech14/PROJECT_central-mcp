/**
 * AgentRecognizer Tests
 * ======================
 *
 * Unit tests for agent identity and recognition
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { AgentRecognizer } from '../../src/discovery/AgentRecognizer.js';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

describe('AgentRecognizer', () => {
  let db: Database.Database;
  let recognizer: AgentRecognizer;
  const testDbPath = path.join(process.cwd(), 'data', 'test-agent-recognizer.db');

  beforeEach(() => {
    db = new Database(testDbPath);

    // Create agents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        tracking_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        model_id TEXT NOT NULL,
        model_signature TEXT NOT NULL,
        capabilities TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        total_sessions INTEGER DEFAULT 0,
        total_tasks INTEGER DEFAULT 0,
        metadata TEXT
      );
    `);

    recognizer = new AgentRecognizer(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('recognizeAgent', () => {
    it('should create new agent when no tracking ID', async () => {
      const request = {
        cwd: '/test',
        modelId: 'claude-sonnet-4-5'
      };

      const identity = await recognizer.recognizeAgent(request);

      expect(identity.recognized).toBe(false);
      expect(identity.method).toBe('NEW_AGENT');
      expect(identity.agent.trackingId).toBeDefined();
      expect(identity.agent.name).toContain('Agent-Sonnet');
      expect(identity.confidence).toBe(0);
    });

    it('should recognize agent by tracking ID', async () => {
      // Create agent first
      const request1 = {
        cwd: '/test',
        modelId: 'claude-sonnet-4-5'
      };

      const first = await recognizer.recognizeAgent(request1);
      const trackingId = first.agent.trackingId;

      // Reconnect with tracking ID
      const request2 = {
        cwd: '/test',
        modelId: 'claude-sonnet-4-5',
        trackingId
      };

      const second = await recognizer.recognizeAgent(request2);

      expect(second.recognized).toBe(true);
      expect(second.method).toBe('TRACKING_ID');
      expect(second.confidence).toBe(100);
      expect(second.agent.id).toBe(first.agent.id);
    });

    it('should recognize agent by signature', async () => {
      // Create agent
      const request1 = {
        cwd: '/test',
        modelId: 'claude-sonnet-4-5',
        apiKeyHash: 'test-hash',
        machineId: 'test-machine'
      };

      const first = await recognizer.recognizeAgent(request1);

      // Reconnect WITHOUT tracking ID but same signature
      const request2 = {
        cwd: '/test',
        modelId: 'claude-sonnet-4-5',
        apiKeyHash: 'test-hash',
        machineId: 'test-machine'
      };

      const second = await recognizer.recognizeAgent(request2);

      expect(second.recognized).toBe(true);
      expect(second.method).toBe('SIGNATURE');
      expect(second.confidence).toBe(90);
      expect(second.agent.id).toBe(first.agent.id);
    });
  });

  describe('extractCapabilitiesFromModel', () => {
    it('should extract Sonnet capabilities correctly', async () => {
      const request = {
        cwd: '/test',
        modelId: 'claude-sonnet-4-5'
      };

      const identity = await recognizer.recognizeAgent(request);
      const caps = identity.agent.capabilities;

      expect(caps.backend).toBe(true);
      expect(caps.integration).toBe(true);
      expect(caps.contextSize).toBe(1000000); // 1M
    });

    it('should extract GPT-4 capabilities correctly', async () => {
      const request = {
        cwd: '/test',
        modelId: 'gpt-4-turbo'
      };

      const identity = await recognizer.recognizeAgent(request);
      const caps = identity.agent.capabilities;

      expect(caps.ui).toBe(true);
      expect(caps.design).toBe(true);
      expect(caps.contextSize).toBe(128000); // 128K
    });

    it('should extract Gemini capabilities correctly', async () => {
      const request = {
        cwd: '/test',
        modelId: 'gemini-2-pro'
      };

      const identity = await recognizer.recognizeAgent(request);
      const caps = identity.agent.capabilities;

      expect(caps.backend).toBe(true);
      expect(caps.integration).toBe(true);
      expect(caps.contextSize).toBe(1000000); // 1M
    });
  });

  describe('incrementCounters', () => {
    it('should track session and task counts', async () => {
      const request = {
        cwd: '/test',
        modelId: 'claude-sonnet-4-5'
      };

      const identity = await recognizer.recognizeAgent(request);
      const agentId = identity.agent.id;

      // Increment sessions
      recognizer.incrementCounters(agentId, 1, 0);

      let agent = recognizer.getAgent(agentId);
      expect(agent?.totalSessions).toBe(1);

      // Increment tasks
      recognizer.incrementCounters(agentId, 0, 3);

      agent = recognizer.getAgent(agentId);
      expect(agent?.totalTasks).toBe(3);
    });
  });
});
