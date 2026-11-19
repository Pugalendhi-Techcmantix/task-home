import { TASK_STATUSES, type TaskStatus } from "@tracker/shared";
import { ChevronDown } from "lucide-react";
import { STATUS_LABELS } from "../lib/labels";

const STATUS_STYLES: Record<TaskStatus, { pill: string; dot: string }> = {
  todo: { pill: "bg-slate-100 text-slate-700 ring-slate-300", dot: "bg-slate-400" },
  in_progress: { pill: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  done: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
};

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  /** Accessible name, e.g. `Status for "Fix login"`. */
  label: string;
  disabled?: boolean;
}

function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

/** A native select styled as a colored status pill: the status indicator and the quick-update control in one. */
export function StatusSelect({ value, onChange, label, disabled = false }: StatusSelectProps) {
  const styles = STATUS_STYLES[value];
  return (
    <div className="relative inline-flex">
      <span
        className={`pointer-events-none absolute top-1/2 left-2.5 size-2 -translate-y-1/2 rounded-full ${styles.dot}`}
        aria-hidden="true"
      />
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          if (isTaskStatus(event.target.value)) onChange(event.target.value);
        }}
        className={`h-8 cursor-pointer appearance-none rounded-full py-0 pr-7 pl-6 text-xs font-medium ring-1 transition-colors ring-inset focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 ${styles.pill}`}
      >
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70"
        aria-hidden="true"
      />
    </div>
  );
}
