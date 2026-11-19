import {
  deleteTaskResponseSchema,
  taskSchema,
  type AssignTaskInput,
  type CreateTaskInput,
  type DeleteTaskResponse,
  type Task,
  type TaskQuery,
  type UpdateTaskInput,
} from "@tracker/shared";
import { request, toSearch } from "./http";

export { ApiError, isAbortError } from "./http";

export function fetchTasks(query: TaskQuery, signal?: AbortSignal): Promise<Task[]> {
  const search = toSearch({ status: query.status, priority: query.priority, assigneeId: query.assigneeId });
  return request(`/tasks${search}`, { signal: signal ?? null }, taskSchema.array());
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return request("/tasks", { method: "POST", body: JSON.stringify(input) }, taskSchema);
}

export function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return request(
    `/tasks/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(input) },
    taskSchema,
  );
}

/** PATCH /api/tasks/:id/assignee (`assigneeId: null` unassigns). */
export function assignTask(id: string, input: AssignTaskInput): Promise<Task> {
  return request(
    `/tasks/${encodeURIComponent(id)}/assignee`,
    { method: "PATCH", body: JSON.stringify(input) },
    taskSchema,
  );
}

export function deleteTask(id: string): Promise<DeleteTaskResponse> {
  return request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }, deleteTaskResponseSchema);
}
