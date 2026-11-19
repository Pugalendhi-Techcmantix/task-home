import {
  createTaskSchema,
  DESCRIPTION_MAX,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TITLE_MAX,
  type CreateTaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@tracker/shared";
import { CircleAlert } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../api/tasks";
import { PRIORITY_LABELS, STATUS_LABELS } from "../lib/labels";
import { inputClass } from "../lib/styles";
import { SelectField } from "./SelectField";

const FIELDS = ["title", "description", "status", "priority"] as const;
type FieldName = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<FieldName, string>>;

export const TASK_FORM_ID = "new-task-form";

interface TaskFormProps {
  /** Resolves on success. Rejects with ApiError to show server-side field errors. */
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  /** Lets the parent render the submit button outside the form (e.g. in a drawer footer). */
  onSubmittingChange?: (submitting: boolean) => void;
}

function asFieldName(value: unknown): FieldName | undefined {
  return FIELDS.find((field) => field === value);
}

/** First error per field, from either Zod issues or the API's `{ field, message }` list. */
function toFieldErrors(entries: { field: unknown; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const { field, message } of entries) {
    const name = asFieldName(field);
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
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
          {required && (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {hint}
      </div>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  const near = value > max * 0.9;
  return (
    <span className={`text-xs tabular-nums ${near ? "text-amber-700" : "text-slate-500"}`} aria-hidden="true">
      {value}/{max}
    </span>
  );
}

export function TaskForm({ onSubmit, onSubmittingChange }: TaskFormProps) {
  const ids = { title: useId(), description: useId(), status: useId(), priority: useId() };
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const input: CreateTaskInput = { title, description, status, priority };

  function validate(): FieldErrors {
    const result = createTaskSchema.safeParse(input);
    if (result.success) return {};
    return toFieldErrors(result.error.issues.map((issue) => ({ field: issue.path[0], message: issue.message })));
  }

  function focusFirstInvalid(fieldErrors: FieldErrors): void {
    if (fieldErrors.title) titleRef.current?.focus();
    else if (fieldErrors.description) descriptionRef.current?.focus();
  }

  /** Inline validation: re-check a field when it loses focus, once the user has tried to submit or typed in it. */
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
        setFormError(error instanceof Error ? error.message : "Could not create the task. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const describedBy = (field: FieldName): string | undefined => (errors[field] ? `${ids[field]}-error` : undefined);

  return (
    <form id={TASK_FORM_ID} noValidate onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      {formError && (
        <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      )}

      <Field
        id={ids.title}
        label="Title"
        required
        error={errors.title}
        hint={<Counter value={title.length} max={TITLE_MAX} />}
      >
        <input
          ref={titleRef}
          id={ids.title}
          type="text"
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
          className={`${inputClass(Boolean(errors.title))} h-10`}
        />
      </Field>

      <Field
        id={ids.description}
        label="Description"
        error={errors.description}
        hint={<Counter value={description.length} max={DESCRIPTION_MAX} />}
      >
        <textarea
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
          className={`${inputClass(Boolean(errors.description))} resize-y py-2`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id={ids.status} label="Status" error={errors.status}>
          <SelectField
            id={ids.status}
            value={status}
            onChange={(event) => setStatus(pick(TASK_STATUSES, event.target.value, "todo"))}
          >
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field id={ids.priority} label="Priority" error={errors.priority}>
          <SelectField
            id={ids.priority}
            value={priority}
            onChange={(event) => setPriority(pick(TASK_PRIORITIES, event.target.value, "medium"))}
          >
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </SelectField>
        </Field>
      </div>

      <p className="text-xs text-slate-500">
        <span className="text-red-600" aria-hidden="true">
          *
        </span>{" "}
        Required
      </p>
    </form>
  );
}
