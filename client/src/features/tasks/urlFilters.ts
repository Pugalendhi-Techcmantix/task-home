import { taskQuerySchema, type TaskQuery } from "@tracker/shared";

export type TaskSort = "newest" | "priority";

/** Reads the Tasks page filters from the URL; invalid values are ignored rather than breaking the page. */
export function readTaskFilters(params: URLSearchParams): TaskQuery {
  const candidate = {
    status: params.get("status") ?? undefined,
    priority: params.get("priority") ?? undefined,
    assigneeId: params.get("assignee") ?? undefined,
  };
  const filters: TaskQuery = {};
  for (const key of ["status", "priority", "assigneeId"] as const) {
    const parsed = taskQuerySchema.shape[key].safeParse(candidate[key]);
    if (parsed.success && parsed.data !== undefined) Object.assign(filters, { [key]: parsed.data });
  }
  return filters;
}

export function readSort(params: URLSearchParams): TaskSort {
  return params.get("sort") === "priority" ? "priority" : "newest";
}

/** Returns new params with one filter changed (undefined removes it). Clears any ?task= highlight. */
export function withParam(params: URLSearchParams, key: "status" | "priority" | "assignee" | "sort", value: string | undefined): URLSearchParams {
  const next = new URLSearchParams(params);
  if (value === undefined) next.delete(key);
  else next.set(key, value);
  next.delete("task");
  return next;
}
