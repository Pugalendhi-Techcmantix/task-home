import type { Types } from "mongoose";
import { TaskModel } from "../models/task.model";

/** Open (not done) task counts per assignee id. */
export async function countOpenTasksByAssignee(ids: Types.ObjectId[]): Promise<Map<string, number>> {
  const rows = await TaskModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { assigneeId: { $in: ids }, status: { $ne: "done" } } },
    { $group: { _id: "$assigneeId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}
