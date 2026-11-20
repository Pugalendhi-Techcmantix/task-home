import { describe, expect, it } from "vitest";
import { editTaskSchema } from "./index";

describe("editTaskSchema", () => {
  it("accepts a single field", () => {
    expect(editTaskSchema.parse({ title: "  New title  " })).toEqual({ title: "New title" });
  });

  it("turns an empty description into null (clear it)", () => {
    expect(editTaskSchema.parse({ description: "   " })).toEqual({ description: null });
  });

  it("keeps a non-empty description", () => {
    expect(editTaskSchema.parse({ description: "Steps" })).toEqual({ description: "Steps" });
  });

  it("accepts assigneeId null to unassign", () => {
    expect(editTaskSchema.parse({ assigneeId: null })).toEqual({ assigneeId: null });
  });

  it("accepts every field at once", () => {
    const body = { title: "Fix it", description: "d", status: "done", priority: "high", assigneeId: "507f1f77bcf86cd799439011" };
    expect(editTaskSchema.parse(body)).toEqual(body);
  });

  it("rejects an empty body", () => {
    const result = editTaskSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Provide at least one field to update");
  });

  it("rejects unknown keys", () => {
    expect(editTaskSchema.safeParse({ title: "Fine title", foo: 1 }).success).toBe(false);
  });

  it("applies the create rules to title and description", () => {
    expect(editTaskSchema.safeParse({ title: "ab" }).success).toBe(false);
    expect(editTaskSchema.safeParse({ description: "x".repeat(501) }).success).toBe(false);
  });

  it("rejects a malformed assigneeId", () => {
    expect(editTaskSchema.safeParse({ assigneeId: "abc" }).success).toBe(false);
  });
});
