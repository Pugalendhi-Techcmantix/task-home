import { CloudOff, ListChecks, Plus, RotateCw, SearchX, X } from "lucide-react";
import type { ReactNode } from "react";
import { buttonPrimary, buttonSecondary } from "../lib/styles";

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading tasks" className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 px-4 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/5 rounded bg-slate-200" />
            <div className="h-3 w-3/5 rounded bg-slate-100" />
          </div>
          <div className="hidden h-7 w-24 rounded-full bg-slate-100 sm:block" />
          <div className="hidden h-6 w-16 rounded-md bg-slate-100 sm:block" />
          <div className="hidden h-3 w-20 rounded bg-slate-100 md:block" />
        </div>
      ))}
      <span className="sr-only">Loading tasks…</span>
    </div>
  );
}

function StateFrame({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">{icon}</div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

const secondaryButton = buttonSecondary;
const primaryButton = buttonPrimary;

interface EmptyStateProps {
  /** True when filters are active, so the empty list means "no matches", not "no tasks". */
  filtered: boolean;
  onClear: () => void;
  onCreate: () => void;
}

export function EmptyState({ filtered, onClear, onCreate }: EmptyStateProps) {
  if (filtered) {
    return (
      <StateFrame
        icon={<SearchX className="size-6" aria-hidden="true" />}
        title="No tasks match these filters"
        body="Try a different status or priority, or clear the filters to see every task."
        action={
          <button type="button" onClick={onClear} className={secondaryButton}>
            <X className="size-4" aria-hidden="true" />
            Clear filters
          </button>
        }
      />
    );
  }
  return (
    <StateFrame
      icon={<ListChecks className="size-6" aria-hidden="true" />}
      title="No tasks yet"
      body="Log your first task or bug to get started."
      action={
        <button type="button" onClick={onCreate} className={primaryButton}>
          <Plus className="size-4" aria-hidden="true" />
          New task
        </button>
      }
    />
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <StateFrame
        icon={<CloudOff className="size-6" aria-hidden="true" />}
        title="Couldn't load tasks"
        body={message}
        action={
          <button type="button" onClick={onRetry} className={secondaryButton}>
            <RotateCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        }
      />
    </div>
  );
}
