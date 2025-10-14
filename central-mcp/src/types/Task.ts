/**
 * Task Type Definitions
 * =====================
 *
 * Core type system for LocalBrain task registry.
 * Matches CENTRAL_TASK_REGISTRY.md structure.
 */

export type TaskStatus =
  | 'BLOCKED'      // Dependencies not complete
  | 'AVAILABLE'    // Ready to claim
  | 'CLAIMED'      // Agent claimed it
  | 'IN_PROGRESS'  // Agent working on it
  | 'COMPLETE'     // Task finished
  | 'NEEDS_REVIEW' // Optional review state
  ;

export type AgentId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type Priority = 'P0' | 'P1' | 'P2';

export type Phase =
  | 'PHASE_1_FOUNDATION'
  | 'PHASE_2_INTEGRATION'
  | 'PHASE_3_BRIDGE'
  | 'PHASE_4_ADVANCED'
  | 'PHASE_5_POLISH'
  ;

export interface Task {
  id: string;                    // e.g., "T001"
  name: string;                  // e.g., "OKLCH Token System Foundation"
  agent: AgentId;                // Assigned agent
  status: TaskStatus;            // Current state
  priority: Priority;            // Criticality
  phase: Phase;                  // Sprint phase
  timeline: string;              // e.g., "Day 1-2 (16 hours)"
  dependencies: string[];        // Task IDs (e.g., ["T001", "T002"])
  deliverables: string[];        // Expected outputs
  acceptanceCriteria: string[];  // Completion requirements
  location: string;              // Directory path
  claimedBy?: AgentId;           // Who claimed it
  startedAt?: string;            // ISO timestamp
  completedAt?: string;          // ISO timestamp
  filesCreated?: string[];       // Actual file outputs
  velocity?: number;             // % of estimated time
  estimatedHours?: number;       // Original estimate
  actualMinutes?: number;        // Actual time taken
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  satisfied: boolean;
}

export interface TaskConflict {
  taskA: string;
  taskB: string;
  conflictType: 'file' | 'directory' | 'agent';
  conflictPath?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AgentCapabilities {
  agentId: AgentId;
  model: string;                 // e.g., "GLM-4.6", "Sonnet-4.5"
  specialization: string;        // e.g., "UI Velocity"
  strengths: string[];           // Core competencies
  contextWindow: string;         // e.g., "200K tokens"
  tasksAssigned: number;         // Total tasks
  tasksCompleted: number;        // Completed tasks
  averageVelocity: number;       // % average speed
}

export interface SprintMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  availableTasks: number;
  blockedTasks: number;
  completionPercentage: number;
  averageVelocity: number;       // % average task speed
  sprintAcceleration: number;    // % ahead/behind schedule
  estimatedCompletion: string;   // Projected completion day
}

export interface RegistryState {
  tasks: Map<string, Task>;
  dependencies: Map<string, TaskDependency>;
  agents: Map<AgentId, AgentCapabilities>;
  metrics: SprintMetrics;
  lastUpdated: string;
  version: string;
}

// Validation schemas using Zod
import { z } from 'zod';

export const TaskStatusSchema = z.enum([
  'BLOCKED',
  'AVAILABLE',
  'CLAIMED',
  'IN_PROGRESS',
  'COMPLETE',
  'NEEDS_REVIEW'
]);

export const AgentIdSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F']);

export const TaskSchema = z.object({
  id: z.string().regex(/^T\d{3}$/),
  name: z.string().min(1),
  agent: AgentIdSchema,
  status: TaskStatusSchema,
  priority: z.enum(['P0', 'P1', 'P2']),
  phase: z.enum([
    'PHASE_1_FOUNDATION',
    'PHASE_2_INTEGRATION',
    'PHASE_3_BRIDGE',
    'PHASE_4_ADVANCED',
    'PHASE_5_POLISH'
  ]),
  timeline: z.string(),
  dependencies: z.array(z.string()),
  deliverables: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  location: z.string(),
  claimedBy: AgentIdSchema.optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  filesCreated: z.array(z.string()).optional(),
  velocity: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualMinutes: z.number().min(0).optional()
});

export type TaskInput = z.infer<typeof TaskSchema>;
