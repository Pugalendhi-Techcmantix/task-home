# Team Task & Bug Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MERN + TypeScript task and bug tracker described in the client brief: a REST API with Zod validation and Vitest/Supertest tests, plus an enterprise-grade React single-page app.

**Architecture:** An npm workspaces monorepo. `shared/` holds the Zod schemas and the inferred types, used by the server for request validation and by the client for form validation and response parsing. `server/` is Express 5 + Mongoose 9, with `createApp()` kept separate from startup so it can be tested. `client/` is React 19 + Vite 8 + Tailwind 4, with one typed API module and one state hook.

**Tech Stack:** Node 24, TypeScript 6.0.x, Express 5, Mongoose 9, Zod 4, Vitest 5, Supertest 7, mongodb-memory-server 11, React 19, Vite 8, Tailwind CSS 4, lucide-react, ESLint 10 + typescript-eslint 8.

**Spec:** [docs/superpowers/specs/2026-11-19-task-tracker-design.md](../specs/2026-11-19-task-tracker-design.md). Also read [CLAUDE.md](../../../CLAUDE.md) and the brief [Full-Stack.pdf](../../../Full-Stack.pdf).

## Global Constraints

- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`. No `any`, no `@ts-ignore`, and no `as` casts to escape a type error.
- `typescript` pinned to `~6.0.3`, because typescript-eslint 8 supports TypeScript only below 6.1.0.
- `@types/node` `^24` (matches Node 24).
- Task field rules: title trimmed, 3–100 chars, required. Description ≤ 500 chars, optional. Status is `"todo" | "in_progress" | "done"`, default `"todo"`. Priority is `"low" | "medium" | "high"`, default `"medium"`. `createdAt` is automatic.
- API base `/api`. Responses expose `id` (string), never `_id` or `__v`. Dates are ISO strings.
- Error body: `{ message: string, errors?: { field: string, message: string }[] }`
- PATCH accepts only `status` and/or `priority`. A malformed **or** unknown id returns **404** on PATCH and DELETE.
- GET filters by `?status=` / `?priority=` on the server, sorted by `createdAt` descending.
- DELETE success: `200 { message: "Task deleted", id }`
- Server default `PORT` is `4000`, the client dev port is `5173`, and Vite proxies `/api` → `http://localhost:4000`.
- Enterprise-grade UI: a neutral palette with one accent color, the Inter font, visible focus rings, WCAG AA contrast, and feedback for every action. Polish only, no features beyond the brief. Use the ui-ux-pro-max skill for visual decisions.
- Library APIs for Zod 4, Mongoose 9, Express 5, Vite 8 and Tailwind 4: check with the context7 skill when unsure. Don't guess from older majors.
- One commit per task, conventional messages, every message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Commit straight to `main`. Never push.

## Review Focus

1. **Whitespace-only title** (`"   "`) must be rejected with a 400 on `title`. The schema trims before checking the length. The test goes in Task 1 (schema) and Task 2 (API).
2. **Length boundaries.** A 3-char and a 100-char title pass, 2 and 101 fail, and a 501-char description fails on `description`. Tests go in Task 1.
3. **Server unreachable from the UI.** If the API is down, the list shows the error state with Retry, not an endless skeleton. Checked in Task 7.
4. **A status change or delete on a task that's already gone** (deleted in another tab). The API returns 404, so the UI shows an error toast and refetches. API behavior is tested in Task 3, the UI is checked in Task 7.
5. **Double-submit or long text.** The submit button is disabled while the request runs, so a double click creates one task. A 100-char title with no spaces wraps instead of breaking the table. Checked in Task 7.

---

## File Structure

