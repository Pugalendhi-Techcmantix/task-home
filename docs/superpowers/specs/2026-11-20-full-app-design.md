# Design: Task Tracker as a full application (v2)

Date: 2026-11-20 · Builds on: [2026-11-19-task-tracker-design.md](2026-11-19-task-tracker-design.md)
(v1, approved and shipped on `main`) · Visual reference: `KAIRO.html` in the repo root (UI only;
not committed)

## Intent and the why

v1 meets the take-home brief exactly. The author wants to go further and **impress the reviewers**:
show that beyond the task, they can build a standard, polished, multi-page product. That means an
app shell with sidebar navigation, a dashboard, the tasks page, team management, and a UI with an
enterprise-grade look built on a real component library.

The brief warns that reviewers value architecture, types, validation and tests "far more than extra
features or elaborate visual styling". v2 must therefore **add without weakening any of that**. It
lives on its own branch, so `main` stays the clean, literal submission and the author can choose
which to send.

## Goals

- An app shell like the reference: top bar plus a sidebar that switches between **open (labels)
  and collapsed (icon rail)**, remembered between visits
- A **light/dark theme switch**, remembered, defaulting to the OS setting
- Pages: **Dashboard**, **Tasks** (v1 functionality, upgraded), **Team members**, **Roles & access**
- **Team management without login** (author's choice "A"): add, edit and deactivate members, with
  roles as labels. Tasks can be **assigned** to members.
- Visual language matching `KAIRO.html` (see "Visual system"), built on **shadcn/ui (Radix + Tailwind)**
- The v1 API contract and tests stay exactly as they are. New behavior gets new endpoints and new tests.

## Non-goals

- Login, accounts, sessions, or permission enforcement. Roles are descriptive labels only.
- Notifications, real-time updates, comments, attachments, pagination, editing task title or
  description, and a workspace settings page
- A frontend component-test suite. The client API module keeps its unit tests, and the UI is
  verified in a real browser.
- Deployment and Docker

## Anti-goals (fail even if it "works")

- **Any change to the v1 contract** for `GET/POST/PATCH/DELETE /api/tasks` that would break a
  reviewer testing the brief's endpoints. In particular, PATCH still accepts only `status` and
  `priority`.
- Dead UI: buttons, bells or menu items that do nothing
- Copying KAIRO's name, logo or wording. Only the visual language is borrowed.
- Losing what v1 earned: strict types and no `any`, shared Zod schemas as the single source of
  truth, accessibility (keyboard, focus, contrast in both themes), every check green
- A generic "admin template" look

## Constraints

- Same stack: npm workspaces, Express 5, Mongoose 9, Zod 4, React 19, Vite 8, Tailwind 4, Node 22.13+ or 24
- Works with Atlas (`npm run dev`) and with no database (`npm run dev:memory`)
- Branch `feature/full-app`, created from `main` at the current head. `main` is not touched.

## Approaches considered

| Component library | Trade-off |
|---|---|
| **shadcn/ui (Radix + Tailwind)**: **chosen by the author** | Accessible Radix primitives, styled with the Tailwind already in use. The component source lives in the repo, so it's fully controllable and reviewers can read it. Matches the reference's restrained look. |
| Mantine | One complete package with a fast build, but its own styling system would replace Tailwind, and the look is more generic |
| Ant Design / MUI | Heavy, with their own design language. They tend to look like a stock admin template, the opposite of the goal. |

Layout: the author chose a **full sidebar** over an icon rail with top tabs. After seeing
`KAIRO.html`, they asked for that sidebar to **toggle between open and an icon rail**.

Theme: the author rejected three generic themes (midnight, full dark, bright gradient) and
approved the **KAIRO visual language** in light and dark, as mocked up.

## Decided by the author

- Option A: team management, no login
- shadcn/ui; full sidebar with an open/collapse toggle; light/dark switch
- The KAIRO look (mockup approved): Geist font, ink-black primary buttons, teal accent, small
  uppercase labels, KPI cards with a colored top edge, soft dotted status pills, segmented tabs
- Process: after the build, a **UI/UX architect agent** reviews every page in a real browser, and a
  **separate fixer agent** applies the findings, which I then verify

## Visual system

Tokens are copied from the reference's CSS variables and mapped onto shadcn's variable names in
`client/src/index.css`.

| Token | Light | Dark | Use |
|---|---|---|---|
| bg | `#f5f7f8` | `#0c1216` | page background |
| panel | `#ffffff` | `#121a20` | cards, sidebar, top bar |
| panel-2 | `#f0f3f5` | `#172128` | segmented control track, meters |
| ink | `#101a20` | `#e4ebef` | text, **primary button background** |
| muted / faint | `#5d6b75` / `#8a97a0` | `#93a3ad` / `#6c7c86` | secondary text, labels |
| line | `#e1e6ea` | `#222e36` | borders |
| accent (+soft) | `#0d7a6b` / `#e0f1ed` | `#36bfa8` / `#11302b` | active nav, links, meters, focus ring |
| good / warn / bad / sky / violet (+soft) | as in KAIRO.html | as in KAIRO.html | status, priority, role pills |

- Font: **Geist** via the `@fontsource-variable/geist` npm package (no CDN). Numbers use tabular figures.
- Status pills: To do = sky, In progress = warn, Done = good. Priority: High = bad, Medium = warn,
  Low = muted, each with an arrow icon. Roles: Admin = violet, Member = sky, Viewer = muted.
  Inactive = muted.
- KPI cards: an uppercase 10px label, a large number, a muted caption, and an optional 3px colored
  top edge.
- Icons: lucide-react. No emoji in the product.

## App structure

```
Top bar:  [≡ toggle] [T] Task Tracker / Team workspace / <Page>   [Search ⌘K] [☀/☾] [avatar initials]
Sidebar:  WORKSPACE: Dashboard · Tasks (count) · Team members (count)
          ADMIN: Roles & access
          Open ⇄ icon rail (button + Ctrl/⌘+B, remembered). On phones it's an off-canvas sheet.
Routes:   /            Dashboard
          /tasks       Tasks
          /team        Team members
          /roles       Roles & access
          *            Not found page with a link home
```

- The **avatar** shows initials for a generic "Workspace admin". There's no user menu, because there
  is no login (avoids dead UI).
- **Search ⌘K**: a command palette (shadcn `Command`) that jumps to pages, tasks (by title) and
  members (by name). Choosing a task opens Tasks filtered to it. Choosing a member opens Tasks
  filtered by that assignee.
- **"New task"** is available on Dashboard and Tasks, and the `N` shortcut is kept. It opens the v1
  form in a shadcn `Sheet`, now with an **Assignee** select listing active members plus "Unassigned".
- Toasts: shadcn `Sonner`, replacing the hand-written v1 toast.

## Pages

**Dashboard**
- Data comes from one new endpoint, so the numbers are computed on the server.
- KPI cards: Open tasks (todo + in progress, caption "across N members"), In progress (warn edge),
  High priority open (bad edge), Done this week (good edge; tasks with `completedAt` since Monday
  00:00 server time).
- "Needs attention": up to 5 open high-priority tasks, newest first, with status pill and assignee.
  Clicking a row opens Tasks.
- "Workload by member": open task count per active member, plus an "Unassigned" row, as teal meters
  sorted descending.
- "Tasks by status": a stacked horizontal bar with legend and counts.

**Tasks**: v1 behavior, re-skinned and extended
- Segmented status tabs (All / To do / In progress / Done) with counts. These map to the server
  `?status=` filter.
- Filters: Priority (server `?priority=`) and **Assignee** (server `?assigneeId=`; `unassigned`
  allowed).
- Sort: Newest (server order) or Priority (client sort: high to low, then newest).
- Table columns: Task (title + one-line description), Status (inline select pill), Priority,
  **Assignee** (avatar + name; inline select to reassign), Created.
- The row ⋯ menu offers Change assignee and Delete (with an `AlertDialog` replacing
  `window.confirm`). Below 768px the rows become cards.
- All v1 states stay: skeletons, the two empty states, error with retry, a toast for every action,
  and the "hidden by the current filters" message.

**Team members**
- Table columns: Member (avatar initials with a color derived from the name, name, email), Role
  pill, Status pill, Open tasks count, ⋯ menu (Edit, Deactivate/Reactivate).
- "Add member" opens a `Dialog` with name, email and role. Edit uses the same dialog. Field errors
  come from the shared schema and from the server (for example a duplicate email).
- Inactive members stay listed but muted. They can't be picked as an assignee for new assignments,
  and their existing assignments are kept and shown with an "inactive" hint.

**Roles & access**: the "user control" page
- At the top, three cards describing Admin / Member / Viewer, labelled "Roles are descriptive.
  This workspace has no sign-in."
- Below, a table of all members with an inline Role select and an Active switch. Each change saves
  immediately with a toast.
- Guard: the last active Admin can't be demoted or deactivated (400 from the server, and the
  control is disabled with a tooltip).

