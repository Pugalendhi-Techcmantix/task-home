import type { TaskPriority, TaskStatus } from "@tracker/shared";

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

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** e.g. "Nov 19, 2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** e.g. "Nov 19, 2026, 10:42 PM" (shown as a tooltip on the short date) */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
