import { useQuery } from "@tanstack/react-query";
import { CheckSquare, LayoutDashboard, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { fetchMembers } from "@/api/members";
import { fetchTasks } from "@/api/tasks";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { queryKeys } from "@/lib/queryKeys";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { pathname } = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10.5px] font-semibold tracking-[0.08em] text-faint uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.label}
                className="data-[active=true]:bg-brand-soft data-[active=true]:font-semibold data-[active=true]:text-brand"
              >
                <NavLink to={item.to} end={item.to === "/"}>
                  <item.icon aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
              {item.count !== undefined && (
                <SidebarMenuBadge className="tabular text-faint">{item.count}</SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const tasks = useQuery({ queryKey: queryKeys.tasks(), queryFn: ({ signal }) => fetchTasks({}, signal) });
  const members = useQuery({ queryKey: queryKeys.members(), queryFn: ({ signal }) => fetchMembers({}, signal) });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b">
        <div className="flex items-center gap-2.5 px-1.5 group-data-[collapsible=icon]:px-0">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            T
          </span>
          <span className="truncate text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            Task Tracker
          </span>
        </div>
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
      <SidebarRail />
    </Sidebar>
  );
}
