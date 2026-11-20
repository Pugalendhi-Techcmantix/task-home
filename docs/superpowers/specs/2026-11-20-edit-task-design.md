# Edit task: design (short)

Approved in conversation on 2026-11-20.

## Intent
A task can't be corrected after it's created: the row's "…" menu only offers Change assignee and Delete,
so a wrong title or description means deleting and re-creating. Add a full **Edit** for a task.

## Goals
- "Edit" item at the top of each task row's "…" menu.
- Opens the same side panel and form as New task, prefilled with title, description, status, priority, assignee.
- Saving updates every field in one request; inline field errors; list, dashboard and member counts refresh.

## Non-goals / anti-goals
- No change to the frozen v1 `PATCH /api/tasks/:id` (status/priority only) or any other existing endpoint.
- No change to the inline status / assignee controls in the row.
- Not a half-saved edit: never several requests per save.

## Approaches
1. **New endpoint `PATCH /api/tasks/:id/details` (picked).** One atomic request; additive, like `/assignee`.
2. Widen `PATCH /api/tasks/:id`: rejected, breaks the frozen v1 contract and its tests.
3. Dialog calls the three existing endpoints: rejected, a failure midway half-saves the edit.

## API
`PATCH /api/tasks/:id/details`, body (strict, at least one field):
- `title?` same rules as create
- `description?` string, trimmed, max 500; `""` clears it
- `status?`, `priority?` same enums
- `assigneeId?` member id or `null` (unassign)

Rules: 404 for unknown or malformed id. `completedAt` follows the same rule as the v1 PATCH (set on entering
done, cleared on leaving it). The assignee must be an active member **only when it changes**, so editing the
title of a task whose assignee has since been deactivated still works. 400 with `errors[]` on validation.
Response: the updated `Task`.

## Calls made by the builder
- Schema `editTaskSchema` lives in `shared/src/task.ts` with tests.
- `TaskForm` gains an optional `initial: Task` and a configurable submit error text; the edit panel shows an
  inactive current assignee as a disabled "(inactive)" option, like the row's assignee select.