```
package.json                 workspaces ["shared","server","client"], root scripts
tsconfig.base.json           shared strict compiler options
eslint.config.js             flat config, typescript-eslint recommendedTypeChecked, no-explicit-any=error
vitest.config.ts             test.projects: ["shared","server"]
.gitattributes / .gitignore  (exist)
README.md

shared/package.json          name "@tracker/shared", exports "./src/index.ts" (TS source, no build)
shared/tsconfig.json
shared/vitest.config.ts
shared/src/task.ts           constants, Zod schemas, inferred types
shared/src/index.ts          re-exports
shared/src/task.test.ts

server/package.json
server/tsconfig.json
server/vitest.config.ts      setupFiles, hookTimeout 120_000
server/.env.example          PORT=4000, MONGODB_URI=...
server/src/app.ts            createApp()
server/src/server.ts         startServer(mongoUri, port)
server/src/index.ts          dotenv + loadEnv + startServer
server/src/dev-memory.ts     in-memory Mongo + startServer
server/src/config/env.ts     loadEnv()
server/src/models/task.model.ts
server/src/routes/task.routes.ts
server/src/controllers/task.controller.ts
server/src/middleware/errorHandler.ts
server/src/middleware/notFound.ts
server/src/lib/httpError.ts
server/tests/setup.ts
server/tests/tasks.test.ts

client/package.json, tsconfig.json, vite.config.ts, index.html
client/src/main.tsx, App.tsx, index.css
client/src/api/tasks.ts                 the only fetch caller
client/src/hooks/useTasks.ts
client/src/lib/labels.ts                display labels + date formatting
client/src/components/toast/ToastProvider.tsx   (provider + useToast)
client/src/components/AppHeader.tsx
client/src/components/TaskToolbar.tsx
client/src/components/TaskTable.tsx      desktop table + mobile card list
client/src/components/StatusSelect.tsx   inline status pill-select
client/src/components/PriorityBadge.tsx
client/src/components/TaskStates.tsx     SkeletonRows, EmptyState, ErrorState
client/src/components/NewTaskDrawer.tsx
client/src/components/TaskForm.tsx
```

**Change from the design (my call):** there is no `validate` middleware. In Express 5, `req.query` is a read-only getter, so controllers call `schema.parse(...)` directly. The error handler turns any `ZodError` into the 400 body. It's one mechanism for body and query alike.

---

### Task 1: Workspace tooling + shared schemas

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `eslint.config.js`, `vitest.config.ts`, `shared/package.json`, `shared/tsconfig.json`, `shared/vitest.config.ts`, `shared/src/task.ts`, `shared/src/index.ts`
- Test: `shared/src/task.test.ts`

**Interfaces:**
- Produces (from `@tracker/shared`):
  - `TASK_STATUSES = ["todo","in_progress","done"] as const`, `TASK_PRIORITIES = ["low","medium","high"] as const`
  - `TaskStatus`, `TaskPriority` (union types). `DEFAULT_STATUS: TaskStatus = "todo"`, `DEFAULT_PRIORITY: TaskPriority = "medium"`
  - `TITLE_MIN = 3`, `TITLE_MAX = 100`, `DESCRIPTION_MAX = 500`
  - `createTaskSchema`: `z.strictObject({ title, description?, status?, priority? })`. Title is `z.string().trim().min().max()` with messages "Title is required", "Title must be at least 3 characters", "Title must be at most 100 characters". Description is trimmed, ≤ 500 ("Description must be at most 500 characters"), and `""` transforms to `undefined`.
  - `updateTaskSchema`: `z.strictObject({ status?, priority? })`, refined with "Provide status or priority to update" when both are missing
  - `taskQuerySchema`: `z.object({ status: z.enum(TASK_STATUSES).optional(), priority: z.enum(TASK_PRIORITIES).optional() })`
  - `taskSchema`: the response shape `{ id: string, title: string, description?: string, status, priority, createdAt: string, updatedAt: string }`
  - `fieldErrorSchema = { field: string, message: string }`, `apiErrorSchema = { message: string, errors?: FieldError[] }`, `deleteTaskResponseSchema = { message: string, id: string }`
  - Types: `Task`, `CreateTaskInput = z.input<typeof createTaskSchema>`, `CreateTaskData = z.output<…>`, `UpdateTaskInput`, `TaskQuery`, `FieldError`, `ApiErrorBody`, `DeleteTaskResponse`

**Root setup:**
- Root `package.json`: `"private": true`, `"type": "module"`, workspaces, `engines.node ">=20"`.
- Scripts:
  - `dev`: `concurrently -n server,client -c blue,magenta "npm run dev -w server" "npm run dev -w client"`
  - `dev:memory`: the same, with `dev:memory -w server`
  - `test`: `vitest run`
  - `typecheck`: `npm run typecheck --workspaces --if-present`
  - `lint`: `eslint .`
  - `build`: `npm run build -w client`
