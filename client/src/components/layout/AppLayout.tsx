import { Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NewTaskProvider } from "@/features/tasks/NewTaskProvider";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tasks",
  "/team": "Team members",
  "/roles": "Roles & access",
};

/** The sidebar remembers open/collapsed in this cookie (written by shadcn's SidebarProvider). */
function readSidebarOpen(): boolean {
  return !document.cookie.split("; ").includes("sidebar_state=false");
}

/** Mirrors PageHeader (title, description, actions) plus a content panel, so the swap does not jump. */
function PageFallback() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-72 w-full rounded-panel" />
    </div>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Not found";

  return (
    <NewTaskProvider>
      <SidebarProvider defaultOpen={readSidebarOpen()}>
        <AppSidebar />
        <SidebarInset className="canvas-glow min-w-0">
          <header className="glass-bar sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 px-3 sm:px-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger aria-label="Toggle sidebar" className="text-muted-foreground hover:text-foreground" />
              </TooltipTrigger>
              <TooltipContent>Toggle sidebar (Ctrl+B)</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap gap-1.5 text-[13px] whitespace-nowrap sm:gap-2">
                <BreadcrumbItem className="hidden lg:inline-flex">Team workspace</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden lg:inline-flex" />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate font-semibold">{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-1.5">
              <CommandPalette />
              <ThemeToggle />
              {/* Decorative only: there is no sign-in, so this is not a user menu. */}
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[10.5px] font-semibold text-secondary-foreground ring-1 ring-black/10 select-none dark:ring-white/15"
                aria-hidden="true"
              >
                WA
              </span>
            </div>
          </header>
          {/* SidebarInset already renders the <main> landmark, so this wrapper is a plain div. */}
          <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div key={pathname} className="enter">
              <Suspense fallback={<PageFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NewTaskProvider>
  );
}
