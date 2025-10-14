/**
 * Task Type Definitions
 * =====================
 *
 * Core type system for LocalBrain task registry.
 * Matches CENTRAL_TASK_REGISTRY.md structure.
 */
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
//# sourceMappingURL=Task.js.map