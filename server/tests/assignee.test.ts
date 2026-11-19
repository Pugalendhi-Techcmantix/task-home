import { apiErrorSchema, taskSchema, type Member } from "@tracker/shared";
import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, createMemberViaApi, createViaApi, listViaApi } from "./helpers";

const parseTask = (body: unknown) => taskSchema.parse(body);
const parseError = (body: unknown) => apiErrorSchema.parse(body);

async function activeMember(): Promise<Member> {
  return createMemberViaApi({ name: "Arun K", email: "arun@team.dev" });
}

async function inactiveMember(): Promise<Member> {
  const m = await createMemberViaApi({ name: "Jo T", email: "jo@team.dev" });
  await request(app).patch(`/api/members/${m.id}`).send({ status: "inactive" });
  return m;
}

describe("POST /api/tasks with assigneeId", () => {
  it("assigns an active member and echoes assigneeId", async () => {
    const m = await activeMember();
    const task = await createViaApi({ title: "Assigned task", assigneeId: m.id });
    expect(task.assigneeId).toBe(m.id);
  });

  it("omits assigneeId when the task is unassigned", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "Nobody's task" });
    expect(res.body).not.toHaveProperty("assigneeId");
    expect(res.body).not.toHaveProperty("completedAt");
  });

  it.each([["inactive"], ["unknown"], ["malformed"]])("rejects a %s member with 400 on assigneeId", async (kind) => {
    const assigneeId =
      kind === "inactive" ? (await inactiveMember()).id : kind === "unknown" ? new Types.ObjectId().toString() : "abc";

    const res = await request(app).post("/api/tasks").send({ title: "Bad assignee", assigneeId });

    expect(res.status).toBe(400);
    expect(parseError(res.body).errors?.[0]?.field).toBe("assigneeId");
  });
});

describe("PATCH /api/tasks/:id/assignee", () => {
  it("assigns and then unassigns", async () => {
    const m = await activeMember();
    const task = await createViaApi({ title: "Reassign me" });

    const assigned = await request(app).patch(`/api/tasks/${task.id}/assignee`).send({ assigneeId: m.id });
    expect(assigned.status).toBe(200);
    expect(parseTask(assigned.body).assigneeId).toBe(m.id);

    const cleared = await request(app).patch(`/api/tasks/${task.id}/assignee`).send({ assigneeId: null });
    expect(cleared.status).toBe(200);
    expect(parseTask(cleared.body).assigneeId).toBeUndefined();
  });

  it("returns 404 for a malformed or unknown task id", async () => {
    const m = await activeMember();
    for (const id of ["not-an-id", new Types.ObjectId().toString()]) {
      const res = await request(app).patch(`/api/tasks/${id}/assignee`).send({ assigneeId: m.id });
      expect(res.status).toBe(404);
    }
  });

  it("returns 400 for an inactive member and for an empty body", async () => {
    const task = await createViaApi({ title: "Reassign me" });
    const jo = await inactiveMember();

    const inactive = await request(app).patch(`/api/tasks/${task.id}/assignee`).send({ assigneeId: jo.id });
    expect(inactive.status).toBe(400);
    expect(parseError(inactive.body).errors?.[0]?.field).toBe("assigneeId");

    const empty = await request(app).patch(`/api/tasks/${task.id}/assignee`).send({});
    expect(empty.status).toBe(400);
  });

  it("keeps the v1 PATCH contract: assigneeId is rejected there", async () => {
    const m = await activeMember();
    const task = await createViaApi({ title: "Frozen contract" });
    const res = await request(app).patch(`/api/tasks/${task.id}`).send({ assigneeId: m.id });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/tasks?assigneeId=", () => {
  it("filters by member, by 'unassigned', and returns [] for an unknown member", async () => {
    const m = await activeMember();
    await createViaApi({ title: "Mine", assigneeId: m.id });
    await createViaApi({ title: "Nobody's" });

    expect((await listViaApi({ assigneeId: m.id })).map((t) => t.title)).toEqual(["Mine"]);
    expect((await listViaApi({ assigneeId: "unassigned" })).map((t) => t.title)).toEqual(["Nobody's"]);
    expect(await listViaApi({ assigneeId: new Types.ObjectId().toString() })).toEqual([]);
  });

  it("returns 400 for an assigneeId that is neither an id nor 'unassigned'", async () => {
    const res = await request(app).get("/api/tasks?assigneeId=nobody");
    expect(res.status).toBe(400);
  });
});

describe("completedAt", () => {
  it("is set when a task moves to done and cleared when it is reopened", async () => {
    const task = await createViaApi({ title: "Finish me" });

    const done = await request(app).patch(`/api/tasks/${task.id}`).send({ status: "done" });
    expect(parseTask(done.body).completedAt).toBeDefined();

    const reopened = await request(app).patch(`/api/tasks/${task.id}`).send({ status: "todo" });
    expect(parseTask(reopened.body).completedAt).toBeUndefined();
  });

  it("keeps the original completedAt when a done task is patched again", async () => {
    const task = await createViaApi({ title: "Finish me", status: "done" });
    expect(task.completedAt).toBeDefined();

    const again = await request(app).patch(`/api/tasks/${task.id}`).send({ status: "done", priority: "high" });
    expect(parseTask(again.body).completedAt).toBe(task.completedAt);
  });
});
