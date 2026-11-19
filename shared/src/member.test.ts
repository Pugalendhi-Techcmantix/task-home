import { describe, expect, it } from "vitest";
import { createMemberSchema, memberQuerySchema, updateMemberSchema } from "./index";

describe("createMemberSchema", () => {
  it("normalizes email to trimmed lower-case and defaults nothing", () => {
    expect(createMemberSchema.parse({ name: " Arun K ", email: " Arun@Team.DEV " })).toEqual({
      name: "Arun K",
      email: "arun@team.dev",
    });
  });

  it.each([["A"], ["x".repeat(61)]])("rejects name %j on the name path", (name) => {
    const result = createMemberSchema.safeParse({ name, email: "a@b.dev" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["name"]);
  });

  it("requires a name", () => {
    const result = createMemberSchema.safeParse({ email: "a@b.dev" });
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });

  it("rejects an invalid email with a readable message", () => {
    const result = createMemberSchema.safeParse({ name: "Arun", email: "not-an-email" });
    expect(result.error?.issues[0]?.path).toEqual(["email"]);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid email address");
  });

  it("rejects an unknown role and unknown keys", () => {
    expect(createMemberSchema.safeParse({ name: "Arun", email: "a@b.dev", role: "owner" }).success).toBe(false);
    expect(createMemberSchema.safeParse({ name: "Arun", email: "a@b.dev", team: "x" }).success).toBe(false);
  });
});

describe("updateMemberSchema", () => {
  it("requires at least one field", () => {
    const result = updateMemberSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Provide at least one field to update");
  });

  it("accepts status only", () => {
    expect(updateMemberSchema.parse({ status: "inactive" })).toEqual({ status: "inactive" });
  });
});

describe("memberQuerySchema", () => {
  it("accepts valid filters and rejects an unknown role", () => {
    expect(memberQuerySchema.parse({ status: "active", role: "admin" })).toEqual({ status: "active", role: "admin" });
    expect(memberQuerySchema.safeParse({ role: "boss" }).success).toBe(false);
  });
});
