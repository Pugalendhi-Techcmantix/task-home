import type { Member, Task, TaskStatus } from "@tracker/shared";
import { useRef, useState } from "react";
import {
  useChangedIds,
  useRowEntrance,
  useRowExit,
  useRowReflow,
  type MotionProps,
} from "@/components/common/motion";
import { eyebrow } from "@/components/common/Page";
import { PriorityLabel } from "@/components/common/Pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatShortDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { AssigneeSelect, RowMenu, StatusSelect } from "./TaskRowControls";

export interface TaskListHandlers {
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onAssign: (task: Task, assigneeId: string | null) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
}

interface TaskListProps extends TaskListHandlers {
  tasks: Task[];
  members: Member[];
  membersById: Map<string, Member>;
  highlightId: string | null;
  /** How rows present on mount enter: a stagger on the page's first load, otherwise the list cross-fades. */
  entrance: "stagger" | "none";
  /** Rows whose delete is in flight: they fade out until the refetch removes them. */
  leavingIds: ReadonlySet<string>;
}

/** Opens the assignee picker of a row (used by the ⋯ menu's "Change assignee"). */
function useAssigneeFocus() {
  const ids = useRef(new Map<string, string>());
  return {
    idFor: (taskId: string, variant: "row" | "card") => {
      const key = `${variant}-${taskId}`;
      if (!ids.current.has(key)) ids.current.set(key, `assignee-${key}`);
      return ids.current.get(key) ?? key;
    },
    open: (taskId: string) => {
      const visible = [`assignee-row-${taskId}`, `assignee-card-${taskId}`]
        .map((id) => document.getElementById(id))
        .find((el) => el !== null && el.offsetParent !== null);
      // Wait for the dropdown menu to close and return focus before opening the picker.
      window.setTimeout(() => visible?.click(), 50);
    },
  };
}

function CreatedAt({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className="num whitespace-nowrap">
      {formatShortDate(iso)}
    </time>
  );
}

const ROW_ATTR = "data-task-id";
/** What a quick edit can change; a row whose signature changes flashes once. */
const quickEditSignature = (task: Task) => `${task.status}|${task.priority}|${task.assigneeId ?? ""}`;
const CHANGED: MotionProps = { className: "motion-flash" };
/** `?task=` highlight: the same flash, held longer so it is still visible after the scroll lands. */
const HIGHLIGHTED: MotionProps = { className: "motion-flash", style: { animationDuration: "2.4s" } };
const NO_FLASH: MotionProps = {};

/*
 * Motion: the entrance runs on the row (<tr>/<li>) and the flash on its cells / card surface, because
 * both use `animation` and would cancel each other on one element.
 */
export function TaskList({
  tasks,
  members,
  membersById,
  highlightId,
  entrance,
  leavingIds,
  onStatusChange,
  onAssign,
  onDelete,
  onEdit,
}: TaskListProps) {
  const assignee = useAssigneeFocus();
  const currentOf = (task: Task) => (task.assigneeId ? membersById.get(task.assigneeId) : undefined);

  const rootRef = useRef<HTMLDivElement>(null);
  const ids = tasks.map((task) => task.id);
  const [mode] = useState(entrance);
  const enter = useRowEntrance(ids, mode);
  const changed = useChangedIds(tasks, quickEditSignature);
  useRowReflow(rootRef, ROW_ATTR, ids.join(" "));
  useRowExit(rootRef, ROW_ATTR, leavingIds);
  const flashOf = (task: Task): MotionProps =>
    highlightId === task.id ? HIGHLIGHTED : changed.has(task.id) ? CHANGED : NO_FLASH;

  return (
    <div ref={rootRef} className={mode === "none" ? "animate-in duration-80 fade-in-0" : undefined}>
      {/* Desktop: table */}
      <Table className="hidden table-fixed xl:table">
        <caption className="sr-only">Tasks</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(eyebrow, "h-9 pl-4")}>Task</TableHead>
            <TableHead className={cn(eyebrow, "h-9 w-36")}>Status</TableHead>
            <TableHead className={cn(eyebrow, "h-9 w-28")}>Priority</TableHead>
            <TableHead className={cn(eyebrow, "h-9 w-52")}>Assignee</TableHead>
            <TableHead className={cn(eyebrow, "h-9 w-24")}>Created</TableHead>
            <TableHead className="h-9 w-14 pr-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task, index) => {
            const row = enter(task.id, index);
            const flash = flashOf(task);
            return (
              <TableRow
                key={task.id}
                data-task-id={task.id}
                className={cn("row-interactive group h-13", row.className)}
                style={row.style}
              >
                <TableCell className={cn("py-2 pl-4 whitespace-normal", flash.className)} style={flash.style}>
                  <p className="text-[13.5px] leading-5 font-medium wrap-anywhere">{task.title}</p>
                  {task.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground" title={task.description}>
                      {task.description}
                    </p>
                  )}
                </TableCell>
                <TableCell className={flash.className} style={flash.style}>
                  <StatusSelect task={task} onChange={(status) => onStatusChange(task, status)} />
                </TableCell>
                <TableCell className={flash.className} style={flash.style}>
                  <PriorityLabel priority={task.priority} />
                </TableCell>
                <TableCell className={flash.className} style={flash.style}>
                  <AssigneeSelect
                    task={task}
                    members={members}
                    current={currentOf(task)}
                    triggerId={assignee.idFor(task.id, "row")}
                    onChange={(id) => onAssign(task, id)}
                  />
                </TableCell>
                <TableCell className={cn("text-xs text-muted-foreground", flash.className)} style={flash.style}>
                  <CreatedAt iso={task.createdAt} />
                </TableCell>
                <TableCell className={cn("py-2 pr-4 text-right", flash.className)} style={flash.style}>
                  <RowMenu task={task} onEdit={() => onEdit(task)} onChangeAssignee={() => assignee.open(task.id)} onDelete={() => onDelete(task)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Phones: cards */}
      <ul className="space-y-2 p-3 xl:hidden" aria-label="Tasks">
        {tasks.map((task, index) => {
          const card = enter(task.id, index);
          const flash = flashOf(task);
          return (
            <li key={task.id} data-task-id={task.id} className={card.className} style={card.style}>
              <div className={cn("surface-panel group space-y-3 p-3.5", flash.className)} style={flash.style}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] leading-5 font-medium wrap-anywhere">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground wrap-anywhere">{task.description}</p>
                    )}
                  </div>
                  <RowMenu task={task} onEdit={() => onEdit(task)} onChangeAssignee={() => assignee.open(task.id)} onDelete={() => onDelete(task)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusSelect task={task} onChange={(status) => onStatusChange(task, status)} />
                  <PriorityLabel priority={task.priority} />
                  <span className="ml-auto text-xs text-muted-foreground">
                    <CreatedAt iso={task.createdAt} />
                  </span>
                </div>
                <AssigneeSelect
                  task={task}
                  members={members}
                  current={currentOf(task)}
                  triggerId={assignee.idFor(task.id, "card")}
                  onChange={(id) => onAssign(task, id)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
