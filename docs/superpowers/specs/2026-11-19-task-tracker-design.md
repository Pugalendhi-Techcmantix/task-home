# Design: Team Task & Bug Tracker

Date: 2026-11-19 · Source brief: [Full-Stack.pdf](../../../Full-Stack.pdf)

## Intent

This is a take-home for a full-stack engineering role. It's a small MERN + TypeScript task and bug
tracker, built in about 3 hours. The goal is to impress the reviewers on what they say they grade:
clean architecture, strict types, solid validation, working tests and a clean git history. Features
and styling come second.

## Goals

- Implement every requirement in the brief exactly as written (see CLAUDE.md for the full table)
- A reviewer can clone it, run `npm install && npm test` with no database, and see the tests pass
- One source of truth for validation rules and types, shared by server and client
- Code simple enough for the author to walk through in a follow-up interview

## Non-goals

- Auth, users, assignees, comments, pagination, sorting controls, editing title/description
- Frontend unit tests and a committed Playwright e2e suite (the UI is checked by hand with the
  playwright-cli skill instead)
- Deployment, Docker

## Anti-goals (would fail even if it "works")

- Any `any`, `@ts-ignore`, or casts used to silence the compiler
- Validation rules or the `Task` type written twice (server and client drifting apart)
- Diverging from the brief's literal rules (e.g. returning 400 for a malformed id on PATCH)
- One giant commit, or a heavily styled UI that ate the time box

## Constraints

- Stack fixed by the brief: Node, Express, MongoDB/Mongoose, React, Vite, TypeScript, Zod, Vitest
- Dev machine (Windows, Node 24) has no MongoDB and no Docker. The app runs against a MongoDB
  Atlas free cluster or a local install. Tests use `mongodb-memory-server`.
- About 3 hours of effort

## Approaches considered

| Approach | Trade-off |
|---|---|
| **A. npm workspaces monorepo with a `shared/` package** of Zod schemas + inferred types (**chosen**) | True end-to-end type safety and one copy of the rules. The reviewers see it immediately. Costs about 10 minutes of workspace setup. |
| B. Separate `server/` and `client/` folders, with the client re-declaring the types | Simplest setup, but types and rules can drift. That weakens the "end-to-end type safety" requirement, the item reviewers look for. |
| C. A typed RPC layer (tRPC / ts-rest) | Strongest typing, but replaces the REST API the brief asks for and adds a library to explain. Over-built for a 3-hour task. |

The author handed over the technical choices, so A is my call. It's the cheapest way to make
type safety visible.

## Decisions

### Repo layout

```
.
├── package.json              # workspaces + root scripts (dev, test, typecheck, lint)
├── eslint.config.js
├── tsconfig.base.json        # strict settings shared by all packages
├── README.md
├── shared/
│   └── src/{task.ts,index.ts}        # enums, createTaskSchema, updateTaskSchema, taskQuerySchema, Task type
├── server/
│   ├── .env.example                  # PORT, MONGODB_URI
│   ├── src/
│   │   ├── index.ts                  # load env → connect → listen
│   │   ├── app.ts                    # createApp(): express app, no listen
│   │   ├── config/env.ts             # Zod-validated env
│   │   ├── db.ts                     # connect/disconnect helpers
│   │   ├── models/task.model.ts      # Mongoose schema, timestamps, toJSON → id
│   │   ├── routes/task.routes.ts
│   │   ├── controllers/task.controller.ts
│   │   ├── middleware/{validate.ts,errorHandler.ts,notFound.ts}
│   │   └── lib/httpError.ts
│   └── tests/{setup.ts,tasks.test.ts}
└── client/
    ├── vite.config.ts                # react + tailwind plugins, /api proxy → server
    └── src/
        ├── api/tasks.ts              # typed fetch wrapper, ApiError with field errors
        ├── hooks/useTasks.ts         # list + filters + load/error state, refetch after mutations
        ├── components/{TaskFilters,TaskForm,TaskList,TaskCard,StatusBadge,PriorityBadge}.tsx
        ├── App.tsx, main.tsx, index.css
```

### Shared package

- `TASK_STATUSES = ["todo","in_progress","done"] as const`, `TASK_PRIORITIES = ["low","medium","high"] as const`
- `createTaskSchema`: title trimmed 3–100, description optional ≤500 (empty string → undefined), status and priority optional enums. `.strict()`.
- `updateTaskSchema`: `{ status?, priority? }`, `.strict()`, refined so at least one field is present
- `taskQuerySchema`: `{ status?, priority? }` for GET filters
- `Task` interface: `{ id, title, description?, status, priority, createdAt: string, updatedAt: string }`
- The package exports TypeScript source directly. Vite, tsx and Vitest all read TS, so there's no build step.

### API behavior

- GET: validates the query with `taskQuerySchema` (400 if bad) and sorts by `createdAt` descending
- POST: 201 + created doc
- PATCH: if the id isn't a valid ObjectId → 404. Body validated (400). Not found → 404. Else 200 + updated doc (`runValidators: true`, `new: true`).
- DELETE: invalid/unknown id → 404. Else 200 `{ message: "Task deleted", id }`.
- Unknown keys in POST/PATCH bodies → 400 (strict schemas). For example, PATCH can't change the title.
- Error body: `{ message, errors?: [{ field, message }] }`. Unknown routes → 404 JSON. Unexpected errors → 500 with a generic message, logged server-side.
- Express 5 forwards async errors on its own, so no try/catch wrappers are needed.
- CORS isn't needed in dev (Vite proxy). The `cors` package is enabled anyway so the API works when called directly.

