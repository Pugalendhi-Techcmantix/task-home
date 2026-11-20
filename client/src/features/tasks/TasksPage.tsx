import type { Task, TaskPriority } from "@tracker/shared";
import { ListChecks, Plus, SearchX, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { EmptyState, ErrorState, PageHeader, Panel } from "@/components/common/Page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveMembers, useMembers } from "@/features/team/queries";
import { EditTaskSheet } from "./EditTaskSheet";
import { useNewTask } from "./NewTaskProvider";
import { useAssignTask, useDeleteTask, useTasks, useUpdateTaskStatus } from "./queries";
import { TaskFilters } from "./TaskFilters";
import { TaskList } from "./TaskList";
import { readSort, readTaskFilters, withParam } from "./urlFilters";

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

function byPriorityThenNewest(a: Task, b: Task): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt);
}

const NO_IDS: ReadonlySet<string> = new Set();

/** The list's identity: filters and sort, but not the `?task=` highlight. */
function listKeyOf(params: URLSearchParams): string {
  const key = new URLSearchParams(params);
  key.delete("task");
  key.sort();
  return key.toString();
}

function TableSkeleton() {
  return (
    <div className="divide-y" role="status" aria-label="Loading tasks">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex h-13 items-center gap-4 px-4">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="hidden h-6 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-16 sm:block" />
          <Skeleton className="hidden h-6 w-32 md:block" />
        </div>
      ))}
    </div>
  );
}

export function TasksPage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readTaskFilters(params), [params]);
  const sort = readSort(params);
  const highlightId = params.get("task");

  const list = useTasks(filters);
  const all = useTasks();
  const members = useActiveMembers();
  const { data: everyone } = useMembers();
  const membersById = useMemo(() => new Map((everyone ?? []).map((m) => [m.id, m])), [everyone]);
  const { openNewTask } = useNewTask();

  const updateStatus = useUpdateTaskStatus();
  const assign = useAssignTask();
  const remove = useDeleteTask();

  // Motion only. The first list shown on this visit staggers in; after any filter or sort change the
  // list is remounted (keyed by listKey) and cross-fades instead.
  const listKey = listKeyOf(params);
  const [firstListKey] = useState(listKey);
  const [refiltered, setRefiltered] = useState(false);
  if (!refiltered && listKey !== firstListKey) setRefiltered(true);
  // Rows whose delete is in flight fade out. The mutation stays pending until its refetch lands, so the
  // set is only read while pending; a failed delete brings its row back.
  const [deleting, setDeleting] = useState(NO_IDS);
  const leavingIds = remove.isPending ? deleting : NO_IDS;

  const [editing, setEditing] = useState<Task | null>(null);
  const editingAssignee = editing?.assigneeId ? membersById.get(editing.assigneeId) : undefined;
  const inactiveAssignee = editingAssignee?.status === "inactive" ? editingAssignee : undefined;

  const tasks = useMemo(() => {
    const data = list.data ?? [];
    return sort === "priority" ? [...data].sort(byPriorityThenNewest) : data;
  }, [list.data, sort]);

  // ?task=<id>: scroll to and briefly highlight that row (from ⌘K or the dashboard).
  useEffect(() => {
    if (!highlightId || list.isPending) return;
    const row = [...document.querySelectorAll<HTMLElement>(`[data-task-id="${CSS.escape(highlightId)}"]`)].find(
      (el) => el.offsetParent !== null,
    );
    if (row) row.scrollIntoView({ block: "center", behavior: "smooth" });
    else toast.error("Task not found");
  }, [highlightId, list.isPending]);

  const hasFilters = Object.keys(filters).length > 0;
  const clearFilters = () => setParams(new URLSearchParams(sort === "priority" ? "sort=priority" : ""));

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every task and bug your team has logged. Filter, reassign and update status right from the list."
        actions={
          <Button onClick={openNewTask} aria-keyshortcuts="N">
            <Plus aria-hidden="true" />
            New task
            <kbd
              className="kbd ml-1 hidden border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground sm:inline-flex"
              aria-hidden="true"
            >
              N
            </kbd>
          </Button>
        }
      />
      <Panel>
        <TaskFilters
          filters={filters}
          sort={sort}
          allTasks={all.data}
          resultCount={list.isSuccess ? tasks.length : undefined}
          onChange={(key, value) => setParams(withParam(params, key, value))}
          onClear={clearFilters}
        />
        {list.isPending && <TableSkeleton />}
        {list.isError && <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />}
        {list.isSuccess && tasks.length === 0 && (
          hasFilters ? (
            <EmptyState
              icon={<SearchX className="size-5" aria-hidden="true" />}
              title="No tasks match these filters"
              body="Try a different status, priority or assignee, or clear the filters to see every task."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  <X aria-hidden="true" />
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ListChecks className="size-5" aria-hidden="true" />}
              title="No tasks yet"
              body="Log your first task or bug to get started."
              action={
                <Button onClick={openNewTask}>
                  <Plus aria-hidden="true" />
                  New task
                </Button>
              }
            />
          )
        )}
        {list.isSuccess && tasks.length > 0 && (
          <TaskList
            key={listKey}
            entrance={refiltered ? "none" : "stagger"}
            leavingIds={leavingIds}
            tasks={tasks}
            members={members}
            membersById={membersById}
            highlightId={highlightId}
            onStatusChange={(task, status) => updateStatus.mutate({ id: task.id, status })}
            onAssign={(task, assigneeId) => assign.mutate({ id: task.id, assigneeId })}
            onDelete={(task) => {
              setDeleting((current) => new Set(remove.isPending ? [...current, task.id] : [task.id]));
              remove.mutate(task.id);
            }}
            onEdit={setEditing}
          />
        )}
      </Panel>
      <EditTaskSheet task={editing} inactiveAssignee={inactiveAssignee} onClose={() => setEditing(null)} />
    </>
  );
}
