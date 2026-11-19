import type { DashboardSummary } from "@tracker/shared";
import type { Request, Response } from "express";
import type { QueryFilter } from "mongoose";
import { countOpenTasksByAssignee } from "../lib/taskCounts";
import { MemberModel } from "../models/member.model";
import { TaskModel, toTaskDto, type TaskDoc } from "../models/task.model";

const NEEDS_ATTENTION_LIMIT = 5;
const OPEN: QueryFilter<TaskDoc> = { status: { $ne: "done" } };

/** Monday 00:00 (server local time) of the week containing `now`. */
export function startOfWeek(now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

/** Workload rows: active members (busiest first), then Unassigned, then inactive members if any. */
async function workload(): Promise<DashboardSummary["workload"]> {
  const active = await MemberModel.find({ status: "active" }).sort({ name: 1 }).lean();
  const counts = await countOpenTasksByAssignee(active.map((m) => m._id));
  const rows: DashboardSummary["workload"] = active
    .map((m) => ({ memberId: m._id.toString(), name: m.name, openCount: counts.get(m._id.toString()) ?? 0 }))
    .sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name));

  const unassigned = await TaskModel.countDocuments({ ...OPEN, assigneeId: null });
  rows.push({ memberId: null, name: "Unassigned", openCount: unassigned });

  const inactiveIds = (await MemberModel.find({ status: "inactive" }, { _id: 1 }).lean()).map((m) => m._id);
  const inactive = inactiveIds.length
    ? await TaskModel.countDocuments({ ...OPEN, assigneeId: { $in: inactiveIds } })
    : 0;
  if (inactive > 0) rows.push({ memberId: null, name: "Inactive members", openCount: inactive });
  return rows;
}

/** GET /api/dashboard/summary */
export async function getDashboardSummary(_req: Request, res: Response): Promise<void> {
  const weekStart = startOfWeek(new Date());
  const count = (filter: QueryFilter<TaskDoc>) => TaskModel.countDocuments(filter);

  const [todo, inProgress, done, low, medium, high, highOpen, doneThisWeek, attention, rows] = await Promise.all([
    count({ status: "todo" }),
    count({ status: "in_progress" }),
    count({ status: "done" }),
    count({ priority: "low" }),
    count({ priority: "medium" }),
    count({ priority: "high" }),
    count({ ...OPEN, priority: "high" }),
    // Tasks finished before v2 have no completedAt: fall back to updatedAt.
    count({ status: "done", $expr: { $gte: [{ $ifNull: ["$completedAt", "$updatedAt"] }, weekStart] } }),
    TaskModel.find({ ...OPEN, priority: "high" }).sort({ createdAt: -1, _id: -1 }).limit(NEEDS_ATTENTION_LIMIT).lean(),
    workload(),
  ]);

  const summary: DashboardSummary = {
    totals: { all: todo + inProgress + done, open: todo + inProgress, inProgress, highOpen, doneThisWeek },
    byStatus: { todo, in_progress: inProgress, done },
    byPriority: { low, medium, high },
    workload: rows,
    needsAttention: attention.map(toTaskDto),
  };
  res.json(summary);
}
