import { CloudOff, RotateCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  /** Small uppercase line above the title (for example a date). */
  kicker?: string;
}

export function PageHeader({ title, description, actions, kicker }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {kicker && <p className="eyebrow mb-1.5">{kicker}</p>}
        <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Raised panel: hairline border, 12px radius and a soft shadow. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("surface-panel overflow-hidden", className)}>{children}</section>;
}

export function PanelHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex h-11 items-center justify-between gap-3 border-b px-4">
      <h2 className={eyebrow}>{title}</h2>
      {action ?? (hint && <span className="text-xs text-muted-foreground">{hint}</span>)}
    </div>
  );
}

/** Uppercase 10px label used for KPI and table headers. */
export const eyebrow = "text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase";

interface KpiCardProps {
  label: string;
  value: number | string;
  caption: string;
  edge?: "warn" | "bad" | "good" | "brand";
  /** Optional icon shown in a small chip at the top right. */
  icon?: LucideIcon;
}

export function KpiCard({ label, value, caption, edge, icon: Icon }: KpiCardProps) {
  return (
    <div
      data-edge={edge}
      className={cn("surface-panel motion-lift relative overflow-hidden px-4 py-3.5", edge && "kpi-edge")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={eyebrow}>{label}</p>
        {Icon && (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sunken text-muted-foreground">
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="num mt-1.5 text-3xl leading-9 font-semibold tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  /** Colour of the icon tile; "bad" is used for errors. */
  tone?: "default" | "bad";
}

export function EmptyState({ icon, title, body, action, tone = "default" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div
        className={cn(
          "motion-pop grid size-10 place-items-center rounded-xl border",
          tone === "bad" ? "border-bad/20 bg-bad-soft text-bad-ink" : "bg-sunken text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        tone="bad"
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
