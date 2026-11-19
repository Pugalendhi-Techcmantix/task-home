import { Plus } from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { TaskTable } from "./components/TaskTable";
import { EmptyState, ErrorState, SkeletonRows } from "./components/TaskStates";
import { TaskToolbar } from "./components/TaskToolbar";
import { ToastProvider } from "./components/toast/ToastProvider";
import { useTasks } from "./hooks/useTasks";

function TasksPage() {
  const { tasks, state, error, refreshing, filters, setFilters, reload, changeStatus, remove, pendingIds } =
    useTasks();
  const filtered = filters.status !== undefined || filters.priority !== undefined;
  const clearFilters = () => setFilters({});
  const openCreate = () => undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Log, filter and update your team&apos;s tasks and bugs.</p>
        </div>
        <button
          type="button"
          disabled
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden="true" />
          New task
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
