import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskQuery,
  type TaskStatus,
} from "@tracker/shared";
import { LoaderCircle, X } from "lucide-react";
import { useId } from "react";
import { PRIORITY_LABELS, STATUS_LABELS } from "../lib/labels";
import { buttonGhost } from "../lib/styles";
import { SelectField } from "./SelectField";

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

export function TaskToolbar({ filters, onChange, onClear, count, refreshing }: TaskToolbarProps) {
  const hasFilters = filters.status !== undefined || filters.priority !== undefined;
  const statusId = useId();
  const priorityId = useId();

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={statusId} className="text-xs font-medium text-slate-600">
            Status
          </label>
          <SelectField
            id={statusId}
            className="sm:w-44"
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
          </SelectField>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={priorityId} className="text-xs font-medium text-slate-600">
            Priority
          </label>
          <SelectField
            id={priorityId}
            className="sm:w-44"
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
          </SelectField>
        </div>

        {hasFilters && (
          <button type="button" onClick={onClear} className={`${buttonGhost} col-span-2 justify-self-start`}>
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
