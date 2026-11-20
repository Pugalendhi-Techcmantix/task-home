import { MEMBER_ROLES, type Member, type MemberRole } from "@tracker/shared";
import { Eye, Info, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { useChangedIds, useRowEntrance, type MotionProps } from "@/components/common/motion";
import { ErrorState, PageHeader, Panel, PanelHeader, eyebrow } from "@/components/common/Page";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMembers, useUpdateMember } from "@/features/team/queries";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const ROLE_INFO: Record<MemberRole, { Icon: LucideIcon; tone: string; text: string }> = {
  admin: { Icon: ShieldCheck, tone: "bg-violet-soft text-violet-ink", text: "Manages the team and roles." },
  member: { Icon: UserRound, tone: "bg-sky-soft text-sky-ink", text: "Creates and works on tasks." },
  viewer: { Icon: Eye, tone: "bg-secondary text-muted-foreground", text: "Follows progress; read-only by convention." },
};

const LAST_ADMIN = "This is the last active admin";

function isRole(value: string): value is MemberRole {
  return MEMBER_ROLES.some((role) => role === value);
}

/** Wraps a control in a tooltip explaining why it is disabled. */
function Guarded({ locked, children, className }: { locked: boolean; children: React.ReactNode; className?: string }) {
  if (!locked) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn("inline-flex rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{LAST_ADMIN}</TooltipContent>
    </Tooltip>
  );
}

interface MemberAccessRowProps {
  member: Member;
  locked: boolean;
  variant: "row" | "card";
  /** Entrance animation for the row (see useRowEntrance). */
  enter: MotionProps;
  /** The role just changed: flash the row once. */
  flash: boolean;
}

function MemberAccessRow({ member, locked, variant, enter, flash }: MemberAccessRowProps) {
  const update = useUpdateMember();
  const roleId = useId();
  const active = member.status === "active";

  const save = (input: { role?: MemberRole; status?: "active" | "inactive" }, success: string) =>
    update.mutate(
      { id: member.id, input },
      { onSuccess: () => toast.success(success), onError: (error) => toast.error(error.message) },
    );

  // Inactive members are signalled by the dashed avatar and muted text, not by fading (keeps AA contrast).
  const identity = (
    <div className="flex min-w-0 items-center gap-3">
      <MemberAvatar name={member.name} size="md" muted={!active} />
      <div className="min-w-0">
        <p className={cn("truncate text-[13.5px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>{member.name}</p>
        <p className={cn("truncate text-xs", active ? "text-muted-foreground" : "text-faint")}>{member.email}</p>
      </div>
    </div>
  );

  const roleSelect = (
    <>
      <label htmlFor={roleId} className="sr-only">
        Role for {member.name}
      </label>
      <Guarded locked={locked} className={variant === "card" ? "w-full" : undefined}>
        <Select
          value={member.role}
          disabled={locked || update.isPending}
          onValueChange={(value) => isRole(value) && save({ role: value }, `${member.name} is now ${ROLE_LABELS[value]}`)}
        >
          <SelectTrigger id={roleId} size="sm" className={cn("h-8", variant === "card" ? "w-full" : "w-32")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEMBER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Guarded>
    </>
  );

  const accessSwitch = (
    <div className="flex shrink-0 items-center gap-2.5">
      <Guarded locked={locked}>
        <Switch
          checked={active}
          disabled={locked || update.isPending}
          aria-label={`${member.name} is ${active ? "active" : "inactive"}`}
          onCheckedChange={(checked) =>
            save({ status: checked ? "active" : "inactive" }, checked ? `${member.name} reactivated` : `${member.name} deactivated`)
          }
        />
      </Guarded>
      <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>{active ? "Active" : "Inactive"}</span>
    </div>
  );

  // The entrance and the flash both use `animation`, so they go on different elements.
  const flashClass = flash ? "motion-flash" : undefined;
  if (variant === "card") {
    return (
      <li className={cn("row-interactive px-4 py-3", flashClass)}>
        <div className={cn("space-y-2.5", enter.className)} style={enter.style}>
          <div className="flex items-center justify-between gap-3">
            {identity}
            {accessSwitch}
          </div>
          {roleSelect}
        </div>
      </li>
    );
  }

  return (
    <TableRow className={cn("row-interactive", enter.className)} style={enter.style}>
      <TableCell className={cn("py-2 pl-4", flashClass)}>{identity}</TableCell>
      <TableCell className={flashClass}>{roleSelect}</TableCell>
      <TableCell className={flashClass}>{accessSwitch}</TableCell>
    </TableRow>
  );
}

const roleSignature = (member: Member) => member.role;

/** Rendered once members have loaded, so the first-load stagger is decided with the data in hand. */
function AccessList({ members, lastAdminId }: { members: Member[]; lastAdminId: string | undefined }) {
  const enter = useRowEntrance(members.map((member) => member.id));
  const roleChanged = useChangedIds(members, roleSignature);
  const rowProps = (member: Member, index: number) => ({
    member,
    locked: member.id === lastAdminId,
    enter: enter(member.id, index),
    flash: roleChanged.has(member.id),
  });

  return (
    <>
      <Table className="hidden sm:table">
        <caption className="sr-only">Member roles and access</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(eyebrow, "h-9 pl-4")}>Member</TableHead>
            <TableHead className={cn(eyebrow, "h-9 w-40")}>Role</TableHead>
            <TableHead className={cn(eyebrow, "h-9 w-36")}>Access</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member, index) => (
            <MemberAccessRow key={member.id} variant="row" {...rowProps(member, index)} />
          ))}
        </TableBody>
      </Table>
      <ul className="divide-y sm:hidden" aria-label="Member roles and access">
        {members.map((member, index) => (
          <MemberAccessRow key={member.id} variant="card" {...rowProps(member, index)} />
        ))}
      </ul>
    </>
  );
}