- Root devDependencies: `typescript@~6.0.3`, `vitest@^5`, `eslint@^10`, `@eslint/js`, `typescript-eslint@^8`, `eslint-plugin-react-hooks`, `globals`, `concurrently`.
- `tsconfig.base.json`: target ES2022, module ESNext, moduleResolution bundler, strict, noUncheckedIndexedAccess, noImplicitOverride, noFallthroughCasesInSwitch, isolatedModules, verbatimModuleSyntax, skipLibCheck, noEmit.
- ESLint: `recommendedTypeChecked` with `parserOptions.projectService: true`, `@typescript-eslint/no-explicit-any: "error"`, react-hooks rules for `client/**`. Ignore `**/dist`, `**/node_modules`, `*.config.*` from type-aware rules.
- `shared/package.json` depends on `zod@^4` and sets `"exports": { ".": "./src/index.ts" }` plus `"typecheck": "tsc --noEmit"`.

- [ ] **Step 1: Write the failing tests** in `shared/src/task.test.ts`

```ts
describe("createTaskSchema", () => {
  it("applies no defaults but accepts a minimal valid task", () => {
    expect(createTaskSchema.parse({ title: "Fix login" })).toEqual({ title: "Fix login" });
  });
  it("trims the title and rejects whitespace-only titles", () => {
    expect(createTaskSchema.parse({ title: "  abc  " }).title).toBe("abc");
    const r = createTaskSchema.safeParse({ title: "   " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["title"]);
  });
  it.each([["ab", false], ["abc", true], ["a".repeat(100), true], ["a".repeat(101), false]])(
    "title %j valid=%s", (title, ok) => expect(createTaskSchema.safeParse({ title }).success).toBe(ok));
  it("rejects a missing title with 'Title is required'", () => {
    const r = createTaskSchema.safeParse({});
    expect(r.error?.issues[0]?.message).toBe("Title is required");
  });
  it("rejects a 501-char description on the description path", () => {
    const r = createTaskSchema.safeParse({ title: "abc", description: "x".repeat(501) });
    expect(r.error?.issues[0]?.path).toEqual(["description"]);
  });
  it("turns an empty description into undefined", () => {
    expect(createTaskSchema.parse({ title: "abc", description: "" }).description).toBeUndefined();
  });
  it("rejects unknown status values and unknown keys", () => {
    expect(createTaskSchema.safeParse({ title: "abc", status: "closed" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "abc", owner: "me" }).success).toBe(false);
  });
});
describe("updateTaskSchema", () => {
  it("accepts status only, priority only, or both", () => { /* three parses succeed */ });
  it("rejects an empty object and a title change", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(updateTaskSchema.safeParse({ title: "new" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Install and run. Verify the tests fail**

Run: `npm install` then `npm test`
Expected: FAIL. `shared/src/task.ts` exports nothing yet (import errors).

- [ ] **Step 3: Implement `shared/src/task.ts` and `shared/src/index.ts`** per the Interfaces block. Use `z.enum(TASK_STATUSES)`. Zod 4's custom-message form is `{ error: "..." }`. "Title is required" applies when the input is `undefined`.

- [ ] **Step 4: Verify**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all shared tests PASS, with 0 type errors and 0 lint errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: set up workspaces, TypeScript, ESLint and shared task schemas"
```

---

