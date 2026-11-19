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

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <Skeleton className="h-64 w-full" />
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
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-card/95 px-3 backdrop-blur sm:px-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger aria-label="Toggle sidebar" />
              </TooltipTrigger>
              <TooltipContent>Toggle sidebar (Ctrl+B)</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:inline-flex">Team workspace</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="grid size-8 place-items-center rounded-full border bg-secondary text-[11px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Workspace admin"
                  >
                    WA
                  </span>
                </TooltipTrigger>
                <TooltipContent>Workspace admin</TooltipContent>
              </Tooltip>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </NewTaskProvider>
  );
}
