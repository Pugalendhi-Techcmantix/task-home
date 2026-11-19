import { z } from "zod";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const DEFAULT_STATUS: TaskStatus = "todo";
export const DEFAULT_PRIORITY: TaskPriority = "medium";

export const TITLE_MIN = 3;
export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;

const statusSchema = z.enum(TASK_STATUSES, {
  error: `Status must be one of: ${TASK_STATUSES.join(", ")}`,
});
const prioritySchema = z.enum(TASK_PRIORITIES, {
  error: `Priority must be one of: ${TASK_PRIORITIES.join(", ")}`,
});

const titleSchema = z
  .string({
    error: (issue) => (issue.input === undefined ? "Title is required" : "Title must be text"),
  })
  .trim()
  .min(TITLE_MIN, { error: `Title must be at least ${TITLE_MIN} characters` })
  .max(TITLE_MAX, { error: `Title must be at most ${TITLE_MAX} characters` });

const descriptionSchema = z
  .string({ error: "Description must be text" })
  .trim()
  .max(DESCRIPTION_MAX, { error: `Description must be at most ${DESCRIPTION_MAX} characters` })
  .optional()
  .transform((value) => (value === "" ? undefined : value));

/** Body of POST /api/tasks. Unknown keys are rejected. */
export const createTaskSchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema,
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
});

/** Body of PATCH /api/tasks/:id. Only status and priority may change. */
export const updateTaskSchema = z
  .strictObject({
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
  })
  .refine((data) => data.status !== undefined || data.priority !== undefined, {
    error: "Provide status or priority to update",
  });

/** Query string of GET /api/tasks. */
export const taskQuerySchema = z.object({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
});

/** A task as returned by the API. */
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: statusSchema,
  priority: prioritySchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const fieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

/** Body of every error response. `errors` is present on validation failures. */
export const apiErrorSchema = z.object({
  message: z.string(),
  errors: z.array(fieldErrorSchema).optional(),
});

export const deleteTaskResponseSchema = z.object({
  message: z.string(),
  id: z.string(),
});

export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type CreateTaskData = z.output<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type FieldError = z.infer<typeof fieldErrorSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
export type DeleteTaskResponse = z.infer<typeof deleteTaskResponseSchema>;
