import { taskSchema, type Task, type TaskQuery } from "@tracker/shared";
import request from "supertest";
import { expect } from "vitest";
import { createApp } from "../src/app";

export const app = createApp();

/** POSTs a task through the API and returns the parsed response. */
export async function createViaApi(payload: Record<string, unknown>): Promise<Task> {
  const res = await request(app).post("/api/tasks").send(payload);
  expect(res.status).toBe(201);
  return taskSchema.parse(res.body as unknown);
}

/** GETs the task list through the API and returns the parsed response. */
export async function listViaApi(query: TaskQuery = {}): Promise<Task[]> {
  const res = await request(app).get("/api/tasks").query(query);
  expect(res.status).toBe(200);
  return taskSchema.array().parse(res.body as unknown);
}