### Task 2: Server foundation + POST and GET `/api/tasks`

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/vitest.config.ts`, `server/src/app.ts`, `server/src/models/task.model.ts`, `server/src/routes/task.routes.ts`, `server/src/controllers/task.controller.ts`, `server/src/middleware/errorHandler.ts`, `server/src/middleware/notFound.ts`, `server/src/lib/httpError.ts`, `server/tests/setup.ts`
- Test: `server/tests/tasks.test.ts`

**Interfaces:**
- Consumes: everything from Task 1's `@tracker/shared`
- Produces:
  - `createApp(): express.Express`, with `cors()` and `express.json({ limit: "10kb" })`, routes at `/api/tasks`, then `notFound`, then `errorHandler`
  - `class HttpError extends Error { constructor(public readonly status: number, message: string) }`
  - `TaskModel`: a Mongoose model on schema `taskMongooseSchema` with `{ timestamps: true }`. Enums and defaults come from `TASK_STATUSES` / `TASK_PRIORITIES` / `DEFAULT_*`, and title/description lengths from `TITLE_MIN` etc.
  - `type TaskRecord = InferSchemaType<typeof taskMongooseSchema> & { _id: Types.ObjectId }`
  - `toTaskDto(record: TaskRecord): Task`: `id = _id.toString()`, dates `.toISOString()`, `description` omitted when absent
  - `listTasks`, `createTask`, plus `updateTask` and `deleteTask` in Task 3, as Express 5 handlers in `task.controller.ts`
  - `errorHandler(err: unknown, req, res, next)`:
    - `ZodError` → 400 `{ message: "Validation failed", errors: issues.map(i => ({ field: i.path.join(".") || "body", message: i.message })) }`
    - `HttpError` → its status + `{ message }`
    - A body-parser JSON failure (`type === "entity.parse.failed"`) → 400 `{ message: "Request body must be valid JSON" }`
    - Anything else → `console.error` + 500 `{ message: "Internal server error" }`
  - `notFound` → 404 `{ message: "Route not found" }`
- Server dependencies: `express@^5`, `mongoose@^9`, `cors`, `dotenv`, `@tracker/shared` (`"*"`)
- Server devDependencies: `@types/express@^5`, `@types/cors`, `@types/node@^24`, `supertest`, `@types/supertest`, `mongodb-memory-server@^11`, `tsx`
- `server/vitest.config.ts`: `defineProject({ test: { name: "server", environment: "node", setupFiles: ["./tests/setup.ts"], hookTimeout: 120_000 } })`
- `tests/setup.ts`: `beforeAll` starts `MongoMemoryServer` + `mongoose.connect`. `afterEach` runs `deleteMany({})` on every collection. `afterAll` disconnects and stops.

- [ ] **Step 1: Write the failing tests** in `server/tests/tasks.test.ts` (`const app = createApp()`)

```ts
describe("POST /api/tasks", () => {
  it("creates a task and returns 201 with saved fields and defaults", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "Fix login bug", description: "Safari only" });
    expect(res.status).toBe(201);
    const body: unknown = res.body;
    const task = taskSchema.parse(body);
    expect(task).toMatchObject({ title: "Fix login bug", description: "Safari only", status: "todo", priority: "medium" });
    expect(body).not.toHaveProperty("_id");
    expect(await TaskModel.findById(task.id)).not.toBeNull();
  });
  it.each([[{}, "Title is required"], [{ title: "ab" }, "Title must be at least 3 characters"], [{ title: "   " }, "Title must be at least 3 characters"]])(
    "returns 400 with a title field error for %j", async (payload, message) => {
      const res = await request(app).post("/api/tasks").send(payload);
      expect(res.status).toBe(400);
      expect(apiErrorSchema.parse(res.body as unknown).errors).toContainEqual({ field: "title", message });
      expect(await TaskModel.countDocuments()).toBe(0);
    });
  it("returns 400 for malformed JSON", async () => {
    const res = await request(app).post("/api/tasks").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
    expect(apiErrorSchema.parse(res.body as unknown).message).toBe("Request body must be valid JSON");
  });
});
describe("GET /api/tasks", () => {
  // seed: A(todo,high) B(done,high) C(todo,low), created in that order
  it("returns all tasks newest first", /* names = ["C","B","A"] */);
  it("filters by status", /* ?status=todo → ["C","A"] */);
  it("filters by status and priority together", /* ?status=todo&priority=high → ["A"] */);
  it("returns 400 for an invalid filter value", /* ?status=closed → 400, errors[0].field === "status" */);
});
it("unknown route returns 404 JSON", /* GET /api/nope → 404 { message: "Route not found" } */);
```

Supertest types `res.body` as `any`. Always widen it to `unknown` first (`const body: unknown = res.body`, or `res.body as unknown`, which only widens). Then read it through `taskSchema` / `apiErrorSchema` / `deleteTaskResponseSchema`, so the type-aware `no-unsafe-*` lint rules pass. Add a tiny `tests/helpers.ts` with `createViaApi(payload): Promise<Task>` and `listViaApi(query?): Promise<Task[]>`.

- [ ] **Step 2: Run. Verify the tests fail**

Run: `npm test -- --project server`
Expected: FAIL (`createApp` not found). The first run downloads the MongoDB binary.

- [ ] **Step 3: Implement** `httpError.ts`, `task.model.ts` (+ `toTaskDto`), `errorHandler.ts`, `notFound.ts`, `listTasks`/`createTask` controllers, `task.routes.ts` and `app.ts`. Controllers parse with `taskQuerySchema.parse(req.query)` / `createTaskSchema.parse(req.body)` and let errors propagate (Express 5 forwards rejected promises). List uses `.find(filter).sort({ createdAt: -1 }).lean()`.

- [ ] **Step 4: Verify**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all PASS, 0 errors.

- [ ] **Step 5: Commit**: `feat(server): add task model, error handling, create and list endpoints`

---

### Task 3: PATCH and DELETE `/api/tasks/:id`

**Files:**
- Modify: `server/src/controllers/task.controller.ts`, `server/src/routes/task.routes.ts`
- Test: `server/tests/tasks.test.ts`

**Interfaces:**
- Consumes: `TaskModel`, `toTaskDto`, `HttpError`, `updateTaskSchema`, `deleteTaskResponseSchema` (tests)
- Produces:
  - `updateTask`, `deleteTask` handlers
  - `findTaskIdOr404(raw: string): string`, which throws `new HttpError(404, "Task not found")` unless `mongoose.isObjectIdOrHexString(raw)`

Order in `updateTask`: id check (404) → `updateTaskSchema.parse(req.body)` (400) → `findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean()` → null = 404 → 200 DTO.

- [ ] **Step 1: Write the failing tests**

```ts
describe("PATCH /api/tasks/:id", () => {
  it("updates status and persists it", async () => {
    const created = await createViaApi({ title: "Ship it" });
    const res = await request(app).patch(`/api/tasks/${created.id}`).send({ status: "in_progress" });
    expect(res.status).toBe(200);
    expect(taskSchema.parse(res.body).status).toBe("in_progress");
    expect((await TaskModel.findById(created.id).lean())?.status).toBe("in_progress");
  });
  it("updates priority", /* { priority: "high" } → 200, priority "high" */);
  it("returns 404 for an unknown id", /* new Types.ObjectId() → 404 { message: "Task not found" } */);
  it("returns 404 for a malformed id", /* /api/tasks/not-an-id → 404 */);
  it.each([[{}], [{ title: "Renamed" }], [{ status: "closed" }]])("returns 400 for body %j", /* → 400 */);
});
describe("DELETE /api/tasks/:id", () => {
  it("deletes and confirms", /* 200 { message: "Task deleted", id }, then countDocuments() === 0 */);
  it("returns 404 for unknown and malformed ids", /* both 404 */);
});
```

(`createViaApi` comes from `tests/helpers.ts`, added in Task 2.)

- [ ] **Step 2: Run. Verify** that the new tests FAIL with 404 "Route not found".
- [ ] **Step 3: Implement** `findTaskIdOr404`, `updateTask` and `deleteTask`, and register `router.patch("/:id")` and `router.delete("/:id")`.
- [ ] **Step 4: Verify.** `npm test && npm run typecheck && npm run lint` all PASS.
- [ ] **Step 5: Commit**: `feat(server): add update and delete endpoints`

---

### Task 4: Server startup, env and in-memory dev mode

**Files:**
- Create: `server/src/config/env.ts`, `server/src/server.ts`, `server/src/index.ts`, `server/src/dev-memory.ts`, `server/.env.example`

**Interfaces:**
- Produces:
  - `loadEnv(source: NodeJS.ProcessEnv = process.env): { PORT: number; MONGODB_URI: string }`. Zod: `PORT` is coerced to an int, default 4000. `MONGODB_URI` is a string starting with `mongodb`. On failure it throws `Error("Invalid environment: MONGODB_URI …")` naming each bad var.
  - `startServer(mongoUri: string, port: number): Promise<http.Server>`. It connects mongoose, listens and logs `API listening on http://localhost:${port}`. SIGINT/SIGTERM disconnect cleanly.
