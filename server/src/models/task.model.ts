import {
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
  DESCRIPTION_MAX,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TITLE_MAX,
  TITLE_MIN,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@tracker/shared";
import { Schema, model, type Types } from "mongoose";

/** Shape of a task document in MongoDB. */
export interface TaskDoc {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

/** A task as read from MongoDB (lean object or document.toObject()). */
export type TaskRecord = TaskDoc & { _id: Types.ObjectId };

const taskMongooseSchema = new Schema<TaskDoc>(
  {
    title: { type: String, required: true, trim: true, minlength: TITLE_MIN, maxlength: TITLE_MAX },
    description: { type: String, trim: true, maxlength: DESCRIPTION_MAX },
    status: { type: String, enum: [...TASK_STATUSES], default: DEFAULT_STATUS, required: true },
    priority: { type: String, enum: [...TASK_PRIORITIES], default: DEFAULT_PRIORITY, required: true },
  },
  { timestamps: true },
);

export const TaskModel = model<TaskDoc>("Task", taskMongooseSchema);

/** Maps a stored task to the API shape: `id` instead of `_id`, ISO date strings. */
export function toTaskDto(record: TaskRecord): Task {
  return {
    id: record._id.toString(),
    title: record.title,
    ...(record.description ? { description: record.description } : {}),
    status: record.status,
    priority: record.priority,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
