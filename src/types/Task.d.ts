/**
 * Task Type Definitions
 * =====================
 *
 * Core type system for LocalBrain task registry.
 * Matches CENTRAL_TASK_REGISTRY.md structure.
 */
export type TaskStatus = 'BLOCKED' | 'AVAILABLE' | 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETE' | 'NEEDS_REVIEW';
export type AgentId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type Priority = 'P0' | 'P1' | 'P2';
export type Phase = 'PHASE_1_FOUNDATION' | 'PHASE_2_INTEGRATION' | 'PHASE_3_BRIDGE' | 'PHASE_4_ADVANCED' | 'PHASE_5_POLISH';
export interface Task {
    id: string;
    name: string;
    agent: AgentId;
    status: TaskStatus;
    priority: Priority;
    phase: Phase;
    timeline: string;
    dependencies: string[];
    deliverables: string[];
    acceptanceCriteria: string[];
    location: string;
    claimedBy?: AgentId;
    startedAt?: string;
    completedAt?: string;
    filesCreated?: string[];
    velocity?: number;
    estimatedHours?: number;
    actualMinutes?: number;
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
    model: string;
    specialization: string;
    strengths: string[];
    contextWindow: string;
    tasksAssigned: number;
    tasksCompleted: number;
    averageVelocity: number;
}
export interface SprintMetrics {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    availableTasks: number;
    blockedTasks: number;
    completionPercentage: number;
    averageVelocity: number;
    sprintAcceleration: number;
    estimatedCompletion: string;
}
export interface RegistryState {
    tasks: Map<string, Task>;
    dependencies: Map<string, TaskDependency>;
    agents: Map<AgentId, AgentCapabilities>;
    metrics: SprintMetrics;
    lastUpdated: string;
    version: string;
}
import { z } from 'zod';
export declare const TaskStatusSchema: z.ZodEnum<["BLOCKED", "AVAILABLE", "CLAIMED", "IN_PROGRESS", "COMPLETE", "NEEDS_REVIEW"]>;
export declare const AgentIdSchema: z.ZodEnum<["A", "B", "C", "D", "E", "F"]>;
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    agent: z.ZodEnum<["A", "B", "C", "D", "E", "F"]>;
    status: z.ZodEnum<["BLOCKED", "AVAILABLE", "CLAIMED", "IN_PROGRESS", "COMPLETE", "NEEDS_REVIEW"]>;
    priority: z.ZodEnum<["P0", "P1", "P2"]>;
    phase: z.ZodEnum<["PHASE_1_FOUNDATION", "PHASE_2_INTEGRATION", "PHASE_3_BRIDGE", "PHASE_4_ADVANCED", "PHASE_5_POLISH"]>;
    timeline: z.ZodString;
    dependencies: z.ZodArray<z.ZodString, "many">;
    deliverables: z.ZodArray<z.ZodString, "many">;
    acceptanceCriteria: z.ZodArray<z.ZodString, "many">;
    location: z.ZodString;
    claimedBy: z.ZodOptional<z.ZodEnum<["A", "B", "C", "D", "E", "F"]>>;
    startedAt: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
    filesCreated: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    velocity: z.ZodOptional<z.ZodNumber>;
    estimatedHours: z.ZodOptional<z.ZodNumber>;
    actualMinutes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    agent: "A" | "B" | "C" | "D" | "E" | "F";
    id: string;
    name: string;
    status: "BLOCKED" | "AVAILABLE" | "CLAIMED" | "IN_PROGRESS" | "COMPLETE" | "NEEDS_REVIEW";
    priority: "P0" | "P1" | "P2";
    phase: "PHASE_1_FOUNDATION" | "PHASE_2_INTEGRATION" | "PHASE_3_BRIDGE" | "PHASE_4_ADVANCED" | "PHASE_5_POLISH";
    timeline: string;
    dependencies: string[];
    deliverables: string[];
    acceptanceCriteria: string[];
    location: string;
    claimedBy?: "A" | "B" | "C" | "D" | "E" | "F" | undefined;
    startedAt?: string | undefined;
    completedAt?: string | undefined;
    filesCreated?: string[] | undefined;
    velocity?: number | undefined;
    estimatedHours?: number | undefined;
    actualMinutes?: number | undefined;
}, {
    agent: "A" | "B" | "C" | "D" | "E" | "F";
    id: string;
    name: string;
    status: "BLOCKED" | "AVAILABLE" | "CLAIMED" | "IN_PROGRESS" | "COMPLETE" | "NEEDS_REVIEW";
    priority: "P0" | "P1" | "P2";
    phase: "PHASE_1_FOUNDATION" | "PHASE_2_INTEGRATION" | "PHASE_3_BRIDGE" | "PHASE_4_ADVANCED" | "PHASE_5_POLISH";
    timeline: string;
    dependencies: string[];
    deliverables: string[];
    acceptanceCriteria: string[];
    location: string;
    claimedBy?: "A" | "B" | "C" | "D" | "E" | "F" | undefined;
    startedAt?: string | undefined;
    completedAt?: string | undefined;
    filesCreated?: string[] | undefined;
    velocity?: number | undefined;
    estimatedHours?: number | undefined;
    actualMinutes?: number | undefined;
}>;
export type TaskInput = z.infer<typeof TaskSchema>;
//# sourceMappingURL=Task.d.ts.map