- `index.ts`: `import "dotenv/config"`, then `loadEnv()` → `startServer`. Exit code 1 with the error message on failure.
- `dev-memory.ts`: `MongoMemoryServer.create()` → `startServer(mem.getUri(), Number(process.env.PORT ?? 4000))`, logging "Using in-memory MongoDB, data resets on restart".
- Scripts in `server/package.json`: `dev: tsx watch src/index.ts`, `dev:memory: tsx watch src/dev-memory.ts`, `start: tsx src/index.ts`, `typecheck: tsc --noEmit`.
- `.env.example`:
  ```
  PORT=4000
  MONGODB_URI=mongodb://127.0.0.1:27017/task-tracker
  ```
  Add a comment line showing the Atlas `mongodb+srv://…` form.

- [ ] **Step 1: Write the failing test** `server/tests/env.test.ts`: `loadEnv({ MONGODB_URI: "mongodb://x/db" })` → `{ PORT: 4000, MONGODB_URI: "mongodb://x/db" }`. `loadEnv({ PORT: "5000", MONGODB_URI: "mongodb://x" }).PORT === 5000`. `loadEnv({})` throws `/MONGODB_URI/`.
- [ ] **Step 2: Run. Verify it fails:** `npm test -- --project server`. FAIL, module not found.
- [ ] **Step 3: Implement** the four files and `.env.example`.
- [ ] **Step 4: Verify.** `npm test && npm run typecheck && npm run lint` pass. Then run `npm run dev:memory -w server` (in the background) and check:
  - `curl -s -XPOST localhost:4000/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"Smoke\"}"` → 201 JSON
  - `curl -s localhost:4000/api/tasks` → an array with "Smoke"
  - Stop the server. `npm run start -w server` with no `.env` → exits 1, mentioning `MONGODB_URI`.
