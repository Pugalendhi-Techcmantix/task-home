import type { MemberRole, MemberStatus, TaskPriority, TaskStatus } from "@tracker/shared";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** e.g. "Nov 19, 2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** e.g. "Nov 19" */
export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

/** e.g. "Nov 19, 2026, 10:42 PM" (shown as a tooltip on the short date) */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** "Arun Kumar" → "AK"; "jo" → "JO". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0]?.[0], parts[parts.length - 1]?.[0]] : [parts[0]?.[0], parts[0]?.[1]];
  return letters.filter(Boolean).join("").toUpperCase();
}