export function RolesPage() {
  const members = useMembers();
  const activeAdmins = (members.data ?? []).filter((m) => m.role === "admin" && m.status === "active");
  const lastAdminId = activeAdmins.length === 1 ? activeAdmins[0]?.id : undefined;

  return (
    <>
      <PageHeader
        title="Roles & access"
        description="Who does what in this workspace. Change a member's role, or switch them off when they leave."
      />

      <div className="surface-panel relative mb-4 flex items-start gap-2.5 overflow-hidden py-3 pr-4 pl-5 text-[13px] leading-relaxed text-muted-foreground">
        <span className="absolute inset-y-0 left-0 w-0.5 bg-brand" aria-hidden="true" />
        <Info className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden="true" />
        <p>Roles are descriptive. This workspace has no sign-in, so roles label responsibilities rather than enforce permissions.</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {MEMBER_ROLES.map((role) => {
          const { Icon, tone, text } = ROLE_INFO[role];
          const count = (members.data ?? []).filter((m) => m.role === role && m.status === "active").length;
          return (
            <div key={role} className="surface-panel p-4">
              <div className="flex items-center justify-between">
                <span className={cn("grid size-9 place-items-center rounded-lg border border-current/15", tone)}>
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="num text-xs text-muted-foreground">
                  {members.isSuccess && (
                    <>
                      <span className="text-sm font-semibold text-foreground">{count}</span> active
                    </>
                  )}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold">{ROLE_LABELS[role]}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{text}</p>
            </div>
          );
        })}
      </div>

      <Panel>
        <PanelHeader title="Members" hint="Changes save immediately" />
        {members.isPending && (
          <div className="space-y-3 p-4" role="status" aria-label="Loading members">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {members.isError && <ErrorState message={members.error.message} onRetry={() => void members.refetch()} />}
        {members.isSuccess && <AccessList members={members.data} lastAdminId={lastAdminId} />}
      </Panel>
    </>
  );
}
