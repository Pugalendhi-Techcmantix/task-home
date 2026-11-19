import { z } from "zod";
import { taskSchema } from "./task";

const count = z.number().int().min(0);

/** Response of GET /api/dashboard/summary. */
export const dashboardSummarySchema = z.object({
  totals: z.object({
    all: count,
    open: count,
    inProgress: count,
    highOpen: count,
    doneThisWeek: count,
  }),
  byStatus: z.object({ todo: count, in_progress: count, done: count }),
  byPriority: z.object({ low: count, medium: count, high: count }),
  workload: z.array(z.object({ memberId: z.string().nullable(), name: z.string(), openCount: count })),
  needsAttention: z.array(taskSchema),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
