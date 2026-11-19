import type { CreateTaskInput, Task, TaskQuery, TaskStatus } from "@tracker/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError, createTask, deleteTask, fetchTasks, isAbortError, updateTask } from "../api/tasks";
import { useToast } from "../components/toast/ToastProvider";

export type LoadState = "loading" | "ready" | "error";

export interface UseTasksResult {
  tasks: Task[];
  state: LoadState;
  error: string | null;
  /** True while a background refetch runs and the current list stays visible. */
  refreshing: boolean;
  filters: TaskQuery;
  setFilters: (next: TaskQuery) => void;
  /** Refetches the list with the current filters. */
  reload: () => void;
  /** Creates a task, then refetches. Rejects with ApiError so the form can show field errors. */
  create: (input: CreateTaskInput) => Promise<Task>;
  changeStatus: (id: string, status: TaskStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Ids of tasks with a status change or delete in flight. */
  pendingIds: ReadonlySet<string>;
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "This task no longer exists. The list has been refreshed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/** Owns the task list: server-side filtering, loading/error state and mutations. */
export function useTasks(): UseTasksResult {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFiltersState] = useState<TaskQuery>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());

  // Fetch whenever the filters change or a reload is requested. A newer fetch aborts the older one.
  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(filters, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return; // a newer request owns the state now
        setTasks(data);
        setError(null);
        setState("ready");
        setRefreshing(false);
      },
      (err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(messageFor(err));
        setState("error");
        setRefreshing(false);
      },
    );
    return () => controller.abort();
  }, [filters, reloadKey]);

  const reload = useCallback(() => {
    setState((current) => (current === "error" ? "loading" : current));
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  const setFilters = useCallback((next: TaskQuery) => {
    setRefreshing(true);
    setFiltersState(next);
  }, []);

  const markPending = useCallback((id: string, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const create = useCallback(
    async (input: CreateTaskInput): Promise<Task> => {
      const task = await createTask(input);
      toast.success("Task created");
      reload();
      return task;
    },
    [toast, reload],
  );

  const changeStatus = useCallback(
    async (id: string, status: TaskStatus): Promise<void> => {
      markPending(id, true);
      try {
        const updated = await updateTask(id, { status });
        setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
        toast.success("Status updated");
      } catch (err) {
        toast.error(messageFor(err));
      } finally {
        markPending(id, false);
        // Refetch so server-side filters stay correct (e.g. a task moved out of the filtered status).
        reload();
      }
    },
    [markPending, toast, reload],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      markPending(id, true);
      try {
        await deleteTask(id);
        setTasks((current) => current.filter((task) => task.id !== id));
        toast.success("Task deleted");
      } catch (err) {
        toast.error(messageFor(err));
      } finally {
        markPending(id, false);
        reload();
      }
    },
    [markPending, toast, reload],
  );

  return { tasks, state, error, refreshing, filters, setFilters, reload, create, changeStatus, remove, pendingIds };
}
