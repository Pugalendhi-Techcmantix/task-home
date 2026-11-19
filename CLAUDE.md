# CLAUDE.md: Team Task & Bug Tracker (take-home)

This repo is a **timed take-home coding challenge** for a full-stack engineering role.
The client brief is [Full-Stack.pdf](Full-Stack.pdf). It is the source of truth: when this file
and the PDF disagree, the PDF wins. Read it first. The approved design is in
[docs/superpowers/specs/2026-11-19-task-tracker-design.md](docs/superpowers/specs/2026-11-19-task-tracker-design.md).

## What the reviewers grade (in priority order)

The brief says these count **far more** than extra features or styling:

1. Clean architecture
2. Strict type safety (TypeScript `strict`, **no `any`** anywhere)
3. Proper input validation (Zod, descriptive 400 errors)
4. Working automated tests (`npm test`)
5. A clean, incremental git history, `.env.example`, and a clear README

Time guideline: **about 3 hours**. Keep the work small and solid. Don't add features the brief doesn't ask for.

## The product

A small single-page app where team members log tasks or bugs, filter them by status or priority,
change their status, and delete them.

### Data model: `Task`

| Field         | Type   | Rules                                                     |
|---------------|--------|-----------------------------------------------------------|
| `title`       | string | required, trimmed, 3–100 chars                            |
| `description` | string | optional, max 500 chars                                   |
| `status`      | enum   | `"todo" \| "in_progress" \| "done"`, default `"todo"`       |
| `priority`    | enum   | `"low" \| "medium" \| "high"`, default `"medium"`           |
| `createdAt`   | Date   | set automatically (Mongoose `timestamps`)                 |

API responses expose `id` (string), not `_id`/`__v`. Dates go over the wire as ISO strings.

### REST API (base `/api`)

| Method | Path             | Success                         | Errors |
|--------|------------------|---------------------------------|--------|
| GET    | `/tasks`         | 200 `Task[]`, newest first. Optional `?status=` and `?priority=` filter **on the server** | 400 for an invalid filter value |
| POST   | `/tasks`         | 201 with the created `Task`     | 400 with field-level messages |
| PATCH  | `/tasks/:id`     | 200 with the updated `Task`. Only `status` and/or `priority` can change | 400 for an invalid body; **404 for an unknown id AND for a malformed id** (the brief requires this) |
| DELETE | `/tasks/:id`     | 200 `{ message, id }`           | 404 for an unknown or malformed id |

Error body shape (every error):

```json
{ "message": "Validation failed", "errors": [{ "field": "title", "message": "Title must be at least 3 characters" }] }
```

`errors` appears only on validation failures.

### Frontend (one page)

**Quality bar: enterprise-grade UI/UX.** It should feel like a polished internal tool (Linear, Jira,
GitHub Issues). That means a restrained neutral palette with one accent color, the Inter font, a
consistent spacing scale, visible keyboard focus, WCAG AA contrast, and feedback for every action.
Use ui-ux-pro-max for visual decisions. Polish only. No features beyond the brief.

- App shell: a top bar, plus a page header with "Tasks", a count and a primary "New task" button
- "New task" opens a right-side drawer (a full-screen sheet on mobile) with the create form. Field errors come from client-side validation and from the server's 400.
- Toolbar: status and priority filters plus "Clear filters". Changing a filter refetches from the server.
- List: a table on desktop (Title + description, Status, Priority, Created, Actions). Cards below 768px.
- Status and priority badges with text labels (color is never the only signal)
- Inline status select (PATCH) and an icon delete button (with confirm) on every row
- Skeleton loading rows, empty states with a call to action, an error state with retry, and toasts for every change
- Responsive from 360px phones up to desktop

## Architecture

npm workspaces monorepo with three packages:

```
shared/   @tracker/shared: Zod schemas, enums and inferred types. The single source of truth.
server/   Express 5 + Mongoose 9 API (TypeScript, run with tsx)
client/   React 19 + Vite + Tailwind CSS 4 SPA
```