## Backend changes

All new rules live in `shared/` as Zod schemas, the same pattern as v1.

**Member** (new collection `members`)

| Field | Rules |
|---|---|
| name | required, trimmed, 2–60 chars |
| email | required, trimmed, lower-cased, valid email, **unique** (duplicate → 409 `{ message, errors:[{field:"email"}] }`) |
| role | `admin \| member \| viewer`, default `member` |
| status | `active \| inactive`, default `active` |
| createdAt / updatedAt | timestamps |

| Method | Path | Notes |
|---|---|---|
| GET | `/api/members` | `?status=` `?role=` optional. Sorted by name. Each item includes `openTaskCount`. |
| POST | `/api/members` | 201. 400 on validation, 409 on duplicate email |
| PATCH | `/api/members/:id` | any of name/email/role/status (at least one). 404 for unknown or malformed id, same rule as tasks. 400 when it would leave no active admin. |

There is no DELETE for members: deactivation keeps history and assignments intact.

**Task** (additive only)
- New optional `assigneeId` (ObjectId of a member, or absent). It's returned in responses as
  `assigneeId?: string`.
- New `completedAt?: string`. It's set when status becomes `done` (via PATCH or create) and cleared
  when it leaves `done`. It's used for "Done this week".
- `POST /api/tasks` also accepts an optional `assigneeId`, which must reference an **active** member
  (400 on `assigneeId` otherwise).
