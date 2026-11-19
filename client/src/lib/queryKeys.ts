import type { MemberQuery, TaskQuery } from "@tracker/shared";

/** TanStack Query keys, shared so the sidebar counts and the pages hit the same cache entries. */
export const queryKeys = {
  tasks: (filters: TaskQuery = {}) => ["tasks", filters] as const,
  allTasks: ["tasks"] as const,
  members: (filters: MemberQuery = {}) => ["members", filters] as const,
  allMembers: ["members"] as const,
  dashboard: ["dashboard"] as const,
};
