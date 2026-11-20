import type { CreateTaskInput, Member, Task } from "@tracker/shared";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEditTask } from "./queries";
import { TaskForm } from "./TaskForm";

const EDIT_TASK_FORM_ID = "edit-task-form";

interface EditTaskSheetProps {
  /** The task being edited; `null` closes the panel. */
  task: Task | null;
  /** The task's assignee when they have since been deactivated. */
  inactiveAssignee: Member | undefined;
  onClose: () => void;
}

/** Side panel that edits every field of a task in one request (PATCH /api/tasks/:id/details). */
export function EditTaskSheet({ task, inactiveAssignee, onClose }: EditTaskSheetProps) {
  const [submitting, setSubmitting] = useState(false);
  const editTask = useEditTask();

  async function handleSave(input: CreateTaskInput): Promise<void> {
    if (!task) return;
    await editTask.mutateAsync({
      id: task.id,
      input: {
        title: input.title,
        description: input.description ?? "",
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId ?? null,
      },
    });
    toast.success("Task updated");
    onClose();
  }

  return (
    <Sheet
      open={task !== null}
      onOpenChange={(next) => {
        // Keep the panel open while saving so a failure can still be shown in the form.
        if (!next && !submitting) onClose();
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Edit task</SheetTitle>
          <SheetDescription>Change any detail. Everything saves together.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {task && (
            <TaskForm
              key={task.id}
              formId={EDIT_TASK_FORM_ID}
              initial={task}
              inactiveAssignee={inactiveAssignee}
              onSubmit={handleSave}
              onSubmittingChange={setSubmitting}
            />
          )}
        </div>
        <SheetFooter className="flex-row justify-end gap-2 border-t bg-muted/40 px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form={EDIT_TASK_FORM_ID} disabled={submitting}>
            {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
