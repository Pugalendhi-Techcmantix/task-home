import type { TaskPriority } from "@tracker/shared";
import { SignalHigh, SignalLow, SignalMedium, type LucideIcon } from "lucide-react";
import { PRIORITY_LABELS } from "../lib/labels";

const PRIORITY_STYLES: Record<TaskPriority, { className: string; Icon: LucideIcon }> = {
  low: { className: "bg-slate-100 text-slate-600 ring-slate-200", Icon: SignalLow },
  medium: { className: "bg-amber-50 text-amber-800 ring-amber-200", Icon: SignalMedium },
  high: { className: "bg-red-50 text-red-700 ring-red-200", Icon: SignalHigh },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { className, Icon } = PRIORITY_STYLES[priority];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${className}`}
    >
      <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
