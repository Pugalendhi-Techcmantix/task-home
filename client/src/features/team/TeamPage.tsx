import type { Member } from "@tracker/shared";
import { MoreHorizontal, Pencil, Plus, UserCheck, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { EmptyState, ErrorState, PageHeader, Panel, eyebrow } from "@/components/common/Page";
import { MemberStatusPill, RolePill } from "@/components/common/Pill";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MemberDialog } from "./MemberDialog";
import { useMembers, useUpdateMember } from "./queries";

function MemberMenu({ member, onEdit }: { member: Member; onEdit: () => void }) {
  const update = useUpdateMember();
  const active = member.status === "active";
  const toggle = () =>
    update.mutate(
      { id: member.id, input: { status: active ? "inactive" : "active" } },
      {
        onSuccess: () => toast.success(active ? `${member.name} deactivated` : `${member.name} reactivated`),
        onError: (error) => toast.error(error.message),
      },
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${member.name}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggle} variant={active ? "destructive" : "default"}>
          {active ? <UserMinus aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
          {active ? "Deactivate" : "Reactivate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OpenTasks({ member }: { member: Member }) {
  if (member.openTaskCount === 0) return <span className="tabular text-faint">0</span>;
  return (
    <Link
      to={`/tasks?assignee=${member.id}`}
      className="tabular font-medium text-brand underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
      aria-label={`${member.openTaskCount} open tasks for ${member.name}`}
    >
      {member.openTaskCount}
    </Link>
  );
}

export function TeamPage() {
  const members = useMembers();
  const [dialog, setDialog] = useState<{ open: boolean; member?: Member }>({ open: false });
  const openAdd = () => setDialog({ open: true });

  return (
    <>
      <PageHeader
        title="Team members"
        description="The people tasks can be assigned to. Roles and active status are also managed in Roles & access."
        actions={
          <Button onClick={openAdd}>
            <Plus aria-hidden="true" />
            Add member
          </Button>
        }
      />
      <Panel>
        {members.isPending && (
          <div className="divide-y" role="status" aria-label="Loading members">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        )}
        {members.isError && <ErrorState message={members.error.message} onRetry={() => void members.refetch()} />}
        {members.isSuccess && members.data.length === 0 && (
          <EmptyState
            icon={<Users className="size-5" aria-hidden="true" />}
            title="No team members yet"
            body="Add the people on your team so tasks can be assigned to them."
            action={
              <Button onClick={openAdd}>
                <Plus aria-hidden="true" />
                Add member
              </Button>
            }
          />
        )}
        {members.isSuccess && members.data.length > 0 && (
          <>
            <Table className="hidden md:table">
              <caption className="sr-only">Team members</caption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={cn(eyebrow, "h-9 pl-4")}>Member</TableHead>
                  <TableHead className={cn(eyebrow, "h-9 w-32")}>Role</TableHead>
                  <TableHead className={cn(eyebrow, "h-9 w-32")}>Status</TableHead>
                  <TableHead className={cn(eyebrow, "h-9 w-28 text-right")}>Open tasks</TableHead>
                  <TableHead className="h-9 w-14 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.data.map((member) => {
                  const inactive = member.status === "inactive";
                  return (
                    <TableRow key={member.id} className={cn(inactive && "text-muted-foreground")}>
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <MemberAvatar name={member.name} size="md" muted={inactive} />
                          <div className="min-w-0">
                            <p className={cn("truncate font-medium", !inactive && "text-foreground")}>{member.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RolePill role={member.role} />
                      </TableCell>
                      <TableCell>
                        <MemberStatusPill status={member.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <OpenTasks member={member} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <MemberMenu member={member} onEdit={() => setDialog({ open: true, member })} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <ul className="divide-y md:hidden" aria-label="Team members">
              {members.data.map((member) => (
                <li key={member.id} className="flex items-start gap-3 px-4 py-4">
                  <MemberAvatar name={member.name} size="md" muted={member.status === "inactive"} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="truncate font-medium">{member.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <RolePill role={member.role} />
                      <MemberStatusPill status={member.status} />
                      <span className="text-muted-foreground">
                        Open tasks: <OpenTasks member={member} />
                      </span>
                    </div>
                  </div>
                  <MemberMenu member={member} onEdit={() => setDialog({ open: true, member })} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
      <MemberDialog
        open={dialog.open}
        member={dialog.member}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
      />
    </>
  );
}
