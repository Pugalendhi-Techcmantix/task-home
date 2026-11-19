import type { MemberRole, MemberStatus, TaskPriority, TaskStatus } from "@tracker/shared";

export interface SeedMember {
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
}

export interface SeedTask {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Index into SEED_MEMBERS, or null for unassigned. */
  assignee: number | null;
  /** How long ago the task was created. */
  daysAgo: number;
}

export const SEED_MEMBERS: SeedMember[] = [
  { name: "Priya Sharma", email: "priya@example.com", role: "admin", status: "active" },
  { name: "Arun Kumar", email: "arun@example.com", role: "member", status: "active" },
  { name: "Meera Raman", email: "meera@example.com", role: "member", status: "active" },
  { name: "Sam Lee", email: "sam@example.com", role: "member", status: "active" },
  { name: "Jo Taylor", email: "jo@example.com", role: "viewer", status: "active" },
  { name: "Daniel Okafor", email: "daniel@example.com", role: "member", status: "inactive" },
];

export const SEED_TASKS: SeedTask[] = [
  { title: "Login button unresponsive on Safari", description: "Clicking Sign in does nothing on Safari 18. Console shows a CSP error.", status: "todo", priority: "high", assignee: 1, daysAgo: 0 },
  { title: "Crash when uploading an avatar larger than 5 MB", description: "Server returns 500 instead of a friendly size error.", status: "in_progress", priority: "high", assignee: 2, daysAgo: 1 },
  { title: "Fix password reset email link expiry", description: "Reset links expire immediately for users in UTC+ time zones.", status: "in_progress", priority: "high", assignee: 3, daysAgo: 1 },
  { title: "Checkout total ignores discount codes", description: "Applying SAVE10 shows the discount but charges the full price.", status: "todo", priority: "high", assignee: null, daysAgo: 2 },
  { title: "Add CSV export to monthly reports", description: "Finance needs the totals per team as a download.", status: "in_progress", priority: "medium", assignee: 1, daysAgo: 2 },
  { title: "Dark mode contrast on settings page", description: "Secondary text fails WCAG AA on the dark theme.", status: "todo", priority: "medium", assignee: 2, daysAgo: 3 },
  { title: "Paginate the audit log API", description: "The endpoint returns 40k rows and times out.", status: "todo", priority: "medium", assignee: 3, daysAgo: 3 },
  { title: "Write release notes for v1.2", status: "todo", priority: "low", assignee: 4, daysAgo: 3 },
  { title: "Rate-limit the public signup endpoint", description: "Bots created 3k accounts last night.", status: "done", priority: "high", assignee: 1, daysAgo: 4 },
  { title: "Update onboarding copy for the new pricing page", status: "done", priority: "low", assignee: 2, daysAgo: 4 },
  { title: "Migrate image storage to the new bucket", description: "Old bucket is read-only from Dec 1.", status: "in_progress", priority: "medium", assignee: 0, daysAgo: 5 },
  { title: "Search results ignore accented characters", description: "Searching 'resume' does not find 'résumé'.", status: "todo", priority: "medium", assignee: null, daysAgo: 5 },
  { title: "Add empty state to the projects page", status: "done", priority: "low", assignee: 3, daysAgo: 6 },
  { title: "Flaky test: payments webhook retries", description: "Fails about 1 in 20 runs on CI.", status: "todo", priority: "medium", assignee: 5, daysAgo: 6 },
  { title: "Keyboard trap in the date picker", description: "Tab cannot leave the calendar popup.", status: "todo", priority: "high", assignee: 2, daysAgo: 7 },
  { title: "Upgrade Node to 24 on build servers", status: "done", priority: "medium", assignee: 0, daysAgo: 8 },
  { title: "Notification emails sent twice", description: "Users get duplicate 'task assigned' emails.", status: "in_progress", priority: "medium", assignee: 3, daysAgo: 8 },
  { title: "Document the API error format", status: "done", priority: "low", assignee: 4, daysAgo: 9 },
  { title: "Slow dashboard query for large teams", description: "p95 is 2.4 s for teams over 200 people.", status: "todo", priority: "medium", assignee: 1, daysAgo: 10 },
  { title: "Add SSO configuration guide", status: "todo", priority: "low", assignee: null, daysAgo: 11 },
  { title: "Broken link in the footer", status: "done", priority: "low", assignee: 1, daysAgo: 11 },
  { title: "Timezone shown wrong on invoices", description: "Invoices show UTC instead of the account time zone.", status: "done", priority: "medium", assignee: 2, daysAgo: 12 },
  { title: "Remove unused feature flags", status: "todo", priority: "low", assignee: 0, daysAgo: 13 },
  { title: "Mobile menu overlaps the page title", description: "On 360px screens the menu covers the H1.", status: "done", priority: "medium", assignee: 3, daysAgo: 14 },
];
