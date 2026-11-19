import { createBrowserRouter } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";

/** Pages are lazy-loaded so each route ships only its own code. */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, lazy: () => import("@/features/dashboard/DashboardPage").then((m) => ({ Component: m.DashboardPage })) },
      { path: "tasks", lazy: () => import("@/features/tasks/TasksPage").then((m) => ({ Component: m.TasksPage })) },
      { path: "team", lazy: () => import("@/features/team/TeamPage").then((m) => ({ Component: m.TeamPage })) },
      { path: "roles", lazy: () => import("@/features/roles/RolesPage").then((m) => ({ Component: m.RolesPage })) },
      { path: "*", lazy: () => import("@/features/NotFoundPage").then((m) => ({ Component: m.NotFoundPage })) },
    ],
  },
]);