- `GET /api/tasks` also accepts `?assigneeId=<id>|unassigned`.
- **The v1 PATCH is unchanged.** Reassignment uses a new endpoint:
  `PATCH /api/tasks/:id/assignee` with body `{ assigneeId: string | null }`. Errors: 404 for an
  unknown or malformed task id, 400 for an unknown or inactive member.

**Dashboard**
- `GET /api/dashboard/summary` returns
  `{ totals: { open, inProgress, highOpen, doneThisWeek, all }, byStatus: {todo,in_progress,done}, byPriority: {low,medium,high}, workload: [{ memberId|null, name, openCount }], needsAttention: Task[] (≤5) }`.
- It's computed with MongoDB aggregation.

**Seed data**
- `npm run seed` (against `MONGODB_URI`) inserts about 6 members and about 24 realistic tasks with
  mixed statuses, priorities, assignees and dates. It refuses to run if the database already has
  tasks, unless `--force` is passed.
- `npm run dev:memory` seeds automatically, so reviewers see a populated app with zero setup.

**Tests** (Vitest + Supertest, in-memory MongoDB, the same style as v1)
- Members: create/list/patch, validation, duplicate email → 409, malformed id → 404,
  last-active-admin guard, `openTaskCount`
- Assignee: create with assignee, reassign, unassign, inactive or unknown member → 400, filter by
  assignee and `unassigned`
- `completedAt`: set on done, cleared on reopen
- Dashboard summary: counts, workload, needs-attention order and limit, the "this week" boundary
- **All 51 v1 tests stay unchanged and green.**

## Frontend architecture