- **Validation rules live once** in `shared/`. The server validates requests with them, the client
  validates the form with them, and the TypeScript types come from `z.infer`. Never redefine the rules
  or the `Task` type anywhere else.
- **Server layering:** `routes` → `validate` middleware → controller → Mongoose model. A central
  error handler turns `HttpError` and Zod errors into the error body above. `createApp()` (in `app.ts`)
  builds the app without listening, so tests use it through Supertest. `index.ts` loads env,
  connects to Mongo and listens.
- **Env is validated** at startup with Zod (`server/src/config/env.ts`). A missing `MONGODB_URI`
  stops the server with a clear message.
- **Client:** a typed API module (`client/src/api/tasks.ts`) is the only place that calls `fetch`.
  A `useTasks` hook holds the list state. Components get typed props. Vite proxies `/api` to the
  server, so the client needs no env.

## Commands (from the repo root)

```bash
npm install          # installs all workspaces
npm run dev          # server (PORT, default 4000) + client (5173) together, using MONGODB_URI
npm run dev:memory   # same, but with a temporary in-memory MongoDB (no setup, data lost on restart)
npm test             # server API tests (Vitest + Supertest + in-memory MongoDB)
npm run typecheck    # tsc --noEmit for every workspace
npm run lint         # ESLint; `no-explicit-any` is an error
```

Setup: copy `server/.env.example` to `server/.env` and set `MONGODB_URI` (MongoDB Atlas free tier or
local `mongod`). Tests need no database: they start an in-memory MongoDB. The first run downloads
its binary (about 800 MB, cached after that).

## Development rules

- **TypeScript strict** everywhere. No `any`, no `as` casts to escape type errors, no `@ts-ignore`.
  Use `unknown` and narrow it.
- **Follow the brief literally.** Examples: PATCH changes only status/priority, a malformed id
  returns 404 (not 400), filtering happens on the server.
- **Tests first for the API** (test-driven-development skill). Required tests: POST success (201 +
  saved fields), POST invalid → 400, PATCH status → 200. Also cover the 404s, GET filters and DELETE.
- **Small commits.** One logical step per commit with a conventional message (`feat(server): …`,
  `test(server): …`, `chore: …`). The reviewers read the history.
- **Keep it plain.** No state libraries, no React Query, no component libraries. Readable code
  beats clever code. The author must be able to explain every line in a follow-up interview.
- **Never commit `.env`** or secrets. Only `.env.example`.
- **Pinned versions:** TypeScript 6.0.x (not 7.x, whose tooling support is still settling),
  Express 5, Mongoose 9, Zod 4, Vitest 5, React 19, Vite 8, Tailwind 4.

## Skills to use, by phase

| Phase | Skill |
|---|---|
| Design → plan | `brainstorming` → `writing-plans` |
| Building | `subagent-driven-development` (or `executing-plans`), with `test-driven-development` for the API |
| Library APIs (new majors: Zod 4, Mongoose 9, Express 5, Tailwind 4, Vite 8) | `context7`. Check the docs, don't guess. |
| UI look, badges, states, accessibility | `ui-ux-pro-max` |
| Checking the UI in a real browser (create, filter, update, delete, empty/loading/error, mobile width) | `playwright-cli` |
| Bugs | `systematic-debugging` |
| Before saying it's done | `verification-before-completion`, then `requesting-code-review` |
| Wrap-up | `finishing-a-development-branch` |

## Definition of done

- [ ] All four endpoints behave exactly as in the table above
- [ ] `npm test` passes on a fresh clone with no database installed
- [ ] `npm run typecheck` and `npm run lint` pass with zero `any`
- [ ] UI flows checked in a browser with playwright-cli, desktop and mobile width
- [ ] `server/.env.example` lists `PORT` and `MONGODB_URI`
- [ ] README: setup steps, run commands for both servers and the tests, 1–2 time-box trade-offs
- [ ] Git history is incremental and readable