- [ ] **Step 5: Commit**: `feat(server): add env validation, startup and in-memory dev mode`

---

### Task 5: Client foundation: Vite, Tailwind, typed API client, toasts, app shell

**Files:**
- Create: `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`, `client/src/main.tsx`, `client/src/App.tsx`, `client/src/index.css`, `client/src/api/tasks.ts`, `client/src/lib/labels.ts`, `client/src/components/toast/ToastProvider.tsx`, `client/src/components/AppHeader.tsx`

**Interfaces:**
- Consumes: `@tracker/shared` schemas and types
- Produces:
  - `class ApiError extends Error { readonly status: number; readonly fieldErrors: FieldError[] }`
  - `fetchTasks(query: TaskQuery, signal?: AbortSignal): Promise<Task[]>`. Omit undefined params. Parse with `taskSchema.array()`.
  - `createTask(input: CreateTaskInput): Promise<Task>`, `updateTask(id: string, input: UpdateTaskInput): Promise<Task>`, `deleteTask(id: string): Promise<DeleteTaskResponse>`
  - All four go through one private `request<T>(path, init, schema: z.ZodType<T>): Promise<T>`. On `!res.ok`, it parses the body with `apiErrorSchema` (falling back to `{ message: res.statusText }`) and throws `ApiError`. A network failure throws `ApiError(0, "Can't reach the server. Check your connection and try again.")`.
  - `STATUS_LABELS: Record<TaskStatus, string>` = `{ todo: "To do", in_progress: "In progress", done: "Done" }`, `PRIORITY_LABELS` = `{ low: "Low", medium: "Medium", high: "High" }`, `formatDate(iso: string): string` via `Intl.DateTimeFormat(undefined, { dateStyle: "medium" })`
  - `ToastProvider` + `useToast(): { success(message: string): void; error(message: string): void }`. Toasts stack bottom-right (bottom-center on mobile), auto-dismiss after 4s, can be dismissed with a close button, and sit in an `aria-live="polite"` region (`role="alert"` for errors).
  - `AppHeader`: a top bar with the product mark + "Task Tracker"
- Dependencies: `react@^19`, `react-dom@^19`, `lucide-react`, `@tracker/shared`, `zod@^4`
- devDependencies: `vite@^8`, `@vitejs/plugin-react@^6`, `tailwindcss@^4`, `@tailwindcss/vite@^4`, `@types/react@^19`, `@types/react-dom@^19`
- Scripts: `dev: vite`, `build: tsc --noEmit && vite build`, `typecheck: tsc --noEmit`, `preview: vite preview`
- `vite.config.ts`: plugins `react()` and `tailwindcss()`, `server: { port: 5173, proxy: { "/api": "http://localhost:4000" } }`
- `index.css`: `@import "tailwindcss";` + `@theme` tokens (Inter font family, the accent color scale, radius). Load Inter from Google Fonts in `index.html`. Set the `<title>Task Tracker</title>`.

