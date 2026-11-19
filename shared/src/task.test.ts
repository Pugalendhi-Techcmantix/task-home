import { describe, expect, it } from "vitest";
import { assignTaskSchema, createTaskSchema, taskQuerySchema, updateTaskSchema } from "./index";

describe("createTaskSchema", () => {
  it("accepts a minimal valid task without adding defaults", () => {
    expect(createTaskSchema.parse({ title: "Fix login" })).toEqual({ title: "Fix login" });
  });

  it("trims the title", () => {
    expect(createTaskSchema.parse({ title: "  abc  " }).title).toBe("abc");
  });

  it("rejects a whitespace-only title on the title path", () => {
    const result = createTaskSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["title"]);
    expect(result.error?.issues[0]?.message).toBe("Title must be at least 3 characters");
  });

  it.each([
    ["ab", false],
    ["abc", true],
    ["a".repeat(100), true],
    ["a".repeat(101), false],
  ])("title of length %#: %j valid=%s", (title, ok) => {
    expect(createTaskSchema.safeParse({ title }).success).toBe(ok);
  });

  it("rejects a 101-char title with a max-length message", () => {
    const result = createTaskSchema.safeParse({ title: "a".repeat(101) });
    expect(result.error?.issues[0]?.message).toBe("Title must be at most 100 characters");
  });

  it("rejects a missing title with 'Title is required'", () => {
    const result = createTaskSchema.safeParse({});
    expect(result.error?.issues[0]?.path).toEqual(["title"]);
    expect(result.error?.issues[0]?.message).toBe("Title is required");
  });

  it("accepts a 500-char description and rejects 501 on the description path", () => {
    expect(createTaskSchema.safeParse({ title: "abc", description: "x".repeat(500) }).success).toBe(true);
    const result = createTaskSchema.safeParse({ title: "abc", description: "x".repeat(501) });
    expect(result.error?.issues[0]?.path).toEqual(["description"]);
    expect(result.error?.issues[0]?.message).toBe("Description must be at most 500 characters");
  });

  it("turns an empty description into undefined", () => {
    expect(createTaskSchema.parse({ title: "abc", description: "" }).description).toBeUndefined();
    expect(createTaskSchema.parse({ title: "abc", description: "   " }).description).toBeUndefined();
  });

  it("accepts valid status and priority values", () => {
    expect(createTaskSchema.parse({ title: "abc", status: "in_progress", priority: "high" })).toEqual({
      title: "abc",
      status: "in_progress",
      priority: "high",
    });
  });

  it("rejects an unknown status value", () => {
    expect(createTaskSchema.safeParse({ title: "abc", status: "closed" }).success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(createTaskSchema.safeParse({ title: "abc", owner: "me" }).success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("accepts status only, priority only, or both", () => {
    expect(updateTaskSchema.parse({ status: "done" })).toEqual({ status: "done" });
    expect(updateTaskSchema.parse({ priority: "low" })).toEqual({ priority: "low" });
    expect(updateTaskSchema.parse({ status: "todo", priority: "high" })).toEqual({ status: "todo", priority: "high" });
  });

  it("rejects an empty object with a helpful message", () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Provide status or priority to update");
  });

  it("rejects attempts to change the title", () => {
    expect(updateTaskSchema.safeParse({ title: "new" }).success).toBe(false);
  });
});

describe("taskQuerySchema", () => {
  it("accepts no filters and valid filters", () => {
    expect(taskQuerySchema.parse({})).toEqual({});
    expect(taskQuerySchema.parse({ status: "done", priority: "low" })).toEqual({ status: "done", priority: "low" });
  });

  it("rejects an invalid filter value", () => {
    expect(taskQuerySchema.safeParse({ status: "closed" }).success).toBe(false);
  });
});

describe("assignment (v2)", () => {
  const memberId = "6aff321532ed457326852fdd";

  it("createTaskSchema accepts a 24-hex assigneeId and rejects 'abc'", () => {
    expect(createTaskSchema.parse({ title: "abc", assigneeId: memberId }).assigneeId).toBe(memberId);
    const result = createTaskSchema.safeParse({ title: "abc", assigneeId: "abc" });
    expect(result.error?.issues[0]?.path).toEqual(["assigneeId"]);
    expect(result.error?.issues[0]?.message).toBe("Choose a valid team member");
  });

  it("taskQuerySchema accepts 'unassigned' and an object id, rejects 'nobody'", () => {
    expect(taskQuerySchema.parse({ assigneeId: "unassigned" })).toEqual({ assigneeId: "unassigned" });
    expect(taskQuerySchema.parse({ assigneeId: memberId })).toEqual({ assigneeId: memberId });
    expect(taskQuerySchema.safeParse({ assigneeId: "nobody" }).success).toBe(false);
  });

  it("assignTaskSchema accepts null and an id, rejects a missing key", () => {
    expect(assignTaskSchema.parse({ assigneeId: null })).toEqual({ assigneeId: null });
    expect(assignTaskSchema.parse({ assigneeId: memberId })).toEqual({ assigneeId: memberId });
    expect(assignTaskSchema.safeParse({}).success).toBe(false);
  });
});
