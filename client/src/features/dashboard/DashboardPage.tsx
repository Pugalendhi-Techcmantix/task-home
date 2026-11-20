import { TASK_STATUSES, type DashboardSummary, type TaskPriority } from "@tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, CheckCheck, CircleDot, Flame, Plus } from "lucide-react";
import type { ComponentProps, CSSProperties } from "react";
import { Link } from "react-router";
import { fetchDashboardSummary } from "@/api/dashboard";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { ErrorState, KpiCard, PageHeader, Panel, PanelHeader } from "@/components/common/Page";
import { PriorityLabel, StatusPill } from "@/components/common/Pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewTask } from "@/features/tasks/NewTaskProvider";
import { useMembers } from "@/features/team/queries";
import { STATUS_LABELS, formatShortDate } from "@/lib/labels";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { useCountUp } from "./useCountUp";

const STATUS_BAR: Record<(typeof TASK_STATUSES)[number], string> = {
  todo: "bg-sky",
  in_progress: "bg-warn",
  done: "bg-good",
};

/** Left edge colour per priority; the priority label beside it keeps the meaning non-colour-only. */
const PRIORITY_BAR: Record<TaskPriority, string> = {
  high: "bg-bad",
  medium: "bg-warn",
  low: "bg-muted-foreground",
};

const LINK_FOCUS = "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Index for the `.motion-fade-up` delay (`--i`); the CSS steps 35ms per index. */
function stagger(index: number): CSSProperties & Record<`--${string}`, number> {
  return { "--i": index };
}

/** Matches the `.motion-fade-up` step, so a count or a fill starts as its tile arrives. */
const STAGGER_MS = 35;

/** Entrance order (`--i`) after the header: four KPI tiles, then the three panels. */
const ORDER = { firstKpi: 1, attention: 5, workload: 6, status: 7 } as const;

/** Arrow that nudges 2px right when its `group` link is hovered or focused. */
const ARROW_NUDGE =
  "transition-[opacity,translate] duration-[var(--dur-2,180ms)] ease-[var(--ease-snappy,cubic-bezier(.2,.9,.25,1))] motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5";

/**
 * A bar that grows from its left edge when it first appears (CSS `@starting-style`, transform only, so no
 * layout shift). Under reduced motion the starting style is skipped and the bar is simply there.
 */
const GROW_FROM_LEFT = "origin-left motion-safe:starting:[transform:scaleX(0)]";

/** Meter rows start once the workload panel has risen in, then follow each other down the list. */
const METER_BASE_DELAY_MS = ORDER.workload * STAGGER_MS + 60;
const METER_STEP_MS = 50;
/** Status segments sweep left to right after the status panel arrives. */
const STATUS_BASE_DELAY_MS = ORDER.status * STAGGER_MS + 60;
const STATUS_STEP_MS = 90;

function growTransition(delayMs: number, extra?: string): CSSProperties {
  const grow = `transform var(--dur-4, 420ms) var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1)) ${delayMs}ms`;
  return { transition: extra ? `${extra}, ${grow}` : grow };
}

type CountedKpiProps = Omit<ComponentProps<typeof KpiCard>, "value"> & { value: number; index: number };

/**
 * KPI tile whose number counts up on mount and tweens on change. The animated copy is hidden from screen
 * readers, which get one sentence with the final value instead of every frame.
 */
function CountedKpi({ value, index, ...card }: CountedKpiProps) {
  const shown = useCountUp(value, { delay: index * STAGGER_MS });
  return (
    <div className="motion-fade-up relative grid min-w-0" style={stagger(index)}>
      <div className="grid min-w-0" aria-hidden="true">
        <KpiCard {...card} value={shown} />
      </div>
      <p className="sr-only">{`${card.label}: ${value}, ${card.caption}`}</p>
    </div>
  );
}

