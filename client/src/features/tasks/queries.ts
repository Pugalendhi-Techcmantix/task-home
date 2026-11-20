import type { CreateTaskInput, EditTaskInput, Task, TaskQuery, TaskStatus } from "@tracker/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, assignTask, createTask, deleteTask, editTask, fetchTasks, updateTask } from "@/api/tasks";
import { queryKeys } from "@/lib/queryKeys";

export function useTasks(filters: TaskQuery = {}) {
  return useQuery({
    queryKey: queryKeys.tasks(filters),
    queryFn: ({ signal }) => fetchTasks(filters, signal),
  });
}

/** A readable toast message for any failed task mutation. */
export function taskErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "This task no longer exists. The list has been refreshed.";
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function useInvalidateTaskData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.allTasks }),
      queryClient.invalidateQueries({ queryKey: queryKeys.allMembers }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
}

/** Creates a task. Errors are left to the caller (the form maps field errors). */
export function useCreateTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSettled: invalidate,
  });
}

/** Changes status optimistically in every cached task list; rolls back if the save fails. */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTask(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allTasks });
      const snapshot = queryClient.getQueriesData<Task[]>({ queryKey: queryKeys.allTasks });
      queryClient.setQueriesData<Task[]>({ queryKey: queryKeys.allTasks }, (tasks) =>
        tasks?.map((task) => (task.id === id ? { ...task, status } : task)),
      );
      return { snapshot };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(taskErrorMessage(error));
    },
    onSuccess: () => toast.success("Status updated"),
    onSettled: invalidate,
  });
}

/** Edits a task. Errors are left to the caller (the form maps field errors). */
export function useEditTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditTaskInput }) => editTask(id, input),
    onSettled: invalidate,
  });
}

export function useAssignTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string | null }) => assignTask(id, { assigneeId }),
    onError: (error) => toast.error(taskErrorMessage(error)),
    onSuccess: (task) => toast.success(task.assigneeId ? "Task reassigned" : "Task unassigned"),
    onSettled: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onError: (error) => toast.error(taskErrorMessage(error)),
    onSuccess: () => toast.success("Task deleted"),
    onSettled: invalidate,
  });
}
