import type { Member, Task, TaskStatus } from "@tracker/shared";
import { useRef } from "react";
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
}

interface TaskListProps extends TaskListHandlers {
  tasks: Task[];
  members: Member[];
  membersById: Map<string, Member>;
  highlightId: string | null;
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
    <time dateTime={iso} title={formatDateTime(iso)} className="tabular whitespace-nowrap">
      {formatShortDate(iso)}
    </time>
  );
}

const highlightClass = "animate-[row-flash_2.2s_ease-out_1]";

export function TaskList({ tasks, members, membersById, highlightId, onStatusChange, onAssign, onDelete }: TaskListProps) {
  const assignee = useAssigneeFocus();
  const currentOf = (task: Task) => (task.assigneeId ? membersById.get(task.assigneeId) : undefined);

  return (
    <>
      {/* Desktop: table */}
      <Table className="hidden table-fixed md:table">
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
          {tasks.map((task) => (
            <TableRow key={task.id} data-task-id={task.id} className={cn(highlightId === task.id && highlightClass)}>
              <TableCell className="py-3 pl-4 whitespace-normal">
                <p className="font-medium [overflow-wrap:anywhere]">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground" title={task.description}>
                    {task.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <StatusSelect task={task} onChange={(status) => onStatusChange(task, status)} />
              </TableCell>
              <TableCell>
                <PriorityLabel priority={task.priority} />
              </TableCell>
              <TableCell>
                <AssigneeSelect
                  task={task}
                  members={members}
                  current={currentOf(task)}
                  triggerId={assignee.idFor(task.id, "row")}
                  onChange={(id) => onAssign(task, id)}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                <CreatedAt iso={task.createdAt} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <RowMenu task={task} onChangeAssignee={() => assignee.open(task.id)} onDelete={() => onDelete(task)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Phones: cards */}
      <ul className="divide-y md:hidden" aria-label="Tasks">
        {tasks.map((task) => (
          <li key={task.id} data-task-id={task.id} className={cn("space-y-3 px-4 py-4", highlightId === task.id && highlightClass)}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium [overflow-wrap:anywhere]">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground [overflow-wrap:anywhere]">{task.description}</p>
                )}
              </div>
              <RowMenu task={task} onChangeAssignee={() => assignee.open(task.id)} onDelete={() => onDelete(task)} />
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
          </li>
        ))}
      </ul>
    </>
  );
}
