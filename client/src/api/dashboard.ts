import { dashboardSummarySchema, type DashboardSummary } from "@tracker/shared";
import { request } from "./http";

export function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return request("/dashboard/summary", { signal: signal ?? null }, dashboardSummarySchema);
}