function percentOf(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function todayLabel(now: Date): string {
  const weekday = now.toLocaleDateString("en-GB", { weekday: "long" });
  const rest = now.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  return `${weekday}, ${rest}`;
}

function NeedsAttention({ tasks }: { tasks: DashboardSummary["needsAttention"] }) {
  const { data: members } = useMembers();
  const nameOf = (id: string | undefined) => members?.find((m) => m.id === id)?.name;

  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-10 text-sm text-muted-foreground">
        <span className="motion-pop grid size-10 shrink-0 place-items-center rounded-xl border border-good/20 bg-good-soft text-good-ink">
          <CheckCheck className="size-4.5" aria-hidden="true" />
        </span>
        Nothing urgent. No open high-priority tasks.
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {tasks.map((task, index) => {
        const assignee = nameOf(task.assigneeId);
        return (
          <li key={task.id} className="motion-fade-up" style={stagger(ORDER.attention + 1 + index)}>
            <Link
              to={`/tasks?task=${task.id}`}
              className="row-interactive group relative flex items-center gap-3 py-3 pr-4 pl-5"
            >
              <span
                className={cn("absolute inset-y-2.5 left-0 w-0.75 rounded-r-full", PRIORITY_BAR[task.priority])}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{task.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <PriorityLabel priority={task.priority} className="text-[11px]" />
                  <span aria-hidden="true">·</span>
                  created {formatShortDate(task.createdAt)}
                </p>
              </div>
              <StatusPill status={task.status} />
              <span className="hidden w-32 items-center gap-2 truncate text-xs sm:flex">
                {assignee ? (
                  <>
                    <MemberAvatar name={assignee} size="xs" />
                    <span className="truncate">{assignee}</span>
                  </>
                ) : (
                  <span className="text-faint">Unassigned</span>
                )}
              </span>
              <ArrowRight
                className={cn("reveal-on-hover size-4 shrink-0 text-muted-foreground", ARROW_NUDGE)}
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Workload({ rows }: { rows: DashboardSummary["workload"] }) {
  const max = Math.max(1, ...rows.map((row) => row.openCount));
  return (
    <ul className="space-y-4 px-4 py-4">
      {rows.map((row, index) => {
        const muted = row.memberId === null;
        const label = (
          <span className={cn("flex items-center gap-2 truncate text-sm", muted && "text-muted-foreground")}>
            {!muted && <MemberAvatar name={row.name} size="xs" />}
            {row.name}
          </span>
        );
        return (
          <li key={row.memberId ?? row.name}>
            <div className="flex items-center justify-between gap-3">
              {row.memberId ? (
                <Link to={`/tasks?assignee=${row.memberId}`} className={cn("min-w-0 hover:underline", LINK_FOCUS)}>
                  {label}
                </Link>
              ) : row.name === "Unassigned" ? (
                <Link to="/tasks?assignee=unassigned" className={cn("min-w-0 hover:underline", LINK_FOCUS)}>
                  {label}
                </Link>
              ) : (
                label
              )}
              <span className="num text-sm font-semibold">{row.openCount}</span>
            </div>
            <div className="meter mt-2" aria-hidden="true">
              <div
                className={cn("meter-fill", GROW_FROM_LEFT, muted && "bg-muted-foreground/40! bg-none!")}
                style={{
                  width: `${(row.openCount / max) * 100}%`,
                  ...growTransition(
                    METER_BASE_DELAY_MS + Math.min(index, 8) * METER_STEP_MS,
                    "width 600ms var(--ease-out-quint)",
                  ),
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StatusBreakdown({ summary }: { summary: DashboardSummary }) {
  const total = summary.totals.all;
  return (
    <div className="px-4 py-4">
      <div
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-sunken"
        role="img"
        aria-label={TASK_STATUSES.map((s) => `${STATUS_LABELS[s]} ${summary.byStatus[s]}`).join(", ")}
      >
        {TASK_STATUSES.map((status, index) =>
          summary.byStatus[status] > 0 ? (
            <div
              key={status}
              className={cn("rounded-full", GROW_FROM_LEFT, STATUS_BAR[status])}
              style={{
                flex: `${summary.byStatus[status]} 1 0%`,
                ...growTransition(STATUS_BASE_DELAY_MS + index * STATUS_STEP_MS),
              }}
            />
          ) : null,
        )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 shrink-0 rounded-full", STATUS_BAR[status])} aria-hidden="true" />
              <span className="truncate">{STATUS_LABELS[status]}</span>
            </dt>
            <dd className="mt-1 flex items-baseline gap-1.5">
              <Link to={`/tasks?status=${status}`} className={cn("num text-lg font-semibold hover:underline", LINK_FOCUS)}>
                {summary.byStatus[status]}
              </Link>
              <span className="num text-xs text-muted-foreground">{percentOf(summary.byStatus[status], total)}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading dashboard">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-26 rounded-panel" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-96 rounded-panel lg:col-span-7" />
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Skeleton className="h-52 rounded-panel" />
          <Skeleton className="h-36 rounded-panel" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const summary = useQuery({ queryKey: queryKeys.dashboard, queryFn: ({ signal }) => fetchDashboardSummary(signal) });
  const { data: members } = useMembers({ status: "active" });
  const { openNewTask } = useNewTask();

  return (
    <div className="flex flex-col gap-4">
      {/* The header arrives with the route's own entrance; the data below follows it in order. */}
      <div className="-mb-2">
        <PageHeader
          kicker={todayLabel(new Date())}
          title="Dashboard"
          description="Where your team's work stands right now: what's open, what's urgent, and who's carrying the load."
          actions={
            <Button onClick={openNewTask} aria-keyshortcuts="N">
              <Plus aria-hidden="true" />
              New task
            </Button>
          }
        />
      </div>
      {summary.isPending && <DashboardSkeleton />}
      {summary.isError && (
        <div className="motion-fade-up" style={stagger(1)}>
          <Panel>
            <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
          </Panel>
        </div>
      )}
      {summary.isSuccess && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CountedKpi
              index={ORDER.firstKpi}
              icon={CircleDot}
              label="Open tasks"
              value={summary.data.totals.open}
              caption={members ? `across ${members.length} active members` : "to do and in progress"}
              edge="brand"
            />
            <CountedKpi
              index={ORDER.firstKpi + 1}
              icon={Activity}
              label="In progress"
              value={summary.data.totals.inProgress}
              caption="started, not finished"
              edge="warn"
            />
            <CountedKpi
              index={ORDER.firstKpi + 2}
              icon={Flame}
              label="High priority"
              value={summary.data.totals.highOpen}
              caption="open and urgent"
              edge="bad"
            />
            <CountedKpi
              index={ORDER.firstKpi + 3}
              icon={CheckCheck}
              label="Done this week"
              value={summary.data.totals.doneThisWeek}
              caption="since Monday"
              edge="good"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="motion-fade-up min-w-0 lg:col-span-7 lg:self-start" style={stagger(ORDER.attention)}>
              <Panel>
                <PanelHeader
                  title="Needs attention"
                  action={
                    <Link
                      to="/tasks?priority=high"
                      className={cn(
                        "group inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline",
                        LINK_FOCUS,
                      )}
                    >
                      All high priority <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} aria-hidden="true" />
                    </Link>
                  }
                />
                <NeedsAttention tasks={summary.data.needsAttention} />
              </Panel>
            </div>
            <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
              <div className="motion-fade-up" style={stagger(ORDER.workload)}>
                <Panel>
                  <PanelHeader title="Workload by member" hint="open tasks" />
                  <Workload rows={summary.data.workload} />
                </Panel>
              </div>
              <div className="motion-fade-up" style={stagger(ORDER.status)}>
                <Panel>
                  <PanelHeader title="Tasks by status" hint={`${summary.data.totals.all} total`} />
                  <StatusBreakdown summary={summary.data} />
                </Panel>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
