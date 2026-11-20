import {
  createMemberSchema,
  MEMBER_ROLES,
  NAME_MAX,
  updateMemberSchema,
  type Member,
  type MemberRole,
} from "@tracker/shared";
import { CircleAlert } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/http";
import { SubmitLabel } from "@/components/common/SubmitLabel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/labels";
import { useCreateMember, useUpdateMember } from "./queries";

type FieldName = "name" | "email" | "role";

/** Inline errors slide down 4px and fade in when they appear (instant under reduced motion). */
const ERROR_ENTER = "animate-in duration-(--dur-2) ease-(--ease-snappy) fade-in-0 slide-in-from-top-1";
type FieldErrors = Partial<Record<FieldName, string>>;

function toFieldErrors(entries: { field: unknown; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const { field, message } of entries) {
    if ((field === "name" || field === "email" || field === "role") && errors[field] === undefined) errors[field] = message;
  }
  return errors;
}

function isRole(value: string): value is MemberRole {
  return MEMBER_ROLES.some((role) => role === value);
}

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this member; omit to add a new one. */
  member?: Member;
}

/** Add or edit a member. Rendered only while open so the form starts fresh each time. */
export function MemberDialog({ open, onOpenChange, member }: MemberDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle>
          <DialogDescription>
            {member ? "Update this person's details." : "Add someone tasks can be assigned to."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <MemberForm member={member} onDone={() => onOpenChange(false)} submitting={submitting} setSubmitting={setSubmitting} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MemberFormProps {
  member: Member | undefined;
  onDone: () => void;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
}

function MemberForm({ member, onDone, submitting, setSubmitting }: MemberFormProps) {
  const ids = { name: useId(), email: useId(), role: useId() };
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState<MemberRole>(member?.role ?? "member");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function focusFirst(fieldErrors: FieldErrors) {
    if (fieldErrors.name) nameRef.current?.focus();
    else if (fieldErrors.email) emailRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setFormError(null);

    const input = { name, email, role };
    const parsed = member ? updateMemberSchema.safeParse(input) : createMemberSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error.issues.map((i) => ({ field: i.path[0], message: i.message })));
      setErrors(fieldErrors);
      focusFirst(fieldErrors);
      return;
    }
    setErrors({});

    busy.current = true;
    setSubmitting(true);
    try {
      if (member) {
        await updateMember.mutateAsync({ id: member.id, input });
        toast.success("Member updated");
      } else {
        await createMember.mutateAsync(input);
        toast.success(`${name.trim()} added to the team`);
      }
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        const fieldErrors = toFieldErrors(error.fieldErrors);
        setErrors(fieldErrors);
        focusFirst(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) setFormError(error.message);
      } else {
        setFormError(error instanceof Error ? error.message : "Could not save. Please try again.");
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  const describedBy = (field: FieldName) => (errors[field] ? `${ids[field]}-error` : undefined);
  const fieldError = (field: FieldName) =>
    errors[field] && (
      <p id={`${ids[field]}-error`} className={`flex items-center gap-1.5 text-xs font-medium text-bad-ink ${ERROR_ENTER}`}>
        <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
        {errors[field]}
      </p>
    );

  return (
    <form noValidate onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {formError && (
        <div role="alert" className={`flex gap-2 rounded-lg border border-bad/25 bg-bad-soft p-3 text-[13px] text-bad-ink ${ERROR_ENTER}`}>
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={ids.name} className="text-xs font-medium">Name</Label>
        <Input
          ref={nameRef}
          id={ids.name}
          value={name}
          maxLength={NAME_MAX}
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          onChange={(event) => setName(event.target.value)}
        />
        {fieldError("name")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={ids.email} className="text-xs font-medium">Email</Label>
        <Input
          ref={emailRef}
          id={ids.email}
          type="email"
          value={email}
          autoComplete="off"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          onChange={(event) => setEmail(event.target.value)}
        />
        {fieldError("email")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={ids.role} className="text-xs font-medium">Role</Label>
        <Select value={role} onValueChange={(value) => isRole(value) && setRole(value)}>
          <SelectTrigger id={ids.role} className="h-9 w-full" aria-describedby={describedBy("role")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEMBER_ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("role")}
      </div>
      <DialogFooter className="pt-3">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          <SubmitLabel submitting={submitting}>{member ? "Save changes" : "Add member"}</SubmitLabel>
        </Button>
      </DialogFooter>
    </form>
  );
}
