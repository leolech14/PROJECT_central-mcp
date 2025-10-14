/**
 * Detection Performance API Route
 * ==============================
 *
 * Provides detailed performance metrics for each detected model.
 * Includes accuracy trends, capability analysis, and agent mapping consistency.
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { join } from 'path';

// Database path
const DB_PATH = join(process.cwd(), '../../central-mcp/data/registry.db');

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
    toolUse: boolean;
  };
  agentMapping: {
    letter: string;
    role: string;
    confidence: number;
  };
  performance: {
    avgExecutionTime: number;
    reliability: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get model performance data
    const performanceQuery = db.prepare(`
      SELECT
        detected_model as model,
        COUNT(*) as total_detections,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as correct_detections,
        AVG(confidence) as avg_confidence,
        MAX(timestamp) as last_detection,
        AVG(execution_time_ms) as avg_execution_time,
        AVG(CASE WHEN verified = 1 THEN 1.0 ELSE 0.0 END) as reliability
      FROM enhanced_model_detections
      WHERE timestamp > datetime('now', '-7 days')
      GROUP BY detected_model
      ORDER BY total_detections DESC
    `).all() as any[];

    // Get latest agent mapping for each model
    const modelCapabilities: Record<string, any> = {};
    for (const perf of performanceQuery) {
      const latestCapabilities = db.prepare(`
        SELECT capabilities, agent_letter
        FROM enhanced_model_detections
        WHERE detected_model = ?
          AND capabilities IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 1
      `).get(perf.model) as any;

      if (latestCapabilities) {
        modelCapabilities[perf.model] = {
          capabilities: JSON.parse(latestCapabilities.capabilities),
          agentLetter: latestCapabilities.agent_letter
        };
      }
    }

    // Combine data
    const modelPerformance: ModelPerformance[] = performanceQuery.map((perf: any) => {
      const accuracy = perf.total_detections > 0 ? perf.correct_detections / perf.total_detections : 0;
      const capabilityData = modelCapabilities[perf.model] || {};

      return {
        model: perf.model,
        totalDetections: perf.total_detections,
        correctDetections: perf.correct_detections,
        accuracy: accuracy,
        avgConfidence: perf.avg_confidence || 0,
        lastDetection: perf.last_detection,
        capabilities: capabilityData.capabilities || {
          reasoning: 'basic',
          coding: 'basic',
          multimodal: false,
          toolUse: false
        },
        agentMapping: {
          letter: capabilityData.agentLetter || 'B',
          role: getAgentRole(capabilityData.agentLetter || 'B'),
          confidence: accuracy > 0.8 ? 0.9 : accuracy > 0.6 ? 0.7 : 0.5
        },
        performance: {
          avgExecutionTime: perf.avg_execution_time || 0,
          reliability: perf.reliability || 0
        }
      };
    });

    db.close();

    return NextResponse.json(modelPerformance);

  } catch (error) {
    console.error('Error fetching model performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model performance data' },
      { status: 500 }
    );
  }
}

// Helper function to get agent role from letter
function getAgentRole(agentLetter: string): string {
  const roles: Record<string, string> = {
    'A': 'UI Velocity Specialist',
    'B': 'Design & Architecture Specialist',
    'C': 'Backend Specialist',
    'D': 'Integration Specialist',
    'E': 'Operations & Supervisor',
    'F': 'Strategic Planning'
  };
  return roles[agentLetter] || 'General Purpose';
}