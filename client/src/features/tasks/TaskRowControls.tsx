import { TASK_STATUSES, type Member, type Task, type TaskStatus } from "@tracker/shared";
import { MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { REVEAL_TRANSITION } from "@/components/common/motion";
import { STATUS_TONES, TONE_CLASSES } from "@/components/common/Pill";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const UNASSIGNED = "__unassigned";

/** Dot colour per status, matching the status chip tone. */
const STATUS_DOT: Record<TaskStatus, string> = { todo: "bg-sky-ink", in_progress: "bg-warn-ink", done: "bg-good-ink" };

function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value);
}

/** The chip's dot. After a status change (not on mount) it re-mounts and pops from a larger scale once. */
function StatusDot({ status }: { status: TaskStatus }) {
  const [seen, setSeen] = useState({ status, changed: false });
  if (seen.status !== status) setSeen({ status, changed: true });
  return (
    <span
      key={status}
      className={cn(
        "size-1.5 rounded-full bg-current",
        seen.changed && "animate-in duration-(--dur-3) ease-(--ease-spring) zoom-in-[1.9]",
      )}
      aria-hidden="true"
    />
  );
}

/** Status pill that is also the quick-update control. */
export function StatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
  return (
    <Select value={task.status} onValueChange={(value) => isTaskStatus(value) && onChange(value)}>
      <SelectTrigger
        size="sm"
        aria-label={`Status for "${task.title}"`}
        className={cn(
          "h-6 w-auto gap-1.5 rounded-md border py-0 pr-1.5 pl-2 text-xs font-medium shadow-none transition-[color,background-color,border-color,box-shadow,filter] duration-(--dur-2) ease-(--ease-snappy) hover:border-current/40 hover:brightness-95 dark:hover:brightness-110 [&>svg:last-child]:size-3 [&>svg:last-child]:opacity-60",
          TONE_CLASSES[STATUS_TONES[task.status]],
        )}
      >
        <StatusDot status={task.status} />
        <SelectValue>{STATUS_LABELS[task.status]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
            {STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface AssigneeSelectProps {
  task: Task;
  members: Member[];
  /** The assigned member even if inactive (they aren't in `members`). */
  current: Member | undefined;
  onChange: (assigneeId: string | null) => void;
  triggerId?: string;
}

export function AssigneeSelect({ task, members, current, onChange, triggerId }: AssigneeSelectProps) {
  const inactiveCurrent = current && current.status === "inactive" ? current : undefined;
  return (
    <Select
      value={task.assigneeId ?? UNASSIGNED}
      onValueChange={(value) => onChange(value === UNASSIGNED ? null : value)}
    >
      <SelectTrigger
        id={triggerId}
        size="sm"
        aria-label={`Assignee for "${task.title}"`}
        className="h-8 w-fit max-w-full justify-start gap-1.5 border-transparent bg-transparent px-1.5 text-[13px] shadow-none hover:border-border-strong hover:bg-row-hover data-[state=open]:border-border-strong dark:bg-transparent dark:hover:bg-row-hover *:data-[slot=select-value]:min-w-0"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>
          <UserRound className="text-faint" aria-hidden="true" />
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {inactiveCurrent && (
          <SelectItem value={inactiveCurrent.id} disabled>
            <MemberAvatar name={inactiveCurrent.name} muted size="xs" />
            <span className="truncate" title={inactiveCurrent.name}>
              {inactiveCurrent.name}
            </span>
            <span className="shrink-0 text-faint">(inactive)</span>
          </SelectItem>
        )}
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            <MemberAvatar name={member.name} size="xs" />
            {member.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface RowMenuProps {
  task: Task;
  onEdit: () => void;
  onChangeAssignee: () => void;
  onDelete: () => void;
}

/** ⋯ menu with "Edit", "Change assignee" and a confirmed "Delete". */
export function RowMenu({ task, onEdit, onChangeAssignee, onDelete }: RowMenuProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("reveal-on-hover size-8 text-muted-foreground", REVEAL_TRANSITION)}
            aria-label={`Actions for "${task.title}"`}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onChangeAssignee}>
            <UserRound aria-hidden="true" />
            Change assignee
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{task.title}&rdquo; will be permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
