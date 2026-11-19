import {
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
  type DeleteTaskResponse,
} from "@tracker/shared";
import type { Request, Response } from "express";
import { isObjectIdOrHexString } from "mongoose";
import { HttpError } from "../lib/httpError";
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

/** GET /api/tasks?status=&priority= */
export async function listTasks(req: Request, res: Response): Promise<void> {
  const filter = taskQuerySchema.parse(req.query);
  const records = await TaskModel.find(filter).sort({ createdAt: -1, _id: -1 }).lean();
  res.json(records.map(toTaskDto));
}

/** POST /api/tasks */
export async function createTask(req: Request, res: Response): Promise<void> {
  const data = createTaskSchema.parse(req.body);
  const created = await TaskModel.create(data);
  res.status(201).json(toTaskDto(created.toObject()));
}

/** PATCH /api/tasks/:id (status and/or priority only) */
export async function updateTask(req: Request<TaskIdParams>, res: Response): Promise<void> {
  const id = findTaskIdOr404(req.params.id);
  const changes = updateTaskSchema.parse(req.body);

  const updated = await TaskModel.findByIdAndUpdate(id, changes, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

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
