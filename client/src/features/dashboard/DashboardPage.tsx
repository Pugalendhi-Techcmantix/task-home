import { TASK_STATUSES, type DashboardSummary } from "@tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, PartyPopper, Plus } from "lucide-react";
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

const STATUS_BAR: Record<(typeof TASK_STATUSES)[number], string> = {
  todo: "bg-sky",
  in_progress: "bg-warn",
  done: "bg-good",
};

function NeedsAttention({ tasks }: { tasks: DashboardSummary["needsAttention"] }) {
  const { data: members } = useMembers();
  const nameOf = (id: string | undefined) => members?.find((m) => m.id === id)?.name;

  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-8 text-sm text-muted-foreground">
        <PartyPopper className="size-5 text-good" aria-hidden="true" />
        Nothing urgent. No open high-priority tasks.
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {tasks.map((task) => {
        const assignee = nameOf(task.assigneeId);
        return (
          <li key={task.id}>
            <Link
              to={`/tasks?task=${task.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{task.title}</p>
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
                    <MemberAvatar name={assignee} />
                    <span className="truncate">{assignee}</span>
                  </>
                ) : (
                  <span className="text-faint">Unassigned</span>
                )}
              </span>
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
    <ul className="space-y-3.5 px-4 py-4">
      {rows.map((row) => {
        const muted = row.memberId === null;
        const label = (
          <span className={cn("flex items-center gap-2 truncate text-sm", muted && "text-muted-foreground")}>
            {!muted && <MemberAvatar name={row.name} className="size-5 text-[9px]" />}
            {row.name}
          </span>
        );
        return (
          <li key={row.memberId ?? row.name}>
            <div className="flex items-center justify-between gap-3">
              {row.memberId ? (
                <Link to={`/tasks?assignee=${row.memberId}`} className="min-w-0 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {label}
                </Link>
              ) : row.name === "Unassigned" ? (
                <Link to="/tasks?assignee=unassigned" className="min-w-0 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {label}
                </Link>
              ) : (
                label
              )}
              <span className="tabular text-sm font-semibold">{row.openCount}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-secondary" aria-hidden="true">
              <div
                className={cn("h-full rounded-full", muted ? "bg-faint" : "bg-brand")}
                style={{ width: `${(row.openCount / max) * 100}%` }}
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
      <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary" role="img" aria-label={TASK_STATUSES.map((s) => `${STATUS_LABELS[s]} ${summary.byStatus[s]}`).join(", ")}>
        {TASK_STATUSES.map((status) =>
          summary.byStatus[status] > 0 ? (
            <div key={status} className={STATUS_BAR[status]} style={{ width: `${(summary.byStatus[status] / Math.max(total, 1)) * 100}%` }} />
          ) : null,
        )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {TASK_STATUSES.map((status) => (
          <div key={status}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", STATUS_BAR[status])} aria-hidden="true" />
              {STATUS_LABELS[status]}
            </dt>
            <dd className="tabular mt-0.5 text-lg font-bold">
              <Link to={`/tasks?status=${status}`} className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {summary.byStatus[status]}
              </Link>
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
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 lg:col-span-3" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const summary = useQuery({ queryKey: queryKeys.dashboard, queryFn: ({ signal }) => fetchDashboardSummary(signal) });
  const { data: members } = useMembers({ status: "active" });
  const { openNewTask } = useNewTask();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Where your team's work stands right now: what's open, what's urgent, and who's carrying the load."
        actions={
          <Button onClick={openNewTask} aria-keyshortcuts="N">
            <Plus aria-hidden="true" />
            New task
          </Button>
        }
      />
      {summary.isPending && <DashboardSkeleton />}
      {summary.isError && (
        <Panel>
          <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
        </Panel>
      )}
      {summary.isSuccess && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Open tasks"
              value={summary.data.totals.open}
              caption={members ? `across ${members.length} active members` : "to do and in progress"}
            />
            <KpiCard label="In progress" value={summary.data.totals.inProgress} caption="started, not finished" edge="warn" />
            <KpiCard label="High priority" value={summary.data.totals.highOpen} caption="open and urgent" edge="bad" />
            <KpiCard label="Done this week" value={summary.data.totals.doneThisWeek} caption="since Monday" edge="good" />
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Panel className="lg:col-span-3">
              <PanelHeader
                title="Needs attention"
                action={
                  <Link to="/tasks?priority=high" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                    All high priority <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                }
              />
              <NeedsAttention tasks={summary.data.needsAttention} />
            </Panel>
            <Panel className="lg:col-span-2">
              <PanelHeader title="Workload by member" hint="open tasks" />
              <Workload rows={summary.data.workload} />
            </Panel>
          </div>
          <Panel>
            <PanelHeader title="Tasks by status" hint={`${summary.data.totals.all} total`} />
            <StatusBreakdown summary={summary.data} />
          </Panel>
        </div>
      )}
    </>
  );
}
