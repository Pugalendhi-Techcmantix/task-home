import {
  assignTaskSchema,
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
  type DeleteTaskResponse,
  type TaskQuery,
} from "@tracker/shared";
import type { Request, Response } from "express";
import { isObjectIdOrHexString, Types } from "mongoose";
import { HttpError } from "../lib/httpError";
import { MemberModel } from "../models/member.model";
import { TaskModel, toTaskDto } from "../models/task.model";

type TaskIdParams = { id: string };

/**
 * Returns the id when it is a valid ObjectId. Otherwise throws 404: the brief asks for
 * "404 Not Found if the task does not exist or if the ID format is invalid".
 */
export function findTaskIdOr404(raw: string): string {
  if (!isObjectIdOrHexString(raw)) {
    throw new HttpError(404, "Task not found");
  }
  return raw;
}

/** Throws 400 on `assigneeId` unless the id belongs to an active member. */
export async function requireActiveMember(id: string): Promise<void> {
  const exists = await MemberModel.exists({ _id: id, status: "active" });
  if (!exists) {
    throw new HttpError(400, "Validation failed", [
      { field: "assigneeId", message: "Choose an active team member" },
    ]);
  }
}

/** Turns the validated query into a MongoDB filter ("unassigned" matches tasks with no assignee). */
function toTaskFilter({ assigneeId, ...rest }: TaskQuery) {
  if (assigneeId === undefined) return rest;
  return { ...rest, assigneeId: assigneeId === "unassigned" ? null : new Types.ObjectId(assigneeId) };
}

/** GET /api/tasks?status=&priority=&assigneeId= */
export async function listTasks(req: Request, res: Response): Promise<void> {
  const filter = toTaskFilter(taskQuerySchema.parse(req.query));
  const records = await TaskModel.find(filter).sort({ createdAt: -1, _id: -1 }).lean();
  res.json(records.map(toTaskDto));
}

/** POST /api/tasks */
export async function createTask(req: Request, res: Response): Promise<void> {
  const data = createTaskSchema.parse(req.body);
  if (data.assigneeId) await requireActiveMember(data.assigneeId);
  const created = await TaskModel.create({
    ...data,
    completedAt: data.status === "done" ? new Date() : null,
  });
  res.status(201).json(toTaskDto(created.toObject()));
}

/** PATCH /api/tasks/:id (status and/or priority only) */
export async function updateTask(req: Request<TaskIdParams>, res: Response): Promise<void> {
  const id = findTaskIdOr404(req.params.id);
  const changes = updateTaskSchema.parse(req.body);

  const task = await TaskModel.findById(id);
  if (!task) {
    throw new HttpError(404, "Task not found");
  }
  if (changes.status !== undefined) {
    // completedAt marks when a task entered "done"; reopening clears it.
    if (changes.status === "done" && task.status !== "done") task.completedAt = new Date();
    if (changes.status !== "done") task.completedAt = null;
    task.status = changes.status;
  }
  if (changes.priority !== undefined) task.priority = changes.priority;
  await task.save();
  res.json(toTaskDto(task.toObject()));
}

/** PATCH /api/tasks/:id/assignee  { assigneeId: string | null } */
export async function assignTask(req: Request<TaskIdParams>, res: Response): Promise<void> {
  const id = findTaskIdOr404(req.params.id);
  const { assigneeId } = assignTaskSchema.parse(req.body);
  if (assigneeId !== null) await requireActiveMember(assigneeId);

  const updated = await TaskModel.findByIdAndUpdate(
    id,
    { assigneeId: assigneeId === null ? null : new Types.ObjectId(assigneeId) },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!updated) {
    throw new HttpError(404, "Task not found");
  }
  res.json(toTaskDto(updated));
}

/** DELETE /api/tasks/:id */
export async function deleteTask(req: Request<TaskIdParams>, res: Response): Promise<void> {
  const id = findTaskIdOr404(req.params.id);

  const deleted = await TaskModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    throw new HttpError(404, "Task not found");
  }
  res.json({ message: "Task deleted", id } satisfies DeleteTaskResponse);
}