- **Routing:** `react-router` v7 (library mode) with a `<AppLayout>` holding the shell and an
  `<Outlet>` per page. Lazy-load the page components.
- **Data:** TanStack Query. Query keys are `['tasks', filters]`, `['members', filters]`,
  `['dashboard']`. Mutations invalidate the related keys, which replaces v1's hand-written refetch
  logic. Requests still go through the single typed API module, which validates every response
  with the shared schemas.
- **Components:** shadcn/ui is generated into `client/src/components/ui/` using its CLI conventions
  and themed by the tokens above. The components used are sidebar, button, card, badge, table,
  select, dropdown-menu, dialog, alert-dialog, sheet, tabs or toggle-group, input, textarea, label,
  switch, tooltip, avatar, skeleton, command, separator and sonner.
- **Folders:** `components/ui` (generated), `components/layout` (shell, sidebar, top bar, theme
  toggle, command palette), `features/{dashboard,tasks,team,roles}` (pages and their pieces),
  `api/`, `lib/`.
- **Theme:** a `class="dark"` toggle on `<html>`, stored in `localStorage`, defaulting to
  `prefers-color-scheme`, and applied before first paint by an inline script in `index.html`, so it
  doesn't flash.

## Process

1. Branch `feature/full-app` and implement per the plan, with test-driven development on every
   backend change.
2. **UI/UX architect agent** (fresh subagent): drives the running app with playwright-cli. It
   checks every page in light and dark at 1440px and 390px, compares against `KAIRO.html` and the
   ui-ux-pro-max checklist (contrast, focus, hierarchy, spacing, states, consistency), and writes
   prioritized findings with screenshots.
3. **Fixer agent** (a separate fresh subagent) applies the findings it can verify, one commit per
   group.
4. I re-verify in the browser, run every check, and then do the final whole-branch code review, as in v1.

## Calls settled after the builder check *(builder's calls)*

- **Filters live in the URL** on `/tasks`: `?status=&priority=&assignee=<id|unassigned>&sort=priority`.
  They survive refresh and links, and they map 1:1 to the server query (sort stays on the client).
- **Opening one task** (⌘K result or a Dashboard "Needs attention" row) navigates to
  `/tasks?task=<id>`. Filters are cleared, the row is scrolled into view and highlighted for about
  2 seconds, and nothing new is added to the API. If the id isn't in the list, a toast says "Task
  not found". A ⌘K member result navigates to `/tasks?assignee=<id>`.
- **Last-admin guard (reading a):** PATCH /members returns 400 only when the change would turn the
  **last remaining active admin** into a non-admin or inactive. With zero admins (for example an
  existing v1 database), nothing is blocked. Seed data always includes an active admin.
- **Workload:** rows for active members only. Open tasks assigned to inactive members are counted
  in totals and grouped into an "Inactive members" row.
- **`?assigneeId=`** with a well-formed id that matches no member returns `[]` (same as any filter
  with no matches). A malformed value that isn't `unassigned` returns 400.
- **Tasks already done before v2** have no `completedAt`. "Done this week" uses `completedAt`,
  falling back to `updatedAt` for those.
- The `.gitignore` change (`.superpowers/`) and this spec are committed on `feature/full-app`.

## Answered by the author after the builder check

- **CLAUDE.md and README are rewritten for v2 on `feature/full-app` only.** `main` keeps the v1
  versions. The new CLAUDE.md drops the v1-only rules ("no React Query / component libraries",
  "Inter", "no features beyond the brief") and states the v2 stack, visual system and anti-goals.
  This happens in the plan's first task, so every later agent reads the v2 rules.
- **Seed behavior:** `npm run seed` runs only when both `tasks` and `members` are empty.
  `npm run seed -- --force` first prints `Seeding database "<name>" on <host>`, then **deletes all
  documents in `tasks` and `members`** and reseeds. It touches no other collection.

## Left to the builder

Exact spacing and Tailwind classes within the token system, icon choices, seed data content, the
copy of descriptions and empty states (plain, specific, no marketing tone), and internal file
names beyond the folder layout above.
