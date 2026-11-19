import { memberSchema, taskSchema } from "@tracker/shared";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { MemberModel } from "../src/models/member.model";
import { TaskModel } from "../src/models/task.model";
import { SeedRefusedError, seedDatabase } from "../src/seed/seed";
import { app } from "./helpers";

describe("seedDatabase", () => {
  it("seeds 6 members and 24 tasks into an empty database", async () => {
    expect(await seedDatabase({ force: false })).toEqual({ members: 6, tasks: 24 });
    expect(await MemberModel.countDocuments()).toBe(6);
    expect(await TaskModel.countDocuments()).toBe(24);
  });

  it("includes exactly one inactive member and at least one active admin", async () => {
    await seedDatabase({ force: false });
    expect(await MemberModel.countDocuments({ status: "inactive" })).toBe(1);
    expect(await MemberModel.countDocuments({ role: "admin", status: "active" })).toBeGreaterThan(0);
  });

  it("refuses when the database already has tasks and leaves them untouched", async () => {
    await TaskModel.create({ title: "Existing task" });

    await expect(seedDatabase({ force: false })).rejects.toBeInstanceOf(SeedRefusedError);
    expect(await TaskModel.countDocuments()).toBe(1);
    expect(await MemberModel.countDocuments()).toBe(0);
  });

  it("with force, wipes tasks and members and reseeds, leaving other collections alone", async () => {
    await TaskModel.create({ title: "Existing task" });
    const other = mongoose.connection.db?.collection("other");
    await other?.insertOne({ keep: true });

    expect(await seedDatabase({ force: true })).toEqual({ members: 6, tasks: 24 });
    expect(await TaskModel.countDocuments({ title: "Existing task" })).toBe(0);
    expect(await other?.countDocuments()).toBe(1);
    await other?.drop();
  });

  it("produces data the API serves and the shared schemas accept", async () => {
    await seedDatabase({ force: false });

    const tasks = taskSchema.array().parse((await request(app).get("/api/tasks")).body as unknown);
    const members = memberSchema.array().parse((await request(app).get("/api/members")).body as unknown);

    expect(tasks).toHaveLength(24);
    expect(members).toHaveLength(6);
    expect(tasks.some((t) => t.assigneeId === undefined)).toBe(true);
    expect(tasks.some((t) => t.completedAt !== undefined)).toBe(true);
  });
});