- [ ] **Step 1: Run ui-ux-pro-max** for an internal productivity / issue-tracker tool. Record the chosen accent color, neutral scale, status and priority colors (must keep the spec's mapping: todo = slate, in progress = blue, done = green, low = gray, medium = amber, high = red) and the type scale in `@theme`.
- [ ] **Step 2: Implement** the files above. `App.tsx` renders `ToastProvider` > `AppHeader` + a page header ("Tasks", a disabled "New task" button for now).
- [ ] **Step 3: Verify.** `npm run typecheck && npm run lint && npm run build` all pass. `npm run dev:memory` from the root serves http://localhost:5173 showing the shell.
- [ ] **Step 4: Commit**: `feat(client): scaffold Vite app with typed API client, toasts and app shell`

---

### Task 6: Task list, filters and loading/empty/error states

**Files:**
- Create: `client/src/hooks/useTasks.ts`, `client/src/components/TaskToolbar.tsx`, `client/src/components/TaskTable.tsx`, `client/src/components/StatusSelect.tsx`, `client/src/components/PriorityBadge.tsx`, `client/src/components/TaskStates.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Consumes: `fetchTasks`, `updateTask`, `deleteTask`, `ApiError`, `useToast`, the labels
- Produces:
  - `useTasks()` returns:
    ```ts
    {
      tasks: Task[];
      state: "loading" | "ready" | "error";
      error: string | null;
      filters: TaskQuery;
      setFilters(next: TaskQuery): void;
      reload(): Promise<void>;
      changeStatus(id: string, status: TaskStatus): Promise<void>;
      remove(id: string): Promise<void>;
      pendingIds: ReadonlySet<string>;
    }
    ```
    - It refetches whenever `filters` changes, aborting the previous request with `AbortController`.
    - `changeStatus` and `remove` add the id to `pendingIds`, call the API, toast the result ("Status updated" / "Task deleted", or the `ApiError` message), then `reload()`. They always remove the id from `pendingIds` in `finally`.
    - Background reloads after a change keep the current list visible: `state` goes back to `"loading"` only when the list is empty.
  - `TaskToolbar({ filters, onChange, onClear })`: two labeled `<select>`s ("All statuses" / "All priorities" + the enum options) and a "Clear filters" button shown only when a filter is set
  - `TaskTable({ tasks, pendingIds, onStatusChange, onDelete })`:
    - Desktop (`md:`) is a `<table>` with columns Title (title + truncated one-line description), Status, Priority, Created and Actions (a trash icon button with `aria-label={`Delete ${title}`}`). Delete asks `window.confirm(`Delete "${title}"? This can't be undone.`)` first.
    - Below `md` it's a `<ul>` of cards with the same controls. Long titles use `break-words`.
  - `StatusSelect({ value, disabled, onChange, label })`: a native `<select>` styled as a colored pill with a status dot, plus an accessible label
  - `PriorityBadge({ priority })`: a pill with a lucide icon (`ArrowDown` / `Minus` / `ArrowUp`) and a text label
  - `SkeletonRows({ rows = 5 })`
  - `EmptyState({ filtered, onClear, onCreate })`:
    - When `filtered` is true: "No tasks match these filters" with a "Clear filters" button
    - Otherwise: "No tasks yet" with "Log your first task or bug to get started." and a "New task" button
  - `ErrorState({ message, onRetry })`

- [ ] **Step 1: Implement** the hook and components, and wire them in `App.tsx`. The page header count shows `tasks.length`. `onCreate` in `EmptyState` is a no-op until Task 7.
- [ ] **Step 2: Verify.** `npm run typecheck && npm run lint && npm run build` pass. With `npm run dev:memory`, seed 3 tasks through curl (different statuses and priorities), then check in the browser with **playwright-cli**:
  - The list shows newest first
  - Each filter narrows the list and matches the API
  - "Clear filters" resets them
  - The status select changes the status and shows a toast
  - Delete confirms, removes the task and shows a toast
  - With no tasks: the "No tasks yet" state
  - A filter with no matches: the filtered empty state
- [ ] **Step 3: Commit**: `feat(client): task list with filters, inline status, delete and states`

---

### Task 7: New-task drawer + form, final UI check

**Files:**
- Create: `client/src/components/NewTaskDrawer.tsx`, `client/src/components/TaskForm.tsx`
- Modify: `client/src/App.tsx`, `client/src/hooks/useTasks.ts` (add `create`)

**Interfaces:**
- Consumes: `createTask`, `createTaskSchema`, `ApiError`, `useToast`, `TITLE_MAX`, `DESCRIPTION_MAX`
- Produces:
  - `useTasks().create(input: CreateTaskInput): Promise<Task>`. It calls the API, toasts "Task created" and runs `reload()`. It rethrows `ApiError` so the form can show field errors.
  - `TaskForm({ onSubmit, onCancel })`, where `onSubmit: (input: CreateTaskInput) => Promise<void>`:
    - Fields: Title (required, with a counter `n/100`), Description (a textarea with a counter `n/500`), Status and Priority selects defaulting to "To do" / "Medium"
    - On submit it runs `createTaskSchema.safeParse` and shows each issue under its field (`aria-invalid` + `aria-describedby`), focusing the first invalid field
    - On `ApiError` it maps `fieldErrors` to fields. Errors without a field show in a form-level alert.
    - The submit button reads "Creating…" and is disabled while busy
  - `NewTaskDrawer({ open, onClose, onCreate })`:
    - A right-side panel `w-full sm:max-w-md` with a backdrop and `role="dialog" aria-modal="true" aria-labelledby`
    - Esc and a backdrop click close it. Focus goes to Title on open, Tab is trapped inside, and focus returns to the "New task" button on close.
    - Closes after a successful create (the form remounts, so it resets)

- [ ] **Step 1: Implement** the components, enable the "New task" buttons (page header + empty state), and wire `create`.
- [ ] **Step 2: Verify the type, lint, test and build checks.** `npm test && npm run typecheck && npm run lint && npm run build` all pass.
- [ ] **Step 3: Browser check with playwright-cli** (`npm run dev:memory`) at 1280px and 375px widths. Screenshot each:
  1. Create a valid task: the drawer closes, a toast shows, and the task tops the list
  2. Submit an empty title / "ab" / "   ": inline title error, no request sent
  3. A 100-char unbroken title: the row wraps, no horizontal scroll
  4. Double-click Create: only one task is created
  5. Keyboard only: Tab reaches every control, the focus ring is visible, Esc closes the drawer and focus returns
  6. Delete a task via curl, then change its status in the UI: an error toast, and the list refreshes without the task
  7. Stop the API server, then click Retry / reload: the error state shows with Retry, not an endless skeleton
- [ ] **Step 4: Polish pass with ui-ux-pro-max** on the screenshots: spacing, contrast (AA) and hierarchy. Fix the findings and re-run the typecheck, lint and build checks.
- [ ] **Step 5: Commit**: `feat(client): new task drawer with validated form`

---

### Task 8: README and final verification

**Files:**
- Create: `README.md`

Sections:
1. What it is (one paragraph)
2. Tech stack
3. Project structure (the tree)
4. Prerequisites (Node ≥ 20, plus MongoDB Atlas or a local `mongod`, or neither when using `dev:memory`)
5. Setup: `npm install` and `cp server/.env.example server/.env`
6. Running: `npm run dev` / `npm run dev:memory`, with URLs
7. Tests: `npm test` (notes the one-time MongoDB binary download), `npm run typecheck`, `npm run lint`
8. API reference table with status codes and the error shape
9. Trade-offs:
   - Refetching after every change instead of optimistic updates or a cache library
   - Shared package consumed as TS source with the server run through tsx, so there's no compiled build
   - No frontend automated tests, checked by hand with Playwright instead
10. What I'd do next with more time

- [ ] **Step 1: Write the README.**
- [ ] **Step 2: Clean-clone check.**
  - `git clone . ../tt-verify && cd ../tt-verify && npm install && npm test && npm run typecheck && npm run lint && npm run build` → all pass. Delete `../tt-verify`.
  - Confirm `git ls-files | grep -E "(^|/)\.env$"` prints nothing.
- [ ] **Step 3: Commit**: `docs: add README with setup, commands and trade-offs`
- [ ] **Step 4:** Run verification-before-completion, then requesting-code-review on the full history. Fix confirmed findings in separate `fix:` commits.
