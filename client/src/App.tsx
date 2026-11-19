import type { CreateTaskInput } from "@tracker/shared";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { NewTaskDrawer } from "./components/NewTaskDrawer";
import { TaskTable } from "./components/TaskTable";
import { EmptyState, ErrorState, SkeletonRows } from "./components/TaskStates";
import { TaskToolbar } from "./components/TaskToolbar";
import { ToastProvider } from "./components/toast/ToastProvider";
import { useTasks } from "./hooks/useTasks";
import { buttonPrimary } from "./lib/styles";

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function TasksPage() {
  const { tasks, state, error, refreshing, filters, setFilters, reload, create, changeStatus, remove, pendingIds } =
    useTasks();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filtered = filters.status !== undefined || filters.priority !== undefined;

  const clearFilters = useCallback(() => setFilters({}), [setFilters]);
  const openCreate = useCallback(() => setDrawerOpen(true), []);
  const closeCreate = useCallback(() => setDrawerOpen(false), []);
  const handleCreate = useCallback(
    async (input: CreateTaskInput) => {
      await create(input);
      setDrawerOpen(false);
    },
    [create],
  );

  // Keyboard shortcut: "N" opens the create panel (ignored while typing in a field).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      setDrawerOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Log, filter and update your team&apos;s tasks and bugs.</p>
        </div>
        <button type="button" onClick={openCreate} className={buttonPrimary} aria-keyshortcuts="N">
          <Plus className="size-4" aria-hidden="true" />
          New task
          <kbd
            className="ml-1 hidden rounded border border-white/30 px-1.5 font-sans text-[11px] font-medium text-white/80 sm:inline"
            aria-hidden="true"
          >
            N
          </kbd>
        </button>
      </div>

      <section
        aria-label="Task list"
        className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <TaskToolbar
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          count={state === "ready" ? tasks.length : null}
          refreshing={refreshing && state === "ready"}
        />
        {state === "loading" && <SkeletonRows />}
        {state === "error" && <ErrorState message={error ?? "Something went wrong."} onRetry={reload} />}
        {state === "ready" && tasks.length === 0 && (
          <EmptyState filtered={filtered} onClear={clearFilters} onCreate={openCreate} />
        )}
        {state === "ready" && tasks.length > 0 && (
          <TaskTable
            tasks={tasks}
            pendingIds={pendingIds}
            onStatusChange={(id, status) => void changeStatus(id, status)}
            onDelete={(id) => void remove(id)}
          />
        )}
      </section>

      <NewTaskDrawer open={drawerOpen} onClose={closeCreate} onCreate={handleCreate} />
    </main>
  );
}

export function App() {
  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <AppHeader />
        <TasksPage />
      </div>
    </ToastProvider>
  );
}
