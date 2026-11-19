import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskQuery,
  type TaskStatus,
} from "@tracker/shared";
import { ChevronDown, LoaderCircle, X } from "lucide-react";
import { useId } from "react";
import { PRIORITY_LABELS, STATUS_LABELS } from "../lib/labels";

interface TaskToolbarProps {
  filters: TaskQuery;
  onChange: (next: TaskQuery) => void;
  onClear: () => void;
  /** Shown as "n tasks" once the list has loaded. */
  count: number | null;
  refreshing: boolean;
}

const ALL = "all";

function pick<T extends string>(options: readonly T[], value: string): T | undefined {
  return options.find((option) => option === value);
}

const selectClass =
  "h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-0 pr-8 pl-3 text-sm text-slate-900 shadow-xs transition-colors hover:border-slate-400 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/30 focus-visible:outline-none sm:w-44";

export function TaskToolbar({ filters, onChange, onClear, count, refreshing }: TaskToolbarProps) {
  const hasFilters = filters.status !== undefined || filters.priority !== undefined;
  const statusId = useId();
  const priorityId = useId();

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={statusId} className="text-xs font-medium text-slate-600">
            Status
          </label>
          <span className="relative">
            <select
              id={statusId}
              className={selectClass}
              value={filters.status ?? ALL}
              onChange={(event) => {
                const status: TaskStatus | undefined = pick(TASK_STATUSES, event.target.value);
                onChange({ ...filters, status });
              }}
            >
              <option value={ALL}>All statuses</option>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={priorityId} className="text-xs font-medium text-slate-600">
            Priority
          </label>
          <span className="relative">
            <select
              id={priorityId}
              className={selectClass}
              value={filters.priority ?? ALL}
              onChange={(event) => {
                const priority: TaskPriority | undefined = pick(TASK_PRIORITIES, event.target.value);
                onChange({ ...filters, priority });
              }}
            >
              <option value={ALL}>All priorities</option>
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
          </span>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none sm:self-auto"
          >
            <X className="size-4" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      <p className="flex h-9 items-center gap-2 text-sm text-slate-500" aria-live="polite">
        {refreshing && <LoaderCircle className="size-4 animate-spin text-slate-400" aria-hidden="true" />}
        {count !== null && (
          <span>
            {count} {count === 1 ? "task" : "tasks"}
            {hasFilters ? " match" : ""}
          </span>
        )}
      </p>
    </div>
  );
}
