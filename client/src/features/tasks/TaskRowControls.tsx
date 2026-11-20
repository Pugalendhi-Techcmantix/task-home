import { TASK_STATUSES, type Member, type Task, type TaskStatus } from "@tracker/shared";
import { MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { MemberAvatar } from "@/components/common/MemberAvatar";
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

function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value);
}

/** Status pill that is also the quick-update control. */
export function StatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
  return (
    <Select value={task.status} onValueChange={(value) => isTaskStatus(value) && onChange(value)}>
      <SelectTrigger
        size="sm"
        aria-label={`Status for "${task.title}"`}
        className={cn("h-7 w-auto gap-1.5 rounded-md border px-2 text-xs font-semibold shadow-none", TONE_CLASSES[STATUS_TONES[task.status]])}
      >
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
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
        className="h-8 w-full max-w-[13rem] border-transparent bg-transparent px-1.5 shadow-none hover:border-border"
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
            <MemberAvatar name={inactiveCurrent.name} muted className="size-5 text-[9px]" />
            {inactiveCurrent.name} <span className="text-faint">(inactive)</span>
          </SelectItem>
        )}
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            <MemberAvatar name={member.name} className="size-5 text-[9px]" />
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
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for "${task.title}"`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
