import { apiErrorSchema, taskSchema } from "@tracker/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { TaskModel } from "../src/models/task.model";
import { app, createViaApi, listViaApi } from "./helpers";

describe("POST /api/tasks", () => {
  it("creates a task and returns 201 with saved fields and defaults", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Fix login bug", description: "Safari only" });

    expect(res.status).toBe(201);
    const body: unknown = res.body;
    const task = taskSchema.parse(body);
    expect(task).toMatchObject({
      title: "Fix login bug",
      description: "Safari only",
      status: "todo",
      priority: "medium",
    });
    expect(body).not.toHaveProperty("_id");
    expect(body).not.toHaveProperty("__v");
    expect(await TaskModel.findById(task.id)).not.toBeNull();
  });

  it("saves the given status and priority", async () => {
    const task = await createViaApi({ title: "Crash on save", status: "in_progress", priority: "high" });
    expect(task).toMatchObject({ status: "in_progress", priority: "high" });
  });

  it.each([
    [{}, "Title is required"],
    [{ title: "ab" }, "Title must be at least 3 characters"],
    [{ title: "   " }, "Title must be at least 3 characters"],
  ])("returns 400 with a title field error for %j", async (payload, message) => {
    const res = await request(app).post("/api/tasks").send(payload);

    expect(res.status).toBe(400);
    const error = apiErrorSchema.parse(res.body as unknown);
    expect(error.message).toBe("Validation failed");
    expect(error.errors).toContainEqual({ field: "title", message });
    expect(await TaskModel.countDocuments()).toBe(0);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send("{bad");

    expect(res.status).toBe(400);
    expect(apiErrorSchema.parse(res.body as unknown).message).toBe("Request body must be valid JSON");
  });
});

describe("GET /api/tasks", () => {
  async function seed(): Promise<void> {
    await createViaApi({ title: "Task A", status: "todo", priority: "high" });
    await createViaApi({ title: "Task B", status: "done", priority: "high" });
    await createViaApi({ title: "Task C", status: "todo", priority: "low" });
  }

  it("returns all tasks newest first", async () => {
    await seed();
    const tasks = await listViaApi();
    expect(tasks.map((t) => t.title)).toEqual(["Task C", "Task B", "Task A"]);
  });

  it("returns an empty array when there are no tasks", async () => {
    expect(await listViaApi()).toEqual([]);
  });

  it("filters by status", async () => {
    await seed();
    const tasks = await listViaApi({ status: "todo" });
    expect(tasks.map((t) => t.title)).toEqual(["Task C", "Task A"]);
  });

  it("filters by priority", async () => {
    await seed();
    const tasks = await listViaApi({ priority: "high" });
    expect(tasks.map((t) => t.title)).toEqual(["Task B", "Task A"]);
  });

  it("filters by status and priority together", async () => {
    await seed();
    const tasks = await listViaApi({ status: "todo", priority: "high" });
    expect(tasks.map((t) => t.title)).toEqual(["Task A"]);
  });

  it("returns 400 for an invalid filter value", async () => {
    const res = await request(app).get("/api/tasks?status=closed");
    expect(res.status).toBe(400);
    expect(apiErrorSchema.parse(res.body as unknown).errors?.[0]?.field).toBe("status");
  });
});

describe("unknown routes", () => {
  it("returns 404 JSON", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(apiErrorSchema.parse(res.body as unknown).message).toBe("Route not found");
  });
});
