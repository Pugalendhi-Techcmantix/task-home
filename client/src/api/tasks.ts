import {
  apiErrorSchema,
  deleteTaskResponseSchema,
  taskSchema,
  type CreateTaskInput,
  type DeleteTaskResponse,
  type FieldError,
  type Task,
  type TaskQuery,
  type UpdateTaskInput,
} from "@tracker/shared";
import type { z } from "zod";

const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection and try again.";

/** Any failed API call. `status` is 0 when the server could not be reached. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** The only place the client talks to the network. Every response is validated against a shared schema. */
async function request<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  const body: unknown = await res.json().catch(() => undefined);

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      throw new ApiError(res.status, parsed.data.message, parsed.data.errors ?? []);
    }
    // A non-JSON 5xx usually means the dev proxy could not reach the API.
    throw new ApiError(
      res.status,
      res.status >= 500 ? NETWORK_ERROR_MESSAGE : `Request failed (${res.status})`,
    );
  }

  return schema.parse(body);
}

export function fetchTasks(query: TaskQuery, signal?: AbortSignal): Promise<Task[]> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.priority) params.set("priority", query.priority);
  const search = params.size > 0 ? `?${params.toString()}` : "";
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

export function deleteTask(id: string): Promise<DeleteTaskResponse> {
  return request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }, deleteTaskResponseSchema);
}
