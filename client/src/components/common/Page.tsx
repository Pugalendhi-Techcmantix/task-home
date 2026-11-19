import { CloudOff, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White panel with the reference's border and radius. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("overflow-hidden rounded-lg border bg-card", className)}>{children}</section>;
}

export function PanelHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {action ?? (hint && <span className="text-xs text-muted-foreground">{hint}</span>)}
    </div>
  );
}

/** Uppercase 10px label used for KPI and table headers. */
export const eyebrow = "text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase";

const EDGE: Record<"warn" | "bad" | "good" | "brand", string> = {
  warn: "border-t-warn",
  bad: "border-t-bad",
  good: "border-t-good",
  brand: "border-t-brand",
};

interface KpiCardProps {
  label: string;
  value: number | string;
  caption: string;
  edge?: keyof typeof EDGE;
}

export function KpiCard({ label, value, caption, edge }: KpiCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card px-4 py-3.5", edge && "border-t-[3px]", edge && EDGE[edge])}>
      <p className={eyebrow}>{label}</p>
      <p className="tabular mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">{icon}</div>
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        icon={<CloudOff className="size-5" aria-hidden="true" />}
        title="Couldn't load this page"
        body={message}
        action={
          <Button variant="outline" onClick={onRetry}>
            <RotateCw aria-hidden="true" />
            Try again
          </Button>
        }
      />
    </div>
  );
}