### Tests (server, Vitest + Supertest + mongodb-memory-server)

A global setup starts an in-memory MongoDB, and the collection is cleared before each test. Cases:

1. POST valid → 201, body has id, title, defaults `todo`/`medium`, createdAt *(required)*
2. POST missing title / 2-char title → 400 with a `title` field error *(required)*
3. PATCH status → 200 and the change is persisted *(required)*
4. PATCH unknown id → 404. PATCH malformed id → 404. PATCH empty body or `title` → 400.
5. GET with `?status=` and `?priority=` returns only matching tasks. An invalid filter → 400.
6. DELETE existing → 200, then gone. DELETE unknown → 404.

### Frontend behavior

**Quality bar (author's requirement): enterprise-grade UI/UX.** It should feel like a polished internal
tool (Linear, Jira, GitHub Issues), not a tutorial demo. That means a restrained neutral palette,
one accent color, a consistent spacing scale, Inter font, clear hierarchy, visible keyboard focus,
WCAG AA contrast, and feedback for every action. ui-ux-pro-max guides the palette, type and
component details. This polish stays inside the brief's features: no new product features.

- **App shell:** a top bar with the product name. The page header has the title "Tasks", a task count and a primary "New task" button.
- **Create:** "New task" opens a right-side drawer (a full-screen sheet on mobile) with the form. Esc and clicking the backdrop close it, focus moves into it on open and returns on close. Validated with `createTaskSchema` before sending. Server 400 field errors show under the matching inputs. The submit button shows a busy state. The drawer closes and the form resets on success.
- **Toolbar:** status and priority filters (selects) plus "Clear filters" when any filter is active. Changing a filter refetches from the server.
- **List:** a table on desktop (columns: Title + description preview, Status, Priority, Created, Actions). It becomes stacked cards below 768px.
- **Badges:** status (todo = slate, in progress = blue, done = green) and priority (low = gray, medium = amber, high = red, with a small icon). Text labels always appear, so color is never the only signal.
- **Inline status change:** a compact select in the Status column. Delete is an icon button with an aria-label and a `window.confirm`. Both are disabled while their request runs. The list refetches after each change, so filters stay correct.
- **Feedback:** toasts for created/updated/deleted and for failures. Skeleton rows while loading. Empty states with an icon and a message: "No tasks yet" with a "New task" button, or "No tasks match these filters" with a "Clear filters" button. An error state with a retry button.
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`, `lucide-react` icons. Toasts and the drawer are small hand-written components (no UI library).

### Running without your own MongoDB *(author approved)*

`npm run dev:memory` starts the server against `mongodb-memory-server` (data is lost on restart),
alongside the client. `npm run dev` uses `MONGODB_URI` from `server/.env`. Both are documented in the README.

### Repo visibility *(author approved)*

The brief PDF, CLAUDE.md and `docs/` are committed, and commits carry the Claude co-author line.
This can be changed before the first push if needed.

### Tooling

- TypeScript 6.0.x with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` off (it fights Zod output types)
- ESLint flat config with typescript-eslint. `@typescript-eslint/no-explicit-any: error`.
- `concurrently` runs both dev servers from the root. The server runs with `tsx watch`.

### Smaller calls (builder's, marked as such)

- The Mongoose schema imports `TASK_STATUSES` / `TASK_PRIORITIES` and defaults from `shared/`, so enums are never re-typed. *(my call)*
- Malformed JSON body → 400 `{ message: "Request body must be valid JSON" }` via the error handler. *(my call)*
- A repeated query param (`?status=todo&status=done`) arrives as an array, fails `taskQuerySchema` → 400. *(my call)*
- Delete confirmation uses `window.confirm`. It's plain and accessible, with no modal code to explain. *(my call)*

### Repo and delivery *(my call)*

- `git init` is done (branch `main`). Commits go straight to `main` in the sequence below, so the
  reviewers see a linear history with no merge commits.
- The author creates the GitHub repo and pushes. Claude never pushes without being asked.

### Commit sequence (planned)

1. `docs: add brief, CLAUDE.md and design`
2. `chore: set up npm workspaces, TypeScript and ESLint`
3. `feat(shared): add task schemas and types`
4. `test(server): add API tests for task endpoints` → `feat(server): …` (in TDD steps)
5. `feat(client): scaffold Vite app with typed API client`
6. `feat(client): task list, filters, create form, status update and delete`
7. `docs: README with setup, commands and trade-offs`

## README trade-offs to mention (draft)

1. Refetching the list after every change instead of optimistic updates or a cache library. It's simpler and always consistent with server-side filters, at the cost of an extra request.
2. No frontend automated tests. The UI was checked by hand in a browser. With more time: React Testing Library for the form and a Playwright e2e run.

## Left to the builder

Exact Tailwind classes and spacing, file-internal naming, exact error message wording (descriptive,
mentioning the field), and test file organization beyond the cases above.
