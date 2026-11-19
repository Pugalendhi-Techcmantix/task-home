import { dashboardSummarySchema, type TaskPriority, type TaskStatus } from "@tracker/shared";
import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { startOfWeek } from "../src/controllers/dashboard.controller";
import { TaskModel } from "../src/models/task.model";
import { app, createMemberViaApi } from "./helpers";

async function summary() {
  const res = await request(app).get("/api/dashboard/summary");
  expect(res.status).toBe(200);
  return dashboardSummarySchema.parse(res.body as unknown);
}

interface RawTask {
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  createdAt?: Date;
  completedAt?: Date | null;
}

/** Inserts directly so tests control createdAt/completedAt. */
async function insertTask(t: RawTask): Promise<void> {
  const createdAt = t.createdAt ?? new Date();
  await TaskModel.collection.insertOne({
    title: t.title,
    status: t.status ?? "todo",
    priority: t.priority ?? "medium",
    assigneeId: t.assigneeId ? new Types.ObjectId(t.assigneeId) : null,
    completedAt: t.completedAt ?? null,
    createdAt,
    updatedAt: createdAt,
  });
}

describe("startOfWeek", () => {
  it("maps a Thursday to the Monday of that week at 00:00 local time", () => {
    expect(startOfWeek(new Date(2026, 10, 19, 15, 30))).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0));
  });

  it("maps a Sunday to the previous Monday", () => {
    expect(startOfWeek(new Date(2026, 10, 22, 9))).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0));
  });

  it("keeps a Monday as the same day", () => {
    expect(startOfWeek(new Date(2026, 10, 16, 0, 0, 1))).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0));
  });
});

describe("GET /api/dashboard/summary", () => {
  it("returns zeros and only the Unassigned workload row for an empty workspace", async () => {
    expect(await summary()).toEqual({
      totals: { all: 0, open: 0, inProgress: 0, highOpen: 0, doneThisWeek: 0 },
      byStatus: { todo: 0, in_progress: 0, done: 0 },
      byPriority: { low: 0, medium: 0, high: 0 },
      workload: [{ memberId: null, name: "Unassigned", openCount: 0 }],
      needsAttention: [],
    });
  });

  it("computes totals, status and priority counts", async () => {
    const lastWeek = new Date(startOfWeek(new Date()).getTime() - 2 * 24 * 3600 * 1000);
    await insertTask({ title: "A", status: "todo", priority: "high" });
    await insertTask({ title: "B", status: "in_progress", priority: "high" });
    await insertTask({ title: "C", status: "in_progress", priority: "low" });
    await insertTask({ title: "D", status: "done", priority: "high", completedAt: new Date() });
    await insertTask({ title: "E", status: "done", priority: "medium", completedAt: lastWeek, createdAt: lastWeek });

    const s = await summary();

    expect(s.totals).toEqual({ all: 5, open: 3, inProgress: 2, highOpen: 2, doneThisWeek: 1 });
    expect(s.byStatus).toEqual({ todo: 1, in_progress: 2, done: 2 });
    expect(s.byPriority).toEqual({ low: 1, medium: 1, high: 3 });
  });

  it("orders workload by open count, then name, then Unassigned, then an Inactive members row", async () => {
    const zoe = await createMemberViaApi({ name: "Zoe", email: "zoe@team.dev" });
    const amy = await createMemberViaApi({ name: "Amy", email: "amy@team.dev" });
    const ben = await createMemberViaApi({ name: "Ben", email: "ben@team.dev" });
    const gone = await createMemberViaApi({ name: "Gone", email: "gone@team.dev" });
    await insertTask({ title: "z1", assigneeId: zoe.id });
    await insertTask({ title: "z2", assigneeId: zoe.id });
    await insertTask({ title: "a1", assigneeId: amy.id });
    await insertTask({ title: "a-done", status: "done", assigneeId: amy.id });
    await insertTask({ title: "g1", assigneeId: gone.id });
    await insertTask({ title: "u1" });
    await request(app).patch(`/api/members/${gone.id}`).send({ status: "inactive" });

    const s = await summary();

    expect(s.workload).toEqual([
      { memberId: zoe.id, name: "Zoe", openCount: 2 },
      { memberId: amy.id, name: "Amy", openCount: 1 },
      { memberId: ben.id, name: "Ben", openCount: 0 },
      { memberId: null, name: "Unassigned", openCount: 1 },
      { memberId: null, name: "Inactive members", openCount: 1 },
    ]);
  });

  it("lists up to 5 open high-priority tasks, newest first", async () => {
    const base = Date.now() - 60_000;
    for (let i = 1; i <= 7; i += 1) {
      await insertTask({ title: `High ${i}`, priority: "high", createdAt: new Date(base + i * 1000) });
    }
    await insertTask({ title: "High but done", priority: "high", status: "done", createdAt: new Date() });
    await insertTask({ title: "Medium", priority: "medium", createdAt: new Date() });

    const s = await summary();

    expect(s.needsAttention.map((t) => t.title)).toEqual(["High 7", "High 6", "High 5", "High 4", "High 3"]);
  });

  it("counts a done task without completedAt by its updatedAt", async () => {
    await insertTask({ title: "Old v1 done", status: "done", createdAt: new Date() });
    expect((await summary()).totals.doneThisWeek).toBe(1);
  });
});
