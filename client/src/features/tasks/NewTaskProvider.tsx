import type { CreateTaskInput, Task } from "@tracker/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router";
import { toast } from "sonner";
import { SubmitLabel } from "@/components/common/SubmitLabel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreateTask } from "./queries";
import { TASK_FORM_ID, TaskForm } from "./TaskForm";
import { readTaskFilters } from "./urlFilters";

interface NewTaskContextValue {
  openNewTask: () => void;
}

const NewTaskContext = createContext<NewTaskContextValue | null>(null);

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** True when the task would be hidden by the filters currently shown on the Tasks page. */
function hiddenByTasksFilters(task: Task, pathname: string, params: URLSearchParams): boolean {
  if (pathname !== "/tasks") return false;
  const filters = readTaskFilters(params);
  const assignee = task.assigneeId ?? "unassigned";
  return (
    (filters.status !== undefined && filters.status !== task.status) ||
    (filters.priority !== undefined && filters.priority !== task.priority) ||
    (filters.assigneeId !== undefined && filters.assigneeId !== assignee)
  );
}

/**
 * Owns the single "New task" panel for the whole app: any page can open it, and `N` opens it
 * from anywhere (ignored while typing in a field).
 */
export function NewTaskProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const createTask = useCreateTask();
  const { pathname } = useLocation();
  const [params] = useSearchParams();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleCreate = useCallback(
    async (input: CreateTaskInput) => {
      const task = await createTask.mutateAsync(input);
      toast.success(
        hiddenByTasksFilters(task, pathname, params) ? "Task created. It's hidden by the current filters." : "Task created",
      );
      setOpen(false);
    },
    [createTask, pathname, params],
  );

  const value = useMemo(() => ({ openNewTask: () => setOpen(true) }), []);

  return (
    <NewTaskContext.Provider value={value}>
      {children}
      <Sheet
        open={open}
        onOpenChange={(next) => {
          // Keep the panel open while saving so a failure can still be shown in the form.
          if (!submitting) setOpen(next);
        }}
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full">
          <SheetHeader className="gap-1 border-b px-5 py-4 pr-12">
            <p className="eyebrow">Create</p>
            <SheetTitle className="text-base font-semibold tracking-tight">New task</SheetTitle>
            <SheetDescription className="text-[13px]">Log a task or bug for your team.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {open && <TaskForm onSubmit={handleCreate} onSubmittingChange={setSubmitting} />}
          </div>
          <SheetFooter className="mt-0 flex-row items-center justify-end gap-2 border-t bg-sunken/60 px-5 py-3.5">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form={TASK_FORM_ID} disabled={submitting}>
              <SubmitLabel submitting={submitting}>{submitting ? "Creating…" : "Create task"}</SubmitLabel>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </NewTaskContext.Provider>
  );
}

export function useNewTask(): NewTaskContextValue {
  const context = useContext(NewTaskContext);
  if (!context) throw new Error("useNewTask must be used inside <NewTaskProvider>");
  return context;
}
