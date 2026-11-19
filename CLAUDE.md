# CLAUDE.md: Task Tracker v2 (full application) on branch `feature/full-app`

This repo began as a **take-home coding challenge**. The brief is [Full-Stack.pdf](Full-Stack.pdf).
- `main` holds the minimal v1 submission that meets the brief exactly.
- **This branch (`feature/full-app`) is v2.** It builds a complete, standard multi-page application on
  top of v1 to show more than the brief asks, **without weakening anything the brief grades**.

Designs:
- v1: [docs/superpowers/specs/2026-11-19-task-tracker-design.md](docs/superpowers/specs/2026-11-19-task-tracker-design.md)
- v2: [docs/superpowers/specs/2026-11-20-full-app-design.md](docs/superpowers/specs/2026-11-20-full-app-design.md).
  It is authoritative for this branch: visual tokens, pages, endpoints, settled calls.

## What reviewers grade (still the priority)

Clean architecture, strict type safety (no `any`), proper validation, working tests and a clean git
history. v2's features and polish only count if all of these stay intact.

## The frozen v1 contract

These endpoints must behave exactly as in v1, and the 51 v1 tests must pass **unmodified**:

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/tasks` | 200 `Task[]` newest first. `?status=` `?priority=` (v2 adds `?assigneeId=<id>\|unassigned`) |
| POST | `/api/tasks` | 201 / 400 (v2 adds optional `assigneeId`) |
| PATCH | `/api/tasks/:id` | **only `status` and/or `priority`**. 404 for an unknown or malformed id |
| DELETE | `/api/tasks/:id` | 200 `{ message, id }` / 404 |

Error body everywhere: `{ "message": string, "errors"?: [{ "field": string, "message": string }] }`.

v2 adds the following. All of them are additive, and the details are in the v2 spec:
- `GET/POST /api/members`, `PATCH /api/members/:id` (unique email → 409, last-active-admin guard → 400)
- `PATCH /api/tasks/:id/assignee` `{ assigneeId: string | null }`
- `GET /api/dashboard/summary`
- Task fields `assigneeId?`, `completedAt?`

## Architecture

```
shared/   Zod schemas + inferred types: the single source of truth (task, member, dashboard, ids)
server/   Express 5 + Mongoose 9. createApp() is separate from startServer(). Central error handler.
          seed/ holds the seed data and `npm run seed`
client/   React 19 + Vite 8 + Tailwind 4 + shadcn/ui (Radix) + React Router 7 + TanStack Query 5
          src/components/ui      shadcn components (generated, then ours to maintain)
          src/components/layout  app shell: sidebar, top bar, theme toggle, command palette
          src/components/common  pills, avatars, KPI cards, page header, states
          src/features/<page>/   page + its pieces + TanStack Query hooks
          src/api/               the only fetch callers; every response validated with shared schemas
```

## UI rules

- **Visual system:** the KAIRO tokens in the v2 spec's table, in light and dark. Geist font
  (`@fontsource-variable/geist`). Ink-black primary buttons, teal accent, uppercase 10px labels,
  KPI cards with a colored top edge, soft dotted status pills, segmented tabs. lucide icons, never emoji.
- **Shell:** the sidebar toggles between open and an icon rail (button and Ctrl/⌘+B, remembered).
  The light/dark/system theme is remembered with no flash on load. ⌘K opens the command palette,
  and `N` opens New task.
- **Pages:** Dashboard `/`, Tasks `/tasks`, Team members `/team`, Roles & access `/roles`, 404 `*`.
- **Anti-goals:**
  - no dead UI (no bell, settings page or user menu, since there is no login)
  - no KAIRO name, logo or wording
  - no generic admin-template look
  - accessibility stays: keyboard, focus rings, AA contrast in both themes

## Commands (from the repo root)

```bash
npm install            # registry forced to https via .npmrc
npm run dev            # API :4000 + UI :5173 against MONGODB_URI (server/.env)
npm run dev:memory     # same with an in-memory MongoDB, auto-seeded with sample data
npm run seed           # seed the MONGODB_URI database (only if tasks and members are empty)
npm run seed -- --force  # DELETES all tasks and members in that database, then reseeds
npm test               # shared + server + client API tests (Vitest)
npm run typecheck && npm run lint && npm run build
```

## Development rules

- TypeScript strict. No `any`, no `@ts-ignore`, no escaping `as` casts. Narrow `unknown`.
- New request and response shapes go in `shared/` first, with tests.
- Test-driven development for every server change (Vitest + Supertest + in-memory MongoDB).
- Add dependencies by editing package.json, then do a clean reinstall (npm/cli#4828 drops
  rolldown's native binding). Keep `node_modules/.cache/mongodb-memory-server` (about 800 MB).
- Small conventional commits ending with the Co-Authored-By line. Never commit `.env`,
  `KAIRO.html` or secrets. Never push without being asked.
- React Router stays on 7.x (v8 needs Node ≥ 22.22, but engines is `^22.13.0 || >=24.0.0`).

## Skills and agents

| Phase | Skill / agent |
|---|---|
| Plan → build | `writing-plans` → `executing-plans`, with `test-driven-development` |
| Library APIs (shadcn 4, React Router 7, TanStack Query 5, Zod 4, Mongoose 9) | `context7` |
| Visual decisions | `ui-ux-pro-max` plus the v2 spec's visual system |
| Browser verification | `playwright-cli` (headed when the author is watching) |
| After the build | **UI/UX architect agent** reviews every page (light/dark, 1440/390) against KAIRO.html → **separate fixer agent** applies findings → re-verify |
| Before done | `verification-before-completion`, then the whole-branch code review |
