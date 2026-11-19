import { MEMBER_ROLES, type Member, type MemberRole } from "@tracker/shared";
import { Eye, Info, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/common/MemberAvatar";
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
  admin: { Icon: ShieldCheck, tone: "bg-violet-soft text-violet", text: "Manages the team and roles." },
  member: { Icon: UserRound, tone: "bg-sky-soft text-sky", text: "Creates and works on tasks." },
  viewer: { Icon: Eye, tone: "bg-secondary text-muted-foreground", text: "Follows progress; read-only by convention." },
};

const LAST_ADMIN = "This is the last active admin";

function isRole(value: string): value is MemberRole {
  return MEMBER_ROLES.some((role) => role === value);
}

/** Wraps a control in a tooltip explaining why it is disabled. */
function Guarded({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{LAST_ADMIN}</TooltipContent>
    </Tooltip>
  );
}

function MemberAccessRow({ member, locked }: { member: Member; locked: boolean }) {
  const update = useUpdateMember();
  const roleId = useId();
  const active = member.status === "active";

  const save = (input: { role?: MemberRole; status?: "active" | "inactive" }, success: string) =>
    update.mutate(
      { id: member.id, input },
      { onSuccess: () => toast.success(success), onError: (error) => toast.error(error.message) },
    );

  return (
    <TableRow className={cn(!active && "text-muted-foreground")}>
      <TableCell className="py-3 pl-4">
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.name} size="md" muted={!active} />
          <div className="min-w-0">
            <p className={cn("truncate font-medium", active && "text-foreground")}>{member.name}</p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <label htmlFor={roleId} className="sr-only">
          Role for {member.name}
        </label>
        <Guarded locked={locked}>
          <Select
            value={member.role}
            disabled={locked || update.isPending}
            onValueChange={(value) => isRole(value) && save({ role: value }, `${member.name} is now ${ROLE_LABELS[value]}`)}
          >
            <SelectTrigger id={roleId} size="sm" className="w-32">
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
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
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
          <span className="text-xs">{active ? "Active" : "Inactive"}</span>
        </div>
      </TableCell>
    </TableRow>
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

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-sky/25 bg-sky-soft px-4 py-3 text-sm text-sky">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>Roles are descriptive. This workspace has no sign-in, so roles label responsibilities rather than enforce permissions.</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {MEMBER_ROLES.map((role) => {
          const { Icon, tone, text } = ROLE_INFO[role];
          const count = (members.data ?? []).filter((m) => m.role === role && m.status === "active").length;
          return (
            <div key={role} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className={cn("grid size-8 place-items-center rounded-md", tone)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="tabular text-xs text-muted-foreground">{members.isSuccess ? `${count} active` : ""}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">{ROLE_LABELS[role]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
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
        {members.isSuccess && (
          <Table>
            <caption className="sr-only">Member roles and access</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(eyebrow, "h-9 pl-4")}>Member</TableHead>
                <TableHead className={cn(eyebrow, "h-9 w-40")}>Role</TableHead>
                <TableHead className={cn(eyebrow, "h-9 w-36")}>Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.data.map((member) => (
                <MemberAccessRow key={member.id} member={member} locked={member.id === lastAdminId} />
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
