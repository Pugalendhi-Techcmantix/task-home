import { createTaskSchema, taskQuerySchema } from "@tracker/shared";
import type { Request, Response } from "express";
import { TaskModel, toTaskDto } from "../models/task.model";

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
