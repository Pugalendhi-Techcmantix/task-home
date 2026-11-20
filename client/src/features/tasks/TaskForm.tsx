import {
  createTaskSchema,
  DESCRIPTION_MAX,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TITLE_MAX,
  type CreateTaskInput,
  type Member,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@tracker/shared";
import { CircleAlert } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "@/api/tasks";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveMembers } from "@/features/team/queries";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const FIELDS = ["title", "description", "status", "priority", "assigneeId"] as const;
type FieldName = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<FieldName, string>>;

export const TASK_FORM_ID = "new-task-form";
/** Radix Select can't use "" as a value, so "no assignee" gets a sentinel. */
const UNASSIGNED = "__unassigned";

interface TaskFormProps {
  /** Resolves on success. Rejects with ApiError to show server-side field errors. */
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onSubmittingChange?: (submitting: boolean) => void;
  /** Prefills the form to edit an existing task. */
  initial?: Task;
  /** The task's assignee when inactive: shown as a disabled option so the current value still displays. */
  inactiveAssignee?: Member;
  /** The form's DOM id, so a footer button elsewhere can submit it. */
  formId?: string;
}

function toFieldErrors(entries: { field: unknown; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const { field, message } of entries) {
    const name = FIELDS.find((candidate) => candidate === field);
    if (name && errors[name] === undefined) errors[name] = message;
  }
  return errors;
}

function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error: string | undefined;
  hint?: ReactNode;
  children: ReactNode;
}

function Field({ id, label, required = false, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required && (
            <span className="text-bad" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {hint}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs font-medium text-bad">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={cn("tabular text-xs", value > max * 0.9 ? "text-warn" : "text-faint")} aria-hidden="true">
      {value}/{max}
    </span>
  );
}

export function TaskForm({ onSubmit, onSubmittingChange, initial, inactiveAssignee, formId = TASK_FORM_ID }: TaskFormProps) {
  const ids = { title: useId(), description: useId(), status: useId(), priority: useId(), assigneeId: useId() };
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const members = useActiveMembers();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium");
  const [assignee, setAssignee] = useState<string>(initial?.assigneeId ?? UNASSIGNED);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const input: CreateTaskInput = {
    title,
    description,
    status,
    priority,
    ...(assignee === UNASSIGNED ? {} : { assigneeId: assignee }),
  };

  function validate(): FieldErrors {
    const result = createTaskSchema.safeParse(input);
    if (result.success) return {};
    return toFieldErrors(result.error.issues.map((issue) => ({ field: issue.path[0], message: issue.message })));
  }

  function focusFirstInvalid(fieldErrors: FieldErrors): void {
    if (fieldErrors.title) titleRef.current?.focus();
    else if (fieldErrors.description) descriptionRef.current?.focus();
  }

  function revalidate(field: FieldName, touched: boolean): void {
    if (!touched && !submitted) return;
    const fieldErrors = validate();
    setErrors((current) => ({ ...current, [field]: fieldErrors[field] }));
  }

  function setSubmitting(value: boolean): void {
    submittingRef.current = value;
    onSubmittingChange?.(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submittingRef.current) return; // guards double-submit before the disabled state renders
    setSubmitted(true);
    setFormError(null);

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      focusFirstInvalid(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        const serverErrors = toFieldErrors(error.fieldErrors);
        setErrors(serverErrors);
        focusFirstInvalid(serverErrors);
        if (Object.keys(serverErrors).length === 0) setFormError(error.message);
      } else {
        setFormError(error instanceof Error ? error.message : "Could not save the task. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const describedBy = (field: FieldName) => (errors[field] ? `${ids[field]}-error` : undefined);

  return (
    <form id={formId} noValidate onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      {formError && (
        <div role="alert" className="flex gap-2 rounded-md border border-bad/30 bg-bad-soft p-3 text-sm text-bad">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      )}

      <Field id={ids.title} label="Title" required error={errors.title} hint={<Counter value={title.length} max={TITLE_MAX} />}>
        <Input
          ref={titleRef}
          id={ids.title}
          value={title}
          maxLength={TITLE_MAX}
          autoComplete="off"
          placeholder="e.g. Login button unresponsive on Safari"
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={describedBy("title")}
          onChange={(event) => {
            setTitle(event.target.value);
            if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
          }}
          onBlur={() => revalidate("title", title.length > 0)}
        />
      </Field>

      <Field
        id={ids.description}
        label="Description"
        error={errors.description}
        hint={<Counter value={description.length} max={DESCRIPTION_MAX} />}
      >
        <Textarea
          ref={descriptionRef}
          id={ids.description}
          rows={5}
          value={description}
          maxLength={DESCRIPTION_MAX}
          placeholder="Steps to reproduce, expected result, links…"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={describedBy("description")}
          onChange={(event) => {
            setDescription(event.target.value);
            if (errors.description) setErrors((current) => ({ ...current, description: undefined }));
          }}
          onBlur={() => revalidate("description", description.length > 0)}
          className="resize-y"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id={ids.status} label="Status" error={errors.status}>
          <Select value={status} onValueChange={(value) => setStatus(pick(TASK_STATUSES, value, "todo"))}>
            <SelectTrigger id={ids.status} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id={ids.priority} label="Priority" error={errors.priority}>
          <Select value={priority} onValueChange={(value) => setPriority(pick(TASK_PRIORITIES, value, "medium"))}>
            <SelectTrigger id={ids.priority} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field id={ids.assigneeId} label="Assignee" error={errors.assigneeId}>
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger id={ids.assigneeId} className="w-full" aria-describedby={describedBy("assigneeId")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {inactiveAssignee && (
              <SelectItem value={inactiveAssignee.id} disabled>
                <MemberAvatar name={inactiveAssignee.name} muted className="size-5 text-[9px]" />
                {inactiveAssignee.name} <span className="text-faint">(inactive)</span>
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
      </Field>

      <p className="text-xs text-muted-foreground">
        <span className="text-bad" aria-hidden="true">
          *
        </span>{" "}
        Required
      </p>
    </form>
  );
}
