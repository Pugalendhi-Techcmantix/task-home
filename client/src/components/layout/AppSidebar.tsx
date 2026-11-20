import { useQuery } from "@tanstack/react-query";
import { CheckSquare, LayoutDashboard, ListChecks, Plus, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { fetchMembers } from "@/api/members";
import { fetchTasks } from "@/api/tasks";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNewTask } from "@/features/tasks/NewTaskProvider";
import { queryKeys } from "@/lib/queryKeys";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

/** Cmd on Apple platforms, Ctrl elsewhere. Both modifiers work; this only labels the hint. */
const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { pathname } = useLocation();
  return (
    <SidebarGroup className="px-3 py-1.5">
      <SidebarGroupLabel className="h-7 px-2.5 text-[10.5px] font-semibold tracking-[0.08em] text-faint uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                <NavLink to={item.to} end={item.to === "/"}>
                  <item.icon aria-hidden="true" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
              {item.count !== undefined && <SidebarMenuBadge>{item.count}</SidebarMenuBadge>}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NewTaskButton() {
  const { openNewTask } = useNewTask();
  const { state, isMobile } = useSidebar();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={openNewTask}
          aria-keyshortcuts="N"
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Plus aria-hidden="true" />
          <span className="group-data-[collapsible=icon]:sr-only">New task</span>
          <kbd className="kbd sidebar-reveal ml-auto group-data-[collapsible=icon]:hidden" aria-hidden="true">
            N
          </kbd>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
        New task (N)
      </TooltipContent>
    </Tooltip>
  );
}

function ShortcutHint({ label, keys }: { label: string; keys: string[] }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {keys.map((key) => (
          <kbd key={key} className="kbd">
            {key}
          </kbd>
        ))}
      </span>
    </li>
  );
}

export function AppSidebar() {
  const tasks = useQuery({ queryKey: queryKeys.tasks(), queryFn: ({ signal }) => fetchTasks({}, signal) });
  const members = useQuery({ queryKey: queryKeys.members(), queryFn: ({ signal }) => fetchMembers({}, signal) });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3 pb-2">
        <div className="flex items-center gap-2.5 px-0.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[linear-gradient(160deg,#2c3d48,#0b1318)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(16_26_32/0.25)] ring-1 ring-black/20 dark:ring-white/10"
          >
            <ListChecks className="size-4" strokeWidth={2} />
          </span>
          <span className="sidebar-reveal min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold tracking-[-0.01em] text-foreground">Task Tracker</span>
            <span className="block truncate text-[11px] text-muted-foreground">Team workspace</span>
          </span>
        </div>
        <NewTaskButton />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup
          label="Workspace"
          items={[
            { to: "/", label: "Dashboard", icon: LayoutDashboard },
            { to: "/tasks", label: "Tasks", icon: CheckSquare, count: tasks.data?.length },
            { to: "/team", label: "Team members", icon: Users, count: members.data?.length },
          ]}
        />
        <SidebarSeparator />
        <NavGroup label="Admin" items={[{ to: "/roles", label: "Roles & access", icon: ShieldCheck }]} />
      </SidebarContent>
      <SidebarFooter className="sidebar-reveal gap-0 border-t p-3 group-data-[collapsible=icon]:hidden max-md:hidden">
        <p className="eyebrow mb-2 text-faint">Shortcuts</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <ShortcutHint label="Search" keys={[MOD_KEY, "K"]} />
          <ShortcutHint label="New task" keys={["N"]} />
          <ShortcutHint label="Toggle sidebar" keys={[MOD_KEY, "B"]} />
        </ul>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
