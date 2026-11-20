import { apiErrorSchema, taskSchema, type Member } from "@tracker/shared";
import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, createMemberViaApi, createViaApi } from "./helpers";

const parseTask = (body: unknown) => taskSchema.parse(body);
const parseError = (body: unknown) => apiErrorSchema.parse(body);
const edit = (id: string, body: Record<string, unknown>) => request(app).patch(`/api/tasks/${id}/details`).send(body);

async function member(email: string): Promise<Member> {
  return createMemberViaApi({ name: "Arun K", email });
}

describe("PATCH /api/tasks/:id/details", () => {
  it("updates several fields in one request", async () => {
    const task = await createViaApi({ title: "Old title", description: "Old" });

    const res = await edit(task.id, { title: "New title", description: "New", priority: "high" });

    expect(res.status).toBe(200);
    const updated = parseTask(res.body);
    expect(updated).toMatchObject({ id: task.id, title: "New title", description: "New", priority: "high", status: "todo" });
  });

  it("persists the edit", async () => {
    const task = await createViaApi({ title: "Before" });
    await edit(task.id, { title: "After" });
    const list = await request(app).get("/api/tasks");
    expect(taskSchema.array().parse(list.body)[0]?.title).toBe("After");
  });

  it("clears the description with an empty string", async () => {
    const task = await createViaApi({ title: "Has notes", description: "Notes" });
    const res = await edit(task.id, { description: "" });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("description");
  });

  it("sets completedAt when moved to done and clears it when reopened", async () => {
    const task = await createViaApi({ title: "Ship it" });

    const done = parseTask((await edit(task.id, { status: "done" })).body);
    expect(done.completedAt).toBeDefined();

    const reopened = await edit(task.id, { status: "todo" });
    expect(reopened.body).not.toHaveProperty("completedAt");
  });

  it("keeps completedAt when a done task is edited without changing status", async () => {
    const task = await createViaApi({ title: "Done one", status: "done" });
    const res = parseTask((await edit(task.id, { title: "Done one, renamed", status: "done" })).body);
    expect(res.completedAt).toBe(task.completedAt);
  });

  it("assigns and unassigns", async () => {
    const m = await member("arun@team.dev");
    const task = await createViaApi({ title: "Needs an owner" });

    expect(parseTask((await edit(task.id, { assigneeId: m.id })).body).assigneeId).toBe(m.id);
    expect((await edit(task.id, { assigneeId: null })).body).not.toHaveProperty("assigneeId");
  });

  it("allows editing a task whose unchanged assignee is now inactive", async () => {
    const m = await member("jo@team.dev");
    const task = await createViaApi({ title: "Owned task", assigneeId: m.id });
    await request(app).patch(`/api/members/${m.id}`).send({ status: "inactive" });

    const res = await edit(task.id, { title: "Owned task, renamed", assigneeId: m.id });

    expect(res.status).toBe(200);
    expect(parseTask(res.body).assigneeId).toBe(m.id);
  });

  it("rejects changing the assignee to an inactive member", async () => {
    const m = await member("jo@team.dev");
    await request(app).patch(`/api/members/${m.id}`).send({ status: "inactive" });
    const task = await createViaApi({ title: "Unowned" });

    const res = await edit(task.id, { assigneeId: m.id });

    expect(res.status).toBe(400);
    expect(parseError(res.body).errors?.[0]?.field).toBe("assigneeId");
  });

  it.each([
    ["an empty body", {}],
    ["an unknown key", { title: "Fine title", foo: 1 }],
    ["a short title", { title: "ab" }],
    ["a bad status", { status: "later" }],
  ])("returns 400 for %s", async (_label, body) => {
    const task = await createViaApi({ title: "Valid task" });
    const res = await edit(task.id, body);
    expect(res.status).toBe(400);
    expect(parseError(res.body).message).toBeTruthy();
  });

  it.each([["an unknown", new Types.ObjectId().toString()], ["a malformed", "abc"]])("returns 404 for %s id", async (_label, id) => {
    const res = await edit(id, { title: "Anything" });
    expect(res.status).toBe(404);
    expect(parseError(res.body).message).toBe("Task not found");
  });
});